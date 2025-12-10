import { Router, Request, Response } from 'express';
import { ConfigRepository, OverlayRepository } from '../../repositories';
import { CoordinatorService } from '../../services';
import { writeCache } from '../../utils/cache.utils';
import { CacheStory } from '../../schemas/cache.schema';

export const syncRouter = Router();

interface SyncOptions {
  dryRun?: boolean;
}

syncRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const options = req.body as SyncOptions;
    const configRepository = new ConfigRepository(process.env.CURRENT_DIR || process.cwd());
    const config = await configRepository.read();

    // Check coordinator mode
    const isCoordinator = config.coordinator && config.coordinator.enabled;
    if (!isCoordinator) {
      res.status(400).json({
        success: false,
        error: 'Not in coordinator mode',
      });
      return;
    }

    const submodules = config.coordinator?.submodules || [];
    if (submodules.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No submodules configured',
      });
      return;
    }

    // Perform sync
    const overlayDir = config.coordinator?.overlaysDir || 'overlays';
    const overlayRepository = new OverlayRepository(overlayDir);
    const coordinatorService = new CoordinatorService(configRepository, overlayRepository);
    const stories = await coordinatorService.aggregateStories();
    const enrichedStories = await coordinatorService.applyOverlays(stories);

    // Write cache if not dry run
    if (!options.dryRun) {
      const cacheDir = config.coordinator?.cacheDir || '.specdeck-cache';
      const cacheData = {
        repos: submodules.map((s) => s.name),
        version: '1.0.0',
        syncedAt: new Date().toISOString(),
        stories: enrichedStories,
        metadata: {
          commitShas: {},
          storyCounts: submodules.reduce(
            (acc, sub) => {
              acc[sub.name] = stories.filter((s: CacheStory) => s.repo === sub.name).length;
              return acc;
            },
            {} as Record<string, number>
          ),
          overlayStats: {
            totalJiraMappings: enrichedStories.filter((s: CacheStory) => s.jiraTicket).length,
          },
        },
      };

      await writeCache(cacheData, cacheDir);
    }

    // Build response
    const mappedStories = enrichedStories.filter((s: CacheStory) => s.jiraTicket).length;

    res.json({
      success: true,
      data: {
        dryRun: options.dryRun,
        stories: enrichedStories,
        statistics: {
          totalStories: enrichedStories.length,
          mappedStories,
          repoCount: submodules.length,
        },
        syncedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Sync failed',
    });
  }
});

import { Router, Request, Response } from 'express';
import { ConfigRepository } from '../../repositories';
import { readCache } from '../../utils/cache.utils';
import { checkAllSubmodulesStatus } from '../../utils/submodule.utils';

export const configRouter = Router();

configRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const configRepository = new ConfigRepository(process.env.CURRENT_DIR || process.cwd());
    const config = await configRepository.read();

    // Return coordinator mode info to UI
    const isCoordinator = config.coordinator && config.coordinator.enabled;

    let syncedAt: string | undefined;
    if (isCoordinator) {
      try {
        const cacheDir = config.coordinator?.cacheDir || '.specdeck-cache';
        const cache = await readCache(cacheDir);
        if (cache) {
          syncedAt = cache.syncedAt;
        }
      } catch {
        // Cache doesn't exist yet or can't be read
      }
    }

    res.json({
      success: true,
      data: {
        isCoordinatorMode: isCoordinator,
        coordinator: isCoordinator
          ? {
              submoduleCount: config.coordinator?.submodules?.length || 0,
              cacheDir: config.coordinator?.cacheDir,
              overlaysDir: config.coordinator?.overlaysDir,
            }
          : null,
        specdeckDir: config.specdeckDir || './specdeck',
        jiraBaseUrl: config.jiraBaseUrl || 'https://jira.example.com',
        syncedAt,
      },
    });
  } catch (error) {
    console.error('Error reading config:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to read config',
    });
  }
});

configRouter.get('/submodules/status', async (_req: Request, res: Response): Promise<void> => {
  try {
    const configRepository = new ConfigRepository(process.env.CURRENT_DIR || process.cwd());
    const config = await configRepository.read();

    const isCoordinator = config.coordinator && config.coordinator.enabled;
    if (!isCoordinator) {
      res.status(400).json({
        success: false,
        error: 'Not in coordinator mode',
      });
      return;
    }

    const submodules = config.coordinator?.submodules || [];
    const statuses = checkAllSubmodulesStatus(submodules);

    const anyStale = statuses.some((s) => s.isStale);

    res.json({
      success: true,
      data: {
        statuses,
        anyStale,
      },
    });
  } catch (error) {
    console.error('Error checking submodule status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check submodule status',
    });
  }
});

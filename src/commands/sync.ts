import { Command } from 'commander';
import { ConfigRepository, OverlayRepository } from '../repositories';
import { CoordinatorService } from '../services/coordinator.service';
import { writeCache, getCacheAgeDescription } from '../utils/cache.utils';
import { CacheData } from '../schemas/cache.schema';

export function createSyncCommand(): Command {
  const sync = new Command('sync');
  sync.description('Sync stories from all submodules and apply overlays');

  sync
    .option('--dry-run', 'Preview sync without writing cache')
    .option('--verbose', 'Show detailed sync progress')
    .action(async (options: { dryRun?: boolean; verbose?: boolean }) => {
      try {
        const rootPath = process.cwd();
        const configRepo = new ConfigRepository(rootPath);

        // Check if in coordinator mode
        const isCoordinator = await configRepo.isCoordinatorMode();
        if (!isCoordinator) {
          console.error('✗ sync command only works in coordinator mode');
          console.error('  Run: specdeck init coordinator');
          process.exit(1);
        }

        const startTime = Date.now();

        if (!options.dryRun) {
          console.log('📦 Syncing stories from all submodules...');
        } else {
          console.log('📦 [DRY-RUN] Would sync stories from all submodules...');
        }

        // Get configuration
        const overlaysDir = await configRepo.getOverlaysDir();
        const cacheDir = await configRepo.getCacheDir();
        const submodules = await configRepo.getSubmodules();

        if (submodules.length === 0) {
          console.error('✗ No submodules configured');
          process.exit(1);
        }

        // Initialize services
        const overlayRepo = new OverlayRepository(overlaysDir);
        const coordinator = new CoordinatorService(configRepo, overlayRepo);

        // Step 1: Aggregate stories
        if (options.verbose) {
          console.log(`  Reading stories from ${submodules.length} submodule(s)...`);
        }
        const aggregatedStories = await coordinator.aggregateStories();

        if (options.verbose) {
          console.log(`  ✓ Aggregated ${aggregatedStories.length} stories`);
        }

        // Step 2: Apply overlays
        if (options.verbose) {
          console.log('  Applying overlay Jira mappings...');
        }
        const enrichedStories = await coordinator.applyOverlays(aggregatedStories);

        // Get overlays for statistics
        const allOverlays = await overlayRepo.readAllOverlays();

        if (options.verbose) {
          console.log(`  ✓ Found ${allOverlays.size} repo(s) with overlays`);
          for (const [repo, overlays] of allOverlays.entries()) {
            console.log(`    - ${repo}: ${overlays.size} overlay file(s)`);
            for (const [featureId, overlay] of overlays.entries()) {
              const mappingCount = overlay.jiraMappings?.size || 0;
              console.log(`      • ${featureId}: ${mappingCount} Jira mapping(s)`);
            }
          }
        }

        // Step 3: Get statistics
        const stats = coordinator.getStatistics(enrichedStories, allOverlays);

        // Step 4: Write cache (unless dry-run)
        if (!options.dryRun) {
          const cacheData: CacheData = {
            version: '1.0.0',
            syncedAt: new Date().toISOString(),
            repos: submodules.map((s) => s.name),
            stories: enrichedStories,
            metadata: {
              storyCounts: stats.storyCounts,
              overlayStats: {
                totalOverlays: stats.totalOverlays,
                totalJiraMappings: stats.totalJiraMappings,
                mappedStories: stats.mappedStories,
              },
            },
          };

          await writeCache(cacheData, cacheDir);
          if (options.verbose) {
            console.log(`  ✓ Cache written to ${cacheDir}/stories.json`);
          }
        } else {
          if (options.verbose) {
            console.log('  [DRY-RUN] Cache write skipped');
          }
        }

        // Display summary
        const duration = (Date.now() - startTime) / 1000;
        console.log('');
        console.log('✓ Sync Complete');
        console.log(`  Duration: ${duration.toFixed(2)}s`);
        console.log(`  Stories: ${enrichedStories.length} total`);

        if (stats.totalStories > 0) {
          for (const [repo, count] of Object.entries(stats.storyCounts)) {
            console.log(`    - ${repo}: ${count}`);
          }
        }

        if (stats.totalJiraMappings > 0) {
          console.log(
            `  Jira Mappings: ${stats.mappedStories}/${stats.totalStories} stories mapped`
          );
          console.log(
            `    - ${stats.totalOverlays} overlay file(s) with ${stats.totalJiraMappings} mapping(s)`
          );
        }

        if (options.dryRun) {
          console.log('  [DRY-RUN] Cache was not written');
        } else {
          const cacheAge = await getCacheAgeDescription(cacheDir);
          if (cacheAge) {
            console.log(`  Cache: synced ${cacheAge}`);
          }
        }

        console.log('');
      } catch (error) {
        console.error('✗ Sync failed:', error instanceof Error ? error.message : 'Unknown error');
        if (process.env.DEBUG) {
          console.error(error);
        }
        process.exit(1);
      }
    });

  return sync;
}

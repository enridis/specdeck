import { Command } from 'commander';
import { ConfigRepository, OverlayRepository, FeatureRepository } from '../repositories';
import { OverlayValidationService } from '../services/overlay-validation.service';

export function createOverlayCommand(): Command {
  const overlay = new Command('overlay');
  overlay.description('Manage overlay files for Jira links and proprietary metadata');

  // overlay create subcommand
  overlay
    .command('create <featureId>')
    .description('Create a new overlay file for a feature')
    .option('-r, --repo <name>', 'Repository name (required in coordinator mode)')
    .action(async (featureId: string, options: { repo?: string }) => {
      try {
        const rootPath = process.cwd();
        const configRepo = new ConfigRepository(rootPath);
        const isCoordinator = await configRepo.isCoordinatorMode();

        if (!isCoordinator) {
          console.error('✗ Overlay commands only work in coordinator mode');
          console.error('  Run: specdeck init coordinator');
          process.exit(1);
        }

        const overlaysDir = await configRepo.getOverlaysDir();
        const overlayRepo = new OverlayRepository(overlaysDir);

        if (!options.repo) {
          console.error('✗ --repo option is required');
          process.exit(1);
        }

        // Check if overlay already exists
        const existing = await overlayRepo.readOverlay(featureId, options.repo);
        if (existing) {
          console.error(`✗ Overlay already exists: overlays/${options.repo}/${featureId}.md`);
          process.exit(1);
        }

        await overlayRepo.createOverlay(featureId, options.repo);
        console.log(`✓ Created overlay: overlays/${options.repo}/${featureId}.md`);
      } catch (error) {
        console.error('✗', error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
    });

  // overlay map subcommand (add Jira mapping)
  overlay
    .command('map <storyId> <jiraTicket>')
    .description('Add or update Jira mapping in overlay')
    .option('-r, --repo <name>', 'Repository name (required)')
    .option('-f, --feature <id>', 'Feature ID (required)')
    .action(
      async (storyId: string, jiraTicket: string, options: { repo?: string; feature?: string }) => {
        try {
          const rootPath = process.cwd();
          const configRepo = new ConfigRepository(rootPath);
          const isCoordinator = await configRepo.isCoordinatorMode();

          if (!isCoordinator) {
            console.error('✗ Overlay commands only work in coordinator mode');
            process.exit(1);
          }

          if (!options.repo || !options.feature) {
            console.error('✗ Both --repo and --feature options are required');
            process.exit(1);
          }

          const overlaysDir = await configRepo.getOverlaysDir();
          const overlayRepo = new OverlayRepository(overlaysDir);

          // Check if overlay exists
          const existing = await overlayRepo.readOverlay(options.feature, options.repo);
          if (!existing) {
            console.error(`✗ Overlay not found: overlays/${options.repo}/${options.feature}.md`);
            process.exit(1);
          }

          await overlayRepo.addJiraMapping(options.feature, options.repo, storyId, jiraTicket);
          console.log(`✓ Added mapping: ${storyId} → ${jiraTicket}`);
        } catch (error) {
          console.error('✗', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      }
    );

  // overlay list subcommand
  overlay
    .command('list')
    .description('List all overlays')
    .action(async () => {
      try {
        const rootPath = process.cwd();
        const configRepo = new ConfigRepository(rootPath);
        const isCoordinator = await configRepo.isCoordinatorMode();

        if (!isCoordinator) {
          console.error('✗ Overlay commands only work in coordinator mode');
          process.exit(1);
        }

        const overlaysDir = await configRepo.getOverlaysDir();
        const overlayRepo = new OverlayRepository(overlaysDir);

        const allOverlays = await overlayRepo.readAllOverlays();

        if (allOverlays.size === 0) {
          console.log('No overlays found');
          return;
        }

        console.log('Overlays:\n');
        for (const [repo, overlays] of allOverlays) {
          console.log(`📦 ${repo}:`);
          for (const [feature, data] of overlays) {
            const mappingCount = data.jiraMappings.size;
            console.log(`  • ${feature} (${mappingCount} mappings)`);
            for (const [storyId, jiraTicket] of data.jiraMappings) {
              console.log(`    - ${storyId} → ${jiraTicket}`);
            }
          }
          console.log();
        }
      } catch (error) {
        console.error('✗', error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
    });

  // overlay validate subcommand
  overlay
    .command('validate')
    .description('Validate all overlay files')
    .option('-f, --feature <id>', 'Validate specific feature overlay')
    .option('-r, --repo <name>', 'Validate specific repository')
    .action(async (options: { feature?: string; repo?: string }) => {
      try {
        const rootPath = process.cwd();
        const configRepo = new ConfigRepository(rootPath);
        const isCoordinator = await configRepo.isCoordinatorMode();

        if (!isCoordinator) {
          console.error('✗ Overlay validation only works in coordinator mode');
          process.exit(1);
        }

        const overlaysDir = await configRepo.getOverlaysDir();
        const overlayRepo = new OverlayRepository(overlaysDir);
        const featureRepo = new FeatureRepository();

        const validationService = new OverlayValidationService(
          configRepo,
          overlayRepo,
          featureRepo
        );

        const result = await validationService.validateOverlay(
          options.feature || undefined,
          options.repo
        );

        console.log(validationService.formatValidationResult(result));

        if (!result.isValid) {
          process.exit(1);
        }
      } catch (error) {
        console.error(
          '✗ Validation failed:',
          error instanceof Error ? error.message : 'Unknown error'
        );
        process.exit(1);
      }
    });

  return overlay;
}

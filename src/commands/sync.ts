import { Command } from 'commander';
import chalk from 'chalk';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { ConfigRepository } from '../repositories';
import { StoryService } from '../services';

interface SyncStatusOptions {
  dryRun?: boolean;
}

export function createSyncCommand(): Command {
  const sync = new Command('sync').description('Sync story status with OpenSpec proposals');

  // Sync status
  sync
    .command('status')
    .description('Reconcile story status with OpenSpec change proposals')
    .option('--dry-run', 'Show what would change without updating')
    .action(async (options: SyncStatusOptions) => {
      try {
        const config = await new ConfigRepository(process.cwd()).read();

        // Check if OpenSpec integration is available
        if (!config.openspecDir) {
          console.log(chalk.yellow('⚠️  OpenSpec integration not configured.'));
          console.log(chalk.gray('This command requires OpenSpec to be set up in your project.'));
          console.log(chalk.gray('\nTo use OpenSpec integration:'));
          console.log(chalk.gray('  1. Create an openspec/ directory'));
          console.log(chalk.gray('  2. Add "openspecDir": "./openspec" to .specdeck.config.json'));
          return;
        }

        const openspecDir = config.openspecDir;

        if (!existsSync(openspecDir)) {
          console.log(chalk.yellow('⚠️  OpenSpec directory not found.'));
          console.log(chalk.gray(`Expected: ${openspecDir}`));
          console.log(chalk.gray('\nThis command syncs story status with OpenSpec changes.'));
          console.log(chalk.gray("If you're not using OpenSpec, you can ignore this command."));
          return;
        }

        const storyService = new StoryService(openspecDir, config.specdeckDir);
        const changesDir = join(openspecDir, 'changes');

        if (!existsSync(changesDir)) {
          console.log(chalk.yellow('No changes directory found. Nothing to sync.'));
          return;
        }

        // Get all stories
        const stories = await storyService.listStories();

        // Scan for OpenSpec change proposals (including archived ones)
        const changes: Array<{ dir: string; isArchived: boolean }> = [];

        // Scan active changes
        const activeChanges = readdirSync(changesDir)
          .filter((name) => {
            const path = join(changesDir, name);
            return existsSync(path) && name !== 'archive' && existsSync(join(path, 'proposal.md'));
          })
          .map((dir) => ({ dir, isArchived: false }));

        changes.push(...activeChanges);

        // Scan archived changes
        const archiveDir = join(changesDir, 'archive');
        if (existsSync(archiveDir)) {
          const archivedChanges = readdirSync(archiveDir)
            .filter((name) => {
              const path = join(archiveDir, name);
              return existsSync(path) && existsSync(join(path, 'proposal.md'));
            })
            .map((dir) => ({ dir, isArchived: true }));

          changes.push(...archivedChanges);
        }

        console.log(chalk.bold.cyan(`\n🔄 OpenSpec Status Sync\n`));
        console.log(chalk.gray(`Found ${changes.length} change proposal(s)`));
        console.log(chalk.gray(`Found ${stories.length} story/stories\n`));

        let syncCount = 0;

        for (const { dir: changeDir, isArchived } of changes) {
          // Extract change ID from directory name (e.g., "2025-12-06-add-cli-basic-foundation" -> "add-cli-basic-foundation")
          const changeId = changeDir.replace(/^\d{4}-\d{2}-\d{2}-/, '');

          // Find all stories linked to this OpenSpec change
          const linkedStories = stories.filter((s) => s.openspec === changeId);

          if (linkedStories.length === 0) continue;

          const suggestedStatus = isArchived ? 'done' : 'in_progress';

          for (const story of linkedStories) {
            if (story.status !== suggestedStatus && story.status !== 'done') {
              console.log(chalk.yellow(`  ${story.id}: ${story.status} → ${suggestedStatus}`));
              console.log(
                chalk.gray(`    Linked to: ${changeId} (${isArchived ? 'archived' : 'active'})`)
              );
              syncCount++;

              if (!options.dryRun) {
                console.log(chalk.gray(`    Note: Manual update required in project-plan.md`));
              }
            }
          }
        }

        if (syncCount === 0) {
          console.log(chalk.green('✓ All stories are in sync with OpenSpec proposals'));
        } else {
          console.log(chalk.bold(`\n${syncCount} story/stories need status updates`));

          if (options.dryRun) {
            console.log(chalk.gray('\nRun without --dry-run to see update instructions'));
          } else {
            console.log(
              chalk.gray(
                '\nUpdate project-plan.md manually to reflect the suggested status changes'
              )
            );
          }
        }
      } catch (error) {
        console.error(
          chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        );
        process.exit(1);
      }
    });

  return sync;
}

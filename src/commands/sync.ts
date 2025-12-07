import { Command } from 'commander';
import chalk from 'chalk';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { ConfigRepository } from '../repositories';
import { StoryService } from '../services';

export function createSyncCommand(): Command {
  const sync = new Command('sync')
    .description('Sync story status with OpenSpec proposals');

  // Sync status
  sync
    .command('status')
    .description('Reconcile story status with OpenSpec change proposals')
    .option('--dry-run', 'Show what would change without updating')
    .action(async (options) => {
      try {
        const config = await new ConfigRepository(process.cwd()).read();
        const storyService = new StoryService(config.openspecDir);
        const changesDir = join(config.openspecDir, 'changes');

        if (!existsSync(changesDir)) {
          console.log(chalk.yellow('No changes directory found. Nothing to sync.'));
          return;
        }

        // Get all stories
        const stories = await storyService.listStories();
        
        // Scan for OpenSpec change proposals
        const changes = readdirSync(changesDir)
          .filter(name => {
            const path = join(changesDir, name);
            return existsSync(path) && readdirSync(path).length > 0;
          });

        console.log(chalk.bold.cyan(`\n🔄 OpenSpec Status Sync\n`));
        console.log(chalk.gray(`Found ${changes.length} change proposal(s)`));
        console.log(chalk.gray(`Found ${stories.length} story/stories\n`));

        let syncCount = 0;

        for (const changeDir of changes) {
          const proposalPath = join(changesDir, changeDir, 'proposal.md');
          
          if (!existsSync(proposalPath)) continue;

          const content = readFileSync(proposalPath, 'utf-8');
          
          // Extract story IDs from proposal (looking for patterns like CLI-CORE-001)
          const storyIdMatches = content.match(/[A-Z]+-[A-Z0-9]+-\d+/g);
          
          if (!storyIdMatches) continue;

          const uniqueStoryIds = [...new Set(storyIdMatches)];

          for (const storyId of uniqueStoryIds) {
            const story = stories.find(s => s.id === storyId);
            
            if (!story) continue;

            // Check if proposal is active (not in archive)
            const isArchived = changeDir.includes('archive');
            const suggestedStatus = isArchived ? 'done' : 'in_progress';

            if (story.status !== suggestedStatus && story.status !== 'done') {
              console.log(chalk.yellow(`  ${story.id}: ${story.status} → ${suggestedStatus}`));
              console.log(chalk.gray(`    Linked to: ${changeDir}`));
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
            console.log(chalk.gray('\nUpdate project-plan.md manually to reflect the suggested status changes'));
          }
        }
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
        process.exit(1);
      }
    });

  return sync;
}

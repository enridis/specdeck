import chalk from 'chalk';
import { Command } from 'commander';
import { ConfigRepository } from '../repositories';
import { ValidationService } from '../services';

export function createValidateStoryIdsCommand(): Command {
  return new Command('validate-story-ids')
    .description('Validate story ID uniqueness across all submodules')
    .option('--fix', 'Suggest fixes for conflicting story IDs')
    .action(async (options: { fix?: boolean }) => {
      try {
        const config = await new ConfigRepository(process.cwd()).read();

        // Check if in coordinator mode
        const isCoordinator = config.coordinator && config.coordinator.enabled;
        if (!isCoordinator) {
          console.error(chalk.red('Error: Not in coordinator mode. Initialize coordinator first.'));
          process.exit(1);
        }

        const submodules = config.coordinator?.submodules || [];
        if (submodules.length === 0) {
          console.error(chalk.red('Error: No submodules configured.'));
          process.exit(1);
        }

        console.log(chalk.bold('\n🔍 Validating story IDs across submodules...\n'));

        const validationService = new ValidationService();
        const result = await validationService.validateStoryIds(submodules);

        // Display summary
        console.log(chalk.cyan(`Total unique story IDs: ${result.totalIds}`));
        console.log(chalk.cyan(`Total submodules: ${submodules.length}`));
        console.log('');

        if (result.totalDuplicates === 0) {
          console.log(chalk.green('✓ All story IDs are unique!'));
        } else {
          console.log(chalk.red(`✗ Found ${result.totalDuplicates} conflicting story IDs:\n`));

          for (const conflict of result.duplicates) {
            console.log(chalk.yellow(`  ${conflict.storyId}`));
            for (const repo of conflict.repos) {
              console.log(chalk.gray(`    - ${repo}`));
            }

            if (options.fix) {
              console.log(chalk.cyan('    Suggestion: Use repo prefix in one or more repos'));
              console.log(chalk.gray(`    Example: ${conflict.storyId}-${conflict.repos[0]}`));
            }
            console.log('');
          }

          if (options.fix) {
            console.log(chalk.blue('\nTo fix conflicts, update story IDs to include repo prefix:'));
            console.log(chalk.gray('  1. Edit the story in one of the conflicting repos'));
            console.log(chalk.gray('  2. Add the repo name as a suffix: STORY-123-repo-name'));
            console.log(chalk.gray('  3. Run this command again to verify'));
          }

          process.exit(1);
        }
      } catch (error) {
        console.error(
          chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        );
        process.exit(1);
      }
    });
}

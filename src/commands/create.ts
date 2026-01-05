import { Command } from 'commander';
import chalk from 'chalk';
import { existsSync } from 'fs';
import { join } from 'path';
import { ConfigRepository } from '../repositories';

interface CreateFeatureOptions {
  description?: string;
}

export function createCreateCommand(): Command {
  const create = new Command('create').description('Create features');

  // Create feature
  create
    .command('feature')
    .description('Add a feature to a release')
    .argument('<releaseId>', 'Release ID to add feature to')
    .argument('<featureId>', 'Feature ID (e.g., AUTH-01)')
    .argument('<title>', 'Feature title')
    .option('-d, --description <description>', 'Feature description')
    .action(
      async (
        releaseId: string,
        featureId: string,
        title: string,
        options: CreateFeatureOptions
      ) => {
        try {
          const config = await new ConfigRepository(process.cwd()).read();
          const specdeckDir = config.specdeckDir || './specdeck';
          const releasePath = join(specdeckDir, 'releases', `${releaseId}.md`);

          if (!existsSync(releasePath)) {
            console.error(chalk.red(`Error: Release not found: ${releasePath}`));
            console.error(
              chalk.gray('Create the release first: specdeck releases create <id> <title>')
            );
            process.exit(1);
          }

          console.log(chalk.yellow('Note: Manual feature addition is recommended.'));
          console.log(chalk.gray(`Edit ${releasePath} and add:`));
          console.log(chalk.cyan(`\n- **${featureId}**: ${title}`));
          if (options.description) {
            console.log(chalk.cyan(`  - ${options.description}`));
          }
        } catch (error) {
          console.error(
            chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
          );
          process.exit(1);
        }
      }
    );

  return create;
}

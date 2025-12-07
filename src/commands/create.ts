import { Command } from 'commander';
import chalk from 'chalk';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { ConfigRepository } from '../repositories';

interface CreateReleaseOptions {
  timeframe?: string;
}

interface CreateFeatureOptions {
  description?: string;
}

export function createCreateCommand(): Command {
  const create = new Command('create').description('Create releases or features');

  // Create release
  create
    .command('release')
    .description('Create a new release')
    .argument('<id>', 'Release ID (e.g., R2-enhancements)')
    .argument('<title>', 'Release title')
    .option('-t, --timeframe <timeframe>', 'Release timeframe (e.g., Q2 2025)')
    .action(async (id: string, title: string, options: CreateReleaseOptions) => {
      try {
        const config = await new ConfigRepository(process.cwd()).read();
        const openspecDir = config.openspecDir || './openspec';
        const releasesDir = join(openspecDir, 'releases');

        // Ensure releases directory exists
        if (!existsSync(releasesDir)) {
          mkdirSync(releasesDir, { recursive: true });
        }

        const filePath = join(releasesDir, `${id}.md`);

        if (existsSync(filePath)) {
          console.error(chalk.red(`Error: Release file already exists: ${filePath}`));
          process.exit(1);
        }

        // Generate release template
        const template = generateReleaseTemplate(id, title, options.timeframe);
        writeFileSync(filePath, template, 'utf-8');

        console.log(chalk.green(`✓ Created release: ${filePath}`));
        console.log(chalk.gray('\nNext steps:'));
        console.log(chalk.gray('  1. Edit the release file to add objectives and success metrics'));
        console.log(chalk.gray('  2. Add features to the Features section'));
        console.log(chalk.gray(`  3. Run: specdeck list releases`));
      } catch (error) {
        console.error(
          chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        );
        process.exit(1);
      }
    });

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
          const openspecDir = config.openspecDir || './openspec';
          const releasePath = join(openspecDir, 'releases', `${releaseId}.md`);

          if (!existsSync(releasePath)) {
            console.error(chalk.red(`Error: Release not found: ${releasePath}`));
            console.error(
              chalk.gray('Create the release first: specdeck create release <id> <title>')
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

function generateReleaseTemplate(id: string, title: string, timeframe?: string): string {
  const frontMatter = {
    id,
    title,
    ...(timeframe && { timeframe }),
  };

  return `---
${Object.entries(frontMatter)
  .map(([key, value]) => `${key}: ${value}`)
  .join('\n')}
---

# Release: ${id} – ${title}

## Objectives

- [Add release objectives here]

## Success Metrics

- [Add success metrics here]

## Features

- **FEATURE-01**: [Feature Title]
  - [Feature description]
  - [Key capabilities]

## Dependencies

- [List any dependencies on other releases, teams, or external factors]

## Risks

### Risk 1: [Risk Title]

**Likelihood**: [Low/Medium/High] | **Impact**: [Low/Medium/High]

**Description**: [Describe the risk]

**Mitigation**: [How to mitigate this risk]

## Timeline

- **Planning**: [Dates]
- **Development**: [Dates]
- **Testing**: [Dates]
- **Release**: [Target date]
`;
}

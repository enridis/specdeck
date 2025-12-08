import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigRepository } from '../repositories';
import { StoryService, ReleaseService, FeatureService, FeatureWithStories } from '../services';
import { Feature } from '../schemas';

interface ListReleasesOptions {
  withFeatures?: boolean;
}

interface ListFeaturesOptions {
  release?: string;
  withStories?: boolean;
}

interface ListStoriesOptions {
  status?: string[];
  complexity?: string[];
  feature?: string;
  owner?: string;
  release?: string;
  milestone?: string;
  stats?: boolean;
}

interface GlobalOptions {
  json?: boolean;
}

export function createListCommand(): Command {
  const list = new Command('list').description('List releases, features, or stories');

  // List releases
  list
    .command('releases')
    .description('List all releases')
    .option('--with-features', 'Include feature details')
    .action(async (options: ListReleasesOptions, cmd: Command) => {
      try {
        const config = await new ConfigRepository(process.cwd()).read();
        const specdeckDir = config.specdeckDir || './specdeck';
        const releaseService = new ReleaseService(specdeckDir);
        const globalOpts: GlobalOptions = cmd.optsWithGlobals();

        if (options.withFeatures) {
          const releases = await releaseService.listReleasesWithFeatures();

          if (globalOpts.json) {
            console.log(JSON.stringify(releases, null, 2));
          } else {
            for (const release of releases) {
              console.log(chalk.bold.cyan(`\n${release.id}: ${release.title}`));
              if (release.timeframe) {
                console.log(chalk.gray(`  Timeframe: ${release.timeframe}`));
              }
              console.log(chalk.yellow(`  Features (${release.featureList.length}):`));
              for (const feature of release.featureList) {
                console.log(`    • ${feature.id}: ${feature.title}`);
              }
            }
          }
        } else {
          const releases = await releaseService.listReleases();

          if (globalOpts.json) {
            console.log(JSON.stringify(releases, null, 2));
          } else {
            console.log(chalk.bold('\nReleases:'));
            for (const release of releases) {
              console.log(chalk.cyan(`  ${release.id}: ${release.title}`));
              if (release.timeframe) {
                console.log(chalk.gray(`    Timeframe: ${release.timeframe}`));
              }
            }
          }
        }
      } catch (error) {
        console.error(
          chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        );
        process.exit(1);
      }
    });

  // List features
  list
    .command('features')
    .description('List all features')
    .option('-r, --release <releaseId>', 'Filter by release ID')
    .option('--with-stories', 'Include story details')
    .action(async (options: ListFeaturesOptions, cmd: Command) => {
      try {
        const config = await new ConfigRepository(process.cwd()).read();
        const specdeckDir = config.specdeckDir || './specdeck';
        const featureService = new FeatureService(specdeckDir);
        const globalOpts: GlobalOptions = cmd.optsWithGlobals();

        let features: Feature[] | FeatureWithStories[];
        if (options.release && options.withStories) {
          features = await featureService.getFeaturesByReleaseWithStories(options.release);
        } else if (options.release) {
          features = await featureService.getFeaturesByRelease(options.release);
        } else if (options.withStories) {
          features = await featureService.listFeaturesWithStories();
        } else {
          features = await featureService.listFeatures();
        }

        if (globalOpts.json) {
          console.log(JSON.stringify(features, null, 2));
        } else {
          console.log(chalk.bold('\nFeatures:'));
          for (const feature of features) {
            console.log(chalk.cyan(`\n  ${feature.id}: ${feature.title}`));
            console.log(chalk.gray(`    Release: ${feature.releaseId}`));

            if ('stories' in feature && Array.isArray(feature.stories)) {
              console.log(chalk.yellow(`    Stories (${feature.stories.length}):`));
              for (const story of feature.stories) {
                console.log(`      • ${story.id}: ${story.title} [${story.complexity}] (${story.status})`);
                if (story?.owner) console.log(`        Owner: "${story.owner}"`);
                if (story?.estimate) console.log(`        Estimate: ${story.estimate} points`);
                if (story?.milestone) console.log(`        Milestone: "${story.milestone}"`);

              }
            }
          }
        }
      } catch (error) {
        console.error(
          chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        );
        process.exit(1);
      }
    });

  // List stories
  list
    .command('stories')
    .description('List all stories')
    .option(
      '-s, --status <status...>',
      'Filter by status (planned, in_progress, in_review, blocked, done)'
    )
    .option('-c, --complexity <complexity...>', 'Filter by complexity (XS, S, M, L, XL)')
    .option('-f, --feature <featureId>', 'Filter by feature ID')
    .option('-r, --release <releaseId>', 'Filter by release ID')
    .option('-m, --milestone <milestone>', 'Filter by milestone')
    .option('-o, --owner <owner>', 'Filter by owner')
    .option('--stats', 'Show statistics')
    .action(async (options: ListStoriesOptions, cmd: Command) => {
      try {
        const config = await new ConfigRepository(process.cwd()).read();
        const specdeckDir = config.specdeckDir || './specdeck';
        const storyService = new StoryService(specdeckDir);
        const globalOpts: GlobalOptions = cmd.optsWithGlobals();

        if (options.stats) {
          const stats = await storyService.getStatistics();

          if (globalOpts.json) {
            console.log(JSON.stringify(stats, null, 2));
          } else {
            console.log(chalk.bold('\nStory Statistics:'));
            console.log(chalk.cyan(`  Total Stories: ${stats.total}`));
            console.log(chalk.cyan(`  Total Story Points: ${stats.totalPoints}`));

            console.log(chalk.yellow('\n  By Status:'));
            for (const [status, count] of Object.entries(stats.byStatus)) {
              console.log(`    ${status}: ${count}`);
            }

            console.log(chalk.yellow('\n  By Complexity:'));
            for (const [complexity, count] of Object.entries(stats.byComplexity)) {
              console.log(`    ${complexity}: ${count}`);
            }
          }
        } else {
          const filter = {
            status: options.status,
            complexity: options.complexity,
            feature: options.feature,
            release: options.release,
            milestone: options.milestone,
            owner: options.owner,
          };

          const stories = await storyService.listStories(filter);

          if (globalOpts.json) {
            console.log(JSON.stringify(stories, null, 2));
          } else {
            console.log(chalk.bold(`\nStories (${stories.length}):`));
            for (const story of stories) {
              console.log(chalk.cyan(`\n  ${story.id}: ${story.title}`));
              console.log(
                chalk.gray(`    Status: ${story.status} | Complexity: ${story.complexity}`)
              );
              if (story.estimate) {
                console.log(chalk.gray(`    Estimate: ${story.estimate} points`));
              }
              if (story.owner) {
                console.log(chalk.gray(`    Owner: ${story.owner}`));
              }
              if (story.milestone) {
                console.log(chalk.gray(`    Milestone: ${story.milestone}`));
              }
            }
          }
        }
      } catch (error) {
        console.error(
          chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        );
        process.exit(1);
      }
    });

  return list;
}

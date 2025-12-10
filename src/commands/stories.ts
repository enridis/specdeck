import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigRepository } from '../repositories';
import { StoryService } from '../services';
import { CacheStory } from '../schemas/cache.schema';

interface ShowStoriesOptions {
  withJira?: boolean;
  allFields?: boolean;
  global?: boolean;
  repo?: string;
  json?: boolean;
  noCache?: boolean;
}

export function createStoriesCommand(): Command {
  const stories = new Command('stories').description('Story utilities');

  stories
    .command('show')
    .description('Show detailed information for one or more stories')
    .argument('<storyIds...>', 'Story IDs to show')
    .option('--with-jira', 'Include Jira from overlays (coordinator mode)')
    .option('--all-fields', 'Show all fields (default: key fields)')
    .option('--global', 'Show repo prefix when available (coordinator mode)')
    .option('--repo <name>', 'Filter by repository/submodule (coordinator mode)')
    .option('--json', 'Output as JSON')
    .option('--no-cache', 'Bypass cache and read submodules directly')
    .action(async (storyIds: string[], options: ShowStoriesOptions, cmd: Command) => {
      const rootPath = process.cwd();
      const globalOpts = cmd.optsWithGlobals();

      if (!storyIds || storyIds.length === 0) {
        console.error(chalk.red('✗ Please provide at least one story ID.'));
        process.exit(1);
      }

      try {
        const configRepo = new ConfigRepository(rootPath);
        const config = await configRepo.read();
        const specdeckDir = config.specdeckDir || './specdeck';
        const storyService = new StoryService(specdeckDir, rootPath);

        const useCache = !options.noCache;
        const filter = {
          ids: storyIds,
          repo: options.repo,
          withJira: options.withJira,
        };

        const stories = await storyService.listStoriesWithCache(filter, {
          useCache,
          checkStale: true,
        });

        if (stories.length === 0) {
          console.log(chalk.yellow('No stories found for the provided IDs.'));
          process.exit(0);
        }

        const cacheInfo = await storyService.getCacheInfo();

        if (options.json || globalOpts.json) {
          console.log(JSON.stringify(stories, null, 2));
          return;
        }

        console.log(chalk.bold(`\nStories (${stories.length})`));
        for (const story of stories) {
          const cacheStory = story as CacheStory;
          const repoPrefix =
            (options.global || options.repo) && cacheStory.repo ? `[${cacheStory.repo}] ` : '';

          console.log(chalk.cyan(`\n  ${repoPrefix}${story.id}: ${story.title}`));
          console.log(chalk.gray(`    Status: ${story.status} | Complexity: ${story.complexity}`));

          if (options.allFields) {
            if (story.estimate !== undefined) {
              console.log(chalk.gray(`    Estimate: ${story.estimate}`));
            }
            if (story.owner) {
              console.log(chalk.gray(`    Owner: ${story.owner}`));
            }
            if (story.milestone) {
              console.log(chalk.gray(`    Milestone: ${story.milestone}`));
            }
            if (story.releaseId) {
              console.log(chalk.gray(`    Release: ${story.releaseId}`));
            }
            if (story.featureId) {
              console.log(chalk.gray(`    Feature: ${story.featureId}`));
            }
            if (story.tags && story.tags.length > 0) {
              console.log(chalk.gray(`    Tags: ${story.tags.join(', ')}`));
            }
            if (story.notes) {
              console.log(chalk.gray(`    Notes: ${story.notes}`));
            }
            if (story.openspec) {
              console.log(chalk.gray(`    OpenSpec: ${story.openspec}`));
            }
          }

          if (options.withJira && cacheStory.jiraTicket) {
            console.log(chalk.green(`    Jira: ${cacheStory.jiraTicket}`));
            if (cacheStory.overlaySource) {
              console.log(chalk.gray(`    Overlay: ${cacheStory.overlaySource}`));
            }
          }
        }

        if (options.withJira && useCache && cacheInfo.isCached && cacheInfo.isStale) {
          console.log(
            chalk.yellow(
              `\n⚠️  Cache is stale (synced at ${cacheInfo.syncedAt}). Run 'specdeck sync' for fresh data or re-run with --no-cache.`
            )
          );
        }
      } catch (error) {
        console.error(
          chalk.red(`✗ ${error instanceof Error ? error.message : 'Failed to show stories'}`)
        );
        process.exit(1);
      }
    });

  return stories;
}

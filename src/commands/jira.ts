import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigRepository, OverlayRepository } from '../repositories';
import { StoryService } from '../services';
import { CacheStory } from '../schemas';

interface JiraSyncPlanOptions {
  feature?: string;
  repo?: string;
  global?: boolean;
  json?: boolean;
  noCache?: boolean;
}

type SyncPlanReason = 'missing_jira' | 'jira_conflict' | 'status_mismatch' | 'cache_stale';

export function createJiraCommand(): Command {
  const jira = new Command('jira').description('Jira helper commands (coordinator mode)');

  jira
    .command('sync-plan')
    .description('List stories needing Jira sync (coordinator mode)')
    .option('-f, --feature <featureId>', 'Filter by feature ID')
    .option('--repo <name>', 'Filter by repository/submodule')
    .option('--global', 'Show repo prefix in output')
    .option('--json', 'Output as JSON')
    .option('--no-cache', 'Bypass cache and read submodules directly')
    .action(async (options: JiraSyncPlanOptions, cmd: Command) => {
      const rootPath = process.cwd();
      const globalOpts = cmd.optsWithGlobals();

      try {
        const configRepo = new ConfigRepository(rootPath);
        const config = await configRepo.read();
        const specdeckDir = config.specdeckDir || './specdeck';

        // Ensure coordinator mode
        const isCoordinator = await configRepo.isCoordinatorMode();
        if (!isCoordinator) {
          console.error(chalk.red('✗ Jira sync plan is only available in coordinator mode.'));
          console.error(
            chalk.gray("  Run 'specdeck init coordinator' to enable coordinator mode.")
          );
          process.exit(1);
        }

        const storyService = new StoryService(specdeckDir, rootPath);
        const overlayRepo = new OverlayRepository(await configRepo.getOverlaysDir());

        const cacheInfo = await storyService.getCacheInfo();
        const useCache = !options.noCache;

        // Read stories (cache-aware; apply overlays when bypassing cache)
        const stories = (await storyService.listStoriesWithCache(
          { feature: options.feature, repo: options.repo, withJira: true },
          { useCache, checkStale: true }
        )) as CacheStory[];

        // Build overlay conflict map
        const conflictMap = await buildConflictMap(overlayRepo);

        // Repo path lookup for diagnostics
        const submodules = await configRepo.getSubmodules();
        const repoPathMap = new Map(submodules.map((s) => [s.name, s.path]));

        const plan = stories
          .map((story) => {
            const reasons: SyncPlanReason[] = [];
            const conflict = conflictMap.get(story.id);
            const jiraTicket = story.jiraTicket;

            if (!jiraTicket) {
              reasons.push('missing_jira');
            }
            if (conflict && conflict.tickets.size > 1) {
              reasons.push('jira_conflict');
            }
            if (jiraTicket && story.status === 'planned') {
              reasons.push('status_mismatch');
            }
            if (reasons.length > 0 && useCache && cacheInfo.isCached && cacheInfo.isStale) {
              reasons.push('cache_stale');
            }

            if (reasons.length === 0) {
              return null;
            }

            return {
              repo: story.repo || 'unknown',
              feature: story.featureId,
              storyId: story.id,
              title: story.title,
              status: story.status,
              complexity: story.complexity,
              overlayJira: jiraTicket || '',
              overlaySource: story.overlaySource,
              sourceRepoPath: repoPathMap.get(story.repo || '') || '',
              reasons,
            };
          })
          .filter(Boolean) as Array<{
          repo: string;
          feature: string;
          storyId: string;
          title: string;
          status: string;
          complexity: string;
          overlayJira: string;
          overlaySource?: string;
          sourceRepoPath: string;
          reasons: SyncPlanReason[];
        }>;

        if (options.json || globalOpts.json) {
          console.log(JSON.stringify(plan, null, 2));
          return;
        }

        if (plan.length === 0) {
          console.log(chalk.green('✓ No Jira sync actions needed.'));
          if (useCache && cacheInfo.isCached && cacheInfo.isStale) {
            console.log(
              chalk.yellow(
                `⚠️  Cache is stale (synced at ${cacheInfo.syncedAt}). Run 'specdeck sync' for fresh data.`
              )
            );
          }
          return;
        }

        console.log(chalk.bold(`\nJira Sync Plan (${plan.length})`));
        for (const entry of plan) {
          const repoPrefix = options.global ? `[${entry.repo}] ` : '';
          console.log(chalk.cyan(`\n  ${repoPrefix}${entry.storyId}: ${entry.title}`));
          console.log(
            chalk.gray(
              `    Status: ${entry.status} | Complexity: ${entry.complexity} | Jira: ${entry.overlayJira || '—'}`
            )
          );
          const reasonText = entry.reasons
            .map((r) => {
              switch (r) {
                case 'missing_jira':
                  return 'Missing Jira mapping';
                case 'jira_conflict':
                  return 'Conflicting Jira mappings across overlays';
                case 'status_mismatch':
                  return 'Jira set but status is planned';
                case 'cache_stale':
                  return 'Cache stale — consider resync';
                default:
                  return r;
              }
            })
            .join('; ');
          console.log(chalk.yellow(`    Reason: ${reasonText}`));
          if (entry.overlaySource) {
            console.log(chalk.gray(`    Overlay: ${entry.overlaySource}`));
          }
          if (entry.sourceRepoPath) {
            console.log(chalk.gray(`    Repo path: ${entry.sourceRepoPath}`));
          }
        }

        if (useCache && cacheInfo.isCached && cacheInfo.isStale) {
          console.log(
            chalk.yellow(
              `\n⚠️  Cache is stale (synced at ${cacheInfo.syncedAt}). Run 'specdeck sync' for fresh data.`
            )
          );
        }
      } catch (error) {
        console.error(
          chalk.red(`✗ ${error instanceof Error ? error.message : 'Failed to generate sync plan'}`)
        );
        process.exit(1);
      }
    });

  return jira;
}

async function buildConflictMap(
  overlayRepo: OverlayRepository
): Promise<Map<string, { tickets: Set<string>; sources: string[] }>> {
  const map = new Map<string, { tickets: Set<string>; sources: string[] }>();
  const overlays = await overlayRepo.readAllOverlays();

  for (const [repo, featureOverlays] of overlays.entries()) {
    for (const [featureId, overlay] of featureOverlays.entries()) {
      if (!overlay.jiraMappings) continue;
      for (const [storyId, jira] of overlay.jiraMappings.entries()) {
        if (!map.has(storyId)) {
          map.set(storyId, { tickets: new Set(), sources: [] });
        }
        const entry = map.get(storyId)!;
        entry.tickets.add(jira);
        entry.sources.push(`overlays/${repo}/${featureId}.md`);
      }
    }
  }

  return map;
}

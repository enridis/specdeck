import { Command } from 'commander';
import chalk from 'chalk';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import { Content, ListItem } from 'mdast';
import { ConfigRepository } from '../repositories';
import { FeatureService, ReleaseService, StoryService } from '../services';
import { StoryStatus, StoryStatusSchema } from '../schemas';
import { findSection, parseMarkdown } from '../parsers';

type ReleaseSource = 'openspec' | 'jira' | 'azure';

interface ReleaseStatusStory {
  id: string;
  title: string;
  status: StoryStatus;
  featureId: string;
  releaseId: string;
  openspecId?: string;
  openspec?: {
    changeId: string;
    state: 'active' | 'archived' | 'missing';
    suggestedStatus?: StoryStatus;
    mismatch?: boolean;
  };
}

interface FeatureStatusSummary {
  featureId: string;
  title: string;
  totalStories: number;
  blockedStories: number;
  completionPercent: number;
  byStatus: Record<StoryStatus, number>;
}

interface ReleaseStatusSummary {
  release: {
    id: string;
    title: string;
    timeframe?: string;
  };
  totals: {
    totalStories: number;
    completedStories: number;
    blockedStories: number;
    completionPercent: number;
  };
  byStatus: Record<StoryStatus, number>;
  features: FeatureStatusSummary[];
  stories: ReleaseStatusStory[];
  warnings?: string[];
}

interface SyncPlanAction {
  storyId?: string;
  featureId?: string;
  externalId?: string;
  currentStatus?: StoryStatus;
  suggestedStatus?: StoryStatus;
  sourceStatus?: string;
  reason: string;
  type?: 'unmapped';
}

interface ExternalStatusItem {
  storyId?: string;
  featureId?: string;
  status: string;
  title?: string;
  externalId?: string;
}

interface StatusMappingFile {
  statusMapping?: Record<string, string>;
}

interface GlobalOptions {
  json?: boolean;
}

export function createReleasesCommand(): Command {
  const releases = new Command('releases').description('Manage releases and release workflows');

  releases
    .command('list')
    .description('List all releases')
    .option('--with-features', 'Include feature details')
    .action(async (options: { withFeatures?: boolean }, cmd: Command) => {
      try {
        const config = await new ConfigRepository(process.cwd()).read();
        const specdeckDir = config.specdeckDir || './specdeck';
        const releasesDir = join(specdeckDir, 'releases');
        const releaseService = new ReleaseService(specdeckDir);
        const globalOpts: GlobalOptions = cmd.optsWithGlobals();

        if (!existsSync(releasesDir)) {
          console.error(chalk.red('No releases directory found at specdeck/releases'));
          process.exit(1);
        }

        const releasesWithFeatures = await releaseService.listReleasesWithFeatures();

        if (releasesWithFeatures.length === 0) {
          console.log('No releases found');
          console.log(chalk.gray('Run `specdeck releases create` to add a release'));
          return;
        }

        if (options.withFeatures) {
          if (globalOpts.json) {
            console.log(JSON.stringify(releasesWithFeatures, null, 2));
            return;
          }

          for (const release of releasesWithFeatures) {
            console.log(chalk.bold.cyan(`\n${release.id}: ${release.title}`));
            if (release.timeframe) {
              console.log(chalk.gray(`  Timeframe: ${release.timeframe}`));
            }
            console.log(chalk.yellow(`  Features (${release.featureList.length}):`));
            for (const feature of release.featureList) {
              console.log(`    • ${feature.id}: ${feature.title}`);
            }
          }

          return;
        }

        if (globalOpts.json) {
          const response = releasesWithFeatures.map((release) => ({
            id: release.id,
            title: release.title,
            timeframe: release.timeframe,
            objectives: release.objectives,
            successMetrics: release.successMetrics,
            features: release.featureList.map((feature) => feature.id),
            featureCount: release.featureList.length,
          }));
          console.log(JSON.stringify(response, null, 2));
          return;
        }

        const rows = releasesWithFeatures.map((release) => [
          release.id,
          release.title,
          release.timeframe || '-',
          `${release.featureList.length} features`,
        ]);
        printTable(['ID', 'Title', 'Timeframe', 'Features'], rows);
      } catch (error) {
        console.error(
          chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        );
        process.exit(1);
      }
    });

  releases
    .command('show')
    .description('Show details for a release')
    .argument('<releaseId>', 'Release ID')
    .action(async (releaseId: string, cmd: Command) => {
      try {
        const rootPath = process.cwd();
        const config = await new ConfigRepository(rootPath).read();
        const specdeckDir = config.specdeckDir || './specdeck';
        const releaseService = new ReleaseService(specdeckDir);
        const featureService = new FeatureService(specdeckDir, rootPath);
        const globalOpts: GlobalOptions = cmd.optsWithGlobals();

        const release = await releaseService.getRelease(releaseId);
        if (!release) {
          const releasePath = join(specdeckDir, 'releases', `${releaseId}.md`);
          console.error(chalk.red(`Error: Release '${releaseId}' not found`));
          console.error(chalk.gray(`Expected: ${releasePath}`));
          console.error(chalk.gray('Run `specdeck releases list` to see available releases'));
          process.exit(1);
        }

        const releasePath = join(specdeckDir, 'releases', `${releaseId}.md`);
        const content = readFileSync(releasePath, 'utf-8');
        const objectives = extractBulletItems(content, 'Objectives', release.objectives);
        const successMetrics = extractBulletItems(
          content,
          'Success Metrics',
          release.successMetrics
        );
        const features = await featureService.getFeaturesByRelease(releaseId);

        if (globalOpts.json) {
          console.log(
            JSON.stringify(
              {
                ...release,
                objectives,
                successMetrics,
                features,
              },
              null,
              2
            )
          );
          return;
        }

        console.log(chalk.bold.cyan(`\n${release.id}: ${release.title}`));
        if (release.timeframe) {
          console.log(chalk.gray(`  Timeframe: ${release.timeframe}`));
        }
        if (objectives.length) {
          console.log(chalk.yellow('\nObjectives:'));
          objectives.forEach((item) => console.log(`  - ${item}`));
        }
        if (successMetrics.length) {
          console.log(chalk.yellow('\nSuccess Metrics:'));
          successMetrics.forEach((item) => console.log(`  - ${item}`));
        }
        if (features.length) {
          console.log(chalk.yellow('\nFeatures:'));
          features.forEach((feature) => console.log(`  - ${feature.id}: ${feature.title}`));
        }
      } catch (error) {
        console.error(
          chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        );
        process.exit(1);
      }
    });

  releases
    .command('create')
    .description('Create a new release')
    .argument('<id>', 'Release ID (e.g., R2-analytics)')
    .argument('<title>', 'Release title')
    .option('-t, --timeframe <timeframe>', 'Release timeframe (e.g., Q2 2025)')
    .option('--scope <path>', 'JSON file with objectives, success metrics, and features')
    .action(async (id: string, title: string, options: { timeframe?: string; scope?: string }) => {
      try {
        const config = await new ConfigRepository(process.cwd()).read();
        const specdeckDir = config.specdeckDir || './specdeck';
        const releaseService = new ReleaseService(specdeckDir);

        const scope = options.scope ? readScopeFile(options.scope) : null;
        const releasePath = join(specdeckDir, 'releases', `${id}.md`);

        if (existsSync(releasePath)) {
          console.error(chalk.red(`Error: Release '${id}' already exists`));
          console.error(chalk.gray(`Path: ${releasePath}`));
          process.exit(1);
        }

        await releaseService.createRelease({
          id,
          title,
          timeframe: options.timeframe || scope?.timeframe,
          objectives: scope?.objectives || [],
          successMetrics: scope?.successMetrics || [],
          features: scope?.features || [],
        });

        console.log(chalk.green(`✓ Created release: ${releasePath}`));
        console.log(chalk.gray('\nNext steps:'));
        console.log(chalk.gray(`  1. Review ${releasePath} and update Objectives/Success Metrics`));
        console.log(chalk.gray('  2. Add feature files in specdeck/releases/<release-id>/'));
        console.log(chalk.gray('  3. Run: specdeck releases list'));
      } catch (error) {
        console.error(
          chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        );
        process.exit(1);
      }
    });

  releases
    .command('status')
    .description('Generate release status summary')
    .argument('<releaseId>', 'Release ID')
    .option('--source <source>', 'Optional status source (openspec)')
    .action(async (releaseId: string, options: { source?: ReleaseSource }, cmd: Command) => {
      try {
        const rootPath = process.cwd();
        const config = await new ConfigRepository(rootPath).read();
        const specdeckDir = config.specdeckDir || './specdeck';
        const globalOpts: GlobalOptions = cmd.optsWithGlobals();

        if (options.source && options.source !== 'openspec') {
          console.error(chalk.red(`Error: Unsupported source '${options.source}' for status`));
          console.error(chalk.gray('Use --source openspec to include OpenSpec hints.'));
          process.exit(1);
        }

        const releaseService = new ReleaseService(specdeckDir);
        const featureService = new FeatureService(specdeckDir, rootPath);
        const storyService = new StoryService(specdeckDir, rootPath);

        const release = await releaseService.getRelease(releaseId);
        if (!release) {
          const releasePath = join(specdeckDir, 'releases', `${releaseId}.md`);
          console.error(chalk.red(`Error: Release '${releaseId}' not found`));
          console.error(chalk.gray(`Expected: ${releasePath}`));
          console.error(chalk.gray('Run `specdeck releases list` to see available releases'));
          process.exit(1);
        }

        const stories = await storyService.listStoriesWithCache({ release: releaseId });
        const features = await featureService.getFeaturesByRelease(releaseId);
        const featureMap = new Map(features.map((feature) => [feature.id, feature.title]));

        const byStatus = initializeStatusCounts();
        for (const story of stories) {
          byStatus[story.status] = (byStatus[story.status] || 0) + 1;
        }

        const totalStories = stories.length;
        const completedStories = byStatus.done;
        const blockedStories = byStatus.blocked;
        const completionPercent = totalStories
          ? Math.round((completedStories / totalStories) * 100)
          : 0;

        const perFeature = buildFeatureSummaries(stories, featureMap);

        const summary: ReleaseStatusSummary = {
          release: {
            id: release.id,
            title: release.title,
            timeframe: release.timeframe,
          },
          totals: {
            totalStories,
            completedStories,
            blockedStories,
            completionPercent,
          },
          byStatus,
          features: perFeature,
          stories: stories.map((story) => ({
            id: story.id,
            title: story.title,
            status: story.status,
            featureId: story.featureId,
            releaseId: story.releaseId,
            openspecId: options.source === 'openspec' ? story.openspec : undefined,
          })),
        };

        if (options.source === 'openspec') {
          const openspecDir = config.openspecDir || './openspec';
          const openspecIndex = scanOpenSpecChanges(openspecDir);

          if (!openspecIndex) {
            summary.warnings = ['OpenSpec changes directory not found; skipping OpenSpec hints.'];
          } else {
            applyOpenSpecHints(summary, openspecIndex);
          }
        }

        if (globalOpts.json) {
          console.log(JSON.stringify(summary, null, 2));
          return;
        }

        printReleaseStatus(summary, options.source === 'openspec');
      } catch (error) {
        console.error(
          chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        );
        process.exit(1);
      }
    });

  releases
    .command('sync-plan')
    .description('Compare release status with an external source and generate a sync plan')
    .argument('<releaseId>', 'Release ID')
    .requiredOption('--source <source>', 'Status source (openspec, jira, azure)')
    .option('--input <path>', 'External status input JSON file')
    .option('--mapping <path>', 'Mapping file for external statuses')
    .action(
      async (
        releaseId: string,
        options: { source: ReleaseSource; input?: string; mapping?: string },
        cmd: Command
      ) => {
        try {
          const rootPath = process.cwd();
          const config = await new ConfigRepository(rootPath).read();
          const specdeckDir = config.specdeckDir || './specdeck';
          const globalOpts: GlobalOptions = cmd.optsWithGlobals();

          if (!['openspec', 'jira', 'azure'].includes(options.source)) {
            console.error(chalk.red(`Error: Unsupported source '${options.source}'`));
            console.error(chalk.gray('Use openspec, jira, or azure.'));
            process.exit(1);
          }

          const releaseService = new ReleaseService(specdeckDir);
          const storyService = new StoryService(specdeckDir, rootPath);

          const release = await releaseService.getRelease(releaseId);
          if (!release) {
            const releasePath = join(specdeckDir, 'releases', `${releaseId}.md`);
            console.error(chalk.red(`Error: Release '${releaseId}' not found`));
            console.error(chalk.gray(`Expected: ${releasePath}`));
            console.error(chalk.gray('Run `specdeck releases list` to see available releases'));
            process.exit(1);
          }

          const stories = await storyService.listStoriesWithCache({ release: releaseId });

          const actions =
            options.source === 'openspec'
              ? buildOpenSpecSyncPlan(stories, config.openspecDir || './openspec')
              : buildExternalSyncPlan(
                  stories,
                  releaseId,
                  options.source,
                  options.input,
                  options.mapping,
                  specdeckDir
                );

          if (globalOpts.json) {
            console.log(JSON.stringify(actions, null, 2));
            return;
          }

          if (actions.length === 0) {
            const sourceLabel =
              options.source === 'openspec' ? 'OpenSpec' : options.source.toUpperCase();
            console.log(`No ${sourceLabel} status mismatches found`);
            return;
          }

          console.log(chalk.bold(`\nSync Plan (${actions.length} items)`));
          for (const action of actions) {
            if (action.type === 'unmapped') {
              console.log(
                chalk.yellow(
                  `  - Unmapped: ${action.storyId || action.featureId || action.externalId || 'item'}`
                )
              );
              console.log(chalk.gray(`    Reason: ${action.reason}`));
              continue;
            }

            console.log(
              chalk.cyan(
                `  - ${action.storyId}: ${action.currentStatus} → ${action.suggestedStatus}`
              )
            );
            console.log(chalk.gray(`    Reason: ${action.reason}`));
          }
        } catch (error) {
          console.error(
            chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
          );
          process.exit(1);
        }
      }
    );

  return releases;
}

function initializeStatusCounts(): Record<StoryStatus, number> {
  return {
    planned: 0,
    in_progress: 0,
    in_review: 0,
    blocked: 0,
    done: 0,
  };
}

function buildFeatureSummaries(
  stories: { status: StoryStatus; featureId: string }[],
  featureMap: Map<string, string>
): FeatureStatusSummary[] {
  const featureTotals = new Map<string, FeatureStatusSummary>();

  for (const story of stories) {
    const existing =
      featureTotals.get(story.featureId) ||
      ({
        featureId: story.featureId,
        title: featureMap.get(story.featureId) || story.featureId,
        totalStories: 0,
        blockedStories: 0,
        completionPercent: 0,
        byStatus: initializeStatusCounts(),
      } as FeatureStatusSummary);

    existing.totalStories += 1;
    existing.byStatus[story.status] = (existing.byStatus[story.status] || 0) + 1;
    if (story.status === 'blocked') {
      existing.blockedStories += 1;
    }

    featureTotals.set(story.featureId, existing);
  }

  for (const summary of featureTotals.values()) {
    summary.completionPercent = summary.totalStories
      ? Math.round((summary.byStatus.done / summary.totalStories) * 100)
      : 0;
  }

  return Array.from(featureTotals.values()).sort((a, b) => a.featureId.localeCompare(b.featureId));
}

function applyOpenSpecHints(summary: ReleaseStatusSummary, index: OpenSpecIndex): void {
  let mismatchCount = 0;

  summary.stories = summary.stories.map((story) => {
    const linkedId = story.openspecId;
    if (!linkedId) {
      return story;
    }

    const state = index.archived.has(linkedId)
      ? 'archived'
      : index.active.has(linkedId)
        ? 'active'
        : 'missing';
    const suggestedStatus =
      state === 'archived' ? 'done' : state === 'active' ? 'in_progress' : undefined;
    const mismatch = suggestedStatus ? story.status !== suggestedStatus : false;

    if (mismatch) {
      mismatchCount += 1;
    }

    return {
      ...story,
      openspec: {
        changeId: linkedId,
        state,
        suggestedStatus,
        mismatch,
      },
    };
  });

  if (mismatchCount > 0) {
    summary.warnings = summary.warnings || [];
    summary.warnings.push(
      `${mismatchCount} story(s) differ from OpenSpec change state. Run specdeck releases sync-plan ${summary.release.id} --source openspec for details.`
    );
  }
}

function printReleaseStatus(summary: ReleaseStatusSummary, includeOpenSpec: boolean): void {
  console.log(chalk.bold(`\nRelease Status: ${summary.release.id} (${summary.release.title})`));
  if (summary.release.timeframe) {
    console.log(chalk.gray(`Timeframe: ${summary.release.timeframe}`));
  }

  console.log(chalk.cyan(`\nTotal Stories: ${summary.totals.totalStories}`));
  console.log(chalk.cyan(`Completion: ${summary.totals.completionPercent}%`));
  console.log(chalk.cyan(`Blocked: ${summary.totals.blockedStories}`));

  console.log(chalk.yellow('\nBy Status:'));
  for (const [status, count] of Object.entries(summary.byStatus)) {
    console.log(`  ${status}: ${count}`);
  }

  if (summary.features.length) {
    console.log(chalk.yellow('\nBy Feature:'));
    for (const feature of summary.features) {
      console.log(
        `  ${feature.featureId}: ${feature.totalStories} stories (${feature.completionPercent}% done, ${feature.blockedStories} blocked)`
      );
    }
  }

  if (includeOpenSpec) {
    console.log(chalk.gray('\nOpenSpec hints enabled. Use --json for per-story hints.'));
    const mismatches = summary.stories.filter((story) => story.openspec?.mismatch);
    if (mismatches.length) {
      console.log(chalk.yellow('\nOpenSpec Mismatches:'));
      mismatches.forEach((story) => {
        console.log(
          `  - ${story.id}: ${story.status} → ${story.openspec?.suggestedStatus} (${story.openspec?.state})`
        );
      });
    }
  }

  if (summary.warnings && summary.warnings.length) {
    console.log(chalk.yellow('\nWarnings:'));
    summary.warnings.forEach((warning) => console.log(`  - ${warning}`));
  }
}

function extractBulletItems(content: string, sectionName: string, fallback: string[]): string[] {
  const ast = parseMarkdown(content);
  const section = findSection(ast, sectionName);
  const items = extractListItems(section);
  return items.length ? items : fallback;
}

function extractListItems(nodes: Content[]): string[] {
  const results: string[] = [];

  for (const node of nodes) {
    if (node.type === 'list') {
      const list = node;
      for (const item of list.children) {
        results.push(extractListItemText(item));
      }
    }
  }

  return results.filter((value) => value.length > 0);
}

function extractListItemText(item: ListItem): string {
  if (!item.children || item.children.length === 0) {
    return '';
  }

  return item.children
    .map((child) => extractTextFromNode(child as Content))
    .join('')
    .trim();
}

function extractTextFromNode(node: Content): string {
  if (node.type === 'text') {
    return 'value' in node ? String(node.value) : '';
  }

  if (node.type === 'inlineCode') {
    return 'value' in node ? String(node.value) : '';
  }

  if ('children' in node) {
    return (node.children as Content[]).map(extractTextFromNode).join('');
  }

  return '';
}

function printTable(headers: string[], rows: string[][]): void {
  const widths = headers.map((header, index) => {
    return Math.max(header.length, ...rows.map((row) => row[index]?.length || 0));
  });

  const formatRow = (row: string[]) =>
    row.map((cell, index) => cell.padEnd(widths[index])).join(' | ');

  console.log('');
  console.log(formatRow(headers));
  console.log(widths.map((width) => '-'.repeat(width)).join('-|-'));
  rows.forEach((row) => console.log(formatRow(row)));
}

function readScopeFile(scopePath: string): {
  objectives?: string[];
  successMetrics?: string[];
  features?: string[];
  timeframe?: string;
} {
  const resolved = resolve(scopePath);
  if (!existsSync(resolved)) {
    throw new Error(`Scope file not found: ${resolved}`);
  }
  const raw = JSON.parse(readFileSync(resolved, 'utf-8')) as Record<string, unknown>;
  return {
    objectives: Array.isArray(raw.objectives) ? (raw.objectives as string[]) : [],
    successMetrics: Array.isArray(raw.successMetrics) ? (raw.successMetrics as string[]) : [],
    features: Array.isArray(raw.features) ? (raw.features as string[]) : [],
    timeframe: typeof raw.timeframe === 'string' ? raw.timeframe : undefined,
  };
}

interface OpenSpecIndex {
  active: Set<string>;
  archived: Set<string>;
}

function scanOpenSpecChanges(openspecDir: string): OpenSpecIndex | null {
  const changesDir = join(openspecDir, 'changes');
  if (!existsSync(changesDir)) {
    return null;
  }

  const active = new Set<string>();
  const archived = new Set<string>();

  const entries = readDirNames(changesDir);
  for (const entry of entries) {
    if (entry === 'archive') continue;
    active.add(entry);
  }

  const archiveDir = join(changesDir, 'archive');
  if (existsSync(archiveDir)) {
    for (const entry of readDirNames(archiveDir)) {
      archived.add(normalizeArchivedChange(entry));
    }
  }

  return { active, archived };
}

function readDirNames(dir: string): string[] {
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((entry: { isDirectory: () => boolean }) => entry.isDirectory())
      .map((entry: { name: string }) => entry.name);
  } catch {
    return [];
  }
}

function normalizeArchivedChange(name: string): string {
  const match = name.match(/^\d{4}-\d{2}-\d{2}-(.+)$/);
  return match ? match[1] : name;
}

function buildOpenSpecSyncPlan(
  stories: { status: StoryStatus; openspec?: string; id: string }[],
  openspecDir: string
): SyncPlanAction[] {
  const index = scanOpenSpecChanges(openspecDir);
  if (!index) {
    console.warn('OpenSpec changes directory not found; returning empty sync plan.');
    return [];
  }

  const actions: SyncPlanAction[] = [];

  for (const story of stories) {
    if (!story.openspec) continue;
    if (index.archived.has(story.openspec)) {
      if (story.status !== 'done') {
        actions.push({
          storyId: story.id,
          currentStatus: story.status,
          suggestedStatus: 'done',
          reason: 'OpenSpec change is archived',
        });
      }
      continue;
    }
    if (index.active.has(story.openspec)) {
      if (story.status !== 'in_progress') {
        actions.push({
          storyId: story.id,
          currentStatus: story.status,
          suggestedStatus: 'in_progress',
          reason: 'OpenSpec change is active',
        });
      }
    }
  }

  return actions;
}

function buildExternalSyncPlan(
  stories: { id: string; status: StoryStatus; featureId: string }[],
  releaseId: string,
  source: ReleaseSource,
  inputPath?: string,
  mappingPath?: string,
  specdeckDir?: string
): SyncPlanAction[] {
  if (!inputPath) {
    console.error(`Error: --input is required for source '${source}'`);
    process.exit(1);
  }

  const mappingFile =
    mappingPath || join(specdeckDir || './specdeck', 'mappings', `${source}.json`);
  if (!existsSync(mappingFile)) {
    console.error('Error: Mapping file not found');
    console.error(chalk.gray(`Expected: ${mappingFile}`));
    console.error(chalk.gray(`Create ${mappingFile} from the template before running sync-plan.`));
    process.exit(1);
  }

  const mapping = readMappingFile(mappingFile);
  const inputItems = readExternalInput(inputPath);
  const storyMap = new Map(stories.map((story) => [story.id, story]));
  const actions: SyncPlanAction[] = [];
  const seenUpdates = new Map<string, StoryStatus>();

  for (const item of inputItems) {
    const normalized = normalizeExternalStatus(item.status, mapping);

    if (!normalized) {
      actions.push({
        storyId: item.storyId,
        featureId: item.featureId,
        externalId: item.externalId,
        sourceStatus: item.status,
        reason: `Unmapped external status "${item.status}"`,
        type: 'unmapped',
      });
      continue;
    }

    const targets = resolveTargetStories(item, stories, storyMap, releaseId);
    if (targets.length === 0) {
      actions.push({
        storyId: item.storyId,
        featureId: item.featureId,
        externalId: item.externalId,
        sourceStatus: item.status,
        reason: 'No matching story found in release',
        type: 'unmapped',
      });
      continue;
    }

    for (const target of targets) {
      if (seenUpdates.has(target.id) && seenUpdates.get(target.id) !== normalized) {
        actions.push({
          storyId: target.id,
          sourceStatus: item.status,
          reason: 'Multiple external statuses map to the same story',
          type: 'unmapped',
        });
        continue;
      }

      seenUpdates.set(target.id, normalized);

      if (target.status !== normalized) {
        actions.push({
          storyId: target.id,
          currentStatus: target.status,
          suggestedStatus: normalized,
          sourceStatus: item.status,
          reason: `External status "${item.status}" mapped to "${normalized}"`,
        });
      }
    }
  }

  return actions;
}

function readExternalInput(inputPath: string): ExternalStatusItem[] {
  const resolved = resolve(inputPath);
  if (!existsSync(resolved)) {
    throw new Error(`Input file not found: ${resolved}`);
  }

  const raw = JSON.parse(readFileSync(resolved, 'utf-8')) as
    | ExternalStatusItem[]
    | { items?: ExternalStatusItem[] };
  if (Array.isArray(raw)) {
    return raw;
  }

  if (raw.items && Array.isArray(raw.items)) {
    return raw.items;
  }

  throw new Error('External input must be a JSON array or { "items": [...] } object');
}

function readMappingFile(mappingFile: string): StatusMappingFile {
  const raw = JSON.parse(readFileSync(mappingFile, 'utf-8')) as StatusMappingFile;
  return raw;
}

function normalizeExternalStatus(status: string, mapping: StatusMappingFile): StoryStatus | null {
  const trimmed = status.trim();
  const direct = StoryStatusSchema.safeParse(trimmed);
  if (direct.success) {
    return direct.data;
  }

  const mapped = mapping.statusMapping?.[trimmed];
  if (!mapped) {
    return null;
  }

  const parsed = StoryStatusSchema.safeParse(mapped);
  return parsed.success ? parsed.data : null;
}

function resolveTargetStories(
  item: ExternalStatusItem,
  stories: { id: string; featureId: string; status: StoryStatus }[],
  storyMap: Map<string, { id: string; featureId: string; status: StoryStatus }>,
  releaseId: string
): { id: string; featureId: string; status: StoryStatus }[] {
  if (item.storyId) {
    const story = storyMap.get(item.storyId);
    return story ? [story] : [];
  }

  if (item.featureId) {
    return stories.filter((story) => story.featureId === item.featureId);
  }

  console.warn(`Skipping external item without storyId or featureId for ${releaseId}`);
  return [];
}

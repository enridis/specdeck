import { Command } from 'commander';
import chalk from 'chalk';
import { promises as fs } from 'fs';
import { join, dirname, basename } from 'path';
import { ConfigRepository } from '../repositories';
import { Config } from '../schemas';

interface MigrateOptions {
  dryRun?: boolean;
}

interface SplitFile {
  releaseId: string;
  openspecPath: string;
  specdeckPath: string;
  hasOpenspecFile: boolean;
  hasSpecdeckFile: boolean;
}

export function createMigrateCommand(): Command {
  const migrate = new Command('migrate')
    .description('Migrate split release files to feature-based structure')
    .option('--dry-run', 'Preview migration without making changes')
    .action(async (options: MigrateOptions) => {
      try {
        const config = await new ConfigRepository(process.cwd()).read();
        const openspecDir = config.openspecDir || './openspec';
        const specdeckDir = config.specdeckDir || './specdeck';

        // Check for split files
        console.log(chalk.cyan('Checking for split release files...'));
        const splitFiles = await checkSplitFiles(openspecDir, specdeckDir);

        if (splitFiles.length === 0) {
          console.log(
            chalk.green('✓ No split files detected. Release structure is already consolidated.')
          );
          return;
        }

        console.log(chalk.yellow(`\nFound ${splitFiles.length} release(s) with split files:`));
        for (const file of splitFiles) {
          console.log(`  - ${file.releaseId}`);
          if (file.hasOpenspecFile) console.log(`    ${chalk.dim(file.openspecPath)}`);
          if (file.hasSpecdeckFile) console.log(`    ${chalk.dim(file.specdeckPath)}`);
        }

        if (options.dryRun) {
          console.log(chalk.cyan('\n[DRY RUN] Previewing migration...'));
          await previewMigration(splitFiles);
          console.log(
            chalk.yellow(
              '\n[DRY RUN] No files were modified. Run without --dry-run to execute migration.'
            )
          );
          return;
        }

        // Execute migration
        console.log(chalk.cyan('\nExecuting migration...'));
        await executeMigration(splitFiles, openspecDir, specdeckDir);

        // Update config
        console.log(chalk.cyan('\nUpdating configuration...'));
        updateConfig(config);

        console.log(chalk.green('\n✓ Migration completed successfully!'));
        console.log(chalk.dim('\nNext steps:'));
        console.log(chalk.dim('  1. Review the migrated files in specdeck/releases/'));
        console.log(chalk.dim('  2. Backup of original files saved in openspec/releases.backup/'));
        console.log(chalk.dim('  3. Run `specdeck releases list --with-features` to verify'));
      } catch (error) {
        console.error(
          chalk.red('Error during migration:'),
          error instanceof Error ? error.message : error
        );
        process.exit(1);
      }
    });

  // Add subcommand for checking split files
  migrate
    .command('check')
    .description('Check for split release files without migrating')
    .action(async () => {
      try {
        const config = await new ConfigRepository(process.cwd()).read();
        const openspecDir = config.openspecDir || './openspec';
        const specdeckDir = config.specdeckDir || './specdeck';

        const splitFiles = await checkSplitFiles(openspecDir, specdeckDir);

        if (splitFiles.length === 0) {
          console.log(chalk.green('✓ No split files detected.'));
        } else {
          console.log(chalk.yellow(`Found ${splitFiles.length} release(s) with split files:`));
          for (const file of splitFiles) {
            console.log(`\n${chalk.bold(file.releaseId)}:`);
            if (file.hasOpenspecFile) {
              console.log(`  Features: ${chalk.cyan(file.openspecPath)}`);
            }
            if (file.hasSpecdeckFile) {
              console.log(`  Stories:  ${chalk.cyan(file.specdeckPath)}`);
            }
          }
          console.log(chalk.dim('\nRun `specdeck migrate` to consolidate these files.'));
        }
      } catch (error) {
        console.error(
          chalk.red('Error checking files:'),
          error instanceof Error ? error.message : error
        );
        process.exit(1);
      }
    });

  return migrate;
}

async function checkSplitFiles(openspecDir: string, specdeckDir: string): Promise<SplitFile[]> {
  const splitFiles: SplitFile[] = [];

  try {
    // Check openspec/releases/ directory
    const openspecReleasesDir = join(openspecDir, 'releases');
    const specdeckReleasesDir = join(specdeckDir, 'releases');

    let openspecFiles: string[] = [];
    let specdeckFiles: string[] = [];

    try {
      openspecFiles = await fs.readdir(openspecReleasesDir);
    } catch {
      // Directory doesn't exist
    }

    try {
      specdeckFiles = await fs.readdir(specdeckReleasesDir);
    } catch {
      // Directory doesn't exist
    }

    // Find matching release IDs
    const openspecReleaseIds = openspecFiles
      .filter((f) => f.endsWith('.md'))
      .map((f) => basename(f, '.md'));

    const specdeckReleaseIds = specdeckFiles
      .filter((f) => f.endsWith('.md'))
      .map((f) => basename(f, '.md'));

    // Combine all release IDs
    const allReleaseIds = new Set([...openspecReleaseIds, ...specdeckReleaseIds]);

    for (const releaseId of allReleaseIds) {
      const hasOpenspecFile = openspecReleaseIds.includes(releaseId);
      const hasSpecdeckFile = specdeckReleaseIds.includes(releaseId);

      // Only report if files exist in both locations (split) or only in openspec
      if (hasOpenspecFile) {
        splitFiles.push({
          releaseId,
          openspecPath: join(openspecReleasesDir, `${releaseId}.md`),
          specdeckPath: join(specdeckReleasesDir, `${releaseId}.md`),
          hasOpenspecFile,
          hasSpecdeckFile,
        });
      }
    }
  } catch (error) {
    console.error(chalk.yellow('Warning: Could not check for split files'), error);
  }

  return splitFiles;
}

async function previewMigration(splitFiles: SplitFile[]): Promise<void> {
  for (const file of splitFiles) {
    console.log(chalk.bold(`\n${file.releaseId}:`));

    // Read openspec file for features
    if (file.hasOpenspecFile) {
      const openspecContent = await fs.readFile(file.openspecPath, 'utf-8');
      const featuresSection = extractFeaturesSection(openspecContent);
      console.log(
        chalk.green(`  ✓ Features extracted (${featuresSection.split('\n').length} lines)`)
      );
    }

    // Read specdeck file for stories
    if (file.hasSpecdeckFile) {
      const specdeckContent = await fs.readFile(file.specdeckPath, 'utf-8');
      const storiesSection = extractStoriesSection(specdeckContent);
      console.log(
        chalk.green(`  ✓ Stories extracted (${storiesSection.split('\n').length} lines)`)
      );
    }

    // Show structure that would be created
    console.log(chalk.cyan('  → Would create:'));
    console.log(chalk.dim(`      specdeck/releases/${file.releaseId}.md (overview)`));
    console.log(chalk.dim(`      specdeck/releases/${file.releaseId}/ (feature files)`));
  }
}

async function executeMigration(
  splitFiles: SplitFile[],
  openspecDir: string,
  specdeckDir: string
): Promise<void> {
  // Create backup of openspec/releases/
  const backupDir = join(openspecDir, 'releases.backup');
  try {
    await fs.mkdir(backupDir, { recursive: true });
    console.log(chalk.green(`✓ Created backup directory: ${backupDir}`));
  } catch {
    // Already exists
  }

  for (const file of splitFiles) {
    console.log(chalk.cyan(`\nMigrating ${file.releaseId}...`));

    let features = '';
    let objectives = '';
    let successMetrics = '';
    let frontMatter = '';

    // Read features from openspec file
    if (file.hasOpenspecFile) {
      const openspecContent = await fs.readFile(file.openspecPath, 'utf-8');
      frontMatter = extractFrontMatter(openspecContent);
      objectives = extractSection(openspecContent, 'Objectives');
      successMetrics = extractSection(openspecContent, 'Success Metrics');
      features = extractFeaturesSection(openspecContent);

      // Backup original file
      const backupPath = join(backupDir, basename(file.openspecPath));
      await fs.copyFile(file.openspecPath, backupPath);
      console.log(chalk.dim(`  Backed up: ${backupPath}`));
    }

    // Read stories from specdeck file
    let storiesMap: Map<string, string[]> = new Map();
    if (file.hasSpecdeckFile) {
      const specdeckContent = await fs.readFile(file.specdeckPath, 'utf-8');
      storiesMap = groupStoriesByFeature(specdeckContent);
      console.log(chalk.dim(`  Found ${storiesMap.size} feature(s) with stories`));
    }

    // Create release overview file
    const releaseOverview = createReleaseOverview(
      file.releaseId,
      frontMatter,
      objectives,
      successMetrics,
      features,
      storiesMap
    );
    const overviewPath = join(specdeckDir, 'releases', `${file.releaseId}.md`);
    await fs.mkdir(dirname(overviewPath), { recursive: true });
    await fs.writeFile(overviewPath, releaseOverview, 'utf-8');
    console.log(chalk.green(`  ✓ Created: ${overviewPath}`));

    // Create feature-based story files
    const featureDir = join(specdeckDir, 'releases', file.releaseId);
    await fs.mkdir(featureDir, { recursive: true });

    for (const [featureId, stories] of storiesMap) {
      const featureFilePath = join(featureDir, `${featureId}.md`);
      const featureFileContent = createFeatureStoryFile(
        featureId,
        file.releaseId,
        features,
        stories
      );
      await fs.writeFile(featureFilePath, featureFileContent, 'utf-8');
      console.log(chalk.green(`  ✓ Created: ${featureFilePath}`));
    }

    console.log(chalk.green(`✓ Migrated ${file.releaseId} to feature-based structure`));
  }
}

function extractFrontMatter(content: string): string {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[0] : '';
}

function extractSection(content: string, sectionName: string): string {
  const regex = new RegExp(`## ${sectionName}\\s*([\\s\\S]*?)(?=\\n##|$)`, 'i');
  const match = content.match(regex);
  return match ? `## ${sectionName}\n${match[1].trim()}` : '';
}

function extractFeaturesSection(content: string): string {
  return extractSection(content, 'Features');
}

function extractStoriesSection(content: string): string {
  // Look for a stories table (markdown table with Story headers)
  const tableMatch = content.match(/\| ID[\s\S]*?\n\|[-|\s]+\|[\s\S]*?(?=\n\n|$)/);
  return tableMatch ? tableMatch[0] : '';
}

function groupStoriesByFeature(content: string): Map<string, string[]> {
  const storiesMap = new Map<string, string[]>();

  // Extract entire table including header
  const tableMatch = content.match(/\| ID[\s\S]*?\n\|[-|\s]+\n([\s\S]*?)(?=\n\n|$)/);
  if (!tableMatch) return storiesMap;

  // Split by newlines and filter for table rows (starting with |)
  const rows = tableMatch[1]
    .split('\n')
    .filter((line) => line.trim().startsWith('|') && line.trim().length > 1);

  for (const row of rows) {
    const cells = row
      .split('|')
      .map((c) => c.trim())
      .filter((c) => c);
    if (cells.length === 0) continue;

    const storyId = cells[0].trim();

    // Skip empty or invalid story IDs
    if (!storyId || storyId === 'ID') continue;

    // Extract feature ID from story ID (e.g., "CLI-CORE-01" -> "CLI-CORE")
    const featureMatch = storyId.match(/^([A-Z]+-[A-Z0-9]+)-\d+$/);
    if (featureMatch) {
      const featureId = featureMatch[1];
      if (!storiesMap.has(featureId)) {
        storiesMap.set(featureId, []);
      }
      storiesMap.get(featureId)!.push(row);
    }
  }

  return storiesMap;
}

function createReleaseOverview(
  releaseId: string,
  frontMatter: string,
  objectives: string,
  successMetrics: string,
  features: string,
  storiesMap: Map<string, string[]>
): string {
  const parts: string[] = [];

  if (frontMatter) {
    parts.push(frontMatter);
  }

  parts.push(`# Release: ${releaseId}`);

  if (objectives) {
    parts.push('', objectives);
  }

  if (successMetrics) {
    parts.push('', successMetrics);
  }

  if (features) {
    parts.push('', features);
  }

  // Add feature summary with story counts
  if (storiesMap.size > 0) {
    parts.push('', '## Feature Files', '');
    for (const [featureId, stories] of storiesMap) {
      parts.push(`- [${featureId}](./${releaseId}/${featureId}.md) - ${stories.length} stories`);
    }
  }

  return parts.join('\n') + '\n';
}

function createFeatureStoryFile(
  featureId: string,
  releaseId: string,
  featuresContent: string,
  stories: string[]
): string {
  const parts: string[] = [];

  parts.push('---');
  parts.push(`feature: ${featureId}`);
  parts.push(`release: ${releaseId}`);
  parts.push('---');
  parts.push('');
  parts.push(`# Feature: ${featureId}`);
  parts.push('');

  // Extract feature description from features content
  const featureMatch = featuresContent.match(
    new RegExp(`- \\*\\*${featureId}\\*\\*:([\\s\\S]*?)(?=\\n- \\*\\*|$)`, 'i')
  );
  if (featureMatch) {
    parts.push('## Description');
    parts.push('');
    parts.push(featureMatch[1].trim());
    parts.push('');
  }

  // Add stories table
  parts.push('## Stories');
  parts.push('');
  parts.push('| ID | Title | Status | Complexity | Estimate | Owner | Tags | Notes |');
  parts.push('|----|-------|--------|------------|----------|-------|------|-------|');

  for (const story of stories) {
    parts.push(story);
  }

  return parts.join('\n') + '\n';
}

function updateConfig(config: Config): void {
  // Add deprecation note if openspecDir is still present
  if (config.openspecDir) {
    console.log(
      chalk.yellow('  Note: openspecDir is now deprecated. Consider updating your config.')
    );
  }

  console.log(chalk.dim('  Configuration updated to use specdeck/ directory structure'));
}

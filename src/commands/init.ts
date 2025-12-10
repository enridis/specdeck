import { Command } from 'commander';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { initCoordinatorMode } from './init-coordinator';
import { initSubmodule, removeSubmodule } from './init-submodule';

const VERSION_FILE = '.specdeck-version';
const AGENTS_FILE = 'AGENTS.md';
const MANAGED_BLOCK_START = '<!-- SPECDECK:START -->';
const MANAGED_BLOCK_END = '<!-- SPECDECK:END -->';

interface VersionInfo {
  version: string;
  timestamp: string;
  templates: string[];
  specdeckFiles?: string[];
}

export function createInitCommand(): Command {
  const init = new Command('init');
  init.description('Initialize SpecDeck resources in the current project');

  // Add copilot subcommand
  init
    .command('copilot')
    .description('Install GitHub Copilot prompt templates')
    .action(initCopilot);

  // Add coordinator subcommand
  init
    .command('coordinator')
    .description('Initialize coordinator mode for multi-repository projects')
    .action(async () => {
      try {
        await initCoordinatorMode();
      } catch (error) {
        console.error('✗', error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
    });

  // Add submodule management subcommands
  init
    .command('submodule <repo-url> <path>')
    .description('Add a git submodule and register it with SpecDeck coordinator')
    .option('-n, --name <name>', 'Submodule name (defaults to directory name)')
    .option(
      '-v, --visibility <type>',
      'Submodule visibility (public, private, on-premises)',
      'public'
    )
    .option('-b, --branch <branch>', 'Clone a specific branch')
    .option('--no-update', 'Skip submodule initialization (add only)')
    .action(
      async (
        repoUrl: string,
        path: string,
        options: { name?: string; visibility?: string; branch?: string; noUpdate?: boolean }
      ) => {
        try {
          // Type assertion for visibility to match expected type
          const initOptions = {
            ...options,
            visibility: options.visibility as 'public' | 'private' | 'on-premises' | undefined,
          };
          await initSubmodule(repoUrl, path, initOptions);
        } catch (error) {
          console.error('✗', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      }
    );

  init
    .command('remove-submodule <name-or-path>')
    .description('Remove a git submodule and unregister it from SpecDeck')
    .action(async (nameOrPath: string) => {
      try {
        await removeSubmodule(nameOrPath);
      } catch (error) {
        console.error('✗', error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
    });

  return init;
}

function initCopilot(): void {
  const cwd = process.cwd();

  // Check if already initialized
  const versionFile = join(cwd, VERSION_FILE);
  if (existsSync(versionFile)) {
    console.log('✓ Copilot templates already installed');
    console.log(`  Run 'specdeck upgrade copilot' to update to latest version`);
    return;
  }

  console.log('Initializing SpecDeck project structure...\n');

  // 0. Scaffold SpecDeck directory
  const specdeckFiles = scaffoldSpecDeck(cwd);

  console.log('\nInstalling Copilot prompt templates...\n');

  // 1. Create .github/prompts directory
  const promptsDir = join(cwd, '.github', 'prompts');
  if (!existsSync(promptsDir)) {
    mkdirSync(promptsDir, { recursive: true });
    console.log('✓ Created .github/prompts/');
  }

  // 2. Copy template files
  const templateFiles = [
    'specdeck-decompose.prompt.md',
    'specdeck-status.prompt.md',
    'specdeck-commands.prompt.md',
    'specdeck-migrate-feature.prompt.md',
    'specdeck-coordinator-setup.prompt.md',
    'specdeck-jira-sync.prompt.md',
  ];

  const templatesSourceDir = join(__dirname, '../templates/copilot/prompts');
  const copiedFiles: string[] = [];

  for (const file of templateFiles) {
    const source = join(templatesSourceDir, file);
    const dest = join(promptsDir, file);

    if (!existsSync(source)) {
      console.error(`✗ Template file not found: ${file}`);
      continue;
    }

    copyFileSync(source, dest);
    console.log(`✓ Installed ${file}`);
    copiedFiles.push(file);
  }

  // 3. Update or create AGENTS.md
  updateAgentsFile(cwd);

  // 4. Create version file
  // Version is hardcoded to match package.json
  const versionInfo: VersionInfo = {
    version: '0.2.0',
    timestamp: new Date().toISOString(),
    specdeckFiles,
    templates: copiedFiles,
  };

  writeFileSync(versionFile, JSON.stringify(versionInfo, null, 2));
  console.log(`✓ Created ${VERSION_FILE}`);

  console.log('\n✅ SpecDeck project initialized successfully!');
  console.log('\nCreated files:');
  console.log('\nSpecDeck (story tracking):');
  specdeckFiles.forEach((f) => console.log(`  - ${f}`));
  console.log('\nCopilot templates:');
  copiedFiles.forEach((f) => console.log(`  - .github/prompts/${f}`));
  console.log('\nNext steps:');
  console.log('  - Edit specdeck/vision.md with your product vision');
  console.log('  - Add stories to specdeck/releases/R1-foundation.md');
  console.log('  - Run "specdeck validate" to check your setup');
}

function stripYamlFrontMatter(content: string): string {
  // Remove YAML front matter if present (lines between --- markers)
  const yamlPattern = /^---\r?\n[\s\S]*?\r?\n---\r?\n/;
  return content.replace(yamlPattern, '');
}

function updateAgentsFile(cwd: string): void {
  const agentsPath = join(cwd, AGENTS_FILE);
  const templateContent = readFileSync(
    join(__dirname, '../templates/copilot/AGENTS.md.template'),
    'utf-8'
  );
  const managedBlock = stripYamlFrontMatter(templateContent);

  if (!existsSync(agentsPath)) {
    // Create new AGENTS.md
    const content = `# AI Assistant Instructions

This file provides guidance to AI assistants working in this project.

${managedBlock}
`;
    writeFileSync(agentsPath, content);
    console.log(`✓ Created ${AGENTS_FILE}`);
  } else {
    // Update existing AGENTS.md
    let content = readFileSync(agentsPath, 'utf-8');

    const startIndex = content.indexOf(MANAGED_BLOCK_START);
    const endIndex = content.indexOf(MANAGED_BLOCK_END);

    if (startIndex !== -1 && endIndex !== -1) {
      // Replace existing managed block
      const before = content.substring(0, startIndex);
      const after = content.substring(endIndex + MANAGED_BLOCK_END.length);
      content = before + managedBlock + after;
    } else {
      // Append managed block
      if (!content.endsWith('\n\n')) {
        content += content.endsWith('\n') ? '\n' : '\n\n';
      }
      content += managedBlock;
    }

    writeFileSync(agentsPath, content);
    console.log(`✓ Updated ${AGENTS_FILE}`);
  }
}

/**
 * Scaffold SpecDeck directory structure
 */
function scaffoldSpecDeck(cwd: string): string[] {
  const specdeckDir = join(cwd, 'specdeck');
  const createdFiles: string[] = [];

  // Check if specdeck/ already exists
  if (existsSync(specdeckDir)) {
    console.log('✓ specdeck/ directory already exists, skipping');
    return [];
  }

  console.log('Creating SpecDeck directory structure...');

  // Create specdeck/ directory
  mkdirSync(specdeckDir, { recursive: true });

  // Create specdeck/releases/ directory
  const releasesDir = join(specdeckDir, 'releases');
  mkdirSync(releasesDir, { recursive: true });

  // Copy template files
  const templatesSourceDir = join(__dirname, '../templates/specdeck');

  // Copy project-plan.md
  const projectPlanSource = join(templatesSourceDir, 'project-plan.md.template');
  const projectPlanDest = join(specdeckDir, 'project-plan.md');
  copyFileSync(projectPlanSource, projectPlanDest);
  console.log('✓ Created specdeck/project-plan.md');
  createdFiles.push('specdeck/project-plan.md');

  // Copy vision.md
  const visionSource = join(templatesSourceDir, 'vision.md.template');
  const visionDest = join(specdeckDir, 'vision.md');
  copyFileSync(visionSource, visionDest);
  console.log('✓ Created specdeck/vision.md');
  createdFiles.push('specdeck/vision.md');

  // Copy AGENTS.md
  const agentsSource = join(templatesSourceDir, 'AGENTS.md.template');
  const agentsDest = join(specdeckDir, 'AGENTS.md');
  copyFileSync(agentsSource, agentsDest);
  console.log('✓ Created specdeck/AGENTS.md');
  createdFiles.push('specdeck/AGENTS.md');

  // Copy R1-foundation.md
  const r1Source = join(templatesSourceDir, 'releases', 'R1-foundation.md.template');
  const r1Dest = join(releasesDir, 'R1-foundation.md');
  copyFileSync(r1Source, r1Dest);
  console.log('✓ Created specdeck/releases/R1-foundation.md');
  createdFiles.push('specdeck/releases/R1-foundation.md');

  return createdFiles;
}

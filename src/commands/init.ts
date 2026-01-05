import { Command } from 'commander';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { initCoordinatorMode } from './init-coordinator';
import { initSubmodule, removeSubmodule } from './init-submodule';

const VERSION_FILE = '.specdeck-version';
const AGENTS_FILE = 'AGENTS.md';
const MANAGED_BLOCK_START = '<!-- SPECDECK:START -->';
const MANAGED_BLOCK_END = '<!-- SPECDECK:END -->';
const BUNDLED_VERSION = '0.4.0';
const TEMPLATE_NAMES = [
  'specdeck-decompose',
  'specdeck-status',
  'specdeck-release-create',
  'specdeck-release-status',
  'specdeck-release-sync',
  'specdeck-migrate-feature',
  'specdeck-coordinator-setup',
  'specdeck-jira-sync',
];

interface VersionInfo {
  version: string;
  timestamp: string;
  templates: string[];
  specdeckFiles?: string[];
  targets?: string[];
}

type TemplateTarget = 'copilot' | 'windsurf';

const TARGET_LABELS: Record<TemplateTarget, string> = {
  copilot: 'Copilot',
  windsurf: 'Windsurf',
};

export function createInitCommand(): Command {
  const init = new Command('init');
  init.description('Initialize SpecDeck resources in the current project');

  // Add copilot subcommand
  init
    .command('copilot')
    .description('Install GitHub Copilot prompt templates')
    .action(initCopilot);

  // Add windsurf subcommand
  init.command('windsurf').description('Install Windsurf workflow templates').action(initWindsurf);

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
  initTarget('copilot');
}

function initWindsurf(): void {
  initTarget('windsurf');
}

function initTarget(target: TemplateTarget): void {
  const cwd = process.cwd();
  const versionFile = join(cwd, VERSION_FILE);
  const existingVersionInfo = readVersionInfo(versionFile);
  const existingTargets = getExistingTargets(existingVersionInfo);

  if (existingTargets.includes(target)) {
    const updatedVersionInfo = ensureTargets(existingVersionInfo, existingTargets);
    if (updatedVersionInfo) {
      writeVersionInfo(versionFile, updatedVersionInfo);
    }
    console.log(`✓ ${TARGET_LABELS[target]} templates already installed`);
    console.log(`  Run 'specdeck upgrade' to update to latest version`);
    return;
  }

  console.log('Initializing SpecDeck project structure...\n');

  // 0. Scaffold SpecDeck directory
  const specdeckFiles = scaffoldSpecDeck(cwd);

  console.log(
    `\nInstalling ${TARGET_LABELS[target]} ${
      target === 'copilot' ? 'prompt templates' : 'workflows'
    }...\n`
  );

  // 1. Create target directory
  const targetDir = getTargetDir(cwd, target);
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
    console.log(`✓ Created ${getTargetDirDisplay(target)}`);
  }

  // 2. Copy template files
  const templatesSourceDir = join(__dirname, '../templates/copilot/prompts');
  const copiedFiles: string[] = [];
  const templateFiles = TEMPLATE_NAMES.map((name) => `${name}.prompt.md`);

  for (const file of templateFiles) {
    const source = join(templatesSourceDir, file);
    const destName = getTargetFilename(file, target);
    const dest = join(targetDir, destName);

    if (!existsSync(source)) {
      console.error(`✗ Template file not found: ${file}`);
      continue;
    }

    copyFileSync(source, dest);
    console.log(`✓ Installed ${destName}`);
    copiedFiles.push(file);
  }

  // 3. Update or create AGENTS.md
  updateAgentsFile(cwd);

  // 4. Create/update version file
  const nextTargets = Array.from(new Set([...existingTargets, target]));
  const nextTemplates = Array.from(
    new Set([...(existingVersionInfo?.templates ?? []), ...copiedFiles])
  );
  const nextSpecdeckFiles =
    existingVersionInfo?.specdeckFiles ?? (specdeckFiles.length ? specdeckFiles : undefined);
  const nextVersionInfo: VersionInfo = {
    version: existingVersionInfo?.version ?? BUNDLED_VERSION,
    timestamp: new Date().toISOString(),
    templates: nextTemplates,
    targets: nextTargets,
    specdeckFiles: nextSpecdeckFiles,
  };

  writeVersionInfo(versionFile, nextVersionInfo);
  console.log(`✓ Updated ${VERSION_FILE}`);

  console.log('\n✅ SpecDeck resources initialized successfully!');
  console.log('\nCreated files:');
  if (specdeckFiles.length) {
    console.log('\nSpecDeck (story tracking):');
    specdeckFiles.forEach((f) => console.log(`  - ${f}`));
  }
  console.log(`\n${TARGET_LABELS[target]} ${target === 'copilot' ? 'templates' : 'workflows'}:`);
  copiedFiles.forEach((f) => {
    console.log(`  - ${getTargetDirDisplay(target)}${getTargetFilename(f, target)}`);
  });
  console.log('\nNext steps:');
  console.log('  - Edit specdeck/vision.md with your product vision');
  console.log('  - Add stories to specdeck/releases/R1-foundation.md');
  console.log('  - Run "specdeck validate" to check your setup');
}

function readVersionInfo(versionFile: string): VersionInfo | null {
  if (!existsSync(versionFile)) {
    return null;
  }

  return JSON.parse(readFileSync(versionFile, 'utf-8')) as VersionInfo;
}

function writeVersionInfo(versionFile: string, info: VersionInfo): void {
  writeFileSync(versionFile, JSON.stringify(info, null, 2));
}

function getExistingTargets(versionInfo: VersionInfo | null): TemplateTarget[] {
  if (!versionInfo) {
    return [];
  }

  if (versionInfo.targets?.length) {
    return versionInfo.targets.filter(isTarget);
  }

  return ['copilot'];
}

function ensureTargets(
  versionInfo: VersionInfo | null,
  targets: TemplateTarget[]
): VersionInfo | null {
  if (!versionInfo) {
    return null;
  }

  if (versionInfo.targets?.length) {
    return null;
  }

  return {
    ...versionInfo,
    targets,
    timestamp: new Date().toISOString(),
  };
}

function isTarget(value: string): value is TemplateTarget {
  return value === 'copilot' || value === 'windsurf';
}

function getTargetDir(cwd: string, target: TemplateTarget): string {
  if (target === 'copilot') {
    return join(cwd, '.github', 'prompts');
  }

  return join(cwd, '.windsurf', 'workflows');
}

function getTargetDirDisplay(target: TemplateTarget): string {
  return target === 'copilot' ? '.github/prompts/' : '.windsurf/workflows/';
}

function getTargetFilename(sourceFile: string, target: TemplateTarget): string {
  if (target === 'copilot') {
    return sourceFile;
  }

  return sourceFile.replace(/\.prompt\.md$/i, '.md');
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

  // Copy mapping templates
  const mappingsDir = join(specdeckDir, 'mappings');
  mkdirSync(mappingsDir, { recursive: true });
  const mappingTemplates = ['jira.json.template', 'azure.json.template', 'README.md.template'];
  for (const template of mappingTemplates) {
    const source = join(templatesSourceDir, 'mappings', template);
    const dest = join(mappingsDir, template.replace(/\.template$/, ''));
    if (existsSync(source)) {
      copyFileSync(source, dest);
      console.log(`✓ Created specdeck/mappings/${template.replace(/\.template$/, '')}`);
      createdFiles.push(`specdeck/mappings/${template.replace(/\.template$/, '')}`);
    }
  }

  return createdFiles;
}

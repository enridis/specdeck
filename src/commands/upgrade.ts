import { Command } from 'commander';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const VERSION_FILE = '.specdeck-version';
const AGENTS_FILE = 'AGENTS.md';
const MANAGED_BLOCK_START = '<!-- SPECDECK:START -->';
const MANAGED_BLOCK_END = '<!-- SPECDECK:END -->';

const TEMPLATE_ALIASES: Record<string, string> = {
  // Canonical names
  'specdeck-decompose': 'specdeck-decompose',
  'specdeck-status': 'specdeck-status',
  'specdeck-commands': 'specdeck-commands',
  'specdeck-migrate-feature': 'specdeck-migrate-feature',
  'specdeck-coordinator-setup': 'specdeck-coordinator-setup',
  'specdeck-jira-sync': 'specdeck-jira-sync',
  // Friendly aliases
  decompose: 'specdeck-decompose',
  status: 'specdeck-status',
  commands: 'specdeck-commands',
  'migrate-feature': 'specdeck-migrate-feature',
  'coordinator-setup': 'specdeck-coordinator-setup',
  'jira-sync': 'specdeck-jira-sync',
};

interface VersionInfo {
  version: string;
  timestamp: string;
  templates: string[];
}

function normalizeTemplateName(name?: string): string | null {
  if (!name) return null;
  const key = name.replace(/\.prompt\.md$/i, '');
  return TEMPLATE_ALIASES[key] || null;
}

function displayTemplateName(name: string): string {
  return name.replace(/^specdeck-/, '');
}

export function createUpgradeCommand(): Command {
  const upgrade = new Command('upgrade');
  upgrade.description('Upgrade SpecDeck resources to latest version');

  // Add copilot subcommand
  upgrade
    .command('copilot')
    .description('Upgrade GitHub Copilot prompt templates')
    .option('--force', 'Force overwrite templates even if up-to-date (skips backup)')
    .option('--template <name>', 'Upgrade specific template only')
    .option('--list', 'List available templates and versions')
    .action(upgradeCopilot);

  return upgrade;
}

function upgradeCopilot(options: { force?: boolean; template?: string; list?: boolean }): void {
  const cwd = process.cwd();

  // Handle --list
  if (options.list) {
    listTemplates(cwd);
    return;
  }

  // Check if templates are installed
  const versionFile = join(cwd, VERSION_FILE);
  if (!existsSync(versionFile)) {
    console.log('✗ Copilot templates not installed');
    console.log(`  Run 'specdeck init copilot' first`);
    process.exit(1);
  }

  // Read current version
  const currentVersionInfo = JSON.parse(readFileSync(versionFile, 'utf-8')) as VersionInfo;

  // Bundled version (matches package.json)
  const bundledVersion = '0.3.0';

  // Check if upgrade needed (skip check if --force or --template)
  if (currentVersionInfo.version === bundledVersion && !options.template && !options.force) {
    console.log(`✓ Templates are already up-to-date (v${bundledVersion})`);
    return;
  }

  if (options.force && currentVersionInfo.version === bundledVersion) {
    console.log(`⚠️  Forcing overwrite of templates (same version: v${bundledVersion})...\n`);
  } else {
    console.log(
      `Upgrading Copilot templates from v${currentVersionInfo.version} to v${bundledVersion}...\n`
    );
  }

  const promptsDir = join(cwd, '.github', 'prompts');

  // Create backup unless --force
  if (!options.force) {
    createBackup(promptsDir);
  } else {
    console.log('⚠️  Skipping backup (--force flag used)\n');
  }

  // Copy template files
  const templateFiles = (() => {
    if (options.template) {
      const normalized = normalizeTemplateName(options.template);
      if (!normalized) {
        console.error(
          `✗ Unknown template "${options.template}". Try one of: ${Object.keys(TEMPLATE_ALIASES)
            .filter((k) => k !== TEMPLATE_ALIASES[k])
            .join(', ')}`
        );
        process.exit(1);
      }
      return [`${normalized}.prompt.md`];
    }

    const canonicalTemplates = Array.from(new Set(Object.values(TEMPLATE_ALIASES)));
    return canonicalTemplates.map((template) => `${template}.prompt.md`);
  })();

  const templatesSourceDir = join(__dirname, '../templates/copilot/prompts');
  const upgradedFiles: string[] = [];

  for (const file of templateFiles) {
    const source = join(templatesSourceDir, file);
    const dest = join(promptsDir, file);

    if (!existsSync(source)) {
      console.error(`✗ Template file not found: ${file}`);
      continue;
    }

    copyFileSync(source, dest);
    console.log(`✓ Upgraded ${file}`);
    upgradedFiles.push(file);
  }

  // Update AGENTS.md
  if (!options.template) {
    updateAgentsFile(cwd);
  }

  // Update version file
  const newVersionInfo: VersionInfo = {
    version: bundledVersion,
    timestamp: new Date().toISOString(),
    templates: options.template
      ? [
          ...currentVersionInfo.templates.filter((t) => {
            const normalized = normalizeTemplateName(options.template);
            if (!normalized) return true;
            return !t.startsWith(normalized);
          }),
          ...upgradedFiles,
        ]
      : upgradedFiles,
  };

  writeFileSync(versionFile, JSON.stringify(newVersionInfo, null, 2));
  console.log(`✓ Updated ${VERSION_FILE}`);

  console.log('\n✅ Copilot templates upgraded successfully!');

  if (!options.force) {
    console.log('\n💡 Previous templates backed up to .github/prompts/.backup-{timestamp}/');
  }
}

function listTemplates(cwd: string): void {
  const versionFile = join(cwd, VERSION_FILE);

  // Read installed version
  let installedVersion = 'Not installed';
  let installedTemplates: string[] = [];

  if (existsSync(versionFile)) {
    const versionInfo = JSON.parse(readFileSync(versionFile, 'utf-8')) as VersionInfo;
    installedVersion = versionInfo.version;
    installedTemplates = versionInfo.templates;
  }

  // Bundled version (matches package.json)
  const bundledVersion = '0.3.0';

  console.log('Available Templates:\n');
  console.log(`Installed Version: ${installedVersion}`);
  console.log(`Bundled Version:   ${bundledVersion}\n`);

  const availableTemplates = Array.from(new Set(Object.values(TEMPLATE_ALIASES)));

  for (const template of availableTemplates) {
    const filename = `${template}.prompt.md`;
    const isInstalled = installedTemplates.includes(filename);
    const status = isInstalled
      ? installedVersion === bundledVersion
        ? '✓ Up-to-date'
        : '⚠️  Outdated'
      : '✗ Not installed';

    console.log(`  ${displayTemplateName(template).padEnd(25)} ${status}`);
  }

  if (installedVersion !== bundledVersion && installedVersion !== 'Not installed') {
    console.log(`\n💡 Run 'specdeck upgrade copilot' to update to v${bundledVersion}`);
  }
}

function createBackup(promptsDir: string): void {
  if (!existsSync(promptsDir)) {
    return;
  }

  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const backupDir = join(promptsDir, `.backup-${timestamp}`);

  mkdirSync(backupDir, { recursive: true });

  const files = readdirSync(promptsDir).filter((f) => f.endsWith('.prompt.md'));

  for (const file of files) {
    const source = join(promptsDir, file);
    const dest = join(backupDir, file);
    copyFileSync(source, dest);
  }

  console.log(`✓ Created backup in .github/prompts/.backup-${timestamp}/\n`);
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

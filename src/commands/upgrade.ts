import { Command } from 'commander';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const VERSION_FILE = '.specdeck-version';
const AGENTS_FILE = 'AGENTS.md';
const MANAGED_BLOCK_START = '<!-- SPECDECK:START -->';
const MANAGED_BLOCK_END = '<!-- SPECDECK:END -->';
const BUNDLED_VERSION = '0.4.0';

const TEMPLATE_ALIASES: Record<string, string> = {
  // Canonical names
  'specdeck-decompose': 'specdeck-decompose',
  'specdeck-status': 'specdeck-status',
  'specdeck-release-create': 'specdeck-release-create',
  'specdeck-release-status': 'specdeck-release-status',
  'specdeck-release-sync': 'specdeck-release-sync',
  'specdeck-migrate-feature': 'specdeck-migrate-feature',
  'specdeck-coordinator-setup': 'specdeck-coordinator-setup',
  'specdeck-jira-sync': 'specdeck-jira-sync',
  // Friendly aliases
  decompose: 'specdeck-decompose',
  status: 'specdeck-status',
  'release-create': 'specdeck-release-create',
  'release-status': 'specdeck-release-status',
  'release-sync': 'specdeck-release-sync',
  'migrate-feature': 'specdeck-migrate-feature',
  'coordinator-setup': 'specdeck-coordinator-setup',
  'jira-sync': 'specdeck-jira-sync',
};

interface VersionInfo {
  version: string;
  timestamp: string;
  templates: string[];
  specdeckFiles?: string[];
  targets?: string[];
}

type TemplateTarget = 'copilot' | 'windsurf';

const TARGETS: TemplateTarget[] = ['copilot', 'windsurf'];
const TARGET_LABELS: Record<TemplateTarget, string> = {
  copilot: 'Copilot',
  windsurf: 'Windsurf',
};
const TEMPLATE_NAMES = Array.from(new Set(Object.values(TEMPLATE_ALIASES)));

function normalizeTemplateName(name?: string): string | null {
  if (!name) return null;
  const key = name.replace(/\.prompt\.md$/i, '').replace(/\.md$/i, '');
  return TEMPLATE_ALIASES[key] || null;
}

function displayTemplateName(name: string): string {
  return name.replace(/^specdeck-/, '');
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

function getTargetFilename(templateName: string, target: TemplateTarget): string {
  return target === 'copilot' ? `${templateName}.prompt.md` : `${templateName}.md`;
}

function inferTargetsFromDisk(cwd: string): TemplateTarget[] {
  const targets: TemplateTarget[] = [];
  if (existsSync(join(cwd, '.github', 'prompts'))) {
    targets.push('copilot');
  }
  if (existsSync(join(cwd, '.windsurf', 'workflows'))) {
    targets.push('windsurf');
  }
  return targets;
}

function resolveTargets(cwd: string, versionInfo: VersionInfo | null): TemplateTarget[] {
  if (versionInfo?.targets?.length) {
    return versionInfo.targets.filter(isTarget);
  }

  return inferTargetsFromDisk(cwd);
}

export function createUpgradeCommand(): Command {
  const upgrade = new Command('upgrade');
  upgrade.description('Upgrade SpecDeck resources to latest version');

  upgrade
    .option('--force', 'Force overwrite templates even if up-to-date (skips backup)')
    .option('--template <name>', 'Upgrade specific template only')
    .option('--list', 'List available templates and versions')
    .action(upgradeTargets);

  return upgrade;
}

function upgradeTargets(options: { force?: boolean; template?: string; list?: boolean }): void {
  const cwd = process.cwd();
  const versionFile = join(cwd, VERSION_FILE);
  const currentVersionInfo = existsSync(versionFile)
    ? (JSON.parse(readFileSync(versionFile, 'utf-8')) as VersionInfo)
    : null;
  const resolvedTargets = resolveTargets(cwd, currentVersionInfo);

  // Handle --list
  if (options.list) {
    listTemplates(resolvedTargets, currentVersionInfo);
    return;
  }

  if (!resolvedTargets.length) {
    console.log('✗ No initialized templates found');
    console.log(`  Run 'specdeck init copilot' or 'specdeck init windsurf' first`);
    process.exit(1);
  }

  // Read current version
  const currentVersion = currentVersionInfo?.version ?? '0.0.0';
  const shouldMigrateTargets =
    !!currentVersionInfo && !currentVersionInfo.targets?.length && resolvedTargets.length > 0;

  // Check if upgrade needed (skip check if --force or --template)
  if (currentVersion === BUNDLED_VERSION && !options.template && !options.force) {
    if (shouldMigrateTargets) {
      const migratedVersionInfo: VersionInfo = {
        ...currentVersionInfo,
        targets: resolvedTargets,
        timestamp: new Date().toISOString(),
      };
      writeFileSync(versionFile, JSON.stringify(migratedVersionInfo, null, 2));
      console.log(`✓ Updated ${VERSION_FILE}`);
    }
    console.log(`✓ Templates are already up-to-date (v${BUNDLED_VERSION})`);
    return;
  }

  if (options.force && currentVersion === BUNDLED_VERSION) {
    console.log(`⚠️  Forcing overwrite of templates (same version: v${BUNDLED_VERSION})...\n`);
  } else {
    console.log(`Upgrading templates from v${currentVersion} to v${BUNDLED_VERSION}...\n`);
  }

  // Create backup unless --force
  if (!options.force) {
    resolvedTargets.forEach((target) => {
      createBackup(getTargetDir(cwd, target), target);
    });
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
      return [normalized];
    }

    return TEMPLATE_NAMES;
  })();

  const templatesSourceDir = join(__dirname, '../templates/copilot/prompts');
  const upgradedFiles: string[] = [];

  for (const templateName of templateFiles) {
    const source = join(templatesSourceDir, `${templateName}.prompt.md`);

    if (!existsSync(source)) {
      console.error(`✗ Template file not found: ${templateName}.prompt.md`);
      continue;
    }

    for (const target of resolvedTargets) {
      const targetDir = getTargetDir(cwd, target);
      if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
      }

      const destName = getTargetFilename(templateName, target);
      const dest = join(targetDir, destName);
      copyFileSync(source, dest);
      console.log(`✓ Upgraded ${TARGET_LABELS[target]} ${destName}`);
    }

    upgradedFiles.push(`${templateName}.prompt.md`);
  }

  // Update AGENTS.md
  if (!options.template) {
    updateAgentsFile(cwd);
  }

  // Update version file
  const existingTemplates = currentVersionInfo?.templates ?? [];
  const nextTemplates = options.template
    ? [
        ...existingTemplates.filter((t) => {
          const normalized = normalizeTemplateName(options.template);
          if (!normalized) return true;
          return !t.startsWith(normalized);
        }),
        ...upgradedFiles,
      ]
    : upgradedFiles;
  const nextTargets = Array.from(new Set(resolvedTargets));
  const newVersionInfo: VersionInfo = {
    version: BUNDLED_VERSION,
    timestamp: new Date().toISOString(),
    templates: nextTemplates,
    targets: nextTargets,
    specdeckFiles: currentVersionInfo?.specdeckFiles,
  };

  writeFileSync(versionFile, JSON.stringify(newVersionInfo, null, 2));
  console.log(`✓ Updated ${VERSION_FILE}`);

  console.log('\n✅ Templates upgraded successfully!');

  if (!options.force) {
    console.log('\n💡 Previous templates backed up to target .backup-{timestamp} directories.');
  }
}

function listTemplates(installedTargets: TemplateTarget[], versionInfo: VersionInfo | null): void {
  const installedTemplates = versionInfo?.templates ?? [];
  const effectiveTemplates =
    installedTemplates.length || versionInfo
      ? installedTemplates
      : installedTargets.length
        ? TEMPLATE_NAMES.map((template) => `${template}.prompt.md`)
        : [];
  const installedVersion =
    versionInfo?.version ?? (installedTargets.length ? '0.0.0' : 'Not installed');

  console.log('Available Templates:\n');
  console.log(`Installed Version: ${installedVersion}`);
  console.log(`Bundled Version:   ${BUNDLED_VERSION}\n`);

  const statusWidth = 15;
  const targetHeader = TARGETS.map((target) => TARGET_LABELS[target].padEnd(statusWidth)).join(' ');
  console.log(`  ${'Template'.padEnd(25)} ${targetHeader}`);

  for (const template of TEMPLATE_NAMES) {
    const filename = `${template}.prompt.md`;
    const baseName = displayTemplateName(template).padEnd(25);
    const statuses = TARGETS.map((target) => {
      const isInstalled =
        installedTargets.includes(target) && effectiveTemplates.includes(filename);
      if (!isInstalled) {
        return '✗ Not installed'.padEnd(statusWidth);
      }

      return installedVersion === BUNDLED_VERSION
        ? '✓ Up-to-date'.padEnd(statusWidth)
        : '⚠️ Outdated'.padEnd(statusWidth);
    }).join(' ');
    console.log(`  ${baseName} ${statuses}`);
  }

  if (installedVersion !== BUNDLED_VERSION && installedVersion !== 'Not installed') {
    console.log(`\n💡 Run 'specdeck upgrade' to update to v${BUNDLED_VERSION}`);
  }
}

function createBackup(targetDir: string, target: TemplateTarget): void {
  if (!existsSync(targetDir)) {
    return;
  }

  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const backupDir = join(targetDir, `.backup-${timestamp}`);

  mkdirSync(backupDir, { recursive: true });

  const extension = target === 'copilot' ? '.prompt.md' : '.md';
  const files = readdirSync(targetDir).filter(
    (f) => f.endsWith(extension) && !f.startsWith('.backup-')
  );

  for (const file of files) {
    const source = join(targetDir, file);
    const dest = join(backupDir, file);
    copyFileSync(source, dest);
  }

  console.log(`✓ Created backup in ${getTargetDirDisplay(target)}.backup-${timestamp}/\n`);
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

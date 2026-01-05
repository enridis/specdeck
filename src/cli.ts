#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createListCommand } from './commands/list';
import { createCreateCommand } from './commands/create';
import { createProposeCommand } from './commands/propose';
import { createValidateCommand } from './commands/validate';
import { createInitCommand } from './commands/init';
import { createUpgradeCommand } from './commands/upgrade';
import { createMigrateCommand } from './commands/migrate';
import { createServeCommand } from './commands/serve';
import { createOverlayCommand } from './commands/overlay';
import { createSyncCommand } from './commands/sync';
import { createValidateStoryIdsCommand } from './commands/validate-story-ids';
import { createJiraCommand } from './commands/jira';
import { createStoriesCommand } from './commands/stories';
import { createReleasesCommand } from './commands/releases';

// Read version from package.json
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8')) as {
  version: string;
};

const program = new Command();

program
  .name('specdeck')
  .description(
    'CLI tool for managing OpenSpec-Driven Delivery workflows. ' +
      'Supports single-repo and multi-repo coordinator modes.'
  )
  .version(packageJson.version, '-v, --version', 'Output the current version');

// Global options
program.option('--json', 'Output as JSON');
program.option('--verbose', 'Enable verbose logging');

// Register commands
program.addCommand(createListCommand());
program.addCommand(createCreateCommand());
program.addCommand(createProposeCommand());
program.addCommand(createValidateCommand());
program.addCommand(createValidateStoryIdsCommand());
program.addCommand(createInitCommand());
program.addCommand(createUpgradeCommand());
program.addCommand(createMigrateCommand());
program.addCommand(createServeCommand());
program.addCommand(createOverlayCommand());
program.addCommand(createSyncCommand());
program.addCommand(createJiraCommand());
program.addCommand(createStoriesCommand());
program.addCommand(createReleasesCommand());

// Parse arguments
program.parse(process.argv);

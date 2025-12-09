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

// Read version from package.json
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8')) as {
  version: string;
};

const program = new Command();

program
  .name('specdeck')
  .description('CLI tool for managing OpenSpec-Driven Delivery workflows')
  .version(packageJson.version, '-v, --version', 'Output the current version');

// Global options
program.option('--json', 'Output as JSON');
program.option('--verbose', 'Enable verbose logging');

// Register commands
program.addCommand(createListCommand());
program.addCommand(createCreateCommand());
program.addCommand(createProposeCommand());
program.addCommand(createValidateCommand());
program.addCommand(createInitCommand());
program.addCommand(createUpgradeCommand());
program.addCommand(createMigrateCommand());
program.addCommand(createServeCommand());

// Parse arguments
program.parse(process.argv);

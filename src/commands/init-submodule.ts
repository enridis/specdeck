import { execSync } from 'child_process';
import chalk from 'chalk';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { ConfigRepository } from '../repositories/config.repository';
import { SubmoduleConfig } from '../schemas/config.schema';

interface InitSubmoduleOptions {
  name?: string;
  visibility?: 'public' | 'private' | 'on-premises';
  branch?: string;
  noUpdate?: boolean;
}

/**
 * Initialize a git submodule and add it to SpecDeck coordinator configuration
 */
export async function initSubmodule(
  repoUrl: string,
  path: string,
  options: InitSubmoduleOptions
): Promise<void> {
  const cwd = process.cwd();

  // Step 1: Check if coordinator mode is enabled
  console.log(chalk.blue('🔍 Checking coordinator mode...'));
  const configRepo = new ConfigRepository(cwd);
  let config;
  try {
    config = await configRepo.read();
  } catch {
    console.error(
      chalk.red('✗ No SpecDeck configuration found. Run `specdeck init coordinator` first.')
    );
    process.exit(1);
  }

  if (!config.coordinator?.enabled) {
    console.error(
      chalk.red('✗ Coordinator mode is not enabled. Run `specdeck init coordinator` to enable it.')
    );
    process.exit(1);
  }

  // Step 2: Determine submodule name
  const submoduleName =
    options.name || path.split('/').pop() || repoUrl.split('/').pop()?.replace('.git', '');
  if (!submoduleName) {
    console.error(chalk.red('✗ Could not determine submodule name. Use --name option.'));
    process.exit(1);
  }

  // Step 3: Check if submodule already exists in config
  const existingSubmodules = config.coordinator.submodules || [];
  if (existingSubmodules.some((s) => s.name === submoduleName || s.path === path)) {
    console.error(
      chalk.red(`✗ Submodule "${submoduleName}" or path "${path}" already exists in configuration.`)
    );
    process.exit(1);
  }

  // Step 4: Add git submodule (or verify it exists)
  const submodulePath = join(cwd, path);
  const gitmodulesPath = join(cwd, '.gitmodules');
  const submoduleExistsInGit =
    existsSync(gitmodulesPath) &&
    readFileSync(gitmodulesPath, 'utf-8').includes(`[submodule "${path}"]`);

  if (submoduleExistsInGit) {
    console.log(chalk.yellow(`⚠ Git submodule already exists at ${path}, skipping git add...`));
  } else {
    console.log(chalk.blue(`📦 Adding git submodule: ${repoUrl} → ${path}`));
    try {
      const branchArg = options.branch ? `-b ${options.branch}` : '';
      execSync(`git submodule add ${branchArg} ${repoUrl} ${path}`, {
        cwd,
        stdio: 'inherit',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('already exists')) {
        console.log(chalk.yellow(`⚠ Submodule already exists, continuing...`));
      } else {
        console.error(chalk.red('✗ Failed to add git submodule'));
        throw error;
      }
    }
  }

  // Step 5: Initialize submodule (unless --no-update)
  if (!options.noUpdate) {
    console.log(chalk.blue('🔄 Initializing submodule...'));
    try {
      execSync(`git submodule update --init --recursive ${path}`, {
        cwd,
        stdio: 'inherit',
      });
    } catch (error) {
      console.error(chalk.red('✗ Failed to initialize submodule'));
      throw error;
    }
  }

  // Step 6: Add to SpecDeck config
  console.log(chalk.blue('⚙️  Updating SpecDeck configuration...'));
  const newSubmodule: SubmoduleConfig = {
    name: submoduleName,
    path,
    visibility: options.visibility || 'public',
  };

  const updatedSubmodules = [...existingSubmodules, newSubmodule];

  // Update config using ConfigRepository
  try {
    const updatedConfig = {
      ...config,
      coordinator: {
        ...config.coordinator,
        submodules: updatedSubmodules,
      },
    };
    await configRepo.write(updatedConfig);
    console.log(chalk.green('✓ Updated configuration'));
  } catch (error) {
    console.error(chalk.red('✗ Failed to update configuration'));
    throw error;
  }

  // Step 7: Create overlay directory structure
  const overlaysDir = config.coordinator.overlaysDir || 'overlays';
  const submoduleOverlayDir = join(cwd, overlaysDir, submoduleName);
  try {
    execSync(`mkdir -p "${submoduleOverlayDir}"`, { cwd });
    console.log(chalk.green(`✓ Created overlay directory: ${overlaysDir}/${submoduleName}`));
  } catch {
    // Directory might already exist, that's ok
  }

  // Step 8: Verify submodule has SpecDeck structure, initialize if missing
  const specdeckDir = join(submodulePath, 'specdeck');
  const submoduleConfigPath = join(submodulePath, '.specdeck.config.json');

  if (existsSync(specdeckDir) && existsSync(submoduleConfigPath)) {
    console.log(chalk.green(`✓ SpecDeck structure found in submodule`));
  } else {
    console.log(chalk.yellow(`⚠ No SpecDeck structure found in ${path}, initializing...`));

    try {
      // Run specdeck init copilot in the submodule directory to scaffold structure
      execSync('npx specdeck init copilot', {
        cwd: submodulePath,
        stdio: 'inherit',
      });
      console.log(chalk.green(`✓ SpecDeck structure initialized in submodule`));
    } catch (error) {
      console.log(
        chalk.yellow(
          `⚠ Warning: Failed to initialize SpecDeck in submodule. You may need to run 'specdeck init copilot' manually in ${path}.`
        )
      );
    }
  }

  // Success summary
  console.log(chalk.green('\n✓ Submodule initialized successfully!'));
  console.log(chalk.gray('\nNext steps:'));
  console.log(
    chalk.gray(`  1. Commit the changes: git commit -m "Add ${submoduleName} submodule"`)
  );
  console.log(chalk.gray(`  2. Sync stories: specdeck sync`));
  console.log(chalk.gray(`  3. Create overlays in: ${overlaysDir}/${submoduleName}/ (optional)`));
}

/**
 * Remove a submodule from git and SpecDeck configuration
 */
export async function removeSubmodule(nameOrPath: string): Promise<void> {
  const cwd = process.cwd();

  console.log(chalk.blue('🔍 Checking configuration...'));
  const configRepo = new ConfigRepository(cwd);
  const config = await configRepo.read();

  if (!config.coordinator?.enabled) {
    console.error(chalk.red('✗ Coordinator mode is not enabled.'));
    process.exit(1);
  }

  // Find submodule
  const submodules = config.coordinator.submodules || [];
  const submodule = submodules.find((s) => s.name === nameOrPath || s.path === nameOrPath);

  if (!submodule) {
    console.error(chalk.red(`✗ Submodule "${nameOrPath}" not found in configuration.`));
    process.exit(1);
  }

  // Remove from git
  console.log(chalk.blue(`🗑️  Removing git submodule: ${submodule.path}`));
  try {
    execSync(`git submodule deinit -f ${submodule.path}`, { cwd, stdio: 'inherit' });
    execSync(`git rm -f ${submodule.path}`, { cwd, stdio: 'inherit' });
    execSync(`rm -rf .git/modules/${submodule.path}`, { cwd, stdio: 'pipe' });
  } catch (error) {
    console.error(chalk.red('✗ Failed to remove git submodule'));
    throw error;
  }

  // Remove from config
  console.log(chalk.blue('⚙️  Updating SpecDeck configuration...'));
  const updatedSubmodules = submodules.filter(
    (s) => s.name !== submodule.name && s.path !== submodule.path
  );

  try {
    const updatedConfig = {
      ...config,
      coordinator: {
        ...config.coordinator,
        submodules: updatedSubmodules,
      },
    };
    await configRepo.write(updatedConfig);
    console.log(chalk.green('✓ Updated configuration'));
  } catch (error) {
    console.error(chalk.red('✗ Failed to update configuration'));
    throw error;
  }

  console.log(chalk.green(`\n✓ Submodule "${submodule.name}" removed successfully!`));
  console.log(chalk.gray('\nNext step: git commit -m "Remove submodule"'));
}

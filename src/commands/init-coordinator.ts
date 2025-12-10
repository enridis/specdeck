import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { ConfigRepository } from '../repositories';

/**
 * Initialize coordinator mode for a repository
 */
export async function initCoordinatorMode(): Promise<void> {
  const rootPath = process.cwd();
  const configRepo = new ConfigRepository(rootPath);

  try {
    // Create directories
    const overlaysDir = join(rootPath, 'specdeck', 'overlays');
    const cacheDir = join(rootPath, '.specdeck-cache');
    const specdeckDir = join(rootPath, 'specdeck');

    if (!existsSync(overlaysDir)) {
      mkdirSync(overlaysDir, { recursive: true });
      console.log(`✓ Created overlays directory: specdeck/overlays/`);
    }

    if (!existsSync(cacheDir)) {
      mkdirSync(cacheDir, { recursive: true });
      console.log(`✓ Created cache directory: .specdeck-cache/`);
    }

    if (!existsSync(specdeckDir)) {
      mkdirSync(specdeckDir, { recursive: true });
      console.log(`✓ Created specdeck directory: specdeck/`);
    }

    // Create/update configuration
    let config = await configRepo.read();

    config = {
      ...config,
      coordinator: {
        enabled: true,
        submodules: [],
        overlaysDir: './specdeck/overlays',
        cacheDir: './.specdeck-cache',
      },
    };

    await configRepo.write(config);
    console.log('✓ Updated .specdeck.config.json with coordinator mode');

    // Add .specdeck-cache to .gitignore
    const fs = await import('fs/promises');
    const gitignorePath = join(rootPath, '.gitignore');
    let gitignoreContent = '';

    if (existsSync(gitignorePath)) {
      gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
    }

    if (!gitignoreContent.includes('.specdeck-cache')) {
      const newEntry = gitignoreContent.endsWith('\n')
        ? '.specdeck-cache/\n'
        : '\n.specdeck-cache/\n';
      await fs.appendFile(gitignorePath, newEntry);
      console.log('✓ Added .specdeck-cache/ to .gitignore');
    }

    console.log('\n📋 Next steps:');
    console.log('1. Add Git submodules to mount your repositories:');
    console.log('   git submodule add <repo-url> submodules/<repo-name>');
    console.log('\n2. Update .specdeck.config.json to list submodules in coordinator section');
    console.log('\n3. Run sync to aggregate stories:');
    console.log('   specdeck sync');
  } catch (error) {
    throw new Error(
      `Failed to initialize coordinator: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

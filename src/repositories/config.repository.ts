import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { Config, ConfigSchema } from '../schemas';

export class ConfigRepository {
  private static readonly CONFIG_FILE = '.specdeck.config.json';

  constructor(private readonly rootPath: string) {}

  /**
   * Read configuration from .specdeck.config.json
   */
  async read(): Promise<Config> {
    const configPath = join(this.rootPath, ConfigRepository.CONFIG_FILE);

    if (!existsSync(configPath)) {
      return this.getDefaultConfig();
    }

    try {
      const content = await readFile(configPath, 'utf-8');
      const rawConfig: unknown = JSON.parse(content);
      const config = ConfigSchema.parse(rawConfig);

      // Deprecation warning for openspecDir
      if (config.openspecDir) {
        console.warn('\x1b[33m⚠️  Warning: openspecDir is deprecated.\x1b[0m');
        console.warn(
          '\x1b[2m   Use specdeckDir for all planning artifacts (releases, features, stories).\x1b[0m'
        );
        console.warn('\x1b[2m   Run `specdeck migrate` to consolidate folder structure.\x1b[0m\n');
      }

      return config;
    } catch (error) {
      throw new Error(
        `Failed to read config: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Write configuration to .specdeck.config.json
   */
  async write(config: Config): Promise<void> {
    const configPath = join(this.rootPath, ConfigRepository.CONFIG_FILE);

    try {
      const validated = ConfigSchema.parse(config);
      const content = JSON.stringify(validated, null, 2);
      await writeFile(configPath, content, 'utf-8');
    } catch (error) {
      throw new Error(
        `Failed to write config: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): Config {
    return {
      specdeckDir: './specdeck',
      repos: [],
    };
  }
}

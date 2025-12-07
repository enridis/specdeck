import { readFileSync, writeFileSync, existsSync } from 'fs';
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
      const content = readFileSync(configPath, 'utf-8');
      const rawConfig = JSON.parse(content);
      return ConfigSchema.parse(rawConfig);
    } catch (error) {
      throw new Error(`Failed to read config: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      writeFileSync(configPath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): Config {
    return {
      openspecDir: './openspec',
      repos: [],
    };
  }
}

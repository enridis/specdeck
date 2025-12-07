import { readFile } from 'fs/promises';
import { existsSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';
import { Release, ReleaseSchema } from '../schemas';
import { parseMarkdown, extractFrontMatter } from '../parsers';

export class ReleaseRepository {
  constructor(private readonly releasesDir: string) {}

  /**
   * Read all releases from the releases directory
   */
  async readAll(): Promise<Release[]> {
    if (!existsSync(this.releasesDir)) {
      return [];
    }

    const files = readdirSync(this.releasesDir);
    const releases: Release[] = [];

    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const filePath = join(this.releasesDir, file);
      const stats = statSync(filePath);

      if (!stats.isFile()) continue;

      try {
        const release = await this.readFromFile(filePath);
        if (release) {
          releases.push(release);
        }
      } catch (error) {
        console.warn(
          `Failed to read release ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return releases;
  }

  /**
   * Find a release by ID
   */
  async findById(id: string): Promise<Release | null> {
    const filePath = join(this.releasesDir, `${id}.md`);
    return this.readFromFile(filePath);
  }

  /**
   * Read a release from a markdown file
   */
  private async readFromFile(filePath: string): Promise<Release | null> {
    if (!existsSync(filePath)) {
      return null;
    }

    const content = await readFile(filePath, 'utf-8');
    const ast = parseMarkdown(content);
    const frontMatter = extractFrontMatter<Record<string, unknown>>(ast);

    if (!frontMatter) {
      throw new Error(`No YAML front matter found in ${filePath}`);
    }

    const releaseId = basename(filePath, '.md');

    const release = ReleaseSchema.parse({
      id: frontMatter.id || releaseId,
      title: frontMatter.title,
      timeframe: frontMatter.timeframe,
      objectives: Array.isArray(frontMatter.objectives) ? frontMatter.objectives : [],
      successMetrics: Array.isArray(frontMatter.successMetrics) ? frontMatter.successMetrics : [],
      features: Array.isArray(frontMatter.features) ? frontMatter.features : [],
    });

    return release;
  }
}

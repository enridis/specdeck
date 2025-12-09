import { readFile, writeFile, mkdir, unlink } from 'fs/promises';
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

  /**
   * Create a new release
   */
  async create(release: Release): Promise<Release> {
    // Validate the release
    const validated = ReleaseSchema.parse(release);

    const filePath = join(this.releasesDir, `${validated.id}.md`);
    const releaseDir = join(this.releasesDir, validated.id);

    // Check if release already exists
    if (existsSync(filePath)) {
      throw new Error(`Release ${validated.id} already exists`);
    }

    // Ensure releases directory exists
    await mkdir(this.releasesDir, { recursive: true });

    // Generate markdown content
    const content = this.generateMarkdown(validated);

    // Write atomically using temp file
    const tempPath = `${filePath}.tmp`;
    await writeFile(tempPath, content, 'utf-8');
    await writeFile(filePath, content, 'utf-8');
    await unlink(tempPath).catch(() => {}); // Clean up temp file

    // Create release directory for features
    await mkdir(releaseDir, { recursive: true });

    return validated;
  }

  /**
   * Update an existing release
   */
  async update(id: string, updates: Partial<Release>): Promise<Release> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Release ${id} not found`);
    }

    // Merge updates with existing data
    const updated = ReleaseSchema.parse({
      ...existing,
      ...updates,
      id: existing.id, // Prevent ID changes
    });

    const filePath = join(this.releasesDir, `${id}.md`);
    const content = this.generateMarkdown(updated);

    // Write atomically
    const tempPath = `${filePath}.tmp`;
    await writeFile(tempPath, content, 'utf-8');
    await writeFile(filePath, content, 'utf-8');
    await unlink(tempPath).catch(() => {});

    return updated;
  }

  /**
   * Delete a release
   */
  async delete(id: string): Promise<void> {
    const filePath = join(this.releasesDir, `${id}.md`);

    if (!existsSync(filePath)) {
      throw new Error(`Release ${id} not found`);
    }

    await unlink(filePath);

    // Note: We don't delete the release directory or feature files
    // This should be handled at a higher level or require explicit confirmation
  }

  /**
   * Generate markdown content for a release
   */
  private generateMarkdown(release: Release): string {
    const lines: string[] = [];

    // YAML front matter
    lines.push('---');
    lines.push(`id: ${release.id}`);
    lines.push(`title: ${release.title}`);
    if (release.timeframe) {
      lines.push(`timeframe: ${release.timeframe}`);
    }
    lines.push('---');
    lines.push('');

    // Title
    lines.push(`# Release: ${release.title}`);
    lines.push('');

    // Objectives
    if (release.objectives && release.objectives.length > 0) {
      lines.push('## Objectives');
      lines.push('');
      release.objectives.forEach((obj) => {
        lines.push(`- ${obj}`);
      });
      lines.push('');
    }

    // Success Metrics
    if (release.successMetrics && release.successMetrics.length > 0) {
      lines.push('## Success Metrics');
      lines.push('');
      release.successMetrics.forEach((metric) => {
        lines.push(`- ${metric}`);
      });
      lines.push('');
    }

    // Features
    if (release.features && release.features.length > 0) {
      lines.push('## Features');
      lines.push('');
      release.features.forEach((feature) => {
        lines.push(`- **${feature}**`);
      });
      lines.push('');
    }

    return lines.join('\n');
  }
}

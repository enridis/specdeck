import { readFile, writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';
import { Release, ReleaseSchema } from '../schemas';
import { parseMarkdown, extractFrontMatter, findSection } from '../parsers';
import { FeatureRepository } from './feature.repository';
import { Content, ListItem } from 'mdast';

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

    const objectives = Array.isArray(frontMatter.objectives)
      ? frontMatter.objectives
      : extractListSection(ast, 'Objectives');
    const successMetrics = Array.isArray(frontMatter.successMetrics)
      ? frontMatter.successMetrics
      : extractListSection(ast, 'Success Metrics');
    const features = Array.isArray(frontMatter.features)
      ? frontMatter.features
      : await extractFeatureIds(content, releaseId);

    const release = ReleaseSchema.parse({
      id: frontMatter.id || releaseId,
      title: frontMatter.title,
      timeframe: frontMatter.timeframe,
      objectives,
      successMetrics,
      features,
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
    lines.push('## Objectives');
    lines.push('');
    if (release.objectives && release.objectives.length > 0) {
      release.objectives.forEach((obj) => {
        lines.push(`- ${obj}`);
      });
    } else {
      lines.push('- [Add release objectives here]');
    }
    lines.push('');

    // Success Metrics
    lines.push('## Success Metrics');
    lines.push('');
    if (release.successMetrics && release.successMetrics.length > 0) {
      release.successMetrics.forEach((metric) => {
        lines.push(`- ${metric}`);
      });
    } else {
      lines.push('- [Add success metrics here]');
    }
    lines.push('');

    // Features
    lines.push('## Features');
    lines.push('');
    if (release.features && release.features.length > 0) {
      release.features.forEach((feature) => {
        lines.push(`- **${feature}**`);
      });
    } else {
      lines.push('- **FEATURE-01**: [Feature Title]');
      lines.push('  - [Feature description]');
      lines.push('  - [Key capabilities]');
    }
    lines.push('');

    // Dependencies
    lines.push('## Dependencies');
    lines.push('');
    lines.push('- [List dependencies on other releases, teams, or external factors]');
    lines.push('');

    // Risks
    lines.push('## Risks');
    lines.push('');
    lines.push('### Risk 1: [Risk Title]');
    lines.push('');
    lines.push('**Likelihood**: [Low/Medium/High] | **Impact**: [Low/Medium/High]');
    lines.push('');
    lines.push('**Description**: [Describe the risk]');
    lines.push('');
    lines.push('**Mitigation**: [How to mitigate this risk]');
    lines.push('');

    // Timeline
    lines.push('## Timeline');
    lines.push('');
    lines.push('- **Planning**: [Dates]');
    lines.push('- **Development**: [Dates]');
    lines.push('- **Testing**: [Dates]');
    lines.push('- **Release**: [Target date]');
    lines.push('');

    return lines.join('\n');
  }
}

function extractListSection(ast: ReturnType<typeof parseMarkdown>, heading: string): string[] {
  const section = findSection(ast, heading);
  return extractListItems(section);
}

function extractListItems(nodes: Content[]): string[] {
  const results: string[] = [];
  for (const node of nodes) {
    if (node.type === 'list') {
      const list = node;
      for (const item of list.children) {
        results.push(extractListItemText(item));
      }
    }
  }
  return results.filter((value) => value.length > 0);
}

function extractListItemText(item: ListItem): string {
  if (!item.children || item.children.length === 0) {
    return '';
  }

  return item.children
    .map((child) => extractTextFromNode(child as Content))
    .join('')
    .trim();
}

function extractTextFromNode(node: Content): string {
  if (node.type === 'text') {
    return 'value' in node ? String(node.value) : '';
  }

  if (node.type === 'inlineCode') {
    return 'value' in node ? String(node.value) : '';
  }

  if ('children' in node) {
    return (node.children as Content[]).map(extractTextFromNode).join('');
  }

  return '';
}

async function extractFeatureIds(content: string, releaseId: string): Promise<string[]> {
  const featureRepository = new FeatureRepository();
  const features = await featureRepository.extractFromRelease(content, releaseId);
  return features.map((feature) => feature.id);
}

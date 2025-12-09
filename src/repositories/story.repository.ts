import { readFile, readdir, writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { join, basename } from 'path';
import { Story, StorySchema } from '../schemas';
import { parseMarkdown, extractTables, parseTableAsObjects } from '../parsers';
import { deriveFeatureIdFromStoryId } from '../utils/story.utils';

export interface StoryFilter {
  status?: string[];
  complexity?: string[];
  feature?: string;
  owner?: string;
  milestone?: string;
  release?: string;
}

/**
 * StoryRepository reads stories from feature-based file structure:
 * specdeck/releases/R1-foundation/CLI-CORE.md
 * specdeck/releases/R1-foundation/REL-01.md
 */
export class StoryRepository {
  constructor(private readonly releasesDir: string) {}

  /**
   * Read all stories from all releases and features
   */
  async readAll(filter?: StoryFilter): Promise<Story[]> {
    if (!existsSync(this.releasesDir)) {
      return [];
    }

    const allStories: Story[] = [];

    // If filtering by release, only read that release's features
    if (filter?.release) {
      const releaseStories = await this.readReleaseStories(filter.release, filter?.feature);
      allStories.push(...releaseStories);
    } else {
      // Read all releases
      const entries = await readdir(this.releasesDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const releaseId = entry.name;
          const releaseStories = await this.readReleaseStories(releaseId, filter?.feature);
          allStories.push(...releaseStories);
        }
      }
    }

    // Apply filters
    return this.applyFilters(allStories, filter);
  }

  /**
   * Read stories for a specific release
   */
  private async readReleaseStories(releaseId: string, featureId?: string): Promise<Story[]> {
    const releaseDir = join(this.releasesDir, releaseId);

    if (!existsSync(releaseDir)) {
      return [];
    }

    const stories: Story[] = [];

    if (featureId) {
      // Read single feature file
      const featureStories = await this.readFeatureFile(releaseId, featureId);
      stories.push(...featureStories);
    } else {
      // Read all feature files in the release directory
      const files = await readdir(releaseDir);
      const markdownFiles = files.filter((f) => f.endsWith('.md'));

      for (const file of markdownFiles) {
        const fileFeatureId = basename(file, '.md');
        const featureStories = await this.readFeatureFile(releaseId, fileFeatureId);
        stories.push(...featureStories);
      }
    }

    return stories;
  }

  /**
   * Read stories from a single feature file
   */
  private async readFeatureFile(releaseId: string, featureId: string): Promise<Story[]> {
    const featureFilePath = join(this.releasesDir, releaseId, `${featureId}.md`);

    if (!existsSync(featureFilePath)) {
      return [];
    }

    try {
      const content = await readFile(featureFilePath, 'utf-8');

      // Extract front matter to get release and feature IDs
      const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      const fileFrontMatter: Record<string, string> = {};

      if (frontMatterMatch) {
        const frontMatterLines = frontMatterMatch[1].split('\n');
        for (const line of frontMatterLines) {
          const [key, ...valueParts] = line.split(':');
          if (key && valueParts.length > 0) {
            fileFrontMatter[key.trim()] = valueParts.join(':').trim();
          }
        }
      }

      const fileReleaseId = fileFrontMatter['release'] || releaseId;
      const fileFeatureId = fileFrontMatter['feature'] || featureId;

      // Parse markdown and extract stories table
      const ast = parseMarkdown(content);
      const tables = extractTables(ast);

      if (tables.length === 0) {
        return [];
      }

      // Parse the stories table
      const rawStories = parseTableAsObjects(tables[0]);
      const stories: Story[] = [];

      for (const raw of rawStories) {
        try {
          const storyId = raw['ID'] || raw['id'];

          // Derive featureId from story ID if not explicit
          const derivedFeatureId = deriveFeatureIdFromStoryId(storyId);

          const story = StorySchema.parse({
            id: storyId,
            title: raw['Title'] || raw['title'],
            featureId: raw['Feature'] || raw['feature'] || fileFeatureId || derivedFeatureId,
            releaseId: raw['Release'] || raw['release'] || fileReleaseId,
            status: raw['Status'] || raw['status'] || 'planned',
            complexity: raw['Complexity'] || raw['complexity'],
            estimate: raw['Estimate'] ? parseInt(raw['Estimate'], 10) : undefined,
            owner: raw['Owner'] || raw['owner'],
            jira: raw['Jira'] || raw['jira'],
            openspec: raw['OpenSpec'] || raw['openspec'],
            tags: raw['Tags'] ? raw['Tags'].split(',').map((t) => t.trim()) : [],
            notes: raw['Notes'] || raw['notes'],
            milestone: raw['Milestone'] || raw['milestone'],
          });

          stories.push(story);
        } catch (error) {
          // Skip invalid stories
          console.warn(
            `Skipping invalid story in ${featureFilePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      return stories;
    } catch (error) {
      console.warn(`Error reading feature file ${featureFilePath}:`, error);
      return [];
    }
  }

  /**
   * Apply filters to stories
   */
  private applyFilters(stories: Story[], filter?: StoryFilter): Story[] {
    if (!filter) return stories;

    return stories.filter((story) => {
      if (filter.status && !filter.status.includes(story.status)) return false;
      if (filter.complexity && !filter.complexity.includes(story.complexity)) return false;
      if (filter.owner && story.owner !== filter.owner) return false;
      if (filter.milestone && story.milestone !== filter.milestone) return false;
      if (filter.feature && story.featureId !== filter.feature) return false;
      if (filter.release && story.releaseId !== filter.release) return false;
      return true;
    });
  }

  /**
   * Find a story by ID
   */
  async findById(id: string): Promise<Story | null> {
    const stories = await this.readAll();
    return stories.find((s) => s.id === id) || null;
  }

  /**
   * Find stories by feature ID
   */
  async findByFeature(featureId: string): Promise<Story[]> {
    return this.readAll({ feature: featureId });
  }

  /**
   * Find stories by release ID
   */
  async findByRelease(releaseId: string): Promise<Story[]> {
    return this.readAll({ release: releaseId });
  }

  /**
   * Update an existing story
   */
  async update(id: string, updates: Partial<Story>): Promise<Story> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Story ${id} not found`);
    }

    // Merge updates with existing data
    const merged = {
      ...existing,
      ...updates,
      id: existing.id, // Prevent ID changes
    };

    // Validate the complete merged object
    const updated = StorySchema.parse(merged);

    // Determine old and new feature/release
    const oldFeatureId = existing.featureId || deriveFeatureIdFromStoryId(id);
    const oldReleaseId = existing.releaseId || 'R1-foundation';
    const newFeatureId = updated.featureId || deriveFeatureIdFromStoryId(id);
    const newReleaseId = updated.releaseId || 'R1-foundation';

    // Check if story is moving to a different feature or release
    const isMoving = oldFeatureId !== newFeatureId || oldReleaseId !== newReleaseId;

    if (isMoving) {
      // Remove from old feature file
      await this.deleteFromFeatureFile(oldReleaseId, oldFeatureId, id);
      // Add to new feature file
      await this.updateFeatureFile(newReleaseId, newFeatureId, updated, true);
    } else {
      // Update in the same feature file
      await this.updateFeatureFile(newReleaseId, newFeatureId, updated);
    }

    return updated;
  }

  /**
   * Create a new story
   */
  async create(story: Story): Promise<Story> {
    const validated = StorySchema.parse(story);

    // Determine feature and release
    const featureId = validated.featureId || deriveFeatureIdFromStoryId(validated.id);
    const releaseId = validated.releaseId || 'R1-foundation'; // Default release

    // Check if story already exists
    const existing = await this.findById(validated.id);
    if (existing) {
      throw new Error(`Story ${validated.id} already exists`);
    }

    // Add to feature file
    await this.updateFeatureFile(releaseId, featureId, validated, true);

    return validated;
  }

  /**
   * Delete a story
   */
  async delete(id: string): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Story ${id} not found`);
    }

    const featureId = existing.featureId || deriveFeatureIdFromStoryId(id);
    const releaseId = existing.releaseId || 'R1-foundation';

    await this.deleteFromFeatureFile(releaseId, featureId, id);
  }

  /**
   * Update a feature file with story changes
   */
  private async updateFeatureFile(
    releaseId: string,
    featureId: string,
    story: Story,
    isNew: boolean = false
  ): Promise<void> {
    const featureFilePath = join(this.releasesDir, releaseId, `${featureId}.md`);

    // Ensure release directory exists
    const releaseDir = join(this.releasesDir, releaseId);
    await mkdir(releaseDir, { recursive: true });

    let content = '';
    let existingStories: Story[] = [];

    if (existsSync(featureFilePath)) {
      content = await readFile(featureFilePath, 'utf-8');
      existingStories = await this.readFeatureFile(releaseId, featureId);
    } else {
      // Create new feature file with basic structure
      content = this.createFeatureFileTemplate(releaseId, featureId);
    }

    // Update or add the story in the list
    const storyIndex = existingStories.findIndex((s) => s.id === story.id);
    if (storyIndex >= 0) {
      existingStories[storyIndex] = story;
    } else if (isNew) {
      existingStories.push(story);
    }

    // Regenerate the feature file with updated stories
    const updatedContent = this.regenerateFeatureFile(content, existingStories);

    // Write atomically
    const tempPath = `${featureFilePath}.tmp`;
    await writeFile(tempPath, updatedContent, 'utf-8');
    await writeFile(featureFilePath, updatedContent, 'utf-8');
    await unlink(tempPath).catch(() => {}); // Clean up temp file
  }

  /**
   * Delete a story from a feature file
   */
  private async deleteFromFeatureFile(
    releaseId: string,
    featureId: string,
    storyId: string
  ): Promise<void> {
    const featureFilePath = join(this.releasesDir, releaseId, `${featureId}.md`);

    if (!existsSync(featureFilePath)) {
      throw new Error(`Feature file not found: ${featureFilePath}`);
    }

    const content = await readFile(featureFilePath, 'utf-8');
    const existingStories = await this.readFeatureFile(releaseId, featureId);

    // Remove the story
    const filteredStories = existingStories.filter((s) => s.id !== storyId);
    // Regenerate the feature file
    const updatedContent = this.regenerateFeatureFile(content, filteredStories);

    // Write atomically
    const tempPath = `${featureFilePath}.tmp`;
    await writeFile(tempPath, updatedContent, 'utf-8');
    await writeFile(featureFilePath, updatedContent, 'utf-8');
    await unlink(tempPath).catch(() => {}); // Clean up temp file
  }

  /**
   * Create a basic feature file template
   */
  private createFeatureFileTemplate(
    releaseId: string,
    featureId: string,
    jiraEpic?: string
  ): string {
    const jiraEpicLine = jiraEpic ? `\njira_epic: ${jiraEpic}` : '';
    return `---
release: ${releaseId}
feature: ${featureId}${jiraEpicLine}
---

# Feature: ${featureId}

## Stories

| ID | Title | Status | Complexity | Estimate | Owner | Milestone | Jira | OpenSpec | Tags | Notes |
|----|-------|--------|------------|----------|-------|-----------|------|----------|------|-------|

`;
  }

  /**
   * Regenerate feature file content with updated stories table
   */
  private regenerateFeatureFile(originalContent: string, stories: Story[]): string {
    // Extract everything before the stories table
    const tableStartRegex = /\|\s*ID\s*\|/i;
    const tableMatch = originalContent.match(tableStartRegex);

    let beforeTable = originalContent;
    let afterTable = '';

    if (tableMatch && tableMatch.index !== undefined) {
      beforeTable = originalContent.substring(0, tableMatch.index);

      // Find the end of the table (first non-table line after header)
      const contentAfterTable = originalContent.substring(tableMatch.index);
      const lines = contentAfterTable.split('\n');

      let tableEndIndex = 0;
      let inTable = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('|')) {
          inTable = true;
          tableEndIndex = i + 1;
        } else if (inTable && line.length > 0 && !line.startsWith('|')) {
          break;
        }
      }

      if (tableEndIndex < lines.length) {
        afterTable = '\n' + lines.slice(tableEndIndex).join('\n');
      }
    }

    // Generate the new table
    const tableLines: string[] = [];
    tableLines.push(
      '| ID | Title | Status | Complexity | Estimate | Owner | Milestone | Jira | OpenSpec | Tags | Notes |'
    );
    tableLines.push(
      '|----|-------|--------|------------|----------|-------|-----------|------|----------|------|-------|'
    );

    for (const story of stories) {
      const tags = story.tags?.join(', ') || '';
      tableLines.push(
        `| ${story.id} | ${story.title} | ${story.status} | ${story.complexity || ''} | ${story.estimate || ''} | ${story.owner || ''} | ${story.milestone || ''} | ${story.jira || ''} | ${story.openspec || ''} | ${tags} | ${story.notes || ''} |`
      );
    }

    return beforeTable + tableLines.join('\n') + afterTable;
  }
}

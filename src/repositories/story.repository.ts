import { readFile, readdir } from 'fs/promises';
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
}

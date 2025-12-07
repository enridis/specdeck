import { readFileSync, existsSync } from 'fs';
import { Story, StorySchema } from '../schemas';
import { parseMarkdown, extractTables, parseTableAsObjects } from '../parsers';

export interface StoryFilter {
  status?: string[];
  complexity?: string[];
  feature?: string;
  owner?: string;
  milestone?: string;
}

export class StoryRepository {
  constructor(private readonly projectPlanPath: string) {}

  /**
   * Read all stories from project-plan.md
   */
  async readAll(filter?: StoryFilter): Promise<Story[]> {
    if (!existsSync(this.projectPlanPath)) {
      throw new Error(`Project plan not found: ${this.projectPlanPath}`);
    }

    const content = readFileSync(this.projectPlanPath, 'utf-8');
    const ast = parseMarkdown(content);
    const tables = extractTables(ast);

    if (tables.length === 0) {
      return [];
    }

    // Parse first table as stories
    const rawStories = parseTableAsObjects(tables[0]);
    const stories: Story[] = [];

    for (const raw of rawStories) {
      try {
        const story = StorySchema.parse({
          id: raw['ID'] || raw['id'],
          title: raw['Title'] || raw['title'],
          status: raw['Status'] || raw['status'] || 'planned',
          complexity: raw['Complexity'] || raw['complexity'],
          estimate: raw['Estimate'] ? parseInt(raw['Estimate'], 10) : undefined,
          owner: raw['Owner'] || raw['owner'],
          jira: raw['Jira'] || raw['jira'],
          openspec: raw['OpenSpec'] || raw['openspec'],
          tags: raw['Tags'] ? raw['Tags'].split(',').map(t => t.trim()) : [],
          notes: raw['Notes'] || raw['notes'],
          milestone: raw['Milestone'] || raw['milestone'],
        });

        // Apply filters
        if (filter) {
          if (filter.status && !filter.status.includes(story.status)) continue;
          if (filter.complexity && !filter.complexity.includes(story.complexity)) continue;
          if (filter.owner && story.owner !== filter.owner) continue;
          if (filter.milestone && story.milestone !== filter.milestone) continue;
          if (filter.feature) {
            const featurePrefix = filter.feature.toUpperCase();
            if (!story.id.startsWith(featurePrefix)) continue;
          }
        }

        stories.push(story);
      } catch (error) {
        // Skip invalid stories
        console.warn(`Skipping invalid story: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return stories;
  }

  /**
   * Find a story by ID
   */
  async findById(id: string): Promise<Story | null> {
    const stories = await this.readAll();
    return stories.find(s => s.id === id) || null;
  }

  /**
   * Find stories by feature prefix
   */
  async findByFeature(featureId: string): Promise<Story[]> {
    return this.readAll({ feature: featureId });
  }
}

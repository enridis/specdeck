import { join } from 'path';
import { Story } from '../schemas';
import { StoryRepository, StoryFilter } from '../repositories';

export class StoryService {
  private repository: StoryRepository;

  constructor(specdeckDir: string) {
    // Use feature-based structure: specdeck/releases/R1-foundation/ directory
    const releasesDir = join(specdeckDir, 'releases');
    this.repository = new StoryRepository(releasesDir);
  }

  /**
   * Get all stories with optional filtering
   */
  async listStories(filter?: StoryFilter): Promise<Story[]> {
    return this.repository.readAll(filter);
  }

  /**
   * Get a specific story by ID
   */
  async getStory(id: string): Promise<Story | null> {
    return this.repository.findById(id);
  }

  /**
   * Get stories for a specific feature
   */
  async getStoriesByFeature(featureId: string): Promise<Story[]> {
    return this.repository.findByFeature(featureId);
  }

  /**
   * Get story statistics
   */
  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byComplexity: Record<string, number>;
    totalPoints: number;
    pointsByStatus: Record<string, number>;
  }> {
    const stories = await this.listStories();

    const byStatus: Record<string, number> = {};
    const byComplexity: Record<string, number> = {};
    const pointsByStatus: Record<string, number> = {
      done: 0,
      in_progress: 0,
      planned: 0,
      in_review: 0,
      blocked: 0,
    };
    let totalPoints = 0;

    for (const story of stories) {
      byStatus[story.status] = (byStatus[story.status] || 0) + 1;
      byComplexity[story.complexity] = (byComplexity[story.complexity] || 0) + 1;

      if (story.estimate) {
        totalPoints += story.estimate;
        if (Object.prototype.hasOwnProperty.call(pointsByStatus, story.status)) {
          pointsByStatus[story.status] += story.estimate;
        }
      }
    }

    return {
      total: stories.length,
      byStatus,
      byComplexity,
      totalPoints,
      pointsByStatus,
    };
  }

  /**
   * Create a new story
   */
  async createStory(story: Story): Promise<Story> {
    return this.repository.create(story);
  }

  /**
   * Update an existing story
   */
  async updateStory(id: string, updates: Partial<Story>): Promise<Story> {
    return this.repository.update(id, updates);
  }

  /**
   * Delete a story
   */
  async deleteStory(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}

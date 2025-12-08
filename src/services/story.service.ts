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
  }> {
    const stories = await this.listStories();

    const byStatus: Record<string, number> = {};
    const byComplexity: Record<string, number> = {};
    let totalPoints = 0;

    for (const story of stories) {
      byStatus[story.status] = (byStatus[story.status] || 0) + 1;
      byComplexity[story.complexity] = (byComplexity[story.complexity] || 0) + 1;

      if (story.estimate) {
        totalPoints += story.estimate;
      }
    }

    return {
      total: stories.length,
      byStatus,
      byComplexity,
      totalPoints,
    };
  }
}

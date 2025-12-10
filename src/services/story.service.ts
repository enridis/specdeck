import { join } from 'path';
import { Story } from '../schemas';
import { StoryRepository, StoryFilter, ConfigRepository, OverlayRepository } from '../repositories';
import { readCache, isCacheStale } from '../utils/cache.utils';
import { CacheStory } from '../schemas/cache.schema';
import { CoordinatorService } from './coordinator.service';

interface StoriesWithMetadata extends Array<Story> {
  cacheStale?: boolean;
  cachedAt?: string;
}

export class StoryService {
  private repository: StoryRepository;
  private configRepository: ConfigRepository;

  constructor(specdeckDir: string, rootPath?: string) {
    // Use feature-based structure: specdeck/releases/R1-foundation/ directory
    const releasesDir = join(specdeckDir, 'releases');
    this.repository = new StoryRepository(releasesDir);
    // ConfigRepository needs the project root to find .specdeck.config.json
    this.configRepository = new ConfigRepository(rootPath || process.cwd());
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
   * Get stories for a specific feature (cache-aware)
   */
  async getStoriesByFeatureWithCache(featureId: string): Promise<Story[]> {
    const isCoordinator = await this.configRepository.isCoordinatorMode();
    if (!isCoordinator) {
      return this.getStoriesByFeature(featureId);
    }

    // In coordinator mode, filter cached stories by featureId
    const allStories = await this.listStoriesWithCache();
    return allStories.filter((story) => story.featureId === featureId);
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
    // Use cache if in coordinator mode
    const stories = await this.listStoriesWithCache();

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

  /**
   * List stories from cache in coordinator mode
   *
   * Reads aggregated stories from cache with optional filtering.
   * Falls back to repository if cache is not available.
   *
   * @param filter Optional filter criteria
   * @param options Query options (useCache, checkStale)
   * @returns Cached stories or repository stories
   */
  async listStoriesWithCache(
    filter?: StoryFilter & { repo?: string; withJira?: boolean; ids?: string[] },
    options?: { useCache?: boolean; checkStale?: boolean }
  ): Promise<Story[]> {
    const useCache = options?.useCache ?? true;
    const checkStale = options?.checkStale ?? true;

    try {
      const isCoordinator = await this.configRepository.isCoordinatorMode();

      // Non-coordinator or cache bypass without overlay enrichment
      if (!isCoordinator || (!useCache && !filter?.withJira)) {
        const stories = await this.repository.readAll(filter);
        return this.applyFilters(stories, filter);
      }

      // Live read with overlays applied (coordinator + no-cache)
      if (!useCache) {
        const overlayRepo = new OverlayRepository(await this.configRepository.getOverlaysDir());
        const coordinator = new CoordinatorService(this.configRepository, overlayRepo);
        const aggregated = await coordinator.aggregateStories();
        const enriched = await coordinator.applyOverlays(aggregated);
        return this.applyFilters(enriched, filter);
      }

      // Read from cache
      const cacheDir = await this.configRepository.getCacheDir();
      const cache = await readCache(cacheDir);

      if (!cache) {
        // No cache available, fall back to repository
        const stories = await this.repository.readAll(filter);
        return this.applyFilters(stories, filter);
      }

      // Check cache staleness if requested
      let stale = false;
      if (checkStale) {
        stale = await isCacheStale(cacheDir, 24); // 24-hour threshold
      }

      const stories: Story[] = this.applyFilters(cache.stories, filter);

      if (stale) {
        const storiesWithMeta = stories as StoriesWithMetadata;
        storiesWithMeta.cacheStale = true;
        storiesWithMeta.cachedAt = cache.syncedAt;
        return storiesWithMeta;
      }

      return stories;
    } catch (error) {
      // Error accessing coordinator config, fall back to repository
      const stories = await this.repository.readAll(filter);
      return this.applyFilters(stories, filter);
    }
  }

  /**
   * Get cache staleness info for coordinator mode
   *
   * @returns Cache age description or null if no cache
   */
  async getCacheInfo(): Promise<{
    isCached: boolean;
    isStale: boolean;
    age?: string;
    syncedAt?: string;
  }> {
    try {
      const isCoordinator = await this.configRepository.isCoordinatorMode();
      if (!isCoordinator) {
        return { isCached: false, isStale: false };
      }

      const cacheDir = await this.configRepository.getCacheDir();
      const cache = await readCache(cacheDir);

      if (!cache) {
        return { isCached: false, isStale: false };
      }

      const isStale = await isCacheStale(cacheDir, 24);

      return {
        isCached: true,
        isStale,
        syncedAt: cache.syncedAt,
      };
    } catch {
      return { isCached: false, isStale: false };
    }
  }

  /**
   * Apply filters across Story or CacheStory arrays (repo + ids supported)
   */
  private applyFilters(stories: Story[], filter?: StoryFilter & { repo?: string; ids?: string[] }) {
    if (!filter) return stories;

    return stories.filter((story) => {
      if (filter.repo && (story as CacheStory).repo && (story as CacheStory).repo !== filter.repo) {
        return false;
      }
      if (filter.status && !filter.status.includes(story.status)) return false;
      if (filter.complexity && !filter.complexity.includes(story.complexity)) return false;
      if (filter.owner && story.owner !== filter.owner) return false;
      if (filter.milestone && story.milestone !== filter.milestone) return false;
      if (filter.feature && story.featureId !== filter.feature) return false;
      if (filter.release && story.releaseId !== filter.release) return false;
      if (filter.ids && filter.ids.length > 0 && !filter.ids.includes(story.id)) return false;
      return true;
    });
  }
}

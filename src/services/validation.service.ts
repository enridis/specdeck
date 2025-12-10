import { join } from 'path';
import { StoryRepository } from '../repositories';
import { SubmoduleConfig } from '../schemas';

export interface StoryIdValidationResult {
  storyIdMap: Map<string, string[]>;
  duplicates: Array<{ storyId: string; repos: string[] }>;
  totalIds: number;
  totalDuplicates: number;
}

export class ValidationService {
  /**
   * Scan all story IDs across all submodules and build a map of
   * which repos contain each story ID.
   *
   * @param submodules List of submodule configurations
   * @returns Map<StoryId, string[]> - each story ID mapped to repos containing it
   */
  async scanAllStoryIds(submodules: SubmoduleConfig[]): Promise<Map<string, string[]>> {
    const storyIdMap = new Map<string, string[]>();

    for (const submodule of submodules) {
      try {
        // Get stories from this submodule
        const releasesDir = join(submodule.path, 'specdeck', 'releases');
        const repository = new StoryRepository(releasesDir);
        const stories = await repository.readAll();

        // Add each story ID to the map, tracking which repo it came from
        for (const story of stories) {
          const repos = storyIdMap.get(story.id) || [];
          if (!repos.includes(submodule.name)) {
            repos.push(submodule.name);
          }
          storyIdMap.set(story.id, repos);
        }
      } catch (error) {
        // Skip submodules that can't be read (may not be initialized)
        console.warn(
          `Warning: Could not scan stories in submodule '${submodule.name}': ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        continue;
      }
    }

    return storyIdMap;
  }

  /**
   * Validate all story IDs across submodules and return conflicts.
   *
   * @param submodules List of submodule configurations
   * @returns StoryIdValidationResult with full analysis
   */
  async validateStoryIds(submodules: SubmoduleConfig[]): Promise<StoryIdValidationResult> {
    const storyIdMap = await this.scanAllStoryIds(submodules);

    // Find duplicates (IDs appearing in multiple repos)
    const duplicates: Array<{ storyId: string; repos: string[] }> = [];
    for (const [storyId, repos] of storyIdMap.entries()) {
      if (repos.length > 1) {
        duplicates.push({ storyId, repos });
      }
    }

    return {
      storyIdMap,
      duplicates,
      totalIds: storyIdMap.size,
      totalDuplicates: duplicates.length,
    };
  }

  /**
   * Check if a proposed story ID would conflict with existing IDs.
   *
   * @param storyId The story ID to check
   * @param submodules List of submodule configurations
   * @returns true if ID exists in any submodule, false otherwise
   */
  async idExists(storyId: string, submodules: SubmoduleConfig[]): Promise<boolean> {
    const storyIdMap = await this.scanAllStoryIds(submodules);
    return storyIdMap.has(storyId);
  }

  /**
   * Get the next available story ID by checking the highest numeric ID.
   *
   * @param submodules List of submodule configurations
   * @param prefix Optional prefix (e.g., "STORY") for numeric IDs
   * @returns Suggested next story ID
   */
  async getNextAvailableId(
    submodules: SubmoduleConfig[],
    prefix: string = 'STORY'
  ): Promise<string> {
    const storyIdMap = await this.scanAllStoryIds(submodules);

    // Find highest numeric ID with the given prefix
    let maxNumber = 0;
    for (const storyId of storyIdMap.keys()) {
      const match = storyId.match(new RegExp(`^${prefix}-(\\d+)$`));
      if (match) {
        const number = parseInt(match[1], 10);
        maxNumber = Math.max(maxNumber, number);
      }
    }

    return `${prefix}-${maxNumber + 1}`;
  }
}

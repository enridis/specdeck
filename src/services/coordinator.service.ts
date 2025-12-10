import { StoryRepository } from '../repositories/story.repository';
import { OverlayRepository } from '../repositories/overlay.repository';
import { ConfigRepository } from '../repositories/config.repository';
import { CacheStory } from '../schemas/cache.schema';
import { SubmoduleConfig } from '../schemas/config.schema';
import { OverlayData } from '../parsers/overlay.parser';

type OverlaysMap = Map<string, Map<string, OverlayData>>;
type JiraConflict = {
  storyId: string;
  jiraTickets: Set<string>;
  sources: string[];
};

/**
 * Coordinator Service
 *
 * Orchestrates multi-repository story aggregation and overlay enrichment.
 * Handles reading stories from all submodules, applying Jira mappings from
 * overlays, and preparing data for caching.
 */

export class CoordinatorService {
  constructor(
    private configRepository: ConfigRepository,
    private overlayRepository: OverlayRepository
  ) {}

  /**
   * Aggregate stories from all submodules
   *
   * Reads all releases and stories from each configured submodule,
   * flattening them into a single array with repo field added.
   *
   * @returns Array of stories with repo field indicating source submodule
   * @throws Error if aggregation fails
   */
  async aggregateStories(): Promise<CacheStory[]> {
    try {
      const submodules = await this.configRepository.getSubmodules();
      const allStories: CacheStory[] = [];

      for (const submodule of submodules) {
        const stories = await this.getStoriesFromSubmodule(submodule);
        allStories.push(...stories);
      }

      return allStories;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to aggregate stories: ${message}`);
    }
  }

  /**
   * Get stories from a specific submodule
   *
   * Reads all stories from the submodule.
   *
   * @param submodule Submodule configuration
   * @returns Stories with repo field set to submodule name
   */
  private async getStoriesFromSubmodule(submodule: SubmoduleConfig): Promise<CacheStory[]> {
    const stories: CacheStory[] = [];

    try {
      // Create repository instance for this submodule
      const releasesPath = `${submodule.path}/specdeck/releases`;
      const storyRepo = new StoryRepository(releasesPath);

      // Get all stories from this submodule
      const submoduleStories = await storyRepo.readAll();

      // Add repo field to each story
      for (const story of submoduleStories) {
        stories.push({
          ...story,
          repo: submodule.name,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get stories from submodule "${submodule.name}": ${message}`);
    }

    return stories;
  }

  /**
   * Apply overlays to stories
   *
   * Enriches aggregated stories with Jira mappings and metadata from overlay files.
   * Matches stories by ID and adds jiraTicket and overlaySource fields.
   *
   * @param stories Stories to enrich (modified in place)
   * @returns Stories with Jira enrichment applied
   * @throws Error if overlay application fails
   */
  async applyOverlays(stories: CacheStory[]): Promise<CacheStory[]> {
    try {
      // Read all overlays from all submodules
      const allOverlays = await this.overlayRepository.readAllOverlays();

      // Build a map of storyId -> (jiraTicket, overlayPath) for quick lookup
      const { jiraMap, conflicts } = this.buildJiraMap(allOverlays);

      if (conflicts.length > 0) {
        const conflictMessages = conflicts.map(
          (c) =>
            `Story ${c.storyId} has conflicting Jira mappings: ${[...c.jiraTickets].join(
              ', '
            )} in ${c.sources.join(', ')}`
        );
        throw new Error(
          [
            'Conflicting Jira mappings detected in overlays.',
            ...conflictMessages,
            'Resolve the conflicts in the overlay files and re-run sync.',
          ].join('\n')
        );
      }

      // Enrich each story with Jira mapping if available
      for (const story of stories) {
        const jiraInfo = jiraMap.get(story.id);
        if (jiraInfo) {
          story.jiraTicket = jiraInfo.jiraTicket;
          story.overlaySource = jiraInfo.overlayPath;
        }
      }

      return stories;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to apply overlays: ${message}`);
    }
  }

  /**
   * Build a map of story IDs to Jira info for fast lookup
   *
   * @param allOverlays Map from readAllOverlays() output
   * @returns Map of storyId -> { jiraTicket, overlayPath }
   */
  private buildJiraMap(allOverlays: OverlaysMap): {
    jiraMap: Map<string, { jiraTicket: string; overlayPath: string }>;
    conflicts: JiraConflict[];
  } {
    const jiraMap = new Map<string, { jiraTicket: string; overlayPath: string }>();
    const conflicts: JiraConflict[] = [];

    for (const [repo, featureOverlays] of allOverlays.entries()) {
      for (const [featureId, overlay] of featureOverlays.entries()) {
        if (overlay?.jiraMappings) {
          for (const [storyId, jiraTicket] of overlay.jiraMappings.entries()) {
            const overlayPath = `overlays/${repo}/${featureId}.md`;
            const existing = jiraMap.get(storyId);
            if (existing && existing.jiraTicket !== jiraTicket) {
              const existingConflict = conflicts.find((c) => c.storyId === storyId);
              if (existingConflict) {
                existingConflict.jiraTickets.add(jiraTicket);
                existingConflict.sources.push(overlayPath);
              } else {
                conflicts.push({
                  storyId,
                  jiraTickets: new Set([existing.jiraTicket, jiraTicket]),
                  sources: [existing.overlayPath, overlayPath],
                });
              }
            } else {
              jiraMap.set(storyId, {
                jiraTicket,
                overlayPath,
              });
            }
          }
        }
      }
    }

    return { jiraMap, conflicts };
  }

  /**
   * Get statistics about current stories and overlays
   *
   * @param stories Aggregated stories (after overlays applied)
   * @param overlays Raw overlays map
   * @returns Statistics object with counts per repo
   */
  getStatistics(
    stories: CacheStory[],
    overlays: OverlaysMap
  ): {
    storyCounts: Record<string, number>;
    totalStories: number;
    totalOverlays: number;
    totalJiraMappings: number;
    mappedStories: number;
  } {
    const storyCounts: Record<string, number> = {};
    let totalOverlays = 0;
    let totalJiraMappings = 0;
    let mappedStories = 0;

    // Count stories per repo
    for (const story of stories) {
      storyCounts[story.repo] = (storyCounts[story.repo] || 0) + 1;
      if (story.jiraTicket) {
        mappedStories++;
      }
    }

    // Count overlays and mappings
    for (const [, overlayMap] of overlays.entries()) {
      for (const [, overlay] of overlayMap.entries()) {
        totalOverlays++;
        if (overlay?.jiraMappings) {
          totalJiraMappings += overlay.jiraMappings.size;
        }
      }
    }

    return {
      storyCounts,
      totalStories: stories.length,
      totalOverlays,
      totalJiraMappings,
      mappedStories,
    };
  }
}

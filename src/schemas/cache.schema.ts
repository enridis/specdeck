import { z } from 'zod';
import { StorySchema } from './story.schema';

/**
 * Cache Data Structure for Coordinator Mode
 *
 * The cache file (`.specdeck-cache/stories.json`) stores aggregated stories
 * from all submodules with overlay enrichment. It enables fast list operations
 * without traversing all submodule directories.
 *
 * Cache Location: `.specdeck-cache/stories.json`
 * Cache Invalidation: Manually via `specdeck sync` or auto-sync on UI load
 * Staleness Warning Threshold: 24 hours
 */

export const CacheStorySchema = StorySchema.extend({
  // Track which repo this story came from for filtering and diagnostics
  repo: z.string().describe('Repository/submodule name where story originated'),
  // Jira ticket linked from overlay file, if available
  jiraTicket: z.string().optional().describe('Jira ticket ID from overlay mapping'),
  // Track which overlay file provided the Jira link
  overlaySource: z.string().optional().describe('Path to overlay file that provided jiraTicket'),
});

export type CacheStory = z.infer<typeof CacheStorySchema>;

export const CacheSyncMetadataSchema = z.object({
  // Commit SHAs of submodules at time of sync for change detection
  commitShas: z
    .record(z.string())
    .optional()
    .describe('Git commit SHAs of submodules at sync time'),
  // Counts per repo for quick diagnostics
  storyCounts: z.record(z.number()).optional().describe('Number of stories aggregated per repo'),
  // Overlay statistics
  overlayStats: z
    .object({
      totalOverlays: z.number().optional(),
      totalJiraMappings: z.number().optional(),
      mappedStories: z.number().optional(),
    })
    .optional()
    .describe('Statistics about overlays applied during sync'),
});

export type CacheSyncMetadata = z.infer<typeof CacheSyncMetadataSchema>;

export const CacheDataSchema = z.object({
  // Format version for forward compatibility
  version: z.string().default('1.0.0').describe('Cache schema version'),
  // ISO 8601 timestamp of last successful sync
  syncedAt: z.string().datetime().describe('ISO 8601 timestamp of last sync completion'),
  // List of submodules that were synced
  repos: z.array(z.string()).describe('List of repository/submodule names included in this sync'),
  // Aggregated stories from all repos with overlay enrichment
  stories: z
    .array(CacheStorySchema)
    .describe('Aggregated stories from all submodules with overlay enrichment'),
  // Sync metadata for diagnostics and change detection
  metadata: CacheSyncMetadataSchema.optional().describe(
    'Metadata about the sync operation and results'
  ),
});

export type CacheData = z.infer<typeof CacheDataSchema>;

/**
 * Validation helper to ensure cache data is valid before use
 */
export async function validateCacheData(data: unknown): Promise<CacheData> {
  try {
    return await CacheDataSchema.parseAsync(data);
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? `Cache validation failed: ${error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')}`
        : `Cache validation failed: ${String(error)}`;
    throw new Error(message);
  }
}

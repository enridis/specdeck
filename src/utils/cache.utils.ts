import { promises as fs } from 'fs';
import { join } from 'path';
import { CacheData, validateCacheData } from '../schemas/cache.schema';

/**
 * Cache Utilities for Coordinator Mode
 *
 * Handles reading, writing, and staleness checking for aggregated story cache.
 * Cache location: `.specdeck-cache/stories.json`
 */

const CACHE_FILENAME = 'stories.json';

/**
 * Get the path to the cache file
 */
function getCacheFilePath(cacheDir: string): string {
  return join(cacheDir, CACHE_FILENAME);
}

/**
 * Write cache data to disk
 *
 * @param data Cache data to write
 * @param cacheDir Directory containing cache files
 * @throws Error if write fails
 */
export async function writeCache(data: CacheData, cacheDir: string): Promise<void> {
  try {
    // Ensure cache directory exists
    await fs.mkdir(cacheDir, { recursive: true });

    const filePath = getCacheFilePath(cacheDir);
    const jsonContent = JSON.stringify(data, null, 2);

    await fs.writeFile(filePath, jsonContent, 'utf-8');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to write cache: ${message}`);
  }
}

/**
 * Read cache data from disk
 *
 * @param cacheDir Directory containing cache files
 * @returns Cache data if valid, null if file doesn't exist
 * @throws Error if file exists but is invalid
 */
export async function readCache(cacheDir: string): Promise<CacheData | null> {
  const filePath = getCacheFilePath(cacheDir);

  try {
    const jsonContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(jsonContent) as unknown;
    return await validateCacheData(data);
  } catch (error) {
    // File doesn't exist - return null
    const err = error as NodeJS.ErrnoException;
    if (err?.code === 'ENOENT' || err?.errno === -2) {
      return null;
    }
    // File exists but is invalid
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read cache: ${message}`);
  }
}

/**
 * Check if cache exists
 *
 * @param cacheDir Directory containing cache files
 * @returns true if cache file exists and is readable
 */
export async function cacheExists(cacheDir: string): Promise<boolean> {
  try {
    const filePath = getCacheFilePath(cacheDir);
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if cache is stale
 *
 * Returns true if cache doesn't exist, is unparseable, or exceeds max age.
 *
 * @param cacheDir Directory containing cache files
 * @param maxAgeHours Maximum age in hours before considered stale (default: 24)
 * @returns true if cache is stale or missing
 */
export async function isCacheStale(cacheDir: string, maxAgeHours: number = 24): Promise<boolean> {
  try {
    const cache = await readCache(cacheDir);
    if (!cache) {
      return true; // No cache means it's stale
    }

    const syncedAt = new Date(cache.syncedAt);
    const now = new Date();
    const ageHours = (now.getTime() - syncedAt.getTime()) / (1000 * 60 * 60);

    return ageHours > maxAgeHours;
  } catch {
    return true; // If we can't read/validate cache, consider it stale
  }
}

/**
 * Get cache age in human-readable format
 *
 * @param cacheDir Directory containing cache files
 * @returns Age description (e.g., "2 hours ago", "5 minutes ago") or null if no cache
 */
export async function getCacheAgeDescription(cacheDir: string): Promise<string | null> {
  try {
    const cache = await readCache(cacheDir);
    if (!cache) {
      return null;
    }

    const syncedAt = new Date(cache.syncedAt);
    const now = new Date();
    const diffMs = now.getTime() - syncedAt.getTime();

    // Convert to various units
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
    if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }
    if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    }
    return 'just now';
  } catch {
    return null;
  }
}

/**
 * Delete cache file
 *
 * @param cacheDir Directory containing cache files
 * @throws Error if deletion fails
 */
export async function deleteCache(cacheDir: string): Promise<void> {
  try {
    const filePath = getCacheFilePath(cacheDir);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // Ignore "file not found" errors
      if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
        throw error;
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to delete cache: ${message}`);
  }
}

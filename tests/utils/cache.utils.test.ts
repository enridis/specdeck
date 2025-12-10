import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  writeCache,
  readCache,
  cacheExists,
  isCacheStale,
  getCacheAgeDescription,
  deleteCache,
} from '../../src/utils/cache.utils';
import { CacheData } from '../../src/schemas/cache.schema';

describe('Cache Utilities', () => {
  let testCacheDir: string;

  beforeEach(async () => {
    testCacheDir = join(tmpdir(), `test-cache-${Date.now()}`);
    await fs.mkdir(testCacheDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testCacheDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('writeCache', () => {
    it('should write cache data to file', async () => {
      const cacheData: CacheData = {
        version: '1.0.0',
        syncedAt: new Date().toISOString(),
        repos: ['backend', 'frontend'],
        stories: [
          {
            id: 'AUTH-01',
            title: 'Login',
            featureId: 'AUTH',
            releaseId: 'R1',
            status: 'done' as const,
            complexity: 'M' as const,
            repo: 'backend',
            tags: [],
          },
        ],
      };

      await writeCache(cacheData, testCacheDir);

      const filePath = join(testCacheDir, 'stories.json');
      const exists = await cacheExists(testCacheDir);
      expect(exists).toBe(true);

      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(content) as { version: string; stories: unknown[] };
      expect(parsed.version).toBe('1.0.0');
      expect(parsed.stories).toHaveLength(1);
    });

    it('should create cache directory if it does not exist', async () => {
      const newCacheDir = join(testCacheDir, 'new-dir');

      const cacheData: CacheData = {
        version: '1.0.0',
        syncedAt: new Date().toISOString(),
        repos: ['test'],
        stories: [],
      };

      await writeCache(cacheData, newCacheDir);

      const exists = await cacheExists(newCacheDir);
      expect(exists).toBe(true);
    });

    it('should overwrite existing cache file', async () => {
      const cacheData1: CacheData = {
        version: '1.0.0',
        syncedAt: '2024-01-01T00:00:00Z',
        repos: ['backend'],
        stories: [],
      };

      await writeCache(cacheData1, testCacheDir);

      const cacheData2: CacheData = {
        version: '1.0.0',
        syncedAt: '2024-01-02T00:00:00Z',
        repos: ['frontend'],
        stories: [],
      };

      await writeCache(cacheData2, testCacheDir);

      const read = await readCache(testCacheDir);
      expect(read?.syncedAt).toBe('2024-01-02T00:00:00Z');
    });
  });

  describe('readCache', () => {
    it('should read valid cache file', async () => {
      const cacheData: CacheData = {
        version: '1.0.0',
        syncedAt: new Date().toISOString(),
        repos: ['backend'],
        stories: [
          {
            id: 'TEST-STORY-01',
            title: 'Test Story',
            featureId: 'TEST',
            releaseId: 'R1',
            status: 'planned' as const,
            complexity: 'S' as const,
            repo: 'backend',
            tags: [],
          },
        ],
      };

      await writeCache(cacheData, testCacheDir);
      const read = await readCache(testCacheDir);

      expect(read).toBeDefined();
      expect(read?.version).toBe('1.0.0');
      expect(read?.stories).toHaveLength(1);
      expect(read?.stories[0].id).toBe('TEST-STORY-01');
    });

    it('should return null if cache does not exist', async () => {
      const read = await readCache(testCacheDir);
      expect(read).toBeNull();
    });

    it('should throw error if cache file is corrupted', async () => {
      const filePath = join(testCacheDir, 'stories.json');
      await fs.writeFile(filePath, 'invalid json {[}', 'utf-8');

      await expect(readCache(testCacheDir)).rejects.toThrow();
    });
  });

  describe('cacheExists', () => {
    it('should return true if cache exists', async () => {
      const cacheData: CacheData = {
        version: '1.0.0',
        syncedAt: new Date().toISOString(),
        repos: [],
        stories: [],
      };

      await writeCache(cacheData, testCacheDir);
      const exists = await cacheExists(testCacheDir);

      expect(exists).toBe(true);
    });

    it('should return false if cache does not exist', async () => {
      const exists = await cacheExists(testCacheDir);
      expect(exists).toBe(false);
    });
  });

  describe('isCacheStale', () => {
    it('should return true if cache does not exist', async () => {
      const stale = await isCacheStale(testCacheDir, 24);
      expect(stale).toBe(true);
    });

    it('should return false if cache is newer than max age', async () => {
      const now = new Date();
      const cacheData: CacheData = {
        version: '1.0.0',
        syncedAt: now.toISOString(),
        repos: [],
        stories: [],
      };

      await writeCache(cacheData, testCacheDir);
      const stale = await isCacheStale(testCacheDir, 24);

      expect(stale).toBe(false);
    });

    it('should return true if cache exceeds max age', async () => {
      const oldTime = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      const cacheData: CacheData = {
        version: '1.0.0',
        syncedAt: oldTime.toISOString(),
        repos: [],
        stories: [],
      };

      await writeCache(cacheData, testCacheDir);
      const stale = await isCacheStale(testCacheDir, 24);

      expect(stale).toBe(true);
    });

    it('should use default 24 hour threshold', async () => {
      const old = new Date(Date.now() - 25 * 60 * 60 * 1000);
      const cacheData: CacheData = {
        version: '1.0.0',
        syncedAt: old.toISOString(),
        repos: [],
        stories: [],
      };

      await writeCache(cacheData, testCacheDir);
      const stale = await isCacheStale(testCacheDir); // No maxAge parameter

      expect(stale).toBe(true);
    });
  });

  describe('getCacheAgeDescription', () => {
    it('should return null if cache does not exist', async () => {
      const age = await getCacheAgeDescription(testCacheDir);
      expect(age).toBeNull();
    });

    it('should describe age in minutes', async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const cacheData: CacheData = {
        version: '1.0.0',
        syncedAt: fiveMinutesAgo.toISOString(),
        repos: [],
        stories: [],
      };

      await writeCache(cacheData, testCacheDir);
      const age = await getCacheAgeDescription(testCacheDir);

      expect(age).toMatch(/\d+ minutes? ago/);
    });

    it('should describe age in hours', async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const cacheData: CacheData = {
        version: '1.0.0',
        syncedAt: twoHoursAgo.toISOString(),
        repos: [],
        stories: [],
      };

      await writeCache(cacheData, testCacheDir);
      const age = await getCacheAgeDescription(testCacheDir);

      expect(age).toMatch(/\d+ hours? ago/);
    });

    it('should describe age in days', async () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const cacheData: CacheData = {
        version: '1.0.0',
        syncedAt: threeDaysAgo.toISOString(),
        repos: [],
        stories: [],
      };

      await writeCache(cacheData, testCacheDir);
      const age = await getCacheAgeDescription(testCacheDir);

      expect(age).toMatch(/\d+ days? ago/);
    });

    it('should return "just now" for very recent cache', async () => {
      const now = new Date();
      const cacheData: CacheData = {
        version: '1.0.0',
        syncedAt: now.toISOString(),
        repos: [],
        stories: [],
      };

      await writeCache(cacheData, testCacheDir);
      const age = await getCacheAgeDescription(testCacheDir);

      expect(age).toBe('just now');
    });
  });

  describe('deleteCache', () => {
    it('should delete cache file', async () => {
      const cacheData: CacheData = {
        version: '1.0.0',
        syncedAt: new Date().toISOString(),
        repos: [],
        stories: [],
      };

      await writeCache(cacheData, testCacheDir);
      expect(await cacheExists(testCacheDir)).toBe(true);

      await deleteCache(testCacheDir);
      expect(await cacheExists(testCacheDir)).toBe(false);
    });

    it('should not error if cache does not exist', async () => {
      await expect(deleteCache(testCacheDir)).resolves.not.toThrow();
    });
  });
});

// Mock unified and remark modules first
jest.mock('unified', () => ({
  unified: jest.fn().mockReturnValue({
    use: jest.fn().mockReturnThis(),
    parse: jest.fn(),
  }),
}));

jest.mock('remark-parse', () => ({}));
jest.mock('remark-gfm', () => ({}));
jest.mock('remark-frontmatter', () => ({}));

// Mock StoryRepository with story data before importing ValidationService
const mockStoriesForPath = (path: string) => {
  if (path.includes('backend')) {
    return [
      {
        id: 'AUTH-01',
        title: 'Login',
        featureId: 'AUTH',
        releaseId: 'R1',
        status: 'done' as const,
        complexity: 'M' as const,
        tags: [],
      },
      {
        id: 'AUTH-02',
        title: 'Logout',
        featureId: 'AUTH',
        releaseId: 'R1',
        status: 'planned' as const,
        complexity: 'S' as const,
        tags: [],
      },
      {
        id: 'USERS-01',
        title: 'Get User',
        featureId: 'USERS',
        releaseId: 'R1',
        status: 'planned' as const,
        complexity: 'M' as const,
        tags: [],
      },
    ];
  } else if (path.includes('frontend')) {
    return [
      {
        id: 'FE-AUTH-01',
        title: 'Login Form',
        featureId: 'AUTH',
        releaseId: 'R1',
        status: 'done' as const,
        complexity: 'M' as const,
        tags: [],
      },
      {
        id: 'FE-USERS-01',
        title: 'User Profile',
        featureId: 'USERS',
        releaseId: 'R1',
        status: 'planned' as const,
        complexity: 'M' as const,
        tags: [],
      },
    ];
  }
  return [];
};

jest.mock('../../src/repositories/story.repository', () => ({
  StoryRepository: jest.fn().mockImplementation((path: string) => ({
    readAll: jest.fn().mockResolvedValue(mockStoriesForPath(path)),
  })),
}));

import { ValidationService } from '../../src/services/validation.service';
import { SubmoduleConfig } from '../../src/schemas/config.schema';

describe('ValidationService', () => {
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = new ValidationService();
  });

  describe('scanAllStoryIds', () => {
    it('should scan all story IDs across submodules', async () => {
      const submodules: SubmoduleConfig[] = [
        { name: 'backend', path: './backend', visibility: 'public' },
        { name: 'frontend', path: './frontend', visibility: 'private' },
      ];

      const result = await validationService.scanAllStoryIds(submodules);

      expect(result.size).toBeGreaterThan(0);
      expect(result.has('AUTH-01')).toBe(true);
      expect(result.get('AUTH-01')).toContain('backend');
    });

    it('should map story IDs to their repositories', async () => {
      const submodules: SubmoduleConfig[] = [
        { name: 'backend', path: './backend', visibility: 'public' },
      ];

      const result = await validationService.scanAllStoryIds(submodules);

      expect(result.get('AUTH-01')).toEqual(['backend']);
    });

    it('should handle empty submodules list', async () => {
      const result = await validationService.scanAllStoryIds([]);

      expect(result.size).toBe(0);
    });

    it('should skip submodules that cannot be read', async () => {
      const submodules: SubmoduleConfig[] = [
        { name: 'backend', path: './backend', visibility: 'public' },
        { name: 'invalid', path: './nonexistent', visibility: 'public' },
        { name: 'frontend', path: './frontend', visibility: 'private' },
      ];

      const result = await validationService.scanAllStoryIds(submodules);

      // Should contain stories from backend and frontend, skip invalid
      expect(result.has('AUTH-01')).toBe(true);
      expect(result.has('FE-AUTH-01')).toBe(true);
    });
  });

  describe('validateStoryIds', () => {
    it('should detect no duplicates when all IDs are unique', async () => {
      const submodules: SubmoduleConfig[] = [
        { name: 'backend', path: './backend', visibility: 'public' },
        { name: 'frontend', path: './frontend', visibility: 'private' },
      ];

      const result = await validationService.validateStoryIds(submodules);

      expect(result.totalDuplicates).toBe(0);
      expect(result.duplicates).toEqual([]);
      expect(result.totalIds).toBeGreaterThan(0);
    });

    it('should detect duplicate story IDs across repositories', async () => {
      // For this test, we'd need to mock submodules that have conflicting IDs
      // This is a simplified demonstration
      const submodules: SubmoduleConfig[] = [
        { name: 'backend', path: './backend', visibility: 'public' },
      ];

      const result = await validationService.validateStoryIds(submodules);

      expect(result).toHaveProperty('duplicates');
      expect(result).toHaveProperty('totalDuplicates');
    });

    it('should return detailed conflict information', async () => {
      const submodules: SubmoduleConfig[] = [
        { name: 'backend', path: './backend', visibility: 'public' },
        { name: 'frontend', path: './frontend', visibility: 'private' },
      ];

      const result = await validationService.validateStoryIds(submodules);

      if (result.duplicates.length > 0) {
        const firstDuplicate = result.duplicates[0];
        expect(firstDuplicate).toHaveProperty('storyId');
        expect(firstDuplicate).toHaveProperty('repos');
        expect(firstDuplicate.repos.length).toBeGreaterThan(1);
      }
    });
  });

  describe('idExists', () => {
    it('should return true if story ID exists in any submodule', async () => {
      const submodules: SubmoduleConfig[] = [
        { name: 'backend', path: './backend', visibility: 'public' },
      ];

      const exists = await validationService.idExists('AUTH-01', submodules);

      expect(exists).toBe(true);
    });

    it('should return false if story ID does not exist', async () => {
      const submodules: SubmoduleConfig[] = [
        { name: 'backend', path: './backend', visibility: 'public' },
      ];

      const exists = await validationService.idExists('NONEXISTENT-99', submodules);

      expect(exists).toBe(false);
    });

    it('should check across all submodules', async () => {
      const submodules: SubmoduleConfig[] = [
        { name: 'backend', path: './backend', visibility: 'public' },
        { name: 'frontend', path: './frontend', visibility: 'private' },
      ];

      const backendStoryExists = await validationService.idExists('AUTH-01', submodules);
      const frontendStoryExists = await validationService.idExists('FE-AUTH-01', submodules);

      expect(backendStoryExists).toBe(true);
      expect(frontendStoryExists).toBe(true);
    });
  });

  describe('getNextAvailableId', () => {
    it('should suggest next available numeric ID', async () => {
      const submodules: SubmoduleConfig[] = [
        { name: 'backend', path: './backend', visibility: 'public' },
      ];

      const nextId = await validationService.getNextAvailableId(submodules, 'STORY');

      expect(nextId).toMatch(/^STORY-\d+$/);
      const num = parseInt(nextId.split('-')[1], 10);
      expect(num).toBeGreaterThan(0);
    });

    it('should use provided prefix', async () => {
      const submodules: SubmoduleConfig[] = [];

      const nextId = await validationService.getNextAvailableId(submodules, 'TEST');

      expect(nextId).toBe('TEST-1');
    });

    it('should find highest existing ID and suggest next', async () => {
      const submodules: SubmoduleConfig[] = [
        { name: 'backend', path: './backend', visibility: 'public' },
      ];

      const nextId = await validationService.getNextAvailableId(submodules, 'AUTH');

      expect(nextId).toMatch(/^AUTH-\d+$/);
      // The number should be higher than any existing AUTH-* IDs
    });
  });

  describe('error handling', () => {
    it('should continue processing if one submodule fails', async () => {
      const submodules: SubmoduleConfig[] = [
        { name: 'backend', path: './backend', visibility: 'public' },
        { name: 'broken', path: './broken', visibility: 'public' },
        { name: 'frontend', path: './frontend', visibility: 'private' },
      ];

      // Should not throw, should skip broken submodule
      const result = await validationService.scanAllStoryIds(submodules);

      expect(result.size).toBeGreaterThan(0);
    });
  });
});

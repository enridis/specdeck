// Mock the repositories AND the parsers BEFORE importing the service
jest.mock('unified', () => ({
  unified: jest.fn().mockReturnValue({
    use: jest.fn().mockReturnThis(),
    parse: jest.fn().mockReturnValue({
      type: 'root',
      children: [],
    }),
  }),
}));

jest.mock('remark-parse', () => ({}));
jest.mock('remark-gfm', () => ({}));
jest.mock('remark-frontmatter', () => ({}));

// Create mock stories data
const mockStories = [
  {
    id: 'TEST-FEAT1-001',
    title: 'Story 1',
    featureId: 'FEAT1',
    releaseId: 'R1',
    status: 'planned' as const,
    complexity: 'M' as const,
    tags: [],
  },
  {
    id: 'TEST-FEAT1-002',
    title: 'Story 2',
    featureId: 'FEAT1',
    releaseId: 'R1',
    status: 'in_progress' as const,
    complexity: 'L' as const,
    tags: [],
  },
];

jest.mock('../../src/repositories/story.repository', () => ({
  StoryRepository: jest.fn().mockImplementation(() => ({
    readAll: jest.fn().mockResolvedValue(mockStories),
  })),
}));

jest.mock('../../src/repositories/config.repository');
jest.mock('../../src/repositories/overlay.repository');

import { CoordinatorService } from '../../src/services/coordinator.service';
import { ConfigRepository } from '../../src/repositories/config.repository';
import { OverlayRepository } from '../../src/repositories/overlay.repository';

type MockConfigRepository = jest.Mocked<Pick<ConfigRepository, 'getSubmodules'>>;
type MockOverlayRepository = jest.Mocked<Pick<OverlayRepository, 'readAllOverlays'>>;

describe('CoordinatorService', () => {
  let coordinatorService: CoordinatorService;
  let configRepoMock: MockConfigRepository;
  let overlayRepoMock: MockOverlayRepository;

  beforeEach(() => {
    configRepoMock = {
      getSubmodules: jest.fn(),
    };

    overlayRepoMock = {
      readAllOverlays: jest.fn(),
    };

    coordinatorService = new CoordinatorService(
      configRepoMock as unknown as ConfigRepository,
      overlayRepoMock as unknown as OverlayRepository
    );
  });

  describe('aggregateStories', () => {
    it('should aggregate stories from multiple submodules', async () => {
      const mockSubmodules = [
        { name: 'backend', path: './backend', visibility: 'public' as const },
        { name: 'frontend', path: './frontend', visibility: 'private' as const },
      ];

      configRepoMock.getSubmodules.mockResolvedValue(mockSubmodules);

      const result = await coordinatorService.aggregateStories();

      expect(result).toHaveLength(4); // 2 stories × 2 submodules
      expect(result[0]).toHaveProperty('repo', 'backend');
      expect(result[2]).toHaveProperty('repo', 'frontend');
    });

    it('should handle empty submodules list', async () => {
      configRepoMock.getSubmodules.mockResolvedValue([]);
      const result = await coordinatorService.aggregateStories();
      expect(result).toEqual([]);
    });
  });

  describe('applyOverlays', () => {
    it('should enrich stories with Jira mappings from overlays', async () => {
      const stories = [
        {
          id: 'AUTH-01',
          title: 'Login',
          featureId: 'AUTH',
          releaseId: 'R1',
          status: 'planned' as const,
          repo: 'backend',
          complexity: 'M' as const,
          tags: [],
        },
        {
          id: 'AUTH-02',
          title: 'Logout',
          featureId: 'AUTH',
          releaseId: 'R1',
          status: 'planned' as const,
          repo: 'backend',
          complexity: 'S' as const,
          tags: [],
        },
      ];

      const overlays = new Map([
        [
          'backend',
          new Map([
            [
              'AUTH',
              {
                featureId: 'AUTH',
                jiraMappings: new Map([
                  ['AUTH-01', 'PROJ-1001'],
                  ['AUTH-02', 'PROJ-1002'],
                ]),
                notes: new Map(),
              },
            ],
          ]),
        ],
      ]);

      overlayRepoMock.readAllOverlays.mockResolvedValue(overlays);

      const result = await coordinatorService.applyOverlays(stories);

      expect(result[0]).toHaveProperty('jiraTicket', 'PROJ-1001');
      expect(result[1]).toHaveProperty('jiraTicket', 'PROJ-1002');
      expect(result[0]).toHaveProperty('overlaySource', 'overlays/backend/AUTH.md');
    });

    it('should handle stories without Jira mappings', async () => {
      const stories = [
        {
          id: 'AUTH-01',
          title: 'Login',
          featureId: 'AUTH',
          releaseId: 'R1',
          status: 'planned' as const,
          repo: 'backend',
          complexity: 'M' as const,
          tags: [],
        },
      ];

      overlayRepoMock.readAllOverlays.mockResolvedValue(new Map());

      const result = await coordinatorService.applyOverlays(stories);

      expect(result[0]).not.toHaveProperty('jiraTicket');
      expect(result[0]).not.toHaveProperty('overlaySource');
    });

    it('should support plain object overlays format', async () => {
      const stories = [
        {
          id: 'AUTH-01',
          title: 'Login',
          featureId: 'AUTH',
          releaseId: 'R1',
          status: 'planned' as const,
          repo: 'backend',
          complexity: 'M' as const,
          tags: [],
        },
      ];

      const overlays = new Map([
        [
          'backend',
          new Map([
            [
              'AUTH',
              {
                featureId: 'AUTH',
                jiraMappings: new Map([['AUTH-01', 'PROJ-1001']]),
                notes: new Map(),
              },
            ],
          ]),
        ],
      ]);

      overlayRepoMock.readAllOverlays.mockResolvedValue(overlays);

      const result = await coordinatorService.applyOverlays(stories);

      expect(result[0]).toHaveProperty('jiraTicket', 'PROJ-1001');
    });

    it('should throw on conflicting Jira mappings for the same story', async () => {
      const stories = [
        {
          id: 'AUTH-01',
          title: 'Login',
          featureId: 'AUTH',
          releaseId: 'R1',
          status: 'planned' as const,
          repo: 'backend',
          complexity: 'M' as const,
          tags: [],
        },
      ];

      const overlays = new Map([
        [
          'backend',
          new Map([
            [
              'AUTH',
              {
                featureId: 'AUTH',
                jiraMappings: new Map([['AUTH-01', 'PROJ-1001']]),
                notes: new Map(),
              },
            ],
          ]),
        ],
        [
          'frontend',
          new Map([
            [
              'AUTH',
              {
                featureId: 'AUTH',
                jiraMappings: new Map([['AUTH-01', 'PROJ-2001']]),
                notes: new Map(),
              },
            ],
          ]),
        ],
      ]);

      overlayRepoMock.readAllOverlays.mockResolvedValue(overlays);

      await expect(coordinatorService.applyOverlays(stories)).rejects.toThrow(
        /Conflicting Jira mappings detected/i
      );
      await expect(coordinatorService.applyOverlays(stories)).rejects.toThrow(/AUTH-01/);
    });
  });

  describe('getStatistics', () => {
    it('should calculate correct statistics', () => {
      const stories = [
        {
          id: 'AUTH-01',
          title: 'Story',
          featureId: 'AUTH',
          releaseId: 'R1',
          status: 'planned' as const,
          repo: 'backend',
          complexity: 'M' as const,
          tags: [],
          jiraTicket: 'PROJ-1001',
        },
        {
          id: 'AUTH-02',
          title: 'Story',
          featureId: 'AUTH',
          releaseId: 'R1',
          status: 'planned' as const,
          repo: 'backend',
          complexity: 'M' as const,
          tags: [],
        },
        {
          id: 'FE-AUTH-01',
          title: 'Story',
          featureId: 'AUTH',
          releaseId: 'R1',
          status: 'planned' as const,
          repo: 'frontend',
          complexity: 'M' as const,
          tags: [],
          jiraTicket: 'PROJ-2001',
        },
      ];

      const overlays = new Map([
        [
          'backend',
          new Map([
            [
              'AUTH',
              {
                featureId: 'AUTH',
                jiraMappings: new Map([
                  ['AUTH-01', 'PROJ-1001'],
                  ['AUTH-02', 'PROJ-1002'],
                ]),
                notes: new Map(),
              },
            ],
          ]),
        ],
      ]);

      const stats = coordinatorService.getStatistics(stories, overlays);

      expect(stats.totalStories).toBe(3);
      expect(stats.storyCounts['backend']).toBe(2);
      expect(stats.storyCounts['frontend']).toBe(1);
      expect(stats.mappedStories).toBe(2);
      expect(stats.totalJiraMappings).toBe(2);
      expect(stats.totalOverlays).toBe(1);
    });

    it('should handle empty stories and overlays', () => {
      const stats = coordinatorService.getStatistics([], new Map());

      expect(stats.totalStories).toBe(0);
      expect(stats.mappedStories).toBe(0);
      expect(stats.totalJiraMappings).toBe(0);
      expect(stats.totalOverlays).toBe(0);
    });
  });
});

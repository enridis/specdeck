jest.mock('chalk', () => ({
  __esModule: true,
  default: {
    red: (msg: string) => msg,
    cyan: (msg: string) => msg,
    gray: (msg: string) => msg,
    yellow: (msg: string) => msg,
    bold: (msg: string) => msg,
    green: (msg: string) => msg,
  },
}));

import { Command } from 'commander';
import { createJiraCommand } from '../../src/commands/jira';

jest.mock('../../src/repositories', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const actual = jest.requireActual('../../src/repositories');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    ...actual,
    ConfigRepository: jest.fn().mockImplementation(() => ({
      read: jest.fn().mockResolvedValue({ specdeckDir: './specdeck' }),
      getOverlaysDir: jest.fn().mockResolvedValue('./overlays'),
      isCoordinatorMode: jest.fn().mockResolvedValue(true),
      getSubmodules: jest.fn().mockResolvedValue([
        { name: 'backend', path: './submodules/backend' },
        { name: 'frontend', path: './submodules/frontend' },
      ]),
    })),
    OverlayRepository: jest.fn().mockImplementation(() => ({
      readAllOverlays: jest.fn().mockResolvedValue(
        new Map([
          [
            'backend',
            new Map([
              [
                'AUTH',
                { featureId: 'AUTH', jiraMappings: new Map([['AUTH-1', 'J-1']]), notes: new Map() },
              ],
            ]),
          ],
          [
            'frontend',
            new Map([
              [
                'AUTH',
                { featureId: 'AUTH', jiraMappings: new Map([['AUTH-1', 'J-2']]), notes: new Map() },
              ],
            ]),
          ],
        ])
      ),
    })),
  };
});

jest.mock('../../src/services', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const actual = jest.requireActual('../../src/services');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    ...actual,
    StoryService: jest.fn().mockImplementation(() => ({
      listStoriesWithCache: jest.fn().mockResolvedValue([
        {
          id: 'AUTH-1',
          title: 'Login',
          status: 'planned',
          complexity: 'M',
          featureId: 'AUTH',
          repo: 'backend',
          jiraTicket: 'J-1',
          overlaySource: 'overlays/backend/AUTH.md',
        },
        {
          id: 'AUTH-2',
          title: 'Settings',
          status: 'in_progress',
          complexity: 'S',
          featureId: 'AUTH',
          repo: 'backend',
        },
      ]),
      getCacheInfo: jest.fn().mockResolvedValue({ isCached: true, isStale: true }),
    })),
  };
});

describe('jira sync-plan command', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('emits missing and conflicting Jira reasons with cache warning', async () => {
    const program = new Command();
    program.addCommand(createJiraCommand());
    program.exitOverride();

    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((message?: unknown) => {
      logs.push(String(message));
    });

    await program.parseAsync(['jira', 'sync-plan', '--json'], { from: 'user' });

    const output = JSON.parse(logs.join('')) as Array<{
      storyId: string;
      reasons: string[];
    }>;

    const missing = output.find((entry) => entry.storyId === 'AUTH-2');
    expect(missing?.reasons).toContain('missing_jira');
    expect(missing?.reasons).toContain('cache_stale');

    const conflict = output.find((entry) => entry.storyId === 'AUTH-1');
    expect(conflict?.reasons).toContain('jira_conflict');
    expect(conflict?.reasons).toContain('status_mismatch');
    expect(conflict?.reasons).toContain('cache_stale');
  });
});

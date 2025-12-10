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
import { createStoriesCommand } from '../../src/commands/stories';

jest.mock('../../src/repositories', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const actual = jest.requireActual('../../src/repositories');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    ...actual,
    ConfigRepository: jest.fn().mockImplementation(() => ({
      read: jest.fn().mockResolvedValue({ specdeckDir: './specdeck' }),
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
          title: 'Login Feature',
          status: 'planned',
          complexity: 'M',
          estimate: 5,
          owner: 'john.doe',
          milestone: 'Q1-2025',
          tags: ['auth', 'ui'],
          notes: 'User authentication flow',
          openspec: 'Detailed requirements in project-plan.md',
          repo: 'backend',
          featureId: 'AUTH',
          release: 'R1',
          jiraTicket: 'PROJ-123',
        },
      ]),
      getCacheInfo: jest.fn().mockResolvedValue({ isCached: true, isStale: false }),
    })),
  };
});

describe('stories show command', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows full story details with Jira for multiple IDs', async () => {
    const program = new Command();
    program.option('--json', 'Output as JSON');
    program.addCommand(createStoriesCommand());
    program.exitOverride();

    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((message?: unknown) => {
      logs.push(String(message));
    });

    await program.parseAsync(
      ['stories', 'show', 'AUTH-1', '--with-jira', '--all-fields', '--json'],
      { from: 'user' }
    );

    const output = JSON.parse(logs.join('')) as Array<{
      id: string;
      title: string;
      status: string;
      complexity: string;
      estimate: number;
      owner: string;
      milestone: string;
      tags: string[];
      notes: string;
      openspec: string;
      repo: string;
      featureId: string;
      release: string;
      jiraTicket: string;
    }>;

    expect(output).toHaveLength(1);
    expect(output[0].id).toBe('AUTH-1');
    expect(output[0].title).toBe('Login Feature');
    expect(output[0].status).toBe('planned');
    expect(output[0].complexity).toBe('M');
    expect(output[0].estimate).toBe(5);
    expect(output[0].owner).toBe('john.doe');
    expect(output[0].milestone).toBe('Q1-2025');
    expect(output[0].tags).toEqual(['auth', 'ui']);
    expect(output[0].notes).toBe('User authentication flow');
    expect(output[0].openspec).toBe('Detailed requirements in project-plan.md');
    expect(output[0].repo).toBe('backend');
    expect(output[0].featureId).toBe('AUTH');
    expect(output[0].release).toBe('R1');
    expect(output[0].jiraTicket).toBe('PROJ-123');
  });

  it('requires at least one story ID', async () => {
    const program = new Command();
    program.addCommand(createStoriesCommand());

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    await expect(program.parseAsync(['stories', 'show'], { from: 'user' })).rejects.toThrow(
      'process.exit called'
    );

    exitSpy.mockRestore();
  });
});

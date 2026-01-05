import { existsSync, mkdtempSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { Command } from 'commander';

jest.mock('chalk', () => ({
  __esModule: true,
  default: {
    blue: (message: string) => message,
    red: (message: string) => message,
    yellow: (message: string) => message,
    green: (message: string) => message,
    gray: (message: string) => message,
  },
}));

let createInitCommand: typeof import('../../src/commands/init').createInitCommand;

describe('init command', () => {
  let cwdOriginal: string;

  beforeAll(async () => {
    ({ createInitCommand } = await import('../../src/commands/init'));
  });

  beforeEach(() => {
    cwdOriginal = process.cwd();
  });

  afterEach(() => {
    process.chdir(cwdOriginal);
    jest.restoreAllMocks();
  });

  it('installs windsurf workflows and tracks targets', async () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'specdeck-init-windsurf-'));
    process.chdir(tempDir);

    const program = new Command();
    program.addCommand(createInitCommand());
    program.exitOverride();

    jest.spyOn(console, 'log').mockImplementation();

    await program.parseAsync(['init', 'windsurf'], { from: 'user' });

    expect(existsSync(join(tempDir, '.windsurf', 'workflows', 'specdeck-release-status.md'))).toBe(
      true
    );

    const versionInfo = JSON.parse(readFileSync(join(tempDir, '.specdeck-version'), 'utf-8')) as {
      templates: string[];
      version: string;
      targets: string[];
    };

    expect(versionInfo.targets).toEqual(expect.arrayContaining(['windsurf']));
    expect(versionInfo.templates).toContain('specdeck-release-status.prompt.md');
    expect(versionInfo.version).toBe('0.4.0');

    const agents = readFileSync(join(tempDir, 'AGENTS.md'), 'utf-8');
    expect(agents).toContain('<!-- SPECDECK:START -->');
    expect(agents).toContain('specdeck list stories');

    rmSync(tempDir, { recursive: true, force: true });
  });

  it('adds windsurf target alongside existing copilot install', async () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'specdeck-init-both-'));
    process.chdir(tempDir);

    const program = new Command();
    program.addCommand(createInitCommand());
    program.exitOverride();

    jest.spyOn(console, 'log').mockImplementation();

    await program.parseAsync(['init', 'copilot'], { from: 'user' });
    await program.parseAsync(['init', 'windsurf'], { from: 'user' });

    expect(
      existsSync(join(tempDir, '.github', 'prompts', 'specdeck-release-status.prompt.md'))
    ).toBe(true);
    expect(existsSync(join(tempDir, '.windsurf', 'workflows', 'specdeck-release-status.md'))).toBe(
      true
    );

    const versionInfo = JSON.parse(readFileSync(join(tempDir, '.specdeck-version'), 'utf-8')) as {
      targets: string[];
    };

    expect(versionInfo.targets).toEqual(expect.arrayContaining(['copilot', 'windsurf']));

    rmSync(tempDir, { recursive: true, force: true });
  });
});

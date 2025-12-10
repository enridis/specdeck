import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { Command } from 'commander';
import { createUpgradeCommand } from '../../src/commands/upgrade';

describe('upgrade copilot command', () => {
  let cwdOriginal: string;

  beforeEach(() => {
    cwdOriginal = process.cwd();
  });

  afterEach(() => {
    process.chdir(cwdOriginal);
    jest.restoreAllMocks();
  });

  it('upgrades a single template by alias', async () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'specdeck-upgrade-'));
    const promptsDir = join(tempDir, '.github', 'prompts');
    mkdirSync(promptsDir, { recursive: true });

    // Seed version file so upgrade is allowed
    writeFileSync(
      join(tempDir, '.specdeck-version'),
      JSON.stringify({ version: '0.1.0', timestamp: new Date().toISOString(), templates: [] })
    );

    process.chdir(tempDir);
    const program = new Command();
    program.addCommand(createUpgradeCommand());
    program.exitOverride();

    const logSpy = jest.spyOn(console, 'log').mockImplementation();

    await program.parseAsync(['upgrade', 'copilot', '--template', 'jira-sync', '--force'], {
      from: 'user',
    });

    const installed = join(promptsDir, 'specdeck-jira-sync.prompt.md');
    expect(existsSync(installed)).toBe(true);

    const versionInfo = JSON.parse(readFileSync(join(tempDir, '.specdeck-version'), 'utf-8')) as {
      templates: string[];
      version: string;
    };
    expect(versionInfo.templates).toContain('specdeck-jira-sync.prompt.md');
    expect(versionInfo.version).toBe('0.3.0');

    logSpy.mockRestore();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('lists templates with friendly names', async () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'specdeck-upgrade-list-'));
    mkdirSync(join(tempDir, '.github', 'prompts'), { recursive: true });
    writeFileSync(
      join(tempDir, '.specdeck-version'),
      JSON.stringify({ version: '0.1.0', timestamp: new Date().toISOString(), templates: [] })
    );

    process.chdir(tempDir);
    const program = new Command();
    program.addCommand(createUpgradeCommand());
    program.exitOverride();

    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((message?: unknown) => {
      logs.push(String(message));
    });

    await program.parseAsync(['upgrade', 'copilot', '--list'], {
      from: 'user',
    });

    expect(logs.join('\n')).toContain('jira-sync');
    rmSync(tempDir, { recursive: true, force: true });
  });
});

// Mock the parser with a working implementation
jest.mock('../../src/parsers/overlay.parser', () => ({
  OverlayParser: jest.fn().mockImplementation(() => ({
    parseOverlay: jest.fn((content: string) => {
      const lines: string[] = content.split('\n');
      let featureId = '';
      const jiraMappings = new Map<string, string>();

      for (const line of lines) {
        const trimmed: string = line.trim();
        // Extract feature ID from heading (# Overlay: FEATURE-ID)
        if (trimmed.startsWith('# Overlay:')) {
          featureId = trimmed.replace('# Overlay:', '').trim();
        }
        // Extract Jira mappings (- **STORY-ID**: JIRA-TICKET)
        if (trimmed.startsWith('- **') && trimmed.includes('**:')) {
          const match = trimmed.match(/- \*\*(.+?)\*\*:\s*(.+)/);
          if (match) {
            const storyId: string = match[1];
            const jiraTicket: string = match[2].trim();
            jiraMappings.set(storyId, jiraTicket);
          }
        }
      }

      return { featureId, jiraMappings };
    }),
    createOverlayMarkdown: jest.fn((featureId: string) => {
      return `# Overlay: ${featureId}\n\n## Jira Mappings\n\n## Notes\n\n`;
    }),
    addJiraMapping: jest.fn((content: string, storyId: string, jiraTicket: string) => {
      // Add a new mapping line to the content
      if (content.includes('## Jira Mappings')) {
        // Find the position after "## Jira Mappings" and add the new mapping
        const lines: string[] = content.split('\n');
        let inserted = false;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('## Jira Mappings')) {
            // Insert after this line, skipping empty lines
            let insertPos = i + 1;
            while (insertPos < lines.length && lines[insertPos].trim() === '') {
              insertPos++;
            }
            // If the next line is a mapping (starts with -), insert before it
            // Otherwise insert at the end
            if (insertPos < lines.length && lines[insertPos].trim().startsWith('- **')) {
              lines.splice(insertPos, 0, `- **${storyId}**: ${jiraTicket}`);
            } else {
              lines.push(`- **${storyId}**: ${jiraTicket}`);
            }
            inserted = true;
            break;
          }
        }
        return inserted ? lines.join('\n') : content + `\n- **${storyId}**: ${jiraTicket}`;
      }
      return content + `\n- **${storyId}**: ${jiraTicket}`;
    }),
  })),
}));

import { OverlayRepository } from '../../src/repositories/overlay.repository';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('OverlayRepository', () => {
  let overlayRepo: OverlayRepository;
  let testOverlaysDir: string;

  beforeEach(async () => {
    testOverlaysDir = join(tmpdir(), `test-overlays-${Date.now()}`);
    await fs.mkdir(testOverlaysDir, { recursive: true });
    overlayRepo = new OverlayRepository(testOverlaysDir);
  });

  afterEach(async () => {
    try {
      await fs.rm(testOverlaysDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('createOverlay', () => {
    it('should create a new overlay file', async () => {
      await overlayRepo.createOverlay('AUTH-01', 'backend');

      const filePath = join(testOverlaysDir, 'backend', 'AUTH-01.md');
      const exists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);

      expect(exists).toBe(true);
    });

    it('should generate proper markdown scaffold', async () => {
      await overlayRepo.createOverlay('FEATURE-01', 'frontend');

      const filePath = join(testOverlaysDir, 'frontend', 'FEATURE-01.md');
      const content = await fs.readFile(filePath, 'utf-8');

      expect(content).toContain('# Overlay: FEATURE-01');
      expect(content).toContain('## Jira Mappings');
      expect(content).toContain('## Notes');
    });

    it('should create nested directories if they do not exist', async () => {
      await overlayRepo.createOverlay('NEW', 'newrepo');

      const dirPath = join(testOverlaysDir, 'newrepo');
      const dirExists = await fs
        .access(dirPath)
        .then(() => true)
        .catch(() => false);

      expect(dirExists).toBe(true);
    });
  });

  describe('readOverlay', () => {
    it('should read existing overlay file', async () => {
      await overlayRepo.createOverlay('AUTH-01', 'backend');
      const result = await overlayRepo.readOverlay('AUTH-01', 'backend');

      expect(result).toBeDefined();
      expect(result?.featureId).toBe('AUTH-01');
    });

    it('should return null if overlay does not exist', async () => {
      const result = await overlayRepo.readOverlay('NONEXISTENT', 'backend');

      expect(result).toBeNull();
    });

    it('should parse overlay content correctly', async () => {
      await overlayRepo.createOverlay('TEST', 'repo');

      // Add mapping manually to test reading
      const filePath = join(testOverlaysDir, 'repo', 'TEST.md');
      const content = `# Overlay: TEST

## Jira Mappings

- **STORY-01**: PROJ-1001
- **STORY-02**: PROJ-1002`;

      await fs.writeFile(filePath, content, 'utf-8');

      const result = await overlayRepo.readOverlay('TEST', 'repo');

      expect(result?.featureId).toBe('TEST');
      expect(result?.jiraMappings.size).toBe(2);
      expect(result?.jiraMappings.get('STORY-01')).toBe('PROJ-1001');
    });
  });

  describe('addJiraMapping', () => {
    it('should add mapping to existing overlay', async () => {
      await overlayRepo.createOverlay('AUTH', 'backend');
      await overlayRepo.addJiraMapping('AUTH', 'backend', 'AUTH-01', 'PROJ-1001');

      const result = await overlayRepo.readOverlay('AUTH', 'backend');

      expect(result?.jiraMappings.get('AUTH-01')).toBe('PROJ-1001');
    });

    it('should add multiple mappings', async () => {
      await overlayRepo.createOverlay('API', 'backend');
      await overlayRepo.addJiraMapping('API', 'backend', 'API-01', 'PROJ-2001');
      await overlayRepo.addJiraMapping('API', 'backend', 'API-02', 'PROJ-2002');

      const result = await overlayRepo.readOverlay('API', 'backend');

      expect(result?.jiraMappings.size).toBe(2);
      expect(result?.jiraMappings.get('API-02')).toBe('PROJ-2002');
    });

    it('should throw if overlay does not exist', async () => {
      await expect(
        overlayRepo.addJiraMapping('MISSING', 'backend', 'STORY-01', 'PROJ-1000')
      ).rejects.toThrow();
    });
  });

  describe('readAllOverlaysForRepo', () => {
    it('should read all overlays for a repository', async () => {
      await overlayRepo.createOverlay('AUTH', 'backend');
      await overlayRepo.createOverlay('USERS', 'backend');

      const result = await overlayRepo.readAllOverlaysForRepo('backend');

      expect(result.size).toBe(2);
      expect(result.has('AUTH')).toBe(true);
      expect(result.has('USERS')).toBe(true);
    });

    it('should return empty map if repo has no overlays', async () => {
      const result = await overlayRepo.readAllOverlaysForRepo('nonexistent');

      expect(result.size).toBe(0);
    });

    it('should parse all overlay files correctly', async () => {
      await overlayRepo.createOverlay('FEATURE-1', 'backend');
      await overlayRepo.createOverlay('FEATURE-2', 'backend');

      const result = await overlayRepo.readAllOverlaysForRepo('backend');

      expect(result.get('FEATURE-1')).toBeDefined();
      expect(result.get('FEATURE-2')).toBeDefined();
    });
  });

  describe('readAllOverlays', () => {
    it('should read all overlays across all repositories', async () => {
      await overlayRepo.createOverlay('AUTH', 'backend');
      await overlayRepo.createOverlay('UI', 'frontend');
      await overlayRepo.createOverlay('ML', 'models');

      const result = await overlayRepo.readAllOverlays();

      expect(result.size).toBe(3);
      expect(result.has('backend')).toBe(true);
      expect(result.has('frontend')).toBe(true);
      expect(result.has('models')).toBe(true);
    });

    it('should return empty map if no overlays exist', async () => {
      const result = await overlayRepo.readAllOverlays();

      expect(result.size).toBe(0);
    });

    it('should organize overlays by repo', async () => {
      await overlayRepo.createOverlay('AUTH', 'backend');
      await overlayRepo.createOverlay('USERS', 'backend');
      await overlayRepo.createOverlay('UI', 'frontend');

      const result = await overlayRepo.readAllOverlays();
      const backendOverlays = result.get('backend');

      expect(backendOverlays?.size).toBe(2);
      expect(backendOverlays?.has('AUTH')).toBe(true);
      expect(backendOverlays?.has('USERS')).toBe(true);
    });
  });

  describe('deleteOverlay', () => {
    it('should delete overlay file', async () => {
      await overlayRepo.createOverlay('TEMP', 'backend');
      expect(await overlayRepo.readOverlay('TEMP', 'backend')).toBeDefined();

      await overlayRepo.deleteOverlay('TEMP', 'backend');

      expect(await overlayRepo.readOverlay('TEMP', 'backend')).toBeNull();
    });

    it('should throw if overlay does not exist', async () => {
      await expect(overlayRepo.deleteOverlay('NONEXISTENT', 'backend')).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle missing overlay directory gracefully', async () => {
      const result = await overlayRepo.readAllOverlays();

      expect(result).toBeDefined();
      expect(result.size).toBe(0);
    });

    it('should continue reading if one overlay is corrupted', async () => {
      await overlayRepo.createOverlay('GOOD', 'backend');

      // Create corrupted file
      const badPath = join(testOverlaysDir, 'backend', 'BAD.md');
      await fs.writeFile(badPath, 'CORRUPTED CONTENT {][}', 'utf-8');

      const result = await overlayRepo.readAllOverlaysForRepo('backend');

      // Should still read valid overlays
      expect(result.has('GOOD')).toBe(true);
    });
  });
});

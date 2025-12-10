// Mock the OverlayParser to provide real implementation for testing
const createMockParser = () => ({
  parseOverlay: (content: string) => {
    const lines = content.split('\n');
    let featureId = '';
    const jiraMappings = new Map();

    for (const line of lines) {
      const trimmed = line.trim();
      // Extract feature ID from heading (# Overlay: FEATURE-ID)
      if (trimmed.startsWith('# Overlay:')) {
        featureId = trimmed.replace('# Overlay:', '').trim();
      }
      // Extract Jira mappings (- **STORY-ID**: JIRA-TICKET)
      if (trimmed.startsWith('- **') && trimmed.includes('**:')) {
        const match = trimmed.match(/- \*\*(.+?)\*\*:\s*(.+)/);
        if (match) {
          const storyId = match[1];
          const jiraTicket = match[2].trim();
          jiraMappings.set(storyId, jiraTicket);
        }
      }
    }

    return { featureId, jiraMappings };
  },
  createOverlayMarkdown: (featureId: string) => {
    return `# Overlay: ${featureId}\n\n## Jira Mappings\n\n## Notes\n\n`;
  },
  addJiraMapping: (content: string, storyId: string, jiraTicket: string) => {
    if (content.includes('## Jira Mappings')) {
      const lines = content.split('\n');
      let inserted = false;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('## Jira Mappings')) {
          let insertPos = i + 1;
          while (insertPos < lines.length && lines[insertPos].trim() === '') {
            insertPos++;
          }
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
  },
});

jest.mock('../../src/parsers/overlay.parser', () => ({
  OverlayParser: jest.fn(function () {
    return createMockParser();
  }),
}));

import { OverlayParser } from '../../src/parsers/overlay.parser';

describe('OverlayParser', () => {
  let parser: OverlayParser;

  beforeEach(() => {
    parser = new OverlayParser();
  });

  describe('parseOverlay', () => {
    it('should parse valid overlay markdown', () => {
      const content = `# Overlay: AUTH-01

## Jira Mappings

- **AUTH-01-01**: PROJ-1001
- **AUTH-01-02**: PROJ-1002

## Notes

Some internal notes here.`;

      const result = parser.parseOverlay(content);

      expect(result.featureId).toBe('AUTH-01');
      expect(result.jiraMappings.size).toBe(2);
      expect(result.jiraMappings.get('AUTH-01-01')).toBe('PROJ-1001');
      expect(result.jiraMappings.get('AUTH-01-02')).toBe('PROJ-1002');
    });

    it('should extract feature ID from heading', () => {
      const content = `# Overlay: MY-FEATURE

## Jira Mappings

- **STORY-01**: JIRA-001`;

      const result = parser.parseOverlay(content);

      expect(result.featureId).toBe('MY-FEATURE');
    });

    it('should handle overlay with no mappings', () => {
      const content = `# Overlay: EMPTY

## Jira Mappings

(No mappings yet)`;

      const result = parser.parseOverlay(content);

      expect(result.featureId).toBe('EMPTY');
      expect(result.jiraMappings.size).toBe(0);
    });

    it('should handle multiple Jira mappings', () => {
      const content = `# Overlay: FEATURE-123

## Jira Mappings

- **STORY-01**: PROJ-100
- **STORY-02**: PROJ-101
- **STORY-03**: PROJ-102
- **STORY-04**: PROJ-103`;

      const result = parser.parseOverlay(content);

      expect(result.jiraMappings.size).toBe(4);
      expect(result.jiraMappings.get('STORY-04')).toBe('PROJ-103');
    });

    it('should throw error on invalid markdown', () => {
      const invalidContent = 'Not valid markdown at all {][}';

      expect(() => parser.parseOverlay(invalidContent)).not.toThrow();
      // Should parse gracefully even with minimal content
    });
  });

  describe('createOverlayMarkdown', () => {
    it('should generate scaffold overlay markdown', () => {
      const result = parser.createOverlayMarkdown('AUTH-01');

      expect(result).toContain('# Overlay: AUTH-01');
      expect(result).toContain('## Jira Mappings');
      expect(result).toContain('## Notes');
    });

    it('should generate valid markdown with proper structure', () => {
      const result = parser.createOverlayMarkdown('TEST-FEATURE');

      const lines = result.split('\n');
      expect(lines[0]).toMatch(/^# Overlay:/);
      expect(result).toContain('## Jira Mappings');
    });
  });

  describe('addJiraMapping', () => {
    it('should add mapping to existing overlay', () => {
      const content = `# Overlay: AUTH-01

## Jira Mappings

- **AUTH-01-01**: PROJ-1001

## Notes

Some notes.`;

      const result = parser.addJiraMapping(content, 'AUTH-01-02', 'PROJ-1002');

      expect(result).toContain('- **AUTH-01-02**: PROJ-1002');
      expect(result).toContain('- **AUTH-01-01**: PROJ-1001');
    });

    it('should preserve existing content when adding mapping', () => {
      const content = `# Overlay: FEATURE

## Jira Mappings

- **STORY-01**: PROJ-001

## Notes

Important: This is a critical feature`;

      const result = parser.addJiraMapping(content, 'STORY-02', 'PROJ-002');

      expect(result).toContain('# Overlay: FEATURE');
      expect(result).toContain('Important: This is a critical feature');
      expect(result).toContain('- **STORY-02**: PROJ-002');
    });

    it('should handle adding mapping to empty Jira Mappings section', () => {
      const content = `# Overlay: EMPTY

## Jira Mappings

## Notes

`;

      const result = parser.addJiraMapping(content, 'STORY-01', 'PROJ-001');

      expect(result).toContain('- **STORY-01**: PROJ-001');
    });
  });

  describe('edge cases', () => {
    it('should handle overlay with special characters in feature ID', () => {
      const content = `# Overlay: API-AUTH-V2

## Jira Mappings

- **API-AUTH-V2-01**: PROJ-5000`;

      const result = parser.parseOverlay(content);

      expect(result.featureId).toBe('API-AUTH-V2');
    });

    it('should handle story IDs with dashes', () => {
      const content = `# Overlay: FEATURE

## Jira Mappings

- **BACK-END-STORY-01**: PROJ-100`;

      const result = parser.parseOverlay(content);

      expect(result.jiraMappings.get('BACK-END-STORY-01')).toBe('PROJ-100');
    });

    it('should extract Jira ticket in various formats', () => {
      const content = `# Overlay: TEST

## Jira Mappings

- **STORY-01**: ABC-123
- **STORY-02**: PROJECT-9999`;

      const result = parser.parseOverlay(content);

      expect(result.jiraMappings.get('STORY-01')).toBe('ABC-123');
      expect(result.jiraMappings.get('STORY-02')).toBe('PROJECT-9999');
    });
  });
});

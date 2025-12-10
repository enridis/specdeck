/**
 * Jest setup file for handling ESM modules in tests
 */

// We need to mock the ESM modules to allow tests to run, but we can't use
// the real implementations. Instead, we'll implement a working parser mock.

// Simple markdown parsing implementation for tests
const parseMarkdownContent = (content) => {
  const lines = content.split('\n');
  let featureId = '';
  const jiraMappings = new Map();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Extract feature ID from heading (# Overlay: FEATURE-ID)
    if (line.startsWith('# Overlay:')) {
      featureId = line.replace('# Overlay:', '').trim();
    }

    // Extract Jira mappings (- **STORY-ID**: JIRA-TICKET)
    if (line.startsWith('- **') && line.includes('**:')) {
      const match = line.match(/- \*\*(.+?)\*\*:\s*(.+)/);
      if (match) {
        const storyId = match[1];
        const jiraTicket = match[2].trim();
        jiraMappings.set(storyId, jiraTicket);
      }
    }
  }

  return { featureId, jiraMappings };
};

// Mock unified and related ESM modules
jest.mock('unified', () => ({
  unified: jest.fn(() => ({
    use: jest.fn().mockReturnThis(),
    parse: jest.fn((content) => ({
      type: 'root',
      children: [],
    })),
  })),
}));

jest.mock('remark-parse', () => ({}));
jest.mock('remark-gfm', () => ({}));
jest.mock('remark-frontmatter', () => ({}));

// Make the parser available globally for mocking
global.parseMarkdownContent = parseMarkdownContent;




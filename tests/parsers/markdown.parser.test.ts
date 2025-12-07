import { parseMarkdown, extractFrontMatter, extractHeadings, findSection, extractTables, tableToArray, parseTableAsObjects } from '../../src/parsers/markdown.parser';

describe('Markdown Parser', () => {
  describe('parseMarkdown', () => {
    it('should parse basic markdown', () => {
      const content = '# Hello\n\nWorld';
      const ast = parseMarkdown(content);
      expect(ast.type).toBe('root');
      expect(ast.children.length).toBeGreaterThan(0);
    });
  });

  describe('extractFrontMatter', () => {
    it('should extract YAML front matter', () => {
      const content = `---
id: test
title: Test Document
---

# Content`;
      const ast = parseMarkdown(content);
      const frontMatter = extractFrontMatter(ast);
      
      expect(frontMatter).toBeDefined();
      expect(frontMatter).toHaveProperty('id', 'test');
      expect(frontMatter).toHaveProperty('title', 'Test Document');
    });

    it('should return null when no front matter exists', () => {
      const content = '# Hello World';
      const ast = parseMarkdown(content);
      const frontMatter = extractFrontMatter(ast);
      
      expect(frontMatter).toBeNull();
    });

    it('should throw error for invalid YAML', () => {
      const content = `---
invalid: [yaml
---

# Content`;
      const ast = parseMarkdown(content);
      
      expect(() => extractFrontMatter(ast)).toThrow();
    });
  });

  describe('extractHeadings', () => {
    it('should extract all headings with depth', () => {
      const content = `# Title
## Subtitle
### Section
## Another Subtitle`;
      const ast = parseMarkdown(content);
      const headings = extractHeadings(ast);
      
      expect(headings).toHaveLength(4);
      expect(headings[0]).toEqual({ depth: 1, text: 'Title' });
      expect(headings[1]).toEqual({ depth: 2, text: 'Subtitle' });
      expect(headings[2]).toEqual({ depth: 3, text: 'Section' });
      expect(headings[3]).toEqual({ depth: 2, text: 'Another Subtitle' });
    });

    it('should extract text from complex headings', () => {
      const content = '## **Bold** and *italic* heading';
      const ast = parseMarkdown(content);
      const headings = extractHeadings(ast);
      
      expect(headings[0].text).toBe('Bold and italic heading');
    });
  });

  describe('findSection', () => {
    it('should find section content by heading', () => {
      const content = `# Title
## Section A
Content A1
Content A2
## Section B
Content B`;
      const ast = parseMarkdown(content);
      const section = findSection(ast, 'Section A');
      
      expect(section.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-existent section', () => {
      const content = '# Title\n\nContent';
      const ast = parseMarkdown(content);
      const section = findSection(ast, 'Non-existent');
      
      expect(section).toEqual([]);
    });
  });

  describe('extractTables', () => {
    it('should extract GFM tables', () => {
      const content = `# Document

| Column 1 | Column 2 |
|----------|----------|
| Value 1  | Value 2  |
| Value 3  | Value 4  |`;
      const ast = parseMarkdown(content);
      const tables = extractTables(ast);
      
      expect(tables).toHaveLength(1);
      expect(tables[0].type).toBe('table');
    });

    it('should extract multiple tables', () => {
      const content = `
| Table 1 |
|---------|
| Data 1  |

Some text

| Table 2 |
|---------|
| Data 2  |`;
      const ast = parseMarkdown(content);
      const tables = extractTables(ast);
      
      expect(tables).toHaveLength(2);
    });
  });

  describe('tableToArray', () => {
    it('should convert table to 2D array', () => {
      const content = `| A | B |
|---|---|
| 1 | 2 |
| 3 | 4 |`;
      const ast = parseMarkdown(content);
      const tables = extractTables(ast);
      const array = tableToArray(tables[0]);
      
      expect(array).toEqual([
        ['A', 'B'],
        ['1', '2'],
        ['3', '4'],
      ]);
    });
  });

  describe('parseTableAsObjects', () => {
    it('should parse table rows as objects using headers', () => {
      const content = `| ID | Name | Status |
|-----|------|--------|
| 1   | Test | Active |
| 2   | Demo | Done   |`;
      const ast = parseMarkdown(content);
      const tables = extractTables(ast);
      const objects = parseTableAsObjects(tables[0]);
      
      expect(objects).toHaveLength(2);
      expect(objects[0]).toEqual({ ID: '1', Name: 'Test', Status: 'Active' });
      expect(objects[1]).toEqual({ ID: '2', Name: 'Demo', Status: 'Done' });
    });

    it('should return empty array for table without data rows', () => {
      const content = `| Column |
|--------|`;
      const ast = parseMarkdown(content);
      const tables = extractTables(ast);
      const objects = parseTableAsObjects(tables[0]);
      
      expect(objects).toEqual([]);
    });
  });
});

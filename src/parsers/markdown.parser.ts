import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import { Root, Content, Heading, Table, Yaml } from 'mdast';
import { parse as parseYaml } from 'yaml';

/**
 * Parse markdown content into an AST
 */
export function parseMarkdown(content: string): Root {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFrontmatter, ['yaml']);
  
  return processor.parse(content) as Root;
}

/**
 * Extract YAML front matter from markdown AST
 */
export function extractFrontMatter<T = Record<string, unknown>>(ast: Root): T | null {
  const yamlNode = ast.children.find((node): node is Yaml => node.type === 'yaml');
  
  if (!yamlNode) {
    return null;
  }
  
  try {
    return parseYaml(yamlNode.value) as T;
  } catch (error) {
    throw new Error(`Failed to parse YAML front matter: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract all headings from markdown AST
 */
export function extractHeadings(ast: Root): Array<{ depth: number; text: string }> {
  const headings: Array<{ depth: number; text: string }> = [];
  
  function visit(node: Content) {
    if (node.type === 'heading') {
      const heading = node as Heading;
      const text = extractTextFromNode(heading);
      headings.push({ depth: heading.depth, text });
    }
    
    if ('children' in node) {
      (node.children as Content[]).forEach(visit);
    }
  }
  
  ast.children.forEach(visit);
  return headings;
}

/**
 * Extract text content from a node
 */
function extractTextFromNode(node: Content): string {
  if (node.type === 'text') {
    return node.value;
  }
  
  if ('children' in node) {
    return (node.children as Content[])
      .map(extractTextFromNode)
      .join('');
  }
  
  return '';
}

/**
 * Find a section by heading text
 */
export function findSection(ast: Root, headingText: string): Content[] {
  let capturing = false;
  let targetDepth = 0;
  const sectionContent: Content[] = [];
  
  for (const node of ast.children) {
    if (node.type === 'heading') {
      const heading = node as Heading;
      const text = extractTextFromNode(heading);
      
      if (text === headingText) {
        capturing = true;
        targetDepth = heading.depth;
        continue;
      }
      
      if (capturing && heading.depth <= targetDepth) {
        break;
      }
    }
    
    if (capturing) {
      sectionContent.push(node);
    }
  }
  
  return sectionContent;
}

/**
 * Extract tables from markdown AST
 */
export function extractTables(ast: Root): Table[] {
  const tables: Table[] = [];
  
  function visit(node: Content) {
    if (node.type === 'table') {
      tables.push(node as Table);
    }
    
    if ('children' in node) {
      (node.children as Content[]).forEach(visit);
    }
  }
  
  ast.children.forEach(visit);
  return tables;
}

/**
 * Convert a GFM table to a 2D array of strings
 */
export function tableToArray(table: Table): string[][] {
  return table.children.map(row => {
    return row.children.map(cell => {
      return cell.children.map(extractTextFromNode).join('');
    });
  });
}

/**
 * Parse a table into objects using first row as headers
 */
export function parseTableAsObjects<T = Record<string, string>>(table: Table): T[] {
  const rows = tableToArray(table);
  
  if (rows.length < 2) {
    return [];
  }
  
  const headers = rows[0];
  const dataRows = rows.slice(1);
  
  return dataRows.map(row => {
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj as T;
  });
}

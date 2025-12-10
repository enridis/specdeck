import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { Node, Parent } from 'unist';

interface TextNode extends Node {
  type: 'text';
  value: string;
}

interface HeadingNode extends Parent {
  type: 'heading';
  depth: number;
}

interface StrongNode extends Parent {
  type: 'strong';
}

export interface OverlayData {
  featureId: string;
  jiraMappings: Map<string, string>; // story ID -> Jira ticket
  notes: Map<string, string>; // story ID -> note
}

export class OverlayParser {
  private readonly processor = unified().use(remarkParse).use(remarkGfm);

  /**
   * Parse overlay markdown content
   */
  parseOverlay(content: string): OverlayData {
    try {
      // Extract feature ID from YAML front matter
      let featureId = '';
      const yamlMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
      if (yamlMatch) {
        const yamlContent = yamlMatch[1];
        const featureMatch = yamlContent.match(/feature:\s*([A-Z0-9-]+)/i);
        if (featureMatch) {
          featureId = featureMatch[1];
        }
      }

      const ast = this.processor.parse(content);
      const jiraMappings = new Map<string, string>();
      const notes = new Map<string, string>();

      // Walk through AST to extract data
      this.walkNode(ast, (node: Node) => {
        // Fallback: Extract feature ID from heading if not in YAML
        if (!featureId && node.type === 'heading') {
          const heading = node as HeadingNode;
          if (heading.depth === 1 && heading.children && heading.children.length > 0) {
            const firstChild = heading.children[0];
            if (firstChild.type === 'text') {
              const textNode = firstChild as TextNode;
              // Extract ID from "# Overlay: FEATURE-01"
              const match = textNode.value.match(/Overlay:\s*([A-Z0-9-]+)/);
              if (match) {
                featureId = match[1];
              }
            }
          }
        }

        // Extract Jira mappings from markdown table
        if (node.type === 'table' && 'children' in node) {
          const table = node as Parent;
          let isJiraMappingTable = false;

          // Check if this is a Jira mapping table by examining headers
          if (table.children.length > 0) {
            const headerRow = table.children[0];
            if (headerRow.type === 'tableRow' && 'children' in headerRow) {
              const row = headerRow as Parent;
              const headers: string[] = [];

              for (const cell of row.children) {
                if (cell.type === 'tableCell' && 'children' in cell) {
                  const cellNode = cell as Parent;
                  const text = this.extractText(cellNode);
                  headers.push(text.toLowerCase().trim());
                }
              }

              // Check if headers match Jira mapping table
              isJiraMappingTable =
                headers.length === 2 && headers[0].includes('story') && headers[1].includes('jira');
            }
          }

          // Parse table rows if it's a Jira mapping table
          if (isJiraMappingTable) {
            // Skip header row (index 0)
            for (let i = 1; i < table.children.length; i++) {
              const row = table.children[i];
              if (row.type === 'tableRow' && 'children' in row) {
                const rowNode = row as Parent;
                if (rowNode.children.length >= 2) {
                  const storyIdCell = rowNode.children[0];
                  const jiraTicketCell = rowNode.children[1];

                  if (
                    storyIdCell.type === 'tableCell' &&
                    'children' in storyIdCell &&
                    jiraTicketCell.type === 'tableCell' &&
                    'children' in jiraTicketCell
                  ) {
                    const storyId = this.extractText(storyIdCell as Parent).trim();
                    const jiraTicket = this.extractText(jiraTicketCell as Parent).trim();

                    if (storyId && jiraTicket) {
                      jiraMappings.set(storyId, jiraTicket);
                    }
                  }
                }
              }
            }
          }
        }

        // Fallback: Extract Jira mappings from list items (old format)
        if (node.type === 'listItem' && 'children' in (node as Parent)) {
          const listItem = node as Parent;
          const firstParagraph = listItem.children[0];
          if (
            firstParagraph &&
            firstParagraph.type === 'paragraph' &&
            'children' in firstParagraph
          ) {
            const paragraph = firstParagraph as Parent;
            let text = '';
            for (const child of paragraph.children) {
              if (child.type === 'text') {
                const textNode = child as TextNode;
                text += textNode.value;
              } else if (child.type === 'strong' && 'children' in child) {
                const strong = child as StrongNode;
                for (const strongChild of strong.children) {
                  if (strongChild.type === 'text') {
                    const textNode = strongChild as TextNode;
                    text += textNode.value;
                  }
                }
              }
            }

            // Parse "- **STORY-ID**: JIRA-TICKET" format
            const jiraMatch = text.match(/([A-Z0-9-]+):\s*([A-Z]+-\d+)/);
            if (jiraMatch) {
              jiraMappings.set(jiraMatch[1], jiraMatch[2]);
            }
          }
        }
      });

      return {
        featureId,
        jiraMappings,
        notes,
      };
    } catch (error) {
      throw new Error(
        `Failed to parse overlay: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Extract text content from a node
   */
  private extractText(node: Parent): string {
    let text = '';
    for (const child of node.children) {
      if (child.type === 'text') {
        text += (child as TextNode).value;
      } else if ('children' in child) {
        text += this.extractText(child as Parent);
      }
    }
    return text;
  }

  /**
   * Walk AST tree recursively
   */
  private walkNode(node: Node, callback: (node: Node) => void): void {
    callback(node);

    if ('children' in node && Array.isArray((node as Parent).children)) {
      for (const child of (node as Parent).children) {
        this.walkNode(child, callback);
      }
    }
  }

  /**
   * Create overlay markdown from data
   */
  createOverlayMarkdown(featureId: string): string {
    return `---
feature: ${featureId}
---

# Jira Mappings

| Story ID | Jira Ticket |
|----------|-------------|
| STORY-01 | PROJ-123 |

(Add more mappings to the table above)
`;
  }

  /**
   * Add Jira mapping to overlay markdown
   */
  addJiraMapping(content: string, storyId: string, jiraTicket: string): string {
    // Find the Jira Mappings table and add a new row
    const tableRowPattern = /(\|\s*Story ID\s*\|\s*Jira Ticket\s*\|[\s\S]*?)(\n\n|\n(?![|\s]))/;
    const match = content.match(tableRowPattern);

    if (match) {
      const mappingLine = `| ${storyId} | ${jiraTicket} |`;
      const updatedTable = match[1] + '\n' + mappingLine;
      return content.replace(tableRowPattern, updatedTable + match[2]);
    }

    // Fallback for old format
    const mappingLine = `- **${storyId}**: ${jiraTicket}`;
    const sections = content.split('## Jira Mappings');
    if (sections.length < 2) {
      return content;
    }

    const notesSection = sections[1].split('## Notes');
    if (notesSection.length < 2) {
      return content;
    }

    const mappingsContent = notesSection[0].trim();
    const updatedMappings = mappingsContent + '\n' + mappingLine;

    return (
      sections[0] + '## Jira Mappings\n\n' + updatedMappings + '\n\n## Notes' + notesSection[1]
    );
  }
}

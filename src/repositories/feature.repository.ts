import { Feature, FeatureSchema } from '../schemas';
import { parseMarkdown, findSection, parseTableAsObjects } from '../parsers';
import { List, Content, Table } from 'mdast';

/**
 * Extract text content from a node recursively
 */
function extractTextFromNode(node: Content): string {
  if (node.type === 'text') {
    return 'value' in node ? String(node.value) : '';
  }

  if (node.type === 'inlineCode') {
    return 'value' in node ? String(node.value) : '';
  }

  if ('children' in node) {
    return (node.children as Content[]).map(extractTextFromNode).join('');
  }

  return '';
}

export class FeatureRepository {
  /**
   * Extract features from a release markdown content
   */
  async extractFromRelease(releaseContent: string, releaseId: string): Promise<Feature[]> {
    return Promise.resolve(this.extractFromReleaseSync(releaseContent, releaseId));
  }

  /**
   * Extract features from a release markdown content (synchronous)
   */
  private extractFromReleaseSync(releaseContent: string, releaseId: string): Feature[] {
    const ast = parseMarkdown(releaseContent);
    const featuresSection = findSection(ast, 'Features');

    if (featuresSection.length === 0) {
      return [];
    }

    // First try to find a table in the Features section
    const tables = featuresSection.filter((node): node is Table => node.type === 'table');

    if (tables.length > 0) {
      return this.extractFromTable(tables[0], releaseId);
    }

    // If no table, try to parse bullet list format
    const lists = featuresSection.filter((node): node is List => node.type === 'list');

    if (lists.length > 0) {
      return this.extractFromBulletList(lists[0], releaseId);
    }

    return [];
  }

  /**
   * Extract features from a table format
   */
  private extractFromTable(table: Table, releaseId: string): Feature[] {
    const rawFeatures = parseTableAsObjects(table);
    const features: Feature[] = [];

    for (const raw of rawFeatures) {
      try {
        const feature = FeatureSchema.parse({
          id: raw['ID'] || raw['id'],
          title: raw['Title'] || raw['title'] || raw['Feature'],
          description: raw['Description'] || raw['description'],
          releaseId,
          openspecChange: raw['OpenSpec Change'] || raw['openspecChange'],
          repos: raw['Repos'] ? raw['Repos'].split(',').map((r) => r.trim()) : [],
          storyCount: raw['Stories'] ? parseInt(raw['Stories'], 10) : 0,
        });

        features.push(feature);
      } catch (error) {
        console.warn(
          `Skipping invalid feature: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return features;
  }

  /**
   * Extract features from bullet list format
   * Expected format:
   * - **FEATURE-ID**: Feature Title
   *   - Description line 1
   *   - Description line 2
   */
  private extractFromBulletList(list: List, releaseId: string): Feature[] {
    const features: Feature[] = [];

    for (const item of list.children) {
      if (!item.children || item.children.length === 0) continue;

      const firstParagraph = item.children[0];
      if (firstParagraph.type !== 'paragraph') continue;

      const text = extractTextFromNode(firstParagraph);

      // Parse format: FEATURE-ID: Feature Title (strong/bold markers already parsed out)
      const match = text.match(/^([A-Z]+-[A-Z0-9]+):\s*(.+)$/);
      if (!match) continue;

      const [, id, title] = match;

      // Extract description from nested list items
      let description = '';
      const nestedList = item.children.find((child) => child.type === 'list');
      if (nestedList) {
        const descriptionLines = nestedList.children
          .map((listItem) => {
            if (listItem.children && listItem.children[0]) {
              return extractTextFromNode(listItem.children[0]);
            }
            return '';
          })
          .filter((line) => line.length > 0);
        description = descriptionLines.join('\n');
      }

      try {
        const feature = FeatureSchema.parse({
          id,
          title,
          description,
          releaseId,
          repos: [],
        });

        features.push(feature);
      } catch (error) {
        console.warn(
          `Skipping invalid feature ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return features;
  }

  /**
   * Find features by release ID
   */
  async findByReleaseId(releaseContent: string, releaseId: string): Promise<Feature[]> {
    return this.extractFromRelease(releaseContent, releaseId);
  }
}

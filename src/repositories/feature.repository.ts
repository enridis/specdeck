import { Feature, FeatureSchema } from '../schemas';
import { parseMarkdown, findSection, parseTableAsObjects } from '../parsers';

export class FeatureRepository {
  /**
   * Extract features from a release markdown content
   */
  async extractFromRelease(releaseContent: string, releaseId: string): Promise<Feature[]> {
    const ast = parseMarkdown(releaseContent);
    const featuresSection = findSection(ast, 'Features');

    if (featuresSection.length === 0) {
      return [];
    }

    // Look for a table in the Features section
    const tables = featuresSection.filter(node => node.type === 'table');
    
    if (tables.length === 0) {
      return [];
    }

    const rawFeatures = parseTableAsObjects(tables[0] as any);
    const features: Feature[] = [];

    for (const raw of rawFeatures) {
      try {
        const feature = FeatureSchema.parse({
          id: raw['ID'] || raw['id'],
          title: raw['Title'] || raw['title'] || raw['Feature'],
          description: raw['Description'] || raw['description'],
          releaseId,
          openspecChange: raw['OpenSpec Change'] || raw['openspecChange'],
          repos: raw['Repos'] ? raw['Repos'].split(',').map(r => r.trim()) : [],
          storyCount: raw['Stories'] ? parseInt(raw['Stories'], 10) : 0,
        });

        features.push(feature);
      } catch (error) {
        console.warn(`Skipping invalid feature: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

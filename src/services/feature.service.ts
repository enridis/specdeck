import { join } from 'path';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { readFile, writeFile, unlink } from 'fs/promises';
import { Feature, Story, FeatureSchema } from '../schemas';
import { FeatureRepository, ReleaseRepository, ConfigRepository } from '../repositories';
import { StoryService } from './story.service';
import { CacheStory } from '../schemas/cache.schema';

export interface FeatureWithStories extends Feature {
  stories: Story[];
}

export class FeatureService {
  private featureRepository: FeatureRepository;
  private releaseRepository: ReleaseRepository;
  private storyService: StoryService;
  private configRepository: ConfigRepository;
  private rootPath: string;

  constructor(specdeckDir: string, rootPath?: string) {
    this.rootPath = rootPath || process.cwd();
    const releasesDir = join(specdeckDir, 'releases');
    this.featureRepository = new FeatureRepository();
    this.releaseRepository = new ReleaseRepository(releasesDir);
    this.storyService = new StoryService(specdeckDir, this.rootPath);
    this.configRepository = new ConfigRepository(this.rootPath);
  }

  /**
   * Get all features across all releases
   */
  async listFeatures(): Promise<Feature[]> {
    const releases = await this.releaseRepository.readAll();
    const allFeatures: Feature[] = [];

    for (const release of releases) {
      const releasePath = join(this.releaseRepository['releasesDir'], `${release.id}.md`);
      const content = readFileSync(releasePath, 'utf-8');
      const features = await this.featureRepository.extractFromRelease(content, release.id);
      allFeatures.push(...features);
    }

    return allFeatures;
  }

  /**
   * Get all features with cache awareness for coordinator mode
   *
   * In coordinator mode, derives features from cached stories.
   * In regular mode, falls back to reading from release files.
   */
  async listFeaturesWithCache(): Promise<Feature[]> {
    // Check if coordinator mode
    const isCoordinator = await this.configRepository.isCoordinatorMode();

    if (!isCoordinator) {
      // Regular mode: read from files
      return this.listFeatures();
    }

    // Coordinator mode: derive features from cached stories
    const stories = await this.storyService.listStoriesWithCache();
    const featureMap = new Map<string, Feature>();

    for (const story of stories) {
      if (!featureMap.has(story.featureId)) {
        // Create a minimal feature object from story data
        const feature: Feature = {
          id: story.featureId,
          title: story.featureId, // We don't have title in cache, use ID
          releaseId: story.releaseId,
          description: '',
          storyCount: 0,
          repos: (story as CacheStory).repo ? [(story as CacheStory).repo] : [],
        };
        featureMap.set(story.featureId, feature);
      }
      // Count stories
      featureMap.get(story.featureId)!.storyCount++;
    }

    return Array.from(featureMap.values());
  }

  /**
   * Get features for a specific release
   */
  async getFeaturesByRelease(releaseId: string): Promise<Feature[]> {
    const release = await this.releaseRepository.findById(releaseId);

    if (!release) {
      return [];
    }

    const releasePath = join(this.releaseRepository['releasesDir'], `${releaseId}.md`);
    const content = readFileSync(releasePath, 'utf-8');

    return this.featureRepository.extractFromRelease(content, releaseId);
  }

  /**
   * Get a feature with its stories
   */
  async getFeatureWithStories(featureId: string): Promise<FeatureWithStories | null> {
    const allFeatures = await this.listFeaturesWithCache();
    const feature = allFeatures.find((f) => f.id === featureId);

    if (!feature) {
      return null;
    }

    const stories = await this.storyService.getStoriesByFeatureWithCache(featureId);

    return {
      ...feature,
      stories,
    };
  }

  /**
   * List all features with their stories
   */
  async listFeaturesWithStories(): Promise<FeatureWithStories[]> {
    const features = await this.listFeatures();
    const withStories: FeatureWithStories[] = [];

    for (const feature of features) {
      const stories = await this.storyService.getStoriesByFeature(feature.id);
      withStories.push({
        ...feature,
        stories,
      });
    }

    return withStories;
  }

  /**
   * Get features for a specific release with their stories
   */
  async getFeaturesByReleaseWithStories(releaseId: string): Promise<FeatureWithStories[]> {
    const features = await this.getFeaturesByRelease(releaseId);
    const withStories: FeatureWithStories[] = [];

    for (const feature of features) {
      const stories = await this.storyService.getStoriesByFeature(feature.id);
      withStories.push({
        ...feature,
        stories,
      });
    }

    return withStories;
  }

  /**
   * Create a new feature in a release
   */
  async createFeature(feature: Omit<Feature, 'storyCount'>): Promise<Feature> {
    const validated = FeatureSchema.parse({ ...feature, storyCount: 0 });

    const releasePath = join(this.releaseRepository['releasesDir'], `${validated.releaseId}.md`);
    const featureFilePath = join(
      this.releaseRepository['releasesDir'],
      validated.releaseId,
      `${validated.id}.md`
    );

    // Check if release exists
    if (!existsSync(releasePath)) {
      throw new Error(`Release ${validated.releaseId} not found`);
    }

    // Check if feature already exists
    if (existsSync(featureFilePath)) {
      throw new Error(`Feature ${validated.id} already exists`);
    }

    // Read release file
    const content = await readFile(releasePath, 'utf-8');

    // Add feature to release file
    const updatedContent = this.addFeatureToReleaseContent(content, validated);

    // Write atomically
    const tempPath = `${releasePath}.tmp`;
    await writeFile(tempPath, updatedContent, 'utf-8');
    await writeFile(releasePath, updatedContent, 'utf-8');
    await unlink(tempPath).catch(() => {});

    // Create feature file
    const featureDir = join(this.releaseRepository['releasesDir'], validated.releaseId);
    if (!existsSync(featureDir)) {
      mkdirSync(featureDir, { recursive: true });
    }

    const featureFileContent = this.generateFeatureFileContent(validated);
    await writeFile(featureFilePath, featureFileContent, 'utf-8');

    return validated;
  }

  /**
   * Update an existing feature
   */
  async updateFeature(id: string, updates: Partial<Feature>): Promise<Feature> {
    const existing = await this.getFeatureWithStories(id);
    if (!existing) {
      throw new Error(`Feature ${id} not found`);
    }

    const updated = FeatureSchema.parse({
      ...existing,
      ...updates,
      id: existing.id, // Prevent ID changes
      releaseId: existing.releaseId, // Prevent release changes
    });

    const releasePath = join(this.releaseRepository['releasesDir'], `${updated.releaseId}.md`);
    const content = await readFile(releasePath, 'utf-8');

    // Update feature in release file
    const updatedContent = this.updateFeatureInReleaseContent(content, updated);

    // Write atomically
    const tempPath = `${releasePath}.tmp`;
    await writeFile(tempPath, updatedContent, 'utf-8');
    await writeFile(releasePath, updatedContent, 'utf-8');
    await unlink(tempPath).catch(() => {});

    return updated;
  }

  /**
   * Delete a feature
   */
  async deleteFeature(id: string): Promise<void> {
    const feature = await this.getFeatureWithStories(id);
    if (!feature) {
      throw new Error(`Feature ${id} not found`);
    }

    // Check if feature has stories
    if (feature.stories && feature.stories.length > 0) {
      throw new Error(
        `Cannot delete feature ${id}: it has ${feature.stories.length} stories. Delete stories first.`
      );
    }

    const releasePath = join(this.releaseRepository['releasesDir'], `${feature.releaseId}.md`);
    const content = await readFile(releasePath, 'utf-8');

    // Remove feature from release file
    const updatedContent = this.removeFeatureFromReleaseContent(content, id);

    // Write atomically
    const tempPath = `${releasePath}.tmp`;
    await writeFile(tempPath, updatedContent, 'utf-8');
    await writeFile(releasePath, updatedContent, 'utf-8');
    await unlink(tempPath).catch(() => {});

    // Delete feature file if it exists
    const featureFilePath = join(
      this.releaseRepository['releasesDir'],
      feature.releaseId,
      `${id}.md`
    );
    if (existsSync(featureFilePath)) {
      await unlink(featureFilePath);
    }
  }

  /**
   * Add a feature to release markdown content
   */
  private addFeatureToReleaseContent(content: string, feature: Feature): string {
    const lines = content.split('\n');

    // Find the Features section
    let featuresIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^##\s+Features\s*$/i)) {
        featuresIndex = i;
        break;
      }
    }

    if (featuresIndex === -1) {
      // No Features section, add it at the end
      return (
        content +
        `\n\n## Features\n\n- **${feature.id}**: ${feature.title}\n${feature.description ? `  - ${feature.description}\n` : ''}`
      );
    }

    // Find where to insert (after the Features heading and any existing content)
    let insertIndex = featuresIndex + 1;

    // Skip empty lines after the heading
    while (insertIndex < lines.length && lines[insertIndex].trim() === '') {
      insertIndex++;
    }

    // Insert the new feature
    const featureLines = [`- **${feature.id}**: ${feature.title}`];
    if (feature.description) {
      featureLines.push(`  - ${feature.description}`);
    }

    lines.splice(insertIndex, 0, ...featureLines, '');

    return lines.join('\n');
  }

  /**
   * Update a feature in release markdown content
   */
  private updateFeatureInReleaseContent(content: string, feature: Feature): string {
    const lines = content.split('\n');

    // Find the feature line
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/^-\s+\*\*([A-Z]+-[A-Z0-9]+)\*\*:/);
      if (match && match[1] === feature.id) {
        // Update the feature line
        lines[i] = `- **${feature.id}**: ${feature.title}`;

        // Update or remove description line
        if (i + 1 < lines.length && lines[i + 1].match(/^\s+-\s+/)) {
          if (feature.description) {
            lines[i + 1] = `  - ${feature.description}`;
          } else {
            lines.splice(i + 1, 1);
          }
        } else if (feature.description) {
          lines.splice(i + 1, 0, `  - ${feature.description}`);
        }

        break;
      }
    }

    return lines.join('\n');
  }

  /**
   * Remove a feature from release markdown content
   */
  private removeFeatureFromReleaseContent(content: string, featureId: string): string {
    const lines = content.split('\n');

    // Find and remove the feature lines
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/^-\s+\*\*([A-Z]+-[A-Z0-9]+)\*\*:/);
      if (match && match[1] === featureId) {
        // Remove the feature line
        lines.splice(i, 1);

        // Remove description line if it exists
        if (i < lines.length && lines[i].match(/^\s+-\s+/)) {
          lines.splice(i, 1);
        }

        // Remove trailing empty line if present
        if (i < lines.length && lines[i].trim() === '') {
          lines.splice(i, 1);
        }

        break;
      }
    }

    return lines.join('\n');
  }

  /**
   * Generate feature file content
   */
  private generateFeatureFileContent(feature: Feature): string {
    return `---
release: ${feature.releaseId}
feature: ${feature.id}
---

# Feature: ${feature.id}

## Description

${feature.title}
${feature.description ? `\n${feature.description}` : ''}

## Stories

| ID | Title | Status | Complexity | Estimate | Owner | Milestone | Jira | OpenSpec | Tags | Notes |
|----|-------|--------|------------|----------|-------|-----------|------|----------|------|-------|

`;
  }
}

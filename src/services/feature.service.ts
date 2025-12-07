import { join } from 'path';
import { readFileSync } from 'fs';
import { Feature, Story } from '../schemas';
import { FeatureRepository, ReleaseRepository } from '../repositories';
import { StoryService } from './story.service';

export interface FeatureWithStories extends Feature {
  stories: Story[];
}

export class FeatureService {
  private featureRepository: FeatureRepository;
  private releaseRepository: ReleaseRepository;
  private storyService: StoryService;

  constructor(openspecDir: string, specdeckDir?: string) {
    const releasesDir = join(openspecDir, 'releases');
    this.featureRepository = new FeatureRepository();
    this.releaseRepository = new ReleaseRepository(releasesDir);
    this.storyService = new StoryService(openspecDir, specdeckDir);
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
    const allFeatures = await this.listFeatures();
    const feature = allFeatures.find((f) => f.id === featureId);

    if (!feature) {
      return null;
    }

    const stories = await this.storyService.getStoriesByFeature(featureId);

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
}

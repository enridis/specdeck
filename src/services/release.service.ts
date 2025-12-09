import { join } from 'path';
import { readFileSync } from 'fs';
import { Release, Feature } from '../schemas';
import { ReleaseRepository, FeatureRepository } from '../repositories';

export interface ReleaseWithFeatures extends Release {
  featureList: Feature[];
}

export class ReleaseService {
  private releaseRepository: ReleaseRepository;
  private featureRepository: FeatureRepository;

  constructor(specdeckDir: string) {
    const releasesDir = join(specdeckDir, 'releases');
    this.releaseRepository = new ReleaseRepository(releasesDir);
    this.featureRepository = new FeatureRepository();
  }

  /**
   * Get all releases
   */
  async listReleases(): Promise<Release[]> {
    return this.releaseRepository.readAll();
  }

  /**
   * Get a specific release by ID
   */
  async getRelease(id: string): Promise<Release | null> {
    return this.releaseRepository.findById(id);
  }

  /**
   * Get a release with its features
   */
  async getReleaseWithFeatures(id: string): Promise<ReleaseWithFeatures | null> {
    const release = await this.releaseRepository.findById(id);

    if (!release) {
      return null;
    }

    // Read the release file content to extract features
    const releasePath = join(this.releaseRepository['releasesDir'], `${id}.md`);
    const content = readFileSync(releasePath, 'utf-8');
    const features = await this.featureRepository.extractFromRelease(content, id);

    return {
      ...release,
      featureList: features,
    };
  }

  /**
   * List all releases with their features
   */
  async listReleasesWithFeatures(): Promise<ReleaseWithFeatures[]> {
    const releases = await this.listReleases();
    const withFeatures: ReleaseWithFeatures[] = [];

    for (const release of releases) {
      const releaseWithFeatures = await this.getReleaseWithFeatures(release.id);
      if (releaseWithFeatures) {
        withFeatures.push(releaseWithFeatures);
      }
    }

    return withFeatures;
  }

  /**
   * Create a new release
   */
  async createRelease(release: Release): Promise<Release> {
    return this.releaseRepository.create(release);
  }

  /**
   * Update an existing release
   */
  async updateRelease(id: string, updates: Partial<Release>): Promise<Release> {
    return this.releaseRepository.update(id, updates);
  }

  /**
   * Delete a release
   */
  async deleteRelease(id: string): Promise<void> {
    return this.releaseRepository.delete(id);
  }
}

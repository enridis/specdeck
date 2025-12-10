import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { OverlayParser, OverlayData } from '../parsers/overlay.parser';

export class OverlayRepository {
  private readonly parser = new OverlayParser();

  constructor(private readonly overlaysDir: string) {}

  /**
   * Read overlay file for a specific feature and repository
   */
  async readOverlay(featureId: string, repoName: string): Promise<OverlayData | null> {
    const overlayPath = join(this.overlaysDir, repoName, `${featureId}.md`);

    if (!existsSync(overlayPath)) {
      return null;
    }

    try {
      const content = await readFile(overlayPath, 'utf-8');
      return this.parser.parseOverlay(content);
    } catch (error) {
      throw new Error(
        `Failed to read overlay ${overlayPath}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Read all overlays for a repository
   */
  async readAllOverlaysForRepo(repoName: string): Promise<Map<string, OverlayData>> {
    const repoOverlaysDir = join(this.overlaysDir, repoName);
    const result = new Map<string, OverlayData>();

    if (!existsSync(repoOverlaysDir)) {
      return result;
    }

    try {
      const fs = await import('fs/promises');
      const files = await fs.readdir(repoOverlaysDir);

      for (const file of files) {
        if (file.endsWith('.md')) {
          const featureId = file.replace('.md', '');
          const filePath = join(repoOverlaysDir, file);
          const content = await readFile(filePath, 'utf-8');
          const overlay = this.parser.parseOverlay(content);
          result.set(featureId, overlay);
        }
      }
    } catch (error) {
      throw new Error(
        `Failed to read overlays from ${repoOverlaysDir}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return result;
  }

  /**
   * Read all overlays across all repositories
   */
  async readAllOverlays(): Promise<Map<string, Map<string, OverlayData>>> {
    const allOverlays = new Map<string, Map<string, OverlayData>>();

    if (!existsSync(this.overlaysDir)) {
      return allOverlays;
    }

    try {
      const fs = await import('fs/promises');
      const repoDirs = await fs.readdir(this.overlaysDir);

      for (const repoDir of repoDirs) {
        const repoPath = join(this.overlaysDir, repoDir);
        const stat = await fs.stat(repoPath);

        if (stat.isDirectory()) {
          const repoOverlays = await this.readAllOverlaysForRepo(repoDir);
          if (repoOverlays.size > 0) {
            allOverlays.set(repoDir, repoOverlays);
          }
        }
      }
    } catch (error) {
      throw new Error(
        `Failed to read all overlays: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return allOverlays;
  }

  /**
   * Create new overlay file for a feature
   */
  async createOverlay(featureId: string, repoName: string): Promise<void> {
    const repoOverlaysDir = join(this.overlaysDir, repoName);
    const overlayPath = join(repoOverlaysDir, `${featureId}.md`);

    try {
      // Create directories if they don't exist
      await mkdir(repoOverlaysDir, { recursive: true });

      // Generate scaffold content
      const content = this.parser.createOverlayMarkdown(featureId);

      // Write file
      await writeFile(overlayPath, content, 'utf-8');
    } catch (error) {
      throw new Error(
        `Failed to create overlay: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Add Jira mapping to overlay
   */
  async addJiraMapping(
    featureId: string,
    repoName: string,
    storyId: string,
    jiraTicket: string
  ): Promise<void> {
    const overlayPath = join(this.overlaysDir, repoName, `${featureId}.md`);

    if (!existsSync(overlayPath)) {
      throw new Error(`Overlay file not found: ${overlayPath}`);
    }

    try {
      const content = await readFile(overlayPath, 'utf-8');
      const updated = this.parser.addJiraMapping(content, storyId, jiraTicket);
      await writeFile(overlayPath, updated, 'utf-8');
    } catch (error) {
      throw new Error(
        `Failed to add Jira mapping: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete overlay file
   */
  async deleteOverlay(featureId: string, repoName: string): Promise<void> {
    const overlayPath = join(this.overlaysDir, repoName, `${featureId}.md`);

    if (!existsSync(overlayPath)) {
      throw new Error(`Overlay file not found: ${overlayPath}`);
    }

    try {
      const fs = await import('fs/promises');
      await fs.unlink(overlayPath);
    } catch (error) {
      throw new Error(
        `Failed to delete overlay: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

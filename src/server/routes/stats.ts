import { Router, Request, Response } from 'express';
import { StoryService, ReleaseService, FeatureService } from '../../services';

export const statsRouter = Router();

/**
 * GET /api/stats - Overall project statistics
 */
statsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const specdeckDir = process.env.SPECDECK_DIR || './specdeck';
    const rootPath = process.env.SPECDECK_ROOT || process.cwd();

    const storyService = new StoryService(specdeckDir, rootPath);
    const storyStats = await storyService.getStatistics();

    res.json({
      success: true,
      data: storyStats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch statistics',
      },
    });
  }
});

/**
 * GET /api/stats/releases/:id - Release-specific statistics
 */
statsRouter.get('/releases/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const specdeckDir = process.env.SPECDECK_DIR || './specdeck';
    const rootPath = process.env.SPECDECK_ROOT || process.cwd();

    const releaseService = new ReleaseService(specdeckDir);
    const featureService = new FeatureService(specdeckDir, rootPath);
    const storyService = new StoryService(specdeckDir, rootPath);

    const release = await releaseService.getRelease(id);
    if (!release) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Release ${id} not found`,
        },
      });
    }

    const features = await featureService.listFeatures();
    const releaseFeatures = features.filter((f) => f.releaseId === id);
    const stories = await storyService.listStories({ release: id });

    // Calculate story statistics for this release
    const byStatus: Record<string, number> = {};
    const byComplexity: Record<string, number> = {};
    const pointsByStatus: Record<string, number> = {
      done: 0,
      in_progress: 0,
      planned: 0,
      in_review: 0,
      blocked: 0,
    };
    let totalPoints = 0;

    for (const story of stories) {
      byStatus[story.status] = (byStatus[story.status] || 0) + 1;
      byComplexity[story.complexity] = (byComplexity[story.complexity] || 0) + 1;
      if (story.estimate) {
        totalPoints += story.estimate;
        if (Object.prototype.hasOwnProperty.call(pointsByStatus, story.status)) {
          pointsByStatus[story.status] += story.estimate;
        }
      }
    }

    res.json({
      success: true,
      data: {
        release,
        features: {
          total: releaseFeatures.length,
        },
        stories: {
          total: stories.length,
          byStatus,
          byComplexity,
          totalPoints,
          pointsByStatus,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch release statistics',
      },
    });
  }
});

/**
 * GET /api/stats/features/:id - Feature-specific statistics
 */
statsRouter.get('/features/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const specdeckDir = process.env.SPECDECK_DIR || './specdeck';
    const rootPath = process.env.SPECDECK_ROOT || process.cwd();

    const featureService = new FeatureService(specdeckDir, rootPath);
    const storyService = new StoryService(specdeckDir, rootPath);

    const feature = await featureService.getFeatureWithStories(id);
    if (!feature) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Feature ${id} not found`,
        },
      });
    }

    const stories = await storyService.getStoriesByFeature(id);

    // Calculate story statistics for this feature
    const byStatus: Record<string, number> = {};
    const byComplexity: Record<string, number> = {};
    const pointsByStatus: Record<string, number> = {
      done: 0,
      in_progress: 0,
      planned: 0,
      in_review: 0,
      blocked: 0,
    };
    let totalPoints = 0;

    for (const story of stories) {
      byStatus[story.status] = (byStatus[story.status] || 0) + 1;
      byComplexity[story.complexity] = (byComplexity[story.complexity] || 0) + 1;
      if (story.estimate) {
        totalPoints += story.estimate;
        if (Object.prototype.hasOwnProperty.call(pointsByStatus, story.status)) {
          pointsByStatus[story.status] += story.estimate;
        }
      }
    }

    res.json({
      success: true,
      data: {
        feature,
        stories: {
          total: stories.length,
          byStatus,
          byComplexity,
          totalPoints,
          pointsByStatus,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch feature statistics',
      },
    });
  }
});

import { Router, Request, Response } from 'express';
import { FeatureService } from '../../services';

export const featuresRouter = Router();

/**
 * GET /api/features - List all features with optional filters
 */
featuresRouter.get('/', async (req: Request, res: Response) => {
  try {
    const specdeckDir = process.env.SPECDECK_DIR || './specdeck';
    const rootPath = process.env.SPECDECK_ROOT || process.cwd();
    const service = new FeatureService(specdeckDir, rootPath);

    const releaseFilter = req.query.release as string | undefined;
    const allFeatures = await service.listFeaturesWithCache();
    const features = releaseFilter
      ? allFeatures.filter((f) => f.releaseId === releaseFilter)
      : allFeatures;

    res.json({
      success: true,
      data: features,
      meta: { total: features.length },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch features',
      },
    });
  }
});

/**
 * GET /api/features/:id - Get feature details with stories
 */
featuresRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const specdeckDir = process.env.SPECDECK_DIR || './specdeck';
    const rootPath = process.env.SPECDECK_ROOT || process.cwd();
    const service = new FeatureService(specdeckDir, rootPath);
    const feature = await service.getFeatureWithStories(id);

    if (!feature) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Feature ${id} not found`,
        },
      });
    }

    res.json({
      success: true,
      data: feature,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch feature',
      },
    });
  }
});

/**
 * POST /api/features - Create new feature
 */
featuresRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const specdeckDir = process.env.SPECDECK_DIR || './specdeck';
    const rootPath = process.env.SPECDECK_ROOT || process.cwd();
    const service = new FeatureService(specdeckDir, rootPath);

    // Check if coordinator mode
    const configRepo = service['configRepository'];
    const isCoordinator = await configRepo.isCoordinatorMode();
    if (isCoordinator) {
      res.status(403).json({
        success: false,
        error: {
          code: 'COORDINATOR_READ_ONLY',
          message:
            'Cannot create features in coordinator mode. Features must be created in the source repository.',
        },
      });
      return;
    }

    const body = req.body as {
      id?: string;
      title?: string;
      description?: string;
      releaseId?: string;
      openspecChange?: string;
      repos?: string[];
    };
    const { id, title, description, releaseId, openspecChange, repos } = body;

    if (!id || !title || !releaseId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'id, title, and releaseId are required',
        },
      });
      return;
    }

    const feature = await service.createFeature({
      id,
      title,
      description,
      releaseId,
      openspecChange,
      repos: repos || [],
    });

    res.status(201).json({
      success: true,
      data: feature,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: error.message,
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create feature',
      },
    });
  }
});

/**
 * PUT /api/features/:id - Update feature
 */
featuresRouter.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const specdeckDir = process.env.SPECDECK_DIR || './specdeck';
    const rootPath = process.env.SPECDECK_ROOT || process.cwd();
    const service = new FeatureService(specdeckDir, rootPath);

    // Check if coordinator mode
    const configRepo = service['configRepository'];
    const isCoordinator = await configRepo.isCoordinatorMode();
    if (isCoordinator) {
      res.status(403).json({
        success: false,
        error: {
          code: 'COORDINATOR_READ_ONLY',
          message:
            'Cannot update features in coordinator mode. Features must be edited in the source repository.',
        },
      });
      return;
    }

    const updates = req.body as Partial<{
      repos: string[];
      id: string;
      title: string;
      releaseId: string;
      storyCount: number;
      description?: string;
      jiraEpic?: string;
      openspecChange?: string;
    }>;
    const feature = await service.updateFeature(id, updates);

    res.json({
      success: true,
      data: feature,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message,
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update feature',
      },
    });
  }
});

/**
 * DELETE /api/features/:id - Delete feature
 */
featuresRouter.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const specdeckDir = process.env.SPECDECK_DIR || './specdeck';
    const rootPath = process.env.SPECDECK_ROOT || process.cwd();
    const service = new FeatureService(specdeckDir, rootPath);

    // Check if coordinator mode
    const configRepo = service['configRepository'];
    const isCoordinator = await configRepo.isCoordinatorMode();
    if (isCoordinator) {
      res.status(403).json({
        success: false,
        error: {
          code: 'COORDINATOR_READ_ONLY',
          message:
            'Cannot delete features in coordinator mode. Features must be deleted in the source repository.',
        },
      });
      return;
    }

    await service.deleteFeature(id);

    res.json({
      success: true,
      message: `Feature ${id} deleted successfully`,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message,
        },
      });
      return;
    }

    if (
      error instanceof Error &&
      error.message.includes('has') &&
      error.message.includes('stories')
    ) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete feature',
      },
    });
  }
});

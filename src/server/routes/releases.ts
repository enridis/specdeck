import { Router, Request, Response } from 'express';
import { ReleaseService } from '../../services';
import { ReleaseSchema } from '../../schemas';

export const releasesRouter = Router();

/**
 * GET /api/releases - List all releases
 */
releasesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const specdeckDir = process.env.SPECDECK_DIR || './specdeck';
    const service = new ReleaseService(specdeckDir);
    const releases = await service.listReleases();

    res.json({
      success: true,
      data: releases,
      meta: { total: releases.length },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch releases',
      },
    });
  }
});

/**
 * GET /api/releases/:id - Get release details
 */
releasesRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const specdeckDir = process.env.SPECDECK_DIR || './specdeck';
    const service = new ReleaseService(specdeckDir);
    const release = await service.getRelease(id);

    if (!release) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Release ${id} not found`,
        },
      });
    }

    res.json({
      success: true,
      data: release,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch release',
      },
    });
  }
});

/**
 * POST /api/releases - Create new release
 */
releasesRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const specdeckDir = process.env.SPECDECK_DIR || './specdeck';
    const service = new ReleaseService(specdeckDir);

    // Validate request body
    const releaseData = ReleaseSchema.parse(req.body);

    // Check if release already exists
    const existing = await service.getRelease(releaseData.id);
    if (existing) {
      res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: `Release ${releaseData.id} already exists`,
        },
      });
    }

    // Create release
    const created = await service.createRelease(releaseData);

    res.status(201).json({
      success: true,
      data: created,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid release data',
          details: (error as unknown as { errors: unknown }).errors,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create release',
      },
    });
  }
});

/**
 * PUT /api/releases/:id - Update release
 */
releasesRouter.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const specdeckDir = process.env.SPECDECK_DIR || './specdeck';
    const service = new ReleaseService(specdeckDir);

    // Check if release exists
    const existing = await service.getRelease(id);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Release ${id} not found`,
        },
      });
    }

    // Update release
    const updates = req.body as Partial<{
      id: string;
      title: string;
      objectives: string[];
      successMetrics: string[];
      features: string[];
      timeframe?: string;
    }>;
    const updated = await service.updateRelease(id, updates);

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid release data',
          details: (error as unknown as { errors: unknown }).errors,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update release',
      },
    });
  }
});

/**
 * DELETE /api/releases/:id - Delete release
 */
releasesRouter.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const specdeckDir = process.env.SPECDECK_DIR || './specdeck';
    const service = new ReleaseService(specdeckDir);

    // Check if release exists
    const existing = await service.getRelease(id);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Release ${id} not found`,
        },
      });
    }

    await service.deleteRelease(id);

    res.json({
      success: true,
      message: `Release ${id} deleted`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete release',
      },
    });
  }
});

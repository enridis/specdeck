import { Router, Request, Response } from 'express';
import { StoryService } from '../../services';
import { StorySchema } from '../../schemas';
import type { CacheStory, Story } from '../../schemas';

export const storiesRouter = Router();

/**
 * Map backend story to frontend format
 */
interface FrontendStory {
  id: string;
  title: string;
  status: string;
  complexity: string;
  assignee?: string;
  milestone?: string;
  tags: string[];
  feature: string;
  release: string;
  points?: number;
  notes?: string;
  jira?: string;
  repo?: string;
}

function mapStoryToFrontend(story: Story): FrontendStory {
  const anyStory = story as CacheStory;
  return {
    id: story.id,
    title: story.title,
    status: story.status,
    complexity: story.complexity,
    assignee: story.owner,
    milestone: story.milestone,
    tags: story.tags,
    feature: story.featureId,
    release: story.releaseId,
    points: story.estimate,
    notes: story.notes,
    jira: story.jira || anyStory.jiraTicket, // Support both jira (Story) and jiraTicket (CacheStory)
    repo: anyStory.repo, // Only present in CacheStory
  };
}

/**
 * GET /api/stories - List all stories with optional filters
 */
storiesRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const specdeckDir = process.env.SPECDECK_DIR || './specdeck';
    const rootPath = process.env.SPECDECK_ROOT || process.cwd();
    const service = new StoryService(specdeckDir, rootPath);

    // Build filter from query params
    const filter: {
      status?: string[];
      complexity?: string[];
      feature?: string;
      milestone?: string;
      release?: string;
    } = {};
    if (req.query.status) {
      filter.status = Array.isArray(req.query.status)
        ? (req.query.status as string[])
        : [req.query.status as string];
    }
    if (req.query.complexity) {
      filter.complexity = Array.isArray(req.query.complexity)
        ? (req.query.complexity as string[])
        : [req.query.complexity as string];
    }
    if (req.query.feature) {
      filter.feature = req.query.feature as string;
    }
    if (req.query.milestone) {
      filter.milestone = req.query.milestone as string;
    }
    if (req.query.release) {
      filter.release = req.query.release as string;
    }

    const stories = await service.listStoriesWithCache(filter);

    // Map to frontend format
    const mappedStories = stories.map(mapStoryToFrontend);

    res.json({
      success: true,
      data: mappedStories,
      meta: {
        total: mappedStories.length,
        filtered: mappedStories.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch stories',
      },
    });
  }
});

/**
 * GET /api/stories/:id - Get a single story
 */
storiesRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const specdeckDir = process.env.SPECDECK_DIR || './specdeck';
    const rootPath = process.env.SPECDECK_ROOT || process.cwd();
    const service = new StoryService(specdeckDir, rootPath);
    const story = await service.getStory(id);

    if (!story) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Story ${id} not found`,
        },
      });
      return;
    }

    // Map to frontend format
    const mappedStory = mapStoryToFrontend(story);

    res.json({
      success: true,
      data: mappedStory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch story',
      },
    });
  }
});

/**
 * POST /api/stories - Create new story
 */
storiesRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const specdeckDir = process.env.SPECDECK_DIR || './specdeck';
    const rootPath = process.env.SPECDECK_ROOT || process.cwd();
    const service = new StoryService(specdeckDir, rootPath);

    // Check if coordinator mode
    const configRepo = service['configRepository'];
    const isCoordinator = await configRepo.isCoordinatorMode();
    if (isCoordinator) {
      res.status(403).json({
        success: false,
        error: {
          code: 'COORDINATOR_READ_ONLY',
          message:
            'Cannot create stories in coordinator mode. Stories must be created in the source repository.',
        },
      });
      return;
    }

    // Validate request body
    const storyData = StorySchema.parse(req.body);

    // Create the story
    const created = await service.createStory(storyData);

    // Map to frontend format
    const mappedStory = mapStoryToFrontend(created);

    res.status(201).json({
      success: true,
      data: mappedStory,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid story data',
          details: (error as unknown as { errors: unknown }).errors,
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create story',
      },
    });
  }
});

/**
 * PUT /api/stories/:id - Update story
 */
storiesRouter.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const specdeckDir = process.env.SPECDECK_DIR || './specdeck';
    const rootPath = process.env.SPECDECK_ROOT || process.cwd();
    const service = new StoryService(specdeckDir, rootPath);

    // Check if coordinator mode
    const configRepo = service['configRepository'];
    const isCoordinator = await configRepo.isCoordinatorMode();
    if (isCoordinator) {
      res.status(403).json({
        success: false,
        error: {
          code: 'COORDINATOR_READ_ONLY',
          message:
            'Cannot update stories in coordinator mode. Stories must be edited in the source repository.',
        },
      });
      return;
    }

    console.log(`[UPDATE] Story ${id} with data:`, JSON.stringify(req.body, null, 2));

    // Check if story exists
    const existing = await service.getStory(id);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Story ${id} not found`,
        },
      });
      return;
    }

    // Map frontend fields to backend schema
    const body = req.body as Record<string, unknown>;
    const updates: Partial<Story> = { ...body } as Partial<Story>;

    // Map assignee to owner
    if ('assignee' in body && body.assignee !== undefined) {
      updates.owner = body.assignee as string;
      delete (updates as Record<string, unknown>).assignee;
    }

    // Map feature to featureId
    if ('feature' in body && body.feature !== undefined) {
      updates.featureId = body.feature as string;
      delete (updates as Record<string, unknown>).feature;
    }

    // Map release to releaseId
    if ('release' in body && body.release !== undefined) {
      updates.releaseId = body.release as string;
      delete (updates as Record<string, unknown>).release;
    }

    // Map points to estimate
    if ('points' in body && body.points !== undefined) {
      updates.estimate = body.points as number;
      delete (updates as Record<string, unknown>).points;
    }

    // Update the story
    const updated = await service.updateStory(id, updates);

    // Map to frontend format
    const mappedStory = mapStoryToFrontend(updated);

    res.json({
      success: true,
      data: mappedStory,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid story data',
          details: (error as unknown as { errors: unknown }).errors,
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update story',
      },
    });
  }
});

/**
 * DELETE /api/stories/:id - Delete story
 */
storiesRouter.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const specdeckDir = process.env.SPECDECK_DIR || './specdeck';
    const rootPath = process.env.SPECDECK_ROOT || process.cwd();
    const service = new StoryService(specdeckDir, rootPath);

    // Check if coordinator mode
    const configRepo = service['configRepository'];
    const isCoordinator = await configRepo.isCoordinatorMode();
    if (isCoordinator) {
      res.status(403).json({
        success: false,
        error: {
          code: 'COORDINATOR_READ_ONLY',
          message:
            'Cannot delete stories in coordinator mode. Stories must be deleted in the source repository.',
        },
      });
      return;
    }

    // Check if story exists
    const existing = await service.getStory(id);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Story ${id} not found`,
        },
      });
      return;
    }

    // Delete the story
    await service.deleteStory(id);

    res.json({
      success: true,
      message: `Story ${id} deleted successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete story',
      },
    });
  }
});

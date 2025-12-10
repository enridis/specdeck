import { Router, Request, Response } from 'express';
import { ConfigRepository, OverlayRepository } from '../../repositories';
import { ValidationService } from '../../services';

interface JiraMapping {
  storyId: string;
  jiraTicket: string;
}

interface OverlayListItem {
  featureId: string;
  jiraMappings: JiraMapping[];
}

export const overlaysRouter = Router();

overlaysRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const configRepository = new ConfigRepository(process.env.CURRENT_DIR || process.cwd());
    const config = await configRepository.read();

    const isCoordinator = config.coordinator && config.coordinator.enabled;
    if (!isCoordinator) {
      res.status(400).json({
        success: false,
        error: 'Not in coordinator mode',
      });
      return;
    }

    const overlaysDir = config.coordinator?.overlaysDir || 'overlays';
    const overlayRepository = new OverlayRepository(overlaysDir);
    const allOverlaysByRepo = await overlayRepository.readAllOverlays();

    // Format response: flatten the nested map structure
    const overlaysList: OverlayListItem[] = [];

    for (const [, featureOverlays] of allOverlaysByRepo.entries()) {
      for (const [featureId, overlayData] of featureOverlays.entries()) {
        // Check if feature already exists in list
        let feature = overlaysList.find((f) => f.featureId === featureId);
        if (!feature) {
          feature = {
            featureId,
            jiraMappings: [],
          };
          overlaysList.push(feature);
        }

        // Add mappings from this overlay
        if (overlayData.jiraMappings) {
          for (const [storyId, jiraTicket] of overlayData.jiraMappings.entries()) {
            feature.jiraMappings.push({ storyId, jiraTicket });
          }
        }
      }
    }

    res.json({
      success: true,
      data: overlaysList,
    });
  } catch (error) {
    console.error('Error reading overlays:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to read overlays',
    });
  }
});

overlaysRouter.post('/:featureId/map', async (req: Request, res: Response): Promise<void> => {
  try {
    const { featureId } = req.params;
    const { storyId, jiraTicket, repo } = req.body as {
      storyId?: string;
      jiraTicket?: string;
      repo?: string;
    };

    if (!storyId || !jiraTicket) {
      res.status(400).json({
        success: false,
        error: 'storyId and jiraTicket are required',
      });
      return;
    }

    const configRepository = new ConfigRepository(process.env.CURRENT_DIR || process.cwd());
    const config = await configRepository.read();

    const isCoordinator = config.coordinator && config.coordinator.enabled;
    if (!isCoordinator) {
      res.status(400).json({
        success: false,
        error: 'Not in coordinator mode',
      });
      return;
    }

    // Validate that story ID exists in a submodule
    const submodules = config.coordinator?.submodules || [];
    const validationService = new ValidationService();
    const idExists = await validationService.idExists(storyId, submodules);

    if (!idExists) {
      res.status(400).json({
        success: false,
        error: `Story ID '${storyId}' not found in any submodule`,
      });
      return;
    }

    // Add the mapping to overlay
    const overlaysDir = config.coordinator?.overlaysDir || 'overlays';
    const overlayRepository = new OverlayRepository(overlaysDir);
    const targetRepo = repo || submodules[0]?.name || 'default';

    await overlayRepository.addJiraMapping(featureId, targetRepo, storyId, jiraTicket);

    res.json({
      success: true,
      data: {
        featureId,
        storyId,
        jiraTicket,
        message: `Successfully mapped ${storyId} to ${jiraTicket}`,
      },
    });
  } catch (error) {
    console.error('Error adding overlay mapping:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add mapping',
    });
  }
});

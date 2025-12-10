import { OverlayRepository } from '../repositories/overlay.repository';
import { FeatureRepository } from '../repositories/feature.repository';
import { ConfigRepository } from '../repositories/config.repository';
import { OverlayData } from '../parsers/overlay.parser';

type OverlaysMap = Map<string, Map<string, OverlayData>>;

export interface ValidationError {
  severity: 'error' | 'warning';
  category: string;
  message: string;
  filePath: string;
  lineNumber?: number;
  context?: Record<string, unknown>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  summary: {
    totalErrors: number;
    totalWarnings: number;
    overlaysChecked: number;
    storiesValidated: number;
  };
}

const FEATURE_ID_REGEX = /^[A-Z][A-Z0-9]*(-[A-Z0-9]+)*$/;
const STORY_ID_REGEX = /^[A-Z]{1,4}-[A-Z0-9]+-\d{2}(-\d{2})?$/;
const JIRA_TICKET_REGEX = /^[A-Z]+-\d+$/;

export class OverlayValidationService {
  constructor(
    private configRepository: ConfigRepository,
    private overlayRepository: OverlayRepository,
    // featureRepository reserved for future use (story existence checking)
    _featureRepository: FeatureRepository
  ) {}

  /**
   * Validate a single overlay file
   */
  async validateOverlay(featureId?: string, repoName?: string): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    let overlaysChecked = 0;
    let storiesValidated = 0;

    try {
      // Check if in coordinator mode
      const isCoordinator = await this.configRepository.isCoordinatorMode();
      if (!isCoordinator) {
        errors.push({
          severity: 'error',
          category: 'COORDINATOR_MODE',
          message: 'Overlay validation is only available in coordinator mode',
          filePath: 'N/A',
        });
        return this.buildResult(errors, warnings, overlaysChecked, storiesValidated);
      }

      const overlaysDir = await this.configRepository.getOverlaysDir();

      // If featureId and repoName provided, validate single overlay
      if (featureId && repoName) {
        const overlay = await this.overlayRepository.readOverlay(featureId, repoName);
        if (overlay) {
          overlaysChecked = 1;
          const [errs, warns, validated] = await this.validateOverlayData(
            overlay,
            featureId,
            repoName,
            overlaysDir
          );
          errors.push(...errs);
          warnings.push(...warns);
          storiesValidated = validated;
        }
      } else {
        // Validate all overlays
        const allOverlays: OverlaysMap = await this.overlayRepository.readAllOverlays();

        for (const [repo, overlays] of allOverlays.entries()) {
          for (const [fId, overlay] of overlays.entries()) {
            overlaysChecked++;
            const [errs, warns, validated] = await this.validateOverlayData(
              overlay,
              fId,
              repo,
              overlaysDir
            );
            errors.push(...errs);
            warnings.push(...warns);
            storiesValidated += validated;
          }
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push({
        severity: 'error',
        category: 'VALIDATION_ERROR',
        message: `Failed to validate overlays: ${message}`,
        filePath: 'N/A',
      });
    }

    return this.buildResult(errors, warnings, overlaysChecked, storiesValidated);
  }

  /**
   * Validate overlay data structure and content
   */
  private async validateOverlayData(
    overlay: OverlayData,
    featureId: string,
    repoName: string,
    overlaysDir: string
  ): Promise<[ValidationError[], ValidationError[], number]> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    let storiesValidated = 0;

    const filePath = `${overlaysDir}/${repoName}/${featureId}.md`;

    // Validate feature ID format
    if (!FEATURE_ID_REGEX.test(featureId)) {
      errors.push({
        severity: 'error',
        category: 'INVALID_FEATURE_ID',
        message: `Feature ID "${featureId}" does not match expected format (e.g., AUTH-01, USER-MGMT-02)`,
        filePath,
        context: { featureId, regex: FEATURE_ID_REGEX.source },
      });
    }

    // Validate Jira mappings structure
    if (!overlay.jiraMappings) {
      errors.push({
        severity: 'error',
        category: 'MISSING_JIRA_MAPPINGS',
        message: 'Overlay must contain jiraMappings object',
        filePath,
      });
      return [errors, warnings, storiesValidated];
    }

    // Validate each Jira mapping
    for (const [storyId, jiraTicket] of overlay.jiraMappings.entries()) {
      storiesValidated++;

      // Validate story ID format
      if (!STORY_ID_REGEX.test(storyId)) {
        errors.push({
          severity: 'error',
          category: 'INVALID_STORY_ID',
          message: `Story ID "${storyId}" does not match expected format (e.g., BE-AUTH-01-01)`,
          filePath,
          context: { storyId, regex: STORY_ID_REGEX.source },
        });
      }

      // Validate Jira ticket format
      if (typeof jiraTicket !== 'string' || !JIRA_TICKET_REGEX.test(jiraTicket)) {
        errors.push({
          severity: 'error',
          category: 'INVALID_JIRA_TICKET',
          message: `Jira ticket "${jiraTicket}" does not match expected format (e.g., PROJ-1234)`,
          filePath,
          context: { jiraTicket, storyId, regex: JIRA_TICKET_REGEX.source },
        });
        continue;
      }

      // Validate duplicate story IDs across repos
      try {
        const allOverlays = await this.overlayRepository.readAllOverlays();
        let duplicateCount = 0;
        const duplicateRepos: string[] = [];

        for (const [otherRepo, overlays] of allOverlays) {
          if (otherRepo === repoName) continue;
          for (const [, otherOverlay] of overlays) {
            if (otherOverlay.jiraMappings) {
              if (otherOverlay.jiraMappings.has(storyId)) {
                duplicateCount++;
                duplicateRepos.push(otherRepo);
              }
            }
          }
        }

        if (duplicateCount > 0) {
          warnings.push({
            severity: 'warning',
            category: 'DUPLICATE_STORY_ID',
            message: `Story ID "${storyId}" appears in multiple repositories: ${duplicateRepos.join(', ')}. Consider using repo prefixes to avoid collisions.`,
            filePath,
            context: { storyId, repos: duplicateRepos },
          });
        }
      } catch {
        // Ignore errors when checking for duplicates
      }
    }

    return [errors, warnings, storiesValidated];
  }

  /**
   * Get validation report as formatted string
   */
  formatValidationResult(result: ValidationResult): string {
    const lines: string[] = [];

    lines.push('📋 Overlay Validation Report');
    lines.push('═'.repeat(50));
    lines.push('');

    if (result.errors.length === 0 && result.warnings.length === 0) {
      lines.push('✓ All overlays are valid!');
      lines.push('');
      lines.push(`Checked ${result.summary.overlaysChecked} overlay file(s)`);
      lines.push(`Validated ${result.summary.storiesValidated} story mapping(s)`);
      return lines.join('\n');
    }

    if (result.errors.length > 0) {
      lines.push(`❌ ERRORS (${result.errors.length})`);
      lines.push('─'.repeat(50));
      for (const error of result.errors) {
        lines.push(`• [${error.category}] ${error.message}`);
        if (error.filePath !== 'N/A') {
          lines.push(`  File: ${error.filePath}`);
        }
        if (error.context) {
          for (const [key, value] of Object.entries(error.context)) {
            const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
            lines.push(`  ${key}: ${displayValue}`);
          }
        }
      }
      lines.push('');
    }

    if (result.warnings.length > 0) {
      lines.push(`⚠️  WARNINGS (${result.warnings.length})`);
      lines.push('─'.repeat(50));
      for (const warning of result.warnings) {
        lines.push(`• [${warning.category}] ${warning.message}`);
        if (warning.filePath !== 'N/A') {
          lines.push(`  File: ${warning.filePath}`);
        }
        if (warning.context) {
          for (const [key, value] of Object.entries(warning.context)) {
            const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
            lines.push(`  ${key}: ${displayValue}`);
          }
        }
      }
      lines.push('');
    }

    lines.push('═'.repeat(50));
    lines.push(
      `Summary: ${result.summary.totalErrors} error(s), ${result.summary.totalWarnings} warning(s)`
    );
    lines.push(`Checked ${result.summary.overlaysChecked} overlay file(s)`);
    lines.push(`Validated ${result.summary.storiesValidated} story mapping(s)`);
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Build validation result object
   */
  private buildResult(
    errors: ValidationError[],
    warnings: ValidationError[],
    overlaysChecked: number,
    storiesValidated: number
  ): ValidationResult {
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        totalErrors: errors.length,
        totalWarnings: warnings.length,
        overlaysChecked,
        storiesValidated,
      },
    };
  }
}

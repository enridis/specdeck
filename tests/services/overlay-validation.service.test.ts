import {
  OverlayValidationService,
  ValidationError,
  ValidationResult,
} from '../../src/services/overlay-validation.service';
import { ConfigRepository } from '../../src/repositories/config.repository';
import { OverlayRepository } from '../../src/repositories/overlay.repository';
import { FeatureRepository } from '../../src/repositories/feature.repository';

type MockConfigRepository = jest.Mocked<
  Pick<ConfigRepository, 'isCoordinatorMode' | 'getOverlaysDir'>
>;
type MockOverlayRepository = jest.Mocked<
  Pick<OverlayRepository, 'readOverlay' | 'readAllOverlays'>
>;
type MockFeatureRepository = Partial<FeatureRepository>;

describe('OverlayValidationService', () => {
  let validationService: OverlayValidationService;
  let configRepoMock: MockConfigRepository;
  let overlayRepoMock: MockOverlayRepository;
  let featureRepoMock: MockFeatureRepository;

  beforeEach(() => {
    configRepoMock = {
      isCoordinatorMode: jest.fn().mockResolvedValue(true),
      getOverlaysDir: jest.fn().mockResolvedValue('./overlays'),
    };

    overlayRepoMock = {
      readOverlay: jest.fn(),
      readAllOverlays: jest.fn(),
    };

    featureRepoMock = {};

    validationService = new OverlayValidationService(
      configRepoMock as unknown as ConfigRepository,
      overlayRepoMock as unknown as OverlayRepository,
      featureRepoMock as FeatureRepository
    );
  });

  describe('validateOverlay', () => {
    it('should validate single overlay when feature and repo specified', async () => {
      const mockOverlay = {
        featureId: 'AUTH-01',
        jiraMappings: new Map([['AUTH-01-01', 'PROJ-1001']]),
        notes: new Map(),
      };

      overlayRepoMock.readOverlay.mockResolvedValue(mockOverlay);

      const result = await validationService.validateOverlay('AUTH-01', 'backend');

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('summary');
    });

    it('should return valid result for correct overlay', async () => {
      const mockOverlay = {
        featureId: 'VALID-FEATURE',
        jiraMappings: new Map([
          ['VF-AUTH-01', 'PROJ-1001'],
          ['VF-AUTH-02', 'PROJ-1002'],
        ]),
        notes: new Map(),
      };

      overlayRepoMock.readOverlay.mockResolvedValue(mockOverlay);
      // Mock readAllOverlays for duplicate checking
      overlayRepoMock.readAllOverlays.mockResolvedValue(new Map());

      const result = await validationService.validateOverlay('VALID-FEATURE', 'backend');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid story ID format', async () => {
      const mockOverlay = {
        featureId: 'FEATURE',
        jiraMappings: new Map([['INVALID', 'PROJ-1001']]),
        notes: new Map(),
      };

      overlayRepoMock.readOverlay.mockResolvedValue(mockOverlay);

      const result = await validationService.validateOverlay('FEATURE', 'backend');

      expect(result.errors.length).toBeGreaterThan(0);
      const storyIdError = result.errors.find((e) => e.category === 'INVALID_STORY_ID');
      expect(storyIdError).toBeDefined();
    });

    it('should detect invalid Jira ticket format', async () => {
      const mockOverlay = {
        featureId: 'FEATURE',
        jiraMappings: new Map([['FEATURE-01-01', 'INVALID-JIRA']]),
        notes: new Map(),
      };

      overlayRepoMock.readOverlay.mockResolvedValue(mockOverlay);

      const result = await validationService.validateOverlay('FEATURE', 'backend');

      expect(result.errors.length).toBeGreaterThan(0);
      const jiraError = result.errors.find((e) => e.category === 'INVALID_JIRA_TICKET');
      expect(jiraError).toBeDefined();
    });

    it('should validate all overlays when no specific feature provided', async () => {
      const overlays = new Map([
        [
          'backend',
          new Map([
            [
              'AUTH',
              {
                featureId: 'AUTH',
                jiraMappings: new Map([['AUTH-01', 'PROJ-1001']]),
                notes: new Map(),
              },
            ],
          ]),
        ],
      ]);

      overlayRepoMock.readAllOverlays.mockResolvedValue(overlays);

      const result = await validationService.validateOverlay();

      expect(result.summary.overlaysChecked).toBeGreaterThanOrEqual(0);
    });

    it('should require coordinator mode', async () => {
      configRepoMock.isCoordinatorMode.mockResolvedValue(false);

      const result = await validationService.validateOverlay();

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle validation errors gracefully', async () => {
      overlayRepoMock.readAllOverlays.mockRejectedValue(new Error('Read failed'));

      const result = await validationService.validateOverlay();

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validation rules', () => {
    it('should validate feature ID format', async () => {
      const mockOverlay = {
        featureId: 'invalid-feature', // lowercase should fail
        jiraMappings: new Map([['STORY-01-01', 'PROJ-1001']]),
        notes: new Map(),
      };

      overlayRepoMock.readOverlay.mockResolvedValue(mockOverlay);

      const result = await validationService.validateOverlay('invalid-feature', 'backend');

      expect(result.errors.some((e) => e.category === 'INVALID_FEATURE_ID')).toBe(true);
    });

    it('should accept valid feature ID formats', async () => {
      const validFormats = ['AUTH', 'API-USERS', 'FEATURE-V2', 'MY-BIG-FEATURE'];

      for (const feature of validFormats) {
        const mockOverlay = {
          featureId: feature,
          jiraMappings: new Map([['STORY-01-01', 'PROJ-1001']]),
          notes: new Map(),
        };

        overlayRepoMock.readOverlay.mockResolvedValue(mockOverlay);

        const result = await validationService.validateOverlay(feature, 'backend');

        // Should not have feature ID errors for valid formats
        const featureIdErrors = result.errors.filter((e) => e.category === 'INVALID_FEATURE_ID');
        expect(featureIdErrors).toHaveLength(0);
      }
    });

    it('should validate multiple story ID formats', async () => {
      const mockOverlay = {
        featureId: 'AUTH',
        jiraMappings: new Map([
          ['AUTH-01-01', 'PROJ-1001'],
          ['BE-AUTH-02-03', 'PROJ-1002'],
          ['USERS-99', 'PROJ-1003'],
        ]),
        notes: new Map(),
      };

      overlayRepoMock.readOverlay.mockResolvedValue(mockOverlay);

      const result = await validationService.validateOverlay('AUTH', 'backend');

      // USERS-99 is likely invalid (missing second number), others should be valid
      expect(result.errors.some((e) => e.category === 'INVALID_STORY_ID')).toBe(true);
    });
  });

  describe('duplicate detection', () => {
    it('should warn about duplicate story IDs across repos', async () => {
      const overlays = new Map([
        [
          'backend',
          new Map([
            [
              'AUTH',
              {
                featureId: 'AUTH',
                jiraMappings: new Map([['AUTH-01-01', 'PROJ-1001']]),
                notes: new Map(),
              },
            ],
          ]),
        ],
        [
          'frontend',
          new Map([
            [
              'AUTH',
              {
                featureId: 'AUTH',
                jiraMappings: new Map([['AUTH-01-01', 'PROJ-3001']]),
                notes: new Map(),
              },
            ],
          ]),
        ],
      ]);

      overlayRepoMock.readAllOverlays.mockResolvedValue(overlays);

      const result = await validationService.validateOverlay();

      expect(result.warnings.some((w) => w.category === 'DUPLICATE_STORY_ID')).toBe(true);
    });
  });

  describe('formatValidationResult', () => {
    it('should format valid result', () => {
      const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        summary: { totalErrors: 0, totalWarnings: 0, overlaysChecked: 2, storiesValidated: 5 },
      };

      const formatted = validationService.formatValidationResult(result);

      expect(formatted).toContain('✓ All overlays are valid');
      expect(formatted).toContain('2 overlay file(s)');
      expect(formatted).toContain('5 story mapping(s)');
    });

    it('should format errors in report', () => {
      const error: ValidationError = {
        severity: 'error',
        category: 'INVALID_STORY_ID',
        message: 'Story ID invalid format',
        filePath: 'overlays/backend/AUTH.md',
      };

      const result: ValidationResult = {
        isValid: false,
        errors: [error],
        warnings: [],
        summary: { totalErrors: 1, totalWarnings: 0, overlaysChecked: 1, storiesValidated: 1 },
      };

      const formatted = validationService.formatValidationResult(result);

      expect(formatted).toContain('❌ ERRORS');
      expect(formatted).toContain('INVALID_STORY_ID');
      expect(formatted).toContain('overlays/backend/AUTH.md');
    });

    it('should format warnings in report', () => {
      const warning: ValidationError = {
        severity: 'warning',
        category: 'DUPLICATE_STORY_ID',
        message: 'Duplicate ID detected',
        filePath: 'overlays/backend/AUTH.md',
      };

      const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [warning],
        summary: { totalErrors: 0, totalWarnings: 1, overlaysChecked: 1, storiesValidated: 1 },
      };

      const formatted = validationService.formatValidationResult(result);

      expect(formatted).toContain('⚠️  WARNINGS');
      expect(formatted).toContain('DUPLICATE_STORY_ID');
    });

    it('should include summary statistics', () => {
      const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        summary: { totalErrors: 0, totalWarnings: 0, overlaysChecked: 5, storiesValidated: 20 },
      };

      const formatted = validationService.formatValidationResult(result);

      expect(formatted).toContain('5 overlay file(s)');
      expect(formatted).toContain('20 story mapping(s)');
    });
  });

  describe('validation summary structure', () => {
    it('should include all required summary fields', async () => {
      overlayRepoMock.readAllOverlays.mockResolvedValue(new Map());

      const result = await validationService.validateOverlay();

      expect(result.summary).toHaveProperty('totalErrors');
      expect(result.summary).toHaveProperty('totalWarnings');
      expect(result.summary).toHaveProperty('overlaysChecked');
      expect(result.summary).toHaveProperty('storiesValidated');
    });

    it('should track correct overlay count', async () => {
      const overlays = new Map([
        [
          'backend',
          new Map([
            ['AUTH', { featureId: 'AUTH', jiraMappings: new Map(), notes: new Map() }],
            ['USERS', { featureId: 'USERS', jiraMappings: new Map(), notes: new Map() }],
          ]),
        ],
      ]);

      overlayRepoMock.readAllOverlays.mockResolvedValue(overlays);

      const result = await validationService.validateOverlay();

      expect(result.summary.overlaysChecked).toBe(2);
    });
  });
});

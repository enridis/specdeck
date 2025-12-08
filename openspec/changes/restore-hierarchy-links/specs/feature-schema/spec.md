---
capability: feature-schema
type: spec-delta
status: proposed
---

# Spec Delta: Feature Schema Enhancements for Explicit Story Count

## ADDED Requirements

### Requirement: Feature Schema Must Track Actual Story Count

Features MUST expose a computed `storyCount` property that reflects the actual number of stories referencing the feature via `featureId`.

**Priority**: Should Have
**Rationale**: With explicit `featureId` links in stories, features can accurately report the number of stories without manual updates; improves reporting and validation

#### Scenario: Feature exposes computed story count property

**Given** a Feature `CLI-CORE` with explicit stories referencing `featureId = "CLI-CORE"`
**When** retrieving the feature via FeatureService
**Then** the feature object must include a computed `storyCount` property
**And** the `storyCount` must equal the number of stories with matching `featureId`
**And** the count must be updated dynamically when stories are added/removed

#### Scenario: List features with accurate story counts

**Given** features:
- `CLI-CORE` with 4 stories (`CLI-CORE-01` through `CLI-CORE-04`)
- `REL-01` with 6 stories (`REL-01-01` through `REL-01-06`)
- `FEAT-01` with 0 stories (newly created, not yet decomposed)
**When** executing `featureService.listFeatures()`
**Then** each feature must include accurate `storyCount`:
- `CLI-CORE.storyCount === 4`
- `REL-01.storyCount === 6`
- `FEAT-01.storyCount === 0`

---

### Requirement: Feature Service Must Populate Stories Using Explicit Links

The FeatureService MUST use the explicit `featureId` field when querying stories for a feature, replacing ID prefix matching logic.

**Priority**: Must Have
**Rationale**: Replace implicit ID prefix matching with explicit `featureId` field lookups for correctness and performance

#### Scenario: Get feature with stories using explicit featureId

**Given** a feature `CLI-CORE` in release `R1-foundation`
**And** stories `CLI-CORE-01`, `CLI-CORE-02` with `featureId = "CLI-CORE"`
**When** calling `featureService.getFeatureWithStories('CLI-CORE')`
**Then** the service must query stories where `story.featureId === 'CLI-CORE'`
**And** the result must not use ID prefix matching or regex patterns
**And** all returned stories must belong to the feature

#### Scenario: Detect orphaned stories (featureId doesn't match ID prefix)

**Given** a story `CLI-CORE-01` with `featureId = "REL-01"` (incorrect)
**When** running `featureService.validateLinks()`
**Then** the validator must detect the inconsistency
**And** report a warning: "Story CLI-CORE-01 has featureId 'REL-01' but ID prefix suggests 'CLI-CORE'"

---

## MODIFIED Requirements

### Requirement: Feature Extraction from Release Files

Feature extraction from release files MUST remain unchanged in structure, but the FeatureService layer MUST augment features with computed story counts based on explicit links.

**Priority**: Must Have
**Changes**: Feature parser remains unchanged, but services now leverage explicit story links

#### Scenario: Extract features and associate stories via explicit links

**Given** a release file `R1-foundation.md` with features section listing `CLI-CORE`, `REL-01`
**When** extracting features via `featureRepository.extractFromRelease(content, 'R1-foundation')`
**Then** each feature must have `releaseId = "R1-foundation"`
**And** when augmented by FeatureService, each feature must include `storyCount` computed from explicit `featureId` matches
**And** the feature extraction logic itself remains unchanged (only service layer updates)

---

### Requirement: Feature Validation

The system MUST validate that all stories referencing a feature via `featureId` actually belong to an existing feature, and that release IDs are consistent.

**Priority**: Should Have
**Changes**: Add validation to ensure feature-story relationships are consistent

#### Scenario: Validate all stories reference existing features

**Given** a release `R1-foundation` with features `CLI-CORE`, `REL-01`
**And** a story `CLI-CORE-01` with `featureId = "CLI-CORE"`
**And** a story `INVALID-01` with `featureId = "NON-EXISTENT"`
**When** running `specdeck validate links`
**Then** the validator must pass for `CLI-CORE-01` (feature exists)
**And** the validator must fail for `INVALID-01`: "Story INVALID-01 references non-existent feature 'NON-EXISTENT'"

#### Scenario: Validate feature's release matches story's release

**Given** feature `CLI-CORE` with `releaseId = "R1-foundation"`
**And** story `CLI-CORE-01` with `featureId = "CLI-CORE"` and `releaseId = "R2-platform"`
**When** running validation
**Then** the validator must warn: "Story CLI-CORE-01 has releaseId 'R2-platform' but feature CLI-CORE belongs to 'R1-foundation'"
**And** the validation must continue (warning, not fatal error) to support planning flexibility

---

## REMOVED Requirements

None. This change enhances feature management with explicit link validation but does not remove existing functionality.

---

## Dependencies

- **story-schema spec delta**: Feature validation depends on stories having `featureId` and `releaseId` fields
- **release-management spec**: Features are extracted from release files and must validate against release IDs
- **story-management spec**: Story queries must use explicit `featureId` for filtering

## Backward Compatibility

- **No Breaking Changes**: Feature schema itself remains unchanged
- **Service Layer**: FeatureService updates use new Story fields internally but maintain same external API
- **Enhanced Validation**: New validation checks are additive and provide warnings/errors for data quality

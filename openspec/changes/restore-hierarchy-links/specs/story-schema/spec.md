---
capability: story-schema
type: spec-delta
status: proposed
---

# Spec Delta: Story Schema with Explicit Hierarchy Links

## ADDED Requirements

### Requirement: Story Schema Must Include Explicit Feature Link

The Story schema MUST include a required `featureId` field to explicitly link stories to their parent feature, replacing implicit ID prefix matching.

**Priority**: Must Have
**Rationale**: Eliminate implicit coupling through ID prefix matching; enable direct validation of feature relationships

#### Scenario: Story declares explicit feature ID

**Given** a Story with ID `CLI-CORE-01`
**When** parsing the story from project-plan.md
**Then** the Story schema must include a `featureId` field of type `string`
**And** the `featureId` must be a required field (not optional)
**And** the `featureId` value must equal the prefix portion of the Story ID (e.g., `CLI-CORE`)

#### Scenario: Parser auto-derives feature ID from story ID when column missing

**Given** a project-plan.md table without a "Feature" or "feature" column
**When** parsing a story with ID `CLI-CORE-01`
**Then** the parser must automatically derive `featureId = "CLI-CORE"` from the ID prefix
**And** the derived value must satisfy Story ID pattern validation (PREFIX-FEATURE-NUMBER)

#### Scenario: Parser uses explicit feature ID when column present

**Given** a project-plan.md table with a "Feature" column
**And** a story row with ID `CLI-CORE-01` and Feature `CLI-CORE`
**When** parsing the story
**Then** the parser must use the explicit `CLI-CORE` value for `featureId`
**And** the parser must validate that `CLI-CORE` matches the ID prefix
**And** the parser must throw a validation error if they don't match

#### Scenario: Validation detects feature ID mismatch

**Given** a story with ID `CLI-CORE-01` and explicit Feature column value `REL-01`
**When** parsing the story
**Then** the parser must throw a `ValidationError`
**And** the error message must indicate the mismatch: "Story CLI-CORE-01 has featureId 'REL-01' but ID prefix suggests 'CLI-CORE'"
**And** the error must include the file path and line number

### Requirement: Story Schema Must Include Explicit Release Link

The Story schema MUST include a required `releaseId` field to explicitly link stories to their parent release, enabling direct release-level queries without multi-hop traversal.

**Priority**: Must Have
**Rationale**: Enable direct querying of stories by release without feature traversal; support release-level filtering and statistics

#### Scenario: Story declares explicit release IDby release without feature traversal; support release-level filtering and statistics

#### Scenario: Story declares explicit release ID

**Given** a Story with ID `CLI-CORE-01` belonging to feature `CLI-CORE` in release `R1-foundation`
**When** parsing the story from project-plan.md
**Then** the Story schema must include a `releaseId` field of type `string`
**And** the `releaseId` must be a required field (not optional)

#### Scenario: Parser derives release ID from milestone section header

**Given** a project-plan.md with milestone section `## Milestone: R1 – Foundation (Q1 2025)`
**And** a story table under that section with story `CLI-CORE-01`
**When** parsing the story
**Then** the parser must derive `releaseId = "R1-foundation"` from the milestone header
**Or** if an explicit "Release" column exists, use that value instead

#### Scenario: Parser validates release ID consistency with feature

**Given** a feature `CLI-CORE` with `releaseId = "R1-foundation"`
**And** a story `CLI-CORE-01` with explicit `releaseId = "R2-platform"`
**When** parsing the story
**Then** the parser must log a warning: "Story CLI-CORE-01 claims releaseId 'R2-platform' but feature CLI-CORE belongs to 'R1-foundation'"
**And** parsing must continue (warning, not error) to allow cross-release planning

#### Scenario: Query stories directly by release ID

**Given** multiple stories across different features in release `R1-foundation`
**When** executing `storyService.getStoriesByRelease('R1-foundation')`
**Then** the service must filter stories where `story.releaseId === 'R1-foundation'`
**And** the query must not require traversing features (direct field filter)

### Requirement: Story ID Derivation Helper Function

The system MUST provide a utility function to extract the feature ID prefix from a story ID, used for auto-derivation and validation.

**Priority**: Must Have
**Rationale**: Centralize logic for extracting feature ID from story ID to ensure consistency across parser and validation

#### Scenario: Derive feature ID from valid story IDre ID from story ID to ensure consistency across parser and validation

#### Scenario: Derive feature ID from valid story ID

**Given** a story ID `CLI-CORE-01`
**When** calling `deriveFeatureIdFromStoryId('CLI-CORE-01')`
**Then** the function must return `CLI-CORE`

**Given** a story ID `PLT-API-12`
**When** calling `deriveFeatureIdFromStoryId('PLT-API-12')`
**Then** the function must return `PLT-API`

#### Scenario: Handle invalid story ID format

**Given** an invalid story ID `INVALID-ID` (missing number suffix)
**When** calling `deriveFeatureIdFromStoryId('INVALID-ID')`
**Then** the function must throw an error: "Invalid story ID format: INVALID-ID"
**And** the error must indicate the expected pattern: PREFIX-FEATURE-NUMBER

---

### Requirement: Story Schema Validation (Modified)

Story schema validation MUST enforce the presence and correctness of `featureId` and `releaseId` fields in addition to existing validations.

**Priority**: Must Have
**Changes**: Add validation for new `featureId` and `releaseId` fields

#### Scenario: Validate complete story with all required fields fields

#### Scenario: Validate complete story with all required fields

**Given** a story object with all fields including `featureId` and `releaseId`
**When** validating with `StorySchema.parse(story)`
**Then** validation must pass if:
- `id` matches pattern `[A-Z]+-[A-Z0-9]+-\d+`
- `featureId` is a non-empty string
- `releaseId` is a non-empty string
- `featureId` matches the ID prefix of `id`
- All other existing validations pass (status, complexity, etc.)

#### Scenario: Reject story missing featureId

**Given** a story object without a `featureId` field
**When** validating with `StorySchema.parse(story)`
**Then** validation must fail with a Zod validation error
**And** the error must indicate `featureId` is required

#### Scenario: Reject story missing releaseId

**Given** a story object without a `releaseId` field
**When** validating with `StorySchema.parse(story)`
**Then** validation must fail with a Zod validation error
### Requirement: Story Repository Filtering (Modified)

Story repository filtering MUST use the explicit `featureId` and `releaseId` fields instead of ID prefix matching for feature and release queries.

**Priority**: Must Have
**Changes**: Update filtering logic to use explicit `featureId` field instead of ID prefix matching

#### Scenario: Filter stories by feature ID using explicit field
**Priority**: Must Have
**Changes**: Update filtering logic to use explicit `featureId` field instead of ID prefix matching

#### Scenario: Filter stories by feature ID using explicit field

**Given** stories in the repository:
- `CLI-CORE-01` with `featureId = "CLI-CORE"`
- `CLI-CORE-02` with `featureId = "CLI-CORE"`
- `REL-01-01` with `featureId = "REL-01"`
**When** calling `repository.findByFeature('CLI-CORE')`
**Then** the result must include only `CLI-CORE-01` and `CLI-CORE-02`
**And** the filter must use `story.featureId === 'CLI-CORE'` (not ID prefix matching)

#### Scenario: Filter stories by release ID using explicit field

**Given** stories in the repository:
- `CLI-CORE-01` with `releaseId = "R1-foundation"`
- `REL-01-01` with `releaseId = "R1-foundation"`
- `PLT-API-01` with `releaseId = "R2-platform"`
**When** calling `repository.findByRelease('R1-foundation')`
**Then** the result must include `CLI-CORE-01` and `REL-01-01`
**And** the filter must use `story.releaseId === 'R1-foundation'`

---

## REMOVED Requirements

None. This change is purely additive to the Story schema and does not remove any existing functionality.

---

## Dependencies

- **story-management spec**: Story schema is defined here and used throughout the system
- **project-plan-parser spec**: Parser must extract or derive `featureId` and `releaseId` from Markdown tables
- **feature-management spec**: Validation needs to check that `featureId` references an existing feature
- **release-management spec**: Validation needs to check that `releaseId` references an existing release

## Backward Compatibility

- **Breaking Change**: Story schema now requires `featureId` and `releaseId` fields
- **Migration**: Parser auto-derives fields from Story ID and milestone context for existing files
- **Transition Period**: Old project-plan.md files work without adding columns (auto-derivation)
- **Recommended**: Add explicit "Feature" and "Release" columns to tables for clarity

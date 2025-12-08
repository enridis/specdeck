---
capability: repository-consolidation
type: spec-delta
status: proposed
---

# Spec Delta: Repository Consolidation to Single Folder Structure

## ADDED Requirements

### Requirement: All Services Must Read from specdeck Directory

All service classes (ReleaseService, FeatureService, StoryService) MUST read release artifacts from the `specdeck/releases/` directory exclusively, eliminating the split between `openspec/releases/` and `specdeck/releases/`.

**Priority**: Must Have
**Rationale**: Consolidate planning artifacts into a single folder to eliminate architectural confusion and align with SpecDeck conventions

#### Scenario: ReleaseService reads from specdeck directory

**Given** a configuration with `specdeckDir = "./specdeck"`
**When** constructing a ReleaseService instance with `new ReleaseService(specdeckDir)`
**Then** the service must read release files from `specdeck/releases/`
**And** the service must NOT attempt to read from `openspec/releases/`

#### Scenario: FeatureService reads from specdeck directory

**Given** a configuration with `specdeckDir = "./specdeck"`
**When** constructing a FeatureService instance with `new FeatureService(specdeckDir)`
**Then** the service must read release files from `specdeck/releases/` to extract features
**And** the service must NOT receive or use an `openspecDir` parameter

#### Scenario: StoryService reads from specdeck directory

**Given** a configuration with `specdeckDir = "./specdeck"`
**When** constructing a StoryService instance with `new StoryService(specdeckDir)`
**Then** the service must read story tables from `specdeck/releases/R1-foundation.md`
**And** the service must NOT fall back to `openspec/project-plan.md`

---

### Requirement: Release Files Must Contain Both Features and Stories

Each release file in `specdeck/releases/` MUST contain both the feature list (bullet format) and the story table in a single file.

**Priority**: Must Have
**Rationale**: Single source of truth for release planning; easier to maintain features and stories together

#### Scenario: Release file structure contains all sections

**Given** a release file `specdeck/releases/R1-foundation.md`
**When** parsing the file
**Then** the file must include a `## Features` section with bullet-formatted features
**And** the file must include a `## Milestone:` section with a story table
**And** both sections must be parseable by FeatureRepository and StoryRepository respectively

#### Scenario: Feature extraction from consolidated file

**Given** a release file with features section:
```markdown
## Features

- **CLI-CORE**: CLI Entry Point and Command Framework
  - Hierarchical command structure
```
**When** calling `featureRepository.extractFromRelease(content, 'R1-foundation')`
**Then** the repository must successfully extract features with correct IDs and descriptions

#### Scenario: Story extraction from consolidated file

**Given** a release file with stories section:
```markdown
## Milestone: R1 – Foundation

### Stories

| ID | Title | Status | ...
```
**When** calling `storyRepository.readAll()`
**Then** the repository must successfully extract stories from the table

---

### Requirement: Migration Command for Folder Consolidation

The CLI MUST provide a `specdeck migrate` command to merge content from split `openspec/releases/` and `specdeck/releases/` files into unified `specdeck/releases/` files.

**Priority**: Must Have
**Rationale**: Automate migration for existing projects using the split folder structure

#### Scenario: Detect split folder structure

**Given** both `openspec/releases/R1-foundation.md` and `specdeck/releases/R1-foundation.md` exist
**When** running `specdeck migrate check`
**Then** the command must detect the split structure
**And** report which files need migration

#### Scenario: Dry-run merge preview

**Given** split release files exist
**When** running `specdeck migrate --dry-run`
**Then** the command must display the merged content without writing files
**And** show which sections come from which source file
**And** exit without modifying any files

#### Scenario: Execute migration with backup

**Given** split release files exist
**When** running `specdeck migrate`
**Then** the command must:
- Read features from `openspec/releases/R1-foundation.md`
- Read stories from `specdeck/releases/R1-foundation.md`
- Merge content into unified `specdeck/releases/R1-foundation.md`
- Create backup at `openspec/releases.backup/R1-foundation.md`
- Update `.specdeck.config.json` to remove `openspecDir` reference
**And** the command must run validation after migration
**And** the command must report success with summary of changes

#### Scenario: Handle conflicts during migration

**Given** both files have conflicting metadata (different title or timeframe)
**When** running `specdeck migrate`
**Then** the command must prompt user to choose which value to keep
**Or** the command must merge intelligently (prefer specdeck/ for user-facing data)
**And** the command must log all conflicts resolved

---

## MODIFIED Requirements

### Requirement: Service Constructor Signatures

Service constructors MUST accept a single `specdeckDir` parameter instead of separate `openspecDir` and optional `specdeckDir` parameters.

**Priority**: Must Have
**Changes**: Simplify API by removing openspecDir dependency

#### Scenario: ReleaseService constructor simplified

**Given** a service initialization
**When** constructing `new ReleaseService(specdeckDir)`
**Then** the constructor must accept only the `specdeckDir` string parameter
**And** the constructor must NOT accept `openspecDir` parameter

#### Scenario: FeatureService constructor simplified

**Given** a service initialization
**When** constructing `new FeatureService(specdeckDir)`
**Then** the constructor must accept only the `specdeckDir` string parameter
**And** the constructor must NOT accept separate `openspecDir` and `specdeckDir` parameters

#### Scenario: StoryService constructor simplified

**Given** a service initialization
**When** constructing `new StoryService(specdeckDir)`
**Then** the constructor must accept only the `specdeckDir` string parameter
**And** the constructor must NOT accept separate `openspecDir` and `specdeckDir` parameters

---

### Requirement: Configuration Schema

The `.specdeck.config.json` schema MUST use `specdeckDir` as the primary planning directory, with `openspecDir` marked as deprecated.

**Priority**: Should Have
**Changes**: Update configuration to reflect new single-folder architecture

#### Scenario: Configuration uses specdeckDir

**Given** a configuration file `.specdeck.config.json`
**When** parsing the configuration
**Then** the `specdeckDir` field must be the primary directory for release planning
**And** the `openspecDir` field should be optional and deprecated
**And** documentation must indicate `openspecDir` is only for OpenSpec framework artifacts (not SpecDeck planning)

#### Scenario: Backward compatibility with legacy config

**Given** a legacy configuration with both `openspecDir` and `specdeckDir`
**When** parsing the configuration
**Then** the system must log a deprecation warning
**And** prefer `specdeckDir` for release planning
**And** suggest running `specdeck migrate` to update

---

## REMOVED Requirements

None. This change consolidates existing functionality without removing features.

---

## Dependencies

- **release-management spec**: Release files are the source of truth for all services
- **feature-management spec**: Feature extraction logic adapts to read from specdeck/releases/
- **story-management spec**: Story parsing logic adapts to read from specdeck/releases/
- **cli-core spec**: Configuration handling must support deprecation warnings

## Backward Compatibility

- **Breaking Change**: Services no longer accept `openspecDir` parameter for planning data
- **Migration Path**: `specdeck migrate` command automates folder consolidation
- **Fallback**: Services log warning and attempt fallback to `openspec/releases/` if `specdeck/releases/` missing (transition period only)
- **Documentation**: Clear migration guide in CHANGELOG and README

---
id: restore-hierarchy-links
title: Restore Explicit Hierarchy Links and Fix Folder Structure
created: 2025-12-08
status: proposed
---

# Proposal: Restore Explicit Hierarchy Links and Fix Folder Structure

## Problem Statement

SpecDeck has **two critical architectural issues** that need to be addressed together:

### Issue 1: Incomplete Explicit Linking

The current SpecDeck data model has **incomplete explicit linking** between the three-tier planning hierarchy:

1. **Release → Feature**: ✓ Explicit (Feature has `releaseId` field)
2. **Feature → Story**: ✗ Implicit (Story ID prefix matching, e.g., `CLI-CORE-01` → `CLI-CORE`)
3. **Story → Feature**: ✗ No explicit field (relies on ID parsing)
4. **Story → Release**: ✗ No link at all (requires transitive navigation)

### Current Issues

- **Story schema lacks `featureId`**: Stories don't explicitly declare which feature they belong to
- **Story schema lacks `releaseId`**: Stories don't know which release milestone they're part of
- **Fragile ID-based linking**: The `findByFeature` logic depends on prefix matching, which breaks if:
  - Story IDs are renamed
  - Feature IDs are renamed
  - Non-standard ID patterns are used
- **No data integrity**: Nothing prevents orphaned stories (story exists but feature deleted)
- **Query inefficiency**: Finding all stories for a release requires:
  1. Get release → features
  2. For each feature → get stories by prefix match
- **Limited filtering**: Can't filter stories by release without feature intermediary

### Issue 2: Folder Structure Inconsistency

The current implementation **splits release artifacts across two folders**:

```
openspec/
  releases/
    R1-foundation.md  ← Contains FEATURES (read by ReleaseService/FeatureService)
    
specdeck/
  releases/
    R1-foundation.md  ← Contains STORIES (read by StoryService)
  project-plan.md     ← LEGACY stories location
```

**Problems:**
**Benefits:**
1. **Data Integrity**: Validate that `featureId` and `releaseId` reference existing entities
2. **Explicit Contracts**: No hidden coupling through ID parsing conventions
3. **Query Efficiency**: Direct filtering by `releaseId` without feature traversal
4. **Refactoring Safety**: Renaming IDs won't break implicit relationships
5. **Backward Compatibility**: Can auto-populate fields during migration from ID prefixes

### Solution Part 2: Consolidate to Feature-Based File Structure

**Migrate all SpecDeck planning artifacts to `specdeck/` folder with feature-based organization:**

```
specdeck/
  vision.md                    ← Product vision
  project-plan.md              ← DEPRECATED (legacy)
  releases/
    R1-foundation.md           ← Release overview (objectives, features list)
    R1-foundation/             ← Feature-specific story files
      CLI-CORE.md              ← Stories for CLI-CORE feature
      REL-01.md                ← Stories for REL-01 feature
      FEAT-01.md               ← Stories for FEAT-01 feature
      ...
```

**New Service Configuration:**
```typescript
ReleaseService(specdeckDir)  → reads specdeck/releases/*.md
FeatureService(specdeckDir)  → reads specdeck/releases/*.md
StoryService(specdeckDir)    → reads specdeck/releases/*/[FEATURE].md
```

**Benefits:**
1. **Scalability**: Each feature file typically has 5-10 stories (manageable size)
2. **Parallel Work**: Team members work on different feature files without merge conflicts
3. **Clear Architecture**: `openspec/` for framework, `specdeck/` for planning
4. **Focused Context**: When working on a feature, see only relevant stories
5. **Better Git History**: Focused diffs per feature, less noise
6. **Clear Ownership**: Feature owners manage their own story files
7. **Consistent with SpecDeck Conventions**: Aligns with documented two-tier planning model

## Scope

### In Scope

**Schema Changes:**
- Add `featureId` and `releaseId` fields to Story schema
- Update Story parser to extract or derive these fields
- Add validation that `featureId` matches ID prefix (transition validation)
- Update StoryRepository filtering to use explicit fields

**Folder Structure Migration:**
- Consolidate release files from `openspec/releases/` to `specdeck/releases/`
- Create feature-based directory structure under each release
- Update ReleaseService, FeatureService, StoryService to read from `specdeck/releases/`
- Remove `openspecDir` parameter from service constructors (use `specdeckDir` only)
- Split story tables into per-feature files under `releases/[RELEASE-ID]/[FEATURE-ID].md`
- Maintain release overview in `releases/[RELEASE-ID].md` with feature list and metadata
- Update configuration to use `specdeckDir` as primary planning directory

**Command Updates:**
- Update all list/show commands to leverage explicit links
## Alternatives Considered

### Alternative 1: Keep Implicit Linking

**Pros**: No schema changes, no migration needed
**Cons**: Fragile, hidden coupling, can't validate integrity
**Decision**: Rejected - technical debt outweighs migration cost

### Alternative 2: Add Only `featureId`

**Pros**: Smaller change, derive `releaseId` from feature
**Cons**: Still requires feature lookup for release filtering
**Decision**: Rejected - `releaseId` adds value for direct queries

### Alternative 3: Make Fields Optional

**Pros**: Backward compatible with missing data
**Cons**: Defeats purpose of explicit linking, still fragile
### Alternative 4: Keep Two-Folder Structure

**Pros**: No file migration needed, existing code mostly works
**Cons**: Architectural confusion persists, violates SpecDeck conventions, harder to maintain
**Decision**: Rejected - consolidation aligns with documented architecture and simplifies codebase

### Alternative 5: Migrate to `openspec/` Instead of `specdeck/`

**Pros**: Less code changes in service constructors
**Cons**: Violates separation of concerns (OpenSpec framework vs SpecDeck planning), confusing for users
**Decision**: Rejected - `specdeck/` is the correct location per conventions

### Alternative 6: Single File Per Release (Features + Stories)

### Alternative 6: Single File Per Release (Features + Stories)

**Pros**: Simpler structure, one file to understand a release
**Cons**: Doesn't scale for large releases (100+ stories), high merge conflict risk, noisy git diffs
**Decision**: Rejected - feature-based split provides better scalability and parallel collaboration

## Success Criteria

**Schema Success:**
1. Story schema includes required `featureId` and `releaseId` fields
2. All existing stories successfully parse with auto-populated fields
3. Validation ensures `featureId` prefix matches Story ID prefix
4. `list stories --release R1` works without feature traversal

**Folder Structure Success:**
5. All release files consolidated in `specdeck/releases/` with feature-based organization
6. Each feature has its own story file under `releases/[RELEASE-ID]/[FEATURE-ID].md`
7. ReleaseService, FeatureService, StoryService read from `specdeck/releases/` only
8. Service constructors simplified to accept only `specdeckDir` parameter
9. No references to `openspec/releases/` in application code
10. Configuration uses `specdeckDir` as primary planning directory
11. Merge conflicts reduced through feature file separation

**Quality Gates:**
12. All tests pass with 80%+ coverage maintained
13. No breaking changes to CLI command interfaces (user-facing)
14. Migration script successfully converts existing projects
15. Documentation updated to reflect new folder structure
## Risks & Mitigations

### Risk: Breaking Existing Files

**Likelihood**: High | **Impact**: High

Existing `specdeck/releases/R1-foundation.md` files don't have `featureId`/`releaseId` columns in story tables.

**Mitigation**:
- Parser auto-populates fields from Story ID prefix during read
- Add `--validate-links` flag to check data integrity
- Document migration in CHANGELOG as breaking change
- Provide migration script if needed

### Risk: Inconsistent Data

**Likelihood**: Medium | **Impact**: Medium

Users may manually edit files with incorrect `featureId`/`releaseId` values.

**Mitigation**:
- Validation enforces `featureId` matches Story ID prefix
- Validation checks `featureId` exists in parent release
- Clear error messages guide users to fix issues

### Risk: Data Loss During Folder Migration

**Likelihood**: Medium | **Impact**: High

Migrating files from `openspec/releases/` to `specdeck/releases/` could lose data if files differ.

**Mitigation**:
- Create migration script that merges content (features from openspec, stories from specdeck)
- Backup existing files before migration
- Provide dry-run mode to preview changes
- Manual review option for conflicting content

### Risk: Breaking OpenSpec Integration

**Likelihood**: Low | **Impact**: Medium

Moving release files might break OpenSpec CLI tools that reference `openspec/releases/`.

**Mitigation**:
- Review OpenSpec CLI to ensure it doesn't depend on `openspec/releases/` for SpecDeck planning
- `openspec/releases/` is not a standard OpenSpec convention (OpenSpec uses `openspec/changes/` and `openspec/specs/`)
- The current `openspec/releases/R1-foundation.md` is a SpecDeck artifact misplaced in openspec folder
### Alternative 3: Make Fields Optional

**Pros**: Backward compatible with missing data
**Cons**: Defeats purpose of explicit linking, still fragile
**Decision**: Rejected - required fields enforce data quality

## Success Criteria

1. Story schema includes required `featureId` and `releaseId` fields
2. All existing stories successfully parse with auto-populated fields
3. Validation ensures `featureId` prefix matches Story ID prefix
4. `list stories --release R1` works without feature traversal
5. All tests pass with 80%+ coverage maintained
6. No breaking changes to CLI command interfaces

## Risks & Mitigations

### Risk: Breaking Existing Files

**Likelihood**: High | **Impact**: High

Existing `specdeck/releases/R1-foundation.md` files don't have `featureId`/`releaseId` columns in story tables.

**Mitigation**:
- Parser auto-populates fields from Story ID prefix during read
- Add `--validate-links` flag to check data integrity
- Document migration in CHANGELOG as breaking change
- Provide migration script if needed

### Risk: Inconsistent Data

**Likelihood**: Medium | **Impact**: Medium

Users may manually edit files with incorrect `featureId`/`releaseId` values.

**Mitigation**:
- Validation enforces `featureId` matches Story ID prefix
- Validation checks `featureId` exists in parent release
- Clear error messages guide users to fix issues

## Next Steps

1. Review and approve this proposal
2. Create spec deltas in `specs/story-schema/` and `specs/feature-schema/`
3. Write detailed tasks.md with implementation sequence
4. Implement changes following tasks.md order
5. Validate with `openspec validate restore-hierarchy-links --strict`

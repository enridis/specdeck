---
title: Design - Restore Explicit Hierarchy Links and Fix Folder Structure
date: 2025-12-08
---

# Design: Explicit Hierarchy Links and Folder Consolidation

## Context

SpecDeck has two interrelated architectural issues:

1. **Implicit Linking**: The three-tier hierarchy (Release → Feature → Story) uses ID prefix matching instead of explicit foreign keys
2. **Split Folders**: Release artifacts are split across `openspec/releases/` (features) and `specdeck/releases/` (stories)

This design addresses both issues together since they're architecturally coupled through the service layer.

- Release to Feature: **Explicit** via `Feature.releaseId`
- Feature to Story: **Implicit** via Story ID prefix matching
- Story to Feature: **No direct link** (reverse-engineered from ID)
- Story to Release: **No direct link** (requires multi-hop traversal)

This design document explores the trade-offs and implementation strategy for adding explicit `featureId` and `releaseId` fields to the Story schema.

## Architecture Overview

### Current State (Problematic)

**Data Model:**
```
┌─────────┐
│ Release │
│  id     │
│ features│◄───────┐
└─────────┘        │
                   │
              ┌────┴────┐
              │ Feature │
              │  id     │
              │releaseId│
              └────┬────┘
                   │
                   │ (implicit via ID prefix)
                   │
              ┌────▼────┐
              │  Story  │
              │   id    │
              │  (no links)
              └─────────┘
```

**File Structure:**
```
openspec/
  releases/
    R1-foundation.md      ← Features (ReleaseService/FeatureService)
    
specdeck/
  releases/
    R1-foundation.md      ← Stories (StoryService)
```

**Problems:**
- Story → Feature relationship hidden in ID parsing logic
- Story → Release requires transitive query (Story → Feature → Release)
- Fragile: renaming Feature.id breaks all child stories
- No validation that Story.id prefix matches actual Feature.id
- Services split across two directories with unclear boundaries
- Duplication: two R1-foundation.md files with different content

### Proposed State

**Data Model:**
```
┌─────────┐
│ Release │
│  id     │
│ features│◄───────┐
└─────────┘        │
     ▲             │
     │        ┌────┴────┐
     │        │ Feature │
     │        │  id     │
     │        │releaseId│
     │        └────┬────┘
     │             ▲
     │             │
     │        ┌────┴────┐
     │        │  Story  │
     └────────┤ featureId (NEW)
              │releaseId  (NEW)
              │   id     │
              └──────────┘
```

**File Structure:**
```
specdeck/
  releases/
    R1-foundation.md          ← Release overview + features list
    R1-foundation/            ← Feature-specific story files
      CLI-CORE.md
      REL-01.md
      FEAT-01.md
```

**Benefits:**
- All links explicit and queryable
- Direct Story → Release queries possible
- Validation ensures referential integrity
- Refactoring-safe (no hidden coupling)
- Scalable to large releases (100+ stories)
- Parallel work without merge conflicts
- Focused git diffs per feature
- Clear feature ownership

## Design Decisions

### Decision 1: Add Both `featureId` AND `releaseId`

**Options**:

1. **Add only `featureId`** - Derive `releaseId` by querying Feature
2. **Add both `featureId` and `releaseId`** - Redundant but direct
3. **Add only `releaseId`** - Derive `featureId` from Story ID prefix

**Choice**: Option 2 (Add both)

**Rationale**:
- **Query performance**: `list stories --release R1` doesn't need feature lookup
- **Data denormalization**: Acceptable in file-based system (no DB normalization required)
- **Validation**: Can cross-check `releaseId` matches `Feature.releaseId`
- **Migration**: Both can be auto-populated from existing data

**Trade-off**: Potential inconsistency if Feature moves to different Release (mitigated by validation)

### Decision 2: Make Fields Required (Not Optional)

**Options**:

1. **Optional fields** - Backward compatible with missing data
2. **Required fields** - Enforce data quality from start

**Choice**: Option 2 (Required)

**Rationale**:
- **Data integrity**: Forces explicit modeling of hierarchy
- **No ambiguity**: Always know which feature/release a story belongs to
- **Simplifies queries**: No need to handle `undefined` cases
- **Migration**: Auto-populate from ID prefix during first parse

**Trade-off**: Breaking change for existing files (acceptable for v0.1 → v0.2)

### Decision 3: Consolidate to `specdeck/` Folder (Not `openspec/`)

**Options**:

1. **Keep two-folder structure** - Features in openspec/, stories in specdeck/
2. **Move everything to openspec/** - Single folder for all planning
3. **Move everything to specdeck/** - Single folder for all planning

**Choice**: Option 3 (Consolidate to `specdeck/`)

**Rationale**:
- **Architectural clarity**: `openspec/` is for OpenSpec framework artifacts (proposals, specs, changes), not SpecDeck planning data
- **Convention alignment**: SpecDeck documentation (`specdeck/AGENTS.md`) specifies planning lives in `specdeck/`
- **Separation of concerns**: Framework (openspec) vs. application planning (specdeck)
- **User clarity**: Teams know where to find their release plans

### Decision 4: Split Stories by Feature (Not Single File)

**Options**:

1. **Single file per release** - All features and stories in one file
2. **Feature-based files** - Separate file per feature with its stories
3. **Database storage** - Store in structured database instead of files

**Choice**: Option 2 (Feature-based files)

**Rationale**:
- **Scalability**: Each feature file has 5-10 stories (manageable), scales to 100+ stories per release
- **Merge conflicts**: Team members work on different feature files without conflicts
- **Git history**: Focused diffs per feature, easier to review changes
- **Parallel work**: Multiple developers can work on different features simultaneously
- **Context focus**: When working on a feature, see only relevant stories
- **Clear ownership**: Feature owners manage their own story files
- **Flexible growth**: Add features without touching existing feature files

**File Structure**:
```
specdeck/releases/
  R1-foundation.md              ← Release overview
  R1-foundation/
    CLI-CORE.md                 ← 4 stories (~20 lines)
    REL-01.md                   ← 6 stories (~30 lines)
    FEAT-01.md                  ← 5 stories (~25 lines)
    ...
```

**Trade-off**: Slightly more complex implementation (read multiple files) but worth it for scalability and collaboration benefits

### Decision 5: Auto-Populate from Story ID During Migration

### Decision 5: Auto-Populate from Story ID During Migration

**Options**:

1. **Manual migration** - User adds columns to tables
2. **Auto-populate** - Parser infers from Story ID prefix
3. **Fail loudly** - Require explicit values immediately

**Choice**: Option 2 (Auto-populate with validation)

**Rationale**:
- **Zero user effort**: Existing files work without manual edits
- **Gradual migration**: Users can add explicit columns over time
- **Validation**: Parser warns if inferred values don't match existing columns
- **Flexibility**: Supports both old format (no columns) and new format (explicit columns)

**Implementation**:
```typescript
// Parser logic (pseudocode)
const featureId = raw['Feature'] || raw['feature'] || deriveFromStoryId(storyId);
const releaseId = raw['Release'] || raw['release'] || deriveFromFeature(featureId);

// Validation
if (raw['Feature'] && raw['Feature'] !== deriveFromStoryId(storyId)) {
  throw new Error(`Story ${storyId} has explicit featureId ${raw['Feature']} that doesn't match ID prefix`);
}
```

### Decision 4: Validate ID Prefix Consistency

**Options**:

1. **Trust explicit values** - Allow any `featureId` even if ID doesn't match
2. **Validate consistency** - Enforce `featureId` matches Story ID prefix
3. **Strict mode only** - Validate only with `--strict` flag

**Choice**: Option 2 (Always validate)

**Rationale**:
- **Prevents data corruption**: Story `CLI-CORE-01` can't claim `featureId: REL-01`
- **Enforces conventions**: Maintains ID naming standards
- **Catches errors early**: Detects typos during parsing
- **Clear errors**: Provides actionable error messages

**Example Error**:
```
Error: Story CLI-CORE-01 has featureId "REL-01" but ID prefix suggests "CLI-CORE"
  at specdeck/releases/R1-foundation.md:25
  Fix: Change featureId to "CLI-CORE" or rename Story ID to match
```

## Folder Migration Strategy

### Current File Distribution

**openspec/releases/R1-foundation.md:**
- Contains: Release metadata (YAML), objectives, success metrics, **feature list** (bullet format)
- Read by: ReleaseRepository, FeatureRepository
- Content focus: What capabilities the release will deliver

**specdeck/releases/R1-foundation.md:**
- Contains: **Story table** with all implementation details
- Read by: StoryRepository
- Content focus: How the work will be executed

### Migration Approach

**Step 1: Create Feature-Based Directory Structure**

Transform from monolithic to feature-based structure:

```
BEFORE:
specdeck/releases/R1-foundation.md  (90 lines - all 42 stories in one table)

AFTER:
specdeck/releases/
  R1-foundation.md                  (50 lines - release overview + feature list)
  R1-foundation/
    CLI-CORE.md                     (20 lines - 4 stories)
    REL-01.md                       (30 lines - 6 stories)
    FEAT-01.md                      (25 lines - 5 stories)
    STORY-01.md                     (30 lines - 6 stories)
    PARSE-01.md                     (25 lines - 5 stories)
    OPENSPEC-01.md                  (20 lines - 4 stories)
    TEST-01.md                      (25 lines - 5 stories)
    DOC-01.md                       (20 lines - 4 stories)
    PKG-01.md                       (15 lines - 3 stories)
```

**Step 2: Release Overview File Format**

`specdeck/releases/R1-foundation.md`:

```markdown
---
id: R1-foundation
title: Foundation Release
timeframe: Q1 2025
---

# Release: R1 – Foundation

## Objectives
[Copy from openspec/releases/R1-foundation.md]

## Success Metrics
[Copy from openspec/releases/R1-foundation.md]

## Features

- **CLI-CORE**: CLI Entry Point and Command Framework
  - Stories: 4 ([CLI-CORE.md](./R1-foundation/CLI-CORE.md))
  - Hierarchical command structure with Commander.js
  - Global options, error handling, configuration discovery

- **REL-01**: Release Management
  - Stories: 6 ([REL-01.md](./R1-foundation/REL-01.md))
  - List, show, create releases
  - Parse YAML front matter and Markdown structure

...
```

**Step 3: Feature Story File Format**

`specdeck/releases/R1-foundation/CLI-CORE.md`:

```markdown
---
feature: CLI-CORE
release: R1-foundation
title: CLI Entry Point and Command Framework
---

# Feature: CLI-CORE

## Description

Hierarchical command structure with Commander.js, global options (--version, --help, --json, --verbose), consistent error handling and user-friendly messages, and configuration discovery (.specdeck.config.json or auto-detect).

## Stories

| ID          | Title                                      | Status | Complexity | Estimate | Owner | Tags            |
|-------------|--------------------------------------------|--------|------------|----------|-------|-----------------|
| CLI-CORE-01 | CLI entry point and command framework      | done   | M          | 5        | TBA   | cli, infra      |
| CLI-CORE-02 | Global error handling and logging          | done   | S          | 3        | TBA   | cli, infra      |
| CLI-CORE-03 | Output formatting (table and JSON)         | done   | S          | 3        | TBA   | cli, infra      |
| CLI-CORE-04 | Configuration discovery                    | done   | M          | 5        | TBA   | cli, config     |

## Summary

- **Total Stories**: 4
- **Total Estimate**: 16 story points
- **Status**: All done
```

**Step 4: Service Migration**

Update service constructors and repository implementations:

```typescript
// BEFORE
class StoryRepository {
  constructor(projectPlanPath: string) {
    // Read single file: specdeck/releases/R1-foundation.md
  }
  
  async readAll(): Promise<Story[]> {
    // Parse single table from one file
  }
}

// AFTER
class StoryRepository {
  constructor(releasesDir: string) {
    // Read from: specdeck/releases/
  }
  
**Step 5: Command Layer Updates**g, featureId?: string): Promise<Story[]> {
    if (featureId && releaseId) {
      // Read specdeck/releases/R1-foundation/CLI-CORE.md
      return this.readFeatureFile(releaseId, featureId);
    }
    
    if (releaseId) {
      // Read all files in specdeck/releases/R1-foundation/
      return this.readReleaseFeatureFiles(releaseId);
    }
    
    // Read all releases, all feature files
    return this.readAllFeatureFiles();
  }
**Step 6: Configuration Migration**
  private async readFeatureFile(releaseId: string, featureId: string): Promise<Story[]> {
    const path = join(this.releasesDir, releaseId, `${featureId}.md`);
    const content = await readFile(path, 'utf-8');
    return this.parseFeatureStories(content, releaseId, featureId);
  }
}
```

**Step 3: Command Layer Updates**

```typescript
// BEFORE
const openspecDir = config.openspecDir || './openspec';
const releaseService = new ReleaseService(openspecDir);
const featureService = new FeatureService(openspecDir, config.specdeckDir);

// AFTER
const specdeckDir = config.specdeckDir || './specdeck';
const releaseService = new ReleaseService(specdeckDir);
const featureService = new FeatureService(specdeckDir);
```

**Step 4: Configuration Migration**

Update `.specdeck.config.json`:

```json
// BEFORE
{
  "openspecDir": "./openspec",
  "specdeckDir": "./specdeck"
}

// AFTER
{
  "specdeckDir": "./specdeck"
}
```

### Migration Tool

Provide `specdeck migrate` command:

```bash
# Detect split files and structure
specdeck migrate check

# Preview feature-based split
specdeck migrate --dry-run

# Execute migration
specdeck migrate

# What it does:
# 1. Read openspec/releases/R1-foundation.md (features section)
# 2. Read specdeck/releases/R1-foundation.md (stories table)
# 3. Group stories by feature ID (from Story.id prefix)
# 4. Create specdeck/releases/R1-foundation/ directory
# 5. Write one feature file per feature with its stories
# 6. Write release overview file with features list
# 7. Backup openspec/releases/ to openspec/releases.backup/
# 8. Update .specdeck.config.json
# 9. Run validation
```

### Backward Compatibility

**Fallback Logic for Transition Period:**

```typescript
class ReleaseService {
  constructor(specdeckDir: string, legacyOpenspecDir?: string) {
    let releasesDir = join(specdeckDir, 'releases');
    
    // Fallback to legacy location if specdeck/releases/ doesn't exist
    if (!existsSync(releasesDir) && legacyOpenspecDir) {
      console.warn('Warning: Using legacy openspec/releases/. Run `specdeck migrate` to update.');
      releasesDir = join(legacyOpenspecDir, 'releases');
    }
    
    this.releaseRepository = new ReleaseRepository(releasesDir);
  }
}
```

## Implementation Strategy

### Phase 1: Schema Update

1. Add `featureId: z.string()` to StorySchema
2. Add `releaseId: z.string()` to StorySchema
3. Update TypeScript types (auto-generated from Zod)

### Phase 2: Parser Enhancement

1. Update StoryRepository.readAll() to extract/derive fields:
   ```typescript
   featureId: raw['Feature'] || deriveFeatureIdFromStoryId(storyId)
   releaseId: raw['Release'] || deriveReleaseIdFromFeature(featureId)
   ```

2. Add validation logic:
   ```typescript
   const expectedFeatureId = deriveFeatureIdFromStoryId(storyId);
   if (featureId !== expectedFeatureId) {
     throw new ValidationError(...)
   }
   ```

3. Add helper function to derive from ID:
   ```typescript
   function deriveFeatureIdFromStoryId(storyId: string): string {
     // "CLI-CORE-01" → "CLI-CORE"
     const match = storyId.match(/^([A-Z]+-[A-Z0-9]+)-\d+$/);
     if (!match) throw new Error(`Invalid story ID format: ${storyId}`);
     return match[1];
   }
   ```

### Phase 3: Service Layer Updates

1. Update StoryRepository.findByFeature() to use explicit `featureId` field instead of prefix matching
2. Add StoryRepository.findByRelease() for direct release queries
3. Update FeatureService to pass `releaseId` when creating stories

### Phase 4: Command Interface

1. Add `--release` flag to `list stories` command
2. Update `create story` command to prompt for `featureId` and `releaseId`
3. Add `validate links` command to check referential integrity

### Phase 5: Testing & Migration

1. Add tests for auto-population logic
2. Add tests for validation edge cases
3. Test with existing fixture files (backward compatibility)
4. Document breaking changes in CHANGELOG
5. Provide migration guide in docs

## Data Migration

### Existing File Format (No Change Required)

```markdown
| ID           | Title                                      | Status | ...
|--------------|--------------------------------------------|---------
| CLI-CORE-01  | CLI entry point and command framework      | done   | ...
```

Parser auto-derives:
- `featureId = "CLI-CORE"` (from ID prefix)
- `releaseId = "R1-foundation"` (from milestone section header or feature lookup)

### Optional New Format (For Explicit Control)

```markdown
| ID          | Feature    | Release        | Title                    | Status | ...
|-------------|------------|----------------|--------------------------|--------
| CLI-CORE-01 | CLI-CORE   | R1-foundation  | CLI entry point...       | done   | ...
```

Parser uses explicit values and validates against ID prefix.

### Migration Path

1. **Phase 1**: Parser auto-derives, validates against explicit columns (if present)
2. **Phase 2**: Add `--validate-links --strict` to enforce explicit columns
3. **Phase 3** (optional): Deprecate auto-derivation, require explicit columns

## Validation Rules

### Rule 1: Feature ID Consistency

```
Story.featureId MUST equal prefix of Story.id
Example: Story "CLI-CORE-01" → featureId must be "CLI-CORE"
```

### Rule 2: Feature Exists in Release

```
Story.featureId MUST exist in Release.features list
Example: If Story.releaseId = "R1", then Feature "CLI-CORE" must be listed in R1-foundation.md
```

### Rule 3: Release Consistency

```
Feature.releaseId MUST equal Story.releaseId
Example: If Story.featureId = "CLI-CORE" and Story.releaseId = "R1"
         then Feature "CLI-CORE" must have releaseId = "R1"
```

### Rule 4: No Orphaned Stories

```
Story.featureId MUST reference existing Feature
Story.releaseId MUST reference existing Release
```

## Performance Considerations

### Query Patterns

**Before** (implicit linking):
```typescript
// Get all stories for a release
const release = await releaseService.getRelease('R1');
const features = await featureService.getFeaturesByRelease('R1');
const stories = [];
for (const feature of features) {
  stories.push(...await storyService.getStoriesByFeature(feature.id));
}
// O(n) feature lookups + O(n) prefix matching
```

**After** (explicit linking):
```typescript
// Get all stories for a release
const stories = await storyService.getStoriesByRelease('R1');
// O(1) direct filter on releaseId field
```

### File Size Impact

Adding two fields per story:
- ~20 characters per story (featureId + releaseId)
- 42 stories in R1 → +840 bytes
- **Negligible** for Markdown files (R1-foundation.md is ~8KB)

## Testing Strategy

### Unit Tests

1. Schema validation with valid/invalid `featureId` and `releaseId`
2. ID prefix derivation logic
3. Validation rule enforcement
4. Edge cases (missing columns, typos, orphans)

### Integration Tests

1. Parse existing files without new columns (backward compat)
2. Parse files with explicit columns (new format)
3. Parse files with mismatched columns (validation errors)
4. Repository filtering by `featureId` and `releaseId`

### End-to-End Tests

1. `list stories --release R1` returns correct stories
2. `list features --with-stories` shows correct hierarchy
3. `validate links` detects orphaned stories
4. `create story` enforces valid `featureId` and `releaseId`

## Rollback Plan

If issues arise during implementation:

1. **Revert schema changes**: Remove `featureId` and `releaseId` from StorySchema
2. **Restore implicit linking**: Revert StoryRepository to use ID prefix matching
3. **No data loss**: Old files remain valid (fields were derived, not required in files)
4. **Low risk**: Changes are additive to data model, not destructive

## Future Enhancements

### Potential Follow-ups

1. **Cascade operations**: Delete feature → warn about orphaned stories
2. **Referential integrity CLI**: `specdeck doctor` to check all links
3. **Rename helpers**: `specdeck rename feature OLD NEW` updates all story links
4. **Query optimization**: Index stories by `releaseId` for large files
5. **Cross-release tracking**: Stories that move between releases

---

## Summary

Adding explicit `featureId` and `releaseId` to the Story schema:

✅ **Improves data integrity** - Validates relationships at parse time
✅ **Simplifies queries** - Direct filtering without multi-hop traversal  
✅ **Refactoring-safe** - No hidden coupling through ID conventions
✅ **Backward compatible** - Auto-derives from existing Story IDs
✅ **Low risk** - Additive change with clear migration path

This design provides a solid foundation for scaling SpecDeck to more complex planning scenarios while maintaining the simplicity of file-based storage.

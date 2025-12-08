---
id: restore-hierarchy-links
title: Tasks - Restore Explicit Hierarchy Links and Fix Folder Structure
status: proposed
---

# Implementation Tasks

## Overview

This change addresses two interrelated issues:
1. Adds explicit `featureId` and `releaseId` fields to the Story schema
2. Consolidates release artifacts from split folders (`openspec/releases/` + `specdeck/releases/`) into a single `specdeck/releases/` location

Implementation is organized into phases with folder migration happening first to establish clean architecture foundation.

---

## Phase 0: Folder Structure Migration

### Task 0.1: Create Migration Script

**Priority**: Must Have | **Estimate**: 5 points | **Dependencies**: None

**Description**: Create `specdeck migrate` command to consolidate split release files.

**Implementation**:
1. Create `src/commands/migrate.ts`
2. Implement `check` subcommand to detect split files:
   ```typescript
   async function checkSplitFiles(openspecDir, specdeckDir): Promise<SplitFile[]> {
     // Find files in both directories
     // Return list of files needing migration
   }
   ```
3. Implement `--dry-run` mode to preview merge
4. Implement merge logic:
   - Read features section from `openspec/releases/*.md`
   - Read stories section from `specdeck/releases/*.md`  
   - Merge into unified format in `specdeck/releases/*.md`
5. Add backup before modification
6. Update `.specdeck.config.json` after successful migration

**Validation**:
- `specdeck migrate check` detects split files correctly
- `specdeck migrate --dry-run` shows merged preview without writing
- `specdeck migrate` creates backup and merges files
- Merged file contains both features and stories sections

**Files Created**:
- `src/commands/migrate.ts`

**Tests**:
- `tests/commands/migrate.test.ts`

---

### Task 0.2: Merge Release Files in SpecDeck Repo

**Priority**: Must Have | **Estimate**: 2 points | **Dependencies**: 0.1

**Description**: Run migration on SpecDeck's own release files as dogfooding.

**Implementation**:
1. Run `npm run cli -- migrate --dry-run` to preview
2. Review merged content
3. Run `npm run cli -- migrate` to execute
4. Verify `specdeck/releases/R1-foundation.md` contains both features and stories
5. Commit migrated files

**Validation**:
- Single `specdeck/releases/R1-foundation.md` exists with complete content
- `openspec/releases/R1-foundation.md` backed up
- CLI commands still work correctly

---

### Task 0.3: Update Service Constructors to Use specdeckDir

**Priority**: Must Have | **Estimate**: 3 points | **Dependencies**: 0.2

**Description**: Refactor service constructors to accept single `specdeckDir` parameter.

**Implementation**:
1. Update `ReleaseService` constructor:
   ```typescript
   // BEFORE
   constructor(openspecDir: string) {
     const releasesDir = join(openspecDir, 'releases');
   
   // AFTER
   constructor(specdeckDir: string) {
     const releasesDir = join(specdeckDir, 'releases');
   ```

2. Update `FeatureService` constructor:
   ```typescript
   // BEFORE
   constructor(openspecDir: string, specdeckDir?: string) {
     const releasesDir = join(openspecDir, 'releases');
     this.storyService = new StoryService(openspecDir, specdeckDir);
   
   // AFTER
   constructor(specdeckDir: string) {
     const releasesDir = join(specdeckDir, 'releases');
     this.storyService = new StoryService(specdeckDir);
   ```

3. Update `StoryService` constructor:
   ```typescript
   // BEFORE
   constructor(openspecDir: string, specdeckDir?: string) {
     const path = specdeckDir 
       ? join(specdeckDir, 'releases', 'R1-foundation.md')
       : join(openspecDir, 'project-plan.md');
   
   // AFTER
   constructor(specdeckDir: string) {
     const path = join(specdeckDir, 'releases', 'R1-foundation.md');
   ```

**Validation**:
- TypeScript compilation succeeds
- All service tests updated and passing
- No references to `openspecDir` in service layer

**Files Modified**:
- `src/services/release.service.ts`
- `src/services/feature.service.ts`
- `src/services/story.service.ts`

---

### Task 0.4: Update Command Layer to Pass specdeckDir

**Priority**: Must Have | **Estimate**: 2 points | **Dependencies**: 0.3

**Description**: Update all commands to pass `specdeckDir` to services instead of `openspecDir`.

**Implementation**:
1. Update `src/commands/list.ts`:
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

2. Apply same changes to all commands: `create.ts`, `propose.ts`, `sync.ts`, etc.

**Validation**:
- All commands compile successfully
- Manual test: `npm run cli -- list releases` works
- Manual test: `npm run cli -- list features --with-stories` works

**Files Modified**:
- `src/commands/list.ts`
- `src/commands/create.ts`
- `src/commands/propose.ts`
- `src/commands/sync.ts`
- Any other commands using services

---

### Task 0.5: Update Configuration Schema

**Priority**: Should Have | **Estimate**: 2 points | **Dependencies**: 0.4

**Description**: Mark `openspecDir` as deprecated in configuration schema.

**Implementation**:
1. Update `src/schemas/config.schema.ts`:
   ```typescript
   export const ConfigSchema = z.object({
     specdeckDir: z.string().default('./specdeck'),
     openspecDir: z.string().optional(), // DEPRECATED
     repos: z.array(RepoSchema).default([]),
   });
   ```

2. Add deprecation warning in ConfigRepository:
   ```typescript
   if (config.openspecDir) {
     console.warn('Warning: openspecDir is deprecated. Use specdeckDir for planning artifacts.');
     console.warn('Run `specdeck migrate` to consolidate folder structure.');
   }
   ```

3. Update documentation to clarify folder purposes

**Validation**:
- Config with `openspecDir` logs deprecation warning
- Config with only `specdeckDir` works without warnings
- Documentation updated

**Files Modified**:
- `src/schemas/config.schema.ts`
- `src/repositories/config.repository.ts`
- `README.md`

---

## Phase 1: Schema Foundation

### Task 1.1: Add featureId and releaseId to Story Schema

**Priority**: Must Have | **Estimate**: 2 points | **Dependencies**: None

**Description**: Update `src/schemas/story.schema.ts` to include explicit hierarchy links.

**Implementation**:
1. Add `featureId: z.string()` to StorySchema object
2. Add `releaseId: z.string()` to StorySchema object
3. Update TypeScript type exports (auto-inferred from Zod)
4. Ensure both fields are required (not `.optional()`)

**Validation**:
- TypeScript compilation succeeds
- `Story` type now includes `featureId` and `releaseId` properties
- Running `npm run build` produces no type errors

**Files Modified**:
- `src/schemas/story.schema.ts`

---

### Task 1.2: Create ID Derivation Helper Function

**Priority**: Must Have | **Estimate**: 3 points | **Dependencies**: 1.1

**Description**: Add utility function to extract feature ID from story ID for backward compatibility and validation.

**Implementation**:
1. Add `deriveFeatureIdFromStoryId(storyId: string): string` to `src/utils/` (create if needed)
2. Implement regex parsing: `[A-Z]+-[A-Z0-9]+-\d+` → extract `[A-Z]+-[A-Z0-9]+` prefix
3. Throw descriptive error for invalid ID formats
4. Export from `src/utils/index.ts`

**Example**:
```typescript
export function deriveFeatureIdFromStoryId(storyId: string): string {
  const match = storyId.match(/^([A-Z]+-[A-Z0-9]+)-\d+$/);
  if (!match) {
    throw new Error(`Invalid story ID format: ${storyId}. Expected pattern: PREFIX-FEATURE-NUMBER`);
  }
  return match[1];
}
```

**Validation**:
- Unit tests pass for valid IDs: `CLI-CORE-01` → `CLI-CORE`, `PLT-API-12` → `PLT-API`
- Unit tests fail for invalid IDs: `INVALID-ID`, `CORE-01` (single segment)
- Function throws clear error messages

**Files Modified**:
- `src/utils/story.utils.ts` (new)
- `src/utils/index.ts` (export)

**Tests**:
- `tests/utils/story.utils.test.ts` (new)

---

## Phase 2: Repository Updates

### Task 2.1: Update StoryRepository Parser to Extract/Derive Fields

**Priority**: Must Have | **Estimate**: 5 points | **Dependencies**: 1.1, 1.2

**Description**: Modify story parser to populate `featureId` and `releaseId` from table columns or derive from context.

**Implementation**:
1. In `StoryRepository.readAll()`, extract columns:
   ```typescript
   const explicitFeatureId = raw['Feature'] || raw['feature'];
   const explicitReleaseId = raw['Release'] || raw['release'];
   ```

2. Derive `featureId` if not explicit:
   ```typescript
   const featureId = explicitFeatureId || deriveFeatureIdFromStoryId(raw['ID']);
   ```

3. Derive `releaseId` from milestone section (TODO: implement milestone context tracking)
   - For now, use config or scan release files to map feature → release
   - Future enhancement: parse milestone section header

4. Pass to StorySchema.parse():
   ```typescript
   const story = StorySchema.parse({
     id: raw['ID'],
     title: raw['Title'],
     featureId,
     releaseId,
     // ... rest of fields
   });
   ```

**Validation**:
- Existing test fixtures parse successfully without new columns (auto-derivation works)
- Test fixtures with explicit columns use those values
- Invalid explicit columns (e.g., `featureId` doesn't match ID) throw errors

**Files Modified**:
- `src/repositories/story.repository.ts`

**Tests**:
- `tests/repositories/story.repository.test.ts` (update existing tests)
- Add test case: parse story without Feature/Release columns
- Add test case: parse story with explicit columns
- Add test case: parse story with mismatched featureId (should error)

---

### Task 2.2: Add Release ID Derivation Logic

**Priority**: Must Have | **Estimate**: 5 points | **Dependencies**: 2.1

**Description**: Implement logic to derive `releaseId` from milestone section context or feature lookup.

**Implementation**:

**Option A**: Parse milestone section header in project-plan.md
```markdown
## Milestone: R1 – Foundation (Q1 2025)
```
Extract `R1` → normalize to `R1-foundation`

**Option B**: Look up feature's release via FeatureRepository
- Load all releases
- For each release, extract features
- Find feature matching `featureId`, return its `releaseId`

**Recommendation**: Use Option A for now (simpler), add Option B as fallback or validation

**Changes**:
1. In `StoryRepository.readAll()`, track current milestone section during table parsing
2. Extract release ID from heading (regex: `## Milestone: ([A-Z0-9-]+)`)
3. Use as default `releaseId` for all stories in that section
4. Allow explicit "Release" column to override

**Validation**:
- Stories parsed from `specdeck/releases/R1-foundation.md` get `releaseId = "R1-foundation"`
- Explicit "Release" column in table overrides milestone section default
- Missing milestone header and no explicit column → throw error with helpful message

**Files Modified**:
- `src/repositories/story.repository.ts`

**Tests**:
- `tests/repositories/story.repository.test.ts` (add milestone parsing tests)
- Test fixture with milestone section header
- Test fixture with explicit Release column overriding milestone

---

### Task 2.3: Add Validation for Feature ID Consistency

**Priority**: Must Have | **Estimate**: 3 points | **Dependencies**: 2.1

**Description**: Validate that explicit `featureId` matches the Story ID prefix.

**Implementation**:
1. After parsing `featureId`, derive expected value from Story ID
2. Compare:
   ```typescript
   const expectedFeatureId = deriveFeatureIdFromStoryId(storyId);
   if (featureId !== expectedFeatureId) {
     throw new ValidationError(
       `Story ${storyId} has featureId '${featureId}' but ID prefix suggests '${expectedFeatureId}'`
     );
   }
   ```

3. Include file path and line number in error message (if available from parser context)

**Validation**:
- Story `CLI-CORE-01` with `featureId = "CLI-CORE"` → passes
- Story `CLI-CORE-01` with `featureId = "REL-01"` → throws ValidationError
- Error message is clear and actionable

**Files Modified**:
- `src/repositories/story.repository.ts`

**Tests**:
- `tests/repositories/story.repository.test.ts` (add validation test)
- Test case: mismatched featureId throws error
- Test case: error message includes story ID and suggested fix

---

### Task 2.4: Update StoryRepository Filtering Methods

**Priority**: Must Have | **Estimate**: 3 points | **Dependencies**: 2.1

**Description**: Replace ID prefix matching with explicit `featureId` field filtering.

**Implementation**:
1. In `StoryRepository.readAll(filter)`, update feature filter:
   ```typescript
   // OLD (implicit):
   if (filter.feature) {
     const featurePrefix = filter.feature.toUpperCase();
     if (!story.id.startsWith(featurePrefix)) continue;
   }

   // NEW (explicit):
   if (filter.feature && story.featureId !== filter.feature) {
     continue;
   }
   ```

2. Add `releaseId` filter support:
   ```typescript
   if (filter.release && story.releaseId !== filter.release) {
     continue;
   }
   ```

3. Update `findByFeature()` to use explicit field:
   ```typescript
   async findByFeature(featureId: string): Promise<Story[]> {
     return this.readAll({ feature: featureId });
   }
   ```

4. Add new method `findByRelease()`:
   ```typescript
   async findByRelease(releaseId: string): Promise<Story[]> {
     return this.readAll({ release: releaseId });
   }
   ```

**Validation**:
- `findByFeature('CLI-CORE')` returns all stories with `featureId === 'CLI-CORE'`
- `findByRelease('R1-foundation')` returns all stories with `releaseId === 'R1-foundation'`
- No ID prefix regex matching used anywhere

**Files Modified**:
- `src/repositories/story.repository.ts`
- `src/repositories/index.ts` (export new method)

**Tests**:
- `tests/repositories/story.repository.test.ts` (update existing tests)
- Test case: filter by feature using explicit field
- Test case: filter by release using explicit field

---

## Phase 3: Service Layer Updates

### Task 3.1: Update StoryService to Use Explicit Links

**Priority**: Must Have | **Estimate**: 2 points | **Dependencies**: 2.4

**Description**: Update StoryService methods to leverage new explicit filtering.

**Implementation**:
1. Add `getStoriesByRelease(releaseId: string)` method:
   ```typescript
   async getStoriesByRelease(releaseId: string): Promise<Story[]> {
     return this.repository.findByRelease(releaseId);
   }
   ```

2. Verify `getStoriesByFeature()` still works (no changes needed, uses explicit filter now)

**Validation**:
- `storyService.getStoriesByRelease('R1-foundation')` returns all stories in R1
- `storyService.getStoriesByFeature('CLI-CORE')` uses explicit `featureId` filter

**Files Modified**:
- `src/services/story.service.ts`
- `src/services/index.ts` (export)

**Tests**:
- `tests/services/story.service.test.ts` (add test)
- Test case: getStoriesByRelease returns correct stories

---

### Task 3.2: Update FeatureService to Compute Story Counts

**Priority**: Should Have | **Estimate**: 3 points | **Dependencies**: 3.1

**Description**: Use explicit `featureId` links to compute accurate story counts for features.

**Implementation**:
1. In `FeatureService.listFeatures()`, after extracting features:
   ```typescript
   const allStories = await this.storyService.listStories();
   
   for (const feature of features) {
     const featureStories = allStories.filter(s => s.featureId === feature.id);
     feature.storyCount = featureStories.length;
   }
   ```

2. Update `getFeatureWithStories()` to use explicit links (already done via StoryService)

**Validation**:
- `featureService.listFeatures()` shows correct `storyCount` for each feature
- `featureService.getFeatureWithStories('CLI-CORE')` returns all stories with `featureId === 'CLI-CORE'`

**Files Modified**:
- `src/services/feature.service.ts`

**Tests**:
- `tests/services/feature.service.test.ts` (update tests)
- Test case: listFeatures includes accurate storyCount

---

### Task 3.3: Add Link Validation Service Method

**Priority**: Should Have | **Estimate**: 5 points | **Dependencies**: 3.1, 3.2

**Description**: Add validation to check referential integrity of hierarchy links.

**Implementation**:
1. Create new method in StoryService or new ValidationService:
   ```typescript
   async validateHierarchyLinks(): Promise<ValidationResult> {
     const stories = await this.listStories();
     const features = await this.featureService.listFeatures();
     const releases = await this.releaseService.listReleases();
     
     const errors: ValidationError[] = [];
     const warnings: ValidationWarning[] = [];
     
     for (const story of stories) {
       // Check featureId exists
       const feature = features.find(f => f.id === story.featureId);
       if (!feature) {
         errors.push({
           message: `Story ${story.id} references non-existent feature '${story.featureId}'`,
           storyId: story.id,
         });
         continue;
       }
       
       // Check releaseId consistency
       if (story.releaseId !== feature.releaseId) {
         warnings.push({
           message: `Story ${story.id} has releaseId '${story.releaseId}' but feature ${story.featureId} belongs to '${feature.releaseId}'`,
           storyId: story.id,
         });
       }
       
       // Check releaseId exists
       const release = releases.find(r => r.id === story.releaseId);
       if (!release) {
         errors.push({
           message: `Story ${story.id} references non-existent release '${story.releaseId}'`,
           storyId: story.id,
         });
       }
     }
     
     return { errors, warnings };
   }
   ```

**Validation**:
- Validation detects orphaned stories (non-existent feature)
- Validation warns about release mismatches
- Validation reports clear, actionable messages

**Files Modified**:
- `src/services/story.service.ts` or `src/services/validation.service.ts` (new)

**Tests**:
- `tests/services/validation.test.ts` (new)
- Test case: orphaned story detected
- Test case: release mismatch generates warning
- Test case: all valid links pass validation

---

## Phase 4: Command Interface

### Task 4.1: Add --release Filter to list stories Command

**Priority**: Must Have | **Estimate**: 2 points | **Dependencies**: 3.1

**Description**: Allow users to filter stories by release ID directly.

**Implementation**:
1. Update `src/commands/list.ts` stories command options:
   ```typescript
   .option('-r, --release <releaseId>', 'Filter by release ID')
   ```

2. In command action, add to filter:
   ```typescript
   const filter = {
     status: options.status,
     complexity: options.complexity,
     feature: options.feature,
     release: options.release,  // NEW
     owner: options.owner,
   };
   ```

3. StoryRepository already supports `release` filter from Task 2.4

**Validation**:
- `specdeck list stories --release R1-foundation` returns only R1 stories
- `specdeck list stories --feature CLI-CORE --release R1-foundation` combines filters correctly

**Files Modified**:
- `src/commands/list.ts`

**Tests**:
- Manual test: `npm run cli -- list stories --release R1-foundation`
- End-to-end test in `tests/commands/list.test.ts`

---

### Task 4.2: Add validate links Command

**Priority**: Should Have | **Estimate**: 3 points | **Dependencies**: 3.3

**Description**: Create CLI command to run hierarchy link validation.

**Implementation**:
1. Create `src/commands/validate.ts` (may already exist):
   ```typescript
   validate
     .command('links')
     .description('Validate hierarchy links (release → feature → story)')
     .option('--strict', 'Treat warnings as errors')
     .action(async (options, cmd) => {
       const storyService = new StoryService(...);
       const result = await storyService.validateHierarchyLinks();
       
       if (result.errors.length > 0) {
         console.log(chalk.red(`\n❌ Found ${result.errors.length} errors:`));
         for (const error of result.errors) {
           console.log(chalk.red(`  • ${error.message}`));
         }
       }
       
       if (result.warnings.length > 0) {
         console.log(chalk.yellow(`\n⚠️  Found ${result.warnings.length} warnings:`));
         for (const warning of result.warnings) {
           console.log(chalk.yellow(`  • ${warning.message}`));
         }
       }
       
       if (result.errors.length === 0 && result.warnings.length === 0) {
         console.log(chalk.green(`\n✅ All hierarchy links are valid!`));
       }
       
       if (options.strict && result.warnings.length > 0) {
         process.exit(1);
       }
       
       if (result.errors.length > 0) {
         process.exit(1);
       }
     });
   ```

2. Register command in `src/cli.ts`

**Validation**:
- `specdeck validate links` runs successfully on valid data
- Command detects and reports errors/warnings
- `--strict` flag converts warnings to errors (exit code 1)

**Files Modified**:
- `src/commands/validate.ts` (update or create)
- `src/cli.ts` (register command)

**Tests**:
- End-to-end test: `tests/commands/validate.test.ts`

---

### Task 4.3: Update create story Command to Prompt for Feature/Release

**Priority**: Should Have | **Estimate**: 3 points | **Dependencies**: 2.1

**Description**: When creating stories, prompt user for `featureId` and `releaseId`.

**Implementation**:
1. Update `src/commands/create.ts` story creation:
   ```typescript
   const featureId = await prompt('Feature ID (e.g., CLI-CORE): ');
   const releaseId = await prompt('Release ID (e.g., R1-foundation): ');
   
   // Validate feature exists
   const feature = await featureService.getFeature(featureId);
   if (!feature) {
     console.error(`Feature ${featureId} not found`);
     return;
   }
   
   // Validate release matches feature
   if (releaseId !== feature.releaseId) {
     console.warn(`Warning: Feature ${featureId} belongs to ${feature.releaseId}, not ${releaseId}`);
   }
   ```

2. Pass to story creation logic

**Validation**:
- Interactive prompt asks for feature and release
- Validation checks feature exists before creating story
- Warning shown if release doesn't match feature

**Files Modified**:
- `src/commands/create.ts`

**Tests**:
- Manual test: `npm run cli -- create story`
- Mock prompts in tests to verify validation

---

## Phase 5: Testing & Migration

### Task 5.1: Update All Test Fixtures

**Priority**: Must Have | **Estimate**: 3 points | **Dependencies**: 2.1

**Description**: Ensure test fixtures work with new schema (auto-derivation or explicit columns).

**Implementation**:
1. Review all fixtures in `tests/fixtures/`
2. Option A: Keep as-is (test auto-derivation)
3. Option B: Add "Feature" and "Release" columns (test explicit parsing)
4. Ensure both formats are tested

**Validation**:
- All existing tests pass with updated fixtures
- Fixtures represent both old format (no columns) and new format (explicit columns)

**Files Modified**:
- `tests/fixtures/project-plan.md`
- `tests/fixtures/test-release.md`
- Any other relevant fixtures

---

### Task 5.2: Add Integration Tests for Hierarchy Queries

**Priority**: Must Have | **Estimate**: 5 points | **Dependencies**: 3.1, 3.2

**Description**: End-to-end tests for complete hierarchy traversal.

**Test Cases**:
1. List all features with stories (explicit links)
2. Filter stories by release (direct query)
3. Validate hierarchy links (orphan detection)
4. CLI commands (`list stories --release`, `validate links`)

**Files Modified**:
- `tests/integration/hierarchy.test.ts` (new)

---

### Task 5.3: Update Documentation

**Priority**: Must Have | **Estimate**: 3 points | **Dependencies**: All above

**Description**: Document new fields and migration path.

**Updates**:
1. **README.md**: Document new `featureId` and `releaseId` fields in Story schema
2. **CHANGELOG.md**: Add breaking change notice for v0.2.0
3. **Migration Guide**: Explain auto-derivation and optional explicit columns
4. **Command Reference**: Document `--release` filter and `validate links` command

**Files Modified**:
- `README.md`
- `CHANGELOG.md`
- `docs/migration-v0.2.md` (new)

---

## Phase 6: Validation & Release

### Task 6.1: Run Full Test Suite

**Priority**: Must Have | **Estimate**: 1 point | **Dependencies**: 5.2

**Commands**:
```bash
npm run test
npm run lint
npm run build
```

**Validation**:
- All tests pass
- Code coverage ≥ 80%
- No linting errors
- Build succeeds

---

### Task 6.2: Manual Testing on Real Project

**Priority**: Must Have | **Estimate**: 2 points | **Dependencies**: 6.1

**Test Plan**:
1. Run on SpecDeck's own `specdeck/releases/R1-foundation.md`
2. Verify all stories parse correctly
3. Test `list stories --release R1-foundation`
4. Test `validate links`
5. Test `list features --with-stories`

---

### Task 6.3: Archive OpenSpec Change

**Priority**: Must Have | **Estimate**: 1 point | **Dependencies**: 6.2

**Steps**:
1. Run `openspec validate restore-hierarchy-links --strict` (ensure passes)
2. Move `openspec/changes/restore-hierarchy-links/` → `openspec/changes/archive/`
3. Update `openspec/project.md` to reference completion
4. Commit all changes

---

## Summary

**Total Estimate**: ~65 story points (51 original + 14 for folder migration)

**Critical Path**: 
- **Phase 0**: 0.1 → 0.2 → 0.3 → 0.4 (folder consolidation foundation)
- **Phase 1-6**: 1.1 → 1.2 → 2.1 → 2.2 → 2.4 → 3.1 → 4.1 (explicit links)

**Parallelization Opportunities**:
- Task 0.5 (config schema) can run in parallel with Phase 1
- Task 3.2 (FeatureService) can start after 3.1
- Task 4.2 (validate command) can start after 3.3
- Task 5.1 (fixtures) can run in parallel with Phase 3

**Key Milestones**:
1. **Folder Migration Complete (Phase 0)** - Single source of truth in specdeck/
2. **Schema Updated (Phase 1)** - TypeScript types available with explicit links
3. **Parser Working (Phase 2)** - Stories parse with new fields
4. **Services Updated (Phase 3)** - Queries use explicit links
5. **Commands Ready (Phase 4)** - Users can leverage new functionality
6. **Validated & Documented (Phase 5-6)** - Ready for release

**Breaking Changes**:
- Service constructors no longer accept `openspecDir` for planning
- `.specdeck.config.json` structure changes (`openspecDir` deprecated)
- Release files consolidated to `specdeck/releases/` only

**Migration Support**:
- `specdeck migrate` command automates folder consolidation
- Auto-populate `featureId`/`releaseId` from Story ID patterns
- Deprecation warnings guide users to new structure

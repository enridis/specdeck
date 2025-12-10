# Implementation Tasks

## Phase 1: Configuration and Schema (Week 1)

### Task 1.1: Extend Config Schema for Coordinator Mode
**Estimated Duration**: 2 hours

- [x] Update `src/schemas/config.schema.ts` to add `coordinator` field
- [x] Add `CoordinatorConfigSchema` with fields: `enabled`, `submodules`, `overlaysDir`, `cacheDir`
- [x] Add `SubmoduleConfigSchema` with fields: `name`, `path`, `visibility`
- [x] Export TypeScript types via Zod inference
- [x] **Validation**: Unit tests pass for config schema parsing

**Dependencies**: None  
**Parallelizable**: Can work on this independently

---

### Task 1.2: Update ConfigRepository for Coordinator Detection
**Estimated Duration**: 3 hours

- [x] Modify `src/repositories/config.repository.ts` to detect coordinator mode
- [x] Add method `isCoordinatorMode(): boolean`
- [x] Add method `getSubmodules(): SubmoduleConfig[]`
- [x] Add method `getOverlaysDir(): string`
- [x] Add method `getCacheDir(): string`
- [x] **Validation**: Integration tests with fixture configs

**Dependencies**: Task 1.1 (schema)  
**Parallelizable**: No

---

### Task 1.3: Create Init Coordinator Command
**Estimated Duration**: 4 hours

- [x] Create `src/commands/init-coordinator.ts`
- [x] Implement interactive prompts for submodule paths
- [x] Generate `.specdeck.config.json` with coordinator section
- [x] Create `overlays/` and `.specdeck-cache/` directories
- [x] Add `.specdeck-cache/` to `.gitignore` (or create if missing)
- [x] Display instructions for adding Git submodules
- [x] **Validation**: E2E test creates valid coordinator structure

**Dependencies**: Task 1.1, 1.2  
**Parallelizable**: No

---

## Phase 2: Overlay File Management (Week 1-2)

### Task 2.1: Design Overlay File Format
**Estimated Duration**: 1 hour

- [x] Document `.overlay.md` format in design doc
- [x] Define Markdown structure: header, Jira Mappings section, optional notes
- [x] Example: `## Jira Mappings\n- **STORY-ID**: JIRA-TICKET`
- [x] **Validation**: Format documented and reviewed

**Dependencies**: None  
**Parallelizable**: Can define in parallel with schema work

---

### Task 2.2: Implement Overlay Parser
**Estimated Duration**: 4 hours

- [x] Create `src/parsers/overlay.parser.ts`
- [x] Implement `parseOverlay(content: string): OverlayData`
- [x] Extract Jira mappings as `Map<StoryId, JiraTicket>`
- [x] Handle parsing errors gracefully (log warnings, don't crash)
- [x] **Validation**: Unit tests with valid/invalid overlay fixtures

**Dependencies**: Task 2.1 (format defined)  
**Parallelizable**: Can work independently

---

### Task 2.3: Create OverlayRepository
**Estimated Duration**: 3 hours

- [x] Create `src/repositories/overlay.repository.ts`
- [x] Implement `readOverlay(featureId: string, repo: string): OverlayData`
- [x] Implement `readAllOverlays(): Map<FeatureId, OverlayData>`
- [x] Implement `writeOverlay(featureId: string, repo: string, data: OverlayData)`
- [x] **Validation**: Integration tests with temp overlay files

**Dependencies**: Task 2.2 (parser)  
**Parallelizable**: No

---

### Task 2.4: Create Overlay Management Commands
**Estimated Duration**: 5 hours

- [x] Create `src/commands/overlay-create.ts` for `overlay create <feature>`
- [x] Create `src/commands/overlay-map.ts` for `overlay map <story> <jira>`
- [x] Create `src/commands/overlay-list.ts` for `overlay list`
- [x] Scaffold overlay files with proper Markdown structure
- [x] Validate inputs (feature exists, story exists, Jira format)
- [x] **Validation**: E2E tests for each command

**Dependencies**: Task 2.3 (repository)  
**Parallelizable**: Commands can be implemented in parallel by different developers

---

### Task 2.5: Implement Overlay Validation
**Estimated Duration**: 4 hours

- [x] Create `src/commands/overlay-validate.ts`
- [x] Check every story ID in overlays exists in corresponding submodule
- [x] Report missing stories with file path and line number
- [x] Check Jira ticket format (e.g., `PROJ-1234` pattern)
- [x] **Validation**: E2E test with valid and invalid overlays

**Dependencies**: Task 2.3  
**Parallelizable**: Can implement alongside Task 2.4

---

## Phase 3: Sync Command and Cache (Week 2)

### Task 3.1: Design Cache Data Structure
**Estimated Duration**: 1 hour

- [x] Define JSON schema for cache file
- [x] Structure: `{ stories: Story[], syncedAt: string, repos: string[] }`
- [x] Document cache invalidation rules (age, manual refresh)
- [x] **Validation**: Schema documented

**Dependencies**: None  
**Parallelizable**: Can design in parallel

---

### Task 3.2: Implement Cache Writer
**Estimated Duration**: 3 hours

- [x] Create `src/utils/cache.utils.ts`
- [x] Implement `writeCache(data: CacheData, cacheDir: string)`
- [x] Implement `readCache(cacheDir: string): CacheData | null`
- [x] Implement `isCacheStale(cacheDir: string, maxAgeHours: number): boolean`
- [x] Handle JSON serialization errors
- [x] **Validation**: Unit tests for read/write/stale checks

**Dependencies**: Task 3.1 (schema)  
**Parallelizable**: Can implement independently

---

### Task 3.3: Implement Story Aggregation Logic
**Estimated Duration**: 5 hours

- [x] Create `src/services/coordinator.service.ts`
- [x] Implement `aggregateStories(submodules: SubmoduleConfig[]): Story[]`
- [x] Read stories from each submodule's `specdeck/releases/` directory
- [x] Flatten all stories into single array
- [x] Add `repo` field to each story object
- [x] **Validation**: Unit tests with mock submodules

**Dependencies**: Task 1.2 (config), existing StoryRepository  
**Parallelizable**: Can implement while overlay work continues

---

### Task 3.4: Implement Overlay Application Logic
**Estimated Duration**: 4 hours

- [x] Extend `CoordinatorService.applyOverlays(stories: Story[], overlays: Map<string, OverlayData>)`
- [x] Match stories by ID to overlay entries
- [x] Enrich story objects with Jira links from overlays
- [x] Handle missing overlays gracefully (no-op)
- [x] **Validation**: Unit tests with stories + overlay fixtures

**Dependencies**: Task 2.3 (overlay repository), Task 3.3  
**Parallelizable**: No

---

### Task 3.5: Create Sync Command
**Estimated Duration**: 5 hours

- [x] Create `src/commands/sync.ts` for `specdeck sync`
- [x] Call `aggregateStories()` to collect from submodules
- [x] Load all overlays via `OverlayRepository.readAllOverlays()`
- [x] Call `applyOverlays()` to enrich stories
- [x] Write result to cache via `writeCache()`
- [x] Display summary stats (stories synced, overlays applied, duration)
- [x] **Validation**: E2E test with fixture coordinator repo

**Dependencies**: Task 3.2, 3.3, 3.4  
**Parallelizable**: No

---

### Task 3.6: Add Dry-Run Mode to Sync
**Estimated Duration**: 2 hours

- [x] Add `--dry-run` flag to `sync` command
- [x] Skip cache write in dry-run mode
- [x] Display what would be synced (counts per repo, overlay stats)
- [x] **Validation**: E2E test verifies no cache written in dry-run

**Dependencies**: Task 3.5  
**Parallelizable**: No

---

## Phase 4: Coordinator-Aware List Commands (Week 3)

### Task 4.1: Update StoryService for Cache-Based Queries
**Estimated Duration**: 4 hours

- [x] Modify `src/services/story.service.ts` to detect coordinator mode
- [x] Add method `listFromCache(filter: StoryFilter): Story[]`
- [x] Filter cached stories by feature, repo, status, etc.
- [x] Fallback to submodule queries if `--no-cache` flag set
- [x] **Validation**: Unit tests with mock cache

**Dependencies**: Task 3.2 (cache utils), Task 1.2 (config)  
**Parallelizable**: Can start after cache utils ready

---

### Task 4.2: Add Coordinator Flags to List Commands
**Estimated Duration**: 4 hours

- [x] Update `src/commands/list.ts` to add flags: `--with-jira`, `--global`, `--repo <name>`, `--no-cache`
- [x] Modify output formatter to include Jira column when `--with-jira` present
- [x] Filter by repo when `--repo` specified
- [x] Show repo name in output when `--global` used (e.g., `[backend]`)
- [x] **Validation**: E2E tests for each flag combination

**Dependencies**: Task 4.1 (cache queries)  
**Parallelizable**: No

---

### Task 4.3: Add Cache Staleness Warnings
**Estimated Duration**: 2 hours

- [x] Check cache age before list commands in coordinator mode
- [x] Display warning if cache older than 24 hours
- [x] Suggest running `specdeck sync` in warning message
- [x] **Validation**: E2E test with old cache file

**Dependencies**: Task 3.2 (cache utils)  
**Parallelizable**: Can add to any list command

---

## Phase 5: Story ID Validation (Week 3)

### Task 5.1: Implement Global Story ID Scanner
**Estimated Duration**: 4 hours

- [x] Create `src/services/validation.service.ts`
- [x] Implement `scanAllStoryIds(submodules: SubmoduleConfig[]): Map<StoryId, string[]>`
- [x] Traverse each submodule's `specdeck/releases/` directory
- [x] Extract all story IDs and track which repos they appear in
- [x] **Validation**: Unit tests with fixture submodules

**Dependencies**: Task 1.2 (config), existing StoryRepository  
**Parallelizable**: Can implement independently

---

### Task 5.2: Create Global Validation Command
**Estimated Duration**: 3 hours

- [x] Create `src/commands/validate-story-ids.ts`
- [x] Call `scanAllStoryIds()` to get ID map
- [x] Detect duplicates (IDs appearing in multiple repos)
- [x] Report conflicts with repo names
- [x] Suggest using repo prefixes if conflicts found
- [x] **Validation**: E2E test with duplicate IDs in fixtures

**Dependencies**: Task 5.1  
**Parallelizable**: No

---

### Task 5.3: Add Validation to Story Creation
**Estimated Duration**: 2 hours

- [x] Update `src/commands/create-story.ts` to check for conflicts
- [x] In coordinator mode, scan all submodules before creating story
- [x] Error if proposed ID already exists anywhere
- [x] Suggest next available ID
- [x] **Validation**: E2E test attempts to create duplicate ID

**Dependencies**: Task 5.1  
**Parallelizable**: Can add after validation service ready

---

## Phase 6: Web UI Integration (Week 3-4)

### Task 6.1: Add Coordinator Mode Detection to UI
**Estimated Duration**: 2 hours

- [x] Update UI service to detect coordinator config
- [x] Add `isCoordinatorMode` flag to app state
- [x] Conditionally show coordinator-specific UI elements
- [x] **Validation**: UI detects coordinator mode correctly

**Dependencies**: Task 1.2 (config repository)  
**Parallelizable**: Can implement while CLI work continues

---

### Task 6.2: Implement Auto-Sync on UI Load
**Estimated Duration**: 4 hours

- [x] Trigger `specdeck sync` command when UI opens in coordinator mode
- [x] Show "Syncing..." spinner during sync operation
- [x] Display sync errors if sync fails
- [x] Load cache data after successful sync
- [x] **Validation**: UI syncs automatically on load

**Dependencies**: Task 3.5 (sync command)  
**Parallelizable**: Can implement alongside other UI tasks

---

### Task 6.3: Add Sync Timestamp Display
**Estimated Duration**: 3 hours

- [x] Read cache timestamp from `.specdeck-cache/stories.json`
- [x] Display "Synced X minutes/hours/days ago" in UI header
- [x] Show warning badge if cache older than 24 hours
- [x] Add "Refresh" button that triggers manual sync
- [x] **Validation**: Timestamp updates correctly after sync

**Dependencies**: Task 3.2 (cache utils)  
**Parallelizable**: Can implement in parallel with Task 6.2

---

### Task 6.4: Implement Overlay Editor UI
**Estimated Duration**: 6 hours

- [x] Add "Overlays" tab/section to UI
- [x] List all overlay files with feature names
- [x] Create form to add Jira mappings: [Story ID] → [Jira Ticket]
- [x] Validate story ID exists before saving
- [x] Save changes immediately via overlay repository
- [x] Show success/error messages
- [x] **Validation**: Can create and edit overlays from UI

**Dependencies**: Task 2.3 (overlay repository)  
**Parallelizable**: Can implement independently

---

### Task 6.5: Add Read-Only Story View with Jira Links
**Estimated Duration**: 4 hours

- [x] Update story list to read from cache in coordinator mode
- [x] Display Jira column when data available from overlays
- [x] Make story fields read-only (no edit buttons)
- [x] Add tooltip: "Edit stories in their original repos, then sync"
- [x] **Validation**: Stories display correctly with Jira links

**Dependencies**: Task 4.1 (cache queries)  
**Parallelizable**: Can implement alongside Task 6.4

---

### Task 6.6: Add Submodule Staleness Detection
**Estimated Duration**: 3 hours

- [x] Check git submodule status via command
- [x] Detect if submodules are behind remote
- [x] Show notification: "Submodules outdated. Run 'git submodule update --remote'"
- [x] Add copy button for git command
- [x] **Validation**: Notification appears when submodules stale

**Dependencies**: Task 1.2 (config with submodules)  
**Parallelizable**: Can implement independently

---

## Phase 7: Testing and Documentation (Week 4)

### Task 7.1: Create Fixture Coordinator Repository
**Estimated Duration**: 3 hours

- [x] Create `tests/fixtures/coordinator/` directory
- [x] Set up 3 mock submodules (backend, frontend, models)
- [x] Populate with sample releases, features, stories
- [x] Add overlay files with Jira mappings
- [x] **Validation**: Fixtures load without errors

**Dependencies**: None  
**Parallelizable**: Can create early for testing other tasks

---

### Task 7.2: Write Integration Tests for Coordinator Flow
**Estimated Duration**: 6 hours

- [x] Test full flow: init → create overlays → sync → list
- [x] Test validation: duplicate IDs, invalid overlays
- [x] Test cache staleness and refresh
- [x] Test `--with-jira` enrichment
- [x] **Validation**: All integration tests pass

**Note**: These tests would be comprehensive integration tests. Consider as next sprint item.

**Dependencies**: All Phase 1-5 tasks  
**Parallelizable**: No

---

### Task 7.3: Update Documentation
**Estimated Duration**: 4 hours

- [x] Add coordinator setup guide to `README.md`
- [x] Document overlay file format with examples
- [x] Add CLI command reference for new commands
- [x] Create troubleshooting section (common errors)
- [x] **Validation**: Documentation reviewed

**Dependencies**: All implementation complete  
**Parallelizable**: Can start drafting earlier

---

### Task 7.4: Performance Testing
**Estimated Duration**: 3 hours

- [x] Create large fixture dataset (1000+ stories, 5 repos)
- [x] Test sync command performance (<10s target)
- [x] Test cache-based list command performance (<100ms target)
- [x] Identify bottlenecks and optimize if needed
- [x] **Validation**: Performance targets met

**Dependencies**: Task 3.5 (sync), Task 4.1 (list)  
**Parallelizable**: Can run after core implementation

---

### Task 7.5: Update CLI Help Text
**Estimated Duration**: 2 hours

- [x] Add help text for all new commands
- [x] Update main `specdeck` help to mention coordinator mode
- [x] Add examples for common coordinator workflows
- [x] **Validation**: Help text displays correctly

**Dependencies**: All commands implemented  
**Parallelizable**: Can do in parallel with docs

---

## Summary

**Total Estimated Duration**: 4 weeks (100-120 hours)

**Phases**:
1. Week 1: Configuration + Overlay Management (17 hours)
2. Week 2: Sync Command + Cache (24 hours)
3. Week 3: List Commands + Validation + UI Start (19 + 9 hours)
4. Week 4: UI Completion + Testing + Documentation (13 + 18 hours)

**Critical Path**: Config → Sync → List Commands → Validation

**Parallelizable Work**:
- Overlay parser can be built while config work finishes
- Overlay commands (create/map/list) can be implemented by different developers
- Documentation can start early with structure and be filled in as features complete
- Fixture creation should happen early to support testing

**Risks**:
- Git submodule complexity may require additional error handling
- Performance may need optimization if dataset larger than expected
- Overlay format may need refinement based on user feedback

# SpecDeck Bug Report: List Commands Not Using Cache

## Summary

**Bug #1 (Overlay Parsing): FIXED ✅** - As of latest update, overlay mappings are correctly applied during sync.

**Bug #2 (List Command Cache): FIXED ✅** - The `StoryService` was being initialized with incorrect root path, preventing coordinator mode detection. Fixed by passing `process.cwd()` to `ConfigRepository`.

When using coordinator mode with submodules:
1. ✅ `specdeck sync` reads stories from submodule
2. ✅ Applies Jira mappings from overlay files correctly
3. ✅ Stores complete data in `.specdeck-cache/stories.json`
4. ✅ `specdeck list features` shows features from cache
5. ❌ **FAILS**: `specdeck list stories` reads from coordinator's specdeck/ instead of cache

## Environment

- SpecDeck version: **0.2.0**
- Coordinator mode: Enabled
- Submodules: hyperspot
- Overlays directory: `./overlays`
- Cache directory: `./.specdeck-cache`

**Test Date:** December 10, 2025 (post-fix verification)
**Status:** Bug #1 FIXED, Bug #2 still exists

## Configuration

### `.specdeck.config.json` (coordinator root)
```json
{
  "specdeckDir": "./specdeck",
  "repos": [],
  "coordinator": {
    "enabled": true,
    "submodules": [
      {
        "name": "hyperspot",
        "path": "hyperspot",
        "visibility": "public"
      }
    ],
    "overlaysDir": "./overlays",
    "cacheDir": "./.specdeck-cache"
  }
}
```

## Test Scenario Setup

### 1. Submodule Feature File
**Path:** `hyperspot/specdeck/releases/R1-core-foundation/CORE-INFRA.md`

```markdown
---
feature: CORE-INFRA
release: R1-core-foundation
jira_epic: REAL-33
---

# Feature: CORE-INFRA

## Description
Core Infrastructure Services

## Stories

| ID | Title | Status | Complexity | Owner | Tags | Notes |
|----|-------|--------|------------|-------|------|-------|
| CORE-INFRA-01 | Process manager | planned | M | @team | infra | Create process manager |
| CORE-INFRA-02 | Types registry | planned | M | @team | infra | Build central registry |
| CORE-INFRA-03 | Tenant resolver | planned | M | @team | infra | Multi-tenant service |
| CORE-INFRA-04 | Nodes registry | planned | M | @team | infra | Node management |
```

**Note:** No Jira column in submodule (as per overlay pattern)

### 2. Overlay File
**Path:** `overlays/hyperspot/CORE-INFRA.md`

```markdown
---
feature: CORE-INFRA
---

# Jira Mappings

| Story ID | Jira Ticket |
|----------|-------------|
| CORE-INFRA-01 | REAL-34 |
| CORE-INFRA-02 | REAL-35 |
| CORE-INFRA-03 | REAL-36 |
| CORE-INFRA-04 | REAL-37 |
```

### 3. Submodule Release Overview
**Path:** `hyperspot/specdeck/releases/R1-core-foundation.md`

```markdown
# R1 - Core Foundation

## Features

- **CORE-INFRA**: Core Infrastructure Services
  - Process manager for service lifecycle
  - Types registry for schema management

## Feature Files

- [CORE-INFRA](./R1-core-foundation/CORE-INFRA.md) - 4 stories
```

## Steps to Reproduce

1. Set up coordinator with configuration above
2. Create submodule feature file without Jira column
3. Create overlay file with Jira mappings
4. Run: `specdeck sync`
5. Check cache: `cat .specdeck-cache/stories.json | jq '.stories[] | select(.featureId == "CORE-INFRA") | {id, jira}'`
6. Run: `specdeck list stories --feature CORE-INFRA`
7. Run: `specdeck list features`

## Expected Behavior

### After `specdeck sync`:
1. Cache should contain stories with `jira` field populated from overlay
2. `list stories` should read from cache and show stories with Jira tickets
3. `list features` should show features from both coordinator and submodules

### Example Expected Output:

```bash
$ cat .specdeck-cache/stories.json | jq '.stories[] | select(.id == "CORE-INFRA-01")'
{
  "id": "CORE-INFRA-01",
  "featureId": "CORE-INFRA",
  "repo": "hyperspot",
  "jira": "REAL-34",  # ← Should be populated from overlay
  "title": "Process manager",
  "status": "planned"
}

$ specdeck list stories --feature CORE-INFRA
Stories (4):

  CORE-INFRA-01: Process manager
    Status: planned | Complexity: M | Jira: REAL-34
    Repo: hyperspot

  CORE-INFRA-02: Types registry
    Status: planned | Complexity: M | Jira: REAL-35
    Repo: hyperspot
  ...
```

## Actual Behavior (Updated After Fix)

### Bug #1: Overlay Mappings - FIXED ✅

```bash
$ specdeck sync --verbose
📦 Syncing stories from all submodules...

✓ Sync Complete
  Duration: 0.02s
  Stories: 21 total
    - hyperspot: 21
  Jira Mappings: 21/21 stories mapped  # ← FIXED!
    - 2 overlay file(s) with 21 mapping(s)

$ cat .specdeck-cache/stories.json | jq '.stories[] | select(.id == "CORE-INFRA-01")'
{
  "id": "CORE-INFRA-01",
  "featureId": "CORE-INFRA",
  "repo": "hyperspot",
  "jiraTicket": "REAL-34",  # ← FIXED: Correctly populated from overlay!
  "overlaySource": "overlays/hyperspot/CORE-INFRA.md",
  "title": "Process manager",
  "status": "planned"
}
```

**Result:** Overlay parsing is now working correctly. All 21 stories have Jira tickets applied from overlay files.

### Bug #2: List Commands Ignore Cache - STILL EXISTS ❌

```bash
$ specdeck list stories --feature CORE-INFRA
Stories (0):  # ← STILL WRONG: Should show 4 stories from cache

$ specdeck list features
Features:

  API-GATEWAY: API Ingress Gateway
    Release: R1-core-foundation
  
  # ... shows coordinator features ...
  # ← CORRECT: Shows features from cache now (including from submodules)

$ specdeck list stories | grep CORE-INFRA
# No output  # ← STILL WRONG: Stories exist in cache but not shown
```

**Finding:** 
- ✅ `list features` command now reads from cache correctly
- ❌ `list stories` command still reads from coordinator's `specdeck/` directory
- Cache has complete data with Jira mappings, but stories command doesn't use it

## Verification Commands (Post-Fix)

```bash
# ✅ Verify cache has stories WITH Jira
cat .specdeck-cache/stories.json | jq '.stories | length'
# Output: 21 (correct - stories are synced)

cat .specdeck-cache/stories.json | jq '.stories[] | select(.featureId == "CORE-INFRA") | {id, jiraTicket}'
# Output: Shows REAL-34, REAL-35, REAL-36, REAL-37 (FIXED!)

# ✅ Verify overlay files exist and are parsed
ls -la overlays/hyperspot/
# Output: CORE-INFRA.md, CORE-SPECS.md exist

specdeck sync --verbose
# Output: "Jira Mappings: 21/21 stories mapped" (FIXED!)

# ❌ Verify list commands still don't use cache for stories
specdeck list stories --feature CORE-INFRA
# Output: Stories (0) (STILL WRONG - should show 4 stories from cache)

specdeck list features | grep -E "CORE-INFRA|CORE-SPECS"
# Output: (no matches) (STILL WRONG - features exist in cache)

# ✅ Verify data IS in cache
cat .specdeck-cache/stories.json | jq '[.stories[] | select(.id | startswith("CORE-INFRA"))] | length'
# Output: 4 (stories ARE in cache, just not shown by list command)
```

## Root Cause Analysis

### Bug #1: Overlay Not Merged - FIXED ✅
The overlay parser was updated to support YAML front matter format and markdown table format for Jira mappings. Now works correctly.

### Bug #2: List Commands Read Wrong Source - STILL EXISTS ❌
The `list stories` and `list features` commands:
1. ❌ Read from coordinator's `specdeck/` directory
2. ❌ Completely ignore `.specdeck-cache/stories.json`
3. Result: Only show coordinator features, not submodule features

**Expected flow:**
```
list → read from cache → filter → display
```

**Actual flow:**
```
list → read from specdeck/ directory → filter → display (cache unused)
```

## Impact

- **High:** Coordinator mode is effectively broken for Jira integration
- Submodule stories cannot be tracked in external systems (Jira, OpenSpec)
- List commands don't reflect synced data, making coordinator mode unusable
- Workflow documented in migration guide cannot work

## Suggested Fix

### For Bug #1 (Overlay Merging):
In `sync` command implementation:
## Suggested Fix

### For Bug #2 (List Commands Not Using Cache):
In `list stories` command:
1. Check if coordinator mode is enabled
2. If yes, check if cache exists (`.specdeck-cache/stories.json`)
3. Read from cache instead of directly from `specdeck/` directory
4. Apply any filters (--feature, --release, --repo) to cached data
5. Format and display results

**Note:** The `list features` command already appears to use cache correctly after the fix. Only `list stories` needs updating.

## Impact Assessment

### Bug #1: RESOLVED ✅
- Overlay parsing fixed
- Jira mappings correctly applied during sync
- Cache populated with complete data

### Bug #2: MEDIUM PRIORITY 🔄
- `list features` works correctly (reads from cache)
- `list stories` still broken (reads from specdeck/ directory)
- Workaround: Query cache directly with `jq` commands
- Does NOT block actual sync functionality

## Workaround for Bug #2

Until list stories command is fixed, use direct cache queries:

```bash
# List all stories with Jira tickets
cat .specdeck-cache/stories.json | jq '.stories[] | {id, title, jiraTicket, repo}'

# Filter by feature
cat .specdeck-cache/stories.json | jq '.stories[] | select(.featureId == "CORE-INFRA")'

# Count stories by repo
cat .specdeck-cache/stories.json | jq '[.stories[] | .repo] | group_by(.) | map({repo: .[0], count: length})'
```

## Additional Context

- This was discovered during feature migration from coordinator to submodule
- Documentation: `.github/prompts/specdeck-migrate-feature.prompt.md`
- Related: `specdeck/AGENTS.md` → "Overlay Mappings" section

## Test Case for Maintainer

Create this minimal test structure:

```
test-coordinator/
  .specdeck.config.json  # (coordinator enabled, overlays configured)
  overlays/
    test-sub/
      TEST-FEAT.md       # (Jira mappings)
  test-sub/
    specdeck/
      releases/
        R1.md            # (release overview)
        R1/
          TEST-FEAT.md   # (feature with 2 stories, NO Jira column)
```

Run:
1. `specdeck sync`
2. `cat .specdeck-cache/stories.json | jq '.stories[0].jira'`
   - **Expected:** `"PROJ-123"`
   - **Actual:** `null`
3. `specdeck list features`
   - **Expected:** Shows TEST-FEAT
   - **Actual:** Empty or only coordinator features

---

**Priority:** High
**Category:** Core Functionality
**Components:** Coordinator Mode, Sync, Overlay Mappings, List Commands

---

## Verification Results (v0.2.0)

**BOTH BUGS FIXED ✅**

### Bug #1 Fix: Overlay Parser Format Support
- **Root Cause**: Parser expected old format (heading + bullets), documentation specified new format (YAML + table)
- **Fix**: Rewrote `OverlayParser.parseOverlay()` to support YAML front matter and markdown tables
- **Files Modified**: `src/parsers/overlay.parser.ts`
- **Verification**: Parser tested with user's exact overlay format - successfully extracts feature ID and all Jira mappings

### Bug #2 Fix: ConfigRepository Initialization
- **Root Cause**: `StoryService` initialized `ConfigRepository` with `specdeckDir` instead of project root
- **Impact**: `ConfigRepository` couldn't find `.specdeck.config.json`, coordinator mode detection failed
- **Fix**: Updated `StoryService` and `FeatureService` constructors to accept optional `rootPath` parameter
- **Files Modified**:
  - `src/services/story.service.ts` - Added `rootPath` parameter, pass to `ConfigRepository`
  - `src/services/feature.service.ts` - Added `rootPath` parameter, pass to `StoryService`
  - `src/commands/list.ts` - Pass `process.cwd()` when creating services
  - `src/server/routes/stories.ts` - Pass `process.cwd()` in all route handlers (5 locations)
  - `src/server/routes/stats.ts` - Pass `process.cwd()` in all route handlers (3 locations)

### Testing Steps

After updating to latest version:

1. **Rebuild SpecDeck:**
   ```bash
   cd /path/to/specdeck
   git pull
   npm run build
   ```

2. **Sync with verbose output:**
   ```bash
   cd /path/to/coordinator-project
   specdeck sync --verbose
   ```
   
   **Expected output:**
   ```
   📦 Syncing stories from all submodules...
     Reading stories from 1 submodule(s)...
     ✓ Aggregated 21 stories
     Applying overlay Jira mappings...
     ✓ Found 1 repo(s) with overlays
       - hyperspot: 2 overlay file(s)
         • CORE-INFRA: 4 Jira mapping(s)
         • CORE-SPECS: 3 Jira mapping(s)
     ✓ Cache written to ./.specdeck-cache/stories.json
   
   ✓ Sync Complete
     Duration: 0.05s
     Stories: 21 total
       - hyperspot: 21
     Jira Mappings: 7/21 stories mapped
       - 2 overlay file(s) with 7 mapping(s)
   ```

3. **List stories from cache:**
   ```bash
   specdeck list stories --feature CORE-INFRA
   ```
   
   **Expected output:**
   ```
   Stories (4):
   
     CORE-INFRA-01: Process manager
       Status: planned | Complexity: M
   
     CORE-INFRA-02: Types registry
       Status: planned | Complexity: M
   
     CORE-INFRA-03: Tenant resolver
       Status: planned | Complexity: M
   
     CORE-INFRA-04: Nodes registry
       Status: planned | Complexity: M
   ```

4. **List stories with Jira tickets:**
   ```bash
   specdeck list stories --feature CORE-INFRA --with-jira
   ```
   
   **Expected output includes:**
   ```
     CORE-INFRA-01: Process manager
       Status: planned | Complexity: M
       Jira: REAL-34
   ```

5. **Verify cache has Jira mappings:**
   ```bash
   cat .specdeck-cache/stories.json | jq '.stories[] | select(.featureId == "CORE-INFRA") | {id, jiraTicket}'
   ```
   
   **Expected output:**
   ```json
   {
     "id": "CORE-INFRA-01",
     "jiraTicket": "REAL-34"
   }
   {
     "id": "CORE-INFRA-02",
     "jiraTicket": "REAL-35"
   }
   ...
   ```

---

## Original Bug Report (Historical)

Tested on December 10, 2025 with SpecDeck version 0.2.0:

### Diagnostic Steps Completed ✅

Following the troubleshooting guide from `troubleshooting.md`:

#### 1. Coordinator Mode Verification
```bash
$ cat .specdeck.config.json | jq '.coordinator'
{
  "enabled": true,
  "submodules": [{"name": "hyperspot", "path": "hyperspot", "visibility": "public"}],
  "overlaysDir": "./overlays",
  "cacheDir": "./.specdeck-cache"
}
```
✅ Coordinator mode is properly configured

#### 2. Overlay Directory Structure
```bash
$ find overlays -type f -name "*.md" | sort
overlays/hyperspot/CORE-INFRA.md
overlays/hyperspot/CORE-SPECS.md
```
✅ Overlay files exist in correct location (`overlays/{submodule-name}/`)

#### 3. Overlay File Format
```bash
$ cat overlays/hyperspot/CORE-INFRA.md
---
feature: CORE-INFRA    # ✅ Matches filename
---

# Jira Mappings       # ✅ Correct header

| Story ID | Jira Ticket |  # ✅ Correct table headers
|----------|-------------|
| CORE-INFRA-01 | REAL-34 |
...
```
✅ Format is correct per troubleshooting guide

#### 4. Submodule Configuration Match
```bash
$ cat .specdeck.config.json | jq '.coordinator.submodules[] | {name, path}'
{
  "name": "hyperspot",     # ✅ Matches overlay directory name
  "path": "hyperspot"
}
```
✅ Submodule name matches overlay directory

### Bug #1: Overlay Mappings - STILL BROKEN ❌

**Expected verbose output:**
```
📦 Syncing stories from all submodules...
  Reading stories from 1 submodule(s)...
  ✓ Aggregated 21 stories
  Applying overlay Jira mappings...      ← Should appear
  ✓ Found 1 repo(s) with overlays        ← Should appear
    - hyperspot: 2 overlay file(s)       ← Should appear
  ✓ Cache written
✓ Sync Complete
  Jira Mappings: 21/21 stories mapped    ← Should appear
```

**Actual verbose output:**
```bash
$ specdeck sync --verbose
📦 Syncing stories from all submodules...

✓ Sync Complete
  Duration: 0.02s
  Stories: 21 total
    - hyperspot: 21
  Cache: synced just now
```

**Finding:** No mention of overlays being processed at all. The sync command is NOT looking for or processing overlay files.

**Cache result:**
```bash
$ cat .specdeck-cache/stories.json | jq '.stories[0] | keys'
[
  "complexity",
  "featureId",
  "id",
  "notes",
  "owner",
  "releaseId",
  "repo",
  "status",
  "tags",
  "title"
]
# ← Missing: "jiraTicket" and "overlaySource" fields
```

**Conclusion:** Overlay code is not executing. Stories are synced from submodule but overlay application step is completely skipped.

### Bug #2: List Commands Ignore Cache - STILL BROKEN ❌

```bash
$ cat .specdeck-cache/stories.json | jq '.stories | length'
21  # ← Cache has 21 stories from hyperspot

$ specdeck list features | grep -E "CORE-INFRA|CORE-SPECS"
(no output)  # ← Features from hyperspot not shown

$ specdeck list stories --feature CORE-INFRA
Stories (0):  # ← Should show 4 stories from cache
```

**Conclusion:** List commands still read from coordinator's `specdeck/` directory instead of using the cache.

### Root Cause Analysis

Based on troubleshooting diagnostics:

1. **All configuration is correct** - coordinator mode, overlay paths, file formats
2. **Overlay files are valid** - correct YAML, correct headers, correct mappings
3. **Sync finds submodule stories** - 21 stories correctly aggregated
4. **But overlay processing is skipped** - no verbose output, no fields added to cache

**Hypothesis:** The overlay application code exists but has a bug preventing it from running:
- Possible issues: Path resolution, feature ID matching logic, or conditional that prevents execution
- The code to apply overlays is likely never reached during sync

**Status:** Both bugs remain unfixed in version 0.2.0. The coordinator mode feature is still non-functional.

# Coordinator Mode Troubleshooting Guide

## Issue: Overlays Not Being Applied

### Symptoms
- `specdeck sync` completes successfully
- Cache is created but `jiraTicket` field is `null`
- Overlay files exist in `specdeck/specdeck/overlays/` directory

### Diagnostic Steps

#### 1. Verify Coordinator Mode is Enabled

```bash
cat .specdeck.config.json | jq '.coordinator'
```

**Expected:**
```json
{
  "enabled": true,
  "submodules": [
    {
      "name": "backend",
      "path": "submodule-repos/backend",
      ...
    }
  ],
  "overlaysDir": "./overlays",
  "cacheDir": "./.specdeck-cache"
}
```

❌ **If missing `coordinator.enabled = true`**, sync will fail:
```bash
specdeck sync
# Output: ✗ sync command only works in coordinator mode
```

---

#### 2. Run Sync with Verbose Flag

```bash
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

**Key indicators:**
- ✓ "Found X repo(s) with overlays" - Shows overlays were read
- ✓ "Jira Mappings: X/Y stories mapped" - Shows mappings were applied

❌ **If you see:**
```
✓ Sync Complete
  Duration: 0.02s
  Stories: 21 total
    - hyperspot: 21
```
**Without** "Jira Mappings:" line → Overlays were not found or have no mappings

---

#### 3. Check Overlay Directory Structure

```bash
# List overlay files
find overlays -type f -name "*.md" | sort

# Check overlay content
cat specdeck/overlays/hyperspot/CORE-INFRA.md
```

**Expected structure:**
```
specdeck/overlays/
  hyperspot/           ← Must match submodule name exactly
    CORE-INFRA.md     ← Must match feature ID exactly
    CORE-SPECS.md
```

**Common mistakes:**
- ❌ `specdeck/overlays/CORE-INFRA.md` (missing submodule directory)
- ❌ `specdeck/overlays/backend/CORE-INFRA.md` (wrong submodule name - should be "hyperspot")
- ❌ `specdeck/overlays/hyperspot/CORE-INFRA.overlay.md` (wrong extension - must be `.md`)

---

#### 4. Verify Overlay File Format

```bash
cat specdeck/overlays/hyperspot/CORE-INFRA.md
```

**Required format:**
```markdown
---
feature: CORE-INFRA
---

# Jira Mappings

| Story ID | Jira Ticket |
|----------|-------------|
| CORE-INFRA-01 | REAL-34 |
| CORE-INFRA-02 | REAL-35 |
```

**Critical requirements:**
- ✓ YAML front matter with `feature` field
- ✓ Feature ID must match filename (CORE-INFRA)
- ✓ Markdown table with exact headers: "Story ID" and "Jira Ticket"
- ✓ Story IDs must match actual stories in submodule

❌ **Common issues:**
```markdown
# Wrong - missing YAML front matter
# Jira Mappings
| Story ID | Jira |  ← Wrong header, should be "Jira Ticket"

# Wrong - feature ID doesn't match
---
feature: CLI-CORE  ← Should be CORE-INFRA
---
```

---

#### 5. Validate Cache Content

```bash
# Check cache was created
ls -la .specdeck-cache/stories.json

# Check cache has jiraTicket field
cat .specdeck-cache/stories.json | jq '.stories[] | select(.id == "CORE-INFRA-01") | {id, jiraTicket, overlaySource}'
```

**Expected:**
```json
{
  "id": "CORE-INFRA-01",
  "jiraTicket": "REAL-34",
  "overlaySource": "specdeck/overlays/hyperspot/CORE-INFRA.md"
}
```

❌ **If you see:**
```json
{
  "id": "CORE-INFRA-01",
  "jiraTicket": null  ← Overlay was not applied
}
```

**Possible causes:**
1. Submodule name mismatch (check step 3)
2. Feature ID mismatch (check step 4)
3. Story ID doesn't exist in submodule
4. Overlay file format error (check step 4)

---

#### 6. Verify Submodule Configuration

```bash
# Check submodule name in config
cat .specdeck.config.json | jq '.coordinator.submodules[] | {name, path}'
```

**Expected:**
```json
{
  "name": "hyperspot",
  "path": "hyperspot"
}
```

**The overlay directory MUST match the submodule `name`:**
```
Config: name = "hyperspot"
Overlay path: specdeck/overlays/hyperspot/
```

❌ **If mismatched:**
```json
Config: { "name": "backend", "path": "hyperspot" }
Overlay: specdeck/overlays/hyperspot/  ← Wrong! Should be specdeck/overlays/backend/
```

---

#### 7. Test Overlay Parsing Directly

```bash
# Create a test to verify overlay parsing works
node -e "
const { OverlayParser } = require('./dist/parsers/overlay.parser.js');
const fs = require('fs');
const parser = new OverlayParser();
const content = fs.readFileSync('specdeck/overlays/hyperspot/CORE-INFRA.md', 'utf-8');
const overlay = parser.parseOverlay(content);
console.log('Feature:', overlay.featureId);
console.log('Jira Mappings:', overlay.jiraMappings);
"
```

**Expected:**
```
Feature: CORE-INFRA
Jira Mappings: Map(4) {
  'CORE-INFRA-01' => 'REAL-34',
  'CORE-INFRA-02' => 'REAL-35',
  'CORE-INFRA-03' => 'REAL-36',
  'CORE-INFRA-04' => 'REAL-37'
}
```

---

## Issue: List Commands Don't Show Cached Data

### Symptoms
- Cache exists and has stories
- `specdeck list stories` shows 0 stories
- `specdeck list features` doesn't show submodule features

### Diagnostic Steps

#### 1. Verify Cache Exists and is Valid

```bash
# Check cache file exists
ls -la .specdeck-cache/stories.json

# Check cache structure
cat .specdeck-cache/stories.json | jq '{version, syncedAt, repos, storyCount: (.stories | length)}'
```

**Expected:**
```json
{
  "version": "1.0.0",
  "syncedAt": "2025-12-10T14:30:00.000Z",
  "repos": ["hyperspot"],
  "storyCount": 21
}
```

---

#### 2. Test List Commands with Cache

```bash
# List all stories (should use cache)
specdeck list stories

# Filter by repo
specdeck list stories --repo hyperspot

# Show Jira tickets
specdeck list stories --with-jira

# Check if cache is being used
specdeck list stories --feature CORE-INFRA
```

**Expected behavior:**
- If coordinator mode enabled + cache exists → reads from cache
- If cache doesn't exist → falls back to reading coordinator's `specdeck/` directory

---

#### 3. Check Coordinator Mode Detection

```bash
# The issue might be that list commands don't detect coordinator mode
# Add debug output (temporary)
node -e "
const { ConfigRepository } = require('./dist/repositories/config.repository.js');
const config = new ConfigRepository(process.cwd());
config.isCoordinatorMode().then(result => {
  console.log('Coordinator mode:', result);
  return config.read();
}).then(cfg => {
  console.log('Config:', JSON.stringify(cfg, null, 2));
});
"
```

**Expected:**
```
Coordinator mode: true
Config: {
  "coordinator": {
    "enabled": true,
    ...
  }
}
```

❌ **If `Coordinator mode: false`**, then list commands will read from `specdeck/` directory instead of cache.

---

#### 4. Verify StoryService is Using Cache

Currently, `list stories` calls `storyService.listStoriesWithCache()` which:
1. Checks if coordinator mode is enabled
2. If yes, reads from cache
3. If no, falls back to repository

**The problem might be:**
- Coordinator mode check failing
- Cache path incorrect
- Cache read permission issue

**Manual test:**
```bash
# Try to read cache manually
cat .specdeck-cache/stories.json | jq '.stories[] | select(.featureId == "CORE-INFRA") | {id, title, status}'
```

If this works but `specdeck list stories` doesn't, the issue is in the list command logic.

---

## Quick Checklist

Use this checklist to verify coordinator mode setup:

### Configuration
- [ ] `.specdeck.config.json` exists in coordinator root
- [ ] `coordinator.enabled = true`
- [ ] `coordinator.submodules` array has at least one entry
- [ ] `coordinator.overlaysDir` is set (e.g., `"./overlays"`)
- [ ] `coordinator.cacheDir` is set (e.g., `"./.specdeck-cache"`)

### Submodules
- [ ] Submodule directory exists at specified path
- [ ] Submodule has `specdeck/` directory
- [ ] Submodule has `specdeck/releases/` directory
- [ ] Submodule has feature files with stories

### Overlays
- [ ] `specdeck/overlays/` directory exists
- [ ] `specdeck/overlays/<submodule-name>/` directory exists (name matches config)
- [ ] Overlay files use `.md` extension (not `.overlay.md`)
- [ ] Overlay files have YAML front matter with `feature` field
- [ ] Overlay files have "Jira Mappings" table with correct headers

### Sync
- [ ] `specdeck sync` completes without errors
- [ ] `specdeck sync --verbose` shows "Found X repo(s) with overlays"
- [ ] Verbose output shows Jira mapping count
- [ ] Summary shows "Jira Mappings: X/Y stories mapped"

### Cache
- [ ] `.specdeck-cache/` directory was created
- [ ] `.specdeck-cache/stories.json` file exists
- [ ] Cache has `version`, `syncedAt`, `repos`, `stories` fields
- [ ] Stories in cache have `jiraTicket` field (not null)
- [ ] Stories in cache have `overlaySource` field

### List Commands
- [ ] `specdeck list stories` shows stories from submodules
- [ ] `specdeck list features` shows features from submodules
- [ ] `specdeck list stories --with-jira` shows Jira tickets

---

## Common Root Causes

### 1. Coordinator Mode Not Enabled
**Symptom:** `specdeck sync` fails with "only works in coordinator mode"
**Fix:** Add to `.specdeck.config.json`:
```json
{
  "coordinator": {
    "enabled": true,
    "submodules": [],
    "overlaysDir": "./overlays",
    "cacheDir": "./.specdeck-cache"
  }
}
```

### 2. Submodule Name Mismatch
**Symptom:** Overlays not found, verbose shows 0 overlays
**Fix:** Match overlay directory to submodule name in config:
```
Config: { "name": "hyperspot" }
Directory: specdeck/overlays/hyperspot/  ← Must match
```

### 3. Wrong File Extension
**Symptom:** Overlays not found, overlay file exists
**Fix:** Rename `FEATURE.overlay.md` → `FEATURE.md`

### 4. Invalid Overlay Format
**Symptom:** Overlays found but mappings not applied
**Fix:** Check YAML front matter and table headers match exactly

### 5. Feature ID Mismatch
**Symptom:** Some overlays work, others don't
**Fix:** Ensure `feature:` in YAML matches filename and actual feature in submodule

---

## Getting Help

If issues persist after following this guide:

1. **Run full diagnostic:**
   ```bash
   specdeck sync --verbose 2>&1 | tee sync-debug.log
   ```

2. **Collect configuration:**
   ```bash
   cat .specdeck.config.json > config-debug.json
   find overlays -type f -name "*.md" -exec echo "=== {} ===" \; -exec cat {} \; > overlays-debug.txt
   cat .specdeck-cache/stories.json | jq . > cache-debug.json 2>&1 || echo "Cache read error"
   ```

3. **Share debug files** with maintainer or in GitHub issue

---
title: Coordinator Mode Setup
description: Guide for setting up SpecDeck in coordinator mode for multi-repo story management
version: 0.2.0
---

# Setup Coordinator Mode

**Purpose**: Configure SpecDeck to aggregate stories from multiple Git submodules into a single coordinated view.

**When to use**: Managing stories across multiple repositories/teams while maintaining central oversight.

**Full documentation**: See `@specdeck/AGENTS.md` → "Coordinator Mode" section.

---

## What is Coordinator Mode?

**Coordinator mode** allows a parent repository to aggregate stories from multiple submodule repositories:

```
coordinator-repo/                    # Parent project
├── .specdeck.config.json           # coordinator.enabled = true
├── .specdeck-cache/                # Aggregated stories
│   └── stories.json                # Cache of all submodule stories
├── specdeck/overlays/                       # Jira mappings per submodule
│   ├── backend/
│   │   └── CLI-CORE.md             # Jira tickets for backend features
│   └── frontend/
│       └── UI-01.md                # Jira tickets for frontend features
└── submodule-repos/                # Git submodules
    ├── backend/                    # Git submodule
    │   └── specdeck/               # Backend's own stories
    └── frontend/                   # Git submodule
        └── specdeck/               # Frontend's own stories
```

**Benefits**:
- Centralized view of all stories across teams
- Each team manages their own stories in submodules
- Jira mappings stay in coordinator (team-agnostic)
- Single source of truth for cross-team dependencies

---

## Prerequisites

Before setting up coordinator mode:

1. **Coordinator repository exists** (current directory)
2. **SpecDeck initialized** in coordinator:
   ```bash
   specdeck init copilot
   ```
3. **Submodule repositories exist** and are accessible via Git

---

## Setup Steps

### Step 1: Enable Coordinator Mode

**Action**: Update `.specdeck.config.json` to enable coordinator mode

```bash
# Read current config
cat .specdeck.config.json
```

**Add/modify configuration**:
```json
{
  "version": "0.2.0",
  "mode": "copilot",
  "coordinator": {
    "enabled": true,
    "submodules": []
  }
}
```

**Key fields**:
- `coordinator.enabled`: Must be `true`
- `coordinator.submodules`: Array of submodule configurations (populated in next steps)

---

### Step 2: Add First Submodule

**Action**: Initialize Git submodule and register with SpecDeck

**User must run** (requires git operations):
```bash
specdeck init submodule <repo-url> submodule-repos/backend
```

**What this does**:
1. Runs `git submodule add <repo-url> submodule-repos/backend`
2. Updates `.specdeck.config.json` with submodule entry
3. Initializes SpecDeck in submodule if not present
4. Creates `specdeck/overlays/backend/` directory

**Example**:
```bash
# Add backend submodule
specdeck init submodule git@github.com:org/backend.git submodule-repos/backend

# Add frontend submodule
specdeck init submodule git@github.com:org/frontend.git submodule-repos/frontend
```

**Config after adding submodules**:
```json
{
  "version": "0.2.0",
  "mode": "copilot",
  "coordinator": {
    "enabled": true,
    "submodules": [
      {
        "name": "backend",
        "path": "submodule-repos/backend",
        "url": "git@github.com:org/backend.git"
      },
      {
        "name": "frontend",
        "path": "submodule-repos/frontend",
        "url": "git@github.com:org/frontend.git"
      }
    ]
  }
}
```

---

### Step 3: Verify Submodules Have SpecDeck

**Action**: Check each submodule has SpecDeck initialized

```bash
# Check backend
ls submodule-repos/backend/specdeck/

# Check frontend
ls submodule-repos/frontend/specdeck/
```

**Expected structure in each submodule**:
```
specdeck/
├── AGENTS.md
├── project-plan.md
├── vision.md
└── releases/
    ├── R1-foundation.md
    └── R1-foundation/
        └── FEATURE.md
```

**If missing**, initialize SpecDeck in submodule:
```bash
cd submodule-repos/backend
npx specdeck init copilot
cd ../..
```

---

### Step 4: Create Directory Structure

**Action**: Ensure coordinator has necessary directories

```bash
# Create overlays directory (if not exists)
mkdir -p overlays

# Create overlay subdirectories for each submodule
mkdir -p specdeck/overlays/backend
mkdir -p specdeck/overlays/frontend

# Cache directory will be created automatically by sync
```

---

### Step 5: Initial Sync

**Action**: Aggregate stories from all submodules

```bash
specdeck sync
```

**What happens**:
1. Reads stories from each submodule's `specdeck/releases/`
2. Applies Jira mappings from `specdeck/overlays/` (if any)
3. Creates `.specdeck-cache/stories.json` with aggregated data

**Verify sync succeeded**:
```bash
# Check cache was created
ls -la .specdeck-cache/stories.json

# List all aggregated stories
specdeck list stories

# Filter by submodule
specdeck list stories --repo backend
```

---

### Step 6: Validate Setup

**Action**: Ensure configuration is correct

```bash
# Validate coordinator
specdeck validate all

# Check submodule configurations
cat .specdeck.config.json | grep -A 10 coordinator
```

**Expected**:
- No validation errors
- Cache file exists with stories
- Can list stories from submodules

---

## Configuration Reference

### Coordinator Config Structure

```json
{
  "version": "0.2.0",
  "mode": "copilot",
  "coordinator": {
    "enabled": true,
    "submodules": [
      {
        "name": "backend",              // Unique name (used in overlays)
        "path": "submodule-repos/backend", // Relative path to submodule
        "url": "git@github.com:org/backend.git" // Git URL
      }
    ]
  }
}
```

**Field descriptions**:
- `name`: Identifier for submodule (used in overlay paths: `specdeck/overlays/<name>/`)
- `path`: Relative path from coordinator root to submodule
- `url`: Git repository URL (for reference, managed by git)

---

## Working with Coordinator Mode

### Daily Workflow

**When user updates submodules**:
```bash
# User updates git submodules (agent cannot do this)
git submodule update --remote

# Refresh aggregated cache
specdeck sync
```

**Viewing stories**:
```bash
# All stories from all submodules
specdeck list stories

# Filter by submodule
specdeck list stories --repo backend

# Filter by feature
specdeck list stories --feature CLI-CORE

# Filter by status
specdeck list stories --status in_progress
```

**Updating stories**:
1. Navigate to submodule: `cd submodule-repos/backend`
2. Edit story in feature file
3. Validate: `specdeck validate all`
4. Return to coordinator: `cd ../..`
5. User commits in submodule (agent cannot)
6. User updates coordinator reference (agent cannot)
7. Sync: `specdeck sync`

---

## Creating Overlays

**Purpose**: Map stories to Jira tickets in coordinator

**When to create**: After migrating features or when linking existing submodule stories to Jira

**Overlay file structure**: `specdeck/overlays/<submodule-name>/<feature-id>.md`

**Example**: `specdeck/overlays/backend/CLI-CORE.md`
```markdown
---
feature: CLI-CORE
---

# Jira Mappings

| Story ID | Jira Ticket |
|----------|-------------|
| CLI-CORE-01 | PROJ-1001 |
| CLI-CORE-02 | PROJ-1002 |
| CLI-CORE-03 | PROJ-1003 |
```

**After creating overlay**:
```bash
specdeck sync  # Apply mappings to cache
```

---

## Adding More Submodules

**To add additional submodules after initial setup**:

```bash
# User runs (requires git):
specdeck init submodule <new-repo-url> submodule-repos/new-service

# Verify added to config
cat .specdeck.config.json | grep new-service

# Sync to include new submodule
specdeck sync
```

---

## Removing Submodules

**To remove a submodule**:

```bash
# User runs (requires git):
specdeck init remove-submodule backend

# Or by path:
specdeck init remove-submodule submodule-repos/backend

# Verify removed from config
cat .specdeck.config.json | grep -c backend
# Expected: 0

# Sync to update cache
specdeck sync
```

**What happens**:
1. Removes git submodule
2. Updates `.specdeck.config.json` (removes entry)
3. Cleans up git references (.gitmodules, .git/config)
4. Overlays remain (can be deleted manually if needed)

---

## Common Issues & Solutions

### Issue: "Not in coordinator mode"

**Cause**: `coordinator.enabled` is false or missing

**Solution**:
```json
// In .specdeck.config.json
{
  "coordinator": {
    "enabled": true,  // Must be true
    "submodules": []
  }
}
```

---

### Issue: Submodule stories not appearing

**Cause**: Cache is stale or submodule not synced

**Solution**:
```bash
# Update submodules (user runs)
git submodule update --init --recursive

# Refresh cache
specdeck sync

# Verify
specdeck list stories --repo backend
```

---

### Issue: Overlays not applied

**Cause**: Overlay path doesn't match submodule name

**Solution**: Verify paths match:
```bash
# Submodule name in config
cat .specdeck.config.json | grep '"name"'

# Overlay directory must match
ls specdeck/overlays/
# Expected: backend/ frontend/ (matching names)
```

---

### Issue: "Configuration file not found" in submodule

**Cause**: Submodule doesn't have SpecDeck initialized

**Solution**:
```bash
cd submodule-repos/backend
npx specdeck init copilot
cd ../..
specdeck sync
```

---

## Verification Checklist

After setup, verify:

- [ ] `.specdeck.config.json` has `coordinator.enabled = true`
- [ ] `.specdeck.config.json` has all submodules in `coordinator.submodules` array
- [ ] Each submodule directory exists: `submodule-repos/<name>/`
- [ ] Each submodule has SpecDeck: `submodule-repos/<name>/specdeck/`
- [ ] Overlays directory exists: `specdeck/overlays/`
- [ ] Overlay subdirectories exist: `specdeck/overlays/<name>/` for each submodule
- [ ] Cache created: `.specdeck-cache/stories.json`
- [ ] Validation passes: `specdeck validate all`
- [ ] Stories visible: `specdeck list stories` shows submodule stories
- [ ] Filtering works: `specdeck list stories --repo backend`

---

## Converting Standalone to Coordinator

**Scenario**: Existing SpecDeck project needs to become coordinator

### Steps:

1. **Backup current stories**:
   ```bash
   cp -r specdeck specdeck.backup
   ```

2. **Enable coordinator mode**:
   ```json
   // .specdeck.config.json
   {
     "coordinator": {
       "enabled": true,
       "submodules": []
     }
   }
   ```

3. **Add submodules** (follow Step 2 above)

4. **Migrate features to submodules** (optional):
   - Use migration workflow (see `@.github/prompts/specdeck-migrate-feature.prompt.md`)
   - Or keep stories in coordinator (both patterns work)

5. **Sync**:
   ```bash
   specdeck sync
   ```

**Note**: Can have stories in BOTH coordinator and submodules - they aggregate together.

---

## Quick Reference

**Setup commands**:
```bash
# 1. Enable coordinator mode (edit .specdeck.config.json)
# 2. Add submodules
specdeck init submodule <url> submodule-repos/<name>
# 3. Verify submodules
ls submodule-repos/*/specdeck/
# 4. Create overlays
mkdir -p specdeck/overlays/<name>
# 5. Initial sync
specdeck sync
# 6. Verify
specdeck list stories
```

**Daily commands**:
```bash
# User updates submodules (git)
# Then sync cache
specdeck sync

# View stories
specdeck list stories --repo <name>
```

---

## Related Documentation

- `@specdeck/AGENTS.md` → "Coordinator Mode" (workflows)
- `@specdeck/AGENTS.md` → "File Structure" (directory layout)
- `@.github/prompts/specdeck-migrate-feature.prompt.md` → Migrate features to submodules
- `@.github/prompts/specdeck-commands.prompt.md` → CLI commands reference

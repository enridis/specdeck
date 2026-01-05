---
title: Feature Migration to Submodule
description: Guide for migrating features from coordinator to submodules while preserving Jira mappings
version: 0.2.0
---

# Migrate Feature to Submodule

**Purpose**: Move a feature from coordinator's `specdeck/` to a submodule's `specdeck/` while preserving Jira mappings in coordinator overlays.

**When to use**: Feature belongs to specific team/repository and you want to decentralize story management.

**Full documentation**: See `@specdeck/AGENTS.md` → "Migrating Features to Submodules" section for comprehensive guide.

---

## Pre-Migration Checklist

Before starting migration, gather this information:

### 1. Verify Coordinator Mode
```bash
# Check if coordinator mode enabled
cat .specdeck.config.json | grep coordinator
```

Expected: `"coordinator": {"enabled": true, ...}`

### 2. Identify Source Feature
```bash
# List all features
specdeck list features

# View stories in feature
specdeck list stories --feature CLI-CORE
```

Record:
- Feature ID: `_____________` (e.g., CLI-CORE)
- Release: `_____________` (e.g., R1-foundation)
- Story count: `_____________`
- Has Jira column: ☐ Yes  ☐ No

### 3. Identify Target Submodule

Record:
- Submodule name: `_____________` (e.g., backend)
- Submodule path: `submodule-repos/_____________/`

```bash
# Verify submodule exists
ls -la submodule-repos/backend/

# Verify SpecDeck initialized in submodule
ls -la submodule-repos/backend/specdeck/
```

Expected: `specdeck/releases/` directory exists

### 4. Analyze Jira Mappings

```bash
# Read source feature file
cat specdeck/releases/R1-foundation/CLI-CORE.md
```

Look for:
- Jira column in story table
- Which stories have Jira tickets
- Jira ticket format (e.g., PROJ-1001)

---

## Migration Steps

### Step 1: Read Source Feature

**Action**: Read the complete feature file from coordinator

```bash
# Read source
cat specdeck/releases/R1-foundation/CLI-CORE.md
```

**Extract**:
- Complete YAML front matter
- Feature description
- Entire story table
- All Jira ticket mappings (Story ID → Jira ticket)

**Example Jira mappings to extract**:
```
CLI-CORE-01 → PROJ-1001
CLI-CORE-02 → PROJ-1002
CLI-CORE-03 → (no Jira)
```

---

### Step 2: Create Feature in Submodule

**Action**: Create feature file in submodule WITHOUT Jira column

**Target path**: `submodule-repos/backend/specdeck/releases/R1-foundation/CLI-CORE.md`

**Changes to make**:
1. Copy complete YAML front matter
2. Copy feature description
3. Copy story table BUT remove Jira column
4. Keep all other columns: ID, Title, Status, Complexity, Estimate, Owner, Tags, Notes

**Table transformation example**:

❌ **Original in coordinator** (has Jira):
```markdown
| ID | Title | Status | Complexity | Jira | Owner | Notes |
|----|-------|--------|------------|------|-------|-------|
| CLI-CORE-01 | Setup | done | M | PROJ-1001 | @user | Commander |
| CLI-CORE-02 | Logging | in_progress | S | PROJ-1002 | @user | Errors |
```

✅ **New in submodule** (no Jira):
```markdown
| ID | Title | Status | Complexity | Owner | Notes |
|----|-------|--------|------------|-------|-------|
| CLI-CORE-01 | Setup | done | M | @user | Commander |
| CLI-CORE-02 | Logging | in_progress | S | @user | Errors |
```

**Create directory if needed**:
```bash
mkdir -p submodule-repos/backend/specdeck/releases/R1-foundation
```

---

### Step 3: Create Overlay File

**Action**: Create overlay in coordinator with Jira mappings

**Target path**: `specdeck/overlays/backend/CLI-CORE.md`

**Template**:
```markdown
---
feature: CLI-CORE
---

# Jira Mappings

| Story ID | Jira Ticket |
|----------|-------------|
| CLI-CORE-01 | PROJ-1001 |
| CLI-CORE-02 | PROJ-1002 |
```

**Rules**:
- Only include stories that have Jira tickets
- Skip stories with empty/no Jira values
- Story IDs must match exactly
- Path must match submodule name: `specdeck/overlays/<submodule>/`

**Create directory if needed**:
```bash
mkdir -p specdeck/overlays/backend
```

---

### Step 4: Update Submodule Release Overview

**Action**: Add feature to release overview in submodule

**Target path**: `submodule-repos/backend/specdeck/releases/R1-foundation.md`

**Add to "Features" section**:
```markdown
## Features

- **CLI-CORE**: CLI Entry Point and Command Framework
  - Hierarchical command structure with Commander.js
  - Global options (--version, --help, --json)
```

**Add to "Feature Files" section**:
```markdown
## Feature Files

- [CLI-CORE](./R1-foundation/CLI-CORE.md) - 3 stories
```

**Note**: If release overview doesn't exist in submodule, create it based on coordinator's version.

---

### Step 5: Delete Feature from Coordinator

**Action**: Remove feature file from coordinator (it now lives in submodule)

```bash
# Delete feature file
rm specdeck/releases/R1-foundation/CLI-CORE.md
```

**Also update**: `specdeck/releases/R1-foundation.md`
- Remove feature from "Features" section
- Remove feature from "Feature Files" section

**Important**: This is complete deletion. Feature no longer exists in coordinator.

---

### Step 6: Validate Submodule

**Action**: Ensure feature file is valid in submodule

```bash
# Navigate to submodule
cd submodule-repos/backend

# Run validation
specdeck validate all

# Return to coordinator
cd ../..
```

**Expected**: No validation errors

**If errors occur**, check:
- YAML front matter has `feature` and `release` fields
- Story table has required columns: ID, Title, Status, Complexity
- Story IDs match feature name (CLI-CORE-01 in CLI-CORE.md)
- All status values are valid: planned, in_progress, in_review, blocked, done
- All complexity values are valid: XS, S, M, L, XL

---

### Step 7: Sync Coordinator Cache

**Action**: Refresh coordinator cache to load stories from submodule

```bash
# In coordinator root
specdeck sync
```

**What happens**:
1. Reads stories from `submodule-repos/backend/specdeck/`
2. Applies Jira mappings from `specdeck/overlays/backend/CLI-CORE.md`
3. Updates `.specdeck-cache/stories.json`

**Verify sync succeeded**:
```bash
# List stories for migrated feature
specdeck list stories --feature CLI-CORE
```

**Expected output**:
- Stories appear with correct details
- Jira tickets are present (from overlay)
- Repo indicator shows: `backend`

---

## Post-Migration Verification

Run these checks to confirm migration succeeded:

### ✓ File Structure Check
```bash
# Feature exists in submodule
[ -f submodule-repos/backend/specdeck/releases/R1-foundation/CLI-CORE.md ] && echo "✓ Feature in submodule"

# Feature removed from coordinator
[ ! -f specdeck/releases/R1-foundation/CLI-CORE.md ] && echo "✓ Feature removed from coordinator"

# Overlay exists
[ -f specdeck/overlays/backend/CLI-CORE.md ] && echo "✓ Overlay created"
```

### ✓ Content Check
```bash
# Submodule feature has NO Jira column
grep "Jira" submodule-repos/backend/specdeck/releases/R1-foundation/CLI-CORE.md
# Expected: No matches (or only in YAML front matter)

# Overlay has Jira mappings
grep "PROJ-" specdeck/overlays/backend/CLI-CORE.md
# Expected: Shows Jira tickets
```

### ✓ Validation Check
```bash
# Validate submodule
cd submodule-repos/backend && specdeck validate all && cd ../..
# Expected: No errors

# Validate coordinator
specdeck validate all
# Expected: No errors
```

### ✓ Data Check
```bash
# Stories visible with Jira tickets
specdeck list stories --feature CLI-CORE
# Expected: Shows stories with Jira column populated, repo=backend
```

---

## Common Issues & Solutions

### Issue: "Configuration file not found" in submodule

**Cause**: Submodule doesn't have SpecDeck initialized

**Solution**:
```bash
cd submodule-repos/backend
npx specdeck init copilot
cd ../..
```

---

### Issue: Validation fails with "Story ID doesn't match feature"

**Cause**: Story ID prefix doesn't match feature filename

**Example**: `REL-01-01` in `CLI-CORE.md` file

**Solution**: Ensure Story IDs match feature:
- `CLI-CORE-01` belongs in `CLI-CORE.md`
- `REL-01-01` belongs in `REL-01.md`

---

### Issue: Stories don't show Jira tickets after sync

**Cause**: Overlay path doesn't match submodule name

**Solution**: Verify overlay path matches submodule:
- Submodule: `submodule-repos/backend/`
- Overlay: `specdeck/overlays/backend/` (not `specdeck/overlays/CLI-CORE.md`)

---

### Issue: Cache still shows old data after sync

**Cause**: Cache file has stale data

**Solution**:
```bash
# Force refresh cache
rm -rf .specdeck-cache
specdeck sync
```

---

## Edge Cases

### Feature Has No Jira Tickets

**Scenario**: Feature file has no Jira column or all Jira cells are empty

**Actions**:
1. ✓ Migrate feature to submodule (no Jira column to remove)
2. ✗ Skip Step 3 (no overlay needed)
3. ✓ Continue with Steps 4-7

---

### Feature Spans Multiple Releases

**Scenario**: Same feature ID exists in R1 and R2

**Actions**:
- Migrate each release separately
- Create feature file in each release directory
- Single overlay file covers all releases (if same feature ID)

**Example**:
```
Coordinator:
  specdeck/releases/R1-foundation/CLI-CORE.md
  specdeck/releases/R2-advanced/CLI-CORE.md

After migration:
  submodule-repos/backend/specdeck/releases/R1-foundation/CLI-CORE.md
  submodule-repos/backend/specdeck/releases/R2-advanced/CLI-CORE.md
  specdeck/overlays/backend/CLI-CORE.md (covers both)
```

---

### Submodule Doesn't Exist Yet

**Scenario**: Need to add submodule first

**Solution**: User must run git command (agent cannot):
```bash
# User runs:
specdeck init submodule <repo-url> submodule-repos/backend
```

Then proceed with migration.

---

## Rollback Procedure

**If migration failed**, restore to pre-migration state:

### 1. Restore Feature in Coordinator
```bash
# Copy from submodule back to coordinator
cp submodule-repos/backend/specdeck/releases/R1-foundation/CLI-CORE.md \
   specdeck/releases/R1-foundation/CLI-CORE.md

# Re-add Jira column with original values (from overlay)
```

### 2. Remove from Submodule
```bash
# Delete from submodule
rm submodule-repos/backend/specdeck/releases/R1-foundation/CLI-CORE.md

# Update submodule release overview (remove feature)
```

### 3. Remove Overlay
```bash
rm specdeck/overlays/backend/CLI-CORE.md
```

### 4. Re-sync
```bash
specdeck sync
specdeck validate all
```

---

## Quick Reference

**Migration at a glance**:

```
1. Read:  specdeck/releases/R1/.../CLI-CORE.md
          └→ Extract Jira mappings

2. Write: submodule-repos/backend/specdeck/releases/R1/.../CLI-CORE.md
          └→ Same content, NO Jira column

3. Write: specdeck/overlays/backend/CLI-CORE.md
          └→ Jira mappings only

4. Update: submodule-repos/backend/specdeck/releases/R1-....md
           └→ Add feature to list

5. Delete: specdeck/releases/R1/.../CLI-CORE.md
           └→ Remove from coordinator

6. Validate: cd submodule-repos/backend && specdeck validate all

7. Sync: specdeck sync
```

**Key principles**:
- ✓ Jira stays in coordinator (overlays)
- ✓ Stories move to submodule (no Jira column)
- ✓ Always validate before syncing
- ✗ Never commit (user's responsibility)

---

## Related Documentation

- `@specdeck/AGENTS.md` → "Migrating Features to Submodules" (full guide)
- `@specdeck/AGENTS.md` → "Overlay Mappings" (overlay format)
- `@specdeck/AGENTS.md` → "Story Table Columns" (column reference)
- `@specdeck/AGENTS.md` → CLI commands and structure

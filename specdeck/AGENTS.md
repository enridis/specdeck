<!-- SPECDECK:START -->
# SpecDeck Tool Instructions

**Purpose:** SpecDeck is a CLI tool for managing engineering stories and project planning through Git-based Markdown files. It uses a feature-based file structure for scalability and clean git workflows.

---

## Quick Reference

### CLI Commands
```bash
# Project initialization
specdeck init copilot              # Install assistant templates + scaffold SpecDeck
specdeck init windsurf             # Install assistant templates + scaffold SpecDeck

# Story management
specdeck list stories               # List all stories
specdeck list stories --feature CLI-CORE # Filter by feature
specdeck list features --with-stories    # Show features with stories
specdeck releases list --with-features   # Show release hierarchy

# Migration (if needed)
specdeck migrate                   # Migrate old structure to feature-based

# Validation
specdeck validate all              # Validate all SpecDeck files
```

---

## Feature-Based File Structure

SpecDeck uses a feature-based structure where each feature's stories are in a separate file:

```
specdeck/
  releases/
    R1-foundation.md           # Release overview + feature list
    R1-foundation/             # Feature-specific story files
      CLI-CORE.md              # Stories for CLI-CORE feature
      REL-01.md                # Stories for REL-01 feature
      FEAT-01.md               # Stories for FEAT-01 feature
```

**Benefits:**
- **Scalability:** Each feature file has ~5-10 stories (manageable size)
- **Parallel Work:** Teams can edit different features without merge conflicts
- **Clean Git Diffs:** Changes focused to specific feature files

---

## Release Overview File Format

**File:** `specdeck/releases/R1-foundation.md`

```markdown
---
id: R1-foundation
title: Foundation Release
timeframe: Q1 2025
---

# Release: R1 - Foundation

## Objectives
- Establish core CLI framework
- Enable teams to navigate planning hierarchy
- Deliver usable MVP for single-repo projects

## Success Metrics
- CLI parses 5+ real-world files
- 80%+ test coverage
- Response time <200ms

## Features

- **CLI-CORE**: CLI Entry Point and Command Framework
  - Hierarchical command structure with Commander.js
  - Global options (--version, --help, --json, --verbose)
  - Configuration discovery (.specdeck.config.json)

- **REL-01**: Release Management
  - List all releases with summary information
  - Show detailed release information
  - Create new releases with interactive prompts

## Feature Files

- [CLI-CORE](./R1-foundation/CLI-CORE.md) - 4 stories
- [REL-01](./R1-foundation/REL-01.md) - 6 stories
- [FEAT-01](./R1-foundation/FEAT-01.md) - 5 stories
```

**YAML Front Matter (Required):**
- `id`: Release identifier (matches directory name)
- `title`: Human-readable release name
- `timeframe`: Quarter or date range

---

## Feature Story File Format

**File:** `specdeck/releases/R1-foundation/CLI-CORE.md`

```markdown
---
feature: CLI-CORE
release: R1-foundation
---

# Feature: CLI-CORE

## Description

CLI Entry Point and Command Framework
  - Hierarchical command structure with Commander.js
  - Global options (--version, --help, --json, --verbose)
  - Configuration discovery (.specdeck.config.json)

## Stories

| ID | Title | Status | Complexity | Estimate | Owner | Tags | Notes |
|----|-------|--------|------------|----------|-------|------|-------|
| CLI-CORE-01 | CLI entry point and command framework | done | M | 5 | TBA | cli, infra | Commander.js setup |
| CLI-CORE-02 | Global error handling and logging | done | S | 3 | TBA | cli, infra | Catch all errors |
| CLI-CORE-03 | Output formatting (table and JSON) | done | S | 3 | TBA | cli, infra | Format results |
| CLI-CORE-04 | Configuration discovery | done | M | 5 | TBA | cli, config | Find config file |
```

**YAML Front Matter (Required):**
- `feature`: Feature ID (matches filename)
- `release`: Release ID (matches parent directory)

---

## ⚠️ CRITICAL: Single Table Requirement

**Each feature file MUST contain EXACTLY ONE story table.**

❌ **WRONG - Multiple Tables:**
```markdown
## Sprint 1 Stories
| ID | Title | Status |
|----|-------|--------|
| CLI-CORE-01 | Setup | done |

## Sprint 2 Stories  
| ID | Title | Status |
|----|-------|--------|
| CLI-CORE-02 | Logging | in_progress |
```

✅ **CORRECT - Single Table:**
```markdown
## Stories

| ID | Title | Status | Complexity | Estimate | Owner | Tags | Notes |
|----|-------|--------|------------|----------|-------|------|-------|
| CLI-CORE-01 | Setup | done | M | 5 | TBA | cli | Commander.js |
| CLI-CORE-02 | Logging | in_progress | S | 3 | TBA | cli | Error handling |
```

**Why Single Table:**
- Parser reads FIRST table only - subsequent tables are ignored
- Creates silent data loss if multiple tables used
- Maintains consistency across all feature files
- Simplifies querying and filtering

**If you have too many stories for one file:**
- Split into multiple feature files (CLI-CORE-PHASE1.md, CLI-CORE-PHASE2.md)
- Or keep <10 stories per feature (recommended)

---

## Story Table Columns

**Required Columns:**
| Column | Format | Description |
|--------|--------|-------------|
| ID | FEATURE-NUMBER | Story identifier (e.g., CLI-CORE-01, REL-01-05) |
| Title | Text (3-12 words) | Brief story description |
| Status | planned \| in_progress \| in_review \| blocked \| done | Current state |
| Complexity | XS \| S \| M \| L \| XL | Estimated effort |

**Optional Columns:**
| Column | Format | Description |
|--------|--------|-------------|
| Estimate | Number | Story points or hours |
| Owner | @username or team | Person/team responsible |
| Jira | Ticket ID | Jira reference (if using Jira) |
| OpenSpec | Change ID | OpenSpec reference (if using OpenSpec) |
| Tags | Comma-separated | Categories/labels (e.g., "cli, infra") |
| Notes | Text | Additional context |

**Column Order:**
- Place required columns first: ID, Title, Status, Complexity
- Add optional columns as needed: Estimate, Owner, Tags, Notes
- Maintain consistent column order across all feature files

---

## Story ID Format

**Pattern:** `FEATURE-NUMBER`
- `FEATURE`: Feature identifier (2-8 uppercase letters/numbers with hyphens)
- `NUMBER`: 2-digit story number (01-99)

**Examples:**
- `CLI-CORE-01` - CLI Core feature, story 01
- `REL-01-05` - Release Management feature 01, story 05
- `FEAT-01-12` - Feature Management, story 12

**Important:**
- Story ID MUST match the feature ID prefix (CLI-CORE-01 belongs in CLI-CORE.md)
- SpecDeck auto-derives featureId and releaseId from Story ID and file location
- IDs must be unique within the feature

---

## Story Status Values

| Status | Meaning | When to Use |
|--------|---------|-------------|
| `planned` | Not started, in backlog | Story defined but no work begun |
| `in_progress` | Actively being worked on | Developer has started implementation |
| `in_review` | Code complete, under review | PR open, awaiting approval |
| `blocked` | Waiting on dependency | Cannot proceed due to external factor |
| `done` | Completed and merged | Work finished, code in main branch |

**Status Progression:**
```
planned → in_progress → in_review → done
                ↓
             blocked (temporary)
```

---

## Developer Workflows

### Daily Status Updates
```bash
# 1. Check current stories
specdeck list stories --feature CLI-CORE

# 2. Update status as you work
# Edit specdeck/releases/R1-foundation/CLI-CORE.md:
# Change Status column from 'in_progress' to 'in_review'

# 3. Validate changes
specdeck validate all
specdeck list stories --feature CLI-CORE # Verify update
```

### Creating New Stories
```bash
# 1. Identify the feature
specdeck list features

# 2. Edit the feature file
# File: specdeck/releases/R1-foundation/CLI-CORE.md
# Add new row to the Stories table

# 3. Use next available story number
# If last story is CLI-CORE-04, use CLI-CORE-05

# 4. Validate
specdeck validate all
```

### Checking Progress
```bash
# View all stories
specdeck list stories

# View specific feature
specdeck list stories --feature CLI-CORE

# View release hierarchy
specdeck releases list --with-features
specdeck list features --with-stories

# Get JSON for scripting
specdeck list stories --json
specdeck list features --json
```

---

## Validation Rules

SpecDeck validates:

1. **File Structure:**
   - Release overview file exists: `specdeck/releases/R*.md`
   - Feature directory exists: `specdeck/releases/R*/`
   - Feature files have `.md` extension

2. **YAML Front Matter:**
   - Release files have `id`, `title`, `timeframe`
   - Feature files have `feature`, `release`

3. **Story Table:**
   - ⚠️ EXACTLY ONE table per feature file
   - All required columns present: ID, Title, Status, Complexity
   - Story IDs match pattern: `FEATURE-NUMBER`
   - Status values are valid: planned, in_progress, in_review, blocked, done
   - Complexity values are valid: XS, S, M, L, XL

4. **Story IDs:**
   - IDs match feature: CLI-CORE-01 in CLI-CORE.md
   - IDs are unique within feature
   - Numbers are sequential (gaps OK, duplicates NOT OK)

**Run validation:**
```bash
specdeck validate all
```

---

## Migration from Old Structure

If you have old files in this format:
```
openspec/releases/R1-foundation.md  (features)
specdeck/releases/R1-foundation.md  (stories in one table)
```

Run migration:
```bash
# Check what will change
specdeck migrate check

# Preview without changes
specdeck migrate --dry-run

# Execute migration
specdeck migrate
```

**Migration creates:**
- `specdeck/releases/R1-foundation.md` (overview)
- `specdeck/releases/R1-foundation/FEATURE.md` (one per feature)
- Backup: `openspec/releases.backup/`

---

## Common Mistakes to Avoid

### ❌ Multiple Tables
```markdown
## High Priority
| ID | Title | Status |
|----|-------|--------|
| CLI-CORE-01 | Setup | done |

## Low Priority
| ID | Title | Status |
|----|-------|--------|
| CLI-CORE-02 | Docs | planned |
```
**Problem:** Only first table is parsed, CLI-CORE-02 is lost!

**Fix:** Use single table with Priority column if needed.

### ❌ Wrong Story ID in File
```markdown
File: specdeck/releases/R1-foundation/CLI-CORE.md

| ID | Title | Status |
|----|-------|--------|
| REL-01-01 | Setup | done |  ← WRONG! Doesn't match CLI-CORE
```
**Problem:** Story won't be found when listing CLI-CORE feature.

**Fix:** Use CLI-CORE-01 or move to REL-01.md file.

### ❌ Missing Required Columns
```markdown
| ID | Title |
|----|-------|
| CLI-CORE-01 | Setup |
```
**Problem:** Missing Status and Complexity columns.

**Fix:** Add all required columns.

### ❌ Invalid Status Values
```markdown
| ID | Title | Status |
|----|-------|--------|
| CLI-CORE-01 | Setup | completed |  ← WRONG! Use 'done'
| CLI-CORE-02 | Tests | todo |       ← WRONG! Use 'planned'
```
**Problem:** Parser expects exact values.

**Fix:** Use: planned, in_progress, in_review, blocked, done

---

## Tips for LLMs Working with SpecDeck

1. **Always read the feature file first** before adding/updating stories
2. **Check existing Story IDs** to avoid duplicates
3. **Use next sequential number** (if last is 04, use 05)
4. **Maintain consistent column order** across all edits
5. **Preserve existing columns** when editing (don't remove optional columns if present)
6. **Keep single table structure** - never split into multiple tables
7. **Validate after changes:** `specdeck validate all`
8. **Check featureId matches filename:** CLI-CORE-01 in CLI-CORE.md

---

## Quick Troubleshooting

**Stories not showing up?**
- Check you're editing the right feature file
- Verify Story ID matches feature (CLI-CORE-01 in CLI-CORE.md)
- Run `specdeck validate all` to see errors
- Ensure YAML front matter exists

**Parser not finding table?**
- Check there's only ONE table in the file
- Ensure table has header row with `|---|---|`
- Verify required columns: ID, Title, Status, Complexity

**Validation errors?**
- Check Status values: planned, in_progress, in_review, blocked, done
- Check Complexity values: XS, S, M, L, XL
- Verify Story ID format: FEATURE-NUMBER (e.g., CLI-CORE-01)
- Ensure YAML front matter has feature and release fields

<!-- SPECDECK:END -->

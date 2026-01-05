---
title: SpecDeck Commands Cheatsheet
description: Quick reference for all SpecDeck CLI commands
version: 0.4.0
---

# SpecDeck Commands Cheatsheet

Quick reference for all SpecDeck CLI commands and common usage patterns.

## Project Setup

### Initialize Project

Create SpecDeck project structure with assistant templates:

```bash
specdeck init copilot
specdeck init windsurf
```

**What it creates**:
- `specdeck/` - Project planning directory
  - `project-plan.md` - High-level roadmap
  - `vision.md` - Product vision
  - `AGENTS.md` - LLM instructions
  - `releases/R1-foundation.md` - Detailed story tracking
- `openspec/` - (Optional) OpenSpec framework directory
  - `project.md` - Project context
  - `AGENTS.md` - OpenSpec workflow instructions
- `.github/prompts/` - Copilot prompt templates
  - `specdeck-decompose.prompt.md`
  - `specdeck-status.prompt.md`
  - `specdeck-release-create.prompt.md`
  - `specdeck-release-status.prompt.md`
  - `specdeck-release-sync.prompt.md`
- `.windsurf/workflows/` - Windsurf workflow templates
  - `specdeck-decompose.md`
  - `specdeck-status.md`
  - `specdeck-release-create.md`
  - `specdeck-release-status.md`
  - `specdeck-release-sync.md`
- `.specdeck.config.json` - Configuration file
- `.specdeck-version` - Version tracking

**Use when**:
- Starting new project
- Adding SpecDeck to existing project
- Setting up GitHub Copilot integration

---

## List Commands

### List Releases

Show all releases in the roadmap:

```bash
specdeck releases list
```

**Output**: Release IDs, titles, timeframe, feature counts

**Use when**:
- Planning work across releases
- Understanding project roadmap
- Checking active release

---

### List Features

Show all features in the current release:

```bash
specdeck list features
```

**Output**: Feature IDs, titles, and descriptions

**Common flags**:
- `--json` - Output as JSON for scripting
- `--release R1` - Show features from specific release
- `--all` - Show features from all releases

**Examples**:
```bash
# Human-readable format (active release)
specdeck list features

# Specific release
specdeck list features --release R2

# JSON for scripts
specdeck list features --json
```

**Use when**:
- Planning sprint
- Decomposing features
- Checking feature scope

---

### List Stories

Show all stories or filter by feature:

```bash
# All stories in active release
specdeck list stories

# Stories for specific feature
specdeck list stories --feature CLI-CORE
specdeck list stories -f CLI-CORE

# Stories from specific release
specdeck list stories --release R1

# Stories from all releases
specdeck list stories --all
```

**Output**: Story ID, title, status, complexity, owner (plus Jira/Repo in coordinator mode)

**Common flags**:
- `--feature, -f <id>` - Filter by feature ID
- `--release <id>` - Show specific release
- `--json` - Output as JSON
- `--with-jira` - Include Jira from overlays (coordinator mode)
- `--global` - Show repo prefix (coordinator mode)
- `--repo <name>` - Filter to submodule (coordinator mode)
- `--no-cache` - Live-read submodules and overlays (coordinator mode)

**Examples**:
```bash
# All stories in active release
specdeck list stories

# Filter by feature
specdeck list stories --feature CLI-CORE

# Specific release
specdeck list stories --release R1

# JSON output
specdeck list stories --json

# Combine filters
specdeck list stories -f CLI-CORE --release R1 --json
```

**Use when**:
- Checking story status
- Planning daily work
- Reviewing backlog
- Filtering by feature area

---

## Upgrade Commands

### Upgrade Templates and Workflows

Update installed prompt templates to latest version:

```bash
specdeck upgrade
```

**What it does**:
- Compares installed vs bundled version
- Creates backups in target directories (`.github/prompts/`, `.windsurf/workflows/`)
- Replaces templates and workflows with new versions
- Updates `.specdeck-version` file
- Shows changelog of changes

**Common flags**:
- `--force` - Skip backup
- `--template <name>` - Upgrade specific template only
- `--list` - Show available templates and versions

**Examples**:
```bash
# Upgrade all templates
specdeck upgrade

# Skip backup (use with caution)
specdeck upgrade --force

# Upgrade specific template
specdeck upgrade --template decompose

# List available templates
specdeck upgrade --list
```

**Use when**:
- After upgrading SpecDeck CLI
- When templates have new features
- Templates feel outdated
- Periodic maintenance

---

## Jira Sync Helpers (Coordinator Mode)

### Jira Sync Plan

List stories that need Jira reconciliation (missing Jira, conflicts, status mismatches):

```bash
specdeck jira sync-plan --global --json
```

**Common flags**:
- `--feature <id>` - Filter by feature
- `--repo <name>` - Filter to a submodule
- `--no-cache` - Live-read submodules and overlays
- `--json` - Machine output for automation

### Story Details (multi-ID)

Show full details for one or more stories (overlay Jira included):

```bash
specdeck stories show AUTH-01-01 FE-AUTH-01-02 --with-jira --all-fields --global --json
```

**Common flags**:
- `--repo <name>` - Filter to a submodule
- `--no-cache` - Live-read submodules and overlays
- `--with-jira` - Include Jira from overlays
- `--all-fields` - Show all columns (owner, estimate, milestone, tags, notes)

---

## Global Flags

Available on all commands:

```bash
--json        # Output as JSON
--help, -h    # Show command help
--version, -v # Show CLI version
```

**Examples**:
```bash
# Get help for any command
specdeck list features --help
specdeck migrate --help

# Check CLI version
specdeck --version
```

---

## Common Workflows

### Daily Development

```bash
# 1. Check what you're working on
specdeck list stories --feature MY-FEATURE

# 2. Update story status in project-plan.md as you work
# (manual edit)
```

### Sprint Planning

```bash
# 1. Review all features
specdeck list features

# 2. Check stories for each feature
specdeck list stories --feature FEATURE-01
specdeck list stories --feature FEATURE-02

# 3. Identify work for sprint
# (use output to plan)
```

### Setting Up Copilot

```bash
# 1. Initialize templates
specdeck init copilot

# 2. Verify installation
ls -la .github/prompts/

# 3. Check AGENTS.md was updated
cat AGENTS.md
```

### Keeping Templates Updated

```bash
# 1. Upgrade SpecDeck CLI
npm install -g specdeck@latest

# 2. Check template status
specdeck upgrade --list

# 3. Upgrade templates
specdeck upgrade

# 4. Review changes in backup if needed
ls -la .github/prompts/.backup-*/
```

---

## Scripting with JSON Output

### Get Feature IDs

```bash
specdeck list features --json | jq -r '.[].id'
```

### Count Stories by Status

```bash
specdeck list stories --json | jq 'group_by(.status) | map({status: .[0].status, count: length})'
```

### List Stories for Feature

```bash
specdeck list stories --feature CLI-CORE --json | jq -r '.[].title'
```

---

## Tips

### Filtering Output

Use standard Unix tools:

```bash
# Find stories with "test" in title
specdeck list stories | grep -i test

# Count total stories
specdeck list stories | wc -l

# Get only planned stories
specdeck list stories | grep "planned"
```

### Aliases

Add to your `.bashrc` or `.zshrc`:

```bash
alias sd='specdeck'
alias sdlf='specdeck list features'
alias sdls='specdeck list stories'
```

Usage:
```bash
sd list features
sdls -f CLI-CORE
```

### Checking Installed Version

```bash
specdeck --version
```

### Getting Help

```bash
# General help
specdeck --help

# Command-specific help
specdeck list --help
specdeck migrate --help
specdeck init --help
specdeck upgrade --help
```

---

## Quick Reference Table

| Command | Purpose | Common Usage |
|---------|---------|--------------|  
| `releases list` | Show releases | Planning |
| `list features` | Show features | Sprint planning |
| `list stories` | Show stories | Daily work |
| `list stories -f ID` | Filter by feature | Focus on area |
| `migrate` | Consolidate files | After split structure |
| `init copilot` | Install templates | Project setup |
| `init windsurf` | Install templates | Project setup |
| `upgrade` | Update templates | Maintenance |## File Locations

| File | Purpose |
|------|---------|
| `openspec/project.md` | Project overview |
| `openspec/releases/*.md` | Release definitions |
| `openspec/changes/*/` | Active OpenSpec changes |
| `openspec/changes/archive/*/` | Archived changes |
| `project-plan.md` | Stories by feature |
| `.github/prompts/*.prompt.md` | Copilot templates |
| `AGENTS.md` | AI assistant instructions |
| `.specdeck-version` | Template version tracking |

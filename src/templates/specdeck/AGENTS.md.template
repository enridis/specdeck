<!-- SPECDECK:START -->
# SpecDeck Tool Instructions

**Purpose:** SpecDeck is a CLI tool for managing engineering stories and project planning through Git-based Markdown files. It uses a two-tier planning structure for scalability and supports both standalone usage and integration with external tools (Jira, OpenSpec).

---

## Quick Reference

### CLI Commands
```bash
# Project initialization
specdeck init copilot              # Create specdeck/ and .github/prompts/

# Story management
specdeck list stories               # List all stories in active release
specdeck list stories --feature SDK # Filter by feature
specdeck list features              # List all features

# Status updates (developer workflow)
specdeck sync status                # Sync with OpenSpec (if configured)

# Validation
specdeck validate all               # Validate all SpecDeck files
```

### Copilot Prompts
Installed in `.github/prompts/` with `specdeck-` prefix:
- `specdeck-update-status.prompt.md` - Update story statuses during development
- `specdeck-create-story.prompt.md` - Create new stories
- `specdeck-decompose-feature.prompt.md` - Break features into stories
- `specdeck-sync-workflow.prompt.md` - Sync status with git/PR workflow

---

## Two-Tier Planning Structure

SpecDeck uses a two-tier approach to keep files manageable as projects scale:

### 1. High-Level Roadmap (`specdeck/project-plan.md`)
**Purpose:** Strategic overview of all releases

**Format:**
```markdown
# Project Roadmap

## R1 - Foundation
**Status:** in_progress  
**Timeline:** Q1 2025  
**Stories:** 15 total, 8 done, 3 in progress  
**Details:** [R1 Stories](./releases/R1-foundation.md)

**Goals:**
- Set up core project infrastructure
- Implement basic CLI functionality
- Establish development workflow

## R2 - Advanced Features
**Status:** planned  
**Timeline:** Q2 2025  
**Stories:** 0 total  
**Details:** [R2 Stories](./releases/R2-features.md)

**Goals:**
- Advanced validation
- Multi-repository support
```

**Key Fields:**
- `Status`: `planned` | `in_progress` | `done`
- `Timeline`: Quarter or date range
- `Stories`: Counts (total, done, in progress)
- `Details`: Link to detailed release file
- `Goals`: 3-5 high-level objectives

### 2. Detailed Release Files (`specdeck/releases/R*.md`)
**Purpose:** Per-release story tracking with full details

**Minimal Format (standalone projects):**
```markdown
# R1 - Foundation

## Stories

| ID | Title | Status | Complexity | Owner | Description |
|----|-------|--------|------------|-------|-------------|
| SDK-01-01 | Set up repository | done | S | @alice | Initialize Git, add configs |
| SDK-01-02 | Implement CLI | in_progress | M | @bob | Commander.js setup, commands |
| SDK-01-03 | Write docs | planned | S | @carol | README, getting started guide |
```

**Extended Format (with external tool integration):**
```markdown
| ID | Title | Status | Complexity | Owner | Estimate | Jira | OpenSpec | Tags | Description |
|----|-------|--------|------------|-------|----------|------|----------|------|-------------|
| SDK-01-01 | Setup repo | done | S | @alice | 3 | PROJ-123 | add-foundation | infra, setup | Init Git, configs |
| SDK-01-02 | Implement CLI | in_progress | M | @bob | 8 | PROJ-124 | add-foundation | cli, core | Commander setup |
```

**Column Reference:**

**Required Columns:**
| Column | Values | Description |
|--------|--------|-------------|
| ID | PREFIX-FEATURE-NUMBER | Universal identifier across all repos (e.g., SDK-01-01) |
| Title | Text | Brief story description (3-8 words) |
| Status | planned, in_progress, in_review, blocked, done | Current state |
| Complexity | XS, S, M, L, XL | Estimated effort |
| Owner | @username or team | Person/team responsible |

**Optional Columns (use as needed):**
| Column | Values | Description |
|--------|--------|-------------|
| Description | Text | Detailed explanation of work |
| Estimate | Number | Story points or hours |
| Jira | Ticket ID | Jira reference (for Jira users) |
| OpenSpec | Change ID | OpenSpec change reference |
| Tags | Comma-separated | Categories/labels |
| Notes | Text | Additional context |

---

## Multi-Repository Pattern

**Use Case:** Large organizations with multiple repos working on related features.

**Pattern:**
```
main-repo/
  specdeck/releases/R1-foundation.md
  | ID | Title | Status | Owner | Jira | OpenSpec | Description |
  | SDK-01-01 | Auth API | done | @team | PROJ-123 | add-auth | Full details |

frontend-repo/
  specdeck/releases/R1-foundation.md  
  | ID | Title | Status | Owner | Description |
  | SDK-01-01 | Auth API | done | @frontend | Implement login UI (references SDK-01-01) |

backend-repo/
  specdeck/releases/R1-foundation.md
  | ID | Title | Status | Owner | Description |
  | SDK-01-01 | Auth API | done | @backend | Auth endpoints (references SDK-01-01) |
```

**Key Principles:**
1. **Story ID is universal** - Same ID across all repos
2. **Main repo has full details** - Jira links, full descriptions
3. **Other repos reference by ID** - Simpler tables, link back to main repo
4. **Status tracked independently** - Each repo tracks its own implementation status

---

## Story Status Values

| Status | Meaning | When to Use |
|--------|---------|-------------|
| `planned` | Not started, in backlog | Story defined but no work begun |
| `in_progress` | Actively being worked on | Developer has started implementation |
| `in_review` | Code complete, under review | PR open, awaiting approval |
| `blocked` | Waiting on dependency | Cannot proceed due to external factor |
| `done` | Completed and merged | Work finished, code in main branch |

---

## Story ID Format

**Pattern:** `PREFIX-FEATURE-NUMBER`
- `PREFIX`: 2-8 uppercase letters (project/repo identifier)
- `FEATURE`: 2-digit feature number
- `NUMBER`: 2-digit story number within feature

**Examples:**
- `SDK-01-01` - SDK project, feature 01, story 01
- `AUTH-02-05` - AUTH module, feature 02, story 05
- `FRONTEND-03-12` - Frontend repo, feature 03, story 12

**Purpose:** Story IDs serve as universal identifiers across:
- All repositories in multi-repo projects
- Jira tickets
- OpenSpec changes
- Git commits (via commit messages)
- Code comments

---

## Developer Workflows

### Daily Status Updates
```bash
# 1. Check current stories
specdeck list stories

# 2. Update status as you work
# Edit specdeck/releases/R1-foundation.md:
# Change Status column from 'in_progress' to 'in_review'

# 3. Sync and validate
specdeck sync status
specdeck validate all
```

### Creating New Stories
```markdown
# Add row to specdeck/releases/R1-foundation.md:
| SDK-04-03 | Add caching | planned | M | @you | Implement Redis caching layer |
```

### Multi-Repo Coordination
```bash
# Main repo (has Jira links)
# specdeck/releases/R1-foundation.md
| SDK-05-01 | User profile | in_progress | L | @team | JIRA-456 | Full user profile feature |

# Frontend repo (references same ID)
# specdeck/releases/R1-foundation.md  
| SDK-05-01 | User profile UI | in_progress | M | @frontend | Profile components and forms |

# Backend repo (references same ID)
# specdeck/releases/R1-foundation.md
| SDK-05-01 | User profile API | done | M | @backend | REST endpoints for profiles |
```

---

## Integration with OpenSpec (Optional)

If your project uses OpenSpec for specification-driven development:

1. **Link stories to OpenSpec changes:**
   ```markdown
   | ID | Title | Status | OpenSpec |
   | SDK-01-01 | Add feature | in_progress | add-feature-xyz |
   ```

2. **OpenSpec workflow instructions:** See `@openspec/AGENTS.md`

3. **Use `specdeck sync status`** to reconcile story status with OpenSpec change status

**Note:** OpenSpec integration is completely optional. SpecDeck works standalone for pure story tracking.

---

## File Locations

```
project-root/
├── specdeck/                      # SpecDeck tool files (always present)
│   ├── project-plan.md            # Roadmap (all releases)
│   ├── vision.md                  # Product vision
│   ├── AGENTS.md                  # This file
│   └── releases/                  # Per-release details
│       ├── R1-foundation.md       # Active release
│       ├── R2-features.md         # Future release
│       └── archive/               # Completed releases
│           └── R0-mvp.md
├── openspec/                      # Optional: OpenSpec framework (if configured)
│   ├── project.md
│   ├── AGENTS.md
│   └── specs/
└── .github/
    └── prompts/                   # Copilot templates (specdeck-*.prompt.md)
```

---

## Common Tasks

### Add a New Story
1. Open `specdeck/releases/R1-foundation.md`
2. Add row to story table with all required columns
3. Run `specdeck validate all` to check format
4. Commit and push

### Update Story Status
1. Open release file
2. Change `Status` column value
3. Optionally run `specdeck sync status` if using OpenSpec
4. Commit changes

### Create New Release
1. Create `specdeck/releases/R2-newrelease.md`
2. Copy structure from R1 template
3. Add entry to `specdeck/project-plan.md`
4. Run `specdeck validate all`

### Archive Completed Release
1. Update status to `done` in `project-plan.md`
2. Move `releases/R1-foundation.md` → `releases/archive/`
3. Commands can still access with `--all` flag

---

## Tips for LLMs

1. **Always validate after changes:** Run `specdeck validate all`
2. **Story IDs are immutable:** Never change an existing story ID
3. **Status values are strict:** Use exact values (planned, in_progress, in_review, blocked, done)
4. **Multi-repo awareness:** Same story ID can exist in multiple repos with different details
5. **Optional fields:** Jira, OpenSpec, Estimate, Tags, Notes are optional - omit if not needed
6. **Table alignment:** Keep Markdown tables aligned for readability
7. **Link preservation:** Maintain links between roadmap and release files

---

For more details, run `specdeck help` or see project README.
<!-- SPECDECK:END -->


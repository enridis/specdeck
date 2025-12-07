---
title: Story Status Sync Workflow
description: Guide for keeping story statuses up-to-date during development
version: 0.1.0
---

# Story Status Sync Workflow

This guide explains how to keep story statuses accurate throughout the development lifecycle.

## Overview

SpecDeck helps you track story progress through Git-based Markdown files. Keeping statuses current ensures:
- Team visibility into work in progress
- Accurate project tracking
- Clear handoffs and reviews

**Key principle:** Status updates are **intentionally manual** to ensure you review and approve each change.

## When to Update Status

Update story status when:
- ✅ Starting work on a story
- ✅ Opening a PR for review
- ✅ Merging code to main branch
- ✅ Encountering blockers
- ✅ Before standups or sprint reviews

## Developer Workflow

### 1. Starting Work

**Before starting:**
```bash
# Check current stories
specdeck list stories
```

**Update story status:**
1. Open `specdeck/releases/R1-foundation.md`
2. Find your story row
3. Change `Status` from `planned` to `in_progress`
4. Commit the change

```markdown
| ID | Title | Status | Complexity | Owner |
|----|-------|--------|------------|-------|
| CLI-01-01 | Implement parser | in_progress | M | @you |
```

### 2. Code Complete → Review

**When PR is ready:**
1. Open release file
2. Change status from `in_progress` to `in_review`
3. Commit with PR

```markdown
| CLI-01-01 | Implement parser | in_review | M | @you |
```

### 3. Merged → Done

**After PR merges:**
1. Open release file
2. Change status from `in_review` to `done`
3. Commit the update

```markdown
| CLI-01-01 | Implement parser | done | M | @you |
```

### 4. Encountering Blockers

**When blocked:**
1. Change status to `blocked`
2. Add comment or note explaining the blocker
3. Commit with explanation

```markdown
| CLI-01-01 | Implement parser | blocked | M | @you |

**Blockers:**
- CLI-01-01: Waiting for API spec review (see #123)
```

## Status Values

| Status | Meaning | Next Action |
|--------|---------|-------------|
| `planned` | Not started | Update to `in_progress` when you begin |
| `in_progress` | Actively coding | Update to `in_review` when PR ready |
| `in_review` | PR open, awaiting review | Update to `done` when merged |
| `blocked` | Waiting on dependency | Update to previous status when unblocked |
| `done` | Merged and verified | Story complete |

## Status Transition Flow

```
planned
  ↓ (start work)
in_progress
  ↓ (open PR)
in_review
  ↓ (PR merged)
done

         blocked
         ↓ (resolved)
    (back to previous status)
```

## Sync with External Tools (Optional)

If using Jira or OpenSpec, link stories via optional columns:

```markdown
| ID | Title | Status | Owner | Jira | OpenSpec |
|----|-------|--------|-------|------|----------|
| CLI-01-01 | Parser | done | @you | PROJ-123 | add-cli |
```

**Sync workflow with OpenSpec:**
```bash
specdeck sync status  # Check for stories linked to archived changes
```

This compares story status with archived OpenSpec changes and suggests updates. Always review before updating manually.

## Common Scenarios

### Scenario 1: Daily Development

```bash
# Morning: Check your stories
specdeck list stories --feature CLI-CORE

# Start work on CLI-01-02
# → Edit release file, set status to 'in_progress'
# → Commit change

# Afternoon: PR ready
# → Edit release file, set status to 'in_review'  
# → Commit with PR

# Next day: PR merged
# → Edit release file, set status to 'done'
# → Commit update
```

### Scenario 2: Sprint Review

```bash
# Before review: Check all story statuses
specdeck list stories

# Update any stale statuses:
# - Work started but status still 'planned'? Update to 'in_progress'
# - PRs merged but status still 'in_review'? Update to 'done'
# - Work blocked? Update to 'blocked' with notes

# Commit all updates together
```

### Scenario 3: Team Handoff

When handing off work:
1. Update your story status to current state
2. Add notes about next steps
3. Change `Owner` if needed
4. Commit with handoff context

```markdown
| CLI-01-03 | Add tests | in_progress | M | @newdev |

**Notes:**
- CLI-01-03: Basic structure done, need integration tests
```

## Multi-Repository Projects

In multi-repo projects, each repo tracks its own story statuses:

**Main repo** (`main-repo/specdeck/releases/R1-foundation.md`):
```markdown
| CLI-01-01 | Auth API | done | @team | Full feature complete |
```

**Frontend repo** (`frontend-repo/specdeck/releases/R1-foundation.md`):
```markdown
| CLI-01-01 | Auth UI | in_progress | @frontend | Login form in progress |
```

**Backend repo** (`backend-repo/specdeck/releases/R1-foundation.md`):
```markdown
| CLI-01-01 | Auth endpoints | done | @backend | API complete |
```

Same story ID, different statuses reflecting each repo's progress.

## Tips for Keeping Status Current

1. **Update with commits**: Update status as part of your commit workflow
2. **Batch related stories**: Update multiple stories in one commit when appropriate
3. **Use descriptive commits**: "Update CLI-01-01 status to done" is clear
4. **Regular checks**: Review statuses during standups
5. **Automate reminders**: Add pre-commit hook or CI check
6. **Keep notes**: Add context for blocked or complex stories

## Validation

Always validate after updating:

```bash
specdeck validate all
```

This checks:
- Correct status values
- Table formatting
- Required columns present
- Story ID format

## Reference Commands

```bash
# List stories
specdeck list stories                    # Active release
specdeck list stories --feature CLI-CORE # Specific feature
specdeck list stories --all              # All releases

# Check sync status (if using OpenSpec)
specdeck sync status

# Validate
specdeck validate all
```

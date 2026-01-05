---
title: Story Status Reference
description: Complete reference for story status values and transitions
version: 0.4.0
---

# Story Status Reference

This guide defines all story status values used in SpecDeck and explains when to use each one.

## Status Values

### planned
**Definition**: Story is defined but work hasn't started

**When to use**:
- Story is newly created in `project-plan.md`
- Story is in the backlog
- Story is scheduled for future sprint

**Characteristics**:
- No code has been written
- Story may have dependencies blocking it
- Acceptance criteria are defined

**Next steps**:
- Review story requirements
- Update to `in_progress` when starting work
- Refine acceptance criteria if needed

**Example**:
```markdown
| CLI-CORE-05 | Add error handling | planned | 5 | 2 days |
```

---

### in_progress
**Definition**: Actively being worked on

**When to use**:
- Developer has started implementing the story
- Code is being written or tested
- Work is ongoing but not ready for review

**Characteristics**:
- Branch exists with commits
- Some acceptance criteria may be met
- Not yet ready for PR/review

**Next steps**:
- Complete implementation
- Ensure all acceptance criteria met
- Update to `in_review` when PR is created

**Example**:
```markdown
| CLI-CORE-03 | Implement list command | in_progress | 3 | 1 day |
```

---

### in_review
**Definition**: Code complete, awaiting peer review

**When to use**:
- PR/MR has been created
- All acceptance criteria met
- Code is ready for team review

**Characteristics**:
- Pull request is open
- All tests passing
- Documentation updated
- Ready for approval

**Next steps**:
- Address review comments
- Update to `done` when merged
- May return to `in_progress` if changes needed

**Example**:
```markdown
| CLI-CORE-02 | Add JSON output | in_review | 2 | 0.5 days |
```

---

### blocked
**Definition**: Waiting on external dependency or decision

**When to use**:
- Cannot proceed due to external factor
- Waiting for another story to complete
- Needs clarification or decision
- Technical blocker discovered

**Characteristics**:
- Work has paused
- Clear blocker identified
- Add comment explaining what's blocking
- Previous status noted for return

**Next steps**:
- Resolve blocker
- Return to previous status (usually `in_progress`)
- Document resolution in comments

**Example**:
```markdown
| CLI-CORE-06 | Add database support | blocked | 8 | 3 days |
<!-- Blocked: Waiting for database schema approval -->
```

**Common blockers**:
- Dependency on another team
- Architecture decision needed
- External API not available
- Design review required
- Infrastructure not ready

---

### done
**Definition**: Merged, verified, and complete

**When to use**:
- Code is merged to main branch
- All acceptance criteria verified
- Changes deployed/released
- Story is fully complete

**Characteristics**:
- PR merged
- Tests passing in main
- No known issues
- Documented if needed

**Next steps**:
- None - story is complete
- May create new stories for enhancements
- Update related documentation

**Example**:
```markdown
| CLI-CORE-01 | Basic command structure | done | 3 | 1 day |
```

## Status Transitions

### Valid Transitions

```
planned → in_progress
  Start work on story

in_progress → in_review
  Create PR, ready for review

in_review → in_progress
  Changes requested in review

in_review → done
  PR merged successfully

planned → blocked
  Blocker discovered during planning

in_progress → blocked
  Blocker discovered during implementation

blocked → planned
  Blocker resolved, not yet started

blocked → in_progress
  Blocker resolved, resume work

in_progress → planned
  Work paused, returning to backlog (rare)
```

### Invalid Transitions

```
❌ planned → done
   Must go through in_progress and in_review

❌ planned → in_review
   Cannot review what hasn't been implemented

❌ blocked → done
   Must resolve blocker first

❌ done → any other status
   Done is final (create new story for changes)
```

## Status Transition Examples

### Example 1: Normal Flow

```markdown
Day 1:
| CLI-CORE-10 | Add tests | planned | 3 | 1 day |

Day 2 (start work):
| CLI-CORE-10 | Add tests | in_progress | 3 | 1 day |

Day 2 (PR created):
| CLI-CORE-10 | Add tests | in_review | 3 | 1 day |

Day 3 (PR merged):
| CLI-CORE-10 | Add tests | done | 3 | 1 day |
```

### Example 2: With Changes Requested

```markdown
Day 1:
| CLI-CORE-11 | Fix bug | in_progress | 2 | 0.5 days |

Day 2 (PR created):
| CLI-CORE-11 | Fix bug | in_review | 2 | 0.5 days |

Day 3 (changes requested):
| CLI-CORE-11 | Fix bug | in_progress | 2 | 0.5 days |

Day 4 (re-reviewed and merged):
| CLI-CORE-11 | Fix bug | done | 2 | 0.5 days |
```

### Example 3: Blocked Story

```markdown
Week 1:
| CLI-CORE-12 | Integration | planned | 5 | 2 days |

Week 2 (started):
| CLI-CORE-12 | Integration | in_progress | 5 | 2 days |

Week 2 (API not ready):
| CLI-CORE-12 | Integration | blocked | 5 | 2 days |
<!-- Blocked: Waiting for API v2 deployment -->

Week 3 (API ready):
| CLI-CORE-12 | Integration | in_progress | 5 | 2 days |

Week 3 (completed):
| CLI-CORE-12 | Integration | done | 5 | 2 days |
```

## Best Practices

### Keep Status Current
- Update status as soon as transitions happen
- Don't wait until end of day/week
- Status should reflect reality at all times

### Use Blocked Sparingly
- Only use when truly cannot proceed
- Always document what's blocking
- Set expectations for resolution time

### Document Transitions
- Add comments for unusual transitions
- Explain why work was paused/resumed
- Note important context for future reference

### Avoid Status Drift
- Review statuses regularly during standups
- Update statuses with each commit/PR
- Run `specdeck validate all` to check format
- Sync with external tools (Jira, OpenSpec) if applicable

### Clear Completion Criteria
- Ensure acceptance criteria are met before `done`
- Don't mark `done` prematurely
- Verify in production/integration environment

## Common Mistakes

### ❌ Leaving Status Stale
**Problem**: Status doesn't reflect current state  
**Solution**: Update immediately when state changes

### ❌ Skipping Review
**Problem**: Going from `in_progress` to `done`  
**Solution**: Always go through `in_review` for code review

### ❌ Vague Blocked Status
**Problem**: `blocked` without explanation  
**Solution**: Always add comment explaining blocker

### ❌ Premature Done
**Problem**: Marking `done` before merge  
**Solution**: Only use `done` after merge and verification

### ❌ Too Many In Progress
**Problem**: Many stories in `in_progress` simultaneously  
**Solution**: Focus on fewer stories, complete before starting new ones

## Quick Reference

| Status | Emoji | Meaning | Next Status |
|--------|-------|---------|-------------|
| `planned` | 📝 | Not started | `in_progress`, `blocked` |
| `in_progress` | 🚧 | Actively working | `in_review`, `blocked` |
| `in_review` | 👀 | Awaiting review | `done`, `in_progress` |
| `blocked` | 🚫 | Cannot proceed | `planned`, `in_progress` |
| `done` | ✅ | Complete | (final state) |

## Commands for Status Management

```bash
# Check all stories
specdeck list stories

# Filter by status (manually, or use grep)
specdeck list stories | grep "in_progress"

# Release status summary
specdeck releases status R1-foundation

# OpenSpec status hints (optional)
specdeck releases status R1-foundation --source openspec

# OpenSpec sync plan
specdeck releases sync-plan R1-foundation --source openspec
```

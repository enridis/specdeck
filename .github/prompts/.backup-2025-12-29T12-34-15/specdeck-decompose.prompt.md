---
title: Feature Decomposition Guide
description: Template for breaking down features into implementable stories
version: 0.2.0
---

# Feature Decomposition Guide

Use this guide when breaking down a feature into implementable stories.

## Decomposition Principles

### Story Characteristics
Each story should be:
- **Independently Valuable**: Delivers some user value on its own
- **Small**: 2-8 story points, completable in 1-3 days
- **Testable**: Has clear acceptance criteria
- **Well-Scoped**: Focused on single responsibility

### Complexity Scale
- **1-2 points**: Simple, straightforward (<1 day)
  - Clear implementation path
  - Minimal dependencies
  - Well-understood requirements

- **3-5 points**: Moderate complexity (1-2 days)
  - Some design decisions needed
  - Few dependencies
  - May require research

- **8 points**: Complex, requires research (2-3 days)
  - Multiple components involved
  - Design exploration needed
  - External dependencies

- **13+ points**: Too large—break it down further

## Decomposition Process

### Step 1: Understand the Feature
- Read feature description in release file
- Identify user value and objectives
- List technical components involved
- Note dependencies and constraints

### Step 2: Identify Natural Boundaries
Look for:
- User-facing capabilities
- Technical layers (UI, API, data)
- Integration points
- Configuration vs implementation

### Step 3: Create Story List
For each story, define:
- **ID**: `FEATURE-ID-NN` (e.g., `CLI-CORE-01`)
- **Title**: Action-oriented (3-7 words)
- **Description**: What and why
- **Acceptance Criteria**: Testable outcomes
- **Complexity**: Story points (1-8)
- **Estimate**: Time estimate
- **Dependencies**: Prerequisites

### Step 4: Validate Stories
Check that each story:
- [ ] Can be tested independently
- [ ] Delivers some value
- [ ] Is small enough (≤8 points)
- [ ] Has clear acceptance criteria
- [ ] Dependencies are identified
- [ ] Title starts with action verb

### Step 5: Sequence Stories
- Place foundational stories first
- Group related stories together
- Note parallel work opportunities
- Identify critical path

## Example: CLI-CORE Feature

**Feature**: Command-line interface core functionality

### Story 1: CLI-CORE-01
**Title**: Implement basic command structure

**Description**: Set up Commander.js framework with main command entry point and help text.

**Acceptance Criteria**:
- [ ] CLI accepts commands via `specdeck <command>`
- [ ] Help text displays when no command given
- [ ] Version flag (`--version`) works
- [ ] Error messages are helpful

**Complexity**: 3 points  
**Estimate**: 1 day  
**Dependencies**: None

---

### Story 2: CLI-CORE-02
**Title**: Add JSON output format option

**Description**: Implement `--json` global flag to output machine-readable JSON instead of formatted text.

**Acceptance Criteria**:
- [ ] `--json` flag available on all commands
- [ ] Output is valid JSON when flag is used
- [ ] JSON includes all data from formatted output
- [ ] Error handling works with JSON output

**Complexity**: 2 points  
**Estimate**: 0.5 days  
**Dependencies**: CLI-CORE-01

---

### Story 3: CLI-CORE-03
**Title**: Add output formatting utilities

**Description**: Create reusable formatters for tables, lists, and JSON output.

**Acceptance Criteria**:
- [ ] Table formatter handles various column widths
- [ ] List formatter supports nested items
- [ ] JSON formatter handles all data types
- [ ] Formatters are testable in isolation

**Complexity**: 5 points  
**Estimate**: 2 days  
**Dependencies**: CLI-CORE-01

## Common Pitfalls

### ❌ Story Too Large
**Problem**: Story takes >3 days  
**Solution**: Break into smaller pieces
- Separate by user-facing vs internal changes
- Split by technical layers
- Extract setup/configuration into separate story

### ❌ Story Too Vague
**Problem**: Unclear acceptance criteria  
**Solution**: Add specific, testable outcomes
- Use "Given/When/Then" format
- Include example inputs/outputs
- Define edge cases

### ❌ Not Independently Valuable
**Problem**: Can't ship without other stories  
**Solution**: Reframe or combine
- Add minimal UI/API to make it usable
- Combine with dependent story
- Add feature flag for incomplete feature

### ❌ Wrong Granularity
**Problem**: Too detailed or too high-level  
**Solution**: Adjust to appropriate level
- Code-level details belong in tasks, not stories
- High-level goals belong in features, not stories
- Stories describe user-facing capability

### ❌ Missing Dependencies
**Problem**: Blocks later work unexpectedly  
**Solution**: Map dependencies explicitly
- Review technical prerequisites
- Check for shared resources
- Identify integration points

## Tips for Success

1. **Start Small**: Begin with smallest valuable increment
2. **Build Incrementally**: Each story should build on previous ones
3. **Test Early**: Include testing in acceptance criteria
4. **Document As You Go**: Update docs with each story
5. **Review Dependencies**: Ensure proper sequencing
6. **Consider Risks**: Flag complex or uncertain stories
7. **Keep Focused**: Each story should have single responsibility

## Adding Stories to Release Files

Once stories are defined, add them to the current release file in `specdeck/releases/R1-foundation.md`:

```markdown
# R1 - Foundation

## Stories

| ID | Title | Status | Complexity | Owner | Description |
|----|-------|--------|------------|-------|-------------|
| CLI-01-01 | Implement command structure | planned | 3 | @dev | Set up Commander.js with help and version |
| CLI-01-02 | Add JSON output option | planned | 2 | @dev | Implement --json flag for all commands |
| CLI-01-03 | Add formatting utilities | planned | 5 | @dev | Create table, list, JSON formatters |
```

**Optional columns** (add if needed for your project):
- `Estimate`: Story points or time estimate
- `Jira`: Jira ticket reference
- `OpenSpec`: OpenSpec change ID
- `Tags`: Categories/labels
- `Notes`: Additional context

## Reference Commands

Check existing features and stories:
```bash
specdeck list features
specdeck list stories
specdeck list stories --feature CLI-CORE
```

Validate your changes:
```bash
specdeck validate all
```

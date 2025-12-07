# project-plan-parser Specification Delta

## MODIFIED Requirements

### Requirement: Parse project-plan.md from SpecDeck Directory
The parser MUST read `project-plan.md` from `specdeck/` directory.

#### Scenario: Parse stub project-plan.md from specdeck directory
**Given** the user has run `specdeck init copilot`
**And** `specdeck/project-plan.md` was created
**When** the user runs `specdeck validate`
**Then** the parser reads from `specdeck/project-plan.md`
**And** successfully parses the example table
**And** validates all example story IDs match pattern `[A-Z]+-[A-Z0-9]+-\d+`
**And** validates all example status values are valid
**And** validates all example complexity values are valid
**And** reports no validation errors
**And** exits with code 0

#### Scenario: Stub file demonstrates all supported columns
**Given** the stub `specdeck/project-plan.md` file
**When** examined for table structure
**Then** it includes all supported columns: ID, Title, Status, Complexity, Estimate, Owner, Jira, OpenSpec, Tags, Notes
**And** each column has example data demonstrating its format
**And** includes at least one story with OpenSpec reference
**And** includes at least one story with Tags

#### Scenario: Stub file documents column purposes
**Given** the stub `specdeck/project-plan.md` file
**When** the user reads the documentation section
**Then** it explains the purpose of each column
**And** describes valid values for Status (planned, in_progress, in_review, blocked, done)
**And** describes valid values for Complexity (XS, S, M, L, XL)
**And** explains ID format pattern with examples
**And** explains how OpenSpec column links to changes in `openspec/changes/`

# openspec-integration Specification

## Purpose
TBD - created by archiving change add-cli-basic-foundation. Update Purpose after archive.
## Requirements
### Requirement: Parse OpenSpec Changes Directory
The CLI MUST read the `openspec/changes/` directory to discover active and archived OpenSpec changes.

#### Scenario: List active changes
**Given** `openspec/changes/` contains:
- `add-feature-x/` (active)
- `add-feature-y/` (active)
- `archive/2024-12-01-add-feature-z/` (archived)
**When** the CLI reads the changes directory
**Then** it identifies 2 active changes: `add-feature-x`, `add-feature-y`
**And** recognizes 1 archived change: `add-feature-z`

#### Scenario: Determine change state
**Given** an OpenSpec change directory `add-feature-x/`
**And** it contains `proposal.md`, `tasks.md`, and `specs/`
**When** the CLI checks its location
**Then** it determines the change is "active" if in `changes/`
**And** determines the change is "archived" if in `changes/archive/`

#### Scenario: Parse change metadata
**Given** an OpenSpec change with `proposal.md`
**When** the CLI reads the proposal
**Then** it extracts the change ID from the directory name
**And** optionally extracts status from proposal content
**And** identifies if tasks.md exists

#### Scenario: Handle missing changes directory
**Given** `openspec/changes/` does not exist
**When** the CLI attempts to read changes
**Then** it returns an empty list of changes
**And** does not throw an error

### Requirement: Link Stories to OpenSpec Changes
The CLI MUST validate that stories reference existing OpenSpec changes and detect mismatches.

#### Scenario: Validate story OpenSpec reference
**Given** a story with OpenSpec column value "add-feature-x"
**And** OpenSpec change `add-feature-x` exists in `changes/`
**When** validation runs
**Then** the link is validated successfully
**And** no warnings are generated

#### Scenario: Story references non-existent change
**Given** a story with OpenSpec column value "add-feature-z"
**And** no change named `add-feature-z` exists
**When** validation runs
**Then** validation warns "Story references non-existent OpenSpec change: add-feature-z"
**And** suggests running `specdeck sync` or creating the change

#### Scenario: Story references archived change
**Given** a story with status "in_progress"
**And** OpenSpec column references "add-feature-y"
**And** `add-feature-y` is in `changes/archive/`
**When** validation runs
**Then** validation warns "Story references archived change but status is not 'done'"
**And** suggests updating story status or change location

#### Scenario: Multiple stories reference same change
**Given** 3 stories all reference OpenSpec change "add-feature-x"
**When** the CLI processes these stories
**Then** it groups them together
**And** tracks that one OpenSpec change maps to multiple stories

### Requirement: Sync Command for Status Reconciliation
The CLI MUST provide a `specdeck sync` command that detects status mismatches and prompts for updates.

#### Scenario: Sync detects story needing status update
**Given** story `FEAT-01-01` has status "planned"
**And** OpenSpec column is "add-feature-x"
**And** OpenSpec change `add-feature-x` exists and is active
**When** user runs `specdeck sync`
**Then** the CLI displays:
```
Found 1 story with potential status mismatch:
  - FEAT-01-01: OpenSpec change 'add-feature-x' exists but story is 'planned'
    Suggested status: in_progress
Update story status? [y/N]
```
**And** waits for user input

#### Scenario: User confirms status update
**Given** sync detected a mismatch for `FEAT-01-01`
**And** user types "y" at the prompt
**When** confirmation is received
**Then** the CLI updates `project-plan.md`
**And** changes story status from "planned" to "in_progress"
**And** displays "✓ Updated FEAT-01-01 to in_progress"

#### Scenario: User declines status update
**Given** sync detected a mismatch
**And** user types "N" or presses Enter
**When** confirmation is declined
**Then** the CLI displays "Skipped"
**And** does not modify project-plan.md
**And** continues to next mismatch if any

#### Scenario: Sync detects archived change
**Given** story `FEAT-01-02` has status "in_progress"
**And** OpenSpec change is archived in `changes/archive/`
**When** user runs `specdeck sync`
**Then** the CLI suggests changing status to "done"
**And** prompts for confirmation

#### Scenario: Sync with no mismatches
**Given** all stories have status matching their OpenSpec change state
**When** user runs `specdeck sync`
**Then** the CLI displays "All stories are in sync with OpenSpec changes"
**And** exits with code 0

#### Scenario: Sync specific story
**Given** user runs `specdeck sync --story FEAT-01-01`
**When** the command executes
**Then** it only checks and updates the specified story
**And** ignores other stories

#### Scenario: Sync dry-run mode
**Given** user runs `specdeck sync --dry-run`
**When** the command detects mismatches
**Then** it displays what would be updated
**And** does not prompt for confirmation
**And** does not modify project-plan.md

### Requirement: Display Status Hints in Commands
The CLI MUST show visual indicators when story status doesn't match OpenSpec change state.

#### Scenario: List stories with status hints
**Given** feature `FEAT-01` has 3 stories
**And** story `FEAT-01-01` is "planned" but OpenSpec change exists
**And** story `FEAT-01-02` is "in_progress" and change exists (matching)
**And** story `FEAT-01-03` is "in_progress" but change is archived
**When** user runs `specdeck stories list FEAT-01`
**Then** the output displays:
```
┌────────────┬──────────────────┬─────────────┬────────────┬────────┐
│ ID         │ Title            │ Status      │ OpenSpec   │ Hint   │
├────────────┼──────────────────┼─────────────┼────────────┼────────┤
│ FEAT-01-01 │ Story one        │ planned     │ change-x   │ ⚠️ CHG │
│ FEAT-01-02 │ Story two        │ in_progress │ change-y   │        │
│ FEAT-01-03 │ Story three      │ in_progress │ change-z   │ ⚠️ ARC │
└────────────┴──────────────────┴─────────────┴────────────┴────────┘

Legend: ⚠️ CHG = Change exists, ⚠️ ARC = Change archived
Run 'specdeck sync' to reconcile status
```

#### Scenario: Show story with status hint details
**Given** story `FEAT-01-01` has a status mismatch
**When** user runs `specdeck stories show FEAT-01-01`
**Then** the output includes a status check section:
```
OpenSpec Status Check:
  Change: add-feature-x
  State: Active (exists in changes/)
  Story Status: planned
  ⚠️  Mismatch detected: Change exists but story is 'planned'
  Suggestion: Run 'specdeck sync --story FEAT-01-01'
```

#### Scenario: Disable hints flag
**Given** user runs `specdeck stories list FEAT-01 --no-hints`
**When** the command executes
**Then** no status hints are displayed
**And** output shows basic story information only

### Requirement: OpenSpec Change Discovery
The CLI MUST efficiently discover and cache OpenSpec change information during command execution.

#### Scenario: Cache changes for command execution
**Given** user runs `specdeck stories list FEAT-01`
**And** the command needs to check OpenSpec changes for 5 stories
**When** the CLI reads `openspec/changes/`
**Then** it reads the directory once
**And** caches the list of active and archived changes
**And** reuses the cache for all 5 story checks

#### Scenario: Detect change directory structure
**Given** `openspec/changes/add-feature-x/` exists
**And** contains subdirectories: `specs/`, and files: `proposal.md`, `tasks.md`
**When** the CLI inspects this structure
**Then** it confirms this is a valid OpenSpec change
**And** marks it as active

#### Scenario: Handle malformed change directories
**Given** `openspec/changes/invalid-change/` exists
**And** does not contain required files (no proposal.md)
**When** the CLI inspects this directory
**Then** it warns "Invalid OpenSpec change structure: invalid-change"
**And** excludes it from the active changes list

### Requirement: Status Mapping Rules
The CLI MUST apply consistent rules for mapping OpenSpec change state to story status suggestions.

#### Scenario: Map active change to in_progress
**Given** an OpenSpec change exists in `changes/` (active)
**And** story status is "planned"
**When** sync evaluates the mismatch
**Then** it suggests status "in_progress"

#### Scenario: Map archived change to done
**Given** an OpenSpec change exists in `changes/archive/` (archived)
**And** story status is "in_progress" or "in_review"
**When** sync evaluates the mismatch
**Then** it suggests status "done"

#### Scenario: No suggestion for matching status
**Given** story status is "in_progress"
**And** OpenSpec change is active
**When** sync evaluates
**Then** no mismatch is detected
**And** no suggestion is made

#### Scenario: Handle TBA in OpenSpec column
**Given** story has OpenSpec column value "TBA"
**When** sync evaluates
**Then** it does not suggest any status change
**And** does not report a mismatch
**And** optionally suggests creating an OpenSpec change

#### Scenario: Handle blocked status
**Given** story status is "blocked"
**When** sync evaluates
**Then** it does not suggest automatic status changes
**And** respects that blocked requires manual intervention


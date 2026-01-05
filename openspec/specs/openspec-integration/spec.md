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
The CLI MUST provide a sync-plan command that compares SpecDeck story statuses to OpenSpec change state and outputs a reconciliation plan.

#### Scenario: Sync plan detects story needing status update
**Given** story `FEAT-01-01` has status "planned"  
**And** OpenSpec change `add-feature-x` exists and is active  
**When** the user runs `specdeck releases sync-plan R1-foundation --source openspec`  
**Then** the CLI outputs a suggested status update for `FEAT-01-01` (e.g., "in_progress")  
**And** includes the reason "OpenSpec change is active"  
**And** does not modify any files

#### Scenario: Sync plan with JSON output
**Given** OpenSpec changes exist for stories in `R1-foundation`  
**When** the user runs `specdeck releases sync-plan R1-foundation --source openspec --json`  
**Then** the output is a JSON array of proposed updates  
**And** each entry includes storyId, currentStatus, suggestedStatus, and reason  
**And** exits with code 0

#### Scenario: Sync plan with no mismatches
**Given** all stories in `R1-foundation` match their OpenSpec change state  
**When** the user runs `specdeck releases sync-plan R1-foundation --source openspec`  
**Then** the CLI displays "No OpenSpec status mismatches found"  
**And** exits with code 0

### Requirement: Display Status Hints in Commands
The CLI MUST show OpenSpec-derived status hints only when explicitly requested.

#### Scenario: Release status includes OpenSpec hints when requested
**Given** release `R1-foundation` has stories linked to OpenSpec changes  
**When** the user runs `specdeck releases status R1-foundation --source openspec`  
**Then** the output includes per-story OpenSpec state and mismatch hints  
**And** suggests running `specdeck releases sync-plan R1-foundation --source openspec` for details

#### Scenario: Hints are disabled by default
**Given** OpenSpec changes exist  
**When** the user runs `specdeck releases status R1-foundation` without `--source openspec`  
**Then** no OpenSpec hints are shown  
**And** the command remains SpecDeck-only

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

### Requirement: Optional OpenSpec Status Source
The CLI MUST treat OpenSpec as an optional status source and degrade gracefully when it is missing.

#### Scenario: OpenSpec missing but requested
**Given** `openspec/changes/` does not exist  
**When** the user runs `specdeck releases status R1-foundation --source openspec`  
**Then** the CLI warns that OpenSpec is unavailable  
**And** continues with SpecDeck-only status  
**And** exits with code 0

#### Scenario: OpenSpec missing for sync plan
**Given** `openspec/changes/` does not exist  
**When** the user runs `specdeck releases sync-plan R1-foundation --source openspec`  
**Then** the CLI warns that OpenSpec is unavailable  
**And** returns an empty plan  
**And** exits with code 0


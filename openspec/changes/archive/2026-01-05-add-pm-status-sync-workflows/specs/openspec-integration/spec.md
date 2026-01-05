## MODIFIED Requirements
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

## ADDED Requirements
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

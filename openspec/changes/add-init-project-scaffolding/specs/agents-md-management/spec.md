# agents-md-management Specification Delta

## ADDED Requirements

### Requirement: Separate AGENTS.md Files for Framework and Tool
The CLI MUST create two distinct AGENTS.md files: one for OpenSpec framework instructions and one for SpecDeck tool instructions.

#### Scenario: OpenSpec AGENTS.md contains framework workflow
**Given** the user has run `specdeck init copilot`
**When** the user opens `openspec/AGENTS.md`
**Then** the file header states "OpenSpec Framework Instructions"
**And** contains instructions for creating proposals following OpenSpec workflow
**And** documents spec format conventions (ADDED/MODIFIED/REMOVED Requirements)
**And** documents scenario format (Given/When/Then)
**And** includes validation requirements (`openspec validate --strict`)
**And** references change directory structure (`openspec/changes/<id>/`)
**And** includes link to `specdeck/AGENTS.md` for tool-specific commands
**And** does NOT include SpecDeck CLI commands

#### Scenario: SpecDeck AGENTS.md contains tool instructions
**Given** the user has run `specdeck init copilot`
**When** the user opens `specdeck/AGENTS.md`
**Then** the file header states "SpecDeck Tool Instructions"
**And** contains SpecDeck CLI commands reference:
  - `specdeck list releases|features|stories`
  - `specdeck sync status`
  - `specdeck validate`
**And** documents `project-plan.md` table structure and columns
**And** includes story decomposition workflow guidance
**And** links to `.github/prompts/` for detailed prompt templates
**And** explains how stories link to OpenSpec changes (via OpenSpec column)
**And** includes link to `openspec/AGENTS.md` for framework workflow
**And** does NOT include OpenSpec proposal/spec creation instructions

#### Scenario: AI assistant reads both AGENTS.md files
**Given** both `openspec/AGENTS.md` and `specdeck/AGENTS.md` exist
**And** AI assistant is asked to help with project planning
**When** AI assistant reads context
**Then** AI finds both AGENTS.md files
**And** uses `openspec/AGENTS.md` for creating proposals and specs
**And** uses `specdeck/AGENTS.md` for CLI commands and story management
**And** understands the separation between framework and tool

#### Scenario: Cross-references between AGENTS.md files
**Given** both AGENTS.md files exist
**When** the user reads either file
**Then** each file clearly states its scope in the header
**And** each file includes a reference to the other file
**And** explains when to use which instructions
**Example: `openspec/AGENTS.md` → "For SpecDeck CLI commands, see specdeck/AGENTS.md"
**Example: `specdeck/AGENTS.md` → "For creating OpenSpec proposals, see openspec/AGENTS.md"

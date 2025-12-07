# cli-core Specification Delta

## MODIFIED Requirements

### Requirement: Separate SpecDeck and OpenSpec Directory Scaffolding
The CLI MUST scaffold both `specdeck/` and `openspec/` directories during `specdeck init copilot` to create clear separation between tool-specific and framework artifacts.

#### Scenario: Initialize with separated directory structure
**Given** the current directory has no `specdeck/` or `openspec/` folders
**When** the user runs `specdeck init copilot`
**Then** the CLI creates `specdeck/` directory first
**And** creates `specdeck/project-plan.md` with example table and documentation
**And** creates `specdeck/vision.md` with section placeholders and guidance
**And** creates `specdeck/AGENTS.md` with SpecDeck CLI instructions
**And** creates `openspec/` directory
**And** creates `openspec/project.md` with section placeholders and guidance  
**And** creates `openspec/AGENTS.md` with OpenSpec workflow instructions
**And** creates `.github/prompts/` directory
**And** installs Copilot prompt templates
**And** creates `.specdeck-version` file tracking all scaffolded files
**And** displays success message listing SpecDeck files, OpenSpec files, and Copilot templates
**And** exits with code 0

#### Scenario: Skip scaffolding when directories exist
**Given** the current directory already has `specdeck/` or `openspec/` folders
**When** the user runs `specdeck init copilot`
**Then** the CLI detects existing directories
**And** skips scaffolding for existing directories (does not overwrite)
**And** scaffolds missing directories if any
**And** proceeds with Copilot prompt template installation
**And** creates/updates `.specdeck-version` file
**And** displays message: "✓ SpecDeck directory exists (skipped)" or "✓ OpenSpec directory exists (skipped)"
**And** displays success for newly created items
**And** exits with code 0

#### Scenario: Idempotent initialization
**Given** the user has previously run `specdeck init copilot`
**And** `.specdeck-version` file exists
**When** the user runs `specdeck init copilot` again
**Then** the CLI displays "✓ Already initialized"
**And** suggests running `specdeck upgrade copilot` for updates
**And** does not modify any files
**And** exits with code 0

### Requirement: Stub File Documentation Quality
Each scaffolded file MUST contain clear, concise documentation explaining its purpose, with different content for SpecDeck vs OpenSpec files.

#### Scenario: specdeck/project-plan.md includes SpecDeck documentation
**Given** the user has run `specdeck init copilot`
**And** `specdeck/` was scaffolded
**When** the user opens `specdeck/project-plan.md`
**Then** the file contains header explaining it's SpecDeck's story tracking table
**And** includes example milestone section with H2 heading format
**And** includes example table with all columns: ID, Title, Status, Complexity, Estimate, Owner, Jira, OpenSpec, Tags, Notes
**And** includes 2-3 example story rows with valid data
**And** includes brief inline comments explaining column purposes
**And** includes link to README.md for full documentation

#### Scenario: specdeck/AGENTS.md includes CLI instructions
**Given** the user has run `specdeck init copilot`
**And** `specdeck/` was scaffolded
**When** the user opens `specdeck/AGENTS.md`
**Then** the file contains header: "SpecDeck Tool Instructions"
**And** includes SpecDeck CLI commands reference (`list`, `sync status`, `validate`)
**And** documents `project-plan.md` table format and columns
**And** includes story decomposition workflow guidance
**And** links to `.github/prompts/` templates for detailed workflows
**And** explains relationship to OpenSpec (references `openspec/AGENTS.md`)

#### Scenario: specdeck/vision.md includes product vision guidance  
**Given** the user has run `specdeck init copilot`
**And** `specdeck/` was scaffolded
**When** the user opens `specdeck/vision.md`
**Then** the file contains section placeholders: Problem, Solution, Target Users, Success Metrics, Roadmap
**And** includes brief guidance comments (1-2 lines per section)
**And** includes link to SpecDeck's vision.md as reference example

#### Scenario: openspec/project.md includes framework guidance
**Given** the user has run `specdeck init copilot`
**And** `openspec/` was scaffolded
**When** the user opens `openspec/project.md`
**Then** the file contains section placeholders: Purpose, Tech Stack, Conventions, Domain Context
**And** includes brief guidance comments (1-2 lines per section)
**And** includes link to SpecDeck's project.md as reference example

#### Scenario: openspec/AGENTS.md includes workflow instructions
**Given** the user has run `specdeck init copilot`
**And** `openspec/` was scaffolded
**When** the user opens `openspec/AGENTS.md`
**Then** the file contains header: "OpenSpec Framework Instructions"
**And** includes instructions for creating proposals, specs, and changes
**And** documents spec format conventions (ADDED/MODIFIED/REMOVED, Given/When/Then)
**And** includes validation requirements
**And** explains relationship to SpecDeck (references `specdeck/AGENTS.md`)

### Requirement: Path Resolution for SpecDeck Files
All SpecDeck commands MUST read `project-plan.md` and `vision.md` from `specdeck/` directory.

#### Scenario: Read files from specdeck directory
**Given** `specdeck/project-plan.md` and `specdeck/vision.md` exist
**When** any SpecDeck command needs to read these files (list, sync, validate)
**Then** the CLI reads from `specdeck/` directory
**And** command executes normally
**And** no warnings are displayed

# prompt-templates Specification

## Purpose
TBD - created by archiving change github-copilot-integration. Update Purpose after archive.
## Requirements
### Requirement: Template File Structure

The CLI MUST bundle prompt template files that provide SpecDeck guidance and install them for supported assistants.

#### Scenario: Decompose Feature Template
- **Given** CLI includes decompose-feature.prompt.md template
- **When** template is installed in project
- **Then** file provides step-by-step feature decomposition guide
- **And** includes story sizing guidelines (2-8 points, 1-3 days)
- **And** shows example story breakdown
- **And** includes checklist for validating stories

#### Scenario: Release workflow templates
- **Given** CLI includes release workflow templates: specdeck-release-create.prompt.md, specdeck-release-status.prompt.md, specdeck-release-sync.prompt.md
- **When** templates are installed in project
- **Then** files exist under `.github/prompts/`
- **And** files are installed in `.windsurf/workflows/` with `.md` extension
- **And** each includes YAML frontmatter with `title`, `description`, and `version`

#### Scenario: Windsurf workflow file naming
- **Given** CLI bundles prompt templates with `.prompt.md` filenames
- **When** the user runs `specdeck init windsurf`
- **Then** workflows are created in `.windsurf/workflows/` using matching base names with `.md` extension
- **And** workflow contents match the bundled prompt templates

### Requirement: Status Reference Template

The CLI MUST provide a template explaining all story status values and transitions.

#### Scenario: Status meanings documented
- **Given** CLI includes status-reference.prompt.md template
- **When** template is installed
- **Then** file defines all status values (planned, in_progress, in_review, blocked, done)
- **And** explains when to use each status
- **And** shows valid transitions between statuses
- **And** includes examples for each status

#### Scenario: Status workflow guidance
- **Given** status reference template is available to Copilot or Windsurf
- **When** user asks about story status
- **Then** the assistant references the template
- **And** provides accurate status transition advice
- **And** suggests appropriate next steps

### Requirement: Coordinator Jira Sync Prompt

The CLI MUST bundle a `specdeck-jira-sync.prompt.md` template that instructs LLMs how to perform Jira sync tasks in coordinator mode using cache + overlay aware SpecDeck commands.

#### Scenario: Installed via init or upgrade commands
**Given** the CLI bundles `specdeck-jira-sync.prompt.md`  
**When** the user runs `specdeck init copilot`, `specdeck init windsurf`, or `specdeck upgrade`  
**Then** `.github/prompts/specdeck-jira-sync.prompt.md` and/or `.windsurf/workflows/specdeck-jira-sync.md` is installed with YAML frontmatter (`title`, `description`, `version`)  
**And** the template appears in `specdeck upgrade --list` output  
**And** selective updates with `--template jira-sync` refresh this file in all initialized targets

#### Scenario: Prompt guides Jira sync workflow
**Given** the template is available to Copilot or Windsurf  
**When** the LLM follows its instructions  
**Then** it refreshes coordinator cache when stale (e.g., `specdeck sync`)  
**And** runs `specdeck jira sync-plan` to list story IDs, repos, features, Jira mappings, and sync reasons  
**And** runs `specdeck stories show <story-id...> --with-jira --global --json` to fetch full story fields for one or more IDs  
**And** uses the CLI outputs to propose overlay/Jira updates without editing submodule story files directly

#### Scenario: Prompt enforces coordinator-safe defaults
**Given** overlay data may be missing or outdated  
**When** the template is used in a coordinator repository  
**Then** it instructs to prefer overlay updates over mutating submodules  
**And** documents when to bypass cache (`--no-cache`) for live reads  
**And** reminds the LLM to keep Jira ticket references aligned with overlay files per repository

### Requirement: Template Metadata

Template files MUST include frontmatter with metadata for version tracking and description.

#### Scenario: Template frontmatter format
- **Given** any prompt template file or Windsurf workflow file
- **When** file is inspected
- **Then** starts with YAML frontmatter block
- **And** includes `title`, `description`, and `version` fields
- **And** version matches CLI version
- **And** description explains template purpose

### Requirement: Story Context from Code Comments

The extension MUST extract story IDs from code comments and SHALL provide context.

#### Scenario: Code comment contains story ID
- **Given** active file has comment `// STORY: CLI-CORE-01`
- **When** Copilot needs context for this file
- **Then** extension extracts story ID
- **And** looks up story in project-plan.md
- **And** provides story details in context

#### Scenario: Multiple story IDs in same file
- **Given** file has multiple story ID comments
- **When** context is needed
- **Then** all mentioned stories are included
- **And** stories are deduplicated
- **And** maximum 5 stories per file to limit context size

### Requirement: OpenSpec Change Awareness

The extension MUST track active and archived OpenSpec changes for sync awareness.

#### Scenario: User asks about OpenSpec changes
- **Given** user mentions "openspec" or "proposal"
- **When** context providers are triggered
- **Then** extension scans `openspec/changes/` directory
- **And** identifies active changes
- **And** identifies archived changes in `changes/archive/`
- **And** provides change status to Copilot

#### Scenario: Change context shows linked stories
- **Given** an OpenSpec change is identified
- **When** context is provided
- **Then** all stories linked to that change are included
- **And** sync status (planned vs done) is indicated
- **And** suggestions for updates are available

### Requirement: Release Creation Workflow Prompt
The CLI MUST provide a prompt template that guides PMs to create a release from scope input using SpecDeck-first commands.

#### Scenario: Prompt collects scope and calls CLI
- **Given** `specdeck-release-create.prompt.md` is installed
- **When** the user asks to create a release
- **Then** the prompt gathers release scope (id, title, timeframe, objectives, success metrics, features)
- **And** instructs running `specdeck releases create` with scope input
- **And** does not require OpenSpec to be present

### Requirement: Release Status Workflow Prompt
The CLI MUST provide a prompt template for PM-ready release status collection and reporting.

#### Scenario: Prompt generates release status summary
- **Given** `specdeck-release-status.prompt.md` is installed
- **When** the user asks for release status
- **Then** the prompt runs `specdeck releases status <release-id> --json`
- **And** summarizes progress, blockers, and risks from the output
- **And** notes OpenSpec as an optional source (e.g., `--source openspec`)

### Requirement: Release Sync Workflow Prompt
The CLI MUST provide a prompt template for syncing release status with external trackers using MCP inputs.

#### Scenario: Prompt guides Jira or Azure reconciliation
- **Given** `specdeck-release-sync.prompt.md` is installed
- **When** the user requests Jira or Azure sync via MCP
- **Then** the prompt fetches external items via MCP, maps them to SpecDeck story IDs, and prepares an input file
- **And** ensures a mapping file exists at `specdeck/mappings/<source>.json` and instructs the PM to update it
- **And** runs `specdeck releases sync-plan <release-id> --source jira --input <file> --mapping specdeck/mappings/jira.json --json` (or `--source azure`)
- **And** uses the plan to update the external system or SpecDeck based on the requested direction

### Requirement: Coordinator Conflict Guidance
The CLI MUST provide coordinator workflow guidance that clarifies cache-only sync and conflict handling expectations.

#### Scenario: Coordinator workflow documents conflict policy
- **Given** the coordinator setup workflow is installed
- **When** the user follows coordinator-mode guidance
- **Then** the workflow explains that `specdeck sync` is cache-only and does not write to submodules
- **And** lists stop-and-ask conflicts (duplicate story IDs, invalid overlays, conflicting Jira mappings)
- **And** instructs the user to resolve conflicts in the source repo before re-running sync


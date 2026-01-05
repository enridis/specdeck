## MODIFIED Requirements
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

## ADDED Requirements
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

## REMOVED Requirements
### Requirement: Commands Cheatsheet Template
**Reason**: Low PM value compared to task-specific workflows.
**Migration**: Use release workflow prompts or `specdeck --help` for command discovery.

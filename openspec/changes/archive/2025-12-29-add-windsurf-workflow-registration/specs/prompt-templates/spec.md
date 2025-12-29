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

#### Scenario: Sync Workflow Template
- **Given** CLI includes sync-workflow.prompt.md template
- **When** template is installed in project
- **Then** file explains when to run sync checks
- **And** describes manual update process for project-plan.md
- **And** shows story status transitions
- **And** includes troubleshooting common sync issues

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

### Requirement: Commands Cheatsheet Template

The CLI MUST provide a quick reference template for all SpecDeck commands.

#### Scenario: Command reference available
- **Given** CLI includes commands-cheatsheet.prompt.md template
- **When** template is installed
- **Then** file lists all SpecDeck CLI commands
- **And** shows command syntax with examples
- **And** includes common flag combinations
- **And** groups commands by purpose (list, sync, init, upgrade)

#### Scenario: Copilot suggests commands
- **Given** cheatsheet template is in project
- **When** user asks "how do I check story status?"
- **Then** assistant references the cheatsheet
- **And** suggests `specdeck sync status` command
- **And** explains what the command does

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

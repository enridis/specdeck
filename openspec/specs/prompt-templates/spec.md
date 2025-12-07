# prompt-templates Specification

## Purpose
TBD - created by archiving change github-copilot-integration. Update Purpose after archive.
## Requirements
### Requirement: Template File Structure

The CLI MUST bundle prompt template files that provide Copilot guidance for SpecDeck workflows.

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
- **Given** status reference template is available to Copilot
- **When** user asks about story status
- **Then** Copilot references the template
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
- **Then** Copilot references the cheatsheet
- **And** suggests `specdeck sync status` command
- **And** explains what the command does

### Requirement: Template Metadata

Template files MUST include frontmatter with metadata for version tracking and description.

#### Scenario: Template frontmatter format
- **Given** any prompt template file
- **When** file is inspected
- **Then** starts with YAML frontmatter block
- **And** includes `title`, `description`, and `version` fields
- **And** version matches CLI version
- **And** description explains template purpose

- **When** context is provided to Copilot
- **Then** feature includes all linked stories
- **And** each story shows status, complexity, and estimate
- **And** stories are cross-referenced from project-plan.md

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


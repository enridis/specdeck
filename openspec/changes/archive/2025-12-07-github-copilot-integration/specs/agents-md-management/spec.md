# Spec: AGENTS.md Management

## ADDED Requirements

### Requirement: Managed Block Pattern

The CLI MUST use managed block markers to update AGENTS.md without overwriting user content.

#### Scenario: Managed block insertion
- **Given** AGENTS.md exists with user content
- **When** `specdeck init copilot` runs
- **Then** SpecDeck section is wrapped in `<!-- SPECDECK:START -->` and `<!-- SPECDECK:END -->`
- **And** user content outside markers is preserved
- **And** block is inserted at appropriate location (end of file if new)

#### Scenario: Managed block update
- **Given** AGENTS.md already has SpecDeck managed block
- **When** `specdeck upgrade copilot` runs
- **Then** only content between markers is replaced
- **And** markers themselves are preserved
- **And** user content remains unchanged

### Requirement: AGENTS.md Template Content

The CLI MUST generate AGENTS.md content that references installed prompt templates and SpecDeck commands.

#### Scenario: Template reference format
- **Given** SpecDeck section is being generated
- **When** content is written to AGENTS.md
- **Then** includes heading "# SpecDeck Instructions"
- **And** lists all installed prompt files with @ references
- **And** provides brief description of each template
- **And** mentions key SpecDeck commands (list, sync, init, upgrade)

#### Scenario: Example AGENTS.md content
- **Given** all 4 templates are installed
- **When** AGENTS.md is updated
- **Then** content includes:
```markdown
<!-- SPECDECK:START -->
# SpecDeck Instructions

For SpecDeck workflow guidance, see prompt files:
- @.github/prompts/decompose-feature.prompt.md - Feature decomposition
- @.github/prompts/sync-workflow.prompt.md - Sync story status
- @.github/prompts/status-reference.prompt.md - Story status reference
- @.github/prompts/commands-cheatsheet.prompt.md - CLI commands

Use `specdeck list`, `specdeck sync status` for project info.
<!-- SPECDECK:END -->
```

### Requirement: AGENTS.md Creation

The CLI SHALL create AGENTS.md if it doesn't exist, following project conventions.

#### Scenario: Create minimal AGENTS.md
- **Given** project has no AGENTS.md file
- **When** `specdeck init copilot` runs
- **Then** AGENTS.md is created in project root
- **And** file starts with descriptive heading
- **And** contains SpecDeck managed block
- **And** follows Markdown best practices


#### Scenario: User asks about syncing story status
- **Given** sync workflow prompt exists
- **When** user asks how to sync stories
- **Then** Copilot explains the `/specdeck-sync` command
- **And** describes when to sync (after archiving changes)
- **And** explains manual update process for project-plan.md
- **And** clarifies SpecDeck doesn't auto-update by design

#### Scenario: Prompt explains status transitions
- **Given** user asks about story statuses
- **When** Copilot has workflow context
- **Then** explains all status values (planned, in_progress, in_review, blocked, done)
- **And** suggests appropriate transitions
- **And** relates archived changes to "done" status

## MODIFIED Requirements
### Requirement: Managed Block Pattern

The CLI MUST use managed block markers to update AGENTS.md without overwriting user content.

#### Scenario: Managed block insertion
- **Given** AGENTS.md exists with user content
- **When** `specdeck init copilot` or `specdeck init windsurf` runs
- **Then** SpecDeck section is wrapped in `<!-- SPECDECK:START -->` and `<!-- SPECDECK:END -->`
- **And** user content outside markers is preserved
- **And** block is inserted at appropriate location (end of file if new)

#### Scenario: Managed block update
- **Given** AGENTS.md already has SpecDeck managed block
- **When** `specdeck upgrade` runs
- **Then** only content between markers is replaced
- **And** markers themselves are preserved
- **And** user content remains unchanged

### Requirement: AGENTS.md Template Content

The CLI MUST generate AGENTS.md content that focuses on SpecDeck structure and commands.

#### Scenario: Template reference format
- **Given** SpecDeck section is being generated
- **When** content is written to AGENTS.md
- **Then** includes heading "# SpecDeck Instructions"
- **And** summarizes story and release file structure
- **And** highlights key SpecDeck commands (list, sync, init, upgrade)
- **And** avoids listing assistant workflow file locations

#### Scenario: Example AGENTS.md content
- **Given** the SpecDeck managed block is updated
- **When** AGENTS.md is updated
- **Then** content includes:
```markdown
<!-- SPECDECK:START -->
# SpecDeck Instructions

SpecDeck manages releases, features, and stories in Markdown.

**Quick Reference:**
specdeck list stories              # List all stories
specdeck list features             # List features
specdeck validate all              # Validate structure

**Story Files:**
- Stories live in: `specdeck/releases/R*/FEATURE.md`
- Each feature file contains ONE table with all its stories
- Required columns: ID, Title, Status, Complexity

See `specdeck/AGENTS.md` for more SpecDeck details.
<!-- SPECDECK:END -->
```

### Requirement: AGENTS.md Creation

The CLI SHALL create AGENTS.md if it doesn't exist, following project conventions.

#### Scenario: Create minimal AGENTS.md
- **Given** project has no AGENTS.md file
- **When** `specdeck init copilot` or `specdeck init windsurf` runs
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

## ADDED Requirements
### Requirement: SpecDeck AGENTS.md Template Content

The CLI MUST provide a SpecDeck AGENTS.md template that documents SpecDeck structure, workflows, and guardrails for AI assistants.

#### Scenario: SpecDeck template describes story structure
- **Given** `specdeck/AGENTS.md` is created during `specdeck init`
- **When** the file is inspected
- **Then** it explains where releases, features, and stories live
- **And** calls out the single-story-table rule
- **And** includes quick command references for list/validate/sync
- **And** distinguishes standalone and coordinator workflows

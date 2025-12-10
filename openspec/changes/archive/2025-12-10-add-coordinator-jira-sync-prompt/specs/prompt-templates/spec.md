# prompt-templates Spec Delta

## ADDED Requirements

### Requirement: Coordinator Jira Sync Prompt

The CLI MUST bundle a `specdeck-jira-sync.prompt.md` template that instructs LLMs how to perform Jira sync tasks in coordinator mode using cache + overlay aware SpecDeck commands.

#### Scenario: Installed via copilot commands
- **Given** the CLI bundles `specdeck-jira-sync.prompt.md`
- **When** the user runs `specdeck init copilot` or `specdeck upgrade copilot`
- **Then** `.github/prompts/specdeck-jira-sync.prompt.md` is installed with YAML frontmatter (`title`, `description`, `version`)
- **And** the template appears in `specdeck upgrade copilot --list` output
- **And** selective updates with `--template jira-sync` refresh this file

#### Scenario: Prompt guides Jira sync workflow
- **Given** the template is available to Copilot
- **When** the LLM follows its instructions
- **Then** it refreshes coordinator cache when stale (e.g., `specdeck sync`)
- **And** runs `specdeck jira sync-plan` to list story IDs, repos, features, Jira mappings, and sync reasons
- **And** runs `specdeck stories show <story-id...> --with-jira --global --json` to fetch full story fields for one or more IDs
- **And** uses the CLI outputs to propose overlay/Jira updates without editing submodule story files directly

#### Scenario: Prompt enforces coordinator-safe defaults
- **Given** overlay data may be missing or outdated
- **When** the template is used in a coordinator repository
- **Then** it instructs to prefer overlay updates over mutating submodules
- **And** documents when to bypass cache (`--no-cache`) for live reads
- **And** reminds the LLM to keep Jira ticket references aligned with overlay files per repository

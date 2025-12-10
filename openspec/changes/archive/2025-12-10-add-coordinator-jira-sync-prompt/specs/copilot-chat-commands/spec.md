# copilot-chat-commands Spec Delta

## ADDED Requirements

### Requirement: Jira Sync Prompt Installation and Upgrade

The CLI MUST install and upgrade the Jira sync Copilot template through `init copilot` and `upgrade copilot`, with selective updates and listings aware of the new template.

#### Scenario: Init installs Jira sync template
- **Given** the CLI bundles `specdeck-jira-sync.prompt.md`
- **When** the user runs `specdeck init copilot`
- **Then** `.github/prompts/specdeck-jira-sync.prompt.md` is created with frontmatter
- **And** `.specdeck-version` records the template version
- **And** the command exits with code 0

#### Scenario: Selective upgrade of Jira sync template
- **Given** the project has an older Jira sync prompt version
- **When** the user runs `specdeck upgrade copilot --template jira-sync`
- **Then** only `specdeck-jira-sync.prompt.md` is replaced from the bundle
- **And** a timestamped backup is created unless `--force` is provided
- **And** the version entry for `jira-sync` is updated in `.specdeck-version`

#### Scenario: List shows Jira sync template status
- **Given** the user runs `specdeck upgrade copilot --list`
- **When** the CLI enumerates templates
- **Then** it includes `jira-sync` with current vs bundled version
- **And** marks it as `outdated` when bundle version is newer
- **And** exits with code 0

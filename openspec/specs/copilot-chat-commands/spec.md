# copilot-chat-commands Specification

## Purpose
TBD - created by archiving change github-copilot-integration. Update Purpose after archive.
## Requirements
### Requirement: Command Registration

The CLI MUST register `specdeck upgrade copilot` command that updates installed prompt templates to the latest version.

#### Scenario: User upgrades templates
- **Given** user has templates installed from previous version
- **When** user runs `specdeck upgrade copilot`
- **Then** current version is compared with bundled version
- **And** backup is created in `.github/prompts/.backup-{timestamp}/`
- **And** templates are updated to new version
- **And** `.specdeck-version` file is updated

#### Scenario: No upgrade needed
- **Given** installed templates are already at latest version
- **When** user runs `specdeck upgrade copilot`
- **Then** message indicates templates are up-to-date
- **And** no files are modified
- **And** command exits successfully

### Requirement: Version Comparison

The CLI MUST compare installed template version with bundled version to determine if upgrade is needed.

#### Scenario: Detect version mismatch
- **Given** `.specdeck-version` contains version 0.1.0
- **And** CLI bundle contains version 0.2.0
- **When** upgrade command checks versions
- **Then** upgrade is triggered
- **And** changelog shows differences between versions

#### Scenario: Handle missing version file
- **Given** `.specdeck-version` file does not exist
- **When** upgrade command runs
- **Then** assume version 0.0.0 (outdated)
- **And** proceed with upgrade
- **And** create version file after completion

### Requirement: Backup Mechanism

The CLI MUST create backups of existing templates before replacing them during upgrade.

#### Scenario: Create timestamped backup
- **Given** user runs upgrade command
- **When** templates need to be replaced
- **Then** backup directory `.github/prompts/.backup-2025-12-07-143022/` is created
- **And** all existing template files are copied to backup
- **And** backup preserves directory structure

#### Scenario: Skip backup with force flag
- **Given** user runs `specdeck upgrade copilot --force`
- **When** templates are being upgraded
- **Then** no backup is created
- **And** files are replaced directly
- **And** warning is shown about no backup

### Requirement: Changelog Display

The CLI MUST show a changelog of what changed between installed and new template versions.

#### Scenario: Display changes during upgrade
- **Given** templates are being upgraded from 0.1.0 to 0.2.0
- **When** upgrade process begins
- **Then** changelog is displayed showing:
- **And** list of modified template files
- **And** summary of key changes
- **And** user can proceed or cancel

#### Scenario: Changelog source
- **Given** CLI bundle includes CHANGELOG.md
- **When** changelog needs to be displayed
- **Then** relevant section for version range is extracted
- **And** formatted for terminal output
- **And** includes migration notes if any

### Requirement: Selective Template Updates

The CLI SHALL support selective template replacement via command flags.

#### Scenario: Update specific template only
- **Given** user runs `specdeck upgrade copilot --template sync-workflow`
- **When** upgrade executes
- **Then** only `sync-workflow.prompt.md` is updated
- **And** other templates remain unchanged
- **And** version file is updated to note partial upgrade

#### Scenario: List available templates
- **Given** user runs `specdeck upgrade copilot --list`
- **When** command executes
- **Then** all available template names are displayed
- **And** indicates which are outdated
- **And** shows current vs available versions

- **Then** extension recognizes feature filter intent
- **And** executes `/specdeck-list-stories --feature CLI-CORE`
- **And** responds with filtered story list

### Requirement: Error Handling and User Guidance

The extension MUST handle errors gracefully and SHALL provide helpful guidance.

#### Scenario: SpecDeck CLI command fails
- **Given** user executes a slash command
- **When** SpecDeck CLI returns an error
- **Then** extension formats error for chat
- **And** suggests corrective action
- **And** avoids showing raw stack traces

#### Scenario: User provides invalid command syntax
- **Given** user types a malformed command
- **When** command cannot be parsed
- **Then** extension suggests correct syntax
- **And** shows available commands
- **And** provides example usage


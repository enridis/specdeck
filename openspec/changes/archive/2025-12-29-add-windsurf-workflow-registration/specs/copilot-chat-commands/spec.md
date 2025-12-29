## MODIFIED Requirements
### Requirement: Command Registration

The CLI MUST register `specdeck upgrade` command that updates installed prompt templates and Windsurf workflows to the latest version.

#### Scenario: User upgrades templates and workflows
- **Given** user has Copilot prompts and/or Windsurf workflows installed from previous version
- **When** user runs `specdeck upgrade`
- **Then** current version is compared with bundled version
- **And** backup is created in each initialized target directory
- **And** templates and workflows are updated to new version
- **And** `.specdeck-version` file is updated

#### Scenario: No upgrade needed
- **Given** installed templates and workflows are already at latest version
- **When** user runs `specdeck upgrade`
- **Then** message indicates templates are up-to-date
- **And** no files are modified
- **And** command exits successfully

### Requirement: Version Comparison

The CLI MUST compare installed template version with bundled version to determine if upgrade is needed.

#### Scenario: Detect version mismatch
- **Given** `.specdeck-version` contains version 0.1.0 and targets `copilot` and `windsurf`
- **And** CLI bundle contains version 0.2.0
- **When** upgrade command checks versions
- **Then** upgrade is triggered for all initialized targets
- **And** changelog shows differences between versions

#### Scenario: Handle missing version file
- **Given** `.specdeck-version` file does not exist
- **When** upgrade command runs
- **Then** assume version 0.0.0 (outdated)
- **And** infer targets from existing `.github/prompts/` and `.windsurf/workflows/` directories
- **And** proceed with upgrade
- **And** create version file after completion

### Requirement: Backup Mechanism

The CLI MUST create backups of existing templates before replacing them during upgrade.

#### Scenario: Create timestamped backup
- **Given** user runs upgrade command
- **When** templates need to be replaced
- **Then** backup directory `.github/prompts/.backup-2025-12-07-143022/` is created for Copilot targets
- **And** backup directory `.windsurf/workflows/.backup-2025-12-07-143022/` is created for Windsurf targets
- **And** all existing template and workflow files are copied to backup
- **And** backup preserves directory structure

#### Scenario: Skip backup with force flag
- **Given** user runs `specdeck upgrade --force`
- **When** templates are being upgraded
- **Then** no backup is created
- **And** files are replaced directly
- **And** warning is shown about no backup

### Requirement: Changelog Display

The CLI MUST show a changelog of what changed between installed and new template versions.

#### Scenario: Display changes during upgrade
- **Given** templates are being upgraded from 0.1.0 (lower version) to 0.2.0 (higher version)
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
- **Given** user runs `specdeck upgrade --template sync-workflow`
- **When** upgrade executes
- **Then** only the specified template is updated for each initialized target
- **And** other templates remain unchanged
- **And** version file is updated to note partial upgrade

#### Scenario: List available templates
- **Given** user runs `specdeck upgrade --list`
- **When** command executes
- **Then** all available template names are displayed
- **And** indicates which are outdated per target (copilot, windsurf)
- **And** shows current vs available versions

### Requirement: Jira Sync Prompt Installation and Upgrade

The CLI MUST install and upgrade the Jira sync prompt through `init` and `upgrade`, with selective updates and listings aware of the template.

#### Scenario: Init installs Jira sync template
**Given** the CLI bundles `specdeck-jira-sync.prompt.md`  
**When** the user runs `specdeck init copilot` or `specdeck init windsurf`  
**Then** `.github/prompts/specdeck-jira-sync.prompt.md` and/or `.windsurf/workflows/specdeck-jira-sync.md` is created with frontmatter  
**And** `.specdeck-version` records the template version and target  
**And** the command exits with code 0

#### Scenario: Selective upgrade of Jira sync template
**Given** the project has an older Jira sync prompt version  
**When** the user runs `specdeck upgrade --template jira-sync`  
**Then** only the Jira sync template is replaced in each initialized target  
**And** a timestamped backup is created unless `--force` is provided  
**And** the version entry for `jira-sync` is updated in `.specdeck-version`

#### Scenario: List shows Jira sync template status
**Given** the user runs `specdeck upgrade --list`  
**When** the CLI enumerates templates  
**Then** it includes `jira-sync` with current vs bundled version per target  
**And** marks it as `outdated` when bundle version is newer  
**And** exits with code 0

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

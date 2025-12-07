# Spec: CLI Copilot Init

## ADDED Requirements

### Requirement: Command Registration

The CLI MUST register `specdeck init copilot` command that installs Copilot prompt templates.

#### Scenario: User initializes Copilot templates
- **Given** user is in a SpecDeck project directory
- **When** user runs `specdeck init copilot`
- **Then** `.github/prompts/` directory is created
- **And** all template files are copied from CLI bundle
- **And** AGENTS.md is updated with SpecDeck section
- **And** `.specdeck-version` file is created with current CLI version

#### Scenario: Idempotent initialization
- **Given** templates are already installed
- **When** user runs `specdeck init copilot` again
- **Then** command succeeds without errors
- **And** existing files are not overwritten
- **And** message indicates templates are already installed

### Requirement: Template File Copying

The CLI MUST copy all prompt template files from bundled resources to project's `.github/prompts/` directory.

#### Scenario: All templates are installed
- **Given** CLI has 4 bundled template files
- **When** user runs `specdeck init copilot`
- **Then** all 4 files are copied to `.github/prompts/`
- **And** file permissions are preserved
- **And** file encoding is UTF-8

#### Scenario: Directory creation
- **Given** `.github/prompts/` does not exist
- **When** templates are being installed
- **Then** directory structure is created recursively
- **And** directory has appropriate permissions

### Requirement: AGENTS.md Management

The CLI MUST update or create AGENTS.md with SpecDeck-specific instructions using managed blocks.

#### Scenario: Create new AGENTS.md
- **Given** project has no AGENTS.md file
- **When** user runs `specdeck init copilot`
- **Then** AGENTS.md is created in project root
- **And** file contains `<!-- SPECDECK:START -->` managed block
- **And** block includes references to prompt template files

#### Scenario: Update existing AGENTS.md
- **Given** project has existing AGENTS.md with other content
- **When** user runs `specdeck init copilot`
- **Then** SpecDeck managed block is added or updated
- **And** existing content outside managed block is preserved
- **And** managed block boundaries are clearly marked

### Requirement: Version Tracking

The CLI MUST create `.specdeck-version` file to track installed template version.

#### Scenario: Version file creation
- **Given** templates are being installed
- **When** init command completes
- **Then** `.specdeck-version` file is created in project root
- **And** file contains current CLI version in semver format
- **And** file includes timestamp of installation

#### Scenario: Version file format
- **Given** `.specdeck-version` file is created
- **When** file is inspected
- **Then** content is valid JSON
- **And** includes `version`, `timestamp`, and `templates` fields
- **And** `templates` lists all installed template files
#### Scenario: User disables context providers
- **Given** the extension is running
- **When** user sets `specdeck.enableContextProviders` to false
- **Then** context providers are not initialized
- **And** manual commands still work

### Requirement: Command Palette Integration

The extension SHALL register commands in VS Code's Command Palette.

#### Scenario: User accesses SpecDeck commands from Command Palette
- **Given** the extension is activated
- **When** user opens Command Palette (Cmd+Shift+P)
- **Then** SpecDeck commands are visible
- **And** commands are prefixed with "SpecDeck:"
- **And** selecting a command executes the corresponding CLI operation

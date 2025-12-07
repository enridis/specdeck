# Spec: CLI Core

## ADDED Requirements

### Requirement: CLI Entry Point and Command Structure
The CLI MUST provide a hierarchical command structure using Commander.js with support for global options, subcommands, and help text.

#### Scenario: User invokes CLI with version flag
**Given** the `specdeck` CLI is installed
**When** the user runs `specdeck --version`
**Then** the CLI outputs the current version number (e.g., "0.1.0")
**And** exits with code 0

#### Scenario: User invokes CLI without arguments
**Given** the `specdeck` CLI is installed
**When** the user runs `specdeck` with no arguments
**Then** the CLI displays help text with available commands
**And** shows global options (--version, --help, --json, --verbose)
**And** exits with code 0

#### Scenario: User invokes non-existent command
**Given** the `specdeck` CLI is installed
**When** the user runs `specdeck invalid-command`
**Then** the CLI displays an error message "Unknown command: invalid-command"
**And** suggests similar valid commands if available
**And** exits with code 1

### Requirement: Global Error Handling
The CLI MUST catch and format all errors consistently with actionable messages and appropriate exit codes.

#### Scenario: File not found error
**Given** a command expects to read `openspec/releases/R1.md`
**And** the file does not exist
**When** the command executes
**Then** the CLI displays "Error: Release 'R1' not found"
**And** shows expected file location "Expected: openspec/releases/R1.md"
**And** suggests running `specdeck releases list` to see available releases
**And** exits with code 1

#### Scenario: Validation error
**Given** a command parses `project-plan.md`
**And** line 42 contains an invalid story ID "bad-id"
**When** the command executes
**Then** the CLI displays "Error: Invalid project-plan.md at line 42"
**And** shows the specific validation issue "Story ID 'bad-id' does not match pattern [A-Z]+-[A-Z0-9]+-\d+"
**And** provides an example "Example: FND-01-01"
**And** exits with code 1

#### Scenario: Unexpected error
**Given** an unexpected exception occurs during command execution
**When** the error is caught by global handler
**Then** the CLI displays "Unexpected error: <error message>"
**And** logs stack trace if `--verbose` flag is set
**And** exits with code 1

### Requirement: Output Formatting
The CLI MUST support both human-readable table format and machine-readable JSON format for all data retrieval commands.

#### Scenario: List command with default output
**Given** the user runs `specdeck releases list`
**And** there are 2 releases
**When** the command completes
**Then** the output is a formatted table with columns [ID, Title, Timeframe, Features]
**And** the table is aligned and readable in terminal
**And** exits with code 0

#### Scenario: List command with JSON output
**Given** the user runs `specdeck releases list --json`
**And** there are 2 releases
**When** the command completes
**Then** the output is valid JSON array of release objects
**And** each object contains all release properties
**And** exits with code 0

#### Scenario: Empty result set
**Given** the user runs `specdeck features list R1`
**And** release R1 has no features
**When** the command completes
**Then** the CLI displays "No features found for release 'R1'"
**And** exits with code 0

### Requirement: Configuration Discovery
The CLI MUST discover the OpenSpec directory by checking for `.specdeck.config.json` or walking up to find `.git` directory.

#### Scenario: Config file in current directory
**Given** `.specdeck.config.json` exists in current directory
**And** it specifies `"openspecDir": "./custom-openspec"`
**When** any command executes
**Then** the CLI uses `./custom-openspec` as the base directory

#### Scenario: No config file, find git root
**Given** no `.specdeck.config.json` exists
**And** current directory is `project/src/subdir`
**And** `project/.git` exists
**When** any command executes
**Then** the CLI uses `project/openspec` as the base directory

#### Scenario: No config and no git directory
**Given** no `.specdeck.config.json` exists
**And** no `.git` directory in parent directories
**When** any command executes
**Then** the CLI assumes `./openspec` in current directory
**And** warns if `openspec/` does not exist

### Requirement: Verbose Logging
The CLI MUST support a `--verbose` flag that enables detailed logging for troubleshooting.

#### Scenario: Command with verbose flag
**Given** the user runs `specdeck releases list --verbose`
**When** the command executes
**Then** the CLI logs file paths being read
**And** logs parsing steps
**And** logs service calls and data transformations
**And** outputs the final result
**And** exits with code 0

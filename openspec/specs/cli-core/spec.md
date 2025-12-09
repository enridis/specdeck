# cli-core Specification

## Purpose
TBD - created by archiving change add-cli-basic-foundation. Update Purpose after archive.
## Requirements
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

**Modification:** The global error handler MUST handle server-specific errors.

**New Acceptance Criteria:**
- Server startup errors are caught and displayed clearly
- Port binding errors suggest solutions (try different port)
- Missing directory errors suggest running `specdeck init`
- Server runtime errors are logged but don't crash the process

#### Scenario: Handle server error gracefully

**Given** the server encounters a runtime error  
**When** processing a request  
**Then** the error is logged with stack trace  
**And** the server continues running  
**And** the client receives 500 Internal Server Error response

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

### Requirement: Serve Command Implementation

The CLI MUST provide a `serve` command that starts the web server.

**Acceptance Criteria:**
- Command located in `src/commands/serve.ts`
- Command creates Express server with API routes
- Command serves static frontend from `dist/ui/` (unless --api-only)
- Command opens browser automatically if `--open` flag provided
- Command validates that `specdeck/` directory exists before starting
- Command shows clear error if port is already in use
- Command handles Ctrl+C gracefully with cleanup

#### Scenario: Start server successfully

**Given** the user is in a directory with `specdeck/` folder  
**And** port 3000 is available  
**When** the user runs `specdeck serve`  
**Then** the server starts  
**And** the console shows:
```
✓ SpecDeck server running at http://localhost:3000
  Press Ctrl+C to stop
```
**And** the server responds to API requests

#### Scenario: Handle missing specdeck directory

**Given** the user is in a directory without `specdeck/` folder  
**When** the user runs `specdeck serve`  
**Then** the command exits with error  
**And** the console shows: "Error: specdeck/ directory not found. Run 'specdeck init' first."

#### Scenario: Handle port already in use

**Given** port 3000 is already in use by another process  
**When** the user runs `specdeck serve`  
**Then** the command exits with error  
**And** the console shows: "Error: Port 3000 is already in use. Try a different port with --port"

#### Scenario: Open browser automatically

**Given** the user wants to open the UI immediately  
**When** the user runs `specdeck serve --open`  
**Then** the server starts  
**And** the default browser opens to `http://localhost:3000`

#### Scenario: Graceful shutdown

**Given** the server is running  
**When** the user presses Ctrl+C  
**Then** the console shows: "Shutting down server..."  
**And** the server closes all connections  
**And** the process exits cleanly

### Requirement: Configuration Integration

The serve command MUST respect existing SpecDeck configuration.

**Acceptance Criteria:**
- Reads `specdeckDir` from `.specdeck.config.json` if present
- Defaults to `./specdeck` if no config
- Uses existing ConfigRepository for discovery
- Supports multi-repo configuration (serves first repo by default)

#### Scenario: Use custom specdeck directory

**Given** `.specdeck.config.json` contains `{"specdeckDir": "./custom-specdeck"}`  
**When** the user runs `specdeck serve`  
**Then** the server reads data from `./custom-specdeck/`  
**And** the console shows the correct directory path

#### Scenario: Multi-repo support (future)

**Given** the config has multiple repos  
**When** the user runs `specdeck serve`  
**Then** the server serves the first repo by default  
**And** the console shows which repo is being served  
**Note:** Full multi-repo UI is out of scope for v1


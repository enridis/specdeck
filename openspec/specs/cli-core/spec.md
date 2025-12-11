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

The CLI MUST provide global error handling for all operations including server errors, coordinator-specific errors for submodule operations, cache management issues, overlay parsing failures, and story ID conflicts.

**Modification Note:** Extends existing Global Error Handling requirement to add coordinator-specific error cases.

**New Acceptance Criteria:**
- Missing submodule errors display clear path and suggest checking `.gitmodules`
- Stale cache errors suggest running `specdeck sync`
- Overlay parsing errors show file path and line number
- Story ID conflict errors list all conflicting IDs and their repos

#### Scenario: Handle missing submodule

**Given** config references submodule `./submodules/backend`  
**And** that directory does not exist  
**When** any command requires reading from submodules  
**Then** the CLI displays: "Submodule not found: ./submodules/backend. Run 'git submodule update --init'"  
**And** exits with code 1

#### Scenario: Handle stale cache

**Given** cache is older than 24 hours  
**And** user runs `specdeck list stories`  
**When** the command executes  
**Then** it displays warning: "Cache is 2 days old. Run 'specdeck sync' to refresh"  
**And** continues with cached data  
**And** exits with code 0

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

### Requirement: Validate Planning Artifacts
The CLI MUST provide `specdeck validate all` to check core planning files and summarize results.

#### Scenario: Validate vision, project plan, and releases
**Given** `.specdeck.config.json` resolves the SpecDeck directory (default `./specdeck`)  
**And** optional `openspecDir` exists for release files  
**When** the user runs `specdeck validate all` (with or without `--strict`)  
**Then** the command validates `vision.md`, `project-plan.md`, and each release markdown it can find  
**And** missing files are reported as warnings while malformed front matter/sections are reported as errors  
**And** a summary of error and warning counts is printed  
**And** the command exits with code 0 when errors are zero, otherwise exits with code 1

### Requirement: Configuration Discovery

**Original:** The CLI MUST discover the OpenSpec directory by checking for `.specdeck.config.json` or walking up to find `.git` directory.

**Modification:** Add support for coordinator-specific configuration fields.

**New Configuration Schema:**
```json
{
  "specdeckDir": "./specdeck",
  "coordinator": {
    "enabled": true,
    "submodules": [
      {
        "name": "backend",
        "path": "./submodules/backend",
        "visibility": "public"
      },
      {
        "name": "frontend",
        "path": "./submodules/frontend",
        "visibility": "private"
      }
    ],
    "overlaysDir": "./overlays",
    "cacheDir": "./.specdeck-cache"
  },
  "defaults": {
    "complexity": "M",
    "status": "planned"
  }
}
```

#### Scenario: Parse coordinator configuration

**Given** `.specdeck.config.json` contains coordinator section with 2 submodules  
**When** the CLI loads configuration  
**Then** it validates required fields: `enabled`, `submodules`, `overlaysDir`, `cacheDir`  
**And** validates each submodule has `name`, `path`  
**And** `visibility` field is optional (defaults to "private")  
**And** throws error if validation fails

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

### Requirement: Coordinator Repository Mode

The CLI MUST support coordinator repository mode where a parent repository manages multiple project repositories as Git submodules, with aggregated querying and overlay support for proprietary metadata.

#### Scenario: Detect coordinator configuration

**Given** `.specdeck.config.json` contains a `coordinator` section  
**And** the section has `enabled: true` and `submodules` array  
**When** any command executes  
**Then** the CLI operates in coordinator mode  
**And** scans submodules for SpecDeck data  
**And** uses cache directory specified in `cacheDir` field

#### Scenario: Initialize coordinator repository

**Given** the user runs `specdeck init coordinator`  
**When** the command executes  
**Then** it creates `.specdeck.config.json` with coordinator section  
**And** creates `overlays/` directory  
**And** creates `.specdeck-cache/` directory  
**And** adds `.specdeck-cache/` to `.gitignore`  
**And** displays instructions for adding Git submodules

#### Scenario: Validate coordinator configuration

**Given** `.specdeck.config.json` has coordinator mode enabled  
**And** specifies 3 submodules  
**When** the user runs `specdeck validate config`  
**Then** it checks each submodule path exists  
**And** checks each submodule contains `specdeck/` directory  
**And** reports any invalid submodule paths  
**And** exits with code 1 if validation fails

### Requirement: Coordinator Submodule Lifecycle Commands
The CLI MUST manage coordinator submodules via dedicated commands that update git state and SpecDeck configuration.

#### Scenario: Add submodule with config registration

**Given** coordinator mode is enabled  
**When** the user runs `specdeck init submodule <repo-url> <path>` with optional `--name`, `--visibility`, `--branch`, or `--no-update`  
**Then** the command refuses to run if coordinator mode is disabled  
**And** adds the git submodule (skipping if already present) and initializes it unless `--no-update` is set  
**And** registers the submodule in `.specdeck.config.json` with resolved name and visibility  
**And** creates an overlays directory for the repo and scaffolds SpecDeck files inside the submodule when missing  
**And** prints next steps for committing and syncing

#### Scenario: Remove submodule and unregister

**Given** coordinator mode is enabled  
**When** the user runs `specdeck init remove-submodule <name-or-path>`  
**Then** the command exits with code 1 if the submodule is not configured  
**And** otherwise removes the git submodule (deinit, git rm, and modules cleanup)  
**And** deletes the matching entry from `.specdeck.config.json`  
**And** prints a success summary before exiting with code 0

### Requirement: Sync Command for Cache Management

The CLI MUST provide a `sync` command that reads stories from all submodules, applies overlay data, and writes merged dataset to cache.

#### Scenario: Sync all submodules to cache

**Given** coordinator has 3 submodules configured  
**And** each submodule has 5 stories  
**When** the user runs `specdeck sync`  
**Then** it reads stories from all submodules  
**And** applies Jira mappings from overlay files  
**And** writes merged data to `.specdeck-cache/stories.json`  
**And** displays summary: "Synced 15 stories from 3 repos, applied 8 overlays"  
**And** exits with code 0

#### Scenario: Dry-run sync preview

**Given** coordinator has 2 submodules  
**When** the user runs `specdeck sync --dry-run`  
**Then** it scans submodules and overlays  
**And** displays what would be synced (story counts per repo)  
**And** does NOT write to cache  
**And** exits with code 0

#### Scenario: Sync with overlay validation errors

**Given** overlay file references story `BE-AUTH-99` that doesn't exist  
**When** the user runs `specdeck sync`  
**Then** it reports error: "Overlay references non-existent story: BE-AUTH-99 in overlays/backend/AUTH.overlay.md"  
**And** does NOT update cache  
**And** exits with code 1

#### Scenario: Sync performance with large dataset

**Given** coordinator has 5 submodules with 200 stories each  
**When** the user runs `specdeck sync`  
**Then** sync completes in <10 seconds  
**And** writes cache with 1000 stories  
**And** displays performance stats (duration, stories/sec)


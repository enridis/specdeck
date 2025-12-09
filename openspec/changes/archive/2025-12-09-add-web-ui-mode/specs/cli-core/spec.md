---
capability: cli-core
type: spec-delta
change: add-web-ui-mode
---

# Spec Delta: CLI Core - Serve Command

This spec delta adds a new `serve` command to the existing CLI core capability.

## MODIFIED Requirements

### Requirement: CLI Entry Point and Command Structure

**Modification:** Add `serve` command to the hierarchical command structure.

**New Acceptance Criteria:**
- `specdeck serve` command is available at top level
- Command follows same pattern as existing commands (list, create, etc.)
- Command integrates with existing configuration discovery
- Command respects global options (--verbose, --json ignored for serve)

#### Scenario: Help text includes serve command

**Given** the user is unsure about available commands  
**When** the user runs `specdeck --help`  
**Then** the output includes:
```
Commands:
  list       List releases, features, or stories
  create     Create releases or features
  propose    Propose feature decomposition
  validate   Validate SpecDeck files
  init       Initialize SpecDeck structure
  upgrade    Upgrade SpecDeck templates
  migrate    Migrate to feature-based structure
  serve      Start web UI server for SpecDeck management
```

#### Scenario: Serve command help

**Given** the user wants to learn about serve options  
**When** the user runs `specdeck serve --help`  
**Then** the output shows:
```
Usage: specdeck serve [options]

Start web UI server for SpecDeck management

Options:
  --port <port>   Port to run server on (default: 3000)
  --open          Open browser automatically
  --api-only      Run API server without frontend
  --host <host>   Host to bind to (default: localhost)
  -h, --help      Display help for command
```

## ADDED Requirements

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

## MODIFIED Requirements

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

# cli-core Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

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

# story-management Specification

## Purpose
TBD - created by archiving change add-cli-basic-foundation. Update Purpose after archive.
## Requirements
### Requirement: List Stories for Feature

The CLI MUST provide a command to list all user stories for a specific feature, with support for coordinator mode cache-based queries, overlay enrichment, and multi-submodule filtering.

**Modification Note:** Extends existing List Stories requirement to add coordinator mode caching and overlay support.

**New Acceptance Criteria:**
- In coordinator mode, defaults to querying cache (fast)
- `--with-jira` flag includes Jira links from overlays
- `--global` flag queries all submodules
- `--repo <name>` filters to specific submodule
- `--no-cache` forces live submodule queries
- Displays warning if cache is older than 24 hours

#### Scenario: List stories in coordinator mode with cache

**Given** coordinator mode enabled with synced cache  
**And** feature `AUTH-01` has 5 stories across 2 repos  
**When** the user runs `specdeck list stories --feature AUTH-01`  
**Then** it reads from `.specdeck-cache/stories.json`  
**And** filters to `AUTH-01` feature  
**And** displays results in <100ms  
**And** exits with code 0

### Requirement: Story Statistics Reporting
The CLI MUST provide aggregated story statistics from SpecDeck data.

#### Scenario: Show stats summary
**Given** stories exist in the configured SpecDeck directory or coordinator cache  
**When** the user runs `specdeck list stories --stats`  
**Then** the command calculates totals by status and complexity plus total story points and points-by-status  
**And** outputs a human-readable summary, or JSON when `--json` is set  
**And** exits with code 0

### Requirement: Decompose Feature into Stories

The CLI MUST provide an interactive command to propose decomposition of a feature into user stories, with coordinator mode awareness to prevent story ID conflicts across submodules and prompt for target repository selection.

**Modification Note:** Extends existing Decompose Feature requirement to add coordinator mode validation.

**New Acceptance Criteria:**
- In coordinator mode, checks all submodules for existing IDs before suggesting new ones
- Prompts for target repository (from submodule list)
- Validates generated IDs don't conflict with any submodule
- Warns if suggested ID prefix doesn't match repository convention

#### Scenario: Decompose in coordinator mode

**Given** coordinator mode enabled with 3 submodules  
**And** feature `AUTH-01` exists in backend submodule  
**When** the user runs `specdeck decompose AUTH-01`  
**Then** it prompts: "Target repository?" with choices: backend, frontend, models  
**And** user selects "backend"  
**Then** it checks all submodules for existing `AUTH-01-*` IDs  
**And** suggests next available IDs starting from `AUTH-01-03` (if 01, 02 exist)  
**And** validates no ID conflicts across any submodule  
**And** exits with code 0

### Requirement: Parse User Stories from Project Plan
The CLI MUST parse `openspec/project-plan.md` to extract milestones and user stories from GFM tables.

#### Scenario: Parse project-plan with single milestone
**Given** project-plan.md contains:
```markdown

### Requirement: Coordinator-Aware Story Listing

The CLI MUST support listing stories across multiple submodules in coordinator mode, with optional Jira link enrichment from overlay files.

#### Scenario: List stories across all submodules

**Given** coordinator has 3 submodules (backend, frontend, models)  
**And** feature `AUTH-01` exists in backend and frontend  
**And** cache is up to date  
**When** the user runs `specdeck list stories --feature AUTH-01 --global`  
**Then** the output includes stories from both backend and frontend submodules  
**And** each row shows repo name in brackets (e.g., "[backend] BE-AUTH-01-01")  
**And** exits with code 0

#### Scenario: List stories with Jira links from overlays

**Given** coordinator has overlay file `overlays/backend/AUTH.overlay.md`  
**And** overlay maps `BE-AUTH-01-01` to `PROJ-1234`  
**And** cache is synced  
**When** the user runs `specdeck list stories --feature AUTH-01 --with-jira`  
**Then** the output includes Jira column  
**And** story `BE-AUTH-01-01` shows `PROJ-1234` in Jira column  
**And** stories without Jira mapping show empty/TBA  
**And** exits with code 0

#### Scenario: Filter stories to specific submodule

**Given** coordinator has 3 submodules  
**And** feature `AUTH-01` has stories in backend and frontend  
**When** the user runs `specdeck list stories --feature AUTH-01 --repo backend`  
**Then** the output shows only stories from backend submodule  
**And** excludes frontend stories  
**And** exits with code 0

#### Scenario: List with stale cache warning

**Given** cache is 3 days old  
**When** the user runs `specdeck list stories --feature AUTH-01`  
**Then** it displays warning: "⚠️  Cache is 3 days old. Run 'specdeck sync' to refresh."  
**And** continues with cached data  
**And** exits with code 0

#### Scenario: Force bypass cache

**Given** coordinator mode enabled  
**When** the user runs `specdeck list stories --feature AUTH-01 --no-cache`  
**Then** it reads stories directly from submodules  
**And** applies overlays on-the-fly (slower)  
**And** does NOT read from cache  
**And** exits with code 0

### Requirement: Story ID Validation Command
The CLI MUST validate global story ID uniqueness in coordinator mode via a dedicated command.

#### Scenario: Detect duplicates with fix suggestions
**Given** coordinator mode is enabled with configured submodules  
**When** the user runs `specdeck validate-story-ids --fix`  
**Then** the command scans all submodules for story IDs, lists any duplicates with the repos where they occur, and suggests repo-prefixed alternatives when `--fix` is provided  
**And** exits with code 1 when duplicates are found

#### Scenario: Confirm uniqueness
**Given** coordinator mode is enabled and story IDs are unique across submodules  
**When** the user runs `specdeck validate-story-ids`  
**Then** the command prints the total IDs scanned and confirms uniqueness  
**And** exits with code 0

### Requirement: Overlay File Management

The CLI MUST provide commands to create, validate, and manage overlay files that store proprietary metadata (Jira links) for stories.

#### Scenario: Create overlay file for feature

**Given** coordinator mode enabled  
**And** feature `AUTH-01` exists in backend submodule  
**When** the user runs `specdeck overlay create AUTH-01 --repo backend`  
**Then** it creates file `overlays/backend/AUTH-01.overlay.md`  
**And** scaffolds with proper header and empty Jira Mappings section  
**And** displays "Created overlay file: overlays/backend/AUTH-01.overlay.md"  
**And** exits with code 0

#### Scenario: Add Jira mapping to overlay

**Given** overlay file `overlays/backend/AUTH-01.overlay.md` exists  
**When** the user runs `specdeck overlay map BE-AUTH-01-01 PROJ-1234`  
**Then** it appends mapping to overlay file: `- **BE-AUTH-01-01**: PROJ-1234`  
**And** displays "Added Jira mapping: BE-AUTH-01-01 → PROJ-1234"  
**And** exits with code 0

#### Scenario: Validate overlay references

**Given** overlay file references stories `BE-AUTH-01-01`, `BE-AUTH-01-02`, `BE-AUTH-01-99`  
**And** story `BE-AUTH-01-99` does not exist in backend submodule  
**When** the user runs `specdeck overlay validate`  
**Then** it checks all overlay files against submodules  
**And** reports error: "Invalid reference in overlays/backend/AUTH-01.overlay.md: BE-AUTH-01-99 not found in submodules/backend"  
**And** exits with code 1

#### Scenario: List all Jira mappings

**Given** coordinator has 3 overlay files with 15 total mappings  
**When** the user runs `specdeck overlay list`  
**Then** it displays table of all Jira mappings  
**And** columns: Story ID, Jira Ticket, Repo, Feature  
**And** exits with code 0

### Requirement: Coordinator Jira Sync Data Commands

The CLI MUST provide coordinator-aware commands that surface Jira sync candidates and full story details (including overlay data) for one or more story IDs.

#### Scenario: Generate Jira sync plan
**Given** coordinator mode is enabled with cached stories and overlays  
**When** the user runs `specdeck jira sync-plan --global`  
**Then** the CLI reads `.specdeck-cache/stories.json` (or warns if stale)  
**And** outputs a table with columns: Repo, Feature, Story ID, Status, Jira (overlay), Sync Reason  
**And** lists stories missing Jira mappings or with mismatched Jira values across overlays/submodules  
**And** exits with code 0

#### Scenario: Sync plan JSON for automation
**Given** coordinator mode is enabled  
**When** the user runs `specdeck jira sync-plan --json --feature AUTH-01`  
**Then** the CLI returns JSON objects containing repo, feature, storyId, title, status, complexity, overlayJira, sourceRepoPath, and reason  
**And** results are filtered to `AUTH-01`  
**And** exit code is 0 even when list is empty

#### Scenario: Show full story detail for multiple IDs
**Given** coordinator cache is available  
**When** the user runs `specdeck stories show AUTH-01-01 FE-AUTH-01-02 --with-jira --global --all-fields`  
**Then** the CLI returns all columns for each story (title, status, complexity, estimate, owner, milestone, tags, notes, openspec, Jira from overlay, repo, feature, release)  
**And** includes overlay Jira even if story files omit Jira column  
**And** supports `--json` for machine-readable output  
**And** supports `--no-cache` to read directly from submodules when cache is stale


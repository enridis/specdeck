## MODIFIED Requirements
### Requirement: List All Releases
The CLI MUST provide a command to list all releases from `specdeck/releases/*.md` with summary information.

#### Scenario: List releases in default format
**Given** `specdeck/releases/` contains `R1-foundation.md` and `R2-analytics.md`  
**When** the user runs `specdeck releases list`  
**Then** the output displays a table with columns [ID, Title, Timeframe, Features]  
**And** shows 2 rows with data from both release files  
**And** features column shows count (e.g., "3 features")  
**And** exits with code 0

#### Scenario: List releases in JSON format
**Given** `specdeck/releases/` contains `R1-foundation.md`  
**When** the user runs `specdeck releases list --json`  
**Then** the output is a JSON array with one release object  
**And** the object contains `id`, `title`, `timeframe`, `objectives`, `successMetrics`, `features`, `featureCount`  
**And** exits with code 0

#### Scenario: No releases found
**Given** `specdeck/releases/` directory is empty  
**When** the user runs `specdeck releases list`  
**Then** the CLI displays "No releases found"  
**And** suggests running `specdeck releases create` to add a release  
**And** exits with code 0

#### Scenario: Releases directory does not exist
**Given** `specdeck/releases/` directory does not exist  
**When** the user runs `specdeck releases list`  
**Then** the CLI displays "No releases directory found at specdeck/releases"  
**And** exits with code 1

### Requirement: Release Listing with Feature Details
The CLI SHALL expand release listings to include feature titles when requested.

#### Scenario: List releases with features included
**Given** release markdown files exist under the configured `specdeck/releases/` directory  
**When** the user runs `specdeck releases list --with-features`  
**Then** the command prints each release with timeframe and a bullet list of feature IDs and titles  
**And** when `--json` is set, outputs release objects including `featureList` entries instead of a table  
**And** exits with code 0

### Requirement: Show Release Details
The CLI MUST provide a command to display detailed information about a specific release.

#### Scenario: Show existing release
**Given** release `R1-foundation` exists in `specdeck/releases/R1-foundation.md`  
**When** the user runs `specdeck releases show R1-foundation`  
**Then** the output displays:
- Release ID and title
- Timeframe
- All objectives (bulleted list)
- All success metrics (bulleted list)
- All features with IDs (bulleted list)  
**And** exits with code 0

#### Scenario: Show release in JSON format
**Given** release `R1-foundation` exists  
**When** the user runs `specdeck releases show R1-foundation --json`  
**Then** the output is a JSON object with all release properties  
**And** includes full arrays for objectives, successMetrics, and features  
**And** exits with code 0

#### Scenario: Release not found
**Given** release `R99-unknown` does not exist  
**When** the user runs `specdeck releases show R99-unknown`  
**Then** the CLI displays "Error: Release 'R99-unknown' not found"  
**And** shows expected file path  
**And** suggests running `specdeck releases list` to see available releases  
**And** exits with code 1

### Requirement: Create New Release
The CLI MUST scaffold a new release file from arguments with proper structure.

#### Scenario: Create release from template
**Given** the user runs `specdeck releases create R2-analytics "Analytics Release" --timeframe "Q2 2025"`  
**And** `specdeck/releases/R2-analytics.md` does not exist  
**When** the command executes  
**Then** it ensures `specdeck/releases/` exists (creating it if needed)  
**And** writes `specdeck/releases/R2-analytics.md` with YAML front matter for id/title/timeframe  
**And** includes sections for Objectives, Success Metrics, Features, Dependencies, Risks, and Timeline  
**And** prints next-step guidance for editing the new file  
**And** exits with code 0

#### Scenario: Create release with existing ID
**Given** release `R1-foundation` already exists  
**When** the user runs `specdeck releases create R1-foundation`  
**Then** the CLI displays "Error: Release 'R1-foundation' already exists"  
**And** shows the existing file path  
**And** exits with code 1

#### Scenario: Create release from scope input
**Given** the user runs `specdeck releases create R3-platform "Platform Release" --scope scope.json`  
**And** `scope.json` provides objectives, success metrics, and feature outlines  
**When** the command executes  
**Then** the release file includes the provided objectives, success metrics, and features  
**And** the remaining sections keep the standard template structure  
**And** exits with code 0

### Requirement: Parse Release File Format
The CLI MUST parse release Markdown files with YAML front matter and extract structured data.

#### Scenario: Parse release with all sections
**Given** a release file under `specdeck/releases/` with:
```yaml
---
id: R1-foundation
title: Foundation Release
timeframe: Q1 2025
---
```
**When** the release is parsed  
**Then** the parser extracts front matter plus Objectives, Success Metrics, and Features sections  
**And** objectives and success metrics are returned as arrays of strings  
**And** features are returned with IDs and titles  
**And** feature count is derived from the Features section

## ADDED Requirements
### Requirement: Release Status Collection
The CLI MUST provide a command to generate release status summaries without persisting data.

#### Scenario: Generate release status summary
**Given** release `R1-foundation` exists with 8 stories across 3 features  
**When** the user runs `specdeck releases status R1-foundation`  
**Then** the output includes counts by status, completion percentage, and blocked stories  
**And** includes a per-feature rollup (feature ID, title, story counts)  
**And** exits with code 0

#### Scenario: Release status in JSON format
**Given** release `R1-foundation` exists  
**When** the user runs `specdeck releases status R1-foundation --json`  
**Then** the output is a JSON object containing release metadata, totals, byStatus counts, and story entries  
**And** each story entry includes id, title, status, featureId, and releaseId  
**And** exits with code 0

#### Scenario: Include OpenSpec status hints
**Given** OpenSpec changes exist and stories reference OpenSpec change IDs  
**When** the user runs `specdeck releases status R1-foundation --source openspec`  
**Then** the output includes OpenSpec-derived hints per story when available  
**And** if OpenSpec is missing, it warns and continues with SpecDeck-only status

### Requirement: Release Sync Plan
The CLI MUST provide a command to compare release status with a secondary source and generate a sync plan.

#### Scenario: OpenSpec sync plan
**Given** release `R1-foundation` exists and OpenSpec changes are present  
**When** the user runs `specdeck releases sync-plan R1-foundation --source openspec --json`  
**Then** the output lists proposed status updates with storyId, currentStatus, suggestedStatus, and reason  
**And** no files are modified  
**And** exits with code 0

#### Scenario: External sync plan with input file
**Given** `external.json` lists items mapped to SpecDeck story IDs for release `R1-foundation`  
**And** a mapping file exists at `specdeck/mappings/jira.json`  
**When** the user runs `specdeck releases sync-plan R1-foundation --source jira --input external.json --mapping specdeck/mappings/jira.json`  
**Then** the output lists actions for mismatched statuses and unmapped items  
**And** no files are modified  
**And** exits with code 0

#### Scenario: Missing input for external source
**Given** the user runs `specdeck releases sync-plan R1-foundation --source jira` without `--input`  
**When** the command executes  
**Then** it displays "Error: --input is required for source 'jira'"  
**And** exits with code 1

### Requirement: External Status Mapping Configuration
The CLI MUST support a mapping file to normalize external status values for sync plans.

#### Scenario: Mapping file normalizes external statuses
**Given** `specdeck/mappings/jira.json` defines mappings for external statuses  
**And** `external.json` includes statuses not in the SpecDeck enum  
**When** the user runs `specdeck releases sync-plan R1-foundation --source jira --input external.json --mapping specdeck/mappings/jira.json`  
**Then** the sync plan uses the mapped SpecDeck status values  
**And** reports any unmapped external statuses as warnings  
**And** exits with code 0

#### Scenario: Missing mapping file
**Given** the user runs `specdeck releases sync-plan R1-foundation --source jira --input external.json`  
**And** no mapping file exists at `specdeck/mappings/jira.json`  
**When** the command executes  
**Then** it displays "Error: Mapping file not found" and suggests creating `specdeck/mappings/jira.json` from the template  
**And** exits with code 1

# release-management Specification

## Purpose
TBD - created by archiving change add-cli-basic-foundation. Update Purpose after archive.
## Requirements
### Requirement: List All Releases
The CLI MUST provide a command to list all releases from `openspec/releases/*.md` with summary information.

#### Scenario: List releases in default format
**Given** `openspec/releases/` contains `R1-foundation.md` and `R2-analytics.md`  
**When** the user runs `specdeck releases list`  
**Then** the output displays a table with columns [ID, Title, Timeframe, Features]  
**And** shows 2 rows with data from both release files  
**And** features column shows count (e.g., "3 features")  
**And** exits with code 0

#### Scenario: List releases in JSON format
**Given** `openspec/releases/` contains `R1-foundation.md`  
**When** the user runs `specdeck releases list --json`  
**Then** the output is a JSON array with one release object  
**And** the object contains `id`, `title`, `timeframe`, `objectives`, `successMetrics`, `features`, `featureCount`  
**And** exits with code 0

#### Scenario: No releases found
**Given** `openspec/releases/` directory is empty  
**When** the user runs `specdeck releases list`  
**Then** the CLI displays "No releases found"  
**And** suggests running `specdeck releases create` to add a release  
**And** exits with code 0

#### Scenario: Releases directory does not exist
**Given** `openspec/releases/` directory does not exist  
**When** the user runs `specdeck releases list`  
**Then** the CLI displays "No releases directory found at openspec/releases"  
**And** exits with code 1

### Requirement: Release Listing with Feature Details
The CLI SHALL expand release listings to include feature titles when requested.

#### Scenario: List releases with features included
**Given** release markdown files exist under the configured `openspec/releases/` directory  
**When** the user runs `specdeck list releases --with-features`  
**Then** the command prints each release with timeframe and a bullet list of feature IDs and titles  
**And** when `--json` is set, outputs release objects including `featureList` entries instead of a table  
**And** exits with code 0

### Requirement: Show Release Details
The CLI MUST provide a command to display detailed information about a specific release.

#### Scenario: Show existing release
**Given** release `R1-foundation` exists in `openspec/releases/R1-foundation.md`  
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
**Given** the user runs `specdeck create release R2-analytics "Analytics Release" --timeframe "Q2 2025"`  
**And** `openspec/releases/R2-analytics.md` does not exist  
**When** the command executes  
**Then** it ensures `openspec/releases/` exists (creating it if needed)  
**And** writes `openspec/releases/R2-analytics.md` with YAML front matter for id/title/timeframe  
**And** includes sections for Objectives, Success Metrics, Features, Dependencies, Risks, and Timeline  
**And** prints next-step guidance for editing the new file  
**And** exits with code 0

#### Scenario: Create release with existing ID
**Given** release `R1-foundation` already exists  
**When** the user runs `specdeck releases create R1-foundation`  
**Then** the CLI displays "Error: Release 'R1-foundation' already exists"  
**And** shows the existing file path  
**And** exits with code 1

### Requirement: Parse Release File Format
The CLI MUST parse release Markdown files with YAML front matter and extract structured data.

#### Scenario: Parse release with all sections
**Given** a release file with:
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

### Requirement: Split Release Migration
The CLI MUST migrate split release content into the feature-based SpecDeck structure with preview support.

#### Scenario: Preview migration without writing files
**Given** matching release files exist under both `openspec/releases/` and `specdeck/releases/`  
**When** the user runs `specdeck migrate --dry-run`  
**Then** the command enumerates affected release IDs, shows source paths, and previews the files it would create  
**And** no files are modified  
**And** exit code is 0

#### Scenario: Execute migration with backup
**Given** split release files are detected between `openspec/releases/` and `specdeck/releases/`  
**When** the user runs `specdeck migrate` (without `--dry-run`)  
**Then** the command backs up original `openspec/releases/*.md` files to `openspec/releases.backup/`  
**And** generates `specdeck/releases/<release>.md` overviews plus per-feature story files under `specdeck/releases/<release>/`  
**And** prints a success summary and next steps  
**And** exits with code 0 unless migration fails


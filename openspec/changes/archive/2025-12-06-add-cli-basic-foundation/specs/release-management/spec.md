# Spec: Release Management

## ADDED Requirements

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
The CLI MUST provide an interactive command to create a new release file with proper structure.

#### Scenario: Create release with interactive prompts
**Given** the user runs `specdeck releases create R1-foundation`
**And** `openspec/releases/R1-foundation.md` does not exist
**When** the command prompts for:
- Title: "Foundation Release"
- Timeframe: "Q1 2025"
- Objectives (comma-separated): "Enable basic aggregation, Provide notifications"
- Success Metrics (comma-separated): "X% adoption, Y% reduction"
**And** the user provides all inputs
**Then** the CLI creates `openspec/releases/R1-foundation.md`
**And** the file contains YAML front matter with id, title, timeframe
**And** the file contains Markdown sections for Objectives, Success Metrics, Features (empty list)
**And** displays "Release 'R1-foundation' created successfully"
**And** exits with code 0

#### Scenario: Create release with existing ID
**Given** release `R1-foundation` already exists
**When** the user runs `specdeck releases create R1-foundation`
**Then** the CLI displays "Error: Release 'R1-foundation' already exists"
**And** shows the existing file path
**And** exits with code 1

#### Scenario: Create release with invalid ID
**Given** the user runs `specdeck releases create invalid id with spaces`
**When** the command validates the ID
**Then** the CLI displays "Error: Invalid release ID 'invalid id with spaces'"
**And** shows allowed format "Use kebab-case (e.g., r1-foundation)"
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

# Release: R1 – Foundation

## Objectives

- Enable basic cross-tool task aggregation
- Provide first version of unified notifications

## Success Metrics

- X% of pilot users connect at least 2 external tools
- Y% reduction in missed notifications

## Features

- FND-01: Unified Task List (MVP)
- FND-02: Unified Notifications (MVP)
```
**When** the parser processes this file
**Then** it extracts:
- id: "R1-foundation"
- title: "Foundation Release"
- timeframe: "Q1 2025"
- objectives: array with 2 items
- successMetrics: array with 2 items
- features: array ["FND-01", "FND-02"]

#### Scenario: Parse release with missing optional sections
**Given** a release file with only YAML front matter and title
**And** no Objectives, Success Metrics, or Features sections
**When** the parser processes this file
**Then** it extracts id, title, timeframe from front matter
**And** sets objectives, successMetrics, features to empty arrays
**And** does not throw validation error

#### Scenario: Parse release with invalid YAML front matter
**Given** a release file with malformed YAML
**When** the parser processes this file
**Then** the parser throws an error "Invalid YAML front matter in releases/R1-foundation.md"
**And** indicates the parsing issue location if possible

### Requirement: Validate Release Structure
The CLI MUST validate release files for required fields and proper structure.

#### Scenario: Valid release file
**Given** a release file with all required fields (id, title)
**When** validation runs
**Then** the file passes validation
**And** no errors are reported

#### Scenario: Missing required field in front matter
**Given** a release file without `id` in YAML front matter
**When** validation runs
**Then** validation fails with "Release file missing required field: id"
**And** shows file path

#### Scenario: Feature list format validation
**Given** a release file with features listed as:
```markdown
## Features

- FND-01: Unified Task List
- Invalid feature without ID prefix
- FND-02: Another Feature
```
**When** validation runs
**Then** validation warns about "Invalid feature format: 'Invalid feature without ID prefix'"
**And** suggests "Features should start with ID followed by colon (e.g., FND-01: Title)"
**And** passes other valid features

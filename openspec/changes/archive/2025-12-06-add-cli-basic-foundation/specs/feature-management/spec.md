# Spec: Feature Management

## ADDED Requirements

### Requirement: List Features for Release
The CLI MUST provide a command to list all features for a specific release, extracted from the release file and cross-referenced with project-plan.md.

#### Scenario: List features for release with story counts
**Given** release `R1-foundation` exists with features:
- FND-01: Unified Task List
- FND-02: Unified Notifications
**And** `project-plan.md` contains 2 stories for FND-01 and 1 story for FND-02
**When** the user runs `specdeck features list R1-foundation`
**Then** the output displays a table with columns [Feature ID, Title, Stories]
**And** shows:
- FND-01 | Unified Task List | 2 stories
- FND-02 | Unified Notifications | 1 story
**And** exits with code 0

#### Scenario: List features with JSON output
**Given** release `R1-foundation` exists with 2 features
**When** the user runs `specdeck features list R1-foundation --json`
**Then** the output is a JSON array of feature objects
**And** each object contains `id`, `title`, `releaseId`, `storyCount`
**And** exits with code 0

#### Scenario: Release has no features
**Given** release `R1-foundation` exists
**And** the Features section is empty
**When** the user runs `specdeck features list R1-foundation`
**Then** the CLI displays "No features found for release 'R1-foundation'"
**And** exits with code 0

#### Scenario: Release not found
**Given** release `R99-unknown` does not exist
**When** the user runs `specdeck features list R99-unknown`
**Then** the CLI displays "Error: Release 'R99-unknown' not found"
**And** exits with code 1

### Requirement: Show Feature Details
The CLI MUST provide a command to display detailed information about a specific feature across all releases.

#### Scenario: Show feature from known release
**Given** feature `FND-01` exists in release `R1-foundation`
**And** description is "Unified Task List (MVP)"
**And** 3 stories reference FND-01 in project-plan.md
**When** the user runs `specdeck features show FND-01`
**Then** the output displays:
- Feature ID: FND-01
- Title: Unified Task List (MVP)
- Release: R1-foundation
- User Stories: 3 stories (with list of story IDs)
**And** exits with code 0

#### Scenario: Show feature with JSON output
**Given** feature `FND-01` exists
**When** the user runs `specdeck features show FND-01 --json`
**Then** the output is a JSON object with feature details
**And** includes `id`, `title`, `releaseId`, `stories` array with full story objects
**And** exits with code 0

#### Scenario: Feature not found
**Given** no release contains feature `FND-99`
**When** the user runs `specdeck features show FND-99`
**Then** the CLI displays "Error: Feature 'FND-99' not found in any release"
**And** suggests running `specdeck releases list` to see available releases
**And** exits with code 1

#### Scenario: Feature with multi-repo stories
**Given** feature `FND-02` exists
**And** stories exist in multiple repos: `./project-plan.md` and `../api-repo/openspec/project-plan.md`
**And** config file specifies multiple repos
**When** the user runs `specdeck features show FND-02`
**Then** the output groups stories by repository
**And** displays repo name/path for each story group

### Requirement: Create New Feature
The CLI MUST provide an interactive command to create a new feature and add it to a release file.

#### Scenario: Create feature for existing release
**Given** release `R1-foundation` exists
**And** the user runs `specdeck features create FND-03 --release R1-foundation`
**When** the command prompts for:
- Title: "Integration Framework (MVP)"
- Description: "Pluggable architecture for connecting external tools"
**And** the user provides inputs
**Then** the CLI updates `openspec/releases/R1-foundation.md`
**And** adds "- FND-03: Integration Framework (MVP)" to the Features section
**And** displays "Feature 'FND-03' added to release 'R1-foundation'"
**And** exits with code 0

#### Scenario: Create feature without release flag
**Given** the user runs `specdeck features create FND-03` without `--release` flag
**When** the command executes
**Then** the CLI displays "Error: --release flag is required"
**And** shows usage example: `specdeck features create <feature-id> --release <release-id>`
**And** exits with code 1

#### Scenario: Create feature with non-existent release
**Given** release `R99-unknown` does not exist
**When** the user runs `specdeck features create FND-03 --release R99-unknown`
**Then** the CLI displays "Error: Release 'R99-unknown' not found"
**And** suggests running `specdeck releases list`
**And** exits with code 1

#### Scenario: Create feature with duplicate ID
**Given** release `R1-foundation` already contains feature `FND-01`
**When** the user runs `specdeck features create FND-01 --release R1-foundation`
**Then** the CLI displays "Error: Feature 'FND-01' already exists in release 'R1-foundation'"
**And** exits with code 1

#### Scenario: Create feature with invalid ID format
**Given** the user runs `specdeck features create invalid-feature --release R1`
**When** validation runs
**Then** the CLI displays "Error: Invalid feature ID 'invalid-feature'"
**And** shows expected format "Use uppercase prefix with numbers (e.g., FND-01, PLT-02)"
**And** exits with code 1

### Requirement: Extract Features from Release Files
The CLI MUST parse the Features section of release Markdown files and extract feature IDs and titles.

#### Scenario: Parse features from bullet list
**Given** a release file with Features section:
```markdown
## Features

- FND-01: Unified Task List (MVP)
- FND-02: Unified Notifications (MVP)
- FND-03: Integration Framework (MVP)
```
**When** the parser extracts features
**Then** it returns an array of 3 feature objects
**And** each object contains `id` and `title` extracted from the line
**And** `id` is "FND-01", "FND-02", "FND-03"
**And** `title` is the text after the colon

#### Scenario: Parse features from table format (alternative)
**Given** a release file with Features as a table:
```markdown
## Features

| ID     | Title                        |
|--------|------------------------------|
| FND-01 | Unified Task List (MVP)      |
| FND-02 | Unified Notifications (MVP)  |
```
**When** the parser extracts features
**Then** it returns an array of 2 feature objects
**And** extracts `id` from first column and `title` from second column

#### Scenario: Parse features with mixed formats
**Given** a release file with both bullet lists and inline feature mentions
**When** the parser extracts features
**Then** it prefers Features section bullet list format
**And** ignores inline mentions elsewhere in the document

### Requirement: Cross-Reference Features with Stories
The CLI MUST link features to user stories by matching feature ID prefixes in story IDs.

#### Scenario: Link stories by ID prefix
**Given** feature `FND-01` exists
**And** project-plan.md contains stories: `FND-01-01`, `FND-01-02`, `FND-01-UI`
**When** the CLI resolves stories for FND-01
**Then** it finds 3 stories matching the prefix "FND-01-"
**And** returns all matching story objects

#### Scenario: No stories found for feature
**Given** feature `FND-03` exists in a release
**And** no stories in project-plan.md match "FND-03-" prefix
**When** the CLI resolves stories for FND-03
**Then** it returns an empty array
**And** displays "No stories found" when showing feature details

#### Scenario: Stories in multiple milestones
**Given** feature `FND-01` exists
**And** stories `FND-01-01` appears in milestone "Q1 – Foundation"
**And** story `FND-01-02` appears in milestone "Q2 – Enhancement"
**When** the CLI resolves stories for FND-01
**Then** it finds both stories across all milestones
**And** includes milestone information in story objects

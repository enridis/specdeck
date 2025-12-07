# Spec: Story Management

## ADDED Requirements

### Requirement: List Stories for Feature
The CLI MUST provide a command to list all user stories for a specific feature, extracted from project-plan.md.

#### Scenario: List stories for feature in single repo
**Given** feature `FND-01` exists
**And** `openspec/project-plan.md` contains stories:
- FND-01-01: Unified Task List core implementation
- FND-01-02: Task filtering and sorting
**When** the user runs `specdeck stories list FND-01`
**Then** the output displays a table with columns [Story ID, Title, Status, Complexity, Owner]
**And** shows 2 rows with data from project-plan.md
**And** exits with code 0

#### Scenario: List stories with JSON output
**Given** feature `FND-01` has 2 stories
**When** the user runs `specdeck stories list FND-01 --json`
**Then** the output is a JSON array of story objects
**And** each object contains all story fields: `id`, `title`, `status`, `complexity`, `estimate`, `owner`, `jira`, `openspec`, `tags`, `notes`, `milestone`
**And** exits with code 0

#### Scenario: Filter stories by repository
**Given** config file specifies multiple repos
**And** feature `FND-02` has stories in `./project-plan.md` and `../api-repo/openspec/project-plan.md`
**When** the user runs `specdeck stories list FND-02 --repo ./`
**Then** the output shows only stories from current repo's project-plan.md
**And** excludes stories from other repos
**And** exits with code 0

#### Scenario: No stories found for feature
**Given** feature `FND-99` exists in a release
**And** no stories in project-plan.md match "FND-99-" prefix
**When** the user runs `specdeck stories list FND-99`
**Then** the CLI displays "No stories found for feature 'FND-99'"
**And** suggests creating stories with `specdeck stories decompose FND-99`
**And** exits with code 0

#### Scenario: Feature not found
**Given** no feature with ID `FND-99` exists in any release
**When** the user runs `specdeck stories list FND-99`
**Then** the CLI displays "Warning: Feature 'FND-99' not found in any release"
**And** searches project-plan.md anyway for matching story IDs
**And** displays any stories found (or "No stories found")
**And** exits with code 0

### Requirement: Decompose Feature into Stories
The CLI MUST provide an interactive command to propose decomposition of a feature into user stories.

#### Scenario: Decompose feature with interactive prompts
**Given** feature `FND-01: Unified Task List (MVP)` exists in release R1
**And** the user runs `specdeck stories decompose FND-01`
**When** the command prompts:
- "Is this a single-repo or multi-repo feature?" → User: "single-repo"
- "Repository name?" → User: "workspace-core"
- "Estimated total complexity (XS/S/M/L/XL)?" → User: "L"
- "Suggested number of stories?" → User: "3"
**Then** the CLI generates 3 story suggestions with IDs: FND-01-01, FND-01-02, FND-01-03
**And** assigns reasonable complexity to each (splitting L into M+S+S or similar)
**And** generates suggested titles based on feature description
**And** displays the suggestions as Markdown table rows
**And** exits with code 0

#### Scenario: Decompose feature and output as template
**Given** the user completes the decompose prompts
**When** the command generates story suggestions
**Then** the output is a formatted Markdown table matching project-plan.md structure
**And** includes columns: ID, Title, Status (all "planned"), Complexity, Estimate (TBA), Owner (TBA), Jira (TBA), OpenSpec (feature's openspec change or TBA), Tags, Notes
**And** the user can copy/paste directly into project-plan.md

#### Scenario: Decompose with apply flag
**Given** the user runs `specdeck stories decompose FND-01 --apply`
**And** completes all prompts
**When** the command generates stories
**Then** the CLI prompts "Append these stories to openspec/project-plan.md? (y/N)"
**And** if user confirms with "y"
**Then** the CLI finds the appropriate milestone section or creates one
**And** appends the story rows to the table
**And** saves the file
**And** displays "3 stories added to project-plan.md"
**And** exits with code 0

#### Scenario: Decompose multi-repo feature
**Given** feature `FND-02: Unified Notifications` exists
**And** the user runs `specdeck stories decompose FND-02`
**When** prompted "Is this a single-repo or multi-repo feature?" → User: "multi-repo"
**And** prompted "Repositories (comma-separated)?" → User: "notifications-api, notifications-ui"
**And** prompted "Stories per repo?" → User: "2"
**Then** the CLI generates story IDs with repo suffixes:
- FND-02-API-01, FND-02-API-02
- FND-02-UI-01, FND-02-UI-02
**And** displays stories grouped by repository
**And** notes which project-plan.md each story should go into

#### Scenario: Decompose feature with existing stories
**Given** feature `FND-01` already has 2 stories in project-plan.md
**And** the user runs `specdeck stories decompose FND-01`
**When** the command starts
**Then** the CLI displays warning "Feature 'FND-01' already has 2 stories"
**And** prompts "Continue to generate additional stories? (y/N)"
**And** if user confirms, generates new story IDs starting from next available number (FND-01-03, etc.)

### Requirement: Parse User Stories from Project Plan
The CLI MUST parse `openspec/project-plan.md` to extract milestones and user stories from GFM tables.

#### Scenario: Parse project-plan with single milestone
**Given** project-plan.md contains:
```markdown
## Milestone: Q1 – Foundation

### Stories

| ID        | Title                     | Status      | Complexity | Estimate | Owner     | Jira     | OpenSpec | Tags        | Notes |
|-----------|---------------------------|-------------|------------|----------|-----------|----------|----------|-------------|-------|
| FND-01-01 | Task list core impl       | in_progress | M          | 8        | j.doe     | PROJ-101 | task-mvp | tasks, api  | ...   |
| FND-01-02 | Task filtering            | planned     | S          | 5        | TBA       | TBA      | task-mvp | tasks, ui   | ...   |
```
**When** the parser processes this file
**Then** it extracts 1 milestone: "Q1 – Foundation"
**And** extracts 2 stories with all fields populated
**And** associates both stories with milestone "Q1 – Foundation"

#### Scenario: Parse project-plan with multiple milestones
**Given** project-plan.md contains 2 milestone sections with separate story tables
**When** the parser processes this file
**Then** it extracts 2 milestones
**And** associates each story with its parent milestone

#### Scenario: Parse story with optional empty fields
**Given** a story row has "TBA" in Owner, Jira, OpenSpec columns
**And** Estimate and Notes are empty
**When** the parser processes this story
**Then** it sets those fields to `null` or empty string
**And** does not fail validation for optional fields

#### Scenario: Parse story with tags
**Given** a story has Tags column: "onboarding, MSP, portal"
**When** the parser processes this story
**Then** it splits tags by comma and trims whitespace
**And** stores as array: ["onboarding", "MSP", "portal"]

### Requirement: Validate Story Structure
The CLI MUST validate user stories for required fields and proper formatting.

#### Scenario: Valid story
**Given** a story with ID "FND-01-01", Title "Task implementation", Status "planned", Complexity "M"
**When** validation runs
**Then** the story passes validation
**And** no errors are reported

#### Scenario: Invalid story ID format
**Given** a story with ID "invalid-id"
**When** validation runs
**Then** validation fails with "Story ID 'invalid-id' does not match pattern [A-Z]+-[A-Z0-9]+-\d+"
**And** shows file path and line number

#### Scenario: Invalid status value
**Given** a story with Status "in-flight"
**When** validation runs
**Then** validation fails with "Invalid status 'in-flight'. Allowed: planned, in_progress, in_review, blocked, done"

#### Scenario: Invalid complexity value
**Given** a story with Complexity "Medium"
**When** validation runs
**Then** validation fails with "Invalid complexity 'Medium'. Allowed: XS, S, M, L, XL"

#### Scenario: Missing required field
**Given** a story with empty Title
**When** validation runs
**Then** validation fails with "Story FND-01-01 missing required field: Title"

### Requirement: Story Filtering and Querying
The CLI MUST support filtering stories by various criteria.

#### Scenario: Filter stories by status
**Given** the user runs `specdeck stories list FND-01 --status in_progress`
**When** project-plan.md has 3 FND-01 stories with different statuses
**Then** the output shows only stories with status "in_progress"

#### Scenario: Filter stories by owner
**Given** the user runs `specdeck stories list FND-01 --owner j.doe`
**Then** the output shows only stories owned by "j.doe"

#### Scenario: Filter stories by complexity
**Given** the user runs `specdeck stories list FND-01 --complexity L,XL`
**Then** the output shows only large and extra-large stories

#### Scenario: Combine multiple filters
**Given** the user runs `specdeck stories list FND-01 --status planned --complexity M`
**Then** the output shows only planned stories with medium complexity
**And** uses AND logic for multiple filters

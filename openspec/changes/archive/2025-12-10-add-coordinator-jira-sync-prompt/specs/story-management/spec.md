# story-management Spec Delta

## ADDED Requirements

### Requirement: Coordinator Jira Sync Data Commands

The CLI MUST provide coordinator-aware commands that surface Jira sync candidates and full story details (including overlay data) for one or more story IDs.

#### Scenario: Generate Jira sync plan
- **Given** coordinator mode is enabled with cached stories and overlays
- **When** the user runs `specdeck jira sync-plan --global`
- **Then** the CLI reads `.specdeck-cache/stories.json` (or warns if stale)
- **And** outputs a table with columns: Repo, Feature, Story ID, Status, Jira (overlay), Sync Reason
- **And** lists stories missing Jira mappings or with mismatched Jira values across overlays/submodules
- **And** exits with code 0

#### Scenario: Sync plan JSON for automation
- **Given** coordinator mode is enabled
- **When** the user runs `specdeck jira sync-plan --json --feature AUTH-01`
- **Then** the CLI returns JSON objects containing repo, feature, storyId, title, status, complexity, overlayJira, sourceRepoPath, and reason
- **And** results are filtered to `AUTH-01`
- **And** exit code is 0 even when list is empty

#### Scenario: Show full story detail for multiple IDs
- **Given** coordinator cache is available
- **When** the user runs `specdeck stories show AUTH-01-01 FE-AUTH-01-02 --with-jira --global --all-fields`
- **Then** the CLI returns all columns for each story (title, status, complexity, estimate, owner, milestone, tags, notes, openspec, Jira from overlay, repo, feature, release)
- **And** includes overlay Jira even if story files omit Jira column
- **And** supports `--json` for machine-readable output
- **And** supports `--no-cache` to read directly from submodules when cache is stale

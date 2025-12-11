# web-ui-frontend Specification

## Purpose
TBD - created by archiving change add-web-ui-mode. Update Purpose after archive.
## Requirements
### Requirement: Dashboard View

The UI MUST provide a dashboard that summarizes story statistics from the stats API using cards and text breakdowns.

**Acceptance Criteria:**
- Fetches overall stats from `/api/stats` when the dashboard loads
- Renders summary cards for total stories, total points, done count, and in-progress count
- Shows textual lists for stories by status and by complexity; lists show "No stories yet" when empty
- Displays a centered loading state while fetching and an inline error block on failure
- Handles missing fields by displaying zero/default values instead of crashing

#### Scenario: View dashboard summary
- **Given** the user opens `/`
- **And** the stats API returns totals and byStatus/byComplexity maps
- **When** the response arrives
- **Then** the cards show the totals
- **And** the lists show counts for each status and complexity

### Requirement: Release List View

The UI MUST provide a view that lists all releases with navigation to details.

**Acceptance Criteria:**
- Releases displayed as cards or table rows
- Each release shows: ID, title, timeframe, feature count, story count
- Click on release navigates to release detail view
- "Create Release" button opens creation form
- Empty state shown when no releases exist

#### Scenario: View release list

**Given** multiple releases exist in the project  
**When** the user navigates to `/releases`  
**Then** the user sees a list/grid of release cards  
**And** each card shows release metadata  
**And** clicking a card navigates to `/releases/:id`

#### Scenario: Create new release

**Given** the user is on the releases page  
**When** the user clicks "Create Release"  
**Then** a modal/form appears  
**And** the form has fields for ID, title, timeframe  
**And** submitting valid data creates the release  
**And** the user is redirected to the new release detail page

### Requirement: Release Detail View

The UI MUST provide a detailed view of a single release with its features.

**Acceptance Criteria:**
- Display release metadata (ID, title, timeframe, objectives)
- List all features in the release
- Show story count and status breakdown per feature
- Provide "Edit Release" and "Delete Release" actions
- Provide "Create Feature" button
- Click on feature navigates to feature detail view

#### Scenario: View release details

**Given** release `R1-foundation` exists with 4 features  
**When** the user navigates to `/releases/R1-foundation`  
**Then** the user sees release header with metadata  
**And** a list of features with story counts  
**And** each feature is clickable to drill down

#### Scenario: Navigate to feature from release

**Given** the user is viewing release details  
**When** the user clicks on feature `CLI-CORE`  
**Then** the user navigates to `/features/CLI-CORE`  
**And** the feature detail view loads

### Requirement: Feature List View

The UI MUST provide a filterable list of all features across releases.

**Acceptance Criteria:**
- Features displayed in table or card format
- Filter by release using dropdown
- Each feature shows: ID, title, release, story count
- Click on feature navigates to feature detail view
- "Create Feature" button opens creation form

#### Scenario: Filter features by release

**Given** features exist across multiple releases  
**When** the user selects "R1-foundation" from release filter  
**Then** only features from R1-foundation are displayed  
**And** the feature count is updated

### Requirement: Feature Detail View

The UI MUST provide a detailed view of a single feature with its stories.

**Acceptance Criteria:**
- Display feature metadata (ID, title, description, release)
- Display stories in an editable table
- Table columns: ID, Title, Status, Complexity, Estimate, Owner, Milestone, Notes
- Provide "Create Story" button
- Provide inline editing for story fields
- Status changes save immediately on selection
- Provide "Edit Feature" and "Delete Feature" actions

#### Scenario: View feature with stories

**Given** feature `CLI-CORE` exists with 5 stories  
**When** the user navigates to `/features/CLI-CORE`  
**Then** the user sees feature header  
**And** a table with all 5 stories  
**And** each story row is interactive

#### Scenario: Update story status inline

**Given** the user is viewing a feature with stories  
**When** the user clicks on a story's status dropdown  
**And** selects "in_progress"  
**Then** the status updates immediately in the UI (optimistic update)  
**And** an API call is made to save the change  
**And** on success, a subtle confirmation is shown  
**And** on error, the status reverts and error is displayed

#### Scenario: Create new story

**Given** the user is viewing a feature  
**When** the user clicks "Create Story"  
**Then** a modal/form appears with story fields  
**And** the feature and release are pre-filled  
**And** submitting creates the story  
**And** the story appears in the table

### Requirement: Story List View

The UI MUST provide a story list with table view and single-select filters for key fields.

**Acceptance Criteria:**
- Table columns: Story (ID and title), Status badge, Complexity, Points, Feature, Release, Assignee, Milestone
- In coordinator mode a Jira column is appended; outside coordinator mode the Jira column is hidden
- Filters: dropdowns for status, complexity, feature, release; client-side dropdowns for assignee and milestone (including a "Not Set" option)
- Filters apply immediately without URL persistence or pagination
- Actions (New Story, edit, delete) are shown only when not in coordinator mode; coordinator mode renders rows read-only
- Loading and error states are shown above the table

#### Scenario: Filter stories by status and feature
- **Given** the story list contains multiple features and statuses
- **When** the user selects status "in_progress" and feature "CLI-CORE"
- **Then** only matching rows remain in the table
- **And** non-matching rows are hidden without a page reload

#### Scenario: Coordinator mode hides story actions
- **Given** coordinator mode is enabled
- **When** the stories page renders
- **Then** no New Story button or row actions are displayed
- **And** the Jira column is shown next to the milestone column

### Requirement: Story Edit Modal

The UI MUST provide a modal for editing story details.

**Acceptance Criteria:**
- Modal contains all story fields as form inputs
- ID field is readonly (cannot change after creation)
- Dropdown for status (all valid values)
- Dropdown for complexity (XS, S, M, L, XL)
- Text input for title, owner, milestone
- Number input for estimate
- Textarea for notes
- Tag input for tags (add/remove multiple)
- Form validation before submit
- Cancel button discards changes

#### Scenario: Edit story details

**Given** the user clicks on a story in the list  
**When** the edit modal opens  
**Then** all current values are pre-filled  
**And** the user can modify any field  
**And** clicking "Save" updates the story via API  
**And** on success, the modal closes and table refreshes

#### Scenario: Validation prevents invalid save

**Given** the user is editing a story  
**When** the user clears the title field  
**And** clicks "Save"  
**Then** an error message appears: "Title cannot be empty"  
**And** the form is not submitted

### Requirement: Navigation and Routing

The UI MUST provide top navigation links for all views with conditional access to overlays.

**Acceptance Criteria:**
- Header renders brand and links to Dashboard (`/`), Releases, Features, and Stories
- Overlays link is shown only when coordinator mode is true
- Navigation uses client-side routing so links do not trigger full page reloads
- Routes configured: `/`, `/releases`, `/releases/:id`, `/features`, `/features/:id`, `/stories`, `/stories/:id`, `/overlays` (guarded by coordinator mode)

#### Scenario: Navigate via header links
- **Given** the user is on any view
- **When** they click "Features" in the header
- **Then** the features list renders using client-side routing without a page refresh

#### Scenario: Hide overlays link outside coordinator mode
- **Given** coordinator mode is disabled in config
- **When** the header renders
- **Then** no Overlays nav link is shown
- **And** attempting to visit `/overlays` shows an informational message about coordinator mode

### Requirement: Loading and Error States

The UI MUST provide clear feedback during loading and error conditions.

**Acceptance Criteria:**
- Loading spinner shown during API calls
- Skeleton UI shown for initial page loads
- Error messages displayed in toasts or alerts
- Retry mechanism for failed API calls
- Network error detection with helpful message

#### Scenario: Handle loading state

**Given** the user navigates to a view that fetches data  
**When** the API call is in progress  
**Then** a loading spinner or skeleton UI is shown  
**And** no empty state or error is shown yet

#### Scenario: Handle API error

**Given** the user attempts to create a story  
**When** the API returns 400 Bad Request  
**Then** an error toast appears with the validation message  
**And** the form remains open for correction  
**And** the error details highlight the problematic field

#### Scenario: Handle network error

**Given** the user tries to load data  
**When** the network is unavailable  
**Then** an error message appears: "Cannot connect to server. Please check if server is running."  
**And** a "Retry" button is provided

### Requirement: Responsive Design

The UI MUST be usable on different screen sizes.

**Acceptance Criteria:**
- Desktop layout (>1024px): full sidebar, multi-column layouts
- Tablet layout (768-1024px): collapsible sidebar, adjusted grids
- Mobile layout (<768px): hamburger menu, stacked layouts
- Tables become scrollable or card-based on mobile
- All interactive elements have adequate touch targets (44x44px minimum)

#### Scenario: View on mobile device

**Given** the user accesses the UI on a mobile device  
**When** the page loads  
**Then** the sidebar collapses into a hamburger menu  
**And** tables display as scrollable or cards  
**And** all buttons are touch-friendly

### Requirement: Visual Design

The UI MUST follow consistent design patterns and styling.

**Acceptance Criteria:**
- Tailwind CSS utility classes for styling
- Consistent color palette (primary, secondary, success, warning, danger)
- Status badges color-coded: planned (gray), in_progress (blue), in_review (yellow), blocked (red), done (green)
- Complexity badges use size metaphor: XS (smallest), XL (largest)
- Font: system font stack for performance
- Icons: Heroicons or similar icon set

#### Scenario: Status badge colors

**Given** a story has status "in_progress"  
**When** the status is displayed in the UI  
**Then** a blue badge shows "in_progress"  
**And** the badge has consistent padding and border radius

### Requirement: Form Validation

The UI MUST validate all user inputs before submission.

**Acceptance Criteria:**
- Required fields marked with asterisk
- Client-side validation before API call
- Validation errors shown inline below field
- Invalid fields highlighted with red border
- Submit button disabled until form is valid
- Validation rules match Zod schemas

#### Scenario: Validate story ID format

**Given** the user is creating a story  
**When** the user enters ID "invalid-id"  
**And** tabs out of the field  
**Then** an error appears: "Story ID must match pattern: PREFIX-FEATURE-NUMBER"  
**And** the field is highlighted in red

### Requirement: Optimistic Updates

The UI MUST provide immediate feedback for user actions with optimistic updates.

**Acceptance Criteria:**
- Status changes reflect immediately in UI
- On API success, no additional update needed
- On API failure, revert to previous state and show error
- Loading indicator shown subtly during API call

#### Scenario: Optimistic status update

**Given** the user changes a story status from "planned" to "in_progress"  
**When** the user selects the new status  
**Then** the UI updates immediately  
**And** a small spinner shows next to the status  
**And** if the API succeeds, the spinner disappears  
**And** if the API fails, the status reverts and an error toast appears

### Requirement: Web UI MUST support coordinator mode with auto-sync and overlay editing

The Web UI MUST detect coordinator mode, auto-sync on first load when needed, expose manual refresh with stale indicator, and render aggregated data read-only.

**Acceptance Criteria:**
- Reads `/api/config` on load to determine coordinator mode, cache info, and Jira base URL
- When coordinator mode is enabled and no last sync time is present, triggers `/api/sync` automatically and shows "Syncing..." in the header
- Header shows "Synced {ageDescription}" when cache exists, adds a "Stale (>24h)" badge when the sync is older than 24 hours, and offers a Refresh button to rerun sync
- Sync errors surface inline in the header
- Overlays navigation is available while in coordinator mode to manage Jira mappings
- Stories and feature list/detail pages hide create/edit/delete actions when coordinator mode is enabled; server-side read-only enforcement blocks other mutation attempts

#### Scenario: UI detects coordinator mode and auto-syncs on load
- **Given** `/api/config` returns `isCoordinatorMode: true` and no `syncedAt`
- **When** the app loads
- **Then** the header shows "Syncing..." and triggers `/api/sync`
- **And** after completion the header shows "Synced" with a relative timestamp

#### Scenario: Manual refresh triggers sync
- **Given** coordinator mode is enabled and cache exists
- **When** the user clicks Refresh in the header
- **Then** `/api/sync` runs
- **And** the last sync label updates with the new timestamp
- **And** any sync error shows inline in the header

#### Scenario: Story data is read-only in coordinator mode
- **Given** the app is in coordinator mode
- **When** the user opens the stories page
- **Then** the New Story button and row action buttons are hidden
- **And** story rows are not editable inline

#### Scenario: Display last sync timestamp with stale badge
- **Given** the cache timestamp is older than 24 hours
- **When** the header renders
- **Then** it shows "Synced {age}" with a "Stale (>24h)" badge next to it

### Requirement: Web UI MUST provide overlay editor with validation

The Web UI MUST provide a coordinator-only overlays page that lists Jira mappings and allows adding new mappings with inline validation.

**Acceptance Criteria:**
- Accessing `/overlays` when not in coordinator mode shows an informational message instead of the editor
- In coordinator mode, the page loads overlay data from `/api/overlays` and stories from `/api/stories`
- Provides a search input with dropdown suggestions (up to 10) matching story ID or title and a Jira ticket input
- Submitting a mapping posts to `/api/overlays/:featureId/map` using the selected story's feature ID and shows success or inline error messages from the API
- The mapping table lists each feature with its Jira mappings and links tickets using the configured Jira base URL
- Loading and error states are shown for fetch and add actions

#### Scenario: Add Jira mapping from story search
- **Given** coordinator mode is enabled and the overlays page is open
- **And** the user selects a story from the search dropdown
- **When** they submit a Jira ticket ID
- **Then** the UI calls `/api/overlays/{featureId}/map`
- **And** on success the mapping appears in the overlay list with a Jira link

#### Scenario: Validation error for non-existent story
- **Given** coordinator mode is enabled
- **When** the user submits a mapping for a story ID not in cache
- **Then** the UI shows the error returned by the API
- **And** no mapping is added

### Requirement: Web UI MUST display stories with Jira links from overlays

The Web UI MUST show Jira ticket links for stories when coordinator overlays provide mappings.

**Acceptance Criteria:**
- When coordinator mode is enabled, the stories table renders a Jira column with links built from `jiraBaseUrl` and the mapped ticket
- Stories without Jira mappings show a placeholder dash in the Jira column
- The Jira column is omitted when not in coordinator mode

#### Scenario: Display Jira link in coordinator mode
- **Given** coordinator mode is enabled
- **And** a story has Jira mapping `PROJ-123`
- **When** the stories list renders
- **Then** the Jira column shows link `.../browse/PROJ-123` that opens in a new tab
- **And** a story without mapping shows "-"

### Requirement: Web UI MUST detect and notify about stale submodules

The Web UI MUST surface a warning when the coordinator reports stale submodules.

**Acceptance Criteria:**
- Calls `/api/config/submodules/status` after loading config when coordinator mode is enabled
- If `anyStale` is true, shows a header banner advising to run `git submodule update --remote`
- The warning banner is not shown when `anyStale` is false or when not in coordinator mode
- Banner content does not list per-repo counts in the current UI

#### Scenario: Show stale submodule warning
- **Given** coordinator mode is enabled and `anyStale` is true
- **When** the header renders
- **Then** a warning banner appears with the suggested git command

### Requirement: Release and Feature Statistics Cards

The UI MUST surface story statistics cards on release and feature detail pages using stats API responses.

**Acceptance Criteria:**
- Release detail calls `/api/stats/releases/:id` and renders cards for total stories, done count, in-progress count, total points, and points done.
- Feature detail calls `/api/stats/features/:id` and renders the same cards.
- Additional point breakdown cards (in progress, in review, planned) render when provided by the API.
- Cards fall back to zero/defaults when stats fields are missing to avoid crashes.
- Stats sections appear above the feature and story listings.

#### Scenario: View release stats cards
- **Given** a release page loads
- **And** `/api/stats/releases/R1` returns story totals and points by status
- **When** the page renders
- **Then** cards show total stories, done, in_progress, total points, and points done values
- **And** missing fields render as 0 instead of erroring

#### Scenario: View feature stats cards
- **Given** a feature page loads
- **And** `/api/stats/features/CLI-CORE` returns stats
- **When** the page renders
- **Then** the cards show totals and points using that response


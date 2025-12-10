# web-ui-frontend Specification

## Purpose
TBD - created by archiving change add-web-ui-mode. Update Purpose after archive.
## Requirements
### Requirement: Dashboard View

The UI MUST provide a dashboard that displays project overview and key metrics.

**Acceptance Criteria:**
- Dashboard shows total counts for releases, features, stories
- Dashboard displays story status distribution (pie/bar chart)
- Dashboard shows stories by complexity breakdown
- Dashboard displays recent activity (last 10 changes)
- All data loads from API endpoints
- Loading states shown during data fetch

#### Scenario: View dashboard

**Given** the user navigates to `/`  
**When** the page loads  
**Then** the user sees summary cards showing counts  
**And** a chart showing story status distribution  
**And** a chart showing complexity breakdown  
**And** a list of recent changes (if available in future)

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

The UI MUST provide a comprehensive, filterable list of all stories.

**Acceptance Criteria:**
- Stories displayed in sortable, filterable table
- Filters: status, complexity, feature, milestone, owner
- Table columns: ID, Title, Feature, Status, Complexity, Estimate, Owner, Milestone
- Click on story opens edit modal
- Multi-select filters (e.g., multiple statuses)
- Filter state persisted in URL query params
- Pagination for large lists (>50 stories)

#### Scenario: Filter stories by status

**Given** the story list has stories with various statuses  
**When** the user selects "in_progress" and "in_review" from status filter  
**Then** only stories matching those statuses are displayed  
**And** the URL updates to `/stories?status=in_progress,in_review`

#### Scenario: Filter stories by milestone

**Given** stories are grouped by milestones  
**When** the user selects "M1" from milestone filter  
**Then** only stories in M1 are displayed  
**And** the count shows filtered/total

#### Scenario: Sort stories by column

**Given** the story table is displayed  
**When** the user clicks on the "Status" column header  
**Then** stories are sorted by status alphabetically  
**And** clicking again reverses the sort order

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

The UI MUST provide intuitive navigation between all views.

**Acceptance Criteria:**
- Sidebar/header with links to: Dashboard, Releases, Features, Stories
- Breadcrumb navigation shows current location
- Browser back/forward buttons work correctly
- All routes are bookmarkable
- 404 page for invalid routes

#### Scenario: Navigate via sidebar

**Given** the user is on any page  
**When** the user clicks "Releases" in the sidebar  
**Then** the releases list view loads  
**And** the sidebar highlights the active section

#### Scenario: Breadcrumb navigation

**Given** the user is viewing `/releases/R1-foundation/features/CLI-CORE`  
**Then** the breadcrumb shows: Dashboard > Releases > R1-foundation > CLI-CORE  
**And** each breadcrumb segment is clickable  
**And** clicking "R1-foundation" navigates back to release detail

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

The Web UI MUST detect coordinator mode, automatically sync on load, display aggregated stories from cache as read-only, and provide editable overlay management with immediate save and validation.

#### Scenario: UI detects coordinator mode and auto-syncs on load

**Given** `.specdeck.config.json` has coordinator mode enabled  
**And** user opens the Web UI  
**When** the UI loads  
**Then** it detects coordinator mode from config  
**And** displays "Syncing..." indicator  
**And** triggers `specdeck sync` command in background  
**And** loads cache data after sync completes  
**And** displays stories from all submodules  
**And** shows sync timestamp "Synced 30 seconds ago" in header

#### Scenario: Display last sync timestamp with staleness warning

**Given** cache file exists with timestamp  
**And** cache is 2 hours old  
**When** UI displays story list  
**Then** header shows "Synced 2 hours ago"  
**And** no warning badge (under 24 hours)  
**When** cache is 2 days old  
**Then** header shows "Synced 2 days ago"  
**And** displays warning badge with text "⚠️ Cache is stale"

#### Scenario: Manual refresh triggers sync

**Given** UI is loaded in coordinator mode  
**And** user clicks "Refresh" button in header  
**When** refresh is triggered  
**Then** UI shows "Syncing..." indicator  
**And** runs `specdeck sync` command  
**And** reloads cache data after completion  
**And** updates sync timestamp  
**And** displays success message "Synced successfully"

#### Scenario: Story data is read-only in coordinator mode

**Given** UI displays stories from cache  
**And** story `BE-AUTH-01-01` is from backend submodule  
**When** user hovers over story row  
**Then** no edit button appears  
**And** tooltip shows "Edit stories in their original repos, then sync"  
**When** user attempts to click story fields  
**Then** fields are non-editable  
**And** cursor shows not-allowed icon

### Requirement: Web UI MUST provide overlay editor with validation

The Web UI MUST allow users to create, edit, and delete overlay files and Jira mappings with immediate save, inline validation, and error handling.

#### Scenario: Create new overlay file for feature

**Given** coordinator mode enabled  
**And** feature `AUTH-01` exists in backend submodule  
**When** user navigates to Overlays section  
**And** clicks "New Overlay" button  
**And** selects repository "backend" from dropdown  
**And** enters feature ID "AUTH-01"  
**And** clicks "Create"  
**Then** UI creates file `overlays/backend/AUTH-01.overlay.md`  
**And** displays success message "Overlay created for AUTH-01"  
**And** opens overlay editor for the new file

#### Scenario: Add Jira mapping with validation

**Given** overlay file `overlays/backend/AUTH-01.overlay.md` is open  
**And** story `BE-AUTH-01-01` exists in cache  
**When** user enters story ID "BE-AUTH-01-01" in input field  
**And** enters Jira ticket "PROJ-1234"  
**And** clicks "Add Mapping"  
**Then** UI validates story ID exists in cache  
**And** saves mapping immediately to overlay file  
**And** displays inline success "✓ Mapping added"  
**And** mapping appears in list below

#### Scenario: Validation error for non-existent story

**Given** overlay editor is open  
**When** user enters story ID "BE-AUTH-99-99" (does not exist)  
**And** enters Jira ticket "PROJ-5555"  
**And** clicks "Add Mapping"  
**Then** UI validates story ID against cache  
**And** displays inline error "❌ Story BE-AUTH-99-99 not found"  
**And** does NOT save mapping  
**And** suggests running sync if cache is stale

#### Scenario: Edit existing Jira mapping

**Given** overlay has mapping `BE-AUTH-01-01: PROJ-1234`  
**When** user clicks edit icon next to mapping  
**And** changes Jira ticket to "PROJ-5678"  
**And** clicks "Save"  
**Then** UI updates overlay file immediately  
**And** displays success "✓ Mapping updated"  
**And** new Jira link appears in story list (if loaded with `--with-jira`)

#### Scenario: Delete Jira mapping

**Given** overlay has mapping `BE-AUTH-01-01: PROJ-1234`  
**When** user clicks delete icon next to mapping  
**And** confirms deletion in modal  
**Then** UI removes mapping from overlay file  
**And** displays success "Mapping removed"  
**And** mapping disappears from list

### Requirement: Web UI MUST display stories with Jira links from overlays

The Web UI MUST show aggregated stories from all submodules with Jira links applied from overlays, repository labels, and filtering options.

#### Scenario: Display stories with Jira column

**Given** cache contains stories from 3 submodules  
**And** overlays have Jira mappings for some stories  
**When** user views story list  
**Then** table includes columns: ID, Title, Status, Complexity, Repo, Jira  
**And** Repo column shows `[backend]`, `[frontend]`, `[models]`  
**And** Jira column shows ticket links for stories with mappings  
**And** Jira column shows "—" for stories without mappings

#### Scenario: Filter stories by repository

**Given** stories from 3 repos displayed  
**When** user selects "backend" from repository dropdown  
**Then** table filters to show only `[backend]` stories  
**And** other repos' stories are hidden  
**When** user selects "All Repositories"  
**Then** all stories reappear

#### Scenario: Click Jira link opens ticket

**Given** story `BE-AUTH-01-01` has Jira link `PROJ-1234`  
**When** user clicks Jira link in table  
**Then** new browser tab opens to Jira ticket URL  
**And** URL is `https://jira.company.com/browse/PROJ-1234` (configured base URL)

### Requirement: Web UI MUST detect and notify about stale submodules

The Web UI MUST check submodule status and notify users when submodules are behind remote, providing instructions to update manually.

#### Scenario: Detect stale submodules

**Given** coordinator has 3 submodules  
**And** backend submodule is behind remote by 5 commits  
**When** UI loads  
**Then** it runs `git submodule status` command  
**And** detects backend is outdated  
**And** displays notification banner: "⚠️ Submodules outdated: backend (5 commits behind)"  
**And** shows instruction: "Run: git submodule update --remote"  
**And** includes copy-to-clipboard button for command

#### Scenario: Dismiss submodule notification

**Given** stale submodule notification is displayed  
**When** user clicks "Dismiss" button  
**Then** notification disappears  
**And** does not reappear until next UI load

#### Scenario: All submodules up to date

**Given** all submodules are synced with remote  
**When** UI checks submodule status  
**Then** no notification appears  
**And** header shows green checkmark "✓ Submodules up to date"


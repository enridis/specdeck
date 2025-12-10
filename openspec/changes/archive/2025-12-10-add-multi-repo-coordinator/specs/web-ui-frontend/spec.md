# web-ui-frontend Spec Delta

## ADDED Requirements

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

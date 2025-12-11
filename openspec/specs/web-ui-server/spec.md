# web-ui-server Specification

## Purpose
TBD - created by archiving change add-web-ui-mode. Update Purpose after archive.
## Requirements
### Requirement: HTTP Server Foundation

The CLI MUST provide an HTTP server that exposes REST APIs for managing releases, features, and stories.

**Acceptance Criteria:**
- Server runs on configurable port (default: 3000)
- Server binds to configurable host (default: localhost)
- Server serves static frontend files from `dist/ui/`
- Server handles CORS for local development
- Server implements graceful shutdown on SIGINT/SIGTERM

#### Scenario: Start server with default options

**Given** the user is in a directory with `specdeck/` folder  
**When** the user runs `specdeck serve`  
**Then** the server starts on `http://localhost:3000`  
**And** the console shows "SpecDeck server running at http://localhost:3000"  
**And** the browser opens automatically to the UI

#### Scenario: Start server with custom port

**Given** the user wants to avoid port conflicts  
**When** the user runs `specdeck serve --port 8080`  
**Then** the server starts on `http://localhost:8080`  
**And** the console shows the correct URL

#### Scenario: Start API-only mode

**Given** the user wants to develop frontend separately  
**When** the user runs `specdeck serve --api-only`  
**Then** the server starts without serving static files  
**And** only API routes are available

### Requirement: Release Management API

The server MUST provide REST endpoints for release CRUD operations.

**Acceptance Criteria:**
- `GET /api/releases` returns list of all releases
- `GET /api/releases/:id` returns release details with features
- `POST /api/releases` creates new release with validation
- `PUT /api/releases/:id` updates existing release
- `DELETE /api/releases/:id` deletes release and associated files
- All requests/responses use JSON format
- All mutations validate against ReleaseSchema

#### Scenario: List all releases

**Given** the `specdeck/releases/` directory contains multiple release files  
**When** a client sends `GET /api/releases`  
**Then** the response is 200 OK  
**And** the body contains array of release objects with `id`, `title`, `timeframe`, `features`  
**And** each release includes feature count

#### Scenario: Get release details

**Given** a release `R1-foundation` exists  
**When** a client sends `GET /api/releases/R1-foundation`  
**Then** the response is 200 OK  
**And** the body contains full release object with embedded features list  
**And** each feature includes story count and status breakdown

#### Scenario: Create new release

**Given** the client sends valid release data  
**When** a client sends `POST /api/releases` with `{"id": "R2-growth", "title": "Growth", "timeframe": "Q2 2025"}`  
**Then** the response is 201 Created  
**And** the file `specdeck/releases/R2-growth.md` is created  
**And** the file contains proper YAML frontmatter and structure  
**And** the release directory `specdeck/releases/R2-growth/` is created

#### Scenario: Handle duplicate release creation

**Given** a release `R1-foundation` already exists  
**When** a client sends `POST /api/releases` with `{"id": "R1-foundation", ...}`  
**Then** the response is 409 Conflict  
**And** the body contains error message "Release R1-foundation already exists"

### Requirement: Feature Management API

The server MUST provide REST endpoints for feature CRUD operations.

**Acceptance Criteria:**
- `GET /api/features` returns list of all features across all releases
- `GET /api/features?release=R1` filters features by release
- `GET /api/features/:id` returns feature details with stories
- `POST /api/features` creates new feature in specified release
- `PUT /api/features/:id` updates feature metadata
- `DELETE /api/features/:id` deletes feature file
- All mutations update both feature file and release overview file

#### Scenario: List features with filter

**Given** multiple releases contain features  
**When** a client sends `GET /api/features?release=R1-foundation`  
**Then** the response is 200 OK  
**And** the body contains only features belonging to R1-foundation  
**And** each feature includes `id`, `title`, `release`, `storyCount`

#### Scenario: Get feature with stories

**Given** feature `CLI-CORE` exists with 5 stories  
**When** a client sends `GET /api/features/CLI-CORE`  
**Then** the response is 200 OK  
**And** the body contains feature details  
**And** the `stories` array contains all 5 story objects  
**And** stories include status distribution statistics

#### Scenario: Create new feature

**Given** release `R1-foundation` exists  
**When** a client sends `POST /api/features` with `{"id": "NEW-01", "title": "New Feature", "release": "R1-foundation", "description": "..."}`  
**Then** the response is 201 Created  
**And** the file `specdeck/releases/R1-foundation/NEW-01.md` is created  
**And** the file contains proper frontmatter and empty stories table  
**And** the release overview file is updated to include NEW-01 in features list

### Requirement: Story Management API

The server MUST provide REST endpoints for story CRUD operations.

**Acceptance Criteria:**
- `GET /api/stories` returns list of all stories with pagination
- `GET /api/stories?feature=CLI-CORE` filters stories by feature
- `GET /api/stories?milestone=M1` filters stories by milestone
- `GET /api/stories?status=in_progress` filters stories by status
- `GET /api/stories/:id` returns single story details
- `POST /api/stories` creates new story in feature file
- `PUT /api/stories/:id` updates story in feature file
- `DELETE /api/stories/:id` removes story from feature file
- All story mutations preserve table formatting and other stories

#### Scenario: List stories with multiple filters

**Given** multiple stories exist across features  
**When** a client sends `GET /api/stories?status=in_progress&feature=CLI-CORE`  
**Then** the response is 200 OK  
**And** the body contains only stories matching both filters  
**And** response includes pagination metadata (total, filtered count)

#### Scenario: Update story status

**Given** story `CLI-CORE-01` exists with status "planned"  
**When** a client sends `PUT /api/stories/CLI-CORE-01` with `{"status": "in_progress"}`  
**Then** the response is 200 OK  
**And** the feature file is updated with new status  
**And** the Markdown table remains valid  
**And** other stories in the table are unchanged

#### Scenario: Create story with auto-incremented ID

**Given** feature `CLI-CORE` has stories up to `CLI-CORE-04`  
**When** a client sends `POST /api/stories` with `{"title": "New story", "featureId": "CLI-CORE", "releaseId": "R1-foundation"}` (no ID)  
**Then** the system generates ID `CLI-CORE-05`  
**And** the response is 201 Created  
**And** the new story is appended to the feature file table

#### Scenario: Handle invalid story update

**Given** a story exists  
**When** a client sends `PUT /api/stories/:id` with invalid data (e.g., `{"status": "invalid"}`)  
**Then** the response is 400 Bad Request  
**And** the body contains Zod validation error details  
**And** the file is not modified

### Requirement: Statistics API

The server MUST provide aggregated statistics endpoints.

**Acceptance Criteria:**
- `GET /api/stats` returns overall project statistics
- `GET /api/stats/releases/:id` returns release-specific stats
- `GET /api/stats/features/:id` returns feature-specific stats
- Statistics include counts by status, complexity, milestone
- Statistics calculated on-demand (no caching in v1)

#### Scenario: Get overall statistics

**Given** the project has 3 releases, 12 features, 45 stories  
**When** a client sends `GET /api/stats`  
**Then** the response is 200 OK  
**And** the body contains:
```json
{
  "releases": { "total": 3 },
  "features": { "total": 12 },
  "stories": {
    "total": 45,
    "byStatus": { "done": 20, "in_progress": 15, "planned": 10 },
    "byComplexity": { "S": 10, "M": 25, "L": 10 },
    "totalPoints": 180
  }
}
```

#### Scenario: Get release statistics

**Given** release `R1-foundation` has 4 features with various story statuses  
**When** a client sends `GET /api/stats/releases/R1-foundation`  
**Then** the response includes feature breakdown and story metrics  
**And** percentages for completion are calculated

### Requirement: Error Handling

The server MUST provide consistent error responses across all endpoints.

**Acceptance Criteria:**
- All errors return JSON with `success: false`
- Validation errors include field-level details
- Not found errors return 404 with helpful message
- Server errors return 500 with sanitized error message
- All errors are logged with full stack trace
- CORS errors return appropriate headers

#### Scenario: Handle not found

**Given** no release with ID "R99-missing" exists  
**When** a client sends `GET /api/releases/R99-missing`  
**Then** the response is 404 Not Found  
**And** the body contains:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Release R99-missing not found"
  }
}
```

#### Scenario: Handle validation error

**Given** a client sends invalid story data  
**When** a client sends `POST /api/stories` with `{"id": "invalid"}`  
**Then** the response is 400 Bad Request  
**And** the body contains Zod error details:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Story ID must match pattern: PREFIX-FEATURE-NUMBER",
    "details": {
      "field": "id",
      "value": "invalid"
    }
  }
}
```

### Requirement: Request Logging

The server MUST log all incoming requests and responses.

**Acceptance Criteria:**
- Log format: `[timestamp] METHOD /path - status responseTime`
- Log request body for POST/PUT (truncated if >1KB)
- Log errors with full stack trace
- Log level configurable via `--verbose` flag
- Logs written to stdout (not file)

#### Scenario: Log successful request

**Given** the server is running  
**When** a client sends `GET /api/releases`  
**Then** the console shows: `[2025-12-08T10:00:00Z] GET /api/releases - 200 45ms`

#### Scenario: Log error with stack trace

**Given** the server is running with `--verbose`  
**When** an endpoint throws an error  
**Then** the console shows full error message and stack trace  
**And** the response still returns sanitized error to client

### Requirement: Coordinator Mode APIs

The server MUST expose coordinator-mode endpoints for config, sync, and overlays, and enforce read-only behavior for cached data.

**Acceptance Criteria:**
- `GET /api/config` returns coordinator flag, metadata (submoduleCount, cacheDir, overlaysDir), jiraBaseUrl, specdeckDir, and cache `syncedAt` when available; responds 500 on read failure
- `GET /api/config/submodules/status` returns `statuses` and `anyStale` when coordinator is enabled; responds 400 when coordinator mode is off
- `POST /api/sync` runs only in coordinator mode with configured submodules; aggregates stories, applies overlays, writes cache (unless `dryRun`), and returns summary stats and `syncedAt`; responds 400 when not coordinator or no submodules
- `GET /api/overlays` returns aggregated overlay mappings (featureId + Jira ticket pairs) when coordinator mode is enabled; responds 400 otherwise
- `POST /api/overlays/:featureId/map` validates required `storyId` and `jiraTicket`, checks story existence in submodules, writes mapping to overlays directory, and returns success payload; responds 400 when validation fails or coordinator is off
- Feature and story mutation endpoints return 403 with `COORDINATOR_READ_ONLY` when coordinator mode is enabled

#### Scenario: Fetch coordinator config with cached sync time
- **Given** coordinator mode is enabled and cache has `syncedAt`
- **When** a client calls `GET /api/config`
- **Then** the response includes `isCoordinatorMode: true`, coordinator metadata, `jiraBaseUrl`, and the cached `syncedAt` timestamp

#### Scenario: Run sync and persist cache
- **Given** coordinator mode is enabled with submodules configured
- **When** a client posts to `/api/sync` without `dryRun`
- **Then** the server aggregates stories, writes cache with `syncedAt`, and returns totalStories and mappedStories statistics

#### Scenario: Add overlay mapping with validation
- **Given** coordinator mode is enabled
- **And** story `BE-AUTH-01-01` exists in a configured submodule
- **When** a client posts `/api/overlays/AUTH-01/map` with `storyId` and `jiraTicket`
- **Then** the server validates the story, saves the mapping, and returns success
- **When** the story ID is not found
- **Then** the server returns 400 with an error message

#### Scenario: Coordinator mode blocks story updates
- **Given** coordinator mode is enabled
- **When** a client sends `PUT /api/stories/CLI-01` with updates
- **Then** the response is 403 with error code `COORDINATOR_READ_ONLY`


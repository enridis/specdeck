---
id: add-web-ui-mode
title: Design Document
---

# Design: Web UI Mode for SpecDeck

## Architecture Overview

```
┌─────────────────────────────────────────┐
│          Browser (Client)               │
│  ┌───────────────────────────────────┐  │
│  │  React Frontend (SPA)             │  │
│  │  - Dashboard Views                │  │
│  │  - CRUD Forms                     │  │
│  │  - Navigation Components          │  │
│  └───────────────────────────────────┘  │
└─────────────────┬───────────────────────┘
                  │ HTTP/REST API
┌─────────────────▼───────────────────────┐
│     Express.js Backend Server           │
│  ┌───────────────────────────────────┐  │
│  │  REST API Layer                   │  │
│  │  - GET/POST/PUT/DELETE endpoints  │  │
│  │  - Request validation             │  │
│  │  - Error handling                 │  │
│  └───────────┬───────────────────────┘  │
│              │                           │
│  ┌───────────▼───────────────────────┐  │
│  │  Existing Service Layer           │  │
│  │  - StoryService                   │  │
│  │  - FeatureService                 │  │
│  │  - ReleaseService                 │  │
│  └───────────┬───────────────────────┘  │
│              │                           │
│  ┌───────────▼───────────────────────┐  │
│  │  Existing Repository Layer        │  │
│  │  - File I/O operations            │  │
│  │  - Markdown parsing/writing       │  │
│  └───────────────────────────────────┘  │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│     File System (specdeck/)             │
│  - releases/R1-foundation.md            │
│  - releases/R1-foundation/FEAT-01.md    │
└─────────────────────────────────────────┘
```

## Technology Stack

### Backend
- **Framework**: Express.js (lightweight, Node.js native)
- **TypeScript**: Reuse existing types and schemas
- **Existing Dependencies**: Commander, Zod, unified/remark
- **New Dependencies**:
  - `express` - HTTP server framework
  - `cors` - CORS middleware for development
  - `@types/express` - TypeScript types

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite (fast dev server, optimized builds)
- **UI Library**: Tailwind CSS (utility-first styling)
- **State Management**: React Context + hooks (no Redux needed for v1)
- **HTTP Client**: native `fetch` API
- **Table Component**: TanStack Table (formerly React Table)

### Rationale
- **Express.js**: Minimal learning curve, integrates well with existing Node.js tooling
- **React**: Most popular framework, good TypeScript support, rich ecosystem
- **Vite**: Fast HMR, zero-config TypeScript, optimized production builds
- **Tailwind**: Rapid UI development without CSS files, good defaults

## API Design

### REST Endpoints

#### Releases
```
GET    /api/releases                    # List all releases
GET    /api/releases/:id                # Get release details with features
POST   /api/releases                    # Create new release
PUT    /api/releases/:id                # Update release
DELETE /api/releases/:id                # Delete release
```

#### Features
```
GET    /api/features                    # List all features
GET    /api/features?release=R1         # Filter by release
GET    /api/features/:id                # Get feature details with stories
POST   /api/features                    # Create new feature
PUT    /api/features/:id                # Update feature
DELETE /api/features/:id                # Delete feature
```

#### Stories
```
GET    /api/stories                     # List all stories
GET    /api/stories?feature=CLI-CORE    # Filter by feature
GET    /api/stories?milestone=M1        # Filter by milestone
GET    /api/stories?status=in_progress  # Filter by status
GET    /api/stories/:id                 # Get story details
POST   /api/stories                     # Create new story
PUT    /api/stories/:id                 # Update story
DELETE /api/stories/:id                 # Delete story
```

#### Statistics
```
GET    /api/stats                       # Overall statistics
GET    /api/stats/releases/:id          # Release-specific stats
GET    /api/stats/features/:id          # Feature-specific stats
```

### Request/Response Format

**Create Story Request:**
```json
{
  "id": "CLI-CORE-05",
  "title": "Add verbose logging support",
  "featureId": "CLI-CORE",
  "releaseId": "R1-foundation",
  "status": "planned",
  "complexity": "M",
  "estimate": 5,
  "owner": "TBA",
  "milestone": "M2",
  "tags": ["cli", "logging"]
}
```

**List Stories Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "CLI-CORE-01",
      "title": "CLI entry point",
      "featureId": "CLI-CORE",
      "releaseId": "R1-foundation",
      "status": "done",
      "complexity": "M",
      "estimate": 5,
      "milestone": "M1"
    }
  ],
  "meta": {
    "total": 42,
    "filtered": 10
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Story ID must match pattern: PREFIX-FEATURE-NUMBER",
    "details": {
      "field": "id",
      "value": "invalid-id"
    }
  }
}
```

## Frontend Architecture

### Component Structure

```
src/
  components/
    layout/
      Header.tsx
      Sidebar.tsx
      Layout.tsx
    releases/
      ReleaseList.tsx
      ReleaseCard.tsx
      ReleaseDetail.tsx
      ReleaseForm.tsx
    features/
      FeatureList.tsx
      FeatureCard.tsx
      FeatureDetail.tsx
      FeatureForm.tsx
    stories/
      StoryList.tsx
      StoryTable.tsx
      StoryCard.tsx
      StoryForm.tsx
      StatusBadge.tsx
    common/
      Button.tsx
      Modal.tsx
      LoadingSpinner.tsx
      ErrorAlert.tsx
  pages/
    Dashboard.tsx
    ReleasePage.tsx
    FeaturePage.tsx
    StoryPage.tsx
  hooks/
    useReleases.ts
    useFeatures.ts
    useStories.ts
    useApi.ts
  contexts/
    AppContext.tsx
  services/
    api.service.ts
  types/
    index.ts (imported from backend)
```

### Key Views

1. **Dashboard** (`/`)
   - Overview cards: total releases, features, stories
   - Status distribution chart
   - Recent activity list

2. **Release List** (`/releases`)
   - Card/table view of all releases
   - Click to drill down to features

3. **Release Detail** (`/releases/:id`)
   - Release metadata
   - Feature list with story counts
   - Milestone breakdown

4. **Feature Detail** (`/features/:id`)
   - Feature description
   - Story table with inline editing
   - Add new story button

5. **Story List** (`/stories`)
   - Filterable table (status, complexity, feature, milestone)
   - Bulk actions (future)
   - Quick status updates

## File Persistence Strategy

### Write Operations

1. **Story Update Flow**:
   ```
   PUT /api/stories/:id → StoryService.updateStory()
                        → StoryRepository.update()
                        → Read feature file
                        → Parse stories table
                        → Update story row
                        → Regenerate Markdown table
                        → Write atomically to file
   ```

2. **Feature Creation Flow**:
   ```
   POST /api/features → FeatureService.createFeature()
                      → FeatureRepository.create()
                      → Update release overview file (add feature)
                      → Create new feature file with empty stories table
   ```

3. **Atomicity**:
   - Write to `.tmp` file first
   - Validate the written content
   - Rename to final filename (atomic on POSIX)
   - On error, rollback by removing `.tmp`

### Validation

- All writes validate against Zod schemas before persisting
- Markdown parser validates structure after write
- Return detailed errors to UI for user correction

### Concurrency

**v1 Approach** (No file locking):
- Last write wins
- Single-user assumption (localhost)
- User responsible for avoiding concurrent edits (CLI vs UI)

**Future Enhancement**:
- Add file watching to detect external changes
- Prompt user to reload if file changed externally
- Implement optimistic locking with ETags

## CLI Integration

### New Command: `serve`

```bash
specdeck serve [options]

Options:
  --port <port>     Port to run server on (default: 3000)
  --open            Open browser automatically
  --api-only        Run API server without frontend
  --host <host>     Host to bind to (default: localhost)
```

Implementation in `src/commands/serve.ts`:
```typescript
export function createServeCommand(): Command {
  const serve = new Command('serve')
    .description('Start web UI server for SpecDeck management')
    .option('--port <port>', 'Port number', '3000')
    .option('--open', 'Open browser automatically')
    .option('--api-only', 'Run API server only')
    .option('--host <host>', 'Host to bind to', 'localhost')
    .action(startServer);

  return serve;
}
```

### Build Process

Update `package.json` scripts:
```json
{
  "scripts": {
    "build": "tsc && npm run build:ui && npm run copy-templates",
    "build:ui": "cd ui && vite build && cp -r dist ../dist/ui",
    "dev:api": "tsc --watch",
    "dev:ui": "cd ui && vite",
    "dev:all": "concurrently \"npm run dev:api\" \"npm run dev:ui\""
  }
}
```

Frontend built to `dist/ui/` and served as static files by Express.

## Data Flow Diagram

### Read Flow
```
Browser → HTTP GET → Express Router → Service Layer → Repository Layer
                                                    → Parse Markdown Files
                                                    → Return Domain Objects
        ← JSON Response ←─────────────────────────────────────────────────┘
```

### Write Flow
```
Browser → HTTP POST/PUT → Validation Middleware → Service Layer
                                                 → Repository Layer
                                                 → Write Markdown Files
                                                 → Validate Written Content
        ← Success/Error ←────────────────────────────────────────────────┘
```

## Error Handling

### Backend
- Express error middleware catches all errors
- Zod validation errors → 400 Bad Request
- File I/O errors → 500 Internal Server Error
- Not found → 404 Not Found
- Log all errors with stack traces

### Frontend
- Global error boundary catches React errors
- API errors displayed in toasts/alerts
- Form validation errors shown inline
- Network errors trigger retry mechanism

## Security Considerations

### v1 Scope (Localhost Only)
- No authentication (trust localhost access)
- CORS restricted to `localhost:*`
- No HTTPS (local development)
- Validate all inputs with Zod schemas
- Sanitize file paths to prevent traversal

### Future Enhancements
- Add token-based authentication
- HTTPS support for remote access
- Rate limiting
- Audit log for all changes

## Performance Considerations

### Backend
- Cache parsed Markdown files in memory (TTL: 30s)
- Lazy-load stories when viewing features
- Implement pagination for large story lists (>100)

### Frontend
- Virtual scrolling for large tables (TanStack Table built-in)
- Debounce filter inputs (300ms)
- Optimistic UI updates (immediate feedback, rollback on error)
- Code splitting by route (lazy load pages)

### Benchmarks
- API response time: <100ms for listing operations
- UI initial load: <2s for 200+ stories
- Story update: <200ms round-trip

## Testing Strategy

### Backend Tests
- Unit tests for API endpoints (mocked services)
- Integration tests for full request/response cycle
- Validation tests for all Zod schemas
- File persistence tests (temp directory fixtures)

### Frontend Tests
- Component tests with React Testing Library
- API integration tests (mocked fetch)
- E2E tests with Playwright for critical paths

### Manual Testing Checklist
- [ ] Create release through UI, verify Markdown file
- [ ] Create feature, verify it appears in release
- [ ] Create story, verify it appears in feature file
- [ ] Update story status, verify Markdown table updated
- [ ] Delete story, verify removed from Markdown
- [ ] Filter stories by multiple criteria
- [ ] Navigate hierarchy: release → feature → story

## Migration Path

### For Existing Users
1. No migration needed - UI reads existing files
2. Run `npm install` to get new dependencies
3. Run `specdeck serve` to launch UI
4. Continue using CLI commands alongside UI

### Rollback Plan
- UI changes only add new code, doesn't modify existing
- Users can continue using CLI exclusively
- No breaking changes to file format or CLI commands

## Future Enhancements (Out of Scope for v1)

1. **File Watching**: Reload UI when files change externally
2. **Bulk Operations**: Move all stories in milestone to new status
3. **Undo/Redo**: In-memory operation history
4. **Diff Preview**: Show changes before saving
5. **Export**: PDF/HTML reports of release plans
6. **VS Code Extension**: Embed UI in VS Code webview
7. **Dark Mode**: Theme support
8. **Keyboard Shortcuts**: Power-user navigation
9. **Search**: Full-text search across all entities
10. **Charts**: Burndown charts, velocity tracking

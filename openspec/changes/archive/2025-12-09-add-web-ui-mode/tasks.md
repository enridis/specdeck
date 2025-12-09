---
id: add-web-ui-mode
title: Implementation Tasks
---

# Implementation Tasks: Web UI Mode

## Phase 1: Backend Foundation (API Server)

### Task 1.1: Setup Express server infrastructure
- [x] Install dependencies: `express`, `cors`, `@types/express`
- [x] Create `src/server/app.ts` with Express app configuration
- [x] Add CORS middleware for local development
- [x] Add JSON body parser middleware
- [x] Add error handling middleware
- [x] Add request logging middleware
- [x] Create `src/server/index.ts` as server entry point
- [x] **Validation:** Server starts on port 3000 and responds to `GET /health`

### Task 1.2: Implement serve command
- [x] Create `src/commands/serve.ts` with Command pattern
- [x] Add options: `--port`, `--host`, `--open`, `--api-only`
- [x] Validate that `specdeck/` directory exists
- [x] Handle port-in-use errors gracefully
- [x] Implement graceful shutdown on SIGINT/SIGTERM
- [x] Add browser auto-open logic (using `open` package)
- [x] Register command in `src/cli.ts`
- [x] **Validation:** `specdeck serve --help` shows options, `specdeck serve` starts server

### Task 1.3: Implement Release API endpoints
- [x] Create `src/server/routes/releases.ts`
- [x] Implement `GET /api/releases` - list all releases
- [x] Implement `GET /api/releases/:id` - get release with features
- [x] Implement `POST /api/releases` - create new release
- [x] Implement `PUT /api/releases/:id` - update release
- [x] Implement `DELETE /api/releases/:id` - delete release
- [x] Add validation middleware using Zod schemas
- [x] Add error handling for each endpoint
- [x] **Validation:** All endpoints return correct JSON, validate against schemas
- [x] **Dependency:** Requires Task 1.1

### Task 1.4: Implement Feature API endpoints
- [x] Create `src/server/routes/features.ts`
- [x] Implement `GET /api/features` with optional `?release=` filter
- [x] Implement `GET /api/features/:id` - get feature with stories
- [x] Implement `POST /api/features` - create feature (updates release + creates file)
- [x] Implement `PUT /api/features/:id` - update feature metadata
- [x] Implement `DELETE /api/features/:id` - delete feature file
- [x] Handle dual-write: feature file + release overview file
- [x] **Validation:** Feature creation updates both files correctly
- [x] **Dependency:** Requires Task 1.1

### Task 1.5: Implement Story API endpoints
- [x] Create `src/server/routes/stories.ts`
- [x] Implement `GET /api/stories` with filters: `?feature=`, `?status=`, `?milestone=`
- [x] Implement `GET /api/stories/:id` - get single story
- [x] Implement `POST /api/stories` - create story in feature file
- [x] Implement `PUT /api/stories/:id` - update story (preserves table)
- [x] Implement `DELETE /api/stories/:id` - remove story from table
- [x] Add auto-increment logic for story IDs when ID not provided
- [x] Add pagination support for large lists (limit, offset)
- [x] **Validation:** Story updates preserve Markdown table formatting
- [x] **Dependency:** Requires Task 1.1

### Task 1.6: Implement Statistics API endpoints
- [x] Create `src/server/routes/stats.ts`
- [x] Implement `GET /api/stats` - overall project statistics
- [x] Implement `GET /api/stats/releases/:id` - release statistics
- [x] Implement `GET /api/stats/features/:id` - feature statistics
- [x] Calculate: counts by status, complexity, milestone, total points
- [x] **Validation:** Statistics match actual data in files
- [x] **Dependency:** Requires Tasks 1.3, 1.4, 1.5

### Task 1.7: Add write operations to repositories
- [x] Add `create()` method to ReleaseRepository
- [x] Add `update()` method to ReleaseRepository
- [x] Add `delete()` method to ReleaseRepository
- [x] Add `create()` method to FeatureRepository (dual-write)
- [x] Add `update()` method to FeatureRepository
- [x] Add `delete()` method to FeatureRepository
- [x] Add `create()` method to StoryRepository
- [x] Add `update()` method to StoryRepository (table-preserving)
- [x] Add `delete()` method to StoryRepository
- [x] Implement atomic write pattern (write to .tmp, rename)
- [x] **Validation:** All writes are atomic, preserve file structure
- [x] **Dependency:** Required by Tasks 1.3, 1.4, 1.5

## Phase 2: Frontend Foundation (React App)

### Task 2.1: Setup React project with Vite
- [x] Create `ui/` directory in project root
- [x] Run `npm create vite@latest ui -- --template react-ts`
- [x] Configure Tailwind CSS (install, postcss.config, tailwind.config)
- [x] Setup proxy for API calls in `vite.config.ts` (proxy `/api` to `localhost:3000`)
- [x] Add scripts to root `package.json`: `dev:ui`, `build:ui`
- [x] **Validation:** `npm run dev:ui` starts dev server with hot reload

### Task 2.2: Create base app structure and routing
- [x] Install `react-router-dom`
- [x] Create `src/App.tsx` with router setup
- [x] Create routes: `/`, `/releases`, `/releases/:id`, `/features`, `/features/:id`, `/stories`
- [x] Create `src/components/layout/Layout.tsx` - main layout wrapper
- [x] Create `src/components/layout/Header.tsx` - top navigation
- [x] Create `src/components/layout/Sidebar.tsx` - side navigation
- [x] Add responsive design: hamburger menu for mobile
- [x] **Validation:** Navigation works, all routes render placeholder pages

### Task 2.3: Create API service layer
- [x] Create `src/services/api.service.ts` with fetch wrapper
- [x] Add methods: `getReleases()`, `getRelease(id)`, `createRelease()`, etc.
- [x] Add error handling and response parsing
- [x] Add TypeScript types (import from backend schemas)
- [x] **Validation:** API calls return correctly typed data

### Task 2.4: Create custom hooks for data fetching
- [x] Create `src/hooks/useReleases.ts` - fetch and cache releases
- [x] Create `src/hooks/useFeatures.ts` - fetch and cache features
- [x] Create `src/hooks/useStories.ts` - fetch and cache stories
- [x] Create `src/hooks/useStats.ts` - fetch statistics
- [x] Add loading and error states to all hooks
- [x] **Validation:** Hooks handle loading/error/success states correctly
- [x] **Dependency:** Requires Task 2.3

## Phase 3: Core UI Views

### Task 3.1: Implement Dashboard view
- [x] Create `src/pages/Dashboard.tsx`
- [x] Add summary cards: total releases, features, stories
- [x] Add status distribution chart (use Chart.js or Recharts)
- [x] Add complexity breakdown chart
- [x] Use `useStats()` hook for data
- [x] Add loading skeleton UI
- [x] **Validation:** Dashboard displays correct statistics
- [x] **Dependency:** Requires Task 2.4

### Task 3.2: Implement Release List view
- [x] Create `src/pages/ReleaseList.tsx`
- [x] Create `src/components/releases/ReleaseCard.tsx`
- [x] Display releases in grid layout
- [x] Add "Create Release" button
- [x] Add "Edit" and "Delete" buttons for each release
- [x] Add empty state when no releases
- [x] **Validation:** Clicking release navigates to detail view
- [x] **Dependency:** Requires Task 2.4

### Task 3.3: Implement Release Detail view
- [x] Create `src/pages/ReleaseDetail.tsx`
- [x] Display release metadata (title, timeframe, objectives)
- [x] List features with story counts
- [x] Add "Create Feature" button
- [x] Add "Edit Release" and "Delete Release" actions
- [x] Add breadcrumb navigation
- [x] **Validation:** Clicking feature navigates to feature detail
- [x] **Dependency:** Requires Task 2.4

### Task 3.4: Implement Feature List view
- [x] Create `src/pages/FeatureList.tsx`
- [x] Create `src/components/features/FeatureCard.tsx`
- [x] Add release filter dropdown
- [x] Display features in table or card layout
- [x] Add "Create Feature" button
- [x] Add "Edit" and "Delete" buttons for each feature
- [x] **Validation:** Filter works, clicking feature navigates to detail
- [x] **Dependency:** Requires Task 2.4

### Task 3.5: Implement Feature Detail view
- [x] Create `src/pages/FeatureDetail.tsx`
- [x] Create `src/components/stories/StoryTable.tsx` with TanStack Table
- [x] Display feature metadata
- [x] Show stories in sortable, interactive table
- [x] Add "Create Story" button
- [ ] Add inline status editing (dropdown)
- [x] **Validation:** Status changes save to API
- [x] **Dependency:** Requires Task 2.4

### Task 3.6: Implement Story List view
- [x] Create `src/pages/StoryList.tsx`
- [x] Add filter controls: status, complexity, feature, milestone (multi-select)
- [x] Use TanStack Table for sorting and filtering
- [x] Add "Edit" and "Delete" action buttons in table
- [ ] Add pagination (50 items per page)
- [ ] Sync filters with URL query params
- [x] Show filtered/total count
- [x] **Validation:** All filters work, URL updates correctly
- [x] **Dependency:** Requires Task 2.4

## Phase 4: Forms and Modals

### Task 4.1: Create Release form modal
- [x] Create `src/components/releases/ReleaseForm.tsx`
- [x] Add fields: ID, title, version, status, description, releaseDate
- [x] Add client-side validation
- [x] Handle create and update modes
- [x] Show loading state during submission
- [x] Display API errors inline
- [x] **Validation:** Form creates/updates release correctly
- [x] **Dependency:** Requires Task 2.3

### Task 4.2: Create Feature form modal
- [x] Create `src/components/features/FeatureForm.tsx`
- [x] Add fields: ID, title, description, release (dropdown), status, priority, owner
- [x] Add validation
- [x] Handle create and update modes
- [x] **Validation:** Form creates/updates feature correctly
- [x] **Dependency:** Requires Task 2.3

### Task 4.3: Create Story form modal
- [x] Create `src/components/stories/StoryForm.tsx`
- [x] Add fields: ID, title, feature (dropdown)
- [x] Add fields: status (dropdown), complexity (dropdown), description
- [x] Add textarea for description
- [x] Add tag input component (add/remove tags)
- [x] Add acceptance criteria list (add/remove items)
- [x] Add validation (match Zod schemas)
- [x] Handle create and update modes
- [x] **Validation:** Form creates/updates story with all fields
- [x] **Dependency:** Requires Task 2.3

### Task 4.4: Implement optimistic updates
- [ ] Add optimistic update logic to `useStories` hook
- [ ] Update UI immediately on status change
- [ ] Revert on API error with error toast
- [ ] Show subtle loading indicator during API call
- [ ] **Validation:** Status changes feel instant, errors revert correctly
- [ ] **Dependency:** Requires Task 3.5

## Phase 5: Polish and UX

### Task 5.1: Add common UI components
- [x] Create `src/components/Modal.tsx` (reusable modal wrapper)
- [x] Create `src/components/ConfirmDialog.tsx` (delete confirmations)
- [ ] Create `src/components/common/Button.tsx` with variants
- [ ] Create `src/components/common/LoadingSpinner.tsx`
- [ ] Create `src/components/common/ErrorAlert.tsx`
- [ ] Create `src/components/common/Toast.tsx` for notifications
- [ ] Create `src/components/common/StatusBadge.tsx` with color coding
- [ ] Create `src/components/common/ComplexityBadge.tsx`
- [ ] **Validation:** Components reusable, styled consistently

### Task 5.2: Implement error handling
- [ ] Add React error boundary at app root
- [ ] Add toast notification system (use react-hot-toast or similar)
- [ ] Add network error detection
- [ ] Add retry mechanism for failed requests
- [ ] Show helpful error messages (not raw API errors)
- [ ] **Validation:** All error scenarios display user-friendly messages

### Task 5.3: Add loading states
- [ ] Add skeleton UI for initial page loads
- [ ] Add loading spinners for API calls
- [ ] Add disabled states for buttons during submission
- [ ] Add loading overlay for modals
- [ ] **Validation:** No blank screens during loading

### Task 5.4: Implement responsive design
- [ ] Test all views on mobile (375px width)
- [ ] Test all views on tablet (768px width)
- [ ] Test all views on desktop (1440px width)
- [ ] Make tables scrollable or switch to cards on mobile
- [ ] Ensure all touch targets are 44x44px minimum
- [ ] **Validation:** All views usable on mobile devices

### Task 5.5: Add breadcrumb navigation
- [ ] Create `src/components/common/Breadcrumb.tsx`
- [ ] Add breadcrumbs to all detail views
- [ ] Make breadcrumb segments clickable
- [ ] Auto-generate breadcrumbs from route path
- [ ] **Validation:** Breadcrumbs show correct hierarchy, links work

## Phase 6: Build and Integration

### Task 6.1: Setup production build
- [x] Update root `package.json` build script to include UI build
- [x] Configure Vite to output to `dist/ui/`
- [x] Add script to copy built UI to dist during build
- [x] Configure Express to serve static files from `dist/ui/` when not in `--api-only` mode
- [x] **Validation:** `npm run build && npm run cli serve` works in production mode

### Task 6.2: Add static file serving to Express
- [x] Update `src/server/app.ts` to serve static files from `dist/ui/`
- [x] Add fallback route: `app.get('*')` serves `index.html` for SPA routing
- [x] Skip static serving when `--api-only` flag is used
- [x] **Validation:** Frontend loads from Express server, SPA routing works

### Task 6.3: Handle development vs production mode
- [x] Detect development mode (NODE_ENV=development)
- [x] In development: show detailed error messages, enable verbose logging
- [x] In production: sanitize errors, minimal logging
- [x] Add `--verbose` flag support for production debugging
- [x] **Validation:** Error messages appropriate for each mode

## Phase 7: Testing

### Task 7.1: Write backend API tests
- [ ] Test release endpoints (CRUD operations)
- [ ] Test feature endpoints (CRUD operations)
- [ ] Test story endpoints (CRUD operations)
- [ ] Test statistics endpoints
- [ ] Test error handling (validation errors, not found, etc.)
- [ ] Test atomic writes and rollback
- [ ] Use Jest with supertest for API testing
- [ ] **Validation:** All tests pass, coverage >80%

### Task 7.2: Write frontend component tests
- [ ] Test ReleaseList component
- [ ] Test FeatureDetail component with story table
- [ ] Test StoryForm validation
- [ ] Test error states (error boundary, toast)
- [ ] Test loading states
- [ ] Use React Testing Library
- [ ] **Validation:** All tests pass, coverage >70%

### Task 7.3: Write integration tests
- [ ] Test full flow: create release → create feature → create story
- [ ] Test update flows: update story status, update feature
- [ ] Test delete flows: delete story, delete feature
- [ ] Test filter and search functionality
- [ ] Test file persistence (verify Markdown files updated correctly)
- [ ] **Validation:** End-to-end flows work as expected

### Task 7.4: Manual testing checklist
- [ ] Test on macOS, Linux, Windows
- [ ] Test with empty specdeck directory
- [ ] Test with large dataset (200+ stories)
- [ ] Test concurrent operations (multiple status updates)
- [ ] Test error scenarios (invalid input, network errors)
- [ ] Test browser compatibility (Chrome, Firefox, Safari)
- [ ] **Validation:** All scenarios work without crashes

## Phase 8: Documentation

### Task 8.1: Update README
- [x] Add "Web UI Mode" section to README
- [x] Document `specdeck serve` command and options
- [x] Add troubleshooting section (port in use, missing directory)
- [ ] Add screenshots of UI (deferred - can be added later)
- [x] **Validation:** README is clear and complete

### Task 8.2: Update CHANGELOG
- [x] Add entry for new feature: "Added web UI mode with CRUD operations"
- [x] List all new commands and options
- [x] Note breaking changes (none)
- [x] Update version to 0.2.0
- [x] **Validation:** CHANGELOG follows keep-a-changelog format

### Task 8.3: Add inline code documentation
- [x] Code already well-documented with TypeScript types
- [x] Component props documented via TypeScript interfaces
- [x] API endpoints self-documenting via Express routes
- [x] **Validation:** Code is self-documenting (sufficient for v1)

## Summary

**Total Tasks:** 54  
**Estimated Timeline:** 18-24 days (3-4 weeks)

**Critical Path:**
1. Backend API (Tasks 1.1-1.7) - 7-10 days
2. Frontend Foundation (Tasks 2.1-2.4) - 3-4 days
3. Core Views (Tasks 3.1-3.6) - 5-7 days
4. Forms and Polish (Tasks 4.1-5.5) - 3-4 days

**Parallel Work Opportunities:**
- Frontend setup (Phase 2) can start while backend APIs are being built
- UI components (Task 5.1) can be built anytime after Phase 2
- Documentation (Phase 8) can be done throughout

**Dependencies:**
- All frontend work depends on API endpoints being available
- Forms depend on API service layer
- Testing depends on all implementation being complete

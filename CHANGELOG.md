# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2025-12-10

### Added

- **Multi-Repository Coordinator Mode** - Unified project management across multiple repositories
  - Git submodule support for mounting public/private/on-premises repos
  - Overlay files for proprietary metadata (Jira links) separate from public repos
  - `sync` command to aggregate stories from submodules and apply overlays
  - Enhanced `list` commands with `--with-jira`, `--global`, `--repo` flags
  - Global story ID validation to prevent conflicts across repositories
  - Overlay management commands: `overlay create`, `overlay map`, `overlay validate`
  - Web UI coordinator support with auto-sync and overlay editing
- **Jira Sync Copilot Prompt** - AI-assisted Jira synchronization for coordinator mode
  - Bundled `specdeck-jira-sync.prompt.md` template for LLM-guided sync workflows
  - `jira sync-plan` command to identify sync candidates with detailed reasoning
  - Enhanced `stories show` command with multi-ID support and full overlay data
  - Coordinator-aware cache and overlay integration for sync operations

### Changed

### Fixed

## [0.2.0] - 2025-12-08

### Added

- **Web UI Mode** - Interactive web interface for managing SpecDeck projects
  - `serve` command to launch web server with React-based UI
  - Full CRUD operations for releases, features, and stories
  - Dashboard with project statistics and status distribution
  - Interactive forms with validation for creating/editing entities
  - Delete confirmations to prevent accidental data loss
  - Real-time file synchronization - all changes persist to Markdown
  - Filtering and search capabilities for stories
- **REST API** - Express.js backend with full API endpoints
  - `/api/releases` - List, create, update, delete releases
  - `/api/features` - List, create, update, delete features (with release filter)
  - `/api/stories` - List, create, update, delete stories (with filters)
  - `/api/stats` - Project-wide and entity-specific statistics
  - Request validation using existing Zod schemas
  - Error handling with user-friendly messages
- **Serve Command Options**
  - `--port <number>` - Custom port (default: 3000)
  - `--host <string>` - Custom host for network access
  - `--open` - Auto-open browser after start
  - `--api-only` - Run API server without UI (for CI/testing)
- Write operations in repositories
  - Atomic file writes (temp file + rename pattern)
  - Dual-write support for features (release overview + feature file)
  - Table-preserving updates for stories
- Production build configuration
  - Vite build outputs to `dist/ui/`
  - Express serves static files in production
  - SPA routing fallback for client-side navigation

### Changed

- Repository layer now supports create/update/delete operations (was read-only)
- Story repository preserves Markdown table formatting during updates
- Build process includes UI compilation (`npm run build` → builds both CLI + UI)

### Dependencies

- express@4.18.2 - Web server framework
- cors@2.8.5 - CORS middleware for development
- react@18.2.0 - UI framework
- react-dom@18.2.0 - React DOM renderer
- react-router-dom@6.20.1 - Client-side routing
- vite@5.0.8 - Build tool and dev server
- tailwindcss@3.4.0 - Utility-first CSS framework
- @types/express@4.17.21 - TypeScript types for Express

### Technical Details

- **Architecture**: Express backend serves React SPA with REST API
- **Data Flow**: UI → API → Services → Repositories → Markdown files
- **File Format**: No changes to existing Markdown structure
- **Compatibility**: All files remain editable via CLI and text editor
- **Performance**: UI loads in <2s for projects with 200+ stories

## [0.1.0] - 2025-12-06

### Added

- Initial release of SpecDeck CLI
- `list` command for releases, features, and stories
  - Filter stories by status, complexity, feature, and owner
  - Statistics view for story breakdown
  - JSON output support
- `create` command for releases and features
  - Generate release files with YAML front matter
  - Interactive guidance for feature creation
- `propose` command for feature decomposition
  - Decomposition guidance with story patterns
  - Proposal template generation
- `sync` command for OpenSpec integration
  - Status reconciliation with change proposals
  - Dry-run mode for preview
- `validate` command for structure validation
  - Validate vision, releases, and project plan
  - Strict validation mode
- Markdown parser with YAML front matter support
- Zod schema validation for stories, releases, features
- Repository pattern for file I/O abstraction
- Service layer for business logic
- Comprehensive test suite
- Full documentation (README, CONTRIBUTING)

### Dependencies

- commander@11.1.0 - CLI framework
- zod@3.22.4 - Schema validation
- unified@11.0.4 - Markdown parsing
- remark-parse@11.0.0 - Markdown AST
- remark-gfm@4.0.0 - GitHub Flavored Markdown
- remark-frontmatter@5.0.0 - YAML front matter
- yaml@2.3.4 - YAML parsing
- chalk@5.3.0 - Terminal colors

[Unreleased]: https://github.com/yourusername/specdeck/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/yourusername/specdeck/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/yourusername/specdeck/releases/tag/v0.1.0

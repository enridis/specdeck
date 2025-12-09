# SpecDeck

A TypeScript CLI tool for managing engineering work through Git-based Markdown files. Supports standalone usage or integration with external tools (Jira, OpenSpec).

## Vision

SpecDeck enables teams to navigate and maintain the hierarchy of **Vision → Releases → Features → User Stories** through structured commands and Git-based Markdown artifacts. It makes spec-driven, Git-centric planning practical and accessible.

**Key Features:**
- **Two-tier planning**: Roadmap overview + detailed per-release story tracking
- **Git-based**: All planning data in Markdown files under version control
- **Flexible integration**: Works standalone or integrates with Jira/OpenSpec
- **Multi-repository support**: Track related work across multiple repos with universal story IDs
- **Developer-focused**: CLI commands for daily workflow integration

## Status

✅ **Released (v0.1.0)** - Foundation complete, all R1 stories implemented  
✅ **Released (v0.2.0)** - Web UI Mode with full CRUD operations

## Quick Links

- **Vision**: [specdeck/vision.md](specdeck/vision.md) - Product vision and roadmap
- **Project Roadmap**: [specdeck/project-plan.md](specdeck/project-plan.md) - High-level release overview
- **Releases**: 
  - [R1 - Foundation](specdeck/releases/R1-foundation.md) - CLI core (Complete ✅)
  - [R2 - Web UI](specdeck/releases/R2-webui.md) - Interactive interface (Complete ✅)

## Commands

SpecDeck provides the following commands:

### Web UI Mode

Launch an interactive web interface for managing releases, features, and stories:

```bash
# Start the web server (default: http://localhost:3000)
specdeck serve

# Custom port
specdeck serve --port 8080

# Custom host (for network access)
specdeck serve --host 0.0.0.0 --port 3000

# Open browser automatically
specdeck serve --open

# API-only mode (no UI, just REST endpoints)
specdeck serve --api-only
```

**Features:**
- 📊 **Dashboard** - Overview of releases, features, and story statistics
- 📝 **CRUD Operations** - Create, read, update, and delete releases/features/stories
- 🎯 **Interactive Forms** - User-friendly forms with validation
- 🔍 **Filtering & Search** - Filter stories by status, complexity, feature
- 📁 **File Sync** - All changes persist to Markdown files immediately
- ⚡ **Fast & Lightweight** - Vite-powered React UI with hot reload

**Use Cases:**
- Quick status updates without editing Markdown
- Bulk story creation through forms
- Visual hierarchy navigation (Release → Feature → Story)
- Non-technical stakeholder access (PMs, designers)
- Real-time statistics and progress tracking

**Troubleshooting:**
- **Port in use**: Use `--port` to specify different port
- **Directory not found**: Run `specdeck init copilot` first to create `specdeck/` directory
- **Changes not saved**: Check file permissions in `specdeck/` directory
- **UI not loading**: Try `npm run build` to rebuild the UI bundle

### Story Management
```bash
# List releases, features, and stories
specdeck list releases                    # List all releases
specdeck list releases --with-features    # Include feature counts

specdeck list features                    # List features in active release
specdeck list features --release <id>     # List features in specific release
specdeck list features --with-stories     # Include story details

specdeck list stories                     # List all stories
specdeck list stories --feature <id>      # Filter by feature
### Project Initialization & Creation
```bash
# Initialize SpecDeck project structure
specdeck init copilot                     # Creates specdeck/ directory and .github/prompts/

# Create new releases and features
specdeck create release <id> <title>      # Create a new release
specdeck create feature <id> <title> --release <releaseId>  # Create a new feature

# Propose new changes (OpenSpec integration)
specdeck propose <changeName>             # Create OpenSpec change proposal
```

The `init copilot` command scaffolds:
- **specdeck/** directory with:
  - `project-plan.md` - High-level roadmap
  - `releases/R1-foundation.md` - Detailed story tracking
  - `vision.md` - Product vision template
  - `AGENTS.md` - SpecDeck CLI instructions for AI assistants
- **Copilot prompt templates** in `.github/prompts/`:
  - specdeck-decompose.prompt.md - Break features into stories
  - specdeck-status.prompt.md - Story status reference
  - specdeck-commands.prompt.md - CLI commands cheatsheet

**Note:** OpenSpec integration is optional. The tool works standalone for pure story tracking.
  - `AGENTS.md` - SpecDeck CLI instructions for AI assistants
- **Copilot prompt templates** in `.github/prompts/`:
  - specdeck-decompose.prompt.md - Break features into stories
### Validation & Utilities
```bash
# Validate project structure
specdeck validate                         # Validate all SpecDeck files
specdeck validate --fix                   # Auto-fix common issues

# Upgrade templates to latest version
specdeck upgrade copilot                  # Upgrade all templates (with backup)
specdeck upgrade copilot --list           # Show available templates and versions
specdeck upgrade copilot --template <name>  # Upgrade specific template only
specdeck upgrade copilot --force          # Skip backup before upgrade

# Migrate project structure
specdeck migrate                          # Migrate to latest SpecDeck format
```bash
## Tech Stack

**Backend:**
- **TypeScript** - Type-safe implementation
- **Commander.js** - CLI framework
- **Express.js** - Web server for UI mode
- **unified + remark** - Markdown parsing with AST
- **Zod** - Schema validation and runtime type checking
- **Jest** - Testing framework
- **cli-table3** - Table formatting for terminal output
- **chalk** - Terminal colors and styling
- **cors** - CORS middleware for API

**Frontend (Web UI):**
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **TypeScript** - Type-safe components
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
```
## Tech Stack

- **TypeScript** - Type-safe implementation
- **Commander.js** - CLI framework
- **unified + remark** - Markdown parsing with AST
- **Zod** - Schema validation and types
- **Jest** - Testing framework
- **cli-table3** - Table formatting for terminal output
- **Express.js** - Web server for UI mode (v0.2.0+)
- **React 18 + Vite** - Interactive web UI (v0.2.0+)
- **Tailwind CSS** - Utility-first styling (v0.2.0+)
- **cli-table3** - Table formatting for terminal output

## Project Structure

```
specdeck/
├── docs/                          # Documentation
│   ├── manifesto.md              # OpenSpec-Driven Delivery principles
│   └── overview.md               # Delivery flow and hierarchy
├── specdeck/                      # SpecDeck tool artifacts (story tracking)
│   ├── project-plan.md           # High-level roadmap (all releases)
│   ├── vision.md                 # Product vision
│   ├── AGENTS.md                 # SpecDeck CLI instructions for AI
│   └── releases/                 # Per-release detailed story files
│       ├── R1-foundation.md      # R1 detailed stories
│       └── archive/              # Completed releases
├── openspec/                      # OpenSpec framework artifacts
│   ├── project.md                # Project context
│   ├── AGENTS.md                 # OpenSpec workflow instructions for AI
│   ├── releases/                 # OpenSpec release definitions (framework)
│   │   └── R1-foundation.md
│   ├── changes/                  # OpenSpec change proposals
│   │   ├── archive/              # Archived (completed) changes
│   │   │   └── 2025-12-06-add-cli-basic-foundation/
│   │   └── add-init-project-scaffolding/  # Active changes
│   └── specs/                    # Capability specifications
│       ├── cli-core/
│       ├── feature-management/
│       ├── story-management/
│       └── ...
├── .github/
│   └── prompts/                  # GitHub Copilot prompt templates
**Key Architecture Patterns:**
- **Two-Tier Planning:** `project-plan.md` (roadmap) + `releases/R*.md` (detailed stories)
- **Feature-Based Files:** Stories grouped by feature in `releases/R*/FEATURE.md`
- **Repository Pattern:** Clean separation between data access and business logic
- **Schema Validation:** Zod schemas ensure data consistency
- **REST API:** Express.js backend with JSON responses
- **File-Based Storage:** All data persists in Git-tracked Markdown files

**Story Table Structure:**
- Core columns: ID, Title, Status, Complexity, Owner, Description
## Integration Options

**Standalone Mode (Recommended):**
- Use SpecDeck for Git-based story tracking and project planning
- No external dependencies required
- All data in Markdown files under version control
- Perfect for teams wanting lightweight, file-based planning

**Optional Integrations:**
- **OpenSpec Framework:** Link stories to change proposals via `openspec` column
- **Jira:** Track external ticket IDs in `jira` column
- **Multi-repo:** Use universal story IDs across repositories

**This Project's Workflow:**
1. Vision and release objectives defined in `specdeck/`
2. Features decomposed into user stories
3. Stories tracked through status transitions
4. Web UI provides quick updates and visualizations
5. All changes committed to Git for audit trail

**Release History:**
- **R1 Foundation (v0.1.0):** CLI core, story management, parsing - Complete ✅
- **R2 Web UI (v0.2.0):** Express.js backend, React frontend, CRUD operations - Complete ✅
SpecDeck can work standalone or integrate with the OpenSpec-Driven Delivery framework:

**Standalone Mode:**
- Use SpecDeck for pure story tracking and project planning
- No external tool dependencies
- Core columns only in story tables

**OpenSpec Integration:**
- Link stories to OpenSpec changes via optional `openspec` column
- Sync story status with archived changes using `specdeck sync status`
- Full spec-driven development workflow with proposals, specs, and changes

This project itself uses OpenSpec integration as a reference implementation:

1. **Vision** defines the product direction and success metrics
2. **Release R1** defines Q1 2025 objectives and features (Complete)
3. **Project Plan** tracks 42 user stories across 9 feature areas (All Done)
4. **OpenSpec Change** `add-cli-basic-foundation` implemented and archived
5. All work is Git-based, reviewable, and auditable

## Development Workflow

### Completed: R1 Foundation ✅
- [x] Problem statement and vision documented
- [x] Architecture and design decisions captured
- [x] Spec deltas written and validated
- [x] Tasks sequenced and estimated
- [x] TypeScript project structure implemented
- [x] All 42 stories completed and tested
- [x] OpenSpec change archived: `add-cli-basic-foundation`
- [x] GitHub Copilot integration added

### Completed: R2 Web UI ✅
- [x] Web server with Express.js backend
- [x] React 18 + Vite frontend with Tailwind CSS
- [x] Full CRUD operations for releases, features, and stories
- [x] Interactive dashboard with statistics
- [x] REST API endpoints
- [x] File synchronization with Markdown
- [x] All lint and build issues resolved

### Current Phase: Maintenance & Refinement 🔧
- Monitoring production usage
- Code quality improvements and type safety
- Gathering feedback from users
- Planning future enhancements

### Future Phases
- v0.3.0: Advanced filtering and search
- v0.4.0: Collaboration features
- Pilot with external teams
- npm publication and distribution

## Installation

```bash
# Clone the repository
## Contributing

Both R1 Foundation and R2 Web UI are complete. The project is now in maintenance mode with focus on stability and bug fixes. Contributions are welcome for:

- Bug fixes and stability improvements
- Documentation enhancements
- Performance optimizations
- New filtering and search capabilities
- Integration with other tools
# Install dependencies
npm install

# Build the CLI
npm run build

# Link for local development
npm link

# Run commands
specdeck --help
```

## Contributing

R1 Foundation is complete. Open to feedback and contributions for enhancements!

## License

TBD

## Contact

Project maintained as part of OpenSpec ecosystem exploration.

---

**Built with OpenSpec** - Spec-driven development for structured change management

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

## Quick Links

- **Vision**: [specdeck/vision.md](specdeck/vision.md) - Product vision and roadmap
- **Project Roadmap**: [specdeck/project-plan.md](specdeck/project-plan.md) - High-level release overview
- **Current Release**: [R1 - Foundation](specdeck/releases/R1-foundation.md) - Q1 2025 detailed stories (In Progress)

## Commands

SpecDeck provides the following commands:

### Story Management
```bash
# List features and stories
specdeck list features                    # List all features in current release
specdeck list stories                     # List all stories
specdeck list stories --feature <id>      # List stories for specific feature
specdeck list releases                    # List available releases

# Optional: Sync story status with OpenSpec changes (if using OpenSpec integration)
specdeck sync status                      # Check which stories need status updates
```

### Project Initialization
```bash
# Initialize SpecDeck project structure
specdeck init copilot                     # Creates specdeck/, openspec/, and .github/prompts/
```

The init command scaffolds:
- **specdeck/** directory with:
  - `project-plan.md` - High-level roadmap
  - `releases/R1-foundation.md` - Detailed story tracking
  - `vision.md` - Product vision template
  - `AGENTS.md` - SpecDeck CLI instructions for AI assistants
- **Copilot prompt templates** in `.github/prompts/`:
  - specdeck-decompose.prompt.md - Break features into stories
  - specdeck-sync.prompt.md - Update story statuses
  - specdeck-status.prompt.md - Story status reference
  - specdeck-commands.prompt.md - CLI commands cheatsheet

**Note:** OpenSpec is not required. If you want to use OpenSpec framework integration, you can manually create an `openspec/` directory and configure it in `.specdeck.config.json`.

### Template Management
```bash
# Upgrade templates to latest version
specdeck upgrade copilot                  # Upgrade all templates (with backup)
specdeck upgrade copilot --list           # Show available templates and versions
specdeck upgrade copilot --template <name>  # Upgrade specific template only
specdeck upgrade copilot --force          # Skip backup before upgrade
```

### Global Options
```bash
--json                                    # Output as JSON
--verbose                                 # Detailed logging
--help                                    # Show help
```

## Tech Stack

- **TypeScript** - Type-safe implementation
- **Commander.js** - CLI framework
- **unified + remark** - Markdown parsing with AST
- **Zod** - Schema validation and types
- **Jest** - Testing framework
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
└── src/                          # Source code
    ├── cli.ts                    # CLI entry point
    ├── commands/                 # Command implementations
    ├── parsers/                  # Markdown parsing
    ├── repositories/             # Data access
    ├── services/                 # Business logic
    ├── schemas/                  # Zod validation
    ├── templates/                # Scaffolding templates
    │   ├── specdeck/             # SpecDeck directory templates
    │   ├── openspec/             # OpenSpec directory templates
    │   └── copilot/              # Copilot prompt templates
    └── utils/                    # Utilities
```

**Two-Tier Planning:**
- `specdeck/project-plan.md` - High-level roadmap with release summaries
- `specdeck/releases/R*.md` - Detailed per-release story tables
- Commands auto-detect active release and operate on it by default

**Optional Columns for External Tool Integration:**
- Story tables include core columns (ID, Title, Status, Complexity, Owner, Description)
- Optionally add: Estimate, Jira (ticket ID), OpenSpec (change ID), Tags, Notes
- Multi-repo projects use Story ID as universal identifier across repositories

## OpenSpec Integration (Optional)

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

### Current Phase: Enhancement 🚧
- Working on GitHub Copilot integration improvements
- Exploring additional workflow automation
- Gathering feedback from early usage

### Future Phases
- v0.2.0: Enhanced Copilot integration
- Pilot with external teams
- npm publication and distribution

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd specdeck

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

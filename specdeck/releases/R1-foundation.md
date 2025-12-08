---
id: R1-foundation
title: Foundation Release
timeframe: Q1 2025
---
# Release: R1-foundation

## Objectives
- Establish core CLI framework and command structure
- Enable teams to navigate the planning hierarchy (releases, features, stories)
- Provide create operations for releases, features, and story decomposition
- Validate project-plan.md structure and referential integrity
- Deliver a usable MVP that demonstrates value for single-repo projects

## Success Metrics
- CLI successfully parses and validates 5+ real-world project-plan.md files from pilot teams
- Average command response time <200ms for listing operations
- 80%+ test coverage for core parsing and validation logic
- Zero critical bugs blocking basic workflows in pilot testing
- At least 2 teams provide positive feedback on usefulness

## Features
- **CLI-CORE**: CLI Entry Point and Command Framework
  - Hierarchical command structure with Commander.js
  - Global options (--version, --help, --json, --verbose)
  - Consistent error handling and user-friendly messages
  - Configuration discovery (.specdeck.config.json or auto-detect)

- **REL-01**: Release Management
  - List all releases with summary information
  - Show detailed release information
  - Create new releases with interactive prompts
  - Parse YAML front matter and Markdown structure
  - Validate release file format

- **FEAT-01**: Feature Management
  - List features for a specific release
  - Show feature details with linked stories
  - Create new features and add to release files
  - Extract features from release Markdown
  - Cross-reference features with stories by ID prefix

- **STORY-01**: Story Management
  - List user stories for a specific feature
  - Filter stories by status, owner, complexity
  - Interactive feature decomposition workflow
  - Support for single-repo story tracking
  - Validate story structure and required fields

- **PARSE-01**: Project Plan Parser
  - Parse GFM tables from project-plan.md
  - Extract milestone sections and group stories
  - Handle YAML front matter in release files
  - Navigate Markdown AST with unified/remark
  - Provide accurate error messages with line numbers

- **OPENSPEC-01**: OpenSpec Lifecycle Integration (Lightweight)
  - Detect and list OpenSpec changes in openspec/changes/
  - Map OpenSpec change state to story status
  - `specdeck sync` command for interactive status reconciliation
  - Display status hints when showing stories (change exists but story is planned, etc.)

- **COPILOT-01**: GitHub Copilot Integration
  - VS Code extension providing SpecDeck commands in Copilot Chat
  - Custom slash commands for OpenSpec workflow (/specdeck-list, /specdeck-sync, etc.)
  - Context providers for releases, features, and stories
  - Prompt files for common workflows (create feature, decompose story)
  - Non-invasive integration that coexists with OpenSpec CLI tools

## Feature Files

- [CLI-CORE](./R1-foundation/CLI-CORE.md) - 4 stories
- [PARSE-01](./R1-foundation/PARSE-01.md) - 5 stories
- [REL-01](./R1-foundation/REL-01.md) - 6 stories
- [FEAT-01](./R1-foundation/FEAT-01.md) - 5 stories
- [STORY-01](./R1-foundation/STORY-01.md) - 6 stories
- [OPENSPEC-01](./R1-foundation/OPENSPEC-01.md) - 4 stories
- [TEST-01](./R1-foundation/TEST-01.md) - 5 stories
- [DOC-01](./R1-foundation/DOC-01.md) - 4 stories
- [PKG-01](./R1-foundation/PKG-01.md) - 3 stories

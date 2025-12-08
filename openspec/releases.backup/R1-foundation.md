---
id: R1-foundation
title: Foundation Release
timeframe: Q1 2025
---

# Release: R1 – Foundation

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

## Key Dependencies

### External Dependencies

- Node.js v18+ runtime
- NPM ecosystem (Commander, Zod, unified/remark libraries)

### Internal Dependencies

- Well-defined file format conventions (manifesto.md, overview.md)
- Test fixtures for various Markdown structures

### Assumptions

- Teams are willing to adopt Git-based planning conventions
- Markdown tables are acceptable as the primary data format
- Single-repo scenarios are the primary use case for v0.1

## Out of Scope for R1

- Jira synchronization (deferred to future release)
- Multi-repo story aggregation (basic support only)
- Story editing beyond status sync (create only for R1)
- Web UI or graphical interface
- Git operations (commits, PRs)
- Automated report generation

### OpenSpec Integration - Advanced Features (Deferred to R2)

While R1 includes lightweight OpenSpec integration with `specdeck sync`, the following advanced integration features are explicitly deferred to R2:

- **Automated git hooks**: Trigger sync automatically when OpenSpec commands run
- **Watch mode**: Continuous monitoring of `openspec/changes/` directory
- **Bi-directional sync**: OpenSpec → SpecDeck and SpecDeck → OpenSpec workflows
- **Smart status inference**: Derive status from git activity, PR state, or other signals
- **Multi-repo orchestration**: Coordinate status across multiple project-plan.md files
- **Custom sync rules**: Configurable status mapping beyond the default rules

## Risks and Mitigations

### Risk: Markdown Parsing Edge Cases
**Likelihood**: High | **Impact**: Medium

Teams may have non-standard table formatting, unexpected Markdown structures, or edge cases not covered in initial testing.

**Mitigation**:
- Use battle-tested parsing libraries (unified, remark-gfm)
- Start with strict validation, gather feedback, relax as needed
- Provide clear error messages guiding users to fix issues

### Risk: Low Adoption Due to Learning Curve
**Likelihood**: Medium | **Impact**: High

Teams may find the OpenSpec model too complex or the CLI too opinionated.

**Mitigation**:

- Comprehensive getting-started documentation
- Interactive prompts with helpful examples
- Dogfood the tool on SpecDeck itself
- Gather early feedback from 2-3 friendly pilot teams

### Risk: Performance Issues with Large Files

**Likelihood**: Low | **Impact**: Medium

Project-plan.md files with hundreds of stories may parse slowly.

**Mitigation**:

- Target <200ms for typical files (50-100 stories)
- Use efficient AST traversal
- Add performance tests to catch regressions
- Document recommended file size limits

## Release Timeline

### Phase 1: Core Infrastructure

- Project setup and tooling configuration
- Data models and schemas (Zod)
- Markdown parser implementation
- Repository layer with file I/O

### Phase 2: Commands and Services

- Release management commands
- Feature management commands
- Story management commands
- Service layer with business logic

### Phase 3: Polish and Testing

- Comprehensive test coverage
- Documentation and examples
- Validation and error messages
- Pilot testing with 2-3 teams
- Bug fixes and refinements

### Release Candidate

- npm package published as v0.1.0-rc
- Pilot teams test in real projects
- Collect feedback for v0.1.0 final

### v0.1.0 Final

- Address critical feedback from RC
- Final documentation polish
- Official v0.1.0 release to npm
- Announce to wider community

## Definition of Done

A feature is complete when:

- [ ] All requirements in spec deltas are implemented
- [ ] Unit and integration tests pass with 80%+ coverage
- [ ] Commands work on macOS, Linux, and Windows
- [ ] Documentation includes command reference and examples
- [ ] Error messages are clear and actionable
- [ ] Manual testing on 2+ real project-plan.md files succeeds
- [ ] Code review approved
- [ ] OpenSpec change archived

## Post-Release

### Feedback Collection

- Survey pilot teams on UX, usefulness, and pain points
- Track GitHub issues for bugs and feature requests
- Analyze command usage patterns (if telemetry added)

### Success Criteria Review

- Did we meet the success metrics?
- What worked well? What needs improvement?
- Should we adjust the roadmap for R2?

### Lessons Learned

- Document architectural decisions and trade-offs
- Identify technical debt to address in R2
- Update conventions based on real-world usage

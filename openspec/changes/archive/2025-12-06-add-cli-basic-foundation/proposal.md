# Proposal: Add CLI Basic Foundation

## Change ID
`add-cli-basic-foundation`

## Status
Proposed

## Overview
Create the foundational TypeScript CLI tool (`specdeck`) that implements the core workflows described in the OpenSpec-Driven Delivery framework. This tool enables teams to manage the hierarchy of Vision → Releases → Features → User Stories through structured commands and Markdown-based artifacts.

## Problem Statement
The OpenSpec-Driven Delivery Manifesto and overview documents describe a comprehensive workflow for managing engineering work through Git-based artifacts (`openspec/vision.md`, `openspec/releases/*.md`, `openspec/project-plan.md`). However, there is currently no tooling to:

1. Navigate and visualize the hierarchy of releases, features, and user stories
2. Create new releases and features with proper structure and conventions
3. Propose feature decomposition into user stories
4. Validate the structure and relationships between these artifacts
5. Maintain consistency across the planning hierarchy

Teams must manually create and maintain these Markdown files, leading to:
- Inconsistent structure and formatting
- Missing or broken relationships between releases, features, and stories
- High cognitive overhead for understanding the current planning state
- Error-prone manual editing of tabular data in `project-plan.md`

## Proposed Solution
Build a TypeScript-based CLI tool called `specdeck` that provides:

### Core Capabilities

1. **Release Management**
   - List all releases with their objectives and features
   - Create new releases with proper structure in `openspec/releases/`
   - View release details including linked features and metrics

2. **Feature Management**
   - List features for a specific release
   - Create new features linked to releases
   - View feature details and associated user stories

3. **Story Management**
   - List user stories for a specific feature
   - View the relationship between stories and their parent features/releases
   - Support for cross-repo story visibility

4. **Decomposition Support**
   - Propose decomposition of features into user stories
   - Generate structured recommendations based on complexity estimates
   - Consider single-repo vs multi-repo patterns

5. **Project Plan Parser**
   - Parse `openspec/project-plan.md` to extract milestones and stories
   - Validate table structure and required fields
   - Support cross-referencing with release and feature definitions

6. **OpenSpec Lifecycle Integration (Lightweight)**
   - Detect active and archived OpenSpec changes in `openspec/changes/`
   - Link stories to OpenSpec changes via OpenSpec column
   - `specdeck sync` command to reconcile story status with change state
   - Visual hints when story status doesn't match OpenSpec change state

### Non-Goals (Explicitly Out of Scope)
- Jira synchronization or integration
- MCP (Model Context Protocol) server implementation
- Real-time collaboration features
- Web UI or GUI
- Git operations (commits, pushes, PRs)
- Notifications or webhooks
- Multi-user coordination
- Authentication or authorization
- Automated git hooks for OpenSpec commands (deferred to R2)
- Watch mode for continuous sync (deferred to R2)
- Bi-directional OpenSpec ↔ SpecDeck sync (deferred to R2)
- Smart status inference from git activity (deferred to R2)

## Architecture Decisions

### Technology Choices
- **TypeScript**: Type safety, excellent tooling, broad ecosystem
- **Commander.js**: CLI framework for command structure
- **Markdown parsing**: `unified` + `remark` for robust Markdown processing
- **YAML front matter**: For metadata in release and feature files
- **Zod**: Runtime validation and type-safe schema definitions
- **Node.js**: Runtime environment (v18+)

### File Structure Conventions
The tool will work with the following file structure:
```
openspec/
  vision.md                    # Product vision (manual)
  releases/
    <release-id>.md           # Per-release definition
  project-plan.md             # Repo-level story tracking
  changes/                    # OpenSpec changes (existing)
  specs/                      # OpenSpec specs (existing)
```

### Data Model
```typescript
// Release definition
interface Release {
  id: string;                  // e.g., "R1-foundation"
  title: string;
  objectives: string[];
  successMetrics: string[];
  features: string[];          // Feature IDs
  timeframe?: string;
}

// Feature definition (embedded in release or separate)
interface Feature {
  id: string;                  // e.g., "FND-01"
  title: string;
  description: string;
  releaseId: string;
  openspecChange?: string;
  repos: string[];             // Which repos implement this
}

// User Story (from project-plan.md)
interface Story {
  id: string;                  // e.g., "FND-01-01"
  title: string;
  status: 'planned' | 'in_progress' | 'in_review' | 'blocked' | 'done';
  complexity: 'XS' | 'S' | 'M' | 'L' | 'XL';
  estimate?: number;
  owner?: string;
  jira?: string;
  openspec?: string;
  tags: string[];
  notes?: string;
  featureId?: string;          // Derived from ID prefix or explicit link
  milestone: string;
}
```

## Success Criteria

### Functional Requirements
- ✅ CLI successfully lists all releases with basic info
- ✅ CLI successfully lists features for a given release
- ✅ CLI successfully lists stories for a given feature
- ✅ CLI can create a new release with proper structure
- ✅ CLI can create a new feature linked to a release
- ✅ CLI validates project-plan.md table structure
- ✅ CLI can propose feature decomposition with reasonable suggestions

### Non-Functional Requirements
- ✅ Command execution completes in <500ms for listing operations
- ✅ Clear, actionable error messages for malformed input
- ✅ JSON output option for all commands (for scripting)
- ✅ Works on macOS, Linux, and Windows
- ✅ 80%+ test coverage for core parsing and validation logic

## Dependencies and Sequencing

### Prerequisites
- Node.js v18+ installed
- Git repository with `openspec/` directory structure
- Basic understanding of the OpenSpec-Driven Delivery model

### Blocking Relationships
None - this is a greenfield implementation.

### Parallel Work Opportunities
- Core CLI framework (Commander setup)
- Markdown parser implementation
- Data models and schemas (Zod)
- Individual command implementations (after core is ready)

## Risks and Mitigations

### Risk: Markdown Parsing Complexity
**Impact**: Medium
**Likelihood**: Medium
**Mitigation**: Use battle-tested libraries (`unified`, `remark`, `remark-gfm`) that handle edge cases. Start with strict table format requirements.

### Risk: Inconsistent File Formats in the Wild
**Impact**: Medium
**Likelihood**: High
**Mitigation**: Provide clear validation errors and migration guides. Start with strict validation, relax later if needed based on user feedback.

### Risk: Feature Creep (Scope Expansion)
**Impact**: High
**Likelihood**: Medium
**Mitigation**: Maintain explicit non-goals list. Defer Jira sync and advanced features to future changes. Focus on read-heavy operations first.

### Risk: Cross-Repo Story Tracking Complexity
**Impact**: Medium
**Likelihood**: Medium
**Mitigation**: Phase 1 focuses on single-repo scenarios. Multi-repo aggregation can be added later with explicit repo discovery or configuration.

## Open Questions

1. **Feature-to-Story Linking**: Should features be explicitly linked in story IDs (e.g., `FND-01-01`) or via a separate field?
   - **Decision needed**: ID prefix convention vs explicit `featureId` field
   - **Impact**: Affects parser implementation and validation rules

2. **Release File Format**: Should features be embedded in release files or referenced by ID?
   - **Option A**: Inline feature definitions in release markdown
   - **Option B**: Separate feature files referenced by ID
   - **Decision needed**: Balance between simplicity and flexibility

3. **Multi-Repo Discovery**: How should the tool discover and aggregate stories across multiple repos?
   - **Option A**: Manual configuration file listing repos
   - **Option B**: Git submodules or monorepo detection
   - **Option C**: Out of scope for v1, require explicit paths
   - **Recommendation**: Option C for initial implementation

4. **Validation Strictness**: Should validation be strict by default or provide warnings?
   - **Impact**: User experience vs data quality trade-off
   - **Recommendation**: Strict by default with `--lenient` flag

## Approval Checklist
- [ ] Problem statement and scope reviewed
- [ ] Architecture decisions validated
- [ ] Non-goals explicitly acknowledged
- [ ] Open questions addressed or assigned for resolution
- [ ] Ready for implementation (tasks.md created)

## References
- OpenSpec-Driven Delivery Manifesto: `docs/manifesto.md`
- Delivery Flow Overview: `docs/overview.md`
- OpenSpec Agent Instructions: `openspec/AGENTS.md`

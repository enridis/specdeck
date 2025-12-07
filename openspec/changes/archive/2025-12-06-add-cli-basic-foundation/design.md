# Design: CLI Basic Foundation

## Architecture Overview

The `specdeck` CLI is structured as a layered TypeScript application:

```
┌─────────────────────────────────────────┐
│         CLI Layer (Commander)           │
│  Commands: releases, features, stories  │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│        Service Layer (Business Logic)   │
│  ReleaseService, FeatureService, etc.   │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│      Repository Layer (File Access)     │
│  ReleaseRepo, ProjectPlanRepo, etc.     │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│       Parser Layer (Markdown/Data)      │
│  MarkdownParser, TableParser, Schema    │
└─────────────────────────────────────────┘
```

## Key Design Patterns

### 1. Repository Pattern
Separate file system concerns from business logic:

```typescript
// Repository handles file I/O and parsing
class ReleaseRepository {
  async findAll(): Promise<Release[]>;
  async findById(id: string): Promise<Release | null>;
  async save(release: Release): Promise<void>;
}

// Service handles business logic
class ReleaseService {
  constructor(private repo: ReleaseRepository) {}
  
  async listReleases(): Promise<Release[]> {
    const releases = await this.repo.findAll();
    return releases.sort((a, b) => /* sorting logic */);
  }
}
```

**Rationale**: Clean separation enables testing without file system, easier mocking, and potential future backends (API, database).

### 2. Schema-First Validation
Use Zod for runtime validation and type generation:

```typescript
const StorySchema = z.object({
  id: z.string().regex(/^[A-Z]+-[A-Z0-9]+-\d+$/),
  title: z.string().min(1),
  status: z.enum(['planned', 'in_progress', 'in_review', 'blocked', 'done']),
  complexity: z.enum(['XS', 'S', 'M', 'L', 'XL']),
  // ... other fields
});

type Story = z.infer<typeof StorySchema>;
```

**Rationale**: Single source of truth for validation logic, automatic TypeScript types, clear error messages.

### 3. Command Pattern with Commander.js
Structure commands hierarchically:

```bash
specdeck releases list
specdeck releases create <release-id>
specdeck releases show <release-id>

specdeck features list <release-id>
specdeck features create <feature-id> --release <release-id>

specdeck stories list <feature-id>
specdeck stories decompose <feature-id>
```

**Rationale**: Clear command hierarchy matches the domain model (Releases → Features → Stories), easy to extend.

## File Format Specifications

### Release File Format
`openspec/releases/<release-id>.md`:

```markdown
---
id: R1-foundation
title: Foundation Release
timeframe: Q1 2025
---

# Release: R1 – Foundation

## Objectives

- Enable basic cross-tool task aggregation
- Provide first version of unified notifications
- Prepare platform for third-party integrations

## Success Metrics

- X% of pilot users connect at least 2 external tools
- Y% reduction in missed notifications

## Features

- FND-01: Unified Task List (MVP)
- FND-02: Unified Notifications (MVP)
- FND-03: Integration Framework (MVP)
```

**Parsing Strategy**:
1. Extract YAML front matter for structured metadata
2. Parse Markdown content for objectives, metrics, features
3. Use heading structure to identify sections
4. Extract feature list from bullet points or table

### Project Plan Format
`openspec/project-plan.md`:

The existing format from manifesto.md will be used. Parser must:
1. Identify milestone sections (H2: `## Milestone: ...`)
2. Parse GFM tables under each milestone
3. Extract story data with proper type coercion
4. Validate required fields and enum values

**Parser Implementation**:
- Use `unified` with `remark-parse` and `remark-gfm`
- Walk AST to find heading + table pairs
- Use regex for cell content extraction
- Validate with Zod schemas

## Command Specifications

### 1. `specdeck releases list`
**Output** (default):
```
R1-foundation    Foundation Release         Q1 2025    3 features
R2-analytics     Analytics & Reporting      Q2 2025    2 features
```

**Output** (`--json`):
```json
[
  {
    "id": "R1-foundation",
    "title": "Foundation Release",
    "timeframe": "Q1 2025",
    "featureCount": 3,
    "objectives": ["..."],
    "features": ["FND-01", "FND-02", "FND-03"]
  }
]
```

### 2. `specdeck releases show <release-id>`
Display full release details including objectives, metrics, and features.

### 3. `specdeck features list <release-id>`
List all features for a specific release with their status and repo assignments.

### 4. `specdeck features show <feature-id>`
Display feature details and link to user stories across repos.

### 5. `specdeck stories list <feature-id>`
List all user stories for a feature, optionally filtered by repo.

**Flags**:
- `--repo <path>`: Filter to specific repo's project-plan.md
- `--all-repos`: Search multiple repos (requires config)

### 6. `specdeck stories decompose <feature-id>`
Interactive command to propose story decomposition:
1. Load feature definition
2. Ask clarifying questions (repo strategy, complexity)
3. Generate proposed story structure
4. Output as template for project-plan.md

## Data Flow Example

### Scenario: User runs `specdeck features list R1-foundation`

```
1. CLI layer receives command
   ↓
2. FeatureService.listByRelease('R1-foundation')
   ↓
3. ReleaseRepository.findById('R1-foundation')
   ↓
4. FileSystem: Read openspec/releases/R1-foundation.md
   ↓
5. MarkdownParser.parse(content) → Release object
   ↓
6. Validate with ReleaseSchema
   ↓
7. Extract feature IDs from Release.features
   ↓
8. FeatureRepository.findByIds(featureIds)
   ↓
9. ProjectPlanRepository.findAll() to check story linkage
   ↓
10. Aggregate feature data + story counts
   ↓
11. Format and output to console
```

## Error Handling Strategy

### 1. File Not Found
```
Error: Release 'R1-foundation' not found
Expected location: openspec/releases/R1-foundation.md
Did you mean: R2-analytics?
```

### 2. Validation Errors
```
Error: Invalid project-plan.md at line 42
Story ID 'invalid-id' does not match required pattern: [A-Z]+-[A-Z0-9]+-\d+
Example: FND-01-01
```

### 3. Missing Dependencies
```
Error: Feature FND-01 references non-existent release 'R1-foundation'
Run 'specdeck releases list' to see available releases
```

## Testing Strategy

### Unit Tests
- Parser functions with various Markdown inputs
- Schema validation with valid and invalid data
- Service logic with mocked repositories

### Integration Tests
- Full command execution with fixture files
- File system operations (read/write)
- End-to-end command flows

### Test Fixtures
Maintain fixture directory:
```
tests/fixtures/
  openspec/
    releases/
      R1-foundation.md
    project-plan.md
```

## Configuration

The tool will look for `.specdeck.config.json` (optional):

```json
{
  "openspecDir": "./openspec",
  "repos": [
    {
      "name": "workspace-core",
      "path": "."
    },
    {
      "name": "notifications-api",
      "path": "../notifications-api"
    }
  ],
  "defaults": {
    "complexity": "M",
    "status": "planned"
  }
}
```

**Discovery Order**:
1. Check for config file in current directory
2. Walk up to find config or `.git` directory
3. Assume `./openspec` if not found

## Performance Considerations

### Caching Strategy
- Parse files once per command invocation
- Cache AST for large markdown files
- No persistent cache (keep it simple)

### Optimization Opportunities
- Lazy loading of story details (only when needed)
- Parallel file reading for multi-repo scenarios
- Stream processing for large project-plan.md files

**Target Performance**:
- List operations: <100ms
- Show operations: <200ms
- Create operations: <300ms
- Decompose (interactive): User paced

## Extension Points

Future capabilities can extend:
1. **Custom validators**: Plugin system for organization-specific rules
2. **Output formats**: Add CSV, HTML, or custom templates
3. **Story templates**: Configurable templates for decomposition
4. **Integration hooks**: Pre/post command hooks for external tools

## Trade-offs and Alternatives

### Alternative: Embed Features in Release Files
**Rejected**: Keeping features inline in release files would simplify parsing but limit flexibility for cross-release features and make diffs harder to review.

### Alternative: SQLite Backend
**Deferred**: A database would improve query performance for large projects but adds complexity. Start with file-based approach, migrate later if needed.

### Alternative: Interactive TUI
**Deferred**: Terminal UI (using `ink` or similar) would improve UX but increases scope. Start with simple CLI, add TUI later based on feedback.

## Security Considerations

- **Path traversal**: Validate all file paths, prevent `../` escapes
- **Arbitrary code execution**: No `eval()` or dynamic imports of user content
- **Sensitive data**: No credential storage, no network calls
- **File permissions**: Respect OS file permissions, fail safely

## Deployment and Distribution

### NPM Package
```bash
npm install -g specdeck
# or
npx specdeck releases list
```

### Development Mode
```bash
npm link
specdeck --version
```

### Versioning
Follow semver, v0.x.y for initial development, v1.0.0 when API is stable.

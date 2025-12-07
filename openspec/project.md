# Project Context

## Purpose
SpecDeck is a TypeScript CLI tool that enables teams to manage engineering work using the OpenSpec-Driven Delivery framework. It provides commands to navigate and maintain the hierarchy of Vision → Releases → Features → User Stories through Git-based Markdown artifacts.

The tool focuses on:
- Listing and creating releases, features, and user stories
- Parsing and validating `openspec/project-plan.md` tables
- Proposing feature decomposition into stories
- Maintaining the single source of truth in Git (not Jira sync)

## Tech Stack
- TypeScript (strict mode, Node.js v18+)
- Commander.js (CLI framework)
- unified + remark + remark-gfm (Markdown parsing)
- Zod (schema validation and type generation)
- Jest (testing framework)
- ESLint + Prettier (code quality)

## Project Conventions

### Code Style
- Use TypeScript strict mode
- Prefer functional programming patterns where appropriate
- Use Zod schemas as single source of truth for validation
- Follow standard Prettier formatting
- Use kebab-case for file names, PascalCase for classes, camelCase for functions/variables

### Architecture Patterns
- **Repository Pattern**: Separate file I/O from business logic
- **Service Layer**: Business logic isolated from CLI and repositories
- **Schema-First**: Zod schemas drive validation and TypeScript types
- **AST-Based Parsing**: Use unified/remark for reliable Markdown processing
- **Command Pattern**: Hierarchical CLI structure matching domain model

### Testing Strategy
- 80%+ code coverage target
- Unit tests for parsers, schemas, and services (with mocked dependencies)
- Integration tests for repositories (with temp file fixtures)
- End-to-end tests for complete command flows
- Test fixtures in `tests/fixtures/openspec/`

### Git Workflow
- Main branch for stable code
- Feature branches for development
- Commit messages follow conventional commits
- All work tracked via OpenSpec changes in `openspec/changes/`

## Domain Context

### OpenSpec-Driven Delivery Hierarchy
1. **Vision** (`openspec/vision.md`) - Long-term product direction
2. **Releases** (`openspec/releases/<id>.md`) - Time-boxed deliveries with objectives and features
3. **Features** (embedded in release files) - Coherent capabilities with user-visible value
4. **User Stories** (`openspec/project-plan.md`) - Delivery units tracked by milestone

### Key Relationships
- Releases contain Features (listed in release markdown)
- Features decompose into Stories (matched by ID prefix, e.g., FND-01-01 belongs to FND-01)
- Stories are grouped by Milestone sections in project-plan.md
- Stories may reference OpenSpec changes for implementation tracking

### Story ID Format
Pattern: `[A-Z]+-[A-Z0-9]+-\d+`
Examples: `FND-01-01`, `PLT-02-API`, `ONB-V2-03`

### Status Values
`planned | in_progress | in_review | blocked | done`

### Complexity Values
`XS | S | M | L | XL`

## Important Constraints
- **No Jira integration** in initial version (explicitly out of scope)
- **No MCP server** implementation (focus on standalone CLI)
- **No network calls** - purely file-based operations
- **No persistent cache** - parse on each command invocation
- File paths must be validated to prevent path traversal attacks
- Must work cross-platform (macOS, Linux, Windows)

## External Dependencies
None - this is a local file-based tool with no external service dependencies.

## Configuration
Optional `.specdeck.config.json`:
```json
{
  "openspecDir": "./openspec",
  "repos": [
    {"name": "workspace-core", "path": "."},
    {"name": "notifications-api", "path": "../notifications-api"}
  ],
  "defaults": {
    "complexity": "M",
    "status": "planned"
  }
}
```

Discovery order:
1. Check for config in current directory
2. Walk up to find config or `.git` directory
3. Default to `./openspec` if not found

# Design: OpenSpec/SpecDeck Separation

## Problem

Current implementation tightly couples SpecDeck-specific artifacts with OpenSpec framework artifacts by storing everything in `openspec/` directory:

```
openspec/
├── project-plan.md      # SpecDeck-specific (story tracking table)
├── vision.md            # OpenSpec framework (AI context)
├── project.md           # OpenSpec framework (AI context)
├── AGENTS.md            # OpenSpec framework (AI instructions)
├── specs/               # OpenSpec framework
├── changes/             # OpenSpec framework
└── releases/            # OpenSpec framework
```

This creates problems:
1. **Tight coupling**: Other OpenSpec implementations must adopt SpecDeck's `project-plan.md` format
2. **Unclear ownership**: Which files are framework vs tool-specific?
3. **Future conflicts**: If multiple OpenSpec tools coexist, they share the same namespace
4. **Migration burden**: Users can't easily switch between OpenSpec implementations

## Solution: Directory Separation

Separate SpecDeck-specific artifacts into `specdeck/` directory with two-tier planning:

```
specdeck/
├── project-plan.md      # High-level roadmap (all releases)
├── releases/
│   ├── R1-foundation.md # Detailed stories for R1
│   ├── R2-features.md   # Detailed stories for R2
│   └── archive/         # Completed releases
│       └── R0-mvp.md
├── vision.md            # SpecDeck's product vision
└── AGENTS.md            # SpecDeck-specific AI instructions

openspec/
├── project.md           # OpenSpec framework (AI context)
├── AGENTS.md            # OpenSpec framework (AI instructions)
├── specs/               # OpenSpec framework
├── changes/             # OpenSpec framework
└── releases/            # OpenSpec framework

.github/
└── prompts/             # Editor-specific (Copilot)
```

## Design Decisions

### 1. Directory Structure

**Decision**: Use `specdeck/` (visible) not `.specdeck/` (hidden)

**Rationale**:
- `project-plan.md` is primary user content, edited frequently
- Should be discoverable by new team members
- Consistent visibility with `openspec/` directory
- Hidden directories (`.git/`, `.vscode/`) are for tool metadata, not user content

### 2. File Ownership

| File | Location | Rationale |
|------|----------|-----------|
| `project-plan.md` | `specdeck/` | High-level roadmap linking to releases |
| `releases/R*.md` | `specdeck/releases/` | Per-release detailed story tracking |
| `vision.md` | `specdeck/` | SpecDeck's product vision (tool-specific) |
| `AGENTS.md` (SpecDeck) | `specdeck/` | SpecDeck-specific workflow instructions |
| `project.md` | `openspec/` | OpenSpec framework, AI context for any tool |
| `AGENTS.md` (OpenSpec) | `openspec/` | OpenSpec framework AI instructions |
| `specs/` | `openspec/` | OpenSpec framework specifications |
| `changes/` | `openspec/` | OpenSpec framework change proposals |
| `releases/` | `openspec/` | OpenSpec framework release definitions |

### 3. Two-Tier Planning Structure

**Decision**: Split project planning into high-level roadmap + per-release detail files

**Rationale**:
- **Scalability**: Single `project-plan.md` becomes unmanageable with 100+ stories
- **Focus**: Teams work on specific release files without merge conflicts
- **Git History**: Clear evolution per release
- **Archive**: Completed releases move to `releases/archive/` without cluttering active work
- **Performance**: Parser only reads active release by default

**Structure**:
```
specdeck/
├── project-plan.md          # Roadmap: release summaries, links, goals
└── releases/
    ├── R1-foundation.md     # Detailed: full story table for R1
    ├── R2-features.md       # Detailed: full story table for R2
    └── archive/
        └── R0-mvp.md        # Completed releases
```

**Command Behavior**:
- `specdeck list stories` - Shows active release only (auto-detected)
- `specdeck list stories --release R1` - Shows specific release
- `specdeck list stories --all` - Shows all releases (including archived)
- `specdeck sync status` - Auto-detects and updates active release
- Active release = first release with `status: in_progress` in roadmap

### 4. Two AGENTS.md Files

**Decision**: Create separate `AGENTS.md` files for OpenSpec and SpecDeck

**Rationale**:
- `openspec/AGENTS.md`: Instructions for OpenSpec workflow (proposals, specs, changes)
- `specdeck/AGENTS.md`: Instructions for SpecDeck tool (CLI commands, project-plan format, story management)
- AI assistants can read both for full context
- Clear separation of concerns
- Each can evolve independently

**Content Strategy**:
```markdown
# openspec/AGENTS.md
- How to create proposals
- Spec format and conventions
- Change workflow
- Validation requirements

# specdeck/AGENTS.md
- SpecDeck CLI commands reference (list, sync, validate)
- Two-tier planning structure (roadmap + per-release files)
- project-plan.md roadmap format
- releases/R*.md story table format
- vision.md guidance
- Story decomposition workflow
- Status sync workflow
- Release management (active detection, archiving)
- Integration with OpenSpec changes
```

### 5. Configuration

**Decision**: Add `specdeckDir` to `.specdeck.config.json`

```json
{
  "openspecDir": "./openspec",
  "specdeckDir": "./specdeck",
  "repos": [...]
}
```

**Migration path**: If `specdeckDir` not specified, fall back to `openspecDir` for backward compatibility.

### 6. Version Tracking

**Decision**: Use single `.specdeck-version` file in project root

**Rationale**:
- Tracks both OpenSpec scaffolding and SpecDeck setup
- Simpler upgrade path
- Clear initialization state

```json
{
  "version": "0.1.0",
  "timestamp": "2025-12-07T...",
  "openspecFiles": ["project.md", "AGENTS.md"],
  "specdeckFiles": ["project-plan.md", "vision.md", "AGENTS.md", "releases/R1-foundation.md"],
  "copilotTemplates": ["decompose-feature.prompt.md", ...]
}
```

## Migration Strategy

### Single-Phase Implementation (v0.1.x)
Since SpecDeck has zero external users, we can implement cleanly without backward compatibility:

1. Create `specdeck/` directory structure during init:
   - `specdeck/project-plan.md` (roadmap)
   - `specdeck/releases/R1-foundation.md` (detailed stories)
   - `specdeck/vision.md`
   - `specdeck/AGENTS.md`
2. Keep `openspec/AGENTS.md` for OpenSpec framework instructions
3. Update all code to read from two-tier structure:
   - Parse `specdeck/project-plan.md` for release metadata
   - Auto-detect active release from status
   - Read stories from `specdeck/releases/R*.md`
4. Implement release management:
   - `--release` flag to target specific release
   - `--all` flag for cross-release operations
   - `archive/` subdirectory support
5. **Migrate SpecDeck's own repository** as part of implementation:
   - Move `openspec/project-plan.md` → `specdeck/releases/R1-foundation.md`
   - Create `specdeck/project-plan.md` roadmap linking to R1
   - Move `openspec/vision.md` → `specdeck/vision.md`
   - Create `specdeck/AGENTS.md` from CLI instructions
   - Update `openspec/AGENTS.md` to only OpenSpec workflow
   - Update all documentation references
   - Validate all commands work with new structure

No backward compatibility needed - clean break to new architecture.

## Implementation Impact

### Code Changes Required

1. **Path Resolution** (`src/services/story.service.ts`):
```typescript
// Before
const projectPlanPath = join(openspecDir, 'project-plan.md');

// After - Two-tier approach
const specdeckDir = config.specdeckDir || './specdeck';
const roadmapPath = join(specdeckDir, 'project-plan.md');
const activeRelease = detectActiveRelease(roadmapPath); // e.g., "R1-foundation"
const storiesPath = join(specdeckDir, 'releases', `${activeRelease}.md`);
```

2. **Init Command** (`src/commands/init.ts`):
```typescript
// Create both directory structures
scaffoldSpecDeck();  
  // specdeck/project-plan.md (roadmap)
  // specdeck/releases/R1-foundation.md (detailed stories)
  // specdeck/vision.md
  // specdeck/AGENTS.md
scaffoldOpenSpec();  
  // openspec/project.md
  // openspec/AGENTS.md
```

3. **Configuration** (`src/schemas/config.schema.ts`):
```typescript
export const ConfigSchema = z.object({
  openspecDir: z.string().default('./openspec'),
  specdeckDir: z.string().default('./specdeck'),
  // ...
});
```

4. **Validation** (`src/commands/validate.ts`):
```typescript
// Update path
const specdeckDir = config.specdeckDir || './specdeck';
const projectPlanPath = join(specdeckDir, 'project-plan.md');
```

### Testing Impact

- Update fixtures to use `specdeck/project-plan.md`
- Add tests for backward compatibility (legacy location detection)
- Add tests for both AGENTS.md files
### Testing Impact

- Update fixtures to use `specdeck/project-plan.md` and `specdeck/vision.md`
- Add tests for both AGENTS.md files
- Integration tests for full init flow
- No backward compatibility tests needed

### Documentation Impact

- Update README.md with new directory structure
- Update docs/manifesto.md to reference `specdeck/project-plan.md`
- Update docs/overview.md paths
- Update all specs to reference correct paths
- Update openspec/project.md to document the separation SpecDeck format to OpenSpec framework

### Alternative 2: Use .specdeck/ (hidden)
**Rejected**: User content should be visible, not hidden

### Alternative 3: Single AGENTS.md with sections
**Rejected**: Mixing framework and tool instructions creates confusion
### Alternative 3: Put everything in specdeck/
**Rejected**: project.md, releases/, specs/, changes/ are OpenSpec framework concepts

## Risks and Mitigations

### Risk: Migration of SpecDeck's own repository fails
**Mitigation**: 
- Manual migration as part of implementation tasks
- Validate all commands work before merging
- Test suite will catch any missed path references

### Risk: Confusion about two AGENTS.md files
**Mitigation**:
- Clear naming and documentation
- Each file explains its scope in header
- AI assistants typically read all AGENTS.md files in workspace

### Risk: Configuration complexity
**Mitigation**:
- Sensible defaults (`specdeck/` if not specified)
- Clear error messages
- Simple scheman complexity
**Mitigation**:
- Sensible defaults (specdeck/ if not specified)
## Success Criteria

1. ✅ `specdeck init copilot` creates both `specdeck/` and `openspec/` directories
2. ✅ All commands read from `specdeck/project-plan.md` and `specdeck/vision.md` by default
3. ✅ Two AGENTS.md files with clear, non-overlapping content
4. ✅ All tests pass with new structure
5. ✅ Documentation updated to reflect new paths
6. ✅ SpecDeck's own repository successfully migrated to new structure
7. ✅ Future OpenSpec implementations can coexist with SpecDecktion
5. ✅ All tests pass with new structure
6. ✅ Documentation updated to reflect new paths
7. ✅ Future OpenSpec implementations can coexist with SpecDeck

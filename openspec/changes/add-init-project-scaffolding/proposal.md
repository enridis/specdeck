# Proposal: Separate SpecDeck and OpenSpec Scaffolding

## Change ID
`add-init-project-scaffolding`

## What

Enhance `specdeck init copilot` to scaffold two separate directory structures:

**SpecDeck directory** (`specdeck/`):
- `project-plan.md` - high-level roadmap linking to release plans
- `releases/R1-*.md` - detailed story table per release
- `vision.md` with SpecDeck product vision
- `AGENTS.md` with SpecDeck-specific CLI instructions and workflows

**OpenSpec directory** (`openspec/`):
- `project.md` with OpenSpec framework context (framework artifact)
- `AGENTS.md` with OpenSpec workflow instructions (proposals, specs, changes)

This architectural separation allows other OpenSpec implementations to coexist with SpecDeck and clarifies ownership: SpecDeck is a **tool** that implements the OpenSpec **framework**.
## Why

Currently, `specdeck init copilot` only installs Copilot prompt templates but leaves project structure creation to users. Additionally, all files are stored in `openspec/` which creates tight coupling between:
- **OpenSpec framework** (specs, changes, releases, project context)
- **SpecDeck tool** (story tracking, vision, CLI workflows)

This coupling creates problems:
1. Other OpenSpec implementations must adopt SpecDeck's structure
2. Multiple OpenSpec tools cannot coexist without conflicts
3. Unclear which files belong to framework vs tool
4. High friction for new users setting up projects

By separating `specdeck/` and `openspec/` directories:
- SpecDeck-specific artifacts (project-plan, vision) live in `specdeck/`
- OpenSpec framework artifacts (project context, specs, changes) live in `openspec/`  
- Future tools (SpecFlow, SpecTrack) can add their own directories
- Clear ownership boundaries
- Better architectural flexibility

Since SpecDeck has zero external users yet, we can implement this cleanly without backward compatibility concerns.
- Better long-term architectural flexibility

## Scope

### In Scope
- Create `specdeck/` directory structure during `specdeck init copilot`:
  - `specdeck/project-plan.md` (high-level roadmap)
  - `specdeck/releases/` directory
  - `specdeck/releases/R1-foundation.md` (detailed stories)
- Template file for `specdeck/project-plan.md` with:
  - Documentation explaining two-tier planning approach
  - Example release entries (R1, R2) with status, goals, story counts
  - Links to detailed release plans in `releases/` directory
- Template file for `specdeck/releases/R1-foundation.md` with:
  - Full story table with all required columns
  - 2-3 example stories with valid IDs, statuses, complexity
  - Inline comments explaining columns
- Template file for `specdeck/vision.md` with:
  - Section placeholders (Problem, Solution, Target Users, Success Metrics, Roadmap)
  - Brief guidance explaining SpecDeck's product vision
  - Link to SpecDeck's own vision.md as reference
- Template file for `specdeck/AGENTS.md` with:
  - SpecDeck CLI commands reference (`list`, `sync status`, `validate`)
  - `project-plan.md` table format documentation
  - Story decomposition workflow guidance
  - Link to `.github/prompts/` templates
- Create `openspec/` directory structure
- Template file for `openspec/project.md` with:
  - Section placeholders (Purpose, Tech Stack, Conventions, Domain Context)
  - Brief guidance explaining OpenSpec framework context
  - Link to SpecDeck's own project.md as reference
- Template file for `openspec/AGENTS.md` with:
  - OpenSpec workflow instructions (creating proposals, specs, changes)
  - Spec format conventions
  - Validation requirements
- Update all code references from `openspec/project-plan.md` → per-release files
- Update all code references from `openspec/vision.md` → `specdeck/vision.md`
- Add `specdeckDir` config option to `.specdeck.config.json`
- Implement release detection: auto-detect active release from `project-plan.md`
- Support `--release` flag to target specific release
- Support `--all` flag to operate across all releases (including archived)
- Check if directories already exist and skip scaffolding (idempotent)
- **Migrate SpecDeck's own project** to new structure during implementation
- Update success output to list both SpecDeck and OpenSpec files

### Out of Scope
- Backward compatibility for external users (zero external users exist)
- Migration command (not needed, will migrate SpecDeck directly)
- Interactive prompts to fill in vision/project content
- Automatic Git commit of scaffolded files
- Creating `releases/` or `changes/` directories (users create via commands)

## Dependencies

### Prerequisites
- Existing CLI infrastructure (commands, templates)
- File I/O utilities  
- Template directory structure in `src/templates/`
- Existing `init copilot` command and version tracking

### Affected Capabilities
- **cli-core** (MODIFIED) - Enhance `init copilot` to scaffold both directories; add release management; update all path resolution
- **project-plan-parser** (MODIFIED) - Parse two-tier structure: roadmap + per-release files; auto-detect active release
- **agents-md-management** (MODIFIED) - Create two AGENTS.md files with distinct purposes
- **release-management** (NEW) - Track releases, parse release metadata, resolve active release
## Success Criteria

1. User runs `specdeck init copilot` in empty directory
2. Command creates both `specdeck/` and `openspec/` directories
3. `specdeck/project-plan.md` contains high-level roadmap with release summaries
4. `specdeck/releases/R1-foundation.md` contains detailed story table
5. `specdeck/vision.md` contains section placeholders with guidance
6. `specdeck/AGENTS.md` contains SpecDeck CLI instructions
7. `openspec/project.md` contains section placeholders with guidance
8. `openspec/AGENTS.md` contains OpenSpec workflow instructions
9. `specdeck list stories` (no flags) shows stories from active release only
10. `specdeck list stories --release R1` shows specific release
11. `specdeck list stories --all` shows all releases including archived
12. `specdeck sync status` auto-detects and updates active release
13. Completed releases can be moved to `specdeck/releases/archive/`
14. Scaffolded files pass `specdeck validate`
15. Running `init copilot` with existing directories skips scaffolding
16. Success message lists both SpecDeck and OpenSpec files created
17. **SpecDeck's own repository migrated** to new two-tier structure successfully
18. Future OpenSpec tools can add their own directories without conflicts
3. `specdeck/project-plan.md` contains documented example table
4. `specdeck/AGENTS.md` contains SpecDeck CLI instructions
5. `openspec/AGENTS.md` contains OpenSpec workflow instructions
6. All SpecDeck commands read from `specdeck/project-plan.md` (not `openspec/`)
7. Scaffolded files pass `specdeck validate`
8. Running `init copilot` with existing directories skips scaffolding
9. Success message lists both SpecDeck and OpenSpec files created
10. Future OpenSpec tools can add their own directories without conflicts

## Risks and Mitigations

### Risk: Confusion about two AGENTS.md files
**Mitigation**: 
- Each file has clear header explaining its scope
- `openspec/AGENTS.md`: "Instructions for OpenSpec framework workflow"
- `specdeck/AGENTS.md`: "Instructions for SpecDeck CLI tool"
- AI assistants typically read all AGENTS.md files in workspace
- Documentation clearly explains the separation

### Risk: Stub files become outdated as SpecDeck evolves  
**Mitigation**: Templates versioned in `src/templates/`; upgraded via `specdeck upgrade copilot`

### Risk: Documentation in stub files conflicts with actual docs
**Mitigation**: Keep stub docs concise (2-3 lines); link to full README.md

### Risk: Breaking existing init copilot behavior
**Mitigation**: New directories created before Copilot templates; no change to existing functionality

### Risk: Migration of SpecDeck's own repository fails
**Mitigation**: Manual migration as part of implementation tasks; validate all commands work with new paths before merging

## Open Questions

1. Should `.specdeck-version` track specdeck/ and openspec/ separately?
   - **Decision**: Single version file tracks both; simpler upgrade path

2. Should we create `openspec/releases/` and `openspec/changes/` directories during init?
   - **Decision**: No, keep minimal; users create via commands when needed

3. Should vision.md be scaffolded with SpecDeck's actual vision or placeholder?
   - **Decision**: Placeholder with guidance; each project writes their own vision

4. Should project-plan.md be per-release or single file?
   - **Decision**: Two-tier - high-level roadmap + detailed per-release files for scalability

5. How should commands detect active release?
   - **Decision**: Auto-detect from project-plan.md status; default behavior operates on active release

6. Should archived releases be in separate directory?
   - **Decision**: Yes, `specdeck/releases/archive/` for completed releases

7. What should story ID format be?
   - **Decision**: Keep current format (e.g., `SDK-01-01`); no release prefix needed

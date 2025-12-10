# Proposal: Multi-Repository Coordinator

**Change ID**: `add-multi-repo-coordinator`  
**Status**: Draft  
**Created**: 2025-12-09  
**Author**: AI Assistant

## Why

Organizations managing projects across multiple repositories (public GitHub, private GitHub, on-premises Bitbucket) need unified project tracking while respecting visibility boundaries. Public repositories cannot expose proprietary information like Jira tickets or customer names, yet teams need aggregated views showing all work with full metadata. Current SpecDeck has basic multi-repo configuration but lacks aggregation, overlay mechanisms for proprietary data, and global story ID validation to prevent conflicts.

## Summary

Add coordinator repository mode to SpecDeck that enables unified project management across multiple repositories (public, private, on-premises) using Git submodules, while keeping proprietary metadata (Jira links) separate from public repos through overlay files.

## What Changes

This change adds:

1. **Coordinator Repository Mode**: Configuration schema extension for Git submodules management
2. **Overlay Files**: Proprietary metadata storage (Jira links) separate from public repos  
3. **Sync Command**: Aggregates stories from submodules, applies overlays, writes to cache
4. **Enhanced List Commands**: Cache-based queries with `--with-jira`, `--global`, `--repo` flags
5. **Global Story ID Validation**: Prevents duplicate IDs across all submodules
6. **Overlay Management Commands**: Create, map, validate, and list overlay files

**Breaking Changes**: None - this is additive functionality.

## Impact

**Affected Specs:**
- `cli-core`: Configuration schema, sync command, error handling
- `story-management`: List commands, overlay queries, story ID validation

**Affected Code:**
- `src/schemas/config.schema.ts`: Add coordinator configuration fields
- `src/repositories/`: New `overlay.repository.ts`, extend `config.repository.ts`
- `src/commands/`: New sync, overlay commands; extend list commands
- `src/services/`: New `coordinator.service.ts`, `validation.service.ts`

**User Impact:**
- No breaking changes for existing single-repo users
- New commands available for coordinator mode users
- Migration required if moving Jira columns from public to overlay files

## Goals

### In Scope

1. **Coordinator Repository Setup**
   - Configure SpecDeck to treat a repo as coordinator with Git submodules
   - Mount multiple repos (public/private/on-premises) as submodules
   - Validate coordinator configuration

2. **Overlay Files for Proprietary Metadata**
   - Define `.overlay.md` format for Jira links per feature
   - Store overlays only in coordinator repo (never in submodules)
   - Validate overlay references match existing stories

3. **Synchronization Command**
   - `specdeck sync` reads stories from all submodules
   - Apply overlay data (Jira links, internal notes)
   - Write merged dataset to cache
   - Provide `--dry-run` mode to preview sync

4. **Coordinator-Aware Queries**
   - `--with-jira` flag includes Jira links from overlays
   - `--repo <name>` filters to specific submodule
   - `--global` shows all stories across all submodules
   - List commands use cache (fast) unless `--no-cache` specified

5. **Global Story ID Validation**
   - Scan all submodules for duplicate story IDs
   - Error if any ID appears in multiple repos
   - Suggest conventions (repo prefixes) to avoid conflicts

6. **Overlay Management Commands**
   - `overlay create <feature>` scaffolds overlay file
   - `overlay map <story> <jira>` adds Jira mapping
   - `overlay validate` checks references exist

7. **Web UI Coordinator Support**
   - Auto-sync on load with manual refresh button
   - Read-only display of submodule stories
   - Editable overlay files (Jira links, notes)
   - Sync timestamp display with staleness warnings
   - Immediate save with validation for overlay edits

### Out of Scope

- Bidirectional sync (coordinator → submodules) - one-way only (submodules → coordinator)
- Cross-repo dependency tracking (e.g., "FE-AUTH-01 depends on BE-AUTH-03")
- Automated Jira API integration (overlays maintained manually)
- Rollup release views aggregating features from multiple repos
- Conflict resolution when same feature differs across repos

## User Impact

### Benefits

- **Public repos stay clean**: No proprietary data exposed in open source projects
- **Unified visibility**: Single view (CLI + Web UI) shows all work across all repos with full metadata
- **Team autonomy**: Teams update stories in their repos; coordinator aggregates automatically
- **Compliance**: Sensitive repos remain on-premises; coordinator pulls read-only
- **Scalability**: Works with 5+ repos and 1000+ stories (cache-based queries)
- **Easy Jira management**: Web UI allows quick overlay edits without touching story files

### Breaking Changes

None - this is additive. Existing single-repo SpecDeck usage unaffected.

### Migration Required

For teams with Jira columns in public repos:
1. Create coordinator repo with submodules
2. Extract Jira data → overlay files in coordinator
3. Remove Jira columns from public repo story files
4. Run `specdeck sync` to validate

## Implementation Approach

See `design.md` for detailed architecture.

### High-Level Steps

1. **Extend Config Schema**
   - Add `coordinator` section with `submodules`, `overlaysDir`, `cacheDir`
   - Add `visibility` field to submodule config

2. **Implement Overlay Parser**
   - Parse `.overlay.md` files (simple key-value format)
   - Validate story IDs exist in corresponding submodule
   - Merge overlay data with story objects

3. **Build Sync Command**
   - Read stories from all submodules
   - Apply overlays
   - Write to JSON cache (`.specdeck-cache/stories.json`)
   - Report stats (stories synced, overlays applied, errors)

4. **Update List Commands**
   - Detect coordinator mode from config
   - Default to cache-based queries (fast)
   - Add `--with-jira`, `--repo`, `--global` flags
   - Support `--no-cache` to force live submodule queries

5. **Add Validation Rules**
   - Check story ID uniqueness across submodules
   - Validate overlay references
   - Warn if submodules are stale (behind remote)

6. **Create Overlay Management Commands**
   - Scaffold overlay files with proper format
   - Helper to add Jira mappings
   - Validation runner specific to overlays

### Testing Strategy

- **Unit tests**: Overlay parser, cache writer, config schema
- **Integration tests**: Sync command with fixture submodules
- **E2E tests**: Full coordinator workflow (sync → query → validate)
- **Fixtures**: Create test coordinator repo with 3 mock submodules

### Performance Targets

- Sync 1000 stories from 5 repos: <10 seconds
- Cache-based queries: <100ms (regardless of repo count)
- Validation (global story IDs): <5 seconds for 1000 stories

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Submodules complex for users | High | Provide clear documentation, `init coordinator` wizard |
| Cache staleness causes confusion | Medium | Show cache timestamp in list commands, add `--no-cache` flag |
| Overlay files maintained incorrectly | Medium | Strict validation catches bad references, provide overlay commands |
| Story ID conflicts not detected early | High | Run validation automatically during sync |
| Performance degrades with many repos | Medium | Cache architecture, lazy-load submodules only when needed |

## Alternatives Considered

### 1. Monorepo Instead of Submodules

**Rejected**: Cannot combine public + on-premises repos in single Git repo. Submodules provide necessary separation.

### 2. External Database for Metadata

**Rejected**: Would require running a service, adds operational complexity. Overlay files keep everything Git-based.

### 3. Jira Column with Visibility Flags

**Rejected**: Still exposes structure to public repos (empty column). Clean separation via overlays is clearer.

### 4. Separate SpecDeck Installation Per Repo

**Rejected**: No unified view possible without aggregation layer. Coordinator provides this.

## Dependencies

- Existing multi-repo config support (present but limited)
- Story schema with optional `jira` field (exists)
- Git submodules (user must configure)

## Success Metrics

- **Adoption**: 3+ teams use coordinator mode within 3 months
- **Public repo cleanliness**: Zero Jira links remain in public repos after migration
- **Query performance**: 95th percentile cache-based query <100ms
- **Validation coverage**: 100% of coordinator repos pass `validate coordinator --strict`
- **Developer satisfaction**: Positive feedback on unified visibility from distributed teams

## Open Questions

None - all clarified with user.

## References

- See `design.md` for architecture details
- See `tasks.md` for implementation breakdown
- See spec deltas in `specs/` for requirement changes

# Design: Multi-Repository Coordinator

## Problem Context

Organizations often manage related projects across multiple repositories with varying visibility constraints:

- **Public repositories** (e.g., backend on GitHub) - open source, no proprietary information
- **Private repositories** (e.g., frontend on GitHub) - closed source but on public hosting
- **On-premises repositories** (e.g., proprietary models on Bitbucket) - highly sensitive

Teams need to:
1. Track work across all repositories in a unified view
2. Link stories to proprietary systems (Jira) without exposing those links in public repos
3. Maintain consistent planning structures while respecting visibility boundaries
4. Keep story IDs globally unique to prevent conflicts

**Current limitation**: SpecDeck supports multi-repo configuration but lacks:
- Aggregated cross-repo views
- Proprietary metadata overlays (e.g., Jira links)
- Synchronization mechanisms from submodules to a coordinator

## Proposed Solution

### Architecture Overview

```
coordinator-repo/                    # Proprietary coordinator
├── .gitmodules                      # Git submodules configuration
├── submodules/
│   ├── backend/                     # Public repo (GitHub)
│   ├── frontend/                    # Private repo (GitHub)
│   └── models/                      # On-premises repo (Bitbucket)
├── overlays/
│   ├── backend/
│   │   └── API-AUTH.overlay.md     # Jira links for backend features
│   ├── frontend/
│   │   └── UI-DASH.overlay.md      # Jira links for frontend features
│   └── models/
│       └── ML-TRAIN.overlay.md     # Jira links for model features
├── specdeck/
│   ├── coordinator.config.json     # Coordinator-specific config
│   └── releases/                    # Optional: rollup views (future)
└── .specdeck.config.json            # Main config pointing to submodules
```

### Key Design Decisions

#### 1. Git Submodules for Repository Coordination

**Choice**: Use Git submodules to mount all managed repositories under a coordinator repo.

**Rationale**:
- Native Git support - no custom sync protocols
- Developers can update stories in individual repos, changes immediately visible in coordinator
- Standard `git submodule update --remote` pulls latest from all repos
- Clear ownership: individual repos remain authoritative for their stories

**Trade-offs**:
- Requires Git knowledge of submodules
- Coordinator repo references specific commits (must be updated deliberately)
- Cannot push changes from coordinator back to submodules (one-way sync acceptable per requirements)

#### 2. Overlay Files for Proprietary Metadata

**Choice**: Separate `.overlay.md` files in coordinator repo that augment public story data.

**Structure**:
```markdown
# Overlay: API-AUTH Feature

## Jira Mappings
- **API-AUTH-01**: PROJ-1234
- **API-AUTH-02**: PROJ-1235
- **API-AUTH-03**: PROJ-1240

## Additional Notes
- API-AUTH-01: Blocked by security review (internal only)
- API-AUTH-02: Customer X priority
```

**Rationale**:
- Public repos remain clean - no Jira columns, no proprietary comments
- Overlays live only in proprietary coordinator repo
- Simple key-value structure easy to parse and merge
- Can extend to other metadata (customer info, security labels, etc.)

**Trade-offs**:
- Requires manual maintenance of overlay files
- Story IDs must match exactly between repos and overlays
- No automatic validation that overlay references exist in submodules (mitigated by validation command)

#### 3. Synchronized Story Cache

**Choice**: `specdeck sync` command that:
1. Reads stories from all submodules
2. Applies overlay data
3. Writes merged dataset to `coordinator/.specdeck-cache/`
4. All list/query commands use cache by default

**Rationale**:
- Performance: No need to traverse submodules on every query
- Consistency: Cache represents a snapshot at sync time
- Flexibility: Cache can include computed aggregations (e.g., "all stories by owner")
- Explicit: Teams run `sync` when they want fresh data

**Trade-offs**:
- Cache can become stale if not synced regularly
- Requires disk space for duplicated story data
- Adds operational step (`sync` before querying)

#### 4. Global Story ID Uniqueness

**Choice**: Enforce globally unique story IDs across all repositories.

**Rationale**:
- Prevents confusion when discussing stories across teams
- Enables unambiguous Jira mappings (one story ID → one Jira ticket)
- Simplifies merging data from multiple repos (no namespacing needed)
- Aligns with org-wide planning practices

**Implementation**:
- Validation command checks all submodules for ID conflicts
- CLI warns if attempting to create duplicate ID
- Suggested convention: Use repo prefix (e.g., `BE-`, `FE-`, `ML-`) to naturally avoid conflicts

**Trade-offs**:
- Requires coordination across teams to avoid ID collisions
- Cannot have identical story IDs in different repos (even if feature IDs differ)

#### 5. Feature Visibility Across Repos

**Choice**: Allow same feature ID (e.g., `AUTH-01`) to appear in multiple repos with different stories.

**Example**:
- `backend/specdeck/releases/R1/AUTH-01.md`: `BE-AUTH-01-01`, `BE-AUTH-01-02`
- `frontend/specdeck/releases/R1/AUTH-01.md`: `FE-AUTH-01-01`, `FE-AUTH-01-02`

**Rationale**:
- Features often span multiple repos (e.g., "Authentication" needs BE APIs and FE UI)
- Feature ID provides conceptual grouping
- Story IDs maintain uniqueness for work tracking

**Trade-offs**:
- Feature-level aggregation requires querying multiple repos
- No single "owner" of a feature definition (each repo defines its view)

### Data Flow

#### Story Creation Flow (Individual Repo)
```
1. Developer runs `specdeck create story` in backend repo
2. Story written to backend/specdeck/releases/R1/FEATURE.md
3. Story has no Jira field (public repo)
4. Developer commits and pushes to GitHub
```

#### Overlay Creation Flow (Coordinator)
```
1. Manager in coordinator repo runs `git submodule update --remote`
2. New story appears in submodules/backend/
3. Manager creates/updates overlays/backend/FEATURE.overlay.md
4. Adds Jira mapping for new story
5. Runs `specdeck sync` to rebuild cache with Jira data
```

#### Query Flow (Coordinator)
```
1. User runs `specdeck list stories --feature AUTH-01 --with-jira`
2. Command reads from .specdeck-cache/ (merged data)
3. Output shows stories from all repos with Jira links applied
4. Public repo stories enriched with Jira info from overlays
```

### Validation Strategy

New validation rules:
1. **Unique Story IDs**: Scan all submodules, error if any ID appears twice
2. **Overlay Validity**: Every story ID in overlay must exist in corresponding submodule
3. **Submodule Freshness**: Warn if submodules are behind remote (suggest `git submodule update`)
4. **Feature Consistency**: Warn if feature appears in multiple repos with different metadata (title, description)

Command: `specdeck validate coordinator --strict`

### Configuration Schema

**Individual Repo** (`.specdeck.config.json`):
```json
{
  "specdeckDir": "./specdeck",
  "defaults": {
    "complexity": "M",
    "status": "planned"
  }
}
```

**Coordinator Repo** (`.specdeck.config.json`):
```json
{
  "specdeckDir": "./specdeck",
  "coordinator": {
    "enabled": true,
    "submodules": [
      {
        "name": "backend",
        "path": "./submodules/backend",
        "visibility": "public"
      },
      {
        "name": "frontend", 
        "path": "./submodules/frontend",
        "visibility": "private"
      },
      {
        "name": "models",
        "path": "./submodules/models", 
        "visibility": "on-premises"
      }
    ],
    "overlaysDir": "./overlays",
    "cacheDir": "./.specdeck-cache"
  }
}
```

### CLI Commands

New commands for coordinator mode:

```bash
# Sync submodules to cache
specdeck sync                           # Update cache from submodules + overlays
specdeck sync --dry-run                 # Show what would be synced

# List with coordinator awareness
specdeck list stories --with-jira       # Include Jira links from overlays
specdeck list stories --repo backend    # Filter to specific submodule
specdeck list stories --global          # All stories across all submodules

# Overlay management
specdeck overlay create AUTH-01         # Create overlay file for feature
specdeck overlay validate               # Check overlay references exist
specdeck overlay map AUTH-01-01 PROJ-1234  # Add Jira mapping

# Validation
specdeck validate coordinator           # Full coordinator validation
specdeck validate story-ids --global    # Check uniqueness across all repos
```

### Web UI Behavior in Coordinator Mode

**Read-Only Story Data**:
- UI displays aggregated stories from all submodules (via cache)
- Story data from submodules is read-only (cannot edit title, status, complexity, etc.)
- Users must edit stories in their original repos, then re-sync

**Editable Overlay Data**:
- UI can create, edit, and delete overlay files
- UI can add/modify/remove Jira mappings
- UI can edit internal notes in overlays
- All overlay edits saved immediately with validation

**Sync Behavior**:
- UI triggers `specdeck sync` automatically on load (background process)
- UI displays "Syncing..." indicator during sync
- UI has "Refresh" button in header to manually trigger sync
- Last sync timestamp displayed prominently (e.g., "Synced 5 minutes ago")
- If sync older than 24 hours, show warning badge

**Submodule Updates**:
- UI does NOT run `git submodule update`
- Users must manually run `git submodule update --remote` in terminal
- UI can detect stale submodules and show notification: "Submodules may be outdated. Run 'git submodule update --remote' to pull latest."

**Validation**:
- When adding Jira mapping, UI validates story ID exists in cache
- When creating overlay, UI validates feature exists in submodules
- Validation errors shown inline with suggestions

**Data Flow**:
```
1. User opens UI → Auto sync starts → UI shows "Syncing..."
2. Sync completes → UI shows stories with "Synced 30 seconds ago"
3. User edits overlay (adds Jira link) → Saves immediately → No re-sync needed
4. User clicks Refresh → Sync runs → Updates cache with latest from submodules
5. If submodules updated externally → User runs git command in terminal → Clicks Refresh in UI
```

### Future Considerations (Out of Scope)

Not included in this proposal but noted for future:

1. **Bidirectional Sync**: Push changes from coordinator back to submodules (complex, needs conflict resolution)
2. **Dependency Tracking**: Explicit links between stories in different repos (e.g., FE story depends on BE story)
3. **Rollup Releases**: Aggregate release views combining features from all repos
4. **Automated Jira Sync**: Two-way sync between SpecDeck overlays and Jira (requires API integration)
5. **Conflict Detection**: Alert when same feature has conflicting definitions across repos
6. **UI-Triggered Git Operations**: Auto-update submodules from UI (requires careful error handling)

### Security Considerations

- **Overlay Protection**: Overlays must never be committed to public repos (add to `.gitignore` patterns)
- **Cache Location**: Cache directory should be in `.gitignore` to prevent accidental commits
- **Submodule URLs**: Use SSH URLs for private/on-premises repos to enforce authentication
- **Visibility Labels**: Use `visibility` field in config to guide which data can be shared externally

### Migration Path

For existing projects:

1. **Create coordinator repo**: Initialize with submodules pointing to existing repos
2. **Extract Jira data**: If public repos have Jira columns, migrate to overlay files
3. **Clean public repos**: Remove Jira columns from public repo story files
4. **Configure coordinator**: Set up `.specdeck.config.json` with submodule paths
5. **Initial sync**: Run `specdeck sync` to populate cache
6. **Validate**: Run `specdeck validate coordinator --strict` to catch issues

### Success Criteria

This design succeeds if:

1. Public repos contain zero proprietary information (no Jira links, customer names)
2. Coordinator provides unified view of all stories with full metadata
3. Teams can update stories in individual repos without touching coordinator
4. Story ID uniqueness enforced across all repos automatically
5. Sync operation completes in <10 seconds for 1000+ stories across 5 repos
6. Validation catches all conflicts and references errors

### Open Questions

None - requirements clarified by user.

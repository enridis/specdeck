# Coordinator Test Fixture

This directory contains a mock coordinator repository for testing coordinator mode functionality.

## Structure

```
coordinator/
├── .specdeck.config.json          # Coordinator configuration
├── submodules/                     # Mock submodule repos
│   ├── backend/                    # Public API repo
│   │   └── specdeck/releases/R1/
│   │       ├── API-AUTH.md         # 3 stories: API-AUTH-01/02/03
│   │       └── API-USERS.md        # 2 stories: API-USERS-01/02
│   ├── frontend/                   # Private UI repo
│   │   └── specdeck/releases/R1/
│   │       ├── AUTH-UI.md          # 2 stories: FE-AUTH-01/02
│   │       └── DASHBOARD.md        # 2 stories: FE-DASH-01/02
│   └── models/                     # On-premises ML repo
│       └── specdeck/releases/R1/
│           └── ML-TRAIN.md         # 2 stories: ML-TRAIN-01/02
└── overlays/                       # Jira mappings (coordinator only)
    ├── backend/
    │   ├── API-AUTH.md             # PROJ-1001/1002/1003
    │   └── API-USERS.md            # PROJ-2001/2002
    ├── frontend/
    │   ├── AUTH-UI.md              # PROJ-3001/3002
    │   └── DASHBOARD.md            # PROJ-4001/4002
    └── models/
        └── ML-TRAIN.md             # PROJ-5001/5002
```

## Stories Summary

**Total**: 11 stories across 5 features and 3 repos
- Backend: 5 stories (API-AUTH, API-USERS)
- Frontend: 4 stories (AUTH-UI, DASHBOARD)
- Models: 2 stories (ML-TRAIN)

**Statuses**: 
- Done: 2
- In Progress: 4
- Planned: 5

**Complexity**:
- S: 1
- M: 6
- L: 2
- XL: 2

## Testing

This fixture can be used to test:
- Story aggregation across submodules
- Overlay application (Jira mappings)
- Cache generation
- List commands with `--global`, `--repo`, `--with-jira` flags
- Story ID validation
- UI coordinator mode display

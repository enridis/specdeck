---
title: SpecDeck Release Sync Plan
description: Reconcile release status with Jira, Azure, or OpenSpec using sync plans
version: 0.4.0
---

# Release Sync Workflow

Use this workflow to reconcile SpecDeck release status with external trackers.

## 1) Choose Source

Supported sources:
- `openspec` (optional hints from OpenSpec)
- `jira` (external input required)
- `azure` (external input required)

## 2) Prepare External Input (Jira/Azure)

Use MCP or export data to build a JSON file:

```json
{
  "items": [
    { "storyId": "CLI-CORE-01", "status": "In Progress", "externalId": "JIRA-123" },
    { "featureId": "REL-01", "status": "Blocked" }
  ]
}
```

## 3) Ensure Mapping File Exists

Mapping file location:
- `specdeck/mappings/jira.json`
- `specdeck/mappings/azure.json`

Update mappings so external statuses normalize to:
`planned`, `in_progress`, `in_review`, `blocked`, `done`.

## 4) Generate Sync Plan

OpenSpec:
```bash
specdeck releases sync-plan <release-id> --source openspec --json
```

Jira:
```bash
specdeck releases sync-plan <release-id> --source jira --input external.json --mapping specdeck/mappings/jira.json --json
```

Azure:
```bash
specdeck releases sync-plan <release-id> --source azure --input external.json --mapping specdeck/mappings/azure.json --json
```

## 5) Apply Updates

Use the sync plan to:
- Update external systems (Jira/Azure) when SpecDeck is source of truth
- Or update SpecDeck story statuses when external system is authoritative

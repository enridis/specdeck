---
title: External Status Mapping Guide
version: 0.4.0
---

# External Status Mapping Guide

SpecDeck sync plans rely on simple JSON mapping files:
- `specdeck/mappings/jira.json`
- `specdeck/mappings/azure.json`

These files normalize external tracker statuses to SpecDeck statuses:
`planned`, `in_progress`, `in_review`, `blocked`, `done`.

## External Input Format (external.json)

The sync plan expects a JSON array or `{ "items": [...] }` with:
- **Required**: `storyId` or `featureId`
- **Required**: `status` (external tracker status)
- **Optional**: `externalId`, `title`

Example:
```json
{
  "items": [
    { "storyId": "REL-01-01", "status": "In Progress", "externalId": "JIRA-123" },
    { "featureId": "REL-01", "status": "Blocked" }
  ]
}
```

Rules:
- Items without `storyId`/`featureId` are skipped with a warning.
- `featureId` applies the status to all stories in that feature.
- Status is normalized using the mapping file.

## How to Update the Mapping

1) Open the mapping file for your tracker.
2) Add any missing external status keys under `statusMapping`.
3) Map each status to a valid SpecDeck status value.

Example:
```json
{
  "statusMapping": {
    "Ready for QA": "in_review",
    "Waiting on Design": "blocked"
  }
}
```

## Tracker Field Rules (Recommended)

To reduce ambiguity, align your tracker export to these fields:
- **Release ID**: use a label/custom field containing the SpecDeck release ID (e.g., `R1-foundation`)
- **Feature ID**: use a component/tag containing the SpecDeck feature ID (e.g., `REL-01`)
- **Story ID**: store the SpecDeck story ID (e.g., `REL-01-01`) in a custom field or issue key mapping

The `external.json` should include `storyId` when possible. If only `featureId` is available,
sync-plan will apply the status across all stories in that feature.

## Optional Tracker Conventions

If your tracker requires custom fields for release tracking:
- Use a release label or custom field for the release ID (e.g., `R1-foundation`).
- Use a component or tag for feature ID (e.g., `REL-01`).
- Ensure your export includes `storyId` or `featureId` for accurate matching.

## Troubleshooting

- If a status is not mapped, sync-plan will report it as an unmapped item.
- If multiple external statuses map to the same story, sync-plan will warn about conflicts.

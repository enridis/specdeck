## Context
PM workflows need structured release status and reconciliation with external trackers (Jira/Azure), while SpecDeck must remain usable without OpenSpec. Existing commands provide story stats and coordinator sync, but there is no release-focused status command, and OpenSpec status reconciliation is tied to a conflicting `specdeck sync` concept. This change introduces PM-focused commands and workflows while keeping SpecDeck as the primary source of truth.

## Goals / Non-Goals
- Goals:
  - Provide release-level status collection with machine-readable output.
  - Provide a release-level sync-plan command that compares SpecDeck to OpenSpec or external inputs.
  - Treat OpenSpec as an optional status source (not required to use SpecDeck).
  - Replace the generic commands-cheatsheet prompt with PM workflows.
- Non-Goals:
  - No direct network calls to Jira/Azure (MCP workflows handle that externally).
  - No persistent storage of generated status reports.
  - No changes to coordinator cache sync semantics (`specdeck sync`).

## Decisions
- Source of truth is SpecDeck release + story files; OpenSpec and external trackers are optional status sources.
- Group release commands under `specdeck releases` only (no aliases); bump CLI version to 0.4.0 for the breaking change.
- Add `specdeck releases status <release-id>` to generate release status summaries and JSON output.
- Add `specdeck releases sync-plan <release-id> --source <openspec|jira|azure> --input <file> [--mapping <file>]` to generate a diff/plan without modifying files.
- For OpenSpec, reuse change state mapping rules to propose status suggestions in the sync plan.
- External input files use a simple JSON schema with explicit `storyId` or `featureId` mapping to reduce ambiguity.
- Provide a status mapping file at `specdeck/mappings/<source>.json` (template + instructions) and require it for external sync plans.
- Keep `specdeck sync` reserved for coordinator cache management to avoid command conflicts.

## Alternatives Considered
- Extend `specdeck sync` to handle OpenSpec status reconciliation. Rejected due to command name conflicts with coordinator sync and broader scope.
- Implement direct Jira/Azure API calls in CLI. Rejected due to no-network constraint and MCP-based workflows.
- Store status snapshots in release files. Rejected to keep status collection ephemeral and PM-controlled.

## Risks / Trade-offs
- External inputs may not map cleanly to SpecDeck IDs, requiring additional mapping rules or manual resolution.
- Introducing new commands adds surface area; prompts must guide correct usage to avoid confusion.
- OpenSpec-derived hints could be misleading if changes are not linked to stories consistently.

## Migration Plan
- No migrations required.
- New templates are installed via `specdeck upgrade` and `specdeck init`.
- Remove `specdeck-commands` prompt from template lists; existing copies remain unchanged unless upgraded.
- Bump CLI version to 0.4.0 to reflect breaking command regrouping.

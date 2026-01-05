# Change: Add PM release status and sync workflows

## Why
PMs need first-class workflows for creating releases, collecting status, and syncing with external trackers. SpecDeck must work without OpenSpec while still allowing OpenSpec to contribute implementation signals when present.

## What Changes
- Add PM-focused prompt templates for release creation, release status collection, and external sync workflows.
- Add CLI commands grouped under `specdeck releases` to generate release status summaries and sync plans with structured JSON output.
- Treat OpenSpec as an optional status source and align release commands to SpecDeck-owned release files.
- Introduce an external status mapping file (default template + instructions) for Jira/Azure sync plans, plus Markdown guidance with field rules and `external.json` examples.
- Remove the commands-cheatsheet prompt template from default installs.
- Add coordinator-mode workflow guidance for cache-only sync and conflict handling (stop-and-ask-PM rules).
- **BREAKING**: Replace `specdeck list releases` and `specdeck create release` with grouped `specdeck releases list|create` only.
- **BREAKING**: Bump CLI version to 0.4.0.

## Impact
- Affected specs: prompt-templates, release-management, openspec-integration
- Affected code: release CLI command grouping, status/sync plan services, template bundling/upgrade list, mapping file guidance, documentation
- Affected docs: coordinator setup workflow guidance

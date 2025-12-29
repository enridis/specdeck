# Change: Add Windsurf workflows and unify upgrade/init

## Why
SpecDeck already supports Copilot prompt templates, but Windsurf workflows need the same guidance and installation lifecycle. We also want a simpler upgrade surface and AGENTS.md content that focuses on SpecDeck details rather than workflow references.

## What Changes
- Add `specdeck init windsurf` to install workflows in `.windsurf/workflows/` while scaffolding the SpecDeck directory (same baseline as `init copilot`).
- Replace `specdeck upgrade copilot` with `specdeck upgrade` (no target) and apply `--list`, `--template`, `--force` across all initialized targets.
- Track initialized targets in `.specdeck-version` and use them during upgrades.
- Update AGENTS.md managed block and SpecDeck AGENTS template to emphasize SpecDeck structure and commands (no workflow file references).
- Install Windsurf workflow filenames that match prompt base names (same content, `.md` extension).

## Impact
- Affected specs: `openspec/specs/copilot-chat-commands/spec.md`, `openspec/specs/prompt-templates/spec.md`, `openspec/specs/agents-md-management/spec.md`, `openspec/specs/vscode-extension/spec.md`
- Affected code: `src/commands/init.ts`, `src/commands/upgrade.ts`, `src/templates/copilot/AGENTS.md.template`, `src/templates/specdeck/AGENTS.md.template`, template installation/version tracking logic

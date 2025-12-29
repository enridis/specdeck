## Context
SpecDeck currently installs Copilot prompt templates via `specdeck init copilot` and upgrades them with `specdeck upgrade copilot`. Windsurf needs equivalent workflows in `.windsurf/workflows/` using the same prompt content, and users want a single `specdeck upgrade` command to refresh all initialized targets. AGENTS.md content should focus on SpecDeck structure and commands, not assistant workflow files.

## Goals / Non-Goals
- Goals:
  - Add `specdeck init windsurf` that installs workflows and scaffolds SpecDeck like `init copilot`.
  - Keep `init copilot` and allow both targets to coexist without overwriting each other.
  - Provide `specdeck upgrade` that updates all initialized targets with existing flags.
  - Track initialized targets in `.specdeck-version` and use them during upgrades.
  - Update AGENTS templates to be SpecDeck-centric.
- Non-Goals:
  - Introduce new template content or workflows beyond existing prompts.
  - Change unrelated CLI behavior or add new assistant integrations.

## Decisions
- Add a `targets` array in `.specdeck-version`, e.g. `["copilot", "windsurf"]`.
- `specdeck init copilot` and `specdeck init windsurf` both scaffold SpecDeck and update AGENTS.md; each adds its target to `.specdeck-version` even when the version file already exists.
- `specdeck upgrade` uses `targets` to decide which directories to update and falls back to directory detection if `targets` is missing (backward compatibility).
- Windsurf workflow filenames mirror prompt base names: `specdeck-commands.prompt.md` becomes `.windsurf/workflows/specdeck-commands.md` with identical content (including frontmatter).
- `specdeck upgrade` refreshes the SpecDeck managed block to the latest template.

## Risks / Trade-offs
- Removing workflow references from AGENTS.md reduces direct discoverability of prompt files; mitigate by strengthening SpecDeck usage guidance and pointing to `specdeck/AGENTS.md`.
- Existing installs without `targets` may need inference logic; the fallback detection reduces upgrade friction.

## Migration Plan
- On `specdeck upgrade`, if `targets` is missing, infer `copilot` when `.github/prompts/` exists and `windsurf` when `.windsurf/workflows/` exists, then write back to `.specdeck-version`.
- `specdeck init windsurf` and `specdeck init copilot` update the version file to include the new target.

## Open Questions
- None.

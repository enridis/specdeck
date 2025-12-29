## 1. Implementation
- [x] 1.1 Update CLI command registration to add `specdeck init windsurf` and replace `specdeck upgrade copilot` with `specdeck upgrade` while preserving `--list`, `--template`, `--force` behavior.
- [x] 1.2 Implement Windsurf workflow installation to `.windsurf/workflows/` using the same bundled template content with matching base filenames.
- [x] 1.3 Update upgrade logic to apply to all initialized targets, create backups per target, and honor selective template updates.
- [x] 1.4 Extend `.specdeck-version` format to include `targets`, add migration fallback for missing targets, and update init/upgrade flows accordingly.
- [x] 1.5 Refine AGENTS templates (managed block and `specdeck/AGENTS.md`) to focus on SpecDeck structure and commands, removing workflow references.
- [x] 1.6 Update prompt templates and docs that reference `specdeck upgrade copilot` to `specdeck upgrade`.
- [x] 1.7 Add or update tests for init/upgrade across targets, version tracking, and AGENTS updates.

## 2. Validation
- [x] 2.1 Run `npm test` (or targeted test suite) for init/upgrade flows.
- [x] 2.2 Run `specdeck validate all` to ensure SpecDeck artifacts remain valid.

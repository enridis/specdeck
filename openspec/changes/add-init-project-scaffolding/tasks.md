# Tasks

Implementation checklist for add-init-project-scaffolding change.

## Prerequisites
- [ ] Review existing `initCopilot()` function in `src/commands/init.ts`
- [ ] Review existing template system in `src/templates/copilot/`
- [ ] Review all code locations reading `openspec/project-plan.md` (see design.md)

## Template Creation - SpecDeck Files
- [ ] Create `src/templates/specdeck/` directory
- [ ] Create `project-plan.md.template` (roadmap)
  - Add header: "Project Roadmap" with 2-3 line description
  - Explain two-tier planning structure
  - Add example release entries (R1, R2) with:
    - Status (in_progress, planned, done)
    - Quarter/timeline
    - Story counts (total, done)
    - High-level goals (3-4 bullet points)
    - Link to detailed file (e.g., `[R1 Stories](./releases/R1-foundation.md)`)
  - Brief guidance on release management
- [ ] Create `releases/` directory template structure
- [ ] Create `releases/R1-foundation.md.template` (detailed stories)
  - Add header: "R1 - Foundation" with release description
  - Add full story table with all columns
  - Add 2-3 example stories (IDs: SDK-01-01, SDK-01-02, SDK-01-03)
  - Use valid status values (planned, in_progress, done)
  - Use valid complexity values (S, M, L)
  - Add brief inline comment explaining columns
  - Link to project-plan.md roadmap
- [ ] Create `vision.md.template`
  - Sections: Problem, Solution, Target Users, Success Metrics, Roadmap
  - 1-2 line guidance per section
  - Link to SpecDeck's vision.md as reference
- [ ] Create `AGENTS.md.template` for SpecDeck
  - Header: "SpecDeck Tool Instructions"
  - Section: SpecDeck CLI Commands (list, sync status, validate)
  - Section: Two-Tier Planning Structure (roadmap + per-release)
  - Section: project-plan.md Roadmap Format
  - Section: releases/R*.md Story Table Format (columns and valid values)
  - Section: Release Management (active detection, --release, --all, archive)
  - Section: Story Decomposition Workflow
  - Section: Integration with OpenSpec (link to openspec/AGENTS.md)
  - Link to .github/prompts/ templates

## Template Creation - OpenSpec Files
- [ ] Create `src/templates/openspec/` directory
- [ ] Create `project.md.template`
  - Sections: Purpose, Tech Stack, Conventions, Domain Context
  - 1-2 line guidance per section
  - Link to SpecDeck's project.md as reference
- [ ] Create `AGENTS.md.template` for OpenSpec
  - Header: "OpenSpec Framework Instructions"
  - Section: Creating Proposals (workflow, format)
  - Section: Spec Format Conventions (ADDED/MODIFIED/REMOVED, scenarios)
  - Section: Validation Requirements
  - Section: Change Directory Structure
  - Link to specdeck/AGENTS.md for tool commands

## Command Implementation
- [ ] Add `scaffoldSpecDeck()` helper function in `src/commands/init.ts`
  - Check if `specdeck/` directory exists
  - Return early if exists (idempotent)
  - Create `specdeck/` directory structure
  - Create `specdeck/releases/` subdirectory
  - Copy templates from `src/templates/specdeck/` to `specdeck/`
  - Copy release template to `specdeck/releases/R1-foundation.md`
  - Return list of created files
- [ ] Add `scaffoldOpenSpec()` helper function in `src/commands/init.ts`
  - Check if `openspec/` directory exists
  - Return early if exists (idempotent)
  - Create `openspec/` directory
  - Copy templates from `src/templates/openspec/` to `openspec/`
  - Return list of created files
- [ ] Update `initCopilot()` function
  - Call `scaffoldSpecDeck()` before creating prompts (step 0a)
  - Call `scaffoldOpenSpec()` before creating prompts (step 0b)
  - Capture both created files lists
  - Update success message to list SpecDeck files (including releases/), OpenSpec files, and Copilot templates separately
- [ ] Update version tracking in `.specdeck-version`
  - Add `specdeckFiles: string[]` field (includes releases/R*.md)
  - Add `openspecFiles: string[]` field
  - Keep existing `templates: string[]` for Copilot templates

## Configuration Updates
- [ ] Update `src/schemas/config.schema.ts`
  - Add `specdeckDir` string field with default `./specdeck`
  - Add JSDoc explaining purpose

## Release Management Implementation
- [ ] Create `src/services/release.service.ts`
  - Parse `specdeck/project-plan.md` for release metadata
  - Detect active release (first with `status: in_progress`)
  - List all releases (active, planned, archived)
  - Resolve release file path (e.g., `releases/R1-foundation.md`)
- [ ] Create `src/repositories/release.repository.ts`
  - Read roadmap file
  - Extract release entries
  - Validate release structure
- [ ] Create `src/schemas/release.schema.ts`
  - Define release metadata schema (id, name, status, quarter, goals, storiesTotal, storiesDone, detailsPath)

## Path Resolution Refactoring
- [ ] Update `src/services/story.service.ts`
  - Change from `join(openspecDir, 'project-plan.md')`
  - To two-tier approach:
    - Parse `join(specdeckDir, 'project-plan.md')` for roadmap
    - Detect active release or use `--release` flag
    - Read stories from `join(specdeckDir, 'releases', '${release}.md')`
- [ ] Update `src/repositories/story.repository.ts`
  - Update JSDoc comment to reference two-tier structure
  - Add support for reading from per-release files
- [ ] Update `src/commands/list.ts`
  - Add `--release` flag to target specific release
  - Add `--all` flag to show all releases
  - Default behavior: show active release only
  - Support archived releases in `releases/archive/`
- [ ] Update `src/commands/validate.ts`
  - Update path resolution to validate roadmap + per-release files
  - Validate release metadata in roadmap
  - Validate story tables in release files
- [ ] Update `src/commands/sync.ts`
  - Auto-detect active release
  - Update stories in active release file
  - Update user-facing messages to reference two-tier structure
- [ ] Update `src/commands/propose.ts`
  - Update message about adding stories to reference active release file

## Testing
- [ ] Unit test for `scaffoldSpecDeck()` function
  - Test successful scaffolding (roadmap + releases/R1)
  - Test idempotency (skip if exists)
  - Verify created files list includes releases/
- [ ] Unit test for `scaffoldOpenSpec()` function
  - Test successful scaffolding
  - Test idempotency (skip if exists)
  - Verify created files list
- [ ] Unit tests for release service
  - Test parsing roadmap for release metadata
  - Test active release detection
  - Test release file path resolution
  - Test archive directory support
- [ ] Integration test for `initCopilot()` with two-tier structure
  - Test creates specdeck/ (with releases/), openspec/, and .github/prompts/
  - Test correct order of operations
  - Verify version file tracks all files including releases/R1
- [ ] Integration tests for story service with two-tier structure
  - Test reading from roadmap + active release file
  - Test `--release` flag targeting
  - Test `--all` flag across multiple releases
- [ ] Validation tests: parse scaffolded files
  - Verify `specdeck/project-plan.md` roadmap passes validation
  - Verify `specdeck/releases/R1-foundation.md` passes validation
  - Verify example stories have valid IDs, statuses, complexity
  - Run `specdeck validate` on scaffolded directory

## Documentation
- [ ] Update README.md project structure section
  - Show both `specdeck/` and `openspec/` directories
  - Explain separation of concerns
  - Update `specdeck init copilot` description
- [ ] Update README.md commands section
  - Note that init creates both directory structures
- [ ] Update `docs/manifesto.md`
  - Change references from `openspec/project-plan.md` to `specdeck/project-plan.md`
- [ ] Update `docs/overview.md` and `docs/overview_new.md`
  - Update all project-plan.md path references
- [ ] Update `openspec/project.md`
  - Update User Stories location to `specdeck/project-plan.md`
  - Explain SpecDeck/OpenSpec separation
- [ ] Update command help text
  - Ensure `specdeck init copilot --help` mentions both directory scaffolding
- [ ] Add architectural decision note
  - Document why separation exists
  - Reference design.md

## SpecDeck Repository Migration
- [ ] Create `specdeck/` directory structure
  - Create `specdeck/releases/` directory
- [ ] Migrate to two-tier planning:
  - Move current detailed `openspec/project-plan.md` → `specdeck/releases/R1-foundation.md`
  - Create new `specdeck/project-plan.md` as roadmap with R1 summary and link
- [ ] Move `openspec/vision.md` to `specdeck/vision.md`
- [ ] Split AGENTS.md files:
  - Extract SpecDeck CLI instructions → `specdeck/AGENTS.md`
  - Keep OpenSpec workflow instructions → `openspec/AGENTS.md`
- [ ] Update `.specdeck.config.json` if it exists (add `specdeckDir: "./specdeck"`)
- [ ] Test all commands work with migrated two-tier structure:
  - `specdeck list stories` (should show R1 stories)
  - `specdeck list stories --release R1` (explicit release)
  - `specdeck sync status` (should update R1)
  - `specdeck validate` (should validate roadmap + R1 file)
- [ ] Verify all documentation references updated paths
- [ ] Update README examples to show two-tier structure

## Validation
- [ ] Run `npm test` and ensure all tests pass
- [ ] Run `specdeck init copilot` in test directory and verify:
  - Creates `specdeck/` with project-plan.md (roadmap), vision.md, and AGENTS.md
  - Creates `specdeck/releases/` with R1-foundation.md
  - Creates `openspec/` with project.md and AGENTS.md
  - Creates `.github/prompts/` with templates
  - Success message lists all created files in organized groups
- [ ] Run `specdeck validate` on initialized project
  - Verify `specdeck/project-plan.md` roadmap passes validation
  - Verify `specdeck/releases/R1-foundation.md` passes validation
  - No errors reported
- [ ] Test release management commands:
  - `specdeck list stories` shows R1 stories (active release)
  - `specdeck list stories --release R1` works explicitly
  - `specdeck list stories --all` shows all releases
  - `specdeck sync status` updates R1 file
- [ ] Test idempotency
  - Run `init copilot` twice
  - First run creates everything
  - Second run shows "already initialized"
  - No files modified on second run
- [ ] Manual inspection of generated files
  - Verify `specdeck/AGENTS.md` contains tool instructions including two-tier planning
  - Verify `openspec/AGENTS.md` contains framework instructions
  - Verify roadmap links to release files correctly
  - Verify cross-references between files are correct
- [ ] Validate SpecDeck's own repository after migration
  - Run all commands against migrated two-tier structure
  - Verify `list stories` shows R1 stories
  - Verify `sync status` updates correct file
  - Ensure no broken references in documentation
  - Verify GitHub Copilot can read both AGENTS.md files and understand two-tier structure

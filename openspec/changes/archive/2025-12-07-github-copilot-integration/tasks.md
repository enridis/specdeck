# Implementation Tasks: GitHub Copilot Integration

## Phase 1: Template Creation (Week 1)
- [x] Create prompt template files
- [x] Write decompose-feature.prompt.md
- [x] Write sync-workflow.prompt.md
- [x] Write status-reference.prompt.md
- [x] Write commands-cheatsheet.prompt.md
- [x] Create AGENTS.md.template

## Phase 2: Init Command (Week 2)
- [x] Implement `specdeck init copilot` command
- [x] Template file copying logic
- [x] `.github/prompts/` directory creation
- [x] AGENTS.md update/creation logic
- [x] `.specdeck-version` file creation
- [x] Idempotency checks

## Phase 3: Upgrade Command (Week 3)
- [x] Implement `specdeck upgrade copilot` command
- [x] Version comparison logic
- [x] Backup mechanism for existing templates
- [x] Selective vs full replacement options
- [x] --list flag to show template status

## Phase 4: Documentation & Testing (Week 4)
- [x] Test init on new projects
- [x] Test upgrade with version mismatches
- [x] Test idempotency
- [x] Test backup mechanism
- [x] Test selective upgrades with --template flag
- [x] Test --force flag
- [x] Update SpecDeck CLI README
- [x] Add usage examples to README

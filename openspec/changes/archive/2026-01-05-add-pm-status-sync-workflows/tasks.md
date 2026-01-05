## 1. Planning
- [x] 1.1 Confirm CLI command naming and JSON schema for release status and sync-plan outputs
- [x] 1.2 Define external input mapping rules (storyId/featureId) and status normalization
- [x] 1.3 Define mapping file schema and default template for Jira/Azure

## 2. CLI Commands and Services
- [x] 2.1 Implement `specdeck releases status` with release-scoped rollups and JSON output
- [x] 2.2 Implement `specdeck releases sync-plan` with source adapters (specdeck, openspec, external input)
- [x] 2.3 Ensure OpenSpec is optional and skipped when absent
- [x] 2.4 Remove legacy release command aliases and bump CLI version to 0.4.0

## 3. Prompt Templates
- [x] 3.1 Add release-create, release-status, and release-sync prompt templates
- [x] 3.2 Update existing templates to reference SpecDeck-first workflows and new commands
- [x] 3.3 Add mapping file template + instructions to release-sync prompt
- [x] 3.4 Remove commands-cheatsheet template from init/upgrade lists

## 4. Docs and Validation
- [x] 4.1 Update README and template lists to reflect new workflows
- [x] 4.2 Add tests for release status and sync-plan outputs
- [x] 4.3 Run tests and `openspec validate add-pm-status-sync-workflows --strict`
- [x] 4.4 Document coordinator conflict handling guidance in workflows/specs

# Proposal: GitHub Copilot Integration for SpecDeck

## Change ID
`github-copilot-integration`

## Status
Proposed

## Why

### Problem Statement
The SpecDeck CLI provides powerful workflows for managing OpenSpec-Driven Delivery, but developers using GitHub Copilot in VS Code would benefit from having workflow guidance and prompt templates directly in their projects. Currently, there's no built-in way to install Copilot-friendly documentation and prompt templates.

Current pain points:
1. **Manual Setup**: Users must manually create `.github/prompts/` and write prompt files
2. **Inconsistency**: Each project has different prompt quality and structure
3. **Outdated Guidance**: No way to update prompts when SpecDeck workflows evolve
4. **Discovery**: New team members don't know what prompt templates are available

### User Impact
- **Developers** lack consistent Copilot guidance for SpecDeck workflows
- **New Contributors** must learn workflows without built-in prompt assistance
- **Teams** have no way to share standardized prompt templates across projects

### Why Now?
- GitHub Copilot can read `.github/prompts/` and `AGENTS.md` automatically
- SpecDeck CLI is functional and workflows are stabilized
- Template management pattern (init/upgrade) is well-established (npm, git, etc.)

## What Changes

### Overview
Add CLI commands to install and manage GitHub Copilot prompt templates that guide users through SpecDeck workflows. Templates are bundled with the CLI and installed into projects via `specdeck init copilot` and updated via `specdeck upgrade copilot`.

### Target Specs

This change creates the following new specs:

#### `cli-copilot-init`
- `specdeck init copilot` command to install prompt templates
- Template copying from CLI bundle to `.github/prompts/`
- AGENTS.md update/creation with SpecDeck-specific instructions
- Version tracking for installed templates

#### `cli-copilot-upgrade`
- `specdeck upgrade copilot` command to update templates
- Compare installed version with bundled version
- Selective or full template replacement
- Backup existing templates before upgrade

#### `prompt-templates`
- Template files bundled with CLI distribution
- Feature decomposition guide
- Sync workflow guide
- Story status reference
- SpecDeck command cheat sheet

### Architecture

```
specdeck-cli/
├── src/
│   ├── commands/
│   │   ├── init.ts              # specdeck init copilot
│   │   └── upgrade.ts           # specdeck upgrade copilot
│   └── templates/
│       └── copilot/
│           ├── prompts/
│           │   ├── decompose-feature.prompt.md
│           │   ├── sync-workflow.prompt.md
│           │   ├── status-reference.prompt.md
│           │   └── commands-cheatsheet.prompt.md
│           └── AGENTS.md.template
└── package.json                 # Version bundled with templates

User Project (after init):
project/
├── .github/
│   └── prompts/
│       ├── decompose-feature.prompt.md
│       ├── sync-workflow.prompt.md
│       ├── status-reference.prompt.md
│       └── commands-cheatsheet.prompt.md
├── AGENTS.md                    # Updated with SpecDeck section
└── .specdeck-version            # Tracks installed template version
```

### Key Features

#### 1. Init Command
Install Copilot prompt templates into current project:
```bash
specdeck init copilot
```
- Creates `.github/prompts/` directory
- Copies all template files from CLI bundle
- Updates or creates `AGENTS.md` with SpecDeck instructions
- Creates `.specdeck-version` file tracking template version
- Idempotent (safe to run multiple times)

#### 2. Upgrade Command
Update installed templates to latest version:
```bash
specdeck upgrade copilot
```
- Checks current vs bundled version
- Backs up existing templates to `.github/prompts/.backup-{timestamp}/`
- Replaces templates with new versions
- Updates `.specdeck-version` file
- Shows changelog of what changed

#### 3. Prompt Templates
Bundled templates guide common workflows:
- **decompose-feature.prompt.md**: Breaking features into stories
- **sync-workflow.prompt.md**: Syncing story status with OpenSpec
- **status-reference.prompt.md**: Story status meanings and transitions
- **commands-cheatsheet.prompt.md**: Quick reference for SpecDeck commands

#### 4. AGENTS.md Integration
Updates project's `AGENTS.md` with SpecDeck-specific section:
```markdown
<!-- SPECDECK:START -->
# SpecDeck Instructions

For SpecDeck workflow guidance, see prompt files in `.github/prompts/`:
- @.github/prompts/decompose-feature.prompt.md
- @.github/prompts/sync-workflow.prompt.md
- @.github/prompts/status-reference.prompt.md
- @.github/prompts/commands-cheatsheet.prompt.md

Use `specdeck list`, `specdeck sync status` for project information.
<!-- SPECDECK:END -->
```

### Non-Goals (Out of Scope)
- **VS Code Extension**: No extension installation required
- **Copilot Chat Commands**: No custom slash commands (use prompts instead)
- **Context Providers**: No automatic context injection (Copilot reads files naturally)
- **Custom Copilot Training**: Use standard Copilot with good prompts
- **Modifying OpenSpec Files**: Commands only install/update prompt files

## Implementation Plan

### Phase 1: Template Creation (Week 1)
- [ ] Create prompt template files
- [ ] Write decompose-feature.prompt.md
- [ ] Write sync-workflow.prompt.md
- [ ] Write status-reference.prompt.md
- [ ] Write commands-cheatsheet.prompt.md
- [ ] Create AGENTS.md.template

### Phase 2: Init Command (Week 2)
- [ ] Implement `specdeck init copilot` command
- [ ] Template file copying logic
- [ ] `.github/prompts/` directory creation
- [ ] AGENTS.md update/creation logic
- [ ] `.specdeck-version` file creation
- [ ] Idempotency checks

### Phase 3: Upgrade Command (Week 3)
- [ ] Implement `specdeck upgrade copilot` command
- [ ] Version comparison logic
- [ ] Backup mechanism for existing templates
- [ ] Selective vs full replacement options
- [ ] Changelog display

### Phase 4: Documentation & Testing (Week 4)
- [ ] Update SpecDeck CLI README
- [ ] Add usage examples
- [ ] Test init on new projects
- [ ] Test upgrade with version mismatches
- [ ] User acceptance testing
- [ ] Create copilot-instructions.md
- [ ] Create copilot-instructions.md
- [ ] Create workflow prompt templates
- [ ] Write extension README
- [ ] Create usage examples and screenshots

### Phase 5: Testing & Polish (Week 5)
- [ ] Integration testing with SpecDeck CLI
- [ ] User acceptance testing with team
- [ ] Performance optimization
- [ ] Package for VS Code marketplace

## Success Criteria

### Functional Requirements
- ✅ `specdeck init copilot` creates `.github/prompts/` with all templates
- ✅ AGENTS.md is updated/created with SpecDeck instructions
- ✅ `.specdeck-version` tracks installed template version
- ✅ `specdeck upgrade copilot` updates templates and backs up old ones
- ✅ Templates provide clear guidance for SpecDeck workflows
- ✅ Commands are idempotent (safe to run multiple times)

### Non-Functional Requirements
- ✅ Command execution time <1s for typical operations
- ✅ Templates bundled with CLI (no network dependency)
- ✅ Works with SpecDeck CLI v0.1.0+
- ✅ Compatible with GitHub Copilot in VS Code 1.85+
- ✅ Templates are Markdown with proper frontmatter

### User Experience
- ✅ Clear success/error messages during init/upgrade
- ✅ Changelog shows what changed during upgrade
- ✅ Backup mechanism prevents accidental data loss
- ✅ New projects can run `specdeck init copilot` immediately after `specdeck init`

## Dependencies and Sequencing

### Prerequisites
- SpecDeck CLI v0.1.0 must have basic command structure
- Template files must be finalized and tested
- AGENTS.md format must be stable

### Blocking Relationships
- Upgrade command requires init command to be implemented first
- Template versioning requires `.specdeck-version` file format

### Parallel Work Opportunities
- Template content can be written while commands are being implemented
- Documentation can be written alongside implementation
- Testing can begin as soon as init command works

## Risks and Mitigations

### Risk: Template Content Becomes Outdated
**Impact**: Medium | **Likelihood**: Medium

As SpecDeck workflows evolve, installed templates may become stale.

**Mitigation**:
- Version tracking via `.specdeck-version` file
- Clear upgrade path with `specdeck upgrade copilot`
- Changelog to show what changed between versions
- Backup mechanism to preserve custom modifications

### Risk: Conflicts with User Customizations
**Impact**: Medium | **Likelihood**: Medium

Users may customize templates and lose changes during upgrade.

**Mitigation**:
- Automatic backup to `.github/prompts/.backup-{timestamp}/`
- Optional `--force` flag to override without backup
- Clear messaging about what will be replaced
- Consider `--merge` option in future for selective updates

### Risk: AGENTS.md Conflicts
**Impact**: Low | **Likelihood**: Low

Project may already have AGENTS.md with different format or content.

**Mitigation**:
- Use managed block pattern: `<!-- SPECDECK:START -->...<!-- SPECDECK:END -->`
- Only update SpecDeck section, preserve other content
- Show diff before applying changes
- Safe to run multiple times (idempotent)

## Open Questions

1. **Template File Naming**: Use `.prompt.md` suffix or plain `.md`?
   - **Recommendation**: Use `.prompt.md` to clearly indicate purpose

2. **Version Format**: Semver or date-based versioning?
   - **Recommendation**: Use CLI version (semver) for simplicity

3. **Backup Retention**: How long to keep backup directories?
   - **Recommendation**: Keep last 3 backups, add cleanup command later

4. **Custom Templates**: Should users be able to add their own templates?
   - **Recommendation**: Yes, but keep separate from managed templates

5. **Merge Strategy**: How to handle conflicts between old/new templates?
   - **Recommendation**: Start with replace-all, add merge option in v2

## Approval Checklist
- [ ] Problem statement and user impact reviewed
- [ ] Architecture and integration approach validated
- [ ] Non-invasive approach (no OpenSpec file modifications) confirmed
- [ ] Success criteria and timeline agreed upon
- [ ] Ready for implementation (tasks.md to be created)

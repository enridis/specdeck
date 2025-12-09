---
id: add-web-ui-mode
title: Add Web UI Mode for SpecDeck Management
status: implemented
created: 2025-12-08
completed: 2025-12-08
---

# Proposal: Add Web UI Mode for SpecDeck Management

## Summary

Add a web-based UI mode to SpecDeck that provides CRUD operations for releases, features, and stories through an interactive interface. The UI will run via `specdeck serve` command and persist changes directly to the feature-based Markdown file structure.

## Motivation

Currently, SpecDeck requires users to:
- Manually edit Markdown files or use CLI commands for all operations
- Navigate between multiple files to understand relationships
- Memorize CLI syntax for common operations
- Context-switch between editor and terminal

A web UI will:
- Lower the barrier to entry for non-technical stakeholders (PMs, designers)
- Enable bulk operations and visual editing
- Provide drill-down navigation through the hierarchy
- Display real-time statistics and relationships
- Speed up common workflows (status updates, story creation)

## Goals

1. **Enable CRUD operations** for releases, features, and stories through web UI
2. **Provide hierarchical navigation** from releases → features → stories and releases → milestones → stories
3. **Persist changes** to Markdown files respecting SpecDeck conventions
4. **Maintain data integrity** using existing Zod schemas and validation
5. **Support existing workflows** - files remain editable via CLI/editor

## Non-Goals

- Real-time collaboration (multi-user editing)
- Auto-commit/push to Git (users commit manually)
- File watching and hot-reload (v1 scope)
- Authentication/authorization (single-user local tool)
- VS Code extension integration (future work)
- TUI or desktop app versions

## User Stories

### As a Product Manager
- I want to view all releases and their features in a dashboard so I can understand the current roadmap
- I want to update story statuses without editing Markdown tables so I can track progress quickly
- I want to see stories grouped by milestone so I can plan sprint work

### As a Tech Lead
- I want to create new features and stories through forms so I can avoid Markdown formatting errors
- I want to drill down from release → feature → story so I can review the full hierarchy
- I want to see story statistics by status/complexity so I can identify bottlenecks

### As a Developer
- I want to filter stories by feature so I can see only my current work
- I want to edit story details (title, complexity, notes) so I can update planning without CLI commands
- I want changes saved to Markdown files so my Git workflow remains unchanged

## Success Criteria

1. **Functional**: Users can perform all CRUD operations via web UI
2. **Integrity**: All changes validate against existing Zod schemas
3. **Compatibility**: Files remain parseable by existing CLI commands
4. **Performance**: UI loads within 2 seconds for projects with 200+ stories
5. **Usability**: New users can complete common tasks without documentation

## Open Questions

1. Should we support bulk status updates (e.g., move all stories in milestone to "in_progress")?
2. Do we need an undo/redo mechanism for UI operations?
3. Should we show a diff preview before saving changes?
4. How should we handle validation errors (inline vs. modal)?

## Dependencies

- Existing Zod schemas (Story, Feature, Release)
- Existing Repository layer (StoryRepository, FeatureRepository, ReleaseRepository)
- Existing Service layer (StoryService, FeatureService, ReleaseService)

## Timeline Estimate

- **Design & Planning**: 2-3 days
- **Backend API Development**: 5-7 days
- **Frontend Development**: 8-10 days
- **Integration & Testing**: 3-4 days
- **Total**: 18-24 days (3-4 weeks)

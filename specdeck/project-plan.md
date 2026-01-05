# SpecDeck Project Roadmap

This file provides a high-level overview of SpecDeck releases. Each release links to a detailed story file in the `releases/` directory.

**Two-Tier Planning Structure:**
- **This file (project-plan.md)**: High-level roadmap with release summaries, goals, and story counts
- **releases/R*.md**: Detailed story tables per release (editable story tracking)

SpecDeck commands auto-detect the active release (first with `status: in_progress`) and operate on it by default.

---

## R1 - Foundation
**Status:** in_progress  
**Timeline:** Q4 2024 - Q1 2025  
**Stories:** 45 total, 42 done, 3 in progress  
**Details:** [R1 Stories](./releases/R1-foundation.md)

**Goals:**
- CLI core functionality (init, list, validate)
- Basic OpenSpec integration
- GitHub Copilot support
- Story management with status sync
- Release and feature tracking
- Project structure scaffolding

---

## Managing Releases

**Commands:**
- `specdeck list stories` - Shows active release stories
- `specdeck list stories --release R1` - Shows specific release
- `specdeck releases status R1-foundation` - Release status summary
- `specdeck releases sync-plan R1-foundation --source openspec` - OpenSpec reconciliation plan

**Archiving:**
When a release is complete, move its file to `releases/archive/` and update its status to `done`.

For more information, see [SpecDeck documentation](../README.md).

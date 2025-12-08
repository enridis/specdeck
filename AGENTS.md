<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

---
title: SpecDeck Agent Instructions Template
description: Template for AGENTS.md SpecDeck managed block
version: 0.1.0
---
<!-- SPECDECK:START -->
# SpecDeck Instructions

For SpecDeck workflow guidance, see prompt files in `.github/prompts/`:
- @.github/prompts/specdeck-decompose.prompt.md - Feature decomposition guide
- @.github/prompts/specdeck-status.prompt.md - Story status reference
- @.github/prompts/specdeck-commands.prompt.md - CLI commands reference

Use `specdeck list`, `specdeck list features --with-stories` for project information.

**Feature-Based Planning:** SpecDeck uses `specdeck/releases/R*.md` (release overview) and `specdeck/releases/R*/FEATURE.md` (feature stories). See `@specdeck/AGENTS.md` for full details on the structure.
<!-- SPECDECK:END -->

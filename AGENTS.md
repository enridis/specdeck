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

<!-- SPECDECK:START -->
# SpecDeck Instructions

Use SpecDeck structure and commands to plan releases, features, and stories.

**Quick Reference:**
```bash
specdeck list stories              # List all stories
specdeck list features             # List features
specdeck validate all              # Validate structure
```

**Coordinator Mode (Multi-Repo):**
If `.specdeck.config.json` has `"coordinator": {"enabled": true}`, this is a coordinator project:
```bash
specdeck sync                      # Aggregate stories from all submodules
specdeck list stories              # View aggregated stories from all repos
```

**Working with Stories:**
- Stories live in: `specdeck/releases/R*/FEATURE.md`
- Each feature file contains ONE table with all its stories
- Required columns: ID, Title, Status, Complexity
- Edit story status directly in the markdown table, then commit

**File Structure:**
```
.specdeck.config.json              # Config (coordinator settings, submodules)
specdeck/releases/R1-foundation.md # Release overview
specdeck/releases/R1-foundation/   # Feature story files
  CLI-CORE.md                      # Stories for CLI-CORE feature
  FEAT-01.md                       # Stories for FEAT-01 feature
```

Always read @specdeck/AGENTS.md to get more information about releases, features, stories and how to manage it.
<!-- SPECDECK:END -->



# SpecDeck

A TypeScript CLI tool for managing engineering work using the OpenSpec-Driven Delivery framework.

## Vision

SpecDeck enables teams to navigate and maintain the hierarchy of **Vision → Releases → Features → User Stories** through structured commands and Git-based Markdown artifacts. It makes spec-driven, Git-centric planning practical and accessible.

## Status

🚧 **In Development** - Currently in proposal phase (OpenSpec change: `add-cli-basic-foundation`)

## Quick Links

- **Vision**: [openspec/vision.md](openspec/vision.md) - Product vision and roadmap
- **Current Release**: [R1 - Foundation](openspec/releases/R1-foundation.md) - Q1 2025 objectives
- **Project Plan**: [openspec/project-plan.md](openspec/project-plan.md) - All stories tracked here
- **Proposal**: [openspec/changes/add-cli-basic-foundation/](openspec/changes/add-cli-basic-foundation/) - Foundation implementation plan

## Planned Commands

Once implemented, SpecDeck will provide:

```bash
# Release Management
specdeck releases list                    # List all releases
specdeck releases show <release-id>       # Show release details
specdeck releases create <release-id>     # Create new release (interactive)

# Feature Management
specdeck features list <release-id>       # List features in a release
specdeck features show <feature-id>       # Show feature details with stories
specdeck features create <id> --release <release-id>  # Add feature to release

# Story Management
specdeck stories list <feature-id>        # List stories for a feature
specdeck stories decompose <feature-id>   # Interactive feature decomposition

# Global Options
--json                                    # Output as JSON
--verbose                                 # Detailed logging
--help                                    # Show help
```

## Tech Stack

- **TypeScript** - Type-safe implementation
- **Commander.js** - CLI framework
- **unified + remark** - Markdown parsing with AST
- **Zod** - Schema validation and types
- **Jest** - Testing framework

## Project Structure

```
specdeck/
├── docs/                          # Documentation
│   ├── manifesto.md              # OpenSpec-Driven Delivery principles
│   └── overview.md               # Delivery flow and hierarchy
├── openspec/                      # OpenSpec artifacts
│   ├── vision.md                 # Product vision
│   ├── project-plan.md           # Story tracking (primary truth)
│   ├── releases/                 # Release definitions
│   │   └── R1-foundation.md
│   ├── changes/                  # OpenSpec changes
│   │   └── add-cli-basic-foundation/
│   │       ├── proposal.md       # Change proposal
│   │       ├── design.md         # Technical design
│   │       ├── tasks.md          # Implementation tasks
│   │       └── specs/            # Spec deltas
│   └── specs/                    # Baseline specs (future)
└── src/                          # Source code (to be created)
```

## OpenSpec-Driven Development

This project practices what it preaches - we use the OpenSpec-Driven Delivery model to build SpecDeck itself:

1. **Vision** defines the product direction and success metrics
2. **Release R1** defines Q1 2025 objectives and features
3. **Project Plan** tracks 37 user stories across 8 feature areas
4. **OpenSpec Change** `add-cli-basic-foundation` contains the implementation plan
5. All work is Git-based, reviewable, and auditable

## Development Workflow

### Current Phase: Proposal ✅
- [x] Problem statement and vision documented
- [x] Architecture and design decisions captured
- [x] Spec deltas written and validated
- [x] Tasks sequenced and estimated
- [x] OpenSpec change validated: `openspec validate add-cli-basic-foundation --strict`

### Next Phase: Implementation 🚧
1. Review open questions in proposal
2. Set up TypeScript project structure
3. Follow tasks.md sequentially
4. Mark stories in project-plan.md as progress is made

### Future Phases
- Testing and documentation
- Pilot with friendly teams
- v0.1.0 release to npm

## Contributing

Not yet accepting external contributions while in early development. Check back after v0.1.0 release!

## License

TBD

## Contact

Project maintained as part of OpenSpec ecosystem exploration.

---

**Built with OpenSpec** - Spec-driven development for structured change management

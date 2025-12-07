# SpecDeck Project Plan

This document is the primary planning surface for SpecDeck development.
All work is tracked here and implemented through OpenSpec changes.

---

## Milestone: R1 – Foundation (Q1 2025)

### Stories

| ID           | Title                                      | Status    | Complexity | Estimate | Owner | Jira | OpenSpec                  | Tags                    | Notes                                    |
|--------------|--------------------------------------------|-----------|------------|----------|-------|------|---------------------------|-------------------------|------------------------------------------|
| CLI-CORE-01  | CLI entry point and command framework      | planned   | M          | 5        | TBA   | TBA  | add-cli-basic-foundation  | cli, infrastructure     | Commander.js setup, version, help        |
| CLI-CORE-02  | Global error handling and logging          | planned   | S          | 3        | TBA   | TBA  | add-cli-basic-foundation  | cli, infrastructure     | Catch all errors, verbose flag           |
| CLI-CORE-03  | Output formatting (table and JSON)         | planned   | S          | 3        | TBA   | TBA  | add-cli-basic-foundation  | cli, infrastructure     | Format results for human and machines    |
| CLI-CORE-04  | Configuration discovery                    | planned   | M          | 5        | TBA   | TBA  | add-cli-basic-foundation  | cli, configuration      | Find .specdeck.config.json or .git       |
| PARSE-01-01  | Markdown parser with unified/remark        | planned   | L          | 8        | TBA   | TBA  | add-cli-basic-foundation  | parser, markdown        | Core AST navigation and extraction       |
| PARSE-01-02  | GFM table parser                           | planned   | M          | 5        | TBA   | TBA  | add-cli-basic-foundation  | parser, tables          | Extract structured data from tables      |
| PARSE-01-03  | YAML front matter handler                  | planned   | S          | 3        | TBA   | TBA  | add-cli-basic-foundation  | parser, yaml            | Parse release file metadata              |
| PARSE-01-04  | Milestone section extraction               | planned   | M          | 5        | TBA   | TBA  | add-cli-basic-foundation  | parser, project-plan    | Group stories by milestone               |
| PARSE-01-05  | Error recovery and line tracking           | planned   | M          | 5        | TBA   | TBA  | add-cli-basic-foundation  | parser, error-handling  | Accurate error messages with line numbers|
| REL-01-01    | Release repository and file I/O            | planned   | M          | 5        | TBA   | TBA  | add-cli-basic-foundation  | releases, repository    | Read/write release files                 |
| REL-01-02    | Release service with business logic        | planned   | S          | 3        | TBA   | TBA  | add-cli-basic-foundation  | releases, service       | Sort, filter, aggregate releases         |
| REL-01-03    | `releases list` command                    | planned   | S          | 3        | TBA   | TBA  | add-cli-basic-foundation  | releases, commands      | List all releases with summary           |
| REL-01-04    | `releases show <id>` command               | planned   | S          | 3        | TBA   | TBA  | add-cli-basic-foundation  | releases, commands      | Display detailed release info            |
| REL-01-05    | `releases create <id>` command             | planned   | M          | 5        | TBA   | TBA  | add-cli-basic-foundation  | releases, commands      | Interactive prompts to create release    |
| REL-01-06    | Release validation                         | planned   | S          | 3        | TBA   | TBA  | add-cli-basic-foundation  | releases, validation    | Validate structure and required fields   |
| FEAT-01-01   | Feature extraction from release files      | planned   | M          | 5        | TBA   | TBA  | add-cli-basic-foundation  | features, parser        | Parse features from Markdown             |
| FEAT-01-02   | Feature service with story cross-reference | planned   | M          | 5        | TBA   | TBA  | add-cli-basic-foundation  | features, service       | Link features to stories by ID prefix    |
| FEAT-01-03   | `features list <release-id>` command       | planned   | S          | 3        | TBA   | TBA  | add-cli-basic-foundation  | features, commands      | List features for a release              |
| FEAT-01-04   | `features show <feature-id>` command       | planned   | S          | 3        | TBA   | TBA  | add-cli-basic-foundation  | features, commands      | Show feature details and stories         |
| FEAT-01-05   | `features create <id> --release` command   | planned   | M          | 5        | TBA   | TBA  | add-cli-basic-foundation  | features, commands      | Interactive feature creation             |
| STORY-01-01  | Story parser from project-plan.md          | planned   | L          | 8        | TBA   | TBA  | add-cli-basic-foundation  | stories, parser         | Parse GFM tables with all fields         |
| STORY-01-02  | Story validation (schema and fields)       | planned   | M          | 5        | TBA   | TBA  | add-cli-basic-foundation  | stories, validation     | Validate ID format, status, complexity   |
| STORY-01-03  | Story service with filtering               | planned   | M          | 5        | TBA   | TBA  | add-cli-basic-foundation  | stories, service        | Filter by status, owner, complexity      |
| STORY-01-04  | `stories list <feature-id>` command        | planned   | S          | 3        | TBA   | TBA  | add-cli-basic-foundation  | stories, commands       | List stories for a feature               |
| STORY-01-05  | `stories decompose <feature-id>` command   | planned   | L          | 8        | TBA   | TBA  | add-cli-basic-foundation  | stories, commands       | Interactive decomposition workflow       |
| STORY-01-06  | Story filtering flags (--status, --owner)  | planned   | S          | 3        | TBA   | TBA  | add-cli-basic-foundation  | stories, commands       | Add filter options to list command       |
| OPENSPEC-01-01 | Parse OpenSpec changes directory         | planned   | M          | 5        | TBA   | TBA  | add-cli-basic-foundation  | openspec, parser        | Read changes/ to list active/archived    |
| OPENSPEC-01-02 | Link stories to OpenSpec changes         | planned   | S          | 3        | TBA   | TBA  | add-cli-basic-foundation  | openspec, validation    | Match OpenSpec column to change IDs      |
| OPENSPEC-01-03 | `specdeck sync` command                  | planned   | M          | 5        | TBA   | TBA  | add-cli-basic-foundation  | openspec, commands      | Interactive status reconciliation        |
| OPENSPEC-01-04 | Story status hints in commands           | planned   | S          | 2        | TBA   | TBA  | add-cli-basic-foundation  | openspec, ui            | Show warnings for status mismatches      |
| TEST-01-01   | Unit tests for parsers                     | planned   | M          | 5        | TBA   | TBA  | add-cli-basic-foundation  | testing, unit           | Test Markdown and table parsing          |
| TEST-01-02   | Unit tests for schemas and validation      | planned   | S          | 3        | TBA   | TBA  | add-cli-basic-foundation  | testing, unit           | Test Zod schemas with edge cases         |
| TEST-01-03   | Integration tests for repositories         | planned   | M          | 5        | TBA   | TBA  | add-cli-basic-foundation  | testing, integration    | Test file I/O with temp fixtures         |
| TEST-01-04   | End-to-end command tests                   | planned   | L          | 8        | TBA   | TBA  | add-cli-basic-foundation  | testing, e2e            | Test complete command flows              |
| TEST-01-05   | Test fixtures and sample files             | planned   | M          | 5        | TBA   | TBA  | add-cli-basic-foundation  | testing, fixtures       | Create realistic test data               |
| DOC-01-01    | README with installation and usage         | planned   | M          | 5        | TBA   | TBA  | add-cli-basic-foundation  | documentation           | Getting started guide                    |
| DOC-01-02    | Command reference documentation            | planned   | M          | 5        | TBA   | TBA  | add-cli-basic-foundation  | documentation           | Document all commands and flags          |
| DOC-01-03    | Examples and common workflows              | planned   | S          | 3        | TBA   | TBA  | add-cli-basic-foundation  | documentation           | Real-world usage examples                |
| DOC-01-04    | Architecture and design documentation      | planned   | S          | 3        | TBA   | TBA  | add-cli-basic-foundation  | documentation           | Document patterns and decisions          |
| PKG-01-01    | NPM package configuration and build        | planned   | S          | 3        | TBA   | TBA  | add-cli-basic-foundation  | packaging, distribution | Prepare for npm publish                  |
| PKG-01-02    | CLI binary setup and npm link testing      | planned   | S          | 2        | TBA   | TBA  | add-cli-basic-foundation  | packaging, distribution | Test installation and binary execution   |
| PKG-01-03    | Cross-platform testing (macOS/Linux/Win)   | planned   | M          | 5        | TBA   | TBA  | add-cli-basic-foundation  | packaging, testing      | Verify on all supported platforms        |

---

## Summary Statistics

### R1 Foundation
- **Total Stories**: 41
- **Total Estimate**: 187 story points
- **Average Complexity**: M (Medium)
- **Status Breakdown**:
  - Planned: 41
  - In Progress: 0
  - In Review: 0
  - Done: 0

### By Feature Area
- CLI Core: 4 stories (16 pts)
- Parser: 5 stories (26 pts)
- Release Management: 6 stories (22 pts)
- Feature Management: 5 stories (21 pts)
- Story Management: 6 stories (32 pts)
- OpenSpec Integration: 4 stories (15 pts)
- Testing: 5 stories (26 pts)
- Documentation: 4 stories (16 pts)
- Packaging: 3 stories (13 pts)

---

## Notes

- All stories reference the single OpenSpec change `add-cli-basic-foundation`
- Stories are sequenced in tasks.md with dependencies and parallel work opportunities
- Owner and Jira fields will be filled as work begins
- This plan represents a single-person or small-team effort over ~3 months
- Estimates are in story points (Fibonacci: 1,2,3,5,8,13,21)

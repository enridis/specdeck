---
feature: REL-01
release: R1-foundation
---

# Feature: REL-01

## Description

Release Management
  - List all releases with summary information
  - Show detailed release information
  - Create new releases with interactive prompts
  - Parse YAML front matter and Markdown structure
  - Validate release file format

## Stories

| ID | Title | Status | Complexity | Estimate | Owner | Tags | Notes |
|----|-------|--------|------------|----------|-------|------|-------|
| REL-01-01    | Release repository and file I/O            | done      | M          | 5        | TBA   | TBA  | add-cli-basic-foundation  | releases, repository    | Read/write release files                 |
| REL-01-02    | Release service with business logic        | done      | S          | 3        | TBA   | TBA  | add-cli-basic-foundation  | releases, service       | Sort, filter, aggregate releases         |
| REL-01-03    | `releases list` command                    | done      | S          | 3        | TBA   | TBA  | add-cli-basic-foundation  | releases, commands      | List all releases with summary           |
| REL-01-04    | `releases show <id>` command               | done      | S          | 3        | TBA   | TBA  | add-cli-basic-foundation  | releases, commands      | Display detailed release info            |
| REL-01-05    | `releases create <id>` command             | done      | M          | 5        | TBA   | TBA  | add-cli-basic-foundation  | releases, commands      | Interactive prompts to create release    |
| REL-01-06    | Release validation                         | done      | S          | 3        | TBA   | TBA  | add-cli-basic-foundation  | releases, validation    | Validate structure and required fields   |

---
feature: OPENSPEC-01
release: R1-foundation
---

# Feature: OPENSPEC-01

## Description

OpenSpec Lifecycle Integration (Lightweight)
  - Detect and list OpenSpec changes in openspec/changes/
  - Map OpenSpec change state to story status
  - `specdeck sync` command for interactive status reconciliation
  - Display status hints when showing stories (change exists but story is planned, etc.)

## Stories

| ID | Title | Status | Complexity | Estimate | Owner | Tags | Notes |
|----|-------|--------|------------|----------|-------|------|-------|
| OPENSPEC-01-01 | Parse OpenSpec changes directory         | done      | M          | 5        | TBA   | TBA  | add-cli-basic-foundation  | openspec, parser        | Read changes/ to list active/archived    |
| OPENSPEC-01-02 | Link stories to OpenSpec changes         | planned   | S          | 3        | TBA   | TBA  | add-cli-basic-foundation  | openspec, validation    | Match OpenSpec column to change IDs      |
| OPENSPEC-01-03 | `specdeck sync` command                  | done      | M          | 5        | TBA   | TBA  | add-cli-basic-foundation  | openspec, commands      | Interactive status reconciliation        |
| OPENSPEC-01-04 | Story status hints in commands           | done      | S          | 2        | TBA   | TBA  | add-cli-basic-foundation  | openspec, ui            | Show warnings for status mismatches      |

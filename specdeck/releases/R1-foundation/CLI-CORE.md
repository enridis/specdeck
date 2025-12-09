---
feature: CLI-CORE
release: R1-foundation
jira_epic: DECK-100
---

# Feature: CLI-CORE

## Description

CLI Entry Point and Command Framework
  - Hierarchical command structure with Commander.js
  - Global options (--version, --help, --json, --verbose)
  - Consistent error handling and user-friendly messages
  - Configuration discovery (.specdeck.config.json or auto-detect)

## Stories

| ID | Title | Status | Complexity | Estimate | Owner | Tags | Notes |
|----|-------|--------|------------|----------|-------|------|-------|
| CLI-CORE-01  | CLI entry point and command framework      | done      | M          | 5        | TBA   | TBA  | add-cli-basic-foundation  | cli, infrastructure     | Commander.js setup, version, help        |
| CLI-CORE-02  | Global error handling and logging          | done      | S          | 3        | TBA   | TBA  | add-cli-basic-foundation  | cli, infrastructure     | Catch all errors, verbose flag           |
| CLI-CORE-03  | Output formatting (table and JSON)         | done      | S          | 3        | TBA   | TBA  | add-cli-basic-foundation  | cli, infrastructure     | Format results for human and machines    |
| CLI-CORE-04  | Configuration discovery                    | done      | M          | 5        | TBA   | TBA  | add-cli-basic-foundation  | cli, configuration      | Find .specdeck.config.json or .git       |

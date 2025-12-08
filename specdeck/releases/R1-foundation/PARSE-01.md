---
feature: PARSE-01
release: R1-foundation
---

# Feature: PARSE-01

## Description

Project Plan Parser
  - Parse GFM tables from project-plan.md
  - Extract milestone sections and group stories
  - Handle YAML front matter in release files
  - Navigate Markdown AST with unified/remark
  - Provide accurate error messages with line numbers

## Stories

| ID | Title | Status | Complexity | Estimate | Owner | Tags | Notes |
|----|-------|--------|------------|----------|-------|------|-------|
| PARSE-01-01  | Markdown parser with unified/remark        | done      | L          | 8        | TBA   | TBA  | add-cli-basic-foundation  | parser, markdown        | Core AST navigation and extraction       |
| PARSE-01-02  | GFM table parser                           | done      | M          | 5        | TBA   | TBA  | add-cli-basic-foundation  | parser, tables          | Extract structured data from tables      |
| PARSE-01-03  | YAML front matter handler                  | done      | S          | 3        | TBA   | TBA  | add-cli-basic-foundation  | parser, yaml            | Parse release file metadata              |
| PARSE-01-04  | Milestone section extraction               | done      | M          | 5        | TBA   | TBA  | add-cli-basic-foundation  | parser, project-plan    | Group stories by milestone               |
| PARSE-01-05  | Error recovery and line tracking           | done      | M          | 5        | TBA   | TBA  | add-cli-basic-foundation  | parser, error-handling  | Accurate error messages with line numbers|

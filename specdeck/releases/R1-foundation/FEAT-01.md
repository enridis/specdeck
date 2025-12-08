---
feature: FEAT-01
release: R1-foundation
---

# Feature: FEAT-01

## Description

Feature Management
  - List features for a specific release
  - Show feature details with linked stories
  - Create new features and add to release files
  - Extract features from release Markdown
  - Cross-reference features with stories by ID prefix

## Stories

| ID | Title | Status | Complexity | Estimate | Owner | Tags | Notes |
|----|-------|--------|------------|----------|-------|------|-------|
| FEAT-01-01   | Feature extraction from release files      | done      | M          | 5        | TBA   | TBA  | add-cli-basic-foundation  | features, parser        | Parse features from Markdown             |
| FEAT-01-02   | Feature service with story cross-reference | done      | M          | 5        | TBA   | TBA  | add-cli-basic-foundation  | features, service       | Link features to stories by ID prefix    |
| FEAT-01-03   | `features list <release-id>` command       | done      | S          | 3        | TBA   | TBA  | add-cli-basic-foundation  | features, commands      | List features for a release              |
| FEAT-01-04   | `features show <feature-id>` command       | done      | S          | 3        | TBA   | TBA  | add-cli-basic-foundation  | features, commands      | Show feature details and stories         |
| FEAT-01-05   | `features create <id> --release` command   | done      | M          | 5        | TBA   | TBA  | add-cli-basic-foundation  | features, commands      | Interactive feature creation             |

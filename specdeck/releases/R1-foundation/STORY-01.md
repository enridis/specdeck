---
feature: STORY-01
release: R1-foundation
---

# Feature: STORY-01

## Description

Story Management
  - List user stories for a specific feature
  - Filter stories by status, owner, complexity
  - Interactive feature decomposition workflow
  - Support for single-repo story tracking
  - Validate story structure and required fields

## Stories

| ID | Title | Status | Complexity | Estimate | Owner | Tags | Notes |
|----|-------|--------|------------|----------|-------|------|-------|
| STORY-01-01  | Story parser from project-plan.md          | done      | L          | 8        | TBA   | TBA  | add-cli-basic-foundation  | stories, parser         | Parse GFM tables with all fields         |
| STORY-01-02  | Story validation (schema and fields)       | done      | M          | 5        | TBA   | TBA  | add-cli-basic-foundation  | stories, validation     | Validate ID format, status, complexity   |
| STORY-01-03  | Story service with filtering               | done      | M          | 5        | TBA   | TBA  | add-cli-basic-foundation  | stories, service        | Filter by status, owner, complexity      |
| STORY-01-04  | `stories list <feature-id>` command        | done      | S          | 3        | TBA   | TBA  | add-cli-basic-foundation  | stories, commands       | List stories for a feature               |
| STORY-01-05  | `stories decompose <feature-id>` command   | done      | L          | 8        | TBA   | TBA  | add-cli-basic-foundation  | stories, commands       | Interactive decomposition workflow       |
| STORY-01-06  | Story filtering flags (--status, --owner)  | done      | S          | 3        | TBA   | TBA  | add-cli-basic-foundation  | stories, commands       | Add filter options to list command       |

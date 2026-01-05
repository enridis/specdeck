---
title: SpecDeck Release Status
description: Generate a release status summary with PM-ready output
version: 0.4.0
---

# Release Status Workflow

Use this workflow to generate a release status snapshot and produce a PM-ready summary.

## 1) Run Status Command

```bash
specdeck releases status <release-id> --json
```

Optional OpenSpec hints:
```bash
specdeck releases status <release-id> --source openspec --json
```

## 2) Summarize

From the JSON output, summarize:
- Overall completion percentage
- Total blocked stories and top blockers
- Per-feature progress highlights
- Risks or gaps (e.g., many planned stories, blocked cluster)

## 3) Report

Provide a short update that includes:
- What is on track
- What needs attention
- Next actions for PMs or leads

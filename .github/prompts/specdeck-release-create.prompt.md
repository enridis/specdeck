---
title: SpecDeck Release Creation
description: Collect scope and scaffold a release file using SpecDeck-first commands
version: 0.4.0
---

# Release Creation Workflow

Use this workflow to gather release scope and scaffold a release file without requiring OpenSpec.

## 1) Collect Scope

Ask for:
- Release ID (e.g., R2-analytics)
- Title
- Timeframe (e.g., Q2 2025)
- Objectives (bullets)
- Success metrics (bullets)
- Feature outlines (IDs + titles)

## 2) Write Scope JSON

Create a local JSON file with the collected scope:

```json
{
  "timeframe": "Q2 2025",
  "objectives": [
    "Ship analytics dashboards",
    "Enable self-serve reporting"
  ],
  "successMetrics": [
    "50% of users active weekly",
    "P95 dashboard load under 2s"
  ],
  "features": [
    "ANALYTICS-01",
    "REPORTS-01"
  ]
}
```

## 3) Scaffold the Release

Run:
```bash
specdeck releases create R2-analytics "Analytics Release" --scope scope.json --timeframe "Q2 2025"
```

## 4) Next Steps

- Review `specdeck/releases/R2-analytics.md`
- Add feature files in `specdeck/releases/R2-analytics/`
- Share the release plan with stakeholders

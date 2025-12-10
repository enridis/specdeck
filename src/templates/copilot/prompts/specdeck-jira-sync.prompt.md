---
title: Coordinator Jira Sync Guide
description: Steps for reconciling Jira mappings using SpecDeck coordinator cache and overlays
version: 0.2.0
---

# Coordinator Jira Sync Guide

Use this prompt when you need to reconcile Jira mappings while working in SpecDeck coordinator mode (multi-repo with overlays).

## When to Use
- Jira tickets live in overlays (not in submodule story files)
- You need a list of stories missing Jira or with mismatches
- You need full story details (all fields) for specific IDs
- Cache might be stale and needs refresh

## Quick Commands (run in repo root)
1) Refresh cache if stale (recommended):
   ```bash
   specdeck sync
   ```
   - Use `--dry-run` first if unsure.

2) Generate Jira sync plan (candidates and reasons):
   ```bash
   specdeck jira sync-plan --global --json
   ```
   - Filters: `--feature AUTH-01`, `--repo backend`
   - Live read: add `--no-cache` if cache is stale

3) Get full details for one or more stories (overlay Jira included):
   ```bash
   specdeck stories show AUTH-01-01 FE-AUTH-01-02 --with-jira --all-fields --global --json
   ```
   - Use `--repo <name>` to narrow to a submodule
   - Add `--no-cache` to force live submodule read

4) List stories with Jira enrichment:
   ```bash
   specdeck list stories --with-jira --global
   ```
   - Shows cache staleness warnings; use `--no-cache` to bypass.
   - Add `--with-jira` to include overlay Jira in listings.

## Workflow
1) **Check cache freshness**
   - If cache warning appears, run `specdeck sync` (or `--no-cache` on read commands).
2) **Identify candidates**
   - Run `specdeck jira sync-plan --json` to get storyId, repo, feature, status, overlayJira, reason.
   - Reasons include: missing Jira, conflicting Jira, status/Jira mismatch, cache stale.
3) **Inspect details**
   - For any candidate, run `specdeck stories show <ids> --with-jira --all-fields --global --json`.
   - Confirm feature/repo alignment and overlay source.
4) **Plan updates**
   - Propose overlay edits per repo (do **not** mutate submodule story files).
   - Keep Jira ticket IDs consistent across overlays; avoid adding Jira directly to submodules.
   - When editing, update `overlays/<repo>/<FEATURE>.md` (not `.overlay.md`).
5) **Verify**
   - Re-run `specdeck jira sync-plan` to ensure reasons are resolved.
   - If conflicts remain, suggest next steps with exact file paths to overlays.

## Reminders
- Coordinator mode keeps Jira in overlays; submodule story files may omit Jira columns.
- Prefer cache for speed; switch to `--no-cache` only when you need live reads.
- Respect repo-specific conventions (e.g., prefixes like `BE-` vs `FE-`).
- When suggesting edits, specify the overlay file path (e.g., `overlays/backend/AUTH-01.md`).

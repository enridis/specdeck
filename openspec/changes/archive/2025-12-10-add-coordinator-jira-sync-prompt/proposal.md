# Change: Jira Sync Copilot Prompt for Coordinator Mode

## Why
- LLMs need explicit, repeatable guidance to reconcile Jira mappings when coordinator mode overlays keep tickets separate from public repos.
- Current prompts only cover decomposition and migration; there is no workflow to fetch Jira mappings or detailed story context for sync through the CLI.
- The CLI lacks a concise way to list Jira sync candidates and surface full story detail (with overlay data) for multiple stories, which limits automation inside the prompt.

## What Changes
- Add a bundled Copilot prompt (`specdeck-jira-sync.prompt.md`) that walks LLMs through coordinator-mode Jira sync, including the exact SpecDeck commands to run and how to interpret results.
- Extend CLI with explicit coordinator Jira sync helpers:
  - `specdeck jira sync-plan [--feature <id>] [--repo <name>] [--global] [--json] [--no-cache]`  
    Lists sync candidates with columns: Repo, Feature, Story ID, Title, Status, Overlay Jira, Sync Reason, Source Repo Path.
    Reasons include: missing Jira, conflicting Jira across overlays, Jira present but story status mismatch, cache stale warning.
  - `specdeck stories show <story-id...> [--with-jira] [--all-fields] [--global] [--repo <name>] [--json] [--no-cache]`  
    Returns full story details (title, status, complexity, estimate, owner, milestone, tags, notes, openspec, repo, feature, release) plus overlay Jira; supports multiple IDs and coordinator cache fallback.
  - Update `specdeck list stories` to include `--with-jira` in coordinator mode and warn on stale cache when overlay enrichment is requested.
  - Update `specdeck validate` to surface overlay reference errors and global story ID duplicates in coordinator mode.
- Ensure `specdeck init copilot` and `specdeck upgrade copilot` install and upgrade the new prompt, and expose it in selective template lists/updates.
- Document coordinator cache/overlay expectations so prompts and commands default to using the cache but can bypass it when needed.

## Impact
- Affected specs: prompt-templates, story-management, copilot-chat-commands
- Affected code: Copilot template bundle (`src/templates/copilot/prompts`), init/upgrade copilot command wiring, CLI story/Jira data commands (cache + overlay aware), help text/README for new commands

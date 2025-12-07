# OpenSpec Delivery Flow

## Overview

This document describes how we move from product vision all the way down to user stories that are tracked in `openspec/project-plan.md` and implemented via OpenSpec changes.

We structure work into four layers:

1. **Product Vision** – long-term direction and outcomes (Product Manager)
2. **Releases** – time-boxed deliveries of customer value
3. **Features** – coherent capabilities that fulfill part of the vision
4. **User Stories** – delivery units we execute in repos and track in the project plan

User stories are the operational unit for engineering and AQA. Everything above them provides context and guardrails.

## 1. Product Vision

**Owner:** Product Manager (with input from architecture, engineering, GTM)

**Artifact:** `openspec/vision.md` (or equivalent)

### Purpose

Product Vision answers:

- What problem(s) are we solving, for whom?
- What outcomes do we want in 12–24 months?
- What are the key success metrics?
- What strategic constraints do we operate under (compliance, platforms, partnerships, etc.)?

It's intentionally high altitude: not a backlog, not a release plan. It shapes everything else.

### Example

Product: "Unified Workspace"

- **Goal:** Provide a single workspace where users can manage tasks, documents, and notifications across multiple tools.
- **Key outcomes:**
  - Reduce context switching between tools by 30%
  - Increase daily active users by 20% in target segment
- **Guardrails:**
  - Must work across web and mobile
  - Must integrate with at least 3 external systems in Year 1

## 2. Releases

**Suggested term:** Release (A Release may contain internal milestones/phases for finer tracking)

**Owner:** Product Manager + Tech Lead

**Artifacts:**

- `openspec/releases/<release-id>.md` – release definition
- Sections in `openspec/project-plan.md` – milestones under that release

### Purpose

A Release is a time-boxed delivery of a meaningful slice of the vision. It answers:

- What outcomes will we deliver in this timeframe?
- Which metrics should move?
- Which features must land to make this release coherent?

Releases are the bridge between:

- Abstract Product Vision, and
- Concrete Features & Stories

### Recommended Structure

In `openspec/releases/<release-id>.md`:

```markdown
# Release: R1 – Foundation

## Objectives

- Enable basic cross-tool task aggregation.
- Provide first version of unified notifications.
- Prepare platform for third-party integrations.

## Success Metrics

- X% of pilot users connect at least 2 external tools.
- Y% reduction in missed notifications (measured via NPS/feedback).

## Feature List (High-Level)

- FND-01: Unified Task List (MVP)
- FND-02: Unified Notifications (MVP)
- FND-03: Integration Framework (MVP)
```

In `project-plan.md`, this release will surface as one or more Milestone sections.

## 3. Features

**Owner:** Product + Tech Lead (and/or domain owner)

**Artifacts:**

- `openspec/specs/<domain>/spec.md` – baseline capability spec
- `openspec/changes/<feature-id>/` – feature-level change(s) when it's new or significantly evolving
- Feature references in release docs and project plan

### Purpose

A Feature is a coherent capability delivering user-visible value, aligned to a release. It answers:

- What user / system behavior do we introduce or significantly change?
- How does it contribute to the release objectives?
- What constraints / non-functional requirements apply?

Features are stable concepts. User stories are how we slice them for execution.

### Example Features for "Unified Workspace"

- **FND-01: Unified Task List (MVP)**
  - Aggregate tasks from connected tools into a single view.
  - Basic filtering and sorting.
- **FND-02: Unified Notifications (MVP)**
  - Single notification center for events from connected tools.
  - Simple rules (mute, basic categorization).
- **FND-03: Integration Framework (MVP)**
  - Pluggable architecture for connecting external tools.
  - API contracts for connectors.

Features are mapped into the spec structure (e.g., tasks, notifications, integrations domains) and into the release.

## 4. User Stories

**Owner:** Product + Engineering (refinement), executed by engineering/AQA

**Artifact of record:** `openspec/project-plan.md`

**Execution detail:** `openspec/changes/<change-id>/` (per user story or per small cluster of related stories)

### Purpose

A User Story is the unit we actually plan, implement, and track. It answers:

- Who benefits?
- What behavior or outcome is provided?
- Why does it matter (link back to feature and release)?

User Stories are what we operate on in `project-plan.md`:

- Status
- Owner
- Complexity / estimates
- Jira mapping
- OpenSpec change mapping

## 5. Repo / User Story Mapping Model

We apply a consistent mapping between features, user stories, and repos.

### 5.1 Single-repo (monorepo) Projects

For a monorepo where UI, backend, and other components live in one project repo, we use:

**One Feature ↔ One User Story (per release increment)**

In practice:

- Each feature increment in a release is represented as a single user story in `project-plan.md` for that repo.
- The implementation can span UI, backend, jobs, etc. under one story + one main OpenSpec change.

#### Example

- **Feature:** FND-01 – Unified Task List (MVP)
- **Repo:** workspace-core (monorepo: UI + API + workers)

In `project-plan.md` (repo workspace-core):

```markdown
## Milestone: R1 – Foundation

| ID         | Title                               | Status      | Complexity | Estimate | Owner      | Jira     | OpenSpec              | Tags                 | Notes                                   |
|-----------|-------------------------------------|------------|-----------|----------|------------|----------|-----------------------|----------------------|-----------------------------------------|
| FND-01-01 | Unified Task List (MVP – core impl) | in_progress| L         | 13       | j.doe      | WS-101   | unified-tasklist-mvp  | tasks, ui, api       | Covers UI + API + storage in monorepo   |
```

Here:

- That single story spans the full implementation.
- OpenSpec change `unified-tasklist-mvp` captures the spec, design, and tasks.

### 5.2 Multi-repo Projects

When a feature spans multiple repos, we model:

**One Feature ↔ One or More User Stories per Repo**

- Central feature definition in the Product / Platform docs.
- Each repo has its own user stories in its own `project-plan.md`, all linked back to the same feature and release.

#### Example

**Feature:** FND-02 – Unified Notifications (MVP)

**Repos:**

- notifications-api (backend APIs)
- notifications-ui (frontend/UI)
- notifications-mobile (mobile client)

In repo `notifications-api` → `openspec/project-plan.md`:

```markdown
## Milestone: R1 – Foundation

| ID          | Title                                   | Status     | Complexity | Estimate | Owner    | Jira     | OpenSpec                   | Tags                 | Notes                     |
|------------|-----------------------------------------|-----------|-----------|----------|----------|----------|----------------------------|----------------------|---------------------------|
| FND-02-API | Notifications API for unified center    | planned   | M         | 8        | api.dev  | NOTIF-10 | unified-notifications-api  | notifications, api   | Part of feature FND-02    |
```

In repo `notifications-ui` → `openspec/project-plan.md`:

```markdown
## Milestone: R1 – Foundation

| ID          | Title                                  | Status    | Complexity | Estimate | Owner    | Jira     | OpenSpec                  | Tags             | Notes                     |
|------------|----------------------------------------|----------|-----------|----------|----------|----------|---------------------------|------------------|---------------------------|
| FND-02-UI  | Web UI for unified notifications center | planned | M         | 8        | ui.dev   | NOTIF-20 | unified-notifications-ui  | notifications, ui | Part of feature FND-02    |
```

In repo `notifications-mobile` → `openspec/project-plan.md`:

```markdown
## Milestone: R1 – Foundation

| ID             | Title                               | Status   | Complexity | Estimate | Owner      | Jira     | OpenSpec                   | Tags             | Notes                               |
|----------------|-------------------------------------|----------|-----------|----------|------------|----------|----------------------------|------------------|-------------------------------------|
| FND-02-MOB     | Mobile notifications center (MVP)   | planned  | M         | 8        | mobile.dev | NOTIF-30 | unified-notifications-mob  | notifications,mobile | Scope aligned with FND-02 feature |
```

All three:

- Link to the same Feature (FND-02) at the release & feature level
- Have their own repo-specific user stories and OpenSpec changes

### 5.3 Infra / Platform Cross-cutting Work

Some work does not neatly belong to a single feature but underpins multiple features, e.g.:

- Logging pipeline
- Feature flag framework
- RBAC foundation

In such cases:

- Still create features for major platform capabilities (e.g., PLT-01 – Feature Flag Platform)
- Add user stories per repo that implements a slice of that capability.

#### Example

**Feature:** PLT-01 – Feature Flag Platform

In repo `platform-core`:

```markdown
## Milestone: R1 – Platform Foundation

| ID          | Title                                   | Status   | Complexity | Estimate | Owner   | Jira      | OpenSpec                    | Tags           | Notes                         |
|------------|-----------------------------------------|----------|-----------|----------|---------|-----------|-----------------------------|----------------|-------------------------------|
| PLT-01-CORE| Core feature flag service (MVP)         | planned  | L         | 13       | core.dev| PLAT-100  | feature-flags-core          | platform,flags | Required by FND-01, FND-02    |
```

In repo `workspace-core`:

```markdown
## Milestone: R1 – Platform Foundation

| ID          | Title                                   | Status   | Complexity | Estimate | Owner    | Jira      | OpenSpec                     | Tags          | Notes                          |
|------------|-----------------------------------------|----------|-----------|----------|----------|-----------|------------------------------|---------------|--------------------------------|
| PLT-01-INT | Integrate feature flags into workspace  | planned  | M         | 8        | ws.dev   | WS-150    | feature-flags-integration    | platform, app | Consumes PLT-01-CORE service   |
```

## 6. How It All Connects in Practice

1. **Product Vision** (`openspec/vision.md`)
   - "We want unified tasks and notifications in a single workspace."

2. **Release R1 – Foundation** (`openspec/releases/R1-foundation.md`)
   - Objectives and metrics
   - Feature list: FND-01, FND-02, FND-03, PLT-01

3. **Features**
   - Each feature described in specs (domain specs) + high-level change docs.
   - E.g.:
     - `openspec/specs/tasks/spec.md`
     - `openspec/specs/notifications/spec.md`
     - `openspec/specs/integrations/spec.md`

4. **User Stories** (`openspec/project-plan.md` in each repo)
   - Stories grouped under milestones that correspond to the release (or internal phases of the release)
   - Each story:
     - Has ID, Title, Status, Complexity, Owner, Jira, OpenSpec
     - Is implemented via OpenSpec changes in `openspec/changes/<change-id>/`

5. **Execution**
   - Developer starts on a story → creates/links OpenSpec change → updates row in `project-plan.md` (`planned` → `in_progress`).
   - MCP sync updates Jira accordingly.
   - Work finishes → OpenSpec change archived → row set to `done` → Jira synced to "Done".

### Summary

This gives you a clean hierarchy:

**Vision → Releases → Features → User Stories → OpenSpec Changes → Code**

All of it anchored in Git, with Jira operating as the reporting and coordination surface for the wider organization.

# OpenSpec-Driven Delivery Manifesto

## Vision

We operate from a single, code-adjacent source of truth for engineering work. Specs, plans, and execution live together in Git. Jira and other project management tools are projections of that reality, synchronized via automation.

### Principles

- **Git as the primary planning surface**
openspec/project-plan.md is the canonical source of truth for development and QA work. Jira and other systems consume it; they don’t define it.
- **Spec-led change, not ticket-led change**
Material work starts from an OpenSpec change (proposal), not from a Jira ticket. Every user story we execute is traceable to an OpenSpec change with clear intent.
- **Status flows from lifecycle, not from drag-and-drop**
Story status in project-plan.md is updated as we move through the OpenSpec lifecycle. Automation syncs status into Jira so engineers don’t maintain multiple boards.
- **Automation over repetition**
MCP-based tooling keeps Jira in alignment with project-plan.md. Engineers and AQA focus on building and testing, not manually duplicating updates.
- **High signal, low ceremony**
Project plan tracks high-level user stories and meaningful state transitions. Subtasks and noise stay in Jira only.
- **Explicit complexity and trade-offs**
Each story in the project plan carries complexity and (optionally) an estimate. Prioritization and capacity conversations are driven by structured data, not folklore.
- **Transparent, auditable delivery**
For each story, the repo alone should answer:
What was the intent? What changed? Who drove it? When did it complete?
- **Experiment, learn, iterate**
This model is intentionally experimental. We will tune the Markdown structure, rules, and automation based on actual usage and feedback.

## Operating Model & Rules

### 1. Scope

This model applies to:

- **Engineering development** work (features, impactful refactors, platform changes)
- **AQA / test automation** work that is part of delivering those features

It explicitly **does not attempt** to fully model:

- Legal, GTM, marketing, enablement
- Support / ops tickets
- Purely mechanical tasks that do not change behavior (typos, cosmetic tweaks, dependency bumps with no impact)

Those remain Jira-first.

### 2. Core Artifacts

#### 2.1 openspec/project-plan.md (primary truth)

`project-plan.md` is a Markdown document with:

- A short intro and guidelines (optional)
- A section per milestone
- Under each milestone, a Markdown table of stories

Story fields (columns):

- **ID** – stable story ID in Git (e.g. ONB-V2-01)
- **Title** – concise outcome / user story
- **Status** – planned | in_progress | in_review | blocked | done
- **Complexity** – XS/S/M/L/XL or points
- **Estimate** – optional (e.g., story points or ideal days)
- **Owner** – main driver (handle/name)
- **Jira** – Jira key (e.g. PROJ-123)
- **OpenSpec** – OpenSpec change ID (e.g. unified-onboarding-v2)
- **Tags** – optional labels (component, team, platform)
- **Notes** – short free text (risks, decisions, caveats)

Stories that need more detail can link to OpenSpec `proposal.md` and/or a separate doc.

#### 2.2 OpenSpec changes

Each non-trivial story is delivered via an OpenSpec change:

```bash
openspec/changes/<OpenSpec-change-id>/
  proposal.md
  design.md      # optional
  tasks.md       # high-level implementation tasks
  specs/...      # spec deltas
```

`project-plan.md` links stories to these change IDs in the OpenSpec column.

#### 2.3. Jira (supplementary)

Jira mirrors stories from `project-plan.md` for:

- Cross-team visibility
- Reporting and dashboards
- Non-dev stakeholder consumption
- Jira is updated via MCP automation, not manual double entry, for these dev/AQA stories.

##### Lifecycle Rules

###### 1. Creating a new story

- New stories are added to `project-plan.md` via PR by product/tech leads or designated owners.
- Minimum required fields at creation:
  - ID, Title, Status=planned, Complexity, Milestone section placement
- Jira issue may be created by MCP based on the row and the Jira column filled automatically.

Example row on creation:

```md
| ID        | Title                                   | Status   | Complexity | Estimate | Owner | Jira     | OpenSpec | Tags             | Notes                      |
|-----------|-----------------------------------------|----------|------------|----------|-------|----------|----------|------------------|----------------------------|
| ONB-V2-01 | Unified onboarding flow for MSP tenants | planned  | L          | 13       | TBA   | TBA      | TBA      | onboarding, MSP  | Waiting for scope approval |
```

###### 2. To start work on a story

- Create or link an OpenSpec change:
  - If OpenSpec is TBA, create a new change and set it (e.g. `unified-onboarding-v2`).
- Update `project-plan.md`:
  - Status → `in_progress`
  - Owner → your handle
  - Ensure Jira column holds a Jira key (created via MCP if needed).

MCP automation then:

- Sets the corresponding Jira issue to “In Progress”
- Adds links to the OpenSpec change and relevant repo locations

> **Rule**
> No OpenSpec change is created “floating in the void”. It must be referenced from `project-plan.md` or explicitly tagged as cross-cutting infra work.

###### 3. Progressing work

We only capture major state transitions in `project-plan.md`:

- `planned` → `in_progress` – engineer/AQA has started work and OpenSpec change exists.
- `in_progress` → `in_review` – main implementation is done, PRs are open, OpenSpec proposal/design is stable.
- `in_review` → `done` – merged, archived, and delivered according to Definition of Done.
- Any status → `blocked` – external dependency, decision, or significant impediment.

Fine-grained steps (multiple PRs, micro-iterations, sub-bugs) stay in Jira/PR descriptions.

MCP keeps Jira states aligned with those transitions.

###### 4. Completing a story

A story is moved to done when all of the following are true:

- Code is merged into the target branch.
- OpenSpec change is archived and merged into baseline specs.
- AQA scope is implemented and passing; acceptance criteria are met.

At completion:

- The owner updates the story row in `project-plan.md`:
- Status → `done`
- Optional: update Notes with a short outcome (e.g. “Feature enabled for 10% tenants”).
- MCP updates Jira status to “Done” (or equivalent) and timestamps the completion.

### 3. Jira Integration Rules

#### 3.1 Direction of authority

For stories in `project-plan.md`:

- Title, Status, Complexity, Estimate, Owner are owned by Git.
- Jira may add:
- Labels, components, sprint, fix version, external links, attachments.
- If Jira and Git disagree on core fields, Git wins and MCP reconciles Jira back to Git values.

#### 3.2 Who edits what

- Engineers / AQA
- Update Status, Owner, and sometimes Notes in `project-plan.md`.
- Do not manually override Jira status for these stories.
- PM / PO / Tech lead
- Add / change stories and milestones via PRs to `project-plan.md`.
- Avoid rewriting core Jira fields directly; treat Jira as a mirror.
- Exceptions (e.g. incident hotfix)
- May be handled Jira-first and added to the plan retroactively if they are significant.

#### 3.3 Conflict handling

When automation detects a conflict (e.g. Jira changed manually):

- MCP logs it and surfaces it (e.g. in a MS Teams channel / log file).
- The default reconciliation rule:
- If the story is in `project-plan.md` → **Git is truth**.
- If a PM deliberately changed Jira (e.g., changed title for external reasons), they should open a PR to update `project-plan.md` accordingly.

### 4. Quality & Guardrails

#### 4.1 Markdown structure and validation

To avoid ```project-plan.md``` turning into ambiguous prose, we treat the tables as structured data in Markdown clothing.

Recommended structure:

##### 1. Project Plan

This document is the primary planning surface for engineering and AQA work.
Jira and other tools are synchronized from this file via automation.

```md

## Milestone: Q1 – Unified Onboarding & Discovery

### Stories

| ID        | Title                                   | Status       | Complexity | Estimate | Owner      | Jira     | OpenSpec               | Tags                      | Notes                            |
|-----------|-----------------------------------------|--------------|------------|----------|------------|----------|------------------------|---------------------------|----------------------------------|
| ONB-V2-01 | Unified onboarding flow for MSP tenants | in_progress  | L          | 13       | s.gridnev  | PROJ-101 | unified-onboarding-v2  | onboarding, MSP, portal   | Design signed off, impl started |
| ONB-V2-02 | Device auto-discovery agent bootstrap   | planned      | M          | 8        | TBA        | TBA      | discovery-agent-v1     | discovery, agent          | Depends on ONB-V2-01            |
| ONB-V2-03 | AQA coverage for onboarding happy path  | planned      | M          | 5        | aqa.user   | PROJ-103 | unified-onboarding-v2  | aqa, onboarding           | To be sequenced after PROJ-101  |


## Milestone: Q2 – Reporting & Analytics

### Stories

| ID        | Title                                  | Status   | Complexity | Estimate | Owner   | Jira     | OpenSpec               | Tags                 | Notes                           |
|-----------|----------------------------------------|----------|------------|----------|---------|----------|------------------------|----------------------|---------------------------------|
| REP-V1-01 | MSP-facing onboarding funnel report    | planned  | M          | 8        | TBA     | TBA      | onboarding-report-v1   | reporting, onboarding| Awaiting metrics definition     |
| REP-V1-02 | Internal ops dashboard for onboarding  | planned  | S          | 5        | TBA     | TBA      | onboarding-report-v1   | reporting, internal  |                                 |

```

##### 2. Validation expectations

- CI or pre-commit hooks parse the Markdown tables and enforce:
- Allowed Status values
- Non-empty ID / Title
- Unique IDs per story
- Valid references for OpenSpec where required

This keeps the document human-friendly but machine-usable for MCP and internal tooling.

#### 4.2. Noise boundaries

Do **not** add to `project-plan.md`:

- Micro-tasks, subtasks, “fix typo in log message”
- Pure defect triage items that don’t change spec-level behavior
- Operational / support tickets that are not part of an ongoing initiative

> If a bug is structurally important (e.g., it changes expected behavior or contract), capture it as a story with clear title and link to relevant OpenSpec change.

#### 4.3 Review discipline

- Adding or significantly changing stories/milestones goes through PR review:
- Check alignment with roadmap and scope
- Confirm complexity is roughly realistic
- Confirm OpenSpec linkage exists or is planned

#### 4.4 Transparency on change

- Major scope changes (split/merge stories, drop a story, big re-estimate) should:
- Be made via PR to `project-plan.md`, and
- Optionally noted in Notes or the corresponding OpenSpec `proposal.md`

This keeps the project history readable and auditable.

### 5. Rollout Strategy (Experimental Phase)

To avoid boiling the ocean:

- Apply this model to one squad / initiative and only to new work.
- Run it for 2–3 sprints, with:
  - MCP/Jira sync in place
  - CI validation for `project-plan.md`
- Collect feedback from dev, AQA, and PM:
  - What feels heavy?
  - What fields are missing?
  - Where does the sync model hurt/help?
- Iterate on:
  - Table schema
  - Status model
  - Automation behavior
- Only then consider onboarding additional teams.

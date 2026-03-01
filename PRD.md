# PRD — TeamFlow Kanban

## 1) Product Overview
TeamFlow Kanban is a collaborative task-delivery system where humans and AI agents work from a shared board toward collective progress. It combines classic Kanban flow with autonomous agent participation.

## 2) Problem Statement
Most task tools assume humans manually keep status current. In fast-moving teams, that creates stale boards and poor visibility. We need a lightweight, auditable board where agents can actively maintain momentum by:
- auto-picking eligible work,
- progressing tasks,
- surfacing new valuable tasks,
- keeping the queue aligned with broader goals.

## 3) Goals
1. Make progress visible in real time.
2. Keep backlog, in-flight work, and done states continuously updated.
3. Enable both manual assignment and agent autopick.
4. Preserve full traceability of every change.
5. Keep implementation simple and reliable.

## 4) Non-Goals (v1)
- Complex permission model / SSO
- Multi-project hierarchy
- Advanced reporting/ML analytics
- Gantt/roadmap planning

## 5) Core Concepts
### Task
Unit of work with title, description, priority, status, assignee, labels, auto-pick flag, and timestamps.

### Agent
Human or AI contributor with role, capacity (WIP limit), active state, and heartbeat.

### Backlog
Prioritized source queue where tasks can be manually curated or agent-generated.

### Audit Trail
Append-only timeline of all significant state transitions and mutations.

## 6) User Personas
- **Principal Engineer / Team Lead**: monitors flow, tunes priorities, ensures delivery coherence.
- **Contributor**: creates/moves/completes work.
- **AI Agent**: auto-picks tasks, updates status, proposes exploratory improvements.

## 7) Functional Requirements
### Board & Flow
- Columns: Backlog, Todo, Doing, Review, Done.
- Drag-and-drop task movement across columns.
- Fast create/delete task actions.

### Agent Operations
- Create/update agents.
- Pause/resume agents.
- Configure capacity (WIP).
- Agents auto-pick eligible backlog/todo items when under capacity.

### Assignment Model
- Manual assignment supported.
- Automatic assignment supported (auto-pick=true).

### Backlog Management
- Manual create/prioritize tasks.
- Agent-created exploratory tasks allowed.

### Traceability
- Every create/update/delete/status change logs:
  - actor
  - timestamp
  - entity
  - summary
  - optional before/after metadata

## 8) Data Model (v1)
### tasks
- id (string)
- title (string)
- description (string)
- status (enum)
- priority (1..5)
- assigneeId (nullable)
- labels (string[])
- autoPick (boolean)
- createdAt/updatedAt (ISO timestamp)

### agents
- id, name, role
- type (human|ai)
- active (boolean)
- capacity (number)
- wip (derived)
- lastHeartbeat (ISO timestamp)

### audit
- id
- at
- actor
- action
- entityType
- entityId
- summary
- meta (optional)

## 9) System Behavior (v1 agent loop)
Every few seconds:
1. Recompute current WIP.
2. Active AI agents auto-pick highest-priority eligible tasks until capacity.
3. In-flight tasks probabilistically progress Doing → Review → Done.
4. Occasionally generate exploratory backlog tasks.
5. Persist + append audit entries.

## 10) UX Requirements
- Clean dark UI with clear status columns.
- Quick-add row for task creation.
- Drag-drop interactions should feel immediate.
- Agent panel shows WIP/capacity/active state.
- Audit pane shows latest timeline.

## 11) Quality Attributes
- Simple architecture (single Node service + static frontend).
- Local-first operation.
- Portable deployment via Node runtime.
- Explicit auditability.

## 12) Tech Choices
- **Backend:** Node.js + Express
- **Storage:** JSON file database (single-file persistence for simplicity)
- **Frontend:** Vanilla JS + CSS + HTML
- **Networking:** REST API + client polling

Rationale: minimize complexity while still delivering autonomous workflow + traceability.

## 13) MVP Acceptance Criteria
- Can create/move/delete tasks on board.
- Agents can be toggled active/inactive.
- Active agents auto-pick and progress work.
- Backlog exists and is operational.
- Every mutation is auditable.
- App runs locally and on LAN.

## 14) Future Iterations
- WebSocket updates (replace polling)
- Auth and role-based controls
- Multiple projects/workspaces
- Rich comments/attachments
- Agent strategy profiles
- Metrics dashboard (lead time, cycle time, throughput)

## 15) Success Metrics
- Board freshness: % tasks updated within last N hours.
- Flow efficiency: backlog aging and cycle time trend.
- Agent utilization vs capacity.
- Delivery throughput per week.

# TeamFlow Kanban

A real-time Kanban delivery system where **humans + agents** collaborate toward continuous progress.

## Why TeamFlow

Typical boards go stale because people forget to update them.
TeamFlow bakes in autonomous contributors that can:

- pick up eligible tasks,
- progress work through the board,
- keep backlog moving,
- and maintain an auditable trail of decisions and changes.

The goal is simple: **a board that reflects reality, not wishful status.**

---

## Features

### Core board flow
- Kanban columns: **Backlog → Todo → Doing → Review → Done**
- Drag-and-drop task movement
- Fast create/delete task actions
- Manual assignment per task

### Agent collaboration
- Human and AI-style agents
- Agent capacity / WIP awareness
- Pause/resume agents live
- Auto-pick and auto-progress loop (for AI agents)

### Traceability
- Append-style audit feed of all key events:
  - task creation/updates/deletes
  - status transitions
  - auto-picks
  - agent edits
  - imports

### Real-time UX
- WebSocket push updates for board, agents, audit, and metrics
- Metrics tab with live charts:
  - tasks by status
  - agent WIP
  - throughput summary

### Import / Export
- Export tasks as JSON
- Import tasks as JSON with **upsert by `task.id`**:
  - existing `task.id` → update
  - new `task.id` → create

---

## Tech stack

- **Node.js + Express** backend
- **ws** WebSocket server
- **Vanilla HTML/CSS/JS** frontend
- **JSON file DB** (`db.json`) for simple local persistence

---

## Run locally

```bash
cd ~/projects/teamflow-kanban
npm install
npm run dev
```

Server binds to `0.0.0.0:4680`.

- Local: `http://localhost:4680`
- LAN: `http://<your-lan-ip>:4680`

---

## Keyboard shortcuts

- `N` → focus new-task title
- `Ctrl/Cmd + Enter` → create task
- `Esc` → close task drawer

---

## Project structure

```text
teamflow-kanban/
  public/
    index.html
    styles.css
    app.js
  server.js
  db.json           # created at runtime
  PRD.md
  package.json
```

---

## Notes

- `Builder-1`, `Bubba`, etc. are in-app simulated agents for workflow behavior.
- They are not separate OpenClaw sessions unless explicitly integrated.

---

## Roadmap ideas

- Auth + permissions
- Multi-workspace support
- Agent strategy profiles
- Burndown & lead-time history
- GitHub issue sync

---

If you test this and have feedback, open an issue or PR. Contributions welcome.

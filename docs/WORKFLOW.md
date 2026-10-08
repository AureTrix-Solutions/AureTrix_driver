# AureTrix Workflow — PO Cheat Sheet

How to run a sprint. You are the **Product Owner (PO)**. Four roles, each in its OWN fresh window
(`/new`). One sprint = one git branch. You run all git yourself in PowerShell.

The authoritative rules live in `CLAUDE.md`; this is the quick operator's guide.

---

## The four calls (nothing else to memorize)

| Role | Fresh window, paste | Does |
|------|---------------------|------|
| PM — open | `Act as PM per CLAUDE.md. Plan the "<name>" sprint from docs/plans/backlog.md.`  (or `… Goal: <...>.`) | Writes the sprint plan into current-sprint.md |
| Worker | `go` | Does the next task, commits, reports status |
| Reviewer | `follow docs/plans/reviews/review-<slug>.md` | Independent PASS/FAIL on a high-stakes task |
| PM — close | `Act as PM per CLAUDE.md. Close the sprint for my sign-off.` | Shows the report; on approval, archives |

---

## A sprint, start to finish

**1. Branch** (PowerShell). Name = `sprint-NN-<slug>`, where NN = highest in `docs/plans/index.md` + 1.
```
git checkout -b sprint-01-code-fixes
```

**2. PM-open** (`/new`): paste the PM-open call. It writes the plan into `current-sprint.md` (goal,
tasks with "Done when" + tags, and a ▶ RUN THIS pointing at Task 1). Read it; if you like it, go.

**3. Worker** (`/new`, `go`) — one window per task. It runs the session-start check, does the next
task, you approve its edits, it commits. Then it sets the task's status and tells you what's next:
- `[trivial]` → it marks the task **DONE** itself.
- `[high-stakes]` → it writes the review file, sets **IN-REVIEW**, and hands you the review line.

**4. Reviewer** (`/new`) — only when a task is IN-REVIEW. Paste the line the Worker gave you.
- **PASS** (no hardware) → task **DONE**.
- **PASS (pending hw)** → task **HW-TEST** (your turn, step 5).
- **FAIL** → it writes detail into the review file and a "fix ONLY these" checklist into ▶ RUN THIS.
  Run a Worker (`go`) to fix only those, then Reviewer again.

**5. Hardware check** (you) — only for `[hw]` tasks at HW-TEST. Open the review file, read "what to
verify," test it on the keyboard, then edit two files:
- **PASS** → review file: `Hardware verdict: PASS — <date>`; current-sprint.md: task → **DONE**.
- **FAIL** → review file: `Hardware verdict: FAIL — <date> → see F1` + symptom in the F1 block;
  current-sprint.md: task → **IN-PROGRESS** + a `(F1) … see §F1` line in ▶ RUN THIS. Then run a Worker.

**6. PM-close** (`/new`) — when all tasks are DONE. It shows an on-screen report. Reply **approve**
(it archives: snapshots current-sprint.md into `archive/sprint-01-code-fixes/`, adds a line to
`index.md`, resets current-sprint.md to the COMPLETE stub) or give feedback (it revises).

**7. Merge** (PowerShell, after approve):
```
git checkout main
git pull
git merge sprint-01-code-fixes
git push
git branch -d sprint-01-code-fixes
```

---

## Status meanings (in current-sprint.md)

- **PENDING** → not started (PM set it).
- **IN-PROGRESS** → a Worker is on it.
- **DONE** → finished (trivial: Worker; high-stakes: Reviewer PASS; [hw]: your hardware ✓).
- **IN-REVIEW** → high-stakes task waiting on the Reviewer.
- **HW-TEST** → code passed review, waiting on your hardware check.

Who can mark DONE: a Worker marks its own **trivial** tasks done; it can **never** mark its own
high-stakes task done — only the Reviewer (code) and you (hardware) can.

---

## Merge-or-delete (a branch never lingers)

- Finished + approved → **merge** (step 7).
- Abandon, idea dead → `git checkout main` then `git branch -D sprint-NN-<slug>`.
- Abandon, keep the idea → add one line to `docs/plans/backlog.md` **first**, then delete the branch.

One sprint at a time. Don't pin a half-done branch to come back to.

---

## current-sprint.md has two looks

- **Between sprints** (now): the short COMPLETE stub — "no sprint, run PM-open."
- **During a sprint**: the full plan (PM writes it at open; reset back to the stub at close).

The blank shape for the full version lives in `docs/plans/templates/sprint-template.md` — the PM
copies from it. You never edit the template.

---

## The backlog (where sprints come from)

`docs/plans/backlog.md` holds candidate sprints (each a `###` header) and known bugs. Habit:
**ideas go to the backlog first** so nothing is lost; you pick what to build when you're ready.

Two distinct PM actions on a candidate:
- **Scope** (flesh out, don't start): turn on **plan mode in OpenClaude** (read-only — it researches
  and proposes but writes nothing until you approve), then in a PM window:
  `Act as PM per CLAUDE.md. Flesh out the "<name>" candidate in docs/plans/backlog.md — list the
  tasks under its ### header with tags. Do NOT start a sprint or touch current-sprint.md.`
- **Open** (promote to a live sprint): the normal PM-open call. This moves the item into
  current-sprint.md and removes it from the backlog.

When to skip the backlog: a small, clear idea can go straight to PM-open with a direct
`Goal: <...>` — no need to park it first.

Candidates are kept roughly in the order you'd tackle them (top = next); you pick regardless.

### New bug or idea mid-sprint
Don't fix it out of scope. One line into the backlog:
```
Add to docs/plans/backlog.md: <one line>.
```

## Rules the agent follows (so you know what to expect)
- Commits freely (one per task); **can't** push, merge, delete branches, or rewrite history — those
  are yours, blocked in settings.json.
- One task per window; no sub-agents; saves to disk continuously (crash-safe).
- Never changes design intent: `filters:[]` device selection, `usagePage 65440`, wrappers return Error.
- If a window crashes: `/new` and re-paste the role line (or `go`). Progress is on disk.
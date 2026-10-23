# AureTrix Workflow — PO Cheat Sheet

How to run a sprint. You are the **Product Owner (PO)**. Four roles, each in its OWN fresh window
(`/new`). One sprint = one git branch. You run all git yourself in PowerShell.

The authoritative rules live in `CLAUDE.md`; this is the quick operator's guide. The trailing
sentence on each role's paste is what forces the gate to actually fire — keep it on.

---

## The four calls (paste the WHOLE thing — the gate is the trailing sentence)

**PM — open** → writes the sprint plan into current-sprint.md:
```
Act as PM per CLAUDE.md. Plan the "<name>" sprint from docs/plans/backlog.md. Bank every fact you verify to .scratch/pm-notes.md the instant you confirm it — a fact counts only once written, narrating does not count. Grep-confirm every value before you put it in the spec (never eyeball from a span); when a value is read on one side and written on another, confirm both sides agree.
```
(direct-goal variant: replace `Plan the "<name>" sprint from docs/plans/backlog.md.` with `Goal: <...>.`)

**Worker** → does the next task, commits, reports status:
```
go. Checkpoint into current-sprint.md after every finding and every first-pass read — banked, not narrated; this is a gate. Overwrite the checkpoint line, don't stack a log.
```

**Reviewer** → independent PASS/FAIL on a high-stakes task:
```
follow docs/plans/reviews/review-<slug>.md. Bank each verified fact to .scratch/review-notes.md as you go — not narrated; this is a gate. After ONE verification pass, RULE: if the defect (or its absence) is confirmed against the diff, write the verdict + findings and STOP — don't hunt for confirmation you don't need.
```

**PM — close** → shows the report; on approval, archives:
```
Act as PM per CLAUDE.md. Close the sprint for my sign-off.
```

> **Why the trailing sentences:** PM, Worker, and Reviewer all verify a lot, and their reads get
> elided from context — which sends them into re-read/thrash loops. The banking rules are in
> CLAUDE.md, but a rule in the live prompt is what actually makes it fire. So each role's paste ends
> with its gate: PM/Reviewer bank verified facts as they go (and the PM also grep-confirms facts so
> bad info never reaches the Worker); the Worker checkpoints into current-sprint.md; the Reviewer
> also gets a "converge — rule, don't over-dig" nudge. If a role still thrashes, stop it and say
> "you have everything you need — write your output and stop."

---

## A sprint, start to finish

Use the exact paste strings from the four-calls table above — the trailing gate sentence is not optional.

**1. Branch** (PowerShell). Name = `sprint-NN-<slug>`, where NN = highest in `docs/plans/index.md` + 1.
```
git checkout -b sprint-01-code-fixes
```

**2. PM-open** (`/new`): paste the PM-open call. It writes the plan into `current-sprint.md` (goal,
tasks with "Done when" + tags, and a ▶ RUN THIS pointing at Task 1). Read it; if you like it, go.

**3. Worker** (`/new`, paste the Worker call) — one window per task. It runs the session-start check,
does the next task, you approve its edits, it commits. Then it sets the task's status and tells you
what's next:
- `[trivial]` → it marks the task **DONE** itself.
- `[high-stakes]` → it writes the review file, sets **IN-REVIEW**, and hands you the review line.

**4. Reviewer** (`/new`) — only when a task is IN-REVIEW. Paste the Reviewer call with the slug the
Worker gave you.
- **PASS** (no hardware) → task **DONE**.
- **PASS (pending hw)** → task **HW-TEST** (your turn, step 5).
- **FAIL** → it writes detail into the review file and a "fix ONLY these" checklist into ▶ RUN THIS.
  Run a Worker to fix only those, then Reviewer again.

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

## Commit messages (Conventional Commits)

For **your own** hand-written commits (the CLAUDE.md fix, a quick doc tweak, anything you commit
directly). Agents' sprint commits use `<sprint>: <task>` and are already done for you — this is for
the ones you type.

Format: `type: short description` — imperative ("add", not "added"), lowercase, no period.

| type        | use for                          | example                               |
|-------------|----------------------------------|---------------------------------------|
| `feat:`     | a new feature                    | `feat: add DKS config page`           |
| `fix:`      | a bug fix                        | `fix: correct Select-to-Global value` |
| `docs:`     | docs only                        | `docs: reconcile RapidTrigger page`   |
| `refactor:` | restructure, no behavior change  | `refactor: extract batch loop`        |
| `style:`    | formatting only, no logic change | `style: apply eslint --fix`           |
| `test:`     | add/update tests                 | `test: add ExportService round-trip`  |
| `chore:`    | build, deps, config, tooling     | `chore: bump vite to 5.4.2`           |

Bigger change? Add a blank line then a body:
```
fix: GlobalTravel writes UI settings not DB register

Was writing the Global-DB register value; now writes the current
global travel + DpDr per selected key.
```

Picking a type: `feat` adds capability · `fix` corrects wrong behavior · `chore` is plumbing ·
`docs`/`style`/`refactor`/`test` change no runtime behavior.

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

Two distinct PM actions on a candidate (both carry the same bank + grep-confirm gate — they do the
same heavy verification, so they thrash the same way without it):

- **Scope** (flesh out, don't start): turn on **plan mode in OpenClaude** (read-only — it researches
  and proposes but writes nothing until you approve), then in a PM window:
  ```
  Act as PM per CLAUDE.md. Flesh out the "<name>" candidate in docs/plans/backlog.md — list the tasks under its ### header with tags. Bank every fact you verify to .scratch/pm-notes.md the instant you confirm it (narrating does not count); grep-confirm every value before it enters the spec (never eyeball from a span), and confirm both sides of any read/write agree. Do NOT start a sprint or touch current-sprint.md.
  ```
- **Open** (promote to a live sprint): the normal PM-open call from the table above. This moves the
  item into current-sprint.md and removes it from the backlog.

When to skip the backlog: a small, clear idea can go straight to PM-open with a direct `Goal: <...>`
— no need to park it first (keep the whole bank + grep-confirm gate on the end, same as the table).

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
- Banking gates (why the prompts end the way they do): PM → `.scratch/pm-notes.md`,
  Reviewer → `.scratch/review-notes.md` (both gitignored, private, recreated per session),
  Worker → the current-sprint.md checkpoint (shared). "Banked, not narrated" for all three.
- Never changes design intent: `filters:[]` device selection, `usagePage 65440`, wrappers return Error.
- If a window crashes: `/new` and re-paste the role call (with its gate sentence). Progress is on disk.
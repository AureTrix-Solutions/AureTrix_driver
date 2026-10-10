# CLAUDE.md

This file provides guidance to the AI coding agent (OpenClaude, or any Claude Code–compatible tool) when working with code in this repository.

## Project Overview

AureTrix is a browser-based configuration tool for hall effect keyboards (SparkLink SDK compatible). It is a Vue 3 + TypeScript + Vite SPA that talks to keyboards via the **WebHID API** — no native driver. WebHID requires a Chromium-based browser and a secure context (`localhost` or HTTPS).

## Commands

```bash
npm install           # install dependencies (npm is the package manager; package-lock.json is the lockfile)
npm run dev           # dev server on http://localhost:5000 (strictPort)
npm run build         # production build to dist/
npm run preview       # serve the production build
npm run typecheck     # tsc --noEmit (no emit; reports type errors only)
npm test              # vitest (watch mode by default)
npx vitest run path/to/file.test.ts   # run a single test file
```

There is no lint script and currently no test files, despite vitest/@vue/test-utils being installed.

## Architecture

### Layered data flow

```
Vue pages (src/pages/*) 
  → Pinia stores (src/store/*)  and/or  singleton services (src/services/*)
    → @sparklinkplayjoy/sdk-keyboard (XDKeyboard)
      → WebHID → physical keyboard
```

- **Services are singletons**: each service class ends with `export default new XService()`. Importing `KeyboardService` anywhere gets the same instance. `KeyboardService` is also `app.provide`d in `main.ts` as `'KeyboardService'`, but most code imports the singleton directly.
- **`KeyboardService`** (~1400 lines) is the core hardware wrapper: connection/auto-reconnect (paired device tracked via `pairedStableId` in localStorage), key remapping, lighting, rapid trigger, calibration, profile switching, factory reset. It registers HID connect/disconnect listeners in its constructor and does deferred auto-reconnect on app start. It contains operation-token and timeout state machines for polling-rate changes, factory reset, and reconnection, plus temporary `console.error` suppression around reconnects.
- **`DebugKeyboardService`** is a *separate* XDKeyboard instance used only by the Debug page, so raw SDK inspection doesn't interfere with the main connection.
- **`ExportService`** gathers full keyboard config for export/import (JSON), using batch processing and retry-with-backoff around SDK calls.
- **`store/connection.ts`** holds connection status/deviceInfo and is the bridge pages use to know if hardware is available. `profileStore` (4 hardware profiles) and `travelProfilesStore` (persisted via pinia-plugin-persistedstate) are small.

### Batch processing

Hardware calls for many keys go through the **`useBatchProcessing` composable** (`src/composables/useBatchProcessing.ts`): `processBatches` runs batches of 80 keys with 100ms delay between batches. The composable is the home of the batching logic; pages/components (e.g. `SingleKeyTravel.vue`) and services *consume* it. Firing per-key SDK calls for a whole keyboard will overload the device — import and use the composable for any new bulk operation; never reimplement the loop inline.

### Hardware rules

- Device selection is intentionally unfiltered (`navigator.hid.requestDevice({ filters: [] })`) so any SparkLink keyboard works. Never add device filters or hard-code vendor/product IDs.
- `usagePage: 65440` (0xFFA0) selects the SparkLink command interface on the chosen device; it is not a device filter.
- KeyboardService wrappers return `Error` instances instead of throwing; callers check `instanceof Error`.
- Don't explore node_modules/@sparklinkplayjoy unless the reference is missing something; `protocol-keyboard/src` is readable TypeScript source.
- Before relying on a section of docs/sdk-reference-v2.md, check its row in the Verification status table. If it's Partial or Unverified, confirm against protocol-keyboard/src or the bundle first.

### Key model

`IDefKeyInfo` (src/types/types.ts) distinguishes `physicalKeyValue` (hardware key ID used for all SDK calls) from `keyValue` (current remapped/display value). Layouts are `IDefKeyInfo[][]` (rows of keys). `useMappedKeyboard(layerIndex)` (src/utils/MappedKeyboard.ts) is the shared composable that fetches the base layout + a remapping layer from hardware and computes absolute pixel positioning (`gridStyle`) for rendering.

### Layout system (priority order)

Physical layout geometry (key sizes in mm, gaps, row spacing) resolves in this order:

1. `src/utils/sharedLayout.ts` — community-contributed layouts keyed by **productName** (checked first; this is where user-submitted layouts go)
2. IndexedDB custom layouts via `LayoutStorageService` (created in the Layout Creator page; cache preloaded in `main.ts` via `loadCustomLayouts()` before app mount)
3. `src/utils/layoutConfigs.ts` — built-in fallback layouts keyed by **total key count** (61, 68, ...)

`getLayoutConfig(totalKeys, layout, ..., productName)` in layoutConfigs.ts implements this resolution. `keyUnits.ts` converts mm to px.

### Routing

`src/router/index.ts`: `/` (Connect page) is eagerly loaded; all feature pages are lazy-loaded. Routes map 1:1 to pages (KeyMapping, Lighting, Performance, RapidTrigger, Calibration, DKS/MPT/MT/TGL/END/SOCD/Macro advanced features, LayoutPreview, LayoutCreator, Debug).

### Path aliases

Vite + TS aliases: `@` → src, plus `@components`, `@pages`, `@services`, `@styles`, `@assets`, `@types`, `@utils`. Both alias styles are used in the codebase.

### Docs

`docs/pages/*.md` documents each feature page. `docs/sdk-reference-v2.md` is the verified SDK reference; read only the sections relevant to the task. `docs/plans/current-sprint.md` is the live sprint plan and handoff (what's next); completed sprints are archived under `docs/plans/archive/` with a one-line index in `docs/plans/index.md`.

## Conventions (from CONTRIBUTING.md)

- Use `<script setup lang="ts">` for new components; Composition API only.
- Use Pinia stores for shared state; no direct DOM manipulation for state changes.
- Commit style: `Add: ...`, `Fix: ...`, `Update: ...`, `Remove: ...` (sprint work also uses `<sprint>: <task>` — see Git & commits).
- New keyboard layout contributions go in `src/utils/sharedLayout.ts` with precise mm-level measurements (1u = 19.05mm).
- When a feature is complete, update this file with any new conventions (1-3 lines).

## Operating Protocol

How work runs here. Four roles across separate sessions; the human is Product Owner. Ground truth
for all SDK claims is docs/sdk-reference-v2.md. The only live planning file is
docs/plans/current-sprint.md; everything else is archived off the read path.

### Roles
- PRODUCT OWNER = human: priorities; approves Worker edits in-session; runs hardware tests; sprint sign-off; revisions. Only the PO pushes, merges, deletes branches, or rewrites git history. **PO = decisions only (approve/reject, pass/fail, sign-off, hardware verdict). The PO never hand-edits planning files as the normal path — it states an outcome in plain words and an agent does the file mechanics (see Hardware gate, Status ownership).**
- PM (Planner): bookends a sprint — opens it (plans from a goal you give OR an item in docs/plans/backlog.md) and closes it (collects sign-off; archives or revises). Dormant mid-sprint. No implementation. Conduit between Worker/QA and the PO. **Sole writer of docs/plans/backlog.md: removes the item it turns into a sprint, and ROUTES the Findings section into backlog (or into a later task's plan) at every PM touchpoint (see rule 8). Scopes EVERY task and hands over whatever it researches as concrete, grep-verified edits/facts so the Worker applies rather than re-derives (see PM-open).**
- WORKER: executes ONE task per session; self-checks; **commits its own work (commits ARE the checkpoints — see rule 3); reports status at each commit.** On resume, trusts its checkpoint as the plan (consults only the compiler for results) and does not re-derive what the checkpoint already records.
- REVIEWER (independent QA): fresh session; checks one high-stakes task's diff vs spec; PASS/FAIL; writes the review file; NEVER edits source. The Reviewer passes the CODE; the PO passes the HARDWARE. **After one verification pass it RULES — a runtime/behavior question goes to the PO hardware check, not more digging. Output = PASS/FAIL + findings + its own Findings lines; it does NOT plan task order/parallelism. For a [hw] task it sets HW-TEST (PASS pending hw) and stops — it never writes DONE.**

### Sessions (each a fresh window; entry prompt in quotes)
- PM-open — "Act as PM per CLAUDE.md. Goal: <...>" OR "Act as PM per CLAUDE.md. Plan the \"<name>\" sprint from docs/plans/backlog.md." → writes current-sprint.md (sprint goal + done-criteria; tasks each with "Done when:" criteria and a [trivial]/[high-stakes] tag, plus [hw] where a task needs on-device confirmation), seeds the first task's ▶ RUN THIS. If planning from a backlog item, reads that item and removes it from backlog.md. Also at PM-open:
  - **Size tasks by the edit list you write (rule 2 gives you one to count).** Concrete cap: one task ≈ a coherent change of **~15 edit-sites or fewer across 1–3 files**; if a single large file (>~800 lines) takes many edits, split it by section/item-group. Measure at plan time by counting the edit list and the files it spans — do NOT rely on predicting a "resume," which is only visible after the fact. (These numbers come from sprint-01 Task 4b — 38 edits across two 1000+-line files, which took 4 sessions — vs sprint-02's ≤10-edit tasks that ran in one pass.)
  - **Hand over your research.** For any task you investigate, write it INTO the plan as a numbered edit list (file + grep-verified current text + replacement) plus the expected post-task typecheck count and any facts/call-chains you confirmed. The Worker APPLIES; it never re-derives. Scale detail to the task: a genuinely trivial task (full spec writable without opening a single source file) is a one-liner; anything you had to investigate is NOT trivial — tag/scope it accordingly.
  - **Check feasibility.** Before finalizing, confirm each done-criterion is achievable within the task's scope given your own research (numeric gates especially).
  - **Resolve PO decisions up front.** Any decision a task needs ("confirm with PO before…") is settled BEFORE that task's execution session opens, and the answer lands on disk — an unresolved decision in a worklist is a guaranteed re-read loop.
  - **Route the Findings section** (see rule 8): fold this-sprint findings into the relevant task's plan now; carry future-sprint findings to backlog at close.
- Worker — "go" → runs the session-start check, then reads current-sprint.md ▶ RUN THIS and does the next task.
- Reviewer — "follow docs/plans/reviews/review-<slug>.md" → independent PASS/FAIL.
- PM-close — "Act as PM per CLAUDE.md. All tasks DONE; assemble work + QA verdicts vs the goal for my sign-off; on acceptance archive, on rejection revise." (Close is a fixed checklist — see Close-out & archive.)

### Two human gates
- Operational: human approves each Worker edit in-session. Commits are NOT gated — the Worker commits freely (see Git & commits).
- Acceptance: sprint sign-off routed THROUGH the PM to the human. Work reports up via artifacts; it never jumps the chain.

### Three feedback loops
- Edit: human rejects an edit → Worker redoes it.
- Task: Reviewer FAIL (or a hardware ✗) → detail into the review file + a fix checklist into ▶ RUN THIS → IN-PROGRESS → new Worker window fixes ONLY the failed items → Reviewer re-checks only those. The Reviewer NEVER fixes.
- Sprint: PO rejects at PM-close → PM revises the sprint (same name, logged "revN (date): <change>") → Worker → PM-close. Nothing archives until PO sign-off.
- A done-criterion found WRONG mid-sprint routes to the PM (plan mode) to revise and log, on PO confirmation — same as a close-time revision. A revised criterion must also reach the review file (the Reviewer reads the review file, not current-sprint.md).

### Hard rules (every session)
1. ONE task per session. Never start a second — commit your WIP (so the tree is clean), write the handoff, then stop.
2. Save after every edit/finding. Never hold work only in memory.
3. ONE READ PASS, THEN EDIT. Read each named file once. Don't re-read a file read this session; don't re-derive what the checkpoint records. On resume: trust the checkpoint, consult only the compiler. Caught re-reading or re-confirming → STOP; apply the next edit or write the handoff. Route a runtime/behavior question to the PO hardware check, not to more reading. COMMIT whenever the tree reaches a verifiable state (often once for a small task), writing the status line there (Worker/PM → current-sprint.md; Reviewer → review file) — never keep work only in memory. Don't try to stop before a context/time limit; you can't detect one, so commit often instead. On resume, the checkpoint is one status line + a pointer.
4. NO sub-agents. If a task seems to need one, stop and ask the human.
5. Never dump large/minified file slices to output — read only the span you need.
6. Verify every SDK claim against docs/sdk-reference-v2.md (and protocol-keyboard/src when needed) before writing it. More broadly: never assert an API name, signature, or line number you have not confirmed in THIS session — if a read was elided from context, re-read it or don't claim it; never reconstruct from memory. Verify before you write, not after.
7. Design intent — never change: unfiltered device selection (filters:[]), usagePage 65440 semantics, wrappers return Error (never throw).
8. Spot a bug or idea outside your task's scope? Append ONE line to the `## Findings` section of current-sprint.md (edit tool, never shell `>>`), then carry on — don't fix it, don't read the rest of the sprint file. State the DEFECT and WHERE TO VERIFY it, never a pre-written fix. The PM is the only writer of backlog.md; it routes Findings there (future-sprint) or into a later task's plan (this-sprint) at its next touchpoint.

### Git & commits
- The Worker COMMITS its own work, message "<sprint>: <task>". Commit each time the tree reaches a verifiable state: once for a small task, once per coherent chunk for a multi-part one. Each commit is a local, reversible recovery point. You can't pre-commit against a crash or forced cutoff — frequent commits are the only guard against that. When you stop under your own control — the PO tells you to, or you decide to hand off — commit WIP first so the tree is clean, then write the handoff.
- The Worker NEVER pushes, merges, deletes branches, or rewrites history (no amend, rebase, reset, restore, clean, or branch switching). The PO does all of those manually. These are blocked in .openclaude/settings.json.
- One sprint = one branch. The PO creates it before the sprint and merges it to main on sign-off. On merge, the PO flips that sprint's docs/plans/index.md status `signed off → merged` and deletes the branch; a branch deleted without merging is `abandoned`.

### Deletes & cleanup (the agent never deletes — those commands are blocked)
- Throwaway/experiment files → put them in `.scratch/` (gitignored). Never try to delete them; the PO empties `.scratch/` freely (no git needed).
- A real repo file that should be removed → MOVE it into `_to_delete/` (tracked), never delete it. The PO does the `git rm`. (Removing a method/lines *inside* a file is a normal edit, not a delete — that's allowed.)
- REPORT cleanup at the end of the task, in the current-sprint.md checkpoint, FROM AN ACTUAL `ls` of `.scratch/` and `_to_delete/` — never from memory or assumption (you cannot claim a dir is empty you didn't, and can't, empty). List anything in `.scratch/` (PO can just delete) and `_to_delete/` (PO must `git rm`). If both are empty, say "no cleanup needed."

### Session start (run before any work)
1. Confirm the current branch is the sprint branch, NEVER main. If on main, STOP and report.
2. Run `git status`. If there are uncommitted changes (a crashed earlier session), STOP and report to the PO. NEVER discard uncommitted work — only the PO does that.
3. Otherwise read current-sprint.md and follow its ▶ RUN THIS block.

### Context hygiene (bounded forever)
- Read ONLY: current-sprint.md + the active task's named files + the needed sdk-reference-v2.md sections (+ the relevant template when creating a file). Never read archive/ or old sprints.
- current-sprint.md is a SNAPSHOT, not a log: overwrite it, collapse DONE tasks to one ✓ line, keep under ~150 lines. Updating a task's status REPLACES its checkpoint line with ONE short line — never adds a second paragraph; full detail lives in the review file + git.
- Completed sprints + done review files live in docs/plans/archive/ (off the read path). History = git + archive.
- A skill you write is TIGHT: the pattern + a checklist + pointers. It POINTS at CLAUDE.md, never re-states it, and never carries task-specific mechanics (gates, baselines, unmasking) or future-task findings. Aim ~60–80 lines; if it reads like a design doc, cut.
- This CLAUDE.md loads every session: keep it capped and curated. Add rules REACTIVELY, only when a problem recurs, by CONSOLIDATING an existing rule rather than appending. Detail/examples go in on-demand skills, not here. No standing lessons-learned file.

### QA tiers
- Worker MAY fix inline (no review) and must LOG it: typos, grammar, formatting, dead/moved links, path refs, self-created inconsistencies, lint/format.
- Every [high-stakes] task gets an independent Reviewer window. High-stakes = logic/behavior, multi-file, SDK-correctness, device/firmware-affecting, irreversible. If unsure → high-stakes.
- A [hw] task also needs the PO's hands-on hardware check after code review: the Reviewer passes the code as PASS (pending hw) → HW-TEST → the PO exercises it on a real device and marks ✓/✗ (see Hardware gate).

### Tag ownership
- The PM assigns [trivial]/[high-stakes] (and [hw]) at plan time, AFTER a quick feasibility look — not before. A task is [trivial] only if the PM can write its full spec without opening a single source file (no research needed → a one-liner spec is complete). If scoping reveals ANY investigation is needed, it is NOT trivial — re-tag it and hand over the research per PM-open.
- The Worker MAY upgrade a tag (trivial → high-stakes), NEVER downgrade.
- Any change touching KeyboardService, store/connection.ts, or the design-intent rules is ALWAYS [high-stakes], regardless of size.
- A Reviewer who finds a task mis-tagged (should have been high-stakes) auto-FAILs it back for proper review.

### Self-check gate (code tasks only)
- INACTIVE until the typecheck script + docs/tsc-baseline.txt exist (both created in the code-fixes sprint). Non-code tasks (docs, config, planning) always skip this.
- For a task that changes source (.ts/.vue), once active: run `npm run typecheck`. The gate is: **NO newly introduced errors from your edits.** Pre-existing errors made *visible* by your change (unmasking — e.g. fixing a broken import that revealed latent errors) are EXPECTED, not a failure: record them, defer them per the plan, and do NOT silence them (`!`, `as any`, etc.). Re-baseline docs/tsc-baseline.txt to the new visible count (never ratchet UP past the current real count); later tasks ratchet it down. Run `npm run build` ONLY when the change could affect the build; it must pass.
- Record results in the task's checkpoint (and, for high-stakes, in the review file). The Reviewer reruns whatever you ran.
- Goal: zero errors once the type-cleanup work lands; the baseline only ever moves toward zero.

### Status ownership (in current-sprint.md)
- → PENDING: PM. PENDING → IN-PROGRESS (+checkpoint): Worker.
- → DONE (trivial): Worker after self-check (collapse to ✓).
- → IN-REVIEW (high-stakes): Worker after work + self-check; writes docs/plans/reviews/review-<slug>.md beginning with the sprint goal (one line) + this task's "Done when:" criteria, then the Base/Head commit hashes to review. (If a criterion is revised after this file exists, the revision must be written into the review file too — the Reviewer judges the review file.)
- IN-REVIEW → DONE (PASS, non-hw) / → HW-TEST (PASS pending hw) / → IN-PROGRESS (FAIL): Reviewer. On FAIL, the Reviewer puts full detail (stack traces, exact lines/syntax) in review-<slug>.md, then appends a high-level fix checklist to current-sprint.md under ▶ RUN THIS — one bullet per failed item, each citing its review-<slug>.md reference, prefixed "fix ONLY these". The Worker works the checklist and opens the review file only for the detail behind a bullet. A Worker NEVER marks its own high-stakes task DONE; a Reviewer NEVER marks a [hw] task DONE (it sets HW-TEST).
- HW-TEST → DONE (✓) / → IN-PROGRESS (✗): the PO decides; an agent records it (see Hardware gate). A ✗ re-enters the Task feedback loop.
- Whichever role closes a task ADVANCES ▶ RUN THIS to the next task in the same edit — the next window is pointed by the file, never by the PO having to know "what's next."

### Completion & sign-off
- Task complete = "Done when:" criteria met + committed + self-check passed where it applies (+ Reviewer PASS for high-stakes, + PO hardware ✓ for [hw]).
- Sprint complete = all tasks DONE AND the PO signs off the goal is met. The session finishing the last task flags "ALL TASKS DONE — awaiting PO sign-off" and stops; only PM-close closes it.

### Close-out & archive (PM, on PO sign-off) — ordered checklist, one close commit
Run these in order; a step is not optional because the archive "looks done." Verify each file at the end.
1. Verify the sprint is complete: all tasks DONE + done-criteria met + baseline final + any waiver marked EXPIRED.
2. Route the Findings section → backlog (curate: one line + pointer each, defect + where-to-verify, no duplicated detail).
3. Snapshot current-sprint.md → `docs/plans/archive/sprint-NN-<slug>/sprint.md` (header: goal, started/closed dates, task count, signed-off-by PO).
4. `git mv` that sprint's review files into `docs/plans/archive/sprint-NN-<slug>/` (reviews/ holds only the ACTIVE sprint's reviews; the archive folder is self-contained).
5. UPDATE every backlog (or other) pointer that referenced those reviews to the new archive path.
6. Add one row to docs/plans/index.md using its columns (NN | slug | goal | status | closed | archive); set **status = `signed off`** — you have not merged yet, that is the PO's next step. Numbers never reused. Status tokens: `signed off` (closed, not merged) · `merged` (on main) · `abandoned` (branch deleted unmerged).
7. RESET current-sprint.md to the IDLE stub (verbatim from the template's IDLE section) — the LIVE file, not the archive copy.
8. Commit all of the above together; report to the PO. The PO then merges the branch to main and deletes it.
- Verify before calling it done: open the archive sprint.md (full snapshot), current-sprint.md (IDLE stub), and backlog.md (pointers repointed). Steps 5 and 7 are the ones most easily dropped.
- Naming: PM assigns sprint-NN-<slug> at creation (NN = last index + 1; slug 2–4 kebab words); same name at archive; a revision keeps the same name.

### Hardware gate (PO owns the device; agent owns the file mechanics)
The AI cannot operate a keyboard. A [hw] task reaches HW-TEST once the Reviewer passes the code
(PASS pending hw). The PO then does the hands-on check. Fixed process:

1. Worker, at IN-REVIEW: in the review file's Hardware check section, note in plain language WHAT
   changed and WHAT to verify (not a scripted checklist).
2. PO: exercise it on a real device, then STATE the verdict in plain words ("hardware passed" /
   "hardware failed: <symptom>"). An agent does ALL the file mechanics — the PO does not hand-edit:
   - PASS → agent writes "Hardware verdict: PASS — <date>" in the review file, sets the task to DONE
     (collapse to ✓), updates the checkpoint, ADVANCES ▶ RUN THIS to the next task, and COMMITS.
   - FAIL → agent writes "Hardware verdict: FAIL — <date> → see F1" + the symptom ONCE in an F1 block
     (what you did / expected / actual), sets the task to IN-PROGRESS, puts "fix ONLY this — see
     review-<slug>.md §F1" in ▶ RUN THIS, and COMMITS. The next Worker fixes only that; a re-check follows.
3. The verdict must land on disk before any fix session — a fresh Worker window cannot see chat.

Design-intent properties are always worth a glance on hardware-affecting changes: any SparkLink
device connects with no filter added; wrappers return Error, never throw.

### Templates
Format every file you create from docs/plans/templates/: current-sprint.md ← sprint-template.md (PM; includes the `## Findings` staging section and the close checklist); review-<slug>.md ← review-template.md (Worker fills notes/hashes/hw steps; Reviewer adds the verdict; the agent records the PO's hardware verdict).
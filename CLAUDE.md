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

Hardware calls for many keys must go through `useBatchProcessing().processBatches` (src/composables): batches of 80 keys with 100ms delay between batches. Firing per-key SDK calls for a whole keyboard will overload the device — follow this pattern for any new bulk operation.

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
- PRODUCT OWNER = human: priorities; approves Worker edits in-session; runs hardware tests; sprint sign-off; revisions. Only the PO pushes, merges, deletes branches, or rewrites git history.
- PM (Planner): bookends a sprint — opens it (plans from a goal you give OR an item in docs/plans/backlog.md) and closes it (collects sign-off; archives or revises). Dormant mid-sprint. No implementation. Conduit between Worker/QA and the PO. Maintains docs/plans/backlog.md — removes the item it turns into a sprint; anyone may append a one-line bug/idea to it.
- WORKER: executes ONE task per session; self-checks; commits its own work; checkpoints; reports status into current-sprint.md.
- REVIEWER (independent QA): fresh session; checks one high-stakes task's diff vs spec; PASS/FAIL; writes the review file; NEVER edits source. The Reviewer passes the CODE; the PO passes the HARDWARE.

### Sessions (each a fresh window; entry prompt in quotes)
- PM-open — "Act as PM per CLAUDE.md. Goal: <...>" OR "Act as PM per CLAUDE.md. Plan the \"<name>\" sprint from docs/plans/backlog.md." → writes current-sprint.md (sprint goal + done-criteria; tasks each with "Done when:" criteria and a [trivial]/[high-stakes] tag, plus [hw] where a task needs on-device confirmation), seeds the first task's ▶ RUN THIS. If planning from a backlog item, reads that item and removes it from backlog.md.
- Worker — "go" → runs the session-start check, then reads current-sprint.md ▶ RUN THIS and does the next task.
- Reviewer — "follow docs/plans/reviews/review-<slug>.md" → independent PASS/FAIL.
- PM-close — "Act as PM per CLAUDE.md. All tasks DONE; assemble work + QA verdicts vs the goal for my sign-off; on acceptance archive, on rejection revise."

### Two human gates
- Operational: human approves each Worker edit in-session. Commits are NOT gated — the Worker commits freely (see Git & commits).
- Acceptance: sprint sign-off routed THROUGH the PM to the human. Work reports up via artifacts; it never jumps the chain.

### Three feedback loops
- Edit: human rejects an edit → Worker redoes it.
- Task: Reviewer FAIL (or a hardware ✗) → detail into the review file + a fix checklist into ▶ RUN THIS → IN-PROGRESS → new Worker window fixes ONLY the failed items → Reviewer re-checks only those. The Reviewer NEVER fixes.
- Sprint: PO rejects at PM-close → PM revises the sprint (same name, logged "revN (date): <change>") → Worker → PM-close. Nothing archives until PO sign-off.

### Hard rules (every session)
1. ONE task per session. Never start a second — write handoff and stop.
2. Save after every edit/finding. Never hold work only in memory.
3. CHECKPOINT CONTINUOUSLY into your role's file (Worker/PM → current-sprint.md; Reviewer → the review file). Nearing the turn/context limit, write the handoff and STOP cleanly. Never run to a crash.
4. NO sub-agents. If a task seems to need one, stop and ask the human.
5. Never dump large/minified file slices to output — read only the span you need.
6. Verify every SDK claim against docs/sdk-reference-v2.md (and protocol-keyboard/src when needed) before writing it.
7. Design intent — never change: unfiltered device selection (filters:[]), usagePage 65440 semantics, wrappers return Error (never throw).
8. Spot a bug or idea outside your task's scope? Append ONE line to docs/plans/backlog.md (don't fix it, don't read the rest of the file), then carry on. Never fix out of scope. When planning a sprint (plan mode), put that backlog line IN the plan's backlog.md changes so it's written on approval — never just drop the finding.

### Git & commits
- The Worker COMMITS its own work: one commit per task (or per fix-round), message "<sprint>: <task>". Commits are local and reversible and double as crash recovery points — commit often.
- The Worker NEVER pushes, merges, deletes branches, or rewrites history (no amend, rebase, reset, restore, clean, or branch switching). The PO does all of those manually. These are blocked in .openclaude/settings.json.
- One sprint = one branch. The PO creates it before the sprint and merges it to main on sign-off.

### Deletes & cleanup (the agent never deletes — those commands are blocked)
- Throwaway/experiment files → put them in `.scratch/` (gitignored). Never try to delete them; the PO empties `.scratch/` freely (no git needed).
- A real repo file that should be removed → MOVE it into `_to_delete/` (tracked), never delete it. The PO does the `git rm`.
- REPORT cleanup at the end of the task, in the current-sprint.md checkpoint: list anything left in `.scratch/` (PO can just delete) and anything in `_to_delete/` (PO must `git rm`). If both are empty, say "no cleanup needed." Never leave the PO to discover leftovers.

### Session start (run before any work)
1. Confirm the current branch is the sprint branch, NEVER main. If on main, STOP and report.
2. Run `git status`. If there are uncommitted changes (a crashed earlier session), STOP and report to the PO. NEVER discard uncommitted work — only the PO does that.
3. Otherwise read current-sprint.md and follow its ▶ RUN THIS block.

### Context hygiene (bounded forever)
- Read ONLY: current-sprint.md + the active task's named files + the needed sdk-reference-v2.md sections (+ the relevant template when creating a file). Never read archive/ or old sprints.
- current-sprint.md is a SNAPSHOT, not a log: overwrite it, collapse DONE tasks to one ✓ line, keep under ~150 lines.
- Completed sprints + done review files live in docs/plans/archive/ (off the read path). History = git + archive.
- This CLAUDE.md loads every session: keep it capped and curated. Add rules REACTIVELY, only when a problem recurs, by CONSOLIDATING an existing rule rather than appending. Detail/examples go in on-demand skills, not here. No standing lessons-learned file.

### QA tiers
- Worker MAY fix inline (no review) and must LOG it: typos, grammar, formatting, dead/moved links, path refs, self-created inconsistencies, lint/format.
- Every [high-stakes] task gets an independent Reviewer window. High-stakes = logic/behavior, multi-file, SDK-correctness, device/firmware-affecting, irreversible. If unsure → high-stakes.
- A [hw] task also needs the PO's hands-on hardware check after code review: the Reviewer passes the code as PASS (pending hw) → HW-TEST → the PO exercises it on a real device and marks ✓/✗ (see Hardware gate).

### Tag ownership
- The PM assigns [trivial]/[high-stakes] (and [hw]) at plan time. The Worker MAY upgrade a tag (trivial → high-stakes), NEVER downgrade.
- Any change touching KeyboardService, store/connection.ts, or the design-intent rules is ALWAYS [high-stakes], regardless of size.
- A Reviewer who finds a task mis-tagged (should have been high-stakes) auto-FAILs it back for proper review.

### Self-check gate (code tasks only)
- INACTIVE until the typecheck script + docs/tsc-baseline.txt exist (both created in the code-fixes sprint). Non-code tasks (docs, config, planning) always skip this.
- For a task that changes source (.ts/.vue), once active: run `npm run typecheck` — error count ≤ docs/tsc-baseline.txt and NO new errors in files you touched. Run `npm run build` ONLY when the change could affect the build; it must pass.
- Record results in the task's checkpoint (and, for high-stakes, in the review file). The Reviewer reruns whatever you ran.
- The baseline only ever ratchets DOWN. (Goal: zero errors once the type-cleanup work lands; until then, ≤ baseline is the gate.)

### Status ownership (in current-sprint.md)
- → PENDING: PM. PENDING → IN-PROGRESS (+checkpoint): Worker.
- → DONE (trivial): Worker after self-check (collapse to ✓).
- → IN-REVIEW (high-stakes): Worker after work + self-check; writes docs/plans/reviews/review-<slug>.md beginning with the sprint goal (one line) + this task's "Done when:" criteria, then the Base/Head commit hashes to review.
- IN-REVIEW → DONE (PASS, non-hw) / → HW-TEST (PASS pending hw) / → IN-PROGRESS (FAIL): Reviewer. On FAIL, the Reviewer puts full detail (stack traces, exact lines/syntax) in review-<slug>.md, then appends a high-level fix checklist to current-sprint.md under ▶ RUN THIS — one bullet per failed item, each citing its review-<slug>.md reference, prefixed "fix ONLY these". The Worker works the checklist and opens the review file only for the detail behind a bullet. A Worker NEVER marks its own high-stakes task DONE.
- HW-TEST → DONE (✓) / → IN-PROGRESS (✗): PO, after the hands-on check. The PO records the verdict in the review file and updates this status line (see Hardware gate). A ✗ re-enters the Task feedback loop.

### Completion & sign-off
- Task complete = "Done when:" criteria met + committed + self-check passed where it applies (+ Reviewer PASS for high-stakes, + PO hardware ✓ for [hw]).
- Sprint complete = all tasks DONE AND the PO signs off the goal is met. The session finishing the last task flags "ALL TASKS DONE — awaiting PO sign-off" and stops; only PM-close closes it.

### Close-out & archive (PM, on PO sign-off)
- Snapshot current-sprint.md → docs/plans/archive/sprint-NN-<slug>/sprint.md (header: goal, started/closed dates, task count, signed-off-by), and move that sprint's review files + resolved scratch into the same folder. Commit the move. (Git preserves the content in history either way — no special rename ceremony needed.)
- One line to docs/plans/index.md: "NN | <slug> | <goal> | closed YYYY-MM-DD | archive/sprint-NN-<slug>/". Numbers never reused.
- Reset current-sprint.md to "COMPLETE — run PM-open for the next sprint."
- Naming: PM assigns sprint-NN-<slug> at creation (NN = last index + 1; slug 2–4 kebab words); same name at archive; a revision keeps the same name.

### Hardware gate (PO owns the device)
The AI cannot operate a keyboard. A [hw] task reaches HW-TEST once the Reviewer passes the code
(PASS pending hw). The PO then does the hands-on check. Fixed process:

1. Worker, at IN-REVIEW: in the review file's Hardware check section, note in plain language WHAT
   changed and WHAT to verify (not a scripted checklist).
2. PO: exercise it on a real device, then record the verdict in the review file and update the
   task's status line in current-sprint.md — these two writes ARE the gate:
   - ✓ → in the review file write "Hardware verdict: PASS — <date>" (a note is optional); set the
     task to DONE (collapse to ✓).
   - ✗ → in the review file write "Hardware verdict: FAIL — <date> → see F1" and put the symptom
     ONCE in an F1 block (what you did / expected / actual); set the task to IN-PROGRESS and add
     "fix ONLY this — see review-<slug>.md §F1" to ▶ RUN THIS. The next Worker fixes only that; a
     re-check follows.
3. The PO edits those two files directly (the PO owns the repo). The verdict must land on disk
   before any fix session — a fresh Worker window cannot see chat.

Design-intent properties are always worth a glance on hardware-affecting changes: any SparkLink
device connects with no filter added; wrappers return Error, never throw.

### Templates
Format every file you create from docs/plans/templates/: current-sprint.md ← sprint-template.md (PM); review-<slug>.md ← review-template.md (Worker fills notes/hashes/hw steps, Reviewer adds the verdict).
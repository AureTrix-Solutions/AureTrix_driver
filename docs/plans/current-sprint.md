# SPRINT: sprint-07-tsc-errors

**GOAL:** Drive the tsc baseline from 23 errors to 0 — add the missing `*.vue` ambient shim (kills 18 TS2307) and migrate both stores' `persist.paths` → `persist.pick` for pinia-plugin-persistedstate v4 (kills 2 TS2769 + 3 cascaded TS2339), then re-baseline docs/tsc-baseline.txt to 0.
**DONE-CRITERIA (sprint):** `npm run typecheck` reports 0 errors; docs/tsc-baseline.txt records baseline 0; persistence behavior byte-identical (PO decision 2026-10-11: preserve current).
**Started:** 2026-10-11  ·  **Status:** IN PROGRESS
<!-- revN (YYYY-MM-DD): <what changed>   ← log revisions here, newest last -->

## Checkpoint
- Branch: `sprint-07-tsc-errors`
- tsc baseline: 23 errors (docs/tsc-baseline.txt) → target 0 this sprint
- Cleanup (actual ls at PM-open): `.scratch/` has pm-notes.md, tsconfig.shimcheck.json, vue-shim.d.ts (PM probe artifacts — PO may delete; the shim content is reproduced in Task 1, nothing in .scratch is load-bearing). `_to_delete/` has only .gitkeep.
<!-- Session-start check: on sprint branch (not main) + clean tree. Uncommitted changes → STOP, report.
     Do NOT record or update a commit hash here — git log is the source of truth.
     Updating a task's status REPLACES its one checkpoint line — never append a second paragraph.
     On resume, trust this checkpoint as the plan; consult only the compiler for results. -->

## ▶ RUN THIS
Next: Task 1 — add `src/types/vue-shim.d.ts`. Do this task, then stop.

## Tasks

1. **Add the `*.vue` ambient module shim** — [trivial] — STATUS: PENDING
   - Files: `src/types/vue-shim.d.ts` (new)
   - Spec (create the file with EXACTLY this content — validated this session by a PM probe run):
     ```ts
     declare module '*.vue' {
       import type { DefineComponent } from 'vue';
       const component: DefineComponent<{}, {}, any>;
       export default component;
     }
     ```
   - Why: the typecheck script is plain `tsc` (no vue-tsc in devDependencies; tsconfig `moduleResolution: "node"`, `types: ["vite/client"]`) and `vite/client.d.ts` ships NO `*.vue` declaration — verified. `src/types/webhid.d.ts` is the only existing .d.ts; tsconfig `include: ["src/**/*"]` picks the new shim up automatically. Vite itself resolves `.vue` at build time, so this is type-check-only — no runtime/build effect.
   - Done when: `npm run typecheck 2>&1 | grep -c "error TS"` prints `5` (PM probe with this exact shim: 23 → 5; the 18 TS2307 disappear).
   - Done when: `npm run typecheck 2>&1 | grep -c "TS2307"` prints `0`.
   - Done when: the remaining 5 are exactly 2× TS2769 (`profileStore.ts:9`, `travelProfilesStore.ts:9`) + 3× TS2339 `syncActiveProfileFromHardware` (`connection.ts:68`, `connection.ts:139`, `profileStore.ts:37`) — spot-check the output; any OTHER error is a surprise → STOP, report.
   - Note: Task 1 alone must NOT touch the baseline file or any store (Task 2 owns those).

2. **Migrate `persist.paths` → `persist.pick` in both stores + re-baseline to 0** — [high-stakes] — STATUS: PENDING
   - Files: `src/store/profileStore.ts`, `src/store/travelProfilesStore.ts`, `docs/tsc-baseline.txt`
   - Background (PM-verified): installed pinia-plugin-persistedstate is ^4.5.0; its types only accept `pick`/`omit` (`pick?: Path<State>[] | string[]` in dist/index.d.ts) — hence the 2 TS2769. Its RUNTIME also reads only pick/omit (dist/index.js), so `paths` is currently dead code and the FULL state persists today. The 3 TS2339 are pure cascade: `syncActiveProfileFromHardware` IS defined as an action in profileStore.ts; the failed defineStore overload wipes action inference. Fixing TS2769 fixes all 5.
   - PO decision (2026-10-11): PRESERVE CURRENT BEHAVIOR — profileStore's pick must include `activeProfileId` (not the v3-intent `['profiles']`). With pick = every state key, deepPick reproduces the same serialized object as today's full-state persist ⇒ behavior-neutral; no [hw]/browser gate needed.
   - Edit list (current text verified this session):
     1. `src/store/profileStore.ts`, persist block (after the actions block, end of file):
        current: `paths: ['profiles'],`
        → `pick: ['profiles', 'activeProfileId'],`
        (keep `key: 'keyboard-profiles',` untouched)
     2. `src/store/travelProfilesStore.ts`, persist block (end of file):
        current: `paths: ['profiles', 'selectedProfileId'],`
        → `pick: ['profiles', 'selectedProfileId'],`
        (keep `key: 'travel-profiles', // localStorage key` untouched; both keys = the store's full state ⇒ behavior-neutral)
     3. `docs/tsc-baseline.txt`: re-baseline — set the recorded count to `0` and the breakdown to none remaining; keep the file's existing header/format, update the date. (Gate rule: baseline only moves toward zero; this is the zero landing.)
   - Do NOT: install @types/w3c-web-hid (measured net +5 — see backlog/archive sprint-01 review-type-cleanup-4a.md §1); do NOT add `as any`/`!` anywhere; do NOT touch connection.ts (its 2 errors vanish via the cascade fix).
   - Done when: `npm run typecheck 2>&1 | grep -c "error TS"` prints `0`.
   - Done when: `grep -rn "paths:" src/store/` prints nothing.
   - Done when: `grep -n "pick:" src/store/profileStore.ts` shows `pick: ['profiles', 'activeProfileId'],` and same grep in travelProfilesStore.ts shows `pick: ['profiles', 'selectedProfileId'],`.
   - Done when: docs/tsc-baseline.txt records baseline 0.
   - Self-check gate applies (source change): typecheck must be 0; `npm run build` expected unaffected (type-level + a plugin option rename; esbuild strips types) — run it once to confirm since stores are core.
   - On IN-REVIEW: write `docs/plans/reviews/review-tsc-stores.md` from the review template — sprint goal (1 line) + BOTH tasks' Done-when criteria (Reviewer judges cumulatively over the base..head diff) + Base/Head hashes. Reviewer runs ONCE over both tasks.

## Findings
<!-- raw lines only — defect + where to verify; PM routes them at next touchpoint -->
- (none yet)

# SPRINT: sprint-17-code-hygiene-2

**GOAL:** Clear four code-hygiene defects — clarify the getRm6X21Travel wrapper annotation, delete the dead KeyTravel baseLayout prop cascade, and make decryptSDKConfig replicate the SDK import's `keyboards.flat()` so nested-array repairs can't silently skip.
**DONE-CRITERIA (sprint):** All three tasks DONE (Reviewer PASS each); `npm run typecheck` 0 new errors (baseline 0); `npm run build` passes; the two backlog-only observations (superResponse, -Infinity edge) are routed, not coded.
**Started:** 2026-10-24  ·  **Status:** IN PROGRESS

## Checkpoint
- Branch: `sprint-17-code-hygiene-2`
- tsc baseline: 0 errors (docs/tsc-baseline.txt)
- Cleanup: .scratch/ has pm-notes.md (PO may delete); _to_delete/ empty (from actual ls at PM-open)

## ▶ RUN THIS
Next: Task 3 — decryptSDKConfig replicates SDK import's keyboards.flat(). Do this task, then stop.

## Tasks
1. **getRm6X21Travel clarifying comment** — [high-stakes] — ✓ DONE 2026-10-24 (head `5fb626a`; Reviewer PASS, 0 fails — all 3 Done-when re-run green; see review-getRm6X21Travel-comment.md)

2. **Remove dead baseLayout prop cascade (KeyTravel → Performance binding)** — [high-stakes] — ✓ DONE 2026-10-24 (head `d85ad99`; Reviewer PASS, 0 fails — all 4 Done-when re-run green: greps 0/0/4, typecheck 0, build ✓, diff exactly 2 files −5/+0, no strays; see review-baseLayout-cascade.md)

3. **decryptSDKConfig replicates SDK import's keyboards.flat()** — [high-stakes] (SDK/import correctness) — STATUS: PENDING
   - Done when: `grep -n "cfg.keyboards = cfg.keyboards.flat()" src/services/ExportService.ts` returns one hit inside `decryptSDKConfig`.
   - Done when: `grep -c "config.keyboards ?? \[\]" src/services/ExportService.ts` → 5 (the five repair loops at ~:584/:608/:661/:696/:805 stay UNCHANGED — the fix is one site upstream of all of them).
   - Done when: `npm run typecheck` → 0 errors with NO `as any` added; `npm run build` passes.
   - Files: `src/services/ExportService.ts`
   - Edit spec (PM-verified :854-864): in `decryptSDKConfig`, replace :859 `      return JSON.parse(plaintext) as KeyboardConfig;` with:
     ```ts
     const cfg = JSON.parse(plaintext) as KeyboardConfig;
     if (Array.isArray(cfg.keyboards)) {
       cfg.keyboards = cfg.keyboards.flat();
     }
     return cfg;
     ```
     Types cleanly: `KeyboardConfig['keyboards']` is `Array<Keyboards>` (flat, validate.d.ts) so `flat()` on it returns `Keyboards[]` — no cast, no widening needed. `flat()` on an already-flat array is a safe no-op; on nested input it repairs the shape the SDK bundle itself produces (`keyboards=i.keyboards.flat()` in importEncryptedJSON, dist/esm/index.js — PM grep-verified this session).
   - Why: both-sides check passed at plan time — SDK import flattens, app decrypt did not, so IF an SDK export ever ships nested `keyboards`, all five app-side repair loops silently skip while the SDK still applies the config (divergence). Failure mode today is a safe no-op (current exports verified flat), but the fix removes the divergence class.

## Findings
<!-- one line per out-of-scope defect: DEFECT + WHERE TO VERIFY, never a fix; PM routes at close -->

## Close-out (PM)
- [ ] All tasks DONE + done-criteria met + baseline final (0) + no waivers
- [ ] Findings routed to backlog
- [ ] Snapshot → docs/plans/archive/sprint-17-code-hygiene-2/sprint.md
- [ ] Review files git mv'd into the archive folder; pointers updated
- [ ] index.md row added (status = signed off)
- [ ] current-sprint.md reset to IDLE stub (live file)
- [ ] One close commit

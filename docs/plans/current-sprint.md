# SPRINT: sprint-23-code-issues

**GOAL:** Fix the two sprint-22 code issues pinned AS-IS by tests: travelProfilesStore id collision (Date.now ids) and MappedKeyboard.batchSetKey swallowing resolved Errors.
**DONE-CRITERIA (sprint):** Both AS-IS pin tests inverted to the fixed behavior and green; `npm run test:run`, `npm run typecheck`, `npm run lint` all pass; Reviewer PASS on both tasks.
**Started:** 2026-10-29  ·  **Status:** IN PROGRESS

## Checkpoint
- Branch: `sprint-23-code-issues`
- tsc baseline: 0 errors (docs/tsc-baseline.txt) — gate: no new errors; both tasks are logic changes expected to keep 0
- Cleanup: .scratch/ has pm-notes.md (gitignored, PO may delete); _to_delete/ empty (only .gitkeep) — from actual ls at PM-open

## ▶ RUN THIS
Next: Task 2 — MappedKeyboard.batchSetKey resolved-Error detection + pin-test inversion. Do this task, then stop.

## Tasks
1. **travelProfilesStore: UUID ids** — [high-stakes] — STATUS: DONE
   - ✓ Reviewer PASS 2026-07-06 (0 fails): all 4 Done-when commands rerun green (Date.now grep empty · randomUUID count 1 · 12/12 tests · typecheck 0); diff scope = exactly the 2 task files; AS-IS pin correctly inverted; design intent untouched. Commit 1688d4a; detail in docs/plans/reviews/review-travel-uuid-ids.md.

2. **batchSetKey: detect resolved Errors** — [high-stakes] — STATUS: PENDING
   - Done when: `grep -c "instanceof Error" src/utils/MappedKeyboard.ts` returns 3 (was 2)
   - Done when: `npx vitest run src/utils/__tests__/MappedKeyboard.batch-watch.test.ts` → 8 tests pass (0 fail)
   - Done when: `npm run test:run` → full suite green
   - Done when: `npm run typecheck` exits 0
   - Files: `src/utils/MappedKeyboard.ts`, `src/utils/__tests__/MappedKeyboard.batch-watch.test.ts`
   - Background (PM-verified): `KeyboardService.setKey` is `Promise<void | Error>` — returns Error, never throws (house convention). batchSetKey's try/catch only catches throws, so a resolved Error passes as success. fetchLayerLayout in the same file already models the fix pattern (`if (newBaseLayout instanceof Error)`). All 3 KeyMapping.vue callers wrap batchSetKey in try/catch → a rejection lands in their existing error handling; NO caller edits. The 5 other batchSetKey tests use `mockResolvedValue(undefined)` → unaffected. The existing 'setKey rejects on batch 1' test stays green: fix routes through the SAME catch (same message 'Failed to set key batch', same cause identity, same console.error line).
   - Edits:
     1. MappedKeyboard.ts — in `batchSetKey`, inside the try block replace (exact current text):
        `        await KeyboardService.setKey(batch);`
        with:
        ```
        const result = await KeyboardService.setKey(batch);
        if (result instanceof Error) throw result;
        ```
        (the existing catch then logs + wraps identically for BOTH failure paths)
     2. test — replace the whole AS-IS pin test (current name: 'AS-IS pin: setKey RESOLVING an Error is not detected — all batches run, no throw (Findings candidate b)') with the FIXED-behavior version:
        ```
        it('setKey RESOLVING an Error is detected: rejects with cause, later batches do NOT run', async () => {
          const busy = new Error('device busy');
          setKeyMock.mockResolvedValue(busy);
          const { kb } = setup();

          const rejection = await kb.batchSetKey(makeConfigs(25)).then(
            () => null,
            (e: unknown) => e as Error
          );

          expect(rejection).toBeInstanceOf(Error);
          expect(rejection?.message).toBe('Failed to set key batch');
          expect(rejection?.cause).toBe(busy);
          expect(setKeyMock).toHaveBeenCalledTimes(1); // resolved Error aborts the loop
          expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
          expect(consoleErrorSpy.mock.calls[0][0]).toBe('Batch setKey failed for keys 0 to 9:');
        });
        ```
   - Self-check: the 4 Done-when commands above.
   - On complete (high-stakes): write `docs/plans/reviews/review-batchsetkey-resolved-error.md` from the review template, set STATUS: IN-REVIEW, advance ▶ RUN THIS to Reviewer for Task 2.

## Findings
<!-- Out-of-scope bugs/ideas: ONE line each (defect + where to verify). No fixes here. -->
(none yet)

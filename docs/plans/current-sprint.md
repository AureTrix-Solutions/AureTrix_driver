# SPRINT: sprint-23-code-issues

**GOAL:** Fix the two sprint-22 code issues pinned AS-IS by tests: travelProfilesStore id collision (Date.now ids) and MappedKeyboard.batchSetKey swallowing resolved Errors.
**DONE-CRITERIA (sprint):** Both AS-IS pin tests inverted to the fixed behavior and green; `npm run test:run`, `npm run typecheck`, `npm run lint` all pass; Reviewer PASS on both tasks.
**Started:** 2026-10-29  ·  **Status:** IN PROGRESS

## Checkpoint
- Branch: `sprint-23-code-issues`
- tsc baseline: 0 errors (docs/tsc-baseline.txt) — gate: no new errors; both tasks are logic changes expected to keep 0
- Cleanup: .scratch/ has pm-notes.md (gitignored, PO may delete); _to_delete/ empty (only .gitkeep) — from actual ls at PM-open

## ▶ RUN THIS
Next: Task 1 — travelProfilesStore UUID ids + test updates. Do this task, then stop.

## Tasks
1. **travelProfilesStore: UUID ids** — [high-stakes] — STATUS: PENDING
   - Done when: `grep -n "Date.now" src/store/travelProfilesStore.ts` returns nothing
   - Done when: `grep -c "crypto.randomUUID" src/store/travelProfilesStore.ts` returns 1
   - Done when: `npx vitest run src/store/__tests__/travelProfiles.test.ts` → 12 tests pass (0 fail)
   - Done when: `npm run typecheck` exits 0
   - Files: `src/store/travelProfilesStore.ts`, `src/store/__tests__/travelProfiles.test.ts`
   - Background (PM-verified): ids are opaque strings everywhere — SwitchProfiles.vue uses them as select values/keys, KeyTravel.vue + RapidTrigger.vue only read selectedProfile; nothing parses the id as a timestamp; persisted localStorage ids unaffected (new ids just look different). `crypto.randomUUID()` typechecks (lib.dom) and exists in Node 22 (vitest node env); fake timers do NOT mock it. Consumers verified → NO edits needed outside the 2 files.
   - Edits:
     1. travelProfilesStore.ts — in `addProfile(switchName: string, maxTravel: number) {`, replace (exact current text):
        `      const id = Date.now().toString(); // Simple ID; use UUID if needed`
        with:
        `      const id = crypto.randomUUID();`
     2. test T3 "selectedProfile returns the profile after selectProfile" — replace body lines:
        ```
        vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
        store.addProfile('Fast', 3.5);
        const id = String(Date.now());
        ```
        with:
        ```
        store.addProfile('Fast', 3.5);
        const id = store.profiles[0].id;
        ```
     3. test T4 — replace whole test (current name: 'addProfile uses the current ms timestamp as id, appends, and auto-selects'):
        ```
        it('addProfile assigns a UUID id, appends, and auto-selects', () => {
          const store = useTravelProfilesStore();
          store.addProfile('Slow', 4.0);
          expect(store.profiles).toHaveLength(1);
          expect(store.profiles[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
          expect(store.profiles[0].switchName).toBe('Slow');
          expect(store.profiles[0].maxTravel).toBe(4.0);
          expect(store.selectedProfileId).toBe(store.profiles[0].id);
        });
        ```
     4. test T5 'two adds at different mocked times get distinct ids' — rename to 'two adds get distinct ids' and delete the two `vi.setSystemTime(...)` lines; keep the rest (addProfile A/B + distinct-id + selectedProfileId asserts) unchanged.
     5. test T6 (the AS-IS pin, current name: 'AS-IS pin: two adds within the SAME mocked ms produce identical ids (Findings candidate a)') — replace whole test with the FIXED-behavior version:
        ```
        it('two adds back-to-back get distinct ids (was AS-IS pin: same-ms collision)', () => {
          const store = useTravelProfilesStore();
          store.addProfile('A', 1.0);
          store.addProfile('B', 2.0);
          expect(store.profiles).toHaveLength(2);
          expect(store.profiles[0].id).not.toBe(store.profiles[1].id);
        });
        ```
     - LEAVE ALONE: beforeEach/afterEach fake timers and the `vi.setSystemTime(...)` calls in T7–T12 — harmless with UUID ids (crypto.randomUUID is not timer-mocked); removing them would add 10 edit sites for zero behavior change.
   - Self-check: the 4 Done-when commands above.
   - On complete (high-stakes): write `docs/plans/reviews/review-travel-id-uuid.md` from the review template (sprint goal + Done-when list + Base/Head hashes + what changed), set STATUS: IN-REVIEW, advance ▶ RUN THIS to Reviewer for Task 1.

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

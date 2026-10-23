# SPRINT: sprint-14-code-hygiene

**GOAL:** Clear three routed hygiene items: fix the real functional bug — GlobalTravel "Select to Global" must write the current UI settings (global travel + DpDr), not the re-fetched Global-DB register; add the missing `instanceof Error` guard at all three `getBaseInfo()` call sites in store/connection.ts; delete the dead `baseLayout` props from SingleKeyTravel.vue and SwitchProfiles.vue (and both KeyTravel bindings).
**DONE-CRITERIA (sprint):** All 3 tasks DONE (Task 1: Reviewer PASS + PO hardware ✓; Tasks 2–3: Reviewer PASS), `npm run typecheck` stays at 0 errors, `npm run lint` exit 0, Findings routed at close.
**Started:** 2026-10-23  ·  **Status:** IN PROGRESS

## Checkpoint
- Branch: `sprint-14-code-hygiene`
- tsc baseline: 0 errors (docs/tsc-baseline.txt; gate ACTIVE — every task must keep typecheck at 0)
- Cleanup: .scratch/ has pm-notes.md (PO may delete); _to_delete/ empty (from actual `ls`, PM-open 2026-10-23)

## ▶ RUN THIS
Next: Task 1 — GlobalTravel Select-to-Global value source. Do this task, then stop.

## Tasks
1. **GlobalTravel Select-to-Global writes UI settings instead of Global-DB register** — [high-stakes][hw] — STATUS: PENDING
   - Files: `src/components/performance/GlobalTravel.vue`
   - Defect (backlog, PO finding 2026-10-23): `setKeyToGlobalMode` re-fetches `getGlobalTouchTravel()` (the device Global-DB register) and applies THAT to selected keys — ignoring the current UI state in the `globalTravel`/`pressDead`/`releaseDead` refs (which `updateGlobalSettings` persists on every @change, so the refs are the authoritative "current global travel + DpDr UI settings").
   - Units confirmed both sides (sdk-ref §5.1 Verified): refs are mm; `setSingleTravel`/`setDp`/`setDr` take mm; no scaling at this layer. Refs are always numbers (init 2.0/0.2/0.2) → the NaN guard dies with step 1.
   - **Edit 1** — replace the whole step-1 block (grep `Step 1: Fetch current global settings`; current text runs from that comment through `// Step 2: Apply global values to each key before switching mode`, i.e. the fetch, the `instanceof Error` throw, the three `Number(globalSettingsResult.X)` reads, and the `isNaN(...)` throw) with:
     ```ts
        // Step 1: Source values from the current UI settings (refs), not the Global-DB register
        const globalTravelValue = globalTravel.value;
        const globalPressDead = pressDead.value;
        const globalReleaseDead = releaseDead.value;
        
        // Step 2: Apply global values to each key before switching mode
     ```
   - **Edit 2** — delete the now-dead self-assign sync block (grep `Sync UI state with the values we just applied`): that comment + the 3 lines `globalTravel.value = globalTravelValue;` / `pressDead.value = globalPressDead;` / `releaseDead.value = globalReleaseDead;`. Leave the surrounding blank lines tidy. Step 2's processBatches body and the `emit('update-overlay', ...)` block are UNCHANGED (they consume the same three locals).
   - Done when: `grep -c "getGlobalTouchTravel" src/components/performance/GlobalTravel.vue` → 2 (loadGlobalSettings comment + call only)
   - Done when: `grep -n "globalSettingsResult\|Invalid global settings\|Failed to fetch global settings\|Sync UI state" src/components/performance/GlobalTravel.vue` → nothing
   - Done when: `grep -c "const globalTravelValue = globalTravel.value" src/components/performance/GlobalTravel.vue` → 1
   - Done when: `npm run typecheck` → 0 errors (baseline stays 0); `npm run lint` exit 0
   - Self-check: run typecheck; commit `sprint-14-code-hygiene: task 1`; write review-globaltravel-select.md (goal + Done-whens + Base/Head) and set IN-REVIEW. [hw]: in the review file's Hardware check section note in plain language — select keys, set global travel/DpDr values in the UI, press "Select to Global", confirm the selected keys actuate at the UI values (not a stale device register).

2. **connection.ts getBaseInfo() missing instanceof Error check** — [high-stakes] — STATUS: PENDING
   - Files: `src/store/connection.ts` (touches store/connection.ts → always high-stakes per CLAUDE.md)
   - Defect: `KeyboardService.getBaseInfo()` RETURNS `Error` (never throws — wrapper convention). All 3 call sites spread it straight into `deviceInfo` (an Error's own props are non-enumerable → spreads as `{}`), so on failure deviceInfo silently lacks base fields and the status line reports the SUCCESS string. The surrounding try/catch never fires for this path; it STAYS for real throws.
   - Apply the same shape at all 3 sites — `autoConnect()`, `connectDevice()`, `onAutoConnectSuccess()`. Each currently reads (grep `await KeyboardService.getBaseInfo()`):
     ```ts
     const info = await KeyboardService.getBaseInfo();
     console.log('Base info:', info); // Essential for debugging device details
     this.deviceInfo = { ...this.deviceInfo, ...info };
     this.status = `<success string>`;
     ```
     Replace the last two lines at each site with:
     ```ts
     if (info instanceof Error) {
       this.status = `<degraded string>`;
     } else {
       this.deviceInfo = { ...this.deviceInfo, ...info };
       this.status = `<success string>`;
     }
     ```
     Keep the `console.log` line as-is. Strings per site (grep-verified, reuse verbatim — the degraded string is the one already in that site's catch):
     - `autoConnect()` — success `` `Auto-connected to ${this.deviceInfo.productName} with ID ${this.deviceInfo.id}` `` / degraded `` `Auto-connected to ${this.deviceInfo.productName}, but failed to load details.` ``
     - `connectDevice()` — success `` `Connected to ${this.deviceInfo.productName} with ID ${this.deviceInfo.id}` `` / degraded `` `Connected to ${this.deviceInfo?.productName}, but failed to load details.` `` (keep the `?.` — matches this site's catch)
     - `onAutoConnectSuccess()` — success `` `Auto-connected to ${this.deviceInfo.productName} with ID ${this.deviceInfo.id}` `` / degraded `` `Auto-connected to ${this.deviceInfo.productName}, but failed to load details.` ``
   - Done when: `grep -c "if (info instanceof Error)" src/store/connection.ts` → 3
   - Done when: `grep -c "console.log('Base info:', info)" src/store/connection.ts` → 3 (kept)
   - Done when: `npm run typecheck` → 0 errors; `npm run lint` exit 0
   - Self-check: run typecheck; commit `sprint-14-code-hygiene: task 2`; write review-connection-getbaseinfo.md; set IN-REVIEW.

3. **Delete dead baseLayout props (SingleKeyTravel + SwitchProfiles + both parent bindings)** — [high-stakes] — STATUS: PENDING
   - Files: `src/components/performance/SingleKeyTravel.vue`, `src/components/performance/SwitchProfiles.vue`, `src/components/performance/KeyTravel.vue` (multi-file → high-stakes; pure deletion, no device behavior → no [hw])
   - Verified dead in BOTH children: `baseLayout` appears ONLY in each child's prop declaration — never in template or setup (grep `baseLayout` in each → declaration block only). `import type { IDefKeyInfo }` STAYS in both files (still used by `layout` and `selectedKeys` props — grep `PropType<IDefKeyInfo` → 2 other uses each).
   - SCOPE CAP (PO decision 2026-10-23): prop + binding deletions ONLY. Removing both children's props leaves KeyTravel's OWN `baseLayout` prop with no consumer → that becomes dead, and the cascade up to Performance.vue / useMappedKeyboard is a SEPARATE multi-file change — do NOT touch it here (it's a backlog line). KeyTravel keeps its own `baseLayout` prop this sprint.
   - **Edit 1** — SingleKeyTravel.vue: delete the prop block (grep `baseLayout: {`):
     ```ts
    baseLayout: {
      type: Object as PropType<IDefKeyInfo[][] | null>,
      default: null,
    },
     ```
   - **Edit 2** — SwitchProfiles.vue: delete the IDENTICAL prop block (grep `baseLayout: {`):
     ```ts
    baseLayout: {
      type: Object as PropType<IDefKeyInfo[][] | null>,
      default: null,
    },
     ```
   - **Edit 3** — KeyTravel.vue: delete BOTH `:base-layout="baseLayout"` lines (grep `:base-layout="baseLayout"` → 2 hits): the one in `<SingleKeyTravel ...>` AND the one in `<SwitchProfiles ...>`. Both children now lack the prop, so both bindings go. KeyTravel's own `baseLayout` prop declaration STAYS (scope cap above).
   - Done when: `grep -n "baseLayout" src/components/performance/SingleKeyTravel.vue` → nothing
   - Done when: `grep -n "baseLayout" src/components/performance/SwitchProfiles.vue` → nothing
   - Done when: `grep -c ':base-layout="baseLayout"' src/components/performance/KeyTravel.vue` → 0
   - Done when: `grep -c "baseLayout: {" src/components/performance/KeyTravel.vue` → 1 (KeyTravel's OWN prop untouched)
   - Done when: `npm run typecheck` → 0 errors; `npm run lint` exit 0
   - Self-check: run typecheck; commit `sprint-14-code-hygiene: task 3`; write review-baselayout-prop.md; set IN-REVIEW.

## Findings
<!-- One line per out-of-scope defect: DEFECT + WHERE TO VERIFY. PM routes at close. -->
- <none yet — the SwitchProfiles dead-baseLayout item was folded into task 3 (PO decision 2026-10-23); the KeyTravel dead-prop cascade it creates is already a backlog line; do not re-file either>

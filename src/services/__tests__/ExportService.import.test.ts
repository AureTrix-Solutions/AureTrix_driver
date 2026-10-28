// ExportService import-side suite (sprint-21 Task 2a): importProfile happy path + guards.
// Headless software-contract pinning — mocks never claim device behavior.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../KeyboardService', async () => {
  const { buildKeyboardServiceMock } = await import('./exportservice-helpers');
  return { default: buildKeyboardServiceMock() };
});

import KeyboardService from '../KeyboardService';
import ExportService from '../ExportService';
import type { Keyboards } from '@sparklinkplayjoy/sdk-keyboard/dist/esm/src/utils/validate';
import {
  applyExportDefaults,
  makeConfig,
  makeEncryptedFile,
  makeKeyboardEntry,
  makeLightMode,
  makeLocalStorage,
  PRE_SWITCH_EXPECTED,
  SDK_FORMAT_STATIC,
  EXPECTED_ADV,
  EXPECTED_PERF,
  type KeyboardServiceMock,
} from './exportservice-helpers';

// The mocked module default IS the helper-built mock object; the cast is exact at runtime.
const ks = KeyboardService as unknown as KeyboardServiceMock;

// F1 fake-timer pattern: every sleeping path (250ms pre-switch settle, 1000ms
// post-import wait, batch delays, RGB retry backoffs) runs through vi.runAllTimersAsync.
async function runImport(file: File) {
  vi.useFakeTimers();
  try {
    const pending = ExportService.importProfile(file);
    await vi.runAllTimersAsync();
    return await pending;
  } finally {
    vi.useRealTimers();
  }
}

// runImport variant that captures setTimeout delays for the 2c sleep pins
// (ensureCustomModeReady 400ms backoff, writeVerifiedCustomRgb 200/400ms).
// Spy installed AFTER useFakeTimers so it wraps the fake — runAllTimersAsync
// still drives every sleep. Delays are SNAPSHOTTED inside the try: mockRestore
// in the finally clears mock.calls, so returning the live spy reads back [].
async function runImportSpyingTimers(file: File) {
  vi.useFakeTimers();
  const timerSpy = vi.spyOn(globalThis, 'setTimeout');
  try {
    const pending = ExportService.importProfile(file);
    await vi.runAllTimersAsync();
    return { result: await pending, delays: timerSpy.mock.calls.map(c => c[1] as number) };
  } finally {
    timerSpy.mockRestore();
    vi.useRealTimers();
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  applyExportDefaults(ks);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('importProfile', () => {
  // Happy-path fixture: repair gates need per-key advancedType — key65 'end',
  // key66 'socd' (default makeConfig is 'dks', which gates socd/end repairs off).
  function makeImportConfig() {
    return makeConfig({
      keyboards: [
        makeKeyboardEntry({
          keyValue: 65, row: 0, col: 0,
          advancedKeys: { ...EXPECTED_ADV, advancedType: 'end' },
          performance: { ...EXPECTED_PERF, isGlobalTriggering: true },
        }),
        makeKeyboardEntry({
          keyValue: 66, row: 0, col: 1,
          advancedKeys: { ...EXPECTED_ADV, advancedType: 'socd' },
          performance: { ...EXPECTED_PERF, isGlobalTriggering: true },
        }),
      ],
    });
  }

  it('happy path: imports, restores MacroList, runs all repairs, main lighting LAST', async () => {
    const ls = makeLocalStorage();
    vi.stubGlobal('localStorage', ls);
    // Custom-mode readback succeeds on attempt 1 — keeps ensureCustomModeReady
    // off the retry path (2c pins that state machine).
    ks.getLighting.mockResolvedValue(makeLightMode({ mode: 21, type: 'custom' }));

    const file = makeEncryptedFile(makeImportConfig());
    const result = await runImport(file);

    expect(result).toEqual({ success: true });
    expect(ks.importConfig).toHaveBeenCalledTimes(1);
    expect(ks.importConfig.mock.calls[0][0]).toBe(file);
    // Pre-switch setLighting call #1 = PRE_SWITCH_EXPECTED (V5 shape).
    expect(ks.setLighting.mock.calls[0][0]).toEqual(PRE_SWITCH_EXPECTED);
    // MacroList restored after success (snapshot was '["local"]').
    expect(ls.setItem).toHaveBeenCalledWith('MacroList', '["local"]');

    // Repairs ran (fixture gates: key65 'end', key66 'socd', both global-triggering).
    expect(ks.setDksTravel).toHaveBeenCalledWith(65, 33, 'Layout_DB3');
    expect(ks.setDksTravel).toHaveBeenCalledWith(66, 33, 'Layout_DB3');
    expect(ks.setDp).toHaveBeenCalledWith(65, 30);
    expect(ks.setDr).toHaveBeenCalledWith(65, 40);
    expect(ks.setDp).toHaveBeenCalledWith(66, 30);
    expect(ks.setDr).toHaveBeenCalledWith(66, 40);
    expect(ks.setSpecialLighting).toHaveBeenCalledWith(SDK_FORMAT_STATIC);
    expect(ks.setSocd).toHaveBeenCalledTimes(1); // only key66 (advancedType 'socd')
    expect(ks.setSocd).toHaveBeenCalledWith(EXPECTED_ADV.socd, '1.0.7');
    expect(ks.setEND).toHaveBeenCalledTimes(1); // only key65 (advancedType 'end')
    expect(ks.setEND).toHaveBeenCalledWith({ key: 65, dks: 3, delay: 250 }, '1.0.7');
    expect(ks.setCustomLighting).toHaveBeenCalledTimes(2); // keys 65 + 66, verify-OK
    expect(ks.setCustomLighting).toHaveBeenCalledWith({ key: 65, r: 1, g: 2, b: 3 });
    expect(ks.setCustomLighting).toHaveBeenCalledWith({ key: 66, r: 1, g: 2, b: 3 });
    expect(ks.saveCustomLighting).toHaveBeenCalledTimes(1);

    // F2-1: repairMainLighting is the LAST setLighting; no ensure-mode re-command
    // happened (probe succeeded attempt 1), so exactly 2 calls: pre-switch + main.
    expect(ks.setLighting).toHaveBeenCalledTimes(2);
    const mainCall = ks.setLighting.mock.calls[1][0];
    expect(mainCall).toEqual(SDK_FORMAT_STATIC);
    // Repair ORDER: main-lighting restore strictly after the special-lighting repair.
    const specialOrder = ks.setSpecialLighting.mock.invocationCallOrder[0];
    const mainOrder = ks.setLighting.mock.invocationCallOrder[1];
    expect(mainOrder).toBeGreaterThan(specialOrder);
  });

  it('importConfig Error → {success:false, error:message} and MacroList RESTORED (F-R1 finally)', async () => {
    const ls = makeLocalStorage();
    vi.stubGlobal('localStorage', ls);
    ks.importConfig.mockResolvedValueOnce(new Error('device disconnected'));

    const result = await runImport(makeEncryptedFile(makeImportConfig()));

    expect(result).toEqual({ success: false, error: 'device disconnected' });
    // F-R1: the failure return passes through the finally — snapshot restored.
    expect(ls.setItem).toHaveBeenCalledWith('MacroList', '["local"]');
    // Early return: no decrypt, no repairs.
    expect(ks.setDksTravel).not.toHaveBeenCalled();
    expect(ks.saveCustomLighting).not.toHaveBeenCalled();
  });

  it('importConfig {success:false, error:"boom"} → error "boom" + MacroList restored', async () => {
    const ls = makeLocalStorage();
    vi.stubGlobal('localStorage', ls);
    ks.importConfig.mockResolvedValueOnce({ success: false, error: 'boom' });

    const result = await runImport(makeEncryptedFile(makeImportConfig()));

    expect(result).toEqual({ success: false, error: 'boom' });
    expect(ls.setItem).toHaveBeenCalledWith('MacroList', '["local"]');
  });

  it('importConfig {success:false} with no error field → "Import failed" + MacroList restored', async () => {
    const ls = makeLocalStorage();
    vi.stubGlobal('localStorage', ls);
    ks.importConfig.mockResolvedValueOnce({ success: false });

    const result = await runImport(makeEncryptedFile(makeImportConfig()));

    expect(result).toEqual({ success: false, error: 'Import failed' });
    expect(ls.setItem).toHaveBeenCalledWith('MacroList', '["local"]');
  });

  it('absent MacroList (null snapshot) → removeItem called, not setItem (F-R1 else-branch)', async () => {
    // Empty presets → getItem returns null for any key (helper: store.has check).
    const ls = makeLocalStorage({});
    vi.stubGlobal('localStorage', ls);

    const result = await runImport(makeEncryptedFile(makeImportConfig()));

    expect(result).toEqual({ success: true });
    // Snapshot was null → finally must REMOVE (not write back null).
    expect(ls.removeItem).toHaveBeenCalledWith('MacroList');
    expect(ls.setItem).not.toHaveBeenCalled();
  });

  it('garbage file text → decryptSDKConfig null → {success:true}, no repairs, logged, MacroList restored', async () => {
    const ls = makeLocalStorage();
    vi.stubGlobal('localStorage', ls);
    const errSpy = vi.spyOn(console, 'error');
    // SDK import itself succeeds; only the post-import decrypt/repairs are skipped.
    const garbage = new File(['not json'], 'garbage.json', { type: 'application/json' });

    const result = await runImport(garbage);

    expect(result).toEqual({ success: true });
    expect(errSpy).toHaveBeenCalledWith('Failed to decrypt SDK export:', expect.any(Error));
    // config === null → repair block skipped entirely; but the F-R1 finally still ran.
    expect(ks.setDksTravel).not.toHaveBeenCalled();
    expect(ks.setSocd).not.toHaveBeenCalled();
    expect(ks.setCustomLighting).not.toHaveBeenCalled();
    expect(ks.saveCustomLighting).not.toHaveBeenCalled();
    expect(ls.setItem).toHaveBeenCalledWith('MacroList', '["local"]');
  });

  // Spec 2b said "getLighting Error → console.error('Failed to switch to custom mode:')".
  // Source says otherwise (grep `async importProfile`): getLighting Error SKIPS the whole
  // pre-switch block silently; that log fires only on setLighting Error. Both branches
  // pinned here, source-faithful (2a precedent).
  it('pre-switch getLighting Error → setLighting NOT called, no log, import CONTINUES {success:true}', async () => {
    const ls = makeLocalStorage();
    vi.stubGlobal('localStorage', ls);
    const errSpy = vi.spyOn(console, 'error');
    ks.getLighting.mockResolvedValueOnce(new Error('read failed'));

    const result = await runImport(makeEncryptedFile(makeImportConfig()));

    expect(result).toEqual({ success: true });
    // Pre-switch skipped: NO setLighting before importConfig. (Shape can't discriminate —
    // ensureCustomModeReady re-issues the same mode-21/custom switch during RGB repair;
    // only invocation ORDER distinguishes the pre-switch.)
    expect(ks.setLighting.mock.invocationCallOrder[0] ?? Infinity).toBeGreaterThan(
      ks.importConfig.mock.invocationCallOrder[0]
    );
    expect(errSpy).not.toHaveBeenCalledWith('Failed to switch to custom mode:', expect.anything());
    // Import proceeded normally — first repair fired.
    expect(ks.setDksTravel).toHaveBeenCalledWith(65, 33, 'Layout_DB3');
  });

  it('pre-switch setLighting Error → logs "Failed to switch to custom mode:", skips 250ms settle, import CONTINUES', async () => {
    const ls = makeLocalStorage();
    vi.stubGlobal('localStorage', ls);
    const errSpy = vi.spyOn(console, 'error');
    ks.setLighting.mockResolvedValueOnce(new Error('switch refused'));

    const result = await runImport(makeEncryptedFile(makeImportConfig()));

    expect(result).toEqual({ success: true });
    expect(errSpy).toHaveBeenCalledWith('Failed to switch to custom mode:', 'switch refused');
    // Error branch skips the settle sleep — the trailing repair setLighting still lands.
    expect(ks.setLighting).toHaveBeenCalledWith(SDK_FORMAT_STATIC);
    expect(ks.setDksTravel).toHaveBeenCalledWith(65, 33, 'Layout_DB3');
  });

  // ---- Task 2c: decryptSDKConfig flatten + RGB-repair state machine ----

  it('nested keyboards [[e65],[e66]] → decryptSDKConfig flattens → both keys RGB-repaired', async () => {
    const ls = makeLocalStorage();
    vi.stubGlobal('localStorage', ls);
    // SDK exports have shipped keyboards as nested arrays; decryptSDKConfig
    // flattens (cfg.keyboards.flat()) so repairCustomRgb sees real entries.
    // Without the flatten, entries would be arrays → light undefined → skipped.
    const cfg = makeConfig({
      keyboards: [
        [makeKeyboardEntry({ keyValue: 65, row: 0, col: 0 })],
        [makeKeyboardEntry({ keyValue: 66, row: 0, col: 1 })],
      ] as unknown as Keyboards[],
    });

    const result = await runImport(makeEncryptedFile(cfg));

    expect(result).toEqual({ success: true });
    expect(ks.setCustomLighting).toHaveBeenCalledWith({ key: 65, r: 1, g: 2, b: 3 });
    expect(ks.setCustomLighting).toHaveBeenCalledWith({ key: 66, r: 1, g: 2, b: 3 });
  });

  it('no valid custom.R (non-number) → rgbMap empty → ensure SKIPPED, saveCustomLighting still runs', async () => {
    const ls = makeLocalStorage();
    vi.stubGlobal('localStorage', ls);
    // repairCustomRgb filters entries whose light.custom.R is not a number;
    // with an empty rgbMap it returns BEFORE ensureCustomModeReady, so the
    // import path's ONLY getLighting call is the pre-switch probe.
    const cfg = makeConfig({
      keyboards: [
        makeKeyboardEntry({ keyValue: 65, row: 0, col: 0, light: { custom: { R: 'x' as unknown as number, G: 2, B: 3, key: 65 } } }),
        makeKeyboardEntry({ keyValue: 66, row: 0, col: 1, light: { custom: { R: 'y' as unknown as number, G: 2, B: 3, key: 66 } } }),
      ],
    });

    const result = await runImport(makeEncryptedFile(cfg));

    expect(result).toEqual({ success: true });
    expect(ks.getLighting).toHaveBeenCalledTimes(1); // pre-switch only — no ensure probes
    expect(ks.setCustomLighting).not.toHaveBeenCalled();
    expect(ks.saveCustomLighting).toHaveBeenCalledTimes(1); // unconditional after repairs
  });

  it('ensureCustomModeReady: probe reads mode 21 → immediate success, NO re-command, NO 400ms backoff', async () => {
    const ls = makeLocalStorage();
    vi.stubGlobal('localStorage', ls);
    // Device already reports custom mode when the repair probes it.
    ks.getLighting.mockResolvedValue(makeLightMode({ mode: 21, type: 'custom' }));
    const { result, delays } = await runImportSpyingTimers(makeEncryptedFile(makeImportConfig()));
    expect(result).toEqual({ success: true });
    // getLighting: pre-switch probe + exactly 1 ensure probe (mode 21 → return true).
    expect(ks.getLighting).toHaveBeenCalledTimes(2);
    // setLighting: pre-switch + trailing main-lighting repair only — ensure
    // issues no mode re-command when the first probe already reads 21.
    expect(ks.setLighting).toHaveBeenCalledTimes(2);
    // No 400ms ensure-backoff sleep (only the fixed 250 settle + 1000 wait + batch delays).
    expect(delays).not.toContain(400);
    expect(delays).toContain(250); // sanity: the spy DOES capture sleeps
    expect(ks.setCustomLighting).toHaveBeenCalledWith({ key: 65, r: 1, g: 2, b: 3 });
  });

  it('ensureCustomModeReady retry: probe mode 0 → re-command → 400ms sleep → probe mode 21 → success', async () => {
    const ls = makeLocalStorage();
    vi.stubGlobal('localStorage', ls);
    // Import path getLighting order: pre-switch probe, then ensure probes.
    // Ensure probe #1 reads mode 0 (not settled yet) → re-command + 400×1 sleep;
    // probe #2 reads 21 → true. No exhausted log.
    ks.getLighting
      .mockResolvedValueOnce(makeLightMode({ mode: 0, type: 'static' })) // pre-switch
      .mockResolvedValueOnce(makeLightMode({ mode: 0, type: 'static' })) // ensure probe 1
      .mockResolvedValue(makeLightMode({ mode: 21, type: 'custom' }));   // ensure probe 2+
    // console.error already spied+silenced by beforeEach; afterEach restores.
    const errSpy = console.error as unknown as ReturnType<typeof vi.fn>;
    const { result, delays } = await runImportSpyingTimers(makeEncryptedFile(makeImportConfig()));
    expect(result).toEqual({ success: true });
    // 3 probes total (pre-switch + 2 ensure), not 5 — retry succeeded on attempt 2.
    expect(ks.getLighting).toHaveBeenCalledTimes(3);
    // Exactly ONE ensure re-command: pre-switch + re-command + main-lighting repair = 3.
    expect(ks.setLighting).toHaveBeenCalledTimes(3);
    // Re-command is post-import (order discriminator from 2b).
    const reCommandOrder = ks.setLighting.mock.invocationCallOrder[1];
    expect(reCommandOrder).toBeGreaterThan(ks.importConfig.mock.invocationCallOrder[0]);
    // One 400ms backoff (attempt 1); no second-attempt 800.
    expect(delays).toContain(400);
    expect(delays).not.toContain(800);
    expect(errSpy).not.toHaveBeenCalledWith(
      'Custom mode not confirmed after import settle window; RGB writes proceed best-effort'
    );
    expect(ks.setCustomLighting).toHaveBeenCalledWith({ key: 65, r: 1, g: 2, b: 3 });
  });

  it('ensureCustomModeReady exhausted: all probes mode 0 → 5 probes/4 re-commands, 400+800+1200+1600 backoffs, exhausted log, RGB still best-effort', async () => {
    const ls = makeLocalStorage();
    vi.stubGlobal('localStorage', ls);
    // applyExportDefaults getLighting is mode 0 → every ensure probe fails;
    // attempt 5 BREAKS before re-commanding (5 probes, only 4 re-commands).
    const errSpy = console.error as unknown as ReturnType<typeof vi.fn>;
    const { result, delays } = await runImportSpyingTimers(makeEncryptedFile(makeImportConfig()));
    expect(result).toEqual({ success: true }); // exhausted is non-fatal
    // 6 getLighting = 1 pre-switch + 5 ensure probes.
    expect(ks.getLighting).toHaveBeenCalledTimes(6);
    // 6 setLighting = 1 pre-switch + 4 ensure re-commands + 1 main-lighting repair.
    expect(ks.setLighting).toHaveBeenCalledTimes(6);
    // Backoff 400×attempt after each non-final attempt: 400, 800, 1200, 1600.
    expect(delays).toContain(400);
    expect(delays).toContain(800);
    expect(delays).toContain(1200);
    expect(delays).toContain(1600);
    expect(errSpy).toHaveBeenCalledWith(
      'Custom mode not confirmed after import settle window; RGB writes proceed best-effort'
    );
    // Best-effort: RGB writes still fire despite the unconfirmed mode.
    expect(ks.setCustomLighting).toHaveBeenCalledWith({ key: 65, r: 1, g: 2, b: 3 });
  });

  it('writeVerifiedCustomRgb verify FAIL: readback always 0:0:0 → 3 attempts/key, 200+400 sleeps/key, "Custom RGB verify failed" per key', async () => {
    const ls = makeLocalStorage();
    vi.stubGlobal('localStorage', ls);
    // getCustomLighting default matches (1:2:3); make every readback mismatch
    // so all 3 attempts exhaust per key and the final failure log fires.
    ks.getCustomLighting.mockResolvedValue({ R: 0, G: 0, B: 0, key: 0 });
    // Mode 21 immediately → ensure adds no 400ms backoff of its own, so the
    // 200/400 delay counts below come purely from verify retries.
    ks.getLighting.mockResolvedValue(makeLightMode({ mode: 21, type: 'custom' }));
    const errSpy = console.error as unknown as ReturnType<typeof vi.fn>;
    const { result, delays } = await runImportSpyingTimers(makeEncryptedFile(makeImportConfig()));
    expect(result).toEqual({ success: true }); // verify failure is non-fatal
    // 2 keys × 3 attempts each (F2-2 sequential batching, size 1).
    expect(ks.setCustomLighting).toHaveBeenCalledTimes(6);
    // Backoff sleep 200×attempt only if attempt<3 → 200 + 400 per key.
    expect(delays.filter(d => d === 200)).toHaveLength(2);
    expect(delays.filter(d => d === 400)).toHaveLength(2);
    // Final log per key: `Custom RGB verify failed for key N: expected r:g:b, read back R:G:B`.
    expect(errSpy).toHaveBeenCalledWith('Custom RGB verify failed for key 65: expected 1:2:3, read back 0:0:0');
    expect(errSpy).toHaveBeenCalledWith('Custom RGB verify failed for key 66: expected 1:2:3, read back 0:0:0');
    expect(ks.saveCustomLighting).toHaveBeenCalledTimes(1);
  });

  it('writeVerifiedCustomRgb OK-after-retry: first readback mismatch, second matches → 2 attempts/key, one 200 sleep, no failure log', async () => {
    const ls = makeLocalStorage();
    vi.stubGlobal('localStorage', ls);
    // Sequential keys (F2-2): k65 mismatch, k65 match, k66 mismatch, k66 match.
    ks.getCustomLighting
      .mockResolvedValueOnce({ R: 9, G: 9, B: 9, key: 65 })
      .mockResolvedValueOnce({ R: 1, G: 2, B: 3, key: 65 })
      .mockResolvedValueOnce({ R: 9, G: 9, B: 9, key: 66 })
      .mockResolvedValueOnce({ R: 1, G: 2, B: 3, key: 66 });
    ks.getLighting.mockResolvedValue(makeLightMode({ mode: 21, type: 'custom' }));
    const errSpy = console.error as unknown as ReturnType<typeof vi.fn>;
    const { result, delays } = await runImportSpyingTimers(makeEncryptedFile(makeImportConfig()));
    expect(result).toEqual({ success: true });
    // Attempt 2 verifies → return before attempt 3: 2 writes per key.
    expect(ks.setCustomLighting).toHaveBeenCalledTimes(4);
    // One 200ms backoff per key (attempt 1 only); no 400 (attempt 2 verified).
    expect(delays.filter(d => d === 200)).toHaveLength(2);
    expect(delays.filter(d => d === 400)).toHaveLength(0);
    expect(errSpy).not.toHaveBeenCalledWith(expect.stringContaining('Custom RGB verify failed'));
  });

  it('writeVerifiedCustomRgb error paths: setCustomLighting Error logs "Failed to restore"; readback Error → "readback error: <msg>" in final failure log', async () => {
    const ls = makeLocalStorage();
    vi.stubGlobal('localStorage', ls);
    ks.setCustomLighting.mockResolvedValue(new Error('write refused'));
    ks.getCustomLighting.mockResolvedValue(new Error('read fail'));
    ks.getLighting.mockResolvedValue(makeLightMode({ mode: 21, type: 'custom' }));
    const errSpy = console.error as unknown as ReturnType<typeof vi.fn>;
    const { result } = await runImportSpyingTimers(makeEncryptedFile(makeImportConfig()));
    expect(result).toEqual({ success: true }); // best-effort, never throws
    // 3 attempts per key despite the write Error each time.
    expect(ks.setCustomLighting).toHaveBeenCalledTimes(6);
    expect(errSpy).toHaveBeenCalledWith('Failed to restore custom RGB for key 65:', 'write refused');
    expect(errSpy).toHaveBeenCalledWith('Failed to restore custom RGB for key 66:', 'write refused');
    expect(errSpy).toHaveBeenCalledWith('Custom RGB verify failed for key 65: expected 1:2:3, readback error: read fail');
    expect(errSpy).toHaveBeenCalledWith('Custom RGB verify failed for key 66: expected 1:2:3, readback error: read fail');
  });

  it('F2-2 sequential single-flight: key 66 write starts only after key 65 write+verify cycle completes', async () => {
    const ls = makeLocalStorage();
    vi.stubGlobal('localStorage', ls);
    // repairCustomRgb → processBatches(keys, fn, 1, 0): batch size 1, no
    // delay — one closed-loop write+verify per key, strictly in order.
    const result = await runImport(makeEncryptedFile(makeImportConfig()));
    expect(result).toEqual({ success: true });
    const order = ks.setCustomLighting.mock.invocationCallOrder;
    expect(order).toHaveLength(2);
    expect(ks.setCustomLighting.mock.calls[0][0]).toEqual({ key: 65, r: 1, g: 2, b: 3 });
    expect(ks.setCustomLighting.mock.calls[1][0]).toEqual({ key: 66, r: 1, g: 2, b: 3 });
    // key 65's verify readback happens BEFORE key 66's write (single-flight).
    const k65Read = ks.getCustomLighting.mock.invocationCallOrder[0];
    expect(k65Read).toBeLessThan(order[1]);
    expect(k65Read).toBeGreaterThan(order[0]);
    expect(ks.getCustomLighting.mock.calls).toEqual([[65], [66]]);
  });

  // --- Task 2d: repair gates (each gate pinned from BOTH sides: fires / skipped) ---

  it('deadband gate: isGlobalTriggering false → NO setDp/setDr, rest of flow intact', async () => {
    vi.stubGlobal('localStorage', makeLocalStorage());
    ks.getLighting.mockResolvedValue(makeLightMode({ mode: 21, type: 'custom' }));
    // Default makeConfig() entries carry EXPECTED_PERF with isGlobalTriggering
    // === false (V10) → gate closed for BOTH keys (makeImportConfig flips it on).
    const cfg = makeConfig();
    const result = await runImport(makeEncryptedFile(cfg));
    expect(result).toEqual({ success: true });
    expect(ks.setDp).not.toHaveBeenCalled();
    expect(ks.setDr).not.toHaveBeenCalled();
    // Sanity: another repair DID run — this it is gate-specific, not a dead fixture.
    // Default advancedType 'dks' + db3 33 → setDksTravel fires for both keys.
    expect(ks.setDksTravel).toHaveBeenCalledTimes(2);
  });

  it('deadband gate: press non-number → NO setDp even with isGlobalTriggering true', async () => {
    vi.stubGlobal('localStorage', makeLocalStorage());
    ks.getLighting.mockResolvedValue(makeLightMode({ mode: 21, type: 'custom' }));
    // typeof deadBandPressValue === 'number' fails → key skipped BEFORE batching;
    // setDr never reached (release is only called after press in the same batch fn).
    const cfg = makeConfig({
      keyboards: [
        makeKeyboardEntry({
          keyValue: 65, row: 0, col: 0,
          performance: {
            ...EXPECTED_PERF,
            isGlobalTriggering: true,
            deadBandPressValue: 'x' as unknown as number,
          },
        }),
      ],
    });
    const result = await runImport(makeEncryptedFile(cfg));
    expect(result).toEqual({ success: true });
    expect(ks.setDp).not.toHaveBeenCalled();
    expect(ks.setDr).not.toHaveBeenCalled();
  });

  it('deadband gate: press 0 → setDp(key,0) DOES fire (stale-clear, 0 values applied)', async () => {
    vi.stubGlobal('localStorage', makeLocalStorage());
    ks.getLighting.mockResolvedValue(makeLightMode({ mode: 21, type: 'custom' }));
    const cfg = makeConfig({
      keyboards: [
        makeKeyboardEntry({
          keyValue: 65, row: 0, col: 0,
          performance: { ...EXPECTED_PERF, isGlobalTriggering: true, deadBandPressValue: 0 },
        }),
      ],
    });
    const result = await runImport(makeEncryptedFile(cfg));
    expect(result).toEqual({ success: true });
    // 0 is NOT falsy-filtered: F14 "0 values applied — clears stale".
    expect(ks.setDp).toHaveBeenCalledWith(65, 0);
    expect(ks.setDr).toHaveBeenCalledWith(65, 40); // release from EXPECTED_PERF (40)
    // press runs BEFORE release (F14 order).
    expect(ks.setDp.mock.invocationCallOrder[0])
      .toBeLessThan(ks.setDr.mock.invocationCallOrder[0]);
  });

  it('socd gate: wrong advancedType OR non-number delay → NO setSocd for that key', async () => {
    vi.stubGlobal('localStorage', makeLocalStorage());
    ks.getLighting.mockResolvedValue(makeLightMode({ mode: 21, type: 'custom' }));
    // key65: socd block present but advancedType 'mt' → gate closed on TYPE.
    // key66: advancedType 'socd' but delay non-number → gate closed on DELAY.
    const cfg = makeConfig({
      keyboards: [
        makeKeyboardEntry({
          keyValue: 65, row: 0, col: 0,
          advancedKeys: { ...EXPECTED_ADV, advancedType: 'mt' },
        }),
        makeKeyboardEntry({
          keyValue: 66, row: 0, col: 1,
          advancedKeys: {
            ...EXPECTED_ADV,
            advancedType: 'socd',
            socd: { ...EXPECTED_ADV.socd, delay: 'x' },
          },
        }),
      ],
    });
    const result = await runImport(makeEncryptedFile(cfg));
    expect(result).toEqual({ success: true });
    expect(ks.setSocd).not.toHaveBeenCalled();
    // Sanity: socd-key fixture still exercises the END repair (key65 advancedType
    // is 'mt', so END is gated off too — assert nothing leaked into setEND either).
    expect(ks.setEND).not.toHaveBeenCalled();
  });

  it('socd gate: advancedType socd + numeric delay → setSocd(verbatim 7-field obj, "1.0.7")', async () => {
    vi.stubGlobal('localStorage', makeLocalStorage());
    ks.getLighting.mockResolvedValue(makeLightMode({ mode: 21, type: 'custom' }));
    const cfg = makeConfig({
      keyboards: [
        makeKeyboardEntry({
          keyValue: 66, row: 0, col: 0,
          advancedKeys: { ...EXPECTED_ADV, advancedType: 'socd' },
        }),
      ],
    });
    const result = await runImport(makeEncryptedFile(cfg));
    expect(result).toEqual({ success: true });
    // Verbatim EXPECTED_ADV.socd (7 fields incl. delay 150 — no key field added).
    expect(ks.setSocd).toHaveBeenCalledWith(EXPECTED_ADV.socd, '1.0.7');
    expect(ks.setSocd).toHaveBeenCalledTimes(1);
  });

  it('end gate: wrong advancedType → NO setEND; numeric delay passes AS-IS incl. 65535', async () => {
    vi.stubGlobal('localStorage', makeLocalStorage());
    ks.getLighting.mockResolvedValue(makeLightMode({ mode: 21, type: 'custom' }));
    // key65: advancedType 'dks' (default) → gate closed on TYPE despite end block.
    // key66: advancedType 'end', delay 65535 → gate OPEN; delay applied verbatim,
    // NO sentinel filter (PM ruling — unlike export-side F-D2 filtering).
    const cfg = makeConfig({
      keyboards: [
        makeKeyboardEntry({ keyValue: 65, row: 0, col: 0 }),
        makeKeyboardEntry({
          keyValue: 66, row: 0, col: 1,
          advancedKeys: {
            ...EXPECTED_ADV,
            advancedType: 'end',
            end: { dks: 3, delay: 65535 },
          },
        }),
      ],
    });
    const result = await runImport(makeEncryptedFile(cfg));
    expect(result).toEqual({ success: true });
    expect(ks.setEND).toHaveBeenCalledTimes(1);
    expect(ks.setEND).toHaveBeenCalledWith(
      { key: 66, dks: 3, delay: 65535 },
      '1.0.7',
    );
  });

  it('db3 gate: db3 absent → NO setDksTravel; db3 0 → setDksTravel(key,0,"Layout_DB3") fires', async () => {
    vi.stubGlobal('localStorage', makeLocalStorage());
    ks.getLighting.mockResolvedValue(makeLightMode({ mode: 21, type: 'custom' }));
    // key65: dks.db3 deleted → typeof undefined !== 'number' → skipped.
    // key66: db3 0 → 0 IS a number → fires (stale-clear per F14).
    const noDb3 = { ...EXPECTED_ADV.dks };
    delete noDb3.db3;
    const cfg = makeConfig({
      keyboards: [
        makeKeyboardEntry({
          keyValue: 65, row: 0, col: 0,
          advancedKeys: { ...EXPECTED_ADV, dks: noDb3 },
        }),
        makeKeyboardEntry({
          keyValue: 66, row: 0, col: 1,
          advancedKeys: { ...EXPECTED_ADV, dks: { ...EXPECTED_ADV.dks, db3: 0 } },
        }),
      ],
    });
    const result = await runImport(makeEncryptedFile(cfg));
    expect(result).toEqual({ success: true });
    expect(ks.setDksTravel).toHaveBeenCalledTimes(1);
    expect(ks.setDksTravel).toHaveBeenCalledWith(66, 0, 'Layout_DB3');
  });

  it('special-lighting gate: light.other absent → NO setSpecialLighting, flow intact', async () => {
    vi.stubGlobal('localStorage', makeLocalStorage());
    ks.getLighting.mockResolvedValue(makeLightMode({ mode: 21, type: 'custom' }));
    const cfg = makeImportConfig();
    // KeyboardConfig requires light.other → delete post-build (gate is `config.light?.other`).
    delete (cfg.light as Partial<typeof cfg.light>).other;
    const result = await runImport(makeEncryptedFile(cfg));
    expect(result).toEqual({ success: true });
    expect(ks.setSpecialLighting).not.toHaveBeenCalled();
    // Sanity: main-lighting repair still ran (pre-switch + main = 2 setLighting;
    // pre-switch Error path logs but does NOT skip the main repair).
    expect(ks.setLighting).toHaveBeenCalledTimes(2);
    expect(ks.setLighting.mock.calls[1][0]).toEqual(SDK_FORMAT_STATIC);
  });

  it('main-lighting gate: light.main absent → NO final setLighting repair (pre-switch only)', async () => {
    vi.stubGlobal('localStorage', makeLocalStorage());
    ks.getLighting.mockResolvedValue(makeLightMode({ mode: 21, type: 'custom' }));
    const cfg = makeImportConfig();
    delete (cfg.light as Partial<typeof cfg.light>).main;
    const result = await runImport(makeEncryptedFile(cfg));
    expect(result).toEqual({ success: true });
    // Exactly ONE setLighting = the pre-switch to custom mode; repair skipped.
    expect(ks.setLighting).toHaveBeenCalledTimes(1);
    expect(ks.setLighting.mock.calls[0][0]).toEqual(PRE_SWITCH_EXPECTED);
  });

  it('setter-Error sweep: every repair logs its error and import STILL succeeds', async () => {
    vi.stubGlobal('localStorage', makeLocalStorage());
    ks.getLighting.mockResolvedValue(makeLightMode({ mode: 21, type: 'custom' }));
    // Every repair setter fails → console.error per setter, never a throw,
    // and importProfile still returns {success:true} (wrappers return Error).
    ks.setDksTravel.mockResolvedValue(new Error('db3-boom'));
    ks.setDp.mockResolvedValue(new Error('dp-boom'));
    ks.setDr.mockResolvedValue(new Error('dr-boom'));
    ks.setSpecialLighting.mockResolvedValue(new Error('spec-boom'));
    ks.setSocd.mockResolvedValue(new Error('socd-boom'));
    ks.setEND.mockResolvedValue(new Error('end-boom'));
    ks.saveCustomLighting.mockResolvedValue(new Error('save-boom'));
    ks.setLighting.mockResolvedValue(new Error('light-boom'));
    const errSpy = console.error as unknown as ReturnType<typeof vi.fn>;
    const result = await runImport(makeEncryptedFile(makeImportConfig()));
    expect(result).toEqual({ success: true });
    const msgs = errSpy.mock.calls.map(c => String(c[0]));
    // Per-key repair errors (keys 65+66 both gate-open in makeImportConfig).
    expect(msgs.filter(m => m.startsWith('Failed to restore DB3 travel for key'))).toHaveLength(2);
    expect(msgs.filter(m => m.startsWith('Failed to restore press deadband for key'))).toHaveLength(2);
    expect(msgs.filter(m => m.startsWith('Failed to restore release deadband for key'))).toHaveLength(2);
    expect(msgs.filter(m => m.startsWith('Failed to restore SOCD for key'))).toHaveLength(1); // key66 only
    expect(msgs.filter(m => m.startsWith('Failed to restore END for key'))).toHaveLength(1);  // key65 only
    expect(msgs).toContain('Failed to restore special lighting:');
    expect(msgs).toContain('Failed to restore main lighting mode:');
    expect(msgs).toContain('Failed to save custom lighting:');
    expect(msgs).toContain('Failed to switch to custom mode:');
    // Error messages are passed as the SECOND arg, not interpolated.
    const db3Call = errSpy.mock.calls.find(c => String(c[0]).startsWith('Failed to restore DB3'));
    expect(db3Call?.[1]).toBe('db3-boom');
  });
});

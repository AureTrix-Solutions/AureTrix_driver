// ExportService import-side suite (sprint-21 Task 2a): importProfile happy path + guards.
// Headless software-contract pinning — mocks never claim device behavior.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../KeyboardService', async () => {
  const { buildKeyboardServiceMock } = await import('./exportservice-helpers');
  return { default: buildKeyboardServiceMock() };
});

import KeyboardService from '../KeyboardService';
import ExportService from '../ExportService';
import type { KeyboardConfig, Keyboards } from '@sparklinkplayjoy/sdk-keyboard/dist/esm/src/utils/validate';
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

// runImport variant that captures setTimeout calls for the 2c sleep pins
// (ensureCustomModeReady 400ms backoff, writeVerifiedCustomRgb 200/400ms).
// Spy installed AFTER useFakeTimers so it wraps the fake — runAllTimersAsync
// still drives every sleep; mockRestore before useRealTimers.
async function runImportSpyingTimers(file: File) {
  vi.useFakeTimers();
  const timerSpy = vi.spyOn(globalThis, 'setTimeout');
  try {
    const pending = ExportService.importProfile(file);
    await vi.runAllTimersAsync();
    return { result: await pending, timerSpy };
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
});

// ExportService export-side suite (sprint-21 Task 1c): exportProfile + gatherKeyboardSnapshot.
// Headless software-contract pinning — mocks never claim device behavior.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../KeyboardService', async () => {
  const { buildKeyboardServiceMock } = await import('./exportservice-helpers');
  return { default: buildKeyboardServiceMock() };
});

import KeyboardService from '../KeyboardService';
import ExportService from '../ExportService';
import {
  applyExportDefaults,
  LIGHT_STATIC,
  LIGHT_STATIC_CFG,
  SYSTEM_EXPECTED,
  TEMP_SWITCH_EXPECTED,
  RESTORE_MAIN_EXPECTED,
  makeConfig,
  makeLightMode,
  type KeyboardServiceMock,
} from './exportservice-helpers';

// The mocked module default IS the helper-built mock object; the cast is exact at runtime.
const ks = KeyboardService as unknown as KeyboardServiceMock;

// F1 fake-timer pattern: every sleeping path (300ms switch settle, 150/100/50ms gather
// delays, retry backoffs) runs through vi.runAllTimersAsync.
async function runExport(filename = 'profile.json') {
  vi.useFakeTimers();
  try {
    const pending = ExportService.exportProfile(filename);
    await vi.runAllTimersAsync();
    return await pending;
  } finally {
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

describe('exportProfile', () => {
  it('happy path: exports the full snapshot config under the given filename', async () => {
    const result = await runExport('my-profile.json');

    expect(result).toEqual({ success: true });
    expect(ks.exportConfig).toHaveBeenCalledTimes(1);
    const [config, filename] = ks.exportConfig.mock.calls[0];
    expect(filename).toBe('my-profile.json');
    expect(config).toEqual(makeConfig());
  });

  it('F-D7-2 pinned: light.main converts the PRE-switch snapshot, not the post-switch re-read', async () => {
    ks.getLighting
      .mockResolvedValueOnce({ ...LIGHT_STATIC, colors: [...LIGHT_STATIC.colors] }) // snapshot (pre-switch)
      .mockResolvedValueOnce(makeLightMode({ mode: 21, type: 'custom', speed: 61 })); // gatherLightingConfig re-read

    const result = await runExport();

    expect(result).toEqual({ success: true });
    const [config] = ks.exportConfig.mock.calls[0];
    expect(config.light.main).toEqual(LIGHT_STATIC_CFG);
  });

  it('returns {success:false, error} when exportConfig resolves an Error', async () => {
    ks.exportConfig.mockResolvedValue(new Error('sdk rejected'));

    const result = await runExport();

    expect(result).toEqual({ success: false, error: 'sdk rejected' });
  });

  it('catches a snapshot failure: getLighting Error → Failed to capture original lighting state', async () => {
    ks.getLighting.mockResolvedValue(new Error('device gone'));

    const result = await runExport();

    expect(result).toEqual({ success: false, error: 'Failed to capture original lighting state' });
    expect(ks.exportConfig).not.toHaveBeenCalled();
  });

  it('catches a temp-switch failure: setLighting Error → Failed to switch to custom mode', async () => {
    ks.setLighting.mockResolvedValueOnce(new Error('busy'));

    const result = await runExport();

    expect(result).toEqual({ success: false, error: 'Failed to switch to custom mode: busy' });
    expect(ks.exportConfig).not.toHaveBeenCalled();
  });
});

describe('gatherKeyboardSnapshot lighting choreography', () => {
  it('setLighting call #1 is the temp custom-mode switch (V4/F10)', async () => {
    await runExport();

    expect(ks.setLighting.mock.calls[0][0]).toEqual(TEMP_SWITCH_EXPECTED);
  });

  it('call order: [0] temp switch, [1] finally-restore of the original main params (V6)', async () => {
    await runExport();

    expect(ks.setLighting).toHaveBeenCalledTimes(2);
    expect(ks.setLighting.mock.calls[0][0]).toEqual(TEMP_SWITCH_EXPECTED);
    expect(ks.setLighting.mock.calls[1][0]).toEqual(RESTORE_MAIN_EXPECTED);
  });

  it('restores logo and special zones when their originals were open', async () => {
    await runExport();

    expect(ks.setLogoLighting).toHaveBeenCalledTimes(1);
    expect(ks.setLogoLighting.mock.calls[0][0]).toEqual(RESTORE_MAIN_EXPECTED);
    expect(ks.setSpecialLighting).toHaveBeenCalledTimes(1);
    expect(ks.setSpecialLighting.mock.calls[0][0]).toEqual(LIGHT_STATIC);
  });

  it('skips logo/special restore when the captured original was open:false', async () => {
    ks.getLogoLighting.mockResolvedValueOnce(makeLightMode({ open: false }));
    ks.getSpecialLighting.mockResolvedValueOnce(makeLightMode({ open: false }));

    const result = await runExport();

    expect(result).toEqual({ success: true });
    expect(ks.setLogoLighting).not.toHaveBeenCalled();
    expect(ks.setSpecialLighting).not.toHaveBeenCalled();
    // Main restore is unconditional once the original main read succeeded.
    expect(ks.setLighting.mock.calls[1][0]).toEqual(RESTORE_MAIN_EXPECTED);
  });

  it('finally-restore still runs when a gather throws midway', async () => {
    vi.spyOn(ExportService, 'gatherDeviceInfo').mockRejectedValueOnce(new Error('boom'));

    const result = await runExport();

    expect(result).toEqual({ success: false, error: 'boom' });
    expect(ks.exportConfig).not.toHaveBeenCalled();
    expect(ks.setLighting).toHaveBeenCalledTimes(2);
    expect(ks.setLighting.mock.calls[1][0]).toEqual(RESTORE_MAIN_EXPECTED);
    expect(ks.setLogoLighting).toHaveBeenCalledTimes(1);
    expect(ks.setSpecialLighting).toHaveBeenCalledTimes(1);
  });
});

// V11: error-path assertions. The spy is installed in beforeEach; errorSpy re-reads it per test.
const errorSpy = () => vi.mocked(console.error);

describe('gatherKeyboardSnapshot error paths (console.error text)', () => {
  it('getLighting Error → result error + console.error("Failed to export profile:", Error)', async () => {
    ks.getLighting.mockResolvedValue(new Error('device gone'));

    const result = await runExport();

    expect(result).toEqual({ success: false, error: 'Failed to capture original lighting state' });
    expect(ks.exportConfig).not.toHaveBeenCalled();
    // exportProfile's catch logs the THROWN error object itself (2 args: prefix + error).
    expect(errorSpy()).toHaveBeenCalledWith('Failed to export profile:', expect.any(Error));
    expect((errorSpy().mock.calls.find(c => c[0] === 'Failed to export profile:')![1] as Error).message).toBe(
      'Failed to capture original lighting state',
    );
  });

  it('getLighting Error → NO restore setters at all (finally guard requires a good original)', async () => {
    ks.getLighting.mockResolvedValue(new Error('device gone'));

    await runExport();

    expect(ks.setLighting).not.toHaveBeenCalled();
    expect(ks.setLogoLighting).not.toHaveBeenCalled();
    expect(ks.setSpecialLighting).not.toHaveBeenCalled();
  });

  it('temp-switch throw still runs the finally-restore (setLighting ×2, call[1] = restore)', async () => {
    ks.setLighting.mockResolvedValueOnce(new Error('busy'));

    const result = await runExport();

    expect(result).toEqual({ success: false, error: 'Failed to switch to custom mode: busy' });
    expect(ks.setLighting).toHaveBeenCalledTimes(2);
    expect(ks.setLighting.mock.calls[1][0]).toEqual(RESTORE_MAIN_EXPECTED);
    expect(errorSpy()).toHaveBeenCalledWith('Failed to export profile:', expect.any(Error));
  });

  it('main-restore Error is swallowed: logs "Failed to restore main lighting:", export still succeeds', async () => {
    ks.setLighting.mockResolvedValueOnce(null).mockResolvedValueOnce(new Error('restore failed'));

    const result = await runExport();

    expect(result).toEqual({ success: true });
    expect(errorSpy()).toHaveBeenCalledWith('Failed to restore main lighting:', 'restore failed');
  });
});

// V12: gatherLightingConfig is public and has no sleeping paths → direct call, no fake timers.
// F4 — verbatim copy of getDefaultLightConfig() (ExportService.ts), distinct from LIGHT_STATIC_CFG.
const DEFAULT_LIGHT_CFG = {
  open: true,
  mode: 'static',
  staticColors: ['#FF0000'],
  selectStaticColor: 0,
  luminance: 100,
  speed: 50,
  sleepTime: 0,
  direction: true,
  dynamic: 0,
};

describe('gatherLightingConfig per-read Error → getDefaultLightConfig', () => {
  it('happy reads: all three zones convert LIGHT_STATIC via convertLightingToConfig', async () => {
    const light = await ExportService.gatherLightingConfig();

    expect(light).toEqual({ main: LIGHT_STATIC_CFG, logo: LIGHT_STATIC_CFG, other: LIGHT_STATIC_CFG });
  });

  it('getLighting Error → main falls back to defaults, logo/other still convert', async () => {
    ks.getLighting.mockResolvedValue(new Error('read fail'));

    const light = await ExportService.gatherLightingConfig();

    expect(light.main).toEqual(DEFAULT_LIGHT_CFG);
    expect(light.logo).toEqual(LIGHT_STATIC_CFG);
    expect(light.other).toEqual(LIGHT_STATIC_CFG);
  });

  it('getLogoLighting Error → only logo falls back', async () => {
    ks.getLogoLighting.mockResolvedValue(new Error('read fail'));

    const light = await ExportService.gatherLightingConfig();

    expect(light.main).toEqual(LIGHT_STATIC_CFG);
    expect(light.logo).toEqual(DEFAULT_LIGHT_CFG);
    expect(light.other).toEqual(LIGHT_STATIC_CFG);
  });

  it('getSpecialLighting Error → only other falls back', async () => {
    ks.getSpecialLighting.mockResolvedValue(new Error('read fail'));

    const light = await ExportService.gatherLightingConfig();

    expect(light.other).toEqual(DEFAULT_LIGHT_CFG);
    expect(light.main).toEqual(LIGHT_STATIC_CFG);
  });

  it('a THROWING read (not an Error result) → all three zones default + console.error text', async () => {
    ks.getLighting.mockRejectedValue(new Error('boom'));

    const light = await ExportService.gatherLightingConfig();

    expect(light).toEqual({ main: DEFAULT_LIGHT_CFG, logo: DEFAULT_LIGHT_CFG, other: DEFAULT_LIGHT_CFG });
    expect(errorSpy()).toHaveBeenCalledWith('Error gathering lighting config:', expect.any(Error));
  });
});

// V7: gatherDeviceInfo is public and has no sleeping paths → direct call.
// ROES/TOP_DEAD fallbacks are literals 3/0 (D1, PO-approved 2026-10-13).
describe('gatherDeviceInfo ROES/TOP_DEAD fallbacks', () => {
  it('happy reads: SYSTEM_EXPECTED verbatim; getApi called with the two ORDER_TYPE keys', async () => {
    const system = await ExportService.gatherDeviceInfo();

    expect(system).toEqual(SYSTEM_EXPECTED);
    expect(ks.getApi).toHaveBeenCalledWith({ type: 'ORDER_TYPE_ROES' });
    expect(ks.getApi).toHaveBeenCalledWith({ type: 'ORDER_TYPE_TOP_DEAD_SWITCH' });
  });

  it('getBaseInfo Error → {} + console.error("Failed to get base info:", error); getApi never reached', async () => {
    const err = new Error('no info');
    ks.getBaseInfo.mockResolvedValue(err);

    const system = await ExportService.gatherDeviceInfo();

    expect(system).toEqual({});
    expect(errorSpy()).toHaveBeenCalledWith('Failed to get base info:', err);
    expect(ks.getApi).not.toHaveBeenCalled();
  });

  it('getBaseInfo THROW → {} + console.error("Error gathering device info:", error)', async () => {
    ks.getBaseInfo.mockRejectedValue(new Error('boom'));

    const system = await ExportService.gatherDeviceInfo();

    expect(system).toEqual({});
    expect(errorSpy()).toHaveBeenCalledWith('Error gathering device info:', expect.any(Error));
  });

  it('ROES Error → rateOfReturn falls back to 3; TOP_DEAD unaffected', async () => {
    ks.getApi.mockImplementation(async ({ type }: { type: string }) =>
      type === 'ORDER_TYPE_ROES' ? new Error('roes fail') : true,
    );

    const system = await ExportService.gatherDeviceInfo();

    expect(system).toEqual({ ...SYSTEM_EXPECTED, rateOfReturn: 3 });
  });

  it('TOP_DEAD Error → topDeadBandSwitch falls back to 0; ROES unaffected', async () => {
    ks.getApi.mockImplementation(async ({ type }: { type: string }) =>
      type === 'ORDER_TYPE_TOP_DEAD_SWITCH' ? new Error('td fail') : 8,
    );

    const system = await ExportService.gatherDeviceInfo();

    expect(system).toEqual({ ...SYSTEM_EXPECTED, topDeadBandSwitch: 0 });
  });

  it('unexpected shapes (ROES string, TOP_DEAD number) also fall back to 3/0', async () => {
    ks.getApi.mockImplementation(async ({ type }: { type: string }) =>
      type === 'ORDER_TYPE_ROES' ? '8' : type === 'ORDER_TYPE_TOP_DEAD_SWITCH' ? 1 : null,
    );

    const system = await ExportService.gatherDeviceInfo();

    expect(system).toEqual({ ...SYSTEM_EXPECTED, rateOfReturn: 3, topDeadBandSwitch: 0 });
  });
});

// V6 detail: exact restore payloads — logo drops dynamicColorId + normalizes type;
// special is passed VERBATIM (dynamicColorId included — it is an ILightMode without that field
// in the mock, so "verbatim" == the captured object itself).
describe('gatherKeyboardSnapshot logo/special restore payload details', () => {
  it('logo restore: setLogoLighting gets original minus dynamicColorId, type normalized to static', async () => {
    ks.getLogoLighting.mockResolvedValue({ ...LIGHT_STATIC, type: 'dynamic', colors: ['#FF0000'] });

    await runExport();

    const { dynamicColorId: _drop, ...logoParams } = { ...LIGHT_STATIC, type: 'dynamic', colors: ['#FF0000'] };
    expect(ks.setLogoLighting).toHaveBeenCalledTimes(1);
    expect(ks.setLogoLighting.mock.calls[0][0]).toEqual({ ...logoParams, type: 'dynamic' });
  });

  it('logo restore: a non-dynamic type is normalized to "static" (e.g. "custom" → "static")', async () => {
    ks.getLogoLighting.mockResolvedValue({ ...LIGHT_STATIC, type: 'custom' });

    await runExport();

    expect(ks.setLogoLighting.mock.calls[0][0]).toMatchObject({ type: 'static' });
  });

  it('special restore: setSpecialLighting receives the captured original object verbatim', async () => {
    await runExport();

    expect(ks.setSpecialLighting).toHaveBeenCalledTimes(1);
    expect(ks.setSpecialLighting.mock.calls[0][0]).toEqual(LIGHT_STATIC);
  });

  it('logo restore throw → caught: console.error("Error restoring original lighting:", error), export succeeds', async () => {
    ks.setLogoLighting.mockRejectedValue(new Error('logo boom'));

    const result = await runExport();

    expect(result).toEqual({ success: true });
    expect(errorSpy()).toHaveBeenCalledWith('Error restoring original lighting:', expect.any(Error));
  });
});

// ---- Part E (Task 1e): per-key gather details — retry semantics, cache, mode map, gates ----

// Helper: run exportProfile and capture the config object passed to exportConfig.
async function runExportCaptured(filename = 'profile.json') {
  await runExport(filename);
  expect(ks.exportConfig).toHaveBeenCalledTimes(1);
  return ks.exportConfig.mock.calls[0][0] as ReturnType<typeof makeConfig>;
}

describe('retryWithBackoff throw path (F2) — performance gather', () => {
  it('getPerformanceMode rejects → 3 calls total per key, gather still resolves with defaults, console.error', async () => {
    ks.getPerformanceMode.mockRejectedValue(new Error('perf boom'));

    const config = await runExportCaptured();

    expect(ks.getPerformanceMode).toHaveBeenCalledTimes(6); // 2 keys × (1 + 2 retries)
    expect(errorSpy()).toHaveBeenCalledWith('Error gathering performance data for key 65:', expect.any(Error));
    // The perf pass aborted at the FIRST read — everything after it in that key's
    // pass never ran; the seed defaults survive untouched.
    const key65 = config.keyboards.find((k) => k.keyValue === 65)!;
    expect(key65.performance).toEqual({
      isGlobalTriggering: true,
      globalTriggeringValue: 0,
      isRt: false,
      isSingle: false,
      singleTriggeringValue: 0,
      rtPressValue: 0,
      rtReleaseValue: 0,
      axisID: 0,
      deadBandPressValue: 0,
      deadBandReleaseValue: 0,
      advancedKeyMode: 0,
    });
    // Export overall still succeeds — a gather failure is swallowed per-key.
    expect(ks.exportConfig).toHaveBeenCalledTimes(1);
  });

  it('resolved Error passes through WITHOUT retry — getRtTravel Error → 1 call per key, travel fields keep defaults', async () => {
    ks.getRtTravel.mockResolvedValue(new Error('rt rejected'));

    const config = await runExportCaptured();

    // retryWithBackoff only retries THROWS; a resolved Error is a normal return value.
    expect(ks.getRtTravel).toHaveBeenCalledTimes(2); // once per key, no retries
    const key65 = config.keyboards.find((k) => k.keyValue === 65)!;
    expect(key65.performance!.rtPressValue).toBe(0);
    expect(key65.performance!.rtReleaseValue).toBe(0);
    // Reads after the Error still ran (guard skips assignment, not the pass).
    expect(key65.performance!.isRt).toBe(true);
    expect(key65.performance!.singleTriggeringValue).toBe(77);
  });
});

describe('globalTravelCache — read once per snapshot', () => {
  it('getGlobalTouchTravel called exactly once for 2 keys (cache hit on second key)', async () => {
    const config = await runExportCaptured();

    expect(ks.getGlobalTouchTravel).toHaveBeenCalledTimes(1);
    for (const key of config.keyboards) {
      expect(key.performance!.globalTriggeringValue).toBe(55);
    }
  });

  it('getGlobalTouchTravel resolves Error → cache stays null → globalTriggeringValue 0 for every key', async () => {
    ks.getGlobalTouchTravel.mockResolvedValue(new Error('global boom'));

    const config = await runExportCaptured();

    // Error is not cached (cache assignment is guarded), so each key re-reads — 2 calls.
    expect(ks.getGlobalTouchTravel).toHaveBeenCalledTimes(2);
    for (const key of config.keyboards) {
      expect(key.performance!.globalTriggeringValue).toBe(0);
    }
  });
});

describe('touchMode flag mapping', () => {
  it.each([
    ['global', { isGlobalTriggering: true, isRt: false, isSingle: false }],
    ['single', { isGlobalTriggering: false, isRt: false, isSingle: true }],
    ['rt', { isGlobalTriggering: false, isRt: true, isSingle: false }],
  ])('touchMode %s maps to its flag set', async (touchMode, flags) => {
    ks.getPerformanceMode.mockResolvedValue({ touchMode, advancedKeyMode: 1 });

    const config = await runExportCaptured();

    for (const key of config.keyboards) {
      expect(key.performance).toMatchObject(flags);
    }
  });

  it('getPerformanceMode resolves Error → flags block skipped, isGlobalTriggering stays true (seed default)', async () => {
    ks.getPerformanceMode.mockResolvedValue(new Error('mode boom'));

    const config = await runExportCaptured();

    // No throw → no retry; the instanceof guard skips the flags block.
    expect(ks.getPerformanceMode).toHaveBeenCalledTimes(2);
    for (const key of config.keyboards) {
      expect(key.performance!.isGlobalTriggering).toBe(true);
      expect(key.performance!.isRt).toBe(false);
      expect(key.performance!.isSingle).toBe(false);
    }
  });
});

describe('ADVANCED_KEY_MODE_MAP edges + advanced-key gates', () => {
  it('advancedKeyMode 7 (no map entry) → advancedType none/value 7; mode 9 → rs/value 9', async () => {
    ks.getPerformanceMode.mockImplementation(async (key: number) => ({
      touchMode: 'rt',
      advancedKeyMode: key === 65 ? 7 : 9,
    }));

    const config = await runExportCaptured();

    const key65 = config.keyboards.find((k) => k.keyValue === 65)!;
    const key66 = config.keyboards.find((k) => k.keyValue === 66)!;
    expect(key65.advancedKeys!.advancedType).toBe('none');
    expect(key65.advancedKeys!.value).toBe(7);
    expect(key66.advancedKeys!.advancedType).toBe('rs');
    expect(key66.advancedKeys!.value).toBe(9);
  });

  it('dks block omitted when trpsAll resolves Error (F8 both-gate); other sub-blocks intact', async () => {
    ks.getTrpsAll.mockResolvedValue(new Error('trps boom'));

    const config = await runExportCaptured();

    for (const key of config.keyboards) {
      expect(key.advancedKeys!.dks).toBeUndefined();
      // Gate is dks-specific: siblings still stored from the default mocks.
      expect(key.advancedKeys!.mpt).toEqual({ mpt: 1 });
      expect(key.advancedKeys!.socd).toEqual({ pos1: 1, pos2: 2, key1: 3, key2: 4, type: 0, mode: 1, delay: 150 });
      // advancedType/value derive from the mode id (1), not from the dks read.
      expect(key.advancedKeys!.advancedType).toBe('dks');
      expect(key.advancedKeys!.value).toBe(1);
    }
  });

  it('dbN reads resolve Error → stored as 0 (db/db2/db3)', async () => {
    ks.getDksTravel.mockResolvedValue(new Error('travel boom'));

    const config = await runExportCaptured();

    for (const key of config.keyboards) {
      expect(key.advancedKeys!.dks).toEqual({
        dks: { 1: 1, 2: 2, 3: 3, 4: 4 },
        trps: { 1: 5, 2: 6, 3: 7, 4: 8 },
        db: 0,
        db2: 0,
        db3: 0,
      });
    }
  });

  it('mt delay stored AS-IS in ms (150) with dksAll [9,8,7,6]', async () => {
    const config = await runExportCaptured();

    for (const key of config.keyboards) {
      expect(key.advancedKeys!.mt).toEqual({ dksAll: [9, 8, 7, 6], delay: 150 });
    }
  });

  it('getMtorTgl resolves Error → mt.delay 0 (dksAll still stored)', async () => {
    ks.getMtorTgl.mockResolvedValue(new Error('mtorTgl boom'));

    const config = await runExportCaptured();

    for (const key of config.keyboards) {
      expect(key.advancedKeys!.mt).toEqual({ dksAll: [9, 8, 7, 6], delay: 0 });
    }
  });

  it('fn bindings (V12): layer-0 value 100 → key65 bind; undefined → key66 fn0 null', async () => {
    const config = await runExportCaptured();

    const key65 = config.keyboards.find((k) => k.keyValue === 65)!;
    const key66 = config.keyboards.find((k) => k.keyValue === 66)!;
    expect(key65.customKeys).toEqual({
      fn0: { keyValue: 65, bindKeyValue: 100 },
      fn1: null,
      fn2: null,
      fn3: null,
    });
    expect(key66.customKeys).toEqual({ fn0: null, fn1: null, fn2: null, fn3: null });
    // 4 fn layers × 1 batch each (2 keys < batchSize 10).
    expect(ks.getLayoutKeyInfo).toHaveBeenCalledTimes(4);
  });
});

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

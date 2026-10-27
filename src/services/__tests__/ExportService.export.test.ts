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

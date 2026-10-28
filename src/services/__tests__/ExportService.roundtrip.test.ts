// ExportService round-trip suite (sprint-21 Task 2e): THE HEADLINE —
// full export → encrypt → import cycle. Headless software-contract pinning:
// mocks never claim device behavior.
//
// Production export delegates encryption to KeyboardService.exportConfig → SDK
// (exportEncryptedJSON); import decrypts with decryptSDKConfig (same AES key).
// exportConfig is mocked, so the capture → makeEncryptedFile hop is the seam
// where the mock replaces the SDK's encryption — makeEncryptedFile mirrors it
// byte-for-byte with real CryptoJS (helpers, verified against the bundle).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CryptoJS from 'crypto-js';

vi.mock('../KeyboardService', async () => {
  const { buildKeyboardServiceMock } = await import('./exportservice-helpers');
  return { default: buildKeyboardServiceMock() };
});

import KeyboardService from '../KeyboardService';
import ExportService from '../ExportService';
import type { KeyboardConfig } from '@sparklinkplayjoy/sdk-keyboard/dist/esm/src/utils/validate';
import {
  applyExportDefaults,
  makeEncryptedFile,
  makeLightMode,
  makeLocalStorage,
  PRE_SWITCH_EXPECTED,
  SDK_FORMAT_STATIC,
  EXPECTED_ADV,
  type KeyboardServiceMock,
} from './exportservice-helpers';

// The mocked module default IS the helper-built mock object; the cast is exact at runtime.
const ks = KeyboardService as unknown as KeyboardServiceMock;

// F1 fake-timer pattern (both phases sleep): export 300/150/100/50ms,
// import 250/1000ms + batch delays + RGB backoffs — all driven by runAllTimersAsync.
async function runWithFakeTimers<T>(start: () => Promise<T>): Promise<T> {
  vi.useFakeTimers();
  try {
    const pending = start();
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

describe('export → import round-trip', () => {
  // Seam 1 — export phase: gather from mocked hardware and capture the config
  // handed to exportConfig (production: SDK encrypts + downloads it).
  // getPerformanceMode overrides give key65 'end' / key66 'socd' so the
  // import-side repair gates all fire on the round-tripped config.
  async function exportAndCapture(): Promise<KeyboardConfig> {
    ks.getPerformanceMode.mockImplementation(async (k: number) =>
      k === 65
        ? { touchMode: 'global', advancedKeyMode: 5 }
        : k === 66
          ? { touchMode: 'global', advancedKeyMode: 8 }
          : { touchMode: 'rt', advancedKeyMode: 1 });

    const result = await runWithFakeTimers(() => ExportService.exportProfile('roundtrip.json'));
    expect(result).toEqual({ success: true });
    expect(ks.exportConfig).toHaveBeenCalledTimes(1);
    return ks.exportConfig.mock.calls[0][0];
  }

  // Seam 2 — the encrypt hop (mock replaces SDK encryption; makeEncryptedFile
  // mirrors it with real CryptoJS), then the import phase. Fresh call records
  // (mockClear keeps implementations) so import-side counts start at zero.
  async function importCaptured(captured: KeyboardConfig) {
    vi.clearAllMocks();
    const ls = makeLocalStorage();
    vi.stubGlobal('localStorage', ls);
    // Custom-mode readback succeeds on attempt 1 — keeps ensureCustomModeReady
    // off the retry path (2c pins that state machine).
    ks.getLighting.mockResolvedValue(makeLightMode({ mode: 21, type: 'custom' }));

    const file = makeEncryptedFile(captured);
    const result = await runWithFakeTimers(() => ExportService.importProfile(file));
    return { result, ls, file };
  }

  it('THE HEADLINE: full export → encrypt → import cycle runs every repair on the round-tripped config', async () => {
    const captured = await exportAndCapture();

    // The captured config carries the per-key advanced modes through export:
    // advancedKeyMode 5→'end' (key65), 8→'socd' (key66) — the gates the
    // import-side socd/end repairs read back off the decrypted config.
    expect(captured.keyboards[0].advancedKeys.advancedType).toBe('end');
    expect(captured.keyboards[1].advancedKeys.advancedType).toBe('socd');

    const { result, ls } = await importCaptured(captured);
    expect(result).toEqual({ success: true });

    // Repairs ran against the ROUND-TRIPPED config (both keys, both gates).
    expect(ks.setDksTravel).toHaveBeenCalledWith(65, 33, 'Layout_DB3');
    expect(ks.setDksTravel).toHaveBeenCalledWith(66, 33, 'Layout_DB3');
    expect(ks.setDp).toHaveBeenCalledWith(65, 30);
    expect(ks.setDr).toHaveBeenCalledWith(65, 40);
    expect(ks.setDp).toHaveBeenCalledWith(66, 30);
    expect(ks.setDr).toHaveBeenCalledWith(66, 40);
    expect(ks.setSpecialLighting).toHaveBeenCalledWith(SDK_FORMAT_STATIC);
    expect(ks.setSocd).toHaveBeenCalledTimes(1); // only key66 ('socd')
    expect(ks.setSocd).toHaveBeenCalledWith(EXPECTED_ADV.socd, '1.0.7');
    expect(ks.setEND).toHaveBeenCalledTimes(1); // only key65 ('end')
    expect(ks.setEND).toHaveBeenCalledWith({ key: 65, dks: 3, delay: 250 }, '1.0.7');
    expect(ks.setCustomLighting).toHaveBeenCalledTimes(2); // keys 65 + 66, verify-OK
    expect(ks.setCustomLighting).toHaveBeenCalledWith({ key: 65, r: 1, g: 2, b: 3 });
    expect(ks.setCustomLighting).toHaveBeenCalledWith({ key: 66, r: 1, g: 2, b: 3 });
    expect(ks.saveCustomLighting).toHaveBeenCalledTimes(1);

    // Lighting: pre-switch (V5 shape) first, main restore (SDK_FORMAT_STATIC) LAST;
    // probe succeeded attempt 1 → exactly 2 setLighting calls, no logo lighting.
    expect(ks.setLighting).toHaveBeenCalledTimes(2);
    expect(ks.setLighting.mock.calls[0][0]).toEqual(PRE_SWITCH_EXPECTED);
    expect(ks.setLighting.mock.calls[1][0]).toEqual(SDK_FORMAT_STATIC);
    expect(ks.setLogoLighting).not.toHaveBeenCalled();
    expect(ls.setItem).toHaveBeenCalledWith('MacroList', '["local"]');
  });

  it('nested-keyboards config survives the round-trip: flat() repair reaches every key', async () => {
    const captured = await exportAndCapture();

    // Wrap each keyboard entry in its own row array — the shape the import
    // side flattens before repairs. Per-key repairs prove flat() ran: without
    // it the entries are arrays and every gate read returns undefined.
    const nested = { ...captured, keyboards: captured.keyboards.map(k => [k]) } as unknown as KeyboardConfig;

    const { result } = await importCaptured(nested);
    expect(result).toEqual({ success: true });

    // Same per-key repairs as the headline — nested input, flat processing.
    expect(ks.setDksTravel).toHaveBeenCalledWith(65, 33, 'Layout_DB3');
    expect(ks.setDksTravel).toHaveBeenCalledWith(66, 33, 'Layout_DB3');
    expect(ks.setDp).toHaveBeenCalledWith(65, 30);
    expect(ks.setDr).toHaveBeenCalledWith(66, 40);
    expect(ks.setSocd).toHaveBeenCalledTimes(1);
    expect(ks.setEND).toHaveBeenCalledTimes(1);
    expect(ks.setCustomLighting).toHaveBeenCalledTimes(2);
  });

  it('mt delay round-trips AS-IS (ms): no ÷10 at export, decrypt returns the stored value', async () => {
    const captured = await exportAndCapture();

    // Export stored mt verbatim from the mocked getter — delay 150 ms AS-IS
    // (the ÷10 bug class: scaling at export would make the round-trip lossy).
    expect(captured.keyboards[0].advancedKeys.mt).toEqual(EXPECTED_ADV.mt);
    expect(captured.keyboards[0].advancedKeys.mt.delay).toBe(150);

    // Test-side decrypt with real CryptoJS (same key as makeEncryptedFile):
    // the ENCRYPTED FILE itself carries delay 150 — proving the value that
    // reaches importConfig on disk is unscaled.
    const { result, file } = await importCaptured(captured);
    expect(result).toEqual({ success: true });
    const envelope = JSON.parse(await file.text());
    const decrypted = JSON.parse(
      CryptoJS.AES.decrypt(envelope.data, 'fDPy6vvnpPsYm2T0g1bh').toString(CryptoJS.enc.Utf8)) as KeyboardConfig;
    expect(decrypted.keyboards[0].advancedKeys.mt.delay).toBe(150);
  });
});

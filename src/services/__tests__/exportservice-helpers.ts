// Shared test helpers for the ExportService suites (sprint-21, tasks 1a/1b).
// Task 1a: buildKeyboardServiceMock (all 35 methods ExportService touches) +
// applyExportDefaults (programs the export-side happy path: V7-V9 of the sprint plan).
// Mocks pin SOFTWARE contracts only — they never claim device behavior.
import { vi } from 'vitest';

// V1 — default getLighting/getLogoLighting/getSpecialLighting value.
// Deliberately distinct from getDefaultLightConfig() so Error-fallback paths
// are distinguishable from successful reads in assertions.
const LIGHT_STATIC = {
  open: true,
  direction: false,
  superResponse: false,
  speed: 60,
  colors: ['#00FF00'],
  mode: 0,
  luminance: 80,
  sleepDelay: 5,
  staticColor: 1,
  type: 'static',
  dynamicColorId: 7,
};

// Fresh copy per call so tests can mutate one result without leaking into others.
const freshLightStatic = () => ({ ...LIGHT_STATIC, colors: [...LIGHT_STATIC.colors] });

export function buildKeyboardServiceMock() {
  return {
    defKey: vi.fn(),
    exportConfig: vi.fn(),
    getApi: vi.fn(),
    getAxis: vi.fn(),
    getBaseInfo: vi.fn(),
    getCustomLighting: vi.fn(),
    getDksAll: vi.fn(),
    getDksTravel: vi.fn(),
    getDpDr: vi.fn(),
    getEND: vi.fn(),
    getGlobalTouchTravel: vi.fn(),
    getLayoutKeyInfo: vi.fn(),
    getLighting: vi.fn(),
    getLogoLighting: vi.fn(),
    getMT: vi.fn(),
    getMpt: vi.fn(),
    getMtorTgl: vi.fn(),
    getPerformanceMode: vi.fn(),
    getRtTravel: vi.fn(),
    getSingleTravel: vi.fn(),
    getSocd: vi.fn(),
    getSpecialLighting: vi.fn(),
    getTGL: vi.fn(),
    getTrpsAll: vi.fn(),
    importConfig: vi.fn(),
    saveCustomLighting: vi.fn(),
    setCustomLighting: vi.fn(),
    setDksTravel: vi.fn(),
    setDp: vi.fn(),
    setDr: vi.fn(),
    setEND: vi.fn(),
    setLighting: vi.fn(),
    setLogoLighting: vi.fn(),
    setSocd: vi.fn(),
    setSpecialLighting: vi.fn(),
  };
}

export type KeyboardServiceMock = ReturnType<typeof buildKeyboardServiceMock>;

/**
 * Programs a fresh mock for the export-side happy path (sprint plan V7-V9).
 * V7: getBaseInfo non-Error; ROES→8, TOP_DEAD→true.
 * V8: defKey → two-key layout (keyValue 65, 66).
 * V9: all per-key getters return their fixed test values.
 * Setters resolve null; unexpected getApi types Error loudly instead of
 * silently returning undefined (typos must not pass as "missing data").
 */
export function applyExportDefaults(ks: KeyboardServiceMock): void {
  ks.getBaseInfo.mockResolvedValue({});
  ks.getApi.mockImplementation(async ({ type }: { type: string }) => {
    if (type === 'ORDER_TYPE_ROES') return 8;
    if (type === 'ORDER_TYPE_TOP_DEAD_SWITCH') return true;
    return new Error('unexpected getApi ' + type);
  });
  ks.defKey.mockResolvedValue([
    [
      { keyValue: 65, location: { row: 0, col: 0 } },
      { keyValue: 66, location: { row: 0, col: 1 } },
    ],
  ]);

  // Lighting — getLighting/getLogoLighting carry dynamicColorId; getSpecialLighting doesn't.
  ks.getLighting.mockImplementation(async () => freshLightStatic());
  ks.getLogoLighting.mockImplementation(async () => freshLightStatic());
  ks.getSpecialLighting.mockImplementation(async () => freshLightStatic());
  ks.setLighting.mockResolvedValue(null);
  ks.setLogoLighting.mockResolvedValue(null);
  ks.setSpecialLighting.mockResolvedValue(null);
  ks.getCustomLighting.mockImplementation(async (key: number) => ({ R: 1, G: 2, B: 3, key }));
  ks.setCustomLighting.mockResolvedValue(null);
  ks.saveCustomLighting.mockResolvedValue(undefined);

  // Per-key performance reads (V9).
  ks.getPerformanceMode.mockResolvedValue({ touchMode: 'rt', advancedKeyMode: 1 });
  ks.getRtTravel.mockResolvedValue({ pressTravel: 10, releaseTravel: 20 });
  ks.getDpDr.mockResolvedValue({ pressDead: 30, releaseDead: 40 });
  ks.getAxis.mockResolvedValue({ axis: 2 });
  ks.getGlobalTouchTravel.mockResolvedValue({ globalTouchTravel: 55 });
  ks.getSingleTravel.mockResolvedValue(77);

  // Advanced-feature reads (V9).
  ks.getDksAll.mockResolvedValue({ dks1: 1, dks2: 2, dks3: 3, dks4: 4 });
  ks.getTrpsAll.mockResolvedValue({ trps1: 5, trps2: 6, trps3: 7, trps4: 8 });
  ks.getDksTravel.mockImplementation(async (_key: number, dksLayout: string = 'Layout_DB1') =>
    dksLayout === 'Layout_DB1' ? 11 : dksLayout === 'Layout_DB2' ? 22 : dksLayout === 'Layout_DB3' ? 33 : new Error('unexpected dksLayout ' + dksLayout),
  );
  ks.getMpt.mockResolvedValue({ mpt: 1 });
  ks.getSocd.mockResolvedValue({ pos1: 1, pos2: 2, key1: 3, key2: 4, type: 0, mode: 1, delay: 150 });
  ks.getMT.mockResolvedValue({ dks1: 9, dks2: 8, dks3: 7, dks4: 6 });
  ks.getMtorTgl.mockResolvedValue(150);
  ks.getTGL.mockResolvedValue({ tgl: 2 });
  ks.getEND.mockResolvedValue({ dks: 3, delay: 250 });

  // Remapping layer reads (V9): layer 0 maps key 65→100, key 66 unmapped (undefined).
  ks.getLayoutKeyInfo.mockImplementation(async (params: { key: number; layout: number }[]) => {
    const layer = params[0]?.layout ?? 0;
    if (layer === 0) return [{ value: 100 }, { value: undefined }];
    return [];
  });

  // Import-side setters (export path never asserts these; programmed for reuse).
  ks.setDksTravel.mockResolvedValue(null);
  ks.setDp.mockResolvedValue(null);
  ks.setDr.mockResolvedValue(null);
  ks.setEND.mockResolvedValue(null);
  ks.setSocd.mockResolvedValue(null);
  ks.exportConfig.mockResolvedValue(undefined);
  ks.importConfig.mockResolvedValue({ success: true, error: null });
}

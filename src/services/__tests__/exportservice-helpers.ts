// Shared test helpers for the ExportService suites (sprint-21, tasks 1a/1b).
// Task 1a: buildKeyboardServiceMock (all 35 methods ExportService touches) +
// applyExportDefaults (programs the export-side happy path: V7-V9 of the sprint plan).
// Mocks pin SOFTWARE contracts only — they never claim device behavior.
import { vi } from 'vitest';
import CryptoJS from 'crypto-js';
import type { KeyboardConfig, Keyboards } from '@sparklinkplayjoy/sdk-keyboard/dist/esm/src/utils/validate';
import type { ILightMode } from '@sparklinkplayjoy/protocol-keyboard';

// V1 — default getLighting/getLogoLighting/getSpecialLighting value.
// Deliberately distinct from getDefaultLightConfig() so Error-fallback paths
// are distinguishable from successful reads in assertions.
export const LIGHT_STATIC: ILightMode & { dynamicColorId: number } = {
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

// ---- Part B (Task 1b): canonical fixture values V1–V7 + builders ----

// LightConfig is not exported from validate.d.ts — derive it (F17).
type LightConfig = KeyboardConfig['light']['main'];

// V2 — convertLightingToConfig(LIGHT_STATIC). Deliberately ≠ getDefaultLightConfig()
// (F4) so Error-fallback slots stay distinguishable from successful reads.
export const LIGHT_STATIC_CFG: LightConfig = {
  open: true,
  mode: 'static',
  staticColors: ['#00FF00'],
  selectStaticColor: 1,
  luminance: 80,
  speed: 60,
  sleepTime: 5,
  direction: false,
  dynamic: 0,
};

// V3 — convertLightConfigToSDKFormat(LIGHT_STATIC_CFG): the reverse of V2.
// This is what the import-side main/special lighting repairs must re-emit.
export const SDK_FORMAT_STATIC: Omit<ILightMode, 'open'> = {
  direction: false,
  speed: 60,
  colors: ['#00FF00'],
  luminance: 80,
  sleepDelay: 5,
  staticColor: 1,
  type: 'static',
  mode: 0,
  superResponse: false,
};

// V4 — export snapshot setLighting call #1 (F10 temp-switch: open forced true).
export const TEMP_SWITCH_EXPECTED: ILightMode = {
  open: true,
  direction: false,
  superResponse: false,
  speed: 60,
  colors: ['#00FF00'],
  mode: 21,
  luminance: 80,
  sleepDelay: 5,
  staticColor: 1,
  type: 'custom',
};

// V5 — import pre-switch setLighting call #1 (F13a: NO open, NO dynamicColorId).
export const PRE_SWITCH_EXPECTED: Omit<ILightMode, 'open'> = {
  direction: false,
  superResponse: false,
  speed: 60,
  colors: ['#00FF00'],
  mode: 21,
  luminance: 80,
  sleepDelay: 5,
  staticColor: 1,
  type: 'custom',
};

// V6 — export finally-restore setLighting (V1 minus dynamicColorId).
export const RESTORE_MAIN_EXPECTED: ILightMode = {
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
};

// V7 — gatherDeviceInfo with ROES→8, TOP_DEAD→true (Number(true)=1); identity static (F3).
export const SYSTEM_EXPECTED: KeyboardConfig['system'] = {
  rateOfReturn: 8,
  topDeadBandSwitch: 1,
  productId: 0,
  vendorId: 0,
  keyboardName: '',
  usage: 0,
  usagePage: 0,
};

// V8 — defKey layout: 1 row × 2 keys (65 at row0/col0, 66 at row0/col1).
// Consumed by applyExportDefaults (part A); export for tests asserting on defKey.
export const LAYOUT_FIXTURE: Array<Array<{ keyValue: number; location: { row: number; col: number } }>> = [
  [
    { keyValue: 65, location: { row: 0, col: 0 } },
    { keyValue: 66, location: { row: 0, col: 1 } },
  ],
];

// V10 — expected performance object for key 65 (per spec: isSingle:false).
export const EXPECTED_PERF: Keyboards['performance'] = {
  isGlobalTriggering: false,
  globalTriggeringValue: 55,
  isRt: true,
  isSingle: false,
  singleTriggeringValue: 77,
  rtPressValue: 10,
  rtReleaseValue: 20,
  axisID: 2,
  deadBandPressValue: 30,
  deadBandReleaseValue: 40,
  advancedKeyMode: 1,
};

// V11 — expected advancedKeys object (advancedType 'dks', value 1, all sub-blocks).
export const EXPECTED_ADV: Keyboards['advancedKeys'] = {
  advancedType: 'dks',
  value: 1,
  dks: { dks: { 1: 1, 2: 2, 3: 3, 4: 4 }, trps: { 1: 5, 2: 6, 3: 7, 4: 8 }, db: 11, db2: 22, db3: 33 },
  mpt: { mpt: 1 },
  socd: { pos1: 1, pos2: 2, key1: 3, key2: 4, type: 0, mode: 1, delay: 150 },
  mt: { dksAll: [9, 8, 7, 6], delay: 150 },
  tgl: { tgl: 2 },
  end: { dks: 3, delay: 250 },
};

// V12 — expected customKeys for key 65 (fn0 bound to 100) and light.custom {R:1,G:2,B:3}.
export const EXPECTED_CUSTOM_KEYS_65: Keyboards['customKeys'] = {
  fn0: { keyValue: 65, bindKeyValue: 100 },
  fn1: null,
  fn2: null,
  fn3: null,
};
export const EXPECTED_CUSTOM_KEYS_66: Keyboards['customKeys'] = {
  fn0: null,
  fn1: null,
  fn2: null,
  fn3: null,
};

export function makeLightMode(overrides: Partial<ILightMode & { dynamicColorId: number }> = {}) {
  return {
    open: true,
    direction: false,
    superResponse: false,
    speed: 60,
    colors: ['#00FF00'],
    mode: 0,
    luminance: 80,
    sleepDelay: 5,
    staticColor: 1,
    type: 'static' as const,
    dynamicColorId: 7,
    ...overrides,
  };
}

export function makeKeyboardEntry(
  overrides: Partial<Keyboards> & { keyValue: number; row: number; col: number },
): Keyboards {
  return {
    performance: { ...EXPECTED_PERF },
    advancedKeys: {
      advancedType: EXPECTED_ADV.advancedType,
      value: EXPECTED_ADV.value,
      dks: EXPECTED_ADV.dks,
      mpt: EXPECTED_ADV.mpt,
      socd: EXPECTED_ADV.socd,
      mt: EXPECTED_ADV.mt,
      tgl: EXPECTED_ADV.tgl,
      end: EXPECTED_ADV.end,
    },
    customKeys: overrides.keyValue === 66 ? EXPECTED_CUSTOM_KEYS_66 : EXPECTED_CUSTOM_KEYS_65,
    light: { custom: { R: 1, G: 2, B: 3, key: overrides.keyValue } },
    ...overrides,
  } as Keyboards;
}

export function makeConfig(overrides: Partial<KeyboardConfig> = {}): KeyboardConfig {
  return {
    light: {
      main: { ...LIGHT_STATIC_CFG },
      logo: { ...LIGHT_STATIC_CFG },
      other: { ...LIGHT_STATIC_CFG },
    },
    keyboards: [makeKeyboardEntry({ keyValue: 65, row: 0, col: 0 }), makeKeyboardEntry({ keyValue: 66, row: 0, col: 1 })],
    macro: { list: [], v2list: [] },
    system: { ...SYSTEM_EXPECTED },
    ...overrides,
  };
}

// Mirrors SDK exportEncryptedJSON: {data: AES.encrypt(JSON.stringify(cfg), key).toString()}.
export function makeEncryptedFile(cfg: KeyboardConfig): File {
  const key = 'fDPy6vvnpPsYm2T0g1bh';
  const str = JSON.stringify({ data: CryptoJS.AES.encrypt(JSON.stringify(cfg), key).toString() });
  return { text: async () => str } as unknown as File;
}

// Map-backed localStorage stub (get/set/remove/clear). Preset MacroList='["local"]' per F1.
export function makeLocalStorage(presets: Record<string, string> = { MacroList: '["local"]' }) {
  const store = new Map<string, string>(Object.entries(presets));
  return {
    getItem: vi.fn((k: string) => (store.has(k) ? store.get(k)! : null)),
    setItem: vi.fn((k: string, v: string) => {
      store.set(k, String(v));
    }),
    removeItem: vi.fn((k: string) => {
      store.delete(k);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
  };
}

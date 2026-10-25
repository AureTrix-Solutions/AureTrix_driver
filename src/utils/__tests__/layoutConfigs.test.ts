import { describe, it, expect, vi } from 'vitest';

const fixture = vi.hoisted(() => ({
  productName: 'PM-Test-Custom',
  hasAxisList: false,
  keySizes: [[19.05]],
  gapsAfterCol: [{}],
  rowSpacing: [20.05],
  createdAt: 0,
  updatedAt: 0,
}));

vi.mock('@/services/LayoutStorageService', () => ({
  default: { getAllLayouts: vi.fn(async () => [fixture]) },
}));

import { getLayoutConfig, getPaddedKeySizes, loadCustomLayouts } from '@/utils/layoutConfigs';

describe('layoutConfigs priority chain', () => {
  it('P1: IndexedDB custom layout beats shared and fallback layouts', async () => {
    await loadCustomLayouts();
    const cfg = getLayoutConfig(0, undefined, undefined, undefined, undefined, 'PM-Test-Custom');
    expect(cfg.rows).toBe(1);
    expect(cfg.cols).toBe(1);
  });

  it('P2: sharedLayout by productName wins when no custom layout matches', () => {
    const cfg = getLayoutConfig(0, undefined, undefined, undefined, undefined, 'Slice75 HE');
    expect(cfg.rows).toBe(6);
    expect(cfg.cols).toBe(15);
  });

  it('P3: built-in layoutMap by key count when no productName match', () => {
    const cfg = getLayoutConfig(61, undefined, undefined, undefined, undefined);
    expect(cfg.rows).toBe(5);
    expect(cfg.cols).toBe(14);
  });

  it('P4: default fallback for unknown key count and product', () => {
    const cfg = getLayoutConfig(999, undefined, undefined, undefined, undefined, 'NoSuchProduct');
    expect(cfg.rows).toBe(6);
    expect(cfg.cols).toBe(1);
  });
});

describe('layoutConfigs geometry', () => {
  it('61-key row 0: 14 entries, pinned first/second/last positions', () => {
    const cfg = getLayoutConfig(61, undefined, undefined, undefined, undefined);
    expect(cfg.keyPositions[0]).toHaveLength(14);
    expect(cfg.keyPositions[0][0]).toEqual([0, 0, 72, 72]);
    expect(cfg.keyPositions[0][1]).toEqual([76, 0, 72, 72]);
    expect(cfg.keyPositions[0][13]).toEqual([988, 0, 136, 72]);
  });

  it('61-key row 4 (probe P8): full row + zero gaps + 304px top offset', () => {
    const cfg = getLayoutConfig(61, undefined, undefined, undefined, undefined);
    expect(cfg.keyPositions[4]).toEqual([
      [0, 304, 90, 72], [94, 304, 90, 72], [188, 304, 90, 72], [282, 304, 466, 72],
      [752, 304, 90, 72], [846, 304, 90, 72], [940, 304, 90, 72], [1034, 304, 90, 72],
    ]);
    expect(cfg.gaps).toEqual([0, 0, 0, 0, 0]);
  });

  it('67-key (probe P17): 5×15 with row-4 gap shift at key 6', () => {
    const cfg = getLayoutConfig(67, undefined, undefined, undefined, undefined);
    expect(cfg.rows).toBe(5);
    expect(cfg.cols).toBe(15);
    expect(cfg.keyPositions[4]).toEqual([
      [0, 304, 90, 72], [94, 304, 90, 72], [188, 304, 90, 72], [282, 304, 466, 72],
      [752, 304, 90, 72], [846, 304, 90, 72], [976, 304, 72, 72], [1052, 304, 72, 72],
      [1128, 304, 72, 72],
    ]);
  });

  it('getPaddedKeySizes pads null and [] to 6 rows of [19.05]', () => {
    const expected = [[19.05], [19.05], [19.05], [19.05], [19.05], [19.05]];
    expect(getPaddedKeySizes(null)).toEqual(expected);
    expect(getPaddedKeySizes([])).toEqual(expected);
  });
});

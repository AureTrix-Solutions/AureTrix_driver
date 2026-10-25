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

import { getLayoutConfig, loadCustomLayouts } from '@/utils/layoutConfigs';

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

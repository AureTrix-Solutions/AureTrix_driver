import { describe, it, expect } from 'vitest';
import { uToMm, mmToU, mmToPx, KEY_SIZES, MM_TO_PX } from '@utils/keyUnits';

describe('uToMm', () => {
  it('returns empirical table values for known units', () => {
    expect(uToMm(1)).toBe(19.05);
    expect(uToMm(2)).toBe(35.999);
    expect(uToMm(1.75)).toBe(32.3); // table entry, NOT 1.75 × 19.05
  });
  it('falls back to units × 19.05 for unknown units', () => {
    expect(uToMm(3)).toBeCloseTo(57.15, 10); // 57.150000000000006 float
  });
});

describe('mmToU', () => {
  it('inverts table values', () => {
    expect(mmToU(19.05)).toBe(1);
    expect(mmToU(35.999)).toBe(2);
    expect(mmToU(38.1)).toBe(2); // probe-pinned value
  });
  it('falls back to mm ÷ 19.05', () => {
    expect(mmToU(0)).toBe(0);
  });
});

describe('mmToPx and exported constants', () => {
  it('rounds mm to px', () => {
    expect(mmToPx(19.05)).toBe(72);
    expect(mmToPx(0)).toBe(0);
  });
  it('pins KEY_SIZES length and MM_TO_PX', () => {
    expect(KEY_SIZES).toHaveLength(9);
    expect(MM_TO_PX).toBe(3.7795275591);
  });
});

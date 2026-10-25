import { describe, it, expect } from 'vitest';
import { uToMm } from '@utils/keyUnits';

describe('test infra smoke', () => {
  it('resolves path aliases and asserts real module values', () => {
    expect(uToMm(1)).toBe(19.05);
  });
});

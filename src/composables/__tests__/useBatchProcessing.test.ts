import { describe, it, expect, vi } from 'vitest';
import { useBatchProcessing } from '@/composables/useBatchProcessing';

describe('useBatchProcessing', () => {
  it('processes a number array in batches, calling updateFn per key in order', async () => {
    const { processBatches } = useBatchProcessing();
    const spy = vi.fn(async (k: number) => k);
    await processBatches([10, 20, 30, 40, 50], spy, 2, 10);
    expect(spy).toHaveBeenCalledTimes(5);
    expect(spy.mock.calls.map(c => c[0])).toEqual([10, 20, 30, 40, 50]);
  });

  it('maps an object array to physicalKeyValue only (keyValue never passed)', async () => {
    const { processBatches } = useBatchProcessing();
    const spy = vi.fn(async (k: number) => k);
    await processBatches(
      [{ physicalKeyValue: 7, keyValue: 99 }, { physicalKeyValue: 8, keyValue: 98 }],
      spy
    );
    expect(spy.mock.calls.map(c => c[0])).toEqual([7, 8]);
  });

  it('does nothing for an empty array', async () => {
    const { processBatches } = useBatchProcessing();
    const spy = vi.fn(async (k: number) => k);
    await processBatches([], spy, 80, 100);
    expect(spy).toHaveBeenCalledTimes(0);
  });
});

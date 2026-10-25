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

  it('gates the next batch behind the inter-batch delay (fake timers)', async () => {
    const { processBatches } = useBatchProcessing();
    const spy = vi.fn(async (k: number) => k);
    vi.useFakeTimers();
    try {
      const p = processBatches([1, 2, 3], spy, 1, 100); // not awaited
      expect(spy.mock.calls.map(c => c[0])).toEqual([1]); // batch 1 starts synchronously
      await vi.advanceTimersByTimeAsync(99);
      expect(spy).toHaveBeenCalledTimes(1); // delay gates the next batch
      await vi.advanceTimersByTimeAsync(1);
      await vi.runAllTimersAsync(); // delay runs after EVERY batch, incl. the last (P14)
      await p;
      expect(spy.mock.calls.map(c => c[0])).toEqual([1, 2, 3]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('runs updateFns within a batch concurrently (Promise.all semantics)', async () => {
    const { processBatches } = useBatchProcessing();
    const started: number[] = [];
    const deferreds: { resolve: (v: number) => void }[] = [];
    const updateFn = (k: number) => {
      started.push(k);
      return new Promise<number>(res => { deferreds.push({ resolve: res }); });
    };
    const p = processBatches([1, 2], updateFn, 2, 0);
    expect(started).toEqual([1, 2]); // BOTH started before either resolves
    deferreds[0].resolve(1);
    deferreds[1].resolve(2);
    await p;
    expect(started).toEqual([1, 2]); // no extra calls after resolution
  });
});

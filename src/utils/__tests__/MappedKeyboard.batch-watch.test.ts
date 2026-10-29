import { describe, it, expect, beforeEach, afterEach, vi, type MockInstance } from 'vitest';
import { ref, nextTick } from 'vue';
import { setActivePinia, createPinia } from 'pinia';

vi.mock('@services/KeyboardService', () => ({
  default: {
    defKey: vi.fn(),
    getLayoutKeyInfo: vi.fn(),
    setKey: vi.fn(),
  },
}));

vi.mock('@utils/layoutConfigs', () => ({
  getLayoutConfig: vi.fn(),
}));

import KeyboardService from '@services/KeyboardService';
import { useConnectionStore } from '../../store/connection';
import { useMappedKeyboard } from '../MappedKeyboard';
import type { IDefKeyInfo } from '../../types/types';

const defKeyMock = vi.mocked(KeyboardService.defKey);
const setKeyMock = vi.mocked(KeyboardService.setKey);

// Single-key base fixture: enough for the watch-triggered null-layer fetch
const baseFixture: IDefKeyInfo[][] = [
  [{ keyValue: 10, location: { row: 0, col: 0 } }],
];

function makeConfigs(n: number) {
  return Array.from({ length: n }, (_, i) => ({ key: i, layout: 0, value: 100 + i }));
}

function setup(layerIndexValue: number | null = null, connected = true) {
  const store = useConnectionStore();
  store.isConnected = connected; // set BEFORE composable creation so the watch never fires at setup
  const kb = useMappedKeyboard(ref<number | null>(layerIndexValue));
  return { store, kb };
}

describe('useMappedKeyboard batchSetKey', () => {
  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('25 configs, default batchSize 10: setKey called 3x with exact slices 10/10/5', async () => {
    setKeyMock.mockResolvedValue(undefined);
    const configs = makeConfigs(25);
    const { kb } = setup();

    await kb.batchSetKey(configs);

    expect(setKeyMock).toHaveBeenCalledTimes(3);
    expect(setKeyMock.mock.calls[0][0]).toStrictEqual(configs.slice(0, 10));
    expect(setKeyMock.mock.calls[1][0]).toStrictEqual(configs.slice(10, 20));
    expect(setKeyMock.mock.calls[2][0]).toStrictEqual(configs.slice(20, 25));
    expect(setKeyMock.mock.calls[0][0]).toHaveLength(10);
    expect(setKeyMock.mock.calls[2][0]).toHaveLength(5);
  });

  it('custom batchSize 5: 12 configs -> 3 calls with lengths 5/5/2', async () => {
    setKeyMock.mockResolvedValue(undefined);
    const configs = makeConfigs(12);
    const { kb } = setup();

    await kb.batchSetKey(configs, 5);

    expect(setKeyMock).toHaveBeenCalledTimes(3);
    expect(setKeyMock.mock.calls[0][0]).toHaveLength(5);
    expect(setKeyMock.mock.calls[1][0]).toHaveLength(5);
    expect(setKeyMock.mock.calls[2][0]).toStrictEqual(configs.slice(10, 12));
  });

  it('empty config array: setKey never called, resolves cleanly', async () => {
    const { kb } = setup();

    await expect(kb.batchSetKey([])).resolves.toBeUndefined();
    expect(setKeyMock).not.toHaveBeenCalled();
  });

  it('setKey rejects on batch 1: rejects Error("Failed to set key batch") with cause; later batches do NOT run', async () => {
    const hidError = new Error('hid write fail');
    setKeyMock.mockRejectedValueOnce(hidError).mockResolvedValue(undefined);
    const { kb } = setup();

    const rejection = await kb.batchSetKey(makeConfigs(25)).then(
      () => null,
      (e: unknown) => e as Error
    );

    expect(rejection).toBeInstanceOf(Error);
    expect(rejection?.message).toBe('Failed to set key batch');
    expect(rejection?.cause).toBe(hidError);
    expect(setKeyMock).toHaveBeenCalledTimes(1); // throw aborts the loop
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0][0]).toBe('Batch setKey failed for keys 0 to 9:');
  });

  it('setKey RESOLVING an Error is detected: rejects with cause, later batches do NOT run', async () => {
    const busy = new Error('device busy');
    setKeyMock.mockResolvedValue(busy);
    const { kb } = setup();

    const rejection = await kb.batchSetKey(makeConfigs(25)).then(
      () => null,
      (e: unknown) => e as Error
    );

    expect(rejection).toBeInstanceOf(Error);
    expect(rejection?.message).toBe('Failed to set key batch');
    expect(rejection?.cause).toBe(busy);
    expect(setKeyMock).toHaveBeenCalledTimes(1); // resolved Error aborts the loop
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0][0]).toBe('Batch setKey failed for keys 0 to 9:');
  });

  it('batches run SEQUENTIALLY: batch 2 starts only after batch 1 resolves (await inside loop)', async () => {
    let resolveFirst!: () => void;
    const gate = new Promise<void>(r => { resolveFirst = r; });
    setKeyMock
      .mockImplementationOnce(async () => { await gate; return undefined; })
      .mockResolvedValue(undefined);
    const { kb } = setup();

    const p = kb.batchSetKey(makeConfigs(25));
    await nextTick();
    expect(setKeyMock).toHaveBeenCalledTimes(1); // batch 2 blocked on the gate

    resolveFirst();
    await p;
    expect(setKeyMock).toHaveBeenCalledTimes(3);
  });
});

describe('useMappedKeyboard connection watch', () => {
  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('disconnect after load: FULL reset — layout [], loaded false, baseLayout null, error null; no fetch fired', async () => {
    defKeyMock.mockResolvedValue(baseFixture);
    const { store, kb } = setup(null, true);
    await kb.fetchLayerLayout();
    expect(kb.loaded.value).toBe(true);
    expect(kb.baseLayout.value).toStrictEqual(baseFixture);

    store.isConnected = false;
    await nextTick(); // watch default flush 'pre'

    expect(kb.layout.value).toEqual([]);
    expect(kb.loaded.value).toBe(false);
    expect(kb.baseLayout.value).toBeNull(); // baseLayout reset too — pinned
    expect(kb.error.value).toBeNull();
    expect(defKeyMock).toHaveBeenCalledTimes(1); // disconnect never triggers a fetch
  });

  it('connect from disconnected: watch fires fetchLayerLayout — defKey called, null-layer path completes', async () => {
    defKeyMock.mockResolvedValue(baseFixture);
    const { store, kb } = setup(null, false);
    expect(defKeyMock).not.toHaveBeenCalled();

    store.isConnected = true;
    await nextTick(); // watch callback runs, starts the async fetch
    await vi.waitFor(() => expect(kb.loaded.value).toBe(true)); // flush pending promises

    expect(defKeyMock).toHaveBeenCalledTimes(1);
    expect(kb.layout.value).toStrictEqual(baseFixture);
    expect(kb.error.value).toBeNull();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});

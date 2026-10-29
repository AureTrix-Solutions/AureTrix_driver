import { describe, it, expect, beforeEach, afterEach, vi, type MockInstance } from 'vitest';
import { ref } from 'vue';
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
const getLayoutKeyInfoMock = vi.mocked(KeyboardService.getLayoutKeyInfo);

// Base fixture: 1 row, 2 keys (matches spec case list)
const baseFixture: IDefKeyInfo[][] = [
  [
    { keyValue: 10, location: { row: 0, col: 0 } },
    { keyValue: 20, location: { row: 0, col: 1 } },
  ],
];

// 11 keys in one row -> 2 request batches (batchSize 10): keys 100..109, then 110
const elevenKeyFixture: IDefKeyInfo[][] = [
  Array.from({ length: 11 }, (_, i) => ({
    keyValue: 100 + i,
    location: { row: 0, col: i },
  })),
];

function setup(layerIndexValue: number | null = null) {
  const store = useConnectionStore();
  store.isConnected = true; // set BEFORE composable creation so the watch never fires
  const kb = useMappedKeyboard(ref<number | null>(layerIndexValue));
  return { store, kb };
}

describe('useMappedKeyboard fetchLayerLayout behavior', () => {
  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('not connected: resets layout/loaded, never calls defKey, error stays null', async () => {
    const store = useConnectionStore(); // default isConnected === false
    const kb = useMappedKeyboard(ref<number | null>(null));

    await kb.fetchLayerLayout();

    expect(kb.layout.value).toEqual([]);
    expect(kb.loaded.value).toBe(false);
    expect(defKeyMock).not.toHaveBeenCalled();
    expect(kb.error.value).toBeNull();
    expect(store.isConnected).toBe(false);
  });

  it('layerIndex null: layout is the defKey result, loaded true, no getLayoutKeyInfo', async () => {
    defKeyMock.mockResolvedValue(baseFixture);
    const { kb } = setup(null);

    await kb.fetchLayerLayout();

    // toStrictEqual, not toBe: ref() wraps the value in a reactive proxy (Object.is fails)
    expect(kb.layout.value).toStrictEqual(baseFixture);
    expect(kb.loaded.value).toBe(true);
    expect(kb.error.value).toBeNull();
    expect(getLayoutKeyInfoMock).not.toHaveBeenCalled();
  });

  it('happy merge: remapped values applied, value===1 becomes 0, physicalKeyValue + location from base', async () => {
    defKeyMock.mockResolvedValue(baseFixture);
    getLayoutKeyInfoMock.mockResolvedValue([
      { key: 10, value: 65, layout: 1 },
      { key: 20, value: 1, layout: 1 },
    ]);
    const { kb } = setup(1);

    await kb.fetchLayerLayout();

    expect(kb.loaded.value).toBe(true);
    expect(kb.layout.value).toEqual([
      [
        { keyValue: 65, physicalKeyValue: 10, location: { row: 0, col: 0 } },
        { keyValue: 0, physicalKeyValue: 20, location: { row: 0, col: 1 } },
      ],
    ]);
  });

  it('request payload pinned: one batch [{key,layout}] per base key with currentLayer', async () => {
    defKeyMock.mockResolvedValue(baseFixture);
    getLayoutKeyInfoMock.mockResolvedValue([{ key: 10, value: 65, layout: 1 }]);
    const { kb } = setup(1);

    await kb.fetchLayerLayout();

    expect(getLayoutKeyInfoMock).toHaveBeenCalledTimes(1);
    expect(getLayoutKeyInfoMock).toHaveBeenCalledWith([
      { key: 10, layout: 1 },
      { key: 20, layout: 1 },
    ]);
  });

  it('out-of-range layer values (70000, -5) fall back to base keyValue', async () => {
    defKeyMock.mockResolvedValue(baseFixture);
    getLayoutKeyInfoMock.mockResolvedValue([
      { key: 10, value: 70000, layout: 1 },
      { key: 20, value: -5, layout: 1 },
    ]);
    const { kb } = setup(1);

    await kb.fetchLayerLayout();

    expect(kb.layout.value[0][0].keyValue).toBe(10);
    expect(kb.layout.value[0][1].keyValue).toBe(20);
    expect(kb.loaded.value).toBe(true);
  });

  it('layer items missing the value property are filtered out (key keeps base keyValue)', async () => {
    defKeyMock.mockResolvedValue(baseFixture);
    getLayoutKeyInfoMock.mockResolvedValue([
      { key: 10, layout: 1 }, // no value -> 'value' in item fails -> filtered
      { key: 20, value: 99, layout: 1 },
    ]);
    const { kb } = setup(1);

    await kb.fetchLayerLayout();

    expect(kb.layout.value[0][0].keyValue).toBe(10); // filtered -> base
    expect(kb.layout.value[0][1].keyValue).toBe(99); // valid -> merged
    expect(kb.loaded.value).toBe(true);
  });

  it('duplicate layer keys in one response: the LATER entry wins (Map.set overwrite)', async () => {
    defKeyMock.mockResolvedValue(baseFixture);
    getLayoutKeyInfoMock.mockResolvedValue([
      { key: 10, value: 65, layout: 1 },
      { key: 10, value: 99, layout: 1 },
    ]);
    const { kb } = setup(1);

    await kb.fetchLayerLayout();

    expect(kb.layout.value[0][0].keyValue).toBe(99);
  });

  it('getLayoutKeyInfo resolving an Error is skipped silently; all-empty layer data retries 5x to the final error', async () => {
    vi.useFakeTimers();
    defKeyMock.mockResolvedValue(baseFixture);
    getLayoutKeyInfoMock.mockResolvedValue(new Error('device busy')); // resolved Error -> silent skip
    const { kb } = setup(1);

    const p = kb.fetchLayerLayout();
    await vi.runAllTimersAsync(); // 4 retry sleeps between 5 attempts
    await p;

    expect(getLayoutKeyInfoMock).toHaveBeenCalledTimes(5); // 1 batch x 5 attempts
    expect(defKeyMock).toHaveBeenCalledTimes(5);
    expect(kb.error.value).toBe('Failed to load keyboard layout after multiple attempts');
    expect(kb.layout.value).toEqual([]);
    expect(kb.loaded.value).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(5); // attempt logs only, no per-batch log for resolved Errors
  });

  it('one batch rejecting: console.error logged, remaining batches still merge (partial tolerance)', async () => {
    defKeyMock.mockResolvedValue(elevenKeyFixture);
    getLayoutKeyInfoMock
      .mockRejectedValueOnce(new Error('hid write fail')) // batch 1 (keys 100..109)
      .mockResolvedValueOnce([{ key: 110, value: 500, layout: 1 }]); // batch 2 (key 110)
    const { kb } = setup(1);

    await kb.fetchLayerLayout();

    expect(getLayoutKeyInfoMock).toHaveBeenCalledTimes(2);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0][0]).toBe('Failed to fetch batch in layer 2:');
    expect(kb.loaded.value).toBe(true); // allLayerData non-empty -> no retry storm
    const row = kb.layout.value[0];
    expect(row[10].keyValue).toBe(500); // merged from surviving batch
    expect(row[10].physicalKeyValue).toBe(110);
    for (let i = 0; i < 10; i++) {
      expect(row[i].keyValue).toBe(100 + i); // failed batch keys keep base keyValue
      expect(row[i].physicalKeyValue).toBe(100 + i);
    }
  });

  it('defKey resolving an Error retries 5x (four 1000ms sleeps) to the overwritten final error', async () => {
    vi.useFakeTimers();
    defKeyMock.mockResolvedValue(new Error('no device'));
    const { kb } = setup(null);

    const p = kb.fetchLayerLayout();
    await vi.runAllTimersAsync();
    await p;

    expect(defKeyMock).toHaveBeenCalledTimes(5);
    expect(kb.error.value).toBe('Failed to load keyboard layout after multiple attempts'); // per-attempt message overwritten
    expect(kb.layout.value).toEqual([]);
    expect(kb.loaded.value).toBe(false);
  });

  it('defKey resolving [] retries 5x (Empty or invalid base layout) to the same final error', async () => {
    vi.useFakeTimers();
    defKeyMock.mockResolvedValue([]);
    const { kb } = setup(null);

    const p = kb.fetchLayerLayout();
    await vi.runAllTimersAsync();
    await p;

    expect(defKeyMock).toHaveBeenCalledTimes(5);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(5);
    expect(kb.error.value).toBe('Failed to load keyboard layout after multiple attempts');
    expect(kb.loaded.value).toBe(false);
  });

  it('baseLayout stickiness: second fetch keeps the FIRST base layout (AS-IS pin)', async () => {
    const fixtureA: IDefKeyInfo[][] = [[{ keyValue: 10, location: { row: 0, col: 0 } }]];
    const fixtureB: IDefKeyInfo[][] = [[{ keyValue: 77, location: { row: 0, col: 0 } }]];
    defKeyMock.mockResolvedValue(fixtureA);
    const { kb } = setup(null);

    await kb.fetchLayerLayout();
    expect(kb.baseLayout.value).toStrictEqual(fixtureA);

    defKeyMock.mockResolvedValue(fixtureB);
    await kb.fetchLayerLayout();

    // `if (!baseLayout.value)` guard — never replaced; marker keyValue 77 must never appear
    expect(kb.baseLayout.value).toStrictEqual(fixtureA);
    expect(kb.layout.value).toStrictEqual(fixtureA); // null-layer path returns the STUCK baseLayout, not fresh B
  });
});

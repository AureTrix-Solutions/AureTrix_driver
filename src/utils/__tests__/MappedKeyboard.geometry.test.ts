import { describe, it, expect, beforeEach, vi } from 'vitest';
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
import { getLayoutConfig } from '@utils/layoutConfigs';
import { useConnectionStore } from '../../store/connection';
import { useMappedKeyboard } from '../MappedKeyboard';
import type { IDefKeyInfo } from '../../types/types';

const defKeyMock = vi.mocked(KeyboardService.defKey);
const getLayoutKeyInfoMock = vi.mocked(KeyboardService.getLayoutKeyInfo);
const getLayoutConfigMock = vi.mocked(getLayoutConfig);

// 3 keys total: row0 has 2 keys, row1 has 1 key
const baseFixture: IDefKeyInfo[][] = [
  [{ keyValue: 10 }, { keyValue: 20 }],
  [{ keyValue: 30 }],
];

// Hand-computed against the gridStyle reduce (PM-verified):
// containerHeight = (max(0+40, 0+40) + gaps[0]=0) + (max(50+40) + gaps[1]=10) = 40 + 100 = 140
// maxRowWidth = max(40+60, 40) = 100
const positionFixture = {
  rows: 2,
  cols: 2,
  keyPositions: [
    [[0, 0, 40, 40], [40, 0, 60, 40]],
    [[0, 50, 40, 40]],
  ],
  gaps: [0, 10],
};

function setup() {
  const store = useConnectionStore();
  store.isConnected = true; // set BEFORE composable creation so the watch never fires
  const kb = useMappedKeyboard(ref(null));
  return { store, kb };
}

describe('useMappedKeyboard geometry (gridStyle/getKeyStyle)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    defKeyMock.mockResolvedValue(baseFixture);
    getLayoutConfigMock.mockReturnValue(positionFixture);
  });

  it('gridStyle is {} before any fetch (baseLayout null)', () => {
    const { kb } = setup();
    expect(kb.gridStyle.value).toEqual({});
  });

  it('getKeyStyle is {} before any fetch (baseLayout null)', () => {
    const { kb } = setup();
    expect(kb.getKeyStyle(0, 0)).toEqual({});
  });

  it('null-layer fetch loads the base layout and never calls getLayoutKeyInfo', async () => {
    const { kb } = setup();
    await kb.fetchLayerLayout();
    expect(kb.layout.value).toEqual(baseFixture);
    expect(kb.loaded.value).toBe(true);
    expect(getLayoutKeyInfoMock).not.toHaveBeenCalled();
  });

  it('gridStyle computes height/width from keyPositions + gaps', async () => {
    const { kb } = setup();
    await kb.fetchLayerLayout();
    expect(kb.gridStyle.value).toEqual({
      position: 'relative',
      height: '140px',
      width: '100px',
      margin: '0 auto',
    });
  });

  it('getLayoutConfig receives (totalKeys, baseLayout, undefined x3, undefined productName) while deviceInfo is null', async () => {
    const { kb } = setup();
    await kb.fetchLayerLayout();
    void kb.gridStyle.value; // trigger the computed
    expect(getLayoutConfigMock).toHaveBeenCalledWith(
      3, baseFixture, undefined, undefined, undefined, undefined
    );
  });

  it('getLayoutConfig receives deviceInfo.productName as 6th arg when set', async () => {
    const { store, kb } = setup();
    store.deviceInfo = { productName: 'X', id: '1' };
    await kb.fetchLayerLayout();
    void kb.gridStyle.value;
    expect(getLayoutConfigMock).toHaveBeenCalledWith(
      3, baseFixture, undefined, undefined, undefined, 'X'
    );
  });

  it('gridStyle collapses to { height 0px, width 0px } on empty keyPositions', async () => {
    getLayoutConfigMock.mockReturnValue({ rows: 0, cols: 0, keyPositions: [], gaps: [] });
    const { kb } = setup();
    await kb.fetchLayerLayout();
    expect(kb.gridStyle.value).toEqual({ height: '0px', width: '0px' });
  });

  it('getKeyStyle(0,1) returns the absolute box with 4px marginBottom and data-overlay', async () => {
    const { kb } = setup();
    await kb.fetchLayerLayout();
    expect(kb.getKeyStyle(0, 1)).toEqual({
      position: 'absolute',
      left: '40px',
      top: '0px',
      width: '60px',
      height: '40px',
      marginBottom: '4px',
      boxSizing: 'border-box',
      'data-overlay': '',
    });
  });

  it('getKeyStyle(1,0) adds the row gap to top (50 + gaps[1]=10 → 60px)', async () => {
    const { kb } = setup();
    await kb.fetchLayerLayout();
    expect(kb.getKeyStyle(1, 0)).toMatchObject({ top: '60px', left: '0px' });
  });

  it('getKeyStyle with colIdx >= row length returns the zeroed box', async () => {
    const { kb } = setup();
    await kb.fetchLayerLayout();
    expect(kb.getKeyStyle(0, 5)).toEqual({
      width: '0px',
      height: '0px',
      left: '0px',
      top: '0px',
    });
  });
});

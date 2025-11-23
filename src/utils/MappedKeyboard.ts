import { ref, computed, Ref } from 'vue';
import KeyboardService from '@services/KeyboardService';
import { getLayoutConfig } from '@utils/layoutConfigs';
import type { IDefKeyInfo } from '../types/types';
import { useConnectionStore } from '../store/connection';
import { mmToPx } from '@utils/keyUnits';

export function useMappedKeyboard(layerIndex: Ref<number | null>) {
  const connectionStore = useConnectionStore();
  const layout = ref<IDefKeyInfo[][]>([]);
  const loaded = ref(false);
  const baseLayout = ref<IDefKeyInfo[][] | null>(null);
  const error = ref<string | null>(null);

  // Grid computation
  const gridStyle = computed(() => {
    if (!baseLayout.value) {
      return {};
    }
    const totalKeys = baseLayout.value.flat().length;
    const productName = connectionStore.deviceInfo?.productName;
    const { keyPositions, gaps } = getLayoutConfig(totalKeys, baseLayout.value, undefined, undefined, undefined, productName);
    if (!keyPositions || keyPositions.length === 0) {
      return { height: '0px', width: '0px' };
    }
    const containerHeight = keyPositions.reduce((max, row, i) => max + Math.max(...row.map(pos => pos[1] + pos[3])) + (gaps[i] || 0), 0);
    const maxRowWidth = Math.max(...keyPositions.map(row => row.reduce((sum, pos) => sum + pos[2], 0)));
    return {
      position: 'relative',
      height: `${containerHeight}px`,
      width: `${maxRowWidth}px`,
      margin: '0 auto',
    };
  });

  const getKeyStyle = (rowIdx: number, colIdx: number) => {
    if (!baseLayout.value) {
      return {};
    }
    const totalKeys = baseLayout.value.flat().length;
    const productName = connectionStore.deviceInfo?.productName;
    const { keyPositions, gaps } = getLayoutConfig(totalKeys, baseLayout.value, undefined, undefined, undefined, productName);
    const rowLength = baseLayout.value[rowIdx]?.length || 0;
    if (!keyPositions || !keyPositions[rowIdx] || !Array.isArray(keyPositions[rowIdx]) || colIdx >= rowLength) {
      return { width: '0px', height: '0px', left: '0px', top: '0px' };
    }
    const [left, top, width, height] = keyPositions[rowIdx][colIdx];
    const topGapPx = gaps[rowIdx] || 0;
    return {
      position: 'absolute',
      left: `${left}px`,
      top: `${top + topGapPx}px`,
      width: `${width}px`,
      height: `${height}px`,
      marginBottom: `${mmToPx(1)}px`,
      boxSizing: 'border-box',
      'data-overlay': '',
    };
  };

  // Batch key setting with retries
  async function batchSetKey(config: { key: number; layout: number; value: number }[], batchSize: number = 10) {
    for (let i = 0; i < config.length; i += batchSize) {
      const batch = config.slice(i, i + batchSize);
      try {
        await KeyboardService.setKey(batch);
      } catch (error) {
        console.error(`Batch setKey failed for keys ${batch[0].key} to ${batch[batch.length - 1].key}:`, error);
        throw new Error(`Failed to set key batch`);
      }
    }
  }

  // Fetch layout for current layer
  async function fetchLayerLayout() {
    if (!connectionStore.isConnected) {
      error.value = 'No keyboard connected';
      layout.value = [];
      loaded.value = false;
      return;
    }
    error.value = null;
    const maxRetries = 5;
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        const newBaseLayout = await KeyboardService.defKey();
        if (!newBaseLayout || newBaseLayout.length === 0) {
          throw new Error('Empty or invalid base layout received');
        }
        if (!baseLayout.value) {
          baseLayout.value = newBaseLayout;
          const totalKeys = newBaseLayout.flat().length;
        }
        const totalKeys = newBaseLayout.flat().length;

        if (layerIndex.value === null) {
          layout.value = baseLayout.value;
          loaded.value = true;
          return;
        }

        const batchSize = 10;
        const requests = [];
        for (let i = 0; i < newBaseLayout.flat().length; i += batchSize) {
          const startIdx = i;
          const endIdx = Math.min(i + batchSize - 1, newBaseLayout.flat().length - 1);
          const batch = newBaseLayout.flat().slice(startIdx, endIdx + 1).map(k => ({ key: k.keyValue, layout: layerIndex.value }));
          requests.push(batch);
        }
        const allLayerData = [];
        for (const request of requests) {
          try {
            const layerData = await KeyboardService.getLayoutKeyInfo(request);
            allLayerData.push(...layerData);
          } catch (error) {
            console.error(`Failed to fetch batch for keys ${request[0].key} to ${request[request.length - 1].key} in layer ${layerIndex.value + 1}:`, error);
          }
        }

        if (allLayerData.length === 0) {
          throw new Error('No layer data received');
        }

        const uniqueLayerData = new Map<number, { key: number; value: number }>();
        allLayerData.forEach(item => {
          if (item && typeof item === 'object' && 'key' in item && 'value' in item) {
            uniqueLayerData.set(item.key, { key: item.key, value: item.value });
          }
        });

        const layerLayout: IDefKeyInfo[][] = newBaseLayout.map(row =>
          row.map(baseKey => {
            const layerKey = uniqueLayerData.get(baseKey.keyValue);
            let keyValue = baseKey.keyValue;
            if (layerKey) {
              keyValue = layerKey.value;
              if (keyValue === 1) {
                keyValue = 0;
              }
            } else {
              console.warn(`No unique mapping found for key ${baseKey.keyValue} in layer ${layerIndex.value + 1}, using base value: ${keyValue}`);
            }
            if (keyValue < 0 || keyValue > 65535) {
              console.warn(`Invalid value ${keyValue} for key ${baseKey.keyValue} in layer ${layerIndex.value + 1}, using default: ${baseKey.keyValue}`);
              keyValue = baseKey.keyValue;
            }
            return {
              keyValue,
              physicalKeyValue: baseKey.keyValue,
              location: baseKey.location
            };
          })
        );

        layout.value = layerLayout;
        loaded.value = true;
        return;
      } catch (error) {
        console.error(`Failed to fetch layout for layer ${layerIndex.value !== null ? layerIndex.value + 1 : 'default'} (attempt ${attempt + 1}):`, error);
        error.value = `Failed to fetch layout: ${(error as Error).message}`;
        layout.value = [];
        loaded.value = false;
      }
      attempt++;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    console.error(`Failed to fetch layout after ${maxRetries} attempts`);
    error.value = 'Failed to load keyboard layout after multiple attempts';
  }

  return { layout, loaded, gridStyle, getKeyStyle, fetchLayerLayout, baseLayout, error, batchSetKey };
}
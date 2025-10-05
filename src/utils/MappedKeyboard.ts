import { ref, computed, Ref } from 'vue';
import KeyboardService from '@services/KeyboardService';
import { getLayoutConfig } from '@utils/layoutConfigs';
import type { IDefKeyInfo } from '../types/types';
import { useConnectionStore } from '../store/connection';

const mmToPx = (mm: number) => Math.round(mm * 4);

// console('MappedKeyboard.ts loaded');

export function useMappedKeyboard(layerIndex: Ref<number | null>) {
  // console(`useMappedKeyboard called with layerIndex: ${layerIndex.value}`);
  const connectionStore = useConnectionStore();
  const layout = ref<IDefKeyInfo[][]>([]);
  const loaded = ref(false);
  const baseLayout = ref<IDefKeyInfo[][] | null>(null);
  const error = ref<string | null>(null);

  const gridStyle = computed(() => {
    if (!baseLayout.value) {
      console.warn('baseLayout.value is undefined, returning empty style');
      return {};
    }
    const totalKeys = baseLayout.value.flat().length;
    const { keyPositions, gaps } = getLayoutConfig(totalKeys, baseLayout.value);
    // console('Grid Style keyPositions:', keyPositions);
    if (!keyPositions || keyPositions.length === 0) {
      console.warn('keyPositions is empty or invalid');
      return { height: '0px', width: '0px' };
    }
    const containerHeight = keyPositions.reduce((max, row, i) => max + Math.max(...row.map(pos => pos[1] + pos[3])) + (gaps[i] || 0), 0);
    const maxRowWidth = Math.max(...keyPositions.map(row => row.reduce((sum, pos) => sum + pos[2], 0)));
    return {
      position: 'relative',
      height: `${containerHeight}px`,
      width: `${maxRowWidth}px`,
      margin: '0 auto'
    };
  });

  const getKeyStyle = (rowIdx: number, colIdx: number) => {
    if (!baseLayout.value) {
      console.warn('baseLayout.value is undefined in getKeyStyle');
      return {};
    }
    const totalKeys = baseLayout.value.flat().length;
    const { keyPositions, gaps } = getLayoutConfig(totalKeys, baseLayout.value);
    const rowLength = baseLayout.value[rowIdx]?.length || 0;
    if (!keyPositions || !keyPositions[rowIdx] || !Array.isArray(keyPositions[rowIdx]) || colIdx >= rowLength) {
      console.warn(`Invalid key position at row ${rowIdx}, col ${colIdx}: rowLength=${rowLength}, keyPositions[rowIdx]=`, keyPositions[rowIdx]);
      return { width: '0px', height: '0px', left: '0px', top: '0px' };
    }
    const [left, top, width, height] = keyPositions[rowIdx][colIdx];
    const topGapPx = gaps[rowIdx] || 0;
    // console.log(`Rendered style for row ${rowIdx}, col ${colIdx}:`, { left, top, width, height });
    return {
      position: 'absolute',
      left: `${left}px`,
      top: `${top + topGapPx}px`,
      width: `${width}px`,
      height: `${height}px`,
      marginBottom: `${mmToPx(1)}px`,
      boxSizing: 'border-box',
      'data-overlay': ''
    };
  };

  async function batchSetKey(config: { key: number; layout: number; value: number }[], batchSize: number = 10) {
    const maxAttempts = 3;
    for (let i = 0; i < config.length; i += batchSize) {
      const batch = config.slice(i, i + batchSize);
      // console.log(`Sending batch setKey for keys ${batch[0].key} to ${batch[batch.length - 1].key} on layer ${batch[0].layout + 1}`);
      let attempts = 0;
      while (attempts < maxAttempts) {
        try {
          await KeyboardService.setKey(batch);
          // console.log(`Batch setKey successful for ${batch.length} keys`);
          break;
        } catch (error) {
          console.error(`Batch setKey attempt ${attempts + 1} failed for keys ${batch[0].key} to ${batch[batch.length - 1].key}:`, error);
          attempts++;
          if (attempts < maxAttempts) {
            // console.log(`Retrying batch setKey in 1000ms (attempt ${attempts + 1})`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            throw new Error(`Failed to set key batch after ${maxAttempts} attempts`);
          }
        }
      }
    }
  }

  async function fetchLayerLayout() {
    if (!connectionStore.isConnected) {
      console.warn('No device connected');
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
        // console.log(`Fetching base layout with KeyboardService.defKey (attempt ${attempt + 1})`);
        const newBaseLayout = await KeyboardService.defKey();
        if (!newBaseLayout || newBaseLayout.length === 0) {
          throw new Error('Empty or invalid base layout received');
        }
        if (!baseLayout.value) {
          baseLayout.value = newBaseLayout;
          const totalKeys = newBaseLayout.flat().length;
          // console.log(`Detected ${totalKeys} keys, baseLayout:`, newBaseLayout);
        }
        const totalKeys = newBaseLayout.flat().length;
        // console.log(`Base layout key count: ${totalKeys} (template for layer ${layerIndex.value !== null ? layerIndex.value + 1 : 'default'})`, newBaseLayout);

        if (layerIndex.value === null) {
          layout.value = baseLayout.value;
          loaded.value = true;
          // console.log(`Fetched default layout:`, layout.value);
          return;
        }

        // console.log(`Reloading parameters with KeyboardService.reloadParameters (attempt ${attempt + 1})`);
        await KeyboardService.reloadParameters();
        // console.log(`Reloaded parameters for layer ${layerIndex.value + 1}`);

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
            // console(`Fetching layout key info for batch: keys ${request[0].key} to ${request[request.length - 1].key} (attempt ${attempt + 1})`);
            const layerData = await KeyboardService.getLayoutKeyInfo(request);
            allLayerData.push(...layerData);
            // console(`Raw fetched batch for keys ${request[0].key} to ${request[request.length - 1].key} in layer ${layerIndex.value + 1}:`, layerData);
          } catch (error) {
            console.error(`Failed to fetch batch for keys ${request[0].key} to ${request[request.length - 1].key} in layer ${layerIndex.value + 1}:`, error);
          }
        }
        // console(`Raw allLayerData for layer ${layerIndex.value + 1} before processing:`, allLayerData);

        if (allLayerData.length === 0) {
          throw new Error('No layer data received');
        }

        const uniqueLayerData = new Map<number, { key: number; value: number }>();
        allLayerData.forEach(item => {
          if (item && typeof item === 'object' && 'key' in item && 'value' in item) {
            uniqueLayerData.set(item.key, { key: item.key, value: item.value });
            // console(`Unique mapping for key ${item.key}: value ${item.value} in layer ${layerIndex.value + 1}`);
          }
        });
        // console(`Unique layer data key count for layer ${layerIndex.value + 1}: ${uniqueLayerData.size}`, Array.from(uniqueLayerData.values()));

        const layerLayout: IDefKeyInfo[][] = newBaseLayout.map(row =>
          row.map(baseKey => {
            const layerKey = uniqueLayerData.get(baseKey.keyValue);
            let keyValue = baseKey.keyValue;
            if (layerKey) {
              keyValue = layerKey.value;
              if (layerKey.value === 0 && layerIndex.value === 0) {
                // console(`Base layer ${layerIndex.value + 1}: Using default ${keyValue} for unmapped key ${baseKey.keyValue}`);
              } else if (layerKey.value === 0 || layerKey.value === 1) {
                // console(`Layer ${layerIndex.value + 1}: Preserving unmapped value ${keyValue} for key ${baseKey.keyValue}`);
              } else {
                // console(`Layer ${layerIndex.value + 1}: Applied remapped value ${keyValue} for key ${baseKey.keyValue}`);
                if (baseKey.keyValue === 57) {
                  // console(`Caps Lock (key 57) remapped to ${keyValue} in layer ${layerIndex.value + 1}`);
                }
              }
            } else {
              console.warn(`No unique mapping found for key ${baseKey.keyValue} in layer ${layerIndex.value + 1}, using base value: ${keyValue}`);
            }
            if (keyValue === 1) {
              keyValue = 0;
              // console(`Visual remap: Changed key ${baseKey.keyValue} from value 1 to 0 in layer ${layerIndex.value + 1}`);
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
        // console(`Fetched and transformed layout for layer ${layerIndex.value + 1}:`, layerLayout);
        return;
      } catch (error) {
        console.error(`Failed to fetch layout for layer ${layerIndex.value !== null ? layerIndex.value + 1 : 'default'} (attempt ${attempt + 1}):`, error);
        error.value = `Failed to fetch layout: ${(error as Error).message}`;
        layout.value = [];
        loaded.value = false;
      }
      attempt++;
      if (attempt < maxRetries) {
        // console(`Retrying fetchLayerLayout in 1000ms (attempt ${attempt + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    console.error(`Failed to fetch layout after ${maxRetries} attempts`);
    error.value = 'Failed to load keyboard layout after multiple attempts';
  }

  return { layout, loaded, gridStyle, getKeyStyle, fetchLayerLayout, baseLayout, error, batchSetKey };
}
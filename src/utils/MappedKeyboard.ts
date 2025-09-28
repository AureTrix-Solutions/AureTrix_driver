import { ref, computed } from 'vue';
import KeyboardService from '@services/KeyboardService';
import { getLayoutConfig } from '@utils/layoutConfigs';
import type { IDefKeyInfo } from '../types/types';
import { useConnectionStore } from '../store/connection';

const mmToPx = (mm: number) => Math.round(mm * 4);

console.log('MappedKeyboard.ts loaded'); // Debug to confirm module loading

export function useMappedKeyboard(layerIndex: number) {
  console.log(`useMappedKeyboard called with layerIndex: ${layerIndex}`);
  const connectionStore = useConnectionStore();
  const layout = ref<IDefKeyInfo[][]>([]);
  const loaded = ref(false);
  const baseLayout = ref<IDefKeyInfo[][] | null>(null);

  const gridStyle = computed(() => {
    if (!baseLayout.value) {
      console.warn('baseLayout.value is undefined, returning empty style');
      return {};
    }
    const totalKeys = baseLayout.value.flat().length;
    const { keyPositions, gaps } = getLayoutConfig(totalKeys, baseLayout.value);
    console.log('Grid Style keyPositions:', keyPositions);
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
    console.log(`Rendered style for row ${rowIdx}, col ${colIdx}:`, { left, top, width, height });
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

  async function fetchLayerLayout() {
    if (!connectionStore.isConnected) {
      console.warn('No device connected');
      layout.value = [];
      loaded.value = false;
      return;
    }
    const maxRetries = 3;
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        const newBaseLayout = await KeyboardService.defKey();
        if (!baseLayout.value) {
          baseLayout.value = newBaseLayout;
          const totalKeys = newBaseLayout.flat().length;
          console.log(`Detected ${totalKeys} keys, baseLayout:`, newBaseLayout);
        }
        const totalKeys = newBaseLayout.flat().length;
        console.log(`Base layout key count: ${totalKeys} (template for layer ${layerIndex + 1})`, newBaseLayout);

        await KeyboardService.reloadParameters();
        console.log(`Reloaded parameters for layer ${layerIndex + 1}`);

        const batchSize = 10;
        const requests = [];
        for (let i = 0; i < newBaseLayout.flat().length; i += batchSize) {
          const startIdx = i;
          const endIdx = Math.min(i + batchSize - 1, newBaseLayout.flat().length - 1);
          const batch = newBaseLayout.flat().slice(startIdx, endIdx + 1).map(k => ({ key: k.keyValue, layout: layerIndex }));
          requests.push(batch);
        }
        const allLayerData = [];
        for (const request of requests) {
          try {
            const layerData = await KeyboardService.getLayoutKeyInfo(request);
            allLayerData.push(...layerData);
            console.log(`Raw fetched batch for keys ${request[0].key} to ${request[request.length - 1].key} in layer ${layerIndex + 1}:`, layerData);
          } catch (error) {
            console.error(`Failed to fetch batch for keys ${request[0].key} to ${request[request.length - 1].key} in layer ${layerIndex + 1}:`, error);
          }
        }
        console.log(`Raw allLayerData for layer ${layerIndex + 1} before processing:`, allLayerData);

        const uniqueLayerData = new Map<number, { key: number; value: number }>();
        allLayerData.forEach(item => {
          uniqueLayerData.set(item.key, { key: item.key, value: item.value });
          console.log(`Unique mapping for key ${item.key}: value ${item.value} in layer ${layerIndex + 1}`);
        });
        console.log(`Unique layer data key count for layer ${layerIndex + 1}: ${uniqueLayerData.size}`, Array.from(uniqueLayerData.values()));

        const layerLayout: IDefKeyInfo[][] = newBaseLayout.map(row =>
          row.map(baseKey => {
            const layerKey = uniqueLayerData.get(baseKey.keyValue);
            let keyValue = baseKey.keyValue;
            if (layerKey) {
              keyValue = layerKey.value;
              if (layerKey.value === 0 && layerIndex === 0) {
                console.log(`Base layer ${layerIndex + 1}: Using default ${keyValue} for unmapped key ${baseKey.keyValue}`);
              } else if (layerKey.value === 0 || layerKey.value === 1) {
                console.log(`Layer ${layerIndex + 1}: Preserving unmapped value ${keyValue} for key ${baseKey.keyValue}`);
              } else {
                console.log(`Layer ${layerIndex + 1}: Applied remapped value ${keyValue} for key ${baseKey.keyValue}`);
                if (baseKey.keyValue === 57) {
                  console.log(`Caps Lock (key 57) remapped to ${keyValue} in layer ${layerIndex + 1}`);
                }
              }
            } else {
              console.warn(`No unique mapping found for key ${baseKey.keyValue} in layer ${layerIndex + 1}, using base value: ${keyValue}`);
            }
            if (keyValue === 1) {
              keyValue = 0;
              console.log(`Visual remap: Changed key ${baseKey.keyValue} from value 1 to 0 in layer ${layerIndex + 1}`);
            }
            if (keyValue < 0 || keyValue > 65535) {
              console.warn(`Invalid value ${keyValue} for key ${baseKey.keyValue} in layer ${layerIndex + 1}, using default: ${baseKey.keyValue}`);
              keyValue = baseKey.keyValue;
            }
            return { keyValue, location: baseKey.location };
          })
        );

        layout.value = layerLayout;
        loaded.value = true;
        console.log(`Fetched and transformed layout for layer ${layerIndex + 1}:`, layerLayout);
      } catch (error) {
        console.error(`Failed to fetch layout for layer ${layerIndex + 1}:`, error);
        layout.value = [];
        loaded.value = false;
      }
      attempt++;
    }
  }

  return { layout, loaded, gridStyle, getKeyStyle, fetchLayerLayout };
}

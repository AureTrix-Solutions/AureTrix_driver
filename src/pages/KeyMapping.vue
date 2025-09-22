<template>
  <div class="key-mapping-page">
    <h2>Key Mapping</h2>
    <div class="controls">
      <label for="layer-select">Layer: </label>
      <select v-model="selectedLayer" id="layer-select">
        <option v-for="layer in layers" :key="layer" :value="layer">{{ `Fn${layer + 1}` }}</option>
      </select>
    </div>
    <div v-if="layout.length" class="key-grid">
      <div v-for="(row, rIdx) in layout" :key="`r-${rIdx}`" class="key-row">
        <button
          v-for="(keyInfo, cIdx) in row"
          :key="`k-${rIdx}-${cIdx}`"
          class="key-btn"
          @click="selectKey(keyInfo)"
          :class="{ 'selected': selectedKey?.location?.row === keyInfo.location.row && selectedKey?.location?.col === keyInfo.location.col }"
        >
          {{ keyMap[keyInfo.keyValue] || `Key ${keyInfo.keyValue}` }}
        </button>
      </div>
    </div>
    <p v-if="selectedKey" class="selected-key">
      Selected: {{ keyMap[selectedKey.keyValue] || `Key ${selectedKey.keyValue}` }} (Layer: Fn{{ selectedLayer + 1 }})
    </p>
    <div v-if="selectedKey" class="key-config">
      <label>Remap to: </label>
      <select v-model="newKeyValue">
        <option v-for="(name, value) in keyMap" :key="value" :value="value">{{ name }}</option>
      </select>
      <button @click="remapKey" :disabled="!newKeyValue">Apply Remap</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch, computed } from 'vue';
import KeyboardService from '@services/KeyboardService';
import { keyMap } from '@utils/keyMap';
import { IDefKeyInfo } from '../types/types';

export default defineComponent({
  name: 'KeyMapping',
  setup() {
    const layout = ref<IDefKeyInfo[][]>([]); // 2D array for the keyboard layout
    const selectedKey = ref<IDefKeyInfo | null>(null);
    const selectedLayer = ref(0); // Layers 0-3 (Fn1-Fn4)
    const newKeyValue = ref<number | null>(null);
    const layers = [0, 1, 2, 3]; // Fn1-Fn4

    // Fetch layer-specific layout with non-overlapping batched requests, re-fetching base layout per layer
    async function fetchLayerLayout(layerIndex: number) {
      try {
        // Re-fetch base layout for the selected layer to ensure correct structure
        const baseLayout = await KeyboardService.defKey();
        const totalKeys = baseLayout.flat().length;
        console.log(`Base layout key count: ${totalKeys} (template for layer ${layerIndex + 1})`, baseLayout);

        // Sync device parameters for the selected layer
        await KeyboardService.reloadParameters();
        console.log(`Reloaded parameters for layer ${layerIndex + 1}`);

        // Batch the request to getLayoutKeyInfo with non-overlapping ranges for the selected layer
        const batchSize = 10; // Maintain 10 for reliability
        const requests = [];
        for (let i = 0; i < baseLayout.flat().length; i += batchSize) {
          const startIdx = i;
          const endIdx = Math.min(i + batchSize - 1, baseLayout.flat().length - 1);
          const batch = baseLayout.flat().slice(startIdx, endIdx + 1).map(k => ({ key: k.keyValue, layout: layerIndex }));
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

        // Deduplicate layerData for the current layer
        const uniqueLayerData = new Map<number, { key: number; value: number }>();
        allLayerData.forEach(item => {
          uniqueLayerData.set(item.key, { key: item.key, value: item.value });
          console.log(`Unique mapping for key ${item.key}: value ${item.value} in layer ${layerIndex + 1}`);
        });
        console.log(`Unique layer data key count for layer ${layerIndex + 1}: ${uniqueLayerData.size}`, Array.from(uniqueLayerData.values()));

        // Transform into 2D IDefKeyInfo[][] by matching with baseLayout, prioritizing remapped values
        const layerLayout: IDefKeyInfo[][] = baseLayout.map(row =>
          row.map(baseKey => {
            const layerKey = uniqueLayerData.get(baseKey.keyValue);
            let keyValue = baseKey.keyValue; // Default to base key value
            if (layerKey) {
              keyValue = layerKey.value; // Always use the remapped value if present
              if (layerKey.value === 0 && layerIndex === 0) {
                console.log(`Base layer ${layerIndex + 1}: Using default ${keyValue} for unmapped key ${baseKey.keyValue}`);
              } else if (layerKey.value === 0 || layerKey.value === 1) {
                console.log(`Layer ${layerIndex + 1}: Preserving unmapped value ${keyValue} for key ${baseKey.keyValue}`);
              } else {
                console.log(`Layer ${layerIndex + 1}: Applied remapped value ${keyValue} for key ${baseKey.keyValue}`);
                if (baseKey.keyValue === 57) { // Debug Caps Lock specifically
                  console.log(`Caps Lock (key 57) remapped to ${keyValue} in layer ${layerIndex + 1}`);
                }
              }
            } else {
              console.warn(`No unique mapping found for key ${baseKey.keyValue} in layer ${layerIndex + 1}, using base value: ${keyValue}`);
            }
            // Visual remap: Change key 1 to key 0
            if (keyValue === 1) {
              keyValue = 0;
              console.log(`Visual remap: Changed key ${baseKey.keyValue} from value 1 to 0 in layer ${layerIndex + 1}`);
            }
            if (keyValue < 0 || keyValue > 65535) { // Sanity check for invalid values
              console.warn(`Invalid value ${keyValue} for key ${baseKey.keyValue} in layer ${layerIndex + 1}, using default: ${baseKey.keyValue}`);
              keyValue = baseKey.keyValue;
            }
            return {
              keyValue,
              location: baseKey.location,
            };
          })
        );

        layout.value = layerLayout;
        console.log(`Fetched and transformed layout for layer ${layerIndex + 1}:`, layerLayout);
      } catch (error) {
        console.error(`Failed to fetch layout for layer ${layerIndex + 1}:`, error);
        layout.value = []; // Clear layout on error to prevent rendering issues
      }
    }

    // Select a key for remapping with validation
    const selectKey = (key: IDefKeyInfo) => {
      selectedKey.value = { ...key }; // Store full keyInfo, including keyValue and location
      console.log(`Selected key: { keyValue: ${selectedKey.value.keyValue}, location: { row: ${selectedKey.value.location.row}, col: ${selectedKey.value.location.col} } }`);
      newKeyValue.value = null; // Reset remap selection
    };

    // Remap a key with enhanced logging, validation, and sync for unmapped keys
    const remapKey = async () => {
      if (selectedKey.value && newKeyValue.value !== null) {
        try {
          console.log(`Attempting to remap key at location { row: ${selectedKey.value.location.row}, col: ${selectedKey.value.location.col} } with value ${selectedKey.value.keyValue}`);
          // Fetch base layout to get the original keyValue
          const baseLayout = await KeyboardService.defKey();
          const baseKey = baseLayout[selectedKey.value.location.row][selectedKey.value.location.col];
          const remapKeyValue = baseKey.keyValue; // Use base keyValue for remap
          console.log(`Using base keyValue: ${remapKeyValue} for remapping at location { row: ${baseKey.location.row}, col: ${baseKey.location.col} }`);
          const config = [{ key: remapKeyValue, layout: selectedLayer.value, value: newKeyValue.value }];
          console.log(`Sending remap config:`, config);
          await KeyboardService.setKey(config);
          console.log(`Remap request sent for key ${remapKeyValue} to ${newKeyValue.value} on layer ${selectedLayer.value + 1}`);
          // Force device sync after remap
          await KeyboardService.reloadParameters();
          console.log(`Device parameters reloaded after remap on layer ${selectedLayer.value + 1}`);
          // Verify the specific key's remap with retry using base keyValue
          let verifyData = [];
          for (let attempt = 1; attempt <= 3; attempt++) {
            verifyData = await KeyboardService.getLayoutKeyInfo([{ key: remapKeyValue, layout: selectedLayer.value }]);
            console.log(`Verified remap data for key ${remapKeyValue} (attempt ${attempt}):`, verifyData);
            if (verifyData.length > 0 && verifyData[0].value === newKeyValue.value) break;
          }
          if (verifyData.length === 0 || verifyData[0].value !== newKeyValue.value) {
            console.warn(`Verification failed; latest data:`, verifyData);
          }
          await fetchLayerLayout(selectedLayer.value); // Refresh full layout
          console.log(`Layout refreshed after remap on layer ${selectedLayer.value + 1} with new value ${newKeyValue.value}`);
        } catch (error) {
          console.error(`Remap failed for key at location { row: ${selectedKey.value.row}, col: ${selectedKey.value.col} } to ${newKeyValue.value} on layer ${selectedLayer.value + 1}:`, error);
        }
      }
    };

    // Watch for layer changes to fetch the appropriate layout and clear selection
    watch(selectedLayer, (newLayer) => {
      layout.value = []; // Clear current layout before fetching new layer
      selectedKey.value = null; // Clear selected key to remove highlight
      fetchLayerLayout(newLayer);
    });

    onMounted(() => {
      fetchLayerLayout(selectedLayer.value); // Fetch initial layer (Fn1) on mount
    });

    watch(selectedKey, () => {
      if (!selectedKey.value) newKeyValue.value = null;
    });

    return {
      layout,
      selectedKey,
      selectKey,
      remapKey,
      selectedLayer,
      layers,
      newKeyValue,
      keyMap,
    };
  },
});
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@styles/variables' as v;

.key-mapping-page {
  padding: 20px;
  color: v.$text-color;
  h2 {
    color: v.$primary-color;
    margin-bottom: 20px;
  }
  .controls {
    margin-bottom: 20px;
    display: flex;
    gap: 10px;
    align-items: center;
    label {
      margin-right: 5px;
      color: v.$text-color;
    }
    select {
      padding: 5px;
      border-radius: v.$border-radius;
      background-color: v.$background-dark;
      color: v.$text-color;
    }
  }
  .key-grid {
    display: grid;
    gap: 5px;
  }
  .key-row {
    display: flex;
    gap: 5px;
  }
  .key-btn {
    padding: 10px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: v.$border-radius;
    background-color: v.$background-dark;
    color: v.$text-color;
    cursor: pointer;
    &:hover, &.selected {
      background-color: color.adjust(v.$background-dark, $lightness: 10%);
    }
  }
  .selected-key {
    margin-top: 20px;
    color: v.$accent-color;
  }
  .key-config {
    margin-top: 20px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    label {
      margin-right: 5px;
      color: v.$text-color;
    }
    select, button {
      padding: 5px;
      border-radius: v.$border-radius;
      background-color: v.$background-dark;
      color: v.$text-color;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    button {
      cursor: pointer;
      &:disabled {
        background-color: color.adjust(v.$primary-color, $lightness: -20%);
        cursor: not-allowed;
      }
    }
  }
}
</style>
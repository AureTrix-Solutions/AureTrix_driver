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
          :class="{ 'selected': selectedKey?.keyValue === keyInfo.keyValue }"
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
      <label>Advanced Mode: </label>
      <select v-model="advancedMode">
        <option value="none">None</option>
        <option value="dks">DKS</option>
        <option value="mpt">MPT</option>
        <option value="socd">SOCD</option>
      </select>
      <div v-if="advancedMode !== 'none'" class="advanced-config">
        <template v-if="advancedMode === 'dks'">
          <label>DKS Key Codes: </label>
          <input v-model.number="dksValues[0]" type="number" placeholder="DKS1" />
          <input v-model.number="dksValues[1]" type="number" placeholder="DKS2" />
          <input v-model.number="dksValues[2]" type="number" placeholder="DKS3" />
          <input v-model.number="dksValues[3]" type="number" placeholder="DKS4" />
        </template>
        <template v-if="advancedMode === 'mpt'">
          <label>MPT Depths: </label>
          <input v-model.number="mptValues[0]" type="number" placeholder="Depth 1" />
          <input v-model.number="mptValues[1]" type="number" placeholder="Depth 2" />
          <input v-model.number="mptValues[2]" type="number" placeholder="Depth 3" />
        </template>
        <template v-if="advancedMode === 'socd'">
          <label>SOCD Mode: </label>
          <select v-model="socdMode">
            <option value="0">Override Later</option>
            <option value="1">A Priority</option>
            <option value="2">B Priority</option>
            <option value="3">Neutral</option>
          </select>
        </template>
        <button @click="applyAdvancedConfig" :disabled="!isValidAdvancedConfig">Apply Advanced</button>
      </div>
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
    const advancedMode = ref<'none' | 'dks' | 'mpt' | 'socd'>('none');
    const dksValues = ref([0, 0, 0, 0]);
    const mptValues = ref([0, 0, 0]);
    const socdMode = ref('0');

    // Fetch layer-specific layout (including base layer Fn1) with non-overlapping batched requests
    async function fetchLayerLayout(layerIndex: number) {
      try {
        // Get the base layout structure (2D IDefKeyInfo[][])
        const baseLayout = await KeyboardService.defKey();
        const totalKeys = baseLayout.flat().length;
        console.log(`Base layout key count: ${totalKeys}`, baseLayout);

        // Batch the request to getLayoutKeyInfo with non-overlapping ranges
        const batchSize = 10; // Set to 10 to ensure reliable retrieval within timeout
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
            console.log(`Fetched batch for keys ${request[0].key} to ${request[request.length - 1].key}, count: ${layerData.length}`, layerData);
          } catch (error) {
            console.error(`Failed to fetch batch for keys ${request[0].key} to ${request[request.length - 1].key}:`, error);
          }
        }

        // Deduplicate layerData using key as the unique identifier
        const uniqueLayerData = new Map<number, { key: number; value: number }>();
        allLayerData.forEach(item => {
          uniqueLayerData.set(item.key, { key: item.key, value: item.value });
          console.log(`Unique mapping for key ${item.key}: value ${item.value}`); // Debug remapped values
        });
        console.log(`Unique layer data key count: ${uniqueLayerData.size}`, Array.from(uniqueLayerData.values()));

        // Transform into 2D IDefKeyInfo[][] by matching with baseLayout, handling edge cases
        const layerLayout: IDefKeyInfo[][] = baseLayout.map(row =>
          row.map(baseKey => {
            const layerKey = uniqueLayerData.get(baseKey.keyValue);
            const keyValue = layerKey && layerKey.value !== 0 ? layerKey.value : baseKey.keyValue; // Use default if value is 0
            if (!layerKey) {
              console.warn(`No unique mapping found for key ${baseKey.keyValue} in layer ${layerIndex}, using default: ${keyValue}`);
            } else if (layerKey.value > 61440) { // Flag unusual high values (e.g., 61441 for key 1)
              console.warn(`Unusual value ${layerKey.value} for key ${baseKey.keyValue}, using default: ${baseKey.keyValue}`);
              return { keyValue: baseKey.keyValue, location: baseKey.location };
            }
            return {
              keyValue,
              location: baseKey.location,
            };
          })
        );

        layout.value = layerLayout;
        console.log(`Fetched and transformed layout for layer ${layerIndex}:`, layerLayout);
      } catch (error) {
        console.error(`Failed to fetch layout for layer ${layerIndex}:`, error);
        layout.value = []; // Clear layout on error to prevent rendering issues
      }
    }

    // Select a key for remapping
    const selectKey = (key: IDefKeyInfo) => {
      selectedKey.value = key;
      newKeyValue.value = null; // Reset remap selection
      advancedMode.value = 'none'; // Reset advanced mode
    };

    // Remap a key (test with Caps Lock to L-Ctrl)
    const remapKey = async () => {
      if (selectedKey.value && newKeyValue.value !== null) {
        try {
          const config = [{ key: selectedKey.value.keyValue, layout: selectedLayer.value, value: newKeyValue.value }];
          await KeyboardService.setKey(config);
          console.log(`Remapped key ${selectedKey.value.keyValue} to ${newKeyValue.value} on layer ${selectedLayer.value}`);
          // Test specific remap: Caps Lock (57) to L-Ctrl (224) if not set
          if (selectedKey.value.keyValue === 57 && newKeyValue.value !== 224) {
            await KeyboardService.setKey([{ key: 57, layout: selectedLayer.value, value: 224 }]);
            console.log(`Test remap: Caps Lock (57) to L-Ctrl (224) on layer ${selectedLayer.value}`);
          }
          await fetchLayerLayout(selectedLayer.value); // Refresh layout after remapping
        } catch (error) {
          console.error('Remap failed:', error);
        }
      }
    };

    // Apply advanced configuration (DKS, MPT, SOCD)
    const applyAdvancedConfig = async () => {
      if (selectedKey.value && advancedMode.value !== 'none') {
        try {
          if (advancedMode.value === 'dks') {
            await KeyboardService.setDKS({ key: selectedKey.value.keyValue, dks: dksValues.value });
            console.log(`Applied DKS ${dksValues.value} to ${selectedKey.value.keyValue}`);
          } else if (advancedMode.value === 'mpt') {
            // Placeholder for MPT configuration (needs SDK method)
            console.log(`Applied MPT ${mptValues.value} to ${selectedKey.value.keyValue}`);
          } else if (advancedMode.value === 'socd') {
            await KeyboardService.setSOCD({ key: selectedKey.value.keyValue, mode: parseInt(socdMode.value) });
            console.log(`Applied SOCD mode ${socdMode.value} to ${selectedKey.value.keyValue}`);
          }
        } catch (error) {
          console.error('Advanced config failed:', error);
        }
      }
    };

    const isValidAdvancedConfig = computed(() => {
      if (advancedMode.value === 'dks') return dksValues.value.some(v => v !== 0);
      if (advancedMode.value === 'mpt') return mptValues.value.some(v => v !== 0);
      if (advancedMode.value === 'socd') return socdMode.value !== '0';
      return false;
    });

    // Watch for layer changes to fetch the appropriate layout
    watch(selectedLayer, (newLayer) => {
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
      advancedMode,
      dksValues,
      mptValues,
      socdMode,
      applyAdvancedConfig,
      isValidAdvancedConfig,
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
    select, input, button {
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
    .advanced-config {
      margin-top: 10px;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      input {
        width: 60px;
      }
    }
  }
}
</style>
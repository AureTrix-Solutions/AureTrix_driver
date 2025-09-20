<template>
  <div class="key-mapping-page">
    <h2>Key Mapping</h2>
    <div class="controls">
      <label for="layer-select">Layer: </label>
      <select v-model="selectedLayer" id="layer-select">
        <option v-for="layer in layers" :key="layer" :value="layer">{{ layer }}</option>
      </select>
    </div>
    <div v-if="layout" class="key-grid">
      <div v-for="row in layout" :key="row[0].location.row" class="key-row">
        <button
          v-for="key in row"
          :key="key.location.col"
          class="key-btn"
          @click="selectKey(key)"
          :class="{ 'selected': selectedKey?.keyValue === key.keyValue }"
        >
          {{ keyMap[key.keyValue] || `Key ${key.keyValue}` }}
        </button>
      </div>
    </div>
    <p v-if="selectedKey" class="selected-key">Selected: {{ keyMap[selectedKey.keyValue] || `Key ${selectedKey.keyValue}` }} (Layer: {{ selectedLayer }})</p>
    <div v-if="selectedKey" class="key-config">
      <label>Remap to: </label>
      <select v-model="newKeyValue">
        <option v-for="key in keyMap" :key="key[0]" :value="key[0]">{{ key[1] }}</option>
      </select>
      <button @click="remapKey" :disabled="!newKeyValue">Apply Remap</button>
      <label>Advanced Mode: </label>
      <select v-model="advancedMode">
        <option value="none">None</option>
        <option value="dks">DKS</option>
        <option value="mpt">MPT</option>
      </select>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import KeyboardService from '@services/KeyboardService';

export default defineComponent({
  name: 'KeyMapping',
  setup() {
    const layout = ref<any[][] | null>(null);
    const selectedKey = ref<any | null>(null);
    const selectedLayer = ref(0); // Layers 0-3 (Fn1-Fn4)
    const newKeyValue = ref<number | null>(null);
    const advancedMode = ref('none');
    const keyMap = {
      4: 'A', 5: 'B', 6: 'C', 7: 'D', 8: 'E', 9: 'F', 10: 'G', 11: 'H', 12: 'I', 13: 'J',
      14: 'K', 15: 'L', 16: 'M', 17: 'N', 18: 'O', 19: 'P', 20: 'Q', 21: 'R', 22: 'S', 23: 'T',
      // Expand with full keyMap from keyboard (1).md later
    };
    const layers = [0, 1, 2, 3]; // Fn1-Fn4

    const fetchLayout = async () => {
      try {
        const layoutData = await KeyboardService.defKey();
        layout.value = layoutData;
      } catch (error) {
        console.error('Failed to fetch layout:', error);
      }
    };

    const selectKey = (key: any) => {
      selectedKey.value = key;
      newKeyValue.value = null; // Reset remap value
      advancedMode.value = 'none'; // Reset advanced mode
    };

    const remapKey = async () => {
      if (selectedKey.value && newKeyValue.value) {
        try {
          await KeyboardService.getLayoutKeyInfo([{ key: selectedKey.value.keyValue, layout: selectedLayer.value }]);
          // Placeholder: Implement setLayoutKeyInfo to apply remap
          console.log(`Remapped ${selectedKey.value.keyValue} to ${newKeyValue.value} on layer ${selectedLayer.value}`);
        } catch (error) {
          console.error('Remap failed:', error);
        }
      }
    };

    onMounted(fetchLayout);

    return { layout, selectedKey, selectKey, remapKey, selectedLayer, layers, newKeyValue, keyMap, advancedMode };
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
    label {
      margin-right: 10px;
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
    label {
      margin-right: 10px;
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
      margin-left: 10px;
      cursor: pointer;
      &:disabled {
        background-color: color.adjust(v.$primary-color, $lightness: -20%);
        cursor: not-allowed;
      }
    }
  }
}
</style>
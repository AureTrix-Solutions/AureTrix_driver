<template>
  <div class="macro-page">
    <h2>Macro Editor</h2>
    <div class="controls">
      <label for="macro-key">Select Key: </label>
      <select v-model="selectedKey" id="macro-key">
        <option v-for="key in keyMap" :key="key[0]" :value="key[0]">{{ key[1] }}</option>
      </select>
      <label for="macro-index">Macro Index (M0-M22): </label>
      <select v-model="macroIndex" id="macro-index">
        <option v-for="i in 23" :key="i" :value="i - 1">M{{ i - 1 }}</option>
      </select>
    </div>
    <div v-if="selectedKey !== null" class="macro-config">
      <label>Mode: </label>
      <select v-model="macroMode">
        <option value="0">Once</option>
        <option value="1">Toggle Repeat</option>
        <option value="2">Hold Repeat (Stop)</option>
        <option value="3">Hold Repeat (Complete)</option>
      </select>
      <div class="key-picker">
        <button v-for="key in keyMap" :key="key[0]" @click="addMacroStep(key[0])" class="key-btn">
          {{ key[1] }}
        </button>
      </div>
      <button @click="saveMacro" :disabled="!macroSteps.length">Save Macro</button>
      <p>Steps: {{ macroSteps.map(s => `${keyMap[s.keyCode] || s.keyCode} (${s.timeDifference}ms)`).join(', ') }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import KeyboardService from '@services/KeyboardService';

export default defineComponent({
  name: 'Macros',
  setup() {
    const selectedKey = ref<number | null>(null);
    const macroIndex = ref(0); // M0-M22
    const macroMode = ref('0');
    const macroSteps = ref<any[]>([]);
    const keyMap = {
      4: 'A', 5: 'B', 6: 'C', 7: 'D', 8: 'E', 9: 'F', 10: 'G', 11: 'H', 12: 'I', 13: 'J',
      14: 'K', 15: 'L', 16: 'M', 17: 'N', 18: 'O', 19: 'P', 20: 'Q', 21: 'R', 22: 'S', 23: 'T',
      // Expand with full keyMap from keyboard (1).md later
    };

    const addMacroStep = (keyCode: number) => {
      macroSteps.value.push({ keyCode, timeDifference: 100, status: 1 }); // Default 100ms delay, press
    };

    const saveMacro = async () => {
      if (selectedKey.value !== null) {
        try {
          await KeyboardService.setMacro({
            key: selectedKey.value,
            index: macroIndex.value,
            mode: parseInt(macroMode.value),
            len: macroSteps.value.length,
            num: 1,
            delay: 0,
          }, macroSteps.value);
          console.log(`Macro saved for key ${selectedKey.value} at index ${macroIndex.value}`);
        } catch (error) {
          console.error('Macro save failed:', error);
        }
      }
    };

    return { selectedKey, macroIndex, macroMode, macroSteps, addMacroStep, saveMacro, keyMap };
  },
});
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@styles/variables' as v;

.macro-page {
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
  .macro-config {
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
    .key-picker {
      margin: 10px 0;
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }
    .key-btn {
      padding: 5px 10px;
      cursor: pointer;
      &:hover {
        background-color: color.adjust(v.$background-dark, $lightness: 10%);
      }
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
<template>
  <div class="macro-page">
    <h2>Macro Editor</h2>
    <div class="controls">
      <label for="macro-key">Select Key: </label>
      <select v-model="selectedKey" id="macro-key">
        <option v-for="(name, value) in keyMap" :key="value" :value="value">{{ name }}</option>
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
        <label>Macro Steps:</label>
        <div class="step-list">
          <div v-for="(step, index) in macroSteps" :key="index" class="step-item">
            {{ keyMap[step.keyCode] || step.keyCode }} ({{ step.timeDifference }}ms)
            <button @click="removeStep(index)" class="remove-btn">X</button>
          </div>
        </div>
        <div class="picker-row">
          <select v-model="newStepKeyCode">
            <option v-for="(name, value) in keyMap" :key="value" :value="value">{{ name }}</option>
          </select>
          <input v-model.number="newStepDelay" type="number" placeholder="Delay (ms)" />
          <button @click="addMacroStep" :disabled="!newStepKeyCode">Add Step</button>
        </div>
      </div>
      <button @click="saveMacro" :disabled="!macroSteps.length">Save Macro</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import KeyboardService from '@services/KeyboardService';
import { keyMap } from '@utils/keyMap'; // Verify this import

export default defineComponent({
  name: 'Macros',
  setup() {
    const selectedKey = ref<number | null>(null);
    const macroIndex = ref(0); // M0-M22
    const macroMode = ref('0');
    const macroSteps = ref<any[]>([]);
    const newStepKeyCode = ref<number | null>(null);
    const newStepDelay = ref(100); // Default delay

    const addMacroStep = () => {
      if (newStepKeyCode.value !== null) {
        macroSteps.value.push({ keyCode: newStepKeyCode.value, timeDifference: newStepDelay.value || 0, status: 1 });
        newStepKeyCode.value = null; // Reset for next step
      }
    };

    const removeStep = (index: number) => {
      macroSteps.value.splice(index, 1);
    };

    const saveMacro = async () => {
      if (selectedKey.value !== null && macroSteps.value.length > 0) {
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

    return { selectedKey, macroIndex, macroMode, macroSteps, addMacroStep, removeStep, saveMacro, keyMap, newStepKeyCode, newStepDelay };
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
  .macro-config {
    margin-top: 20px;
    label {
      margin-right: 10px;
      color: v.$text-color;
    }
    select, input, button {
      padding: 5px;
      border-radius: v.$border-radius;
      background-color: v.$background-dark;
      color: v.$text-color;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .key-picker {
      margin: 10px 0;
      .step-list {
        margin: 10px 0;
        .step-item {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 5px;
          .remove-btn {
            padding: 2px 6px;
            background-color: color.adjust(v.$accent-color, $lightness: -10%);
            border: none;
            border-radius: v.$border-radius;
            cursor: pointer;
            &:hover {
              background-color: color.adjust(v.$accent-color, $lightness: -20%);
            }
          }
        }
      }
      .picker-row {
        display: flex;
        gap: 10px;
        align-items: center;
        input {
          width: 80px;
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
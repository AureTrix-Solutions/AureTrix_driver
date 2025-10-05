<template>
  <div class="settings-section">
    <h3>Rapid Trigger</h3>
    <div v-if="selectedKey" class="input-group">
      <label for="rapid-trigger-toggle">Enable Rapid Trigger for {{ keyMap[selectedKey.keyValue] || `Key ${selectedKey.keyValue}` }}:</label>
      <input
        type="checkbox"
        v-model="rapidTriggerEnabled"
        id="rapid-trigger-toggle"
        @change="updateRapidTrigger"
      />
    </div>
    <div v-if="selectedKey && rapidTriggerEnabled" class="input-group">
      <label for="rapid-trigger-sensitivity">Sensitivity (0.1-1.0):</label>
      <input
        type="number"
        v-model.number="rapidTriggerSensitivity"
        id="rapid-trigger-sensitivity"
        min="0.1"
        max="1.0"
        step="0.01"
        placeholder="0.5"
        @input="updateRapidTrigger"
      />
    </div>
    <div v-if="selectedKey && rapidTriggerEnabled" class="input-group">
      <label for="rapid-trigger-axis">Analog Axis Output (0-100%):</label>
      <input
        type="number"
        v-model.number="analogAxisOutput"
        id="rapid-trigger-axis"
        min="0"
        max="100"
        step="1"
        placeholder="50"
        @input="updateRapidTrigger"
      />
    </div>
    <div v-if="!selectedKey" class="no-key-selected">
      <p>Select a key to configure Rapid Trigger settings.</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, PropType } from 'vue';
import KeyboardService from '@services/KeyboardService';
import { keyMap } from '@utils/keyMap';
import type { IDefKeyInfo } from '@/types/types';
import type { Ref } from 'vue'; // Import Ref for baseLayout

export default defineComponent({
  name: 'RapidTrigger',
  props: {
    selectedKey: {
      type: Object as PropType<IDefKeyInfo | null>,
      default: null,
    },
    layout: {
      type: Array as PropType<IDefKeyInfo[][]>,
      required: true,
    },
    baseLayout: {
      type: Object as PropType<Ref<IDefKeyInfo[][] | null>>,
      required: true,
    },
  },
  emits: ['update-notification'],
  setup(props, { emit }) {
    const rapidTriggerEnabled = ref(false);
    const rapidTriggerSensitivity = ref(0.5);
    const analogAxisOutput = ref(50);

    const loadKeySettings = async () => {
      if (!props.selectedKey) {
        rapidTriggerEnabled.value = false;
        rapidTriggerSensitivity.value = 0.5;
        analogAxisOutput.value = 50;
        return;
      }
      try {
        const keyValue = props.selectedKey.keyValue;
        //console.log(`Loading Rapid Trigger settings for key ${keyMap[keyValue] || keyValue}`);
        // Placeholder: Fetch settings from SDK
        // const settings = await KeyboardService.getRapidTriggerSettings(keyValue);
        // rapidTriggerEnabled.value = settings.enabled ?? false;
        // rapidTriggerSensitivity.value = settings.sensitivity ?? 0.5;
        // analogAxisOutput.value = settings.axisOutput ?? 50;
      } catch (error) {
        console.error(`Failed to load Rapid Trigger settings for key ${props.selectedKey.keyValue}:`, error);
        emit('update-notification', `Failed to load Rapid Trigger settings: ${(error as Error).message}`, true);
      }
    };

    const updateRapidTrigger = async () => {
      if (!props.selectedKey) return;
      try {
        const keyValue = props.selectedKey.keyValue;
        //console.log(`Updating Rapid Trigger for key ${keyMap[keyValue] || keyValue}: enabled=${rapidTriggerEnabled.value}, sensitivity=${rapidTriggerSensitivity.value}, axisOutput=${analogAxisOutput.value}%`);
        // Placeholder: Send settings to SDK
        // await KeyboardService.setRapidTriggerSettings(keyValue, {
        //   enabled: rapidTriggerEnabled.value,
        //   sensitivity: rapidTriggerSensitivity.value,
        //   axisOutput: analogAxisOutput.value,
        // });
        emit('update-notification', `Rapid Trigger updated for key ${keyMap[keyValue] || keyValue}`, false);
      } catch (error) {
        console.error(`Failed to update Rapid Trigger for key ${props.selectedKey.keyValue}:`, error);
        emit('update-notification', `Failed to update Rapid Trigger: ${(error as Error).message}`, true);
      }
    };

    watch(() => props.selectedKey, () => {
      loadKeySettings();
    });

    return {
      keyMap,
      rapidTriggerEnabled,
      rapidTriggerSensitivity,
      analogAxisOutput,
      updateRapidTrigger,
    };
  },
});
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@styles/variables' as v;

.settings-section {
  h3 {
    color: v.$primary-color;
    margin-bottom: 10px;
  }

  .input-group {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;

    label {
      color: v.$text-color;
      font-size: 1rem;
    }

    input[type="number"] {
      padding: 8px;
      border-radius: v.$border-radius;
      background-color: v.$background-dark;
      color: v.$text-color;
      border: 1px solid rgba(v.$text-color, 0.2);
      font-size: 1rem;
      width: 200px;

      &:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(v.$primary-color, 0.5);
      }
    }

    input[type="checkbox"] {
      width: 20px;
      height: 20px;
      cursor: pointer;
    }
  }

  .no-key-selected {
    text-align: center;
    color: v.$text-color;
    font-size: 1rem;
    padding: 20px;
  }
}
</style>
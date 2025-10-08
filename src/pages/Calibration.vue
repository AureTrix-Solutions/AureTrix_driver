<template>
  <div class="settings-section">
    <h3>Calibration</h3>
    <div class="input-group">
      <button @click="startCalibration" class="action-btn" :disabled="isCalibrating">Start Calibration</button>
      <button @click="stopCalibration" class="action-btn" :disabled="!isCalibrating">Stop Calibration</button>
      <button @click="resetToFactory" class="action-btn secondary">Reset to Factory</button>
    </div>
    <div v-if="isCalibrating" class="calibration-status">
      <p>Calibration in progress...</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import KeyboardService from '@services/KeyboardService';

export default defineComponent({
  name: 'Calibration',
  emits: ['update-notification'],
  setup(_, { emit }) {
    const isCalibrating = ref(false);

    const startCalibration = async () => {
      try {
        console.log('Starting calibration');
        isCalibrating.value = true;
        // Placeholder: Start calibration via SDK
        // await KeyboardService.startCalibration();
        emit('update-notification', 'Calibration started', false);
      } catch (error) {
        console.error('Failed to start calibration:', error);
        isCalibrating.value = false;
        emit('update-notification', `Failed to start calibration: ${(error as Error).message}`, true);
      }
    };

    const stopCalibration = async () => {
      try {
        console.log('Stopping calibration');
        isCalibrating.value = false;
        // Placeholder: Stop calibration via SDK
        // await KeyboardService.stopCalibration();
        emit('update-notification', 'Calibration stopped', false);
      } catch (error) {
        console.error('Failed to stop calibration:', error);
        emit('update-notification', `Failed to stop calibration: ${(error as Error).message}`, true);
      }
    };

    const resetToFactory = async () => {
      try {
        console.log('Resetting to factory settings');
        isCalibrating.value = false;
        // Placeholder: Reset to factory via SDK
        // await KeyboardService.resetToFactory();
        emit('update-notification', 'Reset to factory settings completed', false);
      } catch (error) {
        console.error('Failed to reset to factory settings:', error);
        emit('update-notification', `Failed to reset to factory settings: ${(error as Error).message}`, true);
      }
    };

    return {
      isCalibrating,
      startCalibration,
      stopCalibration,
      resetToFactory,
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
    gap: 10px;
    margin-bottom: 10px;

    .action-btn {
      padding: 8px 16px;
      background-color: v.$primary-color;
      color: v.$background-dark;
      border: none;
      border-radius: v.$border-radius;
      cursor: pointer;
      font-size: 1rem;

      &:hover:not(:disabled) {
        background-color: color.adjust(v.$primary-color, $lightness: 10%);
      }

      &:disabled {
        background-color: color.adjust(v.$primary-color, $lightness: -20%);
        cursor: not-allowed;
        opacity: 0.6;
      }

      &.secondary {
        background-color: #374151;

        &:hover:not(:disabled) {
          background-color: color.adjust(#374151, $lightness: 10%);
        }
      }
    }
  }

  .calibration-status {
    text-align: center;
    color: v.$text-color;
    font-size: 1rem;
    padding: 20px;
  }
}
</style>
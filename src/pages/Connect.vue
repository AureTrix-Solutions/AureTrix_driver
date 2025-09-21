<template>
  <div class="connect-page">
    <h2>Connect Your Keyboard</h2>
    <button @click="connectDevice" :disabled="isConnecting" class="connect-btn">
      {{ isConnecting ? 'Connecting...' : 'Connect Keyboard' }}
    </button>
    <p v-if="status" class="status">{{ status }}</p>
    <p v-if="deviceInfo" class="device-info">Device Info: {{ deviceInfoText }}</p>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject, ref, computed } from 'vue';

export default defineComponent({
  name: 'Connect',
  setup() {
    const KeyboardService = inject('KeyboardService') as any;
    const isConnecting = ref(false);
    const status = ref('');
    const deviceInfo = ref<any>(null);

    const connectDevice = async () => {
      isConnecting.value = true;
      status.value = 'Requesting device via WebHID... (Step 1/3)';
      try {
        const device = await KeyboardService.requestDevice(); // Triggers WebHID prompt
        if (device && device.id) {
          status.value = `Connecting to ${device.productName || 'Unknown'}... (Step 2/3)`;
          const initializedDevice = await KeyboardService.init(device.id);
          if (initializedDevice) {
            status.value = `Connected to ${initializedDevice.productName || 'Unknown'} with ID ${initializedDevice.id} (Step 3/3)`;
            // Test connection by fetching base info
            const info = await KeyboardService.getBaseInfo(device.id);
            deviceInfo.value = info;
          } else {
            status.value = `Connection established, but initialization failed for ${device.productName || 'Unknown'}. (Step 3/3)`;
          }
        } else {
          status.value = 'No compatible device found. (Step 1/3)';
        }
      } catch (error) {
        status.value = `Error: ${error.message} (Step 3/3)`;
      } finally {
        isConnecting.value = false;
      }
    };

    const deviceInfoText = computed(() => {
      if (!deviceInfo.value) return '';
      return `BoardID: ${deviceInfo.value.BoardID || 'N/A'}, Version: ${deviceInfo.value.appVersion || 'N/A'}`;
    });

    return { connectDevice, isConnecting, status, deviceInfo, deviceInfoText };
  },
});
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@styles/variables' as v;

.connect-page {
  text-align: center;
  padding: 40px;
  color: v.$text-color;
  h2 {
    margin-bottom: 20px;
    color: v.$primary-color;
  }
  .connect-btn {
    padding: 10px 20px;
    font-size: 1rem;
    background-color: v.$primary-color;
    color: v.$background-dark;
    border: none;
    border-radius: v.$border-radius;
    cursor: pointer;
    &:disabled {
      background-color: color.adjust(v.$primary-color, $lightness: -20%);
      cursor: not-allowed;
    }
  }
  .status {
    margin-top: 20px;
    color: v.$accent-color;
  }
  .device-info {
    margin-top: 10px;
    color: v.$text-color;
  }
}
</style>
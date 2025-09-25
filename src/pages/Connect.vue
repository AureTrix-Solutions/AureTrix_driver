<template>
  <div class="connect-page">
    <h2>Connect Your Keyboard</h2>
    <button @click="connectDevice" :disabled="isConnecting || isConnected" class="connect-btn">
      {{ isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Connect Keyboard' }}
    </button>
    <p v-if="status" class="status">{{ status }}</p>
    <p v-if="deviceInfo" class="device-info">Device Info: {{ deviceInfoText }}</p>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import KeyboardService from '@services/KeyboardService';

export default defineComponent({
  name: 'Connect',
  setup() {
    const isConnecting = ref(false);
    const isConnected = ref(false);
    const status = ref('');
    const deviceInfo = ref<any>(null);

    const connectDevice = async () => {
      isConnecting.value = true;
      status.value = 'Requesting device via WebHID... (Step 1/3)';
      try {
        const device = await KeyboardService.requestDevice();
        if (device && device.id) {
          status.value = `Connecting to ${device.productName || 'Unknown'}... (Step 2/3)`;
          const initializedDevice = await KeyboardService.init(device.id);
          if (initializedDevice) {
            status.value = `Connected to ${initializedDevice.productName || 'Unknown'} with ID ${initializedDevice.id} (Step 3/3)`;
            const info = await KeyboardService.getBaseInfo(device.id);
            deviceInfo.value = info;
            isConnected.value = true;
          } else {
            status.value = `Connection established, but initialization failed for ${device.productName || 'Unknown'}. (Step 3/3)`;
          }
        } else {
          status.value = 'No compatible device found. (Step 1/3)';
        }
      } catch (error) {
        status.value = `Error: ${(error as Error).message} (Step 3/3)`;
      } finally {
        isConnecting.value = false;
      }
    };

    const deviceInfoText = computed(() => {
      if (!deviceInfo.value) return '';
      return `BoardID: ${deviceInfo.value.BoardID || 'N/A'}, Version: ${deviceInfo.value.appVersion || 'N/A'}`;
    });

    onMounted(async () => {
      status.value = 'Checking for paired devices...';
      try {
        const device = await KeyboardService.autoConnect();
        if (device) {
          status.value = `Auto-connected to ${device.productName || 'Unknown'} with ID ${device.id}`;
          const info = await KeyboardService.getBaseInfo(device.id);
          deviceInfo.value = info;
          isConnected.value = true;
        } else {
          status.value = 'No paired device found. Please connect manually.';
        }
      } catch (error) {
        console.error('Auto-connect failed:', error);
        status.value = 'Auto-connect failed. Please connect manually.';
      }
    });

    return { connectDevice, isConnecting, isConnected, status, deviceInfo, deviceInfoText };
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
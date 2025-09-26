<template>
  <div class="connect-page">
    <button @click="connectDevice" :disabled="connectionStore.isConnecting || connectionStore.isConnected" class="connect-btn">
      {{ connectionStore.isConnecting ? 'Connecting...' : connectionStore.isConnected ? 'Connected' : 'Connect Keyboard' }}
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useConnectionStore } from '../store/connection';

export default defineComponent({
  name: 'Connect',
  setup() {
    const connectionStore = useConnectionStore();

    const connectDevice = async () => {
      await connectionStore.connectDevice();
    };

    const deviceInfoText = computed(() => {
      if (!connectionStore.deviceInfo) return '';
      return `BoardID: ${connectionStore.deviceInfo.BoardID || 'N/A'}, Version: ${connectionStore.deviceInfo.appVersion || 'N/A'}`;
    });

    return { connectDevice, connectionStore, deviceInfoText };
  },
});
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@styles/variables' as v;

.connect-page {
  text-align: right;
  width: 200px;
  padding-top: 275px;
  color: v.$text-color;
  h2 {
    margin-bottom: 20px;
    color: v.$primary-color;
  }
  .connect-btn {
    padding: 8px 20px;
    width: 250px;
    font-size: 1.2rem;
    background-color: v.$primary-color;
    color: v.$background-dark;
    border: none;
    border-radius: v.$border-radius;
    cursor: pointer;
    &:disabled {
      background-color: transparent;
      font-size:0%;
      cursor: not-allowed;
    }
  }
  .device-info {
    margin-top: 20px;
    color: v.$primary-color;
  }
}
</style>
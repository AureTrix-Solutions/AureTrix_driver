<template>
  <div class="page-wrapper"></div>
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

.page-wrapper {
  position:absolute;
  width: 3125px;
  height: 1700px;
  aspect-ratio: 16/9;
  background-image: url('@/assets/connect.svg');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center;
}

.connect-page {
  position: relative;
  margin-top: 275px;
  text-align: right;
  width: 250px;
  color: v.$text-color;
  h2 {
    margin-bottom: 20px;
    color: v.$primary-color;
  }
  .connect-btn {
    padding: 8px 20px;
    width: 250px;
    height: 38px;
    font-size: 1rem;
    font-weight: bold;
    text-align: center;
    background-color: v.$text-color;
    color: v.$background-dark;
    border: v.$border-style;
    border-radius: v.$border-radius;
    cursor: pointer;
    &:disabled {
      background-color: transparent;
      border: v.$border-style;
      font-size: 0%;
      cursor: not-allowed;
    }
  }
  .device-info {
    margin-top: 20px;
    color: v.$primary-color;
  }
}
</style>
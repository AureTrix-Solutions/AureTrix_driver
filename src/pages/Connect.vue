<template>
  <div class="viewport">
    <div class="stage" />
    <div class="connect-page">
      <button
        :disabled="connectionStore.isConnecting || connectionStore.isConnected"
        class="connect-btn"
        @click="connectDevice"
      >
        {{ connectionStore.isConnecting ? 'Connecting...' : connectionStore.isConnected ? 'Connected' : 'Connect Keyboard' }}
      </button>
    </div>
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

$art-w: 1024;
$art-h: 640;

.viewport {
  position: absolute;
  inset: 0;
  overflow: hidden;
  container-type: size;
}

.stage {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: max(100cqw, calc(100cqh * #{$art-w} / #{$art-h}));
  aspect-ratio: #{$art-w} / #{$art-h};
  background: url('@/assets/connect.svg') center / 100% 100% no-repeat;
  container-type: inline-size;
}

.connect-page {
  position: absolute;
  top: clamp(340px, 12cqh, 120px);
  left: clamp(0px, 3cqw, 48px);
  width: clamp(150px, 14cqw, 220px);
  z-index: 1;
  color: v.$text-color;

  .connect-btn {
    width: 100%;
    height: clamp(30px, 3cqw, 40px);
    padding: 0 clamp(8px, 1cqw, 16px);
    font-size: clamp(0.8rem, 1.1cqw, 1rem);
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
      font-size: 0;
      cursor: not-allowed;
    }
  }

  .device-info {
    margin-top: clamp(6px, 1cqw, 12px);
    color: v.$primary-color;
  }
}
</style>
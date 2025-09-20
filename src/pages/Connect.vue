<template>
  <div class="connect-page">
    <h2>Connect Your Keyboard</h2>
    <button @click="connectDevice" :disabled="isConnecting" class="connect-btn">
      {{ isConnecting ? 'Connecting...' : 'Connect Keyboard' }}
    </button>
    <p v-if="status" class="status">{{ status }}</p>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject, ref } from 'vue';

export default defineComponent({
  name: 'Connect',
  setup() {
    const KeyboardService = inject('KeyboardService') as any; // Type to be refined later
    const isConnecting = ref(false);
    const status = ref('');

    const connectDevice = async () => {
      isConnecting.value = true;
      status.value = 'Requesting device...';
      try {
        const devices = await KeyboardService.getDevices();
        if (devices.length > 0) {
          status.value = `Found device: ${devices[0].productName}`;
          const device = await KeyboardService.init(devices[0].id);
          status.value = `Connected to ${device.productName}`;
        } else {
          status.value = 'No compatible devices found.';
        }
      } catch (error) {
        status.value = `Error: ${error.message}`;
      } finally {
        isConnecting.value = false;
      }
    };

    return { connectDevice, isConnecting, status };
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
}
</style>
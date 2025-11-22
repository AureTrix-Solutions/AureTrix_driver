// connection.ts
import { defineStore } from 'pinia';
import KeyboardService from '@services/KeyboardService';
import { useProfileStore } from './profileStore';

export const useConnectionStore = defineStore('connection', {
  // State
  state: () => ({
    isConnected: false,
    status: '',
    deviceInfo: null as any,
  }),

  // Actions
  actions: {
    // Auto-connect to paired devices
    async autoConnect() {
      this.status = 'Checking for paired devices...';
      try {
        const device = await KeyboardService.autoConnect();
        if (device) {
          this.deviceInfo = { productName: device.productName || 'Unknown', id: device.id };
          try {
            const info = await KeyboardService.getBaseInfo();
            console.log('Base info:', info); // Essential for debugging device details
            this.deviceInfo = { ...this.deviceInfo, ...info };
            this.status = `Auto-connected to ${this.deviceInfo.productName} with ID ${this.deviceInfo.id}`;
          } catch (baseError) {
            console.error('Failed to load base info:', baseError);
            this.status = `Auto-connected to ${this.deviceInfo.productName}, but failed to load details.`;
          }
          this.isConnected = true;
        } else {
          this.status = 'Please connect';
          this.isConnected = false;
        }
      } catch (error) {
        console.error('Auto-connect failed:', error);
        this.status = 'Please Connect.';
        this.isConnected = false;
      }
    },

    // Manual device connection via WebHID
    async connectDevice() {
      this.status = 'Requesting device via WebHID...';
      try {
        const device = await KeyboardService.requestDevice();
        if (device && device.id) {
          this.deviceInfo = { productName: device.productName || 'Unknown', id: device.id };
          try {
            const info = await KeyboardService.getBaseInfo();
            console.log('Base info:', info); // Essential for debugging device details
            this.deviceInfo = { ...this.deviceInfo, ...info };
            this.status = `Connected to ${this.deviceInfo.productName} with ID ${this.deviceInfo.id}`;
          } catch (baseError) {
            console.error('Failed to load base info:', baseError);
            this.status = `Connected to ${this.deviceInfo.productName}, but failed to load details.`;
          }
          this.isConnected = true;
          
          // Sync active profile from hardware
          const profileStore = useProfileStore();
          await profileStore.syncActiveProfileFromHardware();
          
          // Sync polling rate from hardware
          const { usePollingRateStore } = await import('./pollingRateStore');
          const pollingRateStore = usePollingRateStore();
          await pollingRateStore.syncPollingRateFromHardware();
        } else {
          this.status = 'No compatible device found.';
        }
      } catch (error) {
        this.status = `Error: ${(error as Error).message}`;
      }
    },

    // Disconnect device
    disconnect() {
      this.isConnected = false;
      this.status = 'Device disconnected. Please reconnect manually.';
      this.deviceInfo = null;
    },

    // Handle successful auto-connect callback for reconnects
    async onAutoConnectSuccess(device: any) {
      this.deviceInfo = { productName: device.productName || 'Unknown', id: device.id };
      try {
        const info = await KeyboardService.getBaseInfo();
        console.log('Base info:', info); // Essential for debugging device details
        this.deviceInfo = { ...this.deviceInfo, ...info };
        this.status = `Auto-connected to ${this.deviceInfo.productName} with ID ${this.deviceInfo.id}`;
      } catch (baseError) {
        console.error('Failed to load base info:', baseError);
        this.status = `Auto-connected to ${this.deviceInfo.productName}, but failed to load details.`;
      }
      this.isConnected = true;
      
      // Sync active profile from hardware
      const profileStore = useProfileStore();
      await profileStore.syncActiveProfileFromHardware();
      
      // Sync polling rate from hardware
      const { usePollingRateStore } = await import('./pollingRateStore');
      const pollingRateStore = usePollingRateStore();
      await pollingRateStore.syncPollingRateFromHardware();
    },
  },
});
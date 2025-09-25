import { defineStore } from 'pinia';
import KeyboardService from '@services/KeyboardService';

export const useConnectionStore = defineStore('connection', {
  state: () => ({
    isConnected: false,
    status: '',
    deviceInfo: null as any,
  }),
  actions: {
    async autoConnect() {
      this.status = 'Checking for paired devices...';
      try {
        const device = await KeyboardService.autoConnect();
        if (device) {
          console.log('Device object from autoConnect:', device); // Debug log
          // Preserve productName from the Device object
          this.deviceInfo = { productName: device.productName || 'Slice75 HE', id: device.id };
          const info = await KeyboardService.getBaseInfo(device.id);
          console.log('Base info from getBaseInfo:', info); // Debug log
          this.deviceInfo = { ...this.deviceInfo, ...info };
          this.status = `Connected to ${this.deviceInfo.productName}\nwith ID ${this.deviceInfo.id}`;
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
    async connectDevice() {
      this.status = 'Requesting device via WebHID...';
      try {
        const device = await KeyboardService.requestDevice();
        if (device && device.id) {
          console.log('Device object from requestDevice:', device); // Debug log
          this.deviceInfo = { productName: device.productName || 'Slice75 HE', id: device.id };
          const initializedDevice = await KeyboardService.init(device.id);
          if (initializedDevice) {
            const info = await KeyboardService.getBaseInfo(device.id);
            console.log('Base info from getBaseInfo:', info); // Debug log
            this.deviceInfo = { ...this.deviceInfo, ...info };
            this.status = `Connected to ${this.deviceInfo.productName} with ID ${this.deviceInfo.id}`;
            this.isConnected = true;
          } else {
            this.status = `Connection established, but initialization failed for ${this.deviceInfo.productName}.`;
          }
        } else {
          this.status = 'No compatible device found.';
        }
      } catch (error) {
        this.status = `Error: ${(error as Error).message}`;
      }
    },
    disconnect() {
      this.isConnected = false;
      this.status = 'Device disconnected. Please reconnect manually.';
      this.deviceInfo = null;
    },
  },
});
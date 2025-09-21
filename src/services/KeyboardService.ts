import Keyboard from '@sparklinkplayjoy/sdk-keyboard';

class KeyboardService {
  private keyboard: any; // Typed as 'any' initially; will refine with SDK types later

  constructor() {
    this.keyboard = new Keyboard({
      usage: 1,
      usagePage: 65440,
    });
  }

  async getDevices(): Promise<any[]> {
    try {
      const devices = await this.keyboard.getDevices();
      console.log('SDK devices:', devices); // Debug log
      return devices;
    } catch (error) {
      throw new Error(`Failed to get devices: ${error.message}`);
    }
  }

  async requestDevice(): Promise<any> {
    try {
      const devices = await navigator.hid.requestDevice({
        filters: [{ usagePage: 65440, usage: 1 }], // Ensure WebHID prompt
      });
      console.log('Requested devices:', devices); // Debug log
      if (devices.length > 0) {
        const device = devices[0];
        // Update SDK device list with the selected device
        const sdkDevices = await this.getDevices();
        const existingDevice = sdkDevices.find(d => d.data && d.data.deviceId === device.deviceId);
        return existingDevice || { id: device.deviceId, data: device }; // Return SDK-compatible Device
      }
      throw new Error('No device selected or permission denied');
    } catch (error) {
      throw new Error(`Failed to request device: ${error.message}`);
    }
  }

  async init(deviceId: string): Promise<any> {
    try {
      console.log('Initializing device with ID:', deviceId); // Debug log
      const result = await this.keyboard.init(deviceId);
      console.log('Initialization result:', result); // Debug log
      if (!result) {
        console.warn('Initialization returned null, device might not be fully initialized');
      }
      return result;
    } catch (error) {
      console.error('Initialization error:', error);
      throw new Error(`Initialization failed: ${error.message}`);
    }
  }

  async getBaseInfo(deviceId: string): Promise<any> {
    try {
      const device = await this.init(deviceId); // Ensure device is initialized
      if (device) {
        const info = await this.keyboard.getBaseInfo();
        console.log('Base info:', info); // Debug log
        return info;
      }
      throw new Error('Device not initialized');
    } catch (error) {
      throw new Error(`Failed to get base info: ${error.message}`);
    }
  }
}

export default new KeyboardService();
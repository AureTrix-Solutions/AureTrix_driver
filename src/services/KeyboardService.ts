import Keyboard from '@sparklinkplayjoy/sdk-keyboard';
import { IDefKeyInfo } from '../types/types';

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
      //console.log('SDK devices:', devices); // Debug log
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
      //console.log('Requested devices:', devices); // Debug log
      if (devices.length > 0) {
        const device = devices[0];
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
      //console.log('Initializing device with ID:', deviceId); // Debug log
      const result = await this.keyboard.init(deviceId);
      //console.log('Initialization result:', result); // Debug log
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
        //console.log('Base info:', info); // Debug log
        return info;
      }
      throw new Error('Device not initialized');
    } catch (error) {
      throw new Error(`Failed to get base info: ${error.message}`);
    }
  }

  async defKey(): Promise<IDefKeyInfo[][]> {
    try {
      const layout = await this.keyboard.defKey();
      //console.log('Fetched keyboard layout:', layout); // Debug log
      return layout;
    } catch (error) {
      console.error('Failed to fetch keyboard layout:', error);
      throw new Error(`Failed to fetch keyboard layout: ${error.message}`);
    }
  }

  async getLayoutKeyInfo(params: { key: number; layout: number }[]): Promise<any[]> {
    const maxRetries = 3;
    let attempt = 1;
    while (attempt <= maxRetries) {
      try {
        const layout = await this.keyboard.getLayoutKeyInfo(params);
        //console.log(`Fetched layer layout (attempt ${attempt}):`, layout); // Debug log
        return layout;
      } catch (error) {
        console.warn(`getLayoutKeyInfo attempt ${attempt} failed:`, error);
        if (attempt === maxRetries) {
          console.error('Failed to fetch layer layout after retries:', error);
          throw new Error(`Failed to fetch layer layout: ${error.message}`);
        }
        attempt++;
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    throw new Error('Failed to fetch layer layout: max retries exceeded');
  }

  async setKey(keyConfigs: { key: number; layout: number; value: number }[]): Promise<void> {
    try {
      await this.keyboard.setKey(keyConfigs);
      //console.log('Key remapping applied:', keyConfigs); // Debug log
      // Save parameters to ensure remapping persists
      await this.saveParameters();
      //console.log('Parameters saved after remapping');
      // Reload parameters with a delay to allow device sync
      await this.reloadParameters();
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second delay
      //console.log('Parameters reloaded and synced after saving');
    } catch (error) {
      console.error('Failed to set key:', error);
      throw new Error(`Failed to set key: ${error.message}`);
    }
  }

  async saveParameters(): Promise<void> {
    try {
      await this.keyboard.getApi({ type: 'ORDER_TYPE_SAVING_PARAMETER' });
      //console.log('Parameters saved successfully'); // Debug log
    } catch (error) {
      console.error('Failed to save parameters:', error);
      throw new Error(`Failed to save parameters: ${error.message}`);
    }
  }

  async reloadParameters(): Promise<void> {
    try {
      await this.keyboard.getApi({ type: 'ORDER_TYPE_RELOAD_PARAMETERS' });
      //console.log('Parameters reloaded successfully'); // Debug log
    } catch (error) {
      console.error('Failed to reload parameters:', error);
      throw new Error(`Failed to reload parameters: ${error.message}`);
    }
  }
}

export default new KeyboardService();
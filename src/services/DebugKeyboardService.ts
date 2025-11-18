import XDKeyboard from '@sparklinkplayjoy/sdk-keyboard';
import type { DeviceInit, Device } from '@sparklinkplayjoy/sdk-keyboard';

class DebugKeyboardService {
  private keyboard: XDKeyboard;
  private connectedDevice: Device | null = null;

  constructor() {
    this.keyboard = new XDKeyboard({
      usage: 1,
      usagePage: 65440,
    });
    if ('hid' in navigator) {
      navigator.hid.addEventListener('connect', this.handleConnect.bind(this));
      navigator.hid.addEventListener('disconnect', this.handleDisconnect.bind(this));
    }
  }

  async getDevices(): Promise<Device[]> {
    try {
      const devices = await this.keyboard.getDevices();
      console.log('Debug SDK devices:', devices);
      return devices;
    } catch (error) {
      console.error('Debug: Failed to get devices:', error);
      return [];
    }
  }

  async autoConnect(): Promise<Device | null> {
    try {
      if (!('hid' in navigator)) {
        console.error('Debug: WebHID not supported');
        return null;
      }
      console.log('Debug: Checking for paired devices...');
      let attempts = 0;
      const maxAttempts = 3;
      while (attempts < maxAttempts) {
        try {
          const devices = await navigator.hid.getDevices();
          const targetDevice = devices.find(
            d => d.vendorId === 7331 && d.productId === 1793 && d.collections.some(c => c.usagePage === 65440 && c.usage === 1)
          );
          if (targetDevice) {
            if (!targetDevice.opened) await targetDevice.open();
            const sdkDevices = await this.getDevices();
            const existingDevice = sdkDevices.find(d => d.id === targetDevice.id);
            const device = existingDevice || { id: targetDevice.id, data: targetDevice, productName: targetDevice.productName || 'Unknown' };
            await this.init(device.id);
            this.connectedDevice = device;
            return device;
          }
          if (attempts < maxAttempts - 1) await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        } catch (error) {
          console.warn(`Debug auto-connect attempt ${attempts + 1} failed:`, error);
          if (attempts === maxAttempts - 1) return null;
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        }
      }
      return null;
    } catch (error) {
      console.error('Debug: Auto-connect failed:', error);
      return null;
    }
  }

  async requestDevice(): Promise<Device> {
    try {
      if (!('hid' in navigator)) throw new Error('Debug: WebHID not supported');
      const devices = await navigator.hid.requestDevice({ filters: [{ usagePage: 65440, usage: 1 }] });
      if (devices.length === 0) throw new Error('Debug: No compatible keyboard found');
      const device = devices[0];
      if (!device.opened) await device.open();
      const sdkDevices = await this.getDevices();
      const existingDevice = sdkDevices.find(d => d.id === device.id);
      const result = existingDevice || { id: device.id, data: device, productName: device.productName || 'Unknown' };
      await this.init(result.id);
      this.connectedDevice = result;
      return result;
    } catch (error) {
      console.error('Debug: Request device failed:', error);
      throw new Error(`Debug: Failed to request device: ${(error as Error).message}`);
    }
  }

  private async init(deviceId: string): Promise<Device> {
    try {
      const result = await this.keyboard.init(deviceId);
      console.log('Debug init result:', result);
      return result;
    } catch (error) {
      console.error('Debug: Init failed:', error);
      throw new Error(`Debug: Init failed: ${(error as Error).message}`);
    }
  }

  private handleConnect(event: HIDConnectionEvent): void {
    console.log('Debug: Device connected:', event.device);
    this.autoConnect();
  }

  private handleDisconnect(event: HIDConnectionEvent): void {
    console.log('Debug: Device disconnected:', event.device);
    this.connectedDevice = null;
  }

  // Getter methods for debug (focus on these; extend as needed)
  async getBaseInfo(): Promise<any> {
    try {
      if (!this.connectedDevice) throw new Error('Debug: No device connected');
      const baseInfo = await this.keyboard.getBaseInfo();
      console.log('Debug base info:', baseInfo);
      return baseInfo;
    } catch (error) {
      console.error('Debug: Get base info failed:', error);
      throw new Error(`Debug: Get base info failed: ${(error as Error).message}`);
    }
  }

  async defKey(): Promise<any[][]> {
    const maxRetries = 3;
    let attempt = 0;
    try {
      if (!this.connectedDevice) throw new Error('Debug: No device connected');
      while (attempt < maxRetries) {
        try {
          const layout = await this.keyboard.defKey();
          console.log('Debug defKey layout:', layout);
          return layout;
        } catch (error) {
          console.warn(`Debug defKey attempt ${attempt + 1} failed:`, error);
          if (attempt === maxRetries - 1) throw error;
          attempt++;
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      throw new Error('Debug: defKey max retries exceeded');
    } catch (error) {
      console.error('Debug: defKey failed:', error);
      throw new Error(`Debug: defKey failed: ${(error as Error).message}`);
    }
  }

  async getLayoutKeyInfo(params: { key: number; layout: number }[]): Promise<any> {
    try {
      if (!this.connectedDevice) throw new Error('Debug: No device connected');
      const layoutInfo = await this.keyboard.getLayoutKeyInfo(params);
      console.log('Debug layout key info:', layoutInfo);
      return layoutInfo;
    } catch (error) {
      console.error('Debug: Get layout key info failed:', error);
      throw new Error(`Debug: Get layout key info failed: ${(error as Error).message}`);
    }
  }

  async getGlobalTouchTravel(): Promise<any> {
    try {
      if (!this.connectedDevice) throw new Error('Debug: No device connected');
      const settings = await this.keyboard.getGlobalTouchTravel();
      console.log('Debug global touch travel:', settings);
      return settings;
    } catch (error) {
      console.error('Debug: Get global touch travel failed:', error);
      throw new Error(`Debug: Get global touch travel failed: ${(error as Error).message}`);
    }
  }

  async getPerformanceMode(key: number): Promise<any> {
    try {
      if (!this.connectedDevice) throw new Error('Debug: No device connected');
      const mode = await this.keyboard.getPerformanceMode(key);
      console.log(`Debug performance mode for key ${key}:`, mode);
      return mode;
    } catch (error) {
      console.error(`Debug: Get performance mode for key ${key} failed:`, error);
      throw new Error(`Debug: Get performance mode failed: ${(error as Error).message}`);
    }
  }

  async getDksTravel(key: number, dksLayout: string = 'Layout_DB1'): Promise<any> {
    try {
      if (!this.connectedDevice) throw new Error('Debug: No device connected');
      const result = await this.keyboard.getDksTravel(key, dksLayout);
      console.log(`Debug DKS travel for key ${key} (layout: ${dksLayout}):`, result);
      return result;
    } catch (error) {
      console.error(`Debug: Get DKS travel for key ${key} failed:`, error);
      throw new Error(`Debug: Get DKS travel failed: ${(error as Error).message}`);
    }
  }

  async getDbTravel(key: number, dbLayout: string = 'Layout_DB1'): Promise<any> {
    try {
      if (!this.connectedDevice) throw new Error('Debug: No device connected');
      const result = await this.keyboard.getDbTravel(key, dbLayout);
      console.log(`Debug DB travel for key ${key} (layout: ${dbLayout}):`, result);
      return result;
    } catch (error) {
      console.error(`Debug: Get DB travel for key ${key} failed:`, error);
      throw new Error(`Debug: Get DB travel failed: ${(error as Error).message}`);
    }
  }

  async getRtTravel(key: number): Promise<any> {
    try {
      if (!this.connectedDevice) throw new Error('Debug: No device connected');
      const result = await this.keyboard.getRtTravel(key);
      console.log(`Debug RT travel for key ${key}:`, result);
      return result;
    } catch (error) {
      console.error(`Debug: Get RT travel for key ${key} failed:`, error);
      throw new Error(`Debug: Get RT travel failed: ${(error as Error).message}`);
    }
  }

  async getSingleTravel(key: number, decimal: number = 2): Promise<number> {
    try {
      if (!this.connectedDevice) throw new Error('Debug: No device connected');
      const result = await this.keyboard.getSingleTravel(key, decimal);
      console.log(`Debug single travel for key ${key}:`, result);
      return result;
    } catch (error) {
      console.error(`Debug: Get single travel for key ${key} failed:`, error);
      throw new Error(`Debug: Get single travel failed: ${(error as Error).message}`);
    }
  }

  async getDpDr(key: number): Promise<any> {
    try {
      if (!this.connectedDevice) throw new Error('Debug: No device connected');
      const result = await this.keyboard.getDpDr(key);
      console.log(`Debug DP/DR for key ${key}:`, result);
      return result;
    } catch (error) {
      console.error(`Debug: Get DP/DR for key ${key} failed:`, error);
      throw new Error(`Debug: Get DP/DR failed: ${(error as Error).message}`);
    }
  }

  async getAxis(key: number): Promise<any> {
    try {
      if (!this.connectedDevice) throw new Error('Debug: No device connected');
      const result = await this.keyboard.getAxis(key);
      console.log(`Debug axis for key ${key}:`, result);
      return result;
    } catch (error) {
      console.error(`Debug: Get axis for key ${key} failed:`, error);
      throw new Error(`Debug: Get axis failed: ${(error as Error).message}`);
    }
  }

  async getAxisList(): Promise<any> {
    try {
      if (!this.connectedDevice) throw new Error('Debug: No device connected');
      const result = await this.keyboard.getAxisList();
      console.log('Debug axis list:', result);
      return result;
    } catch (error) {
      console.error('Debug: Get axis list failed:', error);
      throw new Error(`Debug: Get axis list failed: ${(error as Error).message}`);
    }
  }

  async getLighting(): Promise<any> {
    try {
      if (!this.connectedDevice) throw new Error('Debug: No device connected');
      const result = await this.keyboard.getLighting();
      console.log('Debug lighting:', result);
      return result;
    } catch (error) {
      console.error('Debug: Get lighting failed:', error);
      throw new Error(`Debug: Get lighting failed: ${(error as Error).message}`);
    }
  }

  async getLogoLighting(): Promise<any> {
    try {
      if (!this.connectedDevice) throw new Error('Debug: No device connected');
      const result = await this.keyboard.getLogoLighting();
      console.log('Debug logo lighting:', result);
      return result;
    } catch (error) {
      console.error('Debug: Get logo lighting failed:', error);
      throw new Error(`Debug: Get logo lighting failed: ${(error as Error).message}`);
    }
  }

  async getCustomLighting(key?: number): Promise<any> {
    try {
      if (!this.connectedDevice) throw new Error('Debug: No device connected');
      const result = await this.keyboard.getCustomLighting(key);
      console.log(`Debug custom lighting for key ${key}:`, result);
      return result;
    } catch (error) {
      console.error(`Debug: Get custom lighting for key ${key} failed:`, error);
      throw new Error(`Debug: Get custom lighting failed: ${(error as Error).message}`);
    }
  }

  async getSpecialLighting(): Promise<any> {
    try {
      if (!this.connectedDevice) throw new Error('Debug: No device connected');
      const result = await this.keyboard.getSpecialLighting();
      console.log('Debug special lighting:', result);
      return result;
    } catch (error) {
      console.error('Debug: Get special lighting failed:', error);
      throw new Error(`Debug: Get special lighting failed: ${(error as Error).message}`);
    }
  }

  async getSaturation(): Promise<any> {
    try {
      if (!this.connectedDevice) throw new Error('Debug: No device connected');
      const result = await this.keyboard.getSaturation();
      console.log('Debug saturation:', result);
      return result;
    } catch (error) {
      console.error('Debug: Get saturation failed:', error);
      throw new Error(`Debug: Get saturation failed: ${(error as Error).message}`);
    }
  }

  async closedLighting(): Promise<any> {
    try {
      if (!this.connectedDevice) throw new Error('Debug: No device connected');
      const result = await this.keyboard.closedLighting();
      console.log('Debug closed lighting result:', result);
      return result;
    } catch (error) {
      console.error('Debug: Close lighting failed:', error);
      throw new Error(`Debug: Close lighting failed: ${(error as Error).message}`);
    }
  }

  async setLighting(lightModeConfig: any): Promise<any> {
    try {
      if (!this.connectedDevice) throw new Error('Debug: No device connected');
      console.log('Debug setting lighting:', lightModeConfig);
      await this.keyboard.setLighting(lightModeConfig);
      console.log('Debug set lighting complete, fetching current state...');
      const currentState = await this.getLighting();
      return currentState;
    } catch (error) {
      console.error('Debug: Set lighting failed:', error);
      throw new Error(`Debug: Set lighting failed: ${(error as Error).message}`);
    }
  }

  async setLogoLighting(lightModeConfig: any): Promise<any> {
    try {
      if (!this.connectedDevice) throw new Error('Debug: No device connected');
      console.log('Debug setting logo lighting:', lightModeConfig);
      await this.keyboard.setLogoLighting(lightModeConfig);
      console.log('Debug set logo lighting complete, fetching current state...');
      const currentState = await this.getLighting();
      return currentState;
    } catch (error) {
      console.error('Debug: Set logo lighting failed:', error);
      throw new Error(`Debug: Set logo lighting failed: ${(error as Error).message}`);
    }
  }

  async setCustomLighting(param: any): Promise<any> {
    try {
      if (!this.connectedDevice) throw new Error('Debug: No device connected');
      console.log('Debug setting custom lighting:', param);
      await this.keyboard.setCustomLighting(param);
      console.log('Debug set custom lighting complete, fetching current state...');
      const currentState = await this.getLighting();
      return currentState;
    } catch (error) {
      console.error('Debug: Set custom lighting failed:', error);
      throw new Error(`Debug: Set custom lighting failed: ${(error as Error).message}`);
    }
  }

  async saveCustomLighting(): Promise<any> {
    try {
      if (!this.connectedDevice) throw new Error('Debug: No device connected');
      await this.keyboard.saveCustomLighting();
      console.log('Debug save custom lighting complete, fetching current state...');
      const currentState = await this.getLighting();
      return currentState;
    } catch (error) {
      console.error('Debug: Save custom lighting failed:', error);
      throw new Error(`Debug: Save custom lighting failed: ${(error as Error).message}`);
    }
  }

  async setSpecialLighting(lightModeConfig: any): Promise<any> {
    try {
      if (!this.connectedDevice) throw new Error('Debug: No device connected');
      console.log('Debug setting special lighting:', lightModeConfig);
      await this.keyboard.setSpecialLighting(lightModeConfig);
      console.log('Debug set special lighting complete, fetching current state...');
      const currentState = await this.getLighting();
      return currentState;
    } catch (error) {
      console.error('Debug: Set special lighting failed:', error);
      throw new Error(`Debug: Set special lighting failed: ${(error as Error).message}`);
    }
  }

  async setLightingSaturation(param: number[]): Promise<any> {
    try {
      if (!this.connectedDevice) throw new Error('Debug: No device connected');
      console.log('Debug setting lighting saturation:', param);
      await this.keyboard.setLightingSaturation(param);
      console.log('Debug set lighting saturation complete, fetching current state...');
      const currentState = await this.getLighting();
      return currentState;
    } catch (error) {
      console.error('Debug: Set lighting saturation failed:', error);
      throw new Error(`Debug: Set lighting saturation failed: ${(error as Error).message}`);
    }
  }

  async exportEncryptedJSON(filename?: string): Promise<void> {
  try {
      if (!this.connectedDevice) throw new Error('Debug: No device connected');
      // Test call without data param—let SDK handle defaults
      await this.keyboard.exportEncryptedJSON(filename || 'default-config.json');
      console.log(`Debug: SDK export called without data param (filename: ${filename || 'default-config.json'})`);
  } catch (error) {
      console.error('Debug: SDK export failed (no params):', error);
      throw new Error(`Debug: Export test failed: ${(error as Error).message}`);
  }
  }
  async getRm6x21Travel(): Promise<{ status: any; travels: number[]; maxTravel: number }> {
    try {
      if (!this.connectedDevice) throw new Error('Debug: No device connected');
      const result = await this.keyboard.getRm6X21Travel();
      if (result instanceof Error) throw result;
      const travels = result.travels || [];
      const maxTravel = travels.length > 0 ? Math.max(...travels) : 4.0; // Fallback to 4.0mm
      console.log('Debug RM6x21 travel data:', { status: result.status, travels, maxTravel });
      return { status: result.status, travels, maxTravel };
    } catch (error) {
      console.error('Debug: getRm6x21Travel failed:', error);
      throw new Error(`Debug: getRm6x21Travel failed: ${(error as Error).message}`);
    }
  }


  async getRm6x21Calibration(): Promise<{ travels: number[]; calibrations: number[]; maxTravel: number }> {
    try {
      if (!this.connectedDevice) throw new Error('Debug: No device connected');
      const result = await this.keyboard.getRm6X21Calibration();
      if (result instanceof Error) throw result;
      const travels = result.travels || [];
      const calibrations = result.calibrations || [];
      const maxTravel = travels.length > 0 ? Math.max(...travels) : 4.0; // Fallback
      console.log('Debug RM6x21 calibration data:', { travels, calibrations, maxTravel });
      return { travels, calibrations, maxTravel };
    } catch (error) {
      console.error('Debug: getRm6x21Calibration failed:', error);
      throw new Error(`Debug: getRm6x21Calibration failed: ${(error as Error).message}`);
    }
  }
}

export default new DebugKeyboardService();
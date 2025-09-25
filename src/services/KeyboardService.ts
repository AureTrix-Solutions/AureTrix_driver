import XDKeyboard from '@sparklinkplayjoy/sdk-keyboard';
import type { DeviceInit, Device } from '@sparklinkplayjoy/sdk-keyboard';
import { IDefKeyInfo } from '../types/types';

class KeyboardService {
  private keyboard: XDKeyboard;
  private connectedDevice: Device | null = null;

  constructor() {
    this.keyboard = new XDKeyboard({
      usage: 1,
      usagePage: 65440,
    });
    // Set up plug/unplug event listeners
    if ('hid' in navigator) {
      navigator.hid.addEventListener('connect', this.handleConnect.bind(this));
      navigator.hid.addEventListener('disconnect', this.handleDisconnect.bind(this));
    }
  }

  async getDevices(): Promise<Device[]> {
    try {
      const devices = await this.keyboard.getDevices();
      console.log('SDK devices:', devices);
      return devices;
    } catch (error) {
      console.error('Failed to get devices:', error);
      return [];
    }
  }

  async autoConnect(): Promise<Device | null> {
    try {
      if (!('hid' in navigator)) {
        console.error('WebHID not supported in this browser');
        return null;
      }
      console.log('Checking for previously paired devices...');
      const devices = await navigator.hid.getDevices();
      console.log('Paired devices:', devices);
      const targetDevice = devices.find(
        d => d.vendorId === 7331 && d.productId === 1793 && d.collections.some(c => c.usagePage === 65440 && c.usage === 1)
      );
      if (targetDevice) {
        if (!targetDevice.opened) {
          await targetDevice.open();
          console.log('Auto-connected device:', targetDevice.productName || 'Unknown', 'VendorID:', targetDevice.vendorId, 'ProductID:', targetDevice.productId, 'DeviceID:', targetDevice.id);
        }
        const sdkDevices = await this.getDevices();
        const existingDevice = sdkDevices.find(d => d.id === targetDevice.id);
        const device = existingDevice || { id: targetDevice.id, data: targetDevice, productName: targetDevice.productName || 'Unknown' };
        await this.init(device.id);
        this.connectedDevice = device;
        return device;
      }
      console.log('No previously paired Slice75 HE found');
      return null;
    } catch (error) {
      console.error('Failed to auto-connect:', error);
      return null;
    }
  }

  async requestDevice(): Promise<Device> {
    try {
      if (!('hid' in navigator)) {
        throw new Error('WebHID not supported in this browser');
      }
      console.log('Attempting to request device with filter: [{ usagePage: 65440, usage: 1 }]');
      const devices = await navigator.hid.requestDevice({
        filters: [{ usagePage: 65440, usage: 1 }],
      });
      console.log('Requested devices:', devices);
      if (devices.length === 0) {
        throw new Error('No compatible keyboard found. Please ensure a supported device is connected.');
      }
      const device = devices[0];
      if (!device.opened) {
        await device.open();
        console.log('Device opened:', device.productName || 'Unknown', 'VendorID:', device.vendorId, 'ProductID:', device.productId, 'DeviceID:', device.id);
      }
      const sdkDevices = await this.getDevices();
      const existingDevice = sdkDevices.find(d => d.id === device.id);
      const result = existingDevice || { id: device.id, data: device, productName: device.productName || 'Unknown' };
      this.connectedDevice = result;
      await this.init(result.id);
      return result;
    } catch (error) {
      console.error('Failed to request device:', error);
      throw new Error(`Failed to request device: ${(error as Error).message}`);
    }
  }

  private async handleConnect(event: Event) {
    const device = (event as HIDConnectionEvent).device;
    if (device.vendorId === 7331 && device.productId === 1793 && device.collections.some(c => c.usagePage === 65440 && c.usage === 1)) {
      console.log('Device connected:', device.productName || 'Unknown', 'DeviceID:', device.id);
      const result = await this.autoConnect();
      if (result) {
        console.log('Reconnected device:', result.productName, 'DeviceID:', result.id);
      } else {
        console.error('Failed to reconnect device: autoConnect returned null');
      }
    }
  }

  private handleDisconnect(event: Event) {
    const device = (event as HIDConnectionEvent).device;
    if (this.connectedDevice && this.connectedDevice.id === device.id) {
      console.log('Device disconnected:', device.productName || 'Unknown', 'DeviceID:', device.id);
      this.connectedDevice = null;
    }
  }

  async init(deviceId: string): Promise<Device> {
    try {
      console.log('Initializing device with ID:', deviceId);
      const result = await this.keyboard.init(deviceId);
      console.log('Initialization result:', result);
      if (!result) {
        console.warn('Initialization returned null, device might not be fully initialized');
      }
      return result || { id: deviceId, productName: 'Unknown' };
    } catch (error) {
      console.error('Initialization error:', error);
      throw new Error(`Initialization failed: ${(error as Error).message}`);
    }
  }

  async getBaseInfo(deviceId: string): Promise<any> {
    try {
      const device = await this.init(deviceId);
      if (device) {
        const info = await this.keyboard.getBaseInfo();
        console.log('Base info:', info);
        return info;
      }
      throw new Error('Device not initialized');
    } catch (error) {
      console.error('Failed to get base info:', error);
      throw new Error(`Failed to get base info: ${(error as Error).message}`);
    }
  }

  async defKey(): Promise<IDefKeyInfo[][]> {
    try {
      const layout = await this.keyboard.defKey();
      console.log('Fetched keyboard layout:', layout);
      return layout;
    } catch (error) {
      console.error('Failed to fetch keyboard layout:', error);
      throw new Error(`Failed to fetch keyboard layout: ${(error as Error).message}`);
    }
  }

  async getLayoutKeyInfo(params: { key: number; layout: number }[]): Promise<any[]> {
    try {
      const maxRetries = 3;
      let attempt = 1;
      while (attempt <= maxRetries) {
        try {
          const layout = await this.keyboard.getLayoutKeyInfo(params);
          console.log(`Fetched layer layout (attempt ${attempt}):`, layout);
          return layout;
        } catch (error) {
          console.warn(`getLayoutKeyInfo attempt ${attempt} failed:`, error);
          if (attempt === maxRetries) {
            console.error('Failed to fetch layer layout after retries:', error);
            throw new Error(`Failed to fetch layer layout: ${(error as Error).message}`);
          }
          attempt++;
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      throw new Error('Failed to fetch layer layout: max retries exceeded');
    } catch (error) {
      console.error('Failed to fetch layer layout:', error);
      throw new Error(`Failed to fetch layer layout: ${(error as Error).message}`);
    }
  }

  async setKey(keyConfigs: { key: number; layout: number; value: number }[]): Promise<void> {
    try {
      await this.keyboard.setKey(keyConfigs);
      console.log('Key remapping applied:', keyConfigs);
      await this.saveParameters();
      console.log('Parameters saved after remapping');
      await this.reloadParameters();
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Parameters reloaded and synced after saving');
    } catch (error) {
      console.error('Failed to set key:', error);
      throw new Error(`Failed to set key: ${(error as Error).message}`);
    }
  }

  async saveParameters(): Promise<void> {
    try {
      await this.keyboard.getApi({ type: 'ORDER_TYPE_SAVING_PARAMETER' });
      console.log('Parameters saved successfully');
    } catch (error) {
      console.error('Failed to save parameters:', error);
      throw new Error(`Failed to save parameters: ${(error as Error).message}`);
    }
  }

  async reloadParameters(): Promise<void> {
    try {
      await this.keyboard.getApi({ type: 'ORDER_TYPE_RELOAD_PARAMETERS' });
      console.log('Parameters reloaded successfully');
    } catch (error) {
      console.error('Failed to reload parameters:', error);
      throw new Error(`Failed to reload parameters: ${(error as Error).message}`);
    }
  }
}

export default new KeyboardService();
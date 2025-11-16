// KeyboardService.ts
import XDKeyboard from '@sparklinkplayjoy/sdk-keyboard';
import type { DeviceInit, Device } from '@sparklinkplayjoy/sdk-keyboard';
import { IDefKeyInfo } from '../types/types';
import { useConnectionStore } from '../store/connection';

class KeyboardService {
  private keyboard: XDKeyboard;
  private connectedDevice: Device | null = null;

  // Initialization
  constructor() {
    this.keyboard = new XDKeyboard({
      usage: 1,
      usagePage: 65440,
    });
    if ('hid' in navigator) {
      navigator.hid.addEventListener('connect', this.handleConnect);
      navigator.hid.addEventListener('disconnect', this.handleDisconnect);
    }
    this.reconnectIfPaired();
  }

  private reconnectIfPaired(): void {
    const savedStableId = localStorage.getItem('pairedStableId');
    if (savedStableId) {
      this.reconnect(savedStableId);
    }
  }

  // Connection Management
  async getDevices(): Promise<Device[]> {
    try {
      const devices = await this.keyboard.getDevices();
      return devices;
    } catch (error) {
      console.error('Failed to get devices:', error);
      return [];
    }
  }

  async reconnect(stableId: string): Promise<void | Error> {
    try {
      const savedDeviceData = localStorage.getItem(`pairedDeviceData_${stableId}`);
      if (!savedDeviceData) {
        throw new Error('No saved device data for reconnection');
      }
      const device = JSON.parse(savedDeviceData) as Device;
      await this.keyboard.reconnection(device.data, device.id);
      this.connectedDevice = device;
      const connectionStore = useConnectionStore();
      await connectionStore.onAutoConnectSuccess(device);
    } catch (error) {
      console.error('Failed to reconnect:', error);
      return error as Error;
    }
  }

  async requestDevice(): Promise<Device> {
    try {
      if (!('hid' in navigator)) {
        throw new Error('WebHID not supported in this browser');
      }
      const devices = await navigator.hid.requestDevice({ filters: [] });
      if (devices.length === 0) {
        throw new Error('No HID device selected. Please ensure a keyboard is connected and select it.');
      }
      const device = devices[0];
      console.log('Selected raw HID device:', device); // Essential for debugging device properties
      if (!device.opened) {
        await device.open();
      }
      const sdkDevices = await this.getDevices();
      const existingDevice = sdkDevices.find(d => d.data.vendorId === device.vendorId && d.data.productId === device.productId && d.data.serialNumber === device.serialNumber);
      const fallbackId = device.id || `${device.vendorId}-${device.productId}-${device.serialNumber || 'unknown'}`;
      const result = existingDevice || { id: fallbackId, data: device, productName: device.productName || 'Unknown' };
      console.log('Constructed result device:', result); // Essential for debugging constructed device
      await this.init(result.id);
      this.connectedDevice = result;
      localStorage.setItem('pairedStableId', fallbackId);
      localStorage.setItem(`pairedDeviceData_${fallbackId}`, JSON.stringify(result));
      localStorage.removeItem('pairedDeviceId');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('pairedDeviceData_') && !key.endsWith(fallbackId)) {
          localStorage.removeItem(key);
        }
      });
      return result;
    } catch (error) {
      console.error('Failed to request device:', error);
      throw new Error(`Failed to request device: ${(error as Error).message}`);
    }
  }

  async autoConnect(): Promise<Device | null> {
    try {
      if (!('hid' in navigator)) {
        console.error('WebHID not supported in this browser');
        return null;
      }
      const savedStableId = localStorage.getItem('pairedStableId');
      if (!savedStableId) return null;

      let attempts = 0;
      const maxAttempts = 3;
      while (attempts < maxAttempts) {
        try {
          const hidDevices = await navigator.hid.getDevices();
          const targetHidDevice = hidDevices.find(d => {
            const fallbackId = d.id || `${d.vendorId}-${d.productId}-${d.serialNumber || 'unknown'}`;
            return fallbackId === savedStableId;
          });
          if (targetHidDevice) {
            if (!targetHidDevice.opened) {
              await targetHidDevice.open();
            }
            const sdkDevices = await this.getDevices();
            const targetSdkDevice = sdkDevices.find(d => d.data.vendorId === targetHidDevice.vendorId && d.data.productId === targetHidDevice.productId && d.data.serialNumber === targetHidDevice.serialNumber);
            const fallbackId = targetHidDevice.id || `${targetHidDevice.vendorId}-${targetHidDevice.productId}-${targetHidDevice.serialNumber || 'unknown'}`;
            const device = targetSdkDevice || { id: fallbackId, data: targetHidDevice, productName: targetHidDevice.productName || 'Unknown' };
            console.log('Auto-connect SDK matched device:', device); // Essential for debugging auto-connect
            await this.init(device.id);
            this.connectedDevice = device;
            const connectionStore = useConnectionStore();
            await connectionStore.onAutoConnectSuccess(device);
            return device;
          }

          if (attempts < maxAttempts - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          attempts++;
        } catch (error) {
          console.warn(`Auto-connect attempt ${attempts + 1} failed:`, error);
          if (attempts === maxAttempts - 1) {
            console.error('Auto-connect failed after max attempts:', error);
            return null;
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to auto-connect:', error);
      return null;
    }
  }

  private async init(deviceId: string): Promise<Device> {
    try {
      const result = await this.keyboard.init(deviceId);
      return result;
    } catch (error) {
      console.error('Failed to initialize device:', error);
      throw new Error(`Failed to initialize device: ${(error as Error).message}`);
    }
  }

  private handleConnect = (event: HIDConnectionEvent): void => {
    this.autoConnect();
  }

  private handleDisconnect = (event: HIDConnectionEvent): void => {
    this.connectedDevice = null;
    const connectionStore = useConnectionStore();
    connectionStore.disconnect();
    localStorage.removeItem('pairedDeviceId');
  }

  // Base Info and Layout
  async getBaseInfo(): Promise<any | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      let attempts = 0;
      const maxAttempts = 3;
      while (attempts < maxAttempts) {
        try {
          const baseInfo = await this.keyboard.getBaseInfo();
          if (baseInfo instanceof Error) throw baseInfo;
          return baseInfo;
        } catch (error) {
          console.warn(`getBaseInfo attempt ${attempts + 1} failed:`, error);
          if (attempts === maxAttempts - 1) {
            console.error('Failed to fetch base info after retries:', error);
            return error as Error;
          }
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      return new Error('Failed to fetch base info: max retries exceeded');
    } catch (error) {
      console.error('Failed to fetch base info:', error);
      return error as Error;
    }
  }

  async defKey(): Promise<IDefKeyInfo[][] | Error> {
    const maxRetries = 3;
    let attempt = 0;
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      while (attempt < maxRetries) {
        try {
          const layout = await this.keyboard.defKey();
          if (layout instanceof Error) return layout;
          return layout;
        } catch (error) {
          console.warn(`defKey attempt ${attempt + 1} failed:`, error);
          if (attempt === maxRetries - 1) {
            console.error('Failed to fetch keyboard layout after retries:', error);
            return error as Error;
          }
          attempt++;
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      return new Error('Failed to fetch keyboard layout: max retries exceeded');
    } catch (error) {
      console.error('Failed to fetch keyboard layout:', error);
      return error as Error;
    }
  }

  async getLayoutKeyInfo(params: { key: number; layout: number }[]): Promise<IDefKeyInfo[] | Error> {
    const maxRetries = 3;
    let attempt = 0;
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      while (attempt < maxRetries) {
        try {
          const layoutInfo = await this.keyboard.getLayoutKeyInfo(params);
          if (layoutInfo instanceof Error) return layoutInfo;
          return layoutInfo;
        } catch (error) {
          console.warn(`getLayoutKeyInfo attempt ${attempt + 1} failed:`, error);
          if (attempt === maxRetries - 1) {
            console.error('Failed to fetch layer layout after retries:', error);
            return error as Error;
          }
          attempt++;
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      return new Error('Failed to fetch layer layout: max retries exceeded');
    } catch (error) {
      console.error('Failed to fetch layer layout:', error);
      return error as Error;
    }
  }

  // Key Configuration
  async setKey(keyConfigs: { key: number; layout: number; value: number }[]): Promise<void | Error> {
    try {
      await this.keyboard.setKey(keyConfigs);
      // TEST: Commenting out to see if these are necessary
      // await this.saveParameters();
      // await this.reloadParameters();
      return;
    } catch (error) {
      console.error('Failed to set key:', error);
      return error as Error;
    }
  }

  async saveParameters(): Promise<void | Error> {
    try {
      await this.keyboard.getApi({ type: 'ORDER_TYPE_SAVING_PARAMETER' });
      return;
    } catch (error) {
      console.error('Failed to save parameters:', error);
      return error as Error;
    }
  }

  async reloadParameters(): Promise<void | Error> {
    try {
      await this.keyboard.getApi({ type: 'ORDER_TYPE_RELOAD_PARAMETERS' });
      return;
    } catch (error) {
      console.error('Failed to reload parameters:', error);
      return error as Error;
    }
  }

  async getMacro(key: number): Promise<any | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.getMacro(key);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error(`Failed to fetch macro for key ${key}:`, error);
      return error as Error;
    }
  }

  async setMacro(param: any, macros: any[]): Promise<void | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      await this.keyboard.setMacro(param, macros);
      // TEST: Commenting out to see if these are necessary
      // await this.saveParameters();
      // await this.reloadParameters();
      await new Promise(resolve => setTimeout(resolve, 1000));
      return;
    } catch (error) {
      console.error(`Failed to set macro for key ${param.key}:`, error);
      return error as Error;
    }
  }

  // Global Touch Travel
  async getGlobalTouchTravel(): Promise<{ globalTouchTravel: number } | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.getGlobalTouchTravel();
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error('Failed to fetch global touch travel:', error);
      return error as Error;
    }
  }

  async setGlobalTouchTravel(param: any): Promise<{ globalTouchTravel: number; pressDead: number; releaseDead: number } | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.setDB(param);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error('Failed to set global touch travel:', error);
      return error as Error;
    }
  }

  // Performance Mode
  async getPerformanceMode(key: number): Promise<{ touchMode: string; advancedKeyMode: number } | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.getPerformanceMode(key);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error(`Failed to fetch performance mode for key ${key}:`, error);
      return error as Error;
    }
  }

  async setPerformanceMode(key: number, mode: string, advancedKeyMode: number): Promise<{ touchMode: string; advancedKeyMode: number } | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.setPerformanceMode(key, mode, advancedKeyMode);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error(`Failed to set performance mode for key ${key}:`, error);
      return error as Error;
    }
  }

  // DB Travel
  async getDbTravel(key: number, dbLayout: string = 'Layout_DB1'): Promise<{ travel: number; dbs?: number[] } | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.getDbTravel(key, dbLayout);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error(`Failed to fetch DB travel for key ${key}:`, error);
      return error as Error;
    }
  }

  async setDbTravel(key: number, value: number, dbLayout: string = 'Layout_DB1'): Promise<{ travel: number; dbs?: number[] } | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.setDbTravel(key, value, dbLayout);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error(`Failed to set DB travel for key ${key}:`, error);
      return error as Error;
    }
  }

  // RT Travel
  async getRtTravel(key: number): Promise<{ pressTravel: number; releaseTravel: number } | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.getRtTravel(key);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error(`Failed to fetch RT travel for key ${key}:`, error);
      return error as Error;
    }
  }

  async setRtPressTravel(key: number, value: number): Promise<{ pressTravel: number } | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.setRtPressTravel(key, value);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error(`Failed to set RT press travel for key ${key}:`, error);
      return error as Error;
    }
  }

  async setRtReleaseTravel(key: number, value: number): Promise<{ releaseTravel: number } | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.setRtReleaseTravel(key, value);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error(`Failed to set RT release travel for key ${key}:`, error);
      return error as Error;
    }
  }

  // DP/DR Thresholds
  async getDpDr(key: number): Promise<{ dpThreshold: number; drThreshold: number } | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.getDpDr(key);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error(`Failed to fetch DP/DR for key ${key}:`, error);
      return error as Error;
    }
  }

  async setDp(key: number, value: number): Promise<{ pressDead: number } | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.setDp(key, value);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error(`Failed to set press dead zone for key ${key}:`, error);
      return error as Error;
    }
  }

  async setDr(key: number, value: number): Promise<{ releaseDead: number } | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.setDr(key, value);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error(`Failed to set release dead zone for key ${key}:`, error);
      return error as Error;
    }
  }

  // Axis Settings
  async getAxis(key: number): Promise<{ axis: number } | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.getAxis(key);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error(`Failed to fetch axis for key ${key}:`, error);
      return error as Error;
    }
  }

  async setAxis(key: number, value: number): Promise<{ axis: number } | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.setAxis(key, value);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error(`Failed to set axis for key ${key}:`, error);
      return error as Error;
    }
  }

  // Single Travel
  async getSingleTravel(key: number, decimal: number = 2): Promise<number | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.getSingleTravel(key, decimal);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error(`Failed to fetch single key travel for key ${key}:`, error);
      return error as Error;
    }
  }

  async setSingleTravel(key: number, value: number, decimal: number = 2): Promise<number | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.setSingleTravel(key, value, decimal);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error(`Failed to set single travel for key ${key}:`, error);
      return error as Error;
    }
  }

  // DKS Travel
  async getDksTravel(key: number, dksLayout: string = 'Layout_DB1'): Promise<{ travel: number; dbs?: number[] } | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.getDksTravel(key, dksLayout);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error(`Failed to fetch DKS travel for key ${key}:`, error);
      return error as Error;
    }
  }

  async setDksTravel(key: number, value: number, dksLayout: string = 'Layout_DB1'): Promise<{ travel: number; dbs?: number[] } | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.setDksTravel(key, value, dksLayout);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error(`Failed to set DKS travel for key ${key}:`, error);
      return error as Error;
    }
  }

  // Calibration
  async calibrationStart(): Promise<Calibration | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.calibrationStart();
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error('Failed to start calibration:', error);
      return error as Error;
    }
  }

  async calibrationEnd(): Promise<Calibration | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.calibrationEnd();
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error('Failed to end calibration:', error);
      return error as Error;
    }
  }

  // Advanced Calibration and Travel
  async getRm6X21Calibration(): Promise<{ calibrations: number[]; travels: number[] } | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.getRm6X21Calibration();
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error('Failed to fetch RM6X21 calibration data:', error);
      return error as Error;
    }
  }

  async getAxisList(): Promise<{ hasAxisSetting: boolean; axisList: number[] } | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.getAxisList();
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error('Failed to fetch axis list:', error);
      return error as Error;
    }
  }

  async getRm6X21Travel(): Promise<{ status: any; travels: number[]; maxTravel: number } | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.getRm6X21Travel();
      if (result instanceof Error) return result;
      const travels = result.travels || [];
      const flatTravels = travels.flat();
      const maxTravel = flatTravels.length > 0 ? Math.max(...flatTravels.filter(t => t > 0)) : 4.0;
      return { status: result.status, travels: flatTravels, maxTravel };
    } catch (error) {
      console.error('Failed to fetch RM6X21 travel data:', error);
      return error as Error;
    }
  }
}

export default new KeyboardService();
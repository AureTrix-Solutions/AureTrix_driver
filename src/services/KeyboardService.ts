import XDKeyboard from '@sparklinkplayjoy/sdk-keyboard';
import { IDefKeyInfo } from '../types/types';
import { useConnectionStore } from '../store/connection';

interface IMacroMode {
  key: number;
  index: number;
  len: number;
  mode: number;
  num: number;
  delay: number;
}

interface MacroType {
  keyCode: number;
  timeDifference: number;
  status: number; // 1 for press, 0 for release
}

interface IDB {
  globalTouchTravel: number;
  pressDead: number;
  releaseDead: number;
}

class KeyboardService {
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

  // Device Management
  async getDevices(): Promise<Device[]> {
    try {
      const devices = await this.keyboard.getDevices();
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
      let attempts = 0;
      const maxAttempts = 3;
      while (attempts < maxAttempts) {
        try {
          const devices = await navigator.hid.getDevices();
          const targetDevice = devices.find(
            d => d.vendorId === 7331 && d.productId === 1793 && d.collections.some(c => c.usagePage === 65440 && c.usage === 1)
          );
          if (targetDevice) {
            if (!targetDevice.opened) {
              await targetDevice.open();
            }
            const sdkDevices = await this.getDevices();
            const existingDevice = sdkDevices.find(d => d.id === targetDevice.id);
            const device = existingDevice || { id: targetDevice.id, data: targetDevice, productName: targetDevice.productName || 'Unknown' };
            await this.init(device.id);
            this.connectedDevice = device;
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

  async requestDevice(): Promise<Device> {
    try {
      if (!('hid' in navigator)) {
        throw new Error('WebHID not supported in this browser');
      }
      const devices = await navigator.hid.requestDevice({
        filters: [{ usagePage: 65440, usage: 1 }],
      });
      if (devices.length === 0) {
        throw new Error('No compatible keyboard found. Please ensure a supported device is connected.');
      }
      const device = devices[0];
      if (!device.opened) {
        await device.open();
      }
      const sdkDevices = await this.getDevices();
      const existingDevice = sdkDevices.find(d => d.id === device.id);
      const result = existingDevice || { id: device.id, data: device, productName: device.productName || 'Unknown' };
      await this.init(result.id);
      this.connectedDevice = result;
      return result;
    } catch (error) {
      console.error('Failed to request device:', error);
      throw new Error(`Failed to request device: ${(error as Error).message}`);
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

  private handleConnect(event: HIDConnectionEvent): void {
    this.autoConnect();
  }

  private handleDisconnect(event: HIDConnectionEvent): void {
    this.connectedDevice = null;
    const connectionStore = useConnectionStore();
    connectionStore.setDisconnected();
  }

  // Basic Info and Layout
  async getBaseInfo(): Promise<any> {
    try {
      if (!this.connectedDevice) {
        throw new Error('No device connected');
      }
      const baseInfo = await this.keyboard.getBaseInfo();
      return baseInfo;
    } catch (error) {
      console.error('Failed to fetch base info:', error);
      throw new Error(`Failed to fetch base info: ${(error as Error).message}`);
    }
  }

  async defKey(): Promise<IDefKeyInfo[][]> {
    const maxRetries = 3;
    let attempt = 0;
    try {
      if (!this.connectedDevice) {
        throw new Error('No device connected');
      }
      while (attempt < maxRetries) {
        try {
          const layout = await this.keyboard.defKey();
          return layout;
        } catch (error) {
          console.warn(`defKey attempt ${attempt + 1} failed:`, error);
          if (attempt === maxRetries - 1) {
            console.error('Failed to fetch keyboard layout after retries:', error);
            throw new Error(`Failed to fetch keyboard layout: ${(error as Error).message}`);
          }
          attempt++;
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      throw new Error('Failed to fetch keyboard layout: max retries exceeded');
    } catch (error) {
      console.error('Failed to fetch keyboard layout:', error);
      throw new Error(`Failed to fetch keyboard layout: ${(error as Error).message}`);
    }
  }

  async getLayoutKeyInfo(params: { key: number; layout: number }[]): Promise<IDefKeyInfo[]> {
    const maxRetries = 3;
    let attempt = 0;
    try {
      if (!this.connectedDevice) {
        throw new Error('No device connected');
      }
      while (attempt < maxRetries) {
        try {
          const layoutInfo = await this.keyboard.getLayoutKeyInfo(params);
          return layoutInfo;
        } catch (error) {
          console.warn(`getLayoutKeyInfo attempt ${attempt + 1} failed:`, error);
          if (attempt === maxRetries - 1) {
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

  // Key and Parameter Management
  async setKey(keyConfigs: { key: number; layout: number; value: number }[]): Promise<void> {
    try {
      await this.keyboard.setKey(keyConfigs);
      await this.saveParameters();
      await this.reloadParameters();
    } catch (error) {
      console.error('Failed to set key:', error);
      throw new Error(`Failed to set key: ${(error as Error).message}`);
    }
  }

  async saveParameters(): Promise<void> {
    try {
      await this.keyboard.getApi({ type: 'ORDER_TYPE_SAVING_PARAMETER' });
    } catch (error) {
      console.error('Failed to save parameters:', error);
      throw new Error(`Failed to save parameters: ${(error as Error).message}`);
    }
  }

  async reloadParameters(): Promise<void> {
    try {
      await this.keyboard.getApi({ type: 'ORDER_TYPE_RELOAD_PARAMETERS' });
    } catch (error) {
      console.error('Failed to reload parameters:', error);
      throw new Error(`Failed to reload parameters: ${(error as Error).message}`);
    }
  }

  // Macro Management
  async getMacro(key: number): Promise<IMacroMode> {
    try {
      if (!this.connectedDevice) {
        throw new Error('No device connected');
      }
      const result = await this.keyboard.getMacro(key);
      return result;
    } catch (error) {
      console.error(`Failed to fetch macro for key ${key}:`, error);
      throw new Error(`Failed to fetch macro: ${(error as Error).message}`);
    }
  }

  async setMacro(param: IMacroMode, macros: MacroType[]): Promise<void> {
    try {
      if (!this.connectedDevice) {
        throw new Error('No device connected');
      }
      await this.keyboard.setMacro(param, macros);
      await this.saveParameters();
      await this.reloadParameters();
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to set macro for key ${param.key}:`, error);
      throw new Error(`Failed to set macro: ${(error as Error).message}`);
    }
  }

  // Global Touch Travel
  async getGlobalTouchTravel(): Promise<{ globalTouchTravel: number }> {
    try {
      if (!this.connectedDevice) {
        throw new Error('No device connected');
      }
      const result = await this.keyboard.getGlobalTouchTravel();
      return result;
    } catch (error) {
      console.error('Failed to fetch global touch travel:', error);
      throw new Error(`Failed to fetch global touch travel: ${(error as Error).message}`);
    }
  }

  async setGlobalTouchTravel(param: IDB): Promise<{ globalTouchTravel: number; pressDead: number; releaseDead: number } | Error> {
    try {
      if (!this.connectedDevice) {
        throw new Error('No device connected');
      }
      const result = await this.keyboard.setDB(param);
      return result;
    } catch (error) {
      console.error(`Failed to set global touch travel:`, error);
      return error as Error;
    }
  }

  // Performance Mode
  async getPerformanceMode(key: number): Promise<{ touchMode: string; advancedKeyMode: number } | Error> {
    try {
      if (!this.connectedDevice) {
        throw new Error('No device connected');
      }
      if (!key || typeof key !== 'number') {
        throw new Error('Key parameter is required and must be a number');
      }
      const result = await this.keyboard.getPerformanceMode(key);
      return result;
    } catch (error) {
      console.error(`Failed to fetch performance mode for key ${key}:`, error);
      return error as Error;
    }
  }

  async setPerformanceMode(key: number, mode: string, advancedKeyMode: number): Promise<{ touchMode: string; advancedKeyMode: number } | Error> {
    try {
      if (!this.connectedDevice) {
        throw new Error('No device connected');
      }
      const result = await this.keyboard.setPerformanceMode(key, mode, advancedKeyMode);
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
        throw new Error('No device connected');
      }
      const result = await this.keyboard.getDbTravel(key, dbLayout);
      return result;
    } catch (error) {
      console.error(`Failed to fetch DB travel for key ${key}:`, error);
      return error as Error;
    }
  }

  async setDbTravel(key: number, value: number, dbLayout: string = 'Layout_DB1'): Promise<{ travel: number; dbs?: number[] } | Error> {
    try {
      if (!this.connectedDevice) {
        throw new Error('No device connected');
      }
      const result = await this.keyboard.setDbTravel(key, value, dbLayout);
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
        throw new Error('No device connected');
      }
      const result = await this.keyboard.getRtTravel(key);
      return result;
    } catch (error) {
      console.error(`Failed to fetch RT travel for key ${key}:`, error);
      return error as Error;
    }
  }

  async setRtPressTravel(key: number, value: number): Promise<{ pressTravel: number } | Error> {
    try {
      if (!this.connectedDevice) {
        throw new Error('No device connected');
      }
      const result = await this.keyboard.setRtPressTravel(key, value);
      return result;
    } catch (error) {
      console.error(`Failed to set RT press travel for key ${key}:`, error);
      return error as Error;
    }
  }

  async setRtReleaseTravel(key: number, value: number): Promise<{ releaseTravel: number } | Error> {
    try {
      if (!this.connectedDevice) {
        throw new Error('No device connected');
      }
      const result = await this.keyboard.setRtReleaseTravel(key, value);
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
        throw new Error('No device connected');
      }
      const result = await this.keyboard.getDpDr(key);
      return result;
    } catch (error) {
      console.error(`Failed to fetch DP/DR for key ${key}:`, error);
      return error as Error;
    }
  }

  async setDp(key: number, value: number): Promise<{ pressDead: number } | Error> {
    try {
      if (!this.connectedDevice) {
        throw new Error('No device connected');
      }
      const result = await this.keyboard.setDp(key, value);
      return result;
    } catch (error) {
      console.error(`Failed to set press dead zone for key ${key}:`, error);
      return error as Error;
    }
  }

  async setDr(key: number, value: number): Promise<{ releaseDead: number } | Error> {
    try {
      if (!this.connectedDevice) {
        throw new Error('No device connected');
      }
      const result = await this.keyboard.setDr(key, value);
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
        throw new Error('No device connected');
      }
      const result = await this.keyboard.getAxis(key);
      return result;
    } catch (error) {
      console.error(`Failed to fetch axis for key ${key}:`, error);
      return error as Error;
    }
  }

  async setAxis(key: number, value: number): Promise<{ axis: number } | Error> {
    try {
      if (!this.connectedDevice) {
        throw new Error('No device connected');
      }
      const result = await this.keyboard.setAxis(key, value);
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
        throw new Error('No device connected');
      }
      const result = await this.keyboard.getSingleTravel(key, decimal);
      return result;
    } catch (error) {
      console.error(`Failed to fetch single key travel for key ${key}:`, error);
      return error as Error;
    }
  }

  async setSingleTravel(key: number, value: number, decimal: number = 2): Promise<number | Error> {
    try {
      if (!this.connectedDevice) {
        throw new Error('No device connected');
      }
      const result = await this.keyboard.setSingleTravel(key, value, decimal);
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
        throw new Error('No device connected');
      }
      const result = await this.keyboard.getDksTravel(key, dksLayout);
      return result;
    } catch (error) {
      console.error(`Failed to fetch DKS travel for key ${key}:`, error);
      return error as Error;
    }
  }

  async setDksTravel(key: number, value: number, dksLayout: string = 'Layout_DB1'): Promise<{ travel: number; dbs?: number[] } | Error> {
    try {
      if (!this.connectedDevice) {
        throw new Error('No device connected');
      }
      const result = await this.keyboard.setDksTravel(key, value, dksLayout);
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
        throw new Error('No device connected');
      }
      const result = await this.keyboard.calibrationStart();
      return result;
    } catch (error) {
      console.error('Failed to start calibration:', error);
      return error as Error;
    }
  }

  async calibrationEnd(): Promise<Calibration | Error> {
    try {
      if (!this.connectedDevice) {
        throw new Error('No device connected');
      }
      const result = await this.keyboard.calibrationEnd();
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
        throw new Error('No device connected');
      }
      const result = await this.keyboard.getRm6X21Calibration();
      return result;
    } catch (error) {
      console.error('Failed to fetch RM6X21 calibration data:', error);
      return error as Error;
    }
  }

  async getAxisList(): Promise<{ hasAxisSetting: boolean; axisList: number[] } | Error> {
    try {
      if (!this.connectedDevice) {
        throw new Error('No device connected');
      }
      const result = await this.keyboard.getAxisList();
      return result;
    } catch (error) {
      console.error('Failed to fetch axis list:', error);
      return error as Error;
    }
  }

  async getRm6X21Travel(): Promise<{ status: any; travels: number[]; maxTravel: number } | Error> {
    try {
      if (!this.connectedDevice) {
        throw new Error('No device connected');
      }
      const result = await this.keyboard.getRm6X21Travel();
      if (result instanceof Error) {
        throw result;
      }
      const travels = result.travels || [];
      const flatTravels = travels.flat(); // Flatten nested arrays
      const maxTravel = flatTravels.length > 0 ? Math.max(...flatTravels.filter(t => t > 0)) : 4.0; // Max non-zero, fallback 4.0
      return { status: result.status, travels: flatTravels, maxTravel };
    } catch (error) {
      console.error('Failed to fetch RM6X21 travel data:', error);
      return error as Error;
    }
  }
}

export default new KeyboardService();
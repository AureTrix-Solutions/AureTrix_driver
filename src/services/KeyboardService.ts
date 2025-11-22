// KeyboardService.ts
import XDKeyboard from '@sparklinkplayjoy/sdk-keyboard';
import type { DeviceInit, Device } from '@sparklinkplayjoy/sdk-keyboard';
import { IDefKeyInfo } from '../types/types';
import { useConnectionStore } from '../store/connection';

class KeyboardService {
  private keyboard: XDKeyboard;
  private connectedDevice: Device | null = null;
  private isAutoConnecting: boolean = false;
  private isPollingRateChanging: boolean = false;
  private pollingRateTimeout: ReturnType<typeof setTimeout> | null = null;
  private isFactoryResetting: boolean = false;
  private factoryResetTimeout: ReturnType<typeof setTimeout> | null = null;
  private originalConsoleError: typeof console.error | null = null;

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
    this.cleanupLegacyStorage();
    this.reconnectIfPaired();
  }

  private cleanupLegacyStorage(): void {
    localStorage.removeItem('pairedDeviceId');
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('pairedDeviceData_')) {
        localStorage.removeItem(key);
      }
    });
  }

  private async reconnectIfPaired(): Promise<void> {
    const savedStableId = localStorage.getItem('pairedStableId');
    if (savedStableId) {
      try {
        await this.autoConnect();
      } catch (error) {
        console.error('Failed to reconnect on startup:', error);
      }
    }
  }

  private suppressSDKReconnectError(): void {
    if (this.originalConsoleError) return;
    
    this.originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const message = args.join(' ');
      if ((this.isPollingRateChanging || this.isFactoryResetting) && 
          message.includes('Failed to open the device')) {
        return;
      }
      this.originalConsoleError?.apply(console, args);
    };
  }

  private restoreConsoleError(): void {
    if (!this.isPollingRateChanging && !this.isFactoryResetting && this.originalConsoleError) {
      console.error = this.originalConsoleError;
      this.originalConsoleError = null;
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
      if (!device.opened) {
        await device.open();
      }
      const sdkDevices = await this.getDevices();
      const existingDevice = sdkDevices.find(d => d.data.vendorId === device.vendorId && d.data.productId === device.productId && d.data.serialNumber === device.serialNumber);
      const fallbackId = device.id || `${device.vendorId}-${device.productId}-${device.serialNumber || 'unknown'}`;
      const result = existingDevice || { id: fallbackId, data: device, productName: device.productName || 'Unknown' };
      await this.init(result.id);
      this.connectedDevice = result;
      localStorage.setItem('pairedStableId', fallbackId);
      return result;
    } catch (error) {
      console.error('Failed to request device:', error);
      throw new Error(`Failed to request device: ${(error as Error).message}`);
    }
  }

  async autoConnect(): Promise<Device | null> {
    if (this.isAutoConnecting) {
      return null;
    }
    if (!('hid' in navigator)) {
      console.error('WebHID not supported in this browser');
      return null;
    }
    const savedStableId = localStorage.getItem('pairedStableId');
    if (!savedStableId) return null;

    this.isAutoConnecting = true;
    try {
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
    } finally {
      this.isAutoConnecting = false;
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
    if (this.isPollingRateChanging) {
      if (this.pollingRateTimeout) {
        clearTimeout(this.pollingRateTimeout);
        this.pollingRateTimeout = null;
      }
      this.isPollingRateChanging = false;
    }
    if (this.isFactoryResetting) {
      if (this.factoryResetTimeout) {
        clearTimeout(this.factoryResetTimeout);
        this.factoryResetTimeout = null;
      }
      this.isFactoryResetting = false;
    }
    if (!this.isPollingRateChanging && !this.isFactoryResetting) {
      this.restoreConsoleError();
    }
    this.autoConnect();
  }

  private handleDisconnect = (event: HIDConnectionEvent): void => {
    if (this.isPollingRateChanging || this.isFactoryResetting) {
      return;
    }
    
    this.connectedDevice = null;
    const connectionStore = useConnectionStore();
    connectionStore.disconnect();
    localStorage.removeItem('pairedStableId');
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
      return;
    } catch (error) {
      console.error('Failed to set key:', error);
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

  // RGB Lighting Methods
  async getLighting(): Promise<any | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.getLighting();
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error('Failed to get lighting:', error);
      return error as Error;
    }
  }

  async getLogoLighting(): Promise<any | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.getLogoLighting();
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error('Failed to get logo lighting:', error);
      return error as Error;
    }
  }

  async getSpecialLighting(): Promise<any | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.getSpecialLighting();
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error('Failed to get special lighting:', error);
      return error as Error;
    }
  }

  async setLighting(lightModeConfig: any): Promise<any | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.setLighting(lightModeConfig);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error('Failed to set lighting:', error);
      return error as Error;
    }
  }

  async setLogoLighting(lightModeConfig: any): Promise<any | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.setLogoLighting(lightModeConfig);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error('Failed to set logo lighting:', error);
      return error as Error;
    }
  }

  async setSpecialLighting(lightModeConfig: any): Promise<any | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.setSpecialLighting(lightModeConfig);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error('Failed to set special lighting:', error);
      return error as Error;
    }
  }

  async closedLighting(): Promise<any | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.closedLighting();
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error('Failed to close lighting:', error);
      return error as Error;
    }
  }

  async getCustomLighting(key?: number): Promise<any | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.getCustomLighting(key);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error('Failed to get custom lighting:', error);
      return error as Error;
    }
  }

  async setCustomLighting(param: { key: number; r: number; g: number; b: number }): Promise<any | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.setCustomLighting(param);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error('Failed to set custom lighting:', error);
      return error as Error;
    }
  }

  async saveCustomLighting(): Promise<any | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.saveCustomLighting();
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error('Failed to save custom lighting:', error);
      return error as Error;
    }
  }

  async switchConfig(profileId: number): Promise<any | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      if (profileId < 1 || profileId > 4) {
        return new Error('Profile ID must be between 1 and 4');
      }
      const configIndex = profileId - 1;
      const result = await this.keyboard.switchConfig(configIndex);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error('Failed to switch config:', error);
      return error as Error;
    }
  }

  async getApi(param: any): Promise<any | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.getApi(param);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error('Failed to execute getApi:', error);
      return error as Error;
    }
  }

  async getActiveProfile(): Promise<number | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.getApi({ type: 'ORDER_TYPE_CONFIG' });
      if (result instanceof Error) return result;
      // SDK returns configID as 0-3, we use 1-4 for profile IDs
      const profileId = (result.configID ?? 0) + 1;
      return profileId;
    } catch (error) {
      console.error('Failed to get active profile:', error);
      return error as Error;
    }
  }

  async getDks(key: number, type?: string): Promise<any | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.getDks(key, type);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error(`Failed to get DKS for key ${key}:`, error);
      return error as Error;
    }
  }

  async getMpt(key: number): Promise<any | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.getMpt(key);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error(`Failed to get MPT for key ${key}:`, error);
      return error as Error;
    }
  }

  async getSocd(key: number, version?: string): Promise<any | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.getSocd(key, version);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error(`Failed to get SOCD for key ${key}:`, error);
      return error as Error;
    }
  }

  async getMT(key: number): Promise<any | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.getMT(key);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error(`Failed to get MT for key ${key}:`, error);
      return error as Error;
    }
  }

  async getTGL(key: number): Promise<any | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.getTGL(key);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error(`Failed to get TGL for key ${key}:`, error);
      return error as Error;
    }
  }

  async getEND(key: number): Promise<any | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.getEND(key);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error(`Failed to get END for key ${key}:`, error);
      return error as Error;
    }
  }

  async getPollingRate(): Promise<number | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.getApi({ type: 'ORDER_TYPE_ROES' });
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error('Failed to get polling rate:', error);
      return error as Error;
    }
  }

  async setPollingRate(value: number): Promise<any | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      if (value < 0 || value > 6) {
        return new Error('Polling rate value must be between 0 and 6');
      }
      
      if (this.pollingRateTimeout) {
        clearTimeout(this.pollingRateTimeout);
        this.pollingRateTimeout = null;
      }
      
      this.suppressSDKReconnectError();
      this.isPollingRateChanging = true;
      const result = await this.keyboard.setRateOfReturn(value);
      if (result instanceof Error) {
        this.isPollingRateChanging = false;
        this.restoreConsoleError();
        return result;
      }
      
      this.pollingRateTimeout = setTimeout(async () => {
        if (this.isPollingRateChanging) {
          console.warn('Polling rate change timeout - attempting SDK session recovery');
          this.isPollingRateChanging = false;
          this.pollingRateTimeout = null;
          this.restoreConsoleError();
          
          try {
            const savedStableId = localStorage.getItem('pairedStableId');
            if (!savedStableId) {
              console.error('No saved device ID after timeout - cleaning up');
              this.connectedDevice = null;
              const connectionStore = useConnectionStore();
              connectionStore.disconnect();
              return;
            }
            
            const hidDevices = await navigator.hid.getDevices();
            const deviceStillPresent = hidDevices.some(d => {
              const fallbackId = d.id || `${d.vendorId}-${d.productId}-${d.serialNumber || 'unknown'}`;
              return fallbackId === savedStableId;
            });
            
            if (!deviceStillPresent) {
              console.error('Device no longer enumerated after timeout - cleaning up');
              this.connectedDevice = null;
              const connectionStore = useConnectionStore();
              connectionStore.disconnect();
              localStorage.removeItem('pairedStableId');
              return;
            }
            
            this.connectedDevice = null;
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            if (!this.connectedDevice) {
              console.error('SDK reconnection failed after 5s - cleaning up connection state');
              const connectionStore = useConnectionStore();
              connectionStore.disconnect();
              localStorage.removeItem('pairedStableId');
            }
          } catch (error) {
            console.error('Error during timeout recovery:', error);
            this.connectedDevice = null;
            const connectionStore = useConnectionStore();
            connectionStore.disconnect();
            localStorage.removeItem('pairedStableId');
          }
        }
      }, 5000);
      
      return result;
    } catch (error) {
      console.error('Failed to set polling rate:', error);
      this.isPollingRateChanging = false;
      this.restoreConsoleError();
      if (this.pollingRateTimeout) {
        clearTimeout(this.pollingRateTimeout);
        this.pollingRateTimeout = null;
      }
      return error as Error;
    }
  }

  async querySystemMode(): Promise<'win' | 'mac' | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.getApi({ type: 'ORDER_TYPE_QUERY_WIN_MODEL' });
      if (result instanceof Error) return result;
      if (!result || typeof result.currentSystem !== 'string') {
        return new Error('Invalid system mode response from device');
      }
      const mode = result.currentSystem;
      if (mode !== 'win' && mode !== 'mac') {
        return new Error(`Unexpected system mode value: ${mode}`);
      }
      return mode;
    } catch (error) {
      console.error('Failed to query system mode:', error);
      return error as Error;
    }
  }

  async setSystemMode(mode: 'win' | 'mac'): Promise<any | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.switchSystemMode(mode);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error('Failed to set system mode:', error);
      return error as Error;
    }
  }

  async factoryReset(): Promise<boolean | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      
      if (this.factoryResetTimeout) {
        clearTimeout(this.factoryResetTimeout);
        this.factoryResetTimeout = null;
      }
      
      this.suppressSDKReconnectError();
      this.isFactoryResetting = true;
      const result = await this.keyboard.factoryDataReset();
      if (result instanceof Error) {
        this.isFactoryResetting = false;
        this.restoreConsoleError();
        return result;
      }
      
      this.factoryResetTimeout = setTimeout(async () => {
        if (this.isFactoryResetting) {
          console.warn('Factory reset timeout - attempting SDK session recovery');
          this.isFactoryResetting = false;
          this.factoryResetTimeout = null;
          this.restoreConsoleError();
          
          try {
            const savedStableId = localStorage.getItem('pairedStableId');
            if (!savedStableId) {
              console.error('No saved device ID after timeout - cleaning up');
              this.connectedDevice = null;
              const connectionStore = useConnectionStore();
              connectionStore.disconnect();
              return;
            }
            
            const hidDevices = await navigator.hid.getDevices();
            const deviceStillPresent = hidDevices.some(d => {
              const fallbackId = d.id || `${d.vendorId}-${d.productId}-${d.serialNumber || 'unknown'}`;
              return fallbackId === savedStableId;
            });
            
            if (!deviceStillPresent) {
              console.error('Device no longer enumerated after timeout - cleaning up');
              this.connectedDevice = null;
              const connectionStore = useConnectionStore();
              connectionStore.disconnect();
              localStorage.removeItem('pairedStableId');
              return;
            }
            
            this.connectedDevice = null;
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            if (!this.connectedDevice) {
              console.error('SDK reconnection failed after 5s - cleaning up connection state');
              const connectionStore = useConnectionStore();
              connectionStore.disconnect();
              localStorage.removeItem('pairedStableId');
            }
          } catch (error) {
            console.error('Error during timeout recovery:', error);
            this.connectedDevice = null;
            const connectionStore = useConnectionStore();
            connectionStore.disconnect();
            localStorage.removeItem('pairedStableId');
          }
        }
      }, 5000);
      
      return result === true;
    } catch (error) {
      console.error('Failed to factory reset:', error);
      this.isFactoryResetting = false;
      this.restoreConsoleError();
      if (this.factoryResetTimeout) {
        clearTimeout(this.factoryResetTimeout);
        this.factoryResetTimeout = null;
      }
      return error as Error;
    }
  }

  exportConfig(data: any, filename: string): void {
    if (!this.connectedDevice) {
      throw new Error('No device connected');
    }
    this.keyboard.exportConfig(data, filename);
  }

  async importConfig(file: File): Promise<any | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.keyboard.importConfig(file);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error('Failed to import config:', error);
      return error as Error;
    }
  }
}

export default new KeyboardService();
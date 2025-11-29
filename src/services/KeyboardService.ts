import XDKeyboard from '@sparklinkplayjoy/sdk-keyboard';
import type { DeviceInit, Device } from '@sparklinkplayjoy/sdk-keyboard';
import { IDefKeyInfo } from '../types/types';
import { useConnectionStore } from '../store/connection';

interface HIDConnectionEvent extends Event {
  device: HIDDevice;
}

class KeyboardService {
  private keyboard: XDKeyboard | null = null;
  private hidListenersRegistered: boolean = false;
  private connectedDevice: Device | null = null;
  private isAutoConnecting: boolean = false;
  private autoConnectPromise: Promise<Device | null> | null = null;
  private isPollingRateChanging: boolean = false;
  private pollingRateOperationToken: number | null = null;
  private pollingRateTimeout: ReturnType<typeof setTimeout> | null = null;
  private isFactoryResetting: boolean = false;
  private factoryResetOperationToken: number | null = null;
  private factoryResetTimeout: ReturnType<typeof setTimeout> | null = null;
  private isReconnecting: boolean = false;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private originalConsoleError: typeof console.error | null = null;
  private errorSuppressionCleanupTimeout: ReturnType<typeof setTimeout> | null = null;
  private initializationPromise: Promise<void> | null = null;
  private isPostReconnectionSuppression: boolean = false;

  constructor() {
    if ('hid' in navigator) {
      navigator.hid.addEventListener('connect', this.handleConnect);
      navigator.hid.addEventListener('disconnect', this.handleDisconnect);
      this.hidListenersRegistered = true;
    }
    this.cleanupLegacyStorage();
    this.deferredReconnect();
  }

  private ensureKeyboard(): XDKeyboard {
    if (!this.keyboard) {
      this.keyboard = new XDKeyboard({
        usage: 1,
        usagePage: 65440,
      });
    }
    return this.keyboard;
  }

  private deferredReconnect(): void {
    if (document.readyState === 'complete') {
      setTimeout(() => this.reconnectIfPaired(), 100);
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => this.reconnectIfPaired(), 100);
      }, { once: true });
    }
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
      const message = args.map(arg => {
        if (arg instanceof Error) {
          return `${arg.name}: ${arg.message}`;
        }
        return String(arg);
      }).join(' ');
      
      if (this.isPollingRateChanging || this.isFactoryResetting || this.isReconnecting || this.isPostReconnectionSuppression) {
        if (message.includes('Reconnection failed') || 
            message.includes('NotAllowedError') || 
            message.includes('Failed to open the device')) {
          return;
        }
      }
      
      this.originalConsoleError?.apply(console, args);
    };
  }

  private restoreConsoleError(): void {
    if (!this.isPollingRateChanging && !this.isFactoryResetting && !this.isReconnecting && !this.isPostReconnectionSuppression && this.originalConsoleError) {
      console.error = this.originalConsoleError;
      this.originalConsoleError = null;
    }
  }

  async getDevices(): Promise<Device[]> {
    try {
      const devices = await this.ensureKeyboard().getDevices();
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
      await this.initializeKeyboard();
      return result;
    } catch (error) {
      console.error('Failed to request device:', error);
      throw new Error(`Failed to request device: ${(error as Error).message}`);
    }
  }

  async autoConnect(): Promise<Device | null> {
    if (this.connectedDevice) {
      return this.connectedDevice;
    }
    if (this.autoConnectPromise) {
      return this.autoConnectPromise;
    }
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
    this.autoConnectPromise = this._autoConnectInternal(savedStableId);
    try {
      return await this.autoConnectPromise;
    } finally {
      this.autoConnectPromise = null;
      this.isAutoConnecting = false;
    }
  }

  private async _autoConnectInternal(savedStableId: string): Promise<Device | null> {
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
            await this.initializeKeyboard();
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
      const result = await this.ensureKeyboard().init(deviceId);
      return result;
    } catch (error) {
      console.error('Failed to initialize device:', error);
      throw new Error(`Failed to initialize device: ${(error as Error).message}`);
    }
  }

  private async waitForSDKReady(): Promise<boolean> {
    const maxAttempts = 10;
    const baseDelay = 200;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const result = await this.ensureKeyboard().getApi({ type: 'ORDER_TYPE_ROES' });
        
        if (!(result instanceof Error) && typeof result === 'number') {
          return true;
        }
      } catch (error) {
      }
      
      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, baseDelay + (attempt * 100)));
      }
    }
    
    console.error('SDK readiness timeout: ORDER_TYPE_ROES not responding');
    return false;
  }

  async initializeKeyboard(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    
    this.initializationPromise = this._initializeKeyboardInternal()
      .finally(() => {
        this.initializationPromise = null;
      });
    
    return this.initializationPromise;
  }

  private async _initializeKeyboardInternal(retryCount: number = 0): Promise<void> {
    const connectionStore = useConnectionStore();
    const maxRetries = 2;
    
    if (retryCount === 0) {
      connectionStore.setInitializing();
    }
    
    try {
      if (!this.connectedDevice) {
        throw new Error('No device connected');
      }
      
      const isReady = await this.waitForSDKReady();
      
      if (!isReady) {
        throw new Error('SDK failed to become ready - ORDER_TYPE_ROES not responding');
      }
      
      await this.syncHardwareSettings();
      
      connectionStore.setInitialized();
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(`Keyboard initialization failed (attempt ${retryCount + 1}/${maxRetries + 1}):`, errorMessage);
      
      if (retryCount < maxRetries && this.connectedDevice) {
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000));
        
        if (this.connectedDevice) {
          return this._initializeKeyboardInternal(retryCount + 1);
        }
      }
      
      connectionStore.setInitializationError(errorMessage);
      throw error;
    }
  }

  private async syncHardwareSettings(): Promise<void> {
    try {
      const pollingRate = await this.getPollingRate();
    } catch (error) {
      console.error('Failed to sync polling rate:', error);
    }
    
    try {
      const systemMode = await this.querySystemMode();
    } catch (error) {
      console.error('Failed to sync system mode:', error);
    }
  }

  private handleConnect = async (event: HIDConnectionEvent): Promise<void> => {
    // Skip if already connected or connecting - prevents duplicate baseInfo fetches
    if (this.connectedDevice || this.isAutoConnecting || this.autoConnectPromise) {
      return;
    }
    
    const pollingRateToken = this.pollingRateOperationToken;
    const factoryResetToken = this.factoryResetOperationToken;
    
    if (this.pollingRateTimeout) {
      clearTimeout(this.pollingRateTimeout);
      this.pollingRateTimeout = null;
    }
    if (this.factoryResetTimeout) {
      clearTimeout(this.factoryResetTimeout);
      this.factoryResetTimeout = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // Start suppression window before reconnection
    this.isPostReconnectionSuppression = true;
    const connectionStore = useConnectionStore();
    connectionStore.setPostReconnectionSuppression(true);
    
    if (this.errorSuppressionCleanupTimeout) {
      clearTimeout(this.errorSuppressionCleanupTimeout);
    }
    this.errorSuppressionCleanupTimeout = setTimeout(() => {
      this.isPostReconnectionSuppression = false;
      const connectionStore = useConnectionStore();
      connectionStore.setPostReconnectionSuppression(false);
      
      // Only clear flags if tokens match (no new operations started)
      if (this.pollingRateOperationToken === pollingRateToken) {
        this.isPollingRateChanging = false;
        this.pollingRateOperationToken = null;
      }
      if (this.factoryResetOperationToken === factoryResetToken) {
        this.isFactoryResetting = false;
        this.factoryResetOperationToken = null;
      }
      
      if (!this.isPollingRateChanging && !this.isFactoryResetting && !this.isReconnecting && !this.isPostReconnectionSuppression) {
        this.restoreConsoleError();
      }
      this.errorSuppressionCleanupTimeout = null;
    }, 2000);
    
    try {
      await this.autoConnect();
    } finally {
      this.isReconnecting = false;
    }
  }

  private handleDisconnect = (event: HIDConnectionEvent): void => {
    if (this.errorSuppressionCleanupTimeout) {
      clearTimeout(this.errorSuppressionCleanupTimeout);
      this.errorSuppressionCleanupTimeout = null;
    }
    
    this.initializationPromise = null;
    
    // Only handle reconnection if not in a managed operation (polling rate/factory reset)
    if (!this.isPollingRateChanging && !this.isFactoryResetting) {
      this.isReconnecting = true;
      this.suppressSDKReconnectError();
      
      this.reconnectTimeout = setTimeout(() => {
        if (this.isReconnecting) {
          this.isReconnecting = false;
          this.reconnectTimeout = null;
          this.restoreConsoleError();
        }
      }, 10000);
    }
    
    this.connectedDevice = null;
    const connectionStore = useConnectionStore();
    connectionStore.clearInitialization();
    connectionStore.disconnect();
  }

  async getBaseInfo(): Promise<any | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      let attempts = 0;
      const maxAttempts = 3;
      while (attempts < maxAttempts) {
        try {
          const baseInfo = await this.ensureKeyboard().getBaseInfo();
          if (baseInfo instanceof Error) throw baseInfo;
          return baseInfo;
        } catch (error) {
          console.warn(`getBaseInfo attempt ${attempts + 1} failed:`, error);
          if (attempts === maxAttempts - 1) {
            console.error('Failed to fetch base info after retries:', error);
            return error as Error;
          }
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 5000));
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
          const layout = await this.ensureKeyboard().defKey();
          if (layout instanceof Error) return layout;
          return layout;
        } catch (error) {
          console.warn(`defKey attempt ${attempt + 1} failed:`, error);
          if (attempt === maxRetries - 1) {
            console.error('Failed to fetch keyboard layout after retries:', error);
            return error as Error;
          }
          attempt++;
          await new Promise(resolve => setTimeout(resolve, 5000));
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
          const layoutInfo = await this.ensureKeyboard().getLayoutKeyInfo(params);
          if (layoutInfo instanceof Error) return layoutInfo;
          return layoutInfo;
        } catch (error) {
          console.warn(`getLayoutKeyInfo attempt ${attempt + 1} failed:`, error);
          if (attempt === maxRetries - 1) {
            console.error('Failed to fetch layer layout after retries:', error);
            return error as Error;
          }
          attempt++;
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
      return new Error('Failed to fetch layer layout: max retries exceeded');
    } catch (error) {
      console.error('Failed to fetch layer layout:', error);
      return error as Error;
    }
  }

  async setKey(keyConfigs: { key: number; layout: number; value: number }[]): Promise<void | Error> {
    try {
      await this.ensureKeyboard().setKey(keyConfigs);
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
      const result = await this.ensureKeyboard().getMacro(key);
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
      await this.ensureKeyboard().setMacro(param, macros);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return;
    } catch (error) {
      console.error(`Failed to set macro for key ${param.key}:`, error);
      return error as Error;
    }
  }

  async getGlobalTouchTravel(): Promise<{ globalTouchTravel: number } | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.ensureKeyboard().getGlobalTouchTravel();
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
      const result = await this.ensureKeyboard().setDB(param);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error('Failed to set global touch travel:', error);
      return error as Error;
    }
  }

  async getPerformanceMode(key: number): Promise<{ touchMode: string; advancedKeyMode: number } | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.ensureKeyboard().getPerformanceMode(key);
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
      const result = await this.ensureKeyboard().setPerformanceMode(key, mode, advancedKeyMode);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error(`Failed to set performance mode for key ${key}:`, error);
      return error as Error;
    }
  }

  async getDbTravel(key: number, dbLayout: string = 'Layout_DB1'): Promise<{ travel: number; dbs?: number[] } | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.ensureKeyboard().getDbTravel(key, dbLayout);
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
      const result = await this.ensureKeyboard().setDbTravel(key, value, dbLayout);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error(`Failed to set DB travel for key ${key}:`, error);
      return error as Error;
    }
  }

  async getRtTravel(key: number): Promise<{ pressTravel: number; releaseTravel: number } | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.ensureKeyboard().getRtTravel(key);
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
      const result = await this.ensureKeyboard().setRtPressTravel(key, value);
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
      const result = await this.ensureKeyboard().setRtReleaseTravel(key, value);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error(`Failed to set RT release travel for key ${key}:`, error);
      return error as Error;
    }
  }

  async getDpDr(key: number): Promise<{ dpThreshold: number; drThreshold: number } | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.ensureKeyboard().getDpDr(key);
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
      const result = await this.ensureKeyboard().setDp(key, value);
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
      const result = await this.ensureKeyboard().setDr(key, value);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error(`Failed to set release dead zone for key ${key}:`, error);
      return error as Error;
    }
  }

  async getAxis(key: number): Promise<{ axis: number } | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.ensureKeyboard().getAxis(key);
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
      const result = await this.ensureKeyboard().setAxis(key, value);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error(`Failed to set axis for key ${key}:`, error);
      return error as Error;
    }
  }

  async getSingleTravel(key: number, decimal: number = 2): Promise<number | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.ensureKeyboard().getSingleTravel(key, decimal);
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
      const result = await this.ensureKeyboard().setSingleTravel(key, value, decimal);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error(`Failed to set single travel for key ${key}:`, error);
      return error as Error;
    }
  }

  async getDksTravel(key: number, dksLayout: string = 'Layout_DB1'): Promise<{ travel: number; dbs?: number[] } | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.ensureKeyboard().getDksTravel(key, dksLayout);
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
      const result = await this.ensureKeyboard().setDksTravel(key, value, dksLayout);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error(`Failed to set DKS travel for key ${key}:`, error);
      return error as Error;
    }
  }

  async calibrationStart(): Promise<Calibration | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.ensureKeyboard().calibrationStart();
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
      const result = await this.ensureKeyboard().calibrationEnd();
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error('Failed to end calibration:', error);
      return error as Error;
    }
  }

  async getRm6X21Calibration(): Promise<{ calibrations: number[]; travels: number[] } | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.ensureKeyboard().getRm6X21Calibration();
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
      const result = await this.ensureKeyboard().getAxisList();
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
      const result = await this.ensureKeyboard().getRm6X21Travel();
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

  async getLighting(): Promise<any | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.ensureKeyboard().getLighting();
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
      const result = await this.ensureKeyboard().getLogoLighting();
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
      const result = await this.ensureKeyboard().getSpecialLighting();
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
      const result = await this.ensureKeyboard().setLighting(lightModeConfig);
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
      const result = await this.ensureKeyboard().setLogoLighting(lightModeConfig);
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
      const result = await this.ensureKeyboard().setSpecialLighting(lightModeConfig);
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
      const result = await this.ensureKeyboard().closedLighting();
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
      const result = await this.ensureKeyboard().getCustomLighting(key);
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
      const result = await this.ensureKeyboard().setCustomLighting(param);
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
      const result = await this.ensureKeyboard().saveCustomLighting();
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
      const result = await this.ensureKeyboard().switchConfig(configIndex);
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
      const result = await this.ensureKeyboard().getApi(param);
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
      const result = await this.ensureKeyboard().getApi({ type: 'ORDER_TYPE_CONFIG' });
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
      const result = await this.ensureKeyboard().getDks(key, type);
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
      const result = await this.ensureKeyboard().getMpt(key);
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
      const result = await this.ensureKeyboard().getSocd(key, version);
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
      const result = await this.ensureKeyboard().getMT(key);
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
      const result = await this.ensureKeyboard().getTGL(key);
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
      const result = await this.ensureKeyboard().getEND(key);
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
      let attempts = 0;
      const maxAttempts = 5;
      while (attempts < maxAttempts) {
        try {
          const result = await this.ensureKeyboard().getApi({ type: 'ORDER_TYPE_ROES' });
          if (result instanceof Error) throw result;
          if (typeof result === 'number') {
            return result;
          }
          throw new Error('Invalid polling rate response');
        } catch (error) {
          if (attempts === maxAttempts - 1) {
            console.error('Failed to get polling rate after retries:', error);
            return error as Error;
          }
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      return new Error('Failed to get polling rate: max retries exceeded');
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
      
      this.pollingRateOperationToken = Date.now();
      this.suppressSDKReconnectError();
      this.isPollingRateChanging = true;
      const result = await this.ensureKeyboard().setRateOfReturn(value);
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
      let attempts = 0;
      const maxAttempts = 5;
      while (attempts < maxAttempts) {
        try {
          const result = await this.ensureKeyboard().getApi({ type: 'ORDER_TYPE_QUERY_WIN_MODEL' });
          if (result instanceof Error) throw result;
          if (!result || typeof result.currentSystem !== 'string') {
            throw new Error('Invalid system mode response from device');
          }
          const mode = result.currentSystem;
          if (mode !== 'win' && mode !== 'mac') {
            throw new Error(`Unexpected system mode value: ${mode}`);
          }
          return mode;
        } catch (error) {
          if (attempts === maxAttempts - 1) {
            console.error('Failed to query system mode after retries:', error);
            return error as Error;
          }
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      return new Error('Failed to query system mode: max retries exceeded');
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
      const result = await this.ensureKeyboard().switchSystemMode(mode);
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
      
      this.factoryResetOperationToken = Date.now();
      this.suppressSDKReconnectError();
      this.isFactoryResetting = true;
      const result = await this.ensureKeyboard().factoryDataReset();
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
    this.ensureKeyboard().exportConfig(data, filename);
  }

  async importConfig(file: File): Promise<any | Error> {
    try {
      if (!this.connectedDevice) {
        return new Error('No device connected');
      }
      const result = await this.ensureKeyboard().importConfig(file);
      if (result instanceof Error) return result;
      return result;
    } catch (error) {
      console.error('Failed to import config:', error);
      return error as Error;
    }
  }
}

export default new KeyboardService();
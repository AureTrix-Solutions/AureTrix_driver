import { describe, it, expect, beforeEach, afterEach, vi, type MockInstance } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import type { Device } from '@sparklinkplayjoy/hid';

vi.mock('@services/KeyboardService', () => ({
  default: {
    autoConnect: vi.fn(),
    requestDevice: vi.fn(),
    getBaseInfo: vi.fn(),
    getActiveProfile: vi.fn(),
  },
}));

import KeyboardService, { type KeyboardBaseInfo } from '@services/KeyboardService';
import { useConnectionStore } from '../connection';

const autoConnectMock = vi.mocked(KeyboardService.autoConnect);
const requestDeviceMock = vi.mocked(KeyboardService.requestDevice);
const getBaseInfoMock = vi.mocked(KeyboardService.getBaseInfo);
const getActiveProfileMock = vi.mocked(KeyboardService.getActiveProfile);

const BASE_INFO: KeyboardBaseInfo = {
  BoardID: 1,
  KeyboardLayout: 2,
  KeyType: 3,
  CustomerID: 0,
  ProductionId: 0,
  KeyboardRunMode: 4,
  KeyboardSN: 'SN-1',
  firewareSpaceSize: 5,
  appVersion: '1.0.0',
  appBuildDate: '2026-01-01',
  versionString: 'v1',
};

function makeDevice(overrides: Partial<Device> = {}): Device {
  return {
    id: 'dev1',
    productName: 'TestKB',
    vendorId: 1,
    usage: 2,
    usagePage: 3,
    collections: [],
    ...overrides,
  };
}

describe('connectionStore (async actions)', () => {
  let consoleErrorSpy: MockInstance;
  let consoleLogSpy: MockInstance;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.resetAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('autoConnect', () => {
    it('success: merges baseInfo into deviceInfo, sets isConnected and the success status', async () => {
      const store = useConnectionStore();
      autoConnectMock.mockResolvedValue(makeDevice());
      getBaseInfoMock.mockResolvedValue(BASE_INFO);

      await store.autoConnect();

      expect(store.isConnected).toBe(true);
      expect(store.deviceInfo).toEqual({
        productName: 'TestKB',
        id: 'dev1',
        ...BASE_INFO,
      });
      expect(store.status).toBe('Auto-connected to TestKB with ID dev1');
    });

    it('getBaseInfo resolving an Error: keeps minimal deviceInfo and the "failed to load details" status, stays connected', async () => {
      const store = useConnectionStore();
      autoConnectMock.mockResolvedValue(makeDevice());
      getBaseInfoMock.mockResolvedValue(new Error('read fail'));

      await store.autoConnect();

      expect(store.isConnected).toBe(true);
      expect(store.deviceInfo).toEqual({ productName: 'TestKB', id: 'dev1' });
      expect(store.status).toBe('Auto-connected to TestKB, but failed to load details.');
    });

    it('getBaseInfo rejecting: same "failed to load details" status and logs via console.error', async () => {
      const store = useConnectionStore();
      autoConnectMock.mockResolvedValue(makeDevice());
      getBaseInfoMock.mockRejectedValue(new Error('boom'));

      await store.autoConnect();

      expect(store.isConnected).toBe(true);
      expect(store.deviceInfo).toEqual({ productName: 'TestKB', id: 'dev1' });
      expect(store.status).toBe('Auto-connected to TestKB, but failed to load details.');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('no paired device (null): status "Please connect", isConnected false', async () => {
      const store = useConnectionStore();
      autoConnectMock.mockResolvedValue(null);

      await store.autoConnect();

      expect(store.isConnected).toBe(false);
      expect(store.deviceInfo).toBeNull();
      expect(store.status).toBe('Please connect');
    });

    it('autoConnect rejecting: pins the DISTINCT "Please Connect." string (capital C + period), isConnected false', async () => {
      const store = useConnectionStore();
      autoConnectMock.mockRejectedValue(new Error('hid boom'));

      await store.autoConnect();

      expect(store.isConnected).toBe(false);
      expect(store.status).toBe('Please Connect.');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('connectDevice', () => {
    it('sets status "Requesting device via WebHID..." + isConnecting synchronously, then falsy device ends at "No compatible device found."', async () => {
      const store = useConnectionStore();
      // requestDevice resolves undefined (falsy) — AS-IS: the else branch fires
      requestDeviceMock.mockResolvedValue(undefined as unknown as Device);

      const pending = store.connectDevice();
      // both are set synchronously before the first await
      expect(store.status).toBe('Requesting device via WebHID...');
      expect(store.isConnecting).toBe(true);
      await pending;

      expect(store.status).toBe('No compatible device found.');
      expect(store.isConnected).toBe(false);
      expect(store.isConnecting).toBe(false);
    });

    it('success: isConnected true, "Connected to TestKB with ID dev1", getActiveProfile called, isConnecting false', async () => {
      const store = useConnectionStore();
      requestDeviceMock.mockResolvedValue(makeDevice());
      getBaseInfoMock.mockResolvedValue(BASE_INFO);
      getActiveProfileMock.mockResolvedValue(2);

      await store.connectDevice();

      expect(store.isConnected).toBe(true);
      expect(store.isConnecting).toBe(false);
      expect(store.deviceInfo).toEqual({
        productName: 'TestKB',
        id: 'dev1',
        ...BASE_INFO,
      });
      expect(store.status).toBe('Connected to TestKB with ID dev1');
      // profileStore.syncActiveProfileFromHardware fires through the mocked service
      expect(getActiveProfileMock).toHaveBeenCalled();
    });

    it('getBaseInfo resolving an Error: "Connected to TestKB, but failed to load details.", still connected, isConnecting false', async () => {
      const store = useConnectionStore();
      requestDeviceMock.mockResolvedValue(makeDevice());
      getBaseInfoMock.mockResolvedValue(new Error('read fail'));
      getActiveProfileMock.mockResolvedValue(1);

      await store.connectDevice();

      expect(store.isConnected).toBe(true);
      expect(store.isConnecting).toBe(false);
      expect(store.deviceInfo).toEqual({ productName: 'TestKB', id: 'dev1' });
      expect(store.status).toBe('Connected to TestKB, but failed to load details.');
    });

    it('requestDevice rejecting: status is `Error: <message>`, isConnected false, isConnecting false', async () => {
      const store = useConnectionStore();
      requestDeviceMock.mockRejectedValue(new Error('user cancelled'));

      await store.connectDevice();

      expect(store.status).toBe('Error: user cancelled');
      expect(store.isConnected).toBe(false);
      expect(store.isConnecting).toBe(false);
    });
  });

  describe('onAutoConnectSuccess', () => {
    it('success: same strings as autoConnect success and getActiveProfile called (profile sync)', async () => {
      const store = useConnectionStore();
      getBaseInfoMock.mockResolvedValue(BASE_INFO);
      getActiveProfileMock.mockResolvedValue(3);

      await store.onAutoConnectSuccess({ productName: 'TestKB', id: 'dev1' });

      expect(store.isConnected).toBe(true);
      expect(store.deviceInfo).toEqual({
        productName: 'TestKB',
        id: 'dev1',
        ...BASE_INFO,
      });
      expect(store.status).toBe('Auto-connected to TestKB with ID dev1');
      expect(getActiveProfileMock).toHaveBeenCalled();
    });

    it('getBaseInfo resolving an Error: "Auto-connected to TestKB, but failed to load details.", still connected', async () => {
      const store = useConnectionStore();
      getBaseInfoMock.mockResolvedValue(new Error('read fail'));
      getActiveProfileMock.mockResolvedValue(1);

      await store.onAutoConnectSuccess({ productName: 'TestKB', id: 'dev1' });

      expect(store.isConnected).toBe(true);
      expect(store.deviceInfo).toEqual({ productName: 'TestKB', id: 'dev1' });
      expect(store.status).toBe('Auto-connected to TestKB, but failed to load details.');
    });
  });
});

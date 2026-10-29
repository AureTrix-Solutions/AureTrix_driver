import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

vi.mock('@services/KeyboardService', () => ({
  default: { getBaseInfo: vi.fn() },
}));

import { useConnectionStore } from '../connection';

describe('connectionStore (sync actions)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('starts with all flags false, empty status, null deviceInfo and null initializationError', () => {
    const store = useConnectionStore();
    expect(store.isConnected).toBe(false);
    expect(store.isConnecting).toBe(false);
    expect(store.isInitializing).toBe(false);
    expect(store.isInitialized).toBe(false);
    expect(store.isPostReconnectionSuppression).toBe(false);
    expect(store.status).toBe('');
    expect(store.deviceInfo).toBeNull();
    expect(store.initializationError).toBeNull();
  });

  it('disconnect resets connection/initialization state, deviceInfo and error, and sets the disconnect status', () => {
    const store = useConnectionStore();
    store.isConnected = true;
    store.isInitializing = true;
    store.isInitialized = true;
    store.initializationError = 'stale error';
    store.deviceInfo = { productName: 'TestKB', id: 'dev1' };

    store.disconnect();

    expect(store.isConnected).toBe(false);
    expect(store.isInitializing).toBe(false);
    expect(store.isInitialized).toBe(false);
    expect(store.initializationError).toBeNull();
    expect(store.deviceInfo).toBeNull();
    expect(store.status).toBe('Device disconnected. Please reconnect manually.');
  });

  it('disconnect does NOT touch isConnecting or isPostReconnectionSuppression (AS-IS pin)', () => {
    const store = useConnectionStore();
    store.isConnecting = true;
    store.isPostReconnectionSuppression = true;

    store.disconnect();

    expect(store.isConnecting).toBe(true);
    expect(store.isPostReconnectionSuppression).toBe(true);
  });

  it('setInitializing sets isInitializing, clears isInitialized/error, and sets the initializing status', () => {
    const store = useConnectionStore();
    store.isInitialized = true;
    store.initializationError = 'previous error';

    store.setInitializing();

    expect(store.isInitializing).toBe(true);
    expect(store.isInitialized).toBe(false);
    expect(store.initializationError).toBeNull();
    expect(store.status).toBe('Initializing keyboard...');
  });

  it('setInitialized with deviceInfo uses the product name in the status', () => {
    const store = useConnectionStore();
    store.isInitializing = true;
    store.initializationError = 'previous error';
    store.deviceInfo = { productName: 'TestKB', id: 'dev1' };

    store.setInitialized();

    expect(store.isInitializing).toBe(false);
    expect(store.isInitialized).toBe(true);
    expect(store.initializationError).toBeNull();
    expect(store.status).toBe('Connected to TestKB');
  });

  it('setInitialized with null deviceInfo falls back to "Connected to keyboard"', () => {
    const store = useConnectionStore();
    store.isInitializing = true;

    store.setInitialized();

    expect(store.isInitializing).toBe(false);
    expect(store.isInitialized).toBe(true);
    expect(store.status).toBe('Connected to keyboard');
  });

  it('setInitializationError clears both flags, stores the error, and sets the failure status', () => {
    const store = useConnectionStore();
    store.isInitializing = true;
    store.isInitialized = true;

    store.setInitializationError('boom');

    expect(store.isInitializing).toBe(false);
    expect(store.isInitialized).toBe(false);
    expect(store.initializationError).toBe('boom');
    expect(store.status).toBe('Initialization failed: boom');
  });

  it('clearInitialization resets flags and error but leaves status untouched (AS-IS pin)', () => {
    const store = useConnectionStore();
    store.isInitializing = true;
    store.isInitialized = true;
    store.initializationError = 'boom';
    store.status = 'Some prior status';

    store.clearInitialization();

    expect(store.isInitializing).toBe(false);
    expect(store.isInitialized).toBe(false);
    expect(store.initializationError).toBeNull();
    expect(store.status).toBe('Some prior status');
  });

  it('setPostReconnectionSuppression(true) toggles only that flag', () => {
    const store = useConnectionStore();
    store.status = 'Untouched status';
    store.deviceInfo = { productName: 'TestKB', id: 'dev1' };

    store.setPostReconnectionSuppression(true);

    expect(store.isPostReconnectionSuppression).toBe(true);
    expect(store.status).toBe('Untouched status');
    expect(store.deviceInfo).toEqual({ productName: 'TestKB', id: 'dev1' });
    expect(store.isConnected).toBe(false);
    expect(store.isConnecting).toBe(false);
    expect(store.isInitializing).toBe(false);
    expect(store.isInitialized).toBe(false);
    expect(store.initializationError).toBeNull();
  });

  it('setPostReconnectionSuppression(false) clears the flag again', () => {
    const store = useConnectionStore();
    store.isPostReconnectionSuppression = true;

    store.setPostReconnectionSuppression(false);

    expect(store.isPostReconnectionSuppression).toBe(false);
  });
});

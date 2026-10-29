import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

vi.mock('@services/KeyboardService', () => ({
  default: {
    switchConfig: vi.fn(),
    getActiveProfile: vi.fn(),
  },
}));

import KeyboardService from '@services/KeyboardService';
import { useProfileStore } from '../profileStore';

const switchConfigMock = vi.mocked(KeyboardService.switchConfig);
const getActiveProfileMock = vi.mocked(KeyboardService.getActiveProfile);

describe('profileStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('default state: 4 profiles named Profile 1..4, activeProfileId 1', () => {
    const store = useProfileStore();
    expect(store.profiles).toEqual([
      { id: 1, name: 'Profile 1' },
      { id: 2, name: 'Profile 2' },
      { id: 3, name: 'Profile 3' },
      { id: 4, name: 'Profile 4' },
    ]);
    expect(store.activeProfileId).toBe(1);
  });

  it('activeProfile getter follows activeProfileId', () => {
    const store = useProfileStore();
    expect(store.activeProfile).toEqual({ id: 1, name: 'Profile 1' });
    store.setActiveProfile(3);
    expect(store.activeProfile).toEqual({ id: 3, name: 'Profile 3' });
  });

  it('getProfileById returns the profile, undefined for unknown id', () => {
    const store = useProfileStore();
    expect(store.getProfileById(2)).toEqual({ id: 2, name: 'Profile 2' });
    expect(store.getProfileById(9)).toBeUndefined();
  });

  it('setActiveProfile(2) sets activeProfileId', () => {
    const store = useProfileStore();
    store.setActiveProfile(2);
    expect(store.activeProfileId).toBe(2);
  });

  it('setActiveProfile boundary 0 is silently ignored', () => {
    const store = useProfileStore();
    store.setActiveProfile(0);
    expect(store.activeProfileId).toBe(1);
  });

  it('setActiveProfile boundary 5 is silently ignored', () => {
    const store = useProfileStore();
    store.setActiveProfile(5);
    expect(store.activeProfileId).toBe(1);
  });

  it('updateProfileName trims whitespace', () => {
    const store = useProfileStore();
    store.updateProfileName(2, '  G  ');
    expect(store.profiles[1].name).toBe('G');
  });

  it("updateProfileName ignores '' and whitespace-only names", () => {
    const store = useProfileStore();
    store.updateProfileName(2, '');
    expect(store.profiles[1].name).toBe('Profile 2');
    store.updateProfileName(2, '   ');
    expect(store.profiles[1].name).toBe('Profile 2');
  });

  it('updateProfileName ignores unknown id without throwing', () => {
    const store = useProfileStore();
    expect(() => store.updateProfileName(9, 'X')).not.toThrow();
    expect(store.profiles.map(p => p.name)).toEqual([
      'Profile 1',
      'Profile 2',
      'Profile 3',
      'Profile 4',
    ]);
  });

  it("switchProfile(0) → { success: false, error: 'Invalid profile ID' }, switchConfig NOT called", async () => {
    const store = useProfileStore();
    const result = await store.switchProfile(0);
    expect(result).toEqual({ success: false, error: 'Invalid profile ID' });
    expect(switchConfigMock).not.toHaveBeenCalled();
  });

  it("switchProfile(5) → { success: false, error: 'Invalid profile ID' }, switchConfig NOT called", async () => {
    const store = useProfileStore();
    const result = await store.switchProfile(5);
    expect(result).toEqual({ success: false, error: 'Invalid profile ID' });
    expect(switchConfigMock).not.toHaveBeenCalled();
  });

  it('switchProfile with switchConfig resolving Error → failure result, activeProfileId unchanged', async () => {
    const store = useProfileStore();
    switchConfigMock.mockResolvedValue(new Error('HW failure'));
    const result = await store.switchProfile(2);
    expect(result).toEqual({ success: false, error: 'HW failure' });
    expect(store.activeProfileId).toBe(1);
    expect(getActiveProfileMock).not.toHaveBeenCalled();
  });

  it('switchProfile success → optimistic activeProfileId immediately, getActiveProfile NOT yet called', async () => {
    const store = useProfileStore();
    switchConfigMock.mockResolvedValue({ configID: 2, hasFourConfig: true });
    const result = await store.switchProfile(2);
    expect(result).toEqual({ success: true });
    expect(store.activeProfileId).toBe(2);
    expect(getActiveProfileMock).not.toHaveBeenCalled();
  });

  it('switchProfile success + 500ms advance → getActiveProfile syncs from hardware', async () => {
    const store = useProfileStore();
    switchConfigMock.mockResolvedValue({ configID: 2, hasFourConfig: true });
    getActiveProfileMock.mockResolvedValue(3);
    await store.switchProfile(2);
    expect(store.activeProfileId).toBe(2);
    await vi.advanceTimersByTimeAsync(500);
    expect(getActiveProfileMock).toHaveBeenCalledTimes(1);
    expect(store.activeProfileId).toBe(3);
  });

  it('syncActiveProfileFromHardware assigns the hardware number', async () => {
    const store = useProfileStore();
    getActiveProfileMock.mockResolvedValue(4);
    await store.syncActiveProfileFromHardware();
    expect(store.activeProfileId).toBe(4);
  });

  it('syncActiveProfileFromHardware ignores Error, activeProfileId unchanged', async () => {
    const store = useProfileStore();
    getActiveProfileMock.mockResolvedValue(new Error('read failed'));
    await store.syncActiveProfileFromHardware();
    expect(store.activeProfileId).toBe(1);
  });
});

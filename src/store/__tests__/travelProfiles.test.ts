import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTravelProfilesStore } from '../travelProfilesStore';

describe('travelProfilesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with empty profiles and null selectedProfileId', () => {
    const store = useTravelProfilesStore();
    expect(store.profiles).toEqual([]);
    expect(store.selectedProfileId).toBeNull();
  });

  it('selectedProfile is null when there are no profiles', () => {
    const store = useTravelProfilesStore();
    expect(store.selectedProfile).toBeNull();
  });

  it('selectedProfile returns the profile after selectProfile', () => {
    const store = useTravelProfilesStore();
    store.addProfile('Fast', 3.5);
    const id = store.profiles[0].id;
    store.selectProfile(id);
    expect(store.selectedProfile).toEqual({ id, switchName: 'Fast', maxTravel: 3.5 });
  });

  it('addProfile assigns a UUID id, appends, and auto-selects', () => {
    const store = useTravelProfilesStore();
    store.addProfile('Slow', 4.0);
    expect(store.profiles).toHaveLength(1);
    expect(store.profiles[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(store.profiles[0].switchName).toBe('Slow');
    expect(store.profiles[0].maxTravel).toBe(4.0);
    expect(store.selectedProfileId).toBe(store.profiles[0].id);
  });

  it('two adds get distinct ids', () => {
    const store = useTravelProfilesStore();
    store.addProfile('A', 1.0);
    store.addProfile('B', 2.0);
    expect(store.profiles).toHaveLength(2);
    expect(store.profiles[0].id).not.toBe(store.profiles[1].id);
    expect(store.selectedProfileId).toBe(store.profiles[1].id);
  });

  it('two adds back-to-back get distinct ids (was AS-IS pin: same-ms collision)', () => {
    const store = useTravelProfilesStore();
    store.addProfile('A', 1.0);
    store.addProfile('B', 2.0);
    expect(store.profiles).toHaveLength(2);
    expect(store.profiles[0].id).not.toBe(store.profiles[1].id);
  });

  it('profileOptions returns shallow copies that do not mutate the store', () => {
    const store = useTravelProfilesStore();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    store.addProfile('Original', 3.0);
    const options = store.profileOptions;
    options[0].switchName = 'x';
    expect(store.profiles[0].switchName).toBe('Original');
  });

  it('updateProfile merges a Partial by id', () => {
    const store = useTravelProfilesStore();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    store.addProfile('P', 1.0);
    const id = store.profiles[0].id;
    store.updateProfile(id, { maxTravel: 2.5 });
    expect(store.profiles[0]).toEqual({ id, switchName: 'P', maxTravel: 2.5 });
  });

  it('updateProfile with an unknown id is a no-op', () => {
    const store = useTravelProfilesStore();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    store.addProfile('P', 1.0);
    store.updateProfile('no-such-id', { switchName: 'Changed' });
    expect(store.profiles[0].switchName).toBe('P');
  });

  it('deleteProfile resets selectedProfileId to null when deleting the selected profile', () => {
    const store = useTravelProfilesStore();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    store.addProfile('A', 1.0);
    const id = store.profiles[0].id;
    store.deleteProfile(id);
    expect(store.profiles).toEqual([]);
    expect(store.selectedProfileId).toBeNull();
  });

  it('deleteProfile of a non-selected profile keeps the selection and filters it out', () => {
    const store = useTravelProfilesStore();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    store.addProfile('A', 1.0);
    const aId = store.profiles[0].id;
    vi.setSystemTime(new Date('2026-01-01T00:00:01.000Z'));
    store.addProfile('B', 2.0);
    const bId = store.profiles[1].id;
    store.deleteProfile(aId);
    expect(store.profiles).toHaveLength(1);
    expect(store.profiles[0].id).toBe(bId);
    expect(store.selectedProfileId).toBe(bId);
  });

  it('selectProfile(null) clears the selection without touching profiles', () => {
    const store = useTravelProfilesStore();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    store.addProfile('A', 1.0);
    store.selectProfile(null);
    expect(store.selectedProfileId).toBeNull();
    expect(store.profiles).toHaveLength(1);
  });
});

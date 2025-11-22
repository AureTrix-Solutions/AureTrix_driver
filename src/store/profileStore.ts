import { defineStore } from 'pinia';
import KeyboardService from '../services/KeyboardService';

interface Profile {
  id: number;
  name: string;
}

export const useProfileStore = defineStore('profiles', {
  state: () => ({
    profiles: [
      { id: 1, name: 'Profile 1' },
      { id: 2, name: 'Profile 2' },
      { id: 3, name: 'Profile 3' },
      { id: 4, name: 'Profile 4' },
    ] as Profile[],
    activeProfileId: 1,
  }),
  getters: {
    activeProfile: (state) => state.profiles.find(p => p.id === state.activeProfileId) || state.profiles[0],
    getProfileById: (state) => (id: number) => state.profiles.find(p => p.id === id),
  },
  actions: {
    async switchProfile(id: number): Promise<{ success: boolean; error?: string }> {
      if (id < 1 || id > 4) {
        return { success: false, error: 'Invalid profile ID' };
      }
      const result = await KeyboardService.switchConfig(id);
      if (result instanceof Error) {
        return { success: false, error: result.message };
      }
      // Optimistic update for immediate UI feedback
      this.activeProfileId = id;
      
      // Verify with hardware after a short delay to allow firmware to update
      setTimeout(async () => {
        await this.syncActiveProfileFromHardware();
      }, 500);
      
      return { success: true };
    },
    async syncActiveProfileFromHardware(): Promise<void> {
      const profileId = await KeyboardService.getActiveProfile();
      if (!(profileId instanceof Error)) {
        this.activeProfileId = profileId;
      }
    },
    setActiveProfile(id: number) {
      if (id >= 1 && id <= 4) {
        this.activeProfileId = id;
      }
    },
    updateProfileName(id: number, newName: string) {
      const profile = this.profiles.find(p => p.id === id);
      if (profile && newName.trim()) {
        profile.name = newName.trim();
      }
    },
  },
  persist: {
    key: 'keyboard-profiles',
    paths: ['profiles'],
  },
});

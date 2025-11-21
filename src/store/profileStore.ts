import { defineStore } from 'pinia';

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
    paths: ['profiles', 'activeProfileId'],
  },
});

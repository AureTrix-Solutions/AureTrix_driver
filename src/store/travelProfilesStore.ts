import { defineStore } from 'pinia';

interface TravelProfile {
  id: string;
  switchName: string;
  maxTravel: number;
  // Add more fields as needed (e.g., deadzoneTop: number)
}

export const useTravelProfilesStore = defineStore('travelProfiles', {
  state: () => ({
    profiles: [] as TravelProfile[],
    selectedProfileId: null as string | null,
  }),
 getters: {
  selectedProfile: (state) => state.profiles.find(p => p.id === state.selectedProfileId) || null,
  profileOptions: (state) => state.profiles.map(p => ({ ...p })), 
},
  actions: {
    addProfile(switchName: string, maxTravel: number) {
      const id = Date.now().toString(); // Simple ID; use UUID if needed
      this.profiles.push({ id, switchName, maxTravel });
      this.selectedProfileId = id; // Auto-select new
    },
    updateProfile(id: string, updates: Partial<TravelProfile>) {
      const profile = this.profiles.find(p => p.id === id);
      if (profile) Object.assign(profile, updates);
    },
    deleteProfile(id: string) {
      this.profiles = this.profiles.filter(p => p.id !== id);
      if (this.selectedProfileId === id) this.selectedProfileId = null;
    },
    selectProfile(id: string | null) {
      this.selectedProfileId = id;
    },
  },
  persist: {
    key: 'travel-profiles', // localStorage key
    paths: ['profiles', 'selectedProfileId'],
  },
});
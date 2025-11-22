import { defineStore } from 'pinia';
import KeyboardService from '../services/KeyboardService';

export const POLLING_RATE_OPTIONS = [
  { value: 0, label: '8KHz' },
  { value: 1, label: '4KHz' },
  { value: 2, label: '2KHz' },
  { value: 3, label: '1KHz' },
  { value: 4, label: '500Hz' },
  { value: 5, label: '250Hz' },
  { value: 6, label: '125Hz' },
];

export const usePollingRateStore = defineStore('pollingRate', {
  state: () => ({
    currentPollingRate: 0,
  }),
  getters: {
    currentLabel: (state) => {
      const option = POLLING_RATE_OPTIONS.find(opt => opt.value === state.currentPollingRate);
      return option ? option.label : '8KHz';
    },
  },
  actions: {
    async syncPollingRateFromHardware(): Promise<void> {
      const result = await KeyboardService.getPollingRate();
      if (!(result instanceof Error)) {
        if (typeof result === 'number' && result >= 0 && result <= 6) {
          this.currentPollingRate = result;
        } else {
          console.error('Invalid polling rate value from hardware:', result);
        }
      }
    },
    async setPollingRate(value: number): Promise<{ success: boolean; error?: string }> {
      if (value < 0 || value > 6) {
        return { success: false, error: 'Invalid polling rate value' };
      }
      const result = await KeyboardService.setPollingRate(value);
      if (result instanceof Error) {
        return { success: false, error: result.message };
      }
      this.currentPollingRate = value;
      return { success: true };
    },
  },
});

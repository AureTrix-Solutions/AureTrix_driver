<template>
  <div class="settings-section">
    <h3>Switch Profiles</h3>
    <div class="profile-management">
      <!-- Add New Profile -->
      <div class="input-group">
        <label for="profile-name">New Profile Name:</label>
        <input
          type="text"
          v-model="newProfileName"
          id="profile-name"
          placeholder="Enter switch name (e.g., Gateron Red)"
          @keyup.enter="addProfile"
        />
        <button @click="addProfile" class="action-btn" :disabled="!newProfileName.trim()">Add Profile</button>
      </div>

      <!-- Select Profile Dropdown -->
      <div class="input-group">
        <label for="profile-select">Select Profile:</label>
        <select v-model="selectedProfileId" id="profile-select">
          <option :value="null">Default 4mm</option>
          <option v-for="profile in profileOptions" :key="profile.id" :value="profile.id">
            {{ profile.switchName }}&nbsp; ({{ profile.maxTravel ? profile.maxTravel.toFixed(1) : 'N/A' }} mm)
          </option>
        </select>
        <button @click="deleteProfile" class="action-btn" :disabled="!selectedProfileId">Delete Profile</button>
      </div>

      <!-- Key Test Toggle -->
      <div class="input-group">
        <label for="key-test-toggle">Enable Key Test:</label>
        <input type="checkbox" v-model="keyTestEnabled" id="key-test-toggle" :disabled="selectedKeys.length === 0" />
      </div>
    </div>

    <!-- Modal for Capture -->
    <div v-if="showCaptureModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h4>Capture Max Travel for {{ currentProfileName }}</h4>
        <p>Press any key now to capture travel... ({{ countdown }}s remaining)</p>
        <div v-if="isCapturing" class="capturing-status">
          Listening... (Captured: {{ capturedTravel.toFixed(1) }} mm)
        </div>
        <div class="modal-buttons">
          <button @click="saveCapturedTravel" class="action-btn" :disabled="!capturedTravel">Save</button>
          <button @click="closeModal" class="stop-btn">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Key Test Modal: Table Layout -->
    <div v-if="showKeyTestModal" class="modal-overlay" @click="closeKeyTestModal">
      <div class="modal-content key-test-modal" @click.stop>
        <h4>Key Test Monitor</h4>
        <p>Press the selected key to monitor travel and trigger.<br></br> Press slow for better accuracy.</p>
        <table class="key-test-table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Travel</th>
              <th>Trigger</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{{ selectedKeyLabel }}</td>
              <td class="live">{{ travelValue }} mm</td>
              <td :class="{ 'trigger triggered': triggered }">{{ triggered ? triggerValue + ' mm' : 'N/A' }}</td>
            </tr>
          </tbody>
        </table>
        <div class="modal-buttons">
          <button @click="closeKeyTestModal" class="stop-btn">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onUnmounted, computed, watch } from 'vue';
import KeyboardService from '@services/KeyboardService';
import { useTravelProfilesStore } from '@/store/travelProfilesStore';
import { keyMap } from '@utils/keyMap';
import type { IDefKeyInfo } from '@/types/types';

export default defineComponent({
  name: 'SwitchProfiles',
  props: {
    selectedKeys: {
      type: Array as any,
      default: () => [],
    },
    layout: {
      type: Array as any,
      required: true,
    },
    baseLayout: {
      type: Object as any,
      default: null,
    },
    profileMaxTravel: {
      type: Number,
      default: 4.0,
    },
  },
  setup(props) {
    const store = useTravelProfilesStore();

    // Profile Management Refs
    const newProfileName = ref('');
    const selectedProfileId = ref(store.selectedProfileId);
    const profiles = computed(() => store.profiles);
    const profileOptions = computed(() => store.profileOptions);

    // Capture Modal Refs
    const showCaptureModal = ref(false);
    const currentProfileName = ref('');
    const isCapturing = ref(false);
    const capturedTravel = ref(0);
    const countdown = ref(5);
    let captureInterval: NodeJS.Timeout | null = null;
    let countdownInterval: NodeJS.Timeout | null = null;
    let maxObservedTravel = 0;

    // Key Test Refs
    const keyTestEnabled = ref(false);
    const actuationPoint = ref(0.5);
    const showKeyTestModal = ref(false);
    const travelValue = ref('0.00');
    const triggerValue = ref('0.00');
    const triggered = ref(false);
    let keyTestInterval: NodeJS.Timeout | null = null;
    const keydownListener = ref<((event: KeyboardEvent) => void) | null>(null);
    const pendingTriggerCapture = ref(false);
    const triggerCaptured = ref(false);
    const originalKeyMapping = ref<number | null>(null);

    // Computed Helpers
    const selectedKeyLabel = computed(() => {
      if (props.selectedKeys.length === 0) return 'None';
      const keyValue = props.selectedKeys[0].keyValue;
      return keyMap[keyValue] || `Key ${keyValue}`;
    });

    // Store Sync Watchers
    watch(() => store.selectedProfileId, (newId) => {
      selectedProfileId.value = newId;
    });

    watch(selectedProfileId, (newId) => {
      store.selectProfile(newId || null);
    });

    // Profile CRUD Functions
    const addProfile = () => {
      if (!newProfileName.value.trim()) return;
      const profileName = newProfileName.value.trim();
      store.addProfile(profileName, 2.0);
      newProfileName.value = '';
      selectedProfileId.value = store.selectedProfileId;
      currentProfileName.value = profileName;
      showCaptureModal.value = true;
      setTimeout(() => captureTravel(), 500);
    };

    const deleteProfile = () => {
      if (!selectedProfileId.value) return;
      store.deleteProfile(selectedProfileId.value);
      selectedProfileId.value = null;
      capturedTravel.value = 0;
      showCaptureModal.value = false;
    };

    // Travel Capture Logic
    const captureTravel = async () => {
      if (isCapturing.value) return;
      isCapturing.value = true;
      capturedTravel.value = 0;
      maxObservedTravel = 0;
      countdown.value = 5;

      countdownInterval = setInterval(() => {
        if (countdown.value > 0) countdown.value--;
      }, 1000);

      captureInterval = setInterval(async () => {
        try {
          const result = await KeyboardService.getRm6X21Travel();
          if (result instanceof Error) {
            return;
          }
          const { travels } = result;
          if (travels && travels.length > 0) {
            const flatTravels = Array.isArray(travels[0]) ? travels.flat() : travels;
            const nonZeroTravels = flatTravels.filter(t => t > 0);
            let currentMax = nonZeroTravels.length > 0 ? Math.max(...nonZeroTravels) : 0;
            currentMax = Math.round(currentMax * 10) / 10;
            if (currentMax > maxObservedTravel) {
              maxObservedTravel = currentMax;
              capturedTravel.value = maxObservedTravel;
            }
          }
        } catch (error) {
        }
      }, 0);

      setTimeout(() => {
        if (isCapturing.value) {
          stopCapture();
          if (capturedTravel.value > 0) {
            saveCapturedTravel();
          } else {
            closeModal();
          }
        }
      }, 5000);
    };

    const stopCapture = () => {
      isCapturing.value = false;
      if (captureInterval) {
        clearInterval(captureInterval);
        captureInterval = null;
      }
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
    };

    const saveCapturedTravel = () => {
      if (!selectedProfileId.value || capturedTravel.value <= 0) return;
      const travelToSave = capturedTravel.value;
      store.updateProfile(selectedProfileId.value, { maxTravel: travelToSave });
      capturedTravel.value = 0;
      closeModal();
    };

    const closeModal = () => {
      stopCapture();
      capturedTravel.value = 0;
      countdown.value = 5;
      showCaptureModal.value = false;
    };

    // Key Test Core Functions
    const loadActuationPoint = async () => {
      if (props.selectedKeys.length === 0) return;
      const physicalKeyValue = props.selectedKeys[0].physicalKeyValue || props.selectedKeys[0].keyValue;
      const keyValue = props.selectedKeys[0].keyValue;
      try {
        const result = await KeyboardService.getSingleTravel(physicalKeyValue);
        if (result instanceof Error) throw result;
        const loadedValue = Number(result);
        if (loadedValue >= 0.1 && loadedValue <= props.profileMaxTravel) {
          actuationPoint.value = loadedValue;
        } else {
          throw new Error(`Out of range: ${loadedValue} mm`);
        }
      } catch (error) {
        keyTestEnabled.value = false;
      }
    };

    const remapKeyForTest = async (physicalKey: number) => {
      try {
        const originalResult = await KeyboardService.getLayoutKeyInfo([{ key: physicalKey, layout: 0 }]);
        if (originalResult instanceof Error) throw originalResult;
        originalKeyMapping.value = originalResult[0].value;
        await KeyboardService.setKey([{ key: physicalKey, value: 4, layout: 0 }]);
      } catch (error) {
        keyTestEnabled.value = false;
        throw error;
      }
    };

    const restoreKeyMapping = async (physicalKey: number) => {
      if (originalKeyMapping.value === null) return;
      try {
        await KeyboardService.setKey([{ key: physicalKey, value: originalKeyMapping.value, layout: 0 }]);
      } catch (error) {
      }
      originalKeyMapping.value = null;
    };

    const startPolling = async (physicalKey: number) => {
      if (keyTestInterval) {
        clearInterval(keyTestInterval);
        keyTestInterval = null;
      }

      keydownListener.value = (event: KeyboardEvent) => {
        if (event.repeat || event.key.toLowerCase() !== 'a') return;
        pendingTriggerCapture.value = true;
        triggerCaptured.value = false;
      };
      window.addEventListener('keydown', keydownListener.value);

      keyTestInterval = setInterval(async () => {
        try {
          const result = await KeyboardService.getRm6X21Travel();
          if (result instanceof Error) {
            return;
          }
          const currentTravel = result.maxTravel || 0;
          if (currentTravel > 0) {
            travelValue.value = currentTravel.toFixed(2);

            if (pendingTriggerCapture.value && !triggerCaptured.value && currentTravel >= 0.1) {
              triggerValue.value = currentTravel.toFixed(2);
              triggered.value = true;
              pendingTriggerCapture.value = false;
              triggerCaptured.value = true;
            }

            if (triggered.value && currentTravel < 0.1) {
              triggered.value = false;
              triggerCaptured.value = false;
              pendingTriggerCapture.value = false;
            }
          } else {
            travelValue.value = '0.00';
            if (triggered.value) {
              triggered.value = false;
              triggerCaptured.value = false;
              pendingTriggerCapture.value = false;
            }
          }
        } catch (error) {
        }
      }, 0);

      showKeyTestModal.value = true;
    };

    const stopPolling = async () => {
      if (keyTestInterval) {
        clearInterval(keyTestInterval);
        keyTestInterval = null;
      }
      if (keydownListener.value) {
        window.removeEventListener('keydown', keydownListener.value);
        keydownListener.value = null;
      }
      if (props.selectedKeys.length > 0 && originalKeyMapping.value !== null) {
        const physicalKey = props.selectedKeys[0].physicalKeyValue || props.selectedKeys[0].keyValue;
        await restoreKeyMapping(physicalKey);
      }
      travelValue.value = '0.00';
      triggerValue.value = '0.00';
      triggered.value = false;
      pendingTriggerCapture.value = false;
      triggerCaptured.value = false;
      showKeyTestModal.value = false;
    };

    const startKeyTest = async () => {
      if (props.selectedKeys.length === 0) {
        keyTestEnabled.value = false;
        return;
      }
      const physicalKey = props.selectedKeys[0].physicalKeyValue || props.selectedKeys[0].keyValue;
      await loadActuationPoint();
      if (actuationPoint.value <= 0) {
        keyTestEnabled.value = false;
        return;
      }
      try {
        await remapKeyForTest(physicalKey);
        await startPolling(physicalKey);
      } catch (error) {
        keyTestEnabled.value = false;
      }
    };

    const closeKeyTestModal = () => {
      keyTestEnabled.value = false;
    };

    // Key Test Watchers
    watch(keyTestEnabled, async (newVal, oldVal) => {
      if (newVal && oldVal !== newVal) {
        await startKeyTest();
      } else if (!newVal && oldVal !== newVal) {
        await stopPolling();
      }
    });

    watch(() => props.selectedKeys, async (newKeys) => {
      if (newKeys.length === 0) {
        keyTestEnabled.value = false;
        await stopPolling();
      } else if (keyTestEnabled.value) {
        await stopPolling();
        await startKeyTest();
      }
      await loadActuationPoint();
    }, { deep: true });

    // Cleanup on unmount
    onUnmounted(async () => {
      if (captureInterval) clearInterval(captureInterval);
      if (countdownInterval) clearInterval(countdownInterval);
      if (keyTestInterval) clearInterval(keyTestInterval);
      if (keydownListener.value) window.removeEventListener('keydown', keydownListener.value);
      if (props.selectedKeys.length > 0 && originalKeyMapping.value !== null) {
        const physicalKey = props.selectedKeys[0].physicalKeyValue || props.selectedKeys[0].keyValue;
        await restoreKeyMapping(physicalKey);
      }
    });

    return {
      // Profile
      profiles,
      profileOptions,
      newProfileName,
      selectedProfileId,
      addProfile,
      deleteProfile,
      // Capture
      showCaptureModal,
      currentProfileName,
      isCapturing,
      capturedTravel,
      countdown,
      captureTravel,
      stopCapture,
      saveCapturedTravel,
      closeModal,
      // Key Test
      keyTestEnabled,
      showKeyTestModal,
      travelValue,
      triggerValue,
      triggered,
      selectedKeyLabel,
      closeKeyTestModal,
      // Props passthrough
      profileMaxTravel: props.profileMaxTravel,
      selectedKeys: props.selectedKeys,
      keyMap,
    };
  },
});
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@styles/variables' as v;

.settings-section {
  flex-shrink: 0;
  border: 1px solid rgba(v.$text-color, 0.2);
  height: fit-content;
  padding-left: 8px;

  h3 {
    color: v.$primary-color;
    width: auto;
    font-size: 1.5rem;
    margin: 0;
    margin-bottom: -5px;
    font-weight: 400;
  }

  .profile-management {
    display: flex;
    flex-direction: column;
    gap: 0px;
    overflow-y: auto;
    margin-top: 20px;
    height: calc(100% - 60px);
    font-family: v.$font-style;
  }

  .input-group {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0px;
    margin-bottom: 10px;

    label {
      color: v.$text-color;
      font-size: 1rem;
      min-width: 150px;
      font-weight: 300;
    }

    input[type="text"],
    select {
      padding: 6px 8px;
      border-radius: v.$border-radius;
      background-color: v.$background-dark;
      color: v.$text-color;
      border: v.$border-style;
      font-size: 1rem;
      width: 250px;
      box-sizing: border-box;
      font-family: v.$font-style;

      &:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(v.$accent-color, 0.3);
      }
    }

    input[type="checkbox"] {
      width: 20px;
      height: 20px;
      cursor: pointer;

      &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
    }

    .action-btn {
      padding: 8px 8px;
      background-color: color.adjust(v.$background-dark, $lightness: -100%);
      color: v.$primary-color;
      border: v.$border-style;
      border-radius: v.$border-radius;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 400;
      transition: background-color 0.2s ease;
      width: 120px;
      text-align: center;

      &:hover:not(:disabled) {
        background-color: color.adjust(v.$background-dark, $lightness: 10%);
      }

      &:disabled {
        background-color: color.adjust(v.$background-dark, $lightness: -20%);
        cursor: not-allowed;
        opacity: 0.5;
      }
    }
  }

  .capturing-status {
    color: v.$accent-color;
    font-size: 0.9rem;
    margin: 10px 0;
  }

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background-color: v.$background-dark;
    padding: 20px;
    border-radius: v.$border-radius;
    border: v.$border-style;
    max-width: 400px;
    width: 90vw; 
    max-height: 80vh;
    overflow-y: auto;
    text-align: center;

    h4 {
      color: v.$primary-color;
      margin-bottom: 10px;
      font-weight: 400;
    }

    p {
      color: v.$text-color;
      margin-bottom: 10px;
      font-family: v.$font-style;
      font-weight: 300;
    }

    .modal-buttons {
      display: flex;
      gap: 10px;
      justify-content: center;
      margin-top: 15px;
    }

    .stop-btn {
      padding: 8px 12px;
      background-color: color.adjust(v.$background-dark, $lightness: -100%);
      color: #ef4444;
      font-weight: 400;
      border: v.$border-style;
      border-radius: v.$border-radius;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background-color 0.2s ease;

      &:hover:not(:disabled) {
        background-color: color.adjust(v.$background-dark, $lightness: 10%);
      }
    }
  }

  .key-test-table {
    width: 80%;
    margin: 15px auto 0;
    border-collapse: collapse;

    th, td {
      padding: 8px;
      border: v.$border-style;
      font-weight: 300;
      text-align: center;
      color: v.$text-color;
      font-family: v.$font-style;
      font-size: 1.1rem;
    }

    th {
      background-color: rgba(v.$background-dark, 0.8);
    }

    .live {
      color: v.$accent-color;
      font-weight: 500;
    }

    .trigger {
      color: #ff4444;

      &.triggered {
        color: #00ff00;
      }
    }
  }
}
</style>
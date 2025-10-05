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
      <div v-if="keyTestEnabled && selectedKeys.length > 0" class="key-test-container">
        <div class="key-test-bar">
          <div
            class="key-test-depth"
            :style="{ height: `${keyPressDepth * 100}%`, backgroundColor: keyPressDepth >= (actuationPoint / profileMaxTravel) ? '#00ff00' : '#ff4444' }"
          ></div>
          <div class="actuation-point" :style="{ bottom: `${(actuationPoint / profileMaxTravel) * 100}%` }"></div>
        </div>
        <p>Depth: {{ (keyPressDepth * profileMaxTravel).toFixed(2) }} mm / Actuation: {{ actuationPoint.toFixed(2) }} mm</p>
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
        <p>Press the selected key to monitor travel and trigger.</p>
        <p>Press slow for better accuracy</p>
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
              <td>{{ travelValue }} mm</td>
              <td :class="{ triggered: triggered }">{{ triggered ? triggerValue + ' mm' : 'N/A' }}</td>
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
import { defineComponent, ref, onUnmounted, computed, watch, PropType, Ref } from 'vue';
import KeyboardService from '@services/KeyboardService';
import { useTravelProfilesStore } from '@/store/travelProfilesStore';
import { keyMap } from '@utils/keyMap';
import type { IDefKeyInfo } from '@/types/types';
import type { TravelProfile } from '@/store/travelProfilesStore';

export default defineComponent({
  name: 'SwitchProfiles',
  components: {},
  props: {
    selectedKeys: {
      type: Array as PropType<IDefKeyInfo[]>,
      default: () => [],
    },
    layout: {
      type: Array as PropType<IDefKeyInfo[][]>,
      required: true,
    },
    baseLayout: {
      type: Object as PropType<Ref<IDefKeyInfo[][] | null>>,
      default: () => ref(null),
    },
    profileMaxTravel: {
      type: Number,
      default: 4.0,
    },
  },
  emits: ['update-notification'],
  setup(props, { emit }) {
    const store = useTravelProfilesStore();
    const newProfileName = ref('');
    const selectedProfileId = ref(store.selectedProfileId);
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
    const keyPressDepth = ref(0);
    const actuationPoint = ref(0.5);

    // Key Test Modal Refs
    const showKeyTestModal = ref(false);
    const travelValue = ref('0.00');
    const triggerValue = ref('0.00');
    const triggered = ref(false);
    const keyTestInterval = ref<NodeJS.Timeout | null>(null);

    // Ref for keydown listener (to remove later)
    const keydownListener = ref<((event: KeyboardEvent) => void) | null>(null);

    // Flag for pending trigger capture after keydown
    const pendingTriggerCapture = ref(false);

    // Flag to clamp trigger after first capture per press
    const triggerCaptured = ref(false);

    // NEW: Ref for original key mapping to restore after test
    const originalKeyMapping = ref<number | null>(null);

    // Computed for Selected Key Label
    const selectedKeyLabel = computed(() => {
      if (props.selectedKeys.length === 0) return 'None';
      const keyValue = props.selectedKeys[0].keyValue;
      return keyMap[keyValue] || `Key ${keyValue}`;
    });

    // Computed for Selected Physical Key Index in Flat Layout
    const selectedKeyIndex = computed(() => {
      if (props.selectedKeys.length === 0 || !props.layout.length) return -1;
      const flatLayout = props.layout.flat();
      const physicalKey = props.selectedKeys[0].physicalKeyValue || props.selectedKeys[0].keyValue;
      return flatLayout.findIndex(k => (k.physicalKeyValue || k.keyValue) === physicalKey);
    });

    // Reactive store data
    const profiles = computed(() => store.profiles);
    const profileOptions = computed(() => store.profileOptions);

    const loadActuationPoint = async () => {
      if (props.selectedKeys.length === 0) return;
      const physicalKeyValue = props.selectedKeys[0].physicalKeyValue || props.selectedKeys[0].keyValue;
      const keyValue = props.selectedKeys[0].keyValue;
      try {
        //console.log(`Loading actuation point for key ${keyValue}`);
        const result = await KeyboardService.getSingleTravel(physicalKeyValue);
        if (result instanceof Error) {
          throw result;
        }
        //console.log(`Raw SDK response: singleTravel=${result} mm`);
        const loadedValue = Number(result);
        if (loadedValue >= 0.1 && loadedValue <= props.profileMaxTravel) {
          actuationPoint.value = loadedValue;  // Store in mm
          //console.log(`Loaded actuation point: ${actuationPoint.value} mm`);
        } else {
          throw new Error(`Loaded actuation point ${loadedValue} mm out of range (0.1-${props.profileMaxTravel} mm)`);
        }
      } catch (error) {
        console.error(`Failed to load actuation point for key ${keyValue}:`, error);
        emit('update-notification', `Failed to load actuation point: ${(error as Error).message}`, true);
        keyTestEnabled.value = false;
      }
    };

    // Extracted function to start polling (reusable for watchers) - Updated to use maxTravel
    const startKeyTestPolling = async () => {
      //console.log('[DEBUG] startKeyTestPolling called - selectedKeys length:', props.selectedKeys.length);
      if (props.selectedKeys.length === 0) {
        console.warn('Cannot start polling: No key selected');
        return;
      }

      const physicalKey = props.selectedKeys[0].physicalKeyValue || props.selectedKeys[0].keyValue;
      //console.log('[DEBUG] Selected physicalKey:', physicalKey);
      const flatLayout = props.layout.flat();
      //console.log('[DEBUG] flatLayout sample around expected index:', flatLayout.slice(Math.max(0, selectedKeyIndex.value - 2), selectedKeyIndex.value + 3).map(k => ({ physical: k.physicalKeyValue || k.keyValue, label: keyMap[k.keyValue] || k.keyValue })));

      // Load actuation point if not already loaded
      await loadActuationPoint();
      if (actuationPoint.value <= 0) {
        //console.log('[DEBUG] Aborting polling start - invalid actuation point');
        emit('update-notification', 'Failed to load actuation point', true);
        keyTestEnabled.value = false;
        return;
      }

      // NEW: Temporarily remap the selected key to 'A' (keycode 4) for testing
      try {
        const originalResult = await KeyboardService.getLayoutKeyInfo([{ key: physicalKey, layout: 0 }]);
        if (originalResult instanceof Error) {
          throw originalResult;
        }
        originalKeyMapping.value = originalResult[0].value;
        await KeyboardService.setKey([{ key: physicalKey, value: 4, layout: 0 }]);
        //console.log('[DEBUG] Temporarily remapped key to "A" for testing');
      } catch (error) {
        console.error('[DEBUG] Failed to remap key for testing:', error);
        emit('update-notification', `Failed to remap key for testing: ${(error as Error).message}`, true);
        keyTestEnabled.value = false;
        return;
      }

      // Clear any existing interval before starting new
      if (keyTestInterval.value) {
        clearInterval(keyTestInterval.value);
        keyTestInterval.value = null;
      }

      // Add keydown listener for actual key send detection, ignoring repeats
      keydownListener.value = (event: KeyboardEvent) => {
        if (event.repeat) return; // Ignore repeat events from holding key
        if (event.key.toLowerCase() === 'a') { // Detect 'a' from remap
          pendingTriggerCapture.value = true;
          triggerCaptured.value = false; // Reset capture flag for new press
          //console.log('[DEBUG] Initial key send detected (as "a") - Pending capture for first non-zero travel');
        }
      };
      window.addEventListener('keydown', keydownListener.value);

      // Start polling for live travel using maxTravel for simplicity
      keyTestInterval.value = setInterval(async () => {
        try {
          const result = await KeyboardService.getRm6X21Travel();
          //console.log('[DEBUG] Polling result maxTravel:', result.maxTravel);
          if (result instanceof Error) {
            console.warn('Polling error:', result);
            return;
          }
          const currentTravel = result.maxTravel || 0;
          //console.log('[DEBUG] currentTravel (maxTravel):', currentTravel, '(actuationPoint ref:', actuationPoint.value, ')');
          if (currentTravel > 0) {
            // Update live travel display (in mm)
            travelValue.value = currentTravel.toFixed(2);

            // Capture trigger if pending and non-zero and not already captured
            if (pendingTriggerCapture.value && !triggerCaptured.value) {
              triggerValue.value = currentTravel.toFixed(2);
              triggered.value = true;
              pendingTriggerCapture.value = false;
              triggerCaptured.value = true;
              //console.log(`Trigger clamped at first non-zero after send: ${triggerValue.value} mm for key ${keyMap[props.selectedKeys[0]?.keyValue]}`);
            }

            // Reset triggered and flags on release (travel drops below a small threshold, e.g., 0.1mm)
            if (triggered.value && currentTravel < 0.1) {
              triggered.value = false;
              triggerCaptured.value = false;
              pendingTriggerCapture.value = false;
            }

            // Normalize for old bar visualization (if kept)
            keyPressDepth.value = currentTravel / props.profileMaxTravel;
          } else {
            // No press: reset to 0
            travelValue.value = '0.00';
            if (triggered.value && keyPressDepth.value < 0.1) {
              triggered.value = false;
              triggerCaptured.value = false;
              pendingTriggerCapture.value = false;
            }
            keyPressDepth.value = 0;
          }
        } catch (error) {
          console.error(`Polling failed for key ${props.selectedKeys[0]?.physicalKeyValue || props.selectedKeys[0]?.keyValue}:`, error);
        }
      }, 50);  // 50ms for responsive updates

      showKeyTestModal.value = true;
      //console.log(`[DEBUG] Polling interval started successfully for physical key ${physicalKey} using maxTravel`);
    };

    // Extracted function to stop polling (reusable for watchers)
    const stopKeyTestPolling = () => {
      //console.log('[DEBUG] stopKeyTestPolling called');
      if (keyTestInterval.value) {
        clearInterval(keyTestInterval.value);
        keyTestInterval.value = null;
      }
      // Remove keydown listener
      if (keydownListener.value) {
        window.removeEventListener('keydown', keydownListener.value);
        keydownListener.value = null;
      }
      // NEW: Restore original key mapping if set
      if (originalKeyMapping.value !== null && props.selectedKeys.length > 0) {
        const physicalKey = props.selectedKeys[0].physicalKeyValue || props.selectedKeys[0].keyValue;
        KeyboardService.setKey([{ key: physicalKey, value: originalKeyMapping.value, layout: 0 }]).then(() => {
          //console.log('[DEBUG] Restored original key mapping');
        }).catch(error => {
          console.error('[DEBUG] Failed to restore original key mapping:', error);
        });
        originalKeyMapping.value = null;
      }
      travelValue.value = '0.00';
      triggerValue.value = '0.00';
      triggered.value = false;
      pendingTriggerCapture.value = false; // Reset pending
      triggerCaptured.value = false; // Reset captured
      showKeyTestModal.value = false;
      keyPressDepth.value = 0;
      //console.log('Key test stopped');
    };

    // Function to close modal and stop key test
    const closeKeyTestModal = () => {
      keyTestEnabled.value = false; // Triggers watcher to stop polling
    };

    // Watcher on keyTestEnabled to handle start/stop (replaces toggleKeyTest)
    watch(keyTestEnabled, async (newEnabled, oldEnabled) => {
      //console.log(`[DEBUG] keyTestEnabled watcher fired - new: ${newEnabled}, old: ${oldEnabled}, selectedKeys length: ${props.selectedKeys.length}`);
      if (newEnabled && oldEnabled !== newEnabled) {  // Rising edge: start
        //console.log('[DEBUG] keyTestEnabled watcher: Entering enable branch');
        if (props.selectedKeys.length === 0) {
          emit('update-notification', 'No key selected for testing', true);
          keyTestEnabled.value = false;  // Revert if no key
          return;
        }
        await startKeyTestPolling();
        const keyValue = props.selectedKeys[0]?.keyValue;
        emit('update-notification', `Key test started for ${keyMap[keyValue]} (Actuation: ${actuationPoint.value.toFixed(2)} mm)`, false);
      } else if (!newEnabled && oldEnabled !== newEnabled) {  // Falling edge: stop
        //console.log('[DEBUG] keyTestEnabled watcher: Entering disable branch');
        stopKeyTestPolling();
        const keyValue = props.selectedKeys[0]?.keyValue;
        if (keyValue) {
          emit('update-notification', `Key test stopped for ${keyMap[keyValue]}`, false);
        }
      }
    });

    // Watcher on selectedKeys (keeps restart logic)
    watch(() => props.selectedKeys, async (newKeys, oldKeys) => {
      //console.log(`[DEBUG] Selected keys watcher fired - new length: ${newKeys.length}, old length: ${oldKeys?.length || 0}, keyTestEnabled: ${keyTestEnabled.value}`);
      //console.log(`SwitchProfiles: Selected keys changed: ${newKeys.map(k => keyMap[k.keyValue] || k.keyValue).join(', ') || 'none'}`);
      if (newKeys.length === 0) {
        //console.log('[DEBUG] Watcher: No keys - forcing disable');
        // Force disable if no keys selected
        keyTestEnabled.value = false;
        keyPressDepth.value = 0;
        stopKeyTestPolling();  // Use new stop function
      } else if (keyTestEnabled.value) {
        //console.log('[DEBUG] Watcher: Keys changed while enabled - restarting polling');
        // Restart polling for new key without disabling
        stopKeyTestPolling();  // Clear first
        await startKeyTestPolling();
        emit('update-notification', `Key test restarted for new selection: ${keyMap[newKeys[0].keyValue]}`, false);
      }
      loadActuationPoint();
    }, { deep: true, immediate: false });

    // Watch store for sync to ref
    watch(() => store.selectedProfileId, (newId) => {
      selectedProfileId.value = newId;
    });

    // Watch ref for sync to store
    watch(selectedProfileId, (newId) => {
      store.selectProfile(newId || null);
    });

    const addProfile = () => {
      if (newProfileName.value.trim()) {
        const profileName = newProfileName.value.trim();
        store.addProfile(profileName, 2.0);
        newProfileName.value = '';
        selectedProfileId.value = store.selectedProfileId;
        currentProfileName.value = profileName;
        showCaptureModal.value = true;
        setTimeout(() => captureTravel(), 500);
      }
    };

    const deleteProfile = () => {
      if (selectedProfileId.value) {
        store.deleteProfile(selectedProfileId.value);
        selectedProfileId.value = null;
        capturedTravel.value = 0;
        showCaptureModal.value = false;
      }
    };

    const captureTravel = async () => {
      if (isCapturing.value) return;
      isCapturing.value = true;
      capturedTravel.value = 0;
      maxObservedTravel = 0;
      countdown.value = 5;
      //console.log('Starting travel capture... Press a key now.');

      countdownInterval = setInterval(() => {
        if (countdown.value > 0) {
          countdown.value--;
        }
      }, 1000);

      captureInterval = setInterval(async () => {
        try {
          const result = await KeyboardService.getRm6X21Travel();
          if (result instanceof Error) {
            console.error('Capture error:', result);
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
              //console.log(`Observed travel: ${currentMax.toFixed(1)} mm`);
            }
          }
        } catch (error) {
          console.error('Failed during capture:', error);
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
      //console.log('Capture stopped.');
    };

    const saveCapturedTravel = () => {
      if (selectedProfileId.value && capturedTravel.value > 0) {
        const travelToSave = capturedTravel.value;
        store.updateProfile(selectedProfileId.value, { maxTravel: travelToSave });
        //console.log(`Saving max travel ${travelToSave.toFixed(1)} mm to profile ${currentProfileName.value}`);
        const updatedProfile = store.selectedProfile;
        //console.log(`Updated profile maxTravel: ${updatedProfile?.maxTravel?.toFixed(1) || 'N/A'} mm`);
        capturedTravel.value = 0;
        closeModal();
      }
    };

    const closeModal = () => {
      stopCapture();
      capturedTravel.value = 0;
      countdown.value = 5;
      showCaptureModal.value = false;
    };

    onUnmounted(() => {
      if (captureInterval) clearInterval(captureInterval);
      if (countdownInterval) clearInterval(countdownInterval);
      if (keyTestInterval.value) clearInterval(keyTestInterval.value);
      if (keydownListener.value) window.removeEventListener('keydown', keydownListener.value);
    });

    return {
      profiles,
      profileOptions,
      newProfileName,
      selectedProfileId,
      showCaptureModal,
      currentProfileName,
      isCapturing,
      capturedTravel,
      countdown,
      addProfile,
      deleteProfile,
      captureTravel,
      stopCapture,
      saveCapturedTravel,
      closeModal,
      keyTestEnabled,
      keyPressDepth,
      actuationPoint,
      loadActuationPoint,
      keyMap,
      profileMaxTravel: props.profileMaxTravel,
      selectedKeys: props.selectedKeys,
      showKeyTestModal,
      travelValue,
      triggerValue,
      triggered,
      selectedKeyLabel,
      selectedKeyIndex,
      closeKeyTestModal, // Add to return
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
  height: 190px;
  padding-left: 8px;

  h3 {
    color: v.$primary-color;
    flex-shrink: 0;
    width: auto;
    font-size: 1.5rem;
    text-decoration: underline;
    margin: 0;
    margin-bottom: 10px;
  }

  .profile-management {
    display: flex;
    flex-direction: column;
    gap: 0px;
    overflow-y: auto;
    height: calc(100% - 60px);
  }

  .input-group {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;

    label {
      color: v.$text-color;
      font-size: 1rem;
      min-width: 150px;
    }

    input[type="text"],
    select {
      padding: 6px 8px;
      border-radius: v.$border-radius;
      background-color: v.$background-dark;
      color: v.$text-color;
      border: 1px solid rgba(v.$text-color, 0.2);
      font-size: 1rem;
      width: 250px;
      box-sizing: border-box;
      &:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(v.$primary-color, 0.5);
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
      padding: 8px 16px;
      background-color: v.$accent-color;
      color: v.$background-dark;
      border: none;
      border-radius: v.$border-radius;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      transition: background-color 0.2s ease;
      width: 120px;
      text-align: center;

      &:hover:not(:disabled) {
        background-color: color.adjust(v.$accent-color, $lightness: 10%);
      }

      &:disabled {
        background-color: color.adjust(v.$accent-color, $lightness: -20%);
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

  .no-profiles {
    text-align: center;
    color: v.$text-color;
    font-size: 1rem;
    padding: 20px;
  }

  .key-test-container {
    margin-top: 20px;
    display: flex;
    align-items: center;
    gap: 20px;

    .key-test-bar {
      width: 20px;
      height: 100px;
      background-color: rgba(v.$background-dark, 0.8);
      border: 1px solid rgba(v.$text-color, 0.3);
      position: relative;
      overflow: hidden;

      .key-test-depth {
        width: 100%;
        bottom: 0;
        position: absolute;
        transition: height 0.1s ease;
      }

      .actuation-point {
        width: 100%;
        height: 2px;
        background-color: v.$accent-color;
        position: absolute;
      }
    }

    p {
      color: v.$text-color;
      font-size: 0.9rem;
    }
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
    border: 1px solid rgba(v.$text-color, 0.2);
    max-width: 400px;
    text-align: center;

    h4 {
      color: v.$primary-color;
      margin-bottom: 10px;
    }

    p {
      color: whitesmoke;
      margin-bottom: 10px;
      font-family:system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      font-weight: light;
    }

    .modal-buttons {
      display: flex;
      gap: 10px;
      justify-content: center;
      margin-top: 15px;
    }

    .stop-btn {
      padding: 8px 12px;
      background-color: #ef4444bc;
      color: v.$background-dark;
      font-weight: bold;
      border: none;
      border-radius: v.$border-radius;
      cursor: pointer;
      font-size: 0.9rem;

      &:hover:not(:disabled) {
        background-color: color.adjust(#ef4444, $lightness: 10%);
      }
    }
  }

  .key-test-table {
    width: 80%;  // Adjust width as needed
    margin: 0 auto;  // Center the table
    border-collapse: collapse;


    th, td {
      padding: 8px;
      border: 1px solid rgba(v.$text-color, 0.2);
      font-weight: lighter;
      text-align: center;
      color: white;
      font-family:monospace;
      font-size: large;
      
    }

    th {
      background-color: rgba(v.$background-dark, 0.8);
     
    }

    .live {
      color: v.$accent-color;
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
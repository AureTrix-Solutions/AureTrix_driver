<template>
  <div class="rapid-trigger-page">
    <h2 class="title">Rapid Trigger Settings</h2>
    <div v-if="notification" class="notification" :class="{ error: notification.isError }">
      {{ notification.message }}
      <button @click="notification = null" class="dismiss-btn">&times;</button>
    </div>

    <div class="rapid-trigger-container">
      <div v-if="layout.length && loaded" class="key-grid" :style="gridStyle">
        <div v-for="(row, rIdx) in layout" :key="`r-${rIdx}`" class="key-row">
          <div
            v-for="(keyInfo, cIdx) in row"
            :key="`k-${rIdx}-${cIdx}`"
            class="key-btn"
            :class="{ 'rt-key-selected': loaded && selectedKeys.some(k => (k.physicalKeyValue || k.keyValue) === (keyInfo.physicalKeyValue || keyInfo.keyValue)) }"
            :style="getKeyStyle(rIdx, cIdx)"
            @click="selectKey(keyInfo, rIdx, cIdx)"
          >
            <div class="key-label">
              {{ keyInfo.remappedLabel || keyMap[keyInfo.keyValue] || `Key ${keyInfo.keyValue}` }}
            </div>
            <div v-if="overlayData[keyInfo.physicalKeyValue || keyInfo.keyValue]" class="overlay">
              <div class="overlay-values">
                <div class="overlay-top-left">{{ overlayData[keyInfo.physicalKeyValue || keyInfo.keyValue]?.press || '0.00' }}</div>
                <div class="overlay-top-right">{{ overlayData[keyInfo.physicalKeyValue || keyInfo.keyValue]?.release || '0.00' }}</div>
                <div class="overlay-center">{{ overlayData[keyInfo.physicalKeyValue || keyInfo.keyValue]?.travel || '0.00' }}</div>
                <div class="overlay-bottom-left">{{ overlayData[keyInfo.physicalKeyValue || keyInfo.keyValue]?.pressDead }}</div>
                <div class="overlay-bottom-right">{{ overlayData[keyInfo.physicalKeyValue || keyInfo.keyValue]?.releaseDead }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="no-layout">
        <p>{{ error || 'No keyboard layout available. Ensure a device is connected and try again.' }}</p>
        <p>Debug: layout.length={{ layout.length }}, loaded={{ loaded }}, baseLayout={{ baseLayout?.value ? 'defined' : 'null' }}</p>
      </div>
      <div class="bottom-section">
        <div class="selection-buttons">
          <button @click="selectAll" class="select-btn">Select All</button>
          <button @click="selectWASD" class="select-btn">Select WASD</button>
          <button @click="selectLetters" class="select-btn">Select Letters</button>
          <button @click="selectNumbers" class="select-btn">Select Numbers</button>
          <button @click="selectNone" class="select-btn">Select None</button>
        </div>
        <div class="parent">
          <div class="settings-panel">
            <div class="settings-section">
              <div class="header-row">
                <h3>Rapid Trigger Settings</h3>
              </div>

              <div class="travel-row">
                <div class="input-group">
                  <div class="label">Initial Trigger Travel (<span class="initial-trigger-unit">mm</span>)</div>
                  <div class="slider-container">
                    <div class="value-display">{{ minInitialActuation.toFixed(2) }}</div>
                    <input
                      type="range"
                      v-model.number="initialActuation"
                      id="initial-actuation-slider"
                      :min="minInitialActuation"
                      :max="maxInitialActuation"
                      step="0.01"
                      :disabled="selectedKeys.length === 0"
                      @change="updateAllSettings"
                    />
                    <div class="value-display">{{ maxInitialActuation.toFixed(2) }}</div>
                  </div>
                  <div class="adjusters">
                    <button @click="adjustInitialActuation(-0.01)" class="adjust-btn" :disabled="selectedKeys.length === 0">-</button>
                    <input
                      type="number"
                      v-model.number="initialActuation"
                      id="initial-actuation-input"
                      :min="minInitialActuation"
                      :max="maxInitialActuation"
                      step="0.01"
                      :disabled="selectedKeys.length === 0"
                      @change="updateAllSettings"
                    />
                    <button @click="adjustInitialActuation(0.01)" class="adjust-btn" :disabled="selectedKeys.length === 0">+</button>
                  </div>
                </div>
              </div>

              <div class="rt-travel-group">
                <div class="input-group">
                  <div class="label">Key Re-Trigger (<span class="key-retrigger-unit">mm</span>)</div>
                  <div class="slider-container">
                    <div class="value-display">0.10</div>
                    <input
                      type="range"
                      v-model.number="pressTravel"
                      id="press-travel-slider"
                      min="0.1"
                      :max="maxPressTravel"
                      step="0.01"
                      :disabled="selectedKeys.length === 0"
                      @change="updateAllSettings"
                    />
                    <div class="value-display">{{ maxPressTravel.toFixed(2) }}</div>
                  </div>
                  <div class="adjusters">
                    <button @click="adjustPress(-0.01)" class="adjust-btn" :disabled="selectedKeys.length === 0">-</button>
                    <input
                      type="number"
                      v-model.number="pressTravel"
                      id="press-travel-input"
                      min="0.1"
                      :max="maxPressTravel"
                      step="0.01"
                      :disabled="selectedKeys.length === 0"
                      @change="updateAllSettings"
                    />
                    <button @click="adjustPress(0.01)" class="adjust-btn" :disabled="selectedKeys.length === 0">+</button>
                  </div>
                </div>
                <div class="link-container">
                  <button @click="toggleLinkRtTravel" class="link-btn">{{ rtTravelLinked ? 'Unlink' : 'Link' }}</button>
                </div>
                <div class="input-group">
                  <div class="label">Key Reset (<span class="key-reset-unit">mm</span>)</div>
                  <div class="slider-container">
                    <div class="value-display">0.10</div>
                    <input
                      type="range"
                      v-model.number="releaseTravel"
                      id="release-travel-slider"
                      min="0.1"
                      :max="maxReleaseTravel"
                      step="0.01"
                      :disabled="selectedKeys.length === 0"
                      @change="updateAllSettings"
                    />
                    <div class="value-display">{{ maxReleaseTravel.toFixed(2) }}</div>
                  </div>
                  <div class="adjusters">
                    <button @click="adjustRelease(-0.01)" class="adjust-btn" :disabled="selectedKeys.length === 0">-</button>
                    <input
                      type="number"
                      v-model.number="releaseTravel"
                      id="release-travel-input"
                      min="0.1"
                      :max="maxReleaseTravel"
                      step="0.01"
                      :disabled="selectedKeys.length === 0"
                      @change="updateAllSettings"
                    />
                    <button @click="adjustRelease(0.01)" class="adjust-btn" :disabled="selectedKeys.length === 0">+</button>
                  </div>
                </div>
              </div>

              <div class="deadzone-group">
                <div class="input-group">
                  <div class="label">Top Deadzone (<span class="top-deadzone-unit">mm</span>)</div>
                  <div class="slider-container">
                    <div class="value-display">0.00</div>
                    <input
                      type="range"
                      v-model.number="pressDeadzone"
                      min="0.0"
                      max="1.0"
                      step="0.01"
                      :disabled="selectedKeys.length === 0"
                      @change="updateAllSettings"
                    />
                    <div class="value-display">1.00</div>
                  </div>
                  <div class="adjusters">
                    <button @click="adjustDeadzone(-0.01, 'press')" class="adjust-btn" :disabled="selectedKeys.length === 0">-</button>
                    <input
                      type="number"
                      v-model.number="pressDeadzone"
                      min="0.0"
                      max="1.0"
                      step="0.01"
                      :disabled="selectedKeys.length === 0"
                      @change="updateAllSettings"
                    />
                    <button @click="adjustDeadzone(0.01, 'press')" class="adjust-btn" :disabled="selectedKeys.length === 0">+</button>
                  </div>
                </div>
                <div class="link-container">
                  <button @click="toggleLinkDeadZones" class="link-btn">{{ deadZonesLinked ? 'Unlink' : 'Link' }} </button>
                </div>
                <div class="input-group">
                  <div class="label">Bottom Deadzone (<span class="bottom-deadzone-unit">mm</span>)</div>
                  <div class="slider-container">
                    <div class="value-display">0.00</div>
                    <input
                      type="range"
                      v-model.number="releaseDeadzone"
                      min="0.0"
                      max="1.0"
                      step="0.01"
                      :disabled="selectedKeys.length === 0"
                      @change="updateAllSettings"
                    />
                    <div class="value-display">1.00</div>
                  </div>
                  <div class="adjusters">
                    <button @click="adjustDeadzone(-0.01, 'release')" class="adjust-btn" :disabled="selectedKeys.length === 0">-</button>
                    <input
                      type="number"
                      v-model.number="releaseDeadzone"
                      min="0.0"
                      max="1.0"
                      step="0.01"
                      :disabled="selectedKeys.length === 0"
                      @change="updateAllSettings"
                    />
                    <button @click="adjustDeadzone(0.01, 'release')" class="adjust-btn" :disabled="selectedKeys.length === 0">+</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, onMounted, computed } from 'vue';
import { useTravelProfilesStore } from '@/store/travelProfilesStore';
import { useMappedKeyboard } from '@utils/MappedKeyboard';
import { keyMap } from '@utils/keyMap';
import KeyboardService from '@services/KeyboardService';
import { useBatchProcessing } from '@/composables/useBatchProcessing';
import type { IDefKeyInfo } from '../types/types';

export default defineComponent({
  name: 'RapidTrigger',
  setup() {
    const { processBatches } = useBatchProcessing();
    const selectedKeys = ref<IDefKeyInfo[]>([]);
    const notification = ref<{ message: string; isError: boolean } | null>(null);
    const overlayData = ref<{ 
      [key: number]: { 
        travel: string; 
        press: string; 
        release: string; 
        pressDead: string; 
        releaseDead: string 
      } 
    }>({});

    const { layout, loaded, gridStyle, getKeyStyle, fetchLayerLayout, baseLayout, error } = useMappedKeyboard(ref(0));

    const store = useTravelProfilesStore();
    const profileMaxTravel = computed(() => {
      const selected = store.selectedProfile;
      return selected ? selected.maxTravel : 4.0;
    });

    // Settings refs
    const initialActuation = ref(2.0);
    const pressTravel = ref(0.1);
    const releaseTravel = ref(0.1);
    const pressDeadzone = ref(0.1);
    const releaseDeadzone = ref(0.1);

    const prevInitialActuation = ref(2.0);
    const prevPressTravel = ref(0.1);
    const prevReleaseTravel = ref(0.1);
    const prevPressDeadzone = ref(0.1);
    const prevReleaseDeadzone = ref(0.1);

    // Link states
    const rtTravelLinked = ref(false);
    const deadZonesLinked = ref(false);

    // Computed bounds with deadzone clamping
    const minInitialActuation = computed(() => Math.max(0.1, pressDeadzone.value));
    const maxInitialActuation = computed(() => Math.min(profileMaxTravel.value, profileMaxTravel.value - releaseDeadzone.value));
    const maxPressTravel = computed(() => profileMaxTravel.value);
    const maxReleaseTravel = computed(() => profileMaxTravel.value);

    const fetchRemappedLabels = async () => {
      if (!layout.value.length || !loaded.value) {
        return;
      }
      try {
        const keyIds = layout.value.flat().map(keyInfo => keyInfo.physicalKeyValue || keyInfo.keyValue);
        const BATCH_SIZE = 80;
        const batches = [];
        for (let i = 0; i < keyIds.length; i += BATCH_SIZE) {
          batches.push(keyIds.slice(i, i + BATCH_SIZE));
        }

        const positionToRemap: { [key: number]: number } = {};
        for (const batch of batches) {
          const currentLayer = await Promise.all(
            batch.map(async (keyId) => {
              try {
                return await KeyboardService.getLayoutKeyInfo([{ key: keyId, layout: 0 }]);
              } catch (error) {
                console.warn(`Failed to fetch layout key info for key ${keyId}:`, error);
                return null;
              }
            })
          );
          currentLayer
            .flat()
            .filter((item): item is { key: number; value: number } => item !== null)
            .forEach(item => {
              if (item.key && item.value !== 0) {
                positionToRemap[item.key] = item.value;
              }
            });
        }

        layout.value.forEach(row => {
          row.forEach(keyInfo => {
            const physicalId = keyInfo.physicalKeyValue || keyInfo.keyValue;
            const remappedValue = positionToRemap[physicalId] || keyInfo.keyValue;
            keyInfo.remappedLabel = keyMap[remappedValue] || `Key ${remappedValue}`;
          });
        });
      } catch (error) {
        console.error('Failed to fetch remapped labels:', error);
        layout.value.forEach(row => {
          row.forEach(keyInfo => {
            keyInfo.remappedLabel = keyMap[keyInfo.keyValue] || `Key ${keyInfo.keyValue}`;
          });
        });
      }
    };

    const selectKey = (key: IDefKeyInfo, rowIdx: number, colIdx: number) => {
      const physicalKeyValue = key.physicalKeyValue || key.keyValue;
      const existingIndex = selectedKeys.value.findIndex(k => (k.physicalKeyValue || k.keyValue) === physicalKeyValue);
      if (existingIndex > -1) {
        selectedKeys.value.splice(existingIndex, 1);
      } else {
        selectedKeys.value.push(key);
      }
    };

    const selectAll = () => {
      const totalKeys = layout.value.flat().length;
      if (selectedKeys.value.length === totalKeys) {
        selectedKeys.value = [];
      } else {
        selectedKeys.value = layout.value.flat();
      }
    };

    const selectWASD = () => {
      const wasdLabels = ['W', 'A', 'S', 'D'];
      const wasdKeys = layout.value
        .flat()
        .filter(keyInfo => {
          const label = keyInfo.remappedLabel || keyMap[keyInfo.keyValue] || `Key ${keyInfo.keyValue}`;
          return wasdLabels.includes(label.toUpperCase());
        });
      const physicalWASD = wasdKeys.map(key => key.physicalKeyValue || key.keyValue);
      const currentlySelectedWASD = selectedKeys.value.filter(k => physicalWASD.includes(k.physicalKeyValue || k.keyValue));
      if (currentlySelectedWASD.length === wasdKeys.length) {
        selectedKeys.value = selectedKeys.value.filter(k => !physicalWASD.includes(k.physicalKeyValue || k.keyValue));
      } else {
        selectedKeys.value = [...selectedKeys.value, ...wasdKeys.filter(key => !selectedKeys.value.some(s => (s.physicalKeyValue || s.keyValue) === (key.physicalKeyValue || key.keyValue)))];
      }
    };

    const selectLetters = () => {
      const letterRegex = /^[A-Z]$/;
      const letterKeys = layout.value
        .flat()
        .filter(keyInfo => {
          const label = keyInfo.remappedLabel || keyMap[keyInfo.keyValue] || `Key ${keyInfo.keyValue}`;
          return letterRegex.test(label.toUpperCase());
        });
      const physicalLetters = letterKeys.map(key => key.physicalKeyValue || key.keyValue);
      const currentlySelectedLetters = selectedKeys.value.filter(k => physicalLetters.includes(k.physicalKeyValue || k.keyValue));
      if (currentlySelectedLetters.length === letterKeys.length) {
        selectedKeys.value = selectedKeys.value.filter(k => !physicalLetters.includes(k.physicalKeyValue || k.keyValue));
      } else {
        selectedKeys.value = [...selectedKeys.value, ...letterKeys.filter(key => !selectedKeys.value.some(s => (s.physicalKeyValue || s.keyValue) === (key.physicalKeyValue || key.keyValue)))];
      }
    };

    const selectNumbers = () => {
      const numberLabels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
      const numberKeys = layout.value
        .flat()
        .filter(keyInfo => {
          const label = keyInfo.remappedLabel || keyMap[keyInfo.keyValue] || `Key ${keyInfo.keyValue}`;
          return numberLabels.includes(label);
        });
      const physicalNumbers = numberKeys.map(key => key.physicalKeyValue || key.keyValue);
      const currentlySelectedNumbers = selectedKeys.value.filter(k => physicalNumbers.includes(k.physicalKeyValue || k.keyValue));
      if (currentlySelectedNumbers.length === numberKeys.length) {
        selectedKeys.value = selectedKeys.value.filter(k => !physicalNumbers.includes(k.physicalKeyValue || k.keyValue));
      } else {
        selectedKeys.value = [...selectedKeys.value, ...numberKeys.filter(key => !selectedKeys.value.some(s => (s.physicalKeyValue || s.keyValue) === (key.physicalKeyValue || key.keyValue)))];
      }
    };

    const selectNone = () => {
      selectedKeys.value = [];
    };

    const setNotification = (message: string, isError: boolean) => {
      notification.value = { message, isError };
      setTimeout(() => {
        notification.value = null;
      }, 5000);
    };

    const updateAllSettings = async () => {
      if (selectedKeys.value.length === 0) return;

      const keys = selectedKeys.value.map(key => key.physicalKeyValue || key.keyValue);

      try {
        await processBatches(keys, async (physicalKeyValue) => {
          await KeyboardService.setPerformanceMode(physicalKeyValue, 'rt', 0);
          await KeyboardService.setSingleTravel(physicalKeyValue, Number(initialActuation.value));
          await KeyboardService.setRtPressTravel(physicalKeyValue, Number(pressTravel.value));
          await KeyboardService.setRtReleaseTravel(physicalKeyValue, Number(releaseTravel.value));
          await KeyboardService.setDp(physicalKeyValue, Number(pressDeadzone.value));
          await KeyboardService.setDr(physicalKeyValue, Number(releaseDeadzone.value));
        });

        await KeyboardService.saveParameters();
        await KeyboardService.reloadParameters();

        prevInitialActuation.value = initialActuation.value;
        prevPressTravel.value = pressTravel.value;
        prevReleaseTravel.value = releaseTravel.value;
        prevPressDeadzone.value = pressDeadzone.value;
        prevReleaseDeadzone.value = releaseDeadzone.value;

        // setNotification('Rapid trigger settings updated successfully', false);
        
        setTimeout(() => updateOverlayData(), 500);
      } catch (error) {
        console.error('Failed to update RT settings:', error);
        setNotification('Failed to update rapid trigger settings', true);
      }
    };

    const loadInitialActuation = async () => {
      if (selectedKeys.value.length === 0) {
        initialActuation.value = 2.0;
        prevInitialActuation.value = 2.0;
        return;
      }

      const physicalKeyValue = selectedKeys.value[0].physicalKeyValue || selectedKeys.value[0].keyValue;
      try {
        const result = await KeyboardService.getSingleTravel(physicalKeyValue);
        if (!(result instanceof Error) && result !== undefined && result !== null) {
          const travelNum = Number(result);
          if (!isNaN(travelNum)) {
            initialActuation.value = Number(travelNum.toFixed(2));
            prevInitialActuation.value = initialActuation.value;
            return;
          }
        }
      } catch (error) {
        console.error('Failed to load initial actuation:', error);
      }

      initialActuation.value = 2.0;
      prevInitialActuation.value = 2.0;
    };

    const loadRTTravel = async () => {
      if (selectedKeys.value.length === 0) {
        pressTravel.value = 0.1;
        releaseTravel.value = 0.1;
        prevPressTravel.value = 0.1;
        prevReleaseTravel.value = 0.1;
        return;
      }

      const physicalKeyValue = selectedKeys.value[0].physicalKeyValue || selectedKeys.value[0].keyValue;
      try {
        const result = await KeyboardService.getRtTravel(physicalKeyValue);
        if (!(result instanceof Error)) {
          pressTravel.value = Number(result.pressTravel.toFixed(2));
          releaseTravel.value = Number(result.releaseTravel.toFixed(2));
          prevPressTravel.value = pressTravel.value;
          prevReleaseTravel.value = releaseTravel.value;
          return;
        }
      } catch (error) {
        console.error('Failed to load RT travel:', error);
      }

      pressTravel.value = 0.1;
      releaseTravel.value = 0.1;
      prevPressTravel.value = 0.1;
      prevReleaseTravel.value = 0.1;
    };

    const loadDeadzones = async () => {
      if (selectedKeys.value.length === 0) {
        pressDeadzone.value = 0.1;
        releaseDeadzone.value = 0.1;
        prevPressDeadzone.value = 0.1;
        prevReleaseDeadzone.value = 0.1;
        return;
      }

      const physicalKeyValue = selectedKeys.value[0].physicalKeyValue || selectedKeys.value[0].keyValue;
      try {
        const result = await KeyboardService.getDpDr(physicalKeyValue);
        if (!(result instanceof Error)) {
          const pressDead = (result as any).pressDead;
          const releaseDead = (result as any).releaseDead;
          
          if (pressDead !== undefined && pressDead !== null) {
            const pressNum = Number(pressDead);
            if (!isNaN(pressNum)) {
              pressDeadzone.value = Number(pressNum.toFixed(2));
            }
          }
          
          if (releaseDead !== undefined && releaseDead !== null) {
            const releaseNum = Number(releaseDead);
            if (!isNaN(releaseNum)) {
              releaseDeadzone.value = Number(releaseNum.toFixed(2));
            }
          }
          
          prevPressDeadzone.value = pressDeadzone.value;
          prevReleaseDeadzone.value = releaseDeadzone.value;
          return;
        }
      } catch (error) {
        console.error('Failed to load deadzones:', error);
      }

      pressDeadzone.value = 0.1;
      releaseDeadzone.value = 0.1;
      prevPressDeadzone.value = 0.1;
      prevReleaseDeadzone.value = 0.1;
    };

    const loadAllSettings = async () => {
      await Promise.all([
        loadInitialActuation(),
        loadRTTravel(),
        loadDeadzones()
      ]);
      
      updateOverlayData();
    };

    const adjustInitialActuation = (delta: number) => {
      const newValue = Math.min(Math.max(initialActuation.value + delta, minInitialActuation.value), maxInitialActuation.value);
      initialActuation.value = Number(newValue.toFixed(2));
      updateAllSettings();
    };

    const adjustPress = (delta: number) => {
      const newValue = Math.min(Math.max(pressTravel.value + delta, 0.1), maxPressTravel.value);
      pressTravel.value = Number(newValue.toFixed(2));
      if (rtTravelLinked.value) {
        releaseTravel.value = pressTravel.value;
      }
      updateAllSettings();
    };

    const adjustRelease = (delta: number) => {
      const newValue = Math.min(Math.max(releaseTravel.value + delta, 0.1), maxReleaseTravel.value);
      releaseTravel.value = Number(newValue.toFixed(2));
      if (rtTravelLinked.value) {
        pressTravel.value = releaseTravel.value;
      }
      updateAllSettings();
    };

    const adjustDeadzone = (delta: number, type: 'press' | 'release') => {
      if (deadZonesLinked.value && type === 'release') return; // Skip if linked
      let newValue = type === 'press' ? pressDeadzone.value + delta : releaseDeadzone.value + delta;
      newValue = Math.min(Math.max(newValue, 0.0), 1.0);
      if (type === 'press') {
        pressDeadzone.value = Number(newValue.toFixed(2));
      } else {
        releaseDeadzone.value = Number(newValue.toFixed(2));
      }
      if (deadZonesLinked.value) {
        const otherType = type === 'press' ? 'release' : 'press';
        (otherType === 'press' ? pressDeadzone : releaseDeadzone).value = Number(newValue.toFixed(2));
      }
      updateAllSettings();
    };

    // Toggle link functions
    const toggleLinkRtTravel = () => {
      rtTravelLinked.value = !rtTravelLinked.value;
      if (rtTravelLinked.value) {
        // Sync to the smaller value to ensure both stay within bounds
        const targetValue = Math.min(pressTravel.value, releaseTravel.value, maxPressTravel.value, maxReleaseTravel.value);
        pressTravel.value = Number(targetValue.toFixed(2));
        releaseTravel.value = Number(targetValue.toFixed(2));
        updateAllSettings();
      }
    };

    const toggleLinkDeadZones = () => {
      deadZonesLinked.value = !deadZonesLinked.value;
      if (deadZonesLinked.value) {
        // Sync to the smaller value to ensure both stay within bounds
        const targetValue = Math.min(pressDeadzone.value, releaseDeadzone.value, 1.0);
        pressDeadzone.value = Number(targetValue.toFixed(2));
        releaseDeadzone.value = Number(targetValue.toFixed(2));
        updateAllSettings();
      }
    };

    const updateOverlayData = async () => {
      try {
        const keyIds = layout.value.flat().map(keyInfo => keyInfo.physicalKeyValue || keyInfo.keyValue);

        await processBatches(keyIds, async (keyId) => {
          try {
            // First check if this key is in RT mode
            const modeResult = await KeyboardService.getPerformanceMode(keyId);
            if (modeResult instanceof Error || modeResult.touchMode !== 'rt') {
              // Not in RT mode, skip this key (don't show overlay)
              delete overlayData.value[keyId];
              return;
            }

            const initialActuationResult = await KeyboardService.getSingleTravel(keyId);
            const rtResult = await KeyboardService.getRtTravel(keyId);
            const dzResult = await KeyboardService.getDpDr(keyId);
            
            if (initialActuationResult instanceof Error || rtResult instanceof Error || dzResult instanceof Error) {
              console.warn(`Failed to fetch RT values for key ${keyId}`);
              return;
            }

            let initialActuationValue = 0.00;
            if (!(initialActuationResult instanceof Error)) {
              initialActuationValue = Number(initialActuationResult);
            }

            let pressValue = 0.00;
            let releaseValue = 0.00;
            if (!(rtResult instanceof Error) && typeof rtResult === 'object' && rtResult !== null) {
              if (typeof rtResult.pressTravel === 'number') {
                pressValue = Number(rtResult.pressTravel.toFixed(2));
              }
              if (typeof rtResult.releaseTravel === 'number') {
                releaseValue = Number(rtResult.releaseTravel.toFixed(2));
              }
            }

            let pressDeadValue = 0.00;
            let releaseDeadValue = 0.00;
            if (!(dzResult instanceof Error) && typeof dzResult === 'object' && dzResult !== null) {
              if (typeof (dzResult as any).pressDead === 'number') {
                pressDeadValue = Number((dzResult as any).pressDead.toFixed(2));
              }
              if (typeof (dzResult as any).releaseDead === 'number') {
                releaseDeadValue = Number((dzResult as any).releaseDead.toFixed(2));
              }
            }

            overlayData.value[keyId] = {
              travel: initialActuationValue.toFixed(2),
              press: pressValue.toFixed(2),
              release: releaseValue.toFixed(2),
              pressDead: pressDeadValue.toFixed(2),
              releaseDead: releaseDeadValue.toFixed(2),
            };
          } catch (fetchError) {
            console.error(`Failed to fetch RT data for ${keyId}:`, fetchError);
          }
        });

        console.log(`[RAPID-TRIGGER] Refreshed overlays for ${keyIds.length} keys`);
      } catch (error) {
        console.error('Failed to update RT overlays:', error);
        setNotification(`Failed to update overlays: ${(error as Error).message}`, true);
      }
    };

    watch(() => selectedKeys.value, async () => {
      await loadAllSettings();
    }, { deep: true });

    watch(loaded, async (newLoaded) => {
      if (newLoaded && layout.value.length > 0) {
        await fetchRemappedLabels();
        await loadAllSettings();
      }
    });

    // Watch RT travel to sync when linked
    watch([pressTravel, releaseTravel], () => {
      if (rtTravelLinked.value) {
        releaseTravel.value = pressTravel.value;
      }
    });

    // Watch deadzones to clamp initialActuation, update keyboard keys, and sync when linked
    watch([pressDeadzone, releaseDeadzone], () => {
      let clamped = false;
      if (initialActuation.value < minInitialActuation.value) {
        initialActuation.value = Number(minInitialActuation.value.toFixed(2));
        clamped = true;
      } else if (initialActuation.value > maxInitialActuation.value) {
        initialActuation.value = Number(maxInitialActuation.value.toFixed(2));
        clamped = true;
      }
      if (deadZonesLinked.value) {
        releaseDeadzone.value = pressDeadzone.value;
      }
      // If clamped, update keyboard keys with new value
      if (clamped && selectedKeys.value.length > 0) {
        updateAllSettings();
      }
    });

    onMounted(async () => {
      await fetchLayerLayout();
      if (loaded.value && layout.value.length > 0) {
        await fetchRemappedLabels();
        await loadAllSettings();
      }
    });

    return {
      selectedKeys,
      notification,
      overlayData,
      layout,
      loaded,
      gridStyle,
      getKeyStyle,
      baseLayout,
      error,
      keyMap,
      profileMaxTravel,
      selectKey,
      selectAll,
      selectWASD,
      selectLetters,
      selectNumbers,
      selectNone,
      initialActuation,
      pressTravel,
      releaseTravel,
      pressDeadzone,
      releaseDeadzone,
      rtTravelLinked,
      deadZonesLinked,
      minInitialActuation,
      maxInitialActuation,
      maxPressTravel,
      maxReleaseTravel,
      updateAllSettings,
      adjustInitialActuation,
      adjustPress,
      adjustRelease,
      adjustDeadzone,
      toggleLinkRtTravel,
      toggleLinkDeadZones,
    };
  },
});
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@styles/variables' as v;

.rapid-trigger-page {
  padding: 20px;
  color: v.$text-color;
  height: 100%;
  display: flex;
  flex-direction: column;

  .title {
    width: 500px;
    color: v.$primary-color;
    margin-bottom: 10px;
    margin-top: 0px;
    font-size: 1.5rem;
    font-weight: 600;
    font-family: v.$font-style;
  }

  .notification {
    padding: 10px;
    margin-bottom: 0px;
    border-radius: v.$border-radius;
    background-color: rgba(v.$background-dark, 1.1);
    color: v.$text-color;
    display: flex;
    align-items: center;

    &.error {
      background-color: color.mix(#ef4444, v.$background-dark, 50%);
    }

    .dismiss-btn {
      margin-left: 10px;
      padding: 0 6px;
      background: none;
      border: none;
      color: v.$text-color;
      cursor: pointer;
      font-size: 1rem;
      font-family: v.$font-style;

      &:hover {
        color: rgba(v.$text-color, 0.6);
      }
    }
  }

  .rapid-trigger-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .no-layout {
    text-align: center;
    color: v.$text-color;
    font-size: 1rem;
    font-family: v.$font-style;
    padding: 20px;
  }

  .key-grid {
    display: block !important;
    position: relative;
    width: fit-content;
    margin: 0 auto;
    min-height: 300px;
    max-height: 500px;
    flex-shrink: 0;
    visibility: visible !important;
    z-index: 1;
  }

  .key-row {
    display: contents;
  }

  .key-btn {
    position: absolute;
    padding: 4px;
    border: v.$border-style;
    border-radius: v.$border-radius;
    background: linear-gradient(to bottom, v.$background-dark 70%, color.adjust(v.$background-dark, $lightness: 10%) 100%);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2), inset 0 -2px 4px rgba(255, 255, 255, 0.2);
    color: v.$text-color;
    cursor: pointer;
    transition: all 0.2s ease;
    box-sizing: border-box;
    user-select: none;
    text-align: center;
    font-family: v.$font-style;
    visibility: visible !important;
    z-index: 2;
    position: relative;

    &.rt-key-selected {
      border-color: v.$accent-color;
      box-shadow: 0 0 8px rgba(v.$accent-color, 0.5);
    }

    .key-label {
      position: absolute;
      top: 2px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 1rem;
      font-weight: 300;
    }

    .overlay {
      position: absolute !important;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      font-size: 0.75rem;
      background-color: transparent;
      padding: 0px 0px;
      border-radius: 3px;
      pointer-events: none;

      .overlay-values {
        width: 100%;
        height: 100%;
        position: relative;
      }

      .overlay-center {
        font-size: 0.8rem;
        font-weight: bold;
        color: rgba(5, 205, 165, 0.684) !important;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
      }

      .overlay-top-left {
        font-size: 0.7rem;
        font-weight: bold;
        color: rgba(255, 43, 79, 0.548) !important;
        position: absolute;
        top: 5px;
        left: calc(50% - 30px);
        text-align: left;
      }

      .overlay-top-right {
        font-size: 0.7rem;
        font-weight: bold;
        color: rgba(33, 150, 243, 0.8) !important;
        position: absolute;
        top: 5px;
        right: calc(50% - 30px);
        text-align: right;
      }

      .overlay-bottom-left {
        font-size: 0.7rem;
        font-weight: bold;
        color: green !important;
        position: absolute;
        bottom: 10px;
        left: calc(50% - 25px);
        text-align: left;
      }

      .overlay-bottom-right {
        font-size: 0.7rem;
        font-weight: bold;
        color: rgba(255, 140, 0, 0.679) !important;
        position: absolute;
        bottom: 10px;
        right: calc(50% - 25px);
        text-align: right;
      }
    }
  }

  .bottom-section {
    display: flex;
    flex: 1;
    flex-shrink: 0;
    gap: 10px;
    position: relative;
    margin-right: auto;
    margin-left: auto;
    margin-top: -50px;
    justify-content: center;
  }

  .selection-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;

    .select-btn {
      padding: 8px 8px;
      background-color: color.adjust(v.$background-dark, $lightness: -100%);
      color: v.$accent-color;
      border: v.$border-style;
      border-radius: v.$border-radius;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 200px;
      transition: background-color 0.2s ease;
      width: 120px;
      text-align: center;
      font-family: v.$font-style;

      &:hover {
        background-color: color.adjust(v.$background-dark, $lightness: 10%);
      }
    }
  }

  .settings-panel {
    width: 1425px;
    padding: 10px;
    border: 1px solid rgba(v.$text-color, 0.2);
    border-radius: v.$border-radius;
    background-color: color.adjust(v.$background-dark, $lightness: -100%);

    .settings-section {
      flex-shrink: 0;
      border: 1px solid rgba(v.$text-color, 0.2);
      padding: 15px;
      margin-bottom: 10px;
    }

    .header-row {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
      font-family: v.$font-style;
    }

    h3 {
      color: v.$primary-color;
      width: auto;
      font-size: 1.5rem;
      margin: 0;
      margin-bottom: -5px;
      margin-right: 10px;
      font-weight: 400;
    }

    .travel-row {
      display: flex;
      gap: 0px;
      margin-bottom: 0px;
      align-items: center;
      font-family: v.$font-style;
    }

    .rt-travel-group {
      display: flex;
      flex-direction: row;
      gap: 15px;
      margin-bottom: 0px;
      align-items: center;
    }

    .deadzone-group {
      display: flex;
      flex-direction: row;
      gap: 15px;
      margin-bottom: 20px;
      align-items: center;
    }

    .link-container {
      display: flex;
      width: 50px;
      justify-content: center;
      align-items: center;
      margin: 0;
      padding: 10px;
      padding-bottom: 20px;

      .link-btn {
        padding: 6px 12px;
        background-color: color.adjust(v.$background-dark, $lightness: -100%);
        color: v.$accent-color;
        border: v.$border-style;
        border-radius: v.$border-radius;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 400;
        height: 32px;
        transition: background-color 0.2s ease;
        font-family: v.$font-style;
        white-space: nowrap;

        &:hover {
          background-color: color.adjust(v.$background-dark, $lightness: 10%);
        }
      }
    }

    .input-group {
      display: flex;
      align-items: center;
      gap: 0px;
      margin-bottom: 10px;
      padding: 10px;
      width: 600px;
      height: 30px;
      border: v.$border-style;
      border-radius: v.$border-radius;
      background-color: rgba(v.$background-dark, 0.5);
      font-family: v.$font-style;

      .label {
        min-width: 180px;
        text-align: center;
        color: v.$text-color;
        font-size: 0.95rem;
        font-weight: 300;

        .initial-trigger-unit {
          color: rgba(5, 205, 165, 0.684);
          font-weight: 500;
        }

        .key-retrigger-unit {
          color: rgba(255, 43, 79, 0.548);
          font-weight: 500;
        }

        .key-reset-unit {
          color: rgba(33, 150, 243, 0.8);
          font-weight: 500;
        }

        .top-deadzone-unit {
          color: green;
          font-weight: 500;
        }

        .bottom-deadzone-unit {
          color: rgba(255, 140, 0, 0.679);
          font-weight: 500;
        }
      }

      .slider-container {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 0px;

        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          flex: 1;
          max-width: 200px;
          cursor: pointer;
          height: 6px;
          background: transparent;

          &::-webkit-slider-runnable-track {
            background-color: color.adjust(v.$background-dark, $lightness: 10%);
            height: 6px;
            border-radius: 3px;
          }

          &::-webkit-slider-thumb {
            appearance: none;
            opacity: 1;
            width: 12px;
            height: 12px;
            border-radius: 4%;
            background-color: v.$primary-color;
            cursor: pointer;
            margin-top: -3px;
          }
        }
        
        .value-display {
          min-width: 60px;
          color: v.$accent-color;
          font-size: 0.95rem;
          font-weight: 500;
          text-align: center;
        }
      }

      .adjusters {
        display: flex;
        align-items: center;
        gap: 4px;

        input[type="number"] {
          width: 60px;
          padding: 4px 6px;
          border-radius: v.$border-radius;
          background-color: v.$background-dark;
          color: v.$text-color;
          border: 1px solid rgba(v.$text-color, 0.2);
          font-size: 0.9rem;
          text-align: center;

          &:focus {
            outline: none;
            box-shadow: 0 0 0 2px rgba(v.$accent-color, 0.3);
          }
        }

        .adjust-btn {
          width: 20px;
          height: 20px;
          border: none;
          border-radius: 4%;
          background-color: rgba(v.$text-color, 0.2);
          color: v.$text-color;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 400;
          padding: 0px;
          transition: background-color 0.2s ease;

          &:hover:not(:disabled) {
            background-color: rgba(v.$accent-color, 0.3);
          }

          &:disabled {
            opacity: 0.4;
            cursor: not-allowed;
          }
        }
      }
    }
  }
}
</style>

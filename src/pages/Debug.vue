<template>
  <div class="debug-page">
    <h2 class="title">Lighting Debug & Testing</h2>
    <div v-if="notification" class="notification" :class="{ error: notification.isError }">
      {{ notification.message }}
      <button @click="notification = null" class="dismiss-btn">&times;</button>
    </div>

    <div class="lighting-container">
      <!-- Section 1: Toggle Lighting On/Off -->
      <div class="settings-section">
        <h3>Master Lighting Control</h3>
        <div class="toggle-row">
          <label class="toggle-label">Lighting</label>
          <div class="toggle-switch" @click="toggleLighting">
            <div class="toggle-slider" :class="{ active: lightingEnabled }">
              <span class="toggle-text">{{ lightingEnabled ? 'ON' : 'OFF' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 2: Global Lighting Controls -->
      <div class="settings-section">
        <h3>Global Lighting</h3>
        <div class="control-row">
          <label>Mode</label>
          <select v-model="globalLighting.mode" class="mode-select" :disabled="!lightingEnabled">
            <option value="static">Static</option>
            <option value="breathing">Breathing</option>
            <option value="wave">Wave</option>
            <option value="reactive">Reactive</option>
            <option value="ripple">Ripple</option>
            <option value="rainbow">Rainbow</option>
          </select>
        </div>
        
        <div class="control-row">
          <label>Brightness ({{ globalLighting.brightness }})</label>
          <input 
            type="range" 
            v-model.number="globalLighting.brightness" 
            min="0" 
            max="100" 
            :disabled="!lightingEnabled"
            class="slider"
          />
        </div>

        <div class="control-row">
          <label>Speed ({{ globalLighting.speed }})</label>
          <input 
            type="range" 
            v-model.number="globalLighting.speed" 
            min="0" 
            max="100" 
            :disabled="!lightingEnabled"
            class="slider"
          />
        </div>

        <div class="control-row">
          <label>Color</label>
          <div class="color-inputs">
            <div class="color-input-group">
              <label>R</label>
              <input type="number" v-model.number="globalLighting.color.r" min="0" max="255" :disabled="!lightingEnabled" />
            </div>
            <div class="color-input-group">
              <label>G</label>
              <input type="number" v-model.number="globalLighting.color.g" min="0" max="255" :disabled="!lightingEnabled" />
            </div>
            <div class="color-input-group">
              <label>B</label>
              <input type="number" v-model.number="globalLighting.color.b" min="0" max="255" :disabled="!lightingEnabled" />
            </div>
            <div class="color-preview" :style="{ backgroundColor: `rgb(${globalLighting.color.r}, ${globalLighting.color.g}, ${globalLighting.color.b})` }"></div>
          </div>
        </div>

        <div class="button-row">
          <button @click="applyGlobalLighting" class="apply-btn" :disabled="!lightingEnabled">Apply Global Lighting</button>
          <button @click="fetchGlobalLighting" class="fetch-btn">Fetch Current</button>
        </div>
      </div>

      <!-- Section 3: Logo Lighting -->
      <div class="settings-section">
        <h3>Logo Lighting</h3>
        <div class="control-row">
          <label>Mode</label>
          <select v-model="logoLighting.mode" class="mode-select" :disabled="!lightingEnabled">
            <option value="static">Static</option>
            <option value="breathing">Breathing</option>
            <option value="off">Off</option>
          </select>
        </div>

        <div class="control-row">
          <label>Color</label>
          <div class="color-inputs">
            <div class="color-input-group">
              <label>R</label>
              <input type="number" v-model.number="logoLighting.color.r" min="0" max="255" :disabled="!lightingEnabled" />
            </div>
            <div class="color-input-group">
              <label>G</label>
              <input type="number" v-model.number="logoLighting.color.g" min="0" max="255" :disabled="!lightingEnabled" />
            </div>
            <div class="color-input-group">
              <label>B</label>
              <input type="number" v-model.number="logoLighting.color.b" min="0" max="255" :disabled="!lightingEnabled" />
            </div>
            <div class="color-preview" :style="{ backgroundColor: `rgb(${logoLighting.color.r}, ${logoLighting.color.g}, ${logoLighting.color.b})` }"></div>
          </div>
        </div>

        <div class="button-row">
          <button @click="applyLogoLighting" class="apply-btn" :disabled="!lightingEnabled">Apply Logo Lighting</button>
          <button @click="fetchLogoLighting" class="fetch-btn">Fetch Current</button>
        </div>
      </div>

      <!-- Section 4: Custom Per-Key Lighting -->
      <div class="settings-section">
        <h3>Custom Per-Key Lighting</h3>
        <div class="control-row">
          <label>Key Number</label>
          <input 
            type="number" 
            v-model.number="customLighting.keyNumber" 
            min="1" 
            max="255" 
            :disabled="!lightingEnabled"
          />
        </div>

        <div class="control-row">
          <label>Color</label>
          <div class="color-inputs">
            <div class="color-input-group">
              <label>R</label>
              <input type="number" v-model.number="customLighting.color.r" min="0" max="255" :disabled="!lightingEnabled" />
            </div>
            <div class="color-input-group">
              <label>G</label>
              <input type="number" v-model.number="customLighting.color.g" min="0" max="255" :disabled="!lightingEnabled" />
            </div>
            <div class="color-input-group">
              <label>B</label>
              <input type="number" v-model.number="customLighting.color.b" min="0" max="255" :disabled="!lightingEnabled" />
            </div>
            <div class="color-preview" :style="{ backgroundColor: `rgb(${customLighting.color.r}, ${customLighting.color.g}, ${customLighting.color.b})` }"></div>
          </div>
        </div>

        <div class="button-row">
          <button @click="applyCustomLighting" class="apply-btn" :disabled="!lightingEnabled">Apply Custom Lighting</button>
          <button @click="saveCustomLighting" class="save-btn" :disabled="!lightingEnabled">Save to Firmware</button>
          <button @click="fetchCustomLighting" class="fetch-btn">Fetch Key Color</button>
        </div>
      </div>

      <!-- Section 5: Special Effects -->
      <div class="settings-section">
        <h3>Special Effects</h3>
        <div class="control-row">
          <label>Effect Mode</label>
          <select v-model="specialLighting.mode" class="mode-select" :disabled="!lightingEnabled">
            <option value="reactive">Reactive</option>
            <option value="ripple">Ripple</option>
            <option value="starlight">Starlight</option>
          </select>
        </div>

        <div class="control-row">
          <label>Brightness ({{ specialLighting.brightness }})</label>
          <input 
            type="range" 
            v-model.number="specialLighting.brightness" 
            min="0" 
            max="100" 
            :disabled="!lightingEnabled"
            class="slider"
          />
        </div>

        <div class="control-row">
          <label>Speed ({{ specialLighting.speed }})</label>
          <input 
            type="range" 
            v-model.number="specialLighting.speed" 
            min="0" 
            max="100" 
            :disabled="!lightingEnabled"
            class="slider"
          />
        </div>

        <div class="button-row">
          <button @click="applySpecialLighting" class="apply-btn" :disabled="!lightingEnabled">Apply Special Effect</button>
          <button @click="fetchSpecialLighting" class="fetch-btn">Fetch Current</button>
        </div>
      </div>

      <!-- Section 6: Saturation Control -->
      <div class="settings-section">
        <h3>Saturation Control</h3>
        <div class="control-row">
          <label>Saturation ({{ saturation }}%)</label>
          <input 
            type="range" 
            v-model.number="saturation" 
            min="0" 
            max="100" 
            :disabled="!lightingEnabled"
            class="slider"
          />
        </div>

        <div class="button-row">
          <button @click="applySaturation" class="apply-btn" :disabled="!lightingEnabled">Apply Saturation</button>
          <button @click="fetchSaturation" class="fetch-btn">Fetch Current</button>
        </div>
      </div>

      <!-- Debug Output Section -->
      <div class="settings-section">
        <h3>Debug Output</h3>
        <div class="debug-output">
          <pre>{{ debugOutput }}</pre>
        </div>
        <button @click="clearDebugOutput" class="clear-btn">Clear Output</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import debugKeyboardService from '@services/DebugKeyboardService';

export default defineComponent({
  name: 'Debug',
  setup() {
    const notification = ref<{ message: string; isError: boolean } | null>(null);
    const lightingEnabled = ref(true);
    const debugOutput = ref('Lighting Debug Console\n-------------------\n');

    const globalLighting = ref({
      mode: 'static',
      brightness: 80,
      speed: 50,
      color: { r: 255, g: 255, b: 255 }
    });

    const logoLighting = ref({
      mode: 'static',
      color: { r: 255, g: 0, b: 255 }
    });

    const customLighting = ref({
      keyNumber: 4,
      color: { r: 255, g: 0, b: 0 }
    });

    const specialLighting = ref({
      mode: 'reactive',
      brightness: 80,
      speed: 50
    });

    const saturation = ref(100);

    const savedLightingState = ref<any>(null);

    const log = (message: string) => {
      const timestamp = new Date().toLocaleTimeString();
      debugOutput.value += `[${timestamp}] ${message}\n`;
    };

    const setNotification = (message: string, isError: boolean) => {
      notification.value = { message, isError };
      setTimeout(() => {
        notification.value = null;
      }, 5000);
    };

    const toggleLighting = async () => {
      try {
        if (lightingEnabled.value) {
          log('Turning off all lighting...');
          savedLightingState.value = { ...globalLighting.value };
          await debugKeyboardService.closedLighting();
          lightingEnabled.value = false;
          setNotification('Lighting turned OFF', false);
          log('Lighting turned OFF successfully');
        } else {
          log('Turning on lighting...');
          lightingEnabled.value = true;
          if (savedLightingState.value) {
            globalLighting.value = { ...savedLightingState.value };
            await debugKeyboardService.setLighting(globalLighting.value);
            log('Restored previous lighting settings');
          }
          setNotification('Lighting turned ON', false);
          log('Lighting turned ON successfully');
        }
      } catch (error) {
        log(`ERROR: ${(error as Error).message}`);
        setNotification('Failed to toggle lighting', true);
      }
    };

    const applyGlobalLighting = async () => {
      try {
        log(`Applying global lighting: ${JSON.stringify(globalLighting.value)}`);
        await debugKeyboardService.setLighting(globalLighting.value);
        setNotification('Global lighting applied successfully', false);
        log('Global lighting applied successfully');
      } catch (error) {
        log(`ERROR: ${(error as Error).message}`);
        setNotification('Failed to apply global lighting', true);
      }
    };

    const fetchGlobalLighting = async () => {
      try {
        log('Fetching current global lighting...');
        const result = await debugKeyboardService.getLighting();
        log(`Current global lighting: ${JSON.stringify(result)}`);
        if (result.mode) globalLighting.value.mode = result.mode;
        if (result.brightness !== undefined) globalLighting.value.brightness = result.brightness;
        if (result.speed !== undefined) globalLighting.value.speed = result.speed;
        if (result.color) globalLighting.value.color = result.color;
        setNotification('Global lighting fetched', false);
      } catch (error) {
        log(`ERROR: ${(error as Error).message}`);
        setNotification('Failed to fetch global lighting', true);
      }
    };

    const applyLogoLighting = async () => {
      try {
        log(`Applying logo lighting: ${JSON.stringify(logoLighting.value)}`);
        await debugKeyboardService.setLogoLighting(logoLighting.value);
        setNotification('Logo lighting applied successfully', false);
        log('Logo lighting applied successfully');
      } catch (error) {
        log(`ERROR: ${(error as Error).message}`);
        setNotification('Failed to apply logo lighting', true);
      }
    };

    const fetchLogoLighting = async () => {
      try {
        log('Fetching current logo lighting...');
        const result = await debugKeyboardService.getLogoLighting();
        log(`Current logo lighting: ${JSON.stringify(result)}`);
        if (result.mode) logoLighting.value.mode = result.mode;
        if (result.color) logoLighting.value.color = result.color;
        setNotification('Logo lighting fetched', false);
      } catch (error) {
        log(`ERROR: ${(error as Error).message}`);
        setNotification('Failed to fetch logo lighting', true);
      }
    };

    const applyCustomLighting = async () => {
      try {
        const param = {
          keys: [{
            key: customLighting.value.keyNumber,
            r: customLighting.value.color.r,
            g: customLighting.value.color.g,
            b: customLighting.value.color.b
          }]
        };
        log(`Applying custom lighting: ${JSON.stringify(param)}`);
        await debugKeyboardService.setCustomLighting(param);
        setNotification('Custom lighting applied successfully', false);
        log('Custom lighting applied successfully');
      } catch (error) {
        log(`ERROR: ${(error as Error).message}`);
        setNotification('Failed to apply custom lighting', true);
      }
    };

    const saveCustomLighting = async () => {
      try {
        log('Saving custom lighting to firmware...');
        await debugKeyboardService.saveCustomLighting();
        setNotification('Custom lighting saved to firmware', false);
        log('Custom lighting saved to firmware successfully');
      } catch (error) {
        log(`ERROR: ${(error as Error).message}`);
        setNotification('Failed to save custom lighting', true);
      }
    };

    const fetchCustomLighting = async () => {
      try {
        log(`Fetching custom lighting for key ${customLighting.value.keyNumber}...`);
        const result = await debugKeyboardService.getCustomLighting(customLighting.value.keyNumber);
        log(`Custom lighting for key ${customLighting.value.keyNumber}: ${JSON.stringify(result)}`);
        setNotification('Custom lighting fetched', false);
      } catch (error) {
        log(`ERROR: ${(error as Error).message}`);
        setNotification('Failed to fetch custom lighting', true);
      }
    };

    const applySpecialLighting = async () => {
      try {
        log(`Applying special lighting: ${JSON.stringify(specialLighting.value)}`);
        await debugKeyboardService.setSpecialLighting(specialLighting.value);
        setNotification('Special lighting applied successfully', false);
        log('Special lighting applied successfully');
      } catch (error) {
        log(`ERROR: ${(error as Error).message}`);
        setNotification('Failed to apply special lighting', true);
      }
    };

    const fetchSpecialLighting = async () => {
      try {
        log('Fetching current special lighting...');
        const result = await debugKeyboardService.getSpecialLighting();
        log(`Current special lighting: ${JSON.stringify(result)}`);
        if (result.mode) specialLighting.value.mode = result.mode;
        if (result.brightness !== undefined) specialLighting.value.brightness = result.brightness;
        if (result.speed !== undefined) specialLighting.value.speed = result.speed;
        setNotification('Special lighting fetched', false);
      } catch (error) {
        log(`ERROR: ${(error as Error).message}`);
        setNotification('Failed to fetch special lighting', true);
      }
    };

    const applySaturation = async () => {
      try {
        log(`Applying saturation: ${saturation.value}%`);
        await debugKeyboardService.setLightingSaturation([saturation.value]);
        setNotification('Saturation applied successfully', false);
        log('Saturation applied successfully');
      } catch (error) {
        log(`ERROR: ${(error as Error).message}`);
        setNotification('Failed to apply saturation', true);
      }
    };

    const fetchSaturation = async () => {
      try {
        log('Fetching current saturation...');
        const result = await debugKeyboardService.getSaturation();
        log(`Current saturation: ${JSON.stringify(result)}`);
        if (result.saturation !== undefined) saturation.value = result.saturation;
        setNotification('Saturation fetched', false);
      } catch (error) {
        log(`ERROR: ${(error as Error).message}`);
        setNotification('Failed to fetch saturation', true);
      }
    };

    const clearDebugOutput = () => {
      debugOutput.value = 'Lighting Debug Console\n-------------------\n';
    };

    onMounted(async () => {
      log('Debug page mounted, attempting connection...');
      try {
        await debugKeyboardService.autoConnect();
        log('Debug service connected successfully');
      } catch (error) {
        log(`Auto-connect failed: ${(error as Error).message}`);
        try {
          await debugKeyboardService.requestDevice();
          log('Debug service connected via user prompt');
        } catch (promptError) {
          log(`Connection failed: ${(promptError as Error).message}`);
          setNotification('Debug connection failed', true);
        }
      }
    });

    return {
      notification,
      lightingEnabled,
      globalLighting,
      logoLighting,
      customLighting,
      specialLighting,
      saturation,
      debugOutput,
      toggleLighting,
      applyGlobalLighting,
      fetchGlobalLighting,
      applyLogoLighting,
      fetchLogoLighting,
      applyCustomLighting,
      saveCustomLighting,
      fetchCustomLighting,
      applySpecialLighting,
      fetchSpecialLighting,
      applySaturation,
      fetchSaturation,
      clearDebugOutput,
    };
  },
});
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@styles/variables' as v;

.debug-page {
  padding: 20px;
  color: v.$text-color;
  max-width: 1200px;
  margin: 0 auto;

  .title {
    color: v.$primary-color;
    margin-bottom: 20px;
    font-size: 1.5rem;
    font-weight: 700;
  }
}

.notification {
  padding: 10px 15px;
  margin-bottom: 16px;
  border-radius: v.$border-radius;
  background-color: rgba(34, 197, 94, 0.2);
  color: v.$text-color;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &.error {
    background-color: rgba(239, 68, 68, 0.2);
  }

  .dismiss-btn {
    padding: 0 8px;
    background: none;
    border: none;
    color: v.$text-color;
    cursor: pointer;
    font-size: 1.2rem;

    &:hover {
      opacity: 0.7;
    }
  }
}

.lighting-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-section {
  background: rgba(v.$background-dark, 0.5);
  border: 1px solid rgba(v.$text-color, 0.1);
  border-radius: v.$border-radius;
  padding: 20px;

  h3 {
    color: v.$primary-color;
    margin: 0 0 15px 0;
    font-size: 1.2rem;
    font-weight: 600;
  }
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: 20px;

  .toggle-label {
    font-size: 1rem;
    font-weight: 500;
  }

  .toggle-switch {
    width: 80px;
    height: 36px;
    background: rgba(v.$text-color, 0.2);
    border-radius: 18px;
    cursor: pointer;
    position: relative;
    transition: background 0.3s;

    .toggle-slider {
      position: absolute;
      width: 70px;
      height: 30px;
      background: #6b7280;
      border-radius: 15px;
      top: 3px;
      left: 3px;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;

      .toggle-text {
        font-size: 0.75rem;
        font-weight: 700;
        color: white;
      }

      &.active {
        background: v.$accent-color;
      }
    }
  }
}

.control-row {
  margin-bottom: 15px;

  label {
    display: block;
    margin-bottom: 8px;
    font-size: 0.9rem;
    color: v.$text-color;
  }

  .mode-select {
    width: 100%;
    padding: 8px 12px;
    background: rgba(v.$background-dark, 0.8);
    border: 1px solid rgba(v.$text-color, 0.3);
    border-radius: v.$border-radius;
    color: v.$text-color;
    font-size: 0.9rem;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .slider {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: rgba(v.$text-color, 0.2);
    outline: none;

    &::-webkit-slider-thumb {
      appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: v.$accent-color;
      cursor: pointer;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  input[type="number"] {
    width: 100%;
    padding: 8px 12px;
    background: rgba(v.$background-dark, 0.8);
    border: 1px solid rgba(v.$text-color, 0.3);
    border-radius: v.$border-radius;
    color: v.$text-color;
    font-size: 0.9rem;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.color-inputs {
  display: flex;
  gap: 10px;
  align-items: center;

  .color-input-group {
    display: flex;
    flex-direction: column;
    gap: 5px;

    label {
      margin: 0;
      font-size: 0.75rem;
      color: v.$text-color;
    }

    input {
      width: 60px;
      padding: 6px;
      background: rgba(v.$background-dark, 0.8);
      border: 1px solid rgba(v.$text-color, 0.3);
      border-radius: v.$border-radius;
      color: v.$text-color;
      font-size: 0.85rem;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }

  .color-preview {
    width: 50px;
    height: 50px;
    border-radius: v.$border-radius;
    border: 2px solid rgba(v.$text-color, 0.3);
  }
}

.button-row {
  display: flex;
  gap: 10px;
  margin-top: 15px;

  button {
    padding: 10px 20px;
    border: none;
    border-radius: v.$border-radius;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .apply-btn {
    background: v.$accent-color;
    color: v.$background-dark;

    &:hover:not(:disabled) {
      background: color.adjust(v.$accent-color, $lightness: 10%);
    }
  }

  .fetch-btn {
    background: v.$primary-color;
    color: v.$background-dark;

    &:hover:not(:disabled) {
      background: color.adjust(v.$primary-color, $lightness: 10%);
    }
  }

  .save-btn {
    background: #10b981;
    color: white;

    &:hover:not(:disabled) {
      background: color.adjust(#10b981, $lightness: 10%);
    }
  }

  .clear-btn {
    background: #6b7280;
    color: white;

    &:hover:not(:disabled) {
      background: color.adjust(#6b7280, $lightness: 10%);
    }
  }
}

.debug-output {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(v.$text-color, 0.2);
  border-radius: v.$border-radius;
  padding: 15px;
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 10px;

  pre {
    margin: 0;
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
    color: v.$text-color;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
}
</style>

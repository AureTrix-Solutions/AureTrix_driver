<template>
  <div class="app-container">
    <aside class="sidebar">
      <div class="sidebar-header">
        <img src="@/assets/logo cropped.svg" alt="Keyboard Driver Logo" class="logo">
        <div v-if="connectionStore.status" class="status">
          <ul v-if="connectionStore.isInitialized && isStatusReady">
            <li>Connected: {{ connectionStore.deviceInfo?.productName || 'Unknown Device' }}</li>
            <li>SN: {{ decodeString(connectionStore.deviceInfo?.KeyboardSN) || 'N/A' }}</li>
            <li v-if="connectionStore.deviceInfo?.BoardID">Board ID: {{ connectionStore.deviceInfo.BoardID }}</li>
            <li v-if="connectionStore.deviceInfo?.appVersion">Version: {{
              decodeString(connectionStore.deviceInfo?.appVersion) || 'N/A' }}</li>
          </ul>
          <ul v-else-if="connectionStore.isInitializing">
            <li>Initializing keyboard...</li>
          </ul>
          <ul v-else-if="connectionStore.initializationError">
            <li style="color: #ff6b6b;">Initialization failed: {{ connectionStore.initializationError }}</li>
            <li style="font-size: 0.9em;">Try reconnecting your keyboard</li>
          </ul>
          <ul v-else-if="connectionStore.isConnected">
            <li>Loading device info...</li>
          </ul>
          <p v-else>{{ connectionStore.status }}</p>
        </div>
      </div>
      <nav class="sidebar-nav">
        <div class="main-nav-section">
          <div class="main-nav-separator-top"></div>
          <div class="main-nav-header">
            <span class="main-nav-title">Main</span>
            <div class="main-nav-separator"></div>
          </div>
          <template v-for="item in menuItems" :key="item.name">
            <router-link v-if="!item.isCategory" :to="item.path" class="nav-item">
              {{ item.name }}
            </router-link>
            <div v-else class="nav-item category-header" @click="handleCategoryClick(item, $event)">
              {{ item.name }}
              <span class="arrow" :class="{ open: openCategory === item }">></span>
            </div>
          </template>
          <div class="main-nav-separator-bottom"></div>
        </div>

        <div class="profiles-section">
          <div class="profiles-header">
            <span class="profiles-title">Profiles</span>
            <div class="profiles-separator"></div>
          </div>
          <div class="profile-grid">
            <button v-for="profile in profileStore.profiles" :key="profile.id" class="profile-btn"
              :class="{ active: profileStore.activeProfileId === profile.id }" @click="handleProfileClick(profile.id)">
              <input v-if="editingProfileId === profile.id" v-model="editingProfileName" @blur="finishEditing"
                @keyup.enter="finishEditing" @keyup.esc="cancelEditing" class="profile-name-input"
                :ref="`profileInput-${profile.id}`" @click.stop />
              <span v-else class="profile-name">{{ profile.name }}</span>
              <span v-if="editingProfileId !== profile.id" class="edit-icon" @click.stop="startEditing(profile.id)"
                role="button" tabindex="0" @keyup.enter="startEditing(profile.id)" aria-label="Edit profile name">
                ✏️
              </span>
            </button>
          </div>
        </div>
        
        <button class="export-btn" @click="exportProfile" :disabled="!connectionStore.isInitialized">
          Export Profile
        </button>
        <button class="import-btn" @click="importProfile" :disabled="!connectionStore.isInitialized">
          Import Profile
        </button>
        <button class="debug-export-btn" @click="exportProfileDebug" :disabled="!connectionStore.isInitialized">
          Debug Export JSON
        </button>
        <div class="import-separator"></div>

        <div class="quick-settings-section">
          <div class="quick-settings-header">
            <span class="quick-settings-title">Quick Settings</span>
            <div class="quick-settings-separator"></div>
          </div>
          <div class="nav-item category-header" @click="handleQuickSettingsClick('pollingRate', $event)">
            Polling Rate
            <span class="arrow" :class="{ open: openQuickSettings === 'pollingRate' }">></span>
          </div>
          <div class="nav-item category-header" @click="handleQuickSettingsClick('systemMode', $event)">
            System Mode
            <span class="arrow" :class="{ open: openQuickSettings === 'systemMode' }">></span>
          </div>
          <button class="factory-reset-btn" @click="showFactoryResetModal" :disabled="!connectionStore.isInitialized">
            Factory Reset
          </button>
        </div>
      </nav>
      <p class="copyright">Copyright©2025 AureTrix</p>
    </aside>

    <div v-if="openCategory" class="flyout-menu" :style="{ top: flyoutTop + 'px' }" @click.self="closeCategory">
      <div class="flyout-content">
        <nav class="flyout-nav">
          <router-link v-for="sub in openCategory.items" :key="sub.name" :to="sub.path" class="flyout-item"
            @click="closeCategory">
            <span class="flyout-item-text">{{ sub.name }}</span>
            <span v-if="sub.tooltip" class="help-icon" 
              @mouseenter="showTooltip(sub.tooltip, $event)"
              @mouseleave="hideTooltip"
              @click.stop.prevent>
              ?
            </span>
          </router-link>
        </nav>
      </div>
    </div>

    <div v-if="activeTooltip" class="tooltip-flyout" :style="{ top: tooltipTop + 'px' }">
      <div class="tooltip-flyout-content">
        {{ activeTooltip }}
      </div>
    </div>

    <div v-if="openQuickSettings === 'pollingRate'" class="flyout-menu" :style="{ top: quickSettingsFlyoutTop + 'px' }" @click.self="closeQuickSettings">
      <div class="flyout-content">
        <div class="quick-setting-item">
          <select v-model.number="currentPollingRate" @change="handlePollingRateChange" class="polling-rate-select">
            <option v-for="option in pollingRateOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="openQuickSettings === 'systemMode'" class="flyout-menu" :style="{ top: quickSettingsFlyoutTop + 'px' }" @click.self="closeQuickSettings">
      <div class="flyout-content">
        <div class="quick-setting-item">
          <select v-model="currentSystemMode" @change="handleSystemModeChange" class="polling-rate-select">
            <option v-for="option in systemModeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <FactoryResetModal v-if="isFactoryResetModalVisible" @confirm="handleFactoryReset" @cancel="hideFactoryResetModal" />

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, nextTick } from 'vue';
import { RouterLink, RouterView } from 'vue-router';
import { useConnectionStore } from './store/connection';
import { useProfileStore } from './store/profileStore';
import KeyboardService from './services/KeyboardService';
import ExportService from './services/ExportService';
import FactoryResetModal from './components/FactoryResetModal.vue';

const POLLING_RATE_OPTIONS = [
  { value: 0, label: '8KHz' },
  { value: 1, label: '4KHz' },
  { value: 2, label: '2KHz' },
  { value: 3, label: '1KHz' },
  { value: 4, label: '500Hz' },
  { value: 5, label: '250Hz' },
  { value: 6, label: '125Hz' },
];

const SYSTEM_MODE_OPTIONS = [
  { value: 'win', label: 'Windows' },
  { value: 'mac', label: 'Mac' },
];

export default defineComponent({
  name: 'App',
  components: {
    RouterLink,
    RouterView,
    FactoryResetModal,
  },
  setup() {
    const connectionStore = useConnectionStore();
    return { connectionStore };
  },
  data() {
    return {
      menuItems: [
        { name: 'Connect', path: '/', isCategory: false },
        { name: 'Keyboard Creator', path: '/layout-creator', isCategory: false },
        {
          name: 'Basic Settings',
          items: [
            { name: 'Calibration', path: '/calibration' },
            { name: 'Key Travels', path: '/performance' },
            { name: 'Rapid Trigger', path: '/rapid-trigger' }
          ],
          isCategory: true
        },
        {
          name: 'Customization',
          items: [
            { name: 'Macro Recording', path: '/macros' },
            { name: 'Key Mapping', path: '/key-mapping' },
            { name: 'Lighting', path: '/lighting' }
          ],
          isCategory: true
        },
        {
          name: 'Advanced',
          items: [
            { 
              name: 'Dynamic Key Stroke', 
              path: '/dks',
              tooltip: 'Enables a single key to trigger up to four distinct actions based on actuation and release points during the full travel of the keypress. For example, light press for walking, deep press for sprinting, partial release for a third action, and full release for a fourth.'
            },
            { 
              name: 'Multi-Point Trigger', 
              path: '/mpt',
              tooltip: 'Assigns up to three independent actions to one key, each triggered at a user-defined actuation depth. Example: halfway press activates one function, full press activates another, and release from a specific depth triggers a third.'
            },
            { 
              name: 'Mod Tap', 
              path: '/mt',
              tooltip: 'Dual-function behavior: a quick tap sends one keycode (e.g., Shift), while pressing and holding sends a different modifier or layer key (e.g., Ctrl) that remains active for as long as the key is held.'
            },
            { 
              name: 'Toggle', 
              path: '/tgl',
              tooltip: 'Converts a momentary action into a latching one. A short tap toggles the function on or off permanently until tapped again (e.g., toggle run mode), while holding the key still performs the original held behavior.'
            },
            { 
              name: 'End', 
              path: '/end',
              tooltip: 'Delays the specified keycode or action until the physical key is released, rather than triggering on press. Ideal for precise timing, movement cancels, or release-based commands in gaming.'
            },
            { 
              name: 'SOCD', 
              path: '/socd',
              tooltip: 'Resolves conflicting directional inputs (e.g., Left + Right simultaneously) according to selected rules (Last Input Priority, Neutral, or First Input Priority), preventing invalid or locked movement states—commonly used in fighting games.'
            },
            { 
              name: 'Macro', 
              path: '/macro',
              tooltip: 'Records and plays back a custom sequence of keystrokes, mouse actions, delays, and triggers on a single keypress. Supports complex combos, rapid commands, or repetitive tasks with precise timing control.'
            }
          ],
          isCategory: true
        },
        { name: 'Debug', path: '/debug', isCategory: false }
      ],
      openCategory: null as any,
      flyoutTop: 0,
      editingProfileId: null as number | null,
      editingProfileName: '',
      openQuickSettings: null as string | null,
      quickSettingsFlyoutTop: 0,
      pollingRateOptions: POLLING_RATE_OPTIONS,
      currentPollingRate: 0,
      systemModeOptions: SYSTEM_MODE_OPTIONS,
      currentSystemMode: 'win' as 'win' | 'mac',
      isFactoryResetModalVisible: false,
      activeTooltip: null as string | null,
      tooltipTop: 0,
      hasLoadedQuickSettings: false
    };
  },
  computed: {
    profileStore() {
      return useProfileStore();
    },
    isStatusReady() {
      const info = this.connectionStore.deviceInfo;
      return info &&
        typeof info.KeyboardSN !== 'undefined' &&
        (typeof info.KeyboardSN === 'string' || (info.KeyboardSN instanceof Uint8Array && info.KeyboardSN.length > 0)) &&
        typeof info.appVersion !== 'undefined' &&
        (typeof info.appVersion === 'string' || (info.appVersion instanceof Uint8Array && info.appVersion.length > 0));
    },
  },
  watch: {
    openCategory(newVal) {
      if (newVal) {
        nextTick(() => {
          document.addEventListener('click', this.handleClickOutsideCategory);
        });
      } else {
        document.removeEventListener('click', this.handleClickOutsideCategory);
      }
    },
    openQuickSettings(newVal) {
      if (newVal) {
        nextTick(() => {
          document.addEventListener('click', this.handleClickOutsideQuickSettings);
        });
      } else {
        document.removeEventListener('click', this.handleClickOutsideQuickSettings);
      }
    }
  },
  methods: {
    decodeString(value: string | Uint8Array | null | undefined): string {
      if (!value) return '';
      if (typeof value === 'string') return value;
      if (value instanceof Uint8Array) {
        try {
          return new TextDecoder('utf-8').decode(value);
        } catch {
          return '[Decode Error]';
        }
      }
      return String(value);
    },
    handleCategoryClick(item: any, event: MouseEvent) {
      if (this.openCategory === item) {
        this.closeCategory();
        return;
      }
      const target = event.currentTarget as HTMLElement;
      this.flyoutTop = target.offsetTop - 35;
      this.openCategory = item;
    },
    closeCategory() {
      this.openCategory = null;
    },
    handleClickOutsideCategory(event: MouseEvent) {
      const target = event.target as HTMLElement;
      const flyoutMenu = document.querySelector('.flyout-menu');
      const sidebar = document.querySelector('.sidebar');
      
      if (flyoutMenu && !flyoutMenu.contains(target) && sidebar && !sidebar.contains(target)) {
        this.closeCategory();
      }
    },
    async handleQuickSettingsClick(setting: string, event: MouseEvent) {
      if (this.openQuickSettings === setting) {
        this.closeQuickSettings();
        return;
      }
      const target = event.currentTarget as HTMLElement;
      this.quickSettingsFlyoutTop = target.offsetTop - 20;
      this.openQuickSettings = setting;
      
      // Lazy-load quick settings values on first open
      if (!this.hasLoadedQuickSettings && this.connectionStore.isInitialized) {
        this.hasLoadedQuickSettings = true;
        await this.syncHardwareSettings();
      }
    },
    closeQuickSettings() {
      this.openQuickSettings = null;
    },
    handleClickOutsideQuickSettings(event: MouseEvent) {
      const target = event.target as HTMLElement;
      
      const flyoutMenu = target.closest('.flyout-menu');
      if (flyoutMenu) {
        const isQuickSettingsFlyout = flyoutMenu.querySelector('.quick-setting-item');
        if (isQuickSettingsFlyout) {
          return;
        }
      }
      
      const sidebar = target.closest('.sidebar');
      if (sidebar) {
        const clickedNavItem = target.closest('.nav-item.category-header');
        if (clickedNavItem && 
            (clickedNavItem.textContent?.includes('Polling Rate') || 
             clickedNavItem.textContent?.includes('System Mode'))) {
          return;
        }
      }
      
      this.closeQuickSettings();
    },
    showTooltip(tooltip: string, event: MouseEvent) {
      const target = event.currentTarget as HTMLElement;
      this.tooltipTop = target.getBoundingClientRect().top;
      this.activeTooltip = tooltip;
    },
    hideTooltip() {
      this.activeTooltip = null;
    },
    async handlePollingRateChange() {
      if (this.currentPollingRate < 0 || this.currentPollingRate > 6) {
        console.error('Invalid polling rate value');
        return;
      }
      const result = await KeyboardService.setPollingRate(this.currentPollingRate);
      if (result instanceof Error) {
        console.error('Failed to set polling rate:', result.message);
      } else {
        // Wait for reconnection and suppression cleanup before reloading
        const waitForReinitialization = async () => {
          const maxWaitTime = 15000; // 15 second timeout
          const startTime = Date.now();
          
          while (Date.now() - startTime < maxWaitTime) {
            if (this.connectionStore.isInitialized && !this.connectionStore.isPostReconnectionSuppression) {
              return true;
            }
            // Check every 200ms
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          return false; // Timeout
        };
        
        const success = await waitForReinitialization();
        if (success) {
          window.location.reload();
        } else {
          console.error('Reconnection timeout - reloading anyway');
          window.location.reload();
        }
      }
    },
    async handleSystemModeChange() {
      const result = await KeyboardService.setSystemMode(this.currentSystemMode);
      if (result instanceof Error) {
        console.error('Failed to set system mode:', result.message);
      }
    },
    showFactoryResetModal() {
      this.isFactoryResetModalVisible = true;
    },
    hideFactoryResetModal() {
      this.isFactoryResetModalVisible = false;
    },
    async handleFactoryReset() {
      this.hideFactoryResetModal();
      const result = await KeyboardService.factoryReset();
      if (result instanceof Error) {
        console.error('Factory reset failed:', result.message);
        alert('Factory reset failed. Please try again.');
      } else if (result === true) {
        alert('Factory reset successful! Your keyboard has been restored to factory settings.');
      } else {
        console.error('Unexpected factory reset result:', result);
        alert('Factory reset completed with unexpected result.');
      }
    },
    async syncHardwareSettings() {
      const pollingRateResult = await KeyboardService.getPollingRate();
      if (!(pollingRateResult instanceof Error)) {
        if (typeof pollingRateResult === 'number' && pollingRateResult >= 0 && pollingRateResult <= 6) {
          this.currentPollingRate = pollingRateResult;
        }
      }
      
      const systemModeResult = await KeyboardService.querySystemMode();
      if (!(systemModeResult instanceof Error)) {
        if (systemModeResult === 'win' || systemModeResult === 'mac') {
          this.currentSystemMode = systemModeResult;
        }
      } else {
        console.error('Failed to sync system mode from hardware:', systemModeResult.message);
      }
    },
    async handleProfileClick(profileId: number) {
      const result = await this.profileStore.switchProfile(profileId);
      if (result.success) {
        window.location.reload();
      } else if (result.error) {
        console.error('Failed to switch profile:', result.error);
      }
    },
    startEditing(profileId: number) {
      const profile = this.profileStore.getProfileById(profileId);
      if (profile) {
        this.editingProfileId = profileId;
        this.editingProfileName = profile.name;
        nextTick(() => {
          const refKey = `profileInput-${profileId}`;
          const input = this.$refs[refKey] as HTMLInputElement | HTMLInputElement[];
          if (input) {
            const inputElement = Array.isArray(input) ? input[0] : input;
            inputElement?.focus();
            inputElement?.select();
          }
        });
      }
    },
    finishEditing() {
      if (this.editingProfileId !== null && this.editingProfileName.trim()) {
        this.profileStore.updateProfileName(this.editingProfileId, this.editingProfileName);
      }
      this.editingProfileId = null;
      this.editingProfileName = '';
    },
    cancelEditing() {
      this.editingProfileId = null;
      this.editingProfileName = '';
    },
    async exportProfile() {
      try {
        const activeProfile = this.profileStore.profiles.find(p => p.id === this.profileStore.activeProfileId);
        const profileName = activeProfile ? activeProfile.name : 'keyboard-config';
        const filename = `${profileName}.json`;
        
        const exportResult = await ExportService.exportProfile(filename);
        if (!exportResult.success) {
          console.error('Failed to export profile:', exportResult.error);
        }
      } catch (error) {
        console.error('Export profile error:', error);
      }
    },
    async importProfile() {
      try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (event: Event) => {
          const target = event.target as HTMLInputElement;
          const file = target.files?.[0];
          if (!file) {
            return;
          }
          
          const importResult = await ExportService.importProfile(file);
          if (!importResult.success) {
            console.error('Failed to import profile:', importResult.error);
            return;
          }
          
          if (importResult.success) {
            window.location.reload();
          } else {
            console.error('Import failed:', importResult.error || 'Unknown error');
          }
        };
        
        input.click();
      } catch (error) {
        console.error('Import profile error:', error);
      }
    },
    async exportProfileDebug() {
      try {
        const exportResult = await ExportService.exportProfileDebug();
        if (!exportResult.success) {
          console.error('Failed to export debug profile:', exportResult.error);
        }
      } catch (error) {
        console.error('Export debug profile error:', error);
      }
    }
  }
});
</script>

<style scoped lang="scss">
@use 'sass:color';
@use 'styles/variables' as v;

.app-container {
  display: flex;
  height: 100vh;
  background-color: color.adjust(v.$background-dark, $lightness: -100%);
  color: v.$text-color;
  font-family: Arial, sans-serif;
  position: relative; // For flyout positioning
}

.sidebar {
  width: 250px;
  background-color: color.adjust(v.$background-dark, $lightness: -100%);
  padding: 20px;
  display: flex;
  width: 200px;
  flex-direction: column;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 10;
  position: relative;
}

.sidebar-header {
  margin-bottom: 20px;
  text-align: left;

  .logo {
    max-width: 100%;
    height: auto;
    margin-bottom: 10px;
  }

  .status {
    margin-top: 10x;
    margin-bottom: 40px;
    font-size: 1rem;
    font-family: v.$font-style;
    width: 220px;
    height: 69.13px;
    color: v.$accent-color;

    ul {
      list-style-type: none;
      padding-left: 0px;
      margin: 0;

      li {
        margin: 0;
        line-height: 1.2;
      }
    }

    p {
      margin: 0;
      line-height: 1.2;
    }
  }
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.nav-item {
  text-decoration: none;
  font-family: v.$font-style;
  color: v.$primary-color;
  padding: 10px;
  border: 1px solid rgba(v.$text-color, 0.2);
  border-radius: v.$border-radius;
  transition: background-color 0.3s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  &.router-link-active {
    background-color: color.adjust(v.$background-dark, $lightness: -100%);
    color: v.$accent-color;
    font-family: v.$font-style;
    border-color: v.$accent-color;
  }
}

.category-header {
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-decoration: none;
  font-family: v.$font-style;
  color: v.$primary-color;
  padding: 10px;
  border: 1px solid rgba(v.$text-color, 0.2);
  border-radius: v.$border-radius;
  transition: background-color 0.3s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
}

.arrow {
  font-size: 0.8rem;
  transition: transform 0.3s ease;

  &.open {
    transform: rotate(90deg);
  }
}

.flyout-menu {
  position: absolute;
  left: 225px;
  top: 20px; // Base offset for sidebar padding
  width: 220px;
  height: auto;
  min-height: 0px;
  max-height:500px;
  overflow-y: auto;
  overflow-x: visible;
  border: 1px solid rgba(v.$text-color, 0.2);
  background-color: color.adjust(v.$background-dark, $lightness: -100%);
  border-radius: 15px;
  z-index: 20;
  animation: slideInLeft 0.3s ease-out;
}

.flyout-content {
  padding: 10px;
  display: flex;
  flex-direction: column;
}


.flyout-nav {
  display: flex;
  flex-direction: column;
  text-align: center;
  font-family: v.$font-style;
  gap: 3px;
}

.flyout-item {
  text-decoration: none;
  color: v.$primary-color;
  padding: 2px 5px;
  background-color: color.adjust(v.$background-dark, $lightness: -100%);
  border: 1px solid rgba(v.$text-color, 0.2);
  border-radius: v.$border-radius;
  transition: background-color 0.3s;
  font-size: 0.95rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  position: relative;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  &.router-link-active {
    background-color: rgba($color: #a088242e, $alpha: 1.0);
    ;
    color: rgba($color: #000000, $alpha: 1.0);
    font-weight: bold;
  }
}

.flyout-item-text {
  flex: 1;
  text-align: center;
}

.help-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: rgba(v.$accent-color, 0.3);
  color: v.$accent-color;
  font-size: 0.7rem;
  font-weight: bold;
  cursor: help;
  flex-shrink: 0;
  position: relative;
  transition: background-color 0.3s, transform 0.2s;

  &:hover {
    background-color: rgba(v.$accent-color, 0.5);
    transform: scale(1.1);
  }
}

.tooltip-flyout {
  position: fixed;
  left: calc(225px + 220px + 10px);
  width: 300px;
  max-height: 400px;
  overflow-y: auto;
  background-color: color.adjust(v.$background-dark, $lightness: -100%);
  border: 1px solid rgba(v.$accent-color, 0.3);
  border-radius: 15px;
  z-index: 25;
  animation: slideInLeft 0.2s ease-out;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.tooltip-flyout-content {
  padding: 15px;
  color: v.$text-color;
  font-family: v.$font-style;
  font-size: 0.9rem;
  line-height: 1.6;
  text-align: left;
}

.main-nav-section {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 15px;
  font-family: v.$font-style;
}

.main-nav-separator-top {
  height: 1px;
  background: linear-gradient(to right, rgba(v.$text-color, 0.3), rgba(v.$text-color, 0.1));
  border-radius: 1px;
  margin-bottom: 5px;
}

.main-nav-header {
  margin-bottom: 5px;
}

.main-nav-title {
  color: v.$text-color;
  font-family: v.$font-style;
  font-size: 0.9rem;
  font-weight: 500;
  display: block;
  margin-bottom: 8px;
}

.main-nav-separator {
  height: 1px;
  background: linear-gradient(to right, rgba(v.$text-color, 0.3), rgba(v.$text-color, 0.1));
  border-radius: 1px;
}

.main-nav-separator-bottom {
  height: 1px;
  background: linear-gradient(to right, rgba(v.$text-color, 0.3), rgba(v.$text-color, 0.1));
  border-radius: 1px;
  margin-top: 8px;
}

.profiles-section {
  margin-top: 20px;
}

.profiles-header {
  margin-bottom: 12px;
}

.profiles-title {
  color: v.$text-color;
  font-family: v.$font-style;
  font-size: 0.9rem;
  font-weight: 500;
  display: block;
  margin-bottom: 8px;
}

.profiles-separator {
  height: 1px;
  background: linear-gradient(to right, rgba(v.$text-color, 0.3), rgba(v.$text-color, 0.1));
  border-radius: 1px;
}

.profile-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.profile-btn {
  font-family: v.$font-style;
  padding: 10px 8px;
  border: 1px solid rgba(v.$text-color, 0.2);
  border-radius: v.$border-radius;
  background-color: color.adjust(v.$background-dark, $lightness: -100%);
  color: v.$primary-color;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.85rem;
  text-align: center;
  position: relative;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  &.active {
    background-color: color.adjust(v.$background-dark, $lightness: -100%);
    color: v.$accent-color;
    font-family: v.$font-style;
    border-color: v.$accent-color;
  }

  .profile-name {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.edit-icon {
  position: absolute;
  top: -10px;
  right: -10px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.7rem;
  padding: 2px;
  opacity: 0.6;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
}

.profile-name-input {
  width: 100%;
  background: transparent;
  border: none;
  color: v.$primary-color;
  font-family: v.$font-style;
  font-size: 0.85rem;
  text-align: center;
  outline: none;
  padding: 0;

  &:focus {
    color: v.$accent-color;
  }
}

.export-btn,
.import-btn {
  width: 100%;
  font-family: v.$font-style;
  padding: 10px;
  margin-top: -5px;
  border: 1px solid rgba(v.$text-color, 0.2);
  border-radius: v.$border-radius;
  background-color: color.adjust(v.$background-dark, $lightness: -100%);
  color: v.$primary-color;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.85rem;
  text-align: center;

  &:hover:not(:disabled) {
    background-color: rgba(255, 255, 255, 0.1);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.debug-export-btn {
  width: 100%;
  font-family: v.$font-style;
  padding: 10px;
  margin-top: -5px;
  border: 1px solid rgba(100, 150, 255, 0.3);
  border-radius: v.$border-radius;
  background-color: rgba(100, 150, 255, 0.05);
  color: #6496ff;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.85rem;
  text-align: center;

  &:hover:not(:disabled) {
    background-color: rgba(100, 150, 255, 0.1);
    border-color: rgba(100, 150, 255, 0.5);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.import-separator {
  height: 1px;
  background: linear-gradient(to right, rgba(v.$text-color, 0.3), rgba(v.$text-color, 0.1));
  border-radius: 1px;
  margin-top: 5px;
}

.quick-settings-section {
  margin-top: 20px;
}

.factory-reset-btn {
  width: 100%;
  font-family: v.$font-style;
  padding: 10px;
  margin-top: 10px;
  border: 1px solid rgba(255, 68, 68, 0.3);
  border-radius: v.$border-radius;
  background-color: rgba(255, 68, 68, 0.1);
  color: #ff4444;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.85rem;
  text-align: center;
  font-weight: 500;

  &:hover:not(:disabled) {
    background-color: rgba(255, 68, 68, 0.2);
    border-color: rgba(255, 68, 68, 0.5);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.quick-settings-header {
  margin-bottom: 12px;
}

.quick-settings-title {
  color: v.$text-color;
  font-family: v.$font-style;
  font-size: 0.9rem;
  font-weight: 500;
  display: block;
  margin-bottom: 8px;
}

.quick-settings-separator {
  height: 1px;
  background: linear-gradient(to right, rgba(v.$text-color, 0.3), rgba(v.$text-color, 0.1));
  border-radius: 1px;
}

.quick-setting-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 5px;
}

.quick-setting-label {
  color: v.$text-color;
  font-family: v.$font-style;
  font-size: 0.9rem;
  font-weight: 500;
}

.polling-rate-select {
  font-family: v.$font-style;
  padding: 8px;
  border: 1px solid rgba(v.$text-color, 0.2);
  border-radius: v.$border-radius;
  background-color: color.adjust(v.$background-dark, $lightness: -100%);
  color: v.$primary-color;
  cursor: pointer;
  font-size: 0.9rem;
  outline: none;
  transition: all 0.3s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    border-color: rgba(v.$text-color, 0.4);
  }

  &:focus {
    border-color: v.$accent-color;
  }

  option {
    background-color: color.adjust(v.$background-dark, $lightness: -100%);
    color: v.$primary-color;
  }
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.main-content {
  flex-grow: 1;
  padding: 20px;
  overflow-y: auto;
  scrollbar-gutter: stable both-edges;
  transition: margin-left 0.3s ease; // Smooth shift if needed
}

.copyright {
  font-size: 0.7rem;
  color: rgba(v.$text-color, 0.6);
  text-align: center;
  margin-top: auto;
  padding-top: 10px;
}
</style>

<style lang="scss">
@use 'styles/variables' as v;
@use 'sass:color';

html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background-color: color.adjust(v.$background-dark, $lightness: -100%);
}

#app {
  height: 100%;
  width: 100%;
  background-color: color.adjust(v.$background-dark, $lightness: -100%);
}
</style>
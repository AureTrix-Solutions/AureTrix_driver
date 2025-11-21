<template>
  <div class="app-container">
    <!-- Sidebar Navigation -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <img src="@/assets/logo cropped.svg" alt="Keyboard Driver Logo" class="logo">
        <div v-if="connectionStore.status" class="status">
          <ul v-if="connectionStore.isConnected && isStatusReady">
            <li>Connected: {{ connectionStore.deviceInfo?.productName || 'Unknown Device' }}</li>
            <li>SN: {{ decodeString(connectionStore.deviceInfo?.KeyboardSN) || 'N/A' }}</li>
            <li v-if="connectionStore.deviceInfo?.BoardID">Board ID: {{ connectionStore.deviceInfo.BoardID }}</li>
            <li v-if="connectionStore.deviceInfo?.appVersion">Version: {{ decodeString(connectionStore.deviceInfo?.appVersion) || 'N/A' }}</li>
          </ul>
          <ul v-else-if="connectionStore.isConnected">
            <li>Loading device info...</li>
          </ul>
          <p v-else>{{ connectionStore.status }}</p>
        </div>
      </div>
      <nav class="sidebar-nav">
        <template v-for="item in menuItems" :key="item.name">
          <router-link
            v-if="!item.isCategory"
            :to="item.path"
            class="nav-item"
          >
            {{ item.name }}
          </router-link>
          <div v-else class="nav-item category-header" @click="handleCategoryClick(item, $event)">
            {{ item.name }}
            <span class="arrow" :class="{ open: openCategory === item }">></span>
          </div>
        </template>

        <!-- Profile Quick Access Grid -->
        <div class="profile-grid">
          <button
            v-for="profile in profileStore.profiles"
            :key="profile.id"
            class="profile-btn"
            :class="{ active: profileStore.activeProfileId === profile.id }"
            @click="profileStore.setActiveProfile(profile.id)"
            @dblclick="startEditing(profile.id)"
          >
            <input
              v-if="editingProfileId === profile.id"
              v-model="editingProfileName"
              @blur="finishEditing"
              @keyup.enter="finishEditing"
              @keyup.esc="cancelEditing"
              class="profile-name-input"
              ref="profileInput"
              @click.stop
            />
            <span v-else class="profile-name">{{ profile.name }}</span>
          </button>
        </div>
      </nav>
      <p class="copyright">Copyright©2025 AureTrix</p>
    </aside>

    <!-- Flyout Submenu -->
    <div v-if="openCategory" class="flyout-menu" :style="{ top: flyoutTop + 'px' }" @click.self="closeCategory">
      <div class="flyout-content">
        <nav class="flyout-nav">
          <router-link
            v-for="sub in openCategory.items"
            :key="sub.name"
            :to="sub.path"
            class="flyout-item"
            @click="closeCategory"
          >
            {{ sub.name }}
          </router-link>
        </nav>
      </div>
    </div>

    <!-- Main Content Area -->
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

export default defineComponent({
  name: 'App',
  components: {
    RouterLink,
    RouterView,
  },
  setup() {
    const connectionStore = useConnectionStore();
    const profileStore = useProfileStore();
    return { connectionStore, profileStore };
  },
  data() {
    return {
      menuItems: [
        { name: 'Connect', path: '/', isCategory: false },
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
            { name: 'Advanced Config', path: '/advanced-config' },
            { name: 'Layout Preview', path: '/layout-preview' }
          ], 
          isCategory: true 
        },
        { name: 'Profiles', path: '/profiles', isCategory: false },
        { name: 'Debug', path: '/debug', isCategory: false }
      ],
      openCategory: null as any,
      flyoutTop: 0,
      editingProfileId: null as number | null,
      editingProfileName: ''
    };
  },
  computed: {
    isStatusReady() {
      const info = this.connectionStore.deviceInfo;
      return info && 
             typeof info.KeyboardSN !== 'undefined' && 
             (typeof info.KeyboardSN === 'string' || (info.KeyboardSN instanceof Uint8Array && info.KeyboardSN.length > 0)) &&
             typeof info.appVersion !== 'undefined' &&
             (typeof info.appVersion === 'string' || (info.appVersion instanceof Uint8Array && info.appVersion.length > 0));
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
      console.log('Category clicked:', item.name);
      if (this.openCategory === item) {
        this.closeCategory();
        return;
      }
      const target = event.currentTarget as HTMLElement;
      this.flyoutTop = target.offsetTop - 50;
      this.openCategory = item;
    },
    closeCategory() {
      this.openCategory = null;
    },
    startEditing(profileId: number) {
      const profile = this.profileStore.getProfileById(profileId);
      if (profile) {
        this.editingProfileId = profileId;
        this.editingProfileName = profile.name;
        nextTick(() => {
          const input = this.$refs.profileInput as HTMLInputElement | HTMLInputElement[];
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
      list-style-type:none;
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
  gap: 10px;
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
    background-color: rgba($color: #a088242e, $alpha: 1.0);
    color: rgba($color: #000000, $alpha: 1.0);
    font-weight: bold;
  }
}

.category-header {
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-decoration: none;
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
  min-height: 100px;
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid rgba(v.$text-color, 0.2);
  background-color: color.adjust(v.$background-dark, $lightness: -100%);
  border-radius: 15px;
  z-index: 20;
  animation: slideInLeft 0.3s ease-out;
}

.flyout-content {
  padding: 15px;
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
  padding: 8px 10px;
  background-color: color.adjust(v.$background-dark, $lightness: -100%);
  border: 1px solid rgba(v.$text-color, 0.2);
  border-radius: v.$border-radius;
  transition: background-color 0.3s;
  font-size: 0.95rem;
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  &.router-link-active {
    background-color: rgba($color: #a088242e, $alpha: 1.0);;
    color: rgba($color: #000000, $alpha: 1.0);
    font-weight: bold;
  }
}

.profile-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 15px;
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
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  &.active {
    background-color: rgba($color: #a088242e, $alpha: 1.0);
    color: rgba($color: #000000, $alpha: 1.0);
    font-weight: bold;
    border-color: v.$accent-color;
  }
  
  .profile-name {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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

html, body {
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
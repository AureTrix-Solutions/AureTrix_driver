<template>
  <div class="app-container">
    <!-- Sidebar Navigation -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <img src="@/assets/logo.png" alt="Keyboard Driver Logo" class="logo">
        <div v-if="connectionStore.status" class="status">
          <ul v-if="connectionStore.isConnected">
            <li>Connected: {{ connectionStore.deviceInfo?.productName || 'Unknown Device' }}</li>
            <li>SN: {{ connectionStore.deviceInfo?.KeyboardSN || 'N/A' }}</li>
            <li v-if="connectionStore.deviceInfo?.BoardID">Board ID: {{ connectionStore.deviceInfo.BoardID }}</li>
            <li v-if="connectionStore.deviceInfo?.appVersion">Version: {{ connectionStore.deviceInfo.appVersion }}</li>
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
          <div v-else class="nav-item category-header" @click="toggleCategory(item.name)">
            {{ item.name }}
            <span class="arrow" :class="{ open: isOpen(item.name) }">▶</span>
          </div>
          <div v-if="isOpen(item.name)" class="submenu">
            <router-link
              v-for="sub in item.items"
              :key="sub.name"
              :to="sub.path"
              class="nav-item subitem"
            >
              {{ sub.name }}
            </router-link>
          </div>
        </template>
      </nav>
      <p class="copyright">Copyright©2025 BlastHappy82</p>
    </aside>

    <!-- Main Content Area -->
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { RouterLink, RouterView } from 'vue-router';
import { useConnectionStore } from './store/connection';

export default defineComponent({
  name: 'App',
  components: {
    RouterLink,
    RouterView,
  },
  setup() {
    const connectionStore = useConnectionStore();
    return { connectionStore };
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
      openCategory: null as string | null
    };
  },
  methods: {
    toggleCategory(name: string) {
      this.openCategory = this.openCategory === name ? null : name;
    },
    isOpen(name: string) {
      return this.openCategory === name;
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
}

.sidebar {
  width: 250px;
  background-color: color.adjust(v.$background-dark, $lightness: -100%);
  padding: 20px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
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
    margin-top: -30px;
    font-size: 0.9rem;
    width: 250px;
    height: 69.13px;
    color: v.$accent-color;
    ul {
      list-style-type: disc;
      padding-left: 10px;
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
  color: v.$text-color;
  padding: 10px;
  border-radius: v.$border-radius;
  transition: background-color 0.3s;
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  &.router-link-active {
    background-color: v.$primary-color;
    color: v.$background-dark;
    font-weight: bold;
  }
}

.category-header {
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-decoration: none;
  color: v.$text-color;
  padding: 10px;
  border-radius: v.$border-radius;
  transition: background-color 0.3s;
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  &.router-link-active {
    background-color: v.$primary-color;
    color: v.$background-dark;
    font-weight: bold;
  }
}

.arrow {
  transition: transform 0.3s ease;
  font-size: 0.8rem;
  &.open {
    transform: rotate(90deg);
  }
}

.submenu {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding-left: 20px;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    max-height: 0;
    padding-left: 0;
  }
  to {
    opacity: 1;
    max-height: 200px;
    padding-left: 20px;
  }
}

.subitem {
  padding: 8px 10px;
  font-size: 0.95rem;
  &.router-link-active {
    background-color: rgba(v.$primary-color, 0.3);
    color: v.$primary-color;
    font-weight: bold;
  }
}

.main-content {
  flex-grow: 1;
  padding: 20px;
  overflow-y: auto;
  scrollbar-gutter: stable both-edges;
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
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
        <router-link to="/" class="nav-item">Connect</router-link>
        <router-link to="/key-mapping" class="nav-item">Key Mapping</router-link>
        <router-link to="/macros" class="nav-item">Macro Recording</router-link>
        <router-link to="/profiles" class="nav-item">Profiles</router-link>
        <router-link to="/lighting" class="nav-item">Lighting</router-link>
        <router-link to="/advanced-config" class="nav-item">Advanced Config</router-link>
        <router-link to="/layout-preview" class="nav-item">Layout Preview</router-link>
      </nav>
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
});
</script>

<style scoped lang="scss">
@use 'sass:color';
@use 'styles/variables' as v;

.app-container {
  display:flex;
  height: 100vh;
  background-color: color.adjust(v.$background-dark, $lightness: -100%);
  //background-image: url("@/assets/logo.png");
  background-size: 1000px 1000px;
  background-position: center center;
  //background-position-y: 500px;
  background-repeat:no-repeat;
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
    color: v.$accent-color;
    ul {
      list-style-type:disc;
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

.main-content {
  flex-grow: 1;
  padding: 20px;
  overflow-y: auto;
}
</style>
<template>
  <div class="app-container">
    <!-- Sidebar Navigation -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>Keyboard Driver</h2>
      </div>
      <nav class="sidebar-nav">
        <router-link to="/" class="nav-item">Connect</router-link>
        <router-link to="/key-mapping" class="nav-item">Key Mapping</router-link>
        <router-link to="/macros" class="nav-item">Macros</router-link>
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

export default defineComponent({
  name: 'App',
  components: {
    RouterLink,
    RouterView,
  },
});
</script>

<style scoped lang="scss">
@use 'sass:color';
@use 'styles/variables' as v;

.app-container {
  display: flex;
  height: 100vh;
  background-color: v.$background-dark;
  color: v.$text-color;
  font-family: Arial, sans-serif;
}

.sidebar {
  width: 250px;
  background-color: color.adjust(v.$background-dark, $lightness: -5%);
  padding: 20px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-header {
  margin-bottom: 20px;
  h2 {
    margin: 0;
    font-size: 1.5rem;
    color: v.$primary-color;
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
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import App from './App.vue';
import router from './router';
import KeyboardService from './services/KeyboardService';
import { useConnectionStore } from './store/connection';
import { loadCustomLayouts } from './utils/layoutConfigs';
import './styles/variables.scss';

const app = createApp(App);
const pinia = createPinia();

pinia.use(piniaPluginPersistedstate);

app.use(pinia);
app.use(router);
app.provide('KeyboardService', KeyboardService);

// Set initial connection status - KeyboardService handles auto-reconnection
// internally via deferredReconnect() which triggers onAutoConnectSuccess()
const connectionStore = useConnectionStore();
const hasPairedDevice = localStorage.getItem('pairedStableId');
if (hasPairedDevice) {
  connectionStore.$patch({ status: 'Checking for paired devices...' });
}

// Preload custom layouts cache before mounting
loadCustomLayouts().then(() => {
  app.mount('#app');
});
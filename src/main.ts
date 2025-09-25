import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import KeyboardService from './services/KeyboardService';
import { useConnectionStore } from './store/connection';
import './styles/variables.scss';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.provide('KeyboardService', KeyboardService);

const connectionStore = useConnectionStore();
connectionStore.autoConnect();

app.mount('#app');
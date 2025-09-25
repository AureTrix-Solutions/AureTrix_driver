import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import KeyboardService from './services/KeyboardService';

const app = createApp(App);
app.use(router);
app.provide('KeyboardService', KeyboardService); // Provide the service globally
app.mount('#app');
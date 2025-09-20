import { createApp } from 'vue';
import App from './App.vue';
import router from './router'; // Import the router
import KeyboardService from './services/KeyboardService'; // Import the service

const app = createApp(App);
app.use(router); // Use the router
app.provide('KeyboardService', KeyboardService); // Provide the service globally
app.mount('#app');
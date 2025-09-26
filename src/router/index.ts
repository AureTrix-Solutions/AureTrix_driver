import { createRouter, createWebHistory } from 'vue-router';
import Connect from '../pages/Connect.vue'; // Placeholder until created

const routes = [
  { path: '/', component: Connect, name: 'Connect' },
  { path: '/key-mapping', component: () => import('../pages/KeyMapping.vue'), name: 'KeyMapping' },
  { path: '/macros', component: () => import('../pages/MacroRecording.vue'), name: 'Macros' },
  { path: '/profiles', component: () => import('../pages/Profiles.vue'), name: 'Profiles' },
  { path: '/lighting', component: () => import('../pages/Lighting.vue'), name: 'Lighting' },
  { path: '/advanced-config', component: () => import('../pages/AdvancedConfig.vue'), name: 'AdvancedConfig' },
  { path: '/layout-preview', component: () => import('../pages/LayoutPreview.vue'), name: 'LayoutPreview' }, // New temporary route
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
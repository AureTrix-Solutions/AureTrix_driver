import { createRouter, createWebHistory } from 'vue-router';
import Connect from '@/pages/Connect.vue'; 

const routes = [
  { path: '/', component: Connect, name: 'Connect' },
  { path: '/key-mapping', component: () => import('@/pages/KeyMapping.vue'), name: 'KeyMapping' },
  { path: '/macros', component: () => import('@/pages/MacroRecording.vue'), name: 'Macros' },
  { path: '/lighting', component: () => import('@/pages/Lighting.vue'), name: 'Lighting' },
  { path: '/advanced-config', component: () => import('@/pages/AdvancedConfig.vue'), name: 'AdvancedConfig' },
  { path: '/layout-preview', component: () => import('@/pages/LayoutPreview.vue'), name: 'LayoutPreview' },
  { path: '/performance', component: () => import('@/pages/Performance.vue'), name: 'Performance' },
  { path: '/debug', component: () => import('@/pages/Debug.vue'), name: 'Debug' },
  { path: '/rapid-trigger', component: () => import('@/pages/RapidTrigger.vue'), name: 'RapidTrigger' },
  { path: '/calibration', component: () => import('@/pages/Calibration.vue'), name: 'Calibration' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
import { createRouter, createWebHistory } from 'vue-router';
import Connect from '@/pages/Connect.vue'; 

const routes = [
  { path: '/', component: Connect, name: 'Connect' },
  { path: '/key-mapping', component: () => import('@/pages/KeyMapping.vue'), name: 'KeyMapping' },
  { path: '/macros', component: () => import('@/pages/MacroRecording.vue'), name: 'Macros' },
  { path: '/lighting', component: () => import('@/pages/Lighting.vue'), name: 'Lighting' },
  { path: '/dks', component: () => import('@/pages/DKS.vue'), name: 'DKS' },
  { path: '/mpt', component: () => import('@/pages/MPT.vue'), name: 'MPT' },
  { path: '/mt', component: () => import('@/pages/MT.vue'), name: 'MT' },
  { path: '/tgl', component: () => import('@/pages/TGL.vue'), name: 'TGL' },
  { path: '/end', component: () => import('@/pages/END.vue'), name: 'END' },
  { path: '/socd', component: () => import('@/pages/SOCD.vue'), name: 'SOCD' },
  { path: '/macro', component: () => import('@/pages/Macro.vue'), name: 'Macro' },
  { path: '/layout-preview', component: () => import('@/pages/LayoutPreview.vue'), name: 'LayoutPreview' },
  { path: '/layout-creator', component: () => import('@/pages/LayoutCreator.vue'), name: 'LayoutCreator' },
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
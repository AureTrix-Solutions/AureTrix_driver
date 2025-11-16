<template>
  <div class="settings-section">
    <GlobalTravel 
      :layout="layout" 
      :selected-keys="selectedKeys" 
      :profile-max-travel="profileMaxTravel"
      @update-overlay="setOverlay" 
      @mode-changed="handleModeChange"
    />
    <SingleKeyTravel 
      :selected-keys="selectedKeys" 
      :layout="layout" 
      :base-layout="baseLayout" 
      :profile-max-travel="profileMaxTravel"
      @update-single-overlay="setSingleOverlay" 
      @mode-changed="handleModeChange"
    />
    <SwitchProfiles 
      :selected-keys="selectedKeys" 
      :layout="layout" 
      :base-layout="baseLayout"
      :profile-max-travel="profileMaxTravel"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import type { IDefKeyInfo } from '@/types/types';
import GlobalTravel from './GlobalTravel.vue';
import SingleKeyTravel from './SingleKeyTravel.vue';
import SwitchProfiles from './SwitchProfiles.vue';
import { useTravelProfilesStore } from '@/store/travelProfilesStore';

export default defineComponent({
  name: 'KeyTravel',
  components: {
    GlobalTravel,
    SingleKeyTravel,
    SwitchProfiles,
  },
  props: {
    selectedKeys: {
      type: Array as PropType<IDefKeyInfo[]>,
      default: () => [],
    },
    layout: {
      type: Array as PropType<IDefKeyInfo[][]>,
      required: true,
    },
    baseLayout: {
      type: Object as PropType<any>,
      default: null,
    },
  },
  emits: ['update-overlay', 'update-single-overlay', 'mode-changed'],
  setup(props, { emit }) {
    const store = useTravelProfilesStore();

    // Computed for profile maxTravel (reactive to store changes)
    const profileMaxTravel = computed(() => {
      const selected = store.selectedProfile;
      return selected ? selected.maxTravel : 4.0; // Default to 4.0 if no profile
    });

    // Forward overlay events
    const setOverlay = (data: { travel: string; pressDead: string; releaseDead: string } | null) => {
      console.log(`[KEYTRAVEL] Forwarding update-overlay:`, data);
      emit('update-overlay', data);
    };

    const setSingleOverlay = (data: { travel: string; pressDead: string; releaseDead: string } | null) => {
      console.log(`[KEYTRAVEL] Forwarding update-single-overlay:`, data);
      emit('update-single-overlay', data);
    };

    const handleModeChange = (keyIds: number[], newMode: 'global' | 'single') => {
      console.log(`[KEYTRAVEL] Forwarding mode-changed:`, keyIds, newMode);
      emit('mode-changed', keyIds, newMode);
    };

    return {
      profileMaxTravel,
      setOverlay,
      setSingleOverlay,
      handleModeChange,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@styles/variables' as v;

.settings-section {
  // Wrapper for sub-components; no additional rules needed
}
</style>
<template>
  <div class="settings-section">
    <GlobalTravel 
      :layout="layout" 
      :selected-keys="selectedKeys" 
      :profile-max-travel="profileMaxTravel"
      @update-notification="setNotification" 
      @update-overlay="setOverlay" 
      @refresh-overlays="$emit('refresh-overlays')" 
    />
    <SingleKeyTravel 
      :selected-keys="selectedKeys" 
      :layout="layout" 
      :base-layout="baseLayout" 
      :profile-max-travel="profileMaxTravel"
      @update-notification="setNotification" 
      @update-single-overlay="setSingleOverlay" 
      @refresh-overlays="$emit('refresh-overlays')" 
    />
    <SwitchProfiles 
      :selected-keys="selectedKeys" 
      :layout="layout" 
      :base-layout="baseLayout"
      :profile-max-travel="profileMaxTravel"
      @update-notification="setNotification" 
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import type { IDefKeyInfo } from '@/types/types';
import { Ref } from 'vue';
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
      type: Object as PropType<Ref<IDefKeyInfo[][] | null>>,
      default: () => ref(null),
    },
  },
  emits: ['update-notification', 'update-overlay', 'update-single-overlay', 'refresh-overlays'],
  setup(props, { emit }) {
    const store = useTravelProfilesStore();

    // Computed for profile maxTravel (reactive to store changes)
    const profileMaxTravel = computed(() => {
      const selected = store.selectedProfile;
      return selected ? selected.maxTravel : 4.0; // Default to 4.0 if no profile
    });

    const setNotification = (message: string, isError: boolean) => {
      emit('update-notification', message, isError);
    };

    const setOverlay = (data: { travel: string; pressDead: string; releaseDead: string } | null) => {
      //console.log(`KeyTravel: Forwarding update-overlay:`, data);
      emit('update-overlay', data);
    };

    const setSingleOverlay = (data: { travel: string; pressDead: string; releaseDead: string } | null) => {
      //console.log(`KeyTravel: Forwarding update-single-overlay:`, data);
      emit('update-single-overlay', data);
    };

    return {
      setNotification,
      setOverlay,
      setSingleOverlay,
      profileMaxTravel,
    };
  },
});
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@styles/variables' as v;

.settings-section {
  h2 {
    color: v.$primary-color;
    margin-bottom: 10px;
    text-decoration: underline;
  }
}
</style>
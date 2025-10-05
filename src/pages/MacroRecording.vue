<template>
  <div class="macros-page">
    <h2 class="title">Macro Editor</h2>
    <div class="controls">
      <button @click="startNewMacro" class="action-btn">Record Macro</button>
      <input
        type="text"
        v-model="macroName"
        id="macro-name"
        placeholder="Enter macro name"
        class="text-input"
        :disabled="!isRecording"
        ref="macroNameInput"
      />
      <select v-model="layoutType" id="layout-type" class="control-select">
        <option value="default">Default Layout</option>
        <option value="mapped">Mapped Layout</option>
      </select>
      <select v-model="selectedLayer" id="layer-select" class="control-select" :disabled="layoutType !== 'mapped'">
        <option v-for="layer in layers" :key="layer" :value="layer">{{ `Fn${layer}` }}</option>
      </select>

      <button @click="saveMacro" class="action-btn" :disabled="!currentSequence.length || !macroName || !isRecording">
        Save Macro
      </button>
      <button @click="clearMacro" class="action-btn secondary" :disabled="!isRecording">
        Clear Macro
      </button>
    </div>
    <div v-if="notification" class="notification" :class="{ error: notification.isError }">
      <span>{{ notification.message }}</span>
      <button @click="notification = null" class="dismiss-btn">&times;</button>
    </div>
    <div class="macro-editor">
      <div v-if="layout.length && loaded" class="key-grid" :style="gridStyle">
        <div v-for="(row, rIdx) in layout" :key="`r-${rIdx}`" class="key-row">
          <div
            v-for="(keyInfo, cIdx) in row"
            :key="`k-${rIdx}-${cIdx}`"
            class="key-btn"
            :style="getKeyStyle(rIdx, cIdx)"
            :class="{ pressed: isKeyPressed(keyInfo.keyValue) }"
            @click="toggleKey(keyInfo)"
          >
            {{ keyMap[keyInfo.keyValue] || `Key ${keyInfo.keyValue}` }}
          </div>
        </div>
      </div>
      <div class="macro-sequence">
        <h3 class="subtitle">Current Sequence</h3>
        <div v-if="currentSequence.length" class="sequence-list">
          <div v-for="(event, index) in currentSequence" :key="index" class="sequence-item">
            <span>{{ formatEvent(event) }}</span>
            <input
              type="number"
              v-model.number="event.delay"
              min="0"
              step="10"
              class="delay-input"
              title="Delay (ms)"
              @input="validateDelay(index)"
            />
            <button @click="removeEventFromSequence(index)" class="remove-btn">&times;</button>
          </div>
        </div>
        <p v-else class="empty-text">No events in sequence</p>
      </div>
      <div class="macro-list">
        <div v-for="macro in macroList" :key="macro.id" class="macro-card">
          <h4 class="card-title">{{ macro.name }}</h4>
          <p class="card-text">Date: {{ macro.date }}</p>
          <p class="card-text">Length: {{ macro.length }} steps</p>
          <div class="card-actions">
            <button @click="loadMacro(macro.id.toString())" class="card-btn">Load</button>
            <button @click="deleteMacro(macro.id.toString())" class="card-btn delete">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, onMounted } from 'vue';
import KeyboardService from '@services/KeyboardService';
import { keyMap } from '@utils/keyMap';
import { useMappedKeyboard } from '@utils/MappedKeyboard';
import type { IDefKeyInfo } from '../types/types';
import { useConnectionStore } from '../store/connection';

export default defineComponent({
  name: 'MacroRecording',
  setup() {
    const connectionStore = useConnectionStore();
    const selectedMacro = ref<string | null>(null);
    const macroName = ref<string>('');
    const layoutType = ref<'default' | 'mapped'>('default');
    const selectedLayer = ref(0);
    const layers = [0, 1, 2, 3]; // Fn1-Fn4
    const isRecording = ref(false);
    const currentSequence = ref<{ keyValue: number; action: 'down' | 'up'; delay: number }[]>([]);
    const pressedKeys = ref<Set<number>>(new Set());
    const notification = ref<{ message: string; isError: boolean } | null>(null);
    const macroNameInput = ref<HTMLInputElement | null>(null);
    const macroList = ref<{ id: number; name: string; date: string; length: number; step: { id: number; keyValue: number; status: number; delay: number }[] }[]>([]);

    // Use reactive layerIndex, null for default layout
    const layerIndex = ref<number | null>(layoutType.value === 'mapped' ? selectedLayer.value : null);
    const { layout, loaded, gridStyle, getKeyStyle, fetchLayerLayout } = useMappedKeyboard(layerIndex);

    const loadMacroList = () => {
      try {
        const stored = localStorage.getItem('MacroList');
        //console.log('Loading MacroList from localStorage:', stored);
        if (stored) {
          macroList.value = JSON.parse(stored);
        } else {
          macroList.value = [];
        }
      } catch (error) {
        console.error('Failed to load MacroList:', error);
        notification.value = { message: `Failed to load macros: ${(error as Error).message}`, isError: true };
      }
    };

    const startNewMacro = () => {
      //console.log('startNewMacro called');
      selectedMacro.value = 'new';
      currentSequence.value = [];
      pressedKeys.value.clear();
      macroName.value = '';
      notification.value = null;
      isRecording.value = true;
      if (macroNameInput.value) {
        macroNameInput.value.focus();
        //console.log('Focused macro name input');
      }
    };

    const loadMacro = (id: string) => {
      //console.log('Loading macro with id:', id);
      const macro = macroList.value.find(m => m.id === parseInt(id));
      if (macro) {
        currentSequence.value = macro.step.map((step, index) => ({
          keyValue: step.keyValue,
          action: step.status === 1 ? 'down' : 'up',
          delay: index === 0 ? 0 : step.delay,
        }));
        macroName.value = macro.name;
        selectedMacro.value = id;
        notification.value = { message: `Loaded macro ${macro.name}`, isError: false };
        pressedKeys.value.clear();
        currentSequence.value.forEach(event => {
          if (event.action === 'down') {
            pressedKeys.value.add(event.keyValue);
          } else {
            pressedKeys.value.delete(event.keyValue);
          }
        });
        //console.log('Pressed keys after load:', Array.from(pressedKeys.value));
        isRecording.value = true;
        if (macroNameInput.value) {
          macroNameInput.value.focus();
          //console.log('Focused macro name input after load');
        }
      } else {
        notification.value = { message: `Macro with ID ${id} not found`, isError: true };
      }
    };

    const saveMacro = () => {
      //console.log('saveMacro called with:', { selectedMacro: selectedMacro.value, currentSequenceLength: currentSequence.value.length, macroName: macroName.value });
      if (!currentSequence.value.length || !macroName.value) {
        console.warn('saveMacro conditions not met:', { currentSequenceLength: currentSequence.value.length, macroName: macroName.value });
        notification.value = { message: 'Cannot save: Sequence must not be empty and name must be provided', isError: true };
        return;
      }

      if (currentSequence.value.length > 64) {
        console.warn('Macro action limit exceeded:', { currentSequenceLength: currentSequence.value.length });
        notification.value = { message: 'Cannot save: Macro exceeds 64-action limit', isError: true };
        return;
      }

      if (selectedMacro.value === 'new') {
        const nameExists = macroList.value.some(m => m.name.toLowerCase() === macroName.value.toLowerCase());
        if (nameExists) {
          console.warn('Duplicate macro name:', macroName.value);
          notification.value = { message: `Cannot save: Macro name "${macroName.value}" already exists`, isError: true };
          return;
        }
      }

      try {
        const id = selectedMacro.value && selectedMacro.value !== 'new' ? parseInt(selectedMacro.value) : Date.now();
        const date = new Date().toLocaleString();
        const newMacro = {
          id,
          name: macroName.value,
          date,
          length: currentSequence.value.length,
          step: currentSequence.value.map((event, index) => ({
            id: index + 1,
            keyValue: event.keyValue,
            status: event.action === 'down' ? 1 : 0,
            delay: index === 0 ? 0 : event.delay,
          })),
        };
        loadMacroList();
        if (selectedMacro.value !== 'new' && macroList.value.some(m => m.id === id)) {
          macroList.value = macroList.value.map(m => (m.id === id ? newMacro : m));
          //console.log('Updated existing macro:', newMacro);
        } else {
          macroList.value = [...macroList.value, newMacro];
          //console.log('Appended new macro:', newMacro);
        }
        //console.log('Saving updated MacroList to localStorage:', JSON.stringify(macroList.value));
        localStorage.setItem('MacroList', JSON.stringify(macroList.value));
        selectedMacro.value = id.toString();
        notification.value = { message: `Saved macro ${macroName.value} to local storage`, isError: false };
        currentSequence.value = [];
        pressedKeys.value.clear();
        macroName.value = '';
        isRecording.value = false;
        //console.log('Virtual keyboard and macro name reset after save');
      } catch (error) {
        console.error('Failed to save macro:', error);
        notification.value = { message: `Failed to save macro: ${(error as Error).message}`, isError: true };
      }
    };

    const deleteMacro = (id: string) => {
      //console.log('deleteMacro called with id:', id);
      try {
        const macroId = parseInt(id);
        macroList.value = macroList.value.filter(m => m.id !== macroId);
        //console.log('Deleted macro with id:', id);
        //console.log('Saving updated MacroList to localStorage:', JSON.stringify(macroList.value));
        localStorage.setItem('MacroList', JSON.stringify(macroList.value));
        notification.value = { message: `Deleted macro`, isError: false };
        if (selectedMacro.value === id) {
          selectedMacro.value = null;
          currentSequence.value = [];
          macroName.value = '';
          pressedKeys.value.clear();
          isRecording.value = false;
        }
      } catch (error) {
        console.error('Failed to delete macro:', error);
        notification.value = { message: `Failed to delete macro: ${(error as Error).message}`, isError: true };
      }
    };

    const clearMacro = () => {
      //console.log('clearMacro called');
      currentSequence.value = [];
      pressedKeys.value.clear();
      macroName.value = '';
      notification.value = null;
      isRecording.value = false;
    };

    const isKeyPressed = (keyValue: number) => {
      const events = currentSequence.value.filter(event => event.keyValue === keyValue);
      if (events.length === 0) return false;
      let downCount = 0;
      events.forEach(event => {
        if (event.action === 'down') downCount++;
        else if (event.action === 'up') downCount--;
      });
      return downCount > 0;
    };

    const toggleKey = (keyInfo: IDefKeyInfo) => {
      //console.log('toggleKey called with keyInfo:', keyInfo);
      if (currentSequence.value.length >= 64) {
        console.warn('Cannot add action: Macro has reached 64-action limit');
        notification.value = { message: 'Cannot add action: Macro has reached 64-action limit', isError: true };
        return;
      }
      const keyValue = keyInfo.keyValue;
      const events = currentSequence.value.filter(event => event.keyValue === keyValue);
      let downCount = 0;
      events.forEach(event => {
        if (event.action === 'down') downCount++;
        else if (event.action === 'up') downCount--;
      });
      const isCurrentlyDown = downCount > 0;
      if (isCurrentlyDown) {
        currentSequence.value.push({ keyValue, action: 'up', delay: 50 });
        pressedKeys.value.delete(keyValue);
      } else {
        currentSequence.value.push({ keyValue, action: 'down', delay: 50 });
        pressedKeys.value.add(keyValue);
      }
      //console.log('Current sequence after toggle:', currentSequence.value);
    };

    const formatEvent = (event: { keyValue: number; action: 'down' | 'up'; delay: number }) => {
      const displayKey = keyMap[event.keyValue] || `Key ${event.keyValue}`;
      return `${displayKey} ${event.action} (${event.delay}ms)`;
    };

    const validateDelay = (index: number) => {
      if (currentSequence.value[index].delay < 0) {
        currentSequence.value[index].delay = 0;
      }
    };

    const removeEventFromSequence = (index: number) => {
      //console.log('removeEventFromSequence called with index:', index);
      const event = currentSequence.value[index];
      currentSequence.value.splice(index, 1);
      const events = currentSequence.value.filter(e => e.keyValue === event.keyValue);
      let downCount = 0;
      events.forEach(e => {
        if (e.action === 'down') downCount++;
        else if (e.action === 'up') downCount--;
      });
      if (downCount > 0) {
        pressedKeys.value.add(event.keyValue);
      } else {
        pressedKeys.value.delete(event.keyValue);
      }
      //console.log('Current sequence after removal:', currentSequence.value);
      //console.log('Pressed keys after removal:', Array.from(pressedKeys.value));
    };

    watch([layoutType, selectedLayer], () => {
      //console.log('Layout or layer changed:', { layoutType: layoutType.value, selectedLayer: selectedLayer.value });
      layerIndex.value = layoutType.value === 'mapped' ? selectedLayer.value : null;
      fetchLayerLayout();
    });

    onMounted(() => {
      loadMacroList();
      fetchLayerLayout();
      //console.log('MacroRecording.vue mounted');
    });

    return {
      selectedMacro,
      macroName,
      layout,
      loaded,
      currentSequence,
      pressedKeys,
      keyMap,
      gridStyle,
      getKeyStyle,
      isKeyPressed,
      toggleKey,
      formatEvent,
      validateDelay,
      removeEventFromSequence,
      saveMacro,
      loadMacro,
      macroList,
      notification,
      deleteMacro,
      startNewMacro,
      isRecording,
      macroNameInput,
      layoutType,
      selectedLayer,
      layers,
    };
  }
});
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@styles/variables' as v;

.macros-page {
  padding: 20px;
  color: v.$text-color;

  .title {
    color: v.$primary-color;
    margin-bottom: 10px;
    margin-top: 0px;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .subtitle {
    color: v.$primary-color;
    margin-bottom: 8px;
    font-size: 1.2rem;
    font-weight: 600;
  }

  .controls {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;

    .control-label {
      margin-right: 5px;
      color: v.$text-color;
    }

    .control-select,
    .text-input,
    .number-input {
      padding: 8px;
      border-radius: v.$border-radius;
      background-color: v.$background-dark;
      color: v.$text-color;
      border: 1px solid rgba(v.$text-color, 0.2);
      font-size: 1rem;
    }

    .text-input {
      width: 150px;
    }

    .number-input {
      width: 60px;
    }

    .action-btn {
      padding: 8px 16px;
      background-color: v.$primary-color;
      color: #1f2937;
      border: none;
      border-radius: v.$border-radius;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 500;

      &.secondary {
        background-color: #374151;
      }

      &:disabled {
        background-color: color.adjust(v.$background-dark, $lightness: 10%);
        cursor: not-allowed;
        color: rgba(v.$text-color, 0.4);
      }

      &:hover:not(:disabled) {
        background-color: color.adjust(v.$primary-color, $lightness: 10%);
      }
    }
  }

  .notification {
    padding: 10px;
    margin-bottom: 16px;
    border-radius: v.$border-radius;
    background-color: rgba(v.$background-dark, 1.1);
    color: v.$text-color;
    display: flex;
    align-items: center;

    &.error {
      background-color: color.mix(#ef4444, v.$background-dark, 50%);
    }

    .dismiss-btn {
      margin-left: 10px;
      padding: 0 6px;
      background: none;
      border: none;
      color: v.$text-color;
      cursor: pointer;
      font-size: 1rem;

      &:hover {
        color: rgba(v.$text-color, 0.6);
      }
    }
  }

  .macro-editor {
    display: flex;
    flex-direction: column;
    gap: 24px;
    max-height: calc(100vh - 150px);
    overflow-y: auto;
  }

  .key-grid {
    display: block;
    position: relative;
    width: fit-content;
    margin: 0 auto;
    min-height: 300px;
    max-height: 500px;
    flex-shrink: 0;
  }

  .key-row {
    display: contents;
  }

  .key-btn {
    position: absolute;
    padding: 4px;
    border: 2px solid rgba(v.$text-color, 0.3);
    border-radius: v.$border-radius;
    background: linear-gradient(to bottom, v.$background-dark 70%, color.adjust(v.$background-dark, $lightness: 10%) 100%);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2), inset 0 -2px 4px rgba(255, 255, 255, 0.2);
    color: v.$text-color;
    cursor: pointer;
    transition: all 0.2s ease;
    box-sizing: border-box;
    user-select: none;
    text-align: center;

    &.pressed {
      border-color: v.$accent-color;
      box-shadow: 0 0 8px rgba(v.$accent-color, 0.5);
    }
  }

  .macro-sequence {
    padding: 10px;
    border: 1px solid rgba(v.$text-color, 0.2);
    border-radius: v.$border-radius;
    background-color: rgba(v.$background-dark, 0.98);

    .sequence-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .sequence-item {
        display: flex;
        align-items: center;
        padding: 6px 12px;
        background-color: color.adjust(v.$background-dark, $lightness: -5%);
        border: 1px solid rgba(v.$text-color, 0.2);
        border-radius: v.$border-radius;
        color: v.$text-color;

        .delay-input {
          width: 60px;
          margin-left: 8px;
          padding: 2px;
          border: 1px solid rgba(v.$text-color, 0.2);
          border-radius: v.$border-radius;
          background-color: v.$background-dark;
          color: v.$text-color;
          font-size: 0.875rem;
          text-align: center;

          &:focus {
            outline: none;
            box-shadow: 0 0 0 2px rgba(v.$primary-color, 0.5);
          }
        }

        .remove-btn {
          margin-left: 8px;
          padding: 0 6px;
          background-color: rgba(v.$background-dark, 1.1);
          border: 1px solid rgba(v.$text-color, 0.2);
          border-radius: v.$border-radius;
          color: v.$text-color;
          cursor: pointer;

          &:hover {
            background-color: rgba(v.$background-dark, 1.2);
          }
        }
      }
    }

    .empty-text {
      color: rgba(v.$text-color, 0.6);
    }
  }

  .macro-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 16px;

    .macro-card {
      padding: 8px 12px;
      background-color: v.$background-dark;
      border: 1px solid rgba(v.$text-color, 0.2);
      border-radius: v.$border-radius;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: box-shadow 0.3s ease;
      cursor: pointer;

      .card-title {
        text-decoration: underline
        ;
        text-transform:uppercase;
        font-size: 1.125rem;
        font-weight: 600;
        color: v.$primary-color;
        margin: 0px;
      }

      .card-text {        
        font-size: 0.875rem;
        color: rgba(v.$text-color, 0.6);
        margin-bottom: 0px;
        margin: 0px;
      }

      .card-actions {
        display: flex;
        gap: 8px;
        margin-top: 4px;
      }

      .card-btn {
        padding: 2px 8px;
        background-color: v.$primary-color;
        color: #1f2937;
        font-weight: 500;
        border: none;
        border-radius: v.$border-radius;
        width: 48%;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: bolder;

        &:hover {
          background-color: color.adjust(v.$primary-color, $lightness: 10%);
        }

        &:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(v.$primary-color, 0.5);
        }

        &.delete {
          background-color: #ef4444a2;

          &:hover {
            background-color: color.adjust(#ef4444a2, $lightness: 10%);
          }
        }
      }

      &:hover {
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
    }
  }
}
</style>
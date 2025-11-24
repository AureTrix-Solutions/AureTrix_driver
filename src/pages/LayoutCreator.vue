<template>
  <div class="layout-creator-page">
    <h2 class="title">Keyboard Creator</h2>
    <div v-if="notification" class="notification" :class="{ error: notification.isError }">
      {{ notification.message }}
      <button @click="notification = null" class="dismiss-btn">&times;</button>
    </div>

    <div class="layout-creator-container">
      <div v-if="virtualKeyboard.length" class="key-grid" :style="gridStyle">
        <div v-for="(row, rIdx) in virtualKeyboard" :key="`vrow-${rIdx}`" class="key-row">
          <div v-for="(key, kIdx) in row" :key="`vkey-${rIdx}-${kIdx}`" class="key-btn"
            :class="{ 'creator-key-selected': isKeySelected(rIdx, kIdx) }" :style="getKeyStyle(rIdx, kIdx)"
            @click="selectKey(rIdx, kIdx)">
            <div class="key-label">{{ key.size }}u</div>
          </div>
        </div>
      </div>
      <div v-else class="no-layout">
        <p>Enter row counts below to generate virtual keyboard</p>
      </div>
      <div class="bottom-section">
        <div class="selection-buttons">
          <button @click="saveLayout" class="select-btn">Save Layout</button>
          <button @click="exportCompactCode" class="select-btn">Export Layout</button>
          <button @click="importLayout" class="select-btn">Import Layout</button>
          <button @click="shareLayout" class="select-btn" :disabled="isCommunityLayoutExists">Share</button>
          <button @click="goBack" class="select-btn">Cancel</button>
          <input ref="importFileInput" type="file" accept=".json,.txt" @change="handleImportFile" style="display: none" />
        </div>
        <div class="parent">
          <div class="settings-panel">
            <!-- Product Name and Load Saved -->
            <div class="settings-section">
              <div class="input-row">
                <div class="input-group">
                  <div class="label">Product Name</div>
                  <input v-model="productName" type="text" placeholder="Enter keyboard name" class="text-input" />
                </div>
                <div class="input-group">
                  <div class="label">Load Saved Layout</div>
                  <select v-model="selectedSavedLayout" @change="loadSelectedLayout" class="select-input">
                    <option value="">-- Select a saved layout --</option>
                    <option v-for="layout in savedLayouts" :key="layout.productName" :value="layout.productName">
                      {{ layout.productName }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Row Keycount/Gap Section -->
            <div class="settings-section">
              <div class="header-row">
                <h3>Row Keycount/Gap</h3>
              </div>
              <!-- Row Counts Row -->
              <div class="row-inputs-row">
                <div v-for="i in 6" :key="`row-${i}`" class="input-group">
                  <div class="label">Row{{ i - 1 }}</div>
                  <input v-model.number="rowCounts[i - 1]" type="number" min="0" placeholder="0"
                    class="number-input" />
                </div>
              </div>
              <!-- Gap Inputs Row -->
              <div class="gap-inputs-row">
                <div v-for="i in 6" :key="`gap-${i}`" class="input-group">
                  <div class="label">Gap{{ i - 1 }} (mm)</div>
                  <input v-model.number="rowGaps[i - 1]" type="number" min="0" step="0.1" placeholder="0"
                    class="number-input" />
                </div>
              </div>
            </div>

            <!-- Edit Keys Section -->
            <div class="settings-section">
              <div class="header-row">
                <h3>Edit Keys ({{ selectedKeys.length }} selected)</h3>
                <button @click="clearSelection" class="clear-selection-btn">Clear</button>
              </div>
              <div class="key-editor-controls">
                <div class="input-group">
                  <div class="label">Size (Preset)</div>
                  <select v-model.number="selectedKeyData.size" @change="onSizePresetChange" class="select-input">
                    <option v-for="keySize in KEY_SIZES" :key="keySize.units" :value="keySize.units">
                      {{ keySize.label }}
                    </option>
                  </select>
                </div>
                <div class="input-group">
                  <div class="label">Size (mm)</div>
                  <input v-model.number="selectedKeyData.sizeMm" type="number" min="0" step="0.1"
                    @input="updateSelectedKey" class="number-input" />
                </div>
                <div class="input-group">
                  <div class="label">Gap After (mm)</div>
                  <input v-model.number="selectedKeyData.gap" type="number" min="0" step="0.1"
                    @input="updateSelectedKey" class="number-input" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="isCommunityLayoutExists" class="share-disabled-message">
        A community layout already exists for "{{ productName }}". You can save custom modifications locally using Save Layout.
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useConnectionStore } from '@/store/connection';
import LayoutStorageService from '@/services/LayoutStorageService';
import KeyboardService from '@/services/KeyboardService';
import { uToMm, KEY_SIZES, mmToPx } from '@/utils/keyUnits';
import { sharedLayoutMap } from '@/utils/sharedLayout';
import { refreshCustomLayouts, getPaddedKeySizes } from '@/utils/layoutConfigs';

interface VirtualKey {
  size: number; // units (1, 1.25, 2, etc.)
  sizeMm: number; // actual mm value for fine-tuning
  gap: number;
}

export default defineComponent({
  name: 'LayoutCreator',
  setup() {
    const router = useRouter();
    const connectionStore = useConnectionStore();

    const productName = ref('');
    const hasAxisList = ref(false);
    const rowCounts = ref<(number | undefined)[]>([undefined, undefined, undefined, undefined, undefined, undefined]);
    const rowGaps = ref<(number | undefined)[]>([undefined, undefined, undefined, undefined, undefined, undefined]);
    const virtualKeyboard = ref<VirtualKey[][]>([]);
    const previousRowCounts = ref<(number | undefined)[]>([undefined, undefined, undefined, undefined, undefined, undefined]);

    const selectedKeys = ref<{ row: number; col: number }[]>([]);
    const selectedKeyData = ref<VirtualKey>({ size: 1, sizeMm: uToMm(1), gap: 0 });
    const notification = ref<{ message: string; isError: boolean } | null>(null);
    const savedLayouts = ref<any[]>([]);
    const selectedSavedLayout = ref('');
    const importFileInput = ref<HTMLInputElement | null>(null);

    const isCommunityLayoutExists = computed(() => {
      const trimmedName = productName.value.trim();
      return !!trimmedName && trimmedName in sharedLayoutMap;
    });

    const loadSavedLayouts = async () => {
      try {
        savedLayouts.value = await LayoutStorageService.getAllLayouts();
      } catch (error) {
        console.warn('Failed to load saved layouts:', error);
      }
    };

    const hasLoadedHardwareLayout = ref(false);

    const initializeFallbackLayout = () => {
      // Always show fallback 6-row layout immediately with padding
      const paddedKeySizes = getPaddedKeySizes(null); // null = use default 6 rows
      
      // Build virtualKeyboard from padded keySizes
      const keyboard: VirtualKey[][] = paddedKeySizes.map(row => 
        row.map(sizeMm => ({ size: sizeMm / 19.05, sizeMm, gap: 0 }))
      );
      virtualKeyboard.value = keyboard;
      
      // Update rowCounts to match actual key counts per row
      const counts = paddedKeySizes.map(row => row.length);
      // Pad to ensure we have at least 6 slots for UI consistency
      while (counts.length < 6) {
        counts.push(undefined);
      }
      rowCounts.value = counts;
      previousRowCounts.value = [...counts];
      selectedKeys.value = [];
    };

    const loadHardwareLayout = async () => {
      // Try to load actual hardware layout when connection is ready
      // Don't use hasLoadedHardwareLayout as early return - allow retries
      
      try {
        if (connectionStore.isInitialized && connectionStore.isConnected && !hasLoadedHardwareLayout.value) {
          // Retry logic to handle delayed SDK responses
          const maxRetries = 5;
          let attempt = 0;
          let baseLayout = null;
          
          while (attempt < maxRetries && !baseLayout && !hasLoadedHardwareLayout.value) {
            baseLayout = await KeyboardService.defKey();
            if (baseLayout && baseLayout.length > 0) {
              break; // Got valid layout
            }
            // Exponential backoff: 100ms, 200ms, 400ms, 800ms, 1600ms
            await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
            attempt++;
          }
          
          if (baseLayout && baseLayout.length > 0 && !hasLoadedHardwareLayout.value) {
            // Get fully padded keySizes using baseLayout
            const paddedKeySizes = getPaddedKeySizes(baseLayout);
            
            // Build virtualKeyboard from padded keySizes
            const keyboard: VirtualKey[][] = paddedKeySizes.map(row => 
              row.map(sizeMm => ({ size: sizeMm / 19.05, sizeMm, gap: 0 }))
            );
            virtualKeyboard.value = keyboard;
            
            // Update rowCounts to match actual key counts per row
            const counts = paddedKeySizes.map(row => row.length);
            // Pad to ensure we have at least 6 slots for UI consistency
            while (counts.length < 6) {
              counts.push(undefined);
            }
            rowCounts.value = counts;
            previousRowCounts.value = [...counts];
            hasLoadedHardwareLayout.value = true;
            selectedKeys.value = [];
            
            // Update product name once we have hardware info
            if (connectionStore.deviceInfo?.productName) {
              productName.value = connectionStore.deviceInfo.productName;
            }
          }
        }
      } catch (error) {
        console.warn('Could not load hardware keyboard layout:', error);
      }
    };

    // Reset hardware layout flag when keyboard disconnects
    watch(
      () => connectionStore.isConnected,
      (isConnected) => {
        if (!isConnected) {
          hasLoadedHardwareLayout.value = false;
          // Revert to fallback layout when disconnected
          initializeFallbackLayout();
        }
      }
    );

    // Watch for device changes (hot-swap scenario) - watch entire deviceInfo object
    watch(
      () => JSON.stringify(connectionStore.deviceInfo),
      async (newInfo, oldInfo) => {
        // Trigger on initial connection (oldInfo null → newInfo populated) or device change
        if (newInfo && newInfo !== oldInfo) {
          hasLoadedHardwareLayout.value = false;
          // Only show fallback if this is a change, not initial load
          if (oldInfo) {
            initializeFallbackLayout();
          }
          // Immediately load new hardware layout if connection is ready
          if (connectionStore.isInitialized) {
            await loadHardwareLayout();
          }
        }
      }
    );

    // Watch for connection becoming ready and load hardware layout
    watch(
      () => connectionStore.isInitialized,
      async (isInitialized, wasInitialized) => {
        // Trigger on rising edge (false → true) or when not yet loaded
        if (isInitialized && (!wasInitialized || !hasLoadedHardwareLayout.value)) {
          await loadHardwareLayout();
        }
      }
    );

    onMounted(async () => {
      // Always show fallback layout immediately
      initializeFallbackLayout();

      // Set initial product name
      if (connectionStore.deviceInfo?.productName) {
        productName.value = connectionStore.deviceInfo.productName;
      } else {
        productName.value = 'Custom Keyboard';
      }

      // Try to load hardware layout if already connected
      if (connectionStore.isInitialized && !hasLoadedHardwareLayout.value) {
        await loadHardwareLayout();
      }

      try {
        const axisResult = await KeyboardService.getAxisList();
        if (!(axisResult instanceof Error)) {
          hasAxisList.value = axisResult.hasAxisSetting;
        }
      } catch (error) {
        console.warn('Could not fetch axis list:', error);
      }

      await loadSavedLayouts();
    });

    const generateVirtualKeyboard = () => {
      const oldKeyboard = virtualKeyboard.value;
      
      // Build a map from actual row index to old virtual keyboard row
      // using the PREVIOUS rowCounts snapshot
      const oldRowMap = new Map<number, VirtualKey[]>();
      let oldVirtualRowIdx = 0;
      for (let i = 0; i < previousRowCounts.value.length; i++) {
        const count = previousRowCounts.value[i];
        if (count && count > 0 && oldVirtualRowIdx < oldKeyboard.length) {
          oldRowMap.set(i, oldKeyboard[oldVirtualRowIdx]);
          oldVirtualRowIdx++;
        }
      }

      // Build new keyboard using CURRENT rowCounts, preserving data by actual row index
      const keyboard: VirtualKey[][] = [];
      for (let i = 0; i < rowCounts.value.length; i++) {
        const count = rowCounts.value[i];
        if (count && count > 0) {
          const row: VirtualKey[] = [];
          const oldRow = oldRowMap.get(i); // Get old data for this actual row index
          
          for (let j = 0; j < count; j++) {
            const existingKey = oldRow?.[j];
            if (existingKey) {
              // Copy existing key data from the same actual row position
              row.push({ ...existingKey });
            } else {
              // Create new default key for new positions
              row.push({ size: 1, sizeMm: uToMm(1), gap: 0 });
            }
          }
          keyboard.push(row);
        }
      }

      virtualKeyboard.value = keyboard;
      selectedKeys.value = [];
      
      // Update snapshot for next change
      previousRowCounts.value = [...rowCounts.value];
    };

    // Watch rowCounts for changes and regenerate keyboard while preserving existing key data
    watch(
      rowCounts,
      () => {
        generateVirtualKeyboard();
      },
      { deep: true }
    );

    const getActualRowIndex = (virtualRowIdx: number): number => {
      let count = 0;
      for (let i = 0; i < rowCounts.value.length; i++) {
        if (rowCounts.value[i] && rowCounts.value[i]! > 0) {
          if (count === virtualRowIdx) {
            return i;
          }
          count++;
        }
      }
      return 0;
    };

    const getKeyStyle = (rowIdx: number, colIdx: number) => {
      let top = 0;
      let left = 0;

      // Calculate top position
      for (let i = 0; i < rowIdx; i++) {
        top += mmToPx(uToMm(1)); // Standard key height from keyUnits.ts
        const actualGapIdx = getActualRowIndex(i);
        const gap = rowGaps.value[actualGapIdx];
        top += mmToPx((gap || 0) + 1); // User-defined gap + 1mm built-in spacing
      }

      // Calculate left position
      const currentRow = virtualKeyboard.value[rowIdx];
      for (let i = 0; i < colIdx; i++) {
        const key = currentRow[i];
        left += mmToPx(key.sizeMm); // Use actual mm value
        if (key.gap > 0) {
          left += mmToPx(key.gap);
        }
        left += mmToPx(1);
      }

      const key = currentRow[colIdx];
      const width = mmToPx(key.sizeMm); // Use actual mm value
      const height = mmToPx(uToMm(1)); // Standard key height from keyUnits.ts

      return {
        position: 'absolute' as const,
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`,
        height: `${height}px`
      };
    };

    const gridStyle = computed(() => {
      if (!virtualKeyboard.value.length) {
        return { height: '300px', width: '600px' };
      }

      let totalHeight = 0;
      for (let i = 0; i < virtualKeyboard.value.length; i++) {
        totalHeight += mmToPx(uToMm(1)); // Standard key height from keyUnits.ts
        const actualGapIdx = getActualRowIndex(i);
        const gap = rowGaps.value[actualGapIdx];
        totalHeight += mmToPx((gap || 0) + 1); // User-defined gap + 1mm built-in spacing
      }

      let maxWidth = 0;
      virtualKeyboard.value.forEach(row => {
        let rowWidth = 0;
        row.forEach(key => {
          rowWidth += mmToPx(key.sizeMm); // Use actual mm value
          if (key.gap > 0) {
            rowWidth += mmToPx(key.gap);
          }
          rowWidth += mmToPx(1);
        });
        if (rowWidth > maxWidth) {
          maxWidth = rowWidth;
        }
      });

      return {
        position: 'relative' as const,
        height: `${totalHeight}px`,
        width: `${maxWidth}px`,
        minHeight: '300px',
        maxHeight: '500px'
      };
    });

    const isKeySelected = (row: number, col: number): boolean => {
      return selectedKeys.value.some(k => k.row === row && k.col === col);
    };

    const selectKey = (row: number, col: number) => {
      const keyIndex = selectedKeys.value.findIndex(k => k.row === row && k.col === col);

      if (keyIndex >= 0) {
        // Key is already selected - deselect it
        selectedKeys.value.splice(keyIndex, 1);
        // Update selectedKeyData to reflect remaining selection
        if (selectedKeys.value.length > 0) {
          const firstKey = selectedKeys.value[0];
          selectedKeyData.value = { ...virtualKeyboard.value[firstKey.row][firstKey.col] };
        }
      } else {
        // Key is not selected - add it to selection
        selectedKeys.value.push({ row, col });
        // Update selectedKeyData to reflect the newly selected key
        selectedKeyData.value = { ...virtualKeyboard.value[row][col] };
      }
    };

    const clearSelection = () => {
      selectedKeys.value = [];
      selectedKeyData.value = { size: 1, sizeMm: uToMm(1), gap: 0 };
    };

    const onSizePresetChange = () => {
      // When user selects from dropdown, update the mm field to match the preset
      selectedKeyData.value.sizeMm = uToMm(selectedKeyData.value.size);
      updateSelectedKey();
    };

    const updateSelectedKey = () => {
      if (selectedKeys.value.length > 0) {
        // Apply changes to all selected keys
        selectedKeys.value.forEach(key => {
          virtualKeyboard.value[key.row][key.col] = { ...selectedKeyData.value };
        });
      }
    };

    // Helper function to convert array to compact syntax
    const arrayToCompactSyntax = (arr: number[]): string => {
      const segments: string[] = [];
      let i = 0;

      while (i < arr.length) {
        const current = arr[i];
        let count = 1;

        // Count consecutive identical values
        while (i + count < arr.length && arr[i + count] === current) {
          count++;
        }

        if (count >= 3) {
          // Use Array.fill() for 3 or more consecutive values
          segments.push(`Array(${count}).fill(${current})`);
          i += count;
        } else {
          // Add individual values
          for (let j = 0; j < count; j++) {
            segments.push(String(current));
          }
          i += count;
        }
      }

      // Format output
      if (segments.length === 1 && segments[0].startsWith('Array(')) {
        return segments[0];
      } else if (segments.every(s => !s.startsWith('Array('))) {
        return `[${segments.join(', ')}]`;
      } else {
        // Mixed format - use concat
        const first = segments[0].startsWith('Array(') ? segments[0] : `[${segments[0]}]`;
        if (segments.length === 1) return first;

        const rest = segments.slice(1).map(s =>
          s.startsWith('Array(') ? s : s
        );
        return `${first}.concat(${rest.join(', ')})`;
      }
    };

    const saveLayout = async () => {
      if (!productName.value.trim()) {
        notification.value = { message: 'Please enter a product name', isError: true };
        return;
      }

      if (!virtualKeyboard.value.length) {
        notification.value = { message: 'Please add rows to create a layout', isError: true };
        return;
      }

      const keySizes: number[][] = virtualKeyboard.value.map(row =>
        row.map(key => key.sizeMm) // Use actual mm value
      );

      const gapsAfterCol = virtualKeyboard.value.map(row => {
        const gaps: Record<number, number> = {};
        row.forEach((key, idx) => {
          if (key.gap > 0) {
            gaps[idx] = key.gap;
          }
        });
        return gaps;
      });

      const rowSpacing: number[] = [];
      for (let i = 0; i < virtualKeyboard.value.length; i++) {
        const actualGapIdx = getActualRowIndex(i);
        const gap = rowGaps.value[actualGapIdx];
        rowSpacing.push((gap || 0) + uToMm(1) + 1); // User gap + key height + 1mm built-in spacing
      }

      const layout = {
        productName: productName.value,
        hasAxisList: hasAxisList.value,
        keySizes,
        gapsAfterCol,
        rowSpacing,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      try {
        await LayoutStorageService.saveLayout(layout);
        notification.value = { message: 'Layout saved successfully!', isError: false };
        // Reload saved layouts list after saving
        await loadSavedLayouts();
        // Refresh the global layout cache so changes are immediately available app-wide
        await refreshCustomLayouts();
      } catch (error) {
        console.error('Failed to save layout:', error);
        notification.value = { message: 'Failed to save layout. Please try again.', isError: true };
      }
    };

    const exportCompactCode = () => {
      if (!productName.value.trim()) {
        notification.value = { message: 'Please enter a product name', isError: true };
        return;
      }

      if (!virtualKeyboard.value.length) {
        notification.value = { message: 'Please add rows to create a layout', isError: true };
        return;
      }

      const keySizes: number[][] = virtualKeyboard.value.map(row =>
        row.map(key => key.sizeMm) // Use actual mm value
      );

      const gapsAfterCol = virtualKeyboard.value.map(row => {
        const gaps: Record<number, number> = {};
        row.forEach((key, idx) => {
          if (key.gap > 0) {
            gaps[idx] = key.gap;
          }
        });
        return gaps;
      });

      const rowSpacing: number[] = [];
      for (let i = 0; i < virtualKeyboard.value.length; i++) {
        const actualGapIdx = getActualRowIndex(i);
        const gap = rowGaps.value[actualGapIdx];
        rowSpacing.push((gap || 0) + uToMm(1) + 1); // User gap + key height + 1mm built-in spacing
      }

      const layout = {
        productName: productName.value,
        hasAxisList: hasAxisList.value,
        keySizes,
        gapsAfterCol,
        rowSpacing,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Download as JSON file
      const json = JSON.stringify(layout, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${productName.value.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_layout.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      notification.value = { message: 'Layout exported successfully!', isError: false };
    };

    const shareLayout = () => {
      if (!productName.value.trim()) {
        notification.value = { message: 'Please enter a product name', isError: true };
        return;
      }

      if (!virtualKeyboard.value.length) {
        notification.value = { message: 'Please add rows to create a layout', isError: true };
        return;
      }

      const keySizes: number[][] = virtualKeyboard.value.map(row =>
        row.map(key => key.sizeMm) // Use actual mm value
      );

      const gapsAfterCol = virtualKeyboard.value.map(row => {
        const gaps: Record<number, number> = {};
        row.forEach((key, idx) => {
          if (key.gap > 0) {
            gaps[idx] = key.gap;
          }
        });
        return gaps;
      });

      const rowSpacing: number[] = [];
      for (let i = 0; i < virtualKeyboard.value.length; i++) {
        const actualGapIdx = getActualRowIndex(i);
        const gap = rowGaps.value[actualGapIdx];
        rowSpacing.push((gap || 0) + uToMm(1) + 1); // User gap + key height + 1mm built-in spacing
      }

      const layout = {
        productName: productName.value,
        hasAxisList: hasAxisList.value,
        keySizes,
        gapsAfterCol,
        rowSpacing,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const githubUrl = LayoutStorageService.generateGitHubIssueLink(layout);
      window.open(githubUrl, '_blank');
      notification.value = { message: 'Opening GitHub issue page...', isError: false };
    };

    const loadSelectedLayout = async () => {
      if (!selectedSavedLayout.value) return;

      try {
        const layout = await LayoutStorageService.getLayout(selectedSavedLayout.value);
        if (!layout) {
          notification.value = { message: 'Layout not found', isError: true };
          return;
        }

        // Populate the editor with the saved layout
        productName.value = layout.productName;
        hasAxisList.value = layout.hasAxisList || false;

        // Reconstruct virtualKeyboard from keySizes and gapsAfterCol
        const keyboard: VirtualKey[][] = [];
        layout.keySizes.forEach((row: number[], rowIdx: number) => {
          const vRow: VirtualKey[] = [];
          row.forEach((sizeMm: number, colIdx: number) => {
            const gap = layout.gapsAfterCol[rowIdx]?.[colIdx] || 0;
            // Find closest preset size for UI
            const closestPreset = KEY_SIZES.reduce((prev, curr) => {
              return Math.abs(uToMm(curr.units) - sizeMm) < Math.abs(uToMm(prev.units) - sizeMm) ? curr : prev;
            });
            vRow.push({ size: closestPreset.units, sizeMm, gap });
          });
          keyboard.push(vRow);
        });

        virtualKeyboard.value = keyboard;

        // Reconstruct rowCounts and rowGaps
        const newRowCounts: (number | undefined)[] = [undefined, undefined, undefined, undefined, undefined, undefined];
        const newRowGaps: (number | undefined)[] = [undefined, undefined, undefined, undefined, undefined, undefined];
        
        keyboard.forEach((row, idx) => {
          newRowCounts[idx] = row.length;
          // Extract user-defined gap from rowSpacing (rowSpacing = gap + uToMm(1) + 1)
          const totalSpacing = layout.rowSpacing[idx] || 0;
          newRowGaps[idx] = totalSpacing - uToMm(1) - 1;
        });

        rowCounts.value = newRowCounts;
        rowGaps.value = newRowGaps;
        selectedKeys.value = [];
        
        // Update snapshot to prevent watcher from wiping loaded data
        previousRowCounts.value = [...newRowCounts];

        notification.value = { message: 'Layout loaded successfully!', isError: false };
      } catch (error) {
        console.error('Failed to load layout:', error);
        notification.value = { message: 'Failed to load layout', isError: true };
      }
    };

    const importLayout = () => {
      importFileInput.value?.click();
    };

    const handleImportFile = async (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const layout = JSON.parse(text);

        // Validate layout structure
        if (!layout.productName || !layout.keySizes || !layout.rowSpacing) {
          notification.value = { message: 'Invalid layout file format', isError: true };
          return;
        }

        // Same loading logic as loadSelectedLayout
        productName.value = layout.productName;
        hasAxisList.value = layout.hasAxisList || false;

        const keyboard: VirtualKey[][] = [];
        layout.keySizes.forEach((row: number[], rowIdx: number) => {
          const vRow: VirtualKey[] = [];
          row.forEach((sizeMm: number, colIdx: number) => {
            const gap = layout.gapsAfterCol[rowIdx]?.[colIdx] || 0;
            const closestPreset = KEY_SIZES.reduce((prev, curr) => {
              return Math.abs(uToMm(curr.units) - sizeMm) < Math.abs(uToMm(prev.units) - sizeMm) ? curr : prev;
            });
            vRow.push({ size: closestPreset.units, sizeMm, gap });
          });
          keyboard.push(vRow);
        });

        virtualKeyboard.value = keyboard;

        const newRowCounts: (number | undefined)[] = [undefined, undefined, undefined, undefined, undefined, undefined];
        const newRowGaps: (number | undefined)[] = [undefined, undefined, undefined, undefined, undefined, undefined];
        
        keyboard.forEach((row, idx) => {
          newRowCounts[idx] = row.length;
          const totalSpacing = layout.rowSpacing[idx] || 0;
          newRowGaps[idx] = totalSpacing - uToMm(1) - 1;
        });

        rowCounts.value = newRowCounts;
        rowGaps.value = newRowGaps;
        selectedKeys.value = [];
        
        // Update snapshot to prevent watcher from wiping imported data
        previousRowCounts.value = [...newRowCounts];

        notification.value = { message: 'Layout imported successfully!', isError: false };
      } catch (error) {
        console.error('Failed to import layout:', error);
        notification.value = { message: 'Failed to import layout file', isError: true };
      }

      // Reset file input
      if (target) target.value = '';
    };

    const goBack = () => {
      window.location.reload();
    };

    return {
      productName,
      rowCounts,
      rowGaps,
      virtualKeyboard,
      selectedKeys,
      selectedKeyData,
      notification,
      savedLayouts,
      selectedSavedLayout,
      importFileInput,
      isCommunityLayoutExists,
      gridStyle,
      generateVirtualKeyboard,
      getKeyStyle,
      isKeySelected,
      selectKey,
      clearSelection,
      onSizePresetChange,
      updateSelectedKey,
      saveLayout,
      exportCompactCode,
      importLayout,
      handleImportFile,
      loadSelectedLayout,
      shareLayout,
      goBack,
      KEY_SIZES
    };
  }
});
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@styles/variables' as v;

.layout-creator-page {
  padding: 20px;
  color: v.$text-color;

  .title {
    width: 500px;
    color: v.$primary-color;
    margin-bottom: 10px;
    margin-top: 0px;
    font-size: 1.5rem;
    font-weight: 600;
    font-family: v.$font-style;
  }

  .notification {
    padding: 10px;
    margin-bottom: 0px;
    border-radius: v.$border-radius;
    background-color: rgba(v.$background-dark, 1.1);
    color: v.$text-color;
    display: flex;
    align-items: center;

    &.error {
      background-color: color.mix(#ef4444, v.$background-dark, 50%);
    }

    .dismiss-btn {
      margin-left: auto;
      padding: 0 6px;
      background: none;
      border: none;
      color: v.$text-color;
      cursor: pointer;
      font-size: 1rem;
      font-family: v.$font-style;

      &:hover {
        color: rgba(v.$text-color, 0.6);
      }
    }
  }

  .layout-creator-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .no-layout {
    text-align: center;
    color: v.$text-color;
    font-size: 1rem;
    font-family: v.$font-style;
    padding: 60px 20px;
    border: v.$border-style;
    border-radius: v.$border-radius;
    background-color: color.adjust(v.$background-dark, $lightness: -3%);
  }

  .key-grid {
    display: block !important;
    position: relative;
    width: fit-content;
    margin: 0 auto;
    flex-shrink: 0;
    visibility: visible !important;
    z-index: 1;
  }

  .key-row {
    display: contents;
  }

  .key-btn {
    position: absolute;
    padding: 4px;
    border: v.$border-style;
    border-radius: v.$border-radius;
    background: linear-gradient(to bottom, v.$background-dark 70%, color.adjust(v.$background-dark, $lightness: 10%) 100%);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2), inset 0 -2px 4px rgba(255, 255, 255, 0.2);
    color: v.$text-color;
    cursor: pointer;
    transition: all 0.2s ease;
    box-sizing: border-box;
    user-select: none;
    text-align: center;
    font-family: v.$font-style;
    visibility: visible !important;
    z-index: 2;

    &:hover {
      background: linear-gradient(to bottom, color.adjust(v.$background-dark, $lightness: 5%) 70%, color.adjust(v.$background-dark, $lightness: 15%) 100%);
    }

    &.creator-key-selected {
      border-color: v.$accent-color;
      box-shadow: 0 0 8px rgba(v.$accent-color, 0.5);
    }

    .key-label {
      font-size: 0.85rem;
      font-weight: 300;
    }
  }

  .bottom-section {
    display: flex;
    flex: 1;
    flex-shrink: 0;
    gap: 10px;
    position: relative;
    margin-right: auto;
    margin-left: auto;
    margin-top: 20px;
    justify-content: center;
  }

  .selection-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;

    .select-btn {
      padding: 8px 8px;
      background-color: color.adjust(v.$background-dark, $lightness: -100%);
      color: v.$accent-color;
      border: v.$border-style;
      border-radius: v.$border-radius;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 400;
      transition: background-color 0.2s ease;
      width: 120px;
      text-align: center;
      font-family: v.$font-style;

      &:hover {
        background-color: color.adjust(v.$background-dark, $lightness: 10%);
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        
        &:hover {
          background-color: color.adjust(v.$background-dark, $lightness: -100%);
        }
      }
    }
  }

  .share-disabled-message {
    display: flex;
    margin-right: auto;
    margin-left: auto;
    position: relative;
    margin-top: -10px;
    padding: 10px;
    border-radius: v.$border-radius;
    background-color: color.adjust(v.$background-dark, $lightness: -100%);
    color: white;
    font-size: 0.9rem;
    font-weight: 400;
    font-family: v.$font-style;
    text-align: center;
    max-width: 500px;
  }

  .parent {
    display: flex;
    gap: 10px;
  }

  .settings-panel {
    width: 1425px;
    padding: 20px;
    border: 1px solid rgba(v.$text-color, 0.2);
    border-radius: v.$border-radius;
    background-color: color.adjust(v.$background-dark, $lightness: -100%);
  }

  .settings-section {
    flex-shrink: 0;
    border: 1px solid rgba(v.$text-color, 0.2);
    padding: 15px;
    margin-bottom: 10px;

    .header-row {
      display: flex;
      align-items: center;
      margin-bottom: 16px;

      h3 {
        margin: 0;
        width: auto;
        margin-bottom: -5px;
        margin-right: 10px;
        color: v.$primary-color;
        font-size: 1.5rem;
        font-weight: 400;
        font-family: v.$font-style;
      }

      .clear-selection-btn {
        padding: 3px 3px;
        background-color: color.adjust(v.$background-dark, $lightness: -100%);
        color: v.$accent-color;
        border: v.$border-style;
        border-radius: v.$border-radius;
        cursor: pointer;
        font-size: 0.7rem;
        font-weight: 500;
        font-family: v.$font-style;
        transition: background-color 0.2s ease;
        margin-bottom: -10px;

        &:hover {
          background-color: color.adjust(v.$background-dark, $lightness: 10%);
        }
      }
    }

    .input-row {
      display: flex;
      gap: 16px;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 6px;

      .label {
        color: v.$text-color;
        font-size: 0.9rem;
        font-weight: 300;
        font-family: v.$font-style;
      }

      .text-input,
      .number-input,
      .select-input {
        padding: 6px 8px;
        background-color: color.adjust(v.$background-dark, $lightness: -5%);
        border: v.$border-style;
        border-radius: v.$border-radius;
        color: v.$text-color;
        font-family: v.$font-style;
        font-size: 0.9rem;

        &:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(v.$accent-color, 0.3);
        }
      }

      .number-input {
        text-align: center;
        width: 80px;
      }
    }

    .row-inputs-row,
    .gap-inputs-row {
      display: flex;
      gap: 12px;
      justify-content: flex-start;
      margin-bottom: 12px;
    }

    .key-editor-controls {
      display: flex;
      gap: 16px;
    }
  }
}
</style>

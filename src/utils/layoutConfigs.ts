// layoutConfigs.ts
import LayoutStorageService, { type CustomLayoutConfig } from '@/services/LayoutStorageService';
import { sharedLayoutMap } from './sharedLayout';
import { mmToPx } from '@utils/keyUnits';

type LayoutConfig = {
  keySizes: number[][];
  gapsAfterCol: Record<number, number>[];
  rowSpacing: number[];
};

let customLayoutsCache: CustomLayoutConfig[] = [];

export async function loadCustomLayouts() {
  try {
    customLayoutsCache = await LayoutStorageService.getAllLayouts();
  } catch (error) {
    console.warn('Failed to load custom layouts:', error);
    customLayoutsCache = [];
  }
}

const layoutMap: Record<number, LayoutConfig> = {
  61: { // 60%
    keySizes: [
    Array(13).fill(19.05).concat(35.999),
    [27.5].concat(Array(12).fill(19.05), 27.5),
    [32.3].concat(Array(11).fill(19.05), 42.8625),
    [42.8625].concat(Array(10).fill(19.05), 52.5),
    Array(3).fill(23.8125).concat(123.4, Array(4).fill(23.8125)),
  ],
  gapsAfterCol: Array(5).fill({}),
  rowSpacing: Array(5).fill(20.05),
},
  67: { // 65% 67-key
    keySizes: [
    Array(13).fill(19.05).concat(35.999, 19.05),
    [27.5].concat(Array(12).fill(19.05), 27.5, 19.05),
    [32.3].concat(Array(11).fill(19.05), 42.8625, 19.05),
    [42.8625].concat(Array(10).fill(19.05), 32.3, 19.05, 19.05),
    Array(3).fill(23.8125).concat(123.4, 23.8125, 23.8125, Array(3).fill(19.05)),
  ],
  gapsAfterCol: [{}, {}, {}, {}, { 5: 9.5 }],
  rowSpacing: Array(5).fill(20.05),
}
,
  68: { // 65% 68-key
    keySizes: [
    Array(13).fill(19.05).concat(35.999, 19.05),
    [27.5].concat(Array(12).fill(19.05), 27.5, 19.05),
    [32.3].concat(Array(11).fill(19.05), 42.8625, 19.05),
    [42.8625].concat(Array(10).fill(19.05), 32.3, 19.05, 19.05),
    Array(3).fill(23.8125).concat(122.3, Array(6).fill(19.05)),
  ],
  gapsAfterCol: Array(5).fill({}),
  rowSpacing: Array(5).fill(20.05),
},
  80: { // 75% 80-key
    keySizes: [
    Array(15).fill(19.05),
    Array(13).fill(19.05).concat(35.999, 19.05),
    [27.5].concat(Array(12).fill(19.05), 27.5, 19.05),
    [32.3].concat(Array(11).fill(19.05), 42.8625),
    [42.8625].concat(Array(10).fill(19.05), 32.3, 19.05),
    Array(3).fill(23.8125).concat(119.38, 23.8125, 23.8125, Array(3).fill(19.05)),
  ],
  gapsAfterCol: [{ 0: 4.25, 4: 4.25, 8: 4.25, 12: 4.25 }, {}, {}, {}, {}, { 5: 13.4 }],
  rowSpacing: [24.3].concat(Array(5).fill(20.05)),
},
  82: { // 75% 82-key
    keySizes: [
    Array(15).fill(19.05),
    Array(13).fill(19.05).concat(35.999, 19.05),
    [27.5].concat(Array(12).fill(19.05), 27.5, 19.05),
    [32.3].concat(Array(11).fill(19.05), 42.8625, 19.05),
    [42.8625].concat(Array(10).fill(19.05), 32.3, 19.05, 19.05),
    Array(3).fill(23.8125).concat(119.38, 23.8125, 23.8125, Array(3).fill(19.05)),
  ],
  gapsAfterCol: [{ 0: 4.25, 4: 4.25, 8: 4.25, 12: 4.25 }, {}, {}, {}, {}, { 5: 13.4 }],
  rowSpacing: [24.3].concat(Array(5).fill(20.05)),
},
  84: { // 75% 84-key
    keySizes: [
    Array(16).fill(19.05),
    Array(13).fill(19.05).concat(39.03, 19.05),
    [28.98].concat(Array(12).fill(19.05), 28.98, 19.05),
    [35.999].concat(Array(11).fill(19.05), 42.4, 19.05),
    [42.8625].concat(Array(10).fill(19.05), 35.5, 19.05, 19.05),
    Array(3).fill(23.8125).concat(125.3, Array(6).fill(19.05)),
  ],
  gapsAfterCol: Array(6).fill({}),
  rowSpacing: Array(6).fill(20.05),
},
  87: { // TKL 87-key
    keySizes: [
    Array(16).fill(19.05),
    Array(13).fill(19.05).concat(35.999, Array(3).fill(19.05)),
    [27.5].concat(Array(12).fill(19.05), 27.5, Array(3).fill(19.05)),
    [32.3].concat(Array(11).fill(19.05), 42.8625),
    [42.8625].concat(Array(10).fill(19.05), 52.3, 19.05),
    Array(3).fill(23.8125).concat(123.4, Array(4).fill(23.8125), Array(3).fill(19.05)),
  ],
  gapsAfterCol: [{ 0: 20, 4: 8.4, 8: 8.4, 12: 8.4 }, { 13: 8.4 }, { 13: 8.4 }, {}, { 11: 28.5 }, { 7: 8.4 }],
  rowSpacing: [28.45].concat(Array(5).fill(20.05)),
},
};

export const getLayoutConfig = (keyCount: number, baseLayout?: any[][], customKeySizes?: number[][], customGapsAfterCol?: any[], customRowSpacing?: number[], productName?: string) => {
  // Priority 1: Check sharedLayout.ts for community-contributed layouts by productName
  if (productName && sharedLayoutMap[productName]) {
    const config: LayoutConfig = {
      keySizes: sharedLayoutMap[productName].keySizes,
      gapsAfterCol: sharedLayoutMap[productName].gapsAfterCol,
      rowSpacing: sharedLayoutMap[productName].rowSpacing
    };
    return processLayoutConfig(config, baseLayout, customKeySizes, customGapsAfterCol, customRowSpacing);
  }

  // Priority 2: Check IndexedDB for user-created custom layouts by productName
  if (productName) {
    const customLayout = customLayoutsCache.find(layout => layout.productName === productName);
    if (customLayout) {
      const config: LayoutConfig = {
        keySizes: customLayout.keySizes,
        gapsAfterCol: customLayout.gapsAfterCol,
        rowSpacing: customLayout.rowSpacing
      };
      return processLayoutConfig(config, baseLayout, customKeySizes, customGapsAfterCol, customRowSpacing);
    }
  }

  // Priority 3: Fall back to keyCount-based lookup from layoutMap
  const config = layoutMap[keyCount];
  if (!config) {
    throw new Error(`Unsupported key count: ${keyCount}`);
  }

  return processLayoutConfig(config, baseLayout, customKeySizes, customGapsAfterCol, customRowSpacing);
};

function processLayoutConfig(config: LayoutConfig, baseLayout?: any[][], customKeySizes?: number[][], customGapsAfterCol?: any[], customRowSpacing?: number[]) {

  let rows = 0;
  let cols = 0;
  let keySizes = customKeySizes || config.keySizes;
  let gapsAfterCol = customGapsAfterCol || config.gapsAfterCol;
  let rowSpacing = customRowSpacing || config.rowSpacing;

  // Use baseLayout if provided, otherwise fall back to default
  if (baseLayout && baseLayout.length > 0) {
    rows = baseLayout.length;
    cols = Math.max(...baseLayout.map(row => row.length || 0));
    keySizes = keySizes.slice(0, rows).map((row, rIdx) => {
      const baseCols = baseLayout[rIdx] ? baseLayout[rIdx].length : 0;
      if (baseCols > 0 && baseCols !== row.length) {
        if (baseCols > row.length) {
          return [...row, ...Array(baseCols - row.length).fill(19.05)]; // Pad with 1u (19.05mm)
        }
        return row.slice(0, baseCols); // Truncate if too long
      }
      return row;
    });
  } else {
    rows = keySizes.length;
    cols = Math.max(...keySizes.map(row => row.length));
  }

  // Calculate cumulative left and set top for each row with custom row spacing
  const keyPositions = keySizes.map((rowSizes, rIdx) => {
    let left = 0;
    let cumulativeTop = 0;
    // Accumulate top based on row spacing
    for (let i = 0; i < rIdx; i++) {
      cumulativeTop += mmToPx(rowSpacing[i] || 20.05); // Default to 20.05mm (19.05mm + 1mm spacing)
    }
    const top = cumulativeTop;
    const positions = rowSizes.map((width, cIdx) => {
      const pos = [left, top, width, 19.05]; // [left, top, width, height] - 1u height
      left += mmToPx(width) + mmToPx(1); // 1mm default spacing
      if (gapsAfterCol[rIdx] && gapsAfterCol[rIdx][cIdx]) {
        left += mmToPx(gapsAfterCol[rIdx][cIdx]);
      }
      return pos;
    });
    return positions;
  }) || [];

  // Convert to pixels (modify in a new array)
  let convertedPositions = keyPositions.map(row =>
    row.map(pos => [pos[0], pos[1], mmToPx(pos[2]), mmToPx(pos[3])])
  ) || [];

  if (convertedPositions.length === 0) {
    convertedPositions = Array(rows).fill(undefined).map(() => Array(cols).fill([0, 0, mmToPx(19.05), mmToPx(19.05)]));
  }

  return { rows, cols, keyPositions: convertedPositions, gaps: Array(rows).fill(0) }; // Gaps handled in left
}

// Helper function to refresh custom layouts cache
export async function refreshCustomLayouts() {
  await loadCustomLayouts();
}
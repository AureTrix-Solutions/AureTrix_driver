// layoutConfigs.ts
import LayoutStorageService, { type CustomLayoutConfig } from '@/services/LayoutStorageService';

const mmToPx = (mm: number) => Math.round(mm * 4); // Increased to 4px/mm for larger keys

type LayoutConfig = {
  keySizes: number[][];
  gapsAfterCol: Record<number, Record<number, number>>[];
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
      Array(13).fill(18).concat(37), // row 0
      [27.4].concat(Array(12).fill(18), 27.4), // row 1
      [32.3].concat(Array(11).fill(18), 41.7), // row 2
      [41.7].concat(Array(10).fill(18), 51.2), // row 3
      Array(3).fill(22.8).concat(117.7, Array(4).fill(22.8)), // row 4
    ],
    gapsAfterCol: Array(5).fill({}),
    rowSpacing: [18, 18, 18, 18],
  },
  67: { // 65% 67-key
    keySizes: [
      Array(13).fill(18).concat(37, 18), // row 0
      [27.4].concat(Array(12).fill(18), 27.4, 18), // row 1
      [32.3].concat(Array(11).fill(18), 41.7, 18), // row 2
      [41.7].concat(Array(10).fill(18), 32.3, Array(2).fill(18)), // row 3
      Array(3).fill(22.8).concat(117.7, Array(2).fill(22.8), Array(3).fill(18)), // row 4
    ],
    gapsAfterCol: [
      {}, {}, {}, {}, { 5: 9.5 }
    ],
    rowSpacing: [18, 18, 18, 18],
  },
  68: { // 65% 68-key
    keySizes: [
      Array(13).fill(18).concat(37, 18), // row 0
      [27.4].concat(Array(12).fill(18), 27.4, 18), // row 1
      [32.3].concat(Array(11).fill(18), 41.7, 18), // row 2
      [41.7].concat(Array(10).fill(18), 32.3, Array(2).fill(18)), // row 3
      Array(3).fill(22.8).concat(117.7, Array(6).fill(18)), // row 4
    ],
    gapsAfterCol: Array(5).fill({}),
    rowSpacing: [18, 18, 18, 18],
  },
  80: { // 75% 80-key
    keySizes: [
      Array(15).fill(18), // row 0
      Array(13).fill(18).concat(37, 18), // row 1
      [27.4].concat(Array(12).fill(18), 27.4, 18), // row 2
      [32.3].concat(Array(11).fill(18), 41.7), // row 3
      [41.7].concat(Array(10).fill(18), 32.3, 18), // row 4
      Array(3).fill(22.8).concat(117.7, Array(2).fill(22.8), Array(3).fill(18)), // row 5
    ],
    gapsAfterCol: [
      { 0: 4.7, 4: 4.7, 8: 4.7, 12: 4.7 }, {}, {}, {}, {}, { 5: 9.5 }
    ],
    rowSpacing: [22, 18, 18, 18, 18],
  },
  82: { // 75% 82-key
    keySizes: [
      Array(14).fill(18), // row 0
      Array(13).fill(18).concat(37, 18), // row 1
      [27.4].concat(Array(12).fill(18), 27.4, 18), // row 2
      [32.3].concat(Array(11).fill(18), 41.7, 18), // row 3
      [41.7].concat(Array(10).fill(18), 32.3, Array(2).fill(18)), // row 4
      Array(3).fill(22.8).concat(117.7, Array(2).fill(22.8), Array(3).fill(18)), // row 5
    ],
    gapsAfterCol: [
      { 0: 9.4, 4: 9.4, 8: 9.4, 12: 9.4 }, {}, {}, {}, {}, { 5: 9.5 }
    ],
    rowSpacing: [22, 18, 18, 18, 18],
  },
  84: { // 75% 84-key
    keySizes: [
      Array(16).fill(18), // row 0
      Array(13).fill(18).concat(37, 18), // row 1
      [27.4].concat(Array(12).fill(18), 27.4, 18), // row 2
      [32.3].concat(Array(11).fill(18), 41.7, 18), // row 3
      [41.7].concat(Array(10).fill(18), 32.3, Array(2).fill(18)), // row 4
      Array(3).fill(22.8).concat(117.7, Array(6).fill(18)), // row 5
    ],
    gapsAfterCol: Array(6).fill({}),
    rowSpacing: [18, 18, 18, 18, 18],
  },
  87: { // TKL 87-key
    keySizes: [
      Array(16).fill(18), // row 0
      Array(13).fill(18).concat(37, Array(3).fill(18)), // row 1
      [27.4].concat(Array(12).fill(18), 27.4, Array(3).fill(18)), // row 2
      [32.3].concat(Array(11).fill(18), 41.7), // row 3
      [41.7].concat(Array(10).fill(18), 51.2, 18), // row 4
      Array(3).fill(22.8).concat(117.7, Array(4).fill(22.8), Array(3).fill(18)), // row 5
    ],
    gapsAfterCol: [
      { 0: 19, 4: 10, 8: 9, 12: 9 },
      { 13: 9 },
      { 13: 9 },
      {},
      { 11: 28 },
      { 7: 9 }
    ],
    rowSpacing: [27, 18, 18, 18, 18],
  },
};

export const getLayoutConfig = (keyCount: number, baseLayout?: any[][], customKeySizes?: number[][], customGapsAfterCol?: any[], customRowSpacing?: number[], productName?: string) => {
  // Check for custom layout by productName first (cache preloaded at app startup)
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

  // Fall back to keyCount-based lookup
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
          return [...row, ...Array(baseCols - row.length).fill(12)]; // Pad with 12mm
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
      cumulativeTop += mmToPx(rowSpacing[i] || 18); // Default to 18mm if undefined
    }
    const top = cumulativeTop;
    const positions = rowSizes.map((width, cIdx) => {
      const pos = [left, top, width, 17]; // [left, top, width, height]
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
    convertedPositions = Array(rows).fill().map(() => Array(cols).fill([0, 0, mmToPx(17), mmToPx(17)]));
  }

  return { rows, cols, keyPositions: convertedPositions, gaps: Array(rows).fill(0) }; // Gaps handled in left
}

// Helper function to refresh custom layouts cache
export async function refreshCustomLayouts() {
  await loadCustomLayouts();
}
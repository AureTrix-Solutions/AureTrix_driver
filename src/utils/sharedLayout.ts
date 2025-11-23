// sharedLayout.ts
// Community-contributed keyboard layouts with precise measurements
// These layouts are checked first (highest priority) before IndexedDB and layoutMap

type LayoutConfig = {
  keySizes: number[][];
  gapsAfterCol: Record<number, number>[];
  rowSpacing: number[];
  hasAxisList?: boolean;
};

export const sharedLayoutMap: Record<string, LayoutConfig> = {
  "Slice75 HE": {
    keySizes: [
      Array(15).fill(19.05),
      Array(13).fill(19.05).concat(35.999, 19.05),
      [27.5].concat(Array(12).fill(19.05), 27.5, 19.05),
      [32.3].concat(Array(11).fill(19.05), 42.8625),
      [42.8625].concat(Array(10).fill(19.05), 32.3, 19.05),
      Array(3)
        .fill(23.8125)
        .concat(119.38, 23.8125, 23.8125, Array(3).fill(19.05)),
    ],
    gapsAfterCol: [
      { 0: 4.25, 4: 4.25, 8: 4.25, 12: 4.25 },
      {},
      {},
      {},
      {},
      { 5: 13.4 },
    ],
    rowSpacing: [24.3].concat(Array(5).fill(20.05)),
    hasAxisList: true,
  },
};

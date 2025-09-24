const mmToPx = (mm: number) => Math.round(mm * 4); // Increased to 4px/mm for larger keys

export const getLayoutConfig = (keyCount: number, baseLayout?: any[][], customKeySizes?: number[][], customGapsAfterCol?: any[], customRowSpacing?: number[]) => {
  let rows = 0;
  let cols = 0;
  let keySizes = customKeySizes || [];
  let gapsAfterCol = customGapsAfterCol || [];
  let rowSpacing = customRowSpacing || [];
  let baseTop = 0;

  // Use baseLayout if provided, otherwise fall back to default
  if (baseLayout && baseLayout.length > 0) {
    rows = baseLayout.length;
    cols = Math.max(...baseLayout.map(row => row.length || 0));
    ////console.log(`Using baseLayout: rows=${rows}, cols=${cols}`);
  } else {
    //console.warn('baseLayout is undefined, using default layout for keyCount:', keyCount);
    rows = 6; // Default to 6 rows for common layouts like 80-key
    cols = 15; // Default max columns
  }

  // Define keySizes, gapsAfterCol, and rowSpacing based on keyCount with custom overrides
  if (keyCount === 61) { // 60%
    keySizes = [
      Array(13).fill(18).concat(37), // row 0
      [27.3].concat(Array(12).fill(18), 27.3), // row 1
      [32].concat(Array(11).fill(18), 41.7), // row 2
      [41.7].concat(Array(10).fill(18), 51.1), // row 3
      Array(3).fill(22.8).concat(117.2, Array(4).fill(22.8)), // row 4
    ];
    gapsAfterCol = Array(5).fill({});
    rowSpacing = [18, 18, 18, 18]; // 17mm height + 1mm gap per row
  } else if (keyCount === 67) { // 65% 67-key
    keySizes = [
      Array(13).fill(18).concat(37, 18), // row 0
      [27.3].concat(Array(12).fill(18), 27.8, 18), // row 1
      [32].concat(Array(11).fill(18), 41.9, 18), // row 2
      [41.7].concat(Array(10).fill(18), 32.3, Array(2).fill(18)), // row 3
      Array(3).fill(22.8).concat(117.7, Array(2).fill(22.8), Array(3).fill(18)), // row 4
    ];
    gapsAfterCol = Array(5).fill({});
    gapsAfterCol[4] = { 5: 9.5};
    rowSpacing = [18, 18, 18, 18]; // 17mm height + 1mm gap per row
  } else if (keyCount === 68) { // 65% 68-key
    keySizes = [
      Array(13).fill(18).concat(37, 18), // row 0
      [27.3].concat(Array(12).fill(18), 27.7, 18), // row 1
      [32].concat(Array(11).fill(18), 41.9, 18), // row 2
      [41.7].concat(Array(10).fill(18), 32.3 ,Array(2).fill(18)), // row 3
      Array(3).fill(22.8).concat(117.7, Array(6).fill(18)), // row 4
    ];
    gapsAfterCol = Array(5).fill({});
    rowSpacing = [18, 18, 18, 18]; // 17mm height + 1mm gap per row
  } else if (keyCount === 84) { // 75% 84-key
    keySizes = [
      Array(16).fill(18), // row 0
      Array(13).fill(18).concat(37, 18), // row 1
      [27.3].concat(Array(12).fill(18), 27.7, 18), // row 2
      [32].concat(Array(11).fill(18), 41.9, 18), // row 3
      [41.7].concat(Array(10).fill(18), 32.3, Array(2).fill(18)), // row 4
      Array(3).fill(22.8).concat(117.7, Array(6).fill(18)), // row 5
    ];
    gapsAfterCol = Array(6).fill({});
    rowSpacing = [18, 18, 18, 18, 18]; // 17mm height + 1mm gap per row
  } else if (keyCount === 82) { // 75% 82-key
    keySizes = [
      Array(14).fill(18), // row 0
      Array(13).fill(18).concat(37, 18), // row 1
      [27.3].concat(Array(12).fill(18), 27.7, 18), // row 2
      [32].concat(Array(11).fill(18), 41.9, 18), // row 3
      [41.7].concat(Array(10).fill(18), 32.3, Array(2).fill(18)), // row 4
      Array(3).fill(22.8).concat(117.7, Array(2).fill(22.8), Array(3).fill(18)), // row 5
    ];
    gapsAfterCol = Array(6).fill({});
    gapsAfterCol[0] = { 0: 9.4, 4: 9.4, 8: 9.4, 12: 9.4 }; // Increased gap after Backspace
    gapsAfterCol[5] = { 5: 9.5 };
    rowSpacing = [22, 18, 18, 18, 18]; // 17mm height + 1mm gap, 6mm gap after row 0
  } else if (keyCount === 80) { // 75% 80-key
    keySizes = [
      Array(15).fill(18), // row 0
      Array(13).fill(18).concat(37, 18), // row 1
      [27.3].concat(Array(12).fill(18),27.7, 18), // row 2
      [32].concat(Array(11).fill(18), 41.9), // row 3
      [41.7].concat(Array(10).fill(18), 32.3, 18), // row 4
      Array(3).fill(22.8).concat(117.7, Array(2).fill(22.8), Array(3).fill(18)), // row 5
    ];
    gapsAfterCol = Array(6).fill({});
    gapsAfterCol[0] = { 0: 4.7, 4: 4.7, 8: 4.7, 12: 4.7 }; // Increased gap after Backspace
    gapsAfterCol[5] = { 5: 9.5 };
    rowSpacing = [22, 18, 18, 18, 18]; // 17mm height + 1mm gap, 6mm gap after row 0
  } else if (keyCount === 87) { // TKL 87-key
    keySizes = [
      Array(16).fill(18), // row 0
      Array(13).fill(18).concat(37, Array(3).fill(18)), // row 1
      [27.3].concat(Array(12).fill(18), 27.7, Array(3).fill(18)), // row 2
      [32].concat(Array(11).fill(18), 41.9), // row 3
      [41.7].concat(Array(10).fill(18), 51.2, 18), // row 4
      Array(3).fill(22.8).concat(117.7, Array(4).fill(22.8), Array(3).fill(18)),
    ];
    gapsAfterCol = Array(6).fill({});
    gapsAfterCol[0] = { 0: 19, 4: 10, 8: 9, 12: 9 };
    gapsAfterCol[1] = { 13: 9};
    gapsAfterCol[2] = { 13: 9 };
    gapsAfterCol[4] = { 11: 28 };
    gapsAfterCol[5] = { 7: 9 };
    rowSpacing = [27, 18, 18, 18, 18]; // 17mm height + 1mm gap per row
  } else {
    throw new Error(`Unsupported key count: ${keyCount}`);
  }

  // Adjust keySizes to match baseLayout column counts if provided
  if (baseLayout && baseLayout.length > 0) {
    rows = baseLayout.length;
    keySizes = keySizes.slice(0, rows).map((row, rIdx) => {
      const baseCols = baseLayout[rIdx] ? baseLayout[rIdx].length : 0;
      if (baseCols > 0 && baseCols !== row.length) {
        //console.warn(`Adjusting row ${rIdx} from ${row.length} to ${baseCols} columns`);
        if (baseCols > row.length) {
          return [...row, ...Array(baseCols - row.length).fill(12)]; // Pad with 12mm
        }
        return row.slice(0, baseCols); // Truncate if too long
      }
      return row;
    });
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
      ////console.log(`Row ${rIdx}, Col ${cIdx}: pos=`, pos); // Debug log
      return pos;
    });
    return positions;
  }) || [];

  // Convert to pixels (modify in a new array)
  let convertedPositions = keyPositions.map(row =>
    row.map(pos => [pos[0], pos[1], mmToPx(pos[2]), mmToPx(pos[3])])
  ) || [];

  if (convertedPositions.length === 0) {
    //console.error('keyPositions is empty, using default positions');
    convertedPositions = Array(rows).fill().map(() => Array(cols).fill([0, 0, mmToPx(17), mmToPx(17)]));
  }

  return { rows, cols, keyPositions: convertedPositions, gaps: Array(rows).fill(0) }; // Gaps handled in left
};
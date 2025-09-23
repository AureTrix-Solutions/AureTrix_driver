const mmToPx = (mm: number) => Math.round(mm * 4); // Increased to 4px/mm for larger keys

export const getLayoutConfig = (keyCount: number, baseLayout?: any[][]) => {
  let rows = 0;
  let cols = 0;
  let keySizes = [];
  let gapsAfterCol = [];
  let baseTop = 0;

  // Use baseLayout if provided, otherwise fall back to default
  if (baseLayout && baseLayout.length > 0) {
    rows = baseLayout.length;
    cols = Math.max(...baseLayout.map(row => row.length || 0));
    console.log(`Using baseLayout: rows=${rows}, cols=${cols}`);
  } else {
    console.warn('baseLayout is undefined, using default layout for keyCount:', keyCount);
    rows = 6; // Default to 6 rows for common layouts like 80-key
    cols = 15; // Default max columns
  }

  // Define keySizes and gaps based on keyCount with dynamic adjustment
  if (keyCount === 61) { // 60%
    keySizes = [
      Array(13).fill(12).concat(31), // row 0
      [22].concat(Array(12).fill(12)).concat([22]), // row 1
      [26].concat(Array(11).fill(12)).concat([35]), // row 2
      [35].concat(Array(10).fill(12)).concat([44]), // row 3
      [16, 16, 16, 111, 16, 16, 16, 16], // row 4
    ];
    gapsAfterCol = Array(5).fill({});
  } else if (keyCount === 67) { // 65% 67-key
    keySizes = [
      Array(13).fill(12).concat([31, 12]), // row 0
      [22].concat(Array(12).fill(12)).concat([22]), // row 1
      [26].concat(Array(12).fill(12)).concat([35]), // row 2
      [35].concat(Array(11).fill(11)).concat([26]), // row 3
      [16, 16, 16, 111, 16, 16, 12, 12, 12], // row 4
    ];
    gapsAfterCol = Array(5).fill({});
    gapsAfterCol[4] = {5: 16};
  } else if (keyCount === 68) { // 65% 68-key
    keySizes = [
      Array(13).fill(12).concat([31, 12]), // row 0
      [22].concat(Array(12).fill(12)).concat([22]), // row 1
      [26].concat(Array(12).fill(12)).concat([35]), // row 2
      [35].concat(Array(11).fill(12)).concat([26]), // row 3
      [16, 16, 16, 111, 16, 16, 16, 16, 16, 16], // row 4
    ];
    gapsAfterCol = Array(5).fill({});
  } else if (keyCount === 84) { // 75% 84-key
    keySizes = [
      Array(16).fill(12), // row 0
      Array(14).fill(12).concat([31]), // row 1
      [22].concat(Array(12).fill(12)).concat([22]), // row 2
      [26].concat(Array(12).fill(12)).concat([35]), // row 3
      [35].concat(Array(12).fill(12)).concat([26]), // row 4
      [16, 16, 16, 111, 16, 16, 12, 12, 12, 12], // row 5
    ];
    gapsAfterCol = Array(6).fill({});
  } else if (keyCount === 82) { // 75% 82-key
    keySizes = [
      Array(15).fill(12), // row 0
      Array(14).fill(12).concat([31]), // row 1
      [22].concat(Array(12).fill(12)).concat([22]), // row 2
      [26].concat(Array(12).fill(12)).concat([35]), // row 3
      [35].concat(Array(12).fill(12)).concat([26]), // row 4
      [16, 16, 16, 111, 16, 16, 12, 12, 12], // row 5
    ];
    gapsAfterCol = Array(6).fill({});
    gapsAfterCol[0] = {0: 12, 4: 12, 8: 12, 12: 12};
    gapsAfterCol[5] = {5: 16};
  } else if (keyCount === 80) { // 75% 80-key
    keySizes = [
      [17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17], // row 0 (explicit spacing)
      Array(13).fill(17).concat(36).concat(17), // row 1
      [26.5].concat(Array(12).fill(17)).concat([26.5]).concat([17]), // row 2
      [31].concat(Array(11).fill(17)).concat([41]), // row 3
      [41].concat(Array(10).fill(17)).concat([31]).concat([17]), // row 4
      [22, 22, 22, 117, 22, 22, 17, 17, 17], // row 5
    ];
    gapsAfterCol = Array(6).fill({});
    gapsAfterCol[0] = {0: 4.7, 4: 4.7, 8: 4.7, 12: 4.7}; // Increased gap after Backspace to 18mm (~72px) to space Page Up
    gapsAfterCol[5] = {5: 3.5};
  } else if (keyCount === 87) { // TKL 87-key
    keySizes = [
      Array(17).fill(12), // row 0
      Array(13).fill(12).concat([31, 12, 12]), // row 1
      [22].concat(Array(13).fill(12)).concat([22]), // row 2
      [26].concat(Array(11).fill(12)).concat([35]), // row 3
      [35].concat(Array(10).fill(12)).concat([44]), // row 4
      [16, 12, 16, 108, 16, 12, 12, 16, 12, 12, 12], // row 5
    ];
    gapsAfterCol = Array(6).fill({});
    gapsAfterCol[0] = {0: 21, 4: 12, 8: 12, 12: 9};
    gapsAfterCol[1] = {13: 9};
    gapsAfterCol[2] = {13: 9};
    gapsAfterCol[4] = {11: 24};
    gapsAfterCol[5] = {7: 9};
  } else {
    throw new Error(`Unsupported key count: ${keyCount}`);
  }

  // Adjust keySizes to match baseLayout column counts if provided
  if (baseLayout && baseLayout.length > 0) {
    rows = baseLayout.length;
    keySizes = keySizes.slice(0, rows).map((row, rIdx) => {
      const baseCols = baseLayout[rIdx] ? baseLayout[rIdx].length : 0;
      if (baseCols > 0 && baseCols !== row.length) {
        console.warn(`Adjusting row ${rIdx} from ${row.length} to ${baseCols} columns`);
        if (baseCols > row.length) {
          return [...row, ...Array(baseCols - row.length).fill(12)]; // Pad with 12mm
        }
        return row.slice(0, baseCols); // Truncate if too long
      }
      return row;
    });
    cols = Math.max(...keySizes.map(row => row.length));
  }

  // Calculate cumulative left and set top for each row with 6mm spacing
  const keyPositions = keySizes.map((rowSizes, rIdx) => {
    let left = 0;
    const top = rIdx * mmToPx(18); // 14mm height + 6mm spacing per row
    const positions = rowSizes.map((width, cIdx) => {
      const pos = [left, top, width, 17]; // [left, top, width, height]
      left += mmToPx(width) + mmToPx(1); // Base 6mm spacing
      if (gapsAfterCol[rIdx] && gapsAfterCol[rIdx][cIdx]) {
        left += mmToPx(gapsAfterCol[rIdx][cIdx]);
      }
      console.log(`Row ${rIdx}, Col ${cIdx}: pos=`, pos); // Debug log
      return pos;
    });
    return positions;
  }) || [];

  // Convert to pixels (modify in a new array)
  const convertedPositions = keyPositions.map(row =>
    row.map(pos => [pos[0], pos[1], mmToPx(pos[2]), mmToPx(pos[3])])
  ) || [];

  if (convertedPositions.length === 0) {
    console.error('keyPositions is empty, using default positions');
    convertedPositions = Array(rows).fill().map(() => Array(cols).fill([0, 0, mmToPx(17), mmToPx(17)]));
  }

  return { rows, cols, keyPositions: convertedPositions, gaps: Array(rows).fill(0) }; // Gaps handled in left
};
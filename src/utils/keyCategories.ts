import { keyMap } from './keyMap';

export const categories = [
  'Special',
  'Letters',
  'Numbers & Symbols',
  'Control Keys',
  'Function Keys',
  'Navigation & Editing',
  'Numpad',
  'System & Misc',
  'Languages',
  'Extra Functions',
  'Media & Browser',
  'Lighting & Effects',
  'Modifier Keys',
  'Brightness Controls',
  'Multimedia Extended',
  'Misc Special',
];

export const categorizedKeys = () => {
  const catMap: { [key: string]: { [key: number]: string } } = {
    Special: { 0: keyMap[0], 1: keyMap[1] },
    Letters: Object.fromEntries(Object.entries(keyMap).filter(([k]) => [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29].includes(parseInt(k)))),
    'Numbers & Symbols': Object.fromEntries(Object.entries(keyMap).filter(([k]) => [30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 45, 46, 47, 48, 49, 51, 52, 53, 54, 55, 56].includes(parseInt(k)))),
    'Control Keys': Object.fromEntries(Object.entries(keyMap).filter(([k]) => [40, 41, 42, 43, 44, 57].includes(parseInt(k)))),
    'Function Keys': Object.fromEntries(Object.entries(keyMap).filter(([k]) => [58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69].includes(parseInt(k)))),
    'Navigation & Editing': Object.fromEntries(Object.entries(keyMap).filter(([k]) => [70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82].includes(parseInt(k)))),
    Numpad: Object.fromEntries(Object.entries(keyMap).filter(([k]) => [83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99].includes(parseInt(k)))),
    'System & Misc': Object.fromEntries(Object.entries(keyMap).filter(([k]) => [ 101, 117, 118, 126, 130, 131, 132].includes(parseInt(k)))),
    Languages: Object.fromEntries(Object.entries(keyMap).filter(([k]) => [144, 145, 146, 147, 148, 149, 150, 151, 152].includes(parseInt(k)))),
    'Extra Functions': Object.fromEntries(Object.entries(keyMap).filter(([k]) => [153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172].includes(parseInt(k)))),
    'Media & Browser': Object.fromEntries(Object.entries(keyMap).filter(([k]) => [173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198].includes(parseInt(k)))),
    'Lighting & Effects': Object.fromEntries(Object.entries(keyMap).filter(([k]) => [199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223].includes(parseInt(k)))),
    'Modifier Keys': Object.fromEntries(Object.entries(keyMap).filter(([k]) => [224, 225, 226, 227, 228, 229, 230, 231, 232].includes(parseInt(k)))),
    'Brightness Controls': Object.fromEntries(Object.entries(keyMap).filter(([k]) => [4207, 4208].includes(parseInt(k)))),
    'Multimedia Extended': Object.fromEntries(Object.entries(keyMap).filter(([k]) => [4277, 4278, 4279, 4301, 4322, 4329, 4330, 4483, 4490, 4498, 4500, 4641, 4643, 4767].includes(parseInt(k)))),
    'Misc Special': Object.fromEntries(Object.entries(keyMap).filter(([k]) => [25141].includes(parseInt(k)) || (parseInt(k) >= 29441 && parseInt(k) <= 29449) || (parseInt(k) >= 61441 && parseInt(k) <= 61708) || parseInt(k) === 62217 || (parseInt(k) >= 62224 && parseInt(k) <= 62265))),
  };
  return catMap;
};
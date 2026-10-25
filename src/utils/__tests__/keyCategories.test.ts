import { describe, it, expect } from 'vitest';
import { categorizedKeys, categories } from '@utils/keyCategories';

describe('keyCategories', () => {
  it('exposes exactly the exported categories, in order (16)', () => {
    expect(Object.keys(categorizedKeys())).toEqual(categories);
    expect(categories).toHaveLength(16);
  });

  it('Special is exactly { 0: " ", 1: "Fn" }', () => {
    expect(categorizedKeys()['Special']).toEqual({ 0: ' ', 1: 'Fn' });
  });

  it('every label is a non-empty string; ids never repeat; 250 unique keys', () => {
    const map = categorizedKeys();
    const seen = new Set<string>();
    for (const cat of Object.keys(map)) {
      for (const [id, label] of Object.entries(map[cat])) {
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
        expect(seen.has(id)).toBe(false);
        seen.add(id);
      }
    }
    expect(seen.size).toBe(250);
  });

  it('pins exact per-category counts (probe P6)', () => {
    const map = categorizedKeys();
    const counts = Object.fromEntries(Object.keys(map).map(c => [c, Object.keys(map[c]).length]));
    expect(counts).toEqual({
      Special: 2, Letters: 26, 'Numbers & Symbols': 21, 'Control Keys': 6,
      'Function Keys': 12, 'Navigation & Editing': 13, Numpad: 17, 'System & Misc': 7,
      Languages: 9, 'Extra Functions': 20, 'Media & Browser': 26, 'Lighting & Effects': 25,
      'Modifier Keys': 9, 'Brightness Controls': 2, 'Multimedia Extended': 14, 'Misc Special': 41,
    });
  });
});

export interface KeySize {
  units: number;
  mm: number;
  label: string;
}

export const KEY_SIZES: KeySize[] = [
  { units: 1, mm: 18, label: '1u (18mm)' },
  { units: 1.25, mm: 22.8, label: '1.25u (22.8mm)' },
  { units: 1.5, mm: 27.4, label: '1.5u (27.4mm)' },
  { units: 1.75, mm: 32.3, label: '1.75u (32.3mm)' },
  { units: 2, mm: 37, label: '2u (37mm)' },
  { units: 2.25, mm: 41.7, label: '2.25u (41.7mm)' },
  { units: 2.75, mm: 51.2, label: '2.75u (51.2mm)' },
  { units: 6.25, mm: 117.7, label: '6.25u (117.7mm)' }
];

export const KEY_SIZE_MAP = new Map<number, number>(
  KEY_SIZES.map(({ units, mm }) => [units, mm])
);

export function uToMm(units: number): number {
  return KEY_SIZE_MAP.get(units) ?? units * 18;
}

export function mmToU(mm: number): number {
  const entry = KEY_SIZES.find(size => size.mm === mm);
  return entry?.units ?? mm / 18;
}

export interface KeySize {
  units: number;
  mm: number;
  label: string;
}

export const KEY_SIZES: KeySize[] = [
  { units: 1, mm: 19.05, label: "1u" },
  { units: 1.25, mm: 23.8125, label: "1.25u" },
  { units: 1.5, mm: 27.5, label: "1.5u" },
  { units: 1.75, mm: 32.3, label: "1.75u" },
  { units: 2, mm: 35.999, label: "2u" },
  { units: 2.25, mm: 42.8625, label: "2.25u" },
  { units: 2.75, mm: 51.2, label: "2.75u" },
  { units: 6.25, mm: 119.38, label: "6.25u" },
  { units: 6.5, mm: 123.825, label: "6.5u" },
];

export const KEY_SIZE_MAP = new Map<number, number>(
  KEY_SIZES.map(({ units, mm }) => [units, mm]),
);

export function uToMm(units: number): number {
  return KEY_SIZE_MAP.get(units) ?? units * 19.05;
}

export function mmToU(mm: number): number {
  const entry = KEY_SIZES.find((size) => size.mm === mm);
  return entry?.units ?? mm / 19.05;
}

export interface IDefKeyInfo {
  keyValue: number;  // Now used for remapped/display value
  physicalKeyValue?: number;  // New: default/physical key ID for SDK calls
  location?: {
    row: number;
    col: number;
  };
  remappedLabel?: string;  // Optional: for any existing label overrides
}
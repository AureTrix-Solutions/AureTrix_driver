// Mirrors @sparklinkplayjoy/sdk-keyboard dist/cjs/src/types/type.d.ts verbatim.
// The facade .d.ts imports but does not re-export these, so they are declared here.
export type DksLayoutType = 'Layout_DB1' | 'Layout_DB2' | 'Layout_DB3';
export type DksType = 'Layout_DKS1' | 'Layout_DKS2' | 'Layout_DKS3' | 'Layout_DKS4';

export interface IDefKeyInfo {
  keyValue: number;  // Now used for remapped/display value
  physicalKeyValue?: number;  // New: default/physical key ID for SDK calls
  location?: {
    row: number;
    col: number;
  };
  remappedLabel?: string;  // Optional: for any existing label overrides
}
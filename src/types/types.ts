// Derived from the SDK public type surface (docs/sdk-reference-v2.md §10.1, §10.4, §13.7).
// DksLayoutType/DksType are sdk-keyboard-local (the root facade exports only XDKeyboard);
// the deep .d.ts path resolves for tsc (moduleResolution:node) and `import type` is erased
// at build, so it is runtime-safe. MUST stay `import type` — a value import fails (§13.4).
import type { DksLayoutType, DksType } from '@sparklinkplayjoy/sdk-keyboard/dist/esm/src/types/type';
// IDefKeyInfo comes from the protocol-keyboard root via the tsconfig paths remap (sprint-06).
import type { IDefKeyInfo as SdkIDefKeyInfo } from '@sparklinkplayjoy/protocol-keyboard';

export type { DksLayoutType, DksType };

// App-extended key model: the SDK requires `location` and has no remapping fields; the app
// builds layouts before location is known and tracks physical/display key identity separately.
export type IDefKeyInfo = Omit<SdkIDefKeyInfo, 'location'> & {
  physicalKeyValue?: number;  // default/physical key ID used for SDK calls
  location?: SdkIDefKeyInfo['location'];  // optional in the app (SDK: required)
  remappedLabel?: string;  // optional label override for display
};

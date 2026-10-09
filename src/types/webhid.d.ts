// Ambient WebHID shim. Typed against @sparklinkplayjoy/hid's HIDDevice, never the
// W3C spec class, so it lines up with what the SDK hands back. The top-level import
// makes this a MODULE — every global declaration below must sit in `declare global`.
import type { HIDDevice } from '@sparklinkplayjoy/hid';

declare global {
  // Browsers expose serialNumber on HIDDevice; hid's type does not. Keep it optional.
  type BrowserHIDDevice = HIDDevice & { serialNumber?: string };

  interface HIDConnectionEvent extends Event {
    device: HIDDevice;
  }

  interface HID extends EventTarget {
    requestDevice(options?: { filters: unknown[] }): Promise<BrowserHIDDevice[]>;
    getDevices(): Promise<BrowserHIDDevice[]>;
    addEventListener(
      type: 'connect' | 'disconnect',
      listener: (event: HIDConnectionEvent) => void,
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions,
    ): void;
  }

  // Optional so the existing `'hid' in navigator` guards stay load-bearing.
  interface Navigator {
    readonly hid?: HID;
  }
}

export {};

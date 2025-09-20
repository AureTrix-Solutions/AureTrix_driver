import Keyboard from '@sparklinkplayjoy/sdk-keyboard';

class KeyboardService {
  private keyboard: any; // Typed as 'any' initially; will refine with SDK types later

  constructor() {
    const vendorId = 7331; // Example VID from SDK docs (adjust as needed)
    const productId = 2049; // Example PID from SDK docs (adjust as needed)
    this.keyboard = new Keyboard({
      configs: [{ vendorId, productId, usagePage: 65440, usage: 1 }],
      usage: 1,
      usagePage: 65440,
    });
  }

  async getDevices(): Promise<any[]> {
    return await this.keyboard.getDevices();
  }

  async init(deviceId: string): Promise<any> {
    return await this.keyboard.init(deviceId);
  }

  // Add more methods (e.g., getLayout, setMacro) as needed later
}

export default new KeyboardService();
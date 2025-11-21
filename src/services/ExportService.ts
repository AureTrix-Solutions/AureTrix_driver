import KeyboardService from './KeyboardService';
import { useBatchProcessing } from '../composables/useBatchProcessing';

interface LightConfig {
  open: boolean;
  mode: number;
  staticColors: string[];
  selectStaticColor: number;
  luminance: number;
  speed: number;
  sleepTime: number;
  direction: boolean;
  dynamic: number;
}

interface PerformanceConfig {
  isGlobalTriggering: boolean;
  globalTriggeringValue: number;
  isRt: boolean;
  isSingle: boolean;
  singleTriggeringValue: number;
  rtPressValue: number;
  rtReleaseValue: number;
  axisID: number;
  deadBandPressValue: number;
  deadBandReleaseValue: number;
  advancedKeyMode: number;
}

interface AdvancedKeyConfig {
  advancedType?: string;
  value?: number;
  dks?: any;
  mpt?: any;
  mt?: any;
  tgl?: any;
  end?: any;
  socd?: any;
  macro?: any;
}

interface CustomKeyConfig {
  fn0: { keyValue: number; bindKeyValue: number } | null;
  fn1: { keyValue: number; bindKeyValue: number } | null;
  fn2: { keyValue: number; bindKeyValue: number } | null;
  fn3: { keyValue: number; bindKeyValue: number } | null;
}

interface KeyboardLightConfig {
  custom: {
    R: number;
    G: number;
    B: number;
    key: number;
  };
}

interface Keyboards {
  col: number;
  row: number;
  keyValue: number;
  performance: PerformanceConfig;
  advancedKeys: AdvancedKeyConfig;
  customKeys: CustomKeyConfig;
  light: KeyboardLightConfig;
}

interface MacroEntry {
  date: string;
  id: number;
  name: string;
  step: Array<{
    id: number;
    keyValue: number;
    status: number;
    delay: number;
  }>;
}

interface KeyboardConfig {
  light: {
    main: LightConfig;
    logo: LightConfig;
    other: LightConfig;
  };
  keyboards: Array<Keyboards>;
  macro: {
    list: Array<MacroEntry>;
    v2list: any[];
  };
  system: {
    rateOfReturn: number;
    topDeadBandSwitch: number;
    productId: number;
    vendorId: number;
    keyboardName: string;
    usage: number;
    usagePage: number;
  };
  other?: any;
  version?: string;
  firmwareVersion?: string;
  protocolVersion?: string;
}

class ExportService {
  private processBatches = useBatchProcessing().processBatches;

  async gatherDeviceInfo(): Promise<Partial<KeyboardConfig['system']>> {
    try {
      const baseInfo = await KeyboardService.getBaseInfo();
      if (baseInfo instanceof Error) {
        console.error('Failed to get base info:', baseInfo);
        return {};
      }

      const pollingRateResult = await KeyboardService.getApi({ type: 'ORDER_TYPE_ROES' });
      const pollingRate = pollingRateResult instanceof Error ? 3 : pollingRateResult.sArg || 3;

      const topDeadBandResult = await KeyboardService.getApi({ type: 'ORDER_TYPE_TOP_DEAD_SWITCH' });
      const topDeadBand = topDeadBandResult instanceof Error ? 0 : topDeadBandResult.sArg || 0;

      return {
        rateOfReturn: pollingRate,
        topDeadBandSwitch: topDeadBand,
        productId: baseInfo.productId || 0,
        vendorId: baseInfo.vendorId || 0,
        keyboardName: baseInfo.keyboardName || '',
        usage: baseInfo.usage || 0,
        usagePage: baseInfo.usagePage || 0,
      };
    } catch (error) {
      console.error('Error gathering device info:', error);
      return {};
    }
  }

  async gatherLightingConfig(): Promise<Partial<KeyboardConfig['light']>> {
    try {
      const lighting = await KeyboardService.getLighting();
      if (lighting instanceof Error) {
        console.error('Failed to get lighting:', lighting);
        return {
          main: this.getDefaultLightConfig(),
          logo: this.getDefaultLightConfig(),
          other: this.getDefaultLightConfig(),
        };
      }

      return {
        main: this.convertLightingToConfig(lighting),
        logo: this.convertLightingToConfig(lighting),
        other: this.getDefaultLightConfig(),
      };
    } catch (error) {
      console.error('Error gathering lighting config:', error);
      return {
        main: this.getDefaultLightConfig(),
        logo: this.getDefaultLightConfig(),
        other: this.getDefaultLightConfig(),
      };
    }
  }

  private convertLightingToConfig(lighting: any): LightConfig {
    return {
      open: lighting.open ?? true,
      mode: lighting.mode ?? 0,
      staticColors: lighting.colors || ['#FF0000'],
      selectStaticColor: lighting.staticColor ?? 0,
      luminance: lighting.luminance ?? 100,
      speed: lighting.speed ?? 50,
      sleepTime: lighting.sleepDelay ?? 0,
      direction: lighting.direction ?? true,
      dynamic: lighting.dynamic ?? 0,
    };
  }

  private getDefaultLightConfig(): LightConfig {
    return {
      open: true,
      mode: 0,
      staticColors: ['#FF0000'],
      selectStaticColor: 0,
      luminance: 100,
      speed: 50,
      sleepTime: 0,
      direction: true,
      dynamic: 0,
    };
  }

  async gatherKeyboardsConfig(): Promise<Keyboards[]> {
    try {
      const layout = await KeyboardService.defKey();
      if (layout instanceof Error) {
        console.error('Failed to get keyboard layout:', layout);
        return [];
      }

      const allKeys: number[] = [];
      layout.forEach(layer => {
        layer.forEach(key => {
          if (!allKeys.includes(key.keyValue)) {
            allKeys.push(key.keyValue);
          }
        });
      });

      console.log(`Gathering config for ${allKeys.length} keys...`);

      const keyboardsData: Map<number, Partial<Keyboards>> = new Map();

      allKeys.forEach(keyValue => {
        const keyLocation = this.findKeyLocation(layout, keyValue);
        keyboardsData.set(keyValue, {
          col: keyLocation?.col ?? 0,
          row: keyLocation?.row ?? 0,
          keyValue,
          performance: this.getDefaultPerformance(),
          advancedKeys: {},
          customKeys: { fn0: null, fn1: null, fn2: null, fn3: null },
          light: { custom: { R: 255, G: 255, B: 255, key: keyValue } },
        });
      });

      await this.gatherCustomKeyBindings(allKeys, keyboardsData);

      await this.processBatches(allKeys, async (keyValue) => {
        await this.gatherKeyData(keyValue, keyboardsData);
      }, 40);

      return Array.from(keyboardsData.values()) as Keyboards[];
    } catch (error) {
      console.error('Error gathering keyboards config:', error);
      return [];
    }
  }

  private async gatherCustomKeyBindings(keys: number[], dataMap: Map<number, Partial<Keyboards>>): Promise<void> {
    try {
      const fnLayers = [0, 1, 2, 3];
      for (const layer of fnLayers) {
        const params = keys.map(key => ({ key, layout: layer }));
        const layoutInfo = await KeyboardService.getLayoutKeyInfo(params);
        
        if (!(layoutInfo instanceof Error) && Array.isArray(layoutInfo)) {
          layoutInfo.forEach((keyInfo, index) => {
            const keyValue = params[index].key;
            const keyData = dataMap.get(keyValue);
            if (keyData && keyInfo.keyValue !== keyValue) {
              const fnKey = `fn${layer}` as 'fn0' | 'fn1' | 'fn2' | 'fn3';
              keyData.customKeys![fnKey] = {
                keyValue: keyValue,
                bindKeyValue: keyInfo.keyValue
              };
            }
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Error gathering custom key bindings:', error);
    }
  }

  private findKeyLocation(layout: any[][], keyValue: number): { row: number; col: number } | null {
    for (const layer of layout) {
      for (const key of layer) {
        if (key.keyValue === keyValue) {
          return { row: key.location.row, col: key.location.col };
        }
      }
    }
    return null;
  }

  private async gatherKeyData(keyValue: number, dataMap: Map<number, Partial<Keyboards>>): Promise<void> {
    const keyData = dataMap.get(keyValue);
    if (!keyData) return;

    try {
      const [performanceMode, rtTravel, dpDr, axis, customLight] = await Promise.all([
        KeyboardService.getPerformanceMode(keyValue),
        KeyboardService.getRtTravel(keyValue),
        KeyboardService.getDpDr(keyValue),
        KeyboardService.getAxis(keyValue),
        KeyboardService.getCustomLighting(keyValue),
      ]);

      if (!(performanceMode instanceof Error)) {
        keyData.performance = {
          ...keyData.performance!,
          advancedKeyMode: performanceMode.advancedKeyMode ?? 0,
        };
      }

      if (!(rtTravel instanceof Error)) {
        keyData.performance!.rtPressValue = rtTravel.pressTravel ?? 0;
        keyData.performance!.rtReleaseValue = rtTravel.releaseTravel ?? 0;
      }

      if (!(dpDr instanceof Error)) {
        keyData.performance!.deadBandPressValue = dpDr.dpThreshold ?? 0;
        keyData.performance!.deadBandReleaseValue = dpDr.drThreshold ?? 0;
      }

      if (!(axis instanceof Error)) {
        keyData.performance!.axisID = axis.axis ?? 0;
      }

      if (!(customLight instanceof Error) && customLight.r !== undefined) {
        keyData.light = {
          custom: {
            R: customLight.r,
            G: customLight.g,
            B: customLight.b,
            key: keyValue,
          },
        };
      }

      const [dks, mpt, socd, mt, tgl, end] = await Promise.all([
        KeyboardService.getDks(keyValue),
        KeyboardService.getMpt(keyValue),
        KeyboardService.getSocd(keyValue),
        KeyboardService.getMT(keyValue),
        KeyboardService.getTGL(keyValue),
        KeyboardService.getEND(keyValue),
      ]);

      keyData.advancedKeys = {
        dks: !(dks instanceof Error) ? dks : undefined,
        mpt: !(mpt instanceof Error) ? mpt : undefined,
        socd: !(socd instanceof Error) ? socd : undefined,
        mt: !(mt instanceof Error) ? mt : undefined,
        tgl: !(tgl instanceof Error) ? tgl : undefined,
        end: !(end instanceof Error) ? end : undefined,
      };
    } catch (error) {
      console.error(`Error gathering data for key ${keyValue}:`, error);
    }
  }

  private getDefaultPerformance(): PerformanceConfig {
    return {
      isGlobalTriggering: true,
      globalTriggeringValue: 0,
      isRt: false,
      isSingle: false,
      singleTriggeringValue: 0,
      rtPressValue: 0,
      rtReleaseValue: 0,
      axisID: 0,
      deadBandPressValue: 0,
      deadBandReleaseValue: 0,
      advancedKeyMode: 0,
    };
  }

  async buildMacroLibrary(): Promise<{ list: MacroEntry[]; v2list: any[] }> {
    try {
      const layout = await KeyboardService.defKey();
      if (layout instanceof Error) {
        return { list: [], v2list: [] };
      }

      const allKeys: number[] = [];
      layout.forEach(layer => {
        layer.forEach(key => {
          if (!allKeys.includes(key.keyValue)) {
            allKeys.push(key.keyValue);
          }
        });
      });

      const macros: MacroEntry[] = [];
      let macroId = 1;

      await this.processBatches(allKeys, async (keyValue) => {
        const macroResult = await KeyboardService.getMacro(keyValue);
        if (!(macroResult instanceof Error) && macroResult && macroResult.macros && macroResult.macros.length > 0) {
          macros.push({
            date: new Date().toISOString(),
            id: macroId++,
            name: `Macro ${keyValue}`,
            step: macroResult.macros.map((m: any, idx: number) => ({
              id: idx,
              keyValue: m.keyCode || 0,
              status: m.status === 'press' ? 1 : 0,
              delay: m.timeDifference || 0,
            })),
          });
        }
      }, 40);

      console.log(`Found ${macros.length} macros`);
      return { list: macros, v2list: [] };
    } catch (error) {
      console.error('Error building macro library:', error);
      return { list: [], v2list: [] };
    }
  }

  async gatherKeyboardSnapshot(): Promise<KeyboardConfig> {
    console.log('Starting keyboard snapshot collection...');

    const [deviceInfo, lightingConfig, keyboardsConfig, macroLibrary] = await Promise.all([
      this.gatherDeviceInfo(),
      this.gatherLightingConfig(),
      this.gatherKeyboardsConfig(),
      this.buildMacroLibrary(),
    ]);

    const config: KeyboardConfig = {
      light: {
        main: lightingConfig.main || this.getDefaultLightConfig(),
        logo: lightingConfig.logo || this.getDefaultLightConfig(),
        other: lightingConfig.other || this.getDefaultLightConfig(),
      },
      keyboards: keyboardsConfig,
      macro: macroLibrary,
      system: {
        rateOfReturn: deviceInfo.rateOfReturn ?? 3,
        topDeadBandSwitch: deviceInfo.topDeadBandSwitch ?? 0,
        productId: deviceInfo.productId ?? 0,
        vendorId: deviceInfo.vendorId ?? 0,
        keyboardName: deviceInfo.keyboardName ?? '',
        usage: deviceInfo.usage ?? 0,
        usagePage: deviceInfo.usagePage ?? 0,
      },
    };

    console.log('Keyboard snapshot collection complete');
    return config;
  }

  async exportProfile(filename: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Gathering keyboard configuration...');
      const config = await this.gatherKeyboardSnapshot();
      
      console.log('Exporting configuration to file...');
      KeyboardService.exportConfig(config, filename);
      console.log(`Profile exported successfully as ${filename}`);
      return { success: true };
    } catch (error) {
      console.error('Failed to export profile:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async importProfile(file: File): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Importing profile from file...');
      const result = await KeyboardService.importConfig(file);
      
      if (result instanceof Error) {
        return { success: false, error: result.message };
      }

      if (result.success === false) {
        return { success: false, error: result.error || 'Import failed' };
      }

      console.log('Profile imported successfully');
      return { success: true };
    } catch (error) {
      console.error('Failed to import profile:', error);
      return { success: false, error: (error as Error).message };
    }
  }
}

export default new ExportService();

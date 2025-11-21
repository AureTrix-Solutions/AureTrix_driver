import KeyboardService from './KeyboardService';
import { useBatchProcessing } from '../composables/useBatchProcessing';
import type { KeyboardConfig, Keyboards } from '@sparklinkplayjoy/sdk-keyboard/dist/esm/src/utils/validate';

class ExportService {
  private processBatches = useBatchProcessing().processBatches;
  private globalTravelCache: number | null = null;

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 2,
    backoffMs: number = 200
  ): Promise<T> {
    let lastError: any;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, backoffMs * (attempt + 1)));
        }
      }
    }
    throw lastError;
  }

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
      const logoLighting = await KeyboardService.getLogoLighting();
      const specialLighting = await KeyboardService.getSpecialLighting();

      return {
        main: lighting instanceof Error ? this.getDefaultLightConfig() : this.convertLightingToConfig(lighting),
        logo: logoLighting instanceof Error ? this.getDefaultLightConfig() : this.convertLightingToConfig(logoLighting),
        other: specialLighting instanceof Error ? this.getDefaultLightConfig() : this.convertLightingToConfig(specialLighting),
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

  private convertModeNumberToType(modeNum: number): 'static' | 'custom' | 'dynamic' {
    if (modeNum === 0) return 'static';
    if (modeNum === 21) return 'custom';
    if (modeNum >= 1 && modeNum <= 20) return 'dynamic';
    return 'static'; // fallback
  }

  private convertLightingToConfig(lighting: any): KeyboardConfig['light']['main'] {
    return {
      open: lighting.open ?? true,
      mode: this.convertModeNumberToType(lighting.mode ?? 0),
      staticColors: lighting.colors || ['#FF0000'],
      selectStaticColor: lighting.staticColor ?? 0,
      luminance: lighting.luminance ?? 100,
      speed: lighting.speed ?? 50,
      sleepTime: lighting.sleepDelay ?? 0,
      direction: lighting.direction ?? true,
      dynamic: lighting.dynamic ?? 0,
    };
  }

  private getDefaultLightConfig(): KeyboardConfig['light']['main'] {
    return {
      open: true,
      mode: 'static',
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

      console.log(`Gathering config for ${allKeys.length} keys in phases...`);

      const keyboardsData: Map<number, Partial<Keyboards>> = new Map();

      allKeys.forEach(keyValue => {
        const keyLocation = this.findKeyLocation(layout, keyValue);
        keyboardsData.set(keyValue, {
          col: keyLocation?.col ?? 0,
          row: keyLocation?.row ?? 0,
          keyValue,
          performance: this.getDefaultPerformance(),
          advancedKeys: { advancedType: 'none', value: 0 },
          customKeys: { fn0: null, fn1: null, fn2: null, fn3: null },
          light: { custom: { R: 255, G: 255, B: 255, key: keyValue } },
        });
      });

      console.log('Phase A: Gathering layout bindings (Fn0-Fn3)...');
      const phaseAStart = performance.now();
      await this.gatherCustomKeyBindings(allKeys, keyboardsData);
      console.log(`Phase A completed in ${(performance.now() - phaseAStart).toFixed(2)}ms`);
      await new Promise(resolve => setTimeout(resolve, 150));

      console.log('Phase B: Gathering performance & travel data...');
      const phaseBStart = performance.now();
      await this.processBatches(allKeys, async (keyValue) => {
        await this.gatherPerformanceData(keyValue, keyboardsData);
      }, 80, 100);
      console.log(`Phase B completed in ${(performance.now() - phaseBStart).toFixed(2)}ms`);
      await new Promise(resolve => setTimeout(resolve, 150));

      console.log('Phase C: Gathering advanced key data...');
      const phaseCStart = performance.now();
      await this.processBatches(allKeys, async (keyValue) => {
        await this.gatherAdvancedKeyData(keyValue, keyboardsData);
      }, 80, 100);
      console.log(`Phase C completed in ${(performance.now() - phaseCStart).toFixed(2)}ms`);
      await new Promise(resolve => setTimeout(resolve, 150));

      console.log('Phase D: Gathering per-key lighting data...');
      const phaseDStart = performance.now();
      await this.processBatches(allKeys, async (keyValue) => {
        await this.gatherLightingData(keyValue, keyboardsData);
      }, 80, 100);
      console.log(`Phase D completed in ${(performance.now() - phaseDStart).toFixed(2)}ms`);

      console.log('All phases complete');
      return Array.from(keyboardsData.values()) as Keyboards[];
    } catch (error) {
      console.error('Error gathering keyboards config:', error);
      return [];
    }
  }

  private async gatherCustomKeyBindings(keys: number[], dataMap: Map<number, Partial<Keyboards>>): Promise<void> {
    try {
      const fnLayers = [0, 1, 2, 3];
      const batchSize = 10;
      
      for (const layer of fnLayers) {
        console.log(`  Gathering Fn${layer} bindings (batchSize=${batchSize})...`);
        const layerStart = performance.now();
        
        for (let i = 0; i < keys.length; i += batchSize) {
          const keyBatch = keys.slice(i, i + batchSize);
          const params = keyBatch.map(key => ({ key, layout: layer }));
          
          const callStart = performance.now();
          const layoutInfo = await this.retryWithBackoff(() => KeyboardService.getLayoutKeyInfo(params));
          const callDuration = performance.now() - callStart;
          console.log(`    Batch ${Math.floor(i / batchSize) + 1}: ${keyBatch.length} keys, ${callDuration.toFixed(2)}ms`);
          
          if (!(layoutInfo instanceof Error) && Array.isArray(layoutInfo)) {
            layoutInfo.forEach((keyInfo: any, index) => {
              const keyValue = params[index].key;
              const keyData = dataMap.get(keyValue);
              if (keyData) {
                const fnKey = `fn${layer}` as 'fn0' | 'fn1' | 'fn2' | 'fn3';
                
                // FIX: SDK returns { key, value }, not IDefKeyInfo
                const bindValue = Number(keyInfo?.value);
                if (!isNaN(bindValue) && typeof keyInfo?.value !== 'undefined') {
                  keyData.customKeys![fnKey] = {
                    keyValue: keyValue,
                    bindKeyValue: bindValue
                  };
                } else {
                  // Leave as null if no valid binding
                  keyData.customKeys![fnKey] = null;
                }
              }
            });
          }
          
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`  Fn${layer} completed in ${(performance.now() - layerStart).toFixed(2)}ms`);
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

  private async gatherPerformanceData(keyValue: number, dataMap: Map<number, Partial<Keyboards>>): Promise<void> {
    const keyData = dataMap.get(keyValue);
    if (!keyData) return;

    try {
      const performanceMode = await this.retryWithBackoff(() => KeyboardService.getPerformanceMode(keyValue));
      await new Promise(resolve => setTimeout(resolve, 50));

      const rtTravel = await this.retryWithBackoff(() => KeyboardService.getRtTravel(keyValue));
      await new Promise(resolve => setTimeout(resolve, 50));

      const dpDr = await this.retryWithBackoff(() => KeyboardService.getDpDr(keyValue));
      await new Promise(resolve => setTimeout(resolve, 50));

      const axis = await this.retryWithBackoff(() => KeyboardService.getAxis(keyValue));

      if (!(performanceMode instanceof Error)) {
        keyData.performance!.advancedKeyMode = performanceMode.advancedKeyMode ?? 0;
        
        // Parse touchMode to set boolean flags
        const touchMode = performanceMode.touchMode;
        keyData.performance!.isRt = touchMode === 'rt';
        keyData.performance!.isGlobalTriggering = touchMode === 'global';
        keyData.performance!.isSingle = touchMode === 'single';
      }
      
      // ALWAYS collect all travel values (hardware preserves them regardless of active mode)
      // Global travel value (same for all keys)
      if (this.globalTravelCache === null) {
        const globalTravel = await this.retryWithBackoff(() => KeyboardService.getGlobalTouchTravel());
        if (!(globalTravel instanceof Error)) {
          this.globalTravelCache = globalTravel.globalTouchTravel ?? 0;
        }
      }
      keyData.performance!.globalTriggeringValue = this.globalTravelCache ?? 0;
      
      // Single travel value (per-key)
      const singleTravel = await this.retryWithBackoff(() => KeyboardService.getSingleTravel(keyValue));
      if (!(singleTravel instanceof Error)) {
        keyData.performance!.singleTriggeringValue = singleTravel ?? 0;
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
    } catch (error) {
      console.error(`Error gathering performance data for key ${keyValue}:`, error);
    }
  }

  private async gatherAdvancedKeyData(keyValue: number, dataMap: Map<number, Partial<Keyboards>>): Promise<void> {
    const keyData = dataMap.get(keyValue);
    if (!keyData) return;

    try {
      const dks = await this.retryWithBackoff(() => KeyboardService.getDks(keyValue));
      await new Promise(resolve => setTimeout(resolve, 50));

      const mpt = await this.retryWithBackoff(() => KeyboardService.getMpt(keyValue));
      await new Promise(resolve => setTimeout(resolve, 50));

      const socd = await this.retryWithBackoff(() => KeyboardService.getSocd(keyValue));
      await new Promise(resolve => setTimeout(resolve, 50));

      const mt = await this.retryWithBackoff(() => KeyboardService.getMT(keyValue));
      await new Promise(resolve => setTimeout(resolve, 50));

      const tgl = await this.retryWithBackoff(() => KeyboardService.getTGL(keyValue));
      await new Promise(resolve => setTimeout(resolve, 50));

      const end = await this.retryWithBackoff(() => KeyboardService.getEND(keyValue));

      const advancedKeys: Keyboards['advancedKeys'] = {};
      let activeType: string | undefined;
      let activeValue: number = 0;

      if (!(dks instanceof Error) && dks) {
        advancedKeys.dks = dks;
        if (dks.enable) {
          activeType = 'dks';
          activeValue = dks.keyValue;
        }
      }

      if (!(mpt instanceof Error) && mpt) {
        advancedKeys.mpt = mpt;
        if (mpt.enable && !activeType) {
          activeType = 'mpt';
          activeValue = mpt.triggeringPoint;
        }
      }

      if (!(socd instanceof Error) && socd) {
        advancedKeys.socd = socd;
        if (socd.enable && !activeType) {
          activeType = 'socd';
          activeValue = socd.mode;
        }
      }

      if (!(mt instanceof Error) && mt) {
        advancedKeys.mt = mt;
        if (mt.enable && !activeType) {
          activeType = 'mt';
          activeValue = mt.mode;
        }
      }

      if (!(tgl instanceof Error) && tgl) {
        advancedKeys.tgl = tgl;
        if (tgl.enable && !activeType) {
          activeType = 'tgl';
          activeValue = 0;
        }
      }

      if (!(end instanceof Error) && end) {
        advancedKeys.end = end;
      }

      if (activeType) {
        advancedKeys.advancedType = activeType;
        advancedKeys.value = activeValue;
      } else {
        advancedKeys.advancedType = 'none';
        advancedKeys.value = 0;
      }

      keyData.advancedKeys = advancedKeys;
    } catch (error) {
      console.error(`Error gathering advanced key data for key ${keyValue}:`, error);
    }
  }

  private async gatherLightingData(keyValue: number, dataMap: Map<number, Partial<Keyboards>>): Promise<void> {
    const keyData = dataMap.get(keyValue);
    if (!keyData) return;

    try {
      const customLight = await this.retryWithBackoff(() => KeyboardService.getCustomLighting(keyValue));

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
    } catch (error) {
      console.error(`Error gathering lighting data for key ${keyValue}:`, error);
    }
  }

  private getDefaultPerformance(): Keyboards['performance'] {
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

  async buildMacroLibrary(): Promise<KeyboardConfig['macro']> {
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

      const macros: KeyboardConfig['macro']['list'] = [];
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
    const snapshotStart = performance.now();
    
    // Reset cache for fresh export
    this.globalTravelCache = null;

    console.log('Step 1: Gathering system info...');
    const system = await this.gatherDeviceInfo();
    
    console.log('Step 2: Gathering lighting configuration...');
    const light = await this.gatherLightingConfig();
    
    console.log('Step 3: Gathering keyboard layouts and key data...');
    const keyboards = await this.gatherKeyboardsConfig();
    
    console.log('Step 4: Building macro library...');
    const macro = await this.buildMacroLibrary();

    const config: KeyboardConfig = {
      system: system as KeyboardConfig['system'],
      light: light as KeyboardConfig['light'],
      keyboards: keyboards as Keyboards[],
      macro,
    };

    const totalDuration = performance.now() - snapshotStart;
    console.log(`Keyboard snapshot collection complete in ${totalDuration.toFixed(2)}ms`);
    console.log(`Total keys: ${keyboards.length}, Total macros: ${macro.list.length}`);
    
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

  async exportProfileDebug(filename: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Gathering keyboard configuration for debug export...');
      const config = await this.gatherKeyboardSnapshot();
      
      console.log('Exporting raw JSON configuration...');
      const jsonString = JSON.stringify(config, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log(`Debug profile exported successfully as ${filename}.json`);
      return { success: true };
    } catch (error) {
      console.error('Failed to export debug profile:', error);
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

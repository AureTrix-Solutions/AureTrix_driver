import KeyboardService from './KeyboardService';
import CryptoJS from 'crypto-js';
import { useBatchProcessing } from '../composables/useBatchProcessing';
import type { KeyboardConfig, Keyboards } from '@sparklinkplayjoy/sdk-keyboard/dist/esm/src/utils/validate';
import type { ILightMode, IKey } from '@sparklinkplayjoy/protocol-keyboard';
import type { LightModeConfigs } from '@sparklinkplayjoy/sdk-keyboard/dist/esm/src/types/type';
import type { IDefKeyInfo } from '../types/types';

/** advancedKeyMode id → advancedType string (sdk-reference-v2.md §5.2 enum, Verified:
 *  0=none … 9=rs; ids 7 and 10-15 have no SDK map entry and fall back to 'none'). */
const ADVANCED_KEY_MODE_MAP: Record<number, string> = {
  0: 'none',
  1: 'dks',
  2: 'mpt',
  3: 'mt',
  4: 'tgl',
  5: 'end',
  6: 'macro',
  8: 'socd',
  9: 'rs',
};

class ExportService {
  private processBatches = useBatchProcessing().processBatches;
  private globalTravelCache: number | null = null;

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 2,
    backoffMs: number = 200
  ): Promise<T> {
    let lastError: unknown;
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

      // Live reads (D1, PO-approved 2026-10-13): §3 decodes ROES → number (rate index) and
      // TOP_DEAD_SWITCH → boolean; any Error or unexpected shape falls back to literals 3/0.
      const roes = await KeyboardService.getApi({ type: 'ORDER_TYPE_ROES' });
      const pollingRate = !(roes instanceof Error) && typeof roes === 'number' ? roes : 3;
      const topDeadSwitch = await KeyboardService.getApi({ type: 'ORDER_TYPE_TOP_DEAD_SWITCH' });
      const topDeadBand = !(topDeadSwitch instanceof Error) && typeof topDeadSwitch === 'boolean' ? Number(topDeadSwitch) : 0;

      return {
        // SDK import's setSystem discards rateOfReturn (bundle-verified): polling rate is NOT
        // restored by import — SDK-side limitation, PO accepted; no setPollingRate bypass (D4).
        rateOfReturn: pollingRate,
        topDeadBandSwitch: topDeadBand,
        // getBaseInfo carries none of these identity fields; PO decision 2026-10-13 —
        // intentionally static, not revisited (D3).
        productId: 0,
        vendorId: 0,
        keyboardName: '',
        usage: 0,
        usagePage: 0,
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

  private convertLightingToConfig(lighting: ILightMode): KeyboardConfig['light']['main'] {
    return {
      open: lighting.open ?? true,
      mode: lighting.type ?? 'static',
      staticColors: lighting.colors || ['#FF0000'],
      selectStaticColor: lighting.staticColor ?? 0,
      luminance: lighting.luminance ?? 100,
      speed: lighting.speed ?? 50,
      sleepTime: lighting.sleepDelay ?? 0,
      direction: lighting.direction ?? true,
      dynamic: lighting.mode ?? 0,
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

      await this.gatherCustomKeyBindings(allKeys, keyboardsData);
      await new Promise(resolve => setTimeout(resolve, 150));

      await this.processBatches(allKeys, async (keyValue) => {
        await this.gatherPerformanceData(keyValue, keyboardsData);
      }, 80, 100);
      await new Promise(resolve => setTimeout(resolve, 150));

      await this.processBatches(allKeys, async (keyValue) => {
        await this.gatherAdvancedKeyData(keyValue, keyboardsData);
      }, 80, 100);
      await new Promise(resolve => setTimeout(resolve, 150));

      await this.processBatches(allKeys, async (keyValue) => {
        await this.gatherLightingData(keyValue, keyboardsData);
      }, 80, 100);

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
        for (let i = 0; i < keys.length; i += batchSize) {
          const keyBatch = keys.slice(i, i + batchSize);
          const params = keyBatch.map(key => ({ key, layout: layer }));
          
          const layoutInfo = await this.retryWithBackoff(() => KeyboardService.getLayoutKeyInfo(params));
          
          if (!(layoutInfo instanceof Error) && Array.isArray(layoutInfo)) {
            layoutInfo.forEach((keyInfo: IKey, index) => {
              const keyValue = params[index].key;
              const keyData = dataMap.get(keyValue);
              if (keyData) {
                const fnKey = `fn${layer}` as 'fn0' | 'fn1' | 'fn2' | 'fn3';
                const bindValue = Number(keyInfo?.value);
                if (!isNaN(bindValue) && typeof keyInfo?.value !== 'undefined') {
                  keyData.customKeys![fnKey] = {
                    keyValue: keyValue,
                    bindKeyValue: bindValue
                  };
                } else {
                  keyData.customKeys![fnKey] = null;
                }
              }
            });
          }
          
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Error gathering custom key bindings:', error);
    }
  }

  private findKeyLocation(layout: IDefKeyInfo[][], keyValue: number): { row: number; col: number } | null {
    for (const layer of layout) {
      for (const key of layer) {
        if (key.keyValue === keyValue && key.location) {
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
        // Live deadband readback (D1, PO-approved 2026-10-13): was a dead-shape read pinned to 0.
        keyData.performance!.deadBandPressValue = dpDr.pressDead ?? 0;
        keyData.performance!.deadBandReleaseValue = dpDr.releaseDead ?? 0;
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
      // D2b: canonical DKS export shape — all DKS/TRPS slots plus per-slot DB travel.
      // Import's dks branch consumes {dks,trps,db,db2}; db3 is carry-only (extra props
      // pass SDK validation) for the later DB3 restore path.
      const dksAll = await this.retryWithBackoff(() => KeyboardService.getDksAll(keyValue));
      await new Promise(resolve => setTimeout(resolve, 50));

      const trpsAll = await this.retryWithBackoff(() => KeyboardService.getTrpsAll(keyValue));
      await new Promise(resolve => setTimeout(resolve, 50));

      const db1 = await this.retryWithBackoff(() => KeyboardService.getDksTravel(keyValue, 'Layout_DB1'));
      await new Promise(resolve => setTimeout(resolve, 50));

      const db2 = await this.retryWithBackoff(() => KeyboardService.getDksTravel(keyValue, 'Layout_DB2'));
      await new Promise(resolve => setTimeout(resolve, 50));

      const db3 = await this.retryWithBackoff(() => KeyboardService.getDksTravel(keyValue, 'Layout_DB3'));
      await new Promise(resolve => setTimeout(resolve, 50));

      const mpt = await this.retryWithBackoff(() => KeyboardService.getMpt(keyValue));
      await new Promise(resolve => setTimeout(resolve, 50));

      // F2: read SOCD with '1.0.7' so the decode yields the 7-field
      // {pos1,pos2,key1,key2,type,mode,delay} shape import's SOCDPack consumes;
      // the default '1.0.5' decode is lossy ({pos,key,type,mode}) and wrote
      // undefined wire bytes (dead keys after import).
      const socd = await this.retryWithBackoff(() => KeyboardService.getSocd(keyValue, '1.0.7'));
      await new Promise(resolve => setTimeout(resolve, 50));

      const mt = await this.retryWithBackoff(() => KeyboardService.getMT(keyValue));
      await new Promise(resolve => setTimeout(resolve, 50));

      // D2: shared MT/TGL delay (ms — getMtorTgl decodes the 10ms wire unit ×10).
      // Read for every key like the db reads; stored only when mt succeeded.
      const mtorTglDelay = await this.retryWithBackoff(() => KeyboardService.getMtorTgl(keyValue));
      await new Promise(resolve => setTimeout(resolve, 50));

      const tgl = await this.retryWithBackoff(() => KeyboardService.getTGL(keyValue));
      await new Promise(resolve => setTimeout(resolve, 50));

      const end = await this.retryWithBackoff(() => KeyboardService.getEND(keyValue));

      const advancedKeys: Keyboards['advancedKeys'] = {};

      // advancedType/value are derived from the live advancedKeyMode read in the
      // performance pass (D2; sdk-ref §5.2 enum). The dks and mt entries below are the
      // canonical shapes import consumes; mpt/socd/tgl/end store their raw objects
      // verbatim (their decode shapes match what import's branches expect).
      if (!(dksAll instanceof Error) && dksAll && !(trpsAll instanceof Error) && trpsAll) {
        // F2: all 4 dks/trps points — the firmware wire (DKSDataPack) expects 4+4;
        // a 3-point payload byte-shifts everything after dks3 and corrupts the
        // trps/db read-back on import.
        advancedKeys.dks = {
          dks: { 1: dksAll.dks1, 2: dksAll.dks2, 3: dksAll.dks3, 4: dksAll.dks4 },
          trps: { 1: trpsAll.trps1, 2: trpsAll.trps2, 3: trpsAll.trps3, 4: trpsAll.trps4 },
          db: db1 instanceof Error ? 0 : db1,
          db2: db2 instanceof Error ? 0 : db2,
          db3: db3 instanceof Error ? 0 : db3,
        };
      }

      if (!(mpt instanceof Error) && mpt) {
        advancedKeys.mpt = mpt;
      }

      if (!(socd instanceof Error) && socd) {
        advancedKeys.socd = socd;
      }

      if (!(mt instanceof Error) && mt) {
        // Canonical MT shape import consumes: {dksAll:[dks1..4], delay} — delay in ms
        // AS-IS (import's mt branch does delay/10 before cmdMT, which puts the 10ms
        // wire unit on the wire; getMtorTgl's ×10 decode is ms ⇒ storing ms round-trips).
        advancedKeys.mt = {
          dksAll: [mt.dks1, mt.dks2, mt.dks3, mt.dks4],
          delay: mtorTglDelay instanceof Error ? 0 : mtorTglDelay,
        };
      }

      if (!(tgl instanceof Error) && tgl) {
        advancedKeys.tgl = tgl;
      }

      if (!(end instanceof Error) && end) {
        advancedKeys.end = end;
      }

      // D2: live mode id → advancedType (§5.2). value MUST be the numeric mode id:
      // SDK setAdvancedKeys resolves the setter via advancedKeysSdkMap[value]; the
      // per-mode data (dks/mpt/mt/tgl/end/socd) travels in its own sibling field.
      const advancedKeyMode = keyData.performance?.advancedKeyMode ?? 0;
      advancedKeys.advancedType = ADVANCED_KEY_MODE_MAP[advancedKeyMode] ?? 'none';
      advancedKeys.value = advancedKeyMode;

      keyData.advancedKeys = advancedKeys;
    } catch (error) {
      console.error(`Error gathering advanced key data for key ${keyValue}:`, error);
    }
  }

  private async withCustomModeForExport<T>(callback: () => Promise<T>): Promise<T> {
    interface LightingSnapshot {
      main: ILightMode & { dynamicColorId: number };
      logo: (ILightMode & { dynamicColorId: number }) | null;
      other: ILightMode | null;
    }

    let snapshot: LightingSnapshot | null = null;
    let wasAlreadyCustom = false;

    try {
      const mainLighting = await KeyboardService.getLighting();
      const logoLighting = await KeyboardService.getLogoLighting();
      const otherLighting = await KeyboardService.getSpecialLighting();

      if (mainLighting instanceof Error) {
        throw new Error('Failed to get current main lighting state');
      }

      snapshot = {
        main: mainLighting,
        logo: logoLighting instanceof Error ? null : logoLighting,
        other: otherLighting instanceof Error ? null : otherLighting,
      };

      wasAlreadyCustom = mainLighting.mode === 21 && mainLighting.open === true;

      if (!wasAlreadyCustom) {
        const { dynamicColorId, ...filteredParams } = mainLighting;
        filteredParams.mode = 21;
        filteredParams.type = 'custom';
        filteredParams.open = true;

        const switchResult = await KeyboardService.setLighting(filteredParams);
        if (switchResult instanceof Error) {
          throw new Error(`Failed to switch to custom mode: ${switchResult.message}`);
        }

        await new Promise(resolve => setTimeout(resolve, 300));
      }

      const result = await callback();
      return result;

    } finally {
      if (snapshot && !wasAlreadyCustom) {
        try {
          const mainWasOff = snapshot.main.open === false;
          
          if (mainWasOff) {
            const { dynamicColorId, ...mainParams } = snapshot.main;
            mainParams.open = false;
            const mainResult = await KeyboardService.setLighting(mainParams);
            if (mainResult instanceof Error) {
              console.error('Failed to restore main zone OFF:', mainResult.message);
            }
          } else {
            const { dynamicColorId, ...mainParams } = snapshot.main;
            const mainResult = await KeyboardService.setLighting(mainParams);
            if (mainResult instanceof Error) {
              console.error('Failed to restore main lighting:', mainResult.message);
            }
          }

          if (snapshot.logo) {
            const logoWasOn = snapshot.logo.open === true;
            if (logoWasOn) {
              const { dynamicColorId, ...logoParams } = snapshot.logo;
              const logoResult = await KeyboardService.setLogoLighting({
                ...logoParams,
                type: logoParams.type === 'dynamic' ? 'dynamic' : 'static',
              });
              if (logoResult instanceof Error) {
                console.error('Failed to restore logo lighting:', logoResult.message);
              }
            }
          }

          if (snapshot.other) {
            const otherWasOn = snapshot.other.open === true;
            if (otherWasOn) {
              const otherResult = await KeyboardService.setSpecialLighting(snapshot.other);
              if (otherResult instanceof Error) {
                console.error('Failed to restore special lighting:', otherResult.message);
              }
            }
          }
        } catch (error) {
          console.error('Error restoring lighting state:', error);
        }
      }
    }
  }

  private async gatherLightingData(keyValue: number, dataMap: Map<number, Partial<Keyboards>>): Promise<void> {
    const keyData = dataMap.get(keyValue);
    if (!keyData) return;

    try {
      const customLight = await this.retryWithBackoff(() => KeyboardService.getCustomLighting(keyValue));

      if (!(customLight instanceof Error)) {
        keyData.light = {
          custom: {
            R: customLight.R,
            G: customLight.G,
            B: customLight.B,
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
    // The SDK has no macro-action readback: getMacro returns slot metadata only
    // ({key,id,len,mode,num,delay} — sdk-reference-v2.md §7, getMacroRecdata) and
    // getMacroDataRecdata is a stub (`return data`). The previous implementation
    // read `macroResult.macros`, which never exists, so the guard never passed and
    // the exported macro list was always empty. Returning the empty library directly
    // preserves the KeyboardConfig schema (caller gatherKeyboardSnapshot) without
    // dead hardware round-trips. A real readback would need raw-HID work — see
    // backlog `exportservice-review`. PO decision (2026-10-13, D5): the empty
    // macro list is accepted for export; importProfile now snapshots/restores
    // localStorage["MacroList"] around SDK import so it never destroys local macros.
    return { list: [], v2list: [] };
  }

  async gatherKeyboardSnapshot(): Promise<KeyboardConfig> {
    this.globalTravelCache = null;

    let originalLighting: (ILightMode & { dynamicColorId: number }) | Error | null = null;
    let originalLogo: (ILightMode & { dynamicColorId: number }) | Error | null = null;
    let originalSpecial: ILightMode | Error | null = null;

    try {
      originalLighting = await KeyboardService.getLighting();
      originalLogo = await KeyboardService.getLogoLighting();
      originalSpecial = await KeyboardService.getSpecialLighting();

      if (originalLighting instanceof Error) {
        throw new Error('Failed to capture original lighting state');
      }

      const { dynamicColorId, ...originalParams } = originalLighting;
      const tempCustomParams: ILightMode = {
        ...originalParams,
        type: 'custom',
        mode: 21,
        open: true,
      };

      const switchResult = await KeyboardService.setLighting(tempCustomParams);
      if (switchResult instanceof Error) {
        throw new Error(`Failed to switch to custom mode: ${switchResult.message}`);
      }

      await new Promise(resolve => setTimeout(resolve, 300));

      const system = await this.gatherDeviceInfo();
      const light = await this.gatherLightingConfig();
      const keyboards = await this.gatherKeyboardsConfig();
      const macro = await this.buildMacroLibrary();

      const config: KeyboardConfig = {
        system: system as KeyboardConfig['system'],
        light: light as KeyboardConfig['light'],
        keyboards: keyboards as Keyboards[],
        macro,
      };
      
      return config;

    } finally {
      if (originalLighting && !(originalLighting instanceof Error)) {
        try {
          const { dynamicColorId, ...mainParams } = originalLighting;
          const restoreResult = await KeyboardService.setLighting(mainParams);
          if (restoreResult instanceof Error) {
            console.error('Failed to restore main lighting:', restoreResult.message);
          }

          if (originalLogo && !(originalLogo instanceof Error)) {
            const logoWasOn = originalLogo.open === true;
            if (logoWasOn) {
              const { dynamicColorId: logoColorId, ...logoParams } = originalLogo;
              await KeyboardService.setLogoLighting({
                ...logoParams,
                type: logoParams.type === 'dynamic' ? 'dynamic' : 'static',
              });
            }
          }

          if (originalSpecial && !(originalSpecial instanceof Error)) {
            const specialWasOn = originalSpecial.open === true;
            if (specialWasOn) {
              await KeyboardService.setSpecialLighting(originalSpecial);
            }
          }
        } catch (error) {
          console.error('Error restoring original lighting:', error);
        }
      }
    }
  }

  async exportProfile(filename: string): Promise<{ success: boolean; error?: string }> {
    try {
      const config = await this.gatherKeyboardSnapshot();
      KeyboardService.exportConfig(config, filename);
      return { success: true };
    } catch (error) {
      console.error('Failed to export profile:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  private convertLightConfigToSDKFormat(lightConfig: KeyboardConfig['light']['main']): LightModeConfigs {
    let mode = 0;
    if (lightConfig.mode === 'static') {
      mode = 0;
    } else if (lightConfig.mode === 'dynamic') {
      mode = lightConfig.dynamic;
    } else if (lightConfig.mode === 'custom') {
      mode = 21;
    }

    const sdkFormat: LightModeConfigs = {
      direction: lightConfig.direction,
      speed: lightConfig.speed,
      colors: lightConfig.staticColors,
      luminance: lightConfig.luminance,
      sleepDelay: lightConfig.sleepTime,
      staticColor: lightConfig.selectStaticColor,
      type: lightConfig.mode,
      mode,
      superResponse: false,
    };

    return sdkFormat;
  }

  private async applyLightingZones(config: KeyboardConfig): Promise<void> {
    const anyZoneOff = 
      (config.light?.main && !config.light.main.open) ||
      (config.light?.logo && !config.light.logo.open) ||
      (config.light?.other && !config.light.other.open);

    if (anyZoneOff) {
      const closeResult = await KeyboardService.closedLighting();
      if (closeResult instanceof Error) {
        console.error('Failed to turn off lighting:', closeResult.message);
      }
    }

    if (config.light?.main && config.light.main.open) {
      const mainLighting = this.convertLightConfigToSDKFormat(config.light.main);
      const result = await KeyboardService.setLighting(mainLighting);
      if (result instanceof Error) {
        console.error('Failed to apply main lighting:', result.message);
      }
    }

    if (config.light?.logo && config.light.logo.open) {
      const logoLighting = this.convertLightConfigToSDKFormat(config.light.logo);
      const result = await KeyboardService.setLogoLighting({
        ...logoLighting,
        open: true,
        type: logoLighting.type === 'dynamic' ? 'dynamic' : 'static',
      });
      if (result instanceof Error) {
        console.error('Failed to apply logo lighting:', result.message);
      }
    }

    if (config.light?.other && config.light.other.open) {
      const otherLighting = this.convertLightConfigToSDKFormat(config.light.other);
      const result = await KeyboardService.setSpecialLighting(otherLighting);
      if (result instanceof Error) {
        console.error('Failed to apply special lighting:', result.message);
      }
    }
  }

  async applyImportedConfig(_config: KeyboardConfig): Promise<void> {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const saveResult = await KeyboardService.saveCustomLighting();
      if (saveResult instanceof Error) {
        console.error('Failed to save custom lighting:', saveResult.message);
      }
    } catch (error) {
      console.error('Failed to apply imported configuration:', error);
      throw error;
    }
  }

  /**
   * Decrypt an SDK export file into its KeyboardConfig.
   *
   * The SDK's exportEncryptedJSON writes `{data:"<AES ciphertext>"}` using its
   * hardcoded passphrase key (bundle-verified). Returns null if the file is not
   * in that format or decryption fails — callers skip repairs in that case and
   * the SDK import itself still stands.
   */
  private decryptSDKConfig(text: string): KeyboardConfig | null {
    try {
      const parsed = JSON.parse(text);
      const plaintext = CryptoJS.AES.decrypt(parsed.data, 'fDPy6vvnpPsYm2T0g1bh').toString(CryptoJS.enc.Utf8);
      if (!plaintext) return null;
      return JSON.parse(plaintext) as KeyboardConfig;
    } catch (error) {
      console.error('Failed to decrypt SDK export:', error);
      return null;
    }
  }

  async importProfile(file: File): Promise<{ success: boolean; error?: string }> {
    try {
      // Switch to custom mode before import to ensure RGB data loads correctly
      const currentState = await KeyboardService.getLighting();
      
      if (!(currentState instanceof Error)) {
        const { open, dynamicColorId, ...filteredParams } = currentState;
        filteredParams.mode = 21;
        filteredParams.type = 'custom';
        
        const switchResult = await KeyboardService.setLighting(filteredParams);
        if (switchResult instanceof Error) {
          console.error('Failed to switch to custom mode:', switchResult.message);
        } else {
          await new Promise(resolve => setTimeout(resolve, 250));
        }
      }
      
      // SDK setImportData unconditionally calls sync setMacro, which overwrites
      // localStorage["MacroList"] with the imported file's (always-empty) list.
      // Snapshot and restore around the import so the local macro library survives.
      const macroSnapshot = localStorage.getItem('MacroList');

      const result = await KeyboardService.importConfig(file);
      
      if (result instanceof Error) {
        return { success: false, error: result.message };
      }

      if (result.success === false) {
        return { success: false, error: result.error || 'Import failed' };
      }

      // setMacro ran synchronously inside importConfig — no race; safe to restore now.
      if (macroSnapshot !== null) {
        localStorage.setItem('MacroList', macroSnapshot);
      } else {
        localStorage.removeItem('MacroList');
      }

      // Read the encrypted SDK export and decrypt it to the real KeyboardConfig.
      // Best-effort: if it fails (not an SDK export / bad cipher), repairs are
      // skipped — the SDK import above already stands on its own.
      const config = this.decryptSDKConfig(await file.text());
      if (config) {
        // Wait for SDK import to complete, then save custom RGB to flash
        await this.applyImportedConfig(config);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to import profile:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async exportProfileDebug(): Promise<{ success: boolean; error?: string }> {
    try {
      const config = await this.gatherKeyboardSnapshot();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `debug-profile-${timestamp}.json`;
      const jsonStr = JSON.stringify(config, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      console.error('Failed to export debug profile:', error);
      return { success: false, error: (error as Error).message };
    }
  }
}

export default new ExportService();

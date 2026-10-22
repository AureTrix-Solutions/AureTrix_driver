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
      // F-D7-2: gatherLightingConfig re-reads AFTER the temp custom-mode switch, so
      // light.main always reports custom/21 regardless of the device's real mode.
      // The pre-switch snapshot holds the true mode — use it for the exported main zone.
      if (originalLighting) {
        light.main = this.convertLightingToConfig(originalLighting);
      }
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
      const exportResult = await KeyboardService.exportConfig(config, filename);
      if (exportResult instanceof Error) {
        return { success: false, error: exportResult.message };
      }
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

  /**
   * Post-import repair (1): the SDK import never writes the per-slot DB3
   * travel value, so re-write it from the stored config (mm, round-trip of
   * getDksTravel 'Layout_DB3').
   */
  private async repairDksDb3(config: KeyboardConfig): Promise<void> {
    const db3ByKey = new Map<number, number>();
    for (const entry of config.keyboards ?? []) {
      const db3 = entry.advancedKeys?.dks?.db3;
      if (typeof db3 === 'number') {
        db3ByKey.set(entry.keyValue, db3);
      }
    }
    await this.processBatches([...db3ByKey.keys()], async (keyValue) => {
      const db3 = db3ByKey.get(keyValue);
      if (db3 === undefined) return;
      const result = await KeyboardService.setDksTravel(keyValue, db3, 'Layout_DB3');
      if (result instanceof Error) {
        console.error(`Failed to restore DB3 travel for key ${keyValue}:`, result.message);
      }
    }, 80, 100);
  }

  /**
   * Post-import repair (3, F-2b-1): SDK setPerformance routes global-mode
   * deadband to the global DB register, but the app's canonical storage is
   * per-key Layout_DP/DR in all modes — re-write both per key. Values of 0
   * are applied too (they clear stale device values).
   */
  private async repairGlobalDeadband(config: KeyboardConfig): Promise<void> {
    const deadbandByKey = new Map<number, { press: number; release: number }>();
    for (const entry of config.keyboards ?? []) {
      const perf = entry.performance;
      if (perf?.isGlobalTriggering && typeof perf.deadBandPressValue === 'number') {
        deadbandByKey.set(entry.keyValue, {
          press: perf.deadBandPressValue,
          release: perf.deadBandReleaseValue,
        });
      }
    }
    await this.processBatches([...deadbandByKey.keys()], async (keyValue) => {
      const deadband = deadbandByKey.get(keyValue);
      if (!deadband) return;
      const pressResult = await KeyboardService.setDp(keyValue, deadband.press);
      if (pressResult instanceof Error) {
        console.error(`Failed to restore press deadband for key ${keyValue}:`, pressResult.message);
      }
      const releaseResult = await KeyboardService.setDr(keyValue, deadband.release);
      if (releaseResult instanceof Error) {
        console.error(`Failed to restore release deadband for key ${keyValue}:`, releaseResult.message);
      }
    }, 80, 100);
  }

  /**
   * Post-import repair (2): the bundle's setLighting destructures only
   * main+logo, so the special ("other") zone is never applied by the SDK
   * import — write it here. LightModeConfigs carries no `open` flag; the
   * stored mode/luminance already reflect the saved on/off state.
   */
  private async repairSpecialLighting(config: KeyboardConfig): Promise<void> {
    if (!config.light?.other) return;
    const result = await KeyboardService.setSpecialLighting(
      this.convertLightConfigToSDKFormat(config.light.other)
    );
    if (result instanceof Error) {
      console.error('Failed to restore special lighting:', result.message);
    }
  }

  /**
   * Post-import repair (4, F3): SDK setAdvancedKeys calls setSocd with ONE arg,
   * so the wire-version default '1.0.5' drops socd.delay (SOCDPack emits no
   * delay bytes below '1.0.7'). Re-write the stored 7-field socd config
   * ({pos1,pos2,key1,key2,type,mode,delay} — no key field; pos1/pos2 identify)
   * through the version-plumbed wrapper at wire v'1.0.7'.
   *
   * F1: only keys whose OWN active type is 'socd' are collected. Export stores a
   * socd/end block for EVERY key (no advancedType filter), so a numeric-delay
   * gate alone is always-true and would write registers the SDK import
   * deliberately skips for 'none' keys — changing their active type on device.
   */
  private async repairSocdDelay(config: KeyboardConfig): Promise<void> {
    const socdByKey = new Map<number, Keyboards['advancedKeys']['socd']>();
    for (const entry of config.keyboards ?? []) {
      const socd = entry.advancedKeys?.socd;
      if (
        entry.advancedKeys?.advancedType === 'socd' &&
        socd &&
        typeof socd.delay === 'number'
      ) {
        socdByKey.set(entry.keyValue, socd);
      }
    }
    await this.processBatches([...socdByKey.keys()], async (keyValue) => {
      const socd = socdByKey.get(keyValue);
      if (socd === undefined) return;
      const result = await KeyboardService.setSocd(socd, '1.0.7');
      if (result instanceof Error) {
        console.error(`Failed to restore SOCD for key ${keyValue}:`, result.message);
      }
    }, 80, 100);
  }

  /**
   * Post-import repair (5, F3): SDK setAdvancedKeys calls setEND with ONE arg,
   * so the wire-version default '1.0.5' drops end.delay (ENDDataPack emits no
   * delay bytes below '1.0.7'). Stored end is {dks, delay}; the key comes from
   * the entry (same id SDK import passes). Delay is re-written AS-IS, no
   * scaling (round-trip fidelity is unit-agnostic).
   *
   * F1: only keys whose OWN active type is 'end' are collected — see
   * repairSocdDelay for the always-true numeric-gate mechanism. A genuine END
   * key still holding the 65535 firmware-default delay merely re-writes the
   * value it already holds (PM ruling 2026-10-20: gate only, NO sentinel filter
   * — filtering would wrongly drop a real END key that uses max delay).
   */
  private async repairEndDelay(config: KeyboardConfig): Promise<void> {
    const endByKey = new Map<number, { key: number; dks: number; delay: number }>();
    for (const entry of config.keyboards ?? []) {
      const end = entry.advancedKeys?.end;
      if (
        entry.advancedKeys?.advancedType === 'end' &&
        end &&
        typeof end.delay === 'number'
      ) {
        endByKey.set(entry.keyValue, { key: entry.keyValue, dks: end.dks, delay: end.delay });
      }
    }
    await this.processBatches([...endByKey.keys()], async (keyValue) => {
      const end = endByKey.get(keyValue);
      if (end === undefined) return;
      const result = await KeyboardService.setEND(end, '1.0.7');
      if (result instanceof Error) {
        console.error(`Failed to restore END for key ${keyValue}:`, result.message);
      }
    }, 80, 100);
  }

  /**
   * F2-R2: confirm the device is actually in custom mode (21) before any
   * per-key RGB write. The SDK import's per-key processing is still settling
   * when the repairs start and silently drops writes aimed at it; the
   * pre-import custom switch is not proof either (repairSpecialLighting's
   * cmdSRGB shares the main zone constant, so the mode here is whatever that
   * left behind). A setLighting aimed at a busy device can itself be silently
   * dropped — only the getLighting READBACK proves the mode took. Probe, and
   * on any non-custom readback re-command custom/21 and re-probe with growing
   * backoff (waits out the busy window). Best-effort: on exhaustion, log and
   * let the caller proceed — the per-key read-back verify still catches and
   * retries the writes.
   */
  private async ensureCustomModeReady(maxAttempts = 5, settleMs = 400): Promise<boolean> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const state = await KeyboardService.getLighting();
      if (!(state instanceof Error) && state.mode === 21) return true;
      if (attempt === maxAttempts) break;
      // Mode not confirmed: (re-)command custom/21 (pre-import-switch pattern)
      // — the switch itself may be silently dropped while the device settles,
      // so the next loop's readback is the only arbiter.
      if (!(state instanceof Error)) {
        const { open, dynamicColorId, ...filteredParams } = state;
        filteredParams.mode = 21;
        filteredParams.type = 'custom';
        const switchResult = await KeyboardService.setLighting(filteredParams);
        if (switchResult instanceof Error) {
          console.error('Failed to switch to custom mode for RGB repair:', switchResult.message);
        }
      }
      await new Promise(resolve => setTimeout(resolve, settleMs * attempt));
    }
    console.error('Custom mode not confirmed after import settle window; RGB writes proceed best-effort');
    return false;
  }

  /**
   * F2-R2: write one key's RGB, then PROVE it landed via readback. Hardware
   * re-check confirmed silent drops: all 88 setCustomLighting calls resolved
   * non-Error while the first rows' writes were lost (variable boundary, loss
   * always at the sequence start). retry-on-Error cannot detect that, so:
   * setCustomLighting → getCustomLighting(key) → compare (readback shape is
   * uppercase {R,G,B}, per gatherLightingData). Mismatch or readback Error ⇒
   * rewrite with growing delay; attempts exhausted ⇒ grep-able console.error.
   * Never throws (best-effort repair contract).
   */
  private async writeVerifiedCustomRgb(
    key: number,
    rgb: { r: number; g: number; b: number },
    maxAttempts = 3,
    delayMs = 200
  ): Promise<void> {
    let actual = 'unverified';
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const result = await KeyboardService.setCustomLighting({ key, r: rgb.r, g: rgb.g, b: rgb.b });
      if (result instanceof Error) {
        console.error(`Failed to restore custom RGB for key ${key}:`, result.message);
      }
      const readback = await KeyboardService.getCustomLighting(key);
      if (!(readback instanceof Error)
        && readback.R === rgb.r && readback.G === rgb.g && readback.B === rgb.b) {
        return;
      }
      actual = readback instanceof Error
        ? `readback error: ${readback.message}`
        : `read back ${readback.R}:${readback.G}:${readback.B}`;
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
    console.error(
      `Custom RGB verify failed for key ${key}: expected ${rgb.r}:${rgb.g}:${rgb.b}, ${actual}`
    );
  }

  /**
   * F-D7-3: SDK import zeroes the per-key custom RGB buffer (setKeyboards
   * writes it, then setLighting(main) clears it). Re-write each key's stored
   * color via setCustomLighting before importProfile's saveCustomLighting commit.
   * Export stores UPPERCASE {R,G,B,key}; the wrapper takes lowercase {key,r,g,b}.
   * ALL entries are written, including 0:0:0, so intentionally-black keys are
   * restored too. Best-effort: errors are logged per key, never thrown.
   * F2-R2: writes are closed-loop — a mode-settle guard runs first, and every
   * key is read-back verified and rewritten on mismatch (the device drops
   * writes silently at the start of the sequence while post-import processing
   * settles).
   */
  private async repairCustomRgb(config: KeyboardConfig): Promise<void> {
    const rgbMap = new Map<number, { r: number; g: number; b: number }>();
    for (const entry of config.keyboards ?? []) {
      const custom = entry.light?.custom;
      if (!custom || typeof custom.R !== 'number') continue;
      const key = custom.key ?? entry.keyValue;
      rgbMap.set(key, { r: custom.R, g: custom.G, b: custom.B });
    }
    if (rgbMap.size === 0) return;
    await this.ensureCustomModeReady();
    await this.processBatches([...rgbMap.keys()], async (key) => {
      await this.writeVerifiedCustomRgb(key, rgbMap.get(key)!);
      // F2-2: batchSize 1, delay 0 = strictly sequential single-flight writes.
      // The hardware check lost exactly the first 32 of batch 1's 80 concurrent
      // Promise.all writes (device drops under burst); one report in flight at a
      // time, each awaited to the device round-trip, removes the contention.
    }, 1, 0);
  }

  /**
   * Post-import repair (F2-1): restore the exported MAIN lighting mode.
   *
   * The SDK import's own main-lighting write does not survive: hardware checks
   * read back static/0 after importing files exported in custom/21 and
   * dynamic/1. Two verified contributing causes — repairSpecialLighting sends
   * the logo/other zone through cmdSRGB, which defaults to the SAME KB2_CMD_PRGB
   * zone constant as the main-lighting command (bundle-verified: no SRGB command
   * exists), clobbering main to the converted `other` config; and the SDK's
   * setMainLighting failure would be silent (device methods return Error, the
   * controller doesn't check). Re-applying config.light.main LAST — after
   * repairSpecialLighting and after the per-key RGB restore (which needs custom
   * mode active) — wins the last write regardless of which cause applies.
   */
  private async repairMainLighting(config: KeyboardConfig): Promise<void> {
    if (!config.light?.main) return;
    const result = await KeyboardService.setLighting(
      this.convertLightConfigToSDKFormat(config.light.main)
    );
    if (result instanceof Error) {
      console.error('Failed to restore main lighting mode:', result.message);
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

      try {
        const result = await KeyboardService.importConfig(file);

        if (result instanceof Error) {
          return { success: false, error: result.message };
        }

        if (result.success === false) {
          return { success: false, error: result.error || 'Import failed' };
        }
      } finally {
        // setMacro ran synchronously inside importConfig — no race; safe to restore now.
        // F-R1: restore in a finally so the local macro library survives EVERY exit
        // path — the two failure returns above included — not just the success path.
        if (macroSnapshot !== null) {
          localStorage.setItem('MacroList', macroSnapshot);
        } else {
          localStorage.removeItem('MacroList');
        }
      }

      // Read the encrypted SDK export and decrypt it to the real KeyboardConfig.
      // Best-effort: if it fails (not an SDK export / bad cipher), repairs are
      // skipped — the SDK import above already stands on its own.
      const config = this.decryptSDKConfig(await file.text());
      if (config) {
        // Post-import repairs: things the SDK import silently drops.
        await this.repairDksDb3(config);
        await this.repairGlobalDeadband(config);
        await this.repairSpecialLighting(config);
        await this.repairSocdDelay(config);
        await this.repairEndDelay(config);
        await this.repairCustomRgb(config);
        // Wait for SDK import to complete, then save custom RGB to flash
        await new Promise(resolve => setTimeout(resolve, 1000));

        const saveResult = await KeyboardService.saveCustomLighting();
        if (saveResult instanceof Error) {
          console.error('Failed to save custom lighting:', saveResult.message);
        }
        // F2-1: restore the exported main lighting mode LAST — see repairMainLighting.
        await this.repairMainLighting(config);
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

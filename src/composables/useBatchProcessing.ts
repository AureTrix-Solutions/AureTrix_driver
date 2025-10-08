import { type Ref } from 'vue';

export const useBatchProcessing = () => {
  // Processes keys in batches for SDK calls (avoids overload)
  const processBatches = async <T>(
    keys: { physicalKeyValue: number; keyValue: number }[] | number[],
    updateFn: (physicalKey: number) => Promise<T>,
    batchSize: number = 80
  ) => {
    // Fixed condition: Check if first item is object with physicalKeyValue (not Array.isArray)
    const isObjectArray = keys.length > 0 && typeof keys[0] === 'object' && 'physicalKeyValue' in keys[0];
    const keyIds = isObjectArray
      ? (keys as { physicalKeyValue: number; keyValue: number }[]).map(k => k.physicalKeyValue)
      : (keys as number[]);
    const batches = [];
    for (let i = 0; i < keyIds.length; i += batchSize) {
      batches.push(keyIds.slice(i, i + batchSize));
    }
    for (const batch of batches) {
      await Promise.all(batch.map(updateFn));
      await new Promise(resolve => setTimeout(resolve, 100)); // Throttle
      console.log(`[BATCH] Processed batch of ${batch.length} keys`);
    }
  };

  return { processBatches };
};
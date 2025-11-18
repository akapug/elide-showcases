/**
 * Batch Feature Generator - Offline feature computation
 *
 * Generates features for large datasets and exports to storage
 */

import { FeatureStore } from './feature-store';
import { FeatureCache } from './feature-cache';
import * as fs from 'fs';
import * as path from 'path';

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '1000', 10);
const OUTPUT_DIR = path.join(__dirname, '../features/snapshots');

interface BatchConfig {
  entityIds: string[];
  features?: string[];
  outputFormat: 'json' | 'csv' | 'parquet';
  outputPath?: string;
}

async function generateBatch(config: BatchConfig): Promise<void> {
  console.log('🚀 Starting batch feature generation...');
  console.log(`   Entities: ${config.entityIds.length}`);
  console.log(`   Batch size: ${BATCH_SIZE}`);
  console.log(`   Output format: ${config.outputFormat}`);

  // Initialize feature store
  const cache = new FeatureCache({ maxSize: 10000, ttl: 300000 });
  const featureStore = new FeatureStore(cache);

  const startTime = Date.now();
  const results: Array<{ entity_id: string; features: any }> = [];

  // Process in batches
  for (let i = 0; i < config.entityIds.length; i += BATCH_SIZE) {
    const batch = config.entityIds.slice(i, i + BATCH_SIZE);
    console.log(`   Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(config.entityIds.length / BATCH_SIZE)}...`);

    const batchResults = await featureStore.getBatchFeatures(batch, config.features);
    results.push(...batchResults);

    // Progress update
    const progress = ((i + batch.length) / config.entityIds.length * 100).toFixed(1);
    console.log(`   Progress: ${progress}%`);
  }

  const totalTime = (Date.now() - startTime) / 1000;
  const avgLatency = (totalTime * 1000) / results.length;

  console.log('');
  console.log('✅ Batch generation complete!');
  console.log(`   Total time: ${totalTime.toFixed(2)}s`);
  console.log(`   Features generated: ${results.length}`);
  console.log(`   Avg latency: ${avgLatency.toFixed(3)}ms per entity`);
  console.log(`   Throughput: ${(results.length / totalTime).toFixed(0)} entities/sec`);

  // Export results
  const outputPath = config.outputPath || path.join(
    OUTPUT_DIR,
    `features_${Date.now()}.${config.outputFormat}`
  );

  await exportResults(results, outputPath, config.outputFormat);
  console.log(`   Output: ${outputPath}`);
  console.log('');
}

async function exportResults(
  results: Array<{ entity_id: string; features: any }>,
  outputPath: string,
  format: string
): Promise<void> {
  // Ensure output directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (format === 'json') {
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  } else if (format === 'csv') {
    // Convert to CSV
    const headers = ['entity_id', ...Object.keys(results[0]?.features || {})];
    const rows = results.map(r => {
      const values = [r.entity_id];
      for (const key of headers.slice(1)) {
        values.push((r.features as any)[key] ?? '');
      }
      return values.join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    fs.writeFileSync(outputPath, csv);
  } else {
    console.warn(`Format '${format}' not yet implemented, defaulting to JSON`);
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  }
}

// Example usage
if (require.main === module) {
  // Generate sample entity IDs
  const entityIds = Array.from({ length: 5000 }, (_, i) => `entity_${i + 1}`);

  const config: BatchConfig = {
    entityIds,
    outputFormat: 'json',
  };

  generateBatch(config)
    .then(() => {
      console.log('Batch generation completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Batch generation failed:', error);
      process.exit(1);
    });
}

export { generateBatch, BatchConfig };

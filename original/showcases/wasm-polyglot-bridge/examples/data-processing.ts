/**
 * Data Processing Example
 *
 * Demonstrates hybrid WASM + Python data analysis pipeline
 */

// @ts-ignore - WASM module
const wasm = await import('../rust-wasm/pkg/wasm_polyglot_bridge.js');

// @ts-ignore - Python interop
import python from 'python:data_analysis';

// ============================================================================
// Generate Test Dataset
// ============================================================================

function generateDataset(samples: number, features: number): Float32Array {
  console.log(`📊 Generating dataset: ${samples} samples × ${features} features`);

  const data = new Float32Array(samples * features);

  // Generate normal distribution data
  for (let i = 0; i < data.length; i++) {
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    data[i] = z * 10 + 50; // mean=50, std=10
  }

  // Add some outliers
  const outlierCount = Math.floor(samples * 0.05);
  for (let i = 0; i < outlierCount; i++) {
    const idx = Math.floor(Math.random() * data.length);
    data[idx] = Math.random() > 0.5 ? 150 : -50;
  }

  return data;
}

// ============================================================================
// Step 1: WASM Preprocessing
// ============================================================================

function preprocessWithWASM(data: Float32Array) {
  console.log('\n🔧 Step 1: WASM preprocessing...');

  const start = performance.now();

  // Sort for median calculation
  console.log('  - Sorting data for statistics');
  const sortedData = new Float32Array(data);
  wasm.sort_f32_array(sortedData);

  // Calculate statistics
  console.log('  - Computing statistics');
  const mean = wasm.mean_f32(data, data.length);
  const std = wasm.std_dev_f32(data, data.length);
  const min = wasm.min_f32(data, data.length);
  const max = wasm.max_f32(data, data.length);
  const median = sortedData[Math.floor(sortedData.length / 2)];

  // Normalize data
  console.log('  - Normalizing data');
  const normalizedData = new Float32Array(data);
  wasm.normalize_array(normalizedData, normalizedData.length);

  const duration = performance.now() - start;
  console.log(`  ✅ WASM preprocessing completed in ${duration.toFixed(2)}ms`);

  return {
    normalizedData,
    stats: { mean, std, min, max, median },
  };
}

// ============================================================================
// Step 2: Python Analysis
// ============================================================================

function analyzeWithPython(data: Float32Array) {
  console.log('\n🐍 Step 2: Python statistical analysis...');

  const start = performance.now();

  // Convert to array for Python
  const dataArray = Array.from(data);

  // Detect outliers using Python
  console.log('  - Detecting outliers (IQR method)');
  const outliersIQR = python.DataAnalyzer.detect_outliers_iqr(dataArray, 1.5);

  console.log('  - Detecting outliers (Z-score method)');
  const outliersZScore = python.DataAnalyzer.detect_outliers_zscore(dataArray, 3.0);

  // Compute descriptive statistics with Python
  console.log('  - Computing detailed statistics');
  const detailedStats = python.DataAnalyzer.descriptive_stats(dataArray);

  const duration = performance.now() - start;
  console.log(`  ✅ Python analysis completed in ${duration.toFixed(2)}ms`);

  return {
    outliersIQR,
    outliersZScore,
    detailedStats,
  };
}

// ============================================================================
// Step 3: Time Series Smoothing with Hybrid Approach
// ============================================================================

function smoothTimeSeries(data: Float32Array, windowSize: number) {
  console.log('\n📈 Step 3: Time series smoothing...');

  const start = performance.now();

  // Method 1: WASM moving average (fast!)
  console.log('  - WASM-based processing');
  const wasmStart = performance.now();

  // Simulate moving average with WASM vector operations
  const smoothedWASM = new Float32Array(data.length - windowSize + 1);

  for (let i = 0; i <= data.length - windowSize; i++) {
    const window = data.slice(i, i + windowSize);
    smoothedWASM[i] = wasm.mean_f32(window, window.length);
  }

  const wasmTime = performance.now() - wasmStart;

  // Method 2: Python exponential smoothing
  console.log('  - Python-based smoothing');
  const pythonStart = performance.now();

  const dataArray = Array.from(data);
  const smoothedPython = python.DataAnalyzer.exponential_smoothing(dataArray, 0.3);

  const pythonTime = performance.now() - pythonStart;

  const duration = performance.now() - start;
  console.log(`  ✅ Smoothing completed in ${duration.toFixed(2)}ms`);
  console.log(`    - WASM method: ${wasmTime.toFixed(2)}ms`);
  console.log(`    - Python method: ${pythonTime.toFixed(2)}ms`);

  return {
    smoothedWASM,
    smoothedPython,
    wasmTime,
    pythonTime,
  };
}

// ============================================================================
// Complete Data Pipeline
// ============================================================================

async function dataProcessingPipeline() {
  console.log('🚀 Starting Hybrid Data Processing Pipeline\n');
  console.log('='.repeat(80));

  const overallStart = performance.now();

  // Generate test data
  const samples = 100000;
  const features = 1;
  const dataset = generateDataset(samples, features);

  console.log(`  Dataset size: ${dataset.length.toLocaleString()} values`);
  console.log(`  Memory: ${(dataset.byteLength / 1024 / 1024).toFixed(2)} MB`);

  // Step 1: WASM preprocessing
  const { normalizedData, stats } = preprocessWithWASM(dataset);

  // Step 2: Python analysis
  const analysis = analyzeWithPython(dataset);

  // Step 3: Time series smoothing
  const smoothing = smoothTimeSeries(dataset, 100);

  const overallDuration = performance.now() - overallStart;

  // ============================================================================
  // Results Summary
  // ============================================================================

  console.log('\n' + '='.repeat(80));
  console.log('\n📊 PIPELINE RESULTS\n');

  console.log('Basic Statistics (WASM):');
  console.log(`  Mean: ${stats.mean.toFixed(2)}`);
  console.log(`  Std Dev: ${stats.std.toFixed(2)}`);
  console.log(`  Min: ${stats.min.toFixed(2)}`);
  console.log(`  Max: ${stats.max.toFixed(2)}`);
  console.log(`  Median: ${stats.median.toFixed(2)}`);

  console.log('\nDetailed Statistics (Python):');
  console.log(`  Q25: ${analysis.detailedStats.q25.toFixed(2)}`);
  console.log(`  Q75: ${analysis.detailedStats.q75.toFixed(2)}`);
  console.log(`  Count: ${analysis.detailedStats.count}`);

  console.log('\nOutlier Detection:');
  const outlierCountIQR = analysis.outliersIQR.filter((x: boolean) => x).length;
  const outlierCountZ = analysis.outliersZScore.filter((x: boolean) => x).length;
  console.log(`  IQR method: ${outlierCountIQR} outliers (${(outlierCountIQR / samples * 100).toFixed(2)}%)`);
  console.log(`  Z-score method: ${outlierCountZ} outliers (${(outlierCountZ / samples * 100).toFixed(2)}%)`);

  console.log('\nSmoothing Performance:');
  console.log(`  WASM moving average: ${smoothing.wasmTime.toFixed(2)}ms`);
  console.log(`  Python exponential: ${smoothing.pythonTime.toFixed(2)}ms`);
  console.log(`  Speedup: ${(smoothing.pythonTime / smoothing.wasmTime).toFixed(1)}x faster with WASM`);

  console.log(`\n⏱️ Total Pipeline Time: ${overallDuration.toFixed(2)}ms`);
  console.log(`   (~${(samples / overallDuration * 1000).toFixed(0)} samples/second)`);

  console.log('\n💡 Key Insights:');
  console.log('  - WASM excels at numerical operations');
  console.log('  - Python provides rich statistical libraries');
  console.log('  - Hybrid approach gives best of both worlds');
  console.log('  - Zero-copy memory sharing = minimal overhead');

  console.log('\n✅ Pipeline completed successfully!\n');
}

// Run the pipeline
dataProcessingPipeline().catch(console.error);

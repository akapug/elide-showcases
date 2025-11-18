import { spawn } from 'child_process';

/**
 * Batch Processing Benchmark
 *
 * Demonstrates the efficiency of batch processing multiple texts
 * vs processing them individually
 */

const BATCH_TEXTS = [
  "Apple Inc. reported strong quarterly earnings, beating analyst expectations.",
  "Scientists discovered a new exoplanet in the habitable zone of a nearby star.",
  "The Federal Reserve raised interest rates by 0.25% to combat inflation.",
  "Tesla announced plans to build a new gigafactory in Texas.",
  "Researchers developed a new AI model that can detect cancer from medical images.",
  "Amazon launched a new cloud service for machine learning workloads.",
  "Climate change is causing unprecedented weather patterns across the globe.",
  "SpaceX successfully launched 60 satellites into orbit for Starlink.",
  "Google unveiled its latest quantum computing breakthrough at a tech conference.",
  "The pharmaceutical company received FDA approval for its new drug.",
  "Bitcoin prices surged following institutional adoption announcements.",
  "Netflix reported subscriber growth in international markets.",
  "Microsoft acquired a leading cybersecurity firm for $2.5 billion.",
  "The World Health Organization issued new guidelines for vaccine distribution.",
  "Facebook rebranded to Meta, focusing on virtual reality and the metaverse.",
  "Electric vehicle sales reached record highs in Europe last quarter.",
];

/**
 * Execute Python processor
 */
function executePython(script: string, input: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const proc = spawn('python3', [script]);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}: ${stderr}`));
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (err) {
        reject(new Error(`Failed to parse output: ${err}`));
      }
    });

    proc.stdin.write(JSON.stringify(input));
    proc.stdin.end();
  });
}

/**
 * Benchmark individual processing
 */
async function benchmarkIndividual(texts: string[]): Promise<number> {
  console.log('Benchmarking individual processing...');

  const startTime = Date.now();

  for (let i = 0; i < texts.length; i++) {
    await executePython('nlp/multi_task_processor.py', {
      text: texts[i],
      tasks: ['ner', 'sentiment', 'summarize'],
    });

    process.stdout.write(`\rProgress: ${i + 1}/${texts.length}`);
  }

  console.log('\n');

  return Date.now() - startTime;
}

/**
 * Benchmark batch processing
 */
async function benchmarkBatch(texts: string[]): Promise<number> {
  console.log('Benchmarking batch processing...');

  const startTime = Date.now();

  await executePython('nlp/batch_processor.py', {
    texts,
    tasks: ['ner', 'sentiment', 'summarize'],
  });

  console.log('');

  return Date.now() - startTime;
}

/**
 * Print results
 */
function printResults(individualTime: number, batchTime: number, batchSize: number) {
  const speedup = individualTime / batchTime;
  const avgIndividualTime = individualTime / batchSize;
  const avgBatchTime = batchTime / batchSize;

  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                 Batch Processing Benchmark Results                        ║
╠═══════════════════════════════════════════════════════════════════════════╣
║ Individual Processing (Sequential)                                        ║
╟───────────────────────────────────────────────────────────────────────────╢
║   Batch Size:          ${batchSize.toString().padEnd(10)}                                          ║
║   Total Time:          ${individualTime.toFixed(2).padEnd(10)}ms                                  ║
║   Avg Time/Text:       ${avgIndividualTime.toFixed(2).padEnd(10)}ms                                  ║
║   Throughput:          ${(batchSize / (individualTime / 1000)).toFixed(2).padEnd(10)} texts/sec                         ║
╠═══════════════════════════════════════════════════════════════════════════╣
║ Batch Processing (Optimized)                                              ║
╟───────────────────────────────────────────────────────────────────────────╢
║   Batch Size:          ${batchSize.toString().padEnd(10)}                                          ║
║   Total Time:          ${batchTime.toFixed(2).padEnd(10)}ms                                  ║
║   Avg Time/Text:       ${avgBatchTime.toFixed(2).padEnd(10)}ms                                  ║
║   Throughput:          ${(batchSize / (batchTime / 1000)).toFixed(2).padEnd(10)} texts/sec                         ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                         Performance Comparison                            ║
╟───────────────────────────────────────────────────────────────────────────╢
║   Speed Improvement:   ${speedup.toFixed(2)}x faster                                          ║
║   Time Saved:          ${(individualTime - batchTime).toFixed(2)}ms (${((individualTime - batchTime) / individualTime * 100).toFixed(1)}%)                         ║
║   Efficiency Gain:     ${((speedup - 1) * 100).toFixed(1)}%                                              ║
╚═══════════════════════════════════════════════════════════════════════════╝

Key Optimizations in Batch Processing:

1. Model Loading
   - Individual: Load models ${batchSize} times
   - Batch: Load models once

2. GPU Utilization
   - Individual: Sequential processing (GPU idle between batches)
   - Batch: Parallel tensor operations (full GPU utilization)

3. Memory Management
   - Individual: Allocate/deallocate ${batchSize} times
   - Batch: Single allocation for entire batch

4. Process Overhead
   - Individual: Spawn ${batchSize} Python processes
   - Batch: Spawn 1 Python process

Use Cases for Batch Processing:
✓ Document classification pipelines
✓ Social media sentiment analysis
✓ News article processing
✓ Research paper analysis
✓ Content moderation queues

Scaling Recommendations:
- Batch size: 8-32 texts (optimal GPU utilization)
- Memory: ~2GB per batch (depends on text length)
- Throughput: ${(batchSize / (batchTime / 1000)).toFixed(0)} texts/sec on CPU, 3-5x on GPU
  `);
}

/**
 * Main benchmark
 */
async function main() {
  console.log('Starting Batch Processing Benchmark\n');
  console.log('Batch size:', BATCH_TEXTS.length);
  console.log('Tasks: NER, Sentiment Analysis, Summarization\n');

  try {
    const individualTime = await benchmarkIndividual(BATCH_TEXTS);
    const batchTime = await benchmarkBatch(BATCH_TEXTS);

    printResults(individualTime, batchTime, BATCH_TEXTS.length);
  } catch (err) {
    console.error('Benchmark failed:', err);
    process.exit(1);
  }
}

main();

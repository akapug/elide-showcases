import { spawn } from 'child_process';

/**
 * Multi-Task vs Separate Processing Benchmark
 *
 * Compares performance of:
 * 1. Multi-task with shared tokenization (optimized)
 * 2. Separate task processing (baseline)
 */

interface BenchmarkResult {
  approach: string;
  totalTime: number;
  avgTime: number;
  iterations: number;
  tokensReused: boolean;
  speedup?: number;
}

const SAMPLE_TEXTS = [
  "Apple Inc. announced record quarterly earnings today, with CEO Tim Cook highlighting strong iPhone sales in China. The company's stock rose 5% following the announcement.",
  "Scientists at MIT have developed a revolutionary new battery technology that could triple the range of electric vehicles. The breakthrough involves a novel lithium-metal design.",
  "The Federal Reserve indicated that interest rates would likely remain unchanged through the end of the year, citing ongoing economic uncertainty and inflation concerns.",
  "Amazon Web Services launched several new machine learning tools at their annual re:Invent conference in Las Vegas, including enhanced natural language processing capabilities.",
  "Climate researchers warn that global temperatures are rising faster than previously predicted, with significant implications for coastal cities around the world.",
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
 * Benchmark multi-task processing (optimized)
 */
async function benchmarkMultiTask(iterations: number): Promise<BenchmarkResult> {
  console.log('Running multi-task benchmark (shared tokenization)...');

  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const text = SAMPLE_TEXTS[i % SAMPLE_TEXTS.length];

    const startTime = Date.now();

    await executePython('nlp/multi_task_processor.py', {
      text,
      tasks: ['ner', 'sentiment', 'summarize'],
    });

    const endTime = Date.now();
    times.push(endTime - startTime);

    process.stdout.write(`\rProgress: ${i + 1}/${iterations}`);
  }

  console.log('\n');

  const totalTime = times.reduce((a, b) => a + b, 0);
  const avgTime = totalTime / iterations;

  return {
    approach: 'Multi-Task (Shared Tokenization)',
    totalTime,
    avgTime,
    iterations,
    tokensReused: true,
  };
}

/**
 * Benchmark separate processing (baseline)
 */
async function benchmarkSeparate(iterations: number): Promise<BenchmarkResult> {
  console.log('Running separate task benchmark (no sharing)...');

  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const text = SAMPLE_TEXTS[i % SAMPLE_TEXTS.length];

    const startTime = Date.now();

    // Run each task separately
    await Promise.all([
      executePython('nlp/ner_processor.py', { text }),
      executePython('nlp/sentiment_processor.py', { text }),
      executePython('nlp/summarization_processor.py', { text }),
    ]);

    const endTime = Date.now();
    times.push(endTime - startTime);

    process.stdout.write(`\rProgress: ${i + 1}/${iterations}`);
  }

  console.log('\n');

  const totalTime = times.reduce((a, b) => a + b, 0);
  const avgTime = totalTime / iterations;

  return {
    approach: 'Separate Tasks (No Sharing)',
    totalTime,
    avgTime,
    iterations,
    tokensReused: false,
  };
}

/**
 * Print results
 */
function printResults(multiTask: BenchmarkResult, separate: BenchmarkResult) {
  const speedup = separate.avgTime / multiTask.avgTime;

  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║              Multi-Task NLP Benchmark Results                             ║
╠═══════════════════════════════════════════════════════════════════════════╣
║ Multi-Task Processing (Shared Tokenization)                               ║
╟───────────────────────────────────────────────────────────────────────────╢
║   Iterations:      ${multiTask.iterations.toString().padEnd(10)}                                           ║
║   Total Time:      ${multiTask.totalTime.toFixed(2).padEnd(10)}ms                                     ║
║   Avg Time:        ${multiTask.avgTime.toFixed(2).padEnd(10)}ms                                     ║
║   Throughput:      ${(1000 / multiTask.avgTime).toFixed(2).padEnd(10)} ops/sec                          ║
╠═══════════════════════════════════════════════════════════════════════════╣
║ Separate Task Processing (No Sharing)                                    ║
╟───────────────────────────────────────────────────────────────────────────╢
║   Iterations:      ${separate.iterations.toString().padEnd(10)}                                           ║
║   Total Time:      ${separate.totalTime.toFixed(2).padEnd(10)}ms                                     ║
║   Avg Time:        ${separate.avgTime.toFixed(2).padEnd(10)}ms                                     ║
║   Throughput:      ${(1000 / separate.avgTime).toFixed(2).padEnd(10)} ops/sec                          ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                         Performance Comparison                            ║
╟───────────────────────────────────────────────────────────────────────────╢
║   Speed Improvement:    ${speedup.toFixed(2)}x faster                                         ║
║   Time Saved:           ${((separate.avgTime - multiTask.avgTime) / separate.avgTime * 100).toFixed(2)}%                                               ║
║   Target Met:           ${speedup >= 5 ? '✓ Yes (>5x speedup)' : '✗ No (<5x speedup)'}                              ║
╚═══════════════════════════════════════════════════════════════════════════╝

Key Insights:
- Shared tokenization eliminates redundant preprocessing
- Single process reduces overhead of spawning multiple Python processes
- Model loading happens once instead of 3x
- Perfect for multi-task analysis pipelines

Use Cases:
- Document classification + entity extraction
- Sentiment analysis + summarization
- Real-time content moderation
- Research paper analysis
  `);
}

/**
 * Main benchmark
 */
async function main() {
  console.log('Starting Multi-Task NLP Benchmark\n');
  console.log('Sample texts:', SAMPLE_TEXTS.length);
  console.log('Tasks: NER, Sentiment Analysis, Summarization\n');

  const iterations = 20;

  try {
    // Run benchmarks
    const multiTaskResult = await benchmarkMultiTask(iterations);
    const separateResult = await benchmarkSeparate(iterations);

    // Print results
    printResults(multiTaskResult, separateResult);
  } catch (err) {
    console.error('Benchmark failed:', err);
    process.exit(1);
  }
}

main();

/**
 * Whisper Performance Benchmark
 * Tests transcription speed across different audio lengths and quality levels
 */

import { TranscriptionBridge } from '../transcription/bridge.js';
import { spawn } from 'child_process';

interface BenchmarkResult {
  duration: number;
  processingTime: number;
  realTimeFactor: number;
  throughput: number;
  memoryUsed: number;
}

async function generateAudio(durationSec: number, sampleRate: number = 16000): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const proc = spawn('python3', [
      '-c',
      `
import sys
import numpy as np
import soundfile as sf
import io

# Generate test audio (sine wave)
sample_rate = ${sampleRate}
duration = ${durationSec}
frequency = 440  # A4 note
samples = int(sample_rate * duration)
t = np.linspace(0, duration, samples, False)
audio = np.sin(2 * np.pi * frequency * t) * 0.3
audio = audio.astype(np.float32)

# Write to stdout
output = io.BytesIO()
sf.write(output, audio, sample_rate, format='WAV', subtype='PCM_16')
sys.stdout.buffer.write(output.getvalue())
    `,
    ]);

    const chunks: Buffer[] = [];

    proc.stdout.on('data', (data) => {
      chunks.push(data);
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error('Failed to generate audio'));
      } else {
        resolve(Buffer.concat(chunks));
      }
    });
  });
}

async function benchmarkTranscription(
  duration: number,
  description: string
): Promise<BenchmarkResult> {
  const bridge = new TranscriptionBridge();
  const audioBuffer = await generateAudio(duration);

  const memBefore = process.memoryUsage().heapUsed;
  const startTime = Date.now();

  const result = await bridge.transcribe(audioBuffer, {
    enableTimestamps: true,
    enableWordTimestamps: false,
    enableDiarization: false,
  });

  const processingTime = Date.now() - startTime;
  const memAfter = process.memoryUsage().heapUsed;

  return {
    duration,
    processingTime,
    realTimeFactor: result.performance?.realTimeFactor || 0,
    throughput: result.performance?.throughput || 0,
    memoryUsed: memAfter - memBefore,
  };
}

async function runBenchmarks() {
  console.log('\n');
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(18) + 'Whisper Performance Benchmark' + ' '.repeat(31) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');

  const benchmarks = [
    { duration: 5, description: '5 seconds (Short clip)' },
    { duration: 15, description: '15 seconds (Voice message)' },
    { duration: 30, description: '30 seconds (Short recording)' },
    { duration: 60, description: '1 minute (Standard)' },
    { duration: 120, description: '2 minutes (Medium)' },
    { duration: 300, description: '5 minutes (Long recording)' },
  ];

  const results: BenchmarkResult[] = [];

  console.log('\n' + '='.repeat(80));
  console.log('Running benchmarks...');
  console.log('='.repeat(80));

  for (const { duration, description } of benchmarks) {
    process.stdout.write(`\nBenchmarking ${description}... `);

    try {
      const result = await benchmarkTranscription(duration, description);
      results.push(result);

      console.log('✓');
      console.log(`  Processing Time: ${result.processingTime}ms`);
      console.log(`  Real-Time Factor: ${result.realTimeFactor.toFixed(3)}x`);
      console.log(`  Throughput: ${result.throughput.toFixed(2)}x real-time`);
      console.log(`  Memory Used: ${(result.memoryUsed / 1024 / 1024).toFixed(2)}MB`);
    } catch (error) {
      console.log('✗');
      console.error(`  Error: ${error instanceof Error ? error.message : error}`);
    }
  }

  // Print summary table
  console.log('\n' + '='.repeat(80));
  console.log('Benchmark Results Summary');
  console.log('='.repeat(80));
  console.log();

  console.log(
    '┌──────────────┬─────────────────┬──────────────┬──────────────┬──────────────┐'
  );
  console.log(
    '│   Duration   │ Processing Time │     RTF      │  Throughput  │    Memory    │'
  );
  console.log(
    '├──────────────┼─────────────────┼──────────────┼──────────────┼──────────────┤'
  );

  for (const result of results) {
    const duration = `${result.duration}s`.padEnd(12);
    const procTime = `${result.processingTime}ms`.padEnd(15);
    const rtf = `${result.realTimeFactor.toFixed(3)}x`.padEnd(12);
    const throughput = `${result.throughput.toFixed(2)}x`.padEnd(12);
    const memory = `${(result.memoryUsed / 1024 / 1024).toFixed(2)}MB`.padEnd(12);

    console.log(`│ ${duration} │ ${procTime} │ ${rtf} │ ${throughput} │ ${memory} │`);
  }

  console.log(
    '└──────────────┴─────────────────┴──────────────┴──────────────┴──────────────┘'
  );

  // Calculate averages
  const avgRTF = results.reduce((sum, r) => sum + r.realTimeFactor, 0) / results.length;
  const avgThroughput = results.reduce((sum, r) => sum + r.throughput, 0) / results.length;
  const avgMemory =
    results.reduce((sum, r) => sum + r.memoryUsed, 0) / results.length / 1024 / 1024;

  console.log('\n' + '='.repeat(80));
  console.log('Average Performance');
  console.log('='.repeat(80));
  console.log(`Real-Time Factor: ${avgRTF.toFixed(3)}x`);
  console.log(`Throughput: ${avgThroughput.toFixed(2)}x real-time`);
  console.log(`Memory Usage: ${avgMemory.toFixed(2)}MB`);
  console.log('='.repeat(80));

  // Performance insights
  console.log('\n' + '='.repeat(80));
  console.log('Performance Insights');
  console.log('='.repeat(80));

  if (avgRTF < 0.1) {
    console.log('✓ Excellent: Processing is 10x+ faster than real-time');
  } else if (avgRTF < 0.5) {
    console.log('✓ Good: Processing is 2x+ faster than real-time');
  } else if (avgRTF < 1.0) {
    console.log('⚠ Fair: Processing is faster than real-time but could be optimized');
  } else {
    console.log('✗ Slow: Processing is slower than real-time');
  }

  console.log(`\nModel: ${process.env.WHISPER_MODEL || 'base'}`);
  console.log(`Device: ${process.env.WHISPER_DEVICE || 'cpu'}`);
  console.log(`Compute Type: ${process.env.WHISPER_COMPUTE_TYPE || 'int8'}`);
  console.log('='.repeat(80));
}

runBenchmarks().catch((error) => {
  console.error('Benchmark failed:', error);
  process.exit(1);
});

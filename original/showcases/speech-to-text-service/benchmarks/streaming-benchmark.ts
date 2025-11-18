/**
 * Streaming Performance Benchmark
 * Tests real-time streaming transcription latency and throughput
 */

import WebSocket from 'ws';
import { spawn } from 'child_process';

const WS_URL = 'ws://localhost:3000/ws';

interface StreamingMetrics {
  chunkSize: number;
  totalChunks: number;
  totalLatency: number;
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
  throughput: number;
}

async function generateAudioChunk(duration: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const proc = spawn('python3', [
      '-c',
      `
import sys
import numpy as np
import soundfile as sf
import io

sample_rate = 16000
duration = ${duration}
frequency = 440
samples = int(sample_rate * duration)
t = np.linspace(0, duration, samples, False)
audio = np.sin(2 * np.pi * frequency * t) * 0.3
audio = audio.astype(np.float32)

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

async function benchmarkStreaming(
  chunkDuration: number,
  numChunks: number
): Promise<StreamingMetrics> {
  return new Promise(async (resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    const latencies: number[] = [];
    const chunkSendTimes = new Map<number, number>();
    let chunksReceived = 0;

    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('Benchmark timeout'));
    }, 60000);

    ws.on('open', () => {
      console.log('  Connected to server');
    });

    ws.on('message', async (data) => {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'connected':
          ws.send(JSON.stringify({ type: 'start', language: 'en' }));
          break;

        case 'started':
          console.log('  Streaming started, sending chunks...');

          // Send all chunks
          for (let i = 0; i < numChunks; i++) {
            const audioChunk = await generateAudioChunk(chunkDuration);
            chunkSendTimes.set(i + 1, Date.now());
            ws.send(audioChunk);
          }
          break;

        case 'transcription':
          chunksReceived++;
          const chunkId = message.chunk.chunkId;
          const sendTime = chunkSendTimes.get(chunkId);

          if (sendTime) {
            const latency = Date.now() - sendTime;
            latencies.push(latency);
          }

          if (chunksReceived === numChunks) {
            ws.send(JSON.stringify({ type: 'stop' }));
          }
          break;

        case 'stopped':
          clearTimeout(timeout);
          ws.close();

          const totalLatency = latencies.reduce((sum, l) => sum + l, 0);
          const avgLatency = totalLatency / latencies.length;
          const minLatency = Math.min(...latencies);
          const maxLatency = Math.max(...latencies);
          const throughput = (numChunks * chunkDuration) / (totalLatency / 1000);

          resolve({
            chunkSize: chunkDuration,
            totalChunks: numChunks,
            totalLatency,
            avgLatency,
            minLatency,
            maxLatency,
            throughput,
          });
          break;

        case 'error':
          clearTimeout(timeout);
          ws.close();
          reject(new Error(message.error));
          break;
      }
    });

    ws.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function runBenchmarks() {
  console.log('\n');
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(18) + 'Streaming Performance Benchmark' + ' '.repeat(29) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');

  console.log('\nNote: Ensure the server is running on http://localhost:3000\n');

  const benchmarks = [
    { chunkSize: 1.0, numChunks: 10, description: '1-second chunks' },
    { chunkSize: 2.0, numChunks: 10, description: '2-second chunks' },
    { chunkSize: 5.0, numChunks: 6, description: '5-second chunks' },
    { chunkSize: 10.0, numChunks: 5, description: '10-second chunks' },
  ];

  const results: StreamingMetrics[] = [];

  console.log('='.repeat(80));
  console.log('Running streaming benchmarks...');
  console.log('='.repeat(80));

  for (const { chunkSize, numChunks, description } of benchmarks) {
    process.stdout.write(`\nBenchmarking ${description}... `);

    try {
      const result = await benchmarkStreaming(chunkSize, numChunks);
      results.push(result);

      console.log('✓');
      console.log(`  Average Latency: ${result.avgLatency.toFixed(0)}ms`);
      console.log(`  Min Latency: ${result.minLatency.toFixed(0)}ms`);
      console.log(`  Max Latency: ${result.maxLatency.toFixed(0)}ms`);
      console.log(`  Throughput: ${result.throughput.toFixed(2)}x real-time`);
    } catch (error) {
      console.log('✗');
      console.error(`  Error: ${error instanceof Error ? error.message : error}`);
    }
  }

  // Print summary table
  console.log('\n' + '='.repeat(80));
  console.log('Streaming Benchmark Results');
  console.log('='.repeat(80));
  console.log();

  console.log(
    '┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐'
  );
  console.log(
    '│  Chunk Size  │  Avg Latency │  Min Latency │  Max Latency │  Throughput  │'
  );
  console.log(
    '├──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤'
  );

  for (const result of results) {
    const chunkSize = `${result.chunkSize}s`.padEnd(12);
    const avgLatency = `${result.avgLatency.toFixed(0)}ms`.padEnd(12);
    const minLatency = `${result.minLatency.toFixed(0)}ms`.padEnd(12);
    const maxLatency = `${result.maxLatency.toFixed(0)}ms`.padEnd(12);
    const throughput = `${result.throughput.toFixed(2)}x`.padEnd(12);

    console.log(
      `│ ${chunkSize} │ ${avgLatency} │ ${minLatency} │ ${maxLatency} │ ${throughput} │`
    );
  }

  console.log(
    '└──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘'
  );

  // Performance insights
  console.log('\n' + '='.repeat(80));
  console.log('Performance Insights');
  console.log('='.repeat(80));

  const avgLatency = results.reduce((sum, r) => sum + r.avgLatency, 0) / results.length;

  if (avgLatency < 500) {
    console.log('✓ Excellent: Average latency < 500ms (suitable for live captioning)');
  } else if (avgLatency < 1000) {
    console.log('✓ Good: Average latency < 1s (suitable for near-real-time)');
  } else if (avgLatency < 2000) {
    console.log('⚠ Fair: Average latency < 2s (acceptable for some use cases)');
  } else {
    console.log('✗ Slow: Average latency > 2s (consider optimization)');
  }

  console.log('\nRecommendations:');

  if (results[0] && results[0].avgLatency < 300) {
    console.log('  • Small chunks (1-2s) work well for your system');
  } else if (results[2] && results[2].avgLatency < 1000) {
    console.log('  • Medium chunks (5s) provide best balance');
  } else {
    console.log('  • Large chunks (10s+) recommended for your system');
  }

  console.log('='.repeat(80));
}

runBenchmarks().catch((error) => {
  console.error('\nBenchmark failed:', error.message);
  console.error('\nMake sure the server is running:');
  console.error('  npm start');
  process.exit(1);
});

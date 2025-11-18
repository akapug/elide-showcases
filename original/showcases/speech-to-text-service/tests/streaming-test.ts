/**
 * Streaming Transcription Tests
 */

import WebSocket from 'ws';
import { spawn } from 'child_process';

const WS_URL = 'ws://localhost:3000/ws';
const TEST_TIMEOUT = 30000;

async function generateAudioChunk(duration: number = 1.0): Promise<Buffer> {
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
        reject(new Error('Failed to generate audio chunk'));
      } else {
        resolve(Buffer.concat(chunks));
      }
    });
  });
}

async function testWebSocketConnection() {
  console.log('\n' + '='.repeat(80));
  console.log('Test: WebSocket Connection');
  console.log('='.repeat(80));

  return new Promise<boolean>((resolve) => {
    const ws = new WebSocket(WS_URL);
    let connected = false;

    const timeout = setTimeout(() => {
      console.error('✗ Connection timeout');
      ws.close();
      resolve(false);
    }, 5000);

    ws.on('open', () => {
      clearTimeout(timeout);
      connected = true;
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());

      if (message.type === 'connected') {
        console.log('✓ Connected to WebSocket server');
        console.log(`  Session ID: ${message.sessionId}`);
        console.log(`  Chunk Duration: ${message.config.chunkDuration}s`);
        console.log(`  Overlap: ${message.config.overlapDuration}s`);
        ws.close();
        resolve(true);
      }
    });

    ws.on('error', (error) => {
      clearTimeout(timeout);
      console.error('✗ Connection error:', error.message);
      resolve(false);
    });
  });
}

async function testStreamingSession() {
  console.log('\n' + '='.repeat(80));
  console.log('Test: Streaming Session Lifecycle');
  console.log('='.repeat(80));

  return new Promise<boolean>(async (resolve) => {
    const ws = new WebSocket(WS_URL);
    let started = false;
    let receivedTranscription = false;
    let stopped = false;

    const timeout = setTimeout(() => {
      console.error('✗ Test timeout');
      ws.close();
      resolve(false);
    }, TEST_TIMEOUT);

    ws.on('open', () => {
      console.log('✓ Connection established');
    });

    ws.on('message', async (data) => {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'connected':
          // Start streaming
          ws.send(JSON.stringify({ type: 'start', language: 'en' }));
          break;

        case 'started':
          console.log('✓ Streaming started');
          started = true;

          // Send test audio chunk
          const audioChunk = await generateAudioChunk(1.0);
          ws.send(audioChunk);
          console.log('  Sent audio chunk');
          break;

        case 'transcription':
          console.log('✓ Received transcription');
          console.log(`  Chunk ID: ${message.chunk.chunkId}`);
          console.log(`  Text: ${message.chunk.text || '(empty)'}`);
          console.log(`  Final: ${message.chunk.isFinal}`);
          receivedTranscription = true;

          // Stop streaming
          ws.send(JSON.stringify({ type: 'stop' }));
          break;

        case 'stopped':
          console.log('✓ Streaming stopped');
          console.log(`  Chunks processed: ${message.chunksProcessed}`);
          stopped = true;

          clearTimeout(timeout);
          ws.close();

          const success = started && receivedTranscription && stopped;
          resolve(success);
          break;

        case 'error':
          console.error('✗ Server error:', message.error);
          clearTimeout(timeout);
          ws.close();
          resolve(false);
          break;
      }
    });

    ws.on('error', (error) => {
      clearTimeout(timeout);
      console.error('✗ WebSocket error:', error.message);
      resolve(false);
    });
  });
}

async function testMultipleChunks() {
  console.log('\n' + '='.repeat(80));
  console.log('Test: Multiple Audio Chunks');
  console.log('='.repeat(80));

  return new Promise<boolean>(async (resolve) => {
    const ws = new WebSocket(WS_URL);
    let chunksReceived = 0;
    const totalChunks = 5;

    const timeout = setTimeout(() => {
      console.error('✗ Test timeout');
      ws.close();
      resolve(false);
    }, TEST_TIMEOUT);

    ws.on('message', async (data) => {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'connected':
          ws.send(JSON.stringify({ type: 'start', language: 'en' }));
          break;

        case 'started':
          console.log('✓ Streaming started');

          // Send multiple chunks
          for (let i = 0; i < totalChunks; i++) {
            const audioChunk = await generateAudioChunk(0.5);
            ws.send(audioChunk);
            console.log(`  Sent chunk ${i + 1}/${totalChunks}`);
            await new Promise((r) => setTimeout(r, 100));
          }
          break;

        case 'transcription':
          chunksReceived++;
          console.log(`✓ Received transcription ${chunksReceived}/${totalChunks}`);

          if (chunksReceived === totalChunks) {
            ws.send(JSON.stringify({ type: 'stop' }));
          }
          break;

        case 'stopped':
          clearTimeout(timeout);
          ws.close();

          const success = chunksReceived === totalChunks;
          if (success) {
            console.log(`✓ All ${totalChunks} chunks processed successfully`);
          }
          resolve(success);
          break;

        case 'error':
          console.error('✗ Error:', message.error);
          clearTimeout(timeout);
          ws.close();
          resolve(false);
          break;
      }
    });
  });
}

async function testHeartbeat() {
  console.log('\n' + '='.repeat(80));
  console.log('Test: Heartbeat/Ping-Pong');
  console.log('='.repeat(80));

  return new Promise<boolean>((resolve) => {
    const ws = new WebSocket(WS_URL);
    let receivedPing = false;

    const timeout = setTimeout(() => {
      ws.close();
      resolve(receivedPing);
    }, 35000); // Wait for heartbeat interval (30s)

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());

      if (message.type === 'ping') {
        console.log('✓ Received ping');
        receivedPing = true;

        // Send pong
        ws.send(JSON.stringify({ type: 'pong' }));
        console.log('  Sent pong');

        clearTimeout(timeout);
        ws.close();
        resolve(true);
      }
    });
  });
}

async function runTests() {
  console.log('\n');
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(20) + 'Streaming Transcription Tests' + ' '.repeat(29) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');

  console.log('\nNote: Ensure the server is running on http://localhost:3000');
  console.log('  Start with: npm start\n');

  const tests = [
    { name: 'WebSocket Connection', fn: testWebSocketConnection },
    { name: 'Streaming Session', fn: testStreamingSession },
    { name: 'Multiple Chunks', fn: testMultipleChunks },
    // { name: 'Heartbeat', fn: testHeartbeat }, // Disabled (takes 30s)
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const success = await test.fn();
      if (success) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`✗ Test failed: ${error}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('Test Summary');
  console.log('='.repeat(80));
  console.log(`Total: ${tests.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log('='.repeat(80));

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});

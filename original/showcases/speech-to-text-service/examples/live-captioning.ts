/**
 * Live Captioning Example
 * Demonstrates real-time transcription using WebSocket
 */

import WebSocket from 'ws';

const WS_URL = process.env.WS_URL || 'ws://localhost:3000/ws';

async function simulateLiveAudio(ws: WebSocket, durationSeconds: number = 10) {
  const { spawn } = await import('child_process');

  console.log(`Simulating ${durationSeconds}s of live audio...`);

  // Generate continuous audio in chunks
  const chunkDuration = 1.0; // 1 second chunks
  const numChunks = Math.floor(durationSeconds / chunkDuration);

  for (let i = 0; i < numChunks; i++) {
    // Generate 1-second audio chunk
    const audioChunk = await new Promise<Buffer>((resolve, reject) => {
      const proc = spawn('python3', [
        '-c',
        `
import sys
import numpy as np
import soundfile as sf
import io

# Generate 1 second of audio
sample_rate = 16000
duration = 1.0
frequency = 440 + (${i} * 50)  # Varying frequency
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
          reject(new Error('Failed to generate audio chunk'));
        } else {
          resolve(Buffer.concat(chunks));
        }
      });
    });

    // Send audio chunk
    ws.send(audioChunk);
    console.log(`  Sent chunk ${i + 1}/${numChunks}`);

    // Wait a bit to simulate real-time
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log('✓ Finished sending audio');
}

async function liveCaptioningDemo() {
  console.log('\n');
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(25) + 'Live Captioning Example' + ' '.repeat(30) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');

  console.log('\n' + '='.repeat(80));
  console.log('Connecting to WebSocket...');
  console.log('='.repeat(80));

  const ws = new WebSocket(WS_URL);

  await new Promise<void>((resolve, reject) => {
    ws.on('open', () => {
      console.log('✓ Connected to server');
      resolve();
    });

    ws.on('error', (error) => {
      console.error('✗ Connection failed:', error.message);
      reject(error);
    });
  });

  // Handle messages
  let transcriptionCount = 0;
  let captionBuffer: string[] = [];

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'connected':
          console.log(`\n✓ Session ID: ${message.sessionId}`);
          console.log(`  Supported languages: ${message.config.supportedLanguages.join(', ')}`);
          break;

        case 'started':
          console.log(`\n✓ Streaming started (language: ${message.language})`);
          break;

        case 'transcription':
          transcriptionCount++;
          const chunk = message.chunk;

          // Display caption
          console.log('\n' + '-'.repeat(80));
          console.log(`Caption ${transcriptionCount} [Chunk ${chunk.chunkId}]`);
          console.log('-'.repeat(80));
          console.log(chunk.text || '(silence)');
          console.log(`Confidence: ${(chunk.confidence * 100).toFixed(1)}%`);
          console.log(`Final: ${chunk.isFinal ? 'Yes' : 'No'}`);

          if (chunk.isFinal) {
            captionBuffer.push(chunk.text);
          }
          break;

        case 'stopped':
          console.log(`\n✓ Streaming stopped (${message.chunksProcessed} chunks processed)`);
          break;

        case 'error':
          console.error(`\n✗ Error: ${message.error}`);
          break;

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;

        default:
          console.log(`Received: ${message.type}`);
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log('Starting live transcription...');
  console.log('='.repeat(80));

  // Start streaming
  ws.send(
    JSON.stringify({
      type: 'start',
      language: 'en',
    })
  );

  // Wait for start confirmation
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Simulate live audio
  await simulateLiveAudio(ws, 10);

  // Wait for final transcriptions
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Stop streaming
  ws.send(
    JSON.stringify({
      type: 'stop',
    })
  );

  // Wait for stop confirmation
  await new Promise((resolve) => setTimeout(resolve, 500));

  console.log('\n' + '='.repeat(80));
  console.log('Full Transcript');
  console.log('='.repeat(80));
  console.log(captionBuffer.join(' '));

  console.log('\n' + '='.repeat(80));
  console.log('Summary');
  console.log('='.repeat(80));
  console.log(`Total captions: ${transcriptionCount}`);
  console.log(`Final transcript segments: ${captionBuffer.length}`);
  console.log('='.repeat(80));

  ws.close();

  console.log('\n✓ Live captioning demo complete!');
}

// Check if server is available
console.log('Checking server availability...');
console.log(`Target: ${WS_URL}`);

liveCaptioningDemo().catch((error) => {
  console.error('\n✗ Demo failed:', error.message);
  console.error('\nMake sure the server is running:');
  console.error('  npm start');
  process.exit(1);
});

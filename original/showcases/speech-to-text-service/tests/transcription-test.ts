/**
 * Transcription Tests
 */

import { TranscriptionBridge } from '../transcription/bridge.js';
import { AudioProcessor } from '../shared/audio-processor.js';
import logger from '../shared/logger.js';

async function generateTestAudio(): Promise<Buffer> {
  // Generate a simple test tone (1 second at 16kHz)
  const { spawn } = await import('child_process');

  return new Promise((resolve, reject) => {
    const proc = spawn('python3', [
      '-c',
      `
import sys
import numpy as np
import soundfile as sf
import io

# Generate 1 second of test audio (silence)
sample_rate = 16000
duration = 1.0
samples = int(sample_rate * duration)
audio = np.zeros(samples, dtype=np.float32)

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
        reject(new Error('Failed to generate test audio'));
      } else {
        resolve(Buffer.concat(chunks));
      }
    });
  });
}

async function testBasicTranscription() {
  console.log('\n' + '='.repeat(80));
  console.log('Test: Basic Transcription');
  console.log('='.repeat(80));

  try {
    const bridge = new TranscriptionBridge();
    const audioBuffer = await generateTestAudio();

    console.log(`Generated test audio: ${audioBuffer.length} bytes`);

    const result = await bridge.transcribe(audioBuffer, {
      enableTimestamps: true,
      enableWordTimestamps: false,
      enableDiarization: false,
    });

    console.log('✓ Transcription successful');
    console.log(`  Job ID: ${result.jobId}`);
    console.log(`  Language: ${result.language}`);
    console.log(`  Duration: ${result.duration}s`);
    console.log(`  Segments: ${result.segments.length}`);
    console.log(`  Processing Time: ${result.metadata.processingTime.toFixed(2)}ms`);
    console.log(`  RTF: ${result.performance?.realTimeFactor.toFixed(3)}`);

    return true;
  } catch (error) {
    console.error('✗ Test failed:', error);
    return false;
  }
}

async function testWordTimestamps() {
  console.log('\n' + '='.repeat(80));
  console.log('Test: Word-Level Timestamps');
  console.log('='.repeat(80));

  try {
    const bridge = new TranscriptionBridge();
    const audioBuffer = await generateTestAudio();

    const result = await bridge.transcribe(audioBuffer, {
      enableTimestamps: true,
      enableWordTimestamps: true,
      enableDiarization: false,
    });

    console.log('✓ Word timestamps enabled');
    console.log(`  Segments: ${result.segments.length}`);

    if (result.segments.length > 0 && result.segments[0].words) {
      console.log(`  Words in first segment: ${result.segments[0].words.length}`);
    }

    return true;
  } catch (error) {
    console.error('✗ Test failed:', error);
    return false;
  }
}

async function testAudioPreprocessing() {
  console.log('\n' + '='.repeat(80));
  console.log('Test: Audio Preprocessing');
  console.log('='.repeat(80));

  try {
    const audioBuffer = await generateTestAudio();

    // Test metadata extraction
    const metadata = await AudioProcessor.getMetadata(audioBuffer);
    console.log('✓ Metadata extraction');
    console.log(`  Duration: ${metadata.duration}s`);
    console.log(`  Sample Rate: ${metadata.sampleRate}Hz`);
    console.log(`  Channels: ${metadata.channels}`);

    // Test format conversion
    const converted = await AudioProcessor.convertToWhisperFormat(audioBuffer);
    console.log('✓ Format conversion');
    console.log(`  Original: ${audioBuffer.length} bytes`);
    console.log(`  Converted: ${converted.length} bytes`);

    // Test validation
    const validation = await AudioProcessor.validate(audioBuffer, 100 * 1024 * 1024, 3600);
    console.log('✓ Validation');
    console.log(`  Valid: ${validation.valid}`);

    return true;
  } catch (error) {
    console.error('✗ Test failed:', error);
    return false;
  }
}

async function testStreamingTranscription() {
  console.log('\n' + '='.repeat(80));
  console.log('Test: Streaming Transcription');
  console.log('='.repeat(80));

  try {
    const bridge = new TranscriptionBridge();
    const audioBuffer = await generateTestAudio();

    // Split into chunks
    const chunks = await AudioProcessor.splitIntoChunks(audioBuffer, 0.5, 0.1);
    console.log(`✓ Audio split into ${chunks.length} chunks`);

    // Transcribe each chunk
    for (let i = 0; i < chunks.length; i++) {
      const result = await bridge.transcribeStreaming(chunks[i], {
        language: 'en',
      });

      console.log(`  Chunk ${i + 1}: ${result.isFinal ? 'Final' : 'Partial'}`);
    }

    return true;
  } catch (error) {
    console.error('✗ Test failed:', error);
    return false;
  }
}

async function runTests() {
  console.log('\n');
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(20) + 'Speech-to-Text Service Tests' + ' '.repeat(30) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');

  const tests = [
    { name: 'Basic Transcription', fn: testBasicTranscription },
    { name: 'Word Timestamps', fn: testWordTimestamps },
    { name: 'Audio Preprocessing', fn: testAudioPreprocessing },
    { name: 'Streaming Transcription', fn: testStreamingTranscription },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const success = await test.fn();
    if (success) {
      passed++;
    } else {
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

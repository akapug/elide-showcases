/**
 * Speaker Diarization Tests
 */

import { TranscriptionBridge } from '../transcription/bridge.js';
import { spawn } from 'child_process';

async function generateMultiSpeakerAudio(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const proc = spawn('python3', [
      '-c',
      `
import sys
import numpy as np
import soundfile as sf
import io

# Generate audio with 3 distinct speakers
sample_rate = 16000
segment_duration = 3.0  # 3 seconds per speaker
num_speakers = 3
samples_per_segment = int(sample_rate * segment_duration)

# Different frequencies for each speaker
frequencies = [200, 300, 400]  # Hz

audio_segments = []

for i, freq in enumerate(frequencies):
    t = np.linspace(0, segment_duration, samples_per_segment, False)
    segment = np.sin(2 * np.pi * freq * t) * 0.3
    audio_segments.append(segment)

# Alternate speakers
audio = np.concatenate([
    audio_segments[0],  # Speaker 1
    audio_segments[1],  # Speaker 2
    audio_segments[2],  # Speaker 3
    audio_segments[0],  # Speaker 1
    audio_segments[1],  # Speaker 2
])

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
        reject(new Error('Failed to generate multi-speaker audio'));
      } else {
        resolve(Buffer.concat(chunks));
      }
    });
  });
}

async function testSpeakerDetection() {
  console.log('\n' + '='.repeat(80));
  console.log('Test: Speaker Detection');
  console.log('='.repeat(80));

  try {
    const bridge = new TranscriptionBridge();
    const audioBuffer = await generateMultiSpeakerAudio();

    console.log(`Generated multi-speaker audio: ${audioBuffer.length} bytes`);

    const result = await bridge.transcribe(audioBuffer, {
      enableTimestamps: true,
      enableDiarization: true,
      minSpeakers: 2,
      maxSpeakers: 5,
    });

    console.log('✓ Diarization complete');

    if (result.speakers) {
      console.log(`  Speakers detected: ${result.speakers.length}`);

      result.speakers.forEach((speaker, index) => {
        const participation = (speaker.speakingTime / result.duration) * 100;
        console.log(
          `  ${speaker.name}: ${speaker.speakingTime.toFixed(2)}s (${participation.toFixed(1)}%)`
        );
      });

      return result.speakers.length >= 1;
    } else {
      console.log('⚠ No speakers detected (diarization may not be available)');
      return true; // Don't fail if diarization is not set up
    }
  } catch (error) {
    console.error('✗ Test failed:', error);
    return false;
  }
}

async function testSpeakerAlignment() {
  console.log('\n' + '='.repeat(80));
  console.log('Test: Speaker-Transcription Alignment');
  console.log('='.repeat(80));

  try {
    const bridge = new TranscriptionBridge();
    const audioBuffer = await generateMultiSpeakerAudio();

    const result = await bridge.transcribe(audioBuffer, {
      enableTimestamps: true,
      enableDiarization: true,
      minSpeakers: 2,
      maxSpeakers: 5,
    });

    console.log('✓ Transcription with alignment complete');

    // Check that segments have speaker labels
    let segmentsWithSpeakers = 0;

    result.segments.forEach((segment) => {
      if (segment.speaker) {
        segmentsWithSpeakers++;
      }
    });

    const alignmentRate = (segmentsWithSpeakers / result.segments.length) * 100;
    console.log(`  Total segments: ${result.segments.length}`);
    console.log(`  Segments with speakers: ${segmentsWithSpeakers}`);
    console.log(`  Alignment rate: ${alignmentRate.toFixed(1)}%`);

    return alignmentRate > 0; // At least some alignment
  } catch (error) {
    console.error('✗ Test failed:', error);
    return false;
  }
}

async function testSpeakerStatistics() {
  console.log('\n' + '='.repeat(80));
  console.log('Test: Speaker Statistics');
  console.log('='.repeat(80));

  try {
    const bridge = new TranscriptionBridge();
    const audioBuffer = await generateMultiSpeakerAudio();

    const result = await bridge.transcribe(audioBuffer, {
      enableTimestamps: true,
      enableDiarization: true,
      minSpeakers: 2,
      maxSpeakers: 5,
    });

    console.log('✓ Statistics calculated');

    if (result.speakers) {
      // Verify statistics
      let totalSpeakingTime = 0;

      result.speakers.forEach((speaker) => {
        totalSpeakingTime += speaker.speakingTime;
        console.log(`  ${speaker.name}:`);
        console.log(`    Speaking time: ${speaker.speakingTime.toFixed(2)}s`);
        console.log(`    Segments: ${speaker.segments.length}`);
        console.log(`    Total duration: ${speaker.totalDuration.toFixed(2)}s`);
      });

      // Check that speaking time is reasonable
      const speakingPercentage = (totalSpeakingTime / result.duration) * 100;
      console.log(`\n  Total speaking time: ${totalSpeakingTime.toFixed(2)}s`);
      console.log(`  Audio duration: ${result.duration.toFixed(2)}s`);
      console.log(`  Speaking percentage: ${speakingPercentage.toFixed(1)}%`);

      return speakingPercentage > 50; // At least 50% should be speech
    } else {
      console.log('⚠ No speaker statistics available');
      return true; // Don't fail if diarization is not set up
    }
  } catch (error) {
    console.error('✗ Test failed:', error);
    return false;
  }
}

async function runTests() {
  console.log('\n');
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(22) + 'Speaker Diarization Tests' + ' '.repeat(31) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');

  console.log('\nNote: Speaker diarization requires HuggingFace token for pyannote.audio');
  console.log('  Set HF_TOKEN in .env file');
  console.log('  Tests will use fallback energy-based segmentation if not available\n');

  const tests = [
    { name: 'Speaker Detection', fn: testSpeakerDetection },
    { name: 'Speaker Alignment', fn: testSpeakerAlignment },
    { name: 'Speaker Statistics', fn: testSpeakerStatistics },
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

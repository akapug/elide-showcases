/**
 * Podcast Transcription Example
 * Demonstrates transcribing a podcast episode with speaker diarization
 */

import { TranscriptionBridge } from '../transcription/bridge.js';
import { spawn } from 'child_process';
import * as fs from 'fs';

async function generatePodcastAudio(): Promise<Buffer> {
  // Generate a longer test audio (30 seconds) simulating a podcast
  return new Promise((resolve, reject) => {
    const proc = spawn('python3', [
      '-c',
      `
import sys
import numpy as np
import soundfile as sf
import io

# Generate 30-second podcast simulation
sample_rate = 16000
duration = 30.0
samples = int(sample_rate * duration)

# Create audio with varying frequencies to simulate different speakers
t = np.linspace(0, duration, samples, False)

# Speaker 1: 200Hz (lower voice)
speaker1 = np.sin(2 * np.pi * 200 * t) * 0.2
# Speaker 2: 350Hz (higher voice)
speaker2 = np.sin(2 * np.pi * 350 * t) * 0.2

# Alternate speakers every 3 seconds
audio = np.zeros(samples, dtype=np.float32)
segment_length = int(sample_rate * 3)

for i in range(10):
    start = i * segment_length
    end = min(start + segment_length, samples)
    if i % 2 == 0:
        audio[start:end] = speaker1[start:end]
    else:
        audio[start:end] = speaker2[start:end]

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
        reject(new Error('Failed to generate podcast audio'));
      } else {
        resolve(Buffer.concat(chunks));
      }
    });
  });
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

async function transcribePodcast() {
  console.log('\n');
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(23) + 'Podcast Transcription Example' + ' '.repeat(26) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');

  console.log('\n' + '='.repeat(80));
  console.log('Step 1: Generate Test Podcast Audio');
  console.log('='.repeat(80));

  const audioBuffer = await generatePodcastAudio();
  console.log(`✓ Generated podcast audio: ${audioBuffer.length} bytes`);

  console.log('\n' + '='.repeat(80));
  console.log('Step 2: Transcribe with Speaker Diarization');
  console.log('='.repeat(80));

  const bridge = new TranscriptionBridge();

  const result = await bridge.transcribe(audioBuffer, {
    enableTimestamps: true,
    enableWordTimestamps: true,
    enableDiarization: true,
    minSpeakers: 2,
    maxSpeakers: 4,
  });

  console.log(`✓ Transcription complete`);
  console.log(`  Job ID: ${result.jobId}`);
  console.log(`  Duration: ${result.duration.toFixed(2)}s`);
  console.log(`  Language: ${result.language}`);
  console.log(`  Segments: ${result.segments.length}`);
  console.log(`  Processing Time: ${result.metadata.processingTime.toFixed(2)}ms`);
  console.log(`  RTF: ${result.performance?.realTimeFactor.toFixed(3)}`);

  if (result.speakers) {
    console.log(`  Speakers Detected: ${result.speakers.length}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('Step 3: Format Transcript');
  console.log('='.repeat(80));

  // Generate formatted transcript
  let transcript = '';
  transcript += '# Podcast Transcript\n\n';
  transcript += `**Episode Duration:** ${formatTimestamp(result.duration)}\n`;
  transcript += `**Language:** ${result.language}\n`;
  transcript += `**Transcribed:** ${result.metadata.timestamp}\n\n`;

  if (result.speakers) {
    transcript += '## Speakers\n\n';
    result.speakers.forEach((speaker) => {
      const speakingPercent = (speaker.speakingTime / result.duration) * 100;
      transcript += `- **${speaker.name}**: ${formatTimestamp(speaker.speakingTime)} (${speakingPercent.toFixed(1)}%)\n`;
    });
    transcript += '\n';
  }

  transcript += '## Transcript\n\n';

  result.segments.forEach((segment) => {
    const timestamp = `[${formatTimestamp(segment.start)} -> ${formatTimestamp(segment.end)}]`;
    const speaker = segment.speaker ? `**${segment.speaker}**: ` : '';
    transcript += `${timestamp} ${speaker}${segment.text}\n\n`;
  });

  console.log(transcript);

  console.log('\n' + '='.repeat(80));
  console.log('Step 4: Export Formats');
  console.log('='.repeat(80));

  // Save as Markdown
  fs.writeFileSync('podcast-transcript.md', transcript);
  console.log('✓ Saved as Markdown: podcast-transcript.md');

  // Save as JSON
  fs.writeFileSync('podcast-transcript.json', JSON.stringify(result, null, 2));
  console.log('✓ Saved as JSON: podcast-transcript.json');

  // Generate SRT subtitles
  let srt = '';
  result.segments.forEach((segment, i) => {
    srt += `${i + 1}\n`;
    srt += `${formatSRTTimestamp(segment.start)} --> ${formatSRTTimestamp(segment.end)}\n`;
    srt += `${segment.text}\n\n`;
  });

  fs.writeFileSync('podcast-transcript.srt', srt);
  console.log('✓ Saved as SRT: podcast-transcript.srt');

  // Generate VTT subtitles
  let vtt = 'WEBVTT\n\n';
  result.segments.forEach((segment, i) => {
    vtt += `${i + 1}\n`;
    vtt += `${formatVTTTimestamp(segment.start)} --> ${formatVTTTimestamp(segment.end)}\n`;
    vtt += `${segment.text}\n\n`;
  });

  fs.writeFileSync('podcast-transcript.vtt', vtt);
  console.log('✓ Saved as VTT: podcast-transcript.vtt');

  console.log('\n' + '='.repeat(80));
  console.log('Podcast Transcription Complete!');
  console.log('='.repeat(80));
}

function formatSRTTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

function formatVTTTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

transcribePodcast().catch((error) => {
  console.error('Podcast transcription failed:', error);
  process.exit(1);
});

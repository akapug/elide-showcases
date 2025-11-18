/**
 * Meeting Notes Example
 * Demonstrates transcribing a meeting with speaker statistics and action items
 */

import { TranscriptionBridge } from '../transcription/bridge.js';
import { spawn } from 'child_process';
import * as fs from 'fs';

async function generateMeetingAudio(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const proc = spawn('python3', [
      '-c',
      `
import sys
import numpy as np
import soundfile as sf
import io

# Generate 45-second meeting simulation
sample_rate = 16000
duration = 45.0
samples = int(sample_rate * duration)

# Create audio with different speakers
t = np.linspace(0, duration, samples, False)

# Speaker 1: 180Hz
speaker1 = np.sin(2 * np.pi * 180 * t) * 0.25
# Speaker 2: 280Hz
speaker2 = np.sin(2 * np.pi * 280 * t) * 0.25
# Speaker 3: 380Hz
speaker3 = np.sin(2 * np.pi * 380 * t) * 0.25

# Simulate meeting with multiple speakers
audio = np.zeros(samples, dtype=np.float32)
segment_length = int(sample_rate * 5)  # 5 second segments

speakers = [speaker1, speaker2, speaker3, speaker1, speaker2, speaker1, speaker3, speaker2, speaker1]

for i, speaker in enumerate(speakers):
    start = i * segment_length
    end = min(start + segment_length, samples)
    audio[start:end] = speaker[start:end]

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
        reject(new Error('Failed to generate meeting audio'));
      } else {
        resolve(Buffer.concat(chunks));
      }
    });
  });
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
}

function generateMeetingNotes(result: any): string {
  let notes = '';

  notes += '# Meeting Notes\n\n';
  notes += `**Date:** ${new Date(result.metadata.timestamp).toLocaleString()}\n`;
  notes += `**Duration:** ${formatDuration(result.duration)}\n`;
  notes += `**Language:** ${result.language}\n\n`;

  // Attendees
  if (result.speakers) {
    notes += '## Attendees\n\n';
    result.speakers.forEach((speaker: any, index: number) => {
      const participation = (speaker.speakingTime / result.duration) * 100;
      notes += `${index + 1}. **${speaker.name}** - ${formatDuration(speaker.speakingTime)} (${participation.toFixed(1)}% participation)\n`;
    });
    notes += '\n';
  }

  // Speaking statistics
  if (result.speakers) {
    notes += '## Speaking Statistics\n\n';
    notes += '| Speaker | Turns | Speaking Time | Participation |\n';
    notes += '|---------|-------|---------------|---------------|\n';

    result.speakers.forEach((speaker: any) => {
      const turns = speaker.segments.length;
      const time = formatDuration(speaker.speakingTime);
      const participation = ((speaker.speakingTime / result.duration) * 100).toFixed(1) + '%';

      notes += `| ${speaker.name} | ${turns} | ${time} | ${participation} |\n`;
    });
    notes += '\n';
  }

  // Transcript
  notes += '## Transcript\n\n';

  let currentSpeaker = '';
  result.segments.forEach((segment: any) => {
    const time = formatTime(segment.start);
    const speaker = segment.speaker || 'Unknown';

    if (speaker !== currentSpeaker) {
      currentSpeaker = speaker;
      notes += `\n### ${speaker} (${time})\n\n`;
    }

    notes += `${segment.text}\n\n`;
  });

  // Action items (simple keyword detection)
  notes += '## Action Items\n\n';
  const actionKeywords = ['action', 'task', 'todo', 'follow up', 'need to', 'should', 'will'];
  let actionCount = 0;

  result.segments.forEach((segment: any) => {
    const text = segment.text.toLowerCase();
    const hasAction = actionKeywords.some((keyword) => text.includes(keyword));

    if (hasAction) {
      actionCount++;
      const time = formatTime(segment.start);
      const speaker = segment.speaker || 'Unknown';
      notes += `- [ ] **[${time}] ${speaker}:** ${segment.text}\n`;
    }
  });

  if (actionCount === 0) {
    notes += '*No action items detected*\n';
  }

  notes += '\n';

  // Summary
  notes += '## Summary\n\n';
  notes += `- **Total Duration:** ${formatDuration(result.duration)}\n`;
  notes += `- **Total Segments:** ${result.segments.length}\n`;
  if (result.speakers) {
    notes += `- **Participants:** ${result.speakers.length}\n`;
  }
  notes += `- **Action Items:** ${actionCount}\n`;
  notes += `- **Processing Time:** ${(result.metadata.processingTime / 1000).toFixed(2)}s\n`;

  return notes;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

async function generateMeetingNotesExample() {
  console.log('\n');
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(26) + 'Meeting Notes Example' + ' '.repeat(31) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');

  console.log('\n' + '='.repeat(80));
  console.log('Step 1: Generate Meeting Audio');
  console.log('='.repeat(80));

  const audioBuffer = await generateMeetingAudio();
  console.log(`✓ Generated meeting audio: ${audioBuffer.length} bytes`);

  console.log('\n' + '='.repeat(80));
  console.log('Step 2: Transcribe with Speaker Diarization');
  console.log('='.repeat(80));

  const bridge = new TranscriptionBridge();

  const result = await bridge.transcribe(audioBuffer, {
    enableTimestamps: true,
    enableWordTimestamps: false,
    enableDiarization: true,
    minSpeakers: 2,
    maxSpeakers: 5,
  });

  console.log(`✓ Transcription complete`);
  console.log(`  Job ID: ${result.jobId}`);
  console.log(`  Duration: ${result.duration.toFixed(2)}s`);
  console.log(`  Segments: ${result.segments.length}`);
  console.log(`  Processing Time: ${result.metadata.processingTime.toFixed(2)}ms`);

  if (result.speakers) {
    console.log(`  Speakers Detected: ${result.speakers.length}`);
    result.speakers.forEach((speaker) => {
      console.log(`    - ${speaker.name}: ${formatDuration(speaker.speakingTime)}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('Step 3: Generate Meeting Notes');
  console.log('='.repeat(80));

  const notes = generateMeetingNotes(result);
  console.log(notes);

  console.log('\n' + '='.repeat(80));
  console.log('Step 4: Save Notes');
  console.log('='.repeat(80));

  // Save as Markdown
  fs.writeFileSync('meeting-notes.md', notes);
  console.log('✓ Saved as Markdown: meeting-notes.md');

  // Save as JSON
  fs.writeFileSync('meeting-transcript.json', JSON.stringify(result, null, 2));
  console.log('✓ Saved as JSON: meeting-transcript.json');

  // Generate attendance report
  if (result.speakers) {
    let report = 'Meeting Attendance Report\n';
    report += '='.repeat(80) + '\n\n';
    report += `Date: ${new Date(result.metadata.timestamp).toLocaleString()}\n`;
    report += `Duration: ${formatDuration(result.duration)}\n`;
    report += `Participants: ${result.speakers.length}\n\n`;

    report += 'Participation Details:\n';
    result.speakers.forEach((speaker: any, index: number) => {
      const participation = (speaker.speakingTime / result.duration) * 100;
      report += `\n${index + 1}. ${speaker.name}\n`;
      report += `   Speaking Time: ${formatDuration(speaker.speakingTime)}\n`;
      report += `   Participation: ${participation.toFixed(1)}%\n`;
      report += `   Speaking Turns: ${speaker.segments.length}\n`;
    });

    fs.writeFileSync('meeting-attendance.txt', report);
    console.log('✓ Saved attendance report: meeting-attendance.txt');
  }

  console.log('\n' + '='.repeat(80));
  console.log('Meeting Notes Generation Complete!');
  console.log('='.repeat(80));
}

generateMeetingNotesExample().catch((error) => {
  console.error('Meeting notes generation failed:', error);
  process.exit(1);
});

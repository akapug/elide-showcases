/**
 * Multi-Language Transcription Example
 * Demonstrates auto-detection and transcription in multiple languages
 */

import { TranscriptionBridge } from '../transcription/bridge.js';
import { spawn } from 'child_process';

async function generateTestAudio(language: string): Promise<Buffer> {
  // Generate simple test audio (tone)
  return new Promise((resolve, reject) => {
    const proc = spawn('python3', [
      '-c',
      `
import sys
import numpy as np
import soundfile as sf
import io

sample_rate = 16000
duration = 3.0
samples = int(sample_rate * duration)

# Generate a tone (placeholder for actual speech)
t = np.linspace(0, duration, samples, False)
frequency = 440
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

async function testLanguage(
  language: string,
  languageName: string,
  autoDetect: boolean = false
) {
  console.log('\n' + '-'.repeat(80));
  console.log(`Testing: ${languageName} (${language})`);
  console.log('-'.repeat(80));

  const bridge = new TranscriptionBridge();
  const audioBuffer = await generateTestAudio(language);

  console.log(`  Audio size: ${audioBuffer.length} bytes`);

  const result = await bridge.transcribe(audioBuffer, {
    language: autoDetect ? undefined : language,
    enableTimestamps: true,
    enableWordTimestamps: false,
  });

  console.log(`✓ Transcription complete`);
  console.log(`  Detected language: ${result.language}`);
  console.log(`  Duration: ${result.duration.toFixed(2)}s`);
  console.log(`  Segments: ${result.segments.length}`);
  console.log(`  Processing time: ${result.metadata.processingTime.toFixed(2)}ms`);
  console.log(`  Text: ${result.text || '(empty)'}`);

  return result;
}

async function multiLanguageDemo() {
  console.log('\n');
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(21) + 'Multi-Language Transcription Example' + ' '.repeat(21) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');

  console.log('\n' + '='.repeat(80));
  console.log('Step 1: Auto-Detection Mode');
  console.log('='.repeat(80));

  // Test auto-detection
  console.log('\nAuto-detecting language from audio...');
  const autoResult = await testLanguage('en', 'Auto-detect', true);

  console.log('\n' + '='.repeat(80));
  console.log('Step 2: Specific Language Transcription');
  console.log('='.repeat(80));

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'ja', name: 'Japanese' },
  ];

  const results = [];

  for (const { code, name } of languages) {
    try {
      const result = await testLanguage(code, name, false);
      results.push({ language: name, result });
    } catch (error) {
      console.error(`  ✗ Failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('Step 3: Performance Comparison');
  console.log('='.repeat(80));
  console.log();

  console.log('┌──────────────┬──────────────┬──────────────┬──────────────┐');
  console.log('│   Language   │   Duration   │   Proc Time  │     RTF      │');
  console.log('├──────────────┼──────────────┼──────────────┼──────────────┤');

  for (const { language, result } of results) {
    const duration = `${result.duration.toFixed(2)}s`.padEnd(12);
    const procTime = `${result.metadata.processingTime.toFixed(0)}ms`.padEnd(12);
    const rtf = result.performance
      ? `${result.performance.realTimeFactor.toFixed(3)}x`.padEnd(12)
      : 'N/A'.padEnd(12);

    console.log(`│ ${language.padEnd(12)} │ ${duration} │ ${procTime} │ ${rtf} │`);
  }

  console.log('└──────────────┴──────────────┴──────────────┴──────────────┘');

  console.log('\n' + '='.repeat(80));
  console.log('Step 4: Supported Languages');
  console.log('='.repeat(80));

  const supportedLanguages = [
    { code: 'en', name: 'English', region: 'Global' },
    { code: 'es', name: 'Spanish', region: 'Spain, Latin America' },
    { code: 'fr', name: 'French', region: 'France, Canada, Africa' },
    { code: 'de', name: 'German', region: 'Germany, Austria, Switzerland' },
    { code: 'it', name: 'Italian', region: 'Italy' },
    { code: 'pt', name: 'Portuguese', region: 'Portugal, Brazil' },
    { code: 'ru', name: 'Russian', region: 'Russia, Eastern Europe' },
    { code: 'zh', name: 'Chinese', region: 'China, Taiwan, Singapore' },
    { code: 'ja', name: 'Japanese', region: 'Japan' },
    { code: 'ko', name: 'Korean', region: 'Korea' },
    { code: 'ar', name: 'Arabic', region: 'Middle East, North Africa' },
    { code: 'hi', name: 'Hindi', region: 'India' },
    { code: 'nl', name: 'Dutch', region: 'Netherlands, Belgium' },
    { code: 'pl', name: 'Polish', region: 'Poland' },
    { code: 'tr', name: 'Turkish', region: 'Turkey' },
  ];

  console.log('\n┌──────────────┬──────────────────────┬─────────────────────────────────┐');
  console.log('│     Code     │       Language       │             Region              │');
  console.log('├──────────────┼──────────────────────┼─────────────────────────────────┤');

  for (const { code, name, region } of supportedLanguages) {
    console.log(
      `│ ${code.padEnd(12)} │ ${name.padEnd(20)} │ ${region.padEnd(31)} │`
    );
  }

  console.log('└──────────────┴──────────────────────┴─────────────────────────────────┘');

  console.log('\n' + '='.repeat(80));
  console.log('Usage Examples');
  console.log('='.repeat(80));

  console.log('\n1. Auto-detect language:');
  console.log('   curl -X POST http://localhost:3000/api/v1/transcribe \\');
  console.log('     -F "audio=@audio.mp3" \\');
  console.log('     -F "language=auto"');

  console.log('\n2. Specific language:');
  console.log('   curl -X POST http://localhost:3000/api/v1/transcribe \\');
  console.log('     -F "audio=@audio.mp3" \\');
  console.log('     -F "language=es"');

  console.log('\n3. Translate to English:');
  console.log('   curl -X POST http://localhost:3000/api/v1/transcribe \\');
  console.log('     -F "audio=@audio.mp3" \\');
  console.log('     -F "language=fr" \\');
  console.log('     -F "task=translate"');

  console.log('\n' + '='.repeat(80));
  console.log('Language Detection Tips');
  console.log('='.repeat(80));

  console.log('\n• Auto-detection works well for clear, single-language audio');
  console.log('• Specify language for better accuracy on noisy audio');
  console.log('• Mixed-language audio: specify dominant language');
  console.log('• Large model (1550M) required for best multi-lingual results');
  console.log('• Translation to English available for all languages');

  console.log('\n' + '='.repeat(80));
  console.log('Multi-Language Demo Complete!');
  console.log('='.repeat(80));
}

multiLanguageDemo().catch((error) => {
  console.error('Multi-language demo failed:', error);
  process.exit(1);
});

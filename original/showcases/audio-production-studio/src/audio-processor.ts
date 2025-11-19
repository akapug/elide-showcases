/**
 * Audio Processor - Core audio loading and processing
 *
 * Demonstrates librosa, pydub, and soundfile used directly in TypeScript!
 * This is uniquely enabled by Elide's polyglot runtime.
 */

// @ts-ignore - Python audio analysis library
import librosa from 'python:librosa';
// @ts-ignore - Python audio manipulation library
import { AudioSegment } from 'python:pydub';
// @ts-ignore - Python audio I/O library
import soundfile from 'python:soundfile';
// @ts-ignore - Numerical computing
import numpy from 'python:numpy';
// @ts-ignore - Scientific computing
import scipy from 'python:scipy';

// ============================================================================
// Types
// ============================================================================

export interface AudioData {
  waveform: any; // NumPy array
  sampleRate: number;
  duration: number;
  channels: number;
  samples: number;
}

export interface AudioFeatures {
  tempo: number;
  key: string;
  energy: number;
  mfcc: any; // NumPy array
  chroma: any;
  spectralCentroid: number;
  zeroCrossingRate: number;
}

export interface ExportOptions {
  format?: 'wav' | 'mp3' | 'flac' | 'ogg';
  bitrate?: string; // '128k', '192k', '256k', '320k'
  sampleRate?: number;
  normalize?: boolean;
}

// ============================================================================
// Audio Processor Class
// ============================================================================

export class AudioProcessor {
  /**
   * Load audio file using librosa
   *
   * This demonstrates Python's librosa.load() called directly from TypeScript!
   */
  async loadAudio(filepath: string, options?: {
    sampleRate?: number;
    mono?: boolean;
    offset?: number;
    duration?: number;
  }): Promise<AudioData> {
    console.log(`[Audio] Loading ${filepath}...`);

    const sr = options?.sampleRate || null; // null = keep original
    const mono = options?.mono ?? false;
    const offset = options?.offset || 0.0;
    const duration = options?.duration || null;

    try {
      // Use Python's librosa.load() directly in TypeScript!
      const [y, sampleRate] = librosa.load(
        filepath,
        sr: sr,
        mono: mono,
        offset: offset,
        duration: duration
      );

      // Get audio properties
      const samples = y.shape[0];
      const audioDuration = samples / sampleRate;
      const channels = y.ndim === 1 ? 1 : y.shape[1];

      console.log(`  Duration: ${audioDuration.toFixed(2)}s`);
      console.log(`  Sample rate: ${sampleRate} Hz`);
      console.log(`  Channels: ${channels}`);
      console.log(`  Samples: ${samples.toLocaleString()}`);

      return {
        waveform: y,
        sampleRate: Number(sampleRate),
        duration: audioDuration,
        channels,
        samples,
      };
    } catch (error) {
      console.error('[Audio] Error loading file:', error);
      throw new Error(`Failed to load audio: ${error}`);
    }
  }

  /**
   * Load audio using pydub (alternative method)
   */
  loadWithPydub(filepath: string): any {
    console.log(`[Audio] Loading with pydub: ${filepath}...`);

    // Use Python's pydub directly in TypeScript!
    const audio = AudioSegment.from_file(filepath);

    console.log(`  Duration: ${audio.duration_seconds.toFixed(2)}s`);
    console.log(`  Sample rate: ${audio.frame_rate} Hz`);
    console.log(`  Channels: ${audio.channels}`);
    console.log(`  Sample width: ${audio.sample_width * 8} bit`);

    return audio;
  }

  /**
   * Extract comprehensive audio features using librosa
   *
   * Demonstrates multiple librosa functions called from TypeScript!
   */
  async extractFeatures(audio: AudioData): Promise<AudioFeatures> {
    console.log('[Audio] Extracting features...');

    const y = audio.waveform;
    const sr = audio.sampleRate;

    // Tempo detection using librosa in TypeScript!
    const [tempo, beats] = librosa.beat.beat_track(y: y, sr: sr);

    console.log(`  Tempo: ${Number(tempo).toFixed(1)} BPM`);

    // MFCC (Mel-frequency cepstral coefficients)
    const mfcc = librosa.feature.mfcc(y: y, sr: sr, n_mfcc: 13);

    // Chroma features (pitch class profiles)
    const chroma = librosa.feature.chroma_stft(y: y, sr: sr);

    // Spectral centroid
    const spectralCentroid = librosa.feature.spectral_centroid(y: y, sr: sr);
    const avgCentroid = Number(numpy.mean(spectralCentroid));

    // Zero crossing rate
    const zcr = librosa.feature.zero_crossing_rate(y);
    const avgZcr = Number(numpy.mean(zcr));

    // Energy
    const energy = Number(numpy.sum(y ** 2) / y.shape[0]);

    // Key detection (simplified)
    const chromaMean = numpy.mean(chroma, axis: 1);
    const keyIdx = Number(numpy.argmax(chromaMean));
    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const key = keys[keyIdx];

    console.log(`  Key: ${key}`);
    console.log(`  Energy: ${energy.toFixed(4)}`);
    console.log(`  Spectral Centroid: ${avgCentroid.toFixed(1)} Hz`);

    return {
      tempo: Number(tempo),
      key,
      energy,
      mfcc,
      chroma,
      spectralCentroid: avgCentroid,
      zeroCrossingRate: avgZcr,
    };
  }

  /**
   * Generate spectrogram using librosa
   */
  generateSpectrogram(audio: AudioData, options?: {
    nFft?: number;
    hopLength?: number;
    windowType?: string;
  }): any {
    console.log('[Audio] Generating spectrogram...');

    const y = audio.waveform;
    const sr = audio.sampleRate;

    const nFft = options?.nFft || 2048;
    const hopLength = options?.hopLength || 512;

    // Short-time Fourier transform using librosa
    const D = librosa.stft(y, n_fft: nFft, hop_length: hopLength);

    // Convert to power spectrogram (magnitude squared)
    const powerSpec = numpy.abs(D) ** 2;

    // Convert to dB scale
    const S_db = librosa.power_to_db(powerSpec, ref: numpy.max);

    console.log(`  Spectrogram shape: ${S_db.shape}`);

    return S_db;
  }

  /**
   * Generate mel spectrogram
   */
  generateMelSpectrogram(audio: AudioData, options?: {
    nMels?: number;
    nFft?: number;
    hopLength?: number;
    fmin?: number;
    fmax?: number;
  }): any {
    console.log('[Audio] Generating mel spectrogram...');

    const y = audio.waveform;
    const sr = audio.sampleRate;

    const nMels = options?.nMels || 128;
    const nFft = options?.nFft || 2048;
    const hopLength = options?.hopLength || 512;
    const fmin = options?.fmin || 0;
    const fmax = options?.fmax || sr / 2;

    // Mel spectrogram using librosa
    const melSpec = librosa.feature.melspectrogram(
      y: y,
      sr: sr,
      n_mels: nMels,
      n_fft: nFft,
      hop_length: hopLength,
      fmin: fmin,
      fmax: fmax
    );

    // Convert to dB
    const melSpec_db = librosa.power_to_db(melSpec, ref: numpy.max);

    console.log(`  Mel spectrogram shape: ${melSpec_db.shape}`);

    return melSpec_db;
  }

  /**
   * Normalize audio
   */
  normalize(audio: AudioData, targetDb: number = -0.1): AudioData {
    console.log(`[Audio] Normalizing to ${targetDb} dB...`);

    const y = audio.waveform;

    // Calculate current peak
    const peak = numpy.abs(y).max();

    // Calculate scaling factor
    const targetLinear = Math.pow(10, targetDb / 20);
    const scale = targetLinear / peak;

    // Apply scaling
    const normalized = y * scale;

    return {
      ...audio,
      waveform: normalized,
    };
  }

  /**
   * Trim silence from beginning and end
   */
  trimSilence(audio: AudioData, topDb: number = 20): AudioData {
    console.log('[Audio] Trimming silence...');

    const y = audio.waveform;

    // Use librosa's trim function
    const [trimmed, indices] = librosa.effects.trim(y, top_db: topDb);

    const originalSamples = y.shape[0];
    const trimmedSamples = trimmed.shape[0];
    const removed = originalSamples - trimmedSamples;

    console.log(`  Removed ${removed} samples (${(removed / audio.sampleRate).toFixed(2)}s)`);

    return {
      ...audio,
      waveform: trimmed,
      samples: trimmedSamples,
      duration: trimmedSamples / audio.sampleRate,
    };
  }

  /**
   * Change sample rate
   */
  resample(audio: AudioData, targetSampleRate: number): AudioData {
    console.log(`[Audio] Resampling ${audio.sampleRate} Hz → ${targetSampleRate} Hz...`);

    const y = audio.waveform;

    // Resample using librosa
    const resampled = librosa.resample(
      y,
      orig_sr: audio.sampleRate,
      target_sr: targetSampleRate
    );

    return {
      ...audio,
      waveform: resampled,
      sampleRate: targetSampleRate,
      samples: resampled.shape[0],
      duration: resampled.shape[0] / targetSampleRate,
    };
  }

  /**
   * Convert stereo to mono
   */
  toMono(audio: AudioData): AudioData {
    if (audio.channels === 1) {
      console.log('[Audio] Already mono');
      return audio;
    }

    console.log('[Audio] Converting to mono...');

    const y = audio.waveform;

    // Average channels using librosa
    const mono = librosa.to_mono(y);

    return {
      ...audio,
      waveform: mono,
      channels: 1,
      samples: mono.shape[0],
    };
  }

  /**
   * Split audio into harmonic and percussive components
   */
  harmonicPercussiveSeparation(audio: AudioData): {
    harmonic: AudioData;
    percussive: AudioData;
  } {
    console.log('[Audio] Harmonic-percussive separation...');

    const y = audio.waveform;

    // Use librosa's HPSS (Harmonic-Percussive Source Separation)
    const [yHarmonic, yPercussive] = librosa.effects.hpss(y);

    console.log('  ✓ Separated into harmonic and percussive components');

    return {
      harmonic: {
        ...audio,
        waveform: yHarmonic,
      },
      percussive: {
        ...audio,
        waveform: yPercussive,
      },
    };
  }

  /**
   * Export audio to file
   */
  async exportAudio(
    audio: AudioData,
    filepath: string,
    options?: ExportOptions
  ): Promise<void> {
    console.log(`[Audio] Exporting to ${filepath}...`);

    const format = options?.format || this.detectFormat(filepath);
    const sampleRate = options?.sampleRate || audio.sampleRate;

    let y = audio.waveform;

    // Normalize if requested
    if (options?.normalize) {
      const normalized = this.normalize(audio);
      y = normalized.waveform;
    }

    // Resample if needed
    if (sampleRate !== audio.sampleRate) {
      const resampled = this.resample(audio, sampleRate);
      y = resampled.waveform;
    }

    try {
      if (format === 'mp3') {
        // Use pydub for MP3 export
        const bitrate = options?.bitrate || '320k';
        await this.exportMP3WithPydub(y, sampleRate, filepath, bitrate);
      } else {
        // Use soundfile for WAV/FLAC/OGG
        soundfile.write(filepath, y, sampleRate);
      }

      console.log(`  ✓ Exported successfully`);
    } catch (error) {
      console.error('[Audio] Export error:', error);
      throw new Error(`Failed to export audio: ${error}`);
    }
  }

  /**
   * Export MP3 using pydub
   */
  private async exportMP3WithPydub(
    waveform: any,
    sampleRate: number,
    filepath: string,
    bitrate: string
  ): Promise<void> {
    // Convert NumPy array to bytes
    const audioBytes = (waveform * 32767).astype('int16').tobytes();

    // Create AudioSegment
    const audio = AudioSegment(
      audioBytes,
      frame_rate: sampleRate,
      sample_width: 2,
      channels: 1
    );

    // Export as MP3
    audio.export(filepath, format: 'mp3', bitrate: bitrate);
  }

  /**
   * Detect format from filename
   */
  private detectFormat(filepath: string): 'wav' | 'mp3' | 'flac' | 'ogg' {
    const ext = filepath.split('.').pop()?.toLowerCase();

    switch (ext) {
      case 'mp3':
        return 'mp3';
      case 'flac':
        return 'flac';
      case 'ogg':
        return 'ogg';
      case 'wav':
      default:
        return 'wav';
    }
  }

  /**
   * Get audio duration without loading entire file
   */
  getAudioDuration(filepath: string): number {
    const audio = AudioSegment.from_file(filepath);
    return audio.duration_seconds;
  }

  /**
   * Get audio info without loading waveform
   */
  getAudioInfo(filepath: string): {
    duration: number;
    sampleRate: number;
    channels: number;
    format: string;
  } {
    const audio = AudioSegment.from_file(filepath);

    return {
      duration: audio.duration_seconds,
      sampleRate: audio.frame_rate,
      channels: audio.channels,
      format: audio.frame_width * 8 + 'bit',
    };
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

export async function loadAudio(filepath: string, sampleRate?: number): Promise<AudioData> {
  const processor = new AudioProcessor();
  return processor.loadAudio(filepath, { sampleRate });
}

export async function extractFeatures(filepath: string): Promise<AudioFeatures> {
  const processor = new AudioProcessor();
  const audio = await processor.loadAudio(filepath);
  return processor.extractFeatures(audio);
}

// ============================================================================
// Example Usage
// ============================================================================

if (import.meta.main) {
  console.log('🎵 Audio Processor Demo\n');

  const processor = new AudioProcessor();

  // Create synthetic audio for demo
  console.log('Creating synthetic audio...\n');

  // Generate 3 seconds of 440Hz sine wave (A4 note)
  const duration = 3.0;
  const sampleRate = 44100;
  const frequency = 440.0;

  const t = numpy.linspace(0, duration, Math.floor(sampleRate * duration), endpoint: false);
  const y = 0.5 * numpy.sin(2 * numpy.pi * frequency * t);

  // Save as WAV
  soundfile.write('/tmp/test-audio.wav', y, sampleRate);

  console.log('✓ Created test audio: /tmp/test-audio.wav\n');

  // Load and analyze
  console.log('1. Loading audio:');
  const audio = await processor.loadAudio('/tmp/test-audio.wav');
  console.log();

  console.log('2. Extracting features:');
  const features = await processor.extractFeatures(audio);
  console.log();

  console.log('3. Generating spectrogram:');
  const spectrogram = processor.generateSpectrogram(audio);
  console.log();

  console.log('4. Generating mel spectrogram:');
  const melSpec = processor.generateMelSpectrogram(audio);
  console.log();

  console.log('5. Normalizing audio:');
  const normalized = processor.normalize(audio, -3.0);
  console.log();

  console.log('6. Exporting:');
  await processor.exportAudio(normalized, '/tmp/test-output.wav');
  console.log();

  console.log('✅ Audio processing demo completed!');
  console.log('\n💡 This demonstrates:');
  console.log('   - librosa.load() in TypeScript');
  console.log('   - librosa feature extraction in TypeScript');
  console.log('   - pydub audio manipulation in TypeScript');
  console.log('   - soundfile I/O in TypeScript');
  console.log('   - Zero-copy NumPy array operations');
  console.log('   - All in one process!');
}

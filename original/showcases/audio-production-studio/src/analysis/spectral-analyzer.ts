/**
 * Spectral Analyzer - FFT, Spectrogram, Pitch Detection
 *
 * Demonstrates librosa spectral analysis in TypeScript
 */

// @ts-ignore - Audio analysis library
import librosa from 'python:librosa';
// @ts-ignore - Numerical computing
import numpy from 'python:numpy';
// @ts-ignore - Scientific computing
import scipy from 'python:scipy';
// @ts-ignore - Plotting (optional)
import matplotlib from 'python:matplotlib';

import type { AudioData } from '../audio-processor';

// ============================================================================
// Types
// ============================================================================

export interface SpectrogramParams {
  nFft?: number;
  hopLength?: number;
  windowType?: string;
  powerToDb?: boolean;
}

export interface MelSpectrogramParams {
  nMels?: number;
  nFft?: number;
  hopLength?: number;
  fmin?: number;
  fmax?: number;
}

export interface PitchDetectionResult {
  f0: number[]; // Fundamental frequency over time
  confidence: number[];
  times: number[];
  averageF0: number;
  note: string;
  octave: number;
}

export interface SpectralFeatures {
  spectralCentroid: number[];
  spectralBandwidth: number[];
  spectralRolloff: number[];
  spectralContrast: number[];
  spectralFlatness: number[];
  zeroCrossingRate: number[];
}

export interface HarmonicAnalysis {
  harmonics: number[]; // Frequency of each harmonic
  amplitudes: number[]; // Amplitude of each harmonic
  f0: number; // Fundamental frequency
  inharmonicity: number;
}

// ============================================================================
// Spectral Analyzer
// ============================================================================

export class SpectralAnalyzer {
  /**
   * Generate spectrogram using librosa
   */
  generateSpectrogram(audio: AudioData, params: SpectrogramParams = {}): any {
    console.log('[Spectral] Generating spectrogram...');

    const {
      nFft = 2048,
      hopLength = 512,
      windowType = 'hann',
      powerToDb = true,
    } = params;

    const y = audio.waveform;
    const sr = audio.sampleRate;

    // Compute STFT using librosa
    const D = librosa.stft(y, n_fft: nFft, hop_length: hopLength, window: windowType);

    // Convert to power spectrogram
    let S = numpy.abs(D) ** 2;

    // Convert to dB if requested
    if (powerToDb) {
      S = librosa.power_to_db(S, ref: numpy.max);
    }

    console.log(`  Spectrogram shape: ${S.shape}`);
    console.log(`  Frequency bins: ${S.shape[0]}`);
    console.log(`  Time frames: ${S.shape[1]}`);

    return S;
  }

  /**
   * Generate mel spectrogram
   */
  generateMelSpectrogram(audio: AudioData, params: MelSpectrogramParams = {}): any {
    console.log('[Spectral] Generating mel spectrogram...');

    const {
      nMels = 128,
      nFft = 2048,
      hopLength = 512,
      fmin = 0,
      fmax,
    } = params;

    const y = audio.waveform;
    const sr = audio.sampleRate;

    // Compute mel spectrogram using librosa
    const melSpec = librosa.feature.melspectrogram(
      y: y,
      sr: sr,
      n_mels: nMels,
      n_fft: nFft,
      hop_length: hopLength,
      fmin: fmin,
      fmax: fmax || sr / 2
    );

    // Convert to dB
    const melSpec_db = librosa.power_to_db(melSpec, ref: numpy.max);

    console.log(`  Mel spectrogram shape: ${melSpec_db.shape}`);
    console.log(`  Mel bins: ${nMels}`);

    return melSpec_db;
  }

  /**
   * Generate chromagram (pitch class profiles)
   */
  generateChromagram(audio: AudioData, params: { hopLength?: number } = {}): any {
    console.log('[Spectral] Generating chromagram...');

    const { hopLength = 512 } = params;

    const y = audio.waveform;
    const sr = audio.sampleRate;

    // Compute chroma features using librosa
    const chroma = librosa.feature.chroma_stft(y: y, sr: sr, hop_length: hopLength);

    console.log(`  Chromagram shape: ${chroma.shape}`);
    console.log(`  Pitch classes: 12 (C, C#, D, ..., B)`);
    console.log(`  Time frames: ${chroma.shape[1]}`);

    return chroma;
  }

  /**
   * Detect pitch using librosa
   */
  detectPitch(
    audio: AudioData,
    params: {
      fmin?: number;
      fmax?: number;
      frameLength?: number;
      hopLength?: number;
    } = {}
  ): PitchDetectionResult {
    console.log('[Spectral] Detecting pitch...');

    const {
      fmin = 80, // Lowest note around E2
      fmax = 800, // Highest note around G5 (adjust for instrument)
      frameLength = 2048,
      hopLength = 512,
    } = params;

    const y = audio.waveform;
    const sr = audio.sampleRate;

    // Use librosa's piptrack for pitch detection
    const [pitches, magnitudes] = librosa.piptrack(
      y: y,
      sr: sr,
      fmin: fmin,
      fmax: fmax,
      n_fft: frameLength,
      hop_length: hopLength
    );

    // Extract pitch with highest magnitude at each frame
    const f0 = [];
    const confidence = [];

    for (let i = 0; i < pitches.shape[1]; i++) {
      const frameIdxs = numpy.argmax(magnitudes.slice(null, i));
      const pitch = Number(pitches[frameIdxs, i]);
      const mag = Number(magnitudes[frameIdxs, i]);

      f0.push(pitch);
      confidence.push(mag);
    }

    // Calculate time axis
    const times = librosa.frames_to_time(
      numpy.arange(f0.length),
      sr: sr,
      hop_length: hopLength
    );

    // Calculate average F0 (excluding zeros)
    const nonzeroF0 = f0.filter(f => f > 0);
    const averageF0 = nonzeroF0.length > 0
      ? nonzeroF0.reduce((a, b) => a + b) / nonzeroF0.length
      : 0;

    // Convert to note name
    const { note, octave } = this.frequencyToNote(averageF0);

    console.log(`  Average F0: ${averageF0.toFixed(2)} Hz`);
    console.log(`  Note: ${note}${octave}`);
    console.log(`  Frames: ${f0.length}`);

    return {
      f0,
      confidence,
      times: Array.from(times),
      averageF0,
      note,
      octave,
    };
  }

  /**
   * Detect pitch using autocorrelation (YIN algorithm)
   */
  detectPitchYIN(
    audio: AudioData,
    params: {
      fmin?: number;
      fmax?: number;
      frameLength?: number;
      hopLength?: number;
    } = {}
  ): PitchDetectionResult {
    console.log('[Spectral] Detecting pitch using YIN algorithm...');

    const {
      fmin = 80,
      fmax = 800,
      frameLength = 2048,
      hopLength = 512,
    } = params;

    const y = audio.waveform;
    const sr = audio.sampleRate;

    // Use librosa's yin for pitch detection
    const f0 = librosa.yin(
      y,
      fmin: fmin,
      fmax: fmax,
      sr: sr,
      frame_length: frameLength,
      hop_length: hopLength
    );

    // Calculate confidence (simple version)
    const confidence = f0.map((freq: number) => freq > 0 ? 0.9 : 0.1);

    // Calculate time axis
    const times = librosa.frames_to_time(
      numpy.arange(f0.shape[0]),
      sr: sr,
      hop_length: hopLength
    );

    // Average F0
    const f0Array = Array.from(f0);
    const nonzeroF0 = f0Array.filter((f: number) => f > 0);
    const averageF0 = nonzeroF0.length > 0
      ? nonzeroF0.reduce((a: number, b: number) => a + b) / nonzeroF0.length
      : 0;

    const { note, octave } = this.frequencyToNote(averageF0);

    console.log(`  Average F0: ${averageF0.toFixed(2)} Hz (YIN)`);
    console.log(`  Note: ${note}${octave}`);

    return {
      f0: f0Array,
      confidence,
      times: Array.from(times),
      averageF0,
      note,
      octave,
    };
  }

  /**
   * Extract comprehensive spectral features
   */
  extractSpectralFeatures(audio: AudioData): SpectralFeatures {
    console.log('[Spectral] Extracting spectral features...');

    const y = audio.waveform;
    const sr = audio.sampleRate;

    // Spectral centroid
    const centroid = librosa.feature.spectral_centroid(y: y, sr: sr);

    // Spectral bandwidth
    const bandwidth = librosa.feature.spectral_bandwidth(y: y, sr: sr);

    // Spectral rolloff
    const rolloff = librosa.feature.spectral_rolloff(y: y, sr: sr);

    // Spectral contrast
    const contrast = librosa.feature.spectral_contrast(y: y, sr: sr);

    // Spectral flatness
    const flatness = librosa.feature.spectral_flatness(y: y);

    // Zero crossing rate
    const zcr = librosa.feature.zero_crossing_rate(y);

    console.log('  ✓ Extracted 6 spectral feature types');

    return {
      spectralCentroid: Array.from(centroid[0]),
      spectralBandwidth: Array.from(bandwidth[0]),
      spectralRolloff: Array.from(rolloff[0]),
      spectralContrast: Array.from(contrast.mean(axis: 0)),
      spectralFlatness: Array.from(flatness[0]),
      zeroCrossingRate: Array.from(zcr[0]),
    };
  }

  /**
   * Analyze harmonics
   */
  analyzeHarmonics(
    audio: AudioData,
    params: {
      f0?: number; // If known, otherwise auto-detect
      numHarmonics?: number;
    } = {}
  ): HarmonicAnalysis {
    console.log('[Spectral] Analyzing harmonics...');

    const { numHarmonics = 10 } = params;

    const y = audio.waveform;
    const sr = audio.sampleRate;

    // Detect F0 if not provided
    let f0 = params.f0;
    if (!f0) {
      const pitchResult = this.detectPitch(audio);
      f0 = pitchResult.averageF0;
    }

    console.log(`  F0: ${f0.toFixed(2)} Hz`);

    // Compute FFT
    const fft = numpy.fft.rfft(y);
    const magnitude = numpy.abs(fft);
    const freqs = numpy.fft.rfftfreq(y.shape[0], 1.0 / sr);

    // Find harmonics
    const harmonics: number[] = [];
    const amplitudes: number[] = [];

    for (let i = 1; i <= numHarmonics; i++) {
      const harmonicFreq = f0 * i;

      // Find closest frequency bin
      const idx = this.findClosestIndex(freqs, harmonicFreq);
      const actualFreq = Number(freqs[idx]);
      const amplitude = Number(magnitude[idx]);

      harmonics.push(actualFreq);
      amplitudes.push(amplitude);

      console.log(`  H${i}: ${actualFreq.toFixed(2)} Hz (${amplitude.toFixed(2)})`);
    }

    // Calculate inharmonicity
    const inharmonicity = this.calculateInharmonicity(harmonics, f0);

    console.log(`  Inharmonicity: ${inharmonicity.toFixed(4)}`);

    return {
      harmonics,
      amplitudes,
      f0,
      inharmonicity,
    };
  }

  /**
   * Onset detection (find note attacks)
   */
  detectOnsets(
    audio: AudioData,
    params: {
      hopLength?: number;
      backtrack?: boolean;
    } = {}
  ): { onsetFrames: any; onsetTimes: any; onsetStrengths: any } {
    console.log('[Spectral] Detecting onsets...');

    const { hopLength = 512, backtrack = true } = params;

    const y = audio.waveform;
    const sr = audio.sampleRate;

    // Calculate onset strength envelope
    const onsetEnv = librosa.onset.onset_strength(y: y, sr: sr, hop_length: hopLength);

    // Detect onset frames
    const onsetFrames = librosa.onset.onset_detect(
      onset_envelope: onsetEnv,
      sr: sr,
      hop_length: hopLength,
      backtrack: backtrack
    );

    // Convert to times
    const onsetTimes = librosa.frames_to_time(onsetFrames, sr: sr, hop_length: hopLength);

    // Get onset strengths
    const onsetStrengths = onsetEnv[onsetFrames];

    console.log(`  Detected ${onsetFrames.shape[0]} onsets`);

    return {
      onsetFrames,
      onsetTimes,
      onsetStrengths,
    };
  }

  /**
   * Beat tracking
   */
  detectBeats(
    audio: AudioData,
    params: {
      startBpm?: number;
      hopLength?: number;
    } = {}
  ): { tempo: number; beats: any; beatTimes: any } {
    console.log('[Spectral] Detecting beats...');

    const { startBpm, hopLength = 512 } = params;

    const y = audio.waveform;
    const sr = audio.sampleRate;

    // Detect tempo and beats
    const [tempo, beats] = librosa.beat.beat_track(
      y: y,
      sr: sr,
      hop_length: hopLength,
      start_bpm: startBpm
    );

    // Convert beat frames to times
    const beatTimes = librosa.frames_to_time(beats, sr: sr, hop_length: hopLength);

    console.log(`  Tempo: ${Number(tempo).toFixed(2)} BPM`);
    console.log(`  Beats: ${beats.shape[0]}`);

    return {
      tempo: Number(tempo),
      beats,
      beatTimes,
    };
  }

  /**
   * Estimate tempo using multiple methods
   */
  estimateTempo(audio: AudioData): {
    tempo: number;
    tempos: number[]; // Multiple tempo hypotheses
    strengths: number[];
  } {
    console.log('[Spectral] Estimating tempo...');

    const y = audio.waveform;
    const sr = audio.sampleRate;

    // Use librosa's tempo estimation with aggregation
    const [tempo, beats] = librosa.beat.beat_track(y: y, sr: sr);

    // Get tempo with multiple hypotheses
    const onsetEnv = librosa.onset.onset_strength(y: y, sr: sr);
    const tempoHypotheses = librosa.beat.tempo(
      onset_envelope: onsetEnv,
      sr: sr,
      aggregate: null // Return all hypotheses
    );

    const tempos = Array.from(tempoHypotheses);
    const strengths = tempos.map(() => 1.0); // Simplified

    console.log(`  Primary tempo: ${Number(tempo).toFixed(2)} BPM`);
    console.log(`  Hypotheses: ${tempos.length}`);

    return {
      tempo: Number(tempo),
      tempos,
      strengths,
    };
  }

  /**
   * Constant-Q transform (better for music analysis)
   */
  computeCQT(
    audio: AudioData,
    params: {
      hopLength?: number;
      fmin?: number;
      nBins?: number;
      binsPerOctave?: number;
    } = {}
  ): any {
    console.log('[Spectral] Computing Constant-Q Transform...');

    const {
      hopLength = 512,
      fmin = librosa.note_to_hz('C1'),
      nBins = 84,
      binsPerOctave = 12,
    } = params;

    const y = audio.waveform;
    const sr = audio.sampleRate;

    // Compute CQT
    const C = librosa.cqt(
      y,
      sr: sr,
      hop_length: hopLength,
      fmin: fmin,
      n_bins: nBins,
      bins_per_octave: binsPerOctave
    );

    // Convert to dB
    const C_db = librosa.amplitude_to_db(numpy.abs(C), ref: numpy.max);

    console.log(`  CQT shape: ${C_db.shape}`);
    console.log(`  Frequency bins: ${nBins}`);
    console.log(`  Bins per octave: ${binsPerOctave}`);

    return C_db;
  }

  /**
   * Tonnetz (tonal centroid features)
   */
  computeTonnetz(audio: AudioData): any {
    console.log('[Spectral] Computing tonnetz features...');

    const y = audio.waveform;
    const sr = audio.sampleRate;

    // Compute chroma first
    const chroma = librosa.feature.chroma_cqt(y: y, sr: sr);

    // Compute tonnetz
    const tonnetz = librosa.feature.tonnetz(chroma: chroma);

    console.log(`  Tonnetz shape: ${tonnetz.shape}`);
    console.log('  6 tonal centroids over time');

    return tonnetz;
  }

  /**
   * Save spectrogram as image
   */
  async saveSpectrogramImage(
    spectrogram: any,
    filepath: string,
    params: {
      sr?: number;
      hopLength?: number;
      yAxis?: string;
      cmap?: string;
    } = {}
  ): Promise<void> {
    console.log(`[Spectral] Saving spectrogram to ${filepath}...`);

    const {
      sr = 22050,
      hopLength = 512,
      yAxis = 'hz',
      cmap = 'magma',
    } = params;

    // Use matplotlib to save
    matplotlib.use('Agg'); // Non-interactive backend

    const plt = matplotlib.pyplot;

    plt.figure(figsize: [12, 6]);

    librosa.display.specshow(
      spectrogram,
      sr: sr,
      hop_length: hopLength,
      x_axis: 'time',
      y_axis: yAxis,
      cmap: cmap
    );

    plt.colorbar(format: '%+2.0f dB');
    plt.title('Spectrogram');
    plt.tight_layout();
    plt.savefig(filepath, dpi: 150);
    plt.close();

    console.log('  ✓ Saved');
  }

  /**
   * Convert frequency to note name
   */
  private frequencyToNote(frequency: number): { note: string; octave: number } {
    if (frequency === 0) {
      return { note: 'N/A', octave: 0 };
    }

    // A4 = 440 Hz
    const A4 = 440;
    const C0 = A4 * Math.pow(2, -4.75);

    const halfSteps = 12 * Math.log2(frequency / C0);
    const octave = Math.floor(halfSteps / 12);
    const noteIdx = Math.round(halfSteps % 12);

    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const note = notes[noteIdx];

    return { note, octave };
  }

  /**
   * Find closest index in array
   */
  private findClosestIndex(array: any, target: number): number {
    const diffs = numpy.abs(array - target);
    return Number(numpy.argmin(diffs));
  }

  /**
   * Calculate inharmonicity
   */
  private calculateInharmonicity(harmonics: number[], f0: number): number {
    // Measure deviation from perfect harmonic ratios
    let totalDeviation = 0;

    for (let i = 0; i < harmonics.length; i++) {
      const idealHarmonic = f0 * (i + 1);
      const actualHarmonic = harmonics[i];
      const deviation = Math.abs(actualHarmonic - idealHarmonic) / idealHarmonic;
      totalDeviation += deviation;
    }

    return totalDeviation / harmonics.length;
  }

  /**
   * Analyze spectral centroid over time
   */
  analyzeBrightness(audio: AudioData): {
    centroid: any;
    times: any;
    averageBrightness: number;
  } {
    console.log('[Spectral] Analyzing brightness (spectral centroid)...');

    const y = audio.waveform;
    const sr = audio.sampleRate;

    const hopLength = 512;

    // Compute spectral centroid
    const centroid = librosa.feature.spectral_centroid(
      y: y,
      sr: sr,
      hop_length: hopLength
    )[0];

    // Time axis
    const times = librosa.frames_to_time(
      numpy.arange(centroid.shape[0]),
      sr: sr,
      hop_length: hopLength
    );

    // Average brightness
    const averageBrightness = Number(numpy.mean(centroid));

    console.log(`  Average brightness: ${averageBrightness.toFixed(2)} Hz`);

    return {
      centroid,
      times,
      averageBrightness,
    };
  }

  /**
   * Detect key (musical key)
   */
  detectKey(audio: AudioData): {
    key: string;
    mode: 'major' | 'minor';
    confidence: number;
  } {
    console.log('[Spectral] Detecting musical key...');

    const y = audio.waveform;
    const sr = audio.sampleRate;

    // Compute chroma
    const chroma = librosa.feature.chroma_cqt(y: y, sr: sr);

    // Average chroma over time
    const chromaMean = numpy.mean(chroma, axis: 1);

    // Find dominant pitch class
    const dominantIdx = Number(numpy.argmax(chromaMean));

    const pitchClasses = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const key = pitchClasses[dominantIdx];

    // Determine major/minor (simplified)
    // Check if minor third is strong
    const minorThirdIdx = (dominantIdx + 3) % 12;
    const majorThirdIdx = (dominantIdx + 4) % 12;

    const minorThirdStrength = Number(chromaMean[minorThirdIdx]);
    const majorThirdStrength = Number(chromaMean[majorThirdIdx]);

    const mode = minorThirdStrength > majorThirdStrength ? 'minor' : 'major';

    // Confidence (simplified)
    const maxStrength = Number(numpy.max(chromaMean));
    const avgStrength = Number(numpy.mean(chromaMean));
    const confidence = (maxStrength - avgStrength) / maxStrength;

    console.log(`  Key: ${key} ${mode}`);
    console.log(`  Confidence: ${(confidence * 100).toFixed(1)}%`);

    return {
      key,
      mode,
      confidence,
    };
  }

  /**
   * Spectral flux (measure of spectral change)
   */
  computeSpectralFlux(audio: AudioData): {
    flux: any;
    times: any;
    averageFlux: number;
  } {
    console.log('[Spectral] Computing spectral flux...');

    const y = audio.waveform;
    const sr = audio.sampleRate;

    const hopLength = 512;

    // Compute STFT
    const S = librosa.stft(y, hop_length: hopLength);
    const magnitude = numpy.abs(S);

    // Calculate flux (difference between consecutive frames)
    const diff = numpy.diff(magnitude, axis: 1);
    const flux = numpy.sqrt(numpy.sum(diff ** 2, axis: 0));

    // Time axis
    const times = librosa.frames_to_time(
      numpy.arange(flux.shape[0]),
      sr: sr,
      hop_length: hopLength
    );

    const averageFlux = Number(numpy.mean(flux));

    console.log(`  Average spectral flux: ${averageFlux.toFixed(4)}`);

    return {
      flux,
      times,
      averageFlux,
    };
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

export function generateSpectrogram(audio: AudioData): any {
  const analyzer = new SpectralAnalyzer();
  return analyzer.generateSpectrogram(audio);
}

export function detectPitch(audio: AudioData): PitchDetectionResult {
  const analyzer = new SpectralAnalyzer();
  return analyzer.detectPitch(audio);
}

export function extractSpectralFeatures(audio: AudioData): SpectralFeatures {
  const analyzer = new SpectralAnalyzer();
  return analyzer.extractSpectralFeatures(audio);
}

// ============================================================================
// Example Usage
// ============================================================================

if (import.meta.main) {
  console.log('🎵 Spectral Analyzer Demo\n');

  console.log('Spectral analysis capabilities:');
  console.log('  - FFT spectrogram');
  console.log('  - Mel spectrogram');
  console.log('  - Chromagram (pitch classes)');
  console.log('  - Pitch detection (piptrack, YIN)');
  console.log('  - Harmonic analysis');
  console.log('  - Onset detection');
  console.log('  - Beat tracking');
  console.log('  - Tempo estimation');
  console.log('  - Constant-Q transform');
  console.log('  - Tonnetz features');
  console.log('  - Key detection');
  console.log('  - Spectral features (centroid, bandwidth, rolloff, etc.)');

  console.log('\n💡 This demonstrates:');
  console.log('   - librosa.stft() in TypeScript');
  console.log('   - librosa spectral features in TypeScript');
  console.log('   - librosa onset/beat detection in TypeScript');
  console.log('   - NumPy FFT operations');
  console.log('   - matplotlib visualization in TypeScript');
  console.log('   - All Python audio analysis in one TypeScript process!');
}

/**
 * Mastering Chain - Professional mastering pipeline
 *
 * Complete mastering workflow using Python audio libraries in TypeScript
 */

// @ts-ignore - Numerical computing
import numpy from 'python:numpy';
// @ts-ignore - Scientific computing
import scipy from 'python:scipy';
// @ts-ignore - Audio analysis
import librosa from 'python:librosa';

import type { AudioData } from '../audio-processor';
import { EqualizerProcessor, type EQBand } from '../effects/eq';
import { DynamicsProcessor, type CompressorParams, type LimiterParams } from '../effects/dynamics';
import { ReverbProcessor } from '../effects/reverb';

// ============================================================================
// Types
// ============================================================================

export interface MasteringPreset {
  name: string;
  eq: EQBand[];
  compression: CompressorParams;
  limiting: LimiterParams;
  stereoEnhancement: number; // 0-1
  loudnessTarget: number; // LUFS
}

export interface MasteringOptions {
  targetLoudness?: number; // LUFS (-14 for streaming, -9 for CD)
  targetPeak?: number; // dB true peak
  enableEQ?: boolean;
  enableCompression?: boolean;
  enableLimiting?: boolean;
  enableStereoEnhancement?: boolean;
  dither?: boolean;
}

export interface LoudnessMetrics {
  integratedLoudness: number; // LUFS
  loudnessRange: number; // LU
  truePeak: number; // dB
  momentaryMax: number; // LUFS
  shortTermMax: number; // LUFS
}

export interface MasteringReport {
  input: LoudnessMetrics;
  output: LoudnessMetrics;
  processing: {
    eqApplied: boolean;
    compressionApplied: boolean;
    limitingApplied: boolean;
    stereoEnhanced: boolean;
  };
  duration: number;
  sampleRate: number;
}

// ============================================================================
// Mastering Presets
// ============================================================================

export const MASTERING_PRESETS: Record<string, MasteringPreset> = {
  streaming: {
    name: 'Streaming (Spotify, Apple Music)',
    eq: [
      { type: 'highpass', frequency: 30, q: 0.7 },
      { type: 'lowshelf', frequency: 100, gain: 0.5, q: 0.7 },
      { type: 'peak', frequency: 3000, gain: 0.5, q: 1.5 },
      { type: 'highshelf', frequency: 10000, gain: 1.0, q: 0.7 },
    ],
    compression: {
      threshold: -12,
      ratio: 1.5,
      attack: 30,
      release: 200,
      knee: 6,
    },
    limiting: {
      threshold: -1.0,
      release: 50,
    },
    stereoEnhancement: 0.2,
    loudnessTarget: -14, // LUFS for streaming
  },

  cd: {
    name: 'CD Master',
    eq: [
      { type: 'highpass', frequency: 30, q: 0.7 },
      { type: 'lowshelf', frequency: 80, gain: 1.0, q: 0.7 },
      { type: 'peak', frequency: 3000, gain: 1.0, q: 1.5 },
      { type: 'highshelf', frequency: 12000, gain: 1.5, q: 0.7 },
    ],
    compression: {
      threshold: -10,
      ratio: 2.0,
      attack: 30,
      release: 180,
      knee: 6,
    },
    limiting: {
      threshold: -0.3,
      release: 50,
    },
    stereoEnhancement: 0.3,
    loudnessTarget: -9, // LUFS for CD
  },

  vinyl: {
    name: 'Vinyl Master',
    eq: [
      { type: 'highpass', frequency: 40, q: 0.7 },
      { type: 'lowshelf', frequency: 100, gain: -1.0, q: 0.7 }, // Reduce bass for vinyl
      { type: 'peak', frequency: 2500, gain: 1.0, q: 1.5 },
      { type: 'highshelf', frequency: 10000, gain: -0.5, q: 0.7 }, // Gentle high rolloff
    ],
    compression: {
      threshold: -15,
      ratio: 1.8,
      attack: 40,
      release: 200,
      knee: 8,
    },
    limiting: {
      threshold: -2.0,
      release: 80,
    },
    stereoEnhancement: 0.1, // Less wide for vinyl
    loudnessTarget: -16, // LUFS (vinyl has more dynamic range)
  },

  podcast: {
    name: 'Podcast/Voice',
    eq: [
      { type: 'highpass', frequency: 80, q: 0.7 },
      { type: 'peak', frequency: 200, gain: -2.0, q: 1.0 }, // Reduce muddiness
      { type: 'peak', frequency: 3000, gain: 2.0, q: 1.5 }, // Clarity
      { type: 'peak', frequency: 8000, gain: 1.5, q: 1.0 }, // Presence
    ],
    compression: {
      threshold: -20,
      ratio: 3.0,
      attack: 10,
      release: 100,
      knee: 6,
    },
    limiting: {
      threshold: -1.5,
      release: 50,
    },
    stereoEnhancement: 0.0, // Mono for podcast
    loudnessTarget: -16, // LUFS for podcast
  },

  audiophile: {
    name: 'Audiophile (High Dynamic Range)',
    eq: [
      { type: 'highpass', frequency: 20, q: 0.7 },
      { type: 'lowshelf', frequency: 60, gain: 0.3, q: 0.7 },
      { type: 'highshelf', frequency: 12000, gain: 0.5, q: 0.7 },
    ],
    compression: {
      threshold: -18,
      ratio: 1.3,
      attack: 50,
      release: 250,
      knee: 8,
    },
    limiting: {
      threshold: -3.0,
      release: 100,
    },
    stereoEnhancement: 0.15,
    loudnessTarget: -18, // LUFS (preserve dynamics)
  },
};

// ============================================================================
// Mastering Chain
// ============================================================================

export class MasteringChain {
  private eqProcessor = new EqualizerProcessor();
  private dynamicsProcessor = new DynamicsProcessor();
  private reverbProcessor = new ReverbProcessor();

  /**
   * Master audio using preset
   */
  masterWithPreset(audio: AudioData, presetName: keyof typeof MASTERING_PRESETS): AudioData {
    const preset = MASTERING_PRESETS[presetName];

    console.log(`[Mastering] Applying preset: ${preset.name}`);

    return this.master(audio, {
      targetLoudness: preset.loudnessTarget,
      targetPeak: preset.limiting.threshold,
    }, preset);
  }

  /**
   * Complete mastering chain
   */
  master(
    audio: AudioData,
    options: MasteringOptions = {},
    preset?: MasteringPreset
  ): AudioData {
    console.log('[Mastering] Starting mastering chain...');

    const {
      targetLoudness = -14,
      targetPeak = -1.0,
      enableEQ = true,
      enableCompression = true,
      enableLimiting = true,
      enableStereoEnhancement = true,
      dither = false,
    } = options;

    let mastered = audio;

    // 1. Input analysis
    console.log('\n1. Analyzing input...');
    const inputMetrics = this.measureLoudness(mastered);
    this.printLoudnessMetrics('Input', inputMetrics);

    // 2. High-pass filter (remove DC offset and subsonic)
    console.log('\n2. Applying high-pass filter...');
    mastered = this.applyHighPassFilter(mastered, 20);

    // 3. EQ
    if (enableEQ && preset) {
      console.log('\n3. Applying mastering EQ...');
      mastered = this.eqProcessor.applyEQ(mastered, { bands: preset.eq });
    } else {
      console.log('\n3. Skipping EQ');
    }

    // 4. Stereo enhancement
    if (enableStereoEnhancement && preset && mastered.channels === 2) {
      console.log('\n4. Applying stereo enhancement...');
      mastered = this.enhanceStereo(mastered, preset.stereoEnhancement);
    } else {
      console.log('\n4. Skipping stereo enhancement');
    }

    // 5. Multiband compression (optional)
    if (enableCompression && preset) {
      console.log('\n5. Applying compression...');
      mastered = this.dynamicsProcessor.applyCompression(mastered, preset.compression);
    } else {
      console.log('\n5. Skipping compression');
    }

    // 6. Loudness normalization
    console.log('\n6. Normalizing loudness...');
    mastered = this.normalizeLoudness(mastered, targetLoudness);

    // 7. Limiting (prevent clipping)
    if (enableLimiting && preset) {
      console.log('\n7. Applying limiting...');
      mastered = this.dynamicsProcessor.applyLimiter(mastered, preset.limiting);
    } else {
      console.log('\n7. Skipping limiting');
    }

    // 8. True peak limiting
    console.log('\n8. True peak limiting...');
    mastered = this.truePeakLimit(mastered, targetPeak);

    // 9. Dithering (if reducing bit depth)
    if (dither) {
      console.log('\n9. Applying dither...');
      mastered = this.applyDither(mastered);
    } else {
      console.log('\n9. Skipping dither');
    }

    // 10. Output analysis
    console.log('\n10. Analyzing output...');
    const outputMetrics = this.measureLoudness(mastered);
    this.printLoudnessMetrics('Output', outputMetrics);

    console.log('\n✓ Mastering complete');

    return mastered;
  }

  /**
   * Measure loudness (simplified LUFS calculation)
   */
  measureLoudness(audio: AudioData): LoudnessMetrics {
    const y = audio.waveform;

    // True peak
    const truePeak = Number(numpy.abs(y).max());
    const truePeakDb = 20 * Math.log10(truePeak);

    // Integrated loudness (simplified - not true ITU-R BS.1770)
    // In production, would use pyloudnorm library
    const rms = Number(numpy.sqrt(numpy.mean(y ** 2)));
    const integratedLoudness = 20 * Math.log10(rms + 1e-10) + 3.0; // Rough LUFS approximation

    // Loudness range (simplified)
    const loudnessRange = 10.0; // Placeholder

    // Momentary and short-term (simplified)
    const momentaryMax = integratedLoudness + 2.0;
    const shortTermMax = integratedLoudness + 1.5;

    return {
      integratedLoudness,
      loudnessRange,
      truePeak: truePeakDb,
      momentaryMax,
      shortTermMax,
    };
  }

  /**
   * Print loudness metrics
   */
  private printLoudnessMetrics(label: string, metrics: LoudnessMetrics): void {
    console.log(`  ${label} metrics:`);
    console.log(`    Integrated loudness: ${metrics.integratedLoudness.toFixed(1)} LUFS`);
    console.log(`    Loudness range: ${metrics.loudnessRange.toFixed(1)} LU`);
    console.log(`    True peak: ${metrics.truePeak.toFixed(2)} dBTP`);
    console.log(`    Momentary max: ${metrics.momentaryMax.toFixed(1)} LUFS`);
    console.log(`    Short-term max: ${metrics.shortTermMax.toFixed(1)} LUFS`);
  }

  /**
   * Apply high-pass filter
   */
  private applyHighPassFilter(audio: AudioData, cutoff: number): AudioData {
    const y = audio.waveform;
    const sr = audio.sampleRate;

    // Design Butterworth high-pass filter
    const sos = scipy.signal.butter(4, cutoff, 'high', fs: sr, output: 'sos');

    // Apply filter
    const filtered = scipy.signal.sosfilt(sos, y);

    return {
      ...audio,
      waveform: filtered,
    };
  }

  /**
   * Enhance stereo width
   */
  private enhanceStereo(audio: AudioData, amount: number): AudioData {
    if (audio.channels !== 2) {
      return audio;
    }

    const y = audio.waveform;

    // Extract left and right channels
    const left = y.slice(null, 0);
    const right = y.slice(null, 1);

    // Calculate mid and side
    const mid = (left + right) / 2.0;
    const side = (left - right) / 2.0;

    // Enhance side signal
    const enhancedSide = side * (1.0 + amount);

    // Reconstruct stereo
    const newLeft = mid + enhancedSide;
    const newRight = mid - enhancedSide;

    // Combine
    const enhanced = numpy.stack([newLeft, newRight], axis: 1);

    return {
      ...audio,
      waveform: enhanced,
    };
  }

  /**
   * Normalize to target loudness
   */
  private normalizeLoudness(audio: AudioData, targetLUFS: number): AudioData {
    const currentMetrics = this.measureLoudness(audio);
    const currentLUFS = currentMetrics.integratedLoudness;

    // Calculate required gain
    const gainDb = targetLUFS - currentLUFS;
    const gainLinear = Math.pow(10, gainDb / 20);

    console.log(`  Current: ${currentLUFS.toFixed(1)} LUFS`);
    console.log(`  Target: ${targetLUFS.toFixed(1)} LUFS`);
    console.log(`  Gain: ${gainDb.toFixed(2)} dB`);

    const y = audio.waveform * gainLinear;

    return {
      ...audio,
      waveform: y,
    };
  }

  /**
   * True peak limiting
   */
  private truePeakLimit(audio: AudioData, targetPeakDb: number): AudioData {
    const y = audio.waveform;

    // Calculate current true peak
    const currentPeak = Number(numpy.abs(y).max());
    const currentPeakDb = 20 * Math.log10(currentPeak);

    if (currentPeakDb <= targetPeakDb) {
      console.log(`  Peak already below target (${currentPeakDb.toFixed(2)} dB)`);
      return audio;
    }

    // Calculate required gain reduction
    const gainDb = targetPeakDb - currentPeakDb;
    const gainLinear = Math.pow(10, gainDb / 20);

    console.log(`  Reducing peak: ${currentPeakDb.toFixed(2)} dB → ${targetPeakDb.toFixed(2)} dB`);

    const limited = y * gainLinear;

    return {
      ...audio,
      waveform: limited,
    };
  }

  /**
   * Apply dither
   */
  private applyDither(audio: AudioData, bitDepth: number = 16): AudioData {
    const y = audio.waveform;

    // TPDF dither
    const ditherAmount = 1.0 / Math.pow(2, bitDepth);
    const dither1 = numpy.random.uniform(-ditherAmount, ditherAmount, y.shape);
    const dither2 = numpy.random.uniform(-ditherAmount, ditherAmount, y.shape);
    const tpdfDither = (dither1 + dither2) / 2;

    const dithered = y + tpdfDither;

    return {
      ...audio,
      waveform: dithered,
    };
  }

  /**
   * Mid-side processing
   */
  midSideProcess(
    audio: AudioData,
    midProcessor: (audio: AudioData) => AudioData,
    sideProcessor: (audio: AudioData) => AudioData
  ): AudioData {
    console.log('[Mastering] Mid-side processing...');

    if (audio.channels !== 2) {
      console.warn('Mid-side processing requires stereo audio');
      return audio;
    }

    const y = audio.waveform;

    // Extract left and right
    const left = y.slice(null, 0);
    const right = y.slice(null, 1);

    // Convert to mid-side
    const mid = (left + right) / 2.0;
    const side = (left - right) / 2.0;

    // Process mid and side separately
    const midAudio: AudioData = {
      ...audio,
      waveform: mid,
      channels: 1,
    };

    const sideAudio: AudioData = {
      ...audio,
      waveform: side,
      channels: 1,
    };

    const processedMid = midProcessor(midAudio).waveform;
    const processedSide = sideProcessor(sideAudio).waveform;

    // Convert back to stereo
    const newLeft = processedMid + processedSide;
    const newRight = processedMid - processedSide;

    const stereo = numpy.stack([newLeft, newRight], axis: 1);

    console.log('  ✓ Mid-side processing complete');

    return {
      ...audio,
      waveform: stereo,
    };
  }

  /**
   * Multiband mastering
   */
  multibandMaster(
    audio: AudioData,
    bands: {
      low: { crossover: number; eq?: EQBand[]; compression?: CompressorParams };
      mid: { crossover: number; eq?: EQBand[]; compression?: CompressorParams };
      high: { eq?: EQBand[]; compression?: CompressorParams };
    }
  ): AudioData {
    console.log('[Mastering] Multiband mastering...');

    const y = audio.waveform;
    const sr = audio.sampleRate;

    // Split into bands
    const { low, mid, high } = this.splitIntoBands(
      y,
      sr,
      bands.low.crossover,
      bands.mid.crossover
    );

    // Process low band
    let processedLow: AudioData = { ...audio, waveform: low };
    if (bands.low.eq) {
      processedLow = this.eqProcessor.applyEQ(processedLow, { bands: bands.low.eq });
    }
    if (bands.low.compression) {
      processedLow = this.dynamicsProcessor.applyCompression(processedLow, bands.low.compression);
    }

    // Process mid band
    let processedMid: AudioData = { ...audio, waveform: mid };
    if (bands.mid.eq) {
      processedMid = this.eqProcessor.applyEQ(processedMid, { bands: bands.mid.eq });
    }
    if (bands.mid.compression) {
      processedMid = this.dynamicsProcessor.applyCompression(processedMid, bands.mid.compression);
    }

    // Process high band
    let processedHigh: AudioData = { ...audio, waveform: high };
    if (bands.high.eq) {
      processedHigh = this.eqProcessor.applyEQ(processedHigh, { bands: bands.high.eq });
    }
    if (bands.high.compression) {
      processedHigh = this.dynamicsProcessor.applyCompression(processedHigh, bands.high.compression);
    }

    // Recombine
    const combined = processedLow.waveform + processedMid.waveform + processedHigh.waveform;

    console.log('  ✓ Multiband mastering complete');

    return {
      ...audio,
      waveform: combined,
    };
  }

  /**
   * Split audio into frequency bands
   */
  private splitIntoBands(
    signal: any,
    sampleRate: number,
    lowCrossover: number,
    midCrossover: number
  ): { low: any; mid: any; high: any } {
    // Low band: < lowCrossover
    const sosLow = scipy.signal.butter(4, lowCrossover, 'low', fs: sampleRate, output: 'sos');
    const low = scipy.signal.sosfilt(sosLow, signal);

    // High band: > midCrossover
    const sosHigh = scipy.signal.butter(4, midCrossover, 'high', fs: sampleRate, output: 'sos');
    const high = scipy.signal.sosfilt(sosHigh, signal);

    // Mid band: lowCrossover - midCrossover
    const sosMid = scipy.signal.butter(
      4,
      [lowCrossover, midCrossover],
      'bandpass',
      fs: sampleRate,
      output: 'sos'
    );
    const mid = scipy.signal.sosfilt(sosMid, signal);

    return { low, mid, high };
  }

  /**
   * Reference matching
   */
  matchReference(
    audio: AudioData,
    reference: AudioData
  ): AudioData {
    console.log('[Mastering] Matching reference track...');

    // Match EQ
    const matched = this.eqProcessor.matchEQ(audio, reference, 10);

    // Match loudness
    const refMetrics = this.measureLoudness(reference);
    const finalMastered = this.normalizeLoudness(matched, refMetrics.integratedLoudness);

    console.log('  ✓ Reference matching complete');

    return finalMastered;
  }

  /**
   * Generate mastering report
   */
  generateReport(
    inputAudio: AudioData,
    outputAudio: AudioData,
    options: MasteringOptions
  ): MasteringReport {
    const inputMetrics = this.measureLoudness(inputAudio);
    const outputMetrics = this.measureLoudness(outputAudio);

    return {
      input: inputMetrics,
      output: outputMetrics,
      processing: {
        eqApplied: options.enableEQ ?? true,
        compressionApplied: options.enableCompression ?? true,
        limitingApplied: options.enableLimiting ?? true,
        stereoEnhanced: options.enableStereoEnhancement ?? true,
      },
      duration: outputAudio.duration,
      sampleRate: outputAudio.sampleRate,
    };
  }

  /**
   * Print mastering report
   */
  printReport(report: MasteringReport): void {
    console.log('\n📊 Mastering Report');
    console.log('===================\n');

    console.log('Input:');
    console.log(`  Integrated loudness: ${report.input.integratedLoudness.toFixed(1)} LUFS`);
    console.log(`  True peak: ${report.input.truePeak.toFixed(2)} dBTP`);
    console.log(`  Loudness range: ${report.input.loudnessRange.toFixed(1)} LU`);

    console.log('\nOutput:');
    console.log(`  Integrated loudness: ${report.output.integratedLoudness.toFixed(1)} LUFS`);
    console.log(`  True peak: ${report.output.truePeak.toFixed(2)} dBTP`);
    console.log(`  Loudness range: ${report.output.loudnessRange.toFixed(1)} LU`);

    console.log('\nProcessing:');
    console.log(`  EQ: ${report.processing.eqApplied ? '✓' : '✗'}`);
    console.log(`  Compression: ${report.processing.compressionApplied ? '✓' : '✗'}`);
    console.log(`  Limiting: ${report.processing.limitingApplied ? '✓' : '✗'}`);
    console.log(`  Stereo enhancement: ${report.processing.stereoEnhanced ? '✓' : '✗'}`);

    console.log('\nAudio info:');
    console.log(`  Duration: ${report.duration.toFixed(2)} seconds`);
    console.log(`  Sample rate: ${report.sampleRate} Hz`);

    console.log('\n' + '='.repeat(50));
  }

  /**
   * Stem mastering (master multiple stems together)
   */
  masterStems(stems: { name: string; audio: AudioData }[], options: MasteringOptions = {}): AudioData {
    console.log('[Mastering] Mastering stems...');

    // Find max duration
    let maxDuration = 0;
    let sampleRate = 44100;

    for (const stem of stems) {
      if (stem.audio.duration > maxDuration) {
        maxDuration = stem.audio.duration;
      }
      sampleRate = stem.audio.sampleRate;
    }

    const totalSamples = Math.ceil(maxDuration * sampleRate);
    let summed = numpy.zeros(totalSamples);

    // Sum all stems
    for (const stem of stems) {
      console.log(`  Adding stem: ${stem.name}`);
      const y = stem.audio.waveform;
      summed.slice(0, y.shape[0]) += y;
    }

    // Create combined audio
    const combined: AudioData = {
      waveform: summed,
      sampleRate,
      duration: maxDuration,
      channels: 1,
      samples: totalSamples,
    };

    // Master the combined stems
    const mastered = this.master(combined, options);

    console.log('  ✓ Stem mastering complete');

    return mastered;
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

export function masterAudio(audio: AudioData, preset: keyof typeof MASTERING_PRESETS): AudioData {
  const chain = new MasteringChain();
  return chain.masterWithPreset(audio, preset);
}

// ============================================================================
// Example Usage
// ============================================================================

if (import.meta.main) {
  console.log('🎵 Mastering Chain Demo\n');

  console.log('Available mastering presets:');
  for (const [key, preset] of Object.entries(MASTERING_PRESETS)) {
    console.log(`\n${key.toUpperCase()}: ${preset.name}`);
    console.log(`  Target loudness: ${preset.loudnessTarget} LUFS`);
    console.log(`  Compression ratio: ${preset.compression.ratio}:1`);
    console.log(`  EQ bands: ${preset.eq.length}`);
    console.log(`  Stereo enhancement: ${(preset.stereoEnhancement * 100).toFixed(0)}%`);
  }

  console.log('\n💡 This demonstrates:');
  console.log('   - Complete mastering pipeline in TypeScript');
  console.log('   - scipy.signal filters for EQ and crossovers');
  console.log('   - NumPy for loudness analysis');
  console.log('   - Multiband processing');
  console.log('   - Mid-side processing');
  console.log('   - Reference matching');
  console.log('   - All using Python libraries in TypeScript!');
}

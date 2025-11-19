/**
 * Dynamics Processing - Compressor, Limiter, Gate, Expander
 *
 * Demonstrates scipy.signal for envelope detection and NumPy for dynamics
 */

// @ts-ignore - Scientific computing
import scipy from 'python:scipy';
// @ts-ignore - Numerical computing
import numpy from 'python:numpy';

import type { AudioData } from '../audio-processor';

// ============================================================================
// Types
// ============================================================================

export interface CompressorParams {
  threshold: number; // dB
  ratio: number; // 2:1, 4:1, 10:1, etc.
  attack: number; // milliseconds
  release: number; // milliseconds
  knee: number; // dB (0 = hard knee)
  makeupGain?: number; // dB
  lookAhead?: number; // milliseconds
}

export interface LimiterParams {
  threshold: number; // dB
  release: number; // milliseconds
  lookAhead?: number; // milliseconds
}

export interface GateParams {
  threshold: number; // dB
  ratio: number; // Usually high like 10:1 or inf:1
  attack: number; // milliseconds
  release: number; // milliseconds
  hold: number; // milliseconds
  range?: number; // dB (max attenuation)
}

export interface ExpanderParams {
  threshold: number; // dB
  ratio: number; // < 1:1 for expansion
  attack: number; // milliseconds
  release: number; // milliseconds
  knee: number; // dB
}

export interface MultibandCompressorParams {
  low: CompressorParams & { crossover: number };
  mid: CompressorParams & { crossover: number };
  high: CompressorParams;
}

// ============================================================================
// Presets
// ============================================================================

export const COMPRESSOR_PRESETS = {
  gentle: {
    threshold: -20,
    ratio: 2,
    attack: 10,
    release: 100,
    knee: 6,
  } as CompressorParams,
  moderate: {
    threshold: -15,
    ratio: 4,
    attack: 5,
    release: 80,
    knee: 3,
  } as CompressorParams,
  aggressive: {
    threshold: -12,
    ratio: 8,
    attack: 2,
    release: 50,
    knee: 0,
  } as CompressorParams,
  vocal: {
    threshold: -18,
    ratio: 3,
    attack: 8,
    release: 120,
    knee: 4,
  } as CompressorParams,
  drums: {
    threshold: -10,
    ratio: 6,
    attack: 1,
    release: 40,
    knee: 1,
  } as CompressorParams,
  mastering: {
    threshold: -6,
    ratio: 1.5,
    attack: 30,
    release: 200,
    knee: 6,
  } as CompressorParams,
};

// ============================================================================
// Dynamics Processor
// ============================================================================

export class DynamicsProcessor {
  /**
   * Apply compression
   *
   * Uses scipy.signal for envelope detection
   */
  applyCompression(audio: AudioData, params: CompressorParams): AudioData {
    console.log('[Dynamics] Applying compression...');
    console.log(`  Threshold: ${params.threshold} dB`);
    console.log(`  Ratio: ${params.ratio}:1`);
    console.log(`  Attack: ${params.attack}ms, Release: ${params.release}ms`);

    const y = audio.waveform;
    const sr = audio.sampleRate;

    // Extract envelope
    const envelope = this.extractEnvelope(y, sr);

    // Convert to dB
    const envelope_db = 20 * numpy.log10(envelope + 1e-10);

    // Calculate gain reduction
    const gainReduction = this.calculateCompressionGain(
      envelope_db,
      params.threshold,
      params.ratio,
      params.knee
    );

    // Apply attack and release
    const smoothedGain = this.applyAttackRelease(
      gainReduction,
      sr,
      params.attack,
      params.release
    );

    // Convert to linear
    const gainLinear = numpy.power(10, smoothedGain / 20);

    // Apply gain
    let output = y * gainLinear;

    // Apply makeup gain if specified
    if (params.makeupGain) {
      const makeupLinear = Math.pow(10, params.makeupGain / 20);
      output = output * makeupLinear;
    } else {
      // Auto makeup gain
      const avgReduction = Number(numpy.mean(gainReduction));
      if (avgReduction < 0) {
        const autoMakeup = -avgReduction * 0.7; // Compensate 70%
        output = output * Math.pow(10, autoMakeup / 20);
      }
    }

    // Normalize to prevent clipping
    const maxVal = Number(numpy.abs(output).max());
    if (maxVal > 1.0) {
      output = output / maxVal;
    }

    console.log('  ✓ Compression applied');

    return {
      ...audio,
      waveform: output,
    };
  }

  /**
   * Apply limiter
   *
   * Brick-wall limiting to prevent peaks above threshold
   */
  applyLimiter(audio: AudioData, params: LimiterParams): AudioData {
    console.log('[Dynamics] Applying limiter...');
    console.log(`  Threshold: ${params.threshold} dB`);
    console.log(`  Release: ${params.release}ms`);

    const y = audio.waveform;
    const sr = audio.sampleRate;

    // Limiter is just a compressor with very high ratio
    const compressorParams: CompressorParams = {
      threshold: params.threshold,
      ratio: 100, // Brick-wall
      attack: 0.1, // Very fast attack
      release: params.release,
      knee: 0, // Hard knee
      lookAhead: params.lookAhead,
    };

    const limited = this.applyCompression(audio, compressorParams);

    console.log('  ✓ Limiter applied');

    return limited;
  }

  /**
   * Apply noise gate
   */
  applyGate(audio: AudioData, params: GateParams): AudioData {
    console.log('[Dynamics] Applying noise gate...');
    console.log(`  Threshold: ${params.threshold} dB`);
    console.log(`  Attack: ${params.attack}ms, Release: ${params.release}ms`);

    const y = audio.waveform;
    const sr = audio.sampleRate;

    // Extract envelope
    const envelope = this.extractEnvelope(y, sr);
    const envelope_db = 20 * numpy.log10(envelope + 1e-10);

    // Calculate gate gain
    const range = params.range || -80; // Default max attenuation
    const gainReduction = numpy.where(
      envelope_db < params.threshold,
      range, // Attenuate
      0.0  // Pass through
    );

    // Apply attack, hold, and release
    const smoothedGain = this.applyGateEnvelope(
      gainReduction,
      sr,
      params.attack,
      params.hold,
      params.release
    );

    // Convert to linear
    const gainLinear = numpy.power(10, smoothedGain / 20);

    // Apply
    const output = y * gainLinear;

    console.log('  ✓ Gate applied');

    return {
      ...audio,
      waveform: output,
    };
  }

  /**
   * Apply expander
   *
   * Reduces level of signals below threshold (opposite of compressor)
   */
  applyExpander(audio: AudioData, params: ExpanderParams): AudioData {
    console.log('[Dynamics] Applying expander...');
    console.log(`  Threshold: ${params.threshold} dB`);
    console.log(`  Ratio: 1:${params.ratio}`);

    const y = audio.waveform;
    const sr = audio.sampleRate;

    // Extract envelope
    const envelope = this.extractEnvelope(y, sr);
    const envelope_db = 20 * numpy.log10(envelope + 1e-10);

    // Calculate expansion gain
    const gainReduction = this.calculateExpansionGain(
      envelope_db,
      params.threshold,
      params.ratio,
      params.knee
    );

    // Apply attack and release
    const smoothedGain = this.applyAttackRelease(
      gainReduction,
      sr,
      params.attack,
      params.release
    );

    // Convert to linear and apply
    const gainLinear = numpy.power(10, smoothedGain / 20);
    const output = y * gainLinear;

    console.log('  ✓ Expander applied');

    return {
      ...audio,
      waveform: output,
    };
  }

  /**
   * Multiband compressor
   *
   * Splits audio into frequency bands and compresses each separately
   */
  applyMultibandCompression(
    audio: AudioData,
    params: MultibandCompressorParams
  ): AudioData {
    console.log('[Dynamics] Applying multiband compression...');

    const y = audio.waveform;
    const sr = audio.sampleRate;

    // Split into bands
    const { low, mid, high } = this.splitIntoBands(
      y,
      sr,
      params.low.crossover,
      params.mid.crossover
    );

    console.log(`  Low band (< ${params.low.crossover}Hz)`);
    const lowCompressed = this.applyCompression(
      { ...audio, waveform: low },
      params.low
    );

    console.log(`  Mid band (${params.low.crossover}-${params.mid.crossover}Hz)`);
    const midCompressed = this.applyCompression(
      { ...audio, waveform: mid },
      params.mid
    );

    console.log(`  High band (> ${params.mid.crossover}Hz)`);
    const highCompressed = this.applyCompression(
      { ...audio, waveform: high },
      params.high
    );

    // Recombine bands
    const output = lowCompressed.waveform + midCompressed.waveform + highCompressed.waveform;

    console.log('  ✓ Multiband compression applied');

    return {
      ...audio,
      waveform: output,
    };
  }

  /**
   * Extract envelope using Hilbert transform
   */
  private extractEnvelope(signal: any, sampleRate: number): any {
    // Use scipy.signal Hilbert transform for envelope detection
    const analyticSignal = scipy.signal.hilbert(signal);
    const envelope = numpy.abs(analyticSignal);

    // Smooth envelope
    const windowSize = Math.floor(sampleRate * 0.001); // 1ms
    if (windowSize > 1) {
      const window = numpy.ones(windowSize) / windowSize;
      return numpy.convolve(envelope, window, mode: 'same');
    }

    return envelope;
  }

  /**
   * Calculate compression gain reduction
   */
  private calculateCompressionGain(
    level_db: any,
    threshold: number,
    ratio: number,
    knee: number
  ): any {
    if (knee === 0) {
      // Hard knee
      const excess = level_db - threshold;
      return numpy.where(
        excess > 0,
        -excess * (1 - 1 / ratio),
        0.0
      );
    } else {
      // Soft knee
      const excess = level_db - threshold;
      const kneeHalf = knee / 2;

      // Below knee
      const belowKnee = numpy.zeros_like(level_db);

      // In knee
      const inKnee = numpy.where(
        numpy.logical_and(excess > -kneeHalf, excess <= kneeHalf),
        -(excess + kneeHalf) ** 2 / (2 * knee) * (1 - 1 / ratio),
        0.0
      );

      // Above knee
      const aboveKnee = numpy.where(
        excess > kneeHalf,
        -excess * (1 - 1 / ratio),
        0.0
      );

      return belowKnee + inKnee + aboveKnee;
    }
  }

  /**
   * Calculate expansion gain
   */
  private calculateExpansionGain(
    level_db: any,
    threshold: number,
    ratio: number,
    knee: number
  ): any {
    if (knee === 0) {
      // Hard knee
      const excess = threshold - level_db; // Note: reversed for expansion
      return numpy.where(
        excess > 0,
        -excess * (ratio - 1),
        0.0
      );
    } else {
      // Soft knee
      const excess = threshold - level_db;
      const kneeHalf = knee / 2;

      const inKnee = numpy.where(
        numpy.logical_and(excess > -kneeHalf, excess <= kneeHalf),
        -(excess + kneeHalf) ** 2 / (2 * knee) * (ratio - 1),
        0.0
      );

      const aboveKnee = numpy.where(
        excess > kneeHalf,
        -excess * (ratio - 1),
        0.0
      );

      return inKnee + aboveKnee;
    }
  }

  /**
   * Apply attack and release envelope smoothing
   */
  private applyAttackRelease(
    gainReduction: any,
    sampleRate: number,
    attackMs: number,
    releaseMs: number
  ): any {
    // Convert time constants to samples
    const attackSamples = Math.max(1, Math.floor(attackMs * sampleRate / 1000));
    const releaseSamples = Math.max(1, Math.floor(releaseMs * sampleRate / 1000));

    // Calculate alpha coefficients
    const attackAlpha = Math.exp(-1 / attackSamples);
    const releaseAlpha = Math.exp(-1 / releaseSamples);

    // Apply envelope follower
    const smoothed = numpy.zeros_like(gainReduction);
    let state = 0.0;

    for (let i = 0; i < gainReduction.shape[0]; i++) {
      const target = Number(gainReduction[i]);

      if (target < state) {
        // Attack (gain reduction increasing)
        state = attackAlpha * state + (1 - attackAlpha) * target;
      } else {
        // Release (gain reduction decreasing)
        state = releaseAlpha * state + (1 - releaseAlpha) * target;
      }

      smoothed[i] = state;
    }

    return smoothed;
  }

  /**
   * Apply gate envelope (with hold time)
   */
  private applyGateEnvelope(
    gainReduction: any,
    sampleRate: number,
    attackMs: number,
    holdMs: number,
    releaseMs: number
  ): any {
    const attackSamples = Math.max(1, Math.floor(attackMs * sampleRate / 1000));
    const holdSamples = Math.floor(holdMs * sampleRate / 1000);
    const releaseSamples = Math.max(1, Math.floor(releaseMs * sampleRate / 1000));

    const attackAlpha = Math.exp(-1 / attackSamples);
    const releaseAlpha = Math.exp(-1 / releaseSamples);

    const smoothed = numpy.zeros_like(gainReduction);
    let state = Number(gainReduction[0]);
    let holdCounter = 0;

    for (let i = 0; i < gainReduction.shape[0]; i++) {
      const target = Number(gainReduction[i]);

      if (target < state) {
        // Opening gate (less attenuation)
        state = attackAlpha * state + (1 - attackAlpha) * target;
        holdCounter = holdSamples;
      } else if (holdCounter > 0) {
        // Hold (maintain current level)
        holdCounter--;
      } else {
        // Closing gate (more attenuation)
        state = releaseAlpha * state + (1 - releaseAlpha) * target;
      }

      smoothed[i] = state;
    }

    return smoothed;
  }

  /**
   * Split audio into frequency bands using scipy filters
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
   * Parallel compression (New York compression)
   */
  applyParallelCompression(
    audio: AudioData,
    params: CompressorParams & { mix: number }
  ): AudioData {
    console.log('[Dynamics] Applying parallel compression...');

    const y = audio.waveform;

    // Compress a copy
    const compressed = this.applyCompression(audio, params);

    // Mix with original
    const mix = params.mix || 0.5;
    const output = (1 - mix) * y + mix * compressed.waveform;

    console.log(`  Mix: ${(mix * 100).toFixed(0)}% compressed`);
    console.log('  ✓ Parallel compression applied');

    return {
      ...audio,
      waveform: output,
    };
  }

  /**
   * Sidechain compression
   *
   * Compress main signal based on sidechain signal level
   */
  applySidechainCompression(
    audio: AudioData,
    sidechainAudio: AudioData,
    params: CompressorParams
  ): AudioData {
    console.log('[Dynamics] Applying sidechain compression...');

    const y = audio.waveform;
    const sidechain = sidechainAudio.waveform;
    const sr = audio.sampleRate;

    // Extract envelope from sidechain
    const envelope = this.extractEnvelope(sidechain, sr);
    const envelope_db = 20 * numpy.log10(envelope + 1e-10);

    // Calculate gain reduction based on sidechain
    const gainReduction = this.calculateCompressionGain(
      envelope_db,
      params.threshold,
      params.ratio,
      params.knee
    );

    // Apply attack and release
    const smoothedGain = this.applyAttackRelease(
      gainReduction,
      sr,
      params.attack,
      params.release
    );

    // Apply gain to main signal
    const gainLinear = numpy.power(10, smoothedGain / 20);
    const output = y * gainLinear;

    console.log('  ✓ Sidechain compression applied');

    return {
      ...audio,
      waveform: output,
    };
  }

  /**
   * De-esser using dynamic EQ
   */
  deEss(
    audio: AudioData,
    params: {
      frequency?: number;
      threshold?: number;
      ratio?: number;
      q?: number;
    } = {}
  ): AudioData {
    console.log('[Dynamics] Applying de-esser...');

    const {
      frequency = 6000,
      threshold = -20,
      ratio = 4,
      q = 2.0,
    } = params;

    const y = audio.waveform;
    const sr = audio.sampleRate;

    // Extract sibilance band using bandpass filter
    const bandwidth = frequency / q;
    const lowFreq = frequency - bandwidth / 2;
    const highFreq = frequency + bandwidth / 2;

    const sos = scipy.signal.butter(
      2,
      [lowFreq, highFreq],
      'bandpass',
      fs: sr,
      output: 'sos'
    );

    const sibilanceBand = scipy.signal.sosfilt(sos, y);

    // Compress sibilance band
    const compressedSibilance = this.applyCompression(
      { ...audio, waveform: sibilanceBand },
      {
        threshold,
        ratio,
        attack: 1,
        release: 50,
        knee: 2,
      }
    );

    // Reconstruct: remove original sibilance, add compressed
    const output = y - sibilanceBand + compressedSibilance.waveform;

    console.log('  ✓ De-esser applied');

    return {
      ...audio,
      waveform: output,
    };
  }

  /**
   * Apply preset compressor
   */
  applyPreset(audio: AudioData, presetName: keyof typeof COMPRESSOR_PRESETS): AudioData {
    const preset = COMPRESSOR_PRESETS[presetName];
    console.log(`[Dynamics] Applying preset: ${presetName}`);
    return this.applyCompression(audio, preset);
  }

  /**
   * Analyze dynamics (get gain reduction curve)
   */
  analyzeDynamics(audio: AudioData, params: CompressorParams): {
    envelope_db: any;
    gainReduction_db: any;
    output_db: any;
  } {
    const y = audio.waveform;
    const sr = audio.sampleRate;

    // Extract envelope
    const envelope = this.extractEnvelope(y, sr);
    const envelope_db = 20 * numpy.log10(envelope + 1e-10);

    // Calculate gain reduction
    const gainReduction = this.calculateCompressionGain(
      envelope_db,
      params.threshold,
      params.ratio,
      params.knee
    );

    // Apply smoothing
    const smoothedGain = this.applyAttackRelease(
      gainReduction,
      sr,
      params.attack,
      params.release
    );

    // Output level
    const output_db = envelope_db + smoothedGain;

    return {
      envelope_db,
      gainReduction_db: smoothedGain,
      output_db,
    };
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

export function applyCompression(audio: AudioData, params: CompressorParams): AudioData {
  const processor = new DynamicsProcessor();
  return processor.applyCompression(audio, params);
}

export function applyLimiter(audio: AudioData, params: LimiterParams): AudioData {
  const processor = new DynamicsProcessor();
  return processor.applyLimiter(audio, params);
}

export function applyGate(audio: AudioData, params: GateParams): AudioData {
  const processor = new DynamicsProcessor();
  return processor.applyGate(audio, params);
}

// ============================================================================
// Example Usage
// ============================================================================

if (import.meta.main) {
  console.log('🎵 Dynamics Processing Demo\n');

  console.log('Available compressor presets:');
  for (const [name, preset] of Object.entries(COMPRESSOR_PRESETS)) {
    console.log(`\n${name.toUpperCase()}:`);
    console.log(`  Threshold: ${preset.threshold} dB`);
    console.log(`  Ratio: ${preset.ratio}:1`);
    console.log(`  Attack: ${preset.attack}ms`);
    console.log(`  Release: ${preset.release}ms`);
    console.log(`  Knee: ${preset.knee} dB`);
  }

  console.log('\n💡 This demonstrates:');
  console.log('   - scipy.signal Hilbert transform for envelope detection');
  console.log('   - NumPy array operations for gain calculation');
  console.log('   - Compression, limiting, gating, expansion');
  console.log('   - Multiband compression with scipy filters');
  console.log('   - Sidechain compression');
  console.log('   - All in TypeScript using Python libraries!');
}

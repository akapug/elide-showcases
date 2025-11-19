/**
 * Parametric Equalizer - Multi-band EQ with scipy filters
 *
 * Demonstrates scipy.signal filter design directly in TypeScript
 */

// @ts-ignore - Scientific computing with signal processing
import scipy from 'python:scipy';
// @ts-ignore - Numerical computing
import numpy from 'python:numpy';

import type { AudioData } from '../audio-processor';

// ============================================================================
// Types
// ============================================================================

export type FilterType = 'peak' | 'lowshelf' | 'highshelf' | 'lowpass' | 'highpass' | 'bandpass' | 'notch';

export interface EQBand {
  type: FilterType;
  frequency: number; // Hz
  gain?: number; // dB (for peak, shelf filters)
  q?: number; // Quality factor (bandwidth)
}

export interface EQParams {
  bands: EQBand[];
}

export interface GraphicEQParams {
  bands: {
    frequency: number;
    gain: number; // dB
  }[];
}

// ============================================================================
// EQ Presets
// ============================================================================

export const EQ_PRESETS = {
  mastering: [
    { type: 'highpass' as FilterType, frequency: 30, q: 0.7 }, // Remove sub-bass rumble
    { type: 'lowshelf' as FilterType, frequency: 100, gain: 1.5, q: 0.7 }, // Bass warmth
    { type: 'peak' as FilterType, frequency: 3000, gain: 1.0, q: 1.5 }, // Presence
    { type: 'highshelf' as FilterType, frequency: 10000, gain: 2.0, q: 0.7 }, // Air
  ],
  vocal: [
    { type: 'highpass' as FilterType, frequency: 80, q: 0.7 }, // Remove low rumble
    { type: 'peak' as FilterType, frequency: 200, gain: -3.0, q: 1.0 }, // Reduce muddiness
    { type: 'peak' as FilterType, frequency: 3000, gain: 3.0, q: 1.5 }, // Clarity
    { type: 'peak' as FilterType, frequency: 8000, gain: 2.0, q: 1.0 }, // Presence
  ],
  bass: [
    { type: 'lowshelf' as FilterType, frequency: 80, gain: 3.0, q: 0.7 }, // Sub boost
    { type: 'peak' as FilterType, frequency: 200, gain: -2.0, q: 1.0 }, // Reduce boom
    { type: 'peak' as FilterType, frequency: 2500, gain: 2.0, q: 1.5 }, // Attack/definition
    { type: 'highpass' as FilterType, frequency: 40, q: 0.7 }, // Clean up sub
  ],
  drums: [
    { type: 'lowshelf' as FilterType, frequency: 100, gain: 2.0, q: 0.7 }, // Kick weight
    { type: 'peak' as FilterType, frequency: 250, gain: -2.0, q: 1.0 }, // Reduce boominess
    { type: 'peak' as FilterType, frequency: 3500, gain: 3.0, q: 1.5 }, // Snare crack
    { type: 'highshelf' as FilterType, frequency: 8000, gain: 2.5, q: 0.7 }, // Cymbals
  ],
  radio: [
    { type: 'highpass' as FilterType, frequency: 300, q: 0.7 },
    { type: 'lowpass' as FilterType, frequency: 3000, q: 0.7 },
    { type: 'peak' as FilterType, frequency: 1500, gain: 4.0, q: 1.0 },
  ],
};

// ============================================================================
// Equalizer Processor
// ============================================================================

export class EqualizerProcessor {
  /**
   * Apply parametric EQ
   *
   * Uses scipy.signal filter design
   */
  applyEQ(audio: AudioData, params: EQParams): AudioData {
    console.log(`[EQ] Applying ${params.bands.length} EQ bands...`);

    let y = audio.waveform;
    const sr = audio.sampleRate;

    // Apply each band sequentially
    for (const band of params.bands) {
      console.log(`  ${band.type} @ ${band.frequency}Hz, gain: ${band.gain || 0}dB, Q: ${band.q || 1.0}`);
      y = this.applyBand(y, sr, band);
    }

    console.log('  ✓ EQ applied');

    return {
      ...audio,
      waveform: y,
    };
  }

  /**
   * Apply single EQ band
   */
  private applyBand(signal: any, sampleRate: number, band: EQBand): any {
    const { type, frequency, gain = 0, q = 1.0 } = band;

    switch (type) {
      case 'peak':
        return this.applyPeakFilter(signal, sampleRate, frequency, gain, q);
      case 'lowshelf':
        return this.applyLowShelf(signal, sampleRate, frequency, gain, q);
      case 'highshelf':
        return this.applyHighShelf(signal, sampleRate, frequency, gain, q);
      case 'lowpass':
        return this.applyLowPass(signal, sampleRate, frequency, q);
      case 'highpass':
        return this.applyHighPass(signal, sampleRate, frequency, q);
      case 'bandpass':
        return this.applyBandPass(signal, sampleRate, frequency, q);
      case 'notch':
        return this.applyNotch(signal, sampleRate, frequency, q);
      default:
        return signal;
    }
  }

  /**
   * Peak filter (bell curve)
   *
   * Uses scipy.signal IIR filter design
   */
  private applyPeakFilter(
    signal: any,
    sampleRate: number,
    frequency: number,
    gain: number,
    q: number
  ): any {
    // Convert gain from dB to linear
    const A = Math.pow(10, gain / 40);

    // Design peaking filter
    const w0 = 2 * Math.PI * frequency / sampleRate;
    const alpha = Math.sin(w0) / (2 * q);

    // Filter coefficients (biquad)
    const b0 = 1 + alpha * A;
    const b1 = -2 * Math.cos(w0);
    const b2 = 1 - alpha * A;
    const a0 = 1 + alpha / A;
    const a1 = -2 * Math.cos(w0);
    const a2 = 1 - alpha / A;

    // Normalize
    const b = numpy.array([b0 / a0, b1 / a0, b2 / a0]);
    const a = numpy.array([1.0, a1 / a0, a2 / a0]);

    // Apply filter using scipy
    const filtered = scipy.signal.lfilter(b, a, signal);

    return filtered;
  }

  /**
   * Low shelf filter
   */
  private applyLowShelf(
    signal: any,
    sampleRate: number,
    frequency: number,
    gain: number,
    q: number
  ): any {
    const A = Math.pow(10, gain / 40);
    const w0 = 2 * Math.PI * frequency / sampleRate;
    const alpha = Math.sin(w0) / (2 * q);

    const sqrtA = Math.sqrt(A);

    // Low shelf coefficients
    const b0 = A * ((A + 1) - (A - 1) * Math.cos(w0) + 2 * sqrtA * alpha);
    const b1 = 2 * A * ((A - 1) - (A + 1) * Math.cos(w0));
    const b2 = A * ((A + 1) - (A - 1) * Math.cos(w0) - 2 * sqrtA * alpha);
    const a0 = (A + 1) + (A - 1) * Math.cos(w0) + 2 * sqrtA * alpha;
    const a1 = -2 * ((A - 1) + (A + 1) * Math.cos(w0));
    const a2 = (A + 1) + (A - 1) * Math.cos(w0) - 2 * sqrtA * alpha;

    const b = numpy.array([b0 / a0, b1 / a0, b2 / a0]);
    const a = numpy.array([1.0, a1 / a0, a2 / a0]);

    return scipy.signal.lfilter(b, a, signal);
  }

  /**
   * High shelf filter
   */
  private applyHighShelf(
    signal: any,
    sampleRate: number,
    frequency: number,
    gain: number,
    q: number
  ): any {
    const A = Math.pow(10, gain / 40);
    const w0 = 2 * Math.PI * frequency / sampleRate;
    const alpha = Math.sin(w0) / (2 * q);

    const sqrtA = Math.sqrt(A);

    // High shelf coefficients
    const b0 = A * ((A + 1) + (A - 1) * Math.cos(w0) + 2 * sqrtA * alpha);
    const b1 = -2 * A * ((A - 1) + (A + 1) * Math.cos(w0));
    const b2 = A * ((A + 1) + (A - 1) * Math.cos(w0) - 2 * sqrtA * alpha);
    const a0 = (A + 1) - (A - 1) * Math.cos(w0) + 2 * sqrtA * alpha;
    const a1 = 2 * ((A - 1) - (A + 1) * Math.cos(w0));
    const a2 = (A + 1) - (A - 1) * Math.cos(w0) - 2 * sqrtA * alpha;

    const b = numpy.array([b0 / a0, b1 / a0, b2 / a0]);
    const a = numpy.array([1.0, a1 / a0, a2 / a0]);

    return scipy.signal.lfilter(b, a, signal);
  }

  /**
   * Low-pass filter (Butterworth)
   */
  private applyLowPass(
    signal: any,
    sampleRate: number,
    frequency: number,
    q: number
  ): any {
    // Design butterworth low-pass using scipy
    const order = Math.max(2, Math.floor(q * 4));

    const sos = scipy.signal.butter(
      order,
      frequency,
      'low',
      fs: sampleRate,
      output: 'sos'
    );

    return scipy.signal.sosfilt(sos, signal);
  }

  /**
   * High-pass filter (Butterworth)
   */
  private applyHighPass(
    signal: any,
    sampleRate: number,
    frequency: number,
    q: number
  ): any {
    const order = Math.max(2, Math.floor(q * 4));

    const sos = scipy.signal.butter(
      order,
      frequency,
      'high',
      fs: sampleRate,
      output: 'sos'
    );

    return scipy.signal.sosfilt(sos, signal);
  }

  /**
   * Band-pass filter
   */
  private applyBandPass(
    signal: any,
    sampleRate: number,
    frequency: number,
    q: number
  ): any {
    // Calculate bandwidth from Q
    const bandwidth = frequency / q;
    const lowFreq = frequency - bandwidth / 2;
    const highFreq = frequency + bandwidth / 2;

    const sos = scipy.signal.butter(
      2,
      [lowFreq, highFreq],
      'bandpass',
      fs: sampleRate,
      output: 'sos'
    );

    return scipy.signal.sosfilt(sos, signal);
  }

  /**
   * Notch filter (band-stop)
   */
  private applyNotch(
    signal: any,
    sampleRate: number,
    frequency: number,
    q: number
  ): any {
    // Design notch filter using scipy.signal.iirnotch
    const w0 = frequency / (sampleRate / 2);
    const b, a = scipy.signal.iirnotch(w0, q);

    return scipy.signal.lfilter(b, a, signal);
  }

  /**
   * Apply EQ preset
   */
  applyPreset(audio: AudioData, presetName: keyof typeof EQ_PRESETS): AudioData {
    const bands = EQ_PRESETS[presetName];

    console.log(`[EQ] Applying preset: ${presetName}`);

    return this.applyEQ(audio, { bands });
  }

  /**
   * Graphic EQ (31-band or custom)
   *
   * Standard graphic EQ with fixed frequency bands
   */
  applyGraphicEQ(audio: AudioData, params: GraphicEQParams): AudioData {
    console.log(`[EQ] Applying graphic EQ with ${params.bands.length} bands...`);

    // Convert to parametric EQ bands
    const eqBands: EQBand[] = params.bands.map(band => ({
      type: 'peak' as FilterType,
      frequency: band.frequency,
      gain: band.gain,
      q: 1.4, // Typical Q for graphic EQ
    }));

    return this.applyEQ(audio, { bands: eqBands });
  }

  /**
   * Create standard 31-band graphic EQ
   */
  createGraphicEQ31Band(gains: number[]): GraphicEQParams {
    // Standard ISO 31-band frequencies
    const frequencies = [
      20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500,
      630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000,
      10000, 12500, 16000, 20000,
    ];

    if (gains.length !== frequencies.length) {
      throw new Error(`Expected ${frequencies.length} gain values, got ${gains.length}`);
    }

    return {
      bands: frequencies.map((freq, i) => ({
        frequency: freq,
        gain: gains[i],
      })),
    };
  }

  /**
   * Create standard 10-band graphic EQ
   */
  createGraphicEQ10Band(gains: number[]): GraphicEQParams {
    // Standard 10-band frequencies
    const frequencies = [31, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

    if (gains.length !== frequencies.length) {
      throw new Error(`Expected ${frequencies.length} gain values, got ${gains.length}`);
    }

    return {
      bands: frequencies.map((freq, i) => ({
        frequency: freq,
        gain: gains[i],
      })),
    };
  }

  /**
   * Calculate frequency response of EQ
   */
  calculateFrequencyResponse(
    params: EQParams,
    sampleRate: number,
    numPoints: number = 1000
  ): { frequencies: any; response: any } {
    console.log('[EQ] Calculating frequency response...');

    // Create impulse
    const impulse = numpy.zeros(numPoints);
    impulse[0] = 1.0;

    // Apply all EQ bands
    let filtered = impulse;
    for (const band of params.bands) {
      filtered = this.applyBand(filtered, sampleRate, band);
    }

    // FFT to get frequency response
    const fft = numpy.fft.rfft(filtered);
    const magnitude = numpy.abs(fft);
    const response_db = 20 * numpy.log10(magnitude + 1e-10);

    // Frequency axis
    const frequencies = numpy.fft.rfftfreq(numPoints, 1.0 / sampleRate);

    return { frequencies, response: response_db };
  }

  /**
   * Auto-EQ to match target curve
   */
  autoEQ(
    audio: AudioData,
    targetCurve: { frequency: number; gain: number }[]
  ): AudioData {
    console.log('[EQ] Applying auto-EQ...');

    // Analyze current frequency response
    const current = this.analyzeFrequencyResponse(audio);

    // Calculate required adjustments
    const bands: EQBand[] = targetCurve.map(target => {
      // Find closest frequency in current response
      const currentGain = this.interpolateGain(current, target.frequency);

      // Calculate required gain
      const requiredGain = target.gain - currentGain;

      return {
        type: 'peak' as FilterType,
        frequency: target.frequency,
        gain: requiredGain,
        q: 1.5,
      };
    });

    return this.applyEQ(audio, { bands });
  }

  /**
   * Analyze frequency response of audio
   */
  private analyzeFrequencyResponse(audio: AudioData): any {
    const y = audio.waveform;
    const sr = audio.sampleRate;

    // Take FFT of entire signal
    const fft = numpy.fft.rfft(y);
    const magnitude = numpy.abs(fft);
    const response_db = 20 * numpy.log10(magnitude + 1e-10);

    const frequencies = numpy.fft.rfftfreq(y.shape[0], 1.0 / sr);

    return { frequencies, response: response_db };
  }

  /**
   * Interpolate gain at specific frequency
   */
  private interpolateGain(response: any, targetFreq: number): number {
    const frequencies = response.frequencies;
    const gains = response.response;

    // Find nearest frequencies
    const idx = numpy.searchsorted(frequencies, targetFreq);

    if (idx === 0) {
      return Number(gains[0]);
    } else if (idx >= frequencies.shape[0]) {
      return Number(gains[-1]);
    } else {
      // Linear interpolation
      const f1 = Number(frequencies[idx - 1]);
      const f2 = Number(frequencies[idx]);
      const g1 = Number(gains[idx - 1]);
      const g2 = Number(gains[idx]);

      const t = (targetFreq - f1) / (f2 - f1);
      return g1 + t * (g2 - g1);
    }
  }

  /**
   * Match EQ to reference track
   */
  matchEQ(
    audio: AudioData,
    referenceAudio: AudioData,
    numBands: number = 10
  ): AudioData {
    console.log('[EQ] Matching EQ to reference...');

    // Analyze both tracks
    const sourceResponse = this.analyzeFrequencyResponse(audio);
    const refResponse = this.analyzeFrequencyResponse(referenceAudio);

    // Sample frequencies logarithmically
    const minFreq = 20;
    const maxFreq = 20000;
    const frequencies = numpy.logspace(
      Math.log10(minFreq),
      Math.log10(maxFreq),
      numBands
    );

    // Calculate required gain at each frequency
    const bands: EQBand[] = [];

    for (let i = 0; i < numBands; i++) {
      const freq = Number(frequencies[i]);
      const sourceGain = this.interpolateGain(sourceResponse, freq);
      const refGain = this.interpolateGain(refResponse, freq);

      const requiredGain = refGain - sourceGain;

      bands.push({
        type: 'peak',
        frequency: freq,
        gain: requiredGain,
        q: 1.5,
      });
    }

    console.log(`  Calculated ${bands.length} correction bands`);

    return this.applyEQ(audio, { bands });
  }

  /**
   * De-esser (reduce sibilance)
   */
  deEss(
    audio: AudioData,
    params: {
      frequency?: number; // Center frequency of sibilance
      threshold?: number; // dB
      reduction?: number; // dB
      q?: number;
    } = {}
  ): AudioData {
    console.log('[EQ] Applying de-esser...');

    const {
      frequency = 6000,
      threshold = -20,
      reduction = -6,
      q = 2.0,
    } = params;

    const y = audio.waveform;
    const sr = audio.sampleRate;

    // Extract sibilance band
    const sibilanceBand = this.applyBandPass(y, sr, frequency, q);

    // Calculate envelope
    const envelope = numpy.abs(scipy.signal.hilbert(sibilanceBand));

    // Smooth envelope
    const windowSize = Math.floor(sr * 0.01); // 10ms
    const window = numpy.ones(windowSize) / windowSize;
    const smoothEnvelope = numpy.convolve(envelope, window, mode: 'same');

    // Convert to dB
    const envelope_db = 20 * numpy.log10(smoothEnvelope + 1e-10);

    // Calculate gain reduction
    const gainReduction = numpy.where(
      envelope_db > threshold,
      numpy.minimum(reduction, (threshold - envelope_db) * 0.5),
      0.0
    );

    // Convert to linear
    const gainLinear = numpy.power(10, gainReduction / 20);

    // Apply gain reduction to sibilance band
    const reducedSibilance = sibilanceBand * gainLinear;

    // Subtract original sibilance and add reduced
    const output = y - sibilanceBand + reducedSibilance;

    console.log('  ✓ De-esser applied');

    return {
      ...audio,
      waveform: output,
    };
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

export function applyEQ(audio: AudioData, bands: EQBand[]): AudioData {
  const processor = new EqualizerProcessor();
  return processor.applyEQ(audio, { bands });
}

export function applyEQPreset(audio: AudioData, preset: keyof typeof EQ_PRESETS): AudioData {
  const processor = new EqualizerProcessor();
  return processor.applyPreset(audio, preset);
}

// ============================================================================
// Example Usage
// ============================================================================

if (import.meta.main) {
  console.log('🎵 Parametric EQ Demo\n');

  console.log('Available EQ presets:');
  for (const [name, bands] of Object.entries(EQ_PRESETS)) {
    console.log(`\n${name.toUpperCase()}:`);
    for (const band of bands) {
      console.log(`  ${band.type} @ ${band.frequency}Hz, gain: ${band.gain || 0}dB`);
    }
  }

  console.log('\n💡 This demonstrates:');
  console.log('   - scipy.signal filter design in TypeScript');
  console.log('   - IIR biquad filters in TypeScript');
  console.log('   - Butterworth filters via scipy');
  console.log('   - Parametric and graphic EQ');
  console.log('   - Auto-EQ and matching');
  console.log('   - All using Python libraries in TypeScript!');
}

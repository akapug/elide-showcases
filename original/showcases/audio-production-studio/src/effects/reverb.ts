/**
 * Reverb Effects - Room, Hall, Plate, and Spring Reverb
 *
 * Demonstrates scipy.signal for convolution reverb and IIR filtering
 * All in TypeScript thanks to Elide's polyglot runtime!
 */

// @ts-ignore - Scientific computing with signal processing
import scipy from 'python:scipy';
// @ts-ignore - Numerical computing
import numpy from 'python:numpy';
// @ts-ignore - Audio analysis
import librosa from 'python:librosa';

import type { AudioData } from '../audio-processor';

// ============================================================================
// Types
// ============================================================================

export type ReverbType = 'room' | 'hall' | 'plate' | 'spring' | 'chamber' | 'cathedral';

export interface ReverbParams {
  type?: ReverbType;
  roomSize?: number; // 0.0 - 1.0
  damping?: number; // 0.0 - 1.0 (high frequency absorption)
  wetLevel?: number; // 0.0 - 1.0 (reverb mix)
  dryLevel?: number; // 0.0 - 1.0 (original signal mix)
  width?: number; // 0.0 - 1.0 (stereo width)
  predelay?: number; // milliseconds
  diffusion?: number; // 0.0 - 1.0
  decay?: number; // 0.0 - 1.0 (reverb tail length)
}

export interface ImpulseResponseParams {
  duration: number; // seconds
  sampleRate: number;
  earlyReflections: number; // number of early reflections
  reflectionDecay: number; // decay rate of reflections
  diffusion: number; // amount of diffusion
}

export interface ConvolutionReverbParams {
  impulseResponse?: any; // NumPy array or 'generate'
  wetLevel?: number;
  dryLevel?: number;
}

// ============================================================================
// Reverb Presets
// ============================================================================

export const REVERB_PRESETS: Record<ReverbType, ReverbParams> = {
  room: {
    type: 'room',
    roomSize: 0.3,
    damping: 0.5,
    wetLevel: 0.25,
    dryLevel: 0.75,
    width: 0.7,
    predelay: 10,
    diffusion: 0.6,
    decay: 0.4,
  },
  hall: {
    type: 'hall',
    roomSize: 0.8,
    damping: 0.3,
    wetLevel: 0.35,
    dryLevel: 0.65,
    width: 0.9,
    predelay: 20,
    diffusion: 0.8,
    decay: 0.7,
  },
  plate: {
    type: 'plate',
    roomSize: 0.5,
    damping: 0.6,
    wetLevel: 0.3,
    dryLevel: 0.7,
    width: 0.8,
    predelay: 5,
    diffusion: 0.9,
    decay: 0.5,
  },
  spring: {
    type: 'spring',
    roomSize: 0.4,
    damping: 0.7,
    wetLevel: 0.2,
    dryLevel: 0.8,
    width: 0.5,
    predelay: 3,
    diffusion: 0.4,
    decay: 0.3,
  },
  chamber: {
    type: 'chamber',
    roomSize: 0.6,
    damping: 0.4,
    wetLevel: 0.3,
    dryLevel: 0.7,
    width: 0.85,
    predelay: 15,
    diffusion: 0.7,
    decay: 0.6,
  },
  cathedral: {
    type: 'cathedral',
    roomSize: 0.95,
    damping: 0.2,
    wetLevel: 0.4,
    dryLevel: 0.6,
    width: 1.0,
    predelay: 30,
    diffusion: 0.95,
    decay: 0.9,
  },
};

// ============================================================================
// Reverb Processor
// ============================================================================

export class ReverbProcessor {
  /**
   * Apply reverb effect to audio
   *
   * Uses scipy.signal for convolution and filtering
   */
  applyReverb(audio: AudioData, params: ReverbParams = {}): AudioData {
    console.log('[Reverb] Applying reverb effect...');

    const {
      type = 'room',
      roomSize = 0.5,
      damping = 0.5,
      wetLevel = 0.3,
      dryLevel = 0.7,
      width = 0.8,
      predelay = 10,
      diffusion = 0.7,
      decay = 0.5,
    } = params;

    console.log(`  Type: ${type}`);
    console.log(`  Room size: ${roomSize.toFixed(2)}`);
    console.log(`  Wet/Dry: ${wetLevel.toFixed(2)}/${dryLevel.toFixed(2)}`);

    const y = audio.waveform;
    const sr = audio.sampleRate;

    // Generate impulse response
    const ir = this.generateImpulseResponse({
      duration: this.calculateReverbDuration(roomSize, decay),
      sampleRate: sr,
      earlyReflections: Math.floor(20 * diffusion),
      reflectionDecay: this.calculateDecayRate(roomSize, decay),
      diffusion,
    });

    // Apply damping filter to impulse response
    const dampedIr = this.applyDamping(ir, sr, damping);

    // Apply predelay
    let wet = y;
    if (predelay > 0) {
      const delaysamples = Math.floor((predelay / 1000) * sr);
      const delayed = numpy.concatenate([numpy.zeros(delaysamples), y]);
      wet = delayed.slice(0, y.shape[0]);
    }

    // Convolve with impulse response using scipy.signal
    wet = scipy.signal.fftconvolve(wet, dampedIr, mode: 'same');

    // Apply stereo width (if stereo)
    if (audio.channels === 2 && width !== 1.0) {
      wet = this.applyStereoWidth(wet, width);
    }

    // Mix wet and dry
    const output = (dryLevel * y) + (wetLevel * wet);

    // Normalize to prevent clipping
    const maxVal = Number(numpy.abs(output).max());
    const normalized = maxVal > 1.0 ? output / maxVal : output;

    console.log('  ✓ Reverb applied');

    return {
      ...audio,
      waveform: normalized,
    };
  }

  /**
   * Apply reverb using preset
   */
  applyReverbPreset(audio: AudioData, type: ReverbType): AudioData {
    const preset = REVERB_PRESETS[type];
    return this.applyReverb(audio, preset);
  }

  /**
   * Generate impulse response for convolution reverb
   *
   * Creates a realistic room impulse response with early reflections
   * and exponentially decaying diffuse tail
   */
  generateImpulseResponse(params: ImpulseResponseParams): any {
    const { duration, sampleRate, earlyReflections, reflectionDecay, diffusion } = params;

    const numSamples = Math.floor(duration * sampleRate);
    let ir = numpy.zeros(numSamples);

    // 1. Direct sound (Dirac delta at start)
    ir[0] = 1.0;

    // 2. Early reflections (first 80ms)
    const earlyTime = 0.08; // 80ms
    const earlySamples = Math.floor(earlyTime * sampleRate);

    for (let i = 0; i < earlyReflections; i++) {
      // Random reflection time within early period
      const reflectionTime = Math.random() * earlyTime;
      const sampleIdx = Math.floor(reflectionTime * sampleRate);

      // Reflection amplitude decreases with distance
      const amplitude = Math.exp(-reflectionDecay * reflectionTime);

      // Random phase
      const phase = Math.random() > 0.5 ? 1 : -1;

      if (sampleIdx < earlySamples) {
        ir[sampleIdx] += phase * amplitude * (0.3 + 0.7 * Math.random());
      }
    }

    // 3. Late diffuse tail (after 80ms)
    const lateSamples = numSamples - earlySamples;

    // Generate noise for diffuse tail
    const noise = numpy.random.randn(lateSamples);

    // Apply exponential decay envelope
    const decayEnvelope = numpy.exp(
      -reflectionDecay * numpy.linspace(0, duration - earlyTime, lateSamples)
    );

    // Apply diffusion (more diffusion = more dense reflections)
    const diffusedTail = noise * decayEnvelope * diffusion;

    // Combine early and late
    ir = numpy.concatenate([ir.slice(0, earlySamples), diffusedTail]);

    // Apply smoothing to avoid artifacts
    const windowSize = 7;
    ir = this.smoothSignal(ir, windowSize);

    // Normalize
    ir = ir / Number(numpy.abs(ir).max());

    return ir;
  }

  /**
   * Apply damping (high-frequency absorption)
   *
   * Uses scipy.signal Butterworth low-pass filter
   */
  applyDamping(signal: any, sampleRate: number, damping: number): any {
    if (damping === 0) {
      return signal;
    }

    // Damping controls cutoff frequency
    // More damping = lower cutoff = more high-freq absorption
    const maxCutoff = sampleRate / 2;
    const minCutoff = 2000; // 2kHz minimum
    const cutoff = maxCutoff - (damping * (maxCutoff - minCutoff));

    // Design butterworth low-pass filter using scipy
    const sos = scipy.signal.butter(
      4, // order
      cutoff,
      'low',
      fs: sampleRate,
      output: 'sos'
    );

    // Apply filter
    const filtered = scipy.signal.sosfilt(sos, signal);

    return filtered;
  }

  /**
   * Apply stereo width to signal
   */
  applyStereoWidth(signal: any, width: number): any {
    // Width > 1.0 = wider, < 1.0 = narrower

    if (signal.ndim === 1) {
      // Mono signal, return as-is
      return signal;
    }

    // Extract left and right channels
    const left = signal.slice(null, 0);
    const right = signal.slice(null, 1);

    // Calculate mid and side
    const mid = (left + right) / 2.0;
    const side = (left - right) / 2.0;

    // Apply width to side signal
    const wideSide = side * width;

    // Reconstruct left and right
    const newLeft = mid + wideSide;
    const newRight = mid - wideSide;

    return numpy.stack([newLeft, newRight], axis: 1);
  }

  /**
   * Calculate reverb duration based on room size and decay
   */
  private calculateReverbDuration(roomSize: number, decay: number): number {
    // Small room: 0.5s, Large room: 4s
    const baseDuration = 0.5 + (roomSize * 3.5);

    // Decay extends the tail
    return baseDuration * (0.5 + decay);
  }

  /**
   * Calculate decay rate
   */
  private calculateDecayRate(roomSize: number, decay: number): number {
    // Larger rooms have slower decay
    const baseDecay = 3.0 - (roomSize * 2.0);

    // Decay parameter scales this
    return baseDecay * (1.0 - decay * 0.5);
  }

  /**
   * Smooth signal using moving average
   */
  private smoothSignal(signal: any, windowSize: number): any {
    if (windowSize <= 1) {
      return signal;
    }

    // Create uniform window
    const window = numpy.ones(windowSize) / windowSize;

    // Convolve with window
    const smoothed = numpy.convolve(signal, window, mode: 'same');

    return smoothed;
  }

  /**
   * Convolution reverb with custom impulse response
   */
  applyConvolutionReverb(
    audio: AudioData,
    params: ConvolutionReverbParams
  ): AudioData {
    console.log('[Reverb] Applying convolution reverb...');

    const {
      impulseResponse,
      wetLevel = 0.3,
      dryLevel = 0.7,
    } = params;

    const y = audio.waveform;
    const sr = audio.sampleRate;

    let ir = impulseResponse;

    // Generate IR if not provided
    if (!ir || ir === 'generate') {
      ir = this.generateImpulseResponse({
        duration: 2.0,
        sampleRate: sr,
        earlyReflections: 20,
        reflectionDecay: 3.0,
        diffusion: 0.8,
      });
    }

    // Convolve using scipy.signal
    console.log('  Convolving with impulse response...');
    const wet = scipy.signal.fftconvolve(y, ir, mode: 'same');

    // Mix
    const output = (dryLevel * y) + (wetLevel * wet);

    // Normalize
    const maxVal = Number(numpy.abs(output).max());
    const normalized = maxVal > 1.0 ? output / maxVal : output;

    console.log('  ✓ Convolution reverb applied');

    return {
      ...audio,
      waveform: normalized,
    };
  }

  /**
   * Schroeder reverb (algorithmic)
   *
   * Classic reverb algorithm using comb and allpass filters
   */
  applySchroederReverb(
    audio: AudioData,
    params: {
      combDelays?: number[];
      allpassDelays?: number[];
      wetLevel?: number;
      dryLevel?: number;
    } = {}
  ): AudioData {
    console.log('[Reverb] Applying Schroeder reverb...');

    const {
      combDelays = [29.7, 37.1, 41.1, 43.7], // ms
      allpassDelays = [5.0, 1.7], // ms
      wetLevel = 0.3,
      dryLevel = 0.7,
    } = params;

    const y = audio.waveform;
    const sr = audio.sampleRate;

    let wet = numpy.zeros_like(y);

    // Parallel comb filters
    console.log('  Applying parallel comb filters...');
    for (const delay of combDelays) {
      const delaySamples = Math.floor((delay / 1000) * sr);
      const combOutput = this.combFilter(y, delaySamples, 0.7);
      wet = wet + combOutput;
    }

    // Normalize after comb filters
    wet = wet / combDelays.length;

    // Series allpass filters
    console.log('  Applying series allpass filters...');
    for (const delay of allpassDelays) {
      const delaySamples = Math.floor((delay / 1000) * sr);
      wet = this.allpassFilter(wet, delaySamples, 0.7);
    }

    // Mix
    const output = (dryLevel * y) + (wetLevel * wet);

    // Normalize
    const maxVal = Number(numpy.abs(output).max());
    const normalized = maxVal > 1.0 ? output / maxVal : output;

    console.log('  ✓ Schroeder reverb applied');

    return {
      ...audio,
      waveform: normalized,
    };
  }

  /**
   * Comb filter (feedback delay)
   */
  private combFilter(signal: any, delaySamples: number, feedback: number): any {
    const output = numpy.zeros_like(signal);
    const buffer = numpy.zeros(delaySamples);

    for (let i = 0; i < signal.shape[0]; i++) {
      const delayed = buffer[0];
      output[i] = signal[i] + (feedback * delayed);

      // Shift buffer
      buffer = numpy.roll(buffer, -1);
      buffer[-1] = output[i];
    }

    return output;
  }

  /**
   * Allpass filter
   */
  private allpassFilter(signal: any, delaySamples: number, gain: number): any {
    const output = numpy.zeros_like(signal);
    const buffer = numpy.zeros(delaySamples);

    for (let i = 0; i < signal.shape[0]; i++) {
      const delayed = buffer[0];
      output[i] = -gain * signal[i] + delayed + gain * output[i - 1 || 0];

      // Shift buffer
      buffer = numpy.roll(buffer, -1);
      buffer[-1] = signal[i];
    }

    return output;
  }

  /**
   * Freeverb algorithm
   *
   * Popular open-source reverb algorithm
   */
  applyFreeverb(
    audio: AudioData,
    params: {
      roomSize?: number;
      damping?: number;
      wetLevel?: number;
      dryLevel?: number;
      width?: number;
    } = {}
  ): AudioData {
    console.log('[Reverb] Applying Freeverb...');

    const {
      roomSize = 0.5,
      damping = 0.5,
      wetLevel = 0.3,
      dryLevel = 0.7,
      width = 0.5,
    } = params;

    const y = audio.waveform;
    const sr = audio.sampleRate;

    // Freeverb uses 8 parallel comb filters
    const combTunings = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
    const scaledTunings = combTunings.map(t => Math.floor(t * sr / 44100));

    // And 4 allpass filters
    const allpassTunings = [556, 441, 341, 225];
    const scaledAllpass = allpassTunings.map(t => Math.floor(t * sr / 44100));

    let wet = numpy.zeros_like(y);

    // Process through comb filters
    console.log('  Processing 8 parallel comb filters...');
    for (const tuning of scaledTunings) {
      const feedback = 0.84 * roomSize;
      const combOut = this.dampedCombFilter(y, tuning, feedback, damping);
      wet = wet + combOut;
    }

    wet = wet / scaledTunings.length;

    // Process through allpass filters
    console.log('  Processing 4 series allpass filters...');
    for (const tuning of scaledAllpass) {
      wet = this.allpassFilter(wet, tuning, 0.5);
    }

    // Mix
    const output = (dryLevel * y) + (wetLevel * wet);

    // Normalize
    const maxVal = Number(numpy.abs(output).max());
    const normalized = maxVal > 1.0 ? output / maxVal : output;

    console.log('  ✓ Freeverb applied');

    return {
      ...audio,
      waveform: normalized,
    };
  }

  /**
   * Damped comb filter (with high-frequency damping)
   */
  private dampedCombFilter(
    signal: any,
    delaySamples: number,
    feedback: number,
    damping: number
  ): any {
    const output = numpy.zeros_like(signal);
    const buffer = numpy.zeros(delaySamples);
    let filterStore = 0.0;

    for (let i = 0; i < signal.shape[0]; i++) {
      const delayed = buffer[0];

      // One-pole low-pass filter for damping
      filterStore = (delayed * (1 - damping)) + (filterStore * damping);

      output[i] = signal[i] + (feedback * filterStore);

      // Shift buffer
      buffer = numpy.roll(buffer, -1);
      buffer[-1] = output[i];
    }

    return output;
  }

  /**
   * Early reflections generator
   *
   * Simulates discrete early reflections in a room
   */
  generateEarlyReflections(
    audio: AudioData,
    params: {
      roomDimensions?: [number, number, number]; // width, depth, height in meters
      sourcePosition?: [number, number, number];
      listenerPosition?: [number, number, number];
      reflectionOrder?: number;
      absorption?: number;
    } = {}
  ): AudioData {
    console.log('[Reverb] Generating early reflections...');

    const {
      roomDimensions = [10, 8, 3],
      sourcePosition = [2, 2, 1.5],
      listenerPosition = [8, 6, 1.5],
      reflectionOrder = 2,
      absorption = 0.3,
    } = params;

    const y = audio.waveform;
    const sr = audio.sampleRate;

    // Speed of sound
    const speedOfSound = 343; // m/s

    // Calculate reflections
    const reflections: Array<{ delay: number; amplitude: number }> = [];

    // Direct sound
    const directDistance = this.euclideanDistance(sourcePosition, listenerPosition);
    reflections.push({
      delay: directDistance / speedOfSound,
      amplitude: 1.0 / directDistance,
    });

    // First-order reflections (6 walls)
    const walls = [
      { normal: [1, 0, 0], position: 0 }, // Left wall
      { normal: [-1, 0, 0], position: roomDimensions[0] }, // Right wall
      { normal: [0, 1, 0], position: 0 }, // Front wall
      { normal: [0, -1, 0], position: roomDimensions[1] }, // Back wall
      { normal: [0, 0, 1], position: 0 }, // Floor
      { normal: [0, 0, -1], position: roomDimensions[2] }, // Ceiling
    ];

    for (const wall of walls) {
      // Mirror source position across wall
      const mirrorPos = this.mirrorPoint(sourcePosition, wall);

      // Distance from mirrored source to listener
      const distance = this.euclideanDistance(mirrorPos, listenerPosition);

      // Reflection arrives later than direct sound
      const delay = distance / speedOfSound;

      // Amplitude decreases with absorption
      const amplitude = (1.0 - absorption) / distance;

      reflections.push({ delay, amplitude });
    }

    // Create output signal
    let output = numpy.zeros_like(y);

    // Add each reflection
    for (const reflection of reflections) {
      const delaySamples = Math.floor(reflection.delay * sr);

      if (delaySamples < y.shape[0]) {
        // Delayed and attenuated copy
        const delayed = numpy.concatenate([
          numpy.zeros(delaySamples),
          y * reflection.amplitude,
        ]);

        // Trim to match length
        if (delayed.shape[0] > output.shape[0]) {
          output = output + delayed.slice(0, output.shape[0]);
        } else {
          output.slice(0, delayed.shape[0]) += delayed;
        }
      }
    }

    // Normalize
    const maxVal = Number(numpy.abs(output).max());
    const normalized = maxVal > 1.0 ? output / maxVal : output;

    console.log(`  Generated ${reflections.length} reflections`);
    console.log('  ✓ Early reflections applied');

    return {
      ...audio,
      waveform: normalized,
    };
  }

  /**
   * Calculate Euclidean distance between two points
   */
  private euclideanDistance(p1: number[], p2: number[]): number {
    const dx = p1[0] - p2[0];
    const dy = p1[1] - p2[1];
    const dz = p1[2] - p2[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Mirror point across wall
   */
  private mirrorPoint(point: number[], wall: any): number[] {
    // Simplified mirroring for axis-aligned walls
    const mirrored = [...point];
    const normal = wall.normal;
    const pos = wall.position;

    for (let i = 0; i < 3; i++) {
      if (normal[i] !== 0) {
        mirrored[i] = 2 * pos - point[i];
      }
    }

    return mirrored;
  }

  /**
   * Create reverb from real impulse response file
   */
  async loadImpulseResponse(filepath: string): Promise<any> {
    console.log(`[Reverb] Loading impulse response: ${filepath}`);

    // Load IR using librosa
    const [ir, sr] = librosa.load(filepath, sr: null);

    console.log(`  Duration: ${(ir.shape[0] / sr).toFixed(2)}s`);
    console.log(`  Sample rate: ${sr} Hz`);

    return ir;
  }

  /**
   * Apply reverb using loaded impulse response
   */
  applyImpulseResponseFile(
    audio: AudioData,
    irFilepath: string,
    wetLevel: number = 0.3,
    dryLevel: number = 0.7
  ): Promise<AudioData> {
    return this.loadImpulseResponse(irFilepath).then(ir => {
      return this.applyConvolutionReverb(audio, {
        impulseResponse: ir,
        wetLevel,
        dryLevel,
      });
    });
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

export function applyReverb(audio: AudioData, params?: ReverbParams): AudioData {
  const processor = new ReverbProcessor();
  return processor.applyReverb(audio, params);
}

export function applyReverbPreset(audio: AudioData, type: ReverbType): AudioData {
  const processor = new ReverbProcessor();
  return processor.applyReverbPreset(audio, type);
}

// ============================================================================
// Example Usage
// ============================================================================

if (import.meta.main) {
  console.log('🎵 Reverb Effects Demo\n');

  // This would require actual audio file
  console.log('Available reverb types:');
  for (const [type, preset] of Object.entries(REVERB_PRESETS)) {
    console.log(`\n${type.toUpperCase()}:`);
    console.log(`  Room size: ${preset.roomSize?.toFixed(2)}`);
    console.log(`  Damping: ${preset.damping?.toFixed(2)}`);
    console.log(`  Wet level: ${preset.wetLevel?.toFixed(2)}`);
    console.log(`  Predelay: ${preset.predelay}ms`);
  }

  console.log('\n💡 This demonstrates:');
  console.log('   - scipy.signal convolution in TypeScript');
  console.log('   - scipy.signal filter design in TypeScript');
  console.log('   - NumPy array operations for DSP');
  console.log('   - Multiple reverb algorithms (Schroeder, Freeverb)');
  console.log('   - Impulse response generation');
  console.log('   - All in TypeScript with zero overhead!');
}

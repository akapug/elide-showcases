/**
 * Synthesizer - Audio synthesis with Python in TypeScript
 *
 * Demonstrates NumPy and scipy for waveform generation and synthesis
 */

// @ts-ignore - Numerical computing
import numpy from 'python:numpy';
// @ts-ignore - Scientific computing
import scipy from 'python:scipy';
// @ts-ignore - Audio library
import librosa from 'python:librosa';

import type { AudioData } from '../audio-processor';

// ============================================================================
// Types
// ============================================================================

export type WaveformType = 'sine' | 'square' | 'sawtooth' | 'triangle' | 'pulse' | 'noise';

export interface OscillatorParams {
  frequency: number; // Hz
  waveform: WaveformType;
  amplitude?: number; // 0-1
  phase?: number; // 0-2π
  pulseWidth?: number; // 0-1 (for pulse wave)
}

export interface ADSREnvelope {
  attack: number; // seconds
  decay: number; // seconds
  sustain: number; // 0-1 (level)
  release: number; // seconds
}

export interface FilterParams {
  type: 'lowpass' | 'highpass' | 'bandpass' | 'notch';
  cutoff: number; // Hz
  resonance: number; // 0-1
  envelopeAmount?: number; // -1 to 1
}

export interface LFOParams {
  frequency: number; // Hz
  waveform: WaveformType;
  amount: number; // 0-1
  target: 'pitch' | 'filter' | 'amplitude';
}

export interface SynthNote {
  frequency: number;
  velocity: number; // 0-1
  duration: number; // seconds
  startTime?: number; // seconds
}

export interface SynthPreset {
  name: string;
  oscillators: OscillatorParams[];
  envelope: ADSREnvelope;
  filter?: FilterParams;
  lfo?: LFOParams;
}

// ============================================================================
// Synthesis Presets
// ============================================================================

export const SYNTH_PRESETS: Record<string, SynthPreset> = {
  bass: {
    name: 'Bass',
    oscillators: [
      { frequency: 100, waveform: 'sawtooth', amplitude: 0.8 },
      { frequency: 100.5, waveform: 'square', amplitude: 0.3 }, // Slight detune
    ],
    envelope: {
      attack: 0.01,
      decay: 0.1,
      sustain: 0.7,
      release: 0.2,
    },
    filter: {
      type: 'lowpass',
      cutoff: 500,
      resonance: 0.7,
      envelopeAmount: 0.5,
    },
  },

  lead: {
    name: 'Lead',
    oscillators: [
      { frequency: 440, waveform: 'sawtooth', amplitude: 0.6 },
      { frequency: 440.2, waveform: 'sawtooth', amplitude: 0.4 }, // Detune
    ],
    envelope: {
      attack: 0.05,
      decay: 0.2,
      sustain: 0.6,
      release: 0.3,
    },
    filter: {
      type: 'lowpass',
      cutoff: 2000,
      resonance: 0.5,
      envelopeAmount: 0.7,
    },
    lfo: {
      frequency: 5,
      waveform: 'sine',
      amount: 0.2,
      target: 'pitch',
    },
  },

  pad: {
    name: 'Pad',
    oscillators: [
      { frequency: 220, waveform: 'sine', amplitude: 0.4 },
      { frequency: 220.5, waveform: 'sawtooth', amplitude: 0.3 },
      { frequency: 220.8, waveform: 'triangle', amplitude: 0.3 },
    ],
    envelope: {
      attack: 1.0,
      decay: 0.5,
      sustain: 0.8,
      release: 2.0,
    },
    filter: {
      type: 'lowpass',
      cutoff: 1000,
      resonance: 0.3,
    },
  },

  pluck: {
    name: 'Pluck',
    oscillators: [
      { frequency: 440, waveform: 'sine', amplitude: 1.0 },
    ],
    envelope: {
      attack: 0.001,
      decay: 0.3,
      sustain: 0.1,
      release: 0.2,
    },
    filter: {
      type: 'lowpass',
      cutoff: 3000,
      resonance: 0.2,
      envelopeAmount: 0.8,
    },
  },

  organ: {
    name: 'Organ',
    oscillators: [
      { frequency: 440, waveform: 'sine', amplitude: 0.5 },
      { frequency: 880, waveform: 'sine', amplitude: 0.3 }, // 2nd harmonic
      { frequency: 1320, waveform: 'sine', amplitude: 0.2 }, // 3rd harmonic
    ],
    envelope: {
      attack: 0.01,
      decay: 0.0,
      sustain: 1.0,
      release: 0.1,
    },
  },

  brass: {
    name: 'Brass',
    oscillators: [
      { frequency: 220, waveform: 'sawtooth', amplitude: 0.7 },
      { frequency: 220.3, waveform: 'square', amplitude: 0.3 },
    ],
    envelope: {
      attack: 0.1,
      decay: 0.2,
      sustain: 0.9,
      release: 0.2,
    },
    filter: {
      type: 'lowpass',
      cutoff: 1500,
      resonance: 0.6,
      envelopeAmount: 0.6,
    },
  },
};

// ============================================================================
// Synthesizer
// ============================================================================

export class Synthesizer {
  private sampleRate: number = 44100;

  constructor(sampleRate: number = 44100) {
    this.sampleRate = sampleRate;
  }

  /**
   * Generate basic waveform
   */
  generateWaveform(
    type: WaveformType,
    frequency: number,
    duration: number,
    amplitude: number = 1.0,
    phase: number = 0.0,
    pulseWidth: number = 0.5
  ): any {
    const numSamples = Math.floor(duration * this.sampleRate);
    const t = numpy.arange(numSamples) / this.sampleRate;
    const omega = 2 * numpy.pi * frequency;

    let waveform: any;

    switch (type) {
      case 'sine':
        waveform = numpy.sin(omega * t + phase);
        break;

      case 'square':
        waveform = scipy.signal.square(omega * t + phase);
        break;

      case 'sawtooth':
        waveform = scipy.signal.sawtooth(omega * t + phase);
        break;

      case 'triangle':
        waveform = scipy.signal.sawtooth(omega * t + phase, width: 0.5);
        break;

      case 'pulse':
        waveform = scipy.signal.square(omega * t + phase, duty: pulseWidth);
        break;

      case 'noise':
        waveform = numpy.random.uniform(-1, 1, numSamples);
        break;

      default:
        waveform = numpy.sin(omega * t + phase);
    }

    return waveform * amplitude;
  }

  /**
   * Generate ADSR envelope
   */
  generateADSREnvelope(
    duration: number,
    envelope: ADSREnvelope,
    noteOffTime?: number
  ): any {
    const numSamples = Math.floor(duration * this.sampleRate);
    const env = numpy.zeros(numSamples);

    const attackSamples = Math.floor(envelope.attack * this.sampleRate);
    const decaySamples = Math.floor(envelope.decay * this.sampleRate);
    const releaseSamples = Math.floor(envelope.release * this.sampleRate);

    // Determine note off time (when to start release)
    const noteOffSample = noteOffTime
      ? Math.floor(noteOffTime * this.sampleRate)
      : numSamples - releaseSamples;

    let idx = 0;

    // Attack phase
    if (attackSamples > 0 && idx < noteOffSample) {
      const attackEnd = Math.min(idx + attackSamples, noteOffSample);
      const attackLen = attackEnd - idx;
      env.slice(idx, attackEnd) = numpy.linspace(0, 1, attackLen);
      idx = attackEnd;
    } else if (idx < noteOffSample) {
      env[idx] = 1.0;
      idx++;
    }

    // Decay phase
    if (decaySamples > 0 && idx < noteOffSample) {
      const decayEnd = Math.min(idx + decaySamples, noteOffSample);
      const decayLen = decayEnd - idx;
      env.slice(idx, decayEnd) = numpy.linspace(1, envelope.sustain, decayLen);
      idx = decayEnd;
    }

    // Sustain phase
    if (idx < noteOffSample) {
      env.slice(idx, noteOffSample) = envelope.sustain;
      idx = noteOffSample;
    }

    // Release phase
    if (idx < numSamples) {
      const currentLevel = env[idx - 1] if idx > 0 else envelope.sustain;
      const releaseLen = numSamples - idx;
      env.slice(idx, numSamples) = numpy.linspace(currentLevel, 0, releaseLen);
    }

    return env;
  }

  /**
   * Apply filter to signal
   */
  applyFilter(
    signal: any,
    filterParams: FilterParams,
    envelopeModulation?: any
  ): any {
    let cutoff = filterParams.cutoff;

    // Apply envelope modulation if provided
    if (envelopeModulation && filterParams.envelopeAmount) {
      const modulatedCutoff = cutoff + (cutoff * filterParams.envelopeAmount * envelopeModulation);
      // For simplicity, use average cutoff (proper implementation would process frame-by-frame)
      cutoff = Number(numpy.mean(modulatedCutoff));
    }

    // Ensure cutoff is within valid range
    cutoff = Math.max(20, Math.min(cutoff, this.sampleRate / 2 - 100));

    // Convert resonance to Q factor
    const Q = 0.5 + (filterParams.resonance * 10);

    // Design filter using scipy
    let filtered: any;

    switch (filterParams.type) {
      case 'lowpass':
        const sosLow = scipy.signal.butter(2, cutoff, 'low', fs: this.sampleRate, output: 'sos');
        filtered = scipy.signal.sosfilt(sosLow, signal);
        break;

      case 'highpass':
        const sosHigh = scipy.signal.butter(2, cutoff, 'high', fs: this.sampleRate, output: 'sos');
        filtered = scipy.signal.sosfilt(sosHigh, signal);
        break;

      case 'bandpass':
        const bandwidth = cutoff / Q;
        const lowFreq = cutoff - bandwidth / 2;
        const highFreq = cutoff + bandwidth / 2;
        const sosBand = scipy.signal.butter(
          2,
          [Math.max(20, lowFreq), Math.min(highFreq, this.sampleRate / 2 - 100)],
          'bandpass',
          fs: this.sampleRate,
          output: 'sos'
        );
        filtered = scipy.signal.sosfilt(sosBand, signal);
        break;

      case 'notch':
        const w0 = cutoff / (this.sampleRate / 2);
        const b, a = scipy.signal.iirnotch(w0, Q);
        filtered = scipy.signal.lfilter(b, a, signal);
        break;

      default:
        filtered = signal;
    }

    return filtered;
  }

  /**
   * Generate LFO (Low Frequency Oscillator)
   */
  generateLFO(params: LFOParams, duration: number): any {
    return this.generateWaveform(
      params.waveform,
      params.frequency,
      duration,
      params.amount
    );
  }

  /**
   * Synthesize note using preset
   */
  synthesizeNote(
    frequency: number,
    duration: number,
    preset: SynthPreset,
    velocity: number = 1.0
  ): AudioData {
    console.log(`[Synth] Synthesizing note: ${frequency.toFixed(2)} Hz, duration: ${duration.toFixed(2)}s`);

    // Generate envelope
    const envelope = this.generateADSREnvelope(duration, preset.envelope);

    // Generate LFO if present
    let lfo: any = null;
    if (preset.lfo) {
      lfo = this.generateLFO(preset.lfo, duration);
    }

    // Generate oscillators and mix
    let mixed = numpy.zeros(Math.floor(duration * this.sampleRate));

    for (const oscParams of preset.oscillators) {
      // Apply LFO to frequency if targeting pitch
      let oscFreq = frequency;
      if (lfo && preset.lfo?.target === 'pitch') {
        // For simplicity, use average modulation (proper implementation would be per-sample)
        const avgModulation = Number(numpy.mean(lfo));
        oscFreq = frequency * (1 + avgModulation * 0.1); // ±10% modulation
      }

      // Generate oscillator waveform
      const osc = this.generateWaveform(
        oscParams.waveform,
        oscFreq * (oscParams.frequency / 440), // Scale from preset freq
        duration,
        oscParams.amplitude || 0.5,
        oscParams.phase || 0,
        oscParams.pulseWidth || 0.5
      );

      mixed += osc;
    }

    // Normalize oscillator mix
    if (preset.oscillators.length > 0) {
      mixed = mixed / preset.oscillators.length;
    }

    // Apply filter if present
    if (preset.filter) {
      const filterEnvelope = preset.filter.envelopeAmount ? envelope : null;
      mixed = this.applyFilter(mixed, preset.filter, filterEnvelope);
    }

    // Apply envelope
    mixed = mixed * envelope;

    // Apply velocity
    mixed = mixed * velocity;

    // Prevent clipping
    const maxVal = Number(numpy.abs(mixed).max());
    if (maxVal > 1.0) {
      mixed = mixed / maxVal;
    }

    return {
      waveform: mixed,
      sampleRate: this.sampleRate,
      duration,
      channels: 1,
      samples: mixed.shape[0],
    };
  }

  /**
   * Synthesize using preset name
   */
  synthesizeWithPreset(
    frequency: number,
    duration: number,
    presetName: keyof typeof SYNTH_PRESETS,
    velocity: number = 1.0
  ): AudioData {
    const preset = SYNTH_PRESETS[presetName];
    console.log(`[Synth] Using preset: ${preset.name}`);
    return this.synthesizeNote(frequency, duration, preset, velocity);
  }

  /**
   * Synthesize sequence of notes
   */
  synthesizeSequence(
    notes: SynthNote[],
    preset: SynthPreset
  ): AudioData {
    console.log(`[Synth] Synthesizing sequence: ${notes.length} notes`);

    // Find total duration
    let totalDuration = 0;
    for (const note of notes) {
      const endTime = (note.startTime || 0) + note.duration;
      if (endTime > totalDuration) {
        totalDuration = endTime;
      }
    }

    const totalSamples = Math.ceil(totalDuration * this.sampleRate);
    let output = numpy.zeros(totalSamples);

    // Synthesize each note
    for (const note of notes) {
      const noteAudio = this.synthesizeNote(
        note.frequency,
        note.duration,
        preset,
        note.velocity
      );

      const startSample = Math.floor((note.startTime || 0) * this.sampleRate);
      const endSample = startSample + noteAudio.samples;

      // Add to output
      output.slice(startSample, endSample) += noteAudio.waveform;
    }

    // Normalize
    const maxVal = Number(numpy.abs(output).max());
    if (maxVal > 1.0) {
      output = output / maxVal * 0.9;
    }

    return {
      waveform: output,
      sampleRate: this.sampleRate,
      duration: totalDuration,
      channels: 1,
      samples: totalSamples,
    };
  }

  /**
   * FM Synthesis (Frequency Modulation)
   */
  synthesizeFM(
    carrierFreq: number,
    modulatorFreq: number,
    modulationIndex: number,
    duration: number,
    envelope?: ADSREnvelope
  ): AudioData {
    console.log(`[Synth] FM synthesis: carrier=${carrierFreq}Hz, modulator=${modulatorFreq}Hz`);

    const numSamples = Math.floor(duration * this.sampleRate);
    const t = numpy.arange(numSamples) / this.sampleRate;

    // Modulator
    const modulator = numpy.sin(2 * numpy.pi * modulatorFreq * t);

    // Carrier with FM
    const carrier = numpy.sin(
      2 * numpy.pi * carrierFreq * t + modulationIndex * modulator
    );

    // Apply envelope if provided
    let output = carrier;
    if (envelope) {
      const env = this.generateADSREnvelope(duration, envelope);
      output = carrier * env;
    }

    return {
      waveform: output,
      sampleRate: this.sampleRate,
      duration,
      channels: 1,
      samples: numSamples,
    };
  }

  /**
   * Additive Synthesis (sum of harmonics)
   */
  synthesizeAdditive(
    fundamental: number,
    harmonics: number[], // Amplitudes of each harmonic
    duration: number,
    envelope?: ADSREnvelope
  ): AudioData {
    console.log(`[Synth] Additive synthesis: ${harmonics.length} harmonics`);

    const numSamples = Math.floor(duration * this.sampleRate);
    let output = numpy.zeros(numSamples);

    // Generate each harmonic
    for (let i = 0; i < harmonics.length; i++) {
      const harmonicFreq = fundamental * (i + 1);
      const amplitude = harmonics[i];

      if (amplitude > 0) {
        const harmonic = this.generateWaveform(
          'sine',
          harmonicFreq,
          duration,
          amplitude
        );

        output += harmonic;
      }
    }

    // Normalize
    const maxVal = Number(numpy.abs(output).max());
    if (maxVal > 0) {
      output = output / maxVal;
    }

    // Apply envelope if provided
    if (envelope) {
      const env = this.generateADSREnvelope(duration, envelope);
      output = output * env;
    }

    return {
      waveform: output,
      sampleRate: this.sampleRate,
      duration,
      channels: 1,
      samples: numSamples,
    };
  }

  /**
   * Karplus-Strong synthesis (plucked string)
   */
  synthesizeKarplusStrong(
    frequency: number,
    duration: number,
    damping: number = 0.995,
    excitation: 'noise' | 'impulse' = 'noise'
  ): AudioData {
    console.log(`[Synth] Karplus-Strong synthesis: ${frequency.toFixed(2)} Hz`);

    const numSamples = Math.floor(duration * this.sampleRate);
    const delayLength = Math.floor(this.sampleRate / frequency);

    // Create delay line buffer
    const buffer = numpy.zeros(delayLength);

    // Initialize with excitation
    if (excitation === 'noise') {
      for (let i = 0; i < delayLength; i++) {
        buffer[i] = Math.random() * 2 - 1;
      }
    } else {
      buffer[0] = 1.0;
    }

    // Generate output
    const output = numpy.zeros(numSamples);

    for (let i = 0; i < numSamples; i++) {
      // Output current sample
      output[i] = buffer[0];

      // Calculate new sample (average of first two + damping)
      const newSample = (buffer[0] + buffer[1]) / 2 * damping;

      // Shift buffer
      buffer = numpy.roll(buffer, -1);
      buffer[-1] = newSample;
    }

    return {
      waveform: output,
      sampleRate: this.sampleRate,
      duration,
      channels: 1,
      samples: numSamples,
    };
  }

  /**
   * Granular Synthesis
   */
  synthesizeGranular(
    sourceAudio: AudioData,
    grainSize: number = 0.05, // seconds
    grainDensity: number = 50, // grains per second
    duration: number = 1.0,
    randomPitch: boolean = false
  ): AudioData {
    console.log(`[Synth] Granular synthesis: grain size=${grainSize}s, density=${grainDensity}/s`);

    const numSamples = Math.floor(duration * this.sampleRate);
    const output = numpy.zeros(numSamples);

    const grainSamples = Math.floor(grainSize * this.sampleRate);
    const numGrains = Math.floor(duration * grainDensity);

    // Generate Hann window for grains
    const window = numpy.hanning(grainSamples);

    for (let i = 0; i < numGrains; i++) {
      // Random grain position in source
      const sourcePos = Math.floor(Math.random() * (sourceAudio.samples - grainSamples));

      // Random output position
      const outputPos = Math.floor(Math.random() * (numSamples - grainSamples));

      // Extract grain
      let grain = sourceAudio.waveform.slice(sourcePos, sourcePos + grainSamples).copy();

      // Apply pitch shift if random
      if (randomPitch) {
        const pitchShift = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
        const newLength = Math.floor(grainSamples / pitchShift);

        // Simple resampling
        grain = scipy.signal.resample(grain, newLength);

        // Trim or pad to original length
        if (newLength > grainSamples) {
          grain = grain.slice(0, grainSamples);
        } else {
          const padding = numpy.zeros(grainSamples - newLength);
          grain = numpy.concatenate([grain, padding]);
        }
      }

      // Apply window
      grain = grain * window;

      // Add to output
      const endPos = Math.min(outputPos + grainSamples, numSamples);
      const addLength = endPos - outputPos;

      output.slice(outputPos, endPos) += grain.slice(0, addLength);
    }

    // Normalize
    const maxVal = Number(numpy.abs(output).max());
    if (maxVal > 0) {
      output = output / maxVal * 0.7;
    }

    return {
      waveform: output,
      sampleRate: this.sampleRate,
      duration,
      channels: 1,
      samples: numSamples,
    };
  }

  /**
   * Wavetable Synthesis
   */
  synthesizeWavetable(
    wavetable: any, // NumPy array of one cycle
    frequency: number,
    duration: number,
    envelope?: ADSREnvelope
  ): AudioData {
    console.log(`[Synth] Wavetable synthesis: ${frequency.toFixed(2)} Hz`);

    const numSamples = Math.floor(duration * this.sampleRate);
    const wavetableLength = wavetable.shape[0];

    // Calculate phase increment
    const phaseIncrement = frequency * wavetableLength / this.sampleRate;

    const output = numpy.zeros(numSamples);
    let phase = 0;

    // Generate output by reading from wavetable
    for (let i = 0; i < numSamples; i++) {
      // Linear interpolation between wavetable samples
      const index = phase % wavetableLength;
      const idx1 = Math.floor(index);
      const idx2 = (idx1 + 1) % wavetableLength;
      const frac = index - idx1;

      output[i] = wavetable[idx1] * (1 - frac) + wavetable[idx2] * frac;

      phase += phaseIncrement;
    }

    // Apply envelope
    if (envelope) {
      const env = this.generateADSREnvelope(duration, envelope);
      output = output * env;
    }

    return {
      waveform: output,
      sampleRate: this.sampleRate,
      duration,
      channels: 1,
      samples: numSamples,
    };
  }

  /**
   * Create wavetable from spectrum
   */
  createWavetableFromSpectrum(harmonicAmplitudes: number[]): any {
    console.log(`[Synth] Creating wavetable from ${harmonicAmplitudes.length} harmonics`);

    const tableSize = 2048;

    // Create frequency domain representation
    const spectrum = numpy.zeros(tableSize);

    for (let i = 0; i < Math.min(harmonicAmplitudes.length, tableSize / 2); i++) {
      spectrum[i + 1] = harmonicAmplitudes[i];
    }

    // Inverse FFT to time domain
    const wavetable = numpy.fft.irfft(spectrum);

    // Normalize
    const maxVal = Number(numpy.abs(wavetable).max());
    if (maxVal > 0) {
      return wavetable / maxVal;
    }

    return wavetable;
  }

  /**
   * Noise synthesis
   */
  synthesizeNoise(
    duration: number,
    type: 'white' | 'pink' | 'brown' = 'white',
    envelope?: ADSREnvelope
  ): AudioData {
    console.log(`[Synth] Synthesizing ${type} noise`);

    const numSamples = Math.floor(duration * this.sampleRate);
    let noise: any;

    switch (type) {
      case 'white':
        noise = numpy.random.uniform(-1, 1, numSamples);
        break;

      case 'pink':
        // Pink noise using simple filtering
        const white = numpy.random.uniform(-1, 1, numSamples);
        const b = numpy.array([0.049922035, -0.095993537, 0.050612699, -0.004408786]);
        const a = numpy.array([1, -2.494956002, 2.017265875, -0.522189400]);
        noise = scipy.signal.lfilter(b, a, white);
        break;

      case 'brown':
        // Brownian noise (random walk)
        const whiteNoise = numpy.random.uniform(-1, 1, numSamples);
        noise = numpy.cumsum(whiteNoise);
        // Normalize
        const maxVal = Number(numpy.abs(noise).max());
        if (maxVal > 0) {
          noise = noise / maxVal;
        }
        break;
    }

    // Apply envelope
    if (envelope) {
      const env = this.generateADSREnvelope(duration, envelope);
      noise = noise * env;
    }

    return {
      waveform: noise,
      sampleRate: this.sampleRate,
      duration,
      channels: 1,
      samples: numSamples,
    };
  }

  /**
   * Chord synthesis
   */
  synthesizeChord(
    rootFrequency: number,
    chordType: 'major' | 'minor' | 'diminished' | 'augmented' | 'sus2' | 'sus4',
    duration: number,
    preset: SynthPreset
  ): AudioData {
    console.log(`[Synth] Synthesizing ${chordType} chord from ${rootFrequency.toFixed(2)} Hz`);

    // Define chord intervals (in semitones)
    const intervals: Record<string, number[]> = {
      major: [0, 4, 7],
      minor: [0, 3, 7],
      diminished: [0, 3, 6],
      augmented: [0, 4, 8],
      sus2: [0, 2, 7],
      sus4: [0, 5, 7],
    };

    const semitones = intervals[chordType];

    // Convert semitones to frequencies
    const frequencies = semitones.map(st => rootFrequency * Math.pow(2, st / 12));

    // Synthesize each note
    const notes: SynthNote[] = frequencies.map(freq => ({
      frequency: freq,
      velocity: 0.5,
      duration,
      startTime: 0,
    }));

    return this.synthesizeSequence(notes, preset);
  }

  /**
   * Arpeggiator
   */
  synthesizeArpeggio(
    frequencies: number[],
    pattern: 'up' | 'down' | 'updown' | 'random',
    noteDuration: number,
    totalDuration: number,
    preset: SynthPreset
  ): AudioData {
    console.log(`[Synth] Synthesizing arpeggio: ${pattern}, ${frequencies.length} notes`);

    const notes: SynthNote[] = [];
    let currentTime = 0;

    // Create pattern
    let sequence: number[] = [];

    switch (pattern) {
      case 'up':
        sequence = frequencies;
        break;

      case 'down':
        sequence = [...frequencies].reverse();
        break;

      case 'updown':
        sequence = [...frequencies, ...frequencies.slice(1, -1).reverse()];
        break;

      case 'random':
        while (currentTime < totalDuration) {
          const randomIdx = Math.floor(Math.random() * frequencies.length);
          sequence.push(frequencies[randomIdx]);
          currentTime += noteDuration;
        }
        currentTime = 0;
        break;
    }

    // Generate notes
    while (currentTime < totalDuration) {
      for (const freq of sequence) {
        if (currentTime >= totalDuration) break;

        notes.push({
          frequency: freq,
          velocity: 0.7,
          duration: noteDuration,
          startTime: currentTime,
        });

        currentTime += noteDuration;
      }
    }

    return this.synthesizeSequence(notes, preset);
  }

  /**
   * Ring modulation
   */
  applyRingModulation(
    audio: AudioData,
    modulatorFreq: number,
    amount: number = 1.0
  ): AudioData {
    console.log(`[Synth] Applying ring modulation: ${modulatorFreq} Hz`);

    const y = audio.waveform;
    const numSamples = y.shape[0];

    // Generate modulator
    const modulator = this.generateWaveform('sine', modulatorFreq, audio.duration);

    // Ring modulate
    const modulated = y * modulator;

    // Mix with dry signal
    const output = (1 - amount) * y + amount * modulated;

    return {
      ...audio,
      waveform: output,
    };
  }
}

// ============================================================================
// Note Helper Functions
// ============================================================================

/**
 * Convert note name to frequency
 */
export function noteToFrequency(note: string): number {
  // Use librosa if available
  return Number(librosa.note_to_hz(note));
}

/**
 * Convert MIDI note number to frequency
 */
export function midiToFrequency(midiNote: number): number {
  return Number(librosa.midi_to_hz(midiNote));
}

/**
 * Create note sequence from note names
 */
export function createNoteSequence(
  noteNames: string[],
  noteDuration: number,
  velocity: number = 1.0
): SynthNote[] {
  return noteNames.map((name, i) => ({
    frequency: noteToFrequency(name),
    velocity,
    duration: noteDuration,
    startTime: i * noteDuration,
  }));
}

// ============================================================================
// Convenience Functions
// ============================================================================

export function createSynthesizer(sampleRate: number = 44100): Synthesizer {
  return new Synthesizer(sampleRate);
}

// ============================================================================
// Example Usage
// ============================================================================

if (import.meta.main) {
  console.log('🎵 Synthesizer Demo\n');

  console.log('Available synthesis methods:');
  console.log('  - Subtractive (oscillators + filters)');
  console.log('  - FM (frequency modulation)');
  console.log('  - Additive (harmonic synthesis)');
  console.log('  - Karplus-Strong (plucked string)');
  console.log('  - Granular synthesis');
  console.log('  - Wavetable synthesis');
  console.log('  - Noise synthesis (white, pink, brown)');

  console.log('\nAvailable presets:');
  for (const [key, preset] of Object.entries(SYNTH_PRESETS)) {
    console.log(`  ${key}: ${preset.name}`);
  }

  console.log('\n💡 This demonstrates:');
  console.log('   - NumPy for waveform generation');
  console.log('   - scipy.signal for filters and effects');
  console.log('   - librosa for note/frequency conversion');
  console.log('   - Multiple synthesis techniques');
  console.log('   - ADSR envelopes');
  console.log('   - LFO modulation');
  console.log('   - All in TypeScript using Python libraries!');
}

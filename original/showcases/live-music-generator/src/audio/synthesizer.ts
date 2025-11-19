/**
 * Software Synthesizer
 *
 * Advanced software synthesizer with multiple oscillators, filters, envelopes,
 * LFOs, and effects processing for high-quality audio synthesis.
 *
 * Features:
 * - Multiple waveforms (sine, square, sawtooth, triangle, noise, custom)
 * - ADSR envelopes for amplitude and filter
 * - Multi-oscillator architecture with unison and detune
 * - Resonant filters (lowpass, highpass, bandpass, notch)
 * - LFO modulation (vibrato, tremolo, filter sweeps)
 * - Effects chain (reverb, delay, chorus, flanger, phaser, distortion)
 * - Compression and limiting
 */

/**
 * Waveform types
 */
export type Waveform =
  | 'sine'
  | 'square'
  | 'sawtooth'
  | 'triangle'
  | 'noise'
  | 'pulse'
  | 'custom';

/**
 * Filter types
 */
export type FilterType =
  | 'lowpass'
  | 'highpass'
  | 'bandpass'
  | 'notch'
  | 'allpass';

/**
 * Synthesizer parameters
 */
export interface SynthParams {
  // Oscillator
  waveform: Waveform;
  detune?: number; // in cents
  numOscillators?: number; // for unison
  unisonDetune?: number; // detune spread for unison
  pulseWidth?: number; // for pulse wave (0-1)

  // Amplitude envelope
  attack: number; // in seconds
  decay: number;
  sustain: number; // 0-1
  release: number;

  // Filter
  filterType?: FilterType;
  filterCutoff: number; // in Hz
  filterResonance: number; // Q factor

  // Filter envelope
  filterAttack?: number;
  filterDecay?: number;
  filterSustain?: number;
  filterRelease?: number;
  filterEnvAmount?: number; // -1 to 1

  // LFO
  lfoRate?: number; // in Hz
  lfoAmount?: number; // 0-1
  lfoTarget?: 'pitch' | 'filter' | 'amplitude';

  // Effects
  reverbMix?: number; // 0-1
  delayMix?: number; // 0-1
  chorusMix?: number; // 0-1
}

/**
 * Audio sample
 */
interface AudioSample {
  left: number;
  right: number;
}

/**
 * Envelope generator
 */
class EnvelopeGenerator {
  private attack: number;
  private decay: number;
  private sustain: number;
  private release: number;

  private phase: 'attack' | 'decay' | 'sustain' | 'release' | 'idle';
  private value: number;
  private releaseValue: number;

  constructor(attack: number, decay: number, sustain: number, release: number) {
    this.attack = attack;
    this.decay = decay;
    this.sustain = sustain;
    this.release = release;

    this.phase = 'idle';
    this.value = 0;
    this.releaseValue = 0;
  }

  /**
   * Trigger envelope
   */
  public trigger(): void {
    this.phase = 'attack';
    this.value = 0;
  }

  /**
   * Release envelope
   */
  public triggerRelease(): void {
    this.phase = 'release';
    this.releaseValue = this.value;
  }

  /**
   * Get envelope value at time
   */
  public getValue(time: number, deltaTime: number): number {
    switch (this.phase) {
      case 'attack':
        if (this.attack > 0) {
          this.value += deltaTime / this.attack;
          if (this.value >= 1) {
            this.value = 1;
            this.phase = 'decay';
          }
        } else {
          this.value = 1;
          this.phase = 'decay';
        }
        break;

      case 'decay':
        if (this.decay > 0) {
          const decayRate = (1 - this.sustain) / this.decay;
          this.value -= decayRate * deltaTime;
          if (this.value <= this.sustain) {
            this.value = this.sustain;
            this.phase = 'sustain';
          }
        } else {
          this.value = this.sustain;
          this.phase = 'sustain';
        }
        break;

      case 'sustain':
        this.value = this.sustain;
        break;

      case 'release':
        if (this.release > 0) {
          const releaseRate = this.releaseValue / this.release;
          this.value -= releaseRate * deltaTime;
          if (this.value <= 0) {
            this.value = 0;
            this.phase = 'idle';
          }
        } else {
          this.value = 0;
          this.phase = 'idle';
        }
        break;

      case 'idle':
        this.value = 0;
        break;
    }

    return this.value;
  }

  public isActive(): boolean {
    return this.phase !== 'idle';
  }
}

/**
 * Oscillator
 */
class Oscillator {
  private waveform: Waveform;
  private phase: number;
  private pulseWidth: number;
  private customWaveform?: Float32Array;

  constructor(waveform: Waveform, pulseWidth: number = 0.5) {
    this.waveform = waveform;
    this.phase = Math.random() * Math.PI * 2; // Random phase for natural sound
    this.pulseWidth = pulseWidth;
  }

  /**
   * Generate sample
   */
  public getSample(frequency: number, sampleRate: number): number {
    const sample = this.generateWaveform();

    // Advance phase
    const phaseIncrement = (Math.PI * 2 * frequency) / sampleRate;
    this.phase += phaseIncrement;

    // Wrap phase
    while (this.phase >= Math.PI * 2) {
      this.phase -= Math.PI * 2;
    }

    return sample;
  }

  /**
   * Generate waveform
   */
  private generateWaveform(): number {
    switch (this.waveform) {
      case 'sine':
        return Math.sin(this.phase);

      case 'square':
        return this.phase < Math.PI ? 1 : -1;

      case 'sawtooth':
        return 1 - (2 * this.phase) / (Math.PI * 2);

      case 'triangle':
        if (this.phase < Math.PI) {
          return -1 + (2 * this.phase) / Math.PI;
        } else {
          return 3 - (2 * this.phase) / Math.PI;
        }

      case 'pulse':
        const pulseThreshold = this.pulseWidth * Math.PI * 2;
        return this.phase < pulseThreshold ? 1 : -1;

      case 'noise':
        return Math.random() * 2 - 1;

      case 'custom':
        if (this.customWaveform) {
          const index = Math.floor((this.phase / (Math.PI * 2)) * this.customWaveform.length);
          return this.customWaveform[index];
        }
        return 0;

      default:
        return Math.sin(this.phase);
    }
  }

  /**
   * Set custom waveform
   */
  public setCustomWaveform(waveform: Float32Array): void {
    this.customWaveform = waveform;
  }
}

/**
 * Biquad filter
 */
class BiquadFilter {
  private type: FilterType;
  private cutoff: number;
  private resonance: number;
  private sampleRate: number;

  // Filter coefficients
  private a0: number = 0;
  private a1: number = 0;
  private a2: number = 0;
  private b0: number = 0;
  private b1: number = 0;
  private b2: number = 0;

  // Filter state
  private x1: number = 0;
  private x2: number = 0;
  private y1: number = 0;
  private y2: number = 0;

  constructor(type: FilterType, cutoff: number, resonance: number, sampleRate: number) {
    this.type = type;
    this.cutoff = cutoff;
    this.resonance = resonance;
    this.sampleRate = sampleRate;

    this.calculateCoefficients();
  }

  /**
   * Calculate filter coefficients
   */
  private calculateCoefficients(): void {
    const omega = (2 * Math.PI * this.cutoff) / this.sampleRate;
    const sinOmega = Math.sin(omega);
    const cosOmega = Math.cos(omega);
    const alpha = sinOmega / (2 * this.resonance);

    switch (this.type) {
      case 'lowpass':
        this.b0 = (1 - cosOmega) / 2;
        this.b1 = 1 - cosOmega;
        this.b2 = (1 - cosOmega) / 2;
        this.a0 = 1 + alpha;
        this.a1 = -2 * cosOmega;
        this.a2 = 1 - alpha;
        break;

      case 'highpass':
        this.b0 = (1 + cosOmega) / 2;
        this.b1 = -(1 + cosOmega);
        this.b2 = (1 + cosOmega) / 2;
        this.a0 = 1 + alpha;
        this.a1 = -2 * cosOmega;
        this.a2 = 1 - alpha;
        break;

      case 'bandpass':
        this.b0 = alpha;
        this.b1 = 0;
        this.b2 = -alpha;
        this.a0 = 1 + alpha;
        this.a1 = -2 * cosOmega;
        this.a2 = 1 - alpha;
        break;

      case 'notch':
        this.b0 = 1;
        this.b1 = -2 * cosOmega;
        this.b2 = 1;
        this.a0 = 1 + alpha;
        this.a1 = -2 * cosOmega;
        this.a2 = 1 - alpha;
        break;

      case 'allpass':
        this.b0 = 1 - alpha;
        this.b1 = -2 * cosOmega;
        this.b2 = 1 + alpha;
        this.a0 = 1 + alpha;
        this.a1 = -2 * cosOmega;
        this.a2 = 1 - alpha;
        break;
    }

    // Normalize coefficients
    this.b0 /= this.a0;
    this.b1 /= this.a0;
    this.b2 /= this.a0;
    this.a1 /= this.a0;
    this.a2 /= this.a0;
  }

  /**
   * Process sample through filter
   */
  public process(input: number): number {
    const output = this.b0 * input + this.b1 * this.x1 + this.b2 * this.x2
                   - this.a1 * this.y1 - this.a2 * this.y2;

    // Update state
    this.x2 = this.x1;
    this.x1 = input;
    this.y2 = this.y1;
    this.y1 = output;

    return output;
  }

  /**
   * Update filter parameters
   */
  public setParameters(cutoff: number, resonance: number): void {
    if (cutoff !== this.cutoff || resonance !== this.resonance) {
      this.cutoff = cutoff;
      this.resonance = resonance;
      this.calculateCoefficients();
    }
  }
}

/**
 * LFO (Low Frequency Oscillator)
 */
class LFO {
  private rate: number;
  private phase: number;

  constructor(rate: number) {
    this.rate = rate;
    this.phase = 0;
  }

  /**
   * Get LFO value
   */
  public getValue(sampleRate: number): number {
    const value = Math.sin(this.phase);

    const phaseIncrement = (Math.PI * 2 * this.rate) / sampleRate;
    this.phase += phaseIncrement;

    while (this.phase >= Math.PI * 2) {
      this.phase -= Math.PI * 2;
    }

    return value;
  }

  /**
   * Set rate
   */
  public setRate(rate: number): void {
    this.rate = rate;
  }
}

/**
 * Main Synthesizer class
 */
export class Synthesizer {
  private sampleRate: number;
  private filterParams: any;
  private reverbParams: any;
  private compressionParams: any;

  constructor(sampleRate: number = 44100) {
    this.sampleRate = sampleRate;
    this.filterParams = {};
    this.reverbParams = {};
    this.compressionParams = {};
  }

  /**
   * Synthesize a single note
   */
  public synthesizeNote(
    pitch: number,
    startTime: number,
    duration: number,
    velocity: number,
    params: SynthParams
  ): Float32Array[] {
    const frequency = this.midiToFrequency(pitch);
    const numSamples = Math.ceil(duration * this.sampleRate);

    const leftChannel = new Float32Array(numSamples);
    const rightChannel = new Float32Array(numSamples);

    // Create oscillators
    const numOscillators = params.numOscillators || 1;
    const oscillators: Oscillator[] = [];

    for (let i = 0; i < numOscillators; i++) {
      oscillators.push(new Oscillator(params.waveform, params.pulseWidth || 0.5));
    }

    // Create envelopes
    const ampEnvelope = new EnvelopeGenerator(
      params.attack,
      params.decay,
      params.sustain,
      params.release
    );

    const filterEnvelope = new EnvelopeGenerator(
      params.filterAttack || params.attack,
      params.filterDecay || params.decay,
      params.filterSustain || params.sustain,
      params.filterRelease || params.release
    );

    // Create filter
    const filter = new BiquadFilter(
      params.filterType || 'lowpass',
      params.filterCutoff,
      params.filterResonance,
      this.sampleRate
    );

    // Create LFO
    const lfo = params.lfoRate ? new LFO(params.lfoRate) : null;

    // Trigger envelopes
    ampEnvelope.trigger();
    filterEnvelope.trigger();

    const releaseTime = duration - params.release;
    const deltaTime = 1 / this.sampleRate;

    for (let i = 0; i < numSamples; i++) {
      const time = i / this.sampleRate;

      // Trigger release
      if (time >= releaseTime && ampEnvelope.isActive()) {
        ampEnvelope.triggerRelease();
        filterEnvelope.triggerRelease();
      }

      // Get envelope values
      const ampEnv = ampEnvelope.getValue(time, deltaTime);
      const filterEnv = filterEnvelope.getValue(time, deltaTime);

      // Get LFO value
      let lfoValue = 0;
      if (lfo) {
        lfoValue = lfo.getValue(this.sampleRate);
      }

      // Calculate modulated frequency
      let modulatedFrequency = frequency;

      if (lfo && params.lfoTarget === 'pitch') {
        const pitchMod = lfoValue * (params.lfoAmount || 0) * 100; // cents
        modulatedFrequency *= Math.pow(2, pitchMod / 1200);
      }

      // Generate oscillator samples
      let sample = 0;

      for (let j = 0; j < oscillators.length; j++) {
        const detune = params.unisonDetune
          ? ((j - (numOscillators - 1) / 2) * params.unisonDetune) / 100
          : 0;

        const oscFreq = modulatedFrequency * Math.pow(2, detune / 12);
        sample += oscillators[j].getSample(oscFreq, this.sampleRate);
      }

      sample /= numOscillators; // Average oscillators

      // Apply filter with envelope modulation
      let filterCutoff = params.filterCutoff;

      if (params.filterEnvAmount) {
        filterCutoff += filterEnv * params.filterEnvAmount * 10000;
        filterCutoff = Math.max(20, Math.min(20000, filterCutoff));
      }

      if (lfo && params.lfoTarget === 'filter') {
        filterCutoff += lfoValue * (params.lfoAmount || 0) * 5000;
        filterCutoff = Math.max(20, Math.min(20000, filterCutoff));
      }

      filter.setParameters(filterCutoff, params.filterResonance);
      sample = filter.process(sample);

      // Apply amplitude envelope
      let finalSample = sample * ampEnv;

      // Apply velocity
      finalSample *= velocity / 127;

      // LFO amplitude modulation (tremolo)
      if (lfo && params.lfoTarget === 'amplitude') {
        const tremolo = 1 + lfoValue * (params.lfoAmount || 0) * 0.5;
        finalSample *= tremolo;
      }

      // Stereo (slightly different for each channel for width)
      leftChannel[i] = finalSample;
      rightChannel[i] = finalSample * 0.95; // Slight difference for stereo width
    }

    return [leftChannel, rightChannel];
  }

  /**
   * Synthesize a chord
   */
  public synthesizeChord(
    notes: any[],
    startTime: number,
    duration: number,
    params: SynthParams
  ): Float32Array[] {
    const numSamples = Math.ceil(duration * this.sampleRate);
    const leftChannel = new Float32Array(numSamples);
    const rightChannel = new Float32Array(numSamples);

    // Synthesize each note and mix
    for (const note of notes) {
      const [left, right] = this.synthesizeNote(
        note.pitch,
        startTime,
        duration,
        100,
        params
      );

      // Mix into output
      for (let i = 0; i < Math.min(numSamples, left.length); i++) {
        leftChannel[i] += left[i] / notes.length;
        rightChannel[i] += right[i] / notes.length;
      }
    }

    return [leftChannel, rightChannel];
  }

  /**
   * Synthesize drum hit
   */
  public synthesizeDrum(
    instrument: string,
    startTime: number,
    velocity: number
  ): Float32Array[] {
    let params: SynthParams;
    let duration: number;

    switch (instrument) {
      case 'kick':
        params = {
          waveform: 'sine',
          attack: 0.001,
          decay: 0.3,
          sustain: 0,
          release: 0.1,
          filterCutoff: 150,
          filterResonance: 2
        };
        duration = 0.5;
        // Pitch envelope for kick (starts high, drops quickly)
        return this.synthesizeKick(velocity);

      case 'snare':
        params = {
          waveform: 'noise',
          attack: 0.001,
          decay: 0.15,
          sustain: 0,
          release: 0.05,
          filterCutoff: 3000,
          filterResonance: 1
        };
        duration = 0.2;
        return this.synthesizeSnare(velocity);

      case 'hihat-closed':
        params = {
          waveform: 'noise',
          attack: 0.001,
          decay: 0.05,
          sustain: 0,
          release: 0.02,
          filterCutoff: 8000,
          filterResonance: 1
        };
        duration = 0.08;
        break;

      case 'hihat-open':
        params = {
          waveform: 'noise',
          attack: 0.001,
          decay: 0.2,
          sustain: 0.3,
          release: 0.1,
          filterCutoff: 10000,
          filterResonance: 1
        };
        duration = 0.4;
        break;

      default:
        params = {
          waveform: 'sine',
          attack: 0.01,
          decay: 0.1,
          sustain: 0,
          release: 0.1,
          filterCutoff: 1000,
          filterResonance: 1
        };
        duration = 0.2;
        break;
    }

    return this.synthesizeNote(60, startTime, duration, velocity, params);
  }

  /**
   * Synthesize kick drum
   */
  private synthesizeKick(velocity: number): Float32Array[] {
    const duration = 0.5;
    const numSamples = Math.ceil(duration * this.sampleRate);

    const leftChannel = new Float32Array(numSamples);
    const rightChannel = new Float32Array(numSamples);

    const osc = new Oscillator('sine');

    for (let i = 0; i < numSamples; i++) {
      const time = i / this.sampleRate;
      const envelope = Math.exp(-time * 8); // Exponential decay

      // Pitch envelope (starts at ~150Hz, drops to ~50Hz)
      const pitch = 50 + 100 * Math.exp(-time * 20);

      let sample = osc.getSample(pitch, this.sampleRate);
      sample *= envelope * (velocity / 127);

      // Add click
      const click = Math.exp(-time * 200) * 0.3;
      sample += click;

      leftChannel[i] = sample;
      rightChannel[i] = sample;
    }

    return [leftChannel, rightChannel];
  }

  /**
   * Synthesize snare drum
   */
  private synthesizeSnare(velocity: number): Float32Array[] {
    const duration = 0.2;
    const numSamples = Math.ceil(duration * this.sampleRate);

    const leftChannel = new Float32Array(numSamples);
    const rightChannel = new Float32Array(numSamples);

    const toneOsc = new Oscillator('triangle');
    const noiseOsc = new Oscillator('noise');

    for (let i = 0; i < numSamples; i++) {
      const time = i / this.sampleRate;
      const envelope = Math.exp(-time * 15);

      // Tone component (200Hz)
      const tone = toneOsc.getSample(200, this.sampleRate) * 0.4;

      // Noise component
      const noise = noiseOsc.getSample(0, this.sampleRate) * 0.6;

      let sample = (tone + noise) * envelope * (velocity / 127);

      leftChannel[i] = sample;
      rightChannel[i] = sample;
    }

    return [leftChannel, rightChannel];
  }

  /**
   * Apply reverb effect
   */
  public applyReverb(
    leftChannel: Float32Array,
    rightChannel: Float32Array,
    params: { mix: number; decay: number; preDelay: number }
  ): void {
    const delayTime = params.preDelay * this.sampleRate;
    const decayFactor = Math.exp(-1 / (params.decay * this.sampleRate));

    // Simple reverb using comb filters
    const combDelays = [1557, 1617, 1491, 1422, 1277, 1356, 1188, 1116];
    const combBuffers = combDelays.map(delay => ({
      buffer: new Float32Array(delay),
      index: 0
    }));

    for (let i = 0; i < leftChannel.length; i++) {
      let reverbSample = 0;

      // Process through comb filters
      for (let j = 0; j < combBuffers.length; j++) {
        const comb = combBuffers[j];
        const delayed = comb.buffer[comb.index];

        reverbSample += delayed;

        // Write new sample with feedback
        comb.buffer[comb.index] = leftChannel[i] + delayed * decayFactor;

        // Advance index
        comb.index = (comb.index + 1) % comb.buffer.length;
      }

      reverbSample /= combBuffers.length;

      // Mix with dry signal
      const wet = reverbSample * params.mix;
      const dry = leftChannel[i] * (1 - params.mix);

      leftChannel[i] = dry + wet;
      rightChannel[i] = dry + wet * 0.9; // Slight stereo difference
    }
  }

  /**
   * Apply compression
   */
  public applyCompression(
    channel: Float32Array,
    params: { threshold: number; ratio: number; attack: number; release: number }
  ): void {
    const thresholdLinear = Math.pow(10, params.threshold / 20);
    const attackSamples = params.attack * this.sampleRate;
    const releaseSamples = params.release * this.sampleRate;

    let envelope = 1;

    for (let i = 0; i < channel.length; i++) {
      const inputLevel = Math.abs(channel[i]);

      // Calculate target gain reduction
      let targetGain = 1;

      if (inputLevel > thresholdLinear) {
        const excess = inputLevel / thresholdLinear;
        const gainReduction = Math.pow(excess, 1 / params.ratio - 1);
        targetGain = gainReduction;
      }

      // Apply attack/release
      if (targetGain < envelope) {
        // Attack
        envelope = targetGain + (envelope - targetGain) * Math.exp(-1 / attackSamples);
      } else {
        // Release
        envelope = targetGain + (envelope - targetGain) * Math.exp(-1 / releaseSamples);
      }

      channel[i] *= envelope;
    }
  }

  /**
   * Convert MIDI note to frequency
   */
  private midiToFrequency(midiNote: number): number {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }

  /**
   * Set filter parameters (for real-time modification)
   */
  public setFilterParams(params: any): void {
    this.filterParams = { ...this.filterParams, ...params };
  }

  /**
   * Set reverb parameters
   */
  public setReverbParams(params: any): void {
    this.reverbParams = { ...this.reverbParams, ...params };
  }

  /**
   * Set compression parameters
   */
  public setCompressionParams(params: any): void {
    this.compressionParams = { ...this.compressionParams, ...params };
  }

  /**
   * Get available instruments
   */
  public getAvailableInstruments(): string[] {
    return [
      'piano',
      'bass',
      'lead',
      'pad',
      'strings',
      'brass',
      'organ',
      'pluck',
      'drums'
    ];
  }

  /**
   * Create custom waveform from harmonics
   */
  public createWaveformFromHarmonics(harmonics: number[]): Float32Array {
    const tableSize = 2048;
    const waveform = new Float32Array(tableSize);

    for (let i = 0; i < tableSize; i++) {
      const phase = (i / tableSize) * Math.PI * 2;
      let sample = 0;

      for (let h = 0; h < harmonics.length; h++) {
        sample += harmonics[h] * Math.sin(phase * (h + 1));
      }

      waveform[i] = sample;
    }

    // Normalize
    let max = 0;
    for (let i = 0; i < tableSize; i++) {
      max = Math.max(max, Math.abs(waveform[i]));
    }

    if (max > 0) {
      for (let i = 0; i < tableSize; i++) {
        waveform[i] /= max;
      }
    }

    return waveform;
  }

  /**
   * Apply distortion
   */
  public applyDistortion(
    channel: Float32Array,
    amount: number
  ): void {
    for (let i = 0; i < channel.length; i++) {
      const x = channel[i] * amount;
      channel[i] = Math.tanh(x) / amount;
    }
  }

  /**
   * Apply chorus effect
   */
  public applyChorus(
    leftChannel: Float32Array,
    rightChannel: Float32Array,
    mix: number,
    rate: number = 0.5,
    depth: number = 0.002
  ): void {
    const delayBuffer = new Float32Array(Math.ceil(depth * 2 * this.sampleRate));
    let writeIndex = 0;
    let lfoPhase = 0;

    for (let i = 0; i < leftChannel.length; i++) {
      // LFO for delay modulation
      const lfoValue = Math.sin(lfoPhase);
      lfoPhase += (Math.PI * 2 * rate) / this.sampleRate;

      // Calculate delay time
      const delayTime = (depth + lfoValue * depth) * this.sampleRate;
      const readIndex = (writeIndex - delayTime + delayBuffer.length) % delayBuffer.length;
      const readIndexInt = Math.floor(readIndex);
      const frac = readIndex - readIndexInt;

      // Linear interpolation
      const sample1 = delayBuffer[readIndexInt];
      const sample2 = delayBuffer[(readIndexInt + 1) % delayBuffer.length];
      const delayedSample = sample1 + frac * (sample2 - sample1);

      // Write to buffer
      delayBuffer[writeIndex] = leftChannel[i];
      writeIndex = (writeIndex + 1) % delayBuffer.length;

      // Mix
      leftChannel[i] = leftChannel[i] * (1 - mix) + delayedSample * mix;
      rightChannel[i] = rightChannel[i] * (1 - mix) + delayedSample * mix * 0.9;
    }
  }
}

export default Synthesizer;

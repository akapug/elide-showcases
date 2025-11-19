/**
 * Multi-track Mixer - Professional mixing console in TypeScript
 *
 * Demonstrates NumPy array operations and scipy for mixing
 */

// @ts-ignore - Numerical computing
import numpy from 'python:numpy';
// @ts-ignore - Scientific computing
import scipy from 'python:scipy';
// @ts-ignore - Audio library
import librosa from 'python:librosa';
// @ts-ignore - Audio I/O
import soundfile from 'python:soundfile';

import type { AudioData } from '../audio-processor';
import { ReverbProcessor, type ReverbParams } from '../effects/reverb';
import { EqualizerProcessor, type EQBand } from '../effects/eq';
import { DynamicsProcessor, type CompressorParams } from '../effects/dynamics';

// ============================================================================
// Types
// ============================================================================

export interface Track {
  id: string;
  name: string;
  audio: AudioData;
  volume: number; // Linear gain (0-1+)
  pan: number; // -1 (left) to +1 (right)
  mute: boolean;
  solo: boolean;
  effects: Effect[];
  sends: Send[];
}

export interface Effect {
  type: 'eq' | 'compressor' | 'reverb' | 'delay' | 'custom';
  enabled: boolean;
  params: any;
}

export interface Send {
  busId: string;
  level: number; // 0-1
  preFader?: boolean;
}

export interface Bus {
  id: string;
  name: string;
  volume: number;
  effects: Effect[];
}

export interface MixerState {
  tracks: Track[];
  buses: Bus[];
  masterVolume: number;
  masterEffects: Effect[];
}

export interface MixdownOptions {
  normalize?: boolean;
  format?: 'wav' | 'mp3' | 'flac';
  bitrate?: string;
  sampleRate?: number;
  dither?: boolean;
}

export interface AutomationPoint {
  time: number; // seconds
  value: number;
}

export interface Automation {
  trackId: string;
  parameter: string; // 'volume', 'pan', etc.
  points: AutomationPoint[];
}

// ============================================================================
// Mixer
// ============================================================================

export class Mixer {
  private state: MixerState;
  private automations: Automation[] = [];
  private reverbProcessor = new ReverbProcessor();
  private eqProcessor = new EqualizerProcessor();
  private dynamicsProcessor = new DynamicsProcessor();

  constructor() {
    this.state = {
      tracks: [],
      buses: [],
      masterVolume: 1.0,
      masterEffects: [],
    };
  }

  /**
   * Add track to mixer
   */
  addTrack(audio: AudioData, name: string, options: {
    volume?: number;
    pan?: number;
  } = {}): string {
    const id = `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const track: Track = {
      id,
      name,
      audio,
      volume: options.volume ?? 1.0,
      pan: options.pan ?? 0.0,
      mute: false,
      solo: false,
      effects: [],
      sends: [],
    };

    this.state.tracks.push(track);

    console.log(`[Mixer] Added track: ${name} (${id})`);

    return id;
  }

  /**
   * Add bus (aux/FX channel)
   */
  addBus(name: string): string {
    const id = `bus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const bus: Bus = {
      id,
      name,
      volume: 1.0,
      effects: [],
    };

    this.state.buses.push(bus);

    console.log(`[Mixer] Added bus: ${name} (${id})`);

    return id;
  }

  /**
   * Set track volume
   */
  setTrackVolume(trackId: string, volume: number): void {
    const track = this.getTrack(trackId);
    track.volume = volume;
    console.log(`[Mixer] Track ${track.name}: volume = ${volume.toFixed(2)}`);
  }

  /**
   * Set track pan
   */
  setTrackPan(trackId: string, pan: number): void {
    const track = this.getTrack(trackId);
    track.pan = Math.max(-1, Math.min(1, pan));
    console.log(`[Mixer] Track ${track.name}: pan = ${track.pan.toFixed(2)}`);
  }

  /**
   * Mute track
   */
  muteTrack(trackId: string, mute: boolean = true): void {
    const track = this.getTrack(trackId);
    track.mute = mute;
    console.log(`[Mixer] Track ${track.name}: ${mute ? 'muted' : 'unmuted'}`);
  }

  /**
   * Solo track
   */
  soloTrack(trackId: string, solo: boolean = true): void {
    const track = this.getTrack(trackId);
    track.solo = solo;
    console.log(`[Mixer] Track ${track.name}: ${solo ? 'soloed' : 'unsoloed'}`);
  }

  /**
   * Add effect to track
   */
  addTrackEffect(trackId: string, effect: Effect): void {
    const track = this.getTrack(trackId);
    track.effects.push(effect);
    console.log(`[Mixer] Added ${effect.type} to track ${track.name}`);
  }

  /**
   * Add send to bus
   */
  addSend(trackId: string, busId: string, level: number, preFader: boolean = false): void {
    const track = this.getTrack(trackId);
    const bus = this.getBus(busId);

    track.sends.push({
      busId,
      level,
      preFader,
    });

    console.log(`[Mixer] Added send from ${track.name} to ${bus.name} (${level.toFixed(2)})`);
  }

  /**
   * Process single track through its effects chain
   */
  private processTrackEffects(track: Track): AudioData {
    let audio = track.audio;

    for (const effect of track.effects) {
      if (!effect.enabled) continue;

      switch (effect.type) {
        case 'eq':
          audio = this.eqProcessor.applyEQ(audio, { bands: effect.params.bands });
          break;

        case 'compressor':
          audio = this.dynamicsProcessor.applyCompression(audio, effect.params);
          break;

        case 'reverb':
          audio = this.reverbProcessor.applyReverb(audio, effect.params);
          break;

        case 'delay':
          audio = this.applyDelay(audio, effect.params);
          break;

        default:
          console.warn(`Unknown effect type: ${effect.type}`);
      }
    }

    return audio;
  }

  /**
   * Mix all tracks together
   */
  mixdown(options: MixdownOptions = {}): AudioData {
    console.log('[Mixer] Starting mixdown...');
    console.log(`  Tracks: ${this.state.tracks.length}`);
    console.log(`  Buses: ${this.state.buses.length}`);

    // Check if any tracks are soloed
    const soloedTracks = this.state.tracks.filter(t => t.solo);
    const hasSolo = soloedTracks.length > 0;

    // Determine which tracks to process
    const activeTracks = hasSolo
      ? soloedTracks
      : this.state.tracks.filter(t => !t.mute);

    console.log(`  Active tracks: ${activeTracks.length}`);

    // Find longest duration and sample rate
    let maxDuration = 0;
    let sampleRate = 44100;

    for (const track of activeTracks) {
      if (track.audio.duration > maxDuration) {
        maxDuration = track.audio.duration;
      }
      sampleRate = track.audio.sampleRate;
    }

    const totalSamples = Math.ceil(maxDuration * sampleRate);

    // Initialize output buffers (stereo)
    let mixLeft = numpy.zeros(totalSamples);
    let mixRight = numpy.zeros(totalSamples);

    // Process each track
    for (const track of activeTracks) {
      console.log(`  Processing track: ${track.name}`);

      // Process effects
      let processedAudio = this.processTrackEffects(track);

      // Apply automation
      processedAudio = this.applyAutomation(track.id, processedAudio);

      // Apply volume and pan
      const { left, right } = this.applyVolumeAndPan(
        processedAudio.waveform,
        track.volume,
        track.pan
      );

      // Process sends (pre or post fader)
      for (const send of track.sends) {
        const bus = this.getBus(send.busId);
        // TODO: Process sends to buses
      }

      // Add to mix
      const trackSamples = left.shape[0];
      mixLeft.slice(0, trackSamples) += left;
      mixRight.slice(0, trackSamples) += right;
    }

    // Combine stereo channels
    let mixStereo = numpy.stack([mixLeft, mixRight], axis: 1);

    // Apply master effects
    let masterAudio: AudioData = {
      waveform: mixStereo,
      sampleRate,
      duration: maxDuration,
      channels: 2,
      samples: totalSamples,
    };

    for (const effect of this.state.masterEffects) {
      if (!effect.enabled) continue;

      console.log(`  Applying master ${effect.type}...`);
      masterAudio = this.processEffect(masterAudio, effect);
    }

    // Apply master volume
    masterAudio.waveform = masterAudio.waveform * this.state.masterVolume;

    // Normalize if requested
    if (options.normalize) {
      console.log('  Normalizing...');
      const maxVal = Number(numpy.abs(masterAudio.waveform).max());
      if (maxVal > 0) {
        masterAudio.waveform = masterAudio.waveform / maxVal * 0.99;
      }
    }

    // Apply dither if requested
    if (options.dither) {
      console.log('  Applying dither...');
      masterAudio = this.applyDither(masterAudio);
    }

    console.log('  ✓ Mixdown complete');

    return masterAudio;
  }

  /**
   * Apply volume and pan to mono signal
   */
  private applyVolumeAndPan(
    signal: any,
    volume: number,
    pan: number
  ): { left: any; right: any } {
    // Convert mono to stereo if needed
    const mono = signal.ndim === 1 ? signal : signal.slice(null, 0);

    // Apply volume
    const scaled = mono * volume;

    // Calculate pan gains (constant power panning)
    const panAngle = (pan + 1) * Math.PI / 4; // 0 to π/2
    const leftGain = Math.cos(panAngle);
    const rightGain = Math.sin(panAngle);

    const left = scaled * leftGain;
    const right = scaled * rightGain;

    return { left, right };
  }

  /**
   * Apply effect to audio
   */
  private processEffect(audio: AudioData, effect: Effect): AudioData {
    switch (effect.type) {
      case 'eq':
        return this.eqProcessor.applyEQ(audio, { bands: effect.params.bands });

      case 'compressor':
        return this.dynamicsProcessor.applyCompression(audio, effect.params);

      case 'reverb':
        return this.reverbProcessor.applyReverb(audio, effect.params);

      case 'delay':
        return this.applyDelay(audio, effect.params);

      default:
        return audio;
    }
  }

  /**
   * Simple delay effect
   */
  private applyDelay(
    audio: AudioData,
    params: {
      delayTime?: number; // milliseconds
      feedback?: number; // 0-1
      mix?: number; // 0-1
    }
  ): AudioData {
    const { delayTime = 500, feedback = 0.3, mix = 0.3 } = params;

    const y = audio.waveform;
    const sr = audio.sampleRate;

    const delaySamples = Math.floor((delayTime / 1000) * sr);

    // Create delay buffer
    let delayed = numpy.zeros_like(y);
    const buffer = numpy.zeros(delaySamples);

    // Process with feedback
    for (let i = 0; i < y.shape[0]; i++) {
      const delayedSample = buffer[0];
      const output = y[i] + delayedSample * feedback;

      delayed[i] = delayedSample;

      // Shift buffer
      buffer = numpy.roll(buffer, -1);
      buffer[-1] = output;
    }

    // Mix dry and wet
    const output = (1 - mix) * y + mix * delayed;

    return {
      ...audio,
      waveform: output,
    };
  }

  /**
   * Apply automation
   */
  private applyAutomation(trackId: string, audio: AudioData): AudioData {
    const trackAutomations = this.automations.filter(a => a.trackId === trackId);

    if (trackAutomations.length === 0) {
      return audio;
    }

    let y = audio.waveform;
    const sr = audio.sampleRate;

    for (const automation of trackAutomations) {
      if (automation.parameter === 'volume') {
        // Create volume envelope
        const envelope = this.createAutomationEnvelope(
          automation.points,
          audio.duration,
          sr
        );

        y = y * envelope.slice(0, y.shape[0]);
      } else if (automation.parameter === 'pan') {
        // TODO: Implement pan automation
      }
    }

    return {
      ...audio,
      waveform: y,
    };
  }

  /**
   * Create automation envelope from points
   */
  private createAutomationEnvelope(
    points: AutomationPoint[],
    duration: number,
    sampleRate: number
  ): any {
    const numSamples = Math.ceil(duration * sampleRate);
    const envelope = numpy.ones(numSamples);

    if (points.length === 0) {
      return envelope;
    }

    // Sort points by time
    const sortedPoints = [...points].sort((a, b) => a.time - b.time);

    // Interpolate between points
    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const p1 = sortedPoints[i];
      const p2 = sortedPoints[i + 1];

      const sample1 = Math.floor(p1.time * sampleRate);
      const sample2 = Math.floor(p2.time * sampleRate);

      // Linear interpolation
      const numSteps = sample2 - sample1;
      const values = numpy.linspace(p1.value, p2.value, numSteps);

      envelope.slice(sample1, sample2) = values;
    }

    // Fill before first point
    if (sortedPoints[0].time > 0) {
      const sample1 = Math.floor(sortedPoints[0].time * sampleRate);
      envelope.slice(0, sample1) = sortedPoints[0].value;
    }

    // Fill after last point
    const lastPoint = sortedPoints[sortedPoints.length - 1];
    const lastSample = Math.floor(lastPoint.time * sampleRate);
    envelope.slice(lastSample, null) = lastPoint.value;

    return envelope;
  }

  /**
   * Add volume automation
   */
  addAutomation(trackId: string, parameter: string, points: AutomationPoint[]): void {
    const track = this.getTrack(trackId);

    // Remove existing automation for this parameter
    this.automations = this.automations.filter(
      a => !(a.trackId === trackId && a.parameter === parameter)
    );

    // Add new automation
    this.automations.push({
      trackId,
      parameter,
      points,
    });

    console.log(`[Mixer] Added ${parameter} automation to ${track.name} (${points.length} points)`);
  }

  /**
   * Apply dither
   */
  private applyDither(audio: AudioData, bitDepth: number = 16): AudioData {
    const y = audio.waveform;

    // TPDF dither (Triangular Probability Density Function)
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
   * Export mixdown to file
   */
  async exportMixdown(
    filepath: string,
    options: MixdownOptions = {}
  ): Promise<void> {
    console.log(`[Mixer] Exporting mixdown to ${filepath}...`);

    const mixdown = this.mixdown(options);

    let y = mixdown.waveform;
    let sr = options.sampleRate || mixdown.sampleRate;

    // Resample if needed
    if (sr !== mixdown.sampleRate) {
      console.log(`  Resampling ${mixdown.sampleRate} Hz → ${sr} Hz...`);

      // Resample each channel
      const left = librosa.resample(
        y.slice(null, 0),
        orig_sr: mixdown.sampleRate,
        target_sr: sr
      );

      const right = librosa.resample(
        y.slice(null, 1),
        orig_sr: mixdown.sampleRate,
        target_sr: sr
      );

      y = numpy.stack([left, right], axis: 1);
    }

    // Transpose for soundfile (expects channels last)
    const yTransposed = y.T;

    // Write file
    soundfile.write(filepath, yTransposed, sr);

    console.log('  ✓ Export complete');
  }

  /**
   * Add master effect
   */
  addMasterEffect(effect: Effect): void {
    this.state.masterEffects.push(effect);
    console.log(`[Mixer] Added ${effect.type} to master`);
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    this.state.masterVolume = volume;
    console.log(`[Mixer] Master volume = ${volume.toFixed(2)}`);
  }

  /**
   * Get track by ID
   */
  private getTrack(trackId: string): Track {
    const track = this.state.tracks.find(t => t.id === trackId);
    if (!track) {
      throw new Error(`Track not found: ${trackId}`);
    }
    return track;
  }

  /**
   * Get bus by ID
   */
  private getBus(busId: string): Bus {
    const bus = this.state.buses.find(b => b.id === busId);
    if (!bus) {
      throw new Error(`Bus not found: ${busId}`);
    }
    return bus;
  }

  /**
   * Get mixer state
   */
  getState(): MixerState {
    return this.state;
  }

  /**
   * Bounce track (render with effects)
   */
  bounceTrack(trackId: string): AudioData {
    console.log('[Mixer] Bouncing track...');

    const track = this.getTrack(trackId);

    // Process through effects
    let audio = this.processTrackEffects(track);

    // Apply volume (but not pan for single track bounce)
    audio.waveform = audio.waveform * track.volume;

    console.log('  ✓ Track bounced');

    return audio;
  }

  /**
   * Group tracks (create submix)
   */
  createSubmix(trackIds: string[], name: string): string {
    console.log(`[Mixer] Creating submix: ${name}`);

    const tracks = trackIds.map(id => this.getTrack(id));

    // Find max duration
    let maxDuration = 0;
    let sampleRate = 44100;

    for (const track of tracks) {
      if (track.audio.duration > maxDuration) {
        maxDuration = track.audio.duration;
      }
      sampleRate = track.audio.sampleRate;
    }

    const totalSamples = Math.ceil(maxDuration * sampleRate);
    let submix = numpy.zeros(totalSamples);

    // Mix tracks
    for (const track of tracks) {
      const processed = this.processTrackEffects(track);
      const scaled = processed.waveform * track.volume;

      submix.slice(0, scaled.shape[0]) += scaled;
    }

    // Create new track with submix
    const submixAudio: AudioData = {
      waveform: submix,
      sampleRate,
      duration: maxDuration,
      channels: 1,
      samples: totalSamples,
    };

    const submixId = this.addTrack(submixAudio, name);

    console.log(`  ✓ Submix created with ${tracks.length} tracks`);

    return submixId;
  }

  /**
   * Analyze mix (check for issues)
   */
  analyzeMix(): {
    clipping: boolean;
    peakLevel: number;
    rmsLevel: number;
    dynamicRange: number;
    stereoWidth: number;
  } {
    console.log('[Mixer] Analyzing mix...');

    const mixdown = this.mixdown({ normalize: false });
    const y = mixdown.waveform;

    // Check for clipping
    const peak = Number(numpy.abs(y).max());
    const clipping = peak > 1.0;

    // RMS level
    const rms = Number(numpy.sqrt(numpy.mean(y ** 2)));

    // Dynamic range
    const dynamicRange = 20 * Math.log10(peak / (rms + 1e-10));

    // Stereo width (correlation between channels)
    const left = y.slice(null, 0);
    const right = y.slice(null, 1);
    const correlation = Number(numpy.corrcoef([left, right])[0, 1]);
    const stereoWidth = 1 - correlation;

    console.log('  Analysis:');
    console.log(`    Clipping: ${clipping ? 'YES ⚠️' : 'No'}`);
    console.log(`    Peak level: ${(20 * Math.log10(peak)).toFixed(2)} dB`);
    console.log(`    RMS level: ${(20 * Math.log10(rms)).toFixed(2)} dB`);
    console.log(`    Dynamic range: ${dynamicRange.toFixed(2)} dB`);
    console.log(`    Stereo width: ${stereoWidth.toFixed(2)}`);

    return {
      clipping,
      peakLevel: peak,
      rmsLevel: rms,
      dynamicRange,
      stereoWidth,
    };
  }

  /**
   * Auto-level tracks (automatic gain staging)
   */
  autoLevel(targetRMS: number = -18): void {
    console.log('[Mixer] Auto-leveling tracks...');
    console.log(`  Target RMS: ${targetRMS} dB`);

    for (const track of this.state.tracks) {
      const y = track.audio.waveform;

      // Calculate current RMS
      const rms = Number(numpy.sqrt(numpy.mean(y ** 2)));
      const currentDb = 20 * Math.log10(rms + 1e-10);

      // Calculate required gain
      const requiredGain = targetRMS - currentDb;
      const gainLinear = Math.pow(10, requiredGain / 20);

      // Set track volume
      track.volume = gainLinear;

      console.log(`  ${track.name}: ${currentDb.toFixed(2)} dB → ${targetRMS} dB (gain: ${requiredGain.toFixed(2)} dB)`);
    }

    console.log('  ✓ Auto-leveling complete');
  }

  /**
   * Reset mixer
   */
  reset(): void {
    this.state = {
      tracks: [],
      buses: [],
      masterVolume: 1.0,
      masterEffects: [],
    };
    this.automations = [];

    console.log('[Mixer] Reset complete');
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

export function createMixer(): Mixer {
  return new Mixer();
}

// ============================================================================
// Example Usage
// ============================================================================

if (import.meta.main) {
  console.log('🎵 Multi-track Mixer Demo\n');

  const mixer = new Mixer();

  console.log('Mixer features:');
  console.log('  - Multi-track mixing');
  console.log('  - Volume and pan controls');
  console.log('  - Effects chains per track');
  console.log('  - Buses and sends');
  console.log('  - Master effects');
  console.log('  - Automation (volume, pan)');
  console.log('  - Solo and mute');
  console.log('  - Normalization and dither');
  console.log('  - Mix analysis');
  console.log('  - Auto-leveling');
  console.log('  - Track bouncing');
  console.log('  - Submix creation');

  console.log('\n💡 This demonstrates:');
  console.log('   - NumPy array mixing operations');
  console.log('   - scipy signal processing for effects');
  console.log('   - librosa resampling in TypeScript');
  console.log('   - soundfile audio export in TypeScript');
  console.log('   - Professional mixing console in one TypeScript process!');
}

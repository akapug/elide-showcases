/**
 * Melody Generator
 *
 * Advanced melody generation engine with music theory awareness,
 * contour shaping, motivic development, and style-specific patterns.
 *
 * Features:
 * - Scale-aware melody generation
 * - Chord tone targeting
 * - Contour shaping (arch, ascending, descending, wave)
 * - Motivic development and variation
 * - Rhythmic patterns
 * - Style-specific idioms (jazz, classical, pop, etc.)
 * - Ornamentation (trills, grace notes, slides)
 */

import { Scale, SCALES, Chord, Note } from './chord-progressions';

/**
 * Melody note
 */
export interface MelodyNote {
  pitch: number; // MIDI note number
  startTime: number; // in seconds
  duration: number; // in seconds
  velocity: number; // 0-127
  isChordTone: boolean;
  articulation?: 'staccato' | 'legato' | 'accent' | 'tenuto';
  ornament?: 'trill' | 'mordent' | 'turn' | 'grace' | 'slide';
}

/**
 * Melody contour types
 */
export type ContourType =
  | 'arch' // Rise to peak, then fall
  | 'inverted-arch' // Fall to valley, then rise
  | 'ascending' // Generally rising
  | 'descending' // Generally falling
  | 'wave' // Alternating up and down
  | 'static' // Stay in same range
  | 'random'; // No particular shape

/**
 * Melody generation parameters
 */
export interface MelodyParams {
  key: string;
  mode: string;
  chordProgression: any[];
  numBars: number;
  style: string;
  contour?: ContourType;
  range?: [number, number]; // [min, max] MIDI notes
  notesDensity?: 'sparse' | 'medium' | 'dense';
  syncopation?: number; // 0-1
  chromaticism?: number; // 0-1
  ornamentation?: number; // 0-1
}

/**
 * Motif - a short melodic idea
 */
interface Motif {
  intervals: number[]; // Semitone intervals
  rhythm: number[]; // Note durations
  length: number; // Number of notes
}

/**
 * Melody generator
 */
export class MelodyGenerator {
  private scale!: Scale;
  private scaleNotes: number[] = [];
  private chordTones: Map<number, Set<number>> = new Map();

  /**
   * Generate melody
   */
  public generate(params: MelodyParams): MelodyNote[] {
    this.initialize(params);

    const melody: MelodyNote[] = [];
    const beatsPerBar = 4;
    const beatDuration = 60 / 120; // Assume 120 BPM
    const totalBeats = params.numBars * beatsPerBar;

    // Generate based on style
    switch (params.style) {
      case 'jazz':
        return this.generateJazzMelody(params, totalBeats, beatDuration);
      case 'classical':
        return this.generateClassicalMelody(params, totalBeats, beatDuration);
      case 'edm':
        return this.generateEDMMelody(params, totalBeats, beatDuration);
      case 'rock':
        return this.generateRockMelody(params, totalBeats, beatDuration);
      default:
        return this.generateGenericMelody(params, totalBeats, beatDuration);
    }
  }

  /**
   * Initialize generator
   */
  private initialize(params: MelodyParams): void {
    this.scale = SCALES[params.mode] || SCALES['major'];
    this.scaleNotes = this.scale.getNotes(params.key, 4).map(n => n.pitch % 12);

    // Extract chord tones for each bar
    this.chordTones.clear();
    params.chordProgression.forEach((chord, i) => {
      const tones = new Set(chord.notes.map((n: any) => n.pitch % 12));
      this.chordTones.set(i, tones);
    });
  }

  /**
   * Generate jazz melody
   */
  private generateJazzMelody(
    params: MelodyParams,
    totalBeats: number,
    beatDuration: number
  ): MelodyNote[] {
    const melody: MelodyNote[] = [];
    let currentTime = 0;
    let currentPitch = this.getStartingPitch(params);

    // Create motif
    const motif = this.createMotif(4, 'jazz');

    while (currentTime < totalBeats * beatDuration) {
      const bar = Math.floor(currentTime / (beatDuration * 4));
      const chordTones = this.chordTones.get(bar % params.chordProgression.length);

      // Determine if this should be a chord tone
      const useChordTone = Math.random() > 0.3;

      if (useChordTone && chordTones) {
        currentPitch = this.findNearestChordTone(currentPitch, chordTones, params.range);
      } else {
        // Use scale tone or chromatic approach
        if (Math.random() > (params.chromaticism || 0.2)) {
          currentPitch = this.findNearestScaleTone(currentPitch, this.scaleNotes, params.range);
        } else {
          // Chromatic approach
          currentPitch += Math.random() > 0.5 ? 1 : -1;
          currentPitch = this.constrainToRange(currentPitch, params.range);
        }
      }

      // Determine duration (jazz swing feel)
      let duration: number;
      const rand = Math.random();
      if (rand > 0.7) {
        duration = beatDuration / 4; // 16th note
      } else if (rand > 0.4) {
        duration = beatDuration / 2; // 8th note
      } else if (rand > 0.2) {
        duration = beatDuration; // Quarter note
      } else {
        duration = beatDuration * 2; // Half note
      }

      // Add syncopation
      if (Math.random() < (params.syncopation || 0.3)) {
        currentTime += beatDuration * 0.25;
      }

      const note: MelodyNote = {
        pitch: currentPitch,
        startTime: currentTime,
        duration: duration * 0.9, // Slight separation
        velocity: this.calculateVelocity(currentTime, beatDuration),
        isChordTone: chordTones ? chordTones.has(currentPitch % 12) : false,
        articulation: Math.random() > 0.7 ? 'accent' : 'legato'
      };

      // Add ornamentation
      if (Math.random() < (params.ornamentation || 0.1)) {
        note.ornament = this.chooseOrnament('jazz');
      }

      melody.push(note);
      currentTime += duration;

      // Apply contour
      currentPitch = this.applyContour(
        currentPitch,
        currentTime,
        totalBeats * beatDuration,
        params.contour || 'wave',
        params.range
      );
    }

    return melody;
  }

  /**
   * Generate classical melody
   */
  private generateClassicalMelody(
    params: MelodyParams,
    totalBeats: number,
    beatDuration: number
  ): MelodyNote[] {
    const melody: MelodyNote[] = [];
    let currentTime = 0;
    let currentPitch = this.getStartingPitch(params);

    // Classical melodies often use motifs and sequences
    const mainMotif = this.createMotif(8, 'classical');

    while (currentTime < totalBeats * beatDuration) {
      const bar = Math.floor(currentTime / (beatDuration * 4));
      const chordTones = this.chordTones.get(bar % params.chordProgression.length);

      // Develop motif through the melody
      const motifPosition = Math.floor((currentTime / (totalBeats * beatDuration)) * mainMotif.length);

      if (motifPosition < mainMotif.intervals.length) {
        currentPitch += mainMotif.intervals[motifPosition];
      } else {
        // Stepwise motion (classical preference)
        const step = Math.random() > 0.5 ? 2 : -2;
        currentPitch += step;
      }

      currentPitch = this.findNearestScaleTone(currentPitch, this.scaleNotes, params.range);

      // Classical rhythm - more regular
      let duration: number;
      const rand = Math.random();
      if (rand > 0.6) {
        duration = beatDuration / 2; // 8th note
      } else if (rand > 0.3) {
        duration = beatDuration; // Quarter note
      } else {
        duration = beatDuration * 2; // Half note
      }

      const note: MelodyNote = {
        pitch: currentPitch,
        startTime: currentTime,
        duration: duration,
        velocity: this.calculateDynamicVelocity(currentTime, totalBeats * beatDuration),
        isChordTone: chordTones ? chordTones.has(currentPitch % 12) : false,
        articulation: 'legato'
      };

      // Classical ornamentation
      if (Math.random() < (params.ornamentation || 0.15)) {
        note.ornament = this.chooseOrnament('classical');
      }

      melody.push(note);
      currentTime += duration;

      // Apply arch contour (common in classical)
      currentPitch = this.applyContour(
        currentPitch,
        currentTime,
        totalBeats * beatDuration,
        params.contour || 'arch',
        params.range
      );
    }

    return melody;
  }

  /**
   * Generate EDM melody
   */
  private generateEDMMelody(
    params: MelodyParams,
    totalBeats: number,
    beatDuration: number
  ): MelodyNote[] {
    const melody: MelodyNote[] = [];
    let currentTime = 0;

    // EDM often uses simple, repetitive patterns
    const pattern = this.createSimplePattern(8);

    while (currentTime < totalBeats * beatDuration) {
      const bar = Math.floor(currentTime / (beatDuration * 4));
      const chordTones = this.chordTones.get(bar % params.chordProgression.length);

      const patternIndex = Math.floor(currentTime / beatDuration) % pattern.length;
      const pitchOffset = pattern[patternIndex];

      const basePitch = this.getStartingPitch(params);
      let currentPitch = basePitch + pitchOffset;

      // Quantize to scale
      currentPitch = this.findNearestScaleTone(currentPitch, this.scaleNotes, params.range);

      // EDM uses mostly 16th notes and 8th notes
      const duration = beatDuration / 4;

      const note: MelodyNote = {
        pitch: currentPitch,
        startTime: currentTime,
        duration: duration * 0.95,
        velocity: 100 + Math.floor(Math.random() * 20),
        isChordTone: chordTones ? chordTones.has(currentPitch % 12) : false,
        articulation: 'staccato'
      };

      melody.push(note);
      currentTime += duration;
    }

    return melody;
  }

  /**
   * Generate rock melody
   */
  private generateRockMelody(
    params: MelodyParams,
    totalBeats: number,
    beatDuration: number
  ): MelodyNote[] {
    const melody: MelodyNote[] = [];
    let currentTime = 0;
    let currentPitch = this.getStartingPitch(params);

    // Rock often uses pentatonic scales
    const pentatonicScale = [0, 2, 4, 7, 9]; // Major pentatonic intervals

    while (currentTime < totalBeats * beatDuration) {
      const bar = Math.floor(currentTime / (beatDuration * 4));
      const chordTones = this.chordTones.get(bar % params.chordProgression.length);

      // Use pentatonic scale
      const scaleStep = pentatonicScale[Math.floor(Math.random() * pentatonicScale.length)];
      const rootPitch = this.getStartingPitch(params);
      currentPitch = rootPitch + scaleStep + (Math.floor(Math.random() * 3) - 1) * 12;

      currentPitch = this.constrainToRange(currentPitch, params.range);

      // Rock rhythm - emphasis on downbeats
      let duration: number;
      const beat = (currentTime / beatDuration) % 4;

      if (beat % 1 === 0) {
        // On the beat
        duration = beatDuration;
      } else {
        duration = beatDuration / 2;
      }

      const note: MelodyNote = {
        pitch: currentPitch,
        startTime: currentTime,
        duration: duration,
        velocity: 100 + Math.floor(Math.random() * 27),
        isChordTone: chordTones ? chordTones.has(currentPitch % 12) : false,
        articulation: Math.random() > 0.3 ? 'accent' : 'legato'
      };

      // Rock ornamentation - bends, slides
      if (Math.random() < (params.ornamentation || 0.2)) {
        note.ornament = 'slide';
      }

      melody.push(note);
      currentTime += duration;
    }

    return melody;
  }

  /**
   * Generate generic melody
   */
  private generateGenericMelody(
    params: MelodyParams,
    totalBeats: number,
    beatDuration: number
  ): MelodyNote[] {
    const melody: MelodyNote[] = [];
    let currentTime = 0;
    let currentPitch = this.getStartingPitch(params);

    const notesDensityMap = {
      'sparse': 1.0,
      'medium': 0.5,
      'dense': 0.25
    };

    const minDuration = beatDuration * (notesDensityMap[params.notesDensity || 'medium'] || 0.5);

    while (currentTime < totalBeats * beatDuration) {
      const bar = Math.floor(currentTime / (beatDuration * 4));
      const chordTones = this.chordTones.get(bar % params.chordProgression.length);

      // Random walk with bias toward chord tones
      if (Math.random() > 0.4 && chordTones) {
        currentPitch = this.findNearestChordTone(currentPitch, chordTones, params.range);
      } else {
        const interval = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5][Math.floor(Math.random() * 11)];
        currentPitch += interval;
        currentPitch = this.findNearestScaleTone(currentPitch, this.scaleNotes, params.range);
      }

      const duration = minDuration * (1 + Math.random());

      const note: MelodyNote = {
        pitch: currentPitch,
        startTime: currentTime,
        duration: duration,
        velocity: 80 + Math.floor(Math.random() * 40),
        isChordTone: chordTones ? chordTones.has(currentPitch % 12) : false,
        articulation: 'legato'
      };

      melody.push(note);
      currentTime += duration;

      // Apply contour
      currentPitch = this.applyContour(
        currentPitch,
        currentTime,
        totalBeats * beatDuration,
        params.contour || 'wave',
        params.range
      );
    }

    return melody;
  }

  /**
   * Create a motif
   */
  private createMotif(length: number, style: string): Motif {
    const intervals: number[] = [];
    const rhythm: number[] = [];

    for (let i = 0; i < length; i++) {
      // Generate intervals based on style
      let interval: number;

      if (style === 'jazz') {
        // Jazz uses wider intervals
        interval = [-7, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 7][Math.floor(Math.random() * 12)];
      } else if (style === 'classical') {
        // Classical prefers stepwise motion
        interval = [-2, -1, 0, 1, 2][Math.floor(Math.random() * 5)];
      } else {
        interval = [-3, -2, -1, 0, 1, 2, 3][Math.floor(Math.random() * 7)];
      }

      intervals.push(interval);

      // Generate rhythm
      const durations = [0.25, 0.5, 1, 2];
      rhythm.push(durations[Math.floor(Math.random() * durations.length)]);
    }

    return { intervals, rhythm, length };
  }

  /**
   * Create simple pattern (for EDM)
   */
  private createSimplePattern(length: number): number[] {
    const pattern: number[] = [];
    const possibleNotes = [0, 2, 4, 7, 9, 12]; // Pentatonic + octave

    for (let i = 0; i < length; i++) {
      pattern.push(possibleNotes[Math.floor(Math.random() * possibleNotes.length)]);
    }

    return pattern;
  }

  /**
   * Get starting pitch
   */
  private getStartingPitch(params: MelodyParams): number {
    const range = params.range || [60, 84]; // C4 to C6
    const middle = Math.floor((range[0] + range[1]) / 2);

    // Start near the middle of the range
    return middle + (Math.floor(Math.random() * 7) - 3);
  }

  /**
   * Find nearest chord tone
   */
  private findNearestChordTone(
    currentPitch: number,
    chordTones: Set<number>,
    range?: [number, number]
  ): number {
    const pitchClass = currentPitch % 12;

    // If already a chord tone, stay
    if (chordTones.has(pitchClass)) {
      return currentPitch;
    }

    // Find nearest chord tone
    let minDistance = 12;
    let nearestTone = currentPitch;

    for (const tone of chordTones) {
      for (let octave = -1; octave <= 1; octave++) {
        const candidate = currentPitch - pitchClass + tone + (octave * 12);
        const distance = Math.abs(candidate - currentPitch);

        if (distance < minDistance) {
          if (!range || (candidate >= range[0] && candidate <= range[1])) {
            minDistance = distance;
            nearestTone = candidate;
          }
        }
      }
    }

    return nearestTone;
  }

  /**
   * Find nearest scale tone
   */
  private findNearestScaleTone(
    currentPitch: number,
    scaleNotes: number[],
    range?: [number, number]
  ): number {
    const pitchClass = currentPitch % 12;

    // If already a scale tone, stay
    if (scaleNotes.includes(pitchClass)) {
      return currentPitch;
    }

    // Find nearest scale tone
    let minDistance = 12;
    let nearestTone = currentPitch;

    for (const tone of scaleNotes) {
      for (let octave = -1; octave <= 1; octave++) {
        const candidate = currentPitch - pitchClass + tone + (octave * 12);
        const distance = Math.abs(candidate - currentPitch);

        if (distance < minDistance) {
          if (!range || (candidate >= range[0] && candidate <= range[1])) {
            minDistance = distance;
            nearestTone = candidate;
          }
        }
      }
    }

    return nearestTone;
  }

  /**
   * Constrain pitch to range
   */
  private constrainToRange(pitch: number, range?: [number, number]): number {
    if (!range) return pitch;

    if (pitch < range[0]) return range[0];
    if (pitch > range[1]) return range[1];
    return pitch;
  }

  /**
   * Apply contour shaping
   */
  private applyContour(
    currentPitch: number,
    currentTime: number,
    totalTime: number,
    contour: ContourType,
    range?: [number, number]
  ): number {
    const progress = currentTime / totalTime;
    const [minPitch, maxPitch] = range || [60, 84];
    const rangeMid = (minPitch + maxPitch) / 2;

    let targetPitch = currentPitch;

    switch (contour) {
      case 'arch':
        // Rise to peak at midpoint, then fall
        if (progress < 0.5) {
          targetPitch = currentPitch + 1;
        } else {
          targetPitch = currentPitch - 1;
        }
        break;

      case 'inverted-arch':
        // Fall to valley at midpoint, then rise
        if (progress < 0.5) {
          targetPitch = currentPitch - 1;
        } else {
          targetPitch = currentPitch + 1;
        }
        break;

      case 'ascending':
        // Generally rise
        if (currentPitch < maxPitch - 5) {
          targetPitch = currentPitch + (Math.random() > 0.3 ? 1 : 0);
        }
        break;

      case 'descending':
        // Generally fall
        if (currentPitch > minPitch + 5) {
          targetPitch = currentPitch - (Math.random() > 0.3 ? 1 : 0);
        }
        break;

      case 'wave':
        // Sine wave pattern
        const waveOffset = Math.sin(progress * Math.PI * 4) * 5;
        targetPitch = Math.round(rangeMid + waveOffset);
        break;

      case 'static':
        // Stay near middle
        if (Math.abs(currentPitch - rangeMid) > 5) {
          targetPitch = currentPitch + (currentPitch > rangeMid ? -1 : 1);
        }
        break;

      case 'random':
      default:
        // No contour constraint
        targetPitch = currentPitch;
        break;
    }

    return this.constrainToRange(targetPitch, range);
  }

  /**
   * Calculate velocity based on beat position
   */
  private calculateVelocity(currentTime: number, beatDuration: number): number {
    const beat = (currentTime / beatDuration) % 4;

    // Accent downbeats
    if (beat % 1 < 0.1) {
      return 100 + Math.floor(Math.random() * 27);
    } else {
      return 80 + Math.floor(Math.random() * 20);
    }
  }

  /**
   * Calculate dynamic velocity (for classical)
   */
  private calculateDynamicVelocity(currentTime: number, totalTime: number): number {
    const progress = currentTime / totalTime;

    // Crescendo and decrescendo
    let velocity: number;

    if (progress < 0.25) {
      // Start soft
      velocity = 60 + progress * 160;
    } else if (progress < 0.5) {
      // Crescendo
      velocity = 100 + (progress - 0.25) * 80;
    } else if (progress < 0.75) {
      // Peak
      velocity = 120;
    } else {
      // Decrescendo
      velocity = 120 - (progress - 0.75) * 160;
    }

    return Math.max(40, Math.min(127, velocity));
  }

  /**
   * Choose ornamentation
   */
  private chooseOrnament(style: string): MelodyNote['ornament'] {
    if (style === 'jazz') {
      const ornaments: MelodyNote['ornament'][] = ['slide', 'grace'];
      return ornaments[Math.floor(Math.random() * ornaments.length)];
    } else if (style === 'classical') {
      const ornaments: MelodyNote['ornament'][] = ['trill', 'mordent', 'turn', 'grace'];
      return ornaments[Math.floor(Math.random() * ornaments.length)];
    } else {
      return 'grace';
    }
  }

  /**
   * Add passing tones
   */
  public addPassingTones(melody: MelodyNote[]): MelodyNote[] {
    const enhanced: MelodyNote[] = [];

    for (let i = 0; i < melody.length - 1; i++) {
      enhanced.push(melody[i]);

      const current = melody[i];
      const next = melody[i + 1];

      // If there's a large interval and enough time, add passing tone
      const interval = Math.abs(next.pitch - current.pitch);
      const timeGap = next.startTime - (current.startTime + current.duration);

      if (interval > 2 && timeGap > 0.1) {
        const passingPitch = current.pitch + (next.pitch > current.pitch ? 1 : -1);
        const passingNote: MelodyNote = {
          pitch: passingPitch,
          startTime: current.startTime + current.duration,
          duration: Math.min(0.1, timeGap),
          velocity: current.velocity - 10,
          isChordTone: false,
          articulation: 'staccato'
        };

        enhanced.push(passingNote);
      }
    }

    enhanced.push(melody[melody.length - 1]);
    return enhanced;
  }

  /**
   * Add neighbor tones
   */
  public addNeighborTones(melody: MelodyNote[]): MelodyNote[] {
    const enhanced: MelodyNote[] = [];

    for (let i = 0; i < melody.length; i++) {
      const current = melody[i];

      if (Math.random() > 0.8 && current.duration > 0.5) {
        // Split note and add neighbor tone
        const splitDuration = current.duration / 3;

        enhanced.push({
          ...current,
          duration: splitDuration
        });

        // Upper or lower neighbor
        const neighborPitch = current.pitch + (Math.random() > 0.5 ? 1 : -1);

        enhanced.push({
          pitch: neighborPitch,
          startTime: current.startTime + splitDuration,
          duration: splitDuration,
          velocity: current.velocity - 10,
          isChordTone: false,
          articulation: 'staccato'
        });

        enhanced.push({
          ...current,
          startTime: current.startTime + splitDuration * 2,
          duration: splitDuration
        });
      } else {
        enhanced.push(current);
      }
    }

    return enhanced;
  }

  /**
   * Transpose melody
   */
  public transpose(melody: MelodyNote[], semitones: number): MelodyNote[] {
    return melody.map(note => ({
      ...note,
      pitch: note.pitch + semitones
    }));
  }

  /**
   * Retrograde (reverse melody)
   */
  public retrograde(melody: MelodyNote[]): MelodyNote[] {
    const reversed = [...melody].reverse();
    const totalDuration = melody[melody.length - 1].startTime + melody[melody.length - 1].duration;

    return reversed.map((note, i) => ({
      ...note,
      startTime: i === 0 ? 0 : reversed[i - 1].startTime + reversed[i - 1].duration
    }));
  }

  /**
   * Invert melody
   */
  public invert(melody: MelodyNote[], axis?: number): MelodyNote[] {
    const axisPitch = axis || melody[0].pitch;

    return melody.map(note => ({
      ...note,
      pitch: axisPitch - (note.pitch - axisPitch)
    }));
  }

  /**
   * Augment (lengthen durations)
   */
  public augment(melody: MelodyNote[], factor: number = 2): MelodyNote[] {
    return melody.map(note => ({
      ...note,
      startTime: note.startTime * factor,
      duration: note.duration * factor
    }));
  }

  /**
   * Diminish (shorten durations)
   */
  public diminish(melody: MelodyNote[], factor: number = 2): MelodyNote[] {
    return this.augment(melody, 1 / factor);
  }

  /**
   * Sequence (repeat pattern at different pitches)
   */
  public sequence(
    melody: MelodyNote[],
    repetitions: number,
    intervalStep: number
  ): MelodyNote[] {
    const result: MelodyNote[] = [];
    const duration = melody[melody.length - 1].startTime + melody[melody.length - 1].duration;

    for (let i = 0; i < repetitions; i++) {
      const transposed = this.transpose(melody, intervalStep * i);
      const shifted = transposed.map(note => ({
        ...note,
        startTime: note.startTime + duration * i
      }));

      result.push(...shifted);
    }

    return result;
  }

  /**
   * Quantize melody to grid
   */
  public quantize(melody: MelodyNote[], gridSize: number): MelodyNote[] {
    return melody.map(note => ({
      ...note,
      startTime: Math.round(note.startTime / gridSize) * gridSize,
      duration: Math.round(note.duration / gridSize) * gridSize
    }));
  }

  /**
   * Humanize (add slight timing and velocity variations)
   */
  public humanize(melody: MelodyNote[], amount: number = 0.1): MelodyNote[] {
    return melody.map(note => ({
      ...note,
      startTime: note.startTime + (Math.random() - 0.5) * amount,
      velocity: Math.max(1, Math.min(127, note.velocity + Math.floor((Math.random() - 0.5) * 20 * amount)))
    }));
  }

  /**
   * Analyze melody
   */
  public analyze(melody: MelodyNote[]): any {
    const pitches = melody.map(n => n.pitch);
    const intervals = [];

    for (let i = 1; i < pitches.length; i++) {
      intervals.push(pitches[i] - pitches[i - 1]);
    }

    const range = Math.max(...pitches) - Math.min(...pitches);
    const avgInterval = intervals.reduce((a, b) => a + Math.abs(b), 0) / intervals.length;

    return {
      numNotes: melody.length,
      range,
      lowestNote: Math.min(...pitches),
      highestNote: Math.max(...pitches),
      avgInterval,
      chordTonePercentage: melody.filter(n => n.isChordTone).length / melody.length,
      totalDuration: melody[melody.length - 1].startTime + melody[melody.length - 1].duration
    };
  }
}

export default MelodyGenerator;

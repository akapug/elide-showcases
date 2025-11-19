/**
 * Chord Progression Generator
 *
 * Advanced chord progression generator with comprehensive music theory support.
 * Generates genre-appropriate progressions with proper voice leading and harmonic function.
 *
 * Features:
 * - Multiple scales and modes (Western, Modal, Jazz, World)
 * - Complex chord types (triads, 7ths, extended, altered)
 * - Genre-specific progressions (Jazz, Classical, Pop, EDM)
 * - Voice leading optimization
 * - Chord substitution and reharmonization
 * - Tension/resolution analysis
 */

/**
 * Note class representing a musical note
 */
export class Note {
  public pitch: number; // MIDI note number
  public name: string; // Note name (C, D, E, etc.)
  public octave: number;

  constructor(name: string, octave: number = 4) {
    this.name = name;
    this.octave = octave;
    this.pitch = this.calculatePitch();
  }

  private calculatePitch(): number {
    const noteMap: Record<string, number> = {
      'C': 0, 'C#': 1, 'Db': 1,
      'D': 2, 'D#': 3, 'Eb': 3,
      'E': 4,
      'F': 5, 'F#': 6, 'Gb': 6,
      'G': 7, 'G#': 8, 'Ab': 8,
      'A': 9, 'A#': 10, 'Bb': 10,
      'B': 11
    };

    return (this.octave + 1) * 12 + (noteMap[this.name] || 0);
  }

  public transpose(semitones: number): Note {
    const newPitch = this.pitch + semitones;
    const newOctave = Math.floor(newPitch / 12) - 1;
    const pitchClass = newPitch % 12;

    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return new Note(noteNames[pitchClass], newOctave);
  }
}

/**
 * Scale class representing a musical scale
 */
export class Scale {
  public name: string;
  public intervals: number[]; // Semitone intervals from root

  constructor(name: string, intervals: number[]) {
    this.name = name;
    this.intervals = intervals;
  }

  /**
   * Get notes in the scale for a given root
   */
  public getNotes(root: string, octave: number = 4): Note[] {
    const rootNote = new Note(root, octave);
    return this.intervals.map(interval => rootNote.transpose(interval));
  }

  /**
   * Get degree of scale (1-indexed)
   */
  public getDegree(root: string, degree: number, octave: number = 4): Note {
    const notes = this.getNotes(root, octave);
    return notes[(degree - 1) % notes.length];
  }
}

/**
 * Predefined scales
 */
export const SCALES: Record<string, Scale> = {
  // Major scales
  'major': new Scale('Major', [0, 2, 4, 5, 7, 9, 11]),
  'ionian': new Scale('Ionian', [0, 2, 4, 5, 7, 9, 11]),

  // Minor scales
  'minor': new Scale('Natural Minor', [0, 2, 3, 5, 7, 8, 10]),
  'aeolian': new Scale('Aeolian', [0, 2, 3, 5, 7, 8, 10]),
  'harmonic-minor': new Scale('Harmonic Minor', [0, 2, 3, 5, 7, 8, 11]),
  'melodic-minor': new Scale('Melodic Minor', [0, 2, 3, 5, 7, 9, 11]),

  // Modal scales
  'dorian': new Scale('Dorian', [0, 2, 3, 5, 7, 9, 10]),
  'phrygian': new Scale('Phrygian', [0, 1, 3, 5, 7, 8, 10]),
  'lydian': new Scale('Lydian', [0, 2, 4, 6, 7, 9, 11]),
  'mixolydian': new Scale('Mixolydian', [0, 2, 4, 5, 7, 9, 10]),
  'locrian': new Scale('Locrian', [0, 1, 3, 5, 6, 8, 10]),

  // Pentatonic scales
  'pentatonic-major': new Scale('Pentatonic Major', [0, 2, 4, 7, 9]),
  'pentatonic-minor': new Scale('Pentatonic Minor', [0, 3, 5, 7, 10]),

  // Blues scales
  'blues': new Scale('Blues', [0, 3, 5, 6, 7, 10]),
  'blues-major': new Scale('Major Blues', [0, 2, 3, 4, 7, 9]),

  // Jazz scales
  'bebop-dominant': new Scale('Bebop Dominant', [0, 2, 4, 5, 7, 9, 10, 11]),
  'bebop-major': new Scale('Bebop Major', [0, 2, 4, 5, 7, 8, 9, 11]),
  'altered': new Scale('Altered', [0, 1, 3, 4, 6, 8, 10]),
  'diminished': new Scale('Diminished', [0, 2, 3, 5, 6, 8, 9, 11]),
  'whole-tone': new Scale('Whole Tone', [0, 2, 4, 6, 8, 10]),

  // Exotic scales
  'hungarian-minor': new Scale('Hungarian Minor', [0, 2, 3, 6, 7, 8, 11]),
  'gypsy': new Scale('Gypsy', [0, 1, 4, 5, 7, 8, 11]),
  'arabic': new Scale('Arabic', [0, 1, 4, 5, 7, 8, 11]),
  'japanese': new Scale('Japanese', [0, 1, 5, 7, 8]),
  'hirajoshi': new Scale('Hirajoshi', [0, 2, 3, 7, 8]),
};

/**
 * Chord class representing a musical chord
 */
export class Chord {
  public root: Note;
  public type: string;
  public notes: Note[];
  public symbol: string;
  public function?: string; // Tonic, Subdominant, Dominant, etc.
  public tension: number; // 0-10 scale

  constructor(root: Note, type: string, notes: Note[], symbol?: string) {
    this.root = root;
    this.type = type;
    this.notes = notes;
    this.symbol = symbol || `${root.name}${type}`;
    this.tension = this.calculateTension();
  }

  /**
   * Calculate tension level of chord
   */
  private calculateTension(): number {
    const tensionMap: Record<string, number> = {
      'maj': 0,
      'min': 2,
      'maj7': 3,
      'min7': 4,
      '7': 6,
      'dim': 8,
      'dim7': 9,
      'aug': 7,
      '7#9': 8,
      '7b9': 8,
      'alt': 9,
    };

    return tensionMap[this.type] || 5;
  }

  /**
   * Voice the chord within an octave range
   */
  public voice(lowestOctave: number, voicing: 'close' | 'open' | 'drop2' | 'drop3' = 'close'): Note[] {
    switch (voicing) {
      case 'close':
        return this.closeVoicing(lowestOctave);
      case 'open':
        return this.openVoicing(lowestOctave);
      case 'drop2':
        return this.drop2Voicing(lowestOctave);
      case 'drop3':
        return this.drop3Voicing(lowestOctave);
      default:
        return this.notes;
    }
  }

  private closeVoicing(lowestOctave: number): Note[] {
    // All notes within an octave
    return this.notes.map((note, i) => {
      const octave = lowestOctave + Math.floor(i / 7);
      return new Note(note.name, octave);
    });
  }

  private openVoicing(lowestOctave: number): Note[] {
    // Spread notes across 2 octaves
    return this.notes.map((note, i) => {
      const octave = lowestOctave + Math.floor(i / 3);
      return new Note(note.name, octave);
    });
  }

  private drop2Voicing(lowestOctave: number): Note[] {
    // Drop second note from top down an octave
    const voiced = this.closeVoicing(lowestOctave);
    if (voiced.length >= 2) {
      voiced[voiced.length - 2] = voiced[voiced.length - 2].transpose(-12);
    }
    return voiced;
  }

  private drop3Voicing(lowestOctave: number): Note[] {
    // Drop third note from top down an octave
    const voiced = this.closeVoicing(lowestOctave);
    if (voiced.length >= 3) {
      voiced[voiced.length - 3] = voiced[voiced.length - 3].transpose(-12);
    }
    return voiced;
  }
}

/**
 * Chord builder functions
 */
export class ChordBuilder {
  /**
   * Build a chord from root and type
   */
  public static build(root: Note, type: string): Chord {
    const intervals = this.getIntervalsForType(type);
    const notes = intervals.map(interval => root.transpose(interval));
    return new Chord(root, type, notes);
  }

  /**
   * Get intervals for chord type
   */
  private static getIntervalsForType(type: string): number[] {
    const intervalMap: Record<string, number[]> = {
      // Triads
      'maj': [0, 4, 7],
      'min': [0, 3, 7],
      'dim': [0, 3, 6],
      'aug': [0, 4, 8],
      'sus2': [0, 2, 7],
      'sus4': [0, 5, 7],

      // Seventh chords
      'maj7': [0, 4, 7, 11],
      'min7': [0, 3, 7, 10],
      '7': [0, 4, 7, 10],
      'dim7': [0, 3, 6, 9],
      'ø7': [0, 3, 6, 10], // Half-diminished
      'm7b5': [0, 3, 6, 10],
      'minmaj7': [0, 3, 7, 11],
      'maj7#5': [0, 4, 8, 11],
      '7#5': [0, 4, 8, 10],
      '7b5': [0, 4, 6, 10],

      // Extended chords
      'maj9': [0, 4, 7, 11, 14],
      'min9': [0, 3, 7, 10, 14],
      '9': [0, 4, 7, 10, 14],
      'maj11': [0, 4, 7, 11, 14, 17],
      'min11': [0, 3, 7, 10, 14, 17],
      '11': [0, 4, 7, 10, 14, 17],
      'maj13': [0, 4, 7, 11, 14, 17, 21],
      'min13': [0, 3, 7, 10, 14, 17, 21],
      '13': [0, 4, 7, 10, 14, 17, 21],

      // Altered chords
      '7#9': [0, 4, 7, 10, 15],
      '7b9': [0, 4, 7, 10, 13],
      '7#5#9': [0, 4, 8, 10, 15],
      '7b5b9': [0, 4, 6, 10, 13],
      'alt': [0, 4, 6, 10, 13], // Altered dominant

      // Add chords
      'add9': [0, 4, 7, 14],
      'madd9': [0, 3, 7, 14],
      '6': [0, 4, 7, 9],
      'min6': [0, 3, 7, 9],
      '6/9': [0, 4, 7, 9, 14],
    };

    return intervalMap[type] || intervalMap['maj'];
  }

  /**
   * Build chord from scale degree
   */
  public static fromDegree(
    scale: Scale,
    root: string,
    degree: number,
    type: 'triad' | '7th' = 'triad'
  ): Chord {
    const notes = scale.getNotes(root, 4);
    const chordRoot = notes[(degree - 1) % notes.length];

    // Determine chord quality based on scale intervals
    const third = (degree - 1 + 2) % notes.length;
    const fifth = (degree - 1 + 4) % notes.length;

    const thirdInterval = (notes[third].pitch - chordRoot.pitch) % 12;
    const fifthInterval = (notes[fifth].pitch - chordRoot.pitch) % 12;

    let chordType: string;

    if (type === 'triad') {
      if (thirdInterval === 4 && fifthInterval === 7) {
        chordType = 'maj';
      } else if (thirdInterval === 3 && fifthInterval === 7) {
        chordType = 'min';
      } else if (thirdInterval === 3 && fifthInterval === 6) {
        chordType = 'dim';
      } else if (thirdInterval === 4 && fifthInterval === 8) {
        chordType = 'aug';
      } else {
        chordType = 'maj';
      }
    } else {
      const seventh = (degree - 1 + 6) % notes.length;
      const seventhInterval = (notes[seventh].pitch - chordRoot.pitch) % 12;

      if (thirdInterval === 4 && fifthInterval === 7 && seventhInterval === 11) {
        chordType = 'maj7';
      } else if (thirdInterval === 3 && fifthInterval === 7 && seventhInterval === 10) {
        chordType = 'min7';
      } else if (thirdInterval === 4 && fifthInterval === 7 && seventhInterval === 10) {
        chordType = '7';
      } else if (thirdInterval === 3 && fifthInterval === 6 && seventhInterval === 10) {
        chordType = 'ø7';
      } else if (thirdInterval === 3 && fifthInterval === 6 && seventhInterval === 9) {
        chordType = 'dim7';
      } else {
        chordType = 'maj7';
      }
    }

    return this.build(chordRoot, chordType);
  }
}

/**
 * Progression patterns for different genres
 */
export const PROGRESSIONS: Record<string, any> = {
  jazz: {
    'ii-V-I': [2, 5, 1],
    'I-vi-ii-V': [1, 6, 2, 5],
    'iii-vi-ii-V': [3, 6, 2, 5],
    'rhythm-changes': [1, 6, 2, 5, 1, 6, 2, 5],
    'blues': [1, 1, 1, 1, 4, 4, 1, 1, 5, 4, 1, 5],
    'minor-blues': [1, 1, 1, 1, 4, 4, 1, 1, 5, 4, 1, 1],
    'coltrane': [1, 3, 6, 2, 5, 1], // Giant Steps-style
  },

  classical: {
    'authentic-cadence': [1, 5, 1],
    'plagal-cadence': [1, 4, 1],
    'half-cadence': [1, 5],
    'deceptive-cadence': [1, 6],
    'circle-of-fifths': [1, 4, 7, 3, 6, 2, 5, 1],
    'sequence': [1, 2, 3, 4, 5, 6, 7, 1],
  },

  pop: {
    'I-V-vi-IV': [1, 5, 6, 4],
    'I-IV-V-I': [1, 4, 5, 1],
    'vi-IV-I-V': [6, 4, 1, 5],
    'I-vi-IV-V': [1, 6, 4, 5],
    'I-iii-IV-V': [1, 3, 4, 5],
  },

  edm: {
    'build': [1, 1, 4, 4, 6, 6, 5, 5],
    'drop': [1, 6, 4, 5],
    'progressive': [1, 5, 6, 4, 1, 5, 6, 4],
  },

  rock: {
    'power-progression': [1, 4, 5],
    'blues-rock': [1, 4, 1, 5, 4, 1],
    'classic-rock': [1, 7, 4, 1],
    'grunge': [1, 3, 7, 4],
  },

  ambient: {
    'drone': [1, 1, 1, 1],
    'slow-evolve': [1, 4, 1, 6],
    'pad': [1, 5, 1, 4],
  }
};

/**
 * Generation parameters
 */
export interface ChordProgressionParams {
  key: string;
  mode: string;
  numBars: number;
  genre: string;
  complexity?: 'simple' | 'medium' | 'complex';
  voicing?: 'close' | 'open' | 'drop2' | 'drop3';
  extensions?: boolean; // Use extended chords (9ths, 11ths, 13ths)
  substitutions?: boolean; // Apply chord substitutions
}

/**
 * Chord progression generator
 */
export class ChordProgressionGenerator {
  /**
   * Generate chord progression
   */
  public generate(params: ChordProgressionParams): any[] {
    const scale = this.getScale(params.mode);
    const baseProgression = this.getBaseProgression(params);
    const chords = this.buildChords(baseProgression, scale, params);

    if (params.substitutions) {
      this.applySubstitutions(chords, params);
    }

    if (params.extensions) {
      this.applyExtensions(chords, params);
    }

    return this.formatOutput(chords, params);
  }

  /**
   * Get scale for mode
   */
  private getScale(mode: string): Scale {
    return SCALES[mode] || SCALES['major'];
  }

  /**
   * Get base progression pattern
   */
  private getBaseProgression(params: ChordProgressionParams): number[] {
    const genreProgressions = PROGRESSIONS[params.genre] || PROGRESSIONS['pop'];
    const patternNames = Object.keys(genreProgressions);

    // Select pattern based on complexity
    let selectedPattern: string;

    if (params.complexity === 'simple') {
      selectedPattern = patternNames[0];
    } else if (params.complexity === 'complex') {
      selectedPattern = patternNames[patternNames.length - 1];
    } else {
      selectedPattern = patternNames[Math.floor(patternNames.length / 2)];
    }

    const pattern = genreProgressions[selectedPattern];

    // Repeat pattern to fill bars
    const result: number[] = [];
    while (result.length < params.numBars) {
      result.push(...pattern);
    }

    return result.slice(0, params.numBars);
  }

  /**
   * Build chords from degree progression
   */
  private buildChords(
    degrees: number[],
    scale: Scale,
    params: ChordProgressionParams
  ): Chord[] {
    const use7ths = params.complexity !== 'simple';

    return degrees.map(degree => {
      return ChordBuilder.fromDegree(
        scale,
        params.key,
        degree,
        use7ths ? '7th' : 'triad'
      );
    });
  }

  /**
   * Apply chord substitutions
   */
  private applySubstitutions(chords: Chord[], params: ChordProgressionParams): void {
    // Common jazz substitutions
    for (let i = 0; i < chords.length; i++) {
      const chord = chords[i];

      // Tritone substitution for dominant chords
      if (chord.type === '7' && Math.random() > 0.7) {
        const tritoneRoot = chord.root.transpose(6);
        chords[i] = ChordBuilder.build(tritoneRoot, '7');
      }

      // Relative ii-V for major chords
      if (chord.type === 'maj7' && i > 0 && Math.random() > 0.8) {
        const ii = chord.root.transpose(2);
        const V = chord.root.transpose(7);
        // Could insert ii-V before the I
      }
    }
  }

  /**
   * Apply extended chord voicings
   */
  private applyExtensions(chords: Chord[], params: ChordProgressionParams): void {
    for (let i = 0; i < chords.length; i++) {
      const chord = chords[i];

      // Extend 7th chords to 9ths, 11ths, or 13ths
      if (chord.type.includes('7') && Math.random() > 0.5) {
        const extensions = ['9', '11', '13'];
        const extension = extensions[Math.floor(Math.random() * extensions.length)];

        const newType = chord.type.replace('7', extension);
        chords[i] = ChordBuilder.build(chord.root, newType);
      }
    }
  }

  /**
   * Format output
   */
  private formatOutput(chords: Chord[], params: ChordProgressionParams): any[] {
    const beatsPerBar = 4; // Assume 4/4 for now
    const beatDuration = 60 / 120; // Assume 120 BPM

    return chords.map((chord, i) => {
      const bar = i % params.numBars;
      const beat = (i * beatsPerBar) % beatsPerBar;
      const startTime = (bar * beatsPerBar + beat) * beatDuration;

      return {
        chord: chord.symbol,
        root: chord.root.name,
        type: chord.type,
        notes: chord.voice(3, params.voicing || 'close').map(n => ({
          pitch: n.pitch,
          name: n.name,
          octave: n.octave
        })),
        bar,
        beat,
        startTime,
        duration: beatDuration * beatsPerBar,
        function: this.determineFunction(i, chords.length),
        tension: chord.tension
      };
    });
  }

  /**
   * Determine harmonic function
   */
  private determineFunction(position: number, total: number): string {
    if (position === 0) return 'tonic';
    if (position === total - 1) return 'tonic';
    if (position === total - 2) return 'dominant';

    const phase = position / total;
    if (phase < 0.33) return 'tonic';
    if (phase < 0.66) return 'subdominant';
    return 'dominant';
  }

  /**
   * Get available scales
   */
  public getAvailableScales(): string[] {
    return Object.keys(SCALES);
  }

  /**
   * Analyze progression for common patterns
   */
  public analyzeProgression(progression: any[]): any {
    // Analyze key, modulations, cadences, etc.
    return {
      key: progression[0]?.root || 'C',
      numChords: progression.length,
      hasCadence: this.detectCadence(progression),
      modulations: this.detectModulations(progression),
      complexity: this.measureComplexity(progression)
    };
  }

  /**
   * Detect cadences
   */
  private detectCadence(progression: any[]): boolean {
    if (progression.length < 2) return false;

    const last = progression[progression.length - 1];
    const secondLast = progression[progression.length - 2];

    // Check for V-I or IV-I
    return (
      (secondLast.function === 'dominant' && last.function === 'tonic') ||
      (secondLast.function === 'subdominant' && last.function === 'tonic')
    );
  }

  /**
   * Detect modulations
   */
  private detectModulations(progression: any[]): string[] {
    const modulations: string[] = [];
    // Simplified modulation detection
    // In practice, would analyze key changes
    return modulations;
  }

  /**
   * Measure complexity
   */
  private measureComplexity(progression: any[]): number {
    let score = 0;

    // Count unique chords
    const uniqueChords = new Set(progression.map(p => p.chord));
    score += uniqueChords.size;

    // Count extended chords
    const extendedChords = progression.filter(p =>
      p.type.includes('9') || p.type.includes('11') || p.type.includes('13')
    );
    score += extendedChords.length * 2;

    // Count altered chords
    const alteredChords = progression.filter(p =>
      p.type.includes('#') || p.type.includes('b') || p.type.includes('alt')
    );
    score += alteredChords.length * 3;

    return Math.min(10, score / 2);
  }

  /**
   * Reharmonize progression
   */
  public reharmonize(progression: any[], style: 'jazz' | 'classical' | 'modern'): any[] {
    // Create new harmonization of the same progression
    const reharmonized = [...progression];

    switch (style) {
      case 'jazz':
        this.applyJazzReharmonization(reharmonized);
        break;
      case 'classical':
        this.applyClassicalReharmonization(reharmonized);
        break;
      case 'modern':
        this.applyModernReharmonization(reharmonized);
        break;
    }

    return reharmonized;
  }

  /**
   * Apply jazz reharmonization
   */
  private applyJazzReharmonization(progression: any[]): void {
    // Add passing chords, tritone subs, etc.
    for (let i = 0; i < progression.length - 1; i++) {
      const current = progression[i];
      const next = progression[i + 1];

      // Add passing diminished chord
      if (Math.random() > 0.7) {
        const passing = ChordBuilder.build(
          current.notes[0],
          'dim7'
        );
        // Could insert passing chord
      }
    }
  }

  /**
   * Apply classical reharmonization
   */
  private applyClassicalReharmonization(progression: any[]): void {
    // Apply classical voice leading rules
    // Add suspensions, appoggiaturas, etc.
  }

  /**
   * Apply modern reharmonization
   */
  private applyModernReharmonization(progression: any[]): void {
    // Add modal interchange, parallel chords, etc.
    for (let i = 0; i < progression.length; i++) {
      if (Math.random() > 0.8) {
        // Parallel major/minor swap
        const chord = progression[i];
        if (chord.type === 'maj7') {
          progression[i] = ChordBuilder.build(chord.notes[0], 'min7');
        } else if (chord.type === 'min7') {
          progression[i] = ChordBuilder.build(chord.notes[0], 'maj7');
        }
      }
    }
  }

  /**
   * Voice lead progression
   */
  public voiceLead(progression: any[]): any[] {
    // Optimize voice leading between chords
    const voiced = [...progression];

    for (let i = 1; i < voiced.length; i++) {
      const prev = voiced[i - 1];
      const current = voiced[i];

      // Find closest voicing to previous chord
      const optimized = this.findClosestVoicing(prev.notes, current);
      voiced[i].notes = optimized;
    }

    return voiced;
  }

  /**
   * Find closest voicing to target
   */
  private findClosestVoicing(targetNotes: any[], chord: any): any[] {
    // Find chord voicing with minimal voice motion
    let bestVoicing = chord.notes;
    let bestDistance = this.calculateVoiceDistance(targetNotes, chord.notes);

    // Try different inversions and octaves
    const inversions = this.generateInversions(chord.notes);

    for (const inversion of inversions) {
      const distance = this.calculateVoiceDistance(targetNotes, inversion);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestVoicing = inversion;
      }
    }

    return bestVoicing;
  }

  /**
   * Calculate voice distance
   */
  private calculateVoiceDistance(notes1: any[], notes2: any[]): number {
    let totalDistance = 0;

    const minLength = Math.min(notes1.length, notes2.length);

    for (let i = 0; i < minLength; i++) {
      const distance = Math.abs(notes1[i].pitch - notes2[i].pitch);
      totalDistance += distance;
    }

    return totalDistance;
  }

  /**
   * Generate chord inversions
   */
  private generateInversions(notes: any[]): any[][] {
    const inversions: any[][] = [];

    // Root position
    inversions.push([...notes]);

    // First inversion
    if (notes.length >= 3) {
      const first = [...notes];
      first[0] = { ...first[0], pitch: first[0].pitch + 12 };
      inversions.push(first);
    }

    // Second inversion
    if (notes.length >= 3) {
      const second = [...notes];
      second[0] = { ...second[0], pitch: second[0].pitch + 12 };
      second[1] = { ...second[1], pitch: second[1].pitch + 12 };
      inversions.push(second);
    }

    return inversions;
  }
}

export default ChordProgressionGenerator;

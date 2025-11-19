/**
 * Rhythm Engine
 *
 * Advanced rhythm and drum pattern generation with genre-specific patterns,
 * groove templates, polyrhythms, and dynamic variation.
 *
 * Features:
 * - Genre-specific drum patterns (Jazz, EDM, Rock, Hip-Hop, Latin)
 * - Polyrhythmic patterns
 * - Groove templates and swing quantization
 * - Dynamic fills and variations
 * - Humanization and velocity curves
 * - Multi-instrument drum programming
 */

/**
 * Drum hit
 */
export interface DrumHit {
  instrument: DrumInstrument;
  startTime: number; // in seconds
  velocity: number; // 0-127
  duration?: number; // for sustained instruments
}

/**
 * Drum instruments
 */
export type DrumInstrument =
  | 'kick'
  | 'snare'
  | 'hihat-closed'
  | 'hihat-open'
  | 'tom-high'
  | 'tom-mid'
  | 'tom-low'
  | 'ride'
  | 'crash'
  | 'china'
  | 'splash'
  | 'cowbell'
  | 'clap'
  | 'rim'
  | 'shaker'
  | 'tambourine'
  | 'conga-high'
  | 'conga-low'
  | 'bongo-high'
  | 'bongo-low';

/**
 * Rhythm pattern
 */
export interface RhythmPattern {
  name: string;
  hits: DrumHit[];
  duration: number; // in beats
  timeSignature: [number, number];
}

/**
 * Groove template
 */
export interface GrooveTemplate {
  name: string;
  swing: number; // 0-1 (0 = straight, 1 = full swing)
  shuffle: number; // 0-1
  velocityMap: Map<number, number>; // beat position -> velocity multiplier
  accentPattern: number[]; // which beats to accent
}

/**
 * Rhythm generation parameters
 */
export interface RhythmParams {
  genre: string;
  tempo: number; // BPM
  timeSignature: [number, number];
  numBars: number;
  complexity?: 'simple' | 'medium' | 'complex';
  swing?: number; // 0-1
  humanize?: number; // 0-1
  fills?: boolean; // Add fills at phrase endings
  variation?: number; // 0-1 (amount of variation between bars)
}

/**
 * Rhythm Engine
 */
export class RhythmEngine {
  private grooveTemplates: Map<string, GrooveTemplate>;
  private drumPatterns: Map<string, RhythmPattern[]>;

  constructor() {
    this.grooveTemplates = new Map();
    this.drumPatterns = new Map();
    this.initializeGrooves();
    this.initializePatterns();
  }

  /**
   * Initialize groove templates
   */
  private initializeGrooves(): void {
    // Straight groove
    this.grooveTemplates.set('straight', {
      name: 'Straight',
      swing: 0,
      shuffle: 0,
      velocityMap: new Map([
        [0, 1.0],
        [1, 0.7],
        [2, 0.9],
        [3, 0.7]
      ]),
      accentPattern: [0, 2]
    });

    // Swing groove
    this.grooveTemplates.set('swing', {
      name: 'Swing',
      swing: 0.67,
      shuffle: 0.5,
      velocityMap: new Map([
        [0, 1.0],
        [0.67, 0.6],
        [1.33, 0.9],
        [2, 0.7]
      ]),
      accentPattern: [0, 2]
    });

    // Shuffle groove
    this.grooveTemplates.set('shuffle', {
      name: 'Shuffle',
      swing: 0.75,
      shuffle: 0.8,
      velocityMap: new Map([
        [0, 1.0],
        [0.75, 0.5],
        [1.5, 0.9],
        [2.25, 0.5]
      ]),
      accentPattern: [0]
    });

    // Latin groove
    this.grooveTemplates.set('latin', {
      name: 'Latin',
      swing: 0,
      shuffle: 0,
      velocityMap: new Map([
        [0, 1.0],
        [0.5, 0.7],
        [1, 0.8],
        [1.5, 0.7],
        [2, 0.9],
        [2.5, 0.7],
        [3, 0.8],
        [3.5, 0.7]
      ]),
      accentPattern: [0, 2, 3]
    });
  }

  /**
   * Initialize drum patterns
   */
  private initializePatterns(): void {
    this.drumPatterns.set('jazz', [
      this.createJazzPattern(),
      this.createJazzWalkingPattern(),
      this.createJazzBopPattern()
    ]);

    this.drumPatterns.set('edm', [
      this.createFourOnFloorPattern(),
      this.createEDMBuildPattern(),
      this.createBreakbeatPattern()
    ]);

    this.drumPatterns.set('rock', [
      this.createBasicRockPattern(),
      this.createRockFillPattern(),
      this.createHalfTimeRockPattern()
    ]);

    this.drumPatterns.set('hiphop', [
      this.createBoomBapPattern(),
      this.createTrapPattern(),
      this.createLoFiPattern()
    ]);

    this.drumPatterns.set('latin', [
      this.createSambaPattern(),
      this.createBossaNovaPattern(),
      this.createSalsaPattern()
    ]);

    this.drumPatterns.set('ambient', [
      this.createAmbientPattern(),
      this.createMinimalPattern()
    ]);
  }

  /**
   * Generate rhythm
   */
  public generate(params: RhythmParams): DrumHit[] {
    const patterns = this.drumPatterns.get(params.genre) || this.drumPatterns.get('rock')!;
    const basePattern = this.selectPattern(patterns, params.complexity || 'medium');

    const beatDuration = 60 / params.tempo;
    const barDuration = beatDuration * params.timeSignature[0];

    const rhythm: DrumHit[] = [];

    for (let bar = 0; bar < params.numBars; bar++) {
      const barOffset = bar * barDuration;

      // Decide if this bar should have a fill
      const isFillBar = params.fills && (bar % 4 === 3 || bar === params.numBars - 1);

      let barPattern: RhythmPattern;

      if (isFillBar) {
        barPattern = this.generateFill(params, basePattern);
      } else {
        // Add variation
        barPattern = this.varyPattern(basePattern, params.variation || 0);
      }

      // Add pattern hits with timing offset
      for (const hit of barPattern.hits) {
        rhythm.push({
          ...hit,
          startTime: barOffset + hit.startTime * beatDuration
        });
      }
    }

    // Apply groove
    const groove = this.getGrooveForGenre(params.genre);
    this.applyGroove(rhythm, groove, params.tempo);

    // Apply humanization
    if (params.humanize) {
      this.humanize(rhythm, params.humanize);
    }

    return rhythm;
  }

  /**
   * Select pattern based on complexity
   */
  private selectPattern(patterns: RhythmPattern[], complexity: string): RhythmPattern {
    const index = complexity === 'simple' ? 0 :
                  complexity === 'complex' ? patterns.length - 1 :
                  Math.floor(patterns.length / 2);

    return patterns[Math.min(index, patterns.length - 1)];
  }

  /**
   * Get groove for genre
   */
  private getGrooveForGenre(genre: string): GrooveTemplate {
    const grooveMap: Record<string, string> = {
      'jazz': 'swing',
      'edm': 'straight',
      'rock': 'straight',
      'hiphop': 'straight',
      'latin': 'latin',
      'ambient': 'straight'
    };

    const grooveName = grooveMap[genre] || 'straight';
    return this.grooveTemplates.get(grooveName)!;
  }

  /**
   * Create jazz pattern
   */
  private createJazzPattern(): RhythmPattern {
    const hits: DrumHit[] = [
      // Ride cymbal (ding-ding-da-ding pattern)
      { instrument: 'ride', startTime: 0, velocity: 80 },
      { instrument: 'ride', startTime: 0.67, velocity: 60 },
      { instrument: 'ride', startTime: 1.33, velocity: 70 },
      { instrument: 'ride', startTime: 2, velocity: 80 },
      { instrument: 'ride', startTime: 2.67, velocity: 60 },
      { instrument: 'ride', startTime: 3.33, velocity: 70 },

      // Hi-hat (2 and 4)
      { instrument: 'hihat-closed', startTime: 1, velocity: 70 },
      { instrument: 'hihat-closed', startTime: 3, velocity: 70 },

      // Kick (walking bass drum)
      { instrument: 'kick', startTime: 0, velocity: 90 },
      { instrument: 'kick', startTime: 2.5, velocity: 75 },

      // Snare (backbeats)
      { instrument: 'snare', startTime: 1, velocity: 85 },
      { instrument: 'snare', startTime: 3, velocity: 85 },

      // Ghost notes
      { instrument: 'snare', startTime: 1.5, velocity: 40 },
      { instrument: 'snare', startTime: 3.5, velocity: 40 },
    ];

    return {
      name: 'Jazz Swing',
      hits,
      duration: 4,
      timeSignature: [4, 4]
    };
  }

  /**
   * Create jazz walking pattern
   */
  private createJazzWalkingPattern(): RhythmPattern {
    const hits: DrumHit[] = [
      // Ride
      { instrument: 'ride', startTime: 0, velocity: 85 },
      { instrument: 'ride', startTime: 0.67, velocity: 60 },
      { instrument: 'ride', startTime: 1.33, velocity: 70 },
      { instrument: 'ride', startTime: 2, velocity: 85 },
      { instrument: 'ride', startTime: 2.67, velocity: 60 },
      { instrument: 'ride', startTime: 3.33, velocity: 70 },

      // Hi-hat
      { instrument: 'hihat-closed', startTime: 1, velocity: 75 },
      { instrument: 'hihat-closed', startTime: 3, velocity: 75 },

      // Walking kick pattern
      { instrument: 'kick', startTime: 0, velocity: 90 },
      { instrument: 'kick', startTime: 1, velocity: 80 },
      { instrument: 'kick', startTime: 2, velocity: 85 },
      { instrument: 'kick', startTime: 3, velocity: 80 },

      // Snare
      { instrument: 'snare', startTime: 1, velocity: 85 },
      { instrument: 'snare', startTime: 3, velocity: 85 },
    ];

    return {
      name: 'Jazz Walking',
      hits,
      duration: 4,
      timeSignature: [4, 4]
    };
  }

  /**
   * Create bebop pattern
   */
  private createJazzBopPattern(): RhythmPattern {
    const hits: DrumHit[] = [
      // Complex ride pattern
      { instrument: 'ride', startTime: 0, velocity: 90 },
      { instrument: 'ride', startTime: 0.5, velocity: 55 },
      { instrument: 'ride', startTime: 0.67, velocity: 65 },
      { instrument: 'ride', startTime: 1.33, velocity: 75 },
      { instrument: 'ride', startTime: 2, velocity: 90 },
      { instrument: 'ride', startTime: 2.5, velocity: 55 },
      { instrument: 'ride', startTime: 2.67, velocity: 65 },
      { instrument: 'ride', startTime: 3.33, velocity: 75 },

      // Hi-hat
      { instrument: 'hihat-closed', startTime: 1, velocity: 70 },
      { instrument: 'hihat-closed', startTime: 3, velocity: 70 },

      // Kick (syncopated)
      { instrument: 'kick', startTime: 0, velocity: 95 },
      { instrument: 'kick', startTime: 1.67, velocity: 80 },
      { instrument: 'kick', startTime: 3.5, velocity: 75 },

      // Snare (with ghost notes)
      { instrument: 'snare', startTime: 1, velocity: 90 },
      { instrument: 'snare', startTime: 1.5, velocity: 45 },
      { instrument: 'snare', startTime: 2.5, velocity: 40 },
      { instrument: 'snare', startTime: 3, velocity: 90 },
      { instrument: 'snare', startTime: 3.75, velocity: 45 },
    ];

    return {
      name: 'Bebop',
      hits,
      duration: 4,
      timeSignature: [4, 4]
    };
  }

  /**
   * Create four-on-the-floor pattern (EDM)
   */
  private createFourOnFloorPattern(): RhythmPattern {
    const hits: DrumHit[] = [
      // Kick on every beat
      { instrument: 'kick', startTime: 0, velocity: 110 },
      { instrument: 'kick', startTime: 1, velocity: 110 },
      { instrument: 'kick', startTime: 2, velocity: 110 },
      { instrument: 'kick', startTime: 3, velocity: 110 },

      // Snare/clap on 2 and 4
      { instrument: 'clap', startTime: 1, velocity: 100 },
      { instrument: 'clap', startTime: 3, velocity: 100 },

      // Hi-hat 16ths
      { instrument: 'hihat-closed', startTime: 0, velocity: 80 },
      { instrument: 'hihat-closed', startTime: 0.25, velocity: 60 },
      { instrument: 'hihat-closed', startTime: 0.5, velocity: 70 },
      { instrument: 'hihat-closed', startTime: 0.75, velocity: 60 },
      { instrument: 'hihat-closed', startTime: 1, velocity: 80 },
      { instrument: 'hihat-closed', startTime: 1.25, velocity: 60 },
      { instrument: 'hihat-closed', startTime: 1.5, velocity: 70 },
      { instrument: 'hihat-closed', startTime: 1.75, velocity: 60 },
      { instrument: 'hihat-closed', startTime: 2, velocity: 80 },
      { instrument: 'hihat-closed', startTime: 2.25, velocity: 60 },
      { instrument: 'hihat-closed', startTime: 2.5, velocity: 70 },
      { instrument: 'hihat-closed', startTime: 2.75, velocity: 60 },
      { instrument: 'hihat-closed', startTime: 3, velocity: 80 },
      { instrument: 'hihat-closed', startTime: 3.25, velocity: 60 },
      { instrument: 'hihat-closed', startTime: 3.5, velocity: 70 },
      { instrument: 'hihat-closed', startTime: 3.75, velocity: 60 },
    ];

    return {
      name: 'Four on the Floor',
      hits,
      duration: 4,
      timeSignature: [4, 4]
    };
  }

  /**
   * Create EDM build pattern
   */
  private createEDMBuildPattern(): RhythmPattern {
    const hits: DrumHit[] = [
      // Increasing kick frequency
      { instrument: 'kick', startTime: 0, velocity: 90 },
      { instrument: 'kick', startTime: 1, velocity: 95 },
      { instrument: 'kick', startTime: 2, velocity: 100 },
      { instrument: 'kick', startTime: 2.5, velocity: 100 },
      { instrument: 'kick', startTime: 3, velocity: 105 },
      { instrument: 'kick', startTime: 3.25, velocity: 105 },
      { instrument: 'kick', startTime: 3.5, velocity: 110 },
      { instrument: 'kick', startTime: 3.75, velocity: 110 },

      // Snare roll
      { instrument: 'snare', startTime: 2, velocity: 70 },
      { instrument: 'snare', startTime: 2.25, velocity: 75 },
      { instrument: 'snare', startTime: 2.5, velocity: 80 },
      { instrument: 'snare', startTime: 2.75, velocity: 85 },
      { instrument: 'snare', startTime: 3, velocity: 90 },
      { instrument: 'snare', startTime: 3.125, velocity: 92 },
      { instrument: 'snare', startTime: 3.25, velocity: 95 },
      { instrument: 'snare', startTime: 3.375, velocity: 98 },
      { instrument: 'snare', startTime: 3.5, velocity: 100 },
      { instrument: 'snare', startTime: 3.625, velocity: 105 },
      { instrument: 'snare', startTime: 3.75, velocity: 110 },
      { instrument: 'snare', startTime: 3.875, velocity: 115 },

      // Hi-hat
      { instrument: 'hihat-open', startTime: 0, velocity: 70 },
      { instrument: 'hihat-open', startTime: 1, velocity: 75 },
      { instrument: 'hihat-open', startTime: 2, velocity: 80 },
      { instrument: 'hihat-open', startTime: 3, velocity: 85 },
    ];

    return {
      name: 'EDM Build',
      hits,
      duration: 4,
      timeSignature: [4, 4]
    };
  }

  /**
   * Create breakbeat pattern
   */
  private createBreakbeatPattern(): RhythmPattern {
    const hits: DrumHit[] = [
      // Syncopated kicks
      { instrument: 'kick', startTime: 0, velocity: 100 },
      { instrument: 'kick', startTime: 1.5, velocity: 90 },
      { instrument: 'kick', startTime: 2.75, velocity: 85 },

      // Snare
      { instrument: 'snare', startTime: 1, velocity: 95 },
      { instrument: 'snare', startTime: 2.25, velocity: 80 },
      { instrument: 'snare', startTime: 3, velocity: 95 },

      // Hi-hat pattern
      { instrument: 'hihat-closed', startTime: 0, velocity: 75 },
      { instrument: 'hihat-closed', startTime: 0.5, velocity: 60 },
      { instrument: 'hihat-open', startTime: 0.75, velocity: 70 },
      { instrument: 'hihat-closed', startTime: 1, velocity: 75 },
      { instrument: 'hihat-closed', startTime: 1.5, velocity: 65 },
      { instrument: 'hihat-closed', startTime: 2, velocity: 75 },
      { instrument: 'hihat-closed', startTime: 2.5, velocity: 60 },
      { instrument: 'hihat-open', startTime: 2.75, velocity: 70 },
      { instrument: 'hihat-closed', startTime: 3, velocity: 75 },
      { instrument: 'hihat-closed', startTime: 3.5, velocity: 65 },
    ];

    return {
      name: 'Breakbeat',
      hits,
      duration: 4,
      timeSignature: [4, 4]
    };
  }

  /**
   * Create basic rock pattern
   */
  private createBasicRockPattern(): RhythmPattern {
    const hits: DrumHit[] = [
      // Kick
      { instrument: 'kick', startTime: 0, velocity: 100 },
      { instrument: 'kick', startTime: 2, velocity: 100 },
      { instrument: 'kick', startTime: 3, velocity: 90 },

      // Snare
      { instrument: 'snare', startTime: 1, velocity: 95 },
      { instrument: 'snare', startTime: 3, velocity: 95 },

      // Hi-hat 8ths
      { instrument: 'hihat-closed', startTime: 0, velocity: 80 },
      { instrument: 'hihat-closed', startTime: 0.5, velocity: 65 },
      { instrument: 'hihat-closed', startTime: 1, velocity: 80 },
      { instrument: 'hihat-closed', startTime: 1.5, velocity: 65 },
      { instrument: 'hihat-closed', startTime: 2, velocity: 80 },
      { instrument: 'hihat-closed', startTime: 2.5, velocity: 65 },
      { instrument: 'hihat-closed', startTime: 3, velocity: 80 },
      { instrument: 'hihat-closed', startTime: 3.5, velocity: 65 },
    ];

    return {
      name: 'Basic Rock',
      hits,
      duration: 4,
      timeSignature: [4, 4]
    };
  }

  /**
   * Create rock fill
   */
  private createRockFillPattern(): RhythmPattern {
    const hits: DrumHit[] = [
      // Tom fill
      { instrument: 'tom-high', startTime: 3, velocity: 90 },
      { instrument: 'tom-high', startTime: 3.25, velocity: 85 },
      { instrument: 'tom-mid', startTime: 3.5, velocity: 95 },
      { instrument: 'tom-mid', startTime: 3.75, velocity: 90 },
      { instrument: 'tom-low', startTime: 3.875, velocity: 100 },

      // Crash on downbeat
      { instrument: 'crash', startTime: 0, velocity: 110 },

      // Kick
      { instrument: 'kick', startTime: 0, velocity: 100 },
      { instrument: 'kick', startTime: 2, velocity: 100 },

      // Snare
      { instrument: 'snare', startTime: 1, velocity: 95 },

      // Hi-hat
      { instrument: 'hihat-closed', startTime: 0.5, velocity: 70 },
      { instrument: 'hihat-closed', startTime: 1.5, velocity: 70 },
      { instrument: 'hihat-closed', startTime: 2.5, velocity: 70 },
    ];

    return {
      name: 'Rock Fill',
      hits,
      duration: 4,
      timeSignature: [4, 4]
    };
  }

  /**
   * Create half-time rock pattern
   */
  private createHalfTimeRockPattern(): RhythmPattern {
    const hits: DrumHit[] = [
      // Kick
      { instrument: 'kick', startTime: 0, velocity: 105 },
      { instrument: 'kick', startTime: 0.5, velocity: 90 },

      // Snare on 3
      { instrument: 'snare', startTime: 2, velocity: 100 },

      // Hi-hat
      { instrument: 'hihat-closed', startTime: 0, velocity: 75 },
      { instrument: 'hihat-closed', startTime: 1, velocity: 70 },
      { instrument: 'hihat-open', startTime: 1.5, velocity: 65 },
      { instrument: 'hihat-closed', startTime: 2, velocity: 75 },
      { instrument: 'hihat-closed', startTime: 3, velocity: 70 },
      { instrument: 'hihat-open', startTime: 3.5, velocity: 65 },
    ];

    return {
      name: 'Half-Time Rock',
      hits,
      duration: 4,
      timeSignature: [4, 4]
    };
  }

  /**
   * Create boom-bap pattern (Hip-Hop)
   */
  private createBoomBapPattern(): RhythmPattern {
    const hits: DrumHit[] = [
      // Kick
      { instrument: 'kick', startTime: 0, velocity: 110 },
      { instrument: 'kick', startTime: 1.5, velocity: 95 },
      { instrument: 'kick', startTime: 3.75, velocity: 90 },

      // Snare
      { instrument: 'snare', startTime: 1, velocity: 105 },
      { instrument: 'snare', startTime: 3, velocity: 105 },

      // Hi-hat
      { instrument: 'hihat-closed', startTime: 0.5, velocity: 60 },
      { instrument: 'hihat-closed', startTime: 1.5, velocity: 70 },
      { instrument: 'hihat-closed', startTime: 2.5, velocity: 60 },
      { instrument: 'hihat-closed', startTime: 3.5, velocity: 70 },
    ];

    return {
      name: 'Boom Bap',
      hits,
      duration: 4,
      timeSignature: [4, 4]
    };
  }

  /**
   * Create trap pattern
   */
  private createTrapPattern(): RhythmPattern {
    const hits: DrumHit[] = [
      // Kick (808)
      { instrument: 'kick', startTime: 0, velocity: 115, duration: 0.5 },
      { instrument: 'kick', startTime: 1.5, velocity: 100, duration: 0.3 },
      { instrument: 'kick', startTime: 2, velocity: 110, duration: 0.5 },
      { instrument: 'kick', startTime: 3.5, velocity: 105, duration: 0.4 },

      // Snare
      { instrument: 'snare', startTime: 1, velocity: 100 },
      { instrument: 'snare', startTime: 3, velocity: 100 },

      // Hi-hat rolls
      { instrument: 'hihat-closed', startTime: 0, velocity: 80 },
      { instrument: 'hihat-closed', startTime: 0.25, velocity: 60 },
      { instrument: 'hihat-closed', startTime: 0.5, velocity: 70 },
      { instrument: 'hihat-closed', startTime: 0.75, velocity: 60 },
      { instrument: 'hihat-closed', startTime: 1, velocity: 80 },
      { instrument: 'hihat-closed', startTime: 1.125, velocity: 55 },
      { instrument: 'hihat-closed', startTime: 1.25, velocity: 60 },
      { instrument: 'hihat-closed', startTime: 1.375, velocity: 55 },
      { instrument: 'hihat-closed', startTime: 1.5, velocity: 75 },
      { instrument: 'hihat-closed', startTime: 1.625, velocity: 55 },
      { instrument: 'hihat-closed', startTime: 1.75, velocity: 65 },
      { instrument: 'hihat-closed', startTime: 1.875, velocity: 55 },
      { instrument: 'hihat-closed', startTime: 2, velocity: 80 },
      { instrument: 'hihat-closed', startTime: 2.5, velocity: 70 },
      { instrument: 'hihat-closed', startTime: 3, velocity: 80 },
      { instrument: 'hihat-closed', startTime: 3.5, velocity: 70 },

      // Rim
      { instrument: 'rim', startTime: 2.75, velocity: 75 },
    ];

    return {
      name: 'Trap',
      hits,
      duration: 4,
      timeSignature: [4, 4]
    };
  }

  /**
   * Create lo-fi pattern
   */
  private createLoFiPattern(): RhythmPattern {
    const hits: DrumHit[] = [
      // Soft kick
      { instrument: 'kick', startTime: 0, velocity: 75 },
      { instrument: 'kick', startTime: 2.25, velocity: 65 },

      // Snare
      { instrument: 'snare', startTime: 1, velocity: 70 },
      { instrument: 'snare', startTime: 3, velocity: 70 },

      // Lazy hi-hat
      { instrument: 'hihat-closed', startTime: 0.5, velocity: 50 },
      { instrument: 'hihat-closed', startTime: 1.5, velocity: 55 },
      { instrument: 'hihat-open', startTime: 2.5, velocity: 45 },
      { instrument: 'hihat-closed', startTime: 3.5, velocity: 50 },

      // Shaker
      { instrument: 'shaker', startTime: 0, velocity: 40 },
      { instrument: 'shaker', startTime: 0.5, velocity: 35 },
      { instrument: 'shaker', startTime: 1, velocity: 40 },
      { instrument: 'shaker', startTime: 1.5, velocity: 35 },
      { instrument: 'shaker', startTime: 2, velocity: 40 },
      { instrument: 'shaker', startTime: 2.5, velocity: 35 },
      { instrument: 'shaker', startTime: 3, velocity: 40 },
      { instrument: 'shaker', startTime: 3.5, velocity: 35 },
    ];

    return {
      name: 'Lo-Fi',
      hits,
      duration: 4,
      timeSignature: [4, 4]
    };
  }

  /**
   * Create samba pattern
   */
  private createSambaPattern(): RhythmPattern {
    const hits: DrumHit[] = [
      // Kick (surdo)
      { instrument: 'kick', startTime: 0, velocity: 95 },
      { instrument: 'kick', startTime: 1.5, velocity: 90 },
      { instrument: 'kick', startTime: 2, velocity: 95 },
      { instrument: 'kick', startTime: 3.5, velocity: 90 },

      // Snare (caixa)
      { instrument: 'snare', startTime: 0.25, velocity: 75 },
      { instrument: 'snare', startTime: 0.75, velocity: 70 },
      { instrument: 'snare', startTime: 1.25, velocity: 75 },
      { instrument: 'snare', startTime: 1.75, velocity: 70 },
      { instrument: 'snare', startTime: 2.25, velocity: 75 },
      { instrument: 'snare', startTime: 2.75, velocity: 70 },
      { instrument: 'snare', startTime: 3.25, velocity: 75 },
      { instrument: 'snare', startTime: 3.75, velocity: 70 },

      // Shaker
      { instrument: 'shaker', startTime: 0, velocity: 65 },
      { instrument: 'shaker', startTime: 0.5, velocity: 55 },
      { instrument: 'shaker', startTime: 1, velocity: 65 },
      { instrument: 'shaker', startTime: 1.5, velocity: 55 },
      { instrument: 'shaker', startTime: 2, velocity: 65 },
      { instrument: 'shaker', startTime: 2.5, velocity: 55 },
      { instrument: 'shaker', startTime: 3, velocity: 65 },
      { instrument: 'shaker', startTime: 3.5, velocity: 55 },
    ];

    return {
      name: 'Samba',
      hits,
      duration: 4,
      timeSignature: [4, 4]
    };
  }

  /**
   * Create bossa nova pattern
   */
  private createBossaNovaPattern(): RhythmPattern {
    const hits: DrumHit[] = [
      // Kick
      { instrument: 'kick', startTime: 0, velocity: 85 },
      { instrument: 'kick', startTime: 1.5, velocity: 80 },
      { instrument: 'kick', startTime: 2.5, velocity: 75 },

      // Rim
      { instrument: 'rim', startTime: 0.5, velocity: 70 },
      { instrument: 'rim', startTime: 2, velocity: 75 },
      { instrument: 'rim', startTime: 3, velocity: 70 },
      { instrument: 'rim', startTime: 3.5, velocity: 65 },

      // Brush on snare
      { instrument: 'snare', startTime: 1, velocity: 50 },
      { instrument: 'snare', startTime: 3, velocity: 50 },
    ];

    return {
      name: 'Bossa Nova',
      hits,
      duration: 4,
      timeSignature: [4, 4]
    };
  }

  /**
   * Create salsa pattern
   */
  private createSalsaPattern(): RhythmPattern {
    const hits: DrumHit[] = [
      // Conga
      { instrument: 'conga-low', startTime: 0, velocity: 90 },
      { instrument: 'conga-high', startTime: 0.5, velocity: 75 },
      { instrument: 'conga-low', startTime: 1, velocity: 85 },
      { instrument: 'conga-high', startTime: 1.5, velocity: 70 },
      { instrument: 'conga-low', startTime: 2, velocity: 90 },
      { instrument: 'conga-high', startTime: 2.5, velocity: 75 },
      { instrument: 'conga-low', startTime: 3, velocity: 85 },
      { instrument: 'conga-high', startTime: 3.5, velocity: 70 },

      // Cowbell (clave pattern)
      { instrument: 'cowbell', startTime: 0, velocity: 80 },
      { instrument: 'cowbell', startTime: 0.75, velocity: 70 },
      { instrument: 'cowbell', startTime: 1.5, velocity: 75 },
      { instrument: 'cowbell', startTime: 2.25, velocity: 70 },
      { instrument: 'cowbell', startTime: 3, velocity: 80 },
    ];

    return {
      name: 'Salsa',
      hits,
      duration: 4,
      timeSignature: [4, 4]
    };
  }

  /**
   * Create ambient pattern
   */
  private createAmbientPattern(): RhythmPattern {
    const hits: DrumHit[] = [
      // Sparse, atmospheric hits
      { instrument: 'kick', startTime: 0, velocity: 60 },
      { instrument: 'hihat-open', startTime: 1, velocity: 45, duration: 1.5 },
      { instrument: 'crash', startTime: 3.5, velocity: 50, duration: 2.0 },
    ];

    return {
      name: 'Ambient',
      hits,
      duration: 4,
      timeSignature: [4, 4]
    };
  }

  /**
   * Create minimal pattern
   */
  private createMinimalPattern(): RhythmPattern {
    const hits: DrumHit[] = [
      { instrument: 'kick', startTime: 0, velocity: 70 },
      { instrument: 'hihat-closed', startTime: 2, velocity: 55 },
    ];

    return {
      name: 'Minimal',
      hits,
      duration: 4,
      timeSignature: [4, 4]
    };
  }

  /**
   * Vary pattern
   */
  private varyPattern(pattern: RhythmPattern, amount: number): RhythmPattern {
    if (amount === 0) return pattern;

    const varied: DrumHit[] = pattern.hits.map(hit => {
      if (Math.random() < amount * 0.3) {
        // Skip hit
        return null;
      }

      return {
        ...hit,
        velocity: hit.velocity + (Math.random() - 0.5) * amount * 20
      };
    }).filter(hit => hit !== null) as DrumHit[];

    return { ...pattern, hits: varied };
  }

  /**
   * Generate fill
   */
  private generateFill(params: RhythmParams, basePattern: RhythmPattern): RhythmPattern {
    const fills: DrumHit[] = [];

    // Add tom roll
    for (let i = 0; i < 8; i++) {
      const time = 2 + (i * 0.25);
      const tom = i < 3 ? 'tom-high' : i < 6 ? 'tom-mid' : 'tom-low';
      fills.push({
        instrument: tom as DrumInstrument,
        startTime: time,
        velocity: 80 + i * 3
      });
    }

    // Keep first half of base pattern
    const firstHalf = basePattern.hits.filter(hit => hit.startTime < 2);

    return {
      ...basePattern,
      hits: [...firstHalf, ...fills]
    };
  }

  /**
   * Apply groove to rhythm
   */
  private applyGroove(rhythm: DrumHit[], groove: GrooveTemplate, tempo: number): void {
    const beatDuration = 60 / tempo;

    for (const hit of rhythm) {
      const beat = hit.startTime / beatDuration;
      const beatPosition = beat % 4;

      // Apply swing
      if (groove.swing > 0 && beatPosition % 1 !== 0) {
        const swingOffset = groove.swing * beatDuration * 0.1;
        hit.startTime += swingOffset;
      }

      // Apply velocity from groove
      const velocityMultiplier = groove.velocityMap.get(beatPosition) || 1.0;
      hit.velocity *= velocityMultiplier;

      // Accent pattern
      if (groove.accentPattern.includes(Math.floor(beatPosition))) {
        hit.velocity = Math.min(127, hit.velocity * 1.15);
      }
    }
  }

  /**
   * Humanize rhythm
   */
  private humanize(rhythm: DrumHit[], amount: number): void {
    for (const hit of rhythm) {
      // Timing variation
      hit.startTime += (Math.random() - 0.5) * amount * 0.02;

      // Velocity variation
      const velocityVariation = (Math.random() - 0.5) * amount * 15;
      hit.velocity = Math.max(1, Math.min(127, hit.velocity + velocityVariation));
    }
  }
}

export default RhythmEngine;

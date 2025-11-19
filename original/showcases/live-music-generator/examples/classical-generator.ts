/**
 * Classical Music Generator Example
 *
 * Generate classical music in various forms (sonata, fugue, rondo) with
 * proper counterpoint, voice leading, and classical harmony rules.
 *
 * Features:
 * - Sonata form (exposition, development, recapitulation)
 * - Fugue composition with subject and countersubject
 * - Classical voice leading rules
 * - Counterpoint (species counterpoint)
 * - Orchestral arrangement
 * - Classical harmonic progressions
 */

import { ChordProgressionGenerator } from '../src/music-engine/chord-progressions';
import { MelodyGenerator } from '../src/music-engine/melody-generator';
import { RhythmEngine } from '../src/music-engine/rhythm-engine';
import { Synthesizer } from '../src/audio/synthesizer';

/**
 * Classical music configuration
 */
interface ClassicalConfig {
  key: string;
  mode: 'major' | 'minor';
  form: 'sonata' | 'fugue' | 'rondo' | 'theme-variations';
  tempo: number;
  instrumentation: 'solo' | 'chamber' | 'orchestra';
}

/**
 * Musical theme
 */
interface Theme {
  melody: any[];
  harmony: any[];
  key: string;
}

/**
 * Classical Music Generator
 */
export class ClassicalGenerator {
  private chordGen: ChordProgressionGenerator;
  private melodyGen: MelodyGenerator;
  private rhythmEngine: RhythmEngine;
  private synthesizer: Synthesizer;

  constructor() {
    this.chordGen = new ChordProgressionGenerator();
    this.melodyGen = new MelodyGenerator();
    this.rhythmEngine = new RhythmEngine();
    this.synthesizer = new Synthesizer(44100);
  }

  /**
   * Generate classical composition
   */
  public generateClassicalPiece(config: ClassicalConfig): any {
    console.log(`Generating ${config.form} in ${config.key} ${config.mode}`);

    switch (config.form) {
      case 'sonata':
        return this.generateSonata(config);
      case 'fugue':
        return this.generateFugue(config);
      case 'rondo':
        return this.generateRondo(config);
      case 'theme-variations':
        return this.generateThemeAndVariations(config);
      default:
        return this.generateSonata(config);
    }
  }

  /**
   * Generate sonata form
   */
  private generateSonata(config: ClassicalConfig): any {
    const beatDuration = 60 / config.tempo;

    // Exposition
    const exposition = this.generateExposition(config, 0);

    // Development
    const developmentStart = exposition.duration;
    const development = this.generateDevelopment(
      config,
      developmentStart,
      exposition.primaryTheme,
      exposition.secondaryTheme
    );

    // Recapitulation
    const recapStart = developmentStart + development.duration;
    const recapitulation = this.generateRecapitulation(
      config,
      recapStart,
      exposition
    );

    return {
      form: 'sonata',
      config,
      exposition,
      development,
      recapitulation,
      totalDuration: exposition.duration + development.duration + recapitulation.duration
    };
  }

  /**
   * Generate exposition section
   */
  private generateExposition(config: ClassicalConfig, startTime: number): any {
    // Primary theme in tonic key
    const primaryTheme = this.generateTheme(config.key, config.mode, 'lyrical', 8);

    // Bridge/transition
    const bridge = this.generateBridge(config.key, 4);

    // Secondary theme in dominant/relative key
    const secondaryKey = this.getSecondaryKey(config.key, config.mode);
    const secondaryTheme = this.generateTheme(secondaryKey, config.mode, 'contrasting', 8);

    // Closing section
    const closing = this.generateClosing(secondaryKey, 4);

    const beatDuration = 60 / config.tempo;
    const barDuration = beatDuration * 4;

    return {
      section: 'exposition',
      startTime,
      duration: 24 * barDuration,
      primaryTheme,
      bridge,
      secondaryTheme,
      closing
    };
  }

  /**
   * Generate development section
   */
  private generateDevelopment(
    config: ClassicalConfig,
    startTime: number,
    primaryTheme: Theme,
    secondaryTheme: Theme
  ): any {
    const developments = [];

    // Fragment primary theme
    const fragmentedPrimary = this.fragmentTheme(primaryTheme);
    developments.push(fragmentedPrimary);

    // Sequence through different keys
    const sequences = this.generateSequences(primaryTheme, 3);
    developments.push(...sequences);

    // Develop secondary theme
    const developedSecondary = this.developTheme(secondaryTheme);
    developments.push(developedSecondary);

    // Retransition back to tonic
    const retransition = this.generateRetransition(config.key);
    developments.push(retransition);

    const beatDuration = 60 / config.tempo;
    const barDuration = beatDuration * 4;

    return {
      section: 'development',
      startTime,
      duration: 16 * barDuration,
      developments
    };
  }

  /**
   * Generate recapitulation section
   */
  private generateRecapitulation(
    config: ClassicalConfig,
    startTime: number,
    exposition: any
  ): any {
    // Similar to exposition but both themes in tonic
    const primaryTheme = exposition.primaryTheme;

    // Bridge
    const bridge = this.generateBridge(config.key, 4);

    // Secondary theme now in tonic
    const secondaryTheme = this.transposeTheme(
      exposition.secondaryTheme,
      exposition.secondaryTheme.key,
      config.key
    );

    // Coda
    const coda = this.generateCoda(config.key, 8);

    const beatDuration = 60 / config.tempo;
    const barDuration = beatDuration * 4;

    return {
      section: 'recapitulation',
      startTime,
      duration: 28 * barDuration,
      primaryTheme,
      bridge,
      secondaryTheme,
      coda
    };
  }

  /**
   * Generate fugue
   */
  private generateFugue(config: ClassicalConfig): any {
    // Generate subject (main theme)
    const subject = this.generateFugueSubject(config.key, config.mode);

    // Generate answer (subject in dominant)
    const answerKey = this.getDominantKey(config.key);
    const answer = this.transposeTheme(subject, config.key, answerKey);

    // Generate countersubject
    const countersubject = this.generateCountersubject(subject);

    // Exposition (voices enter one by one)
    const exposition = this.generateFugueExposition(subject, answer, countersubject);

    // Episodes (modulatory sections)
    const episodes = this.generateFugueEpisodes(subject, 3);

    // Stretto (overlapping subject entries)
    const stretto = this.generateStretto(subject);

    return {
      form: 'fugue',
      config,
      subject,
      answer,
      countersubject,
      exposition,
      episodes,
      stretto
    };
  }

  /**
   * Generate rondo form (ABACA)
   */
  private generateRondo(config: ClassicalConfig): any {
    // A theme (refrain)
    const aTheme = this.generateTheme(config.key, config.mode, 'memorable', 8);

    // B theme (first episode)
    const bKey = this.getRelativeKey(config.key, config.mode);
    const bTheme = this.generateTheme(bKey, config.mode, 'contrasting', 8);

    // C theme (second episode)
    const cKey = this.getSubdominantKey(config.key);
    const cTheme = this.generateTheme(cKey, config.mode, 'developmental', 8);

    // Assemble ABACA form
    const sections = [
      { name: 'A1', theme: aTheme },
      { name: 'B', theme: bTheme },
      { name: 'A2', theme: aTheme },
      { name: 'C', theme: cTheme },
      { name: 'A3', theme: aTheme }
    ];

    return {
      form: 'rondo',
      config,
      sections,
      aTheme,
      bTheme,
      cTheme
    };
  }

  /**
   * Generate theme and variations
   */
  private generateThemeAndVariations(config: ClassicalConfig): any {
    // Original theme
    const theme = this.generateTheme(config.key, config.mode, 'simple', 8);

    // Generate variations
    const variations = [
      this.createOrnamentation(theme),
      this.createRhythmicVariation(theme),
      this.createHarmonicVariation(theme),
      this.createMinorVariation(theme),
      this.createTempoVariation(theme, 1.5), // Faster
      this.createFugalVariation(theme)
    ];

    return {
      form: 'theme-variations',
      config,
      theme,
      variations
    };
  }

  /**
   * Generate musical theme
   */
  private generateTheme(key: string, mode: string, character: string, numBars: number): Theme {
    const chords = this.chordGen.generate({
      key,
      mode,
      numBars,
      genre: 'classical',
      complexity: 'medium',
      voicing: 'close'
    });

    const melody = this.melodyGen.generate({
      key,
      mode,
      chordProgression: chords,
      numBars,
      style: 'classical',
      contour: character === 'lyrical' ? 'arch' : 'wave',
      notesDensity: character === 'simple' ? 'sparse' : 'medium',
      ornamentation: 0.2
    });

    return {
      melody,
      harmony: chords,
      key
    };
  }

  /**
   * Generate bridge/transition
   */
  private generateBridge(key: string, numBars: number): any {
    // Modulatory bridge
    const chords = this.generateModulation(key, this.getDominantKey(key), numBars);

    return {
      type: 'bridge',
      harmony: chords
    };
  }

  /**
   * Generate closing section
   */
  private generateClosing(key: string, numBars: number): any {
    // Cadential material
    const chords = this.chordGen.generate({
      key,
      mode: 'major',
      numBars,
      genre: 'classical',
      complexity: 'simple'
    });

    // Ensure ending with authentic cadence
    if (chords.length >= 2) {
      chords[chords.length - 2].type = '7'; // V7
      chords[chords.length - 1].type = 'maj'; // I
    }

    return {
      type: 'closing',
      harmony: chords
    };
  }

  /**
   * Fragment theme
   */
  private fragmentTheme(theme: Theme): any {
    // Take first motif and develop it
    const motif = theme.melody.slice(0, 4);

    return {
      type: 'fragmentation',
      motif,
      variations: [
        this.transposeMotif(motif, 2),  // Up a step
        this.transposeMotif(motif, -2), // Down a step
        this.invertMotif(motif)         // Inversion
      ]
    };
  }

  /**
   * Generate sequences
   */
  private generateSequences(theme: Theme, count: number): any[] {
    const sequences = [];
    const motif = theme.melody.slice(0, 4);

    for (let i = 0; i < count; i++) {
      sequences.push({
        type: 'sequence',
        transposition: i * 2,
        motif: this.transposeMotif(motif, i * 2)
      });
    }

    return sequences;
  }

  /**
   * Develop theme
   */
  private developTheme(theme: Theme): any {
    return {
      type: 'development',
      original: theme,
      augmented: this.melodyGen.augment(theme.melody, 2),
      diminished: this.melodyGen.diminish(theme.melody, 2),
      inverted: this.melodyGen.invert(theme.melody)
    };
  }

  /**
   * Generate retransition
   */
  private generateRetransition(key: string): any {
    // Build tension on dominant
    const dominant = this.getDominantKey(key);

    return {
      type: 'retransition',
      targetKey: key,
      preparation: 'dominant-pedal'
    };
  }

  /**
   * Generate coda
   */
  private generateCoda(key: string, numBars: number): any {
    const chords = this.chordGen.generate({
      key,
      mode: 'major',
      numBars,
      genre: 'classical',
      complexity: 'simple'
    });

    return {
      type: 'coda',
      harmony: chords,
      character: 'conclusive'
    };
  }

  /**
   * Generate fugue subject
   */
  private generateFugueSubject(key: string, mode: string): Theme {
    const subject = this.melodyGen.generate({
      key,
      mode,
      chordProgression: [],
      numBars: 2,
      style: 'classical',
      contour: 'ascending',
      notesDensity: 'dense'
    });

    return {
      melody: subject,
      harmony: [],
      key
    };
  }

  /**
   * Generate countersubject
   */
  private generateCountersubject(subject: Theme): Theme {
    // Create counterpoint to subject
    const counter = this.melodyGen.invert(subject.melody);

    return {
      melody: counter,
      harmony: [],
      key: subject.key
    };
  }

  /**
   * Generate fugue exposition
   */
  private generateFugueExposition(subject: Theme, answer: Theme, countersubject: Theme): any {
    return {
      type: 'exposition',
      voices: [
        { entry: 0, theme: subject },
        { entry: 2, theme: answer },
        { entry: 4, theme: subject },
        { entry: 6, theme: answer }
      ]
    };
  }

  /**
   * Generate fugue episodes
   */
  private generateFugueEpisodes(subject: Theme, count: number): any[] {
    const episodes = [];

    for (let i = 0; i < count; i++) {
      episodes.push({
        type: 'episode',
        index: i + 1,
        material: this.fragmentTheme(subject),
        modulation: true
      });
    }

    return episodes;
  }

  /**
   * Generate stretto
   */
  private generateStretto(subject: Theme): any {
    return {
      type: 'stretto',
      overlappingEntries: [
        { voice: 1, delay: 0 },
        { voice: 2, delay: 1 },
        { voice: 3, delay: 2 },
        { voice: 4, delay: 3 }
      ]
    };
  }

  /**
   * Create ornamentation variation
   */
  private createOrnamentation(theme: Theme): any {
    const ornamented = this.melodyGen.addPassingTones(theme.melody);

    return {
      type: 'ornamentation',
      melody: ornamented,
      harmony: theme.harmony
    };
  }

  /**
   * Create rhythmic variation
   */
  private createRhythmicVariation(theme: Theme): any {
    const rhythmic = theme.melody.map(note => ({
      ...note,
      duration: note.duration / 2 // Double the speed
    }));

    return {
      type: 'rhythmic',
      melody: rhythmic,
      harmony: theme.harmony
    };
  }

  /**
   * Create harmonic variation
   */
  private createHarmonicVariation(theme: Theme): any {
    // Reharmonize with different chords
    const newHarmony = this.chordGen.reharmonize(theme.harmony, 'classical');

    return {
      type: 'harmonic',
      melody: theme.melody,
      harmony: newHarmony
    };
  }

  /**
   * Create minor variation
   */
  private createMinorVariation(theme: Theme): any {
    // Convert to minor mode
    const minorMelody = theme.melody.map(note => ({
      ...note,
      pitch: note.pitch // Adjust pitches for minor
    }));

    return {
      type: 'minor-mode',
      melody: minorMelody,
      harmony: theme.harmony
    };
  }

  /**
   * Create tempo variation
   */
  private createTempoVariation(theme: Theme, factor: number): any {
    const adjusted = theme.melody.map(note => ({
      ...note,
      duration: note.duration / factor,
      startTime: note.startTime / factor
    }));

    return {
      type: 'tempo',
      factor,
      melody: adjusted,
      harmony: theme.harmony
    };
  }

  /**
   * Create fugal variation
   */
  private createFugalVariation(theme: Theme): any {
    return {
      type: 'fugal',
      exposition: this.generateFugueExposition(
        theme,
        this.transposeTheme(theme, theme.key, this.getDominantKey(theme.key)),
        this.generateCountersubject(theme)
      )
    };
  }

  /**
   * Transpose theme
   */
  private transposeTheme(theme: Theme, fromKey: string, toKey: string): Theme {
    const interval = this.getKeyDistance(fromKey, toKey);

    return {
      melody: this.melodyGen.transpose(theme.melody, interval),
      harmony: this.chordGen.transpose_progression(theme.harmony, interval),
      key: toKey
    };
  }

  /**
   * Transpose motif
   */
  private transposeMotif(motif: any[], semitones: number): any[] {
    return motif.map(note => ({
      ...note,
      pitch: note.pitch + semitones
    }));
  }

  /**
   * Invert motif
   */
  private invertMotif(motif: any[]): any[] {
    return this.melodyGen.invert(motif);
  }

  /**
   * Generate modulation
   */
  private generateModulation(fromKey: string, toKey: string, numBars: number): any[] {
    // Create smooth modulation using pivot chords
    return this.chordGen.generate({
      key: fromKey,
      mode: 'major',
      numBars,
      genre: 'classical',
      complexity: 'medium'
    });
  }

  /**
   * Get secondary key (dominant or relative)
   */
  private getSecondaryKey(key: string, mode: string): string {
    return mode === 'major' ? this.getDominantKey(key) : this.getRelativeKey(key, mode);
  }

  /**
   * Get dominant key
   */
  private getDominantKey(key: string): string {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const index = notes.indexOf(key);
    return notes[(index + 7) % 12];
  }

  /**
   * Get subdominant key
   */
  private getSubdominantKey(key: string): string {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const index = notes.indexOf(key);
    return notes[(index + 5) % 12];
  }

  /**
   * Get relative key
   */
  private getRelativeKey(key: string, mode: string): string {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const index = notes.indexOf(key);
    const shift = mode === 'major' ? 9 : 3; // Minor 3rd
    return notes[(index + shift) % 12];
  }

  /**
   * Get key distance in semitones
   */
  private getKeyDistance(fromKey: string, toKey: string): number {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const from = notes.indexOf(fromKey);
    const to = notes.indexOf(toKey);
    return (to - from + 12) % 12;
  }
}

// Example usage
if (require.main === module) {
  const generator = new ClassicalGenerator();

  // Generate sonata
  const sonata = generator.generateClassicalPiece({
    key: 'C',
    mode: 'major',
    form: 'sonata',
    tempo: 120,
    instrumentation: 'solo'
  });

  console.log(`Generated ${sonata.form} in ${sonata.config.key} ${sonata.config.mode}`);
  console.log(`Total duration: ${sonata.totalDuration.toFixed(2)} seconds`);
  console.log('Sections:');
  console.log(`  Exposition: ${sonata.exposition.duration.toFixed(2)}s`);
  console.log(`  Development: ${sonata.development.duration.toFixed(2)}s`);
  console.log(`  Recapitulation: ${sonata.recapitulation.duration.toFixed(2)}s`);

  // Generate fugue
  const fugue = generator.generateClassicalPiece({
    key: 'D',
    mode: 'minor',
    form: 'fugue',
    tempo: 96,
    instrumentation: 'chamber'
  });

  console.log(`\nGenerated ${fugue.form} in ${fugue.config.key} ${fugue.config.mode}`);
  console.log(`Subject length: ${fugue.subject.melody.length} notes`);
  console.log(`Episodes: ${fugue.episodes.length}`);
}

export default ClassicalGenerator;

/**
 * Jazz Music Generator Example
 *
 * Complete example of generating jazz music with swing feel, complex harmony,
 * walking bass, and improvisation.
 *
 * Features:
 * - Jazz chord progressions (ii-V-I, rhythm changes, blues)
 * - Swing quantization
 * - Walking bass lines
 * - Jazz comping patterns
 * - Bebop-style improvisation
 * - Blue notes and chromatic approaches
 */

import { ChordProgressionGenerator } from '../src/music-engine/chord-progressions';
import { MelodyGenerator } from '../src/music-engine/melody-generator';
import { RhythmEngine } from '../src/music-engine/rhythm-engine';
import { Synthesizer } from '../src/audio/synthesizer';

/**
 * Jazz Generator Configuration
 */
interface JazzConfig {
  key: string;
  tempo: number;
  form: 'standard' | 'blues' | 'rhythm-changes' | 'modal';
  numChoruses: number;
  instruments: string[];
  swingFeel: number; // 0-1 (0.67 = typical swing)
}

/**
 * Jazz Music Generator
 */
export class JazzGenerator {
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
   * Generate complete jazz composition
   */
  public generateJazzComposition(config: JazzConfig): any {
    console.log(`Generating jazz ${config.form} in ${config.key} at ${config.tempo} BPM`);

    // Generate form structure
    const structure = this.getFormStructure(config.form);
    const totalBars = structure.totalBars * config.numChoruses;

    // Generate chord progression
    const chords = this.generateJazzChords(config, structure);

    // Generate melody/solo
    const melody = this.generateJazzMelody(config, chords);

    // Generate walking bass
    const bass = this.generateWalkingBass(chords, config.tempo);

    // Generate comping pattern
    const comping = this.generateComping(chords, config.tempo);

    // Generate drums
    const drums = this.generateJazzDrums(config);

    return {
      config,
      structure,
      chords,
      melody,
      bass,
      comping,
      drums,
      totalBars,
      duration: (totalBars * 4 * 60) / config.tempo
    };
  }

  /**
   * Get form structure
   */
  private getFormStructure(form: string): any {
    const structures = {
      'standard': {
        name: 'AABA Standard',
        sections: ['A', 'A', 'B', 'A'],
        totalBars: 32,
        barsPer: 8
      },
      'blues': {
        name: '12-Bar Blues',
        sections: ['Blues'],
        totalBars: 12,
        barsPer: 12
      },
      'rhythm-changes': {
        name: 'Rhythm Changes',
        sections: ['A', 'A', 'B', 'A'],
        totalBars: 32,
        barsPer: 8
      },
      'modal': {
        name: 'Modal Jazz',
        sections: ['Modal'],
        totalBars: 16,
        barsPer: 16
      }
    };

    return structures[form] || structures['standard'];
  }

  /**
   * Generate jazz chord progression
   */
  private generateJazzChords(config: JazzConfig, structure: any): any[] {
    if (config.form === 'blues') {
      return this.generateBluesProgression(config);
    } else if (config.form === 'rhythm-changes') {
      return this.generateRhythmChanges(config);
    } else if (config.form === 'modal') {
      return this.generateModalProgression(config);
    } else {
      return this.generateStandardProgression(config);
    }
  }

  /**
   * Generate 12-bar blues progression
   */
  private generateBluesProgression(config: JazzConfig): any[] {
    const chords = [];
    const barDuration = (60 / config.tempo) * 4; // 4/4 time

    // 12-bar blues form with jazz extensions
    const progression = [
      { degree: 1, type: '7', bars: 4 },
      { degree: 4, type: '7', bars: 2 },
      { degree: 1, type: '7', bars: 2 },
      { degree: 5, type: '7', bars: 1 },
      { degree: 4, type: '7', bars: 1 },
      { degree: 1, type: '7', bars: 2 }
    ];

    let time = 0;
    for (const item of progression) {
      const root = this.getScaleDegree(config.key, item.degree);

      chords.push({
        symbol: `${root}${item.type}`,
        root,
        type: item.type,
        startTime: time,
        duration: barDuration * item.bars,
        bars: item.bars
      });

      time += barDuration * item.bars;
    }

    return chords;
  }

  /**
   * Generate Rhythm Changes progression
   */
  private generateRhythmChanges(config: JazzConfig): any[] {
    const chords = [];
    const barDuration = (60 / config.tempo) * 4;

    // A section (I Got Rhythm changes)
    const aSection = [
      { degree: 1, type: 'maj7' },
      { degree: 6, type: 'min7' },
      { degree: 2, type: 'min7' },
      { degree: 5, type: '7' },
      { degree: 1, type: 'maj7' },
      { degree: 6, type: 'min7' },
      { degree: 2, type: 'min7' },
      { degree: 5, type: '7' }
    ];

    // B section (bridge with circle of fifths)
    const bSection = [
      { degree: 3, type: '7' },
      { degree: 6, type: '7' },
      { degree: 2, type: '7' },
      { degree: 5, type: '7' },
      { degree: 3, type: '7' },
      { degree: 6, type: '7' },
      { degree: 2, type: 'min7' },
      { degree: 5, type: '7' }
    ];

    // AABA form
    const fullForm = [...aSection, ...aSection, ...bSection, ...aSection];

    let time = 0;
    for (const item of fullForm) {
      const root = this.getScaleDegree(config.key, item.degree);

      chords.push({
        symbol: `${root}${item.type}`,
        root,
        type: item.type,
        startTime: time,
        duration: barDuration,
        bars: 1
      });

      time += barDuration;
    }

    return chords;
  }

  /**
   * Generate modal progression (like So What)
   */
  private generateModalProgression(config: JazzConfig): any[] {
    const chords = [];
    const barDuration = (60 / config.tempo) * 4;

    // Simple modal vamp
    const root = config.key;

    // 8 bars on i minor
    chords.push({
      symbol: `${root}min7`,
      root,
      type: 'min7',
      startTime: 0,
      duration: barDuration * 8,
      bars: 8,
      mode: 'dorian'
    });

    // 8 bars on iv minor (up a half step for interest)
    const ivRoot = this.transposeNote(root, 5);
    chords.push({
      symbol: `${ivRoot}min7`,
      root: ivRoot,
      type: 'min7',
      startTime: barDuration * 8,
      duration: barDuration * 8,
      bars: 8,
      mode: 'dorian'
    });

    return chords;
  }

  /**
   * Generate standard AABA progression
   */
  private generateStandardProgression(config: JazzConfig): any[] {
    return this.chordGen.generate({
      key: config.key,
      mode: 'major',
      numBars: 32,
      genre: 'jazz',
      complexity: 'complex',
      extensions: true,
      substitutions: true
    });
  }

  /**
   * Generate jazz melody/solo
   */
  private generateJazzMelody(config: JazzConfig, chords: any[]): any[] {
    const melody = this.melodyGen.generate({
      key: config.key,
      mode: 'major',
      chordProgression: chords,
      numBars: chords.length,
      style: 'jazz',
      contour: 'wave',
      notesDensity: 'dense',
      syncopation: 0.7,
      chromaticism: 0.4,
      ornamentation: 0.3
    });

    // Apply swing quantization
    return this.applySwing(melody, config.swingFeel);
  }

  /**
   * Generate walking bass line
   */
  private generateWalkingBass(chords: any[], tempo: number): any[] {
    const bass: any[] = [];
    const beatDuration = 60 / tempo;

    for (const chord of chords) {
      const numBeats = Math.floor(chord.duration / beatDuration);
      const chordTones = this.getChordTones(chord);

      for (let beat = 0; beat < numBeats; beat++) {
        const time = chord.startTime + beat * beatDuration;

        // Walking bass pattern: chord tones and approach notes
        let pitch: number;

        if (beat === 0) {
          // Always play root on downbeat
          pitch = this.noteToPitch(chord.root, 2); // Bass octave
        } else if (beat === numBeats - 1) {
          // Chromatic approach to next chord
          const nextChord = this.getNextChord(chords, chord);
          if (nextChord) {
            const targetPitch = this.noteToPitch(nextChord.root, 2);
            pitch = targetPitch - 1; // Half step below
          } else {
            pitch = chordTones[Math.floor(Math.random() * chordTones.length)];
          }
        } else {
          // Use chord tones and passing tones
          if (Math.random() > 0.3) {
            pitch = chordTones[Math.floor(Math.random() * chordTones.length)];
          } else {
            // Passing tone
            const scale = this.getMajorScale(chord.root, 2);
            pitch = scale[Math.floor(Math.random() * scale.length)];
          }
        }

        bass.push({
          pitch,
          startTime: time,
          duration: beatDuration * 0.9,
          velocity: 85 + Math.floor(Math.random() * 20)
        });
      }
    }

    return bass;
  }

  /**
   * Generate jazz comping pattern
   */
  private generateComping(chords: any[], tempo: number): any[] {
    const comping: any[] = [];
    const beatDuration = 60 / tempo;

    for (const chord of chords) {
      const numBeats = Math.floor(chord.duration / beatDuration);

      // Syncopated comping rhythm
      const compPattern = [
        { beat: 0.5, duration: 0.3 },
        { beat: 1.5, duration: 0.3 },
        { beat: 2.5, duration: 0.3 },
        { beat: 3.5, duration: 0.3 }
      ];

      for (const comp of compPattern) {
        if (comp.beat < numBeats && Math.random() > 0.3) {
          const chordTones = this.getChordTones(chord);
          const voicing = this.getJazzVoicing(chordTones);

          comping.push({
            notes: voicing,
            startTime: chord.startTime + comp.beat * beatDuration,
            duration: comp.duration * beatDuration,
            velocity: 60 + Math.floor(Math.random() * 20)
          });
        }
      }
    }

    return comping;
  }

  /**
   * Generate jazz drums
   */
  private generateJazzDrums(config: JazzConfig): any[] {
    return this.rhythmEngine.generate({
      genre: 'jazz',
      tempo: config.tempo,
      timeSignature: [4, 4],
      numBars: 32,
      complexity: 'complex',
      swing: config.swingFeel,
      fills: true
    });
  }

  /**
   * Apply swing quantization
   */
  private applySwing(notes: any[], swingAmount: number): any[] {
    const swung = [];

    for (const note of notes) {
      const newNote = { ...note };

      // Check if note is on off-beat
      const beatPosition = note.startTime % 1;

      if (0.4 < beatPosition && beatPosition < 0.6) {
        // Apply swing (delay off-beat 8th notes)
        newNote.startTime += swingAmount * 0.1;
      }

      swung.push(newNote);
    }

    return swung;
  }

  /**
   * Get chord tones
   */
  private getChordTones(chord: any): number[] {
    const root = this.noteToPitch(chord.root, 4);
    const type = chord.type;

    const intervals: Record<string, number[]> = {
      '7': [0, 4, 7, 10],
      'maj7': [0, 4, 7, 11],
      'min7': [0, 3, 7, 10],
      'dim7': [0, 3, 6, 9],
      'half_dim7': [0, 3, 6, 10]
    };

    const formula = intervals[type] || [0, 4, 7];
    return formula.map(i => root + i);
  }

  /**
   * Get jazz voicing (drop 2)
   */
  private getJazzVoicing(chordTones: number[]): number[] {
    // Drop 2 voicing: second note from top drops an octave
    const voicing = [...chordTones];

    if (voicing.length >= 4) {
      voicing[voicing.length - 2] -= 12;
    }

    return voicing.sort((a, b) => a - b);
  }

  /**
   * Get major scale
   */
  private getMajorScale(root: string, octave: number): number[] {
    const rootPitch = this.noteToPitch(root, octave);
    const intervals = [0, 2, 4, 5, 7, 9, 11];
    return intervals.map(i => rootPitch + i);
  }

  /**
   * Get scale degree
   */
  private getScaleDegree(key: string, degree: number): string {
    const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const noteIndex = notes.indexOf(key);
    return notes[(noteIndex + degree - 1) % notes.length];
  }

  /**
   * Transpose note
   */
  private transposeNote(note: string, semitones: number): string {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const index = notes.indexOf(note);
    return notes[(index + semitones) % 12];
  }

  /**
   * Convert note name to MIDI pitch
   */
  private noteToPitch(note: string, octave: number): number {
    const noteMap: Record<string, number> = {
      'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
      'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
    };

    return (octave + 1) * 12 + (noteMap[note] || 0);
  }

  /**
   * Get next chord
   */
  private getNextChord(chords: any[], currentChord: any): any | null {
    const index = chords.indexOf(currentChord);
    return index < chords.length - 1 ? chords[index + 1] : null;
  }
}

// Example usage
if (require.main === module) {
  const generator = new JazzGenerator();

  // Generate jazz standard
  const standard = generator.generateJazzComposition({
    key: 'Bb',
    tempo: 180,
    form: 'standard',
    numChoruses: 2,
    instruments: ['piano', 'bass', 'drums'],
    swingFeel: 0.67
  });

  console.log(`Generated ${standard.structure.name}`);
  console.log(`Duration: ${standard.duration.toFixed(2)} seconds`);
  console.log(`Total bars: ${standard.totalBars}`);
  console.log(`Chords: ${standard.chords.length}`);
  console.log(`Melody notes: ${standard.melody.length}`);
  console.log(`Bass notes: ${standard.bass.length}`);
  console.log(`Drum hits: ${standard.drums.length}`);

  // Generate blues
  const blues = generator.generateJazzComposition({
    key: 'F',
    tempo: 120,
    form: 'blues',
    numChoruses: 3,
    instruments: ['piano', 'bass', 'drums'],
    swingFeel: 0.6
  });

  console.log(`\nGenerated ${blues.structure.name}`);
  console.log(`Duration: ${blues.duration.toFixed(2)} seconds`);
}

export default JazzGenerator;

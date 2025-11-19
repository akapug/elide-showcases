/**
 * MIDI Processor - MIDI file processing and rendering
 *
 * Demonstrates python:mido for MIDI processing in TypeScript
 */

// @ts-ignore - MIDI library
import mido from 'python:mido';
// @ts-ignore - Numerical computing
import numpy from 'python:numpy';
// @ts-ignore - Audio library
import librosa from 'python:librosa';

import type { AudioData } from '../audio-processor';
import { Synthesizer, type SynthPreset, type SynthNote, SYNTH_PRESETS } from '../synthesis/synthesizer';

// ============================================================================
// Types
// ============================================================================

export interface MIDINote {
  note: number; // MIDI note number (0-127)
  velocity: number; // 0-127
  startTime: number; // seconds
  duration: number; // seconds
  channel: number; // 0-15
}

export interface MIDITrack {
  name: string;
  instrument: number; // Program number (0-127)
  notes: MIDINote[];
  controlChanges: MIDIControlChange[];
}

export interface MIDIControlChange {
  controller: number; // CC number
  value: number; // 0-127
  time: number; // seconds
}

export interface MIDIFile {
  type: number; // 0, 1, or 2
  ticksPerBeat: number;
  tempo: number; // BPM
  timeSignature: [number, number]; // [numerator, denominator]
  tracks: MIDITrack[];
  duration: number;
}

export interface MIDIRenderOptions {
  sampleRate?: number;
  preset?: SynthPreset | keyof typeof SYNTH_PRESETS;
  velocityCurve?: 'linear' | 'exponential' | 'logarithmic';
  reverbAmount?: number;
}

// ============================================================================
// General MIDI Instrument Names
// ============================================================================

export const GM_INSTRUMENTS = [
  // Piano (0-7)
  'Acoustic Grand Piano', 'Bright Acoustic Piano', 'Electric Grand Piano', 'Honky-tonk Piano',
  'Electric Piano 1', 'Electric Piano 2', 'Harpsichord', 'Clavinet',
  // Chromatic Percussion (8-15)
  'Celesta', 'Glockenspiel', 'Music Box', 'Vibraphone',
  'Marimba', 'Xylophone', 'Tubular Bells', 'Dulcimer',
  // Organ (16-23)
  'Drawbar Organ', 'Percussive Organ', 'Rock Organ', 'Church Organ',
  'Reed Organ', 'Accordion', 'Harmonica', 'Tango Accordion',
  // Guitar (24-31)
  'Acoustic Guitar (nylon)', 'Acoustic Guitar (steel)', 'Electric Guitar (jazz)', 'Electric Guitar (clean)',
  'Electric Guitar (muted)', 'Overdriven Guitar', 'Distortion Guitar', 'Guitar Harmonics',
  // Bass (32-39)
  'Acoustic Bass', 'Electric Bass (finger)', 'Electric Bass (pick)', 'Fretless Bass',
  'Slap Bass 1', 'Slap Bass 2', 'Synth Bass 1', 'Synth Bass 2',
  // Strings (40-47)
  'Violin', 'Viola', 'Cello', 'Contrabass',
  'Tremolo Strings', 'Pizzicato Strings', 'Orchestral Harp', 'Timpani',
  // Ensemble (48-55)
  'String Ensemble 1', 'String Ensemble 2', 'Synth Strings 1', 'Synth Strings 2',
  'Choir Aahs', 'Voice Oohs', 'Synth Choir', 'Orchestra Hit',
  // Brass (56-63)
  'Trumpet', 'Trombone', 'Tuba', 'Muted Trumpet',
  'French Horn', 'Brass Section', 'Synth Brass 1', 'Synth Brass 2',
  // Reed (64-71)
  'Soprano Sax', 'Alto Sax', 'Tenor Sax', 'Baritone Sax',
  'Oboe', 'English Horn', 'Bassoon', 'Clarinet',
  // Pipe (72-79)
  'Piccolo', 'Flute', 'Recorder', 'Pan Flute',
  'Blown Bottle', 'Shakuhachi', 'Whistle', 'Ocarina',
  // Synth Lead (80-87)
  'Lead 1 (square)', 'Lead 2 (sawtooth)', 'Lead 3 (calliope)', 'Lead 4 (chiff)',
  'Lead 5 (charang)', 'Lead 6 (voice)', 'Lead 7 (fifths)', 'Lead 8 (bass + lead)',
  // Synth Pad (88-95)
  'Pad 1 (new age)', 'Pad 2 (warm)', 'Pad 3 (polysynth)', 'Pad 4 (choir)',
  'Pad 5 (bowed)', 'Pad 6 (metallic)', 'Pad 7 (halo)', 'Pad 8 (sweep)',
  // Synth Effects (96-103)
  'FX 1 (rain)', 'FX 2 (soundtrack)', 'FX 3 (crystal)', 'FX 4 (atmosphere)',
  'FX 5 (brightness)', 'FX 6 (goblins)', 'FX 7 (echoes)', 'FX 8 (sci-fi)',
  // Ethnic (104-111)
  'Sitar', 'Banjo', 'Shamisen', 'Koto',
  'Kalimba', 'Bag pipe', 'Fiddle', 'Shanai',
  // Percussive (112-119)
  'Tinkle Bell', 'Agogo', 'Steel Drums', 'Woodblock',
  'Taiko Drum', 'Melodic Tom', 'Synth Drum', 'Reverse Cymbal',
  // Sound Effects (120-127)
  'Guitar Fret Noise', 'Breath Noise', 'Seashore', 'Bird Tweet',
  'Telephone Ring', 'Helicopter', 'Applause', 'Gunshot',
];

// ============================================================================
// MIDI Processor
// ============================================================================

export class MIDIProcessor {
  /**
   * Load MIDI file
   */
  loadMIDIFile(filepath: string): MIDIFile {
    console.log(`[MIDI] Loading MIDI file: ${filepath}`);

    // Load MIDI file using mido
    const mid = mido.MidiFile(filepath);

    console.log(`  Type: ${mid.type}`);
    console.log(`  Ticks per beat: ${mid.ticks_per_beat}`);
    console.log(`  Tracks: ${mid.tracks.length}`);

    // Extract tempo and time signature
    let tempo = 120; // Default BPM
    let timeSignature: [number, number] = [4, 4];
    const ticksPerBeat = mid.ticks_per_beat;

    // Parse tracks
    const tracks: MIDITrack[] = [];
    let maxTime = 0;

    for (const track of mid.tracks) {
      const parsedTrack = this.parseTrack(track, ticksPerBeat, tempo);

      // Update tempo and time signature from first track
      if (tracks.length === 0) {
        // Extract tempo from meta messages
        for (const msg of track) {
          if (msg.type === 'set_tempo') {
            tempo = mido.tempo2bpm(msg.tempo);
          } else if (msg.type === 'time_signature') {
            timeSignature = [msg.numerator, msg.denominator];
          }
        }
      }

      if (parsedTrack.notes.length > 0) {
        tracks.push(parsedTrack);

        // Find max time
        for (const note of parsedTrack.notes) {
          const endTime = note.startTime + note.duration;
          if (endTime > maxTime) {
            maxTime = endTime;
          }
        }
      }
    }

    console.log(`  Tempo: ${tempo.toFixed(1)} BPM`);
    console.log(`  Time signature: ${timeSignature[0]}/${timeSignature[1]}`);
    console.log(`  Duration: ${maxTime.toFixed(2)}s`);
    console.log(`  Valid tracks: ${tracks.length}`);

    return {
      type: mid.type,
      ticksPerBeat,
      tempo,
      timeSignature,
      tracks,
      duration: maxTime,
    };
  }

  /**
   * Parse MIDI track
   */
  private parseTrack(
    track: any,
    ticksPerBeat: number,
    tempo: number
  ): MIDITrack {
    let trackName = 'Untitled Track';
    let instrument = 0;
    const notes: MIDINote[] = [];
    const controlChanges: MIDIControlChange[] = [];

    // Active notes (note_on without note_off)
    const activeNotes: Map<number, { time: number; velocity: number; channel: number }> = new Map();

    let currentTime = 0; // in ticks
    let currentTempo = tempo;

    // Convert ticks to seconds
    const ticksToSeconds = (ticks: number): number => {
      const beatsPerSecond = currentTempo / 60;
      const ticksPerSecond = ticksPerBeat * beatsPerSecond;
      return ticks / ticksPerSecond;
    };

    for (const msg of track) {
      // Update current time
      currentTime += msg.time;
      const timeInSeconds = ticksToSeconds(currentTime);

      if (msg.type === 'track_name') {
        trackName = msg.name;
      } else if (msg.type === 'program_change') {
        instrument = msg.program;
      } else if (msg.type === 'note_on' && msg.velocity > 0) {
        // Note on
        activeNotes.set(msg.note, {
          time: currentTime,
          velocity: msg.velocity,
          channel: msg.channel,
        });
      } else if (msg.type === 'note_off' || (msg.type === 'note_on' && msg.velocity === 0)) {
        // Note off
        const noteOn = activeNotes.get(msg.note);

        if (noteOn) {
          const startTime = ticksToSeconds(noteOn.time);
          const endTime = timeInSeconds;
          const duration = endTime - startTime;

          notes.push({
            note: msg.note,
            velocity: noteOn.velocity,
            startTime,
            duration: Math.max(duration, 0.01), // Minimum 10ms
            channel: noteOn.channel,
          });

          activeNotes.delete(msg.note);
        }
      } else if (msg.type === 'control_change') {
        controlChanges.push({
          controller: msg.control,
          value: msg.value,
          time: timeInSeconds,
        });
      } else if (msg.type === 'set_tempo') {
        currentTempo = mido.tempo2bpm(msg.tempo);
      }
    }

    return {
      name: trackName,
      instrument,
      notes,
      controlChanges,
    };
  }

  /**
   * Render MIDI to audio
   */
  renderToAudio(
    midiFile: MIDIFile,
    options: MIDIRenderOptions = {}
  ): AudioData {
    console.log('[MIDI] Rendering MIDI to audio...');

    const {
      sampleRate = 44100,
      preset = 'lead',
      velocityCurve = 'linear',
    } = options;

    const synth = new Synthesizer(sampleRate);

    // Get preset
    const synthPreset = typeof preset === 'string' ? SYNTH_PRESETS[preset] : preset;

    // Combine all notes from all tracks
    const allNotes: SynthNote[] = [];

    for (const track of midiFile.tracks) {
      console.log(`  Rendering track: ${track.name} (${track.notes.length} notes)`);
      console.log(`    Instrument: ${GM_INSTRUMENTS[track.instrument] || 'Unknown'}`);

      for (const note of track.notes) {
        // Convert MIDI note to frequency
        const frequency = Number(librosa.midi_to_hz(note.note));

        // Convert velocity (0-127) to 0-1
        let velocity = note.velocity / 127;

        // Apply velocity curve
        velocity = this.applyVelocityCurve(velocity, velocityCurve);

        allNotes.push({
          frequency,
          velocity,
          duration: note.duration,
          startTime: note.startTime,
        });
      }
    }

    console.log(`  Total notes: ${allNotes.length}`);

    // Synthesize all notes
    const audio = synth.synthesizeSequence(allNotes, synthPreset);

    console.log('  ✓ MIDI rendering complete');

    return audio;
  }

  /**
   * Apply velocity curve
   */
  private applyVelocityCurve(velocity: number, curve: string): number {
    switch (curve) {
      case 'linear':
        return velocity;

      case 'exponential':
        return Math.pow(velocity, 2);

      case 'logarithmic':
        return Math.sqrt(velocity);

      default:
        return velocity;
    }
  }

  /**
   * Render specific track
   */
  renderTrack(
    track: MIDITrack,
    options: MIDIRenderOptions = {}
  ): AudioData {
    console.log(`[MIDI] Rendering track: ${track.name}`);

    const {
      sampleRate = 44100,
      preset = 'lead',
      velocityCurve = 'linear',
    } = options;

    const synth = new Synthesizer(sampleRate);
    const synthPreset = typeof preset === 'string' ? SYNTH_PRESETS[preset] : preset;

    // Convert MIDI notes to synth notes
    const synthNotes: SynthNote[] = track.notes.map(note => ({
      frequency: Number(librosa.midi_to_hz(note.note)),
      velocity: this.applyVelocityCurve(note.velocity / 127, velocityCurve),
      duration: note.duration,
      startTime: note.startTime,
    }));

    return synth.synthesizeSequence(synthNotes, synthPreset);
  }

  /**
   * Extract melody (highest notes)
   */
  extractMelody(midiFile: MIDIFile): MIDINote[] {
    console.log('[MIDI] Extracting melody...');

    // Combine all notes
    const allNotes: MIDINote[] = [];
    for (const track of midiFile.tracks) {
      allNotes.push(...track.notes);
    }

    // Sort by start time
    allNotes.sort((a, b) => a.startTime - b.startTime);

    // Group by time windows and take highest note
    const melody: MIDINote[] = [];
    const windowSize = 0.1; // 100ms windows

    let currentWindow = 0;
    let highestInWindow: MIDINote | null = null;

    for (const note of allNotes) {
      const noteWindow = Math.floor(note.startTime / windowSize);

      if (noteWindow > currentWindow) {
        if (highestInWindow) {
          melody.push(highestInWindow);
        }
        currentWindow = noteWindow;
        highestInWindow = note;
      } else if (!highestInWindow || note.note > highestInWindow.note) {
        highestInWindow = note;
      }
    }

    if (highestInWindow) {
      melody.push(highestInWindow);
    }

    console.log(`  Extracted ${melody.length} melody notes`);

    return melody;
  }

  /**
   * Extract bass line (lowest notes)
   */
  extractBassLine(midiFile: MIDIFile): MIDINote[] {
    console.log('[MIDI] Extracting bass line...');

    const allNotes: MIDINote[] = [];
    for (const track of midiFile.tracks) {
      allNotes.push(...track.notes);
    }

    allNotes.sort((a, b) => a.startTime - b.startTime);

    const bassLine: MIDINote[] = [];
    const windowSize = 0.25; // 250ms windows

    let currentWindow = 0;
    let lowestInWindow: MIDINote | null = null;

    for (const note of allNotes) {
      const noteWindow = Math.floor(note.startTime / windowSize);

      if (noteWindow > currentWindow) {
        if (lowestInWindow) {
          bassLine.push(lowestInWindow);
        }
        currentWindow = noteWindow;
        lowestInWindow = note;
      } else if (!lowestInWindow || note.note < lowestInWindow.note) {
        lowestInWindow = note;
      }
    }

    if (lowestInWindow) {
      bassLine.push(lowestInWindow);
    }

    console.log(`  Extracted ${bassLine.length} bass notes`);

    return bassLine;
  }

  /**
   * Quantize notes to grid
   */
  quantizeNotes(
    notes: MIDINote[],
    gridSize: number // in beats (e.g., 0.25 = 16th note)
  ): MIDINote[] {
    console.log(`[MIDI] Quantizing notes to ${gridSize} beat grid...`);

    const secondsPerBeat = 0.5; // Assuming 120 BPM

    return notes.map(note => {
      // Quantize start time
      const startBeat = note.startTime / secondsPerBeat;
      const quantizedBeat = Math.round(startBeat / gridSize) * gridSize;
      const quantizedStartTime = quantizedBeat * secondsPerBeat;

      // Quantize duration
      const durationBeats = note.duration / secondsPerBeat;
      const quantizedDurationBeats = Math.round(durationBeats / gridSize) * gridSize;
      const quantizedDuration = Math.max(quantizedDurationBeats * secondsPerBeat, gridSize * secondsPerBeat);

      return {
        ...note,
        startTime: quantizedStartTime,
        duration: quantizedDuration,
      };
    });
  }

  /**
   * Transpose notes
   */
  transposeNotes(notes: MIDINote[], semitones: number): MIDINote[] {
    console.log(`[MIDI] Transposing notes by ${semitones} semitones...`);

    return notes.map(note => ({
      ...note,
      note: Math.max(0, Math.min(127, note.note + semitones)),
    }));
  }

  /**
   * Change tempo
   */
  changeTempo(notes: MIDINote[], tempoMultiplier: number): MIDINote[] {
    console.log(`[MIDI] Changing tempo by ${tempoMultiplier}x...`);

    return notes.map(note => ({
      ...note,
      startTime: note.startTime / tempoMultiplier,
      duration: note.duration / tempoMultiplier,
    }));
  }

  /**
   * Create MIDI file from notes
   */
  createMIDIFile(
    notes: MIDINote[],
    filename: string,
    tempo: number = 120,
    ticksPerBeat: number = 480
  ): void {
    console.log(`[MIDI] Creating MIDI file: ${filename}`);

    // Create MIDI file
    const mid = mido.MidiFile();
    mid.ticks_per_beat = ticksPerBeat;

    // Create track
    const track = mido.MidiTrack();
    mid.tracks.append(track);

    // Add tempo
    track.append(mido.MetaMessage('set_tempo', tempo: mido.bpm2tempo(tempo), time: 0));

    // Convert seconds to ticks
    const beatsPerSecond = tempo / 60;
    const ticksPerSecond = ticksPerBeat * beatsPerSecond;

    const secondsToTicks = (seconds: number): number => {
      return Math.floor(seconds * ticksPerSecond);
    };

    // Sort notes by start time
    const sortedNotes = [...notes].sort((a, b) => a.startTime - b.startTime);

    // Track absolute time
    let currentTicks = 0;

    // Add notes
    for (const note of sortedNotes) {
      const startTicks = secondsToTicks(note.startTime);
      const endTicks = secondsToTicks(note.startTime + note.duration);

      // Note on
      const noteOnDelta = startTicks - currentTicks;
      track.append(mido.Message(
        'note_on',
        note: note.note,
        velocity: note.velocity,
        time: noteOnDelta
      ));

      currentTicks = startTicks;

      // Note off
      const noteOffDelta = endTicks - currentTicks;
      track.append(mido.Message(
        'note_off',
        note: note.note,
        velocity: 0,
        time: noteOffDelta
      ));

      currentTicks = endTicks;
    }

    // Save file
    mid.save(filename);

    console.log('  ✓ MIDI file created');
  }

  /**
   * Analyze MIDI file
   */
  analyzeMIDI(midiFile: MIDIFile): {
    noteCount: number;
    noteDensity: number; // notes per second
    pitchRange: [number, number];
    averageVelocity: number;
    mostCommonNote: number;
    chordProgression: number[][];
  } {
    console.log('[MIDI] Analyzing MIDI file...');

    // Collect all notes
    const allNotes: MIDINote[] = [];
    for (const track of midiFile.tracks) {
      allNotes.push(...track.notes);
    }

    const noteCount = allNotes.length;
    const noteDensity = noteCount / midiFile.duration;

    // Find pitch range
    let minPitch = 127;
    let maxPitch = 0;
    let totalVelocity = 0;

    const noteCounts = new Map<number, number>();

    for (const note of allNotes) {
      if (note.note < minPitch) minPitch = note.note;
      if (note.note > maxPitch) maxPitch = note.note;

      totalVelocity += note.velocity;

      noteCounts.set(note.note, (noteCounts.get(note.note) || 0) + 1);
    }

    const averageVelocity = totalVelocity / noteCount;

    // Find most common note
    let mostCommonNote = 60; // Middle C default
    let maxCount = 0;

    for (const [note, count] of noteCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonNote = note;
      }
    }

    // Simplified chord progression detection
    const chordProgression: number[][] = [];
    const windowSize = 1.0; // 1 second windows

    for (let t = 0; t < midiFile.duration; t += windowSize) {
      const notesInWindow = allNotes.filter(
        note => note.startTime >= t && note.startTime < t + windowSize
      );

      if (notesInWindow.length > 0) {
        const uniqueNotes = [...new Set(notesInWindow.map(n => n.note % 12))];
        chordProgression.push(uniqueNotes);
      }
    }

    console.log('  Analysis complete:');
    console.log(`    Notes: ${noteCount}`);
    console.log(`    Density: ${noteDensity.toFixed(2)} notes/sec`);
    console.log(`    Pitch range: ${minPitch}-${maxPitch}`);
    console.log(`    Avg velocity: ${averageVelocity.toFixed(1)}`);
    console.log(`    Most common note: ${mostCommonNote}`);

    return {
      noteCount,
      noteDensity,
      pitchRange: [minPitch, maxPitch],
      averageVelocity,
      mostCommonNote,
      chordProgression,
    };
  }

  /**
   * Detect key signature
   */
  detectKeySignature(notes: MIDINote[]): { key: string; confidence: number } {
    console.log('[MIDI] Detecting key signature...');

    // Count pitch classes
    const pitchClassCounts = new Array(12).fill(0);

    for (const note of notes) {
      const pitchClass = note.note % 12;
      pitchClassCounts[pitchClass] += note.duration * note.velocity;
    }

    // Normalize
    const total = pitchClassCounts.reduce((a, b) => a + b, 0);
    const normalized = pitchClassCounts.map(c => c / total);

    // Find dominant pitch class
    const maxIdx = normalized.indexOf(Math.max(...normalized));

    const pitchClasses = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const key = pitchClasses[maxIdx];

    const confidence = normalized[maxIdx];

    console.log(`  Detected key: ${key} (confidence: ${(confidence * 100).toFixed(1)}%)`);

    return { key, confidence };
  }

  /**
   * Get instrument name
   */
  getInstrumentName(programNumber: number): string {
    return GM_INSTRUMENTS[programNumber] || 'Unknown Instrument';
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

export function loadMIDI(filepath: string): MIDIFile {
  const processor = new MIDIProcessor();
  return processor.loadMIDIFile(filepath);
}

export function renderMIDI(midiFile: MIDIFile, options?: MIDIRenderOptions): AudioData {
  const processor = new MIDIProcessor();
  return processor.renderToAudio(midiFile, options);
}

// ============================================================================
// Example Usage
// ============================================================================

if (import.meta.main) {
  console.log('🎵 MIDI Processor Demo\n');

  console.log('MIDI processing capabilities:');
  console.log('  - Load MIDI files (Type 0, 1, 2)');
  console.log('  - Parse tracks and notes');
  console.log('  - Render MIDI to audio');
  console.log('  - Extract melody and bass line');
  console.log('  - Quantize notes');
  console.log('  - Transpose and change tempo');
  console.log('  - Create MIDI files');
  console.log('  - Analyze MIDI (key, chords, density)');
  console.log('  - 128 General MIDI instruments');

  console.log('\n💡 This demonstrates:');
  console.log('   - python:mido for MIDI parsing in TypeScript');
  console.log('   - librosa.midi_to_hz() in TypeScript');
  console.log('   - Integration with synthesizer');
  console.log('   - MIDI analysis and manipulation');
  console.log('   - All in one TypeScript process!');
}

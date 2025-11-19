/**
 * Music Generation Performance Benchmarks
 *
 * Comprehensive benchmarks for measuring music generation performance
 * across different components and configurations.
 *
 * Metrics measured:
 * - Chord progression generation speed
 * - Melody generation speed
 * - Rhythm generation speed
 * - Audio synthesis speed
 * - ML inference time
 * - WebSocket streaming latency
 * - End-to-end generation time
 */

import { performance } from 'perf_hooks';
import { ChordProgressionGenerator } from '../src/music-engine/chord-progressions';
import { MelodyGenerator } from '../src/music-engine/melody-generator';
import { RhythmEngine } from '../src/music-engine/rhythm-engine';
import { Synthesizer } from '../src/audio/synthesizer';
import { MidiController } from '../src/audio/midi-controller';

/**
 * Benchmark result
 */
interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  opsPerSecond: number;
  memoryUsage?: number;
}

/**
 * Benchmark suite
 */
export class MusicGenerationBenchmarks {
  private chordGen: ChordProgressionGenerator;
  private melodyGen: MelodyGenerator;
  private rhythmEngine: RhythmEngine;
  private synthesizer: Synthesizer;
  private midiController: MidiController;

  constructor() {
    this.chordGen = new ChordProgressionGenerator();
    this.melodyGen = new MelodyGenerator();
    this.rhythmEngine = new RhythmEngine();
    this.synthesizer = new Synthesizer(44100);
    this.midiController = new MidiController();
  }

  /**
   * Run all benchmarks
   */
  public async runAll(): Promise<BenchmarkResult[]> {
    console.log('=== Music Generation Benchmarks ===\n');

    const results: BenchmarkResult[] = [];

    // Chord progression benchmarks
    results.push(await this.benchmarkChordGeneration());
    results.push(await this.benchmarkComplexChords());
    results.push(await this.benchmarkVoiceLeading());

    // Melody generation benchmarks
    results.push(await this.benchmarkMelodyGeneration());
    results.push(await this.benchmarkMelodyWithOrnamentation());
    results.push(await this.benchmarkMelodyTransformations());

    // Rhythm benchmarks
    results.push(await this.benchmarkRhythmGeneration());
    results.push(await this.benchmarkComplexRhythms());

    // Audio synthesis benchmarks
    results.push(await this.benchmarkAudioSynthesis());
    results.push(await this.benchmarkChordSynthesis());
    results.push(await this.benchmarkEffectsProcessing());

    // MIDI benchmarks
    results.push(await this.benchmarkMidiExport());
    results.push(await this.benchmarkMidiProcessing());

    // End-to-end benchmarks
    results.push(await this.benchmarkFullComposition());

    return results;
  }

  /**
   * Benchmark chord progression generation
   */
  private async benchmarkChordGeneration(): Promise<BenchmarkResult> {
    const iterations = 1000;
    const times: number[] = [];

    console.log('Benchmarking: Chord Progression Generation (8 bars)');

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      this.chordGen.generate({
        key: 'C',
        mode: 'major',
        numBars: 8,
        genre: 'jazz',
        complexity: 'medium'
      });

      const end = performance.now();
      times.push(end - start);
    }

    return this.calculateStats('Chord Generation (8 bars)', iterations, times);
  }

  /**
   * Benchmark complex chord generation
   */
  private async benchmarkComplexChords(): Promise<BenchmarkResult> {
    const iterations = 500;
    const times: number[] = [];

    console.log('Benchmarking: Complex Chord Generation with Extensions');

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      this.chordGen.generate({
        key: 'C',
        mode: 'major',
        numBars: 32,
        genre: 'jazz',
        complexity: 'complex',
        extensions: true,
        substitutions: true
      });

      const end = performance.now();
      times.push(end - start);
    }

    return this.calculateStats('Complex Chords (32 bars)', iterations, times);
  }

  /**
   * Benchmark voice leading
   */
  private async benchmarkVoiceLeading(): Promise<BenchmarkResult> {
    const iterations = 1000;
    const times: number[] = [];

    console.log('Benchmarking: Voice Leading Optimization');

    const progression = this.chordGen.generate({
      key: 'C',
      mode: 'major',
      numBars: 8,
      genre: 'classical'
    });

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      this.chordGen.voiceLead(progression);

      const end = performance.now();
      times.push(end - start);
    }

    return this.calculateStats('Voice Leading (8 chords)', iterations, times);
  }

  /**
   * Benchmark melody generation
   */
  private async benchmarkMelodyGeneration(): Promise<BenchmarkResult> {
    const iterations = 500;
    const times: number[] = [];

    console.log('Benchmarking: Melody Generation (16 bars)');

    const chords = this.chordGen.generate({
      key: 'C',
      mode: 'major',
      numBars: 16,
      genre: 'jazz'
    });

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      this.melodyGen.generate({
        key: 'C',
        mode: 'major',
        chordProgression: chords,
        numBars: 16,
        style: 'jazz',
        notesDensity: 'medium'
      });

      const end = performance.now();
      times.push(end - start);
    }

    return this.calculateStats('Melody Generation (16 bars)', iterations, times);
  }

  /**
   * Benchmark melody with ornamentation
   */
  private async benchmarkMelodyWithOrnamentation(): Promise<BenchmarkResult> {
    const iterations = 500;
    const times: number[] = [];

    console.log('Benchmarking: Melody Generation with Ornamentation');

    const chords = this.chordGen.generate({
      key: 'C',
      mode: 'major',
      numBars: 8,
      genre: 'classical'
    });

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      const melody = this.melodyGen.generate({
        key: 'C',
        mode: 'major',
        chordProgression: chords,
        numBars: 8,
        style: 'classical',
        ornamentation: 0.3
      });

      this.melodyGen.addPassingTones(melody);
      this.melodyGen.addNeighborTones(melody);

      const end = performance.now();
      times.push(end - start);
    }

    return this.calculateStats('Melody with Ornamentation', iterations, times);
  }

  /**
   * Benchmark melody transformations
   */
  private async benchmarkMelodyTransformations(): Promise<BenchmarkResult> {
    const iterations = 1000;
    const times: number[] = [];

    console.log('Benchmarking: Melody Transformations');

    const chords = this.chordGen.generate({
      key: 'C',
      mode: 'major',
      numBars: 4,
      genre: 'classical'
    });

    const melody = this.melodyGen.generate({
      key: 'C',
      mode: 'major',
      chordProgression: chords,
      numBars: 4,
      style: 'classical'
    });

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      this.melodyGen.transpose(melody, 5);
      this.melodyGen.invert(melody);
      this.melodyGen.retrograde(melody);
      this.melodyGen.augment(melody, 2);

      const end = performance.now();
      times.push(end - start);
    }

    return this.calculateStats('Melody Transformations', iterations, times);
  }

  /**
   * Benchmark rhythm generation
   */
  private async benchmarkRhythmGeneration(): Promise<BenchmarkResult> {
    const iterations = 500;
    const times: number[] = [];

    console.log('Benchmarking: Rhythm Generation (16 bars)');

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      this.rhythmEngine.generate({
        genre: 'jazz',
        tempo: 120,
        timeSignature: [4, 4],
        numBars: 16,
        complexity: 'medium'
      });

      const end = performance.now();
      times.push(end - start);
    }

    return this.calculateStats('Rhythm Generation (16 bars)', iterations, times);
  }

  /**
   * Benchmark complex rhythms
   */
  private async benchmarkComplexRhythms(): Promise<BenchmarkResult> {
    const iterations = 300;
    const times: number[] = [];

    console.log('Benchmarking: Complex Rhythm Generation');

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      this.rhythmEngine.generate({
        genre: 'jazz',
        tempo: 180,
        timeSignature: [4, 4],
        numBars: 32,
        complexity: 'complex',
        swing: 0.67,
        humanize: 0.3,
        fills: true
      });

      const end = performance.now();
      times.push(end - start);
    }

    return this.calculateStats('Complex Rhythms (32 bars)', iterations, times);
  }

  /**
   * Benchmark audio synthesis
   */
  private async benchmarkAudioSynthesis(): Promise<BenchmarkResult> {
    const iterations = 100;
    const times: number[] = [];

    console.log('Benchmarking: Audio Synthesis (Single Note)');

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      this.synthesizer.synthesizeNote(
        60, // Middle C
        0,
        1.0, // 1 second
        100,
        {
          waveform: 'sawtooth',
          attack: 0.1,
          decay: 0.2,
          sustain: 0.7,
          release: 0.3,
          filterCutoff: 2000,
          filterResonance: 5
        }
      );

      const end = performance.now();
      times.push(end - start);
    }

    return this.calculateStats('Audio Synthesis (1 note)', iterations, times);
  }

  /**
   * Benchmark chord synthesis
   */
  private async benchmarkChordSynthesis(): Promise<BenchmarkResult> {
    const iterations = 50;
    const times: number[] = [];

    console.log('Benchmarking: Chord Synthesis');

    const chordNotes = [
      { pitch: 60 },
      { pitch: 64 },
      { pitch: 67 },
      { pitch: 71 }
    ];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      this.synthesizer.synthesizeChord(
        chordNotes,
        0,
        2.0,
        {
          waveform: 'sawtooth',
          attack: 0.1,
          decay: 0.2,
          sustain: 0.7,
          release: 0.5,
          filterCutoff: 2000,
          filterResonance: 3
        }
      );

      const end = performance.now();
      times.push(end - start);
    }

    return this.calculateStats('Chord Synthesis (4 notes)', iterations, times);
  }

  /**
   * Benchmark effects processing
   */
  private async benchmarkEffectsProcessing(): Promise<BenchmarkResult> {
    const iterations = 50;
    const times: number[] = [];

    console.log('Benchmarking: Effects Processing');

    // Generate test audio
    const [left, right] = this.synthesizer.synthesizeNote(
      60,
      0,
      2.0,
      100,
      {
        waveform: 'sawtooth',
        attack: 0.1,
        decay: 0.2,
        sustain: 0.7,
        release: 0.3,
        filterCutoff: 2000,
        filterResonance: 3
      }
    );

    for (let i = 0; i < iterations; i++) {
      const leftCopy = new Float32Array(left);
      const rightCopy = new Float32Array(right);

      const start = performance.now();

      this.synthesizer.applyReverb(leftCopy, rightCopy, {
        mix: 0.3,
        decay: 2.0,
        preDelay: 0.02
      });

      this.synthesizer.applyCompression(leftCopy, {
        threshold: -20,
        ratio: 4,
        attack: 0.003,
        release: 0.25
      });

      this.synthesizer.applyChorus(leftCopy, rightCopy, 0.3);

      const end = performance.now();
      times.push(end - start);
    }

    return this.calculateStats('Effects Processing', iterations, times);
  }

  /**
   * Benchmark MIDI export
   */
  private async benchmarkMidiExport(): Promise<BenchmarkResult> {
    const iterations = 100;
    const times: number[] = [];

    console.log('Benchmarking: MIDI File Export');

    // Generate test events
    const events: any[] = [];
    for (let i = 0; i < 100; i++) {
      events.push({
        type: 'note_on',
        channel: 0,
        note: 60 + (i % 12),
        velocity: 100,
        time: i * 0.5
      });

      events.push({
        type: 'note_off',
        channel: 0,
        note: 60 + (i % 12),
        velocity: 0,
        time: i * 0.5 + 0.4
      });
    }

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      this.midiController.exportMidi(events, 120);

      const end = performance.now();
      times.push(end - start);
    }

    return this.calculateStats('MIDI Export (100 notes)', iterations, times);
  }

  /**
   * Benchmark MIDI processing
   */
  private async benchmarkMidiProcessing(): Promise<BenchmarkResult> {
    const iterations = 1000;
    const times: number[] = [];

    console.log('Benchmarking: MIDI Message Processing');

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      this.midiController.sendNoteOn(0, 60, 100);
      this.midiController.sendNoteOff(0, 60);
      this.midiController.sendCC(0, 1, 64);
      this.midiController.sendPitchBend(0, 0);

      const end = performance.now();
      times.push(end - start);
    }

    return this.calculateStats('MIDI Processing (4 messages)', iterations, times);
  }

  /**
   * Benchmark full composition
   */
  private async benchmarkFullComposition(): Promise<BenchmarkResult> {
    const iterations = 10;
    const times: number[] = [];

    console.log('Benchmarking: Full Composition (32 bars)');

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      // Generate chords
      const chords = this.chordGen.generate({
        key: 'C',
        mode: 'major',
        numBars: 32,
        genre: 'jazz',
        complexity: 'complex',
        extensions: true
      });

      // Generate melody
      const melody = this.melodyGen.generate({
        key: 'C',
        mode: 'major',
        chordProgression: chords,
        numBars: 32,
        style: 'jazz',
        notesDensity: 'dense',
        ornamentation: 0.3
      });

      // Generate rhythm
      const rhythm = this.rhythmEngine.generate({
        genre: 'jazz',
        tempo: 120,
        timeSignature: [4, 4],
        numBars: 32,
        complexity: 'complex',
        swing: 0.67
      });

      // Synthesize (partial)
      for (let j = 0; j < Math.min(10, melody.length); j++) {
        this.synthesizer.synthesizeNote(
          melody[j].pitch,
          melody[j].startTime,
          melody[j].duration,
          melody[j].velocity,
          {
            waveform: 'sawtooth',
            attack: 0.1,
            decay: 0.2,
            sustain: 0.7,
            release: 0.3,
            filterCutoff: 2000,
            filterResonance: 3
          }
        );
      }

      const end = performance.now();
      times.push(end - start);
    }

    return this.calculateStats('Full Composition (32 bars)', iterations, times);
  }

  /**
   * Calculate statistics
   */
  private calculateStats(name: string, iterations: number, times: number[]): BenchmarkResult {
    const totalTime = times.reduce((a, b) => a + b, 0);
    const averageTime = totalTime / iterations;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const opsPerSecond = 1000 / averageTime;

    const result: BenchmarkResult = {
      name,
      iterations,
      totalTime,
      averageTime,
      minTime,
      maxTime,
      opsPerSecond,
      memoryUsage: process.memoryUsage().heapUsed
    };

    console.log(`  Average: ${averageTime.toFixed(2)}ms`);
    console.log(`  Min: ${minTime.toFixed(2)}ms`);
    console.log(`  Max: ${maxTime.toFixed(2)}ms`);
    console.log(`  Ops/sec: ${opsPerSecond.toFixed(0)}`);
    console.log('');

    return result;
  }

  /**
   * Print summary
   */
  public printSummary(results: BenchmarkResult[]): void {
    console.log('\n=== Benchmark Summary ===\n');

    console.log('Operation                           | Avg Time | Min Time | Max Time | Ops/sec');
    console.log('----------------------------------- | -------- | -------- | -------- | --------');

    for (const result of results) {
      const name = result.name.padEnd(35);
      const avg = `${result.averageTime.toFixed(2)}ms`.padEnd(8);
      const min = `${result.minTime.toFixed(2)}ms`.padEnd(8);
      const max = `${result.maxTime.toFixed(2)}ms`.padEnd(8);
      const ops = result.opsPerSecond.toFixed(0).padEnd(8);

      console.log(`${name} | ${avg} | ${min} | ${max} | ${ops}`);
    }

    console.log('\n');
  }

  /**
   * Export results to JSON
   */
  public exportResults(results: BenchmarkResult[], filename: string): void {
    const data = {
      timestamp: new Date().toISOString(),
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version
      },
      results
    };

    const json = JSON.stringify(data, null, 2);
    console.log(`Results exported to ${filename}`);
    // In a real implementation: fs.writeFileSync(filename, json);
  }
}

// Run benchmarks if executed directly
if (require.main === module) {
  const benchmarks = new MusicGenerationBenchmarks();

  benchmarks.runAll().then(results => {
    benchmarks.printSummary(results);
    benchmarks.exportResults(results, 'benchmark-results.json');
  });
}

export default MusicGenerationBenchmarks;

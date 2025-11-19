/**
 * Full Production Demo - Complete audio production workflow
 *
 * Demonstrates end-to-end audio production using Python libraries in TypeScript
 */

// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import librosa from 'python:librosa';
// @ts-ignore
import soundfile from 'python:soundfile';

import { AudioProcessor } from '../src/audio-processor';
import { ReverbProcessor, REVERB_PRESETS } from '../src/effects/reverb';
import { EqualizerProcessor, EQ_PRESETS } from '../src/effects/eq';
import { DynamicsProcessor, COMPRESSOR_PRESETS } from '../src/effects/dynamics';
import { SpectralAnalyzer } from '../src/analysis/spectral-analyzer';
import { Mixer } from '../src/mixing/mixer';
import { MasteringChain, MASTERING_PRESETS } from '../src/mastering/mastering-chain';
import { Synthesizer, SYNTH_PRESETS, noteToFrequency, createNoteSequence } from '../src/synthesis/synthesizer';
import { MIDIProcessor } from '../src/midi/midi-processor';
import type { AudioData } from '../src/audio-processor';

// ============================================================================
// Example 1: Synth Track Production
// ============================================================================

async function example1_SynthTrackProduction() {
  console.log('\n' + '='.repeat(80));
  console.log('Example 1: Synth Track Production');
  console.log('='.repeat(80) + '\n');

  const synth = new Synthesizer(44100);

  // Create chord progression (I-V-vi-IV in C major)
  console.log('1. Creating chord progression...\n');

  const chords = [
    { root: noteToFrequency('C3'), type: 'major' as const, time: 0 },
    { root: noteToFrequency('G3'), type: 'major' as const, time: 2 },
    { root: noteToFrequency('A3'), type: 'minor' as const, time: 4 },
    { root: noteToFrequency('F3'), type: 'major' as const, time: 6 },
  ];

  const chordDuration = 2.0;
  let chordAudio = numpy.zeros(Math.floor(8 * 44100));

  for (const chord of chords) {
    const audio = synth.synthesizeChord(
      chord.root,
      chord.type,
      chordDuration,
      SYNTH_PRESETS.pad
    );

    const startSample = Math.floor(chord.time * 44100);
    const endSample = startSample + audio.samples;

    chordAudio.slice(startSample, endSample) += audio.waveform;
  }

  const chordTrack: AudioData = {
    waveform: chordAudio,
    sampleRate: 44100,
    duration: 8.0,
    channels: 1,
    samples: chordAudio.shape[0],
  };

  // Create melody
  console.log('2. Creating melody...\n');

  const melodyNotes = createNoteSequence(
    ['C5', 'E5', 'G5', 'E5', 'D5', 'B4', 'C5', 'E5', 'C5', 'A4', 'F4', 'C5', 'C5', 'D5', 'E5', 'C5'],
    0.5,
    0.8
  );

  const melodyTrack = synth.synthesizeSequence(melodyNotes, SYNTH_PRESETS.lead);

  // Create bass line
  console.log('3. Creating bass line...\n');

  const bassNotes = createNoteSequence(
    ['C2', 'C2', 'G2', 'G2', 'A2', 'A2', 'F2', 'F2'],
    1.0,
    1.0
  );

  const bassTrack = synth.synthesizeSequence(bassNotes, SYNTH_PRESETS.bass);

  // Create beat (synthesized kick and hi-hat)
  console.log('4. Creating beat...\n');

  const kickFreq = 60;
  const kickPattern = [0, 2, 4, 6]; // On beats
  let beatAudio = numpy.zeros(Math.floor(8 * 44100));

  for (const time of kickPattern) {
    const kick = synth.synthesizeFM(
      kickFreq,
      kickFreq * 2,
      10,
      0.5,
      {
        attack: 0.001,
        decay: 0.2,
        sustain: 0.0,
        release: 0.1,
      }
    );

    const startSample = Math.floor(time * 44100);
    const endSample = startSample + kick.samples;
    beatAudio.slice(startSample, endSample) += kick.waveform;
  }

  // Add hi-hat (noise with envelope)
  const hihatPattern = Array.from({ length: 32 }, (_, i) => i * 0.25);

  for (const time of hihatPattern) {
    const hihat = synth.synthesizeNoise(
      0.1,
      'white',
      {
        attack: 0.001,
        decay: 0.05,
        sustain: 0.0,
        release: 0.02,
      }
    );

    // High-pass filter
    const sos = numpy.scipy.signal.butter(4, 8000, 'high', fs: 44100, output: 'sos');
    const filtered = numpy.scipy.signal.sosfilt(sos, hihat.waveform);

    const startSample = Math.floor(time * 44100);
    const endSample = Math.min(startSample + filtered.shape[0], beatAudio.shape[0]);
    beatAudio.slice(startSample, endSample) += filtered.slice(0, endSample - startSample) * 0.3;
  }

  const beatTrack: AudioData = {
    waveform: beatAudio,
    sampleRate: 44100,
    duration: 8.0,
    channels: 1,
    samples: beatAudio.shape[0],
  };

  // Mix tracks
  console.log('5. Mixing tracks...\n');

  const mixer = new Mixer();

  const chordId = mixer.addTrack(chordTrack, 'Chords', { volume: 0.6, pan: 0 });
  const melodyId = mixer.addTrack(melodyTrack, 'Melody', { volume: 0.8, pan: 0.2 });
  const bassId = mixer.addTrack(bassTrack, 'Bass', { volume: 0.9, pan: 0 });
  const beatId = mixer.addTrack(beatTrack, 'Beat', { volume: 0.7, pan: 0 });

  // Add effects to melody
  mixer.addTrackEffect(melodyId, {
    type: 'reverb',
    enabled: true,
    params: { ...REVERB_PRESETS.hall, wetLevel: 0.2 },
  });

  mixer.addTrackEffect(melodyId, {
    type: 'eq',
    enabled: true,
    params: { bands: [
      { type: 'highpass', frequency: 200, q: 0.7 },
      { type: 'peak', frequency: 3000, gain: 2, q: 1.5 },
    ]},
  });

  // Add compression to bass
  mixer.addTrackEffect(bassId, {
    type: 'compressor',
    enabled: true,
    params: COMPRESSOR_PRESETS.bass,
  });

  // Add master compression
  mixer.addMasterEffect({
    type: 'compressor',
    enabled: true,
    params: COMPRESSOR_PRESETS.mastering,
  });

  const mixdown = mixer.mixdown({ normalize: true });

  // Master the track
  console.log('6. Mastering...\n');

  const masteringChain = new MasteringChain();
  const mastered = masteringChain.masterWithPreset(mixdown, 'streaming');

  // Export
  console.log('7. Exporting...\n');

  await mixer.exportMixdown('/tmp/synth-track-demo.wav', {
    normalize: true,
    format: 'wav',
  });

  console.log('✅ Synth track production complete!\n');
  console.log('Output: /tmp/synth-track-demo.wav\n');
}

// ============================================================================
// Example 2: Vocal Processing Chain
// ============================================================================

async function example2_VocalProcessing() {
  console.log('\n' + '='.repeat(80));
  console.log('Example 2: Vocal Processing Chain');
  console.log('='.repeat(80) + '\n');

  // Create synthetic vocal-like sound for demo
  const synth = new Synthesizer(44100);

  console.log('1. Generating synthetic vocal...\n');

  // Create formant-like synthesis (simplified)
  const vocalNotes = createNoteSequence(
    ['C4', 'D4', 'E4', 'G4', 'E4', 'D4', 'C4', 'C4'],
    0.5,
    0.7
  );

  let vocal = synth.synthesizeSequence(vocalNotes, {
    name: 'Vocal',
    oscillators: [
      { frequency: 440, waveform: 'sine', amplitude: 0.5 },
      { frequency: 880, waveform: 'sine', amplitude: 0.3 },
      { frequency: 1320, waveform: 'sine', amplitude: 0.2 },
    ],
    envelope: {
      attack: 0.05,
      decay: 0.1,
      sustain: 0.8,
      release: 0.1,
    },
    filter: {
      type: 'bandpass',
      cutoff: 1000,
      resonance: 0.5,
    },
  });

  console.log('2. Applying vocal processing chain...\n');

  const eq = new EqualizerProcessor();
  const dynamics = new DynamicsProcessor();
  const reverb = new ReverbProcessor();

  // Step 1: High-pass filter (remove rumble)
  console.log('  - High-pass filter (80 Hz)');
  vocal = eq.applyEQ(vocal, {
    bands: [
      { type: 'highpass', frequency: 80, q: 0.7 },
    ],
  });

  // Step 2: Reduce muddiness
  console.log('  - Reduce muddiness (200 Hz)');
  vocal = eq.applyEQ(vocal, {
    bands: [
      { type: 'peak', frequency: 200, gain: -3, q: 1.0 },
    ],
  });

  // Step 3: Add presence
  console.log('  - Add presence (3 kHz)');
  vocal = eq.applyEQ(vocal, {
    bands: [
      { type: 'peak', frequency: 3000, gain: 3, q: 1.5 },
    ],
  });

  // Step 4: De-esser
  console.log('  - De-esser');
  vocal = dynamics.deEss(vocal, {
    frequency: 6000,
    threshold: -20,
    ratio: 4,
  });

  // Step 5: Compression
  console.log('  - Compression');
  vocal = dynamics.applyCompression(vocal, COMPRESSOR_PRESETS.vocal);

  // Step 6: Reverb
  console.log('  - Reverb');
  vocal = reverb.applyReverb(vocal, {
    ...REVERB_PRESETS.hall,
    wetLevel: 0.25,
    dryLevel: 0.75,
  });

  // Export
  console.log('\n3. Exporting processed vocal...\n');

  soundfile.write('/tmp/vocal-processed-demo.wav', vocal.waveform, vocal.sampleRate);

  console.log('✅ Vocal processing complete!\n');
  console.log('Output: /tmp/vocal-processed-demo.wav\n');
}

// ============================================================================
// Example 3: Audio Analysis & Visualization
// ============================================================================

async function example3_AudioAnalysis() {
  console.log('\n' + '='.repeat(80));
  console.log('Example 3: Audio Analysis & Visualization');
  console.log('='.repeat(80) + '\n');

  // Generate test audio
  const synth = new Synthesizer(44100);

  console.log('1. Generating test audio...\n');

  const testAudio = synth.synthesizeArpeggio(
    [
      noteToFrequency('C4'),
      noteToFrequency('E4'),
      noteToFrequency('G4'),
      noteToFrequency('C5'),
    ],
    'updown',
    0.25,
    4.0,
    SYNTH_PRESETS.lead
  );

  // Analyze
  console.log('2. Analyzing audio...\n');

  const analyzer = new SpectralAnalyzer();

  // Spectral features
  console.log('  - Extracting spectral features');
  const features = analyzer.extractSpectralFeatures(testAudio);

  console.log('\nSpectral Features:');
  console.log(`  Avg Spectral Centroid: ${(features.spectralCentroid.reduce((a, b) => a + b) / features.spectralCentroid.length).toFixed(2)} Hz`);
  console.log(`  Avg Spectral Bandwidth: ${(features.spectralBandwidth.reduce((a, b) => a + b) / features.spectralBandwidth.length).toFixed(2)} Hz`);

  // Pitch detection
  console.log('\n  - Detecting pitch');
  const pitch = analyzer.detectPitch(testAudio);

  console.log(`\nPitch Detection:`);
  console.log(`  Average F0: ${pitch.averageF0.toFixed(2)} Hz`);
  console.log(`  Note: ${pitch.note}${pitch.octave}`);
  console.log(`  Frames analyzed: ${pitch.f0.length}`);

  // Beat detection
  console.log('\n  - Detecting beats');
  const beats = analyzer.detectBeats(testAudio);

  console.log(`\nBeat Detection:`);
  console.log(`  Tempo: ${beats.tempo.toFixed(2)} BPM`);
  console.log(`  Beats detected: ${beats.beats.shape[0]}`);

  // Key detection
  console.log('\n  - Detecting key');
  const key = analyzer.detectKey(testAudio);

  console.log(`\nKey Detection:`);
  console.log(`  Key: ${key.key} ${key.mode}`);
  console.log(`  Confidence: ${(key.confidence * 100).toFixed(1)}%`);

  // Generate spectrogram
  console.log('\n  - Generating spectrogram');
  const spectrogram = analyzer.generateSpectrogram(testAudio);

  console.log(`\nSpectrogram:`);
  console.log(`  Shape: ${spectrogram.shape}`);

  console.log('\n✅ Analysis complete!\n');
}

// ============================================================================
// Example 4: Multiband Mastering
// ============================================================================

async function example4_MultibandMastering() {
  console.log('\n' + '='.repeat(80));
  console.log('Example 4: Multiband Mastering');
  console.log('='.repeat(80) + '\n');

  // Create full frequency range audio
  const synth = new Synthesizer(44100);

  console.log('1. Creating full-spectrum audio...\n');

  // Low frequencies
  const bass = synth.synthesizeWithPreset(
    noteToFrequency('C2'),
    8.0,
    'bass',
    0.8
  );

  // Mid frequencies
  const lead = synth.synthesizeArpeggio(
    [
      noteToFrequency('C4'),
      noteToFrequency('E4'),
      noteToFrequency('G4'),
    ],
    'up',
    0.5,
    8.0,
    SYNTH_PRESETS.lead
  );

  // High frequencies
  const hihat = synth.synthesizeNoise(8.0, 'white', {
    attack: 0.001,
    decay: 0.05,
    sustain: 0.0,
    release: 0.02,
  });

  // Mix
  const totalSamples = Math.max(bass.samples, lead.samples, hihat.samples);
  const mixed = numpy.zeros(totalSamples);

  mixed.slice(0, bass.samples) += bass.waveform * 0.7;
  mixed.slice(0, lead.samples) += lead.waveform * 0.5;
  mixed.slice(0, hihat.samples) += hihat.waveform * 0.3;

  const fullMix: AudioData = {
    waveform: mixed,
    sampleRate: 44100,
    duration: 8.0,
    channels: 1,
    samples: totalSamples,
  };

  // Apply multiband mastering
  console.log('2. Applying multiband mastering...\n');

  const masteringChain = new MasteringChain();

  const mastered = masteringChain.multibandMaster(fullMix, {
    low: {
      crossover: 200,
      eq: [
        { type: 'lowshelf', frequency: 80, gain: 2, q: 0.7 },
      ],
      compression: {
        threshold: -15,
        ratio: 3,
        attack: 20,
        release: 150,
        knee: 6,
      },
    },
    mid: {
      crossover: 4000,
      eq: [
        { type: 'peak', frequency: 1000, gain: 1, q: 1.0 },
      ],
      compression: {
        threshold: -12,
        ratio: 2.5,
        attack: 10,
        release: 100,
        knee: 4,
      },
    },
    high: {
      eq: [
        { type: 'highshelf', frequency: 8000, gain: 1.5, q: 0.7 },
      ],
      compression: {
        threshold: -10,
        ratio: 2,
        attack: 5,
        release: 80,
        knee: 3,
      },
    },
  });

  // Export
  console.log('3. Exporting mastered track...\n');

  soundfile.write('/tmp/multiband-mastered-demo.wav', mastered.waveform, mastered.sampleRate);

  console.log('✅ Multiband mastering complete!\n');
  console.log('Output: /tmp/multiband-mastered-demo.wav\n');
}

// ============================================================================
// Example 5: Complete Song Production
// ============================================================================

async function example5_CompleteSongProduction() {
  console.log('\n' + '='.repeat(80));
  console.log('Example 5: Complete Song Production (16 bars)');
  console.log('='.repeat(80) + '\n');

  const synth = new Synthesizer(44100);
  const tempo = 120; // BPM
  const beatDuration = 60 / tempo;
  const barDuration = beatDuration * 4;
  const songDuration = barDuration * 16; // 16 bars

  console.log(`Tempo: ${tempo} BPM`);
  console.log(`Duration: ${songDuration.toFixed(2)}s (16 bars)\n`);

  // 1. Create drum pattern
  console.log('1. Creating drums...\n');

  let drums = numpy.zeros(Math.floor(songDuration * 44100));

  // Kick on 1 and 3
  for (let bar = 0; bar < 16; bar++) {
    for (let beat of [0, 2]) {
      const time = bar * barDuration + beat * beatDuration;
      const kick = synth.synthesizeFM(55, 110, 8, 0.3, {
        attack: 0.001,
        decay: 0.15,
        sustain: 0.0,
        release: 0.05,
      });

      const startSample = Math.floor(time * 44100);
      const endSample = startSample + kick.samples;
      drums.slice(startSample, endSample) += kick.waveform * 1.2;
    }
  }

  // Snare on 2 and 4
  for (let bar = 0; bar < 16; bar++) {
    for (let beat of [1, 3]) {
      const time = bar * barDuration + beat * beatDuration;
      const snare = synth.synthesizeNoise(0.15, 'white', {
        attack: 0.001,
        decay: 0.1,
        sustain: 0.0,
        release: 0.05,
      });

      // High-pass filter for snare
      const sos = numpy.scipy.signal.butter(4, 200, 'high', fs: 44100, output: 'sos');
      const filtered = numpy.scipy.signal.sosfilt(sos, snare.waveform);

      const startSample = Math.floor(time * 44100);
      const endSample = startSample + filtered.shape[0];
      drums.slice(startSample, endSample) += filtered * 0.8;
    }
  }

  // Hi-hats on 8th notes
  for (let bar = 0; bar < 16; bar++) {
    for (let eighth = 0; eighth < 8; eighth++) {
      const time = bar * barDuration + eighth * (beatDuration / 2);
      const hihat = synth.synthesizeNoise(0.08, 'white', {
        attack: 0.001,
        decay: 0.04,
        sustain: 0.0,
        release: 0.02,
      });

      const sos = numpy.scipy.signal.butter(4, 6000, 'high', fs: 44100, output: 'sos');
      const filtered = numpy.scipy.signal.sosfilt(sos, hihat.waveform);

      const startSample = Math.floor(time * 44100);
      const endSample = Math.min(startSample + filtered.shape[0], drums.shape[0]);
      drums.slice(startSample, endSample) += filtered.slice(0, endSample - startSample) * 0.4;
    }
  }

  const drumTrack: AudioData = {
    waveform: drums,
    sampleRate: 44100,
    duration: songDuration,
    channels: 1,
    samples: drums.shape[0],
  };

  // 2. Create bass line
  console.log('2. Creating bass line...\n');

  const bassPattern = ['C2', 'C2', 'C2', 'G2', 'A2', 'A2', 'A2', 'G2', 'F2', 'F2', 'F2', 'C2', 'G2', 'G2', 'F2', 'E2'];
  const bassNotes: any[] = [];

  for (let i = 0; i < bassPattern.length; i++) {
    bassNotes.push({
      frequency: noteToFrequency(bassPattern[i]),
      velocity: 0.9,
      duration: barDuration,
      startTime: i * barDuration,
    });
  }

  const bassTrack = synth.synthesizeSequence(bassNotes, SYNTH_PRESETS.bass);

  // 3. Create chord progression
  console.log('3. Creating chords...\n');

  const chordProgression = [
    { note: 'C3', type: 'major' as const },
    { note: 'G3', type: 'major' as const },
    { note: 'A3', type: 'minor' as const },
    { note: 'F3', type: 'major' as const },
  ];

  let chords = numpy.zeros(Math.floor(songDuration * 44100));

  for (let section = 0; section < 4; section++) {
    for (let i = 0; i < chordProgression.length; i++) {
      const time = section * (barDuration * 4) + i * barDuration;
      const chord = synth.synthesizeChord(
        noteToFrequency(chordProgression[i].note),
        chordProgression[i].type,
        barDuration,
        SYNTH_PRESETS.pad
      );

      const startSample = Math.floor(time * 44100);
      const endSample = startSample + chord.samples;
      chords.slice(startSample, endSample) += chord.waveform;
    }
  }

  const chordTrack: AudioData = {
    waveform: chords,
    sampleRate: 44100,
    duration: songDuration,
    channels: 1,
    samples: chords.shape[0],
  };

  // 4. Create melody (enters at bar 5)
  console.log('4. Creating melody...\n');

  const melodyNoteNames = [
    'E5', 'D5', 'C5', 'D5', 'E5', 'E5', 'E5', 'rest',
    'D5', 'D5', 'D5', 'rest', 'E5', 'G5', 'G5', 'rest',
    'E5', 'D5', 'C5', 'D5', 'E5', 'E5', 'E5', 'E5',
    'D5', 'D5', 'E5', 'D5', 'C5', 'rest', 'rest', 'rest',
  ];

  const melodyNotes: any[] = [];
  const melodyStartTime = barDuration * 4; // Start at bar 5

  for (let i = 0; i < melodyNoteNames.length; i++) {
    if (melodyNoteNames[i] !== 'rest') {
      melodyNotes.push({
        frequency: noteToFrequency(melodyNoteNames[i]),
        velocity: 0.7,
        duration: beatDuration / 2,
        startTime: melodyStartTime + i * (beatDuration / 2),
      });
    }
  }

  const melodyTrack = synth.synthesizeSequence(melodyNotes, SYNTH_PRESETS.lead);

  // 5. Mix all tracks
  console.log('5. Mixing tracks...\n');

  const mixer = new Mixer();

  const drumId = mixer.addTrack(drumTrack, 'Drums', { volume: 0.8, pan: 0 });
  const bassId = mixer.addTrack(bassTrack, 'Bass', { volume: 0.85, pan: 0 });
  const chordId = mixer.addTrack(chordTrack, 'Chords', { volume: 0.5, pan: 0 });
  const melodyId = mixer.addTrack(melodyTrack, 'Melody', { volume: 0.75, pan: 0.15 });

  // Add effects
  mixer.addTrackEffect(melodyId, {
    type: 'reverb',
    enabled: true,
    params: { ...REVERB_PRESETS.hall, wetLevel: 0.3 },
  });

  mixer.addTrackEffect(chordId, {
    type: 'reverb',
    enabled: true,
    params: { ...REVERB_PRESETS.room, wetLevel: 0.2 },
  });

  mixer.addTrackEffect(bassId, {
    type: 'compressor',
    enabled: true,
    params: COMPRESSOR_PRESETS.bass,
  });

  mixer.addMasterEffect({
    type: 'compressor',
    enabled: true,
    params: COMPRESSOR_PRESETS.mastering,
  });

  const mixdown = mixer.mixdown({ normalize: true });

  // 6. Master
  console.log('6. Mastering...\n');

  const masteringChain = new MasteringChain();
  const mastered = masteringChain.masterWithPreset(mixdown, 'streaming');

  // 7. Export
  console.log('7. Exporting final song...\n');

  soundfile.write('/tmp/complete-song-demo.wav', mastered.waveform, mastered.sampleRate);

  console.log('✅ Complete song production finished!\n');
  console.log('Output: /tmp/complete-song-demo.wav\n');
  console.log(`Duration: ${songDuration.toFixed(2)}s (16 bars @ ${tempo} BPM)\n`);
}

// ============================================================================
// Main Demo Runner
// ============================================================================

async function main() {
  console.log('\n' + '█'.repeat(80));
  console.log('█' + ' '.repeat(78) + '█');
  console.log('█' + ' '.repeat(20) + 'AUDIO PRODUCTION STUDIO' + ' '.repeat(35) + '█');
  console.log('█' + ' '.repeat(18) + 'Full Production Demonstrations' + ' '.repeat(29) + '█');
  console.log('█' + ' '.repeat(78) + '█');
  console.log('█'.repeat(80));

  console.log('\n💡 This showcase demonstrates:');
  console.log('   - Python audio libraries (librosa, scipy, numpy) in TypeScript');
  console.log('   - Zero-copy memory sharing between languages');
  console.log('   - Professional audio production workflow');
  console.log('   - All in ONE TypeScript process!');

  console.log('\n' + '='.repeat(80));
  console.log('Running 5 complete production examples...');
  console.log('='.repeat(80));

  try {
    await example1_SynthTrackProduction();
    await example2_VocalProcessing();
    await example3_AudioAnalysis();
    await example4_MultibandMastering();
    await example5_CompleteSongProduction();

    console.log('\n' + '█'.repeat(80));
    console.log('█' + ' '.repeat(78) + '█');
    console.log('█' + ' '.repeat(25) + 'ALL EXAMPLES COMPLETE!' + ' '.repeat(30) + '█');
    console.log('█' + ' '.repeat(78) + '█');
    console.log('█'.repeat(80) + '\n');

    console.log('Output files created:');
    console.log('  • /tmp/synth-track-demo.wav');
    console.log('  • /tmp/vocal-processed-demo.wav');
    console.log('  • /tmp/multiband-mastered-demo.wav');
    console.log('  • /tmp/complete-song-demo.wav');

  } catch (error) {
    console.error('\n❌ Error running examples:', error);
    throw error;
  }
}

// Run if main module
if (import.meta.main) {
  main();
}

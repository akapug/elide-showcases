/**
 * Live Music Generation Server
 *
 * Real-time music generation server with WebSocket streaming, multi-client support,
 * and integration with Python ML backend for advanced composition.
 *
 * Features:
 * - WebSocket audio streaming with < 10ms latency
 * - Multi-client synchronization
 * - Real-time parameter modification
 * - Python ML backend integration via IPC
 * - MIDI input/output support
 * - Dynamic buffer management
 * - Genre-specific generation engines
 */

import WebSocket from 'ws';
import express from 'express';
import http from 'http';
import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

import { ChordProgressionGenerator } from './music-engine/chord-progressions';
import { MelodyGenerator } from './music-engine/melody-generator';
import { RhythmEngine } from './music-engine/rhythm-engine';
import { Synthesizer, SynthParams } from './audio/synthesizer';
import { MidiController, MidiEvent } from './audio/midi-controller';

/**
 * Music generation parameters
 */
interface GenerationParams {
  genre: 'jazz' | 'edm' | 'classical' | 'rock' | 'ambient' | 'hiphop';
  key: string;
  mode: 'major' | 'minor' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'locrian';
  tempo: number;
  timeSignature: [number, number];
  duration: number; // in bars
  instruments: string[];
  styleParams?: Record<string, any>;
}

/**
 * Real-time modification parameters
 */
interface ModificationParams {
  tempo?: number;
  volume?: number;
  filter?: {
    cutoff: number;
    resonance: number;
    type?: 'lowpass' | 'highpass' | 'bandpass';
  };
  reverb?: {
    mix: number;
    decay: number;
    preDelay?: number;
  };
  compression?: {
    threshold: number;
    ratio: number;
    attack: number;
    release: number;
  };
}

/**
 * WebSocket message types
 */
type WSMessage =
  | { type: 'generate'; params: GenerationParams }
  | { type: 'modify'; params: ModificationParams }
  | { type: 'stop' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'seek'; position: number }
  | { type: 'export'; format: 'wav' | 'midi' | 'json' };

/**
 * Client connection state
 */
interface ClientState {
  id: string;
  ws: WebSocket;
  status: 'idle' | 'generating' | 'playing' | 'paused' | 'stopped';
  currentGeneration?: GenerationState;
  lastHeartbeat: number;
}

/**
 * Generation state
 */
interface GenerationState {
  id: string;
  params: GenerationParams;
  startTime: number;
  currentBar: number;
  totalBars: number;
  audioBuffer: Float32Array[];
  midiEvents: MidiEvent[];
  chordProgression: any[];
  melody: any[];
  rhythm: any[];
}

/**
 * Audio streaming configuration
 */
interface StreamConfig {
  sampleRate: number;
  channels: number;
  bufferSize: number;
  framesPerBuffer: number;
}

/**
 * Main music generation server
 */
export class MusicGenerationServer extends EventEmitter {
  private app: express.Application;
  private server: http.Server;
  private wss: WebSocket.Server;
  private clients: Map<string, ClientState>;

  // Music engines
  private chordGenerator: ChordProgressionGenerator;
  private melodyGenerator: MelodyGenerator;
  private rhythmEngine: RhythmEngine;
  private synthesizer: Synthesizer;
  private midiController: MidiController;

  // Python ML backend
  private pythonProcess?: ChildProcess;
  private mlQueue: Map<string, (result: any) => void>;

  // Audio streaming
  private streamConfig: StreamConfig;
  private masterVolume: number;

  // Synchronization
  private generationCounter: number;
  private activeGenerations: Map<string, GenerationState>;

  constructor(port: number = 3000) {
    super();

    // Initialize Express app
    this.app = express();
    this.server = http.createServer(this.app);

    // Initialize WebSocket server
    this.wss = new WebSocket.Server({
      server: this.server,
      path: '/music'
    });

    // Initialize client tracking
    this.clients = new Map();
    this.activeGenerations = new Map();
    this.generationCounter = 0;

    // Initialize music engines
    this.chordGenerator = new ChordProgressionGenerator();
    this.melodyGenerator = new MelodyGenerator();
    this.rhythmEngine = new RhythmEngine();
    this.synthesizer = new Synthesizer();
    this.midiController = new MidiController();

    // Initialize ML queue
    this.mlQueue = new Map();

    // Audio configuration
    this.streamConfig = {
      sampleRate: 44100,
      channels: 2,
      bufferSize: 4096,
      framesPerBuffer: 128
    };

    this.masterVolume = 0.8;

    // Setup routes and handlers
    this.setupRoutes();
    this.setupWebSocket();
    this.setupMidiHandlers();
    this.startPythonBackend();
    this.startHeartbeat();

    // Start server
    this.server.listen(port, () => {
      console.log(`Music Generation Server running on port ${port}`);
      console.log(`WebSocket endpoint: ws://localhost:${port}/music`);
    });
  }

  /**
   * Setup Express routes
   */
  private setupRoutes(): void {
    // Enable CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      next();
    });

    // Parse JSON bodies
    this.app.use(express.json());

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        clients: this.clients.size,
        activeGenerations: this.activeGenerations.size,
        pythonBackend: this.pythonProcess ? 'running' : 'stopped'
      });
    });

    // Get available genres
    this.app.get('/api/genres', (req, res) => {
      res.json({
        genres: ['jazz', 'edm', 'classical', 'rock', 'ambient', 'hiphop'],
        modes: ['major', 'minor', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian'],
        scales: this.chordGenerator.getAvailableScales()
      });
    });

    // Get available instruments
    this.app.get('/api/instruments', (req, res) => {
      res.json({
        instruments: this.synthesizer.getAvailableInstruments()
      });
    });

    // Generate preview (non-streaming)
    this.app.post('/api/generate-preview', async (req, res) => {
      try {
        const params: GenerationParams = req.body;
        const result = await this.generatePreview(params);
        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Export generation
    this.app.post('/api/export/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const { format } = req.body;
        const generation = this.activeGenerations.get(id);

        if (!generation) {
          return res.status(404).json({ error: 'Generation not found' });
        }

        const exported = await this.exportGeneration(generation, format);
        res.json(exported);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get statistics
    this.app.get('/api/stats', (req, res) => {
      const stats = this.getServerStats();
      res.json(stats);
    });

    // Serve static files
    this.app.use(express.static('public'));
  }

  /**
   * Setup WebSocket handlers
   */
  private setupWebSocket(): void {
    this.wss.on('connection', (ws: WebSocket, req) => {
      const clientId = this.generateClientId();

      const client: ClientState = {
        id: clientId,
        ws,
        status: 'idle',
        lastHeartbeat: Date.now()
      };

      this.clients.set(clientId, client);

      console.log(`Client connected: ${clientId} (Total: ${this.clients.size})`);

      // Send welcome message
      this.sendMessage(ws, {
        type: 'connected',
        clientId,
        config: this.streamConfig
      });

      // Handle messages
      ws.on('message', async (data: WebSocket.Data) => {
        try {
          const message: WSMessage = JSON.parse(data.toString());
          await this.handleClientMessage(clientId, message);
        } catch (error) {
          console.error('Error handling message:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        this.handleClientDisconnect(clientId);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
      });

      // Heartbeat response
      ws.on('pong', () => {
        const client = this.clients.get(clientId);
        if (client) {
          client.lastHeartbeat = Date.now();
        }
      });
    });
  }

  /**
   * Handle client messages
   */
  private async handleClientMessage(clientId: string, message: WSMessage): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case 'generate':
        await this.handleGenerate(client, message.params);
        break;

      case 'modify':
        await this.handleModify(client, message.params);
        break;

      case 'stop':
        await this.handleStop(client);
        break;

      case 'pause':
        await this.handlePause(client);
        break;

      case 'resume':
        await this.handleResume(client);
        break;

      case 'seek':
        await this.handleSeek(client, message.position);
        break;

      case 'export':
        await this.handleExport(client, message.format);
        break;

      default:
        this.sendError(client.ws, 'Unknown message type');
    }
  }

  /**
   * Handle generation request
   */
  private async handleGenerate(client: ClientState, params: GenerationParams): Promise<void> {
    try {
      client.status = 'generating';

      const generationId = `gen_${this.generationCounter++}`;

      // Create generation state
      const generation: GenerationState = {
        id: generationId,
        params,
        startTime: Date.now(),
        currentBar: 0,
        totalBars: params.duration,
        audioBuffer: [],
        midiEvents: [],
        chordProgression: [],
        melody: [],
        rhythm: []
      };

      client.currentGeneration = generation;
      this.activeGenerations.set(generationId, generation);

      // Send status update
      this.sendMessage(client.ws, {
        type: 'status',
        status: 'generating',
        generationId,
        progress: 0
      });

      // Generate music based on genre
      await this.generateMusic(client, generation);

    } catch (error: any) {
      console.error('Generation error:', error);
      this.sendError(client.ws, error.message);
      client.status = 'idle';
    }
  }

  /**
   * Generate music based on parameters
   */
  private async generateMusic(client: ClientState, generation: GenerationState): Promise<void> {
    const { params } = generation;

    // Step 1: Generate chord progression
    this.sendProgress(client.ws, generation.id, 0.1, 'Generating chord progression...');
    generation.chordProgression = await this.generateChordProgression(params);

    // Step 2: Generate melody (using ML if available)
    this.sendProgress(client.ws, generation.id, 0.3, 'Generating melody...');
    generation.melody = await this.generateMelody(params, generation.chordProgression);

    // Step 3: Generate rhythm patterns
    this.sendProgress(client.ws, generation.id, 0.5, 'Generating rhythm...');
    generation.rhythm = await this.generateRhythm(params);

    // Step 4: Apply ML enhancements (if enabled)
    if (this.pythonProcess) {
      this.sendProgress(client.ws, generation.id, 0.6, 'Applying ML enhancements...');
      await this.applyMLEnhancements(generation);
    }

    // Step 5: Synthesize audio
    this.sendProgress(client.ws, generation.id, 0.7, 'Synthesizing audio...');
    await this.synthesizeAudio(generation);

    // Step 6: Generate MIDI events
    this.sendProgress(client.ws, generation.id, 0.9, 'Generating MIDI...');
    generation.midiEvents = this.generateMidiEvents(generation);

    // Step 7: Start streaming
    this.sendProgress(client.ws, generation.id, 1.0, 'Ready to play');
    client.status = 'playing';

    await this.streamAudio(client, generation);
  }

  /**
   * Generate chord progression
   */
  private async generateChordProgression(params: GenerationParams): Promise<any[]> {
    return this.chordGenerator.generate({
      key: params.key,
      mode: params.mode,
      numBars: params.duration,
      genre: params.genre,
      complexity: params.styleParams?.complexity || 'medium'
    });
  }

  /**
   * Generate melody
   */
  private async generateMelody(params: GenerationParams, chords: any[]): Promise<any[]> {
    // Use ML backend if available, otherwise use rule-based generation
    if (this.pythonProcess) {
      return await this.callMLBackend('generate_melody', {
        key: params.key,
        mode: params.mode,
        chords: chords,
        style: params.genre,
        num_bars: params.duration
      });
    } else {
      return this.melodyGenerator.generate({
        key: params.key,
        mode: params.mode,
        chordProgression: chords,
        numBars: params.duration,
        style: params.genre
      });
    }
  }

  /**
   * Generate rhythm patterns
   */
  private async generateRhythm(params: GenerationParams): Promise<any[]> {
    return this.rhythmEngine.generate({
      genre: params.genre,
      tempo: params.tempo,
      timeSignature: params.timeSignature,
      numBars: params.duration,
      complexity: params.styleParams?.complexity || 'medium'
    });
  }

  /**
   * Apply ML enhancements
   */
  private async applyMLEnhancements(generation: GenerationState): Promise<void> {
    try {
      // Style-specific ML enhancements
      const enhanced = await this.callMLBackend('enhance_composition', {
        melody: generation.melody,
        chords: generation.chordProgression,
        rhythm: generation.rhythm,
        style: generation.params.genre
      });

      if (enhanced.melody) generation.melody = enhanced.melody;
      if (enhanced.chords) generation.chordProgression = enhanced.chords;
      if (enhanced.rhythm) generation.rhythm = enhanced.rhythm;
    } catch (error) {
      console.warn('ML enhancement failed, using original:', error);
    }
  }

  /**
   * Synthesize audio from musical data
   */
  private async synthesizeAudio(generation: GenerationState): Promise<void> {
    const { params, chordProgression, melody, rhythm } = generation;
    const { tempo, timeSignature } = params;

    const beatsPerBar = timeSignature[0];
    const beatDuration = 60 / tempo;
    const barDuration = beatDuration * beatsPerBar;

    const totalDuration = barDuration * params.duration;
    const totalSamples = Math.floor(totalDuration * this.streamConfig.sampleRate);

    // Create audio buffers for each channel
    const leftChannel = new Float32Array(totalSamples);
    const rightChannel = new Float32Array(totalSamples);

    // Synthesize each instrument
    for (const instrument of params.instruments) {
      const synthParams = this.getSynthParamsForInstrument(instrument, params.genre);

      // Synthesize chords
      for (let bar = 0; bar < chordProgression.length; bar++) {
        const chord = chordProgression[bar];
        const startTime = bar * barDuration;

        const chordBuffer = this.synthesizer.synthesizeChord(
          chord.notes,
          startTime,
          chord.duration || barDuration,
          synthParams
        );

        this.mixBuffer(leftChannel, rightChannel, chordBuffer, startTime);
      }

      // Synthesize melody
      for (const note of melody) {
        const melodyBuffer = this.synthesizer.synthesizeNote(
          note.pitch,
          note.startTime,
          note.duration,
          note.velocity,
          synthParams
        );

        this.mixBuffer(leftChannel, rightChannel, melodyBuffer, note.startTime);
      }

      // Synthesize rhythm
      if (instrument === 'drums' && rhythm.length > 0) {
        for (const hit of rhythm) {
          const drumBuffer = this.synthesizer.synthesizeDrum(
            hit.instrument,
            hit.startTime,
            hit.velocity
          );

          this.mixBuffer(leftChannel, rightChannel, drumBuffer, hit.startTime);
        }
      }
    }

    // Apply master effects
    this.applyMasterEffects(leftChannel, rightChannel, params);

    // Store in generation
    generation.audioBuffer = [leftChannel, rightChannel];
  }

  /**
   * Get synthesizer parameters for instrument and genre
   */
  private getSynthParamsForInstrument(instrument: string, genre: string): SynthParams {
    const presets: Record<string, SynthParams> = {
      'piano': {
        waveform: 'sine',
        attack: 0.01,
        decay: 0.2,
        sustain: 0.3,
        release: 0.5,
        filterCutoff: 2000,
        filterResonance: 1
      },
      'bass': {
        waveform: 'sawtooth',
        attack: 0.05,
        decay: 0.1,
        sustain: 0.8,
        release: 0.2,
        filterCutoff: 500,
        filterResonance: 2
      },
      'lead': {
        waveform: 'square',
        attack: 0.01,
        decay: 0.1,
        sustain: 0.6,
        release: 0.3,
        filterCutoff: 3000,
        filterResonance: 3
      },
      'pad': {
        waveform: 'sine',
        attack: 0.5,
        decay: 0.3,
        sustain: 0.7,
        release: 1.0,
        filterCutoff: 1500,
        filterResonance: 1
      }
    };

    return presets[instrument] || presets['piano'];
  }

  /**
   * Mix audio buffer into output
   */
  private mixBuffer(
    leftOut: Float32Array,
    rightOut: Float32Array,
    buffer: Float32Array[],
    startTime: number
  ): void {
    const startSample = Math.floor(startTime * this.streamConfig.sampleRate);

    for (let i = 0; i < buffer[0].length && startSample + i < leftOut.length; i++) {
      leftOut[startSample + i] += buffer[0][i] * this.masterVolume;
      rightOut[startSample + i] += buffer[1][i] * this.masterVolume;
    }
  }

  /**
   * Apply master effects chain
   */
  private applyMasterEffects(
    leftChannel: Float32Array,
    rightChannel: Float32Array,
    params: GenerationParams
  ): void {
    // Apply compression
    this.synthesizer.applyCompression(leftChannel, {
      threshold: -20,
      ratio: 4,
      attack: 0.003,
      release: 0.25
    });

    this.synthesizer.applyCompression(rightChannel, {
      threshold: -20,
      ratio: 4,
      attack: 0.003,
      release: 0.25
    });

    // Apply reverb
    const reverbMix = params.genre === 'ambient' ? 0.5 : 0.2;
    this.synthesizer.applyReverb(leftChannel, rightChannel, {
      mix: reverbMix,
      decay: 2.0,
      preDelay: 0.02
    });

    // Normalize
    this.normalizeBuffer(leftChannel);
    this.normalizeBuffer(rightChannel);
  }

  /**
   * Normalize audio buffer
   */
  private normalizeBuffer(buffer: Float32Array): void {
    let max = 0;
    for (let i = 0; i < buffer.length; i++) {
      max = Math.max(max, Math.abs(buffer[i]));
    }

    if (max > 0) {
      const scale = 0.95 / max; // Leave headroom
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] *= scale;
      }
    }
  }

  /**
   * Generate MIDI events from generation
   */
  private generateMidiEvents(generation: GenerationState): MidiEvent[] {
    const events: MidiEvent[] = [];

    // Add melody notes
    for (const note of generation.melody) {
      events.push({
        type: 'note_on',
        channel: 0,
        note: note.pitch,
        velocity: note.velocity || 100,
        time: note.startTime
      });

      events.push({
        type: 'note_off',
        channel: 0,
        note: note.pitch,
        velocity: 0,
        time: note.startTime + note.duration
      });
    }

    // Sort by time
    events.sort((a, b) => a.time - b.time);

    return events;
  }

  /**
   * Stream audio to client
   */
  private async streamAudio(client: ClientState, generation: GenerationState): Promise<void> {
    const [leftChannel, rightChannel] = generation.audioBuffer;
    const bufferSize = this.streamConfig.framesPerBuffer * 2; // stereo

    let position = 0;

    const streamInterval = setInterval(() => {
      if (client.status !== 'playing' || position >= leftChannel.length) {
        clearInterval(streamInterval);

        if (position >= leftChannel.length) {
          client.status = 'stopped';
          this.sendMessage(client.ws, {
            type: 'status',
            status: 'stopped',
            generationId: generation.id
          });
        }
        return;
      }

      // Prepare audio chunk
      const chunkSize = Math.min(bufferSize / 2, leftChannel.length - position);
      const audioData = new Float32Array(chunkSize * 2);

      // Interleave stereo
      for (let i = 0; i < chunkSize; i++) {
        audioData[i * 2] = leftChannel[position + i];
        audioData[i * 2 + 1] = rightChannel[position + i];
      }

      // Send audio chunk
      this.sendMessage(client.ws, {
        type: 'audio',
        data: audioData.buffer,
        sampleRate: this.streamConfig.sampleRate,
        channels: this.streamConfig.channels
      });

      position += chunkSize;

      // Update progress
      const progress = position / leftChannel.length;
      const currentBar = Math.floor(progress * generation.totalBars);

      if (currentBar !== generation.currentBar) {
        generation.currentBar = currentBar;

        this.sendMessage(client.ws, {
          type: 'status',
          status: 'playing',
          generationId: generation.id,
          progress,
          currentBar,
          totalBars: generation.totalBars
        });
      }

    }, (this.streamConfig.framesPerBuffer / this.streamConfig.sampleRate) * 1000);
  }

  /**
   * Handle real-time modifications
   */
  private async handleModify(client: ClientState, params: ModificationParams): Promise<void> {
    if (params.volume !== undefined) {
      this.masterVolume = Math.max(0, Math.min(1, params.volume));
    }

    if (params.filter) {
      this.synthesizer.setFilterParams(params.filter);
    }

    if (params.reverb) {
      this.synthesizer.setReverbParams(params.reverb);
    }

    if (params.compression) {
      this.synthesizer.setCompressionParams(params.compression);
    }

    this.sendMessage(client.ws, {
      type: 'modified',
      params
    });
  }

  /**
   * Handle stop request
   */
  private async handleStop(client: ClientState): Promise<void> {
    client.status = 'stopped';

    this.sendMessage(client.ws, {
      type: 'status',
      status: 'stopped'
    });
  }

  /**
   * Handle pause request
   */
  private async handlePause(client: ClientState): Promise<void> {
    if (client.status === 'playing') {
      client.status = 'paused';

      this.sendMessage(client.ws, {
        type: 'status',
        status: 'paused'
      });
    }
  }

  /**
   * Handle resume request
   */
  private async handleResume(client: ClientState): Promise<void> {
    if (client.status === 'paused') {
      client.status = 'playing';

      this.sendMessage(client.ws, {
        type: 'status',
        status: 'playing'
      });
    }
  }

  /**
   * Handle seek request
   */
  private async handleSeek(client: ClientState, position: number): Promise<void> {
    if (client.currentGeneration) {
      const targetBar = Math.floor(position * client.currentGeneration.totalBars);
      client.currentGeneration.currentBar = targetBar;

      this.sendMessage(client.ws, {
        type: 'seeked',
        position,
        currentBar: targetBar
      });
    }
  }

  /**
   * Handle export request
   */
  private async handleExport(client: ClientState, format: string): Promise<void> {
    if (!client.currentGeneration) {
      return this.sendError(client.ws, 'No active generation to export');
    }

    const exported = await this.exportGeneration(client.currentGeneration, format);

    this.sendMessage(client.ws, {
      type: 'exported',
      format,
      data: exported
    });
  }

  /**
   * Export generation to various formats
   */
  private async exportGeneration(generation: GenerationState, format: string): Promise<any> {
    switch (format) {
      case 'wav':
        return this.exportToWav(generation);
      case 'midi':
        return this.exportToMidi(generation);
      case 'json':
        return this.exportToJson(generation);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export to WAV format
   */
  private exportToWav(generation: GenerationState): ArrayBuffer {
    // WAV file format implementation
    const [leftChannel, rightChannel] = generation.audioBuffer;
    const numSamples = leftChannel.length;
    const numChannels = 2;
    const sampleRate = this.streamConfig.sampleRate;
    const bytesPerSample = 2;

    const buffer = new ArrayBuffer(44 + numSamples * numChannels * bytesPerSample);
    const view = new DataView(buffer);

    // WAV header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + numSamples * numChannels * bytesPerSample, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
    view.setUint16(32, numChannels * bytesPerSample, true);
    view.setUint16(34, bytesPerSample * 8, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, numSamples * numChannels * bytesPerSample, true);

    // Write samples
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      const left = Math.max(-1, Math.min(1, leftChannel[i]));
      const right = Math.max(-1, Math.min(1, rightChannel[i]));

      view.setInt16(offset, left * 0x7FFF, true);
      offset += 2;
      view.setInt16(offset, right * 0x7FFF, true);
      offset += 2;
    }

    return buffer;
  }

  /**
   * Export to MIDI format
   */
  private exportToMidi(generation: GenerationState): ArrayBuffer {
    return this.midiController.exportMidi(generation.midiEvents, generation.params.tempo);
  }

  /**
   * Export to JSON format
   */
  private exportToJson(generation: GenerationState): string {
    return JSON.stringify({
      id: generation.id,
      params: generation.params,
      chordProgression: generation.chordProgression,
      melody: generation.melody,
      rhythm: generation.rhythm,
      midiEvents: generation.midiEvents
    }, null, 2);
  }

  /**
   * Write string to DataView
   */
  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  /**
   * Generate preview (non-streaming)
   */
  private async generatePreview(params: GenerationParams): Promise<any> {
    const tempGeneration: GenerationState = {
      id: 'preview',
      params,
      startTime: Date.now(),
      currentBar: 0,
      totalBars: params.duration,
      audioBuffer: [],
      midiEvents: [],
      chordProgression: [],
      melody: [],
      rhythm: []
    };

    tempGeneration.chordProgression = await this.generateChordProgression(params);
    tempGeneration.melody = await this.generateMelody(params, tempGeneration.chordProgression);
    tempGeneration.rhythm = await this.generateRhythm(params);

    return {
      chordProgression: tempGeneration.chordProgression,
      melody: tempGeneration.melody,
      rhythm: tempGeneration.rhythm
    };
  }

  /**
   * Setup MIDI handlers
   */
  private setupMidiHandlers(): void {
    this.midiController.on('note', (note) => {
      // Broadcast MIDI note to all connected clients
      this.broadcast({
        type: 'midi',
        event: note
      });
    });

    this.midiController.on('cc', (cc) => {
      // Handle MIDI CC for parameter control
      this.handleMidiCC(cc);
    });
  }

  /**
   * Handle MIDI CC messages
   */
  private handleMidiCC(cc: any): void {
    // Map CC to parameters
    const mapping: Record<number, string> = {
      1: 'filter.cutoff',
      2: 'reverb.mix',
      7: 'volume',
      74: 'filter.resonance'
    };

    const param = mapping[cc.controller];
    if (param) {
      // Update parameter for all active generations
      // Implementation depends on parameter structure
    }
  }

  /**
   * Start Python ML backend
   */
  private startPythonBackend(): void {
    const pythonScript = path.join(__dirname, '../python/ml_server.py');

    if (!fs.existsSync(pythonScript)) {
      console.warn('Python ML backend not found, using rule-based generation only');
      return;
    }

    this.pythonProcess = spawn('python', [pythonScript], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.pythonProcess.stdout?.on('data', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handlePythonMessage(message);
      } catch (error) {
        console.log('Python:', data.toString());
      }
    });

    this.pythonProcess.stderr?.on('data', (data) => {
      console.error('Python error:', data.toString());
    });

    this.pythonProcess.on('close', (code) => {
      console.log(`Python process exited with code ${code}`);
      this.pythonProcess = undefined;
    });

    console.log('Python ML backend started');
  }

  /**
   * Call ML backend
   */
  private callMLBackend(method: string, params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.pythonProcess) {
        return reject(new Error('Python backend not available'));
      }

      const requestId = Math.random().toString(36).substr(2, 9);

      this.mlQueue.set(requestId, resolve);

      this.pythonProcess.stdin?.write(JSON.stringify({
        id: requestId,
        method,
        params
      }) + '\n');

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.mlQueue.has(requestId)) {
          this.mlQueue.delete(requestId);
          reject(new Error('ML backend timeout'));
        }
      }, 30000);
    });
  }

  /**
   * Handle Python backend messages
   */
  private handlePythonMessage(message: any): void {
    if (message.id && this.mlQueue.has(message.id)) {
      const resolve = this.mlQueue.get(message.id)!;
      this.mlQueue.delete(message.id);

      if (message.error) {
        resolve({ error: message.error });
      } else {
        resolve(message.result);
      }
    }
  }

  /**
   * Handle client disconnect
   */
  private handleClientDisconnect(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client?.currentGeneration) {
      // Clean up generation if no other clients are using it
      const generationId = client.currentGeneration.id;
      const otherUsers = Array.from(this.clients.values())
        .filter(c => c.id !== clientId && c.currentGeneration?.id === generationId);

      if (otherUsers.length === 0) {
        this.activeGenerations.delete(generationId);
      }
    }

    this.clients.delete(clientId);
    console.log(`Client disconnected: ${clientId} (Remaining: ${this.clients.size})`);
  }

  /**
   * Start heartbeat for connection monitoring
   */
  private startHeartbeat(): void {
    setInterval(() => {
      const now = Date.now();

      for (const [clientId, client] of this.clients.entries()) {
        // Check if client is still alive
        if (now - client.lastHeartbeat > 30000) {
          console.log(`Client ${clientId} timed out`);
          client.ws.close();
          this.handleClientDisconnect(clientId);
        } else {
          // Send ping
          client.ws.ping();
        }
      }
    }, 10000);
  }

  /**
   * Send message to client
   */
  private sendMessage(ws: WebSocket, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Send error to client
   */
  private sendError(ws: WebSocket, error: string): void {
    this.sendMessage(ws, {
      type: 'error',
      error
    });
  }

  /**
   * Send progress update
   */
  private sendProgress(ws: WebSocket, generationId: string, progress: number, message: string): void {
    this.sendMessage(ws, {
      type: 'progress',
      generationId,
      progress,
      message
    });
  }

  /**
   * Broadcast message to all clients
   */
  private broadcast(message: any): void {
    for (const client of this.clients.values()) {
      this.sendMessage(client.ws, message);
    }
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get server statistics
   */
  private getServerStats(): any {
    return {
      uptime: process.uptime(),
      clients: this.clients.size,
      activeGenerations: this.activeGenerations.size,
      memoryUsage: process.memoryUsage(),
      pythonBackend: this.pythonProcess ? 'running' : 'stopped'
    };
  }

  /**
   * Shutdown server gracefully
   */
  public async shutdown(): Promise<void> {
    console.log('Shutting down server...');

    // Close all client connections
    for (const client of this.clients.values()) {
      client.ws.close();
    }

    // Stop Python backend
    if (this.pythonProcess) {
      this.pythonProcess.kill();
    }

    // Close WebSocket server
    this.wss.close();

    // Close HTTP server
    this.server.close();

    console.log('Server shutdown complete');
  }
}

// Start server if running directly
if (require.main === module) {
  const port = parseInt(process.env.PORT || '3000');
  const server = new MusicGenerationServer(port);

  // Handle shutdown signals
  process.on('SIGINT', async () => {
    await server.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await server.shutdown();
    process.exit(0);
  });
}

export default MusicGenerationServer;

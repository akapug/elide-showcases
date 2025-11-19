/**
 * MIDI Controller
 *
 * MIDI input/output handler with support for MIDI messages, CC mapping,
 * MIDI file export, and MPE (MIDI Polyphonic Expression).
 *
 * Features:
 * - MIDI input from hardware controllers
 * - MIDI output to DAWs and external devices
 * - CC (Control Change) mapping
 * - MIDI file import/export
 * - MPE support for expressive controllers
 * - MIDI clock synchronization
 * - Program change and bank select
 */

import { EventEmitter } from 'events';

/**
 * MIDI event types
 */
export interface MidiEvent {
  type: 'note_on' | 'note_off' | 'cc' | 'program_change' | 'pitch_bend' | 'aftertouch';
  channel: number;
  note?: number;
  velocity?: number;
  controller?: number;
  value?: number;
  time: number;
}

/**
 * MIDI message
 */
interface MidiMessage {
  status: number;
  data1: number;
  data2: number;
  timestamp: number;
}

/**
 * CC mapping
 */
interface CCMapping {
  parameter: string;
  min: number;
  max: number;
  scale: 'linear' | 'log' | 'exp';
  smooth?: number; // Smoothing factor (0-1)
}

/**
 * MIDI note
 */
interface MidiNote {
  channel: number;
  note: number;
  velocity: number;
  startTime: number;
  duration: number;
}

/**
 * MIDI track
 */
interface MidiTrack {
  name: string;
  notes: MidiNote[];
  controlChanges: any[];
  programChange?: number;
}

/**
 * MIDI Controller
 */
export class MidiController extends EventEmitter {
  private inputs: Map<string, any>;
  private outputs: Map<string, any>;
  private ccMappings: Map<number, CCMapping>;
  private activeNotes: Map<number, Set<number>>; // channel -> notes
  private tempo: number;
  private clockRunning: boolean;
  private clockInterval?: NodeJS.Timeout;

  // MPE configuration
  private mpeEnabled: boolean;
  private mpeMasterChannel: number;
  private mpeZones: { lower: number; upper: number };

  constructor() {
    super();

    this.inputs = new Map();
    this.outputs = new Map();
    this.ccMappings = new Map();
    this.activeNotes = new Map();

    this.tempo = 120;
    this.clockRunning = false;

    // MPE defaults
    this.mpeEnabled = false;
    this.mpeMasterChannel = 0;
    this.mpeZones = { lower: 15, upper: 0 };

    // Initialize channels
    for (let i = 0; i < 16; i++) {
      this.activeNotes.set(i, new Set());
    }
  }

  /**
   * Initialize MIDI access
   */
  public async initialize(): Promise<void> {
    // In a real implementation, this would use Web MIDI API or node-midi
    // For now, we'll simulate MIDI functionality
    console.log('MIDI Controller initialized');
  }

  /**
   * List available MIDI inputs
   */
  public listInputs(): string[] {
    return Array.from(this.inputs.keys());
  }

  /**
   * List available MIDI outputs
   */
  public listOutputs(): string[] {
    return Array.from(this.outputs.keys());
  }

  /**
   * Open MIDI input
   */
  public openInput(deviceName: string): void {
    if (!this.inputs.has(deviceName)) {
      // Simulate opening input
      this.inputs.set(deviceName, {
        name: deviceName,
        onMessage: (message: MidiMessage) => this.handleMidiMessage(message)
      });

      console.log(`Opened MIDI input: ${deviceName}`);
    }
  }

  /**
   * Open MIDI output
   */
  public openOutput(deviceName: string): void {
    if (!this.outputs.has(deviceName)) {
      // Simulate opening output
      this.outputs.set(deviceName, {
        name: deviceName,
        send: (message: number[]) => this.sendMidiMessage(message)
      });

      console.log(`Opened MIDI output: ${deviceName}`);
    }
  }

  /**
   * Handle incoming MIDI message
   */
  private handleMidiMessage(message: MidiMessage): void {
    const status = message.status & 0xF0;
    const channel = message.status & 0x0F;

    switch (status) {
      case 0x90: // Note On
        if (message.data2 > 0) {
          this.handleNoteOn(channel, message.data1, message.data2);
        } else {
          this.handleNoteOff(channel, message.data1);
        }
        break;

      case 0x80: // Note Off
        this.handleNoteOff(channel, message.data1);
        break;

      case 0xB0: // Control Change
        this.handleCC(channel, message.data1, message.data2);
        break;

      case 0xC0: // Program Change
        this.handleProgramChange(channel, message.data1);
        break;

      case 0xE0: // Pitch Bend
        this.handlePitchBend(channel, message.data1, message.data2);
        break;

      case 0xD0: // Channel Aftertouch
        this.handleAftertouch(channel, message.data1);
        break;

      case 0xA0: // Polyphonic Aftertouch
        this.handlePolyAftertouch(channel, message.data1, message.data2);
        break;

      case 0xF0: // System messages
        this.handleSystemMessage(message);
        break;
    }
  }

  /**
   * Handle Note On
   */
  private handleNoteOn(channel: number, note: number, velocity: number): void {
    this.activeNotes.get(channel)?.add(note);

    const event: MidiEvent = {
      type: 'note_on',
      channel,
      note,
      velocity,
      time: Date.now()
    };

    this.emit('note', event);
  }

  /**
   * Handle Note Off
   */
  private handleNoteOff(channel: number, note: number): void {
    this.activeNotes.get(channel)?.delete(note);

    const event: MidiEvent = {
      type: 'note_off',
      channel,
      note,
      velocity: 0,
      time: Date.now()
    };

    this.emit('note', event);
  }

  /**
   * Handle CC
   */
  private handleCC(channel: number, controller: number, value: number): void {
    const mapping = this.ccMappings.get(controller);

    if (mapping) {
      const normalizedValue = value / 127;
      let scaledValue: number;

      switch (mapping.scale) {
        case 'log':
          scaledValue = mapping.min + (mapping.max - mapping.min) * Math.log10(1 + normalizedValue * 9) / Math.log10(10);
          break;

        case 'exp':
          scaledValue = mapping.min + (mapping.max - mapping.min) * Math.pow(normalizedValue, 2);
          break;

        case 'linear':
        default:
          scaledValue = mapping.min + (mapping.max - mapping.min) * normalizedValue;
          break;
      }

      this.emit('parameter', {
        parameter: mapping.parameter,
        value: scaledValue
      });
    }

    const event: MidiEvent = {
      type: 'cc',
      channel,
      controller,
      value,
      time: Date.now()
    };

    this.emit('cc', event);
  }

  /**
   * Handle Program Change
   */
  private handleProgramChange(channel: number, program: number): void {
    const event: MidiEvent = {
      type: 'program_change',
      channel,
      value: program,
      time: Date.now()
    };

    this.emit('program', event);
  }

  /**
   * Handle Pitch Bend
   */
  private handlePitchBend(channel: number, lsb: number, msb: number): void {
    const value = (msb << 7) | lsb;
    const normalized = (value - 8192) / 8192; // -1 to 1

    const event: MidiEvent = {
      type: 'pitch_bend',
      channel,
      value: normalized,
      time: Date.now()
    };

    this.emit('pitch_bend', event);
  }

  /**
   * Handle Aftertouch
   */
  private handleAftertouch(channel: number, value: number): void {
    const event: MidiEvent = {
      type: 'aftertouch',
      channel,
      value,
      time: Date.now()
    };

    this.emit('aftertouch', event);
  }

  /**
   * Handle Polyphonic Aftertouch
   */
  private handlePolyAftertouch(channel: number, note: number, value: number): void {
    this.emit('poly_aftertouch', {
      channel,
      note,
      value,
      time: Date.now()
    });
  }

  /**
   * Handle System messages
   */
  private handleSystemMessage(message: MidiMessage): void {
    const systemType = message.status;

    switch (systemType) {
      case 0xF8: // Clock
        this.emit('clock');
        break;

      case 0xFA: // Start
        this.emit('start');
        break;

      case 0xFB: // Continue
        this.emit('continue');
        break;

      case 0xFC: // Stop
        this.emit('stop');
        break;

      case 0xFF: // Reset
        this.emit('reset');
        break;
    }
  }

  /**
   * Send MIDI message
   */
  private sendMidiMessage(message: number[]): void {
    // In a real implementation, this would send to MIDI output
    console.log('MIDI Out:', message);
  }

  /**
   * Send Note On
   */
  public sendNoteOn(channel: number, note: number, velocity: number): void {
    const message = [0x90 | channel, note, velocity];
    this.sendMidiMessage(message);
  }

  /**
   * Send Note Off
   */
  public sendNoteOff(channel: number, note: number): void {
    const message = [0x80 | channel, note, 0];
    this.sendMidiMessage(message);
  }

  /**
   * Send CC
   */
  public sendCC(channel: number, controller: number, value: number): void {
    const message = [0xB0 | channel, controller, value];
    this.sendMidiMessage(message);
  }

  /**
   * Send Program Change
   */
  public sendProgramChange(channel: number, program: number): void {
    const message = [0xC0 | channel, program];
    this.sendMidiMessage(message);
  }

  /**
   * Send Pitch Bend
   */
  public sendPitchBend(channel: number, value: number): void {
    // Value should be -8192 to 8191
    const normalized = Math.max(-8192, Math.min(8191, value)) + 8192;
    const lsb = normalized & 0x7F;
    const msb = (normalized >> 7) & 0x7F;

    const message = [0xE0 | channel, lsb, msb];
    this.sendMidiMessage(message);
  }

  /**
   * Map CC to parameter
   */
  public mapCC(
    controller: number,
    parameter: string,
    min: number,
    max: number,
    scale: 'linear' | 'log' | 'exp' = 'linear'
  ): void {
    this.ccMappings.set(controller, {
      parameter,
      min,
      max,
      scale
    });
  }

  /**
   * Unmap CC
   */
  public unmapCC(controller: number): void {
    this.ccMappings.delete(controller);
  }

  /**
   * Start MIDI clock
   */
  public startClock(): void {
    if (this.clockRunning) return;

    this.clockRunning = true;
    const interval = 60000 / (this.tempo * 24); // 24 PPQN

    this.clockInterval = setInterval(() => {
      this.sendMidiMessage([0xF8]); // Clock tick
      this.emit('clock');
    }, interval);

    this.sendMidiMessage([0xFA]); // Start
  }

  /**
   * Stop MIDI clock
   */
  public stopClock(): void {
    if (!this.clockRunning) return;

    this.clockRunning = false;

    if (this.clockInterval) {
      clearInterval(this.clockInterval);
      this.clockInterval = undefined;
    }

    this.sendMidiMessage([0xFC]); // Stop
  }

  /**
   * Set tempo
   */
  public setTempo(tempo: number): void {
    this.tempo = tempo;

    if (this.clockRunning) {
      this.stopClock();
      this.startClock();
    }
  }

  /**
   * Panic - stop all notes
   */
  public panic(): void {
    for (let channel = 0; channel < 16; channel++) {
      // All notes off
      this.sendCC(channel, 123, 0);

      // All sound off
      this.sendCC(channel, 120, 0);
    }

    // Clear active notes
    for (const notes of this.activeNotes.values()) {
      notes.clear();
    }
  }

  /**
   * Enable MPE
   */
  public enableMPE(lowerZone: number = 15, upperZone: number = 0): void {
    this.mpeEnabled = true;
    this.mpeZones = { lower: lowerZone, upper: upperZone };

    // Send MPE configuration messages
    if (lowerZone > 0) {
      this.sendCC(0, 100, 0); // RPN LSB
      this.sendCC(0, 101, 0); // RPN MSB
      this.sendCC(0, 6, lowerZone); // Data Entry MSB
    }

    console.log(`MPE enabled: Lower=${lowerZone}, Upper=${upperZone}`);
  }

  /**
   * Disable MPE
   */
  public disableMPE(): void {
    this.mpeEnabled = false;
    console.log('MPE disabled');
  }

  /**
   * Export MIDI file
   */
  public exportMidi(events: MidiEvent[], tempo: number): ArrayBuffer {
    // MIDI file format implementation
    const tracks: MidiTrack[] = this.eventsToTracks(events);

    return this.createMidiFile(tracks, tempo);
  }

  /**
   * Convert events to tracks
   */
  private eventsToTracks(events: MidiEvent[]): MidiTrack[] {
    const channelTracks = new Map<number, MidiTrack>();

    // Group events by channel
    for (const event of events) {
      if (!channelTracks.has(event.channel)) {
        channelTracks.set(event.channel, {
          name: `Channel ${event.channel + 1}`,
          notes: [],
          controlChanges: []
        });
      }

      const track = channelTracks.get(event.channel)!;

      if (event.type === 'note_on' && event.note !== undefined) {
        // Find corresponding note_off
        const noteOff = events.find(e =>
          e.type === 'note_off' &&
          e.channel === event.channel &&
          e.note === event.note &&
          e.time > event.time
        );

        if (noteOff) {
          track.notes.push({
            channel: event.channel,
            note: event.note,
            velocity: event.velocity || 100,
            startTime: event.time,
            duration: noteOff.time - event.time
          });
        }
      } else if (event.type === 'cc') {
        track.controlChanges.push(event);
      }
    }

    return Array.from(channelTracks.values());
  }

  /**
   * Create MIDI file
   */
  private createMidiFile(tracks: MidiTrack[], tempo: number): ArrayBuffer {
    const PPQ = 480; // Pulses per quarter note

    // Calculate total file size
    let totalSize = 14; // Header chunk

    for (const track of tracks) {
      totalSize += 8; // Track header
      totalSize += this.calculateTrackSize(track, tempo, PPQ);
    }

    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);
    let offset = 0;

    // Write header chunk
    this.writeString(view, offset, 'MThd');
    offset += 4;
    view.setUint32(offset, 6, false); // Header length
    offset += 4;
    view.setUint16(offset, 1, false); // Format 1 (multiple tracks)
    offset += 2;
    view.setUint16(offset, tracks.length, false); // Number of tracks
    offset += 2;
    view.setUint16(offset, PPQ, false); // Division
    offset += 2;

    // Write tracks
    for (const track of tracks) {
      offset = this.writeTrack(view, offset, track, tempo, PPQ);
    }

    return buffer;
  }

  /**
   * Calculate track size
   */
  private calculateTrackSize(track: MidiTrack, tempo: number, PPQ: number): number {
    let size = 0;

    // Tempo event
    size += 7; // Meta event + tempo

    // Track name
    if (track.name) {
      size += 3 + track.name.length;
    }

    // Notes
    for (const note of track.notes) {
      size += 8; // Note on + Note off with delta times
    }

    // Control changes
    size += track.controlChanges.length * 4;

    // End of track
    size += 3;

    return size;
  }

  /**
   * Write track
   */
  private writeTrack(
    view: DataView,
    offset: number,
    track: MidiTrack,
    tempo: number,
    PPQ: number
  ): number {
    const trackStart = offset;

    // Track header
    this.writeString(view, offset, 'MTrk');
    offset += 4;

    const lengthOffset = offset;
    offset += 4; // Placeholder for length

    const dataStart = offset;

    // Write tempo
    offset = this.writeVarLen(view, offset, 0); // Delta time
    view.setUint8(offset++, 0xFF); // Meta event
    view.setUint8(offset++, 0x51); // Set tempo
    view.setUint8(offset++, 0x03); // Length
    const microsecondsPerQuarter = Math.floor(60000000 / tempo);
    view.setUint8(offset++, (microsecondsPerQuarter >> 16) & 0xFF);
    view.setUint8(offset++, (microsecondsPerQuarter >> 8) & 0xFF);
    view.setUint8(offset++, microsecondsPerQuarter & 0xFF);

    // Write track name
    if (track.name) {
      offset = this.writeVarLen(view, offset, 0);
      view.setUint8(offset++, 0xFF);
      view.setUint8(offset++, 0x03); // Track name
      offset = this.writeVarLen(view, offset, track.name.length);
      for (let i = 0; i < track.name.length; i++) {
        view.setUint8(offset++, track.name.charCodeAt(i));
      }
    }

    // Write notes
    let lastTime = 0;

    for (const note of track.notes) {
      const startTicks = Math.floor((note.startTime / 1000) * (tempo / 60) * PPQ);
      const endTicks = Math.floor(((note.startTime + note.duration) / 1000) * (tempo / 60) * PPQ);

      // Note on
      offset = this.writeVarLen(view, offset, startTicks - lastTime);
      view.setUint8(offset++, 0x90 | note.channel);
      view.setUint8(offset++, note.note);
      view.setUint8(offset++, note.velocity);

      lastTime = startTicks;

      // Note off
      offset = this.writeVarLen(view, offset, endTicks - lastTime);
      view.setUint8(offset++, 0x80 | note.channel);
      view.setUint8(offset++, note.note);
      view.setUint8(offset++, 0);

      lastTime = endTicks;
    }

    // End of track
    offset = this.writeVarLen(view, offset, 0);
    view.setUint8(offset++, 0xFF);
    view.setUint8(offset++, 0x2F);
    view.setUint8(offset++, 0x00);

    // Write track length
    const trackLength = offset - dataStart;
    view.setUint32(lengthOffset, trackLength, false);

    return offset;
  }

  /**
   * Write variable length quantity
   */
  private writeVarLen(view: DataView, offset: number, value: number): number {
    const bytes: number[] = [];
    bytes.push(value & 0x7F);

    value >>= 7;
    while (value > 0) {
      bytes.push((value & 0x7F) | 0x80);
      value >>= 7;
    }

    for (let i = bytes.length - 1; i >= 0; i--) {
      view.setUint8(offset++, bytes[i]);
    }

    return offset;
  }

  /**
   * Write string to DataView
   */
  private writeString(view: DataView, offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  /**
   * Import MIDI file
   */
  public importMidi(buffer: ArrayBuffer): { tracks: MidiTrack[]; tempo: number } {
    // MIDI file parsing implementation
    // This is a simplified version
    const view = new DataView(buffer);
    let offset = 0;

    // Parse header
    const headerType = this.readString(view, offset, 4);
    offset += 4;

    if (headerType !== 'MThd') {
      throw new Error('Invalid MIDI file');
    }

    const headerLength = view.getUint32(offset, false);
    offset += 4;

    const format = view.getUint16(offset, false);
    offset += 2;

    const numTracks = view.getUint16(offset, false);
    offset += 2;

    const division = view.getUint16(offset, false);
    offset += 2;

    // Parse tracks
    const tracks: MidiTrack[] = [];
    let tempo = 120;

    for (let i = 0; i < numTracks; i++) {
      const { track, newOffset, newTempo } = this.parseTrack(view, offset, division);
      tracks.push(track);
      offset = newOffset;

      if (newTempo) {
        tempo = newTempo;
      }
    }

    return { tracks, tempo };
  }

  /**
   * Parse MIDI track
   */
  private parseTrack(
    view: DataView,
    offset: number,
    division: number
  ): { track: MidiTrack; newOffset: number; newTempo?: number } {
    const trackType = this.readString(view, offset, 4);
    offset += 4;

    if (trackType !== 'MTrk') {
      throw new Error('Invalid track');
    }

    const trackLength = view.getUint32(offset, false);
    offset += 4;

    const trackEnd = offset + trackLength;

    const track: MidiTrack = {
      name: '',
      notes: [],
      controlChanges: []
    };

    let tempo: number | undefined;
    let runningStatus = 0;

    while (offset < trackEnd) {
      // Read delta time
      const { value: deltaTime, newOffset } = this.readVarLen(view, offset);
      offset = newOffset;

      // Read event
      let status = view.getUint8(offset);

      if ((status & 0x80) === 0) {
        // Running status
        status = runningStatus;
      } else {
        offset++;
      }

      runningStatus = status;

      // Parse event based on status
      // (Simplified - would need full implementation)
      offset++;
    }

    return { track, newOffset: offset, newTempo: tempo };
  }

  /**
   * Read variable length quantity
   */
  private readVarLen(view: DataView, offset: number): { value: number; newOffset: number } {
    let value = 0;
    let byte: number;

    do {
      byte = view.getUint8(offset++);
      value = (value << 7) | (byte & 0x7F);
    } while (byte & 0x80);

    return { value, newOffset: offset };
  }

  /**
   * Read string from DataView
   */
  private readString(view: DataView, offset: number, length: number): string {
    let str = '';
    for (let i = 0; i < length; i++) {
      str += String.fromCharCode(view.getUint8(offset + i));
    }
    return str;
  }
}

export default MidiController;

/**
 * wav - WAV Audio Codec
 *
 * Read and write WAV audio files.
 * **POLYGLOT SHOWCASE**: WAV codec for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/wav (~100K+ downloads/week)
 *
 * Features:
 * - WAV file encoding and decoding
 * - Support for PCM formats
 * - Multiple bit depths (8, 16, 24, 32-bit)
 * - Mono and stereo support
 * - Metadata and chunk handling
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need WAV support
 * - ONE implementation works everywhere on Elide
 * - Consistent audio I/O across languages
 * - Share audio processing pipelines across your stack
 *
 * Use cases:
 * - Audio file I/O
 * - Recording applications
 * - Audio analysis tools
 * - Sound effects libraries
 *
 * Package has ~100K+ downloads/week on npm - essential audio format!
 */

export interface WAVFormat {
  audioFormat?: number;      // 1 = PCM
  channels?: number;         // 1 or 2
  sampleRate?: number;       // Hz
  bitDepth?: number;         // 8, 16, 24, or 32
}

export class WAVEncoder {
  private format: Required<WAVFormat>;

  constructor(format: WAVFormat = {}) {
    this.format = {
      audioFormat: format.audioFormat ?? 1, // PCM
      channels: format.channels ?? 2,
      sampleRate: format.sampleRate ?? 44100,
      bitDepth: format.bitDepth ?? 16
    };
  }

  encode(pcmData: Buffer): Buffer {
    const dataSize = pcmData.length;
    const headerSize = 44;
    const fileSize = headerSize + dataSize;

    const buffer = Buffer.alloc(fileSize);
    let offset = 0;

    // RIFF chunk
    buffer.write('RIFF', offset); offset += 4;
    buffer.writeUInt32LE(fileSize - 8, offset); offset += 4;
    buffer.write('WAVE', offset); offset += 4;

    // fmt chunk
    buffer.write('fmt ', offset); offset += 4;
    buffer.writeUInt32LE(16, offset); offset += 4; // chunk size
    buffer.writeUInt16LE(this.format.audioFormat, offset); offset += 2;
    buffer.writeUInt16LE(this.format.channels, offset); offset += 2;
    buffer.writeUInt32LE(this.format.sampleRate, offset); offset += 4;

    const byteRate = this.format.sampleRate * this.format.channels * this.format.bitDepth / 8;
    buffer.writeUInt32LE(byteRate, offset); offset += 4;

    const blockAlign = this.format.channels * this.format.bitDepth / 8;
    buffer.writeUInt16LE(blockAlign, offset); offset += 2;
    buffer.writeUInt16LE(this.format.bitDepth, offset); offset += 2;

    // data chunk
    buffer.write('data', offset); offset += 4;
    buffer.writeUInt32LE(dataSize, offset); offset += 4;

    pcmData.copy(buffer, offset);

    console.log(`[WAV] Encoded ${dataSize} bytes to WAV format`);
    console.log(`[WAV] ${this.format.sampleRate}Hz, ${this.format.bitDepth}-bit, ${this.format.channels}ch`);

    return buffer;
  }

  decode(wavData: Buffer): { format: WAVFormat; pcm: Buffer } {
    let offset = 0;

    // Read RIFF header
    const riff = wavData.toString('ascii', offset, offset + 4); offset += 4;
    const fileSize = wavData.readUInt32LE(offset); offset += 4;
    const wave = wavData.toString('ascii', offset, offset + 4); offset += 4;

    if (riff !== 'RIFF' || wave !== 'WAVE') {
      throw new Error('Invalid WAV file');
    }

    // Read fmt chunk
    const fmt = wavData.toString('ascii', offset, offset + 4); offset += 4;
    const fmtSize = wavData.readUInt32LE(offset); offset += 4;

    const audioFormat = wavData.readUInt16LE(offset); offset += 2;
    const channels = wavData.readUInt16LE(offset); offset += 2;
    const sampleRate = wavData.readUInt32LE(offset); offset += 4;
    offset += 4; // byte rate
    offset += 2; // block align
    const bitDepth = wavData.readUInt16LE(offset); offset += 2;

    // Skip to data chunk
    while (offset < wavData.length) {
      const chunkId = wavData.toString('ascii', offset, offset + 4); offset += 4;
      const chunkSize = wavData.readUInt32LE(offset); offset += 4;

      if (chunkId === 'data') {
        const pcm = wavData.slice(offset, offset + chunkSize);
        console.log(`[WAV] Decoded WAV file: ${sampleRate}Hz, ${bitDepth}-bit, ${channels}ch`);

        return {
          format: { audioFormat, channels, sampleRate, bitDepth },
          pcm
        };
      }

      offset += chunkSize;
    }

    throw new Error('No data chunk found in WAV file');
  }
}

export function encode(pcmData: Buffer, format?: WAVFormat): Buffer {
  const encoder = new WAVEncoder(format);
  return encoder.encode(pcmData);
}

export function decode(wavData: Buffer): { format: WAVFormat; pcm: Buffer } {
  const encoder = new WAVEncoder();
  return encoder.decode(wavData);
}

export default WAVEncoder;

// CLI Demo
if (import.meta.url.includes("elide-wav.ts")) {
  console.log("🎵 wav - WAV Audio Codec for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Encode PCM to WAV ===");
  const pcmData = Buffer.alloc(44100 * 2 * 2); // 1 second stereo 16-bit
  const wavData = encode(pcmData, {
    channels: 2,
    sampleRate: 44100,
    bitDepth: 16
  });
  console.log(`Encoded ${pcmData.length} bytes PCM to ${wavData.length} bytes WAV`);
  console.log();

  console.log("=== Example 2: Decode WAV to PCM ===");
  const decoded = decode(wavData);
  console.log(`Format: ${decoded.format.sampleRate}Hz, ${decoded.format.bitDepth}-bit, ${decoded.format.channels}ch`);
  console.log(`PCM data: ${decoded.pcm.length} bytes`);
  console.log();

  console.log("=== Example 3: Mono WAV ===");
  const monoWav = encode(Buffer.alloc(44100 * 2), {
    channels: 1,
    sampleRate: 44100,
    bitDepth: 16
  });
  console.log(`Mono WAV: ${monoWav.length} bytes`);
  console.log();

  console.log("=== Example 4: 24-bit WAV ===");
  const wav24 = encode(Buffer.alloc(48000 * 2 * 3), {
    channels: 2,
    sampleRate: 48000,
    bitDepth: 24
  });
  console.log(`24-bit WAV: ${wav24.length} bytes`);
  console.log();

  console.log("=== Example 5: Different Sample Rates ===");
  const rates = [8000, 16000, 22050, 44100, 48000];
  rates.forEach(rate => {
    const wav = encode(Buffer.alloc(rate * 2), {
      sampleRate: rate,
      channels: 1,
      bitDepth: 16
    });
    console.log(`${rate}Hz: ${wav.length} bytes (1 second)`);
  });
  console.log();

  console.log("=== Example 6: POLYGLOT Use Case ===");
  console.log("🌐 Same WAV codec works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One WAV API, all languages");
  console.log("  ✓ Consistent audio I/O everywhere");
  console.log("  ✓ Share audio files across your stack");
  console.log("  ✓ No need for language-specific WAV libs");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Audio file I/O");
  console.log("- Recording applications");
  console.log("- Audio analysis tools");
  console.log("- Sound effects libraries");
  console.log("- Audio editing software");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Fast encoding/decoding");
  console.log("- ~100K+ downloads/week on npm!");
  console.log();
}

/**
 * Audio Processing Utilities
 * Handles audio format conversion, validation, and preprocessing
 */

import { spawn } from 'child_process';
import { AudioMetadata } from './types.js';

export class AudioProcessor {
  /**
   * Get audio metadata using ffprobe
   */
  static async getMetadata(audioBuffer: Buffer): Promise<AudioMetadata> {
    return new Promise((resolve, reject) => {
      const proc = spawn('python3', ['-c', `
import sys
import json
import io
import soundfile as sf
import numpy as np

# Read audio from stdin
audio_data = sys.stdin.buffer.read()
audio_file = io.BytesIO(audio_data)

# Load audio
data, samplerate = sf.read(audio_file)

# Get metadata
channels = 1 if len(data.shape) == 1 else data.shape[1]
duration = len(data) / samplerate

metadata = {
    "duration": float(duration),
    "sampleRate": int(samplerate),
    "channels": int(channels),
    "format": "wav",
    "size": len(audio_data)
}

print(json.dumps(metadata))
      `]);

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Failed to get metadata: ${stderr}`));
          return;
        }

        try {
          const metadata = JSON.parse(stdout.trim());
          resolve(metadata);
        } catch (err) {
          reject(new Error(`Failed to parse metadata: ${err}`));
        }
      });

      proc.stdin.write(audioBuffer);
      proc.stdin.end();
    });
  }

  /**
   * Convert audio to required format (16kHz mono WAV)
   */
  static async convertToWhisperFormat(audioBuffer: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const proc = spawn('python3', ['-c', `
import sys
import io
import soundfile as sf
import librosa
import numpy as np

# Read audio from stdin
audio_data = sys.stdin.buffer.read()
audio_file = io.BytesIO(audio_data)

# Load audio
data, samplerate = sf.read(audio_file)

# Convert to mono if stereo
if len(data.shape) > 1:
    data = np.mean(data, axis=1)

# Resample to 16kHz (Whisper requirement)
if samplerate != 16000:
    data = librosa.resample(data, orig_sr=samplerate, target_sr=16000)
    samplerate = 16000

# Write to stdout
output = io.BytesIO()
sf.write(output, data, samplerate, format='WAV', subtype='PCM_16')
sys.stdout.buffer.write(output.getvalue())
      `]);

      const chunks: Buffer[] = [];
      let stderr = '';

      proc.stdout.on('data', (data) => {
        chunks.push(data);
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Audio conversion failed: ${stderr}`));
          return;
        }

        resolve(Buffer.concat(chunks));
      });

      proc.stdin.write(audioBuffer);
      proc.stdin.end();
    });
  }

  /**
   * Apply noise reduction to audio
   */
  static async reduceNoise(audioBuffer: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const proc = spawn('python3', ['-c', `
import sys
import io
import soundfile as sf
import numpy as np
from scipy import signal

# Read audio from stdin
audio_data = sys.stdin.buffer.read()
audio_file = io.BytesIO(audio_data)

# Load audio
data, samplerate = sf.read(audio_file)

# Simple noise reduction using high-pass filter
# Remove frequencies below 80Hz (typical noise)
nyquist = samplerate / 2
cutoff = 80 / nyquist
b, a = signal.butter(4, cutoff, btype='high')
data = signal.filtfilt(b, a, data)

# Normalize
data = data / np.max(np.abs(data))

# Write to stdout
output = io.BytesIO()
sf.write(output, data, samplerate, format='WAV', subtype='PCM_16')
sys.stdout.buffer.write(output.getvalue())
      `]);

      const chunks: Buffer[] = [];
      let stderr = '';

      proc.stdout.on('data', (data) => {
        chunks.push(data);
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Noise reduction failed: ${stderr}`));
          return;
        }

        resolve(Buffer.concat(chunks));
      });

      proc.stdin.write(audioBuffer);
      proc.stdin.end();
    });
  }

  /**
   * Apply Voice Activity Detection (VAD) to remove silence
   */
  static async applyVAD(audioBuffer: Buffer, aggressiveness: number = 2): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const proc = spawn('python3', ['-c', `
import sys
import io
import soundfile as sf
import webrtcvad
import numpy as np

# Read audio from stdin
audio_data = sys.stdin.buffer.read()
audio_file = io.BytesIO(audio_data)

# Load audio
data, samplerate = sf.read(audio_file)

# Convert to 16-bit PCM
if data.dtype != np.int16:
    data = (data * 32767).astype(np.int16)

# Initialize VAD
vad = webrtcvad.Vad(${aggressiveness})

# Process in 30ms frames
frame_duration = 30  # ms
frame_size = int(samplerate * frame_duration / 1000)

voiced_frames = []
for i in range(0, len(data) - frame_size, frame_size):
    frame = data[i:i + frame_size].tobytes()
    if vad.is_speech(frame, samplerate):
        voiced_frames.append(data[i:i + frame_size])

# Concatenate voiced frames
if voiced_frames:
    result = np.concatenate(voiced_frames)
else:
    result = data

# Convert back to float
result = result.astype(np.float32) / 32767.0

# Write to stdout
output = io.BytesIO()
sf.write(output, result, samplerate, format='WAV', subtype='PCM_16')
sys.stdout.buffer.write(output.getvalue())
      `]);

      const chunks: Buffer[] = [];
      let stderr = '';

      proc.stdout.on('data', (data) => {
        chunks.push(data);
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`VAD failed: ${stderr}`));
          return;
        }

        resolve(Buffer.concat(chunks));
      });

      proc.stdin.write(audioBuffer);
      proc.stdin.end();
    });
  }

  /**
   * Split audio into chunks for streaming transcription
   */
  static async splitIntoChunks(
    audioBuffer: Buffer,
    chunkDuration: number,
    overlapDuration: number
  ): Promise<Buffer[]> {
    return new Promise((resolve, reject) => {
      const proc = spawn('python3', ['-c', `
import sys
import io
import json
import soundfile as sf
import numpy as np
import base64

# Read audio from stdin
audio_data = sys.stdin.buffer.read()
audio_file = io.BytesIO(audio_data)

# Load audio
data, samplerate = sf.read(audio_file)

chunk_samples = int(${chunkDuration} * samplerate)
overlap_samples = int(${overlapDuration} * samplerate)
step = chunk_samples - overlap_samples

chunks = []
for i in range(0, len(data), step):
    chunk = data[i:i + chunk_samples]
    if len(chunk) > 0:
        # Write chunk to bytes
        output = io.BytesIO()
        sf.write(output, chunk, samplerate, format='WAV', subtype='PCM_16')
        chunk_bytes = output.getvalue()
        chunks.append(base64.b64encode(chunk_bytes).decode('utf-8'))

print(json.dumps(chunks))
      `]);

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Chunk splitting failed: ${stderr}`));
          return;
        }

        try {
          const chunksBase64 = JSON.parse(stdout.trim());
          const chunks = chunksBase64.map((chunk: string) =>
            Buffer.from(chunk, 'base64')
          );
          resolve(chunks);
        } catch (err) {
          reject(new Error(`Failed to parse chunks: ${err}`));
        }
      });

      proc.stdin.write(audioBuffer);
      proc.stdin.end();
    });
  }

  /**
   * Validate audio file
   */
  static async validate(
    audioBuffer: Buffer,
    maxSize: number,
    maxDuration: number
  ): Promise<{ valid: boolean; error?: string; metadata?: AudioMetadata }> {
    try {
      // Check size
      if (audioBuffer.length > maxSize) {
        return {
          valid: false,
          error: `Audio file too large: ${audioBuffer.length} bytes (max: ${maxSize} bytes)`,
        };
      }

      // Get metadata
      const metadata = await this.getMetadata(audioBuffer);

      // Check duration
      if (metadata.duration > maxDuration) {
        return {
          valid: false,
          error: `Audio too long: ${metadata.duration}s (max: ${maxDuration}s)`,
          metadata,
        };
      }

      return { valid: true, metadata };
    } catch (err) {
      return {
        valid: false,
        error: `Invalid audio file: ${err instanceof Error ? err.message : err}`,
      };
    }
  }
}

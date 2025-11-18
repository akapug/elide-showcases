/**
 * TypeScript-Python Bridge for Transcription
 * Handles communication with Python Whisper and Diarization processes
 */

import { spawn } from 'child_process';
import { TranscriptionResult, TranscriptionRequest, DiarizationResult } from '../shared/types.js';
import logger from '../shared/logger.js';

export class TranscriptionBridge {
  private modelSize: string;
  private device: string;
  private computeType: string;
  private useFaster: boolean;
  private hfToken?: string;

  constructor(config: {
    modelSize?: string;
    device?: string;
    computeType?: string;
    useFaster?: boolean;
    hfToken?: string;
  } = {}) {
    this.modelSize = config.modelSize || process.env.WHISPER_MODEL || 'base';
    this.device = config.device || process.env.WHISPER_DEVICE || 'cpu';
    this.computeType = config.computeType || process.env.WHISPER_COMPUTE_TYPE || 'int8';
    this.useFaster = config.useFaster ?? (process.env.USE_FASTER_WHISPER === 'true');
    this.hfToken = config.hfToken || process.env.HF_TOKEN;
  }

  /**
   * Transcribe audio buffer
   */
  async transcribe(
    audioBuffer: Buffer,
    request: TranscriptionRequest
  ): Promise<TranscriptionResult> {
    const jobId = this.generateJobId();
    const startTime = Date.now();

    logger.info('Starting transcription', {
      jobId,
      audioSize: audioBuffer.length,
      language: request.language || 'auto',
      model: this.modelSize,
    });

    try {
      // Prepare config
      const config = {
        model: this.modelSize,
        device: this.device,
        computeType: this.computeType,
        useFaster: this.useFaster,
        language: request.language,
        enableTimestamps: request.enableTimestamps ?? true,
        enableWordTimestamps: request.enableWordTimestamps ?? false,
        temperature: request.temperature ?? 0.0,
      };

      // Run transcription
      const transcriptionResult = await this.runPythonProcess(
        'transcription/whisper_transcriber.py',
        'transcribe',
        config,
        audioBuffer
      );

      if (!transcriptionResult.success) {
        throw new Error(transcriptionResult.error || 'Transcription failed');
      }

      const result = transcriptionResult.result;

      // Run diarization if requested
      let speakers;
      if (request.enableDiarization) {
        logger.info('Running speaker diarization', { jobId });

        const diarizationResult = await this.diarize(audioBuffer, {
          minSpeakers: request.minSpeakers || 1,
          maxSpeakers: request.maxSpeakers || 10,
        });

        if (diarizationResult) {
          speakers = diarizationResult.speakers;

          // Align transcription with diarization
          const alignedSegments = await this.alignSegments(
            diarizationResult,
            result
          );

          if (alignedSegments) {
            result.segments = alignedSegments;
          }
        }
      }

      // Calculate audio duration
      const audioDuration = result.duration || 0;

      // Build final result
      const transcriptionOutput: TranscriptionResult = {
        success: true,
        jobId,
        text: result.text,
        segments: result.segments,
        language: result.language,
        duration: audioDuration,
        speakers,
        metadata: {
          model: this.modelSize,
          processingTime: result.performance.processingTime,
          audioSize: audioBuffer.length,
          sampleRate: 16000,
          channels: 1,
          format: 'wav',
          timestamp: new Date().toISOString(),
        },
        performance: {
          realTimeFactor: result.performance.realTimeFactor,
          throughput: result.performance.throughput,
          memoryUsed: process.memoryUsage().heapUsed,
        },
      };

      logger.info('Transcription completed', {
        jobId,
        duration: audioDuration,
        segments: result.segments.length,
        processingTime: result.performance.processingTime,
        rtf: result.performance.realTimeFactor,
      });

      return transcriptionOutput;
    } catch (error) {
      logger.error('Transcription failed', {
        jobId,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Transcribe streaming audio chunk
   */
  async transcribeStreaming(
    audioChunk: Buffer,
    config: { language?: string; context?: string }
  ): Promise<{ text: string; isFinal: boolean; confidence: number }> {
    const pythonConfig = {
      model: this.modelSize,
      device: this.device,
      computeType: this.computeType,
      useFaster: this.useFaster,
      language: config.language,
      context: config.context,
    };

    const result = await this.runPythonProcess(
      'transcription/whisper_transcriber.py',
      'streaming',
      pythonConfig,
      audioChunk
    );

    if (!result.success) {
      throw new Error(result.error || 'Streaming transcription failed');
    }

    return result.result;
  }

  /**
   * Perform speaker diarization
   */
  async diarize(
    audioBuffer: Buffer,
    config: { minSpeakers: number; maxSpeakers: number }
  ): Promise<DiarizationResult | null> {
    try {
      const diarizationConfig = {
        hfToken: this.hfToken,
        device: this.device,
        minSpeakers: config.minSpeakers,
        maxSpeakers: config.maxSpeakers,
      };

      const result = await this.runPythonProcess(
        'transcription/speaker_diarizer.py',
        'diarize',
        diarizationConfig,
        audioBuffer
      );

      if (!result.success) {
        logger.warn('Diarization failed, continuing without speaker labels', {
          error: result.error,
        });
        return null;
      }

      return result.result;
    } catch (error) {
      logger.warn('Diarization error', {
        error: error instanceof Error ? error.message : error,
      });
      return null;
    }
  }

  /**
   * Align transcription segments with speaker diarization
   */
  private async alignSegments(
    diarization: DiarizationResult,
    transcription: any
  ): Promise<any[]> {
    try {
      const alignConfig = {
        diarization,
        transcription,
      };

      const result = await this.runPythonProcess(
        'transcription/speaker_diarizer.py',
        'align',
        alignConfig,
        Buffer.from('')
      );

      if (!result.success) {
        return transcription.segments;
      }

      return result.result;
    } catch (error) {
      logger.warn('Alignment failed', {
        error: error instanceof Error ? error.message : error,
      });
      return transcription.segments;
    }
  }

  /**
   * Run Python process and handle I/O
   */
  private async runPythonProcess(
    scriptPath: string,
    command: string,
    config: any,
    audioBuffer: Buffer
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const proc = spawn('python3', [scriptPath, command, JSON.stringify(config)]);

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
          reject(new Error(`Python process exited with code ${code}: ${stderr}`));
          return;
        }

        try {
          const result = JSON.parse(stdout.trim());
          resolve(result);
        } catch (err) {
          reject(new Error(`Failed to parse Python output: ${err}\nOutput: ${stdout}`));
        }
      });

      proc.on('error', (err) => {
        reject(new Error(`Failed to spawn Python process: ${err.message}`));
      });

      // Write audio data to stdin
      if (audioBuffer.length > 0) {
        proc.stdin.write(audioBuffer);
      }
      proc.stdin.end();
    });
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

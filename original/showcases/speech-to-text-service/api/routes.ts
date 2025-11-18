/**
 * API Routes
 * Defines HTTP endpoints for transcription operations
 */

import { Router, Request, Response } from 'express';
import { TranscriptionBridge } from '../transcription/bridge.js';
import { AudioProcessor } from '../shared/audio-processor.js';
import { TranscriptionRequest, ServiceMetrics } from '../shared/types.js';
import logger from '../shared/logger.js';

const MAX_AUDIO_SIZE = parseInt(process.env.MAX_AUDIO_SIZE || '104857600');
const MAX_AUDIO_DURATION = parseInt(process.env.MAX_AUDIO_DURATION || '3600');

// Job storage (in production, use Redis or database)
const jobs = new Map<string, any>();

// Metrics
const metrics: ServiceMetrics = {
  totalJobs: 0,
  activeJobs: 0,
  completedJobs: 0,
  failedJobs: 0,
  avgProcessingTime: 0,
  avgRealTimeFactor: 0,
  uptime: 0,
  memoryUsage: {
    rss: 0,
    heapUsed: 0,
    heapTotal: 0,
  },
};

export function routes(upload: any): Router {
  const router = Router();
  const bridge = new TranscriptionBridge();

  /**
   * POST /transcribe
   * Transcribe an audio file
   */
  router.post('/transcribe', upload.single('audio'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No audio file provided',
        });
      }

      const audioBuffer = req.file.buffer;

      // Validate audio
      const validation = await AudioProcessor.validate(
        audioBuffer,
        MAX_AUDIO_SIZE,
        MAX_AUDIO_DURATION
      );

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error,
        });
      }

      // Parse request options
      const request: TranscriptionRequest = {
        audioBuffer,
        language: req.body.language || 'auto',
        model: req.body.model,
        enableDiarization: req.body.enableDiarization === 'true',
        minSpeakers: parseInt(req.body.minSpeakers || '1'),
        maxSpeakers: parseInt(req.body.maxSpeakers || '10'),
        enableTimestamps: req.body.enableTimestamps !== 'false',
        enableWordTimestamps: req.body.enableWordTimestamps === 'true',
        noiseReduction: req.body.noiseReduction === 'true',
        vadFilter: req.body.vadFilter === 'true',
        temperature: parseFloat(req.body.temperature || '0.0'),
      };

      // Preprocess audio if requested
      let processedAudio = audioBuffer;

      if (request.noiseReduction) {
        logger.info('Applying noise reduction');
        processedAudio = await AudioProcessor.reduceNoise(processedAudio);
      }

      if (request.vadFilter) {
        logger.info('Applying VAD filter');
        processedAudio = await AudioProcessor.applyVAD(processedAudio);
      }

      // Convert to Whisper format
      processedAudio = await AudioProcessor.convertToWhisperFormat(processedAudio);

      // Update metrics
      metrics.totalJobs++;
      metrics.activeJobs++;

      const startTime = Date.now();

      // Transcribe
      const result = await bridge.transcribe(processedAudio, request);

      // Update metrics
      const processingTime = Date.now() - startTime;
      metrics.activeJobs--;
      metrics.completedJobs++;
      metrics.avgProcessingTime =
        (metrics.avgProcessingTime * (metrics.completedJobs - 1) + processingTime) /
        metrics.completedJobs;

      if (result.performance) {
        metrics.avgRealTimeFactor =
          (metrics.avgRealTimeFactor * (metrics.completedJobs - 1) +
            result.performance.realTimeFactor) /
          metrics.completedJobs;
      }

      // Store job
      jobs.set(result.jobId, {
        jobId: result.jobId,
        status: 'completed',
        result,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      res.json(result);
    } catch (error) {
      metrics.activeJobs--;
      metrics.failedJobs++;

      logger.error('Transcription request failed', {
        error: error instanceof Error ? error.message : error,
      });

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Transcription failed',
      });
    }
  });

  /**
   * POST /transcribe/url
   * Transcribe audio from URL
   */
  router.post('/transcribe/url', async (req: Request, res: Response) => {
    try {
      const { url, ...options } = req.body;

      if (!url) {
        return res.status(400).json({
          success: false,
          error: 'No URL provided',
        });
      }

      // Download audio from URL
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download audio: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuffer);

      // Validate and process
      const validation = await AudioProcessor.validate(
        audioBuffer,
        MAX_AUDIO_SIZE,
        MAX_AUDIO_DURATION
      );

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error,
        });
      }

      // Convert to Whisper format
      const processedAudio = await AudioProcessor.convertToWhisperFormat(audioBuffer);

      // Transcribe
      const request: TranscriptionRequest = {
        audioBuffer: processedAudio,
        ...options,
      };

      metrics.totalJobs++;
      metrics.activeJobs++;

      const result = await bridge.transcribe(processedAudio, request);

      metrics.activeJobs--;
      metrics.completedJobs++;

      res.json(result);
    } catch (error) {
      metrics.activeJobs--;
      metrics.failedJobs++;

      logger.error('URL transcription failed', {
        error: error instanceof Error ? error.message : error,
      });

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Transcription failed',
      });
    }
  });

  /**
   * GET /jobs/:jobId
   * Get job status
   */
  router.get('/jobs/:jobId', (req: Request, res: Response) => {
    const { jobId } = req.params;
    const job = jobs.get(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    res.json(job);
  });

  /**
   * GET /metrics
   * Get service metrics
   */
  router.get('/metrics', (req: Request, res: Response) => {
    const memUsage = process.memoryUsage();

    const currentMetrics: ServiceMetrics = {
      ...metrics,
      uptime: process.uptime(),
      memoryUsage: {
        rss: memUsage.rss,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
      },
    };

    res.json(currentMetrics);
  });

  /**
   * GET /models
   * List available models
   */
  router.get('/models', (req: Request, res: Response) => {
    res.json({
      models: [
        {
          name: 'tiny',
          size: '39M',
          english: true,
          multilingual: false,
          speed: 'fastest',
          accuracy: 'lowest',
        },
        {
          name: 'base',
          size: '74M',
          english: true,
          multilingual: false,
          speed: 'fast',
          accuracy: 'good',
        },
        {
          name: 'small',
          size: '244M',
          english: true,
          multilingual: false,
          speed: 'medium',
          accuracy: 'better',
        },
        {
          name: 'medium',
          size: '769M',
          english: true,
          multilingual: false,
          speed: 'slow',
          accuracy: 'excellent',
        },
        {
          name: 'large',
          size: '1550M',
          english: false,
          multilingual: true,
          speed: 'slowest',
          accuracy: 'best',
        },
      ],
      currentModel: process.env.WHISPER_MODEL || 'base',
    });
  });

  /**
   * GET /languages
   * List supported languages
   */
  router.get('/languages', (req: Request, res: Response) => {
    res.json({
      languages: [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'it', name: 'Italian' },
        { code: 'pt', name: 'Portuguese' },
        { code: 'ru', name: 'Russian' },
        { code: 'zh', name: 'Chinese' },
        { code: 'ja', name: 'Japanese' },
        { code: 'ko', name: 'Korean' },
        { code: 'ar', name: 'Arabic' },
        { code: 'hi', name: 'Hindi' },
        { code: 'nl', name: 'Dutch' },
        { code: 'pl', name: 'Polish' },
        { code: 'tr', name: 'Turkish' },
      ],
      autoDetect: true,
    });
  });

  return router;
}

export { metrics };

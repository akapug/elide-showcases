/**
 * Shared Types for Speech-to-Text Service
 */

export interface TranscriptionSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  confidence?: number;
  words?: Word[];
  speaker?: string;
  language?: string;
}

export interface Word {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface Speaker {
  id: string;
  name: string;
  segments: number[];
  totalDuration: number;
  speakingTime: number;
}

export interface TranscriptionResult {
  success: boolean;
  jobId: string;
  text: string;
  segments: TranscriptionSegment[];
  language: string;
  duration: number;
  speakers?: Speaker[];
  metadata: {
    model: string;
    processingTime: number;
    audioSize: number;
    sampleRate: number;
    channels: number;
    format: string;
    timestamp: string;
  };
  performance?: {
    realTimeFactor: number;
    throughput: number;
    memoryUsed: number;
  };
}

export interface StreamingChunk {
  chunkId: number;
  text: string;
  isFinal: boolean;
  start: number;
  end: number;
  confidence?: number;
  speaker?: string;
}

export interface TranscriptionRequest {
  audioBuffer?: Buffer;
  audioUrl?: string;
  language?: string;
  model?: string;
  enableDiarization?: boolean;
  minSpeakers?: number;
  maxSpeakers?: number;
  enableTimestamps?: boolean;
  enableWordTimestamps?: boolean;
  noiseReduction?: boolean;
  vadFilter?: boolean;
  temperature?: number;
  compressionRatio?: number;
}

export interface StreamingConfig {
  chunkDuration: number;
  overlapDuration: number;
  sampleRate: number;
  language?: string;
  enableDiarization: boolean;
}

export interface AudioMetadata {
  duration: number;
  sampleRate: number;
  channels: number;
  format: string;
  bitrate?: number;
  size: number;
}

export interface DiarizationResult {
  speakers: Speaker[];
  segments: Array<{
    start: number;
    end: number;
    speaker: string;
  }>;
  totalSpeakers: number;
}

export interface JobStatus {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: TranscriptionResult;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceMetrics {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  failedJobs: number;
  avgProcessingTime: number;
  avgRealTimeFactor: number;
  uptime: number;
  memoryUsage: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
  };
}

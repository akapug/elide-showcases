/**
 * Shared types for embeddings service
 */

export interface EmbeddingRequest {
  texts?: string[];
  images?: string[]; // Base64 encoded or URLs
  model?: string;
  normalize?: boolean;
}

export interface EmbeddingResponse {
  embeddings: number[][];
  model: string;
  dimensions: number;
  processingTime: number;
  cached: boolean;
}

export interface SimilarityRequest {
  query: number[];
  candidates: number[][];
  topK?: number;
  threshold?: number;
}

export interface SimilarityResult {
  index: number;
  score: number;
  distance?: number;
}

export interface SimilarityResponse {
  results: SimilarityResult[];
  processingTime: number;
}

export interface BatchEmbeddingRequest {
  items: Array<{ text?: string; image?: string }>;
  model?: string;
  batchSize?: number;
}

export interface BatchEmbeddingResponse {
  embeddings: number[][];
  model: string;
  totalItems: number;
  batchesProcessed: number;
  totalTime: number;
  avgTimePerItem: number;
}

export interface CacheStats {
  size: number;
  maxSize: number;
  hitRate: number;
  hits: number;
  misses: number;
}

export interface HealthCheck {
  status: string;
  uptime: number;
  models: {
    text: string;
    image: string;
  };
  cache: CacheStats;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

export type EmbeddingType = 'text' | 'image';
export type SimilarityMetric = 'cosine' | 'euclidean' | 'dot';

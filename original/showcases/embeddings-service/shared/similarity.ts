/**
 * Similarity search utilities
 */

import { SimilarityMetric, SimilarityResult } from './types';

export class SimilaritySearch {
  /**
   * Compute cosine similarity between two vectors
   */
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Compute euclidean distance between two vectors
   */
  static euclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  /**
   * Compute dot product between two vectors
   */
  static dotProduct(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += a[i] * b[i];
    }

    return sum;
  }

  /**
   * Find top K similar vectors
   */
  static findTopK(
    query: number[],
    candidates: number[][],
    k: number = 10,
    metric: SimilarityMetric = 'cosine'
  ): SimilarityResult[] {
    const results: SimilarityResult[] = [];

    for (let i = 0; i < candidates.length; i++) {
      let score: number;
      let distance: number | undefined;

      switch (metric) {
        case 'cosine':
          score = this.cosineSimilarity(query, candidates[i]);
          break;
        case 'euclidean':
          distance = this.euclideanDistance(query, candidates[i]);
          score = 1 / (1 + distance); // Convert to similarity score
          break;
        case 'dot':
          score = this.dotProduct(query, candidates[i]);
          break;
        default:
          score = this.cosineSimilarity(query, candidates[i]);
      }

      results.push({ index: i, score, distance });
    }

    // Sort by score (descending)
    results.sort((a, b) => b.score - a.score);

    // Return top K
    return results.slice(0, k);
  }

  /**
   * Find all vectors above similarity threshold
   */
  static findAboveThreshold(
    query: number[],
    candidates: number[][],
    threshold: number = 0.7,
    metric: SimilarityMetric = 'cosine'
  ): SimilarityResult[] {
    const results: SimilarityResult[] = [];

    for (let i = 0; i < candidates.length; i++) {
      let score: number;

      switch (metric) {
        case 'cosine':
          score = this.cosineSimilarity(query, candidates[i]);
          break;
        case 'euclidean':
          const distance = this.euclideanDistance(query, candidates[i]);
          score = 1 / (1 + distance);
          break;
        case 'dot':
          score = this.dotProduct(query, candidates[i]);
          break;
        default:
          score = this.cosineSimilarity(query, candidates[i]);
      }

      if (score >= threshold) {
        results.push({ index: i, score });
      }
    }

    // Sort by score (descending)
    results.sort((a, b) => b.score - a.score);

    return results;
  }

  /**
   * Normalize vector to unit length
   */
  static normalize(vector: number[]): number[] {
    let norm = 0;
    for (let i = 0; i < vector.length; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm);

    return vector.map(v => v / norm);
  }

  /**
   * Batch normalize vectors
   */
  static batchNormalize(vectors: number[][]): number[][] {
    return vectors.map(v => this.normalize(v));
  }
}

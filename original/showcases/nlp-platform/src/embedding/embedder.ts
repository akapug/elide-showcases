/**
 * Text Embedding module using sentence-transformers via Elide polyglot
 * Demonstrates semantic embeddings for similarity and search
 */

// @ts-ignore - Elide polyglot import
import transformers from 'python:transformers';
// @ts-ignore - Elide polyglot import
import sentence_transformers from 'python:sentence_transformers';
// @ts-ignore - Elide polyglot import
import numpy from 'python:numpy';

import {
  Embedding,
  EmbeddingResult,
  BatchEmbeddingResult,
  EmbedderConfig,
  SimilarityResult,
  ClusteringResult,
  BatchOptions,
  InvalidInputError
} from '../types';

/**
 * Text Embedder for semantic embeddings
 *
 * Uses sentence-transformers to generate dense vector representations
 *
 * @example
 * ```typescript
 * const embedder = new Embedder('all-MiniLM-L6-v2');
 * const embedding = await embedder.embedSingle("Hello world");
 * console.log(embedding.length); // 384
 * ```
 */
export class Embedder {
  private model: any;
  private config: EmbedderConfig;
  private modelName: string;
  private loaded: boolean = false;

  /**
   * Create a new Embedder instance
   *
   * @param modelName - Sentence transformer model name
   * @param config - Optional configuration
   */
  constructor(
    modelName: string = 'sentence-transformers/all-MiniLM-L6-v2',
    config: EmbedderConfig = {}
  ) {
    this.modelName = modelName;
    this.config = {
      device: 'cpu',
      cache: true,
      verbose: false,
      normalize: true,
      pooling: 'mean',
      convertToNumpy: true,
      ...config
    };
  }

  /**
   * Load the embedding model
   */
  private async load(): Promise<void> {
    if (this.loaded) return;

    const startTime = Date.now();

    try {
      // Load sentence-transformer model from Python
      this.model = sentence_transformers.SentenceTransformer(this.modelName);

      // Move to device
      if (this.config.device === 'cuda') {
        this.model = this.model.to('cuda');
      }

      this.loaded = true;

      if (this.config.verbose) {
        const loadTime = Date.now() - startTime;
        console.log(`Embedder loaded in ${loadTime}ms`);
      }
    } catch (error) {
      throw new Error(`Failed to load embedder: ${error}`);
    }
  }

  /**
   * Embed a single text
   *
   * @param text - Text to embed
   * @returns Embedding result
   */
  async embedSingle(text: string): Promise<Embedding> {
    if (!text || text.trim().length === 0) {
      throw new InvalidInputError('Text cannot be empty');
    }

    await this.load();

    try {
      // Generate embedding
      const embedding = this.model.encode(
        text,
        {
          normalize_embeddings: this.config.normalize,
          convert_to_numpy: this.config.convertToNumpy
        }
      );

      // Convert to JavaScript array
      return this.toArray(embedding);
    } catch (error) {
      throw new Error(`Embedding failed: ${error}`);
    }
  }

  /**
   * Embed multiple texts
   *
   * @param texts - Texts to embed
   * @param options - Batch options
   * @returns Batch embedding result
   */
  async embed(
    texts: string[],
    options: BatchOptions = {}
  ): Promise<Embedding[]> {
    if (!texts || texts.length === 0) {
      throw new InvalidInputError('Texts array cannot be empty');
    }

    await this.load();

    const startTime = Date.now();
    const batchSize = options.batchSize || 32;

    try {
      if (options.showProgress) {
        console.log(`Embedding ${texts.length} texts...`);
      }

      // Embed all texts in batches
      const embeddings = this.model.encode(
        texts,
        {
          batch_size: batchSize,
          normalize_embeddings: this.config.normalize,
          convert_to_numpy: this.config.convertToNumpy,
          show_progress_bar: options.showProgress || false
        }
      );

      // Convert to JavaScript arrays
      const result = this.toArrayBatch(embeddings);

      const totalTime = Date.now() - startTime;

      if (this.config.verbose) {
        console.log(`Embedded ${texts.length} texts in ${totalTime}ms`);
        console.log(`Throughput: ${(texts.length / totalTime * 1000).toFixed(2)} texts/sec`);
      }

      return result;
    } catch (error) {
      throw new Error(`Batch embedding failed: ${error}`);
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   *
   * @param embedding1 - First embedding
   * @param embedding2 - Second embedding
   * @returns Similarity score (0-1)
   */
  async cosineSimilarity(
    embedding1: Embedding,
    embedding2: Embedding
  ): Promise<number> {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have same dimension');
    }

    // Calculate dot product
    let dotProduct = 0;
    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
    }

    // If embeddings are normalized, dot product is cosine similarity
    if (this.config.normalize) {
      return dotProduct;
    }

    // Otherwise, normalize
    const norm1 = Math.sqrt(embedding1.reduce((sum, val) => sum + val * val, 0));
    const norm2 = Math.sqrt(embedding2.reduce((sum, val) => sum + val * val, 0));

    return dotProduct / (norm1 * norm2);
  }

  /**
   * Calculate similarity between two texts
   *
   * @param text1 - First text
   * @param text2 - Second text
   * @returns Similarity result
   */
  async similarity(
    text1: string,
    text2: string
  ): Promise<SimilarityResult> {
    const [embedding1, embedding2] = await Promise.all([
      this.embedSingle(text1),
      this.embedSingle(text2)
    ]);

    const score = await this.cosineSimilarity(embedding1, embedding2);

    return {
      score,
      metric: 'cosine',
      text1,
      text2
    };
  }

  /**
   * Find most similar texts
   *
   * @param query - Query text
   * @param candidates - Candidate texts
   * @param topK - Number of results to return
   * @returns Top K most similar texts with scores
   */
  async findMostSimilar(
    query: string,
    candidates: string[],
    topK: number = 5
  ): Promise<Array<{ text: string; score: number; index: number }>> {
    const queryEmbedding = await this.embedSingle(query);
    const candidateEmbeddings = await this.embed(candidates);

    const similarities = await Promise.all(
      candidateEmbeddings.map((emb, idx) =>
        this.cosineSimilarity(queryEmbedding, emb).then(score => ({
          text: candidates[idx],
          score,
          index: idx
        }))
      )
    );

    return similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Semantic search
   *
   * @param query - Search query
   * @param documents - Document collection
   * @param topK - Number of results
   * @returns Top matching documents
   */
  async semanticSearch(
    query: string,
    documents: string[],
    topK: number = 10
  ): Promise<Array<{ text: string; score: number; rank: number }>> {
    const results = await this.findMostSimilar(query, documents, topK);

    return results.map((result, idx) => ({
      text: result.text,
      score: result.score,
      rank: idx + 1
    }));
  }

  /**
   * Cluster texts by similarity
   *
   * @param texts - Texts to cluster
   * @param numClusters - Number of clusters
   * @returns Clustering result
   */
  async cluster(
    texts: string[],
    numClusters: number
  ): Promise<ClusteringResult> {
    const embeddings = await this.embed(texts);

    // Simple k-means clustering
    const { clusters, centroids } = this.kMeans(embeddings, numClusters);

    return {
      clusters,
      numClusters,
      centroids,
      silhouetteScore: this.calculateSilhouetteScore(embeddings, clusters)
    };
  }

  /**
   * Get embedding dimension
   *
   * @returns Embedding dimension
   */
  async getDimension(): Promise<number> {
    await this.load();
    return this.model.get_sentence_embedding_dimension();
  }

  /**
   * Get model information
   */
  async getInfo(): Promise<{
    modelName: string;
    dimension: number;
    maxSeqLength: number;
  }> {
    await this.load();

    return {
      modelName: this.modelName,
      dimension: await this.getDimension(),
      maxSeqLength: this.model.max_seq_length
    };
  }

  /**
   * K-means clustering implementation
   */
  private kMeans(
    embeddings: Embedding[],
    k: number,
    maxIterations: number = 100
  ): { clusters: number[]; centroids: Embedding[] } {
    const n = embeddings.length;
    const dim = embeddings[0].length;

    // Initialize centroids randomly
    let centroids: Embedding[] = [];
    const indices = new Set<number>();
    while (centroids.length < k) {
      const idx = Math.floor(Math.random() * n);
      if (!indices.has(idx)) {
        centroids.push([...embeddings[idx]]);
        indices.add(idx);
      }
    }

    let clusters: number[] = new Array(n).fill(0);

    for (let iter = 0; iter < maxIterations; iter++) {
      // Assign to nearest centroid
      const newClusters: number[] = [];
      for (let i = 0; i < n; i++) {
        let minDist = Infinity;
        let nearest = 0;

        for (let j = 0; j < k; j++) {
          const dist = this.euclideanDistance(embeddings[i], centroids[j]);
          if (dist < minDist) {
            minDist = dist;
            nearest = j;
          }
        }

        newClusters.push(nearest);
      }

      // Check convergence
      if (JSON.stringify(newClusters) === JSON.stringify(clusters)) {
        break;
      }

      clusters = newClusters;

      // Update centroids
      const newCentroids: Embedding[] = [];
      for (let j = 0; j < k; j++) {
        const clusterPoints = embeddings.filter((_, i) => clusters[i] === j);

        if (clusterPoints.length === 0) {
          newCentroids.push(centroids[j]);
          continue;
        }

        const centroid = new Array(dim).fill(0);
        for (const point of clusterPoints) {
          for (let d = 0; d < dim; d++) {
            centroid[d] += point[d];
          }
        }

        for (let d = 0; d < dim; d++) {
          centroid[d] /= clusterPoints.length;
        }

        newCentroids.push(centroid);
      }

      centroids = newCentroids;
    }

    return { clusters, centroids };
  }

  /**
   * Calculate Euclidean distance
   */
  private euclideanDistance(a: Embedding, b: Embedding): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  /**
   * Calculate silhouette score
   */
  private calculateSilhouetteScore(
    embeddings: Embedding[],
    clusters: number[]
  ): number {
    // Simplified silhouette score
    let totalScore = 0;

    for (let i = 0; i < embeddings.length; i++) {
      const cluster = clusters[i];

      // Average distance to same cluster
      const sameCluster = embeddings.filter((_, j) => clusters[j] === cluster && j !== i);
      const a = sameCluster.length > 0
        ? sameCluster.reduce((sum, emb) => sum + this.euclideanDistance(embeddings[i], emb), 0) / sameCluster.length
        : 0;

      // Minimum average distance to other clusters
      const otherClusters = [...new Set(clusters)].filter(c => c !== cluster);
      const b = Math.min(
        ...otherClusters.map(c => {
          const otherCluster = embeddings.filter((_, j) => clusters[j] === c);
          return otherCluster.reduce((sum, emb) => sum + this.euclideanDistance(embeddings[i], emb), 0) / otherCluster.length;
        })
      );

      totalScore += (b - a) / Math.max(a, b);
    }

    return totalScore / embeddings.length;
  }

  /**
   * Convert Python array to JavaScript
   */
  private toArray(arr: any): number[] {
    if (arr.tolist) {
      return arr.tolist();
    }
    if (Array.isArray(arr)) {
      return arr;
    }
    return Array.from(arr);
  }

  /**
   * Convert Python batch to JavaScript
   */
  private toArrayBatch(arr: any): number[][] {
    if (arr.tolist) {
      return arr.tolist();
    }
    if (Array.isArray(arr)) {
      return arr;
    }
    return Array.from(arr).map((row: any) => this.toArray(row));
  }
}

/**
 * Multi-lingual embedder
 */
export class MultilingualEmbedder extends Embedder {
  constructor(config: EmbedderConfig = {}) {
    super('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2', config);
  }
}

/**
 * Large embedder for better quality
 */
export class LargeEmbedder extends Embedder {
  constructor(config: EmbedderConfig = {}) {
    super('sentence-transformers/all-mpnet-base-v2', config);
  }
}

/**
 * Fast embedder for speed
 */
export class FastEmbedder extends Embedder {
  constructor(config: EmbedderConfig = {}) {
    super('sentence-transformers/all-MiniLM-L6-v2', config);
  }
}

/**
 * Create an embedder
 *
 * @param type - Embedder type
 * @param config - Configuration
 * @returns Embedder instance
 */
export function createEmbedder(
  type?: 'fast' | 'balanced' | 'large' | 'multilingual' | string,
  config?: EmbedderConfig
): Embedder {
  switch (type) {
    case 'fast':
      return new FastEmbedder(config);
    case 'balanced':
      return new Embedder('sentence-transformers/all-MiniLM-L12-v2', config);
    case 'large':
      return new LargeEmbedder(config);
    case 'multilingual':
      return new MultilingualEmbedder(config);
    default:
      return new Embedder(type, config);
  }
}

/**
 * Embedding utilities
 */
export const EmbeddingUtils = {
  /**
   * Normalize embedding
   */
  normalize: (embedding: Embedding): Embedding => {
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / norm);
  },

  /**
   * Average embeddings
   */
  average: (embeddings: Embedding[]): Embedding => {
    const dim = embeddings[0].length;
    const avg = new Array(dim).fill(0);

    for (const emb of embeddings) {
      for (let i = 0; i < dim; i++) {
        avg[i] += emb[i];
      }
    }

    return avg.map(val => val / embeddings.length);
  },

  /**
   * Weighted average
   */
  weightedAverage: (
    embeddings: Embedding[],
    weights: number[]
  ): Embedding => {
    const dim = embeddings[0].length;
    const avg = new Array(dim).fill(0);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    for (let i = 0; i < embeddings.length; i++) {
      for (let j = 0; j < dim; j++) {
        avg[j] += embeddings[i][j] * weights[i];
      }
    }

    return avg.map(val => val / totalWeight);
  },

  /**
   * Calculate pairwise similarities
   */
  pairwiseSimilarities: async (
    embeddings: Embedding[],
    embedder: Embedder
  ): Promise<number[][]> => {
    const n = embeddings.length;
    const similarities: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      similarities[i][i] = 1.0;
      for (let j = i + 1; j < n; j++) {
        const sim = await embedder.cosineSimilarity(embeddings[i], embeddings[j]);
        similarities[i][j] = sim;
        similarities[j][i] = sim;
      }
    }

    return similarities;
  }
};

/**
 * Embeddings Engine - Vector Embeddings Generation
 *
 * Generates embeddings for text using various models,
 * supports batch embeddings, caching, and similarity search.
 */

export interface EmbeddingModel {
  id: string;
  name: string;
  dimensions: number;
  maxTokens: number;
  costPerToken: number;
  normalization: boolean;
}

export interface EmbeddingRequest {
  input: string | string[];
  model: string;
  user?: string;
  encoding_format?: "float" | "base64";
}

export interface EmbeddingResponse {
  object: "list";
  data: Array<{
    object: "embedding";
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface SimilaritySearchResult {
  text: string;
  embedding: number[];
  similarity: number;
  index: number;
}

/**
 * Embeddings Engine
 */
export class EmbeddingsEngine {
  private models: Map<string, EmbeddingModel> = new Map();
  private cache: Map<string, number[]> = new Map();
  private maxCacheSize: number = 10000;
  private embeddingsStore: Array<{ text: string; embedding: number[] }> = [];

  constructor() {
    this.initializeModels();
  }

  /**
   * Initialize embedding models
   */
  private initializeModels(): void {
    this.models.set("text-embedding-3-small", {
      id: "text-embedding-3-small",
      name: "Text Embedding 3 Small",
      dimensions: 1536,
      maxTokens: 8191,
      costPerToken: 0.00000002,
      normalization: true,
    });

    this.models.set("text-embedding-3-large", {
      id: "text-embedding-3-large",
      name: "Text Embedding 3 Large",
      dimensions: 3072,
      maxTokens: 8191,
      costPerToken: 0.00000013,
      normalization: true,
    });

    this.models.set("text-embedding-ada-002", {
      id: "text-embedding-ada-002",
      name: "Ada Embedding v2",
      dimensions: 1536,
      maxTokens: 8191,
      costPerToken: 0.0000001,
      normalization: true,
    });

    this.models.set("embed-english-v3.0", {
      id: "embed-english-v3.0",
      name: "Cohere Embed English v3",
      dimensions: 1024,
      maxTokens: 512,
      costPerToken: 0.0000001,
      normalization: true,
    });

    this.models.set("embed-multilingual-v3.0", {
      id: "embed-multilingual-v3.0",
      name: "Cohere Embed Multilingual v3",
      dimensions: 1024,
      maxTokens: 512,
      costPerToken: 0.0000001,
      normalization: true,
    });
  }

  /**
   * Generate embeddings
   */
  async generateEmbeddings(
    request: EmbeddingRequest
  ): Promise<EmbeddingResponse> {
    const model = this.models.get(request.model);
    if (!model) {
      throw new Error(`Model '${request.model}' not found`);
    }

    // Handle single input or array
    const inputs = Array.isArray(request.input) ? request.input : [request.input];

    const embeddings: Array<{ object: "embedding"; embedding: number[]; index: number }> =
      [];
    let totalTokens = 0;

    for (let i = 0; i < inputs.length; i++) {
      const text = inputs[i];

      // Check cache
      const cacheKey = this.getCacheKey(request.model, text);
      let embedding = this.cache.get(cacheKey);

      if (!embedding) {
        // Generate embedding
        embedding = await this.generateEmbedding(text, model);

        // Cache it
        this.cacheEmbedding(cacheKey, embedding);

        // Store for similarity search
        this.embeddingsStore.push({ text, embedding });
      }

      embeddings.push({
        object: "embedding",
        embedding,
        index: i,
      });

      // Estimate tokens
      totalTokens += this.estimateTokens(text);
    }

    return {
      object: "list",
      data: embeddings,
      model: request.model,
      usage: {
        prompt_tokens: totalTokens,
        total_tokens: totalTokens,
      },
    };
  }

  /**
   * Generate a single embedding (simulated)
   */
  private async generateEmbedding(
    text: string,
    model: EmbeddingModel
  ): Promise<number[]> {
    // In production, this would call an actual embedding model
    // For now, we simulate with a hash-based pseudo-embedding

    const embedding = new Array(model.dimensions);

    // Create a deterministic "embedding" based on text content
    // This is just for demonstration - real embeddings would use neural networks
    const seed = this.hashString(text);
    const rng = this.seededRandom(seed);

    for (let i = 0; i < model.dimensions; i++) {
      embedding[i] = rng() * 2 - 1; // Values between -1 and 1
    }

    // Normalize if required
    if (model.normalization) {
      return this.normalize(embedding);
    }

    return embedding;
  }

  /**
   * Normalize vector to unit length
   */
  private normalize(vector: number[]): number[] {
    const magnitude = Math.sqrt(
      vector.reduce((sum, val) => sum + val * val, 0)
    );
    return vector.map((val) => val / magnitude);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error("Vectors must have the same dimensions");
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Semantic similarity search
   */
  async similaritySearch(
    query: string,
    modelId: string,
    topK: number = 5,
    threshold: number = 0.7
  ): Promise<SimilaritySearchResult[]> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model '${modelId}' not found`);
    }

    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query, model);

    // Calculate similarities
    const results: SimilaritySearchResult[] = [];

    for (let i = 0; i < this.embeddingsStore.length; i++) {
      const stored = this.embeddingsStore[i];

      // Skip if dimensions don't match
      if (stored.embedding.length !== queryEmbedding.length) {
        continue;
      }

      const similarity = this.cosineSimilarity(queryEmbedding, stored.embedding);

      if (similarity >= threshold) {
        results.push({
          text: stored.text,
          embedding: stored.embedding,
          similarity,
          index: i,
        });
      }
    }

    // Sort by similarity (descending) and return top K
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * Batch embeddings with automatic chunking
   */
  async batchEmbeddings(
    texts: string[],
    modelId: string,
    batchSize: number = 100
  ): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const response = await this.generateEmbeddings({
        input: batch,
        model: modelId,
      });

      embeddings.push(...response.data.map((d) => d.embedding));
    }

    return embeddings;
  }

  /**
   * Calculate distance metrics
   */
  euclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error("Vectors must have the same dimensions");
    }

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += Math.pow(a[i] - b[i], 2);
    }

    return Math.sqrt(sum);
  }

  dotProduct(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error("Vectors must have the same dimensions");
    }

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += a[i] * b[i];
    }

    return sum;
  }

  /**
   * Clustering using K-means
   */
  async kMeansClustering(
    embeddings: number[][],
    k: number,
    maxIterations: number = 100
  ): Promise<{ centroids: number[][]; labels: number[] }> {
    if (embeddings.length === 0 || k <= 0) {
      throw new Error("Invalid parameters for clustering");
    }

    const dimensions = embeddings[0].length;

    // Initialize centroids randomly
    let centroids: number[][] = [];
    for (let i = 0; i < k; i++) {
      centroids.push(embeddings[Math.floor(Math.random() * embeddings.length)]);
    }

    let labels = new Array(embeddings.length).fill(0);
    let iterations = 0;

    while (iterations < maxIterations) {
      // Assign points to nearest centroid
      const newLabels = embeddings.map((embedding) => {
        let minDist = Infinity;
        let label = 0;

        for (let i = 0; i < centroids.length; i++) {
          const dist = this.euclideanDistance(embedding, centroids[i]);
          if (dist < minDist) {
            minDist = dist;
            label = i;
          }
        }

        return label;
      });

      // Check for convergence
      if (JSON.stringify(newLabels) === JSON.stringify(labels)) {
        break;
      }

      labels = newLabels;

      // Update centroids
      const newCentroids: number[][] = [];
      for (let i = 0; i < k; i++) {
        const clusterPoints = embeddings.filter((_, idx) => labels[idx] === i);

        if (clusterPoints.length === 0) {
          // Keep old centroid if cluster is empty
          newCentroids.push(centroids[i]);
          continue;
        }

        const centroid = new Array(dimensions).fill(0);
        for (const point of clusterPoints) {
          for (let j = 0; j < dimensions; j++) {
            centroid[j] += point[j];
          }
        }

        newCentroids.push(centroid.map((val) => val / clusterPoints.length));
      }

      centroids = newCentroids;
      iterations++;
    }

    return { centroids, labels };
  }

  /**
   * Get available models
   */
  listModels(): EmbeddingModel[] {
    return Array.from(this.models.values());
  }

  /**
   * Clear embeddings cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: 0, // Would need to track hits/misses
    };
  }

  /**
   * Private helper methods
   */
  private getCacheKey(model: string, text: string): string {
    return `${model}:${text}`;
  }

  private cacheEmbedding(key: string, embedding: number[]): void {
    if (this.cache.size >= this.maxCacheSize) {
      // Remove oldest entry (first key)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, embedding);
  }

  private estimateTokens(text: string): number {
    // Simple estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private seededRandom(seed: number): () => number {
    let value = seed;
    return () => {
      value = (value * 9301 + 49297) % 233280;
      return value / 233280;
    };
  }
}

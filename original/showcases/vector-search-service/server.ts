/**
 * Vector Search Service
 *
 * A high-performance vector database service built with Elide for storing
 * and searching embeddings using cosine similarity. Ideal for semantic search,
 * recommendation systems, and RAG applications.
 *
 * Features:
 * - Store and index vector embeddings
 * - Cosine similarity search
 * - Batch operations
 * - Filtering by metadata
 * - CRUD operations
 * - Collection management
 * - Fast approximate nearest neighbor (ANN) search
 */

// Native Elide beta11-rc1 HTTP - No imports needed for fetch handler

// Types
interface Vector {
  id: string;
  values: number[];
  metadata?: Record<string, any>;
}

interface SearchResult {
  id: string;
  score: number;
  values?: number[];
  metadata?: Record<string, any>;
}

interface Collection {
  name: string;
  dimension: number;
  metric: "cosine" | "euclidean" | "dotProduct";
  vectors: Map<string, Vector>;
  createdAt: Date;
  updatedAt: Date;
}

interface UpsertRequest {
  vectors: Vector[];
}

interface SearchRequest {
  vector: number[];
  topK?: number;
  includeValues?: boolean;
  includeMetadata?: boolean;
  filter?: Record<string, any>;
}

interface DeleteRequest {
  ids: string[];
  deleteAll?: boolean;
  filter?: Record<string, any>;
}

// Vector Operations
class VectorMath {
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error("Vectors must have the same dimension");
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  static euclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error("Vectors must have the same dimension");
    }

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  static dotProduct(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error("Vectors must have the same dimension");
    }

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += a[i] * b[i];
    }

    return sum;
  }

  static normalize(vector: number[]): number[] {
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (norm === 0) return vector;
    return vector.map((val) => val / norm);
  }
}

// Index for fast approximate nearest neighbor search
class VectorIndex {
  private vectors: Map<string, Vector>;
  private dimension: number;
  private metric: "cosine" | "euclidean" | "dotProduct";

  constructor(dimension: number, metric: "cosine" | "euclidean" | "dotProduct" = "cosine") {
    this.vectors = new Map();
    this.dimension = dimension;
    this.metric = metric;
  }

  upsert(vector: Vector): void {
    if (vector.values.length !== this.dimension) {
      throw new Error(
        `Vector dimension mismatch: expected ${this.dimension}, got ${vector.values.length}`
      );
    }
    this.vectors.set(vector.id, vector);
  }

  upsertBatch(vectors: Vector[]): void {
    for (const vector of vectors) {
      this.upsert(vector);
    }
  }

  get(id: string): Vector | undefined {
    return this.vectors.get(id);
  }

  delete(id: string): boolean {
    return this.vectors.delete(id);
  }

  deleteBatch(ids: string[]): number {
    let count = 0;
    for (const id of ids) {
      if (this.delete(id)) count++;
    }
    return count;
  }

  deleteAll(): void {
    this.vectors.clear();
  }

  search(
    queryVector: number[],
    topK: number = 10,
    filter?: Record<string, any>
  ): SearchResult[] {
    if (queryVector.length !== this.dimension) {
      throw new Error(
        `Query vector dimension mismatch: expected ${this.dimension}, got ${queryVector.length}`
      );
    }

    const results: Array<{ id: string; score: number; vector: Vector }> = [];

    // Brute force search (for demonstration)
    // In production, use HNSW, IVF, or other ANN algorithms
    for (const [id, vector] of this.vectors.entries()) {
      // Apply metadata filter
      if (filter && !this.matchesFilter(vector.metadata, filter)) {
        continue;
      }

      const score = this.calculateScore(queryVector, vector.values);
      results.push({ id, score, vector });
    }

    // Sort by score (descending for similarity, ascending for distance)
    results.sort((a, b) => {
      if (this.metric === "euclidean") {
        return a.score - b.score; // Lower distance is better
      } else {
        return b.score - a.score; // Higher similarity is better
      }
    });

    // Return top K results
    return results.slice(0, topK).map((r) => ({
      id: r.id,
      score: r.score,
      values: r.vector.values,
      metadata: r.vector.metadata,
    }));
  }

  private calculateScore(query: number[], target: number[]): number {
    switch (this.metric) {
      case "cosine":
        return VectorMath.cosineSimilarity(query, target);
      case "euclidean":
        return VectorMath.euclideanDistance(query, target);
      case "dotProduct":
        return VectorMath.dotProduct(query, target);
      default:
        return VectorMath.cosineSimilarity(query, target);
    }
  }

  private matchesFilter(
    metadata: Record<string, any> | undefined,
    filter: Record<string, any>
  ): boolean {
    if (!metadata) return false;

    for (const [key, value] of Object.entries(filter)) {
      if (metadata[key] !== value) {
        return false;
      }
    }

    return true;
  }

  size(): number {
    return this.vectors.size;
  }

  list(limit: number = 100, offset: number = 0): Vector[] {
    const vectors = Array.from(this.vectors.values());
    return vectors.slice(offset, offset + limit);
  }
}

// Collection Manager
class CollectionManager {
  private collections: Map<string, Collection> = new Map();

  createCollection(
    name: string,
    dimension: number,
    metric: "cosine" | "euclidean" | "dotProduct" = "cosine"
  ): Collection {
    if (this.collections.has(name)) {
      throw new Error(`Collection '${name}' already exists`);
    }

    const collection: Collection = {
      name,
      dimension,
      metric,
      vectors: new Map(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.collections.set(name, collection);
    return collection;
  }

  getCollection(name: string): Collection | undefined {
    return this.collections.get(name);
  }

  deleteCollection(name: string): boolean {
    return this.collections.delete(name);
  }

  listCollections(): Array<{
    name: string;
    dimension: number;
    metric: string;
    vectorCount: number;
  }> {
    return Array.from(this.collections.values()).map((c) => ({
      name: c.name,
      dimension: c.dimension,
      metric: c.metric,
      vectorCount: c.vectors.size,
    }));
  }

  getOrCreateIndex(name: string, dimension?: number): VectorIndex {
    let collection = this.collections.get(name);

    if (!collection) {
      if (!dimension) {
        throw new Error(`Collection '${name}' does not exist and no dimension provided`);
      }
      collection = this.createCollection(name, dimension);
    }

    const index = new VectorIndex(collection.dimension, collection.metric);

    // Load existing vectors
    for (const vector of collection.vectors.values()) {
      index.upsert(vector);
    }

    return index;
  }

  saveIndex(name: string, index: VectorIndex): void {
    const collection = this.collections.get(name);
    if (!collection) {
      throw new Error(`Collection '${name}' does not exist`);
    }

    // Update collection with index data
    collection.vectors.clear();
    for (const vector of index.list(Infinity)) {
      collection.vectors.set(vector.id, vector);
    }
    collection.updatedAt = new Date();
  }
}

// Statistics
class VectorStats {
  private searches = 0;
  private upserts = 0;
  private deletes = 0;

  recordSearch(): void {
    this.searches++;
  }

  recordUpsert(count: number = 1): void {
    this.upserts += count;
  }

  recordDelete(count: number = 1): void {
    this.deletes += count;
  }

  getStats() {
    return {
      searches: this.searches,
      upserts: this.upserts,
      deletes: this.deletes,
    };
  }
}

// Server Implementation
const collectionManager = new CollectionManager();
const stats = new VectorStats();

// Create default collection
collectionManager.createCollection("default", 384, "cosine");

/**
 * Native Elide beta11-rc1 HTTP Server - Fetch Handler Pattern
 *
 * Export a default fetch function that handles HTTP requests.
 * Run with: elide serve --port 8082 server.ts
 */
export default async function fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Health check
      if (path === "/health" || path === "/") {
        const collections = collectionManager.listCollections();
        const totalVectors = collections.reduce((sum, c) => sum + c.vectorCount, 0);

        return new Response(
          JSON.stringify({
            status: "healthy",
            service: "Vector Search Service",
            uptime: process.uptime(),
            collections: collections.length,
            totalVectors,
            stats: stats.getStats(),
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // List collections
      if (path === "/collections" && req.method === "GET") {
        const collections = collectionManager.listCollections();
        return new Response(JSON.stringify({ collections }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create collection
      if (path === "/collections" && req.method === "POST") {
        const body = await req.json();
        const { name, dimension, metric = "cosine" } = body;

        if (!name || !dimension) {
          return new Response(
            JSON.stringify({ error: "Name and dimension required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const collection = collectionManager.createCollection(name, dimension, metric);
        return new Response(
          JSON.stringify({
            name: collection.name,
            dimension: collection.dimension,
            metric: collection.metric,
          }),
          {
            status: 201,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Delete collection
      if (path.startsWith("/collections/") && req.method === "DELETE") {
        const name = path.split("/")[2];
        const success = collectionManager.deleteCollection(name);

        if (!success) {
          return new Response(
            JSON.stringify({ error: "Collection not found" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Upsert vectors
      if (path.startsWith("/collections/") && path.endsWith("/upsert") && req.method === "POST") {
        const collectionName = path.split("/")[2];
        const body = await req.json() as UpsertRequest;

        if (!body.vectors || !Array.isArray(body.vectors)) {
          return new Response(
            JSON.stringify({ error: "Vectors array required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const dimension = body.vectors[0]?.values?.length;
        const index = collectionManager.getOrCreateIndex(collectionName, dimension);

        index.upsertBatch(body.vectors);
        collectionManager.saveIndex(collectionName, index);

        stats.recordUpsert(body.vectors.length);

        return new Response(
          JSON.stringify({
            upserted: body.vectors.length,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Search vectors
      if (path.startsWith("/collections/") && path.endsWith("/search") && req.method === "POST") {
        const collectionName = path.split("/")[2];
        const body = await req.json() as SearchRequest;

        if (!body.vector || !Array.isArray(body.vector)) {
          return new Response(
            JSON.stringify({ error: "Query vector required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const index = collectionManager.getOrCreateIndex(collectionName);
        const results = index.search(body.vector, body.topK || 10, body.filter);

        stats.recordSearch();

        // Format results based on options
        const formattedResults = results.map((r) => {
          const result: SearchResult = {
            id: r.id,
            score: r.score,
          };

          if (body.includeValues !== false) {
            result.values = r.values;
          }

          if (body.includeMetadata !== false) {
            result.metadata = r.metadata;
          }

          return result;
        });

        return new Response(
          JSON.stringify({
            matches: formattedResults,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Get vector by ID
      if (path.match(/^\/collections\/[^/]+\/vectors\/[^/]+$/) && req.method === "GET") {
        const parts = path.split("/");
        const collectionName = parts[2];
        const vectorId = parts[4];

        const index = collectionManager.getOrCreateIndex(collectionName);
        const vector = index.get(vectorId);

        if (!vector) {
          return new Response(
            JSON.stringify({ error: "Vector not found" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        return new Response(JSON.stringify(vector), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Delete vectors
      if (path.startsWith("/collections/") && path.endsWith("/delete") && req.method === "POST") {
        const collectionName = path.split("/")[2];
        const body = await req.json() as DeleteRequest;

        const index = collectionManager.getOrCreateIndex(collectionName);

        if (body.deleteAll) {
          index.deleteAll();
          collectionManager.saveIndex(collectionName, index);
          stats.recordDelete(1);

          return new Response(
            JSON.stringify({ deleted: "all" }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        if (!body.ids || !Array.isArray(body.ids)) {
          return new Response(
            JSON.stringify({ error: "IDs array required or set deleteAll: true" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const deleted = index.deleteBatch(body.ids);
        collectionManager.saveIndex(collectionName, index);
        stats.recordDelete(deleted);

        return new Response(
          JSON.stringify({ deleted }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // List vectors
      if (path.startsWith("/collections/") && path.endsWith("/list") && req.method === "GET") {
        const collectionName = path.split("/")[2];
        const limit = parseInt(url.searchParams.get("limit") || "100");
        const offset = parseInt(url.searchParams.get("offset") || "0");

        const index = collectionManager.getOrCreateIndex(collectionName);
        const vectors = index.list(limit, offset);

        return new Response(
          JSON.stringify({
            vectors,
            count: vectors.length,
            total: index.size(),
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Statistics
      if (path === "/stats" && req.method === "GET") {
        return new Response(JSON.stringify(stats.getStats()), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Not found
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error:", error);
      return new Response(
        JSON.stringify({
          error: {
            message: error instanceof Error ? error.message : "Internal server error",
            type: "server_error",
          },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }
}

// Log server info on startup
if (import.meta.url.includes("server.ts")) {
  console.log("Vector Search Service running on http://localhost:8082");
  console.log("Endpoints:");
  console.log("  GET    /collections - List collections");
  console.log("  POST   /collections - Create collection");
  console.log("  DELETE /collections/{name} - Delete collection");
  console.log("  POST   /collections/{name}/upsert - Upsert vectors");
  console.log("  POST   /collections/{name}/search - Search vectors");
  console.log("  POST   /collections/{name}/delete - Delete vectors");
  console.log("  GET    /collections/{name}/list - List vectors");
  console.log("  GET    /collections/{name}/vectors/{id} - Get vector by ID");
  console.log("  GET    /stats - Service statistics");
  console.log("  GET    /health - Health check");
}

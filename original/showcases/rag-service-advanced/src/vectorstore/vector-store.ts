/**
 * TypeScript wrapper for Python vector store
 * Demonstrates Elide's polyglot capabilities - TypeScript calling Python in-process
 * Combines ChromaDB + FAISS for optimal performance
 */

// Import Python module directly via Elide's polyglot runtime
// @ts-ignore - Elide provides this at runtime
import python from 'python:vectorstore';

export interface VectorStoreConfig {
  collectionName?: string;
  persistDirectory?: string;
  dimension?: number;
  useFaiss?: boolean;
}

export interface Document {
  id: string;
  document: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

export interface SearchResult {
  id: string;
  document: string;
  metadata: Record<string, any>;
  score: number;
}

export class VectorStore {
  private pythonStore: any;
  private config: Required<VectorStoreConfig>;

  constructor(config: VectorStoreConfig = {}) {
    this.config = {
      collectionName: config.collectionName || 'documents',
      persistDirectory: config.persistDirectory || './data/vectorstore',
      dimension: config.dimension || 384,
      useFaiss: config.useFaiss !== undefined ? config.useFaiss : true,
    };

    // Initialize Python vector store - runs in the same process!
    this.pythonStore = python.get_vector_store(
      this.config.collectionName,
      this.config.persistDirectory,
      this.config.dimension,
      this.config.useFaiss
    );
  }

  /**
   * Add documents to the vector store
   * Direct in-process call - NO network latency!
   */
  async addDocuments(
    documents: string[],
    embeddings: number[][],
    metadatas?: Record<string, any>[],
    ids?: string[]
  ): Promise<string[]> {
    return await this.pythonStore.add_documents(
      documents,
      embeddings,
      metadatas || null,
      ids || null
    );
  }

  /**
   * Search for similar documents
   * Uses FAISS for ultra-fast similarity search (microseconds!)
   */
  async search(
    queryEmbedding: number[],
    k: number = 5,
    filterMetadata?: Record<string, any>
  ): Promise<SearchResult[]> {
    const results = await this.pythonStore.search(
      queryEmbedding,
      k,
      filterMetadata || null
    );

    return results;
  }

  /**
   * Delete documents by IDs
   */
  async deleteDocuments(ids: string[]): Promise<void> {
    await this.pythonStore.delete_documents(ids);
  }

  /**
   * Get a document by ID
   */
  async getDocument(docId: string): Promise<Document | null> {
    const doc = await this.pythonStore.get_document(docId);
    return doc;
  }

  /**
   * Get total number of documents
   */
  async count(): Promise<number> {
    return await this.pythonStore.count();
  }

  /**
   * Reset the vector store (delete all documents)
   */
  async reset(): Promise<void> {
    await this.pythonStore.reset();
  }

  /**
   * Get configuration
   */
  getConfig(): Required<VectorStoreConfig> {
    return { ...this.config };
  }
}

/**
 * Create a vector store instance
 */
export function createVectorStore(config?: VectorStoreConfig): VectorStore {
  return new VectorStore(config);
}

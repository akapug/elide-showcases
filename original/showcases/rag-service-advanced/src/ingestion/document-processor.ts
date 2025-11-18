/**
 * Document ingestion and processing module
 * Handles document parsing, chunking, and embedding
 */

import { EmbeddingService } from '../embeddings/embedding-service';
import { VectorStore } from '../vectorstore/vector-store';

export interface DocumentChunk {
  id: string;
  text: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

export interface IngestionOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  batchSize?: number;
  metadata?: Record<string, any>;
}

export interface IngestionResult {
  documentId: string;
  chunkCount: number;
  chunkIds: string[];
  processingTimeMs: number;
}

export class DocumentProcessor {
  private embeddingService: EmbeddingService;
  private vectorStore: VectorStore;

  constructor(embeddingService: EmbeddingService, vectorStore: VectorStore) {
    this.embeddingService = embeddingService;
    this.vectorStore = vectorStore;
  }

  /**
   * Ingest a single document
   * This is blazingly fast because embedding + indexing happens in-process!
   */
  async ingestDocument(
    documentId: string,
    text: string,
    options: IngestionOptions = {}
  ): Promise<IngestionResult> {
    const startTime = Date.now();

    const chunkSize = options.chunkSize || 512;
    const chunkOverlap = options.chunkOverlap || 50;
    const batchSize = options.batchSize || 32;

    // Step 1: Chunk the document
    const chunks = this.chunkText(text, chunkSize, chunkOverlap);

    // Step 2: Generate embeddings (in-process Python call)
    const chunkTexts = chunks.map((c) => c.text);
    const embeddings = await this.embeddingService.encodeDocuments(
      chunkTexts,
      batchSize
    );

    // Step 3: Prepare metadata
    const metadatas = chunks.map((chunk) => ({
      ...options.metadata,
      documentId,
      chunkIndex: chunk.index,
      chunkCount: chunks.length,
      startPos: chunk.startPos,
      endPos: chunk.endPos,
    }));

    // Step 4: Store in vector database (in-process!)
    const chunkIds = chunks.map((c) => c.id);
    await this.vectorStore.addDocuments(
      chunkTexts,
      embeddings,
      metadatas,
      chunkIds
    );

    const processingTimeMs = Date.now() - startTime;

    return {
      documentId,
      chunkCount: chunks.length,
      chunkIds,
      processingTimeMs,
    };
  }

  /**
   * Ingest multiple documents in batch
   */
  async ingestDocuments(
    documents: Array<{ id: string; text: string; metadata?: Record<string, any> }>,
    options: IngestionOptions = {}
  ): Promise<IngestionResult[]> {
    const results: IngestionResult[] = [];

    for (const doc of documents) {
      const result = await this.ingestDocument(doc.id, doc.text, {
        ...options,
        metadata: { ...options.metadata, ...doc.metadata },
      });
      results.push(result);
    }

    return results;
  }

  /**
   * Chunk text into overlapping segments
   */
  private chunkText(
    text: string,
    chunkSize: number,
    overlap: number
  ): Array<{
    id: string;
    text: string;
    index: number;
    startPos: number;
    endPos: number;
  }> {
    const chunks: Array<{
      id: string;
      text: string;
      index: number;
      startPos: number;
      endPos: number;
    }> = [];

    let index = 0;
    let startPos = 0;

    while (startPos < text.length) {
      const endPos = Math.min(startPos + chunkSize, text.length);
      const chunkText = text.slice(startPos, endPos);

      // Try to break at sentence boundaries
      let finalEndPos = endPos;
      if (endPos < text.length) {
        const lastPeriod = chunkText.lastIndexOf('. ');
        const lastNewline = chunkText.lastIndexOf('\n');
        const breakPoint = Math.max(lastPeriod, lastNewline);

        if (breakPoint > chunkSize * 0.7) {
          finalEndPos = startPos + breakPoint + 1;
        }
      }

      chunks.push({
        id: `chunk_${index}`,
        text: text.slice(startPos, finalEndPos).trim(),
        index,
        startPos,
        endPos: finalEndPos,
      });

      startPos = finalEndPos - overlap;
      index++;
    }

    return chunks;
  }

  /**
   * Delete a document and all its chunks
   */
  async deleteDocument(documentId: string): Promise<void> {
    // Find all chunks for this document
    const embedding = await this.embeddingService.encodeText('');
    const results = await this.vectorStore.search(embedding, 1000);

    const chunkIds = results
      .filter((r) => r.metadata.documentId === documentId)
      .map((r) => r.id);

    if (chunkIds.length > 0) {
      await this.vectorStore.deleteDocuments(chunkIds);
    }
  }

  /**
   * Get document statistics
   */
  async getStats(): Promise<{
    totalChunks: number;
    totalDocuments: number;
  }> {
    const totalChunks = await this.vectorStore.count();

    // Count unique documents
    const embedding = await this.embeddingService.encodeText('');
    const results = await this.vectorStore.search(embedding, 10000);

    const uniqueDocIds = new Set(
      results.map((r) => r.metadata.documentId).filter(Boolean)
    );

    return {
      totalChunks,
      totalDocuments: uniqueDocIds.size,
    };
  }
}

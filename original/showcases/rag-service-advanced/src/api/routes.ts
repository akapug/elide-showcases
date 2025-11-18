/**
 * API Routes for RAG Service
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { EmbeddingService } from '../embeddings/embedding-service';
import { VectorStore } from '../vectorstore/vector-store';
import { DocumentProcessor } from '../ingestion/document-processor';
import { Retriever } from '../retrieval/retriever';
import { StreamHandler, SSEFormatter } from '../streaming/stream-handler';
import { ValidationError, NotFoundError, handleError } from '../utils/errors';
import logger from '../utils/logger';

export interface RAGServiceDependencies {
  embeddingService: EmbeddingService;
  vectorStore: VectorStore;
  documentProcessor: DocumentProcessor;
  retriever: Retriever;
}

export function registerRoutes(
  fastify: FastifyInstance,
  deps: RAGServiceDependencies
) {
  const { embeddingService, vectorStore, documentProcessor, retriever } = deps;

  // Health check
  fastify.get('/health', async (request, reply) => {
    const stats = await documentProcessor.getStats();
    return {
      status: 'healthy',
      service: 'rag-service-advanced',
      timestamp: new Date().toISOString(),
      stats,
    };
  });

  // Get embedding model info
  fastify.get('/api/v1/model/info', async (request, reply) => {
    try {
      const info = await embeddingService.getModelInfo();
      return { success: true, data: info };
    } catch (error) {
      const err = handleError(error);
      reply.code(err.statusCode).send({
        success: false,
        error: { code: err.code, message: err.message },
      });
    }
  });

  // Ingest a single document
  fastify.post<{
    Body: {
      documentId: string;
      text: string;
      metadata?: Record<string, any>;
      chunkSize?: number;
      chunkOverlap?: number;
    };
  }>('/api/v1/documents/ingest', async (request, reply) => {
    try {
      const { documentId, text, metadata, chunkSize, chunkOverlap } = request.body;

      if (!documentId || !text) {
        throw new ValidationError('documentId and text are required');
      }

      logger.info({ documentId }, 'Ingesting document');

      const result = await documentProcessor.ingestDocument(documentId, text, {
        metadata,
        chunkSize,
        chunkOverlap,
      });

      logger.info(
        { documentId, chunkCount: result.chunkCount, timeMs: result.processingTimeMs },
        'Document ingested successfully'
      );

      return { success: true, data: result };
    } catch (error) {
      const err = handleError(error);
      logger.error({ error: err }, 'Document ingestion failed');
      reply.code(err.statusCode).send({
        success: false,
        error: { code: err.code, message: err.message },
      });
    }
  });

  // Ingest multiple documents
  fastify.post<{
    Body: {
      documents: Array<{ id: string; text: string; metadata?: Record<string, any> }>;
      chunkSize?: number;
      chunkOverlap?: number;
    };
  }>('/api/v1/documents/ingest-batch', async (request, reply) => {
    try {
      const { documents, chunkSize, chunkOverlap } = request.body;

      if (!documents || !Array.isArray(documents)) {
        throw new ValidationError('documents array is required');
      }

      logger.info({ count: documents.length }, 'Ingesting documents batch');

      const results = await documentProcessor.ingestDocuments(documents, {
        chunkSize,
        chunkOverlap,
      });

      const totalTime = results.reduce((sum, r) => sum + r.processingTimeMs, 0);

      logger.info(
        { count: results.length, totalTimeMs: totalTime },
        'Documents batch ingested successfully'
      );

      return { success: true, data: { results, totalTimeMs: totalTime } };
    } catch (error) {
      const err = handleError(error);
      logger.error({ error: err }, 'Documents batch ingestion failed');
      reply.code(err.statusCode).send({
        success: false,
        error: { code: err.code, message: err.message },
      });
    }
  });

  // Delete a document
  fastify.delete<{
    Params: { documentId: string };
  }>('/api/v1/documents/:documentId', async (request, reply) => {
    try {
      const { documentId } = request.params;

      logger.info({ documentId }, 'Deleting document');

      await documentProcessor.deleteDocument(documentId);

      logger.info({ documentId }, 'Document deleted successfully');

      return { success: true, data: { documentId } };
    } catch (error) {
      const err = handleError(error);
      logger.error({ error: err }, 'Document deletion failed');
      reply.code(err.statusCode).send({
        success: false,
        error: { code: err.code, message: err.message },
      });
    }
  });

  // Query documents (semantic search)
  fastify.post<{
    Body: {
      query: string;
      topK?: number;
      minScore?: number;
      filterMetadata?: Record<string, any>;
    };
  }>('/api/v1/query', async (request, reply) => {
    try {
      const { query, topK, minScore, filterMetadata } = request.body;

      if (!query) {
        throw new ValidationError('query is required');
      }

      logger.info({ query, topK }, 'Processing query');

      const result = await retriever.retrieve(query, {
        topK,
        minScore,
        filterMetadata,
      });

      logger.info(
        {
          query,
          resultCount: result.documents.length,
          timeMs: result.retrievalTimeMs,
        },
        'Query processed successfully'
      );

      return { success: true, data: result };
    } catch (error) {
      const err = handleError(error);
      logger.error({ error: err }, 'Query processing failed');
      reply.code(err.statusCode).send({
        success: false,
        error: { code: err.code, message: err.message },
      });
    }
  });

  // Hybrid search (semantic + keyword)
  fastify.post<{
    Body: {
      query: string;
      keywords: string[];
      topK?: number;
      minScore?: number;
    };
  }>('/api/v1/query/hybrid', async (request, reply) => {
    try {
      const { query, keywords, topK, minScore } = request.body;

      if (!query || !keywords || !Array.isArray(keywords)) {
        throw new ValidationError('query and keywords array are required');
      }

      logger.info({ query, keywords, topK }, 'Processing hybrid query');

      const result = await retriever.hybridSearch(query, keywords, {
        topK,
        minScore,
      });

      logger.info(
        {
          query,
          keywords,
          resultCount: result.documents.length,
          timeMs: result.retrievalTimeMs,
        },
        'Hybrid query processed successfully'
      );

      return { success: true, data: result };
    } catch (error) {
      const err = handleError(error);
      logger.error({ error: err }, 'Hybrid query processing failed');
      reply.code(err.statusCode).send({
        success: false,
        error: { code: err.code, message: err.message },
      });
    }
  });

  // Multi-query retrieval
  fastify.post<{
    Body: {
      queries: string[];
      topK?: number;
      minScore?: number;
    };
  }>('/api/v1/query/multi', async (request, reply) => {
    try {
      const { queries, topK, minScore } = request.body;

      if (!queries || !Array.isArray(queries)) {
        throw new ValidationError('queries array is required');
      }

      logger.info({ queries, topK }, 'Processing multi-query');

      const result = await retriever.multiQueryRetrieve(queries, {
        topK,
        minScore,
      });

      logger.info(
        {
          queries,
          resultCount: result.documents.length,
          timeMs: result.retrievalTimeMs,
        },
        'Multi-query processed successfully'
      );

      return { success: true, data: result };
    } catch (error) {
      const err = handleError(error);
      logger.error({ error: err }, 'Multi-query processing failed');
      reply.code(err.statusCode).send({
        success: false,
        error: { code: err.code, message: err.message },
      });
    }
  });

  // Streaming RAG query
  fastify.post<{
    Body: {
      query: string;
      topK?: number;
    };
  }>('/api/v1/query/stream', async (request, reply) => {
    try {
      const { query, topK } = request.body;

      if (!query) {
        throw new ValidationError('query is required');
      }

      logger.info({ query, topK }, 'Processing streaming query');

      // Retrieve documents
      const result = await retriever.retrieve(query, { topK });

      // Create streaming response
      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache');
      reply.raw.setHeader('Connection', 'keep-alive');

      const stream = StreamHandler.createRAGStream(
        result.documents,
        StreamHandler.mockResponseGenerator
      );

      return reply.send(stream);
    } catch (error) {
      const err = handleError(error);
      logger.error({ error: err }, 'Streaming query processing failed');
      reply.code(err.statusCode).send({
        success: false,
        error: { code: err.code, message: err.message },
      });
    }
  });

  // Get statistics
  fastify.get('/api/v1/stats', async (request, reply) => {
    try {
      const stats = await documentProcessor.getStats();
      const count = await vectorStore.count();

      return {
        success: true,
        data: {
          ...stats,
          vectorStoreCount: count,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      const err = handleError(error);
      reply.code(err.statusCode).send({
        success: false,
        error: { code: err.code, message: err.message },
      });
    }
  });
}

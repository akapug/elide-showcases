/**
 * Integration tests for end-to-end RAG workflows
 */

import { EmbeddingService } from '../src/embeddings/embedding-service';
import { VectorStore } from '../src/vectorstore/vector-store';
import { DocumentProcessor } from '../src/ingestion/document-processor';
import { Retriever } from '../src/retrieval/retriever';

describe('RAG Service Integration Tests', () => {
  let embeddingService: EmbeddingService;
  let vectorStore: VectorStore;
  let documentProcessor: DocumentProcessor;
  let retriever: Retriever;

  beforeAll(() => {
    embeddingService = new EmbeddingService('all-MiniLM-L6-v2');
    vectorStore = new VectorStore({
      collectionName: 'integration_test',
      dimension: 384,
      useFaiss: true,
    });
    documentProcessor = new DocumentProcessor(embeddingService, vectorStore);
    retriever = new Retriever(embeddingService, vectorStore);
  });

  afterAll(async () => {
    await vectorStore.reset();
  });

  describe('Document Ingestion and Retrieval', () => {
    it('should ingest documents and retrieve them', async () => {
      // Ingest documents
      const doc1 = 'Python is a popular programming language for data science.';
      const doc2 = 'JavaScript is widely used for web development.';
      const doc3 = 'Machine learning requires large amounts of training data.';

      await documentProcessor.ingestDocument('doc1', doc1);
      await documentProcessor.ingestDocument('doc2', doc2);
      await documentProcessor.ingestDocument('doc3', doc3);

      // Retrieve
      const result = await retriever.retrieve('programming languages', { topK: 2 });

      expect(result.documents.length).toBeGreaterThan(0);
      expect(result.documents.length).toBeLessThanOrEqual(2);
      expect(result.retrievalTimeMs).toBeGreaterThan(0);
    });

    it('should handle document chunking', async () => {
      const longDoc = `
        Artificial Intelligence has transformed many industries.
        Machine learning is a subset of AI that focuses on learning from data.
        Deep learning uses neural networks with multiple layers.
        Natural language processing enables computers to understand human language.
        Computer vision allows machines to interpret visual information.
      `.repeat(10); // Make it longer to trigger chunking

      const result = await documentProcessor.ingestDocument('long_doc', longDoc, {
        chunkSize: 200,
        chunkOverlap: 50,
      });

      expect(result.chunkCount).toBeGreaterThan(1);
      expect(result.chunkIds.length).toBe(result.chunkCount);
    });

    it('should support metadata filtering', async () => {
      await documentProcessor.ingestDocument('science_doc', 'Physics research', {
        metadata: { category: 'science', year: 2024 },
      });

      await documentProcessor.ingestDocument('history_doc', 'Historical events', {
        metadata: { category: 'history', year: 2023 },
      });

      const result = await retriever.retrieve('research', {
        topK: 5,
        filterMetadata: { category: 'science' },
      });

      // Results should only include science documents
      result.documents.forEach((doc) => {
        expect(doc.metadata.category).toBe('science');
      });
    });
  });

  describe('Hybrid Search', () => {
    beforeAll(async () => {
      await vectorStore.reset();

      const docs = [
        'Python machine learning library scikit-learn',
        'JavaScript React framework for web apps',
        'Machine learning model training with PyTorch',
        'Web development with Node.js and Express',
      ];

      for (let i = 0; i < docs.length; i++) {
        await documentProcessor.ingestDocument(`hybrid_doc_${i}`, docs[i]);
      }
    });

    it('should combine semantic and keyword search', async () => {
      const result = await retriever.hybridSearch(
        'programming libraries',
        ['Python', 'machine'],
        { topK: 3 }
      );

      expect(result.documents.length).toBeGreaterThan(0);

      // Check that results contain keywords
      result.documents.forEach((doc) => {
        const text = doc.text.toLowerCase();
        expect(
          text.includes('python') || text.includes('machine')
        ).toBe(true);
      });
    });
  });

  describe('Multi-Query Retrieval', () => {
    beforeAll(async () => {
      await vectorStore.reset();

      const docs = [
        'The Eiffel Tower is in Paris, France.',
        'Paris is the capital of France.',
        'The Louvre Museum is located in Paris.',
        'French cuisine is world-renowned.',
      ];

      for (let i = 0; i < docs.length; i++) {
        await documentProcessor.ingestDocument(`paris_doc_${i}`, docs[i]);
      }
    });

    it('should fuse results from multiple queries', async () => {
      const queries = [
        'Where is the Eiffel Tower?',
        'What is the capital of France?',
        'Tell me about Paris',
      ];

      const result = await retriever.multiQueryRetrieve(queries, { topK: 3 });

      expect(result.documents.length).toBeGreaterThan(0);
      expect(result.documents.length).toBeLessThanOrEqual(3);
      expect(result.query).toContain('|');
    });
  });

  describe('Performance Tests', () => {
    it('should handle rapid queries efficiently', async () => {
      await vectorStore.reset();

      // Ingest test data
      const docs = Array(20)
        .fill(0)
        .map((_, i) => `Test document ${i} with various content`);

      for (let i = 0; i < docs.length; i++) {
        await documentProcessor.ingestDocument(`perf_doc_${i}`, docs[i]);
      }

      // Run multiple queries
      const queries = ['test', 'document', 'content', 'various'];
      const startTime = Date.now();

      for (const query of queries) {
        await retriever.retrieve(query, { topK: 5 });
      }

      const duration = Date.now() - startTime;

      // 4 queries should complete in less than 100ms
      // This demonstrates the speed of in-process polyglot calls
      expect(duration).toBeLessThan(100);
    });

    it('should benchmark retrieval performance', async () => {
      const queries = ['test query 1', 'test query 2', 'test query 3'];

      const stats = await retriever.benchmark(queries, 5);

      expect(stats.avgRetrievalTimeMs).toBeGreaterThan(0);
      expect(stats.queriesPerSecond).toBeGreaterThan(0);
      expect(stats.minRetrievalTimeMs).toBeLessThanOrEqual(stats.avgRetrievalTimeMs);
      expect(stats.maxRetrievalTimeMs).toBeGreaterThanOrEqual(stats.avgRetrievalTimeMs);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty queries gracefully', async () => {
      await expect(retriever.retrieve('', { topK: 5 })).resolves.toBeDefined();
    });

    it('should handle very long documents', async () => {
      const veryLongDoc = 'A '.repeat(10000); // 20,000 characters

      const result = await documentProcessor.ingestDocument(
        'very_long_doc',
        veryLongDoc,
        { chunkSize: 512 }
      );

      expect(result.chunkCount).toBeGreaterThan(1);
      expect(result.processingTimeMs).toBeGreaterThan(0);
    });
  });

  describe('Document Management', () => {
    it('should delete documents and their chunks', async () => {
      const docId = 'deletable_doc';
      await documentProcessor.ingestDocument(docId, 'Document to be deleted');

      const statsBefore = await documentProcessor.getStats();
      const countBefore = statsBefore.totalChunks;

      await documentProcessor.deleteDocument(docId);

      const statsAfter = await documentProcessor.getStats();
      expect(statsAfter.totalChunks).toBeLessThan(countBefore);
    });

    it('should provide accurate statistics', async () => {
      await vectorStore.reset();

      await documentProcessor.ingestDocument('stats_doc_1', 'First document');
      await documentProcessor.ingestDocument('stats_doc_2', 'Second document');

      const stats = await documentProcessor.getStats();

      expect(stats.totalChunks).toBeGreaterThan(0);
      expect(stats.totalDocuments).toBeGreaterThan(0);
    });
  });
});

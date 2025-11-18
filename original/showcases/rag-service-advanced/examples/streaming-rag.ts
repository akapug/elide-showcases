/**
 * Streaming RAG Example
 * Demonstrates streaming responses for real-time user experience
 */

import { EmbeddingService } from '../src/embeddings/embedding-service';
import { VectorStore } from '../src/vectorstore/vector-store';
import { DocumentProcessor } from '../src/ingestion/document-processor';
import { Retriever } from '../src/retrieval/retriever';
import { StreamHandler, StreamChunk } from '../src/streaming/stream-handler';
import { Readable } from 'stream';

async function consumeStream(stream: Readable): Promise<void> {
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => {
      const chunkStr = chunk.toString();
      const lines = chunkStr.split('\n').filter((l) => l.trim());

      for (const line of lines) {
        try {
          const streamChunk: StreamChunk = JSON.parse(line);

          switch (streamChunk.type) {
            case 'context':
              console.log(`   📄 Context: ${streamChunk.data.text}`);
              console.log(`      Score: ${streamChunk.data.score.toFixed(3)}`);
              break;

            case 'metadata':
              console.log(`   📊 Metadata: ${JSON.stringify(streamChunk.data)}`);
              break;

            case 'text':
              process.stdout.write(streamChunk.data);
              break;

            case 'done':
              console.log('\n   ✓ Stream complete');
              break;

            case 'error':
              console.error(`   ❌ Error: ${streamChunk.data.message}`);
              break;
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    });

    stream.on('end', resolve);
    stream.on('error', reject);
  });
}

async function main() {
  console.log('🚀 Streaming RAG Example\n');

  // Initialize services
  console.log('1️⃣  Initializing services...');
  const embeddingService = new EmbeddingService('all-MiniLM-L6-v2');
  const vectorStore = new VectorStore({
    collectionName: 'streaming_example',
    dimension: 384,
    useFaiss: true,
  });
  const documentProcessor = new DocumentProcessor(embeddingService, vectorStore);
  const retriever = new Retriever(embeddingService, vectorStore);
  console.log('✓ Services initialized\n');

  // Ingest knowledge base
  console.log('2️⃣  Ingesting knowledge base...');
  const documents = [
    {
      id: 'elide_intro',
      text: `Elide is a polyglot runtime that enables running multiple programming languages
             in a single process. It eliminates the network latency and serialization overhead
             of microservices by allowing direct in-process calls between languages like
             TypeScript and Python.`,
    },
    {
      id: 'elide_benefits',
      text: `The key benefits of Elide include: zero network latency for inter-language calls,
             no serialization overhead, simplified deployment with single binaries, reduced
             infrastructure costs, and the ability to use the best language for each task
             without performance penalties.`,
    },
    {
      id: 'rag_architecture',
      text: `RAG (Retrieval-Augmented Generation) combines information retrieval with text
             generation. It first retrieves relevant documents using semantic search, then uses
             those documents as context for generating accurate, grounded responses.`,
    },
  ];

  for (const doc of documents) {
    await documentProcessor.ingestDocument(doc.id, doc.text);
  }
  console.log('✓ Knowledge base ready\n');

  // Example 1: Streaming RAG Query
  console.log('3️⃣  Example 1: Streaming RAG Response\n');
  console.log('   Query: "What is Elide and what are its benefits?"\n');

  const query = 'What is Elide and what are its benefits?';
  const result = await retriever.retrieve(query, { topK: 3 });

  console.log('   📡 Streaming response:\n');
  const stream = StreamHandler.createRAGStream(
    result.documents,
    StreamHandler.mockResponseGenerator
  );

  await consumeStream(stream);

  // Example 2: Streaming Document Ingestion
  console.log('\n\n4️⃣  Example 2: Streaming Document Ingestion\n');
  console.log('   Ingesting multiple documents with progress tracking:\n');

  const newDocs = [
    { id: 'streaming_doc_1', text: 'First document for streaming ingestion' },
    { id: 'streaming_doc_2', text: 'Second document for streaming ingestion' },
    { id: 'streaming_doc_3', text: 'Third document for streaming ingestion' },
  ];

  const ingestionStream = StreamHandler.createIngestionStream(
    newDocs,
    async (doc) => {
      return await documentProcessor.ingestDocument(doc.id, doc.text);
    }
  );

  console.log('   📊 Ingestion progress:\n');

  await new Promise<void>((resolve, reject) => {
    ingestionStream.on('data', (chunk) => {
      const chunkStr = chunk.toString();
      const lines = chunkStr.split('\n').filter((l) => l.trim());

      for (const line of lines) {
        try {
          const data = JSON.parse(line);

          if (data.type === 'progress') {
            console.log(
              `   ${data.data.processed}/${data.data.total} - ${data.data.documentId} ` +
              `(${data.data.processingTimeMs}ms, ${data.data.result.chunkCount} chunks)`
            );
          } else if (data.type === 'done') {
            console.log(`\n   ✓ Ingestion complete (${data.data.total} documents)`);
          } else if (data.type === 'error') {
            console.error(`   ❌ Error: ${data.data.error}`);
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    });

    ingestionStream.on('end', resolve);
    ingestionStream.on('error', reject);
  });

  // Example 3: Text Stream Generator
  console.log('\n\n5️⃣  Example 3: Custom Text Stream\n');
  console.log('   Streaming custom generated text:\n   ');

  async function* customTextGenerator(): AsyncGenerator<string, void, unknown> {
    const sentences = [
      'Streaming responses provide better user experience.',
      'Users see content as it\'s generated.',
      'This reduces perceived latency.',
      'Elide makes this fast and efficient!',
    ];

    for (const sentence of sentences) {
      const words = sentence.split(' ');
      for (const word of words) {
        yield word + ' ';
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
      yield '\n   ';
    }
  }

  const textStream = StreamHandler.createTextStream(customTextGenerator());

  await new Promise<void>((resolve, reject) => {
    textStream.on('data', (chunk) => {
      process.stdout.write(chunk.toString());
    });
    textStream.on('end', () => {
      console.log('\n   ✓ Text stream complete');
      resolve();
    });
    textStream.on('error', reject);
  });

  console.log('\n\n💡 Key Insights:');
  console.log('   • Streaming provides immediate feedback to users');
  console.log('   • Context documents are sent first, then generated text');
  console.log('   • Progress tracking keeps users informed during long operations');
  console.log('   • All streaming happens in-process with minimal overhead');

  // Cleanup
  await vectorStore.reset();
  console.log('\n✓ Streaming example complete!');
}

main().catch(console.error);

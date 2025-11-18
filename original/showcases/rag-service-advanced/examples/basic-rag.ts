/**
 * Basic RAG Example
 * Demonstrates simple document ingestion and querying
 */

import { EmbeddingService } from '../src/embeddings/embedding-service';
import { VectorStore } from '../src/vectorstore/vector-store';
import { DocumentProcessor } from '../src/ingestion/document-processor';
import { Retriever } from '../src/retrieval/retriever';

async function main() {
  console.log('🚀 Basic RAG Example\n');

  // Step 1: Initialize services
  console.log('1️⃣  Initializing services...');
  const embeddingService = new EmbeddingService('all-MiniLM-L6-v2');
  const vectorStore = new VectorStore({
    collectionName: 'basic_example',
    dimension: 384,
    useFaiss: true,
  });
  const documentProcessor = new DocumentProcessor(embeddingService, vectorStore);
  const retriever = new Retriever(embeddingService, vectorStore);
  console.log('✓ Services initialized\n');

  // Step 2: Ingest knowledge base
  console.log('2️⃣  Ingesting knowledge base...');
  const documents = [
    {
      id: 'doc_python',
      text: `Python is a high-level, interpreted programming language known for its
             simplicity and readability. It's widely used in data science, machine learning,
             web development, and automation. Python has a rich ecosystem of libraries like
             NumPy, Pandas, and TensorFlow.`,
    },
    {
      id: 'doc_javascript',
      text: `JavaScript is a versatile programming language primarily used for web development.
             It enables interactive web pages and is an essential part of web browsers. Modern
             JavaScript frameworks like React, Vue, and Angular power complex web applications.`,
    },
    {
      id: 'doc_ml',
      text: `Machine Learning is a subset of artificial intelligence that enables systems to
             learn and improve from experience without being explicitly programmed. It uses
             algorithms to analyze data, identify patterns, and make decisions with minimal
             human intervention.`,
    },
    {
      id: 'doc_cloud',
      text: `Cloud computing provides on-demand access to computing resources over the internet.
             Major cloud providers like AWS, Azure, and Google Cloud offer services including
             storage, databases, computing power, and machine learning platforms.`,
    },
    {
      id: 'doc_databases',
      text: `Databases are organized collections of structured information. SQL databases like
             PostgreSQL and MySQL use tables and relationships, while NoSQL databases like
             MongoDB and Redis offer flexible schemas for different use cases.`,
    },
  ];

  for (const doc of documents) {
    const result = await documentProcessor.ingestDocument(doc.id, doc.text);
    console.log(
      `  ✓ Ingested ${doc.id}: ${result.chunkCount} chunks (${result.processingTimeMs}ms)`
    );
  }
  console.log('✓ Knowledge base ready\n');

  // Step 3: Query the knowledge base
  console.log('3️⃣  Querying the knowledge base...\n');

  const queries = [
    'What is Python used for?',
    'Tell me about machine learning',
    'Which databases are available?',
  ];

  for (const query of queries) {
    console.log(`📝 Query: "${query}"`);

    const result = await retriever.retrieve(query, { topK: 2 });

    console.log(`   Retrieval time: ${result.retrievalTimeMs.toFixed(2)}ms`);
    console.log(`   Found ${result.documents.length} relevant documents:\n`);

    result.documents.forEach((doc, index) => {
      console.log(`   ${index + 1}. [Score: ${doc.score.toFixed(3)}]`);
      console.log(`      ${doc.text.substring(0, 120)}...`);
      console.log('');
    });
  }

  // Step 4: Get statistics
  console.log('4️⃣  Knowledge base statistics:');
  const stats = await documentProcessor.getStats();
  console.log(`   Total documents: ${stats.totalDocuments}`);
  console.log(`   Total chunks: ${stats.totalChunks}`);

  // Cleanup
  await vectorStore.reset();
  console.log('\n✓ Example complete!');
}

main().catch(console.error);

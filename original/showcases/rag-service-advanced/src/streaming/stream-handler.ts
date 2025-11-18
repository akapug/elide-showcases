/**
 * Streaming response handler for RAG queries
 * Enables real-time progressive responses
 */

import { Readable } from 'stream';
import { RetrievedDocument } from '../retrieval/retriever';

export interface StreamChunk {
  type: 'context' | 'text' | 'metadata' | 'done' | 'error';
  data: any;
  timestamp: number;
}

export class StreamHandler {
  /**
   * Create a stream for RAG response
   * Streams context documents first, then generated text
   */
  static createRAGStream(
    documents: RetrievedDocument[],
    generateResponse: (context: string) => AsyncGenerator<string, void, unknown>
  ): Readable {
    const stream = new Readable({
      async read() {
        try {
          // Stream 1: Send context documents
          for (const doc of documents) {
            const chunk: StreamChunk = {
              type: 'context',
              data: {
                id: doc.id,
                text: doc.text.substring(0, 200) + '...',
                score: doc.score,
              },
              timestamp: Date.now(),
            };
            this.push(JSON.stringify(chunk) + '\n');
          }

          // Stream 2: Send metadata
          const metadataChunk: StreamChunk = {
            type: 'metadata',
            data: {
              documentCount: documents.length,
              avgScore: documents.reduce((sum, d) => sum + d.score, 0) / documents.length,
            },
            timestamp: Date.now(),
          };
          this.push(JSON.stringify(metadataChunk) + '\n');

          // Stream 3: Generate and stream response text
          const context = documents.map((d) => d.text).join('\n\n');
          const generator = generateResponse(context);

          for await (const text of generator) {
            const textChunk: StreamChunk = {
              type: 'text',
              data: text,
              timestamp: Date.now(),
            };
            this.push(JSON.stringify(textChunk) + '\n');
          }

          // Stream 4: Done
          const doneChunk: StreamChunk = {
            type: 'done',
            data: null,
            timestamp: Date.now(),
          };
          this.push(JSON.stringify(doneChunk) + '\n');
          this.push(null); // End stream
        } catch (error) {
          const errorChunk: StreamChunk = {
            type: 'error',
            data: { message: (error as Error).message },
            timestamp: Date.now(),
          };
          this.push(JSON.stringify(errorChunk) + '\n');
          this.push(null);
        }
      },
    });

    return stream;
  }

  /**
   * Create a simple text stream
   */
  static createTextStream(
    generator: AsyncGenerator<string, void, unknown>
  ): Readable {
    const stream = new Readable({
      async read() {
        try {
          for await (const text of generator) {
            this.push(text);
          }
          this.push(null);
        } catch (error) {
          this.destroy(error as Error);
        }
      },
    });

    return stream;
  }

  /**
   * Create a JSON stream
   */
  static createJSONStream(
    generator: AsyncGenerator<any, void, unknown>
  ): Readable {
    const stream = new Readable({
      async read() {
        try {
          for await (const data of generator) {
            this.push(JSON.stringify(data) + '\n');
          }
          this.push(null);
        } catch (error) {
          const errorData = {
            error: true,
            message: (error as Error).message,
          };
          this.push(JSON.stringify(errorData) + '\n');
          this.push(null);
        }
      },
    });

    return stream;
  }

  /**
   * Mock response generator (would integrate with LLM in production)
   */
  static async *mockResponseGenerator(context: string): AsyncGenerator<string, void, unknown> {
    const response = `Based on the provided context, here's a comprehensive answer:\n\n`;

    // Simulate streaming response word by word
    const words = response.split(' ');
    for (const word of words) {
      yield word + ' ';
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // Add context summary
    yield '\n\nContext summary:\n';
    const contextPreview = context.substring(0, 200) + '...';
    const contextWords = contextPreview.split(' ');
    for (const word of contextWords) {
      yield word + ' ';
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
  }

  /**
   * Stream document ingestion progress
   */
  static createIngestionStream(
    documents: Array<{ id: string; text: string }>,
    processor: (doc: { id: string; text: string }) => Promise<any>
  ): Readable {
    let index = 0;

    const stream = new Readable({
      async read() {
        if (index >= documents.length) {
          const doneChunk = {
            type: 'done',
            data: { total: documents.length },
            timestamp: Date.now(),
          };
          this.push(JSON.stringify(doneChunk) + '\n');
          this.push(null);
          return;
        }

        const doc = documents[index];
        index++;

        try {
          // Process document
          const startTime = Date.now();
          const result = await processor(doc);
          const processingTime = Date.now() - startTime;

          const chunk = {
            type: 'progress',
            data: {
              documentId: doc.id,
              processed: index,
              total: documents.length,
              processingTimeMs: processingTime,
              result,
            },
            timestamp: Date.now(),
          };
          this.push(JSON.stringify(chunk) + '\n');
        } catch (error) {
          const errorChunk = {
            type: 'error',
            data: {
              documentId: doc.id,
              error: (error as Error).message,
            },
            timestamp: Date.now(),
          };
          this.push(JSON.stringify(errorChunk) + '\n');
        }
      },
    });

    return stream;
  }
}

/**
 * Server-Sent Events (SSE) formatter
 */
export class SSEFormatter {
  static format(chunk: StreamChunk): string {
    return `data: ${JSON.stringify(chunk)}\n\n`;
  }

  static formatEvent(event: string, data: any): string {
    return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  }
}

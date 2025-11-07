/**
 * ElideHTML - Server-Sent Events (SSE)
 *
 * Live updates and real-time data streaming.
 */

export interface SseMessage {
  id?: string;
  event?: string;
  data: any;
  retry?: number;
}

export interface SseOptions {
  retry?: number;
  keepAlive?: number;
}

/**
 * SSE Stream for sending events to clients
 */
export class SseStream {
  private controller: ReadableStreamDefaultController<string> | null = null;
  private keepAliveInterval?: number;
  private closed = false;

  constructor(private options: SseOptions = {}) {
    this.options.keepAlive = this.options.keepAlive || 30000; // 30 seconds
  }

  /**
   * Create a ReadableStream for SSE
   */
  createStream(): ReadableStream<string> {
    const self = this;

    return new ReadableStream({
      start(controller) {
        self.controller = controller;

        // Send initial headers
        if (self.options.retry) {
          controller.enqueue(`retry: ${self.options.retry}\n\n`);
        }

        // Start keep-alive
        if (self.options.keepAlive) {
          self.keepAliveInterval = setInterval(() => {
            if (!self.closed) {
              controller.enqueue(': keep-alive\n\n');
            }
          }, self.options.keepAlive) as any;
        }
      },

      cancel() {
        self.close();
      },
    });
  }

  /**
   * Send an event
   */
  send(message: SseMessage): void {
    if (this.closed || !this.controller) {
      throw new Error('Stream is closed');
    }

    let output = '';

    if (message.id) {
      output += `id: ${message.id}\n`;
    }

    if (message.event) {
      output += `event: ${message.event}\n`;
    }

    // Serialize data
    const data =
      typeof message.data === 'string' ? message.data : JSON.stringify(message.data);

    // Split by lines for SSE format
    for (const line of data.split('\n')) {
      output += `data: ${line}\n`;
    }

    output += '\n';

    this.controller.enqueue(output);
  }

  /**
   * Send a comment (for keep-alive)
   */
  comment(text: string): void {
    if (this.closed || !this.controller) {
      return;
    }

    this.controller.enqueue(`: ${text}\n\n`);
  }

  /**
   * Close the stream
   */
  close(): void {
    if (this.closed) {
      return;
    }

    this.closed = true;

    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
    }

    if (this.controller) {
      try {
        this.controller.close();
      } catch (e) {
        // Already closed
      }
    }
  }

  /**
   * Check if stream is closed
   */
  isClosed(): boolean {
    return this.closed;
  }
}

/**
 * SSE Manager for handling multiple streams
 */
export class SseManager {
  private streams: Map<string, SseStream> = new Map();

  /**
   * Create a new stream
   */
  create(id: string, options?: SseOptions): SseStream {
    const stream = new SseStream(options);
    this.streams.set(id, stream);
    return stream;
  }

  /**
   * Get an existing stream
   */
  get(id: string): SseStream | undefined {
    return this.streams.get(id);
  }

  /**
   * Send to a specific stream
   */
  send(id: string, message: SseMessage): void {
    const stream = this.streams.get(id);
    if (stream) {
      stream.send(message);
    }
  }

  /**
   * Broadcast to all streams
   */
  broadcast(message: SseMessage): void {
    for (const stream of this.streams.values()) {
      if (!stream.isClosed()) {
        stream.send(message);
      }
    }
  }

  /**
   * Close a stream
   */
  close(id: string): void {
    const stream = this.streams.get(id);
    if (stream) {
      stream.close();
      this.streams.delete(id);
    }
  }

  /**
   * Close all streams
   */
  closeAll(): void {
    for (const [id, stream] of this.streams.entries()) {
      stream.close();
      this.streams.delete(id);
    }
  }

  /**
   * Get active stream count
   */
  count(): number {
    return this.streams.size;
  }

  /**
   * Clean up closed streams
   */
  cleanup(): void {
    for (const [id, stream] of this.streams.entries()) {
      if (stream.isClosed()) {
        this.streams.delete(id);
      }
    }
  }
}

export const sseManager = new SseManager();

/**
 * SSE Response helpers
 */
export function createSseResponse(stream: SseStream): Response {
  return new Response(stream.createStream(), {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}

/**
 * SSE Channel for pub/sub pattern
 */
export class SseChannel {
  private subscribers: Set<SseStream> = new Set();
  private messageHistory: SseMessage[] = [];
  private maxHistory: number;

  constructor(options: { maxHistory?: number } = {}) {
    this.maxHistory = options.maxHistory || 0;
  }

  /**
   * Subscribe to the channel
   */
  subscribe(stream: SseStream, sendHistory = false): void {
    this.subscribers.add(stream);

    // Send history if requested
    if (sendHistory && this.messageHistory.length > 0) {
      for (const message of this.messageHistory) {
        stream.send(message);
      }
    }
  }

  /**
   * Unsubscribe from the channel
   */
  unsubscribe(stream: SseStream): void {
    this.subscribers.delete(stream);
  }

  /**
   * Publish a message to all subscribers
   */
  publish(message: SseMessage): void {
    // Add to history
    if (this.maxHistory > 0) {
      this.messageHistory.push(message);
      if (this.messageHistory.length > this.maxHistory) {
        this.messageHistory.shift();
      }
    }

    // Send to all subscribers
    for (const stream of this.subscribers) {
      if (!stream.isClosed()) {
        stream.send(message);
      }
    }

    // Clean up closed streams
    this.cleanup();
  }

  /**
   * Get subscriber count
   */
  count(): number {
    return this.subscribers.size;
  }

  /**
   * Clean up closed streams
   */
  cleanup(): void {
    for (const stream of this.subscribers) {
      if (stream.isClosed()) {
        this.subscribers.delete(stream);
      }
    }
  }

  /**
   * Close all streams
   */
  close(): void {
    for (const stream of this.subscribers) {
      stream.close();
    }
    this.subscribers.clear();
  }
}

/**
 * SSE Helper for common patterns
 */
export const sse = {
  /**
   * Create a counter stream
   */
  counter(start = 0, interval = 1000): SseStream {
    const stream = new SseStream();
    let count = start;

    const timer = setInterval(() => {
      if (stream.isClosed()) {
        clearInterval(timer);
        return;
      }

      stream.send({
        event: 'count',
        data: { count: count++ },
      });
    }, interval);

    return stream;
  },

  /**
   * Create a clock stream
   */
  clock(interval = 1000): SseStream {
    const stream = new SseStream();

    const timer = setInterval(() => {
      if (stream.isClosed()) {
        clearInterval(timer);
        return;
      }

      stream.send({
        event: 'time',
        data: { time: new Date().toISOString() },
      });
    }, interval);

    return stream;
  },

  /**
   * Create a progress stream
   */
  progress(total: number, getCurrentProgress: () => number): SseStream {
    const stream = new SseStream();

    const timer = setInterval(() => {
      if (stream.isClosed()) {
        clearInterval(timer);
        return;
      }

      const current = getCurrentProgress();
      const percent = (current / total) * 100;

      stream.send({
        event: 'progress',
        data: { current, total, percent },
      });

      if (current >= total) {
        stream.send({
          event: 'complete',
          data: { message: 'Complete!' },
        });
        stream.close();
        clearInterval(timer);
      }
    }, 100);

    return stream;
  },
};

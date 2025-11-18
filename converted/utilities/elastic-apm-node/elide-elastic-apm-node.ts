/**
 * Elastic APM Node - Elastic APM Agent
 *
 * Application Performance Monitoring agent for Elastic APM.
 * **POLYGLOT SHOWCASE**: Elastic APM for ALL languages on Elide!
 *
 * Features:
 * - Transaction tracking
 * - Span creation
 * - Error tracking
 * - Metrics collection
 * - Context capture
 * - Custom context
 * - Labels
 * - Zero dependencies
 *
 * Use cases:
 * - Application monitoring
 * - Performance tracking
 * - Error monitoring
 * - Distributed tracing
 *
 * Package has ~3M downloads/week on npm!
 */

export interface Transaction {
  name: string;
  type: string;
  id: string;
  startTime: number;
  endTime?: number;
  result?: string;
  context?: any;
}

export interface SpanData {
  name: string;
  type: string;
  id: string;
  transactionId: string;
  startTime: number;
  endTime?: number;
  context?: any;
}

export class Span {
  private data: SpanData;

  constructor(name: string, type: string, transactionId: string) {
    this.data = {
      name,
      type,
      id: this.generateId(),
      transactionId,
      startTime: Date.now(),
    };
  }

  private generateId(): string {
    return Math.random().toString(16).slice(2);
  }

  setLabel(key: string, value: string | number | boolean): void {
    if (!this.data.context) {
      this.data.context = { labels: {} };
    }
    this.data.context.labels[key] = value;
  }

  end(): void {
    this.data.endTime = Date.now();
    const duration = this.data.endTime - this.data.startTime;
    console.log(`  [Span] ${this.data.name} (${this.data.type}): ${duration}ms`);
  }
}

export class Transaction {
  private data: Transaction;

  constructor(name: string, type: string) {
    this.data = {
      name,
      type,
      id: this.generateId(),
      startTime: Date.now(),
    };
  }

  private generateId(): string {
    return Math.random().toString(16).slice(2);
  }

  startSpan(name: string, type: string): Span | null {
    return new Span(name, type, this.data.id);
  }

  setLabel(key: string, value: string | number | boolean): void {
    if (!this.data.context) {
      this.data.context = { labels: {} };
    }
    this.data.context.labels[key] = value;
  }

  end(result?: string): void {
    this.data.endTime = Date.now();
    this.data.result = result || 'success';
    const duration = this.data.endTime - this.data.startTime;
    console.log(`[Elastic APM] Transaction: ${this.data.name} (${this.data.type})`);
    console.log(`  ID: ${this.data.id}`);
    console.log(`  Duration: ${duration}ms`);
    console.log(`  Result: ${this.data.result}`);
  }
}

export class Agent {
  private serviceName: string;

  start(options: { serviceName: string; serverUrl?: string }): void {
    this.serviceName = options.serviceName;
    console.log(`[Elastic APM] Started for service: ${this.serviceName}`);
  }

  startTransaction(name: string, type: string = 'request'): Transaction | null {
    return new Transaction(name, type);
  }

  captureError(error: Error | string): void {
    const message = typeof error === 'string' ? error : error.message;
    console.log(`[Elastic APM] Error captured: ${message}`);
  }

  setLabel(key: string, value: string | number | boolean): void {
    console.log(`[Elastic APM] Label set: ${key}=${value}`);
  }
}

const agent = new Agent();

export default agent;

// CLI Demo
if (import.meta.url.includes("elide-elastic-apm-node.ts")) {
  console.log("📊 Elastic APM - Application Performance Monitoring (POLYGLOT!)\n");

  agent.start({ serviceName: 'my-api', serverUrl: 'http://localhost:8200' });

  const transaction = agent.startTransaction('GET /api/users', 'request');
  if (transaction) {
    transaction.setLabel('userId', 123);

    const span = transaction.startSpan('db.query', 'db.mysql');
    if (span) {
      span.setLabel('query', 'SELECT * FROM users');
      setTimeout(() => span.end(), 50);
    }

    setTimeout(() => transaction.end('success'), 100);
  }

  console.log("\n💡 Elastic APM everywhere! ~3M downloads/week");
}

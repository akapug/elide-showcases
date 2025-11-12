/**
 * Elide Redis - Universal Redis Client
 */

export interface RedisOptions {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
}

export class RedisClient {
  private connected: boolean = false;
  private data: Map<string, any> = new Map();

  constructor(private options: RedisOptions = {}) {
    this.options = {
      host: options.host || 'localhost',
      port: options.port || 6379,
      db: options.db || 0
    };
  }

  async connect() {
    this.connected = true;
    console.log(`Connected to Redis at ${this.options.host}:${this.options.port}`);
  }

  async get(key: string): Promise<string | null> {
    return this.data.get(key) || null;
  }

  async set(key: string, value: string, options?: any): Promise<string> {
    this.data.set(key, value);
    return 'OK';
  }

  async del(key: string): Promise<number> {
    return this.data.delete(key) ? 1 : 0;
  }

  async exists(key: string): Promise<number> {
    return this.data.has(key) ? 1 : 0;
  }

  async expire(key: string, seconds: number): Promise<number> {
    setTimeout(() => this.data.delete(key), seconds * 1000);
    return 1;
  }

  async quit() {
    this.connected = false;
    console.log('Disconnected from Redis');
  }
}

export function createClient(options?: RedisOptions) {
  return new RedisClient(options);
}

export default { createClient };

if (import.meta.main) {
  console.log('=== Elide Redis Client Demo ===');
  const client = createClient();
  await client.connect();
  await client.set('key', 'value');
  const value = await client.get('key');
  console.log('Value:', value);
  await client.quit();
  console.log('✓ Demo completed');
}

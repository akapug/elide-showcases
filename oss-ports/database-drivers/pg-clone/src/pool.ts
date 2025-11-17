import * as types from './types';
import { Client } from './client';

export { PoolConfig } from './types';

export class Pool {
  private config: types.PoolConfig;
  private clients: Client[] = [];
  private idleClients: Client[] = [];
  private waitQueue: Array<{ resolve: Function; reject: Function }> = [];
  private ending: boolean = false;

  constructor(config: types.PoolConfig = {}) {
    this.config = {
      max: 10,
      min: 0,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 0,
      ...config
    };
  }

  async connect(): Promise<Client> {
    if (this.ending) {
      throw new Error('Pool is ending');
    }

    const client = this.idleClients.pop();
    if (client) {
      return client;
    }

    if (this.clients.length < this.config.max!) {
      const newClient = new Client(this.config);
      await newClient.connect();
      this.clients.push(newClient);
      return newClient;
    }

    return new Promise((resolve, reject) => {
      const timeout = this.config.connectionTimeoutMillis
        ? setTimeout(() => {
            const index = this.waitQueue.findIndex(w => w.resolve === resolve);
            if (index !== -1) {
              this.waitQueue.splice(index, 1);
            }
            reject(new Error('Connection timeout'));
          }, this.config.connectionTimeoutMillis)
        : null;

      this.waitQueue.push({
        resolve: (client: Client) => {
          if (timeout) clearTimeout(timeout);
          resolve(client);
        },
        reject: (error: Error) => {
          if (timeout) clearTimeout(timeout);
          reject(error);
        }
      });
    });
  }

  release(client: Client): void {
    if (this.ending) {
      client.end();
      return;
    }

    if (this.waitQueue.length > 0) {
      const waiter = this.waitQueue.shift()!;
      waiter.resolve(client);
    } else {
      this.idleClients.push(client);
    }
  }

  async query<T = any>(text: string, values?: any[]): Promise<types.QueryResult<T>>;
  async query<T = any>(config: types.QueryConfig): Promise<types.QueryResult<T>>;
  async query<T = any>(textOrConfig: string | types.QueryConfig, values?: any[]): Promise<types.QueryResult<T>> {
    const client = await this.connect();
    try {
      return await client.query<T>(textOrConfig as any, values);
    } finally {
      this.release(client);
    }
  }

  async end(): Promise<void> {
    this.ending = true;

    for (const waiter of this.waitQueue) {
      waiter.reject(new Error('Pool is ending'));
    }
    this.waitQueue = [];

    const closePromises = this.clients.map(client => client.end());
    await Promise.all(closePromises);

    this.clients = [];
    this.idleClients = [];
  }

  get totalCount(): number {
    return this.clients.length;
  }

  get idleCount(): number {
    return this.idleClients.length;
  }

  get waitingCount(): number {
    return this.waitQueue.length;
  }
}

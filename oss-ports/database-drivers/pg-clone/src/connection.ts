import * as types from './types';

export class Connection {
  private config: types.ClientConfig;
  private handle: any;
  public processID?: number;
  public secretKey?: number;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor(config: types.ClientConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    this.handle = await this.nativeConnect(this.config);
    const { processID, secretKey } = await this.nativeGetConnectionInfo(this.handle);
    this.processID = processID;
    this.secretKey = secretKey;
  }

  async query(config: types.QueryConfig): Promise<types.QueryResult> {
    return this.nativeQuery(this.handle, config);
  }

  async copyFrom(query: string): Promise<any> {
    return this.nativeCopyFrom(this.handle, query);
  }

  async copyTo(query: string): Promise<any> {
    return this.nativeCopyTo(this.handle, query);
  }

  on(event: string, handler: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  off(event: string, handler: Function): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  async close(): Promise<void> {
    if (this.handle) {
      await this.nativeClose(this.handle);
      this.handle = null;
    }
  }

  private nativeConnect(config: types.ClientConfig): Promise<any> {
    return (globalThis as any).__elide_pg_connect?.(config) || Promise.resolve({ mock: true });
  }

  private nativeGetConnectionInfo(handle: any): Promise<any> {
    return (globalThis as any).__elide_pg_connection_info?.(handle) || Promise.resolve({ processID: 0, secretKey: 0 });
  }

  private nativeQuery(handle: any, config: types.QueryConfig): Promise<types.QueryResult> {
    return (globalThis as any).__elide_pg_query?.(handle, config) || Promise.resolve({ rows: [], fields: [], rowCount: 0, command: '', oid: 0 });
  }

  private nativeCopyFrom(handle: any, query: string): Promise<any> {
    return (globalThis as any).__elide_pg_copy_from?.(handle, query);
  }

  private nativeCopyTo(handle: any, query: string): Promise<any> {
    return (globalThis as any).__elide_pg_copy_to?.(handle, query);
  }

  private nativeClose(handle: any): Promise<void> {
    return (globalThis as any).__elide_pg_close?.(handle) || Promise.resolve();
  }
}

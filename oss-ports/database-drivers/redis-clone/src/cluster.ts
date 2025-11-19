/**
 * Redis Cluster support
 */

import * as types from './types';
import { RedisClient } from './client';

export class RedisCluster {
  private options: types.ClusterOptions;
  private nodes: Map<string, RedisClient> = new Map();
  private slots: Map<number, string> = new Map(); // slot -> node mapping
  private ready: boolean = false;

  constructor(options: types.ClusterOptions) {
    this.options = {
      scaleReads: 'master',
      maxRedirections: 16,
      ...options
    };

    this.initialize();
  }

  /**
   * Initialize cluster connections
   */
  private async initialize(): Promise<void> {
    // Connect to initial nodes
    for (const node of this.options.nodes) {
      const key = `${node.host}:${node.port}`;
      const client = new RedisClient({
        host: node.host,
        port: node.port,
        ...this.options.redisOptions
      });

      await client.connect();
      this.nodes.set(key, client);
    }

    // Discover cluster topology
    await this.refreshSlots();

    this.ready = true;
  }

  /**
   * Refresh cluster slot mapping
   */
  private async refreshSlots(): Promise<void> {
    // Get first available node
    const client = Array.from(this.nodes.values())[0];
    if (!client) {
      throw new types.ClusterError('No nodes available');
    }

    // Execute CLUSTER SLOTS command
    const slots = await client.sendCommand(['CLUSTER', 'SLOTS']);

    // Parse slot information
    for (const slot of slots) {
      const [start, end, master] = slot;
      const nodeKey = `${master[0]}:${master[1]}`;

      // Map each slot to the master node
      for (let i = start; i <= end; i++) {
        this.slots.set(i, nodeKey);
      }

      // Connect to node if not already connected
      if (!this.nodes.has(nodeKey)) {
        const client = new RedisClient({
          host: master[0],
          port: master[1],
          ...this.options.redisOptions
        });
        await client.connect();
        this.nodes.set(nodeKey, client);
      }
    }
  }

  /**
   * Calculate slot for key
   */
  private calculateSlot(key: string): number {
    // Extract hash tag if present
    const start = key.indexOf('{');
    if (start !== -1) {
      const end = key.indexOf('}', start + 1);
      if (end !== -1 && end !== start + 1) {
        key = key.substring(start + 1, end);
      }
    }

    // Calculate CRC16
    return this.crc16(key) % 16384;
  }

  /**
   * CRC16 implementation
   */
  private crc16(str: string): number {
    const crcTable = [
      0x0000, 0x1021, 0x2042, 0x3063, 0x4084, 0x50a5, 0x60c6, 0x70e7,
      0x8108, 0x9129, 0xa14a, 0xb16b, 0xc18c, 0xd1ad, 0xe1ce, 0xf1ef
    ];

    let crc = 0;
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      crc = ((crc << 4) ^ crcTable[(crc >> 12) ^ (c >> 4)]) & 0xffff;
      crc = ((crc << 4) ^ crcTable[(crc >> 12) ^ (c & 0x0f)]) & 0xffff;
    }
    return crc;
  }

  /**
   * Get client for key
   */
  private getClientForKey(key: string): RedisClient {
    const slot = this.calculateSlot(key);
    const nodeKey = this.slots.get(slot);

    if (!nodeKey) {
      throw new types.ClusterError(`No node found for slot ${slot}`);
    }

    const client = this.nodes.get(nodeKey);
    if (!client) {
      throw new types.ClusterError(`Node ${nodeKey} not connected`);
    }

    return client;
  }

  /**
   * Execute command on appropriate node
   */
  async sendCommand(args: types.CommandArgs): Promise<any> {
    if (!this.ready) {
      throw new types.ClusterError('Cluster not ready');
    }

    // Extract key from command
    const key = args[1] as string;
    let redirections = 0;

    while (redirections < this.options.maxRedirections!) {
      try {
        const client = this.getClientForKey(key);
        return await client.sendCommand(args);
      } catch (error: any) {
        // Handle MOVED and ASK redirections
        if (error.message && error.message.startsWith('MOVED')) {
          await this.refreshSlots();
          redirections++;
        } else if (error.message && error.message.startsWith('ASK')) {
          // Handle ASK redirection
          const parts = error.message.split(' ');
          const [host, port] = parts[2].split(':');
          const nodeKey = `${host}:${port}`;

          let client = this.nodes.get(nodeKey);
          if (!client) {
            client = new RedisClient({
              host,
              port: parseInt(port),
              ...this.options.redisOptions
            });
            await client.connect();
            this.nodes.set(nodeKey, client);
          }

          await client.sendCommand(['ASKING']);
          return await client.sendCommand(args);
        } else {
          throw error;
        }
      }
    }

    throw new types.ClusterError('Too many redirections');
  }

  /**
   * Proxy common Redis commands
   */
  async get(key: types.RedisKey): Promise<string | null> {
    return this.sendCommand(['GET', key]);
  }

  async set(key: types.RedisKey, value: types.RedisValue): Promise<'OK'> {
    return this.sendCommand(['SET', key, value]);
  }

  async del(...keys: types.RedisKey[]): Promise<number> {
    // For multi-key commands, execute on each node
    let total = 0;
    for (const key of keys) {
      total += await this.sendCommand(['DEL', key]);
    }
    return total;
  }

  /**
   * Disconnect from all nodes
   */
  async disconnect(): Promise<void> {
    for (const client of this.nodes.values()) {
      await client.disconnect();
    }
    this.nodes.clear();
    this.slots.clear();
    this.ready = false;
  }

  /**
   * Get cluster info
   */
  get info(): { nodes: number; slots: number } {
    return {
      nodes: this.nodes.size,
      slots: this.slots.size
    };
  }
}

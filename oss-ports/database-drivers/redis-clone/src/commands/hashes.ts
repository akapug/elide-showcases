/**
 * Redis hash commands implementation
 */

import * as types from '../types';

export class HashCommands {
  constructor(private client: any) {}

  async hget(key: types.RedisKey, field: string): Promise<string | null> {
    return this.client.sendCommand(['HGET', key, field]);
  }

  async hset(key: types.RedisKey, field: string, value: types.RedisValue): Promise<0 | 1>;
  async hset(key: types.RedisKey, obj: Record<string, types.RedisValue>): Promise<number>;
  async hset(key: types.RedisKey, fieldOrObj: string | Record<string, types.RedisValue>, value?: types.RedisValue): Promise<number> {
    if (typeof fieldOrObj === 'object') {
      const args: any[] = ['HSET', key];
      for (const [field, val] of Object.entries(fieldOrObj)) {
        args.push(field, val);
      }
      return this.client.sendCommand(args);
    }
    return this.client.sendCommand(['HSET', key, fieldOrObj, value]);
  }

  async hsetnx(key: types.RedisKey, field: string, value: types.RedisValue): Promise<0 | 1> {
    return this.client.sendCommand(['HSETNX', key, field, value]);
  }

  async hmset(key: types.RedisKey, obj: Record<string, types.RedisValue>): Promise<'OK'>;
  async hmset(key: types.RedisKey, ...args: any[]): Promise<'OK'>;
  async hmset(key: types.RedisKey, ...args: any[]): Promise<'OK'> {
    if (args.length === 1 && typeof args[0] === 'object') {
      const obj = args[0];
      const cmdArgs: any[] = ['HMSET', key];
      for (const [field, value] of Object.entries(obj)) {
        cmdArgs.push(field, value);
      }
      return this.client.sendCommand(cmdArgs);
    }
    return this.client.sendCommand(['HMSET', key, ...args]);
  }

  async hmget(key: types.RedisKey, ...fields: string[]): Promise<Array<string | null>> {
    return this.client.sendCommand(['HMGET', key, ...fields]);
  }

  async hgetall(key: types.RedisKey): Promise<Record<string, string>> {
    const result = await this.client.sendCommand(['HGETALL', key]);
    const obj: Record<string, string> = {};

    for (let i = 0; i < result.length; i += 2) {
      obj[result[i]] = result[i + 1];
    }

    return obj;
  }

  async hdel(key: types.RedisKey, ...fields: string[]): Promise<number> {
    return this.client.sendCommand(['HDEL', key, ...fields]);
  }

  async hexists(key: types.RedisKey, field: string): Promise<0 | 1> {
    return this.client.sendCommand(['HEXISTS', key, field]);
  }

  async hincrby(key: types.RedisKey, field: string, increment: number): Promise<number> {
    return this.client.sendCommand(['HINCRBY', key, field, increment]);
  }

  async hincrbyfloat(key: types.RedisKey, field: string, increment: number): Promise<string> {
    return this.client.sendCommand(['HINCRBYFLOAT', key, field, increment]);
  }

  async hkeys(key: types.RedisKey): Promise<string[]> {
    return this.client.sendCommand(['HKEYS', key]);
  }

  async hvals(key: types.RedisKey): Promise<string[]> {
    return this.client.sendCommand(['HVALS', key]);
  }

  async hlen(key: types.RedisKey): Promise<number> {
    return this.client.sendCommand(['HLEN', key]);
  }

  async hstrlen(key: types.RedisKey, field: string): Promise<number> {
    return this.client.sendCommand(['HSTRLEN', key, field]);
  }

  async hscan(key: types.RedisKey, cursor: string, options?: {
    MATCH?: string;
    COUNT?: number;
  }): Promise<types.HScanResult> {
    const args: any[] = ['HSCAN', key, cursor];

    if (options?.MATCH) args.push('MATCH', options.MATCH);
    if (options?.COUNT) args.push('COUNT', options.COUNT);

    const result = await this.client.sendCommand(args);
    const entries: Record<string, string> = {};

    for (let i = 0; i < result[1].length; i += 2) {
      entries[result[1][i]] = result[1][i + 1];
    }

    return { cursor: result[0], entries };
  }
}

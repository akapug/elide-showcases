/**
 * Redis set commands implementation
 */

import * as types from '../types';

export class SetCommands {
  constructor(private client: any) {}

  async sadd(key: types.RedisKey, ...members: types.RedisValue[]): Promise<number> {
    return this.client.sendCommand(['SADD', key, ...members]);
  }

  async srem(key: types.RedisKey, ...members: types.RedisValue[]): Promise<number> {
    return this.client.sendCommand(['SREM', key, ...members]);
  }

  async smembers(key: types.RedisKey): Promise<string[]> {
    return this.client.sendCommand(['SMEMBERS', key]);
  }

  async sismember(key: types.RedisKey, member: types.RedisValue): Promise<0 | 1> {
    return this.client.sendCommand(['SISMEMBER', key, member]);
  }

  async smismember(key: types.RedisKey, ...members: types.RedisValue[]): Promise<number[]> {
    return this.client.sendCommand(['SMISMEMBER', key, ...members]);
  }

  async scard(key: types.RedisKey): Promise<number> {
    return this.client.sendCommand(['SCARD', key]);
  }

  async spop(key: types.RedisKey, count?: number): Promise<string | string[] | null> {
    return count
      ? this.client.sendCommand(['SPOP', key, count])
      : this.client.sendCommand(['SPOP', key]);
  }

  async srandmember(key: types.RedisKey, count?: number): Promise<string | string[] | null> {
    return count
      ? this.client.sendCommand(['SRANDMEMBER', key, count])
      : this.client.sendCommand(['SRANDMEMBER', key]);
  }

  async smove(source: types.RedisKey, destination: types.RedisKey, member: types.RedisValue): Promise<0 | 1> {
    return this.client.sendCommand(['SMOVE', source, destination, member]);
  }

  async sinter(...keys: types.RedisKey[]): Promise<string[]> {
    return this.client.sendCommand(['SINTER', ...keys]);
  }

  async sinterstore(destination: types.RedisKey, ...keys: types.RedisKey[]): Promise<number> {
    return this.client.sendCommand(['SINTERSTORE', destination, ...keys]);
  }

  async sunion(...keys: types.RedisKey[]): Promise<string[]> {
    return this.client.sendCommand(['SUNION', ...keys]);
  }

  async sunionstore(destination: types.RedisKey, ...keys: types.RedisKey[]): Promise<number> {
    return this.client.sendCommand(['SUNIONSTORE', destination, ...keys]);
  }

  async sdiff(...keys: types.RedisKey[]): Promise<string[]> {
    return this.client.sendCommand(['SDIFF', ...keys]);
  }

  async sdiffstore(destination: types.RedisKey, ...keys: types.RedisKey[]): Promise<number> {
    return this.client.sendCommand(['SDIFFSTORE', destination, ...keys]);
  }

  async sscan(key: types.RedisKey, cursor: string, options?: {
    MATCH?: string;
    COUNT?: number;
  }): Promise<types.SScanResult> {
    const args: any[] = ['SSCAN', key, cursor];

    if (options?.MATCH) args.push('MATCH', options.MATCH);
    if (options?.COUNT) args.push('COUNT', options.COUNT);

    const result = await this.client.sendCommand(args);
    return { cursor: result[0], members: result[1] };
  }
}

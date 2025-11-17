/**
 * Redis list commands implementation
 */

import * as types from '../types';

export class ListCommands {
  constructor(private client: any) {}

  async lpush(key: types.RedisKey, ...values: types.RedisValue[]): Promise<number> {
    return this.client.sendCommand(['LPUSH', key, ...values]);
  }

  async lpushx(key: types.RedisKey, ...values: types.RedisValue[]): Promise<number> {
    return this.client.sendCommand(['LPUSHX', key, ...values]);
  }

  async rpush(key: types.RedisKey, ...values: types.RedisValue[]): Promise<number> {
    return this.client.sendCommand(['RPUSH', key, ...values]);
  }

  async rpushx(key: types.RedisKey, ...values: types.RedisValue[]): Promise<number> {
    return this.client.sendCommand(['RPUSHX', key, ...values]);
  }

  async lpop(key: types.RedisKey, count?: number): Promise<string | string[] | null> {
    return count
      ? this.client.sendCommand(['LPOP', key, count])
      : this.client.sendCommand(['LPOP', key]);
  }

  async rpop(key: types.RedisKey, count?: number): Promise<string | string[] | null> {
    return count
      ? this.client.sendCommand(['RPOP', key, count])
      : this.client.sendCommand(['RPOP', key]);
  }

  async blpop(timeout: number, ...keys: types.RedisKey[]): Promise<[string, string] | null> {
    return this.client.sendCommand(['BLPOP', ...keys, timeout]);
  }

  async brpop(timeout: number, ...keys: types.RedisKey[]): Promise<[string, string] | null> {
    return this.client.sendCommand(['BRPOP', ...keys, timeout]);
  }

  async brpoplpush(source: types.RedisKey, destination: types.RedisKey, timeout: number): Promise<string | null> {
    return this.client.sendCommand(['BRPOPLPUSH', source, destination, timeout]);
  }

  async lrange(key: types.RedisKey, start: number, stop: number): Promise<string[]> {
    return this.client.sendCommand(['LRANGE', key, start, stop]);
  }

  async llen(key: types.RedisKey): Promise<number> {
    return this.client.sendCommand(['LLEN', key]);
  }

  async lindex(key: types.RedisKey, index: number): Promise<string | null> {
    return this.client.sendCommand(['LINDEX', key, index]);
  }

  async lset(key: types.RedisKey, index: number, value: types.RedisValue): Promise<'OK'> {
    return this.client.sendCommand(['LSET', key, index, value]);
  }

  async linsert(
    key: types.RedisKey,
    position: 'BEFORE' | 'AFTER',
    pivot: types.RedisValue,
    value: types.RedisValue
  ): Promise<number> {
    return this.client.sendCommand(['LINSERT', key, position, pivot, value]);
  }

  async lrem(key: types.RedisKey, count: number, value: types.RedisValue): Promise<number> {
    return this.client.sendCommand(['LREM', key, count, value]);
  }

  async ltrim(key: types.RedisKey, start: number, stop: number): Promise<'OK'> {
    return this.client.sendCommand(['LTRIM', key, start, stop]);
  }

  async rpoplpush(source: types.RedisKey, destination: types.RedisKey): Promise<string | null> {
    return this.client.sendCommand(['RPOPLPUSH', source, destination]);
  }

  async lmove(
    source: types.RedisKey,
    destination: types.RedisKey,
    from: 'LEFT' | 'RIGHT',
    to: 'LEFT' | 'RIGHT'
  ): Promise<string | null> {
    return this.client.sendCommand(['LMOVE', source, destination, from, to]);
  }

  async blmove(
    source: types.RedisKey,
    destination: types.RedisKey,
    from: 'LEFT' | 'RIGHT',
    to: 'LEFT' | 'RIGHT',
    timeout: number
  ): Promise<string | null> {
    return this.client.sendCommand(['BLMOVE', source, destination, from, to, timeout]);
  }
}

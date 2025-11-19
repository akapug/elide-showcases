/**
 * Redis string commands implementation
 */

import * as types from '../types';

export class StringCommands {
  constructor(private client: any) {}

  async get(key: types.RedisKey): Promise<string | null> {
    return this.client.sendCommand(['GET', key]);
  }

  async set(key: types.RedisKey, value: types.RedisValue, options?: {
    EX?: number;
    PX?: number;
    EXAT?: number;
    PXAT?: number;
    NX?: boolean;
    XX?: boolean;
    KEEPTTL?: boolean;
    GET?: boolean;
  }): Promise<'OK' | null> {
    const args: any[] = ['SET', key, value];

    if (options) {
      if (options.EX) args.push('EX', options.EX);
      if (options.PX) args.push('PX', options.PX);
      if (options.EXAT) args.push('EXAT', options.EXAT);
      if (options.PXAT) args.push('PXAT', options.PXAT);
      if (options.NX) args.push('NX');
      if (options.XX) args.push('XX');
      if (options.KEEPTTL) args.push('KEEPTTL');
      if (options.GET) args.push('GET');
    }

    return this.client.sendCommand(args);
  }

  async setex(key: types.RedisKey, seconds: number, value: types.RedisValue): Promise<'OK'> {
    return this.client.sendCommand(['SETEX', key, seconds, value]);
  }

  async setnx(key: types.RedisKey, value: types.RedisValue): Promise<0 | 1> {
    return this.client.sendCommand(['SETNX', key, value]);
  }

  async mget(...keys: types.RedisKey[]): Promise<Array<string | null>> {
    return this.client.sendCommand(['MGET', ...keys]);
  }

  async mset(...args: Array<types.RedisKey | types.RedisValue>): Promise<'OK'> {
    return this.client.sendCommand(['MSET', ...args]);
  }

  async msetnx(...args: Array<types.RedisKey | types.RedisValue>): Promise<0 | 1> {
    return this.client.sendCommand(['MSETNX', ...args]);
  }

  async incr(key: types.RedisKey): Promise<number> {
    return this.client.sendCommand(['INCR', key]);
  }

  async incrby(key: types.RedisKey, increment: number): Promise<number> {
    return this.client.sendCommand(['INCRBY', key, increment]);
  }

  async incrbyfloat(key: types.RedisKey, increment: number): Promise<string> {
    return this.client.sendCommand(['INCRBYFLOAT', key, increment]);
  }

  async decr(key: types.RedisKey): Promise<number> {
    return this.client.sendCommand(['DECR', key]);
  }

  async decrby(key: types.RedisKey, decrement: number): Promise<number> {
    return this.client.sendCommand(['DECRBY', key, decrement]);
  }

  async append(key: types.RedisKey, value: types.RedisValue): Promise<number> {
    return this.client.sendCommand(['APPEND', key, value]);
  }

  async strlen(key: types.RedisKey): Promise<number> {
    return this.client.sendCommand(['STRLEN', key]);
  }

  async getrange(key: types.RedisKey, start: number, end: number): Promise<string> {
    return this.client.sendCommand(['GETRANGE', key, start, end]);
  }

  async setrange(key: types.RedisKey, offset: number, value: types.RedisValue): Promise<number> {
    return this.client.sendCommand(['SETRANGE', key, offset, value]);
  }

  async getset(key: types.RedisKey, value: types.RedisValue): Promise<string | null> {
    return this.client.sendCommand(['GETSET', key, value]);
  }

  async getdel(key: types.RedisKey): Promise<string | null> {
    return this.client.sendCommand(['GETDEL', key]);
  }

  async getex(key: types.RedisKey, options?: {
    EX?: number;
    PX?: number;
    EXAT?: number;
    PXAT?: number;
    PERSIST?: boolean;
  }): Promise<string | null> {
    const args: any[] = ['GETEX', key];

    if (options) {
      if (options.EX) args.push('EX', options.EX);
      if (options.PX) args.push('PX', options.PX);
      if (options.EXAT) args.push('EXAT', options.EXAT);
      if (options.PXAT) args.push('PXAT', options.PXAT);
      if (options.PERSIST) args.push('PERSIST');
    }

    return this.client.sendCommand(args);
  }
}

import { createClient } from '../src';

describe('Redis Commands', () => {
  let redis: any;

  beforeAll(async () => {
    redis = createClient();
    await redis.connect();
  });

  afterAll(async () => {
    await redis.disconnect();
  });

  beforeEach(async () => {
    await redis.flushdb();
  });

  describe('String Commands', () => {
    test('SET and GET', async () => {
      await redis.set('key', 'value');
      const value = await redis.get('key');
      expect(value).toBe('value');
    });

    test('SET with expiration', async () => {
      await redis.set('key', 'value', { EX: 1 });
      const ttl = await redis.ttl('key');
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(1);
    });

    test('SETNX', async () => {
      const result1 = await redis.setnx('key', 'value1');
      expect(result1).toBe(1);
      
      const result2 = await redis.setnx('key', 'value2');
      expect(result2).toBe(0);
      
      const value = await redis.get('key');
      expect(value).toBe('value1');
    });

    test('MGET and MSET', async () => {
      await redis.mset('key1', 'value1', 'key2', 'value2', 'key3', 'value3');
      const values = await redis.mget('key1', 'key2', 'key3');
      expect(values).toEqual(['value1', 'value2', 'value3']);
    });

    test('INCR and DECR', async () => {
      await redis.set('counter', '10');
      await redis.incr('counter');
      expect(await redis.get('counter')).toBe('11');
      
      await redis.decr('counter');
      expect(await redis.get('counter')).toBe('10');
    });
  });

  describe('Hash Commands', () => {
    test('HSET and HGET', async () => {
      await redis.hset('user:1', 'name', 'Alice');
      const name = await redis.hget('user:1', 'name');
      expect(name).toBe('Alice');
    });

    test('HGETALL', async () => {
      await redis.hset('user:1', { name: 'Alice', age: '28', email: 'alice@example.com' });
      const user = await redis.hgetall('user:1');
      expect(user).toEqual({
        name: 'Alice',
        age: '28',
        email: 'alice@example.com'
      });
    });

    test('HINCRBY', async () => {
      await redis.hset('user:1', 'views', '10');
      await redis.hincrby('user:1', 'views', 5);
      const views = await redis.hget('user:1', 'views');
      expect(views).toBe('15');
    });
  });

  describe('List Commands', () => {
    test('LPUSH and RPUSH', async () => {
      await redis.lpush('list', 'a', 'b');
      await redis.rpush('list', 'c', 'd');
      const items = await redis.lrange('list', 0, -1);
      expect(items).toEqual(['b', 'a', 'c', 'd']);
    });

    test('LPOP and RPOP', async () => {
      await redis.rpush('list', 'a', 'b', 'c');
      const left = await redis.lpop('list');
      const right = await redis.rpop('list');
      expect(left).toBe('a');
      expect(right).toBe('c');
    });

    test('LRANGE', async () => {
      await redis.rpush('list', 'a', 'b', 'c', 'd', 'e');
      const items = await redis.lrange('list', 1, 3);
      expect(items).toEqual(['b', 'c', 'd']);
    });
  });

  describe('Set Commands', () => {
    test('SADD and SMEMBERS', async () => {
      await redis.sadd('set', 'a', 'b', 'c');
      const members = await redis.smembers('set');
      expect(members).toHaveLength(3);
      expect(members).toContain('a');
    });

    test('SISMEMBER', async () => {
      await redis.sadd('set', 'a', 'b');
      expect(await redis.sismember('set', 'a')).toBe(1);
      expect(await redis.sismember('set', 'c')).toBe(0);
    });
  });

  describe('Sorted Set Commands', () => {
    test('ZADD and ZRANGE', async () => {
      await redis.zadd('zset', 1, 'a', 2, 'b', 3, 'c');
      const members = await redis.zrange('zset', 0, -1);
      expect(members).toEqual(['a', 'b', 'c']);
    });

    test('ZSCORE', async () => {
      await redis.zadd('zset', 100, 'player1');
      const score = await redis.zscore('zset', 'player1');
      expect(score).toBe('100');
    });
  });
});

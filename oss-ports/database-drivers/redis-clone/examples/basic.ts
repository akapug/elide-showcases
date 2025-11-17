/**
 * Basic Redis usage examples
 */

import { createClient } from '../src';

async function main() {
  const redis = createClient({
    host: 'localhost',
    port: 6379
  });

  await redis.connect();
  console.log('Connected to Redis');

  // String operations
  console.log('\n=== String Operations ===');
  await redis.set('greeting', 'Hello, Redis!');
  const greeting = await redis.get('greeting');
  console.log('GET greeting:', greeting);

  // Counter
  await redis.incr('visits');
  await redis.incr('visits');
  const visits = await redis.get('visits');
  console.log('Visits:', visits);

  // Hash operations
  console.log('\n=== Hash Operations ===');
  await redis.hset('user:1', {
    name: 'Alice',
    email: 'alice@example.com',
    age: '28'
  });

  const user = await redis.hgetall('user:1');
  console.log('User:', user);

  // List operations
  console.log('\n=== List Operations ===');
  await redis.rpush('tasks', 'task1', 'task2', 'task3');
  const tasks = await redis.lrange('tasks', 0, -1);
  console.log('Tasks:', tasks);

  const task = await redis.lpop('tasks');
  console.log('Popped task:', task);

  // Set operations
  console.log('\n=== Set Operations ===');
  await redis.sadd('tags', 'redis', 'database', 'cache', 'nosql');
  const tags = await redis.smembers('tags');
  console.log('Tags:', tags);

  const hasRedis = await redis.sismember('tags', 'redis');
  console.log('Has redis tag:', hasRedis);

  // Sorted set operations
  console.log('\n=== Sorted Set Operations ===');
  await redis.zadd('scores', 100, 'player1', 200, 'player2', 150, 'player3');
  const topScores = await redis.zrange('scores', 0, -1, true);
  console.log('Top scores:', topScores);

  // Key operations
  console.log('\n=== Key Operations ===');
  await redis.expire('greeting', 3600);
  const ttl = await redis.ttl('greeting');
  console.log('TTL for greeting:', ttl);

  const keys = await redis.keys('*');
  console.log('All keys:', keys);

  // Cleanup
  await redis.del('greeting', 'visits', 'user:1', 'tasks', 'tags', 'scores');

  await redis.disconnect();
  console.log('\nDisconnected from Redis');
}

main().catch(console.error);

const { createClient } = require('../dist');
const { performance } = require('perf_hooks');

function benchmark(name, fn, iterations = 10000) {
  const start = performance.now();
  fn(iterations);
  const end = performance.now();
  const duration = end - start;
  const opsPerSec = (iterations / duration) * 1000;
  console.log(`${name}: ${opsPerSec.toFixed(0)} ops/sec (${duration.toFixed(2)}ms for ${iterations} ops)`);
}

async function main() {
  const redis = createClient();
  await redis.connect();

  console.log('=== Redis Benchmarks ===\n');

  // SET benchmarks
  console.log('--- SET Operations ---');
  await benchmark('SET (sequential)', async (n) => {
    for (let i = 0; i < n; i++) {
      await redis.set(`key:${i}`, `value:${i}`);
    }
  }, 1000);

  await benchmark('SET (pipeline)', async (n) => {
    const pipeline = redis.pipeline();
    for (let i = 0; i < n; i++) {
      pipeline.set(`key:${i}`, `value:${i}`);
    }
    await pipeline.exec();
  }, 10000);

  // GET benchmarks
  console.log('\n--- GET Operations ---');
  await benchmark('GET (sequential)', async (n) => {
    for (let i = 0; i < n; i++) {
      await redis.get(`key:${i % 1000}`);
    }
  }, 1000);

  await benchmark('GET (pipeline)', async (n) => {
    const pipeline = redis.pipeline();
    for (let i = 0; i < n; i++) {
      pipeline.get(`key:${i % 1000}`);
    }
    await pipeline.exec();
  }, 10000);

  // Hash operations
  console.log('\n--- Hash Operations ---');
  await redis.hset('user:1', 'name', 'Alice', 'email', 'alice@example.com', 'age', '28');
  
  await benchmark('HGET', async (n) => {
    for (let i = 0; i < n; i++) {
      await redis.hget('user:1', 'name');
    }
  }, 1000);

  await benchmark('HGETALL', async (n) => {
    for (let i = 0; i < n; i++) {
      await redis.hgetall('user:1');
    }
  }, 1000);

  // List operations
  console.log('\n--- List Operations ---');
  await redis.del('mylist');
  
  await benchmark('LPUSH', async (n) => {
    for (let i = 0; i < n; i++) {
      await redis.lpush('mylist', `item:${i}`);
    }
  }, 1000);

  await benchmark('LPOP', async (n) => {
    for (let i = 0; i < n; i++) {
      await redis.lpop('mylist');
    }
  }, 1000);

  // Set operations
  console.log('\n--- Set Operations ---');
  await redis.del('myset');
  
  await benchmark('SADD', async (n) => {
    for (let i = 0; i < n; i++) {
      await redis.sadd('myset', `member:${i}`);
    }
  }, 1000);

  await benchmark('SMEMBERS', async (n) => {
    for (let i = 0; i < n; i++) {
      await redis.smembers('myset');
    }
  }, 100);

  // Sorted set operations
  console.log('\n--- Sorted Set Operations ---');
  await redis.del('myzset');
  
  await benchmark('ZADD', async (n) => {
    for (let i = 0; i < n; i++) {
      await redis.zadd('myzset', i, `member:${i}`);
    }
  }, 1000);

  await benchmark('ZRANGE', async (n) => {
    for (let i = 0; i < n; i++) {
      await redis.zrange('myzset', 0, 99);
    }
  }, 1000);

  await redis.disconnect();
  console.log('\n=== Benchmarks Complete ===');
}

main().catch(console.error);

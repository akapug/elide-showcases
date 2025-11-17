const { MongoClient } = require('../dist');
const { performance } = require('perf_hooks');

async function benchmark(name, fn, iterations = 1000) {
  const start = performance.now();
  await fn(iterations);
  const end = performance.now();
  const duration = end - start;
  const opsPerSec = (iterations / duration) * 1000;
  console.log(`${name}: ${opsPerSec.toFixed(0)} ops/sec (${duration.toFixed(2)}ms for ${iterations} ops)`);
}

async function main() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();

  const db = client.db('benchmark');
  const collection = db.collection('test');

  await collection.deleteMany({});

  console.log('=== MongoDB Benchmarks ===\n');

  // Insert benchmarks
  console.log('--- Insert Operations ---');
  await benchmark('insertOne', async (n) => {
    for (let i = 0; i < n; i++) {
      await collection.insertOne({ index: i, value: `value${i}` });
    }
  }, 1000);

  await collection.deleteMany({});

  await benchmark('insertMany (batch of 1000)', async (n) => {
    const docs = Array.from({ length: 1000 }, (_, i) => ({ index: i, value: `value${i}` }));
    for (let i = 0; i < n / 1000; i++) {
      await collection.insertMany(docs);
    }
  }, 10000);

  // Find benchmarks
  console.log('\n--- Find Operations ---');
  await benchmark('findOne', async (n) => {
    for (let i = 0; i < n; i++) {
      await collection.findOne({ index: i % 1000 });
    }
  }, 1000);

  await benchmark('find + toArray (limit 100)', async (n) => {
    for (let i = 0; i < n; i++) {
      await collection.find({}).limit(100).toArray();
    }
  }, 100);

  // Update benchmarks
  console.log('\n--- Update Operations ---');
  await benchmark('updateOne', async (n) => {
    for (let i = 0; i < n; i++) {
      await collection.updateOne(
        { index: i % 1000 },
        { $set: { updated: true } }
      );
    }
  }, 1000);

  await benchmark('updateMany', async (n) => {
    for (let i = 0; i < n; i++) {
      await collection.updateMany(
        { index: { $gte: 0, $lt: 100 } },
        { $inc: { counter: 1 } }
      );
    }
  }, 100);

  // Delete benchmarks
  console.log('\n--- Delete Operations ---');
  await benchmark('deleteOne', async (n) => {
    for (let i = 0; i < n; i++) {
      await collection.deleteOne({ index: i % 1000 });
    }
  }, 500);

  // Aggregation benchmarks
  console.log('\n--- Aggregation Operations ---');
  await collection.insertMany(
    Array.from({ length: 10000 }, (_, i) => ({
      category: ['A', 'B', 'C', 'D'][i % 4],
      value: Math.random() * 1000
    }))
  );

  await benchmark('aggregate (group + sort)', async (n) => {
    for (let i = 0; i < n; i++) {
      await collection.aggregate([
        { $group: { _id: '$category', total: { $sum: '$value' } } },
        { $sort: { total: -1 } }
      ]).toArray();
    }
  }, 100);

  await client.close();
  console.log('\n=== Benchmarks Complete ===');
}

main().catch(console.error);

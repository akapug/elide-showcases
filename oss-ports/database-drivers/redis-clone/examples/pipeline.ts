import { createClient } from '../src';

async function main() {
  const redis = createClient();
  await redis.connect();

  console.log('=== Pipeline Demo ===\n');

  // Pipeline for batch operations
  const pipeline = redis.pipeline();
  
  for (let i = 0; i < 100; i++) {
    pipeline
      .set(`key:${i}`, `value:${i}`)
      .expire(`key:${i}`, 3600);
  }

  console.time('Pipeline execution');
  const results = await pipeline.exec();
  console.timeEnd('Pipeline execution');
  
  console.log(`Executed ${results.length} commands`);

  // Transaction (MULTI/EXEC)
  console.log('\n=== Transaction Demo ===\n');

  await redis.set('balance:alice', '1000');
  await redis.set('balance:bob', '500');

  await redis.watch('balance:alice', 'balance:bob');

  const transaction = await redis.multi();
  transaction
    .decrby('balance:alice', 100)
    .incrby('balance:bob', 100);

  const txResults = await transaction.exec();
  console.log('Transaction results:', txResults);

  const aliceBalance = await redis.get('balance:alice');
  const bobBalance = await redis.get('balance:bob');
  console.log(`Alice: $${aliceBalance}, Bob: $${bobBalance}`);

  // Pub/Sub
  console.log('\n=== Pub/Sub Demo ===\n');

  const pubsub = redis.createPubSub();
  await pubsub.subscribe('notifications');

  pubsub.on('notifications', (channel, message) => {
    console.log(`Received on ${channel}:`, message);
  });

  await redis.publish('notifications', 'Hello from Redis!');

  setTimeout(async () => {
    await pubsub.unsubscribe('notifications');
    await redis.disconnect();
    console.log('\nDemo complete!');
  }, 100);
}

main().catch(console.error);

/**
 * High-Throughput Kafka Producer/Consumer Example
 */

import { Kafka, CompressionTypes } from '../src';

async function runProducer() {
  const kafka = new Kafka({
    clientId: 'high-throughput-producer',
    brokers: ['localhost:9092'],
  });

  const producer = kafka.producer({
    maxInFlightRequests: 5,
    idempotent: true,
    compression: CompressionTypes.Snappy,
  });

  await producer.connect();

  console.log('Starting high-throughput producer...');

  const topic = 'high-throughput-topic';
  let messageCount = 0;
  const batchSize = 1000;
  const totalMessages = 100000;

  const startTime = Date.now();

  while (messageCount < totalMessages) {
    const messages = [];

    for (let i = 0; i < batchSize && messageCount < totalMessages; i++) {
      messages.push({
        key: `key-${messageCount}`,
        value: JSON.stringify({
          id: messageCount,
          timestamp: Date.now(),
          data: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        }),
      });
      messageCount++;
    }

    await producer.send({
      topic,
      messages,
      compression: CompressionTypes.Snappy,
    });

    if (messageCount % 10000 === 0) {
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = messageCount / elapsed;
      console.log(`Sent ${messageCount} messages (${rate.toFixed(0)} msg/s)`);
    }
  }

  const elapsed = (Date.now() - startTime) / 1000;
  const rate = totalMessages / elapsed;

  console.log(`\nCompleted: ${totalMessages} messages in ${elapsed.toFixed(2)}s`);
  console.log(`Average rate: ${rate.toFixed(0)} messages/second`);

  // Get metrics
  const metrics = await producer.getMetrics();
  console.log('\nProducer metrics:');
  console.log(`  Request total: ${metrics.requestTotal}`);
  console.log(`  Request rate: ${metrics.requestRate.toFixed(2)}/s`);
  console.log(`  Average request size: ${metrics.requestSize.avg} bytes`);

  await producer.disconnect();
}

async function runConsumer() {
  const kafka = new Kafka({
    clientId: 'high-throughput-consumer',
    brokers: ['localhost:9092'],
  });

  const consumer = kafka.consumer({
    groupId: 'high-throughput-group',
    maxBytesPerPartition: 1048576, // 1MB
    sessionTimeout: 30000,
  });

  await consumer.connect();
  await consumer.subscribe({ topics: ['high-throughput-topic'] });

  console.log('Starting high-throughput consumer...');

  let messageCount = 0;
  const startTime = Date.now();

  await consumer.run({
    partitionsConsumedConcurrently: 3,
    eachBatch: async ({ batch, resolveOffset, heartbeat }) => {
      for (const message of batch.messages) {
        messageCount++;

        if (messageCount % 10000 === 0) {
          const elapsed = (Date.now() - startTime) / 1000;
          const rate = messageCount / elapsed;
          console.log(`Consumed ${messageCount} messages (${rate.toFixed(0)} msg/s)`);
        }

        resolveOffset(message.offset);
        await heartbeat();
      }
    },
  });

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = messageCount / elapsed;

    console.log(`\nShutting down...`);
    console.log(`Consumed ${messageCount} messages in ${elapsed.toFixed(2)}s`);
    console.log(`Average rate: ${rate.toFixed(0)} messages/second`);

    // Get metrics
    const metrics = await consumer.getMetrics();
    console.log('\nConsumer metrics:');
    console.log(`  Records consumed: ${metrics.recordsConsumed}`);
    console.log(`  Records consumed rate: ${metrics.recordsConsumedRate.toFixed(2)}/s`);
    console.log(`  Average fetch latency: ${metrics.fetchLatency.avg}ms`);

    await consumer.disconnect();
    process.exit(0);
  });
}

// Run based on command line argument
const mode = process.argv[2];

if (mode === 'producer') {
  runProducer().catch(console.error);
} else if (mode === 'consumer') {
  runConsumer().catch(console.error);
} else {
  console.log('Usage: node high-throughput.js [producer|consumer]');
  process.exit(1);
}

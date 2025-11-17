/**
 * Basic Kafka Consumer Example
 */

import { Kafka } from '../src';

async function main() {
  const kafka = new Kafka({
    clientId: 'example-consumer',
    brokers: ['localhost:9092'],
  });

  const consumer = kafka.consumer({
    groupId: 'example-group',
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
  });

  console.log('Connecting consumer...');
  await consumer.connect();

  console.log('Subscribing to topics...');
  await consumer.subscribe({
    topics: ['example-topic'],
    fromBeginning: true,
  });

  console.log('Starting consumer...');
  await consumer.run({
    autoCommit: true,
    autoCommitInterval: 5000,
    eachMessage: async ({ topic, partition, message }) => {
      console.log({
        topic,
        partition,
        offset: message.offset,
        key: message.key?.toString(),
        value: message.value?.toString(),
        headers: message.headers,
      });

      // Process message
      await processMessage(message);
    },
  });

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down consumer...');
    await consumer.disconnect();
    process.exit(0);
  });
}

async function processMessage(message: any): Promise<void> {
  // Simulate message processing
  await new Promise(resolve => setTimeout(resolve, 10));
}

main().catch(console.error);

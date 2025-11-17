/**
 * Basic Kafka Producer Example
 */

import { Kafka, CompressionTypes } from '../src';

async function main() {
  const kafka = new Kafka({
    clientId: 'example-producer',
    brokers: ['localhost:9092'],
  });

  const producer = kafka.producer({
    compression: CompressionTypes.GZIP,
    idempotent: true,
  });

  console.log('Connecting producer...');
  await producer.connect();

  try {
    console.log('Sending messages...');

    // Send single message
    await producer.send({
      topic: 'example-topic',
      messages: [
        {
          key: 'user-123',
          value: JSON.stringify({
            userId: '123',
            action: 'login',
            timestamp: Date.now(),
          }),
        },
      ],
    });

    // Send batch of messages
    const messages = Array.from({ length: 100 }, (_, i) => ({
      key: `key-${i}`,
      value: `Message ${i}`,
      headers: {
        'correlation-id': `corr-${i}`,
      },
    }));

    const metadata = await producer.send({
      topic: 'example-topic',
      messages,
    });

    console.log('Messages sent successfully:', metadata);
  } finally {
    await producer.disconnect();
    console.log('Producer disconnected');
  }
}

main().catch(console.error);

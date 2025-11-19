/**
 * Transactional Producer Example
 */

import { Kafka } from '../src';

async function main() {
  const kafka = new Kafka({
    clientId: 'transactional-producer',
    brokers: ['localhost:9092'],
  });

  const producer = kafka.producer({
    transactionalId: 'my-transactional-producer',
    maxInFlightRequests: 1,
    idempotent: true,
  });

  await producer.connect();

  console.log('Starting transaction...');

  const transaction = producer.transaction();

  try {
    // Send to multiple topics atomically
    await transaction.send({
      topic: 'orders',
      messages: [
        {
          key: 'order-123',
          value: JSON.stringify({
            orderId: '123',
            status: 'created',
            amount: 99.99,
          }),
        },
      ],
    });

    await transaction.send({
      topic: 'inventory',
      messages: [
        {
          key: 'product-456',
          value: JSON.stringify({
            productId: '456',
            quantity: -1,
          }),
        },
      ],
    });

    await transaction.send({
      topic: 'notifications',
      messages: [
        {
          key: 'user-789',
          value: JSON.stringify({
            userId: '789',
            message: 'Order created successfully',
          }),
        },
      ],
    });

    // Commit transaction
    await transaction.commit();
    console.log('Transaction committed successfully');
  } catch (error) {
    console.error('Transaction failed, aborting:', error);
    await transaction.abort();
  } finally {
    await producer.disconnect();
  }
}

main().catch(console.error);

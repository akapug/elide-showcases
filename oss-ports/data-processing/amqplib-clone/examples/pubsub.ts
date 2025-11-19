/**
 * Pub/Sub Pattern Example
 */

import * as amqp from '../src';

async function publisher() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();

  const exchange = 'logs';

  await channel.assertExchange(exchange, 'fanout', {
    durable: false,
  });

  setInterval(() => {
    const message = `Log message at ${new Date().toISOString()}`;
    channel.publish(exchange, '', Buffer.from(message));
    console.log('Published:', message);
  }, 1000);
}

async function subscriber(name: string) {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();

  const exchange = 'logs';

  await channel.assertExchange(exchange, 'fanout', {
    durable: false,
  });

  const { queue } = await channel.assertQueue('', {
    exclusive: true,
  });

  await channel.bindQueue(queue, exchange, '');

  console.log(`[${name}] Waiting for logs...`);

  await channel.consume(queue, (msg) => {
    if (msg) {
      console.log(`[${name}]`, msg.content.toString());
    }
  }, {
    noAck: true,
  });
}

// Run publisher and subscribers
publisher();
subscriber('Subscriber1');
subscriber('Subscriber2');

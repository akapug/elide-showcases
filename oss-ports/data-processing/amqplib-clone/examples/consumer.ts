/**
 * Basic RabbitMQ Consumer Example
 */

import * as amqp from '../src';

async function main() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();

  const queue = 'task-queue';

  await channel.assertQueue(queue, {
    durable: true,
  });

  await channel.prefetch(1);

  console.log('Waiting for messages...');

  await channel.consume(queue, async (msg) => {
    if (msg) {
      const task = JSON.parse(msg.content.toString());
      console.log('Received task:', task);

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Processed task:', task.taskId);

      channel.ack(msg);
    }
  }, {
    noAck: false,
  });

  // Keep running
  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await channel.close();
    await connection.close();
    process.exit(0);
  });
}

main().catch(console.error);

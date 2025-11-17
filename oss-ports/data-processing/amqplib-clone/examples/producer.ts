/**
 * Basic RabbitMQ Producer Example
 */

import * as amqp from '../src';

async function main() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();

  const queue = 'task-queue';

  await channel.assertQueue(queue, {
    durable: true,
  });

  // Send 10 messages
  for (let i = 0; i < 10; i++) {
    const message = JSON.stringify({
      taskId: i,
      data: `Task ${i}`,
      timestamp: Date.now(),
    });

    channel.sendToQueue(queue, Buffer.from(message), {
      persistent: true,
      contentType: 'application/json',
    });

    console.log(`Sent task ${i}`);
  }

  await channel.close();
  await connection.close();
}

main().catch(console.error);

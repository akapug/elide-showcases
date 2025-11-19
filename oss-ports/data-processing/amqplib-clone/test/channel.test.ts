/**
 * Channel Tests
 */

import * as amqp from '../src';

describe('Channel', () => {
  let connection: any;
  let channel: any;

  beforeEach(async () => {
    connection = await amqp.connect('amqp://localhost');
    channel = await connection.createChannel();
  });

  afterEach(async () => {
    await channel.close();
    await connection.close();
  });

  test('should create and delete queue', async () => {
    const { queue } = await channel.assertQueue('test-queue');
    expect(queue).toBe('test-queue');

    const result = await channel.deleteQueue('test-queue');
    expect(result.messageCount).toBe(0);
  });

  test('should publish and consume messages', async () => {
    await channel.assertQueue('test-queue');

    channel.sendToQueue('test-queue', Buffer.from('test message'));

    const msg = await channel.get('test-queue');
    expect(msg).not.toBe(false);
    expect(msg.content.toString()).toBe('test message');

    channel.ack(msg);
  });

  test('should handle prefetch', async () => {
    await channel.prefetch(5);
    expect(channel.prefetchCount).toBe(5);
  });
});

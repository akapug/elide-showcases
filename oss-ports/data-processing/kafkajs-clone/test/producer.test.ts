/**
 * Producer Tests
 */

import { Kafka, CompressionTypes } from '../src';

describe('Producer', () => {
  let kafka: Kafka;
  let producer: any;

  beforeEach(async () => {
    kafka = new Kafka({
      clientId: 'test-client',
      brokers: ['localhost:9092'],
    });

    producer = kafka.producer();
    await producer.connect();
  });

  afterEach(async () => {
    await producer.disconnect();
  });

  test('should send messages successfully', async () => {
    const result = await producer.send({
      topic: 'test-topic',
      messages: [
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2' },
      ],
    });

    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  test('should support compression', async () => {
    const result = await producer.send({
      topic: 'test-topic',
      compression: CompressionTypes.GZIP,
      messages: [{ value: 'compressed message' }],
    });

    expect(result).toBeDefined();
  });

  test('should handle transactions', async () => {
    const transaction = producer.transaction();

    await transaction.send({
      topic: 'test-topic',
      messages: [{ value: 'transactional message' }],
    });

    await transaction.commit();

    expect(transaction.isActive()).toBe(false);
  });
});

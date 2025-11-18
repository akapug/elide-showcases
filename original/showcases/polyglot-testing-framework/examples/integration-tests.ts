/**
 * Integration Test Examples
 *
 * Demonstrates comprehensive integration testing scenarios across
 * multiple services, databases, and external dependencies.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '../src/assertion-library';
import { TestRunner } from '../src/test-runner';
import { MockFramework } from '../src/mocking/mock-framework';
import axios from 'axios';
import * as pg from 'pg';
import * as redis from 'redis';
import * as amqp from 'amqplib';

/**
 * Example 1: Database Integration Testing
 */
describe('Database Integration', () => {
  let dbClient: pg.Client;

  beforeAll(async () => {
    dbClient = new pg.Client({
      host: 'localhost',
      port: 5432,
      database: 'test_db',
      user: 'test_user',
      password: 'test_pass'
    });

    await dbClient.connect();

    // Setup test schema
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  });

  afterAll(async () => {
    await dbClient.query('DROP TABLE IF EXISTS users');
    await dbClient.end();
  });

  beforeEach(async () => {
    await dbClient.query('TRUNCATE TABLE users RESTART IDENTITY');
  });

  it('should insert and retrieve user data', async () => {
    const insertResult = await dbClient.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      ['John Doe', 'john@example.com']
    );

    expect(insertResult.rows).toHaveLength(1);
    expect(insertResult.rows[0].name).toBe('John Doe');

    const selectResult = await dbClient.query('SELECT * FROM users WHERE email = $1', ['john@example.com']);

    expect(selectResult.rows).toHaveLength(1);
    expect(selectResult.rows[0].id).toBe(1);
  });

  it('should handle duplicate email constraint', async () => {
    await dbClient.query(
      'INSERT INTO users (name, email) VALUES ($1, $2)',
      ['John Doe', 'john@example.com']
    );

    try {
      await dbClient.query(
        'INSERT INTO users (name, email) VALUES ($1, $2)',
        ['Jane Doe', 'john@example.com']
      );
    } catch (error: any) {
      expect(error.code).toBe('23505'); // Unique violation
    }
  });

  it('should perform transactions correctly', async () => {
    await dbClient.query('BEGIN');

    try {
      await dbClient.query('INSERT INTO users (name, email) VALUES ($1, $2)', ['User 1', 'user1@example.com']);
      await dbClient.query('INSERT INTO users (name, email) VALUES ($1, $2)', ['User 2', 'user2@example.com']);

      await dbClient.query('COMMIT');
    } catch (error) {
      await dbClient.query('ROLLBACK');
      throw error;
    }

    const result = await dbClient.query('SELECT COUNT(*) as count FROM users');
    expect(parseInt(result.rows[0].count)).toBe(2);
  });
});

/**
 * Example 2: Cache Integration Testing
 */
describe('Cache Integration', () => {
  let redisClient: any;

  beforeAll(async () => {
    redisClient = redis.createClient({
      host: 'localhost',
      port: 6379
    });

    await redisClient.connect();
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  beforeEach(async () => {
    await redisClient.flushDb();
  });

  it('should set and get cached values', async () => {
    await redisClient.set('test-key', 'test-value');
    const value = await redisClient.get('test-key');

    expect(value).toBe('test-value');
  });

  it('should handle cache expiration', async () => {
    await redisClient.set('temp-key', 'temp-value', { EX: 1 });

    let value = await redisClient.get('temp-key');
    expect(value).toBe('temp-value');

    await new Promise(resolve => setTimeout(resolve, 1100));

    value = await redisClient.get('temp-key');
    expect(value).toBeNull();
  });

  it('should support complex data structures', async () => {
    const userData = {
      id: 123,
      name: 'John Doe',
      roles: ['admin', 'user']
    };

    await redisClient.set('user:123', JSON.stringify(userData));
    const retrieved = JSON.parse(await redisClient.get('user:123'));

    expect(retrieved).toEqual(userData);
  });

  it('should handle cache-aside pattern', async () => {
    const cacheKey = 'user:456';
    const userId = 456;

    // Check cache first
    let cached = await redisClient.get(cacheKey);

    if (!cached) {
      // Simulate database fetch
      const dbData = { id: userId, name: 'Jane Doe' };

      // Store in cache
      await redisClient.set(cacheKey, JSON.stringify(dbData), { EX: 300 });
      cached = JSON.stringify(dbData);
    }

    const result = JSON.parse(cached);
    expect(result.id).toBe(userId);
  });
});

/**
 * Example 3: Message Queue Integration
 */
describe('Message Queue Integration', () => {
  let connection: amqp.Connection;
  let channel: amqp.Channel;
  const queueName = 'test-queue';

  beforeAll(async () => {
    connection = await amqp.connect('amqp://localhost');
    channel = await connection.createChannel();
    await channel.assertQueue(queueName, { durable: false });
  });

  afterAll(async () => {
    await channel.deleteQueue(queueName);
    await channel.close();
    await connection.close();
  });

  beforeEach(async () => {
    await channel.purgeQueue(queueName);
  });

  it('should publish and consume messages', async () => {
    const message = { id: 1, data: 'test message' };

    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)));

    const received = await new Promise<any>((resolve) => {
      channel.consume(queueName, (msg) => {
        if (msg) {
          channel.ack(msg);
          resolve(JSON.parse(msg.content.toString()));
        }
      });
    });

    expect(received).toEqual(message);
  });

  it('should handle message acknowledgment', async () => {
    const messages = [{ id: 1 }, { id: 2 }, { id: 3 }];

    for (const msg of messages) {
      channel.sendToQueue(queueName, Buffer.from(JSON.stringify(msg)));
    }

    const received: any[] = [];

    await new Promise<void>((resolve) => {
      let count = 0;

      channel.consume(queueName, (msg) => {
        if (msg) {
          const data = JSON.parse(msg.content.toString());
          received.push(data);
          channel.ack(msg);

          count++;
          if (count === messages.length) {
            resolve();
          }
        }
      });
    });

    expect(received).toHaveLength(3);
    expect(received.map(r => r.id)).toEqual([1, 2, 3]);
  });
});

/**
 * Example 4: API Integration Testing
 */
describe('REST API Integration', () => {
  const baseUrl = 'http://localhost:3000/api';

  it('should perform CRUD operations', async () => {
    // Create
    const createResponse = await axios.post(`${baseUrl}/products`, {
      name: 'Test Product',
      price: 99.99,
      category: 'electronics'
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.data.id).toBeDefined();

    const productId = createResponse.data.id;

    // Read
    const getResponse = await axios.get(`${baseUrl}/products/${productId}`);
    expect(getResponse.status).toBe(200);
    expect(getResponse.data.name).toBe('Test Product');

    // Update
    const updateResponse = await axios.put(`${baseUrl}/products/${productId}`, {
      name: 'Updated Product',
      price: 89.99
    });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.data.name).toBe('Updated Product');

    // Delete
    const deleteResponse = await axios.delete(`${baseUrl}/products/${productId}`);
    expect(deleteResponse.status).toBe(204);

    // Verify deletion
    try {
      await axios.get(`${baseUrl}/products/${productId}`);
    } catch (error: any) {
      expect(error.response.status).toBe(404);
    }
  });

  it('should handle pagination', async () => {
    // Create multiple products
    for (let i = 0; i < 25; i++) {
      await axios.post(`${baseUrl}/products`, {
        name: `Product ${i}`,
        price: i * 10
      });
    }

    // Get first page
    const page1 = await axios.get(`${baseUrl}/products?page=1&limit=10`);
    expect(page1.data.items).toHaveLength(10);
    expect(page1.data.total).toBe(25);
    expect(page1.data.page).toBe(1);

    // Get second page
    const page2 = await axios.get(`${baseUrl}/products?page=2&limit=10`);
    expect(page2.data.items).toHaveLength(10);
    expect(page2.data.page).toBe(2);

    // Get last page
    const page3 = await axios.get(`${baseUrl}/products?page=3&limit=10`);
    expect(page3.data.items).toHaveLength(5);
  });

  it('should handle filtering and sorting', async () => {
    const response = await axios.get(`${baseUrl}/products`, {
      params: {
        category: 'electronics',
        minPrice: 50,
        maxPrice: 200,
        sortBy: 'price',
        sortOrder: 'desc'
      }
    });

    expect(response.data.items.every((p: any) => p.category === 'electronics')).toBe(true);
    expect(response.data.items.every((p: any) => p.price >= 50 && p.price <= 200)).toBe(true);

    // Verify sorting
    for (let i = 0; i < response.data.items.length - 1; i++) {
      expect(response.data.items[i].price).toBeGreaterThanOrEqual(response.data.items[i + 1].price);
    }
  });
});

/**
 * Example 5: GraphQL Integration Testing
 */
describe('GraphQL Integration', () => {
  const graphqlUrl = 'http://localhost:4000/graphql';

  it('should execute queries', async () => {
    const query = `
      query GetUser($id: ID!) {
        user(id: $id) {
          id
          name
          email
          posts {
            id
            title
          }
        }
      }
    `;

    const response = await axios.post(graphqlUrl, {
      query,
      variables: { id: '123' }
    });

    expect(response.data.data.user).toBeDefined();
    expect(response.data.data.user.id).toBe('123');
    expect(response.data.data.user.posts).toBeDefined();
  });

  it('should execute mutations', async () => {
    const mutation = `
      mutation CreatePost($input: CreatePostInput!) {
        createPost(input: $input) {
          id
          title
          author {
            id
            name
          }
        }
      }
    `;

    const response = await axios.post(graphqlUrl, {
      query: mutation,
      variables: {
        input: {
          title: 'Test Post',
          content: 'Test content',
          authorId: '123'
        }
      }
    });

    expect(response.data.data.createPost).toBeDefined();
    expect(response.data.data.createPost.title).toBe('Test Post');
  });

  it('should handle errors gracefully', async () => {
    const query = `
      query InvalidQuery {
        nonExistentField
      }
    `;

    const response = await axios.post(graphqlUrl, { query });

    expect(response.data.errors).toBeDefined();
    expect(response.data.errors.length).toBeGreaterThan(0);
  });
});

/**
 * Example 6: File Upload Integration
 */
describe('File Upload Integration', () => {
  it('should upload files', async () => {
    const FormData = require('form-data');
    const fs = require('fs');

    const form = new FormData();
    form.append('file', fs.createReadStream('test-file.txt'));
    form.append('metadata', JSON.stringify({ description: 'Test file' }));

    const response = await axios.post('http://localhost:3000/upload', form, {
      headers: form.getHeaders()
    });

    expect(response.status).toBe(200);
    expect(response.data.fileId).toBeDefined();
    expect(response.data.url).toBeDefined();
  });

  it('should validate file types', async () => {
    const FormData = require('form-data');
    const fs = require('fs');

    const form = new FormData();
    form.append('file', fs.createReadStream('test-file.exe')); // Invalid type

    try {
      await axios.post('http://localhost:3000/upload', form, {
        headers: form.getHeaders()
      });
    } catch (error: any) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.error).toContain('Invalid file type');
    }
  });
});

/**
 * Example 7: WebSocket Integration
 */
describe('WebSocket Integration', () => {
  let ws: any;

  beforeEach(() => {
    const WebSocket = require('ws');
    ws = new WebSocket('ws://localhost:3000/ws');
  });

  afterEach(() => {
    ws.close();
  });

  it('should establish WebSocket connection', async () => {
    await new Promise<void>((resolve) => {
      ws.on('open', () => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
        resolve();
      });
    });
  });

  it('should send and receive messages', async () => {
    const message = { type: 'test', data: 'hello' };

    const received = await new Promise((resolve) => {
      ws.on('message', (data: any) => {
        resolve(JSON.parse(data.toString()));
      });

      ws.on('open', () => {
        ws.send(JSON.stringify(message));
      });
    });

    expect(received).toEqual(expect.objectContaining({ type: 'test' }));
  });

  it('should handle connection errors', async () => {
    const badWs = new (require('ws'))('ws://localhost:9999/invalid');

    await new Promise<void>((resolve) => {
      badWs.on('error', (error: any) => {
        expect(error).toBeDefined();
        resolve();
      });
    });
  });
});

/**
 * Example 8: Email Service Integration
 */
describe('Email Service Integration', () => {
  let emailMock: any;

  beforeEach(() => {
    emailMock = MockFramework.createMock({
      target: 'email-service',
      interface: {
        sendEmail: {
          resolves: { messageId: 'msg-123', status: 'sent' }
        }
      }
    });
  });

  it('should send transactional emails', async () => {
    const result = await emailMock.sendEmail({
      to: 'user@example.com',
      subject: 'Test Email',
      body: 'This is a test email'
    });

    expect(result.status).toBe('sent');
    expect(result.messageId).toBeDefined();
  });

  it('should handle email template rendering', async () => {
    const templateMock = MockFramework.createMock({
      target: 'template-service',
      interface: {
        render: {
          implementation: (template: string, data: any) => {
            return template.replace(/{{(\w+)}}/g, (_, key) => data[key]);
          }
        }
      }
    });

    const rendered = await templateMock.render(
      'Hello {{name}}, your order {{orderId}} has been confirmed.',
      { name: 'John', orderId: '12345' }
    );

    expect(rendered).toBe('Hello John, your order 12345 has been confirmed.');
  });
});

/**
 * Example 9: Payment Gateway Integration
 */
describe('Payment Gateway Integration', () => {
  it('should process payment transactions', async () => {
    const paymentMock = MockFramework.createMock({
      target: 'payment-gateway',
      interface: {
        processPayment: {
          resolves: {
            transactionId: 'txn-123',
            status: 'success',
            amount: 100.00,
            currency: 'USD'
          }
        }
      }
    });

    const result = await paymentMock.processPayment({
      amount: 100.00,
      currency: 'USD',
      cardToken: 'tok_test123'
    });

    expect(result.status).toBe('success');
    expect(result.transactionId).toBeDefined();
  });

  it('should handle payment failures', async () => {
    const paymentMock = MockFramework.createMock({
      target: 'payment-gateway',
      interface: {
        processPayment: {
          rejects: new Error('Insufficient funds')
        }
      }
    });

    await expect(paymentMock.processPayment({
      amount: 1000.00,
      currency: 'USD',
      cardToken: 'tok_insufficient'
    })).toReject(/Insufficient funds/);
  });
});

/**
 * Example 10: Search Integration
 */
describe('Search Integration', () => {
  it('should perform full-text search', async () => {
    const response = await axios.get('http://localhost:9200/products/_search', {
      params: {
        q: 'laptop',
        size: 10
      }
    });

    expect(response.data.hits.total.value).toBeGreaterThan(0);
    expect(response.data.hits.hits).toBeDefined();

    const results = response.data.hits.hits.map((h: any) => h._source);
    expect(results.every((r: any) => r.name.toLowerCase().includes('laptop'))).toBe(true);
  });

  it('should support faceted search', async () => {
    const response = await axios.post('http://localhost:9200/products/_search', {
      query: { match_all: {} },
      aggs: {
        categories: {
          terms: { field: 'category.keyword' }
        },
        price_ranges: {
          range: {
            field: 'price',
            ranges: [
              { to: 50 },
              { from: 50, to: 100 },
              { from: 100 }
            ]
          }
        }
      }
    });

    expect(response.data.aggregations.categories.buckets).toBeDefined();
    expect(response.data.aggregations.price_ranges.buckets).toHaveLength(3);
  });
});

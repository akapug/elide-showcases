/**
 * RPC (Remote Procedure Call) Pattern Example
 */

import * as amqp from '../src';

// RPC Server
async function startServer() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();

  const rpcQueue = 'rpc_queue';

  await channel.assertQueue(rpcQueue, { durable: false });
  await channel.prefetch(1);

  console.log('RPC Server waiting for requests...');

  await channel.consume(rpcQueue, async (msg) => {
    if (msg) {
      const input = parseInt(msg.content.toString());
      console.log(`Received request: fibonacci(${input})`);

      // Calculate fibonacci
      const result = fibonacci(input);
      console.log(`Sending response: ${result}`);

      // Send response
      channel.sendToQueue(
        msg.properties.replyTo!,
        Buffer.from(result.toString()),
        {
          correlationId: msg.properties.correlationId,
        }
      );

      channel.ack(msg);
    }
  });

  // Keep server running
  process.on('SIGINT', async () => {
    console.log('\nShutting down server...');
    await channel.close();
    await connection.close();
    process.exit(0);
  });
}

// RPC Client
async function callRPC(n: number): Promise<number> {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();

  const { queue: replyQueue } = await channel.assertQueue('', {
    exclusive: true,
  });

  const correlationId = generateUuid();

  console.log(`Calling RPC: fibonacci(${n})`);

  return new Promise((resolve, reject) => {
    // Set timeout
    const timeout = setTimeout(() => {
      channel.close();
      connection.close();
      reject(new Error('RPC timeout'));
    }, 10000);

    // Consume response
    channel.consume(
      replyQueue,
      (msg) => {
        if (msg && msg.properties.correlationId === correlationId) {
          clearTimeout(timeout);

          const result = parseInt(msg.content.toString());
          console.log(`Received response: ${result}`);

          channel.close();
          connection.close();

          resolve(result);
        }
      },
      { noAck: true }
    );

    // Send request
    channel.sendToQueue('rpc_queue', Buffer.from(n.toString()), {
      correlationId,
      replyTo: replyQueue,
    });
  });
}

// Fibonacci function
function fibonacci(n: number): number {
  if (n <= 1) return n;

  let a = 0;
  let b = 1;

  for (let i = 2; i <= n; i++) {
    const temp = b;
    b = a + b;
    a = temp;
  }

  return b;
}

// UUID generator
function generateUuid(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

// Run server or client based on command line argument
const mode = process.argv[2];

if (mode === 'server') {
  startServer().catch(console.error);
} else if (mode === 'client') {
  const n = parseInt(process.argv[3]) || 10;

  callRPC(n)
    .then((result) => {
      console.log(`\nfibonacci(${n}) = ${result}`);
      process.exit(0);
    })
    .catch(console.error);
} else {
  console.log('Usage:');
  console.log('  node rpc.js server');
  console.log('  node rpc.js client [number]');
  process.exit(1);
}

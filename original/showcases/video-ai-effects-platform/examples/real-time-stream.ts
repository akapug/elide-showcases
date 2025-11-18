/**
 * Real-time Streaming Example
 *
 * Demonstrates WebSocket-based real-time video streaming
 * with server-side effects processing.
 */

import { VideoStreamServer } from '../src/server';
import WebSocket from 'ws';

/**
 * Example 1: Basic WebSocket Server
 */
async function example1_basicServer() {
  console.log('\n=== Example 1: Basic WebSocket Server ===\n');

  const server = new VideoStreamServer({
    port: 8080,
    maxConnections: 100,
    processorConfig: {
      width: 1920,
      height: 1080,
      fps: 30,
      quality: 'high'
    }
  });

  try {
    await server.start();
    console.log('✓ Server started on port 8080');

    // Setup event handlers
    server.on('connection', (client) => {
      console.log(`✓ Client connected: ${client.id}`);
    });

    server.on('disconnection', (client) => {
      console.log(`✓ Client disconnected: ${client.id}`);
    });

    server.on('frame-received', ({ client, frame }) => {
      console.log(`Received frame from client ${client.id}`);
    });

    server.on('error', (error) => {
      console.error('Server error:', error);
    });

    console.log('\n✓ Server running. Press Ctrl+C to stop.\n');

    // Keep server running
    await new Promise(resolve => {
      process.on('SIGINT', () => {
        console.log('\nShutting down server...');
        resolve(undefined);
      });
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await server.stop();
    console.log('✓ Server stopped\n');
  }
}

/**
 * Example 2: Client Connection
 */
async function example2_clientConnection() {
  console.log('\n=== Example 2: Client Connection ===\n');

  const ws = new WebSocket('ws://localhost:8080');

  ws.on('open', () => {
    console.log('✓ Connected to server');

    // Send a test message
    ws.send(JSON.stringify({
      type: 'get-stats'
    }));
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'connected':
          console.log('✓ Server acknowledged connection');
          console.log(`  Client ID: ${message.clientId}`);
          console.log('  Server Info:', message.serverInfo);
          break;

        case 'stats':
          console.log('\n✓ Received statistics:');
          console.log(`  Frames Processed: ${message.stats.framesProcessed}`);
          console.log(`  Average FPS: ${message.stats.averageFps.toFixed(2)}`);
          console.log(`  Average Latency: ${message.stats.averageLatency.toFixed(2)}ms`);
          break;

        case 'frame':
          console.log('✓ Received processed frame');
          break;

        case 'error':
          console.error('Server error:', message.message);
          break;
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('close', () => {
    console.log('✓ Connection closed');
  });

  // Keep connection open for a few seconds
  await new Promise(resolve => setTimeout(resolve, 3000));

  ws.close();
  console.log('\n✓ Client disconnected\n');
}

/**
 * Example 3: Frame Processing
 */
async function example3_frameProcessing() {
  console.log('\n=== Example 3: Frame Processing ===\n');

  const ws = new WebSocket('ws://localhost:8080');

  ws.on('open', () => {
    console.log('✓ Connected to server');

    // Create a mock frame
    const frameData = Buffer.alloc(1920 * 1080 * 4);
    const base64Frame = frameData.toString('base64');

    // Send frame for processing
    console.log('Sending frame for processing...');
    ws.send(JSON.stringify({
      type: 'process-frame',
      frame: base64Frame,
      metadata: {
        timestamp: Date.now(),
        source: 'example'
      }
    }));
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.type === 'frame') {
        console.log('✓ Received processed frame');
        console.log(`  Timestamp: ${message.timestamp}`);
        console.log(`  Size: ${message.width}x${message.height}`);
        console.log(`  Metadata:`, message.metadata);

        // Close after receiving frame
        ws.close();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log('\n✓ Frame processing example completed\n');
}

/**
 * Example 4: Applying Effects
 */
async function example4_applyingEffects() {
  console.log('\n=== Example 4: Applying Effects ===\n');

  const ws = new WebSocket('ws://localhost:8080');

  ws.on('open', () => {
    console.log('✓ Connected to server');

    // Apply face detection effect
    console.log('Applying face detection effect...');
    ws.send(JSON.stringify({
      type: 'apply-effect',
      effect: 'face-detection',
      params: {
        minConfidence: 0.7,
        drawBoundingBox: true,
        drawLandmarks: true
      }
    }));

    setTimeout(() => {
      // Apply color grading effect
      console.log('Applying color grading effect...');
      ws.send(JSON.stringify({
        type: 'apply-effect',
        effect: 'filter',
        params: {
          filterType: 'color-grade',
          preset: 'cinematic-warm',
          intensity: 0.8
        }
      }));
    }, 500);

    setTimeout(() => {
      // Apply background removal
      console.log('Applying background removal...');
      ws.send(JSON.stringify({
        type: 'apply-effect',
        effect: 'background-removal',
        params: {
          mode: 'blur',
          blurAmount: 25
        }
      }));
    }, 1000);
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.type === 'effect-applied') {
        console.log(`✓ Effect applied: ${message.effect}`);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  });

  await new Promise(resolve => setTimeout(resolve, 2000));
  ws.close();
  console.log('\n✓ Effects example completed\n');
}

/**
 * Example 5: Multiple Clients
 */
async function example5_multipleClients() {
  console.log('\n=== Example 5: Multiple Clients ===\n');

  const clients: WebSocket[] = [];
  const clientCount = 5;

  for (let i = 0; i < clientCount; i++) {
    const ws = new WebSocket('ws://localhost:8080');

    ws.on('open', () => {
      console.log(`✓ Client ${i + 1} connected`);
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());

      if (message.type === 'connected') {
        console.log(`  Client ${i + 1} ID: ${message.clientId}`);
      }
    });

    ws.on('error', (error) => {
      console.error(`Client ${i + 1} error:`, error);
    });

    clients.push(ws);

    // Stagger connections
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Keep connections open for a bit
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Disconnect all clients
  for (let i = 0; i < clients.length; i++) {
    clients[i].close();
    console.log(`✓ Client ${i + 1} disconnected`);
  }

  console.log('\n✓ Multiple clients example completed\n');
}

/**
 * Example 6: Error Handling
 */
async function example6_errorHandling() {
  console.log('\n=== Example 6: Error Handling ===\n');

  const ws = new WebSocket('ws://localhost:8080');

  ws.on('open', () => {
    console.log('✓ Connected to server');

    // Send invalid frame
    console.log('Sending invalid frame...');
    ws.send(JSON.stringify({
      type: 'process-frame',
      frame: 'invalid-base64',
      metadata: {}
    }));

    setTimeout(() => {
      // Send unknown effect
      console.log('Applying unknown effect...');
      ws.send(JSON.stringify({
        type: 'apply-effect',
        effect: 'unknown-effect',
        params: {}
      }));
    }, 500);

    setTimeout(() => {
      // Send invalid JSON
      console.log('Sending invalid JSON...');
      ws.send('invalid json {');
    }, 1000);
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.type === 'error') {
        console.log(`✓ Error handled: ${message.message}`);
      }
    } catch (error) {
      // Expected for invalid JSON
    }
  });

  ws.on('error', (error) => {
    console.log(`✓ Connection error handled: ${error.message}`);
  });

  await new Promise(resolve => setTimeout(resolve, 2000));
  ws.close();
  console.log('\n✓ Error handling example completed\n');
}

/**
 * Example 7: Streaming Pipeline
 */
async function example7_streamingPipeline() {
  console.log('\n=== Example 7: Streaming Pipeline ===\n');

  const ws = new WebSocket('ws://localhost:8080');
  const frameRate = 30;
  const duration = 3; // seconds
  let framesStreamed = 0;

  ws.on('open', () => {
    console.log('✓ Connected to server');
    console.log(`Streaming ${frameRate} FPS for ${duration} seconds...\n`);

    // Simulate continuous frame streaming
    const interval = setInterval(() => {
      if (framesStreamed >= frameRate * duration) {
        clearInterval(interval);
        console.log(`\n✓ Streamed ${framesStreamed} frames`);
        ws.close();
        return;
      }

      // Create and send frame
      const frameData = Buffer.alloc(1920 * 1080 * 4);
      const base64Frame = frameData.toString('base64');

      ws.send(JSON.stringify({
        type: 'process-frame',
        frame: base64Frame,
        metadata: {
          frameNumber: framesStreamed,
          timestamp: Date.now()
        }
      }));

      framesStreamed++;

      // Progress indicator
      if (framesStreamed % 10 === 0) {
        process.stdout.write('.');
      }
    }, 1000 / frameRate);
  });

  ws.on('message', (data) => {
    // Handle processed frames
  });

  await new Promise(resolve => {
    ws.on('close', () => {
      resolve(undefined);
    });
  });

  console.log('\n✓ Streaming pipeline example completed\n');
}

/**
 * Main function to run all examples
 */
async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  Video AI Effects Platform Examples   ║');
  console.log('║     Real-time WebSocket Streaming      ║');
  console.log('╚════════════════════════════════════════╝');

  try {
    // Note: These examples require a running server
    // Start the server first with example1_basicServer()

    console.log('\nNOTE: Start the server first:');
    console.log('  npm run example:server\n');

    console.log('Then run client examples:');
    console.log('  npm run example:client\n');

    // Example: Run server
    // await example1_basicServer();

    // Example: Run client examples (requires running server)
    // await example2_clientConnection();
    // await example3_frameProcessing();
    // await example4_applyingEffects();
    // await example5_multipleClients();
    // await example6_errorHandling();
    // await example7_streamingPipeline();

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   All Examples Completed Successfully  ║');
    console.log('╚════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n✗ Error running examples:', error);
    process.exit(1);
  }
}

// Run examples if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  example1_basicServer,
  example2_clientConnection,
  example3_frameProcessing,
  example4_applyingEffects,
  example5_multipleClients,
  example6_errorHandling,
  example7_streamingPipeline
};

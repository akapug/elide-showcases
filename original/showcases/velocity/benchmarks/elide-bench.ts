// Elide-compatible web framework benchmark
// Comparing Velocity to Express, measuring raw HTTP performance

import { createApp } from '../core/app';
import { IncomingMessage, ServerResponse } from 'http';
import http from 'http';

interface Context {
  jsonResponse: (data: any) => void;
  param: (name: string) => string;
}

const PORT_VELOCITY = 3003;
const TEST_DURATION = 10; // seconds
const CONCURRENCY = 100;

// Set up Velocity server
const app = createApp();

app.get('/api/hello', (ctx: Context) => {
  return ctx.jsonResponse({ message: 'Hello, World!' });
});

app.get('/api/user/:id', (ctx: Context) => {
  return ctx.jsonResponse({
    id: ctx.param('id'),
    name: 'John Doe',
    email: 'john@example.com',
  });
});

// Start server
app.listen(PORT_VELOCITY, () => {
  console.log(`Velocity server running on port ${PORT_VELOCITY}`);
});

// Run benchmark
const start = performance.now();
let requests = 0;
let errors = 0;

function makeRequest(): Promise<void> {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${PORT_VELOCITY}/api/hello`, (res: IncomingMessage) => {
      let data = '';
      res.on('data', (chunk: Buffer) => data += chunk);
      res.on('end', () => {
        requests++;
        resolve();
      });
    });
    
    req.on('error', (err: Error) => {
      errors++;
      resolve();
    });
  });
}

// Run concurrent requests
async function runBenchmark(): Promise<void> {
  console.log('Starting benchmark...');
  const endTime = performance.now() + (TEST_DURATION * 1000);
  
  while (performance.now() < endTime) {
    const promises = Array(CONCURRENCY).fill(0).map(() => makeRequest());
    await Promise.all(promises);
  }
  
  const duration = (performance.now() - start) / 1000;
  const rps = Math.floor(requests / duration);
  
  console.log('\nResults:');
  console.log(`Duration: ${duration.toFixed(2)}s`);
  console.log(`Total Requests: ${requests}`);
  console.log(`Errors: ${errors}`);
  console.log(`Requests/sec: ${rps}`);
  
  process.exit(0);
}

// Wait for server to start then run benchmark
setTimeout(runBenchmark, 1000);
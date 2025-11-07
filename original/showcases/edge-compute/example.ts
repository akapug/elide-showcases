/**
 * Example Usage - Complete demonstration
 *
 * Shows how to use the Edge Compute Platform.
 */

import EdgeComputePlatform from './platform';
import EdgeComputeServer from './server';
import * as fs from 'fs';

async function runExample() {
  console.log('=== Edge Compute Platform Example ===\n');

  // Create and initialize platform
  const platform = new EdgeComputePlatform({
    storageDir: './example-functions',
    dataDir: './example-data',
    logLevel: 'info',
  });

  await platform.initialize();
  console.log('✓ Platform initialized\n');

  // Example 1: Deploy a TypeScript function
  console.log('Example 1: Deploy TypeScript function');
  const tsFunction = `
    export function handler(event: any, context: any) {
      console.log('Request:', event.path);

      return {
        message: 'Hello from TypeScript!',
        path: event.path,
        method: event.method,
        timestamp: new Date().toISOString(),
      };
    }
  `;

  const tsResult = await platform.deploy({
    name: 'hello-ts',
    code: tsFunction,
    runtime: 'typescript',
    routes: ['/hello', '/hello-ts'],
  });

  console.log(`✓ Deployed: ${tsResult.functionId} v${tsResult.version}`);
  console.log(`  Routes: ${tsResult.metadata.routes?.join(', ')}\n`);

  // Example 2: Deploy a Python function
  console.log('Example 2: Deploy Python function');
  const pyFunction = `
def handler(event, context):
    print(f"Request: {event['path']}")

    return {
        'message': 'Hello from Python!',
        'path': event['path'],
        'method': event['method'],
        'timestamp': str(__import__('datetime').datetime.now())
    }
  `;

  const pyResult = await platform.deploy({
    name: 'hello-py',
    code: pyFunction,
    runtime: 'python',
    routes: ['/hello-py'],
  });

  console.log(`✓ Deployed: ${pyResult.functionId} v${pyResult.version}\n`);

  // Example 3: Deploy a Ruby function
  console.log('Example 3: Deploy Ruby function');
  const rbFunction = `
def handler(event, context)
  puts "Request: #{event['path']}"

  {
    message: 'Hello from Ruby!',
    path: event['path'],
    method: event['method'],
    timestamp: Time.now.iso8601
  }
end
  `;

  const rbResult = await platform.deploy({
    name: 'hello-rb',
    code: rbFunction,
    runtime: 'ruby',
    routes: ['/hello-rb'],
  });

  console.log(`✓ Deployed: ${rbResult.functionId} v${rbResult.version}\n`);

  // Example 4: Deploy an API function
  console.log('Example 4: Deploy REST API function');
  const apiFunction = `
    const users: any[] = [];

    export function handler(event: any, context: any) {
      const { method, path, body } = event;

      if (method === 'GET' && path === '/api/users') {
        return { statusCode: 200, data: users };
      }

      if (method === 'POST' && path === '/api/users') {
        const user = { id: Date.now(), ...body };
        users.push(user);
        return { statusCode: 201, data: user };
      }

      return { statusCode: 404, error: 'Not found' };
    }
  `;

  const apiResult = await platform.deploy({
    name: 'api',
    code: apiFunction,
    runtime: 'typescript',
    routes: ['/api/*'],
  });

  console.log(`✓ Deployed: ${apiResult.functionId}\n`);

  // Example 5: Invoke functions
  console.log('Example 5: Invoke functions');

  const response1 = await platform.invoke({
    path: '/hello',
    method: 'GET',
    query: { name: 'World' },
  });
  console.log('✓ TypeScript response:', response1.body);

  const response2 = await platform.invoke({
    path: '/hello-py',
    method: 'GET',
  });
  console.log('✓ Python response:', response2.body);

  const response3 = await platform.invoke({
    path: '/hello-rb',
    method: 'GET',
  });
  console.log('✓ Ruby response:', response3.body);
  console.log();

  // Example 6: Test caching
  console.log('Example 6: Test caching');

  const r1 = await platform.invoke({ path: '/hello', method: 'GET' });
  const r2 = await platform.invoke({ path: '/hello', method: 'GET' });

  console.log(`✓ First request: ${r1.executionTime}ms (cached: ${r1.cached})`);
  console.log(`✓ Second request: ${r2.executionTime}ms (cached: ${r2.cached})\n`);

  // Example 7: Use KV store
  console.log('Example 7: Use KV store');

  const kv = platform.getKV();

  await kv.set('config:app', { name: 'Edge Compute', version: '1.0.0' });
  await kv.set('user:1', { name: 'Alice', email: 'alice@example.com' });
  await kv.set('user:2', { name: 'Bob', email: 'bob@example.com' });

  const config = await kv.get('config:app');
  const users = await kv.list({ prefix: 'user:' });

  console.log('✓ Config:', config);
  console.log(`✓ Users: ${users.length} found\n`);

  // Example 8: Monitor metrics
  console.log('Example 8: Monitor metrics');

  const metrics = platform.getMetrics();
  const summary = metrics.getSummary();

  console.log(`✓ Total requests: ${summary.requests.total}`);
  console.log(`✓ Success rate: ${((summary.requests.success / summary.requests.total) * 100).toFixed(2)}%`);
  console.log(`✓ Avg latency: ${summary.latency.avg.toFixed(2)}ms\n`);

  // Example 9: Get platform status
  console.log('Example 9: Platform status');

  const status = platform.getStatus();
  console.log(`✓ Status: ${status.status}`);
  console.log(`✓ Uptime: ${(status.uptime / 1000).toFixed(2)}s`);
  console.log(`✓ Functions: ${status.components.functions.total}`);
  console.log(`✓ Cache size: ${status.components.cache.size}\n`);

  // Example 10: Versioning and rollback
  console.log('Example 10: Versioning and rollback');

  // Deploy v2
  const v2Function = `
    export function handler(event: any, context: any) {
      return { message: 'Hello from v2!', version: 2 };
    }
  `;

  const v2 = await platform.deploy({
    name: 'hello-ts',
    code: v2Function,
    runtime: 'typescript',
  });

  console.log(`✓ Deployed v2: ${v2.version}`);

  // Invoke v2
  const v2Response = await platform.invoke({ path: '/hello', method: 'GET' });
  console.log('✓ V2 response:', v2Response.body);
  console.log();

  // Cleanup
  await platform.shutdown();
  console.log('✓ Platform shut down\n');

  console.log('=== Example completed successfully ===');
}

// Run example with HTTP server
async function runServerExample() {
  console.log('=== Starting HTTP Server Example ===\n');

  const server = new EdgeComputeServer({
    port: 3000,
    host: '0.0.0.0',
  });

  await server.start();

  console.log('\nServer is running!');
  console.log('Try these URLs:');
  console.log('  - http://localhost:3000/health');
  console.log('  - http://localhost:3000/status');
  console.log('  - http://localhost:3000/metrics');
  console.log('\nDeploy a function:');
  console.log('  curl -X POST http://localhost:3000/deploy \\');
  console.log('    -H "Content-Type: application/json" \\');
  console.log('    -d \'{"name":"test","code":"...","runtime":"typescript"}\'');
  console.log('\nPress Ctrl+C to stop\n');
}

// Main
if (require.main === module) {
  const mode = process.argv[2] || 'example';

  if (mode === 'server') {
    runServerExample().catch((error) => {
      console.error('Server example failed:', error);
      process.exit(1);
    });
  } else {
    runExample()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Example failed:', error);
        process.exit(1);
      });
  }
}

export { runExample, runServerExample };

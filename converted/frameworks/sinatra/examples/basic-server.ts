/**
 * Basic Sinatra Server Example
 *
 * Demonstrates:
 * - Creating a Sinatra application
 * - Basic routing
 * - Simple responses
 * - Running the server
 */

import { Sinatra } from '../server';

class MyApp extends Sinatra.Base {
  // Define routes using the Sinatra DSL
}

// Root route
MyApp.get('/', function() {
  return 'Hello from Sinatra on Elide!';
});

// JSON response
MyApp.get('/json', function() {
  return this.json({
    message: 'Hello World',
    framework: 'Sinatra',
    runtime: 'Elide/GraalVM',
    timestamp: new Date().toISOString()
  });
});

// HTML response
MyApp.get('/html', function() {
  this.contentType('html');
  return `
    <!DOCTYPE html>
    <html>
      <head><title>Sinatra on Elide</title></head>
      <body>
        <h1>Hello from Sinatra!</h1>
        <p>This is HTML served by Sinatra on Elide.</p>
      </body>
    </html>
  `;
});

// Route with parameter
MyApp.get('/hello/:name', function() {
  const name = this.params.name;
  return this.json({
    greeting: `Hello, ${name}!`,
    path: this.request.path
  });
});

// Query parameters
MyApp.get('/search', function() {
  const query = this.params.q || '(no query)';
  return this.json({
    query: query,
    results: `Results for: ${query}`
  });
});

// Start the server
MyApp.run({ port: 4567 });

console.log('✓ Sinatra server running on http://localhost:4567');
console.log('\n  Try these URLs:');
console.log('  http://localhost:4567/');
console.log('  http://localhost:4567/json');
console.log('  http://localhost:4567/html');
console.log('  http://localhost:4567/hello/World');
console.log('  http://localhost:4567/search?q=elide');

/**
 * Test Node.js http.createServer with beta11-rc1
 *
 * This tests the imperative pattern using Node.js http API
 */

import { createServer, IncomingMessage, ServerResponse } from "http";

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  const url = req.url || '/';
  const method = req.method || 'GET';

  // Simple routing
  if (url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      version: 'beta11-rc1',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  if (url === '/api/test') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'Native HTTP API works!',
      method,
      url
    }));
    return;
  }

  // Default response
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    message: 'Elide beta11-rc1 HTTP Server',
    endpoints: ['/health', '/api/test'],
    method,
    url
  }));
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log('🎉 Test endpoints:');
  console.log(`   - http://localhost:${PORT}/health`);
  console.log(`   - http://localhost:${PORT}/api/test`);
  console.log(`   - http://localhost:${PORT}/ (default)`);
});

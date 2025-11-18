/**
 * Basic Express Server Example
 *
 * The simplest possible Express application - great for getting started!
 */

import express from '../src/index';

// Create Express app
const app = express();

// Define a simple route
app.get('/', (req, res) => {
  res.send('Hello from Express on Elide!');
});

app.get('/json', (req, res) => {
  res.json({
    message: 'Hello World',
    timestamp: new Date().toISOString(),
    powered_by: 'Express on Elide'
  });
});

app.get('/status', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n✓ Server running on http://localhost:${PORT}`);
  console.log('\nTry these URLs:');
  console.log(`  http://localhost:${PORT}/`);
  console.log(`  http://localhost:${PORT}/json`);
  console.log(`  http://localhost:${PORT}/status`);
  console.log('');
});

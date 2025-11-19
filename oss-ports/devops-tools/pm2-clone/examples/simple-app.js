/**
 * Simple Application Example for PM2 Clone
 */

const http = require('http');

const PORT = process.env.PORT || 3000;
const INSTANCE_ID = process.env.NODE_APP_INSTANCE || '0';

// Simulate some work
function doWork() {
  const start = Date.now();
  let sum = 0;
  for (let i = 0; i < 1000000; i++) {
    sum += Math.sqrt(i);
  }
  return Date.now() - start;
}

const server = http.createServer((req, res) => {
  const workTime = doWork();

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    message: 'Hello from PM2 Clone!',
    instance: INSTANCE_ID,
    pid: process.pid,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    workTime: `${workTime}ms`,
  }));
});

server.listen(PORT, () => {
  console.log(`[Instance ${INSTANCE_ID}] Server running on port ${PORT} (PID: ${process.pid})`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(`[Instance ${INSTANCE_ID}] Received SIGINT, shutting down gracefully...`);

  server.close(() => {
    console.log(`[Instance ${INSTANCE_ID}] Server closed`);
    process.exit(0);
  });

  // Force exit after 5 seconds
  setTimeout(() => {
    console.error(`[Instance ${INSTANCE_ID}] Forced shutdown`);
    process.exit(1);
  }, 5000);
});

// Simulate occasional memory leak
setInterval(() => {
  global.leakyData = global.leakyData || [];
  global.leakyData.push(new Array(1000).fill('data'));
}, 60000);

// Log status every 30 seconds
setInterval(() => {
  console.log(`[Instance ${INSTANCE_ID}] Status: OK, Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
}, 30000);

/**
 * WebSocket Example for Fastify Clone
 *
 * Demonstrates WebSocket support, real-time communication
 */

import fastify from '../src/fastify.ts';

const app = fastify({ logger: true });

// WebSocket-like real-time simulation
const connections = new Set();

app.get('/ws', async (request, reply) => {
  // Simulate WebSocket upgrade
  reply.header('Upgrade', 'websocket');
  reply.header('Connection', 'Upgrade');

  return {
    message: 'WebSocket connection established',
    clientId: request.id
  };
});

// Broadcast endpoint
app.post('/broadcast', async (request, reply) => {
  const { message } = request.body;

  // Simulate broadcasting to all connections
  const broadcast = {
    type: 'broadcast',
    message,
    timestamp: Date.now(),
    connections: connections.size
  };

  reply.code(200);
  return broadcast;
});

// Chat room simulation
const rooms = new Map();

app.post('/rooms/:roomId/join', async (request, reply) => {
  const { roomId } = request.params;
  const { username } = request.body;

  if (!rooms.has(roomId)) {
    rooms.set(roomId, { users: new Set(), messages: [] });
  }

  const room = rooms.get(roomId);
  room.users.add(username);

  return {
    success: true,
    room: roomId,
    users: Array.from(room.users),
    messageCount: room.messages.length
  };
});

app.post('/rooms/:roomId/message', async (request, reply) => {
  const { roomId } = request.params;
  const { username, message } = request.body;

  const room = rooms.get(roomId);

  if (!room) {
    reply.code(404);
    return { error: 'Room not found' };
  }

  const msg = {
    id: Date.now(),
    username,
    message,
    timestamp: new Date().toISOString()
  };

  room.messages.push(msg);

  return {
    success: true,
    message: msg,
    totalMessages: room.messages.length
  };
});

app.get('/rooms/:roomId/messages', async (request, reply) => {
  const { roomId } = request.params;
  const { limit = '50' } = request.query;

  const room = rooms.get(roomId);

  if (!room) {
    reply.code(404);
    return { error: 'Room not found' };
  }

  const limitNum = parseInt(limit);
  const messages = room.messages.slice(-limitNum);

  return {
    room: roomId,
    messages,
    users: Array.from(room.users)
  };
});

// Real-time events simulation
const events = [];

app.get('/events/stream', async (request, reply) => {
  reply.header('Content-Type', 'text/event-stream');
  reply.header('Cache-Control', 'no-cache');
  reply.header('Connection', 'keep-alive');

  return {
    message: 'Event stream started',
    timestamp: Date.now()
  };
});

app.post('/events/trigger', async (request, reply) => {
  const { eventType, data } = request.body;

  const event = {
    id: Date.now(),
    type: eventType,
    data,
    timestamp: new Date().toISOString()
  };

  events.push(event);

  // Keep only last 100 events
  if (events.length > 100) {
    events.shift();
  }

  return {
    success: true,
    event,
    totalEvents: events.length
  };
});

app.get('/events', async (request, reply) => {
  const { since } = request.query;

  let filtered = events;

  if (since) {
    const sinceTime = parseInt(since);
    filtered = events.filter(e => e.id > sinceTime);
  }

  return {
    events: filtered,
    total: events.length
  };
});

app.listen({ port: 3100 }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`\n🚀 WebSocket server ready at ${address}`);
  console.log(`\nEndpoints:`);
  console.log(`  GET  ${address}/ws - WebSocket connection`);
  console.log(`  POST ${address}/rooms/:roomId/join - Join chat room`);
  console.log(`  POST ${address}/rooms/:roomId/message - Send message`);
  console.log(`  GET  ${address}/rooms/:roomId/messages - Get messages`);
  console.log(`  POST ${address}/events/trigger - Trigger event`);
  console.log(`  GET  ${address}/events - Get events\n`);
});

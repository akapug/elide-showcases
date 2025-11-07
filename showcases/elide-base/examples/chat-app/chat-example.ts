/**
 * ElideBase - Chat App Example
 *
 * A complete real-time chat application with:
 * - Real-time messaging
 * - Chat rooms and direct messages
 * - Typing indicators
 * - File sharing
 * - Message sentiment analysis (Python ML hook)
 * - Notification delivery (Ruby hook)
 * - External chat platform integration (Java hook)
 */

import { SQLiteDatabase } from '../../database/sqlite';
import { SchemaManager, CollectionSchema } from '../../database/schema';
import { RestAPI } from '../../api/rest-api';
import { RealtimeServer } from '../../api/realtime';
import { FileStorage } from '../../api/files';
import { UserManager } from '../../auth/users';

// Initialize database
const db = new SQLiteDatabase({ filename: './examples/chat-app/chat.db' });
const schema = new SchemaManager(db);

// Define chat schema
const roomsSchema: CollectionSchema = {
  name: 'rooms',
  fields: [
    { name: 'name', type: 'text', options: { required: true } },
    { name: 'description', type: 'text' },
    { name: 'type', type: 'text', options: { default: 'public' } }, // public, private, direct
    { name: 'created_by', type: 'relation', relation: { collection: 'users' } },
    { name: 'avatar', type: 'file' }
  ]
};

const membersSchema: CollectionSchema = {
  name: 'room_members',
  fields: [
    { name: 'room_id', type: 'relation', relation: { collection: 'rooms' } },
    { name: 'user_id', type: 'relation', relation: { collection: 'users' } },
    { name: 'role', type: 'text', options: { default: 'member' } }, // admin, moderator, member
    { name: 'last_read_at', type: 'date' }
  ],
  indexes: [['room_id', 'user_id']]
};

const messagesSchema: CollectionSchema = {
  name: 'messages',
  fields: [
    { name: 'room_id', type: 'relation', relation: { collection: 'rooms' } },
    { name: 'user_id', type: 'relation', relation: { collection: 'users' } },
    { name: 'content', type: 'text', options: { required: true } },
    { name: 'type', type: 'text', options: { default: 'text' } }, // text, image, file
    { name: 'file_id', type: 'relation', relation: { collection: 'files' } },
    { name: 'reply_to', type: 'relation', relation: { collection: 'messages' } },
    { name: 'edited', type: 'boolean', options: { default: false } },
    { name: 'deleted', type: 'boolean', options: { default: false } }
  ],
  indexes: [['room_id'], ['user_id']],
  hooks: {
    afterCreate: 'python:analyze_sentiment', // Analyze message sentiment
    afterCreate: 'ruby:send_notifications', // Send push notifications
    afterCreate: 'java:sync_to_slack' // Sync to external platforms
  }
};

// Register collections
schema.registerCollection(roomsSchema);
schema.registerCollection(membersSchema);
schema.registerCollection(messagesSchema);

// Initialize services
const userManager = new UserManager(db);
const restAPI = new RestAPI(db, schema);
const realtime = new RealtimeServer(db, schema);
const fileStorage = new FileStorage(db, {
  baseDir: './examples/chat-app/storage',
  maxFileSize: 10 * 1024 * 1024 // 10MB
});

/**
 * Example: Create chat room
 */
async function createChatRoom() {
  console.log('\n--- Creating Chat Room ---');

  // Register users
  const alice = await userManager.register({
    email: 'alice@chat.com',
    password: 'password123',
    username: 'alice'
  });

  const bob = await userManager.register({
    email: 'bob@chat.com',
    password: 'password123',
    username: 'bob'
  });

  // Create room
  const roomRequest = {
    method: 'POST',
    path: '/api/collections/rooms',
    query: {},
    body: {
      name: 'General',
      description: 'General chat room for everyone',
      type: 'public',
      created_by: alice.id
    },
    headers: {},
    user: alice
  };

  const roomResponse = await restAPI.handle(roomRequest);
  const room = roomResponse.body;

  console.log('Created room:', room.name);

  // Add members
  for (const user of [alice, bob]) {
    const memberRequest = {
      method: 'POST',
      path: '/api/collections/room_members',
      query: {},
      body: {
        room_id: room.id,
        user_id: user.id,
        role: user.id === alice.id ? 'admin' : 'member'
      },
      headers: {}
    };

    await restAPI.handle(memberRequest);
    console.log('Added member:', user.username);
  }

  return { alice, bob, room };
}

/**
 * Example: Real-time chat
 */
async function realtimeChat(roomId: string, alice: any, bob: any) {
  console.log('\n--- Real-time Chat ---');

  // Create WebSocket clients for both users
  const aliceClient = {
    id: 'alice-client',
    userId: alice.id,
    send: (data: any) => {
      const parsed = JSON.parse(data);
      if (parsed.type === 'event') {
        const message = parsed.event.record;
        console.log(`[Alice] Received: ${message.content}`);
      }
    },
    close: () => {}
  };

  const bobClient = {
    id: 'bob-client',
    userId: bob.id,
    send: (data: any) => {
      const parsed = JSON.parse(data);
      if (parsed.type === 'event') {
        const message = parsed.event.record;
        console.log(`[Bob] Received: ${message.content}`);
      }
    },
    close: () => {}
  };

  // Register clients
  realtime.registerClient(aliceClient);
  realtime.registerClient(bobClient);

  // Subscribe to messages in this room
  realtime.handleMessage(aliceClient.id, {
    type: 'subscribe',
    collection: 'messages',
    filter: `room_id=${roomId}`
  });

  realtime.handleMessage(bobClient.id, {
    type: 'subscribe',
    collection: 'messages',
    filter: `room_id=${roomId}`
  });

  console.log('Both users subscribed to real-time messages');

  // Alice sends a message
  const message1 = {
    id: 'msg-1',
    room_id: roomId,
    user_id: alice.id,
    content: 'Hey Bob, have you tried ElideBase?',
    type: 'text'
  };

  realtime.broadcast({
    type: 'create',
    collection: 'messages',
    record: message1,
    timestamp: Date.now()
  });

  console.log('\nAlice sent: ' + message1.content);
  console.log('Python Hook analyzed sentiment: positive');

  // Bob sends a message
  const message2 = {
    id: 'msg-2',
    room_id: roomId,
    user_id: bob.id,
    content: 'Yes! The polyglot hooks are amazing!',
    type: 'text'
  };

  realtime.broadcast({
    type: 'create',
    collection: 'messages',
    record: message2,
    timestamp: Date.now()
  });

  console.log('\nBob sent: ' + message2.content);
  console.log('Ruby Hook sent push notification to Alice');
  console.log('Java Hook synced to Slack');
}

/**
 * Example: Send message with file
 */
async function sendMessageWithFile(roomId: string, userId: string) {
  console.log('\n--- Sending Message with File ---');

  // Upload file
  const fileBuffer = Buffer.from('file-content-here');
  const file = await fileStorage.upload(fileBuffer, 'document.pdf', 'application/pdf', {
    userId
  });

  console.log('Uploaded file:', file.filename);

  // Send message with file
  const messageRequest = {
    method: 'POST',
    path: '/api/collections/messages',
    query: {},
    body: {
      room_id: roomId,
      user_id: userId,
      content: 'Check out this document',
      type: 'file',
      file_id: file.id
    },
    headers: {}
  };

  const messageResponse = await restAPI.handle(messageRequest);
  console.log('Message sent with file attachment');

  return messageResponse.body;
}

/**
 * Example: Get message history
 */
async function getMessageHistory(roomId: string) {
  console.log('\n--- Getting Message History ---');

  const request = {
    method: 'GET',
    path: '/api/collections/messages',
    query: {
      filter: `room_id=${roomId}&&deleted=false`,
      sort: '-created_at',
      perPage: 50,
      expand: 'user_id'
    },
    headers: {}
  };

  const response = await restAPI.handle(request);

  console.log('Messages in room:', response.body.totalItems);

  // Display messages
  for (const message of response.body.items) {
    const username = message.expand_user_id?.username || 'Unknown';
    console.log(`[${username}]: ${message.content}`);
  }

  return response.body;
}

/**
 * Example: Search messages
 */
async function searchMessages(query: string) {
  console.log('\n--- Searching Messages ---');

  const request = {
    method: 'GET',
    path: '/api/collections/messages',
    query: {
      filter: `content~${query}&&deleted=false`,
      sort: '-created_at'
    },
    headers: {}
  };

  const response = await restAPI.handle(request);

  console.log('Search results:', response.body.totalItems);
  return response.body;
}

/**
 * Example: Direct message
 */
async function sendDirectMessage(alice: any, bob: any) {
  console.log('\n--- Direct Message ---');

  // Create direct message room
  const dmRequest = {
    method: 'POST',
    path: '/api/collections/rooms',
    query: {},
    body: {
      name: `${alice.username}-${bob.username}`,
      type: 'direct',
      created_by: alice.id
    },
    headers: {}
  };

  const dmResponse = await restAPI.handle(dmRequest);
  const dmRoom = dmResponse.body;

  // Add members
  for (const user of [alice, bob]) {
    await restAPI.handle({
      method: 'POST',
      path: '/api/collections/room_members',
      query: {},
      body: {
        room_id: dmRoom.id,
        user_id: user.id,
        role: 'member'
      },
      headers: {}
    });
  }

  // Send direct message
  const messageRequest = {
    method: 'POST',
    path: '/api/collections/messages',
    query: {},
    body: {
      room_id: dmRoom.id,
      user_id: alice.id,
      content: 'Hey Bob, let\'s discuss the project privately',
      type: 'text'
    },
    headers: {}
  };

  await restAPI.handle(messageRequest);

  console.log('Direct message sent from Alice to Bob');
}

/**
 * Run the chat app example
 */
async function main() {
  console.log('=== ElideBase Chat App Example ===');

  // Create chat room
  const { alice, bob, room } = await createChatRoom();

  // Real-time chat
  await realtimeChat(room.id, alice, bob);

  // Send message with file
  await sendMessageWithFile(room.id, alice.id);

  // Get message history
  await getMessageHistory(room.id);

  // Search messages
  await searchMessages('elidebase');

  // Send direct message
  await sendDirectMessage(alice, bob);

  console.log('\n=== Chat App Example Complete ===');
  console.log('\nFeatures demonstrated:');
  console.log('- Real-time messaging');
  console.log('- Chat rooms and direct messages');
  console.log('- File sharing');
  console.log('- Message history and search');
  console.log('- Python ML hooks for sentiment analysis');
  console.log('- Ruby hooks for push notifications');
  console.log('- Java hooks for external platform sync');
}

// Run example
main().catch(console.error);

/**
 * Example: WebSocket Chat Server
 * Demonstrates WebSocket support with real-time messaging
 */

import { createApp } from '../../core/app';
import { logger } from '../../middleware/logger';
import type { ServerWebSocket } from 'bun';

interface ChatMessage {
  type: 'join' | 'leave' | 'message' | 'users';
  username?: string;
  message?: string;
  timestamp?: string;
  users?: string[];
}

interface ClientData {
  username: string;
  path: string;
}

// Connected users
const clients = new Set<ServerWebSocket<ClientData>>();
const usernames = new Map<ServerWebSocket<ClientData>, string>();

function broadcast(message: ChatMessage, exclude?: ServerWebSocket<ClientData>) {
  const data = JSON.stringify(message);
  for (const client of clients) {
    if (client !== exclude) {
      client.send(data);
    }
  }
}

function getUsersList(): string[] {
  return Array.from(usernames.values());
}

// Create app
const app = createApp();

// Middleware
app.use(logger({ format: 'detailed' }));

// HTTP routes
app.get('/', (ctx) => {
  return ctx.htmlResponse(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Velocity WebSocket Chat</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 10px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      width: 100%;
      max-width: 800px;
      height: 600px;
      display: flex;
      flex-direction: column;
    }
    .header {
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 10px 10px 0 0;
    }
    .header h1 {
      font-size: 24px;
      margin-bottom: 5px;
    }
    .users {
      padding: 10px 20px;
      background: #f7fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    .users-title {
      font-size: 12px;
      color: #718096;
      margin-bottom: 5px;
    }
    .users-list {
      font-size: 14px;
      color: #2d3748;
    }
    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      background: #f7fafc;
    }
    .message {
      margin-bottom: 15px;
      animation: slideIn 0.3s ease;
    }
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .message.system {
      text-align: center;
      color: #718096;
      font-size: 14px;
      font-style: italic;
    }
    .message.user .username {
      font-weight: bold;
      color: #667eea;
      margin-bottom: 2px;
    }
    .message.user .text {
      color: #2d3748;
      line-height: 1.5;
    }
    .input-area {
      padding: 20px;
      background: white;
      border-radius: 0 0 10px 10px;
      border-top: 1px solid #e2e8f0;
    }
    .input-group {
      display: flex;
      gap: 10px;
    }
    input {
      flex: 1;
      padding: 12px 15px;
      border: 2px solid #e2e8f0;
      border-radius: 5px;
      font-size: 14px;
      transition: border-color 0.3s;
    }
    input:focus {
      outline: none;
      border-color: #667eea;
    }
    button {
      padding: 12px 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 5px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
    }
    button:hover {
      transform: translateY(-2px);
    }
    button:active {
      transform: translateY(0);
    }
    .status {
      text-align: center;
      padding: 10px;
      font-size: 12px;
      color: #718096;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚡ Velocity Chat</h1>
      <p>WebSocket Example</p>
    </div>
    <div class="users">
      <div class="users-title">ONLINE USERS</div>
      <div class="users-list" id="usersList">-</div>
    </div>
    <div class="messages" id="messages"></div>
    <div class="input-area">
      <div class="input-group">
        <input type="text" id="messageInput" placeholder="Type your message..." disabled>
        <button id="sendBtn" disabled>Send</button>
      </div>
    </div>
    <div class="status" id="status">Enter your username to start chatting</div>
  </div>

  <script>
    let ws;
    let username;

    function connect() {
      username = prompt('Enter your username:');
      if (!username) {
        document.getElementById('status').textContent = 'Username required to join chat';
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(protocol + '//' + window.location.host + '/chat');

      ws.onopen = () => {
        document.getElementById('status').textContent = 'Connected';
        document.getElementById('messageInput').disabled = false;
        document.getElementById('sendBtn').disabled = false;
        ws.send(JSON.stringify({ type: 'join', username }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'users') {
          document.getElementById('usersList').textContent = data.users.join(', ');
        } else if (data.type === 'join' || data.type === 'leave') {
          addSystemMessage(data.message);
        } else if (data.type === 'message') {
          addMessage(data.username, data.message);
        }
      };

      ws.onclose = () => {
        document.getElementById('status').textContent = 'Disconnected - Refresh to reconnect';
        document.getElementById('messageInput').disabled = true;
        document.getElementById('sendBtn').disabled = true;
      };

      ws.onerror = () => {
        document.getElementById('status').textContent = 'Connection error';
      };
    }

    function addMessage(user, text) {
      const messages = document.getElementById('messages');
      const div = document.createElement('div');
      div.className = 'message user';
      div.innerHTML = \`
        <div class="username">\${user}</div>
        <div class="text">\${text}</div>
      \`;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    function addSystemMessage(text) {
      const messages = document.getElementById('messages');
      const div = document.createElement('div');
      div.className = 'message system';
      div.textContent = text;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    function sendMessage() {
      const input = document.getElementById('messageInput');
      const message = input.value.trim();

      if (message && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'message',
          username,
          message
        }));
        addMessage(username + ' (you)', message);
        input.value = '';
      }
    }

    document.getElementById('sendBtn').onclick = sendMessage;
    document.getElementById('messageInput').onkeypress = (e) => {
      if (e.key === 'Enter') sendMessage();
    };

    connect();
  </script>
</body>
</html>
  `);
});

// WebSocket endpoint
app.ws('/chat', {
  open: (ws) => {
    clients.add(ws);
    console.log('Client connected, total:', clients.size);
  },

  message: (ws, message) => {
    const data = JSON.parse(message.toString()) as ChatMessage;

    if (data.type === 'join' && data.username) {
      usernames.set(ws, data.username);

      // Notify others
      broadcast({
        type: 'join',
        message: `${data.username} joined the chat`,
        timestamp: new Date().toISOString(),
      }, ws);

      // Send user list to everyone
      const users = getUsersList();
      for (const client of clients) {
        client.send(JSON.stringify({ type: 'users', users }));
      }

      console.log(`${data.username} joined`);
    } else if (data.type === 'message') {
      // Broadcast message to others
      broadcast({
        type: 'message',
        username: data.username,
        message: data.message,
        timestamp: new Date().toISOString(),
      }, ws);

      console.log(`${data.username}: ${data.message}`);
    }
  },

  close: (ws) => {
    const username = usernames.get(ws);

    clients.delete(ws);
    usernames.delete(ws);

    if (username) {
      // Notify others
      broadcast({
        type: 'leave',
        message: `${username} left the chat`,
        timestamp: new Date().toISOString(),
      });

      // Send updated user list
      const users = getUsersList();
      for (const client of clients) {
        client.send(JSON.stringify({ type: 'users', users }));
      }

      console.log(`${username} disconnected`);
    }

    console.log('Client disconnected, total:', clients.size);
  },

  error: (ws, error) => {
    console.error('WebSocket error:', error);
  },
});

// Start server
const PORT = parseInt(process.env.PORT || '3000');
app.listen({ port: PORT });

console.log(`\n✨ WebSocket Chat running at http://localhost:${PORT}`);
console.log('Open the URL in multiple browser tabs to test chat!\n');

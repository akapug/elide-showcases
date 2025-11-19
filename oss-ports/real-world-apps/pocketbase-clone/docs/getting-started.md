# Getting Started Guide

This guide will help you get up and running with Elide PocketBase Clone in minutes.

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Basic knowledge of REST APIs

## Installation

### Option 1: Global Installation

```bash
npm install -g @elide/pocketbase-clone
```

### Option 2: Local Project

```bash
npm install @elide/pocketbase-clone
```

### Option 3: From Source

```bash
git clone https://github.com/elide/pocketbase-clone
cd pocketbase-clone
npm install
npm run build
```

## Your First Server

### 1. Start the Server

```bash
elide-pocket serve
```

The server will start on `http://localhost:8090`

### 2. Create an Admin User

```bash
elide-pocket admin --create --email admin@example.com --password secret123
```

### 3. Login to Admin Dashboard

Open `http://localhost:8090/_/` in your browser and login with your credentials.

## Creating Your First Collection

### Via Admin Dashboard

1. Navigate to "Collections" in the sidebar
2. Click "New Collection"
3. Enter collection name (e.g., "posts")
4. Add fields:
   - `title` (text, required)
   - `content` (text)
   - `published` (boolean)
5. Set rules (optional)
6. Click "Create"

### Via API

```bash
curl -X POST http://localhost:8090/api/collections \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "posts",
    "type": "base",
    "schema": [
      {
        "name": "title",
        "type": "text",
        "required": true
      },
      {
        "name": "content",
        "type": "text"
      },
      {
        "name": "published",
        "type": "bool"
      }
    ],
    "listRule": "",
    "viewRule": "",
    "createRule": "auth.id != null",
    "updateRule": "auth.id = record.userId",
    "deleteRule": "auth.id = record.userId"
  }'
```

## Working with Records

### Create a Record

```javascript
const response = await fetch('http://localhost:8090/api/records/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'My First Post',
    content: 'Hello, World!',
    published: true,
  }),
});

const record = await response.json();
console.log(record);
```

### List Records

```javascript
const response = await fetch('http://localhost:8090/api/records/posts?page=1&perPage=20');
const result = await response.json();

console.log(`Total: ${result.totalItems}`);
console.log(`Records:`, result.items);
```

### Get a Single Record

```javascript
const response = await fetch('http://localhost:8090/api/records/posts/RECORD_ID');
const record = await response.json();
console.log(record);
```

### Update a Record

```javascript
const response = await fetch('http://localhost:8090/api/records/posts/RECORD_ID', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Updated Title',
  }),
});

const record = await response.json();
console.log(record);
```

### Delete a Record

```javascript
const response = await fetch('http://localhost:8090/api/records/posts/RECORD_ID', {
  method: 'DELETE',
});

console.log('Record deleted');
```

## Filtering and Sorting

### Filter Records

```javascript
// Get published posts
const response = await fetch('http://localhost:8090/api/records/posts?filter=published=true');

// Get posts with title containing "hello"
const response = await fetch('http://localhost:8090/api/records/posts?filter=title~\'hello\'');

// Multiple conditions
const response = await fetch('http://localhost:8090/api/records/posts?filter=published=true&&created>\'2024-01-01\'');
```

### Sort Records

```javascript
// Sort by created date (descending)
const response = await fetch('http://localhost:8090/api/records/posts?sort=-created');

// Multiple sort fields
const response = await fetch('http://localhost:8090/api/records/posts?sort=-published,title');
```

### Pagination

```javascript
// Get page 2 with 50 items per page
const response = await fetch('http://localhost:8090/api/records/posts?page=2&perPage=50');
```

## Authentication

### Create Auth Collection

```bash
curl -X POST http://localhost:8090/api/collections \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "users",
    "type": "auth",
    "options": {
      "allowEmailAuth": true,
      "allowUsernameAuth": true,
      "minPasswordLength": 8
    }
  }'
```

### Register a User

```javascript
const response = await fetch('http://localhost:8090/api/collections/users/auth-with-password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    passwordConfirm: 'password123',
  }),
});

const { token, record } = await response.json();
console.log('Token:', token);
console.log('User:', record);
```

### Login

```javascript
const response = await fetch('http://localhost:8090/api/collections/users/auth-with-password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    identity: 'user@example.com',
    password: 'password123',
  }),
});

const { token, record } = await response.json();
// Store token for future requests
localStorage.setItem('auth_token', token);
```

### Authenticated Requests

```javascript
const token = localStorage.getItem('auth_token');

const response = await fetch('http://localhost:8090/api/records/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    title: 'My Post',
    content: 'Content here',
  }),
});
```

## Real-time Updates

### Subscribe to Collection

```javascript
const eventSource = new EventSource('http://localhost:8090/api/realtime');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'connected') {
    console.log('Connected to real-time');
  }

  if (data.action) {
    console.log(`${data.action} in ${data.collection}:`, data.record);
  }
};

eventSource.onerror = (error) => {
  console.error('Real-time error:', error);
};
```

## File Uploads

### Upload a File

```javascript
const formData = new FormData();
formData.append('title', 'Post with Image');
formData.append('image', fileInput.files[0]);

const response = await fetch('http://localhost:8090/api/records/posts', {
  method: 'POST',
  body: formData,
});

const record = await response.json();
console.log('Image URL:', record.image);
```

### Get File URL

```javascript
const fileUrl = `http://localhost:8090/api/files/${collectionName}/${recordId}/${fieldName}/${filename}`;
```

## Environment Variables

Create a `.env` file:

```env
PORT=8090
HOST=0.0.0.0
DB_PATH=./pb_data/data.db
JWT_SECRET=your-secret-key-here
STORAGE_PATH=./pb_data/storage

# OAuth2 (optional)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret

# S3 (optional)
S3_BUCKET=your-bucket
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
```

## Next Steps

- [Collections Guide](./collections.md) - Learn about collections and schemas
- [Authentication Guide](./authentication.md) - Advanced auth topics
- [Real-time Guide](./realtime.md) - Real-time subscriptions
- [Rules & Permissions](./rules.md) - Access control
- [Deployment Guide](./deployment.md) - Deploy to production

## Troubleshooting

### Server won't start

1. Check if port 8090 is already in use
2. Verify Node.js version (18+)
3. Check file permissions for database directory

### Can't create admin

1. Verify database exists and is writable
2. Check for existing admin with same email
3. Ensure migrations have run

### API returns 403 Forbidden

1. Check collection rules
2. Verify authentication token
3. Check if user has required permissions

## Getting Help

- 📖 [Full Documentation](../README.md)
- 💬 [GitHub Discussions](https://github.com/elide/pocketbase-clone/discussions)
- 🐛 [Report Issues](https://github.com/elide/pocketbase-clone/issues)

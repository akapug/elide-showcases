# ElideSupabase Quick Start

Get started with ElideSupabase in 5 minutes!

## Installation

```bash
# Clone the repository
git clone https://github.com/elide-dev/elide-showcases
cd elide-showcases/showcases/elide-supabase

# Copy example config
cp config.example.yaml config.yaml

# Start ElideSupabase
elide run main.ts
```

## Your First API

ElideSupabase automatically creates REST APIs for your database tables.

### 1. Create a Table

Using the SQL editor at `http://localhost:3004`:

```sql
CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  author_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Insert Data

```bash
curl -X POST http://localhost:3000/api/v1/posts \
  -H "Content-Type: application/json" \
  -d '{
    "id": "post_1",
    "title": "Hello ElideSupabase!",
    "content": "This is my first post",
    "author_id": "user_1"
  }'
```

### 3. Query Data

```bash
# Get all posts
curl http://localhost:3000/api/v1/posts

# Get one post
curl http://localhost:3000/api/v1/posts/post_1

# Filter posts
curl "http://localhost:3000/api/v1/posts?author_id=user_1"

# Sort and paginate
curl "http://localhost:3000/api/v1/posts?order=created_at.desc&limit=10"
```

## Real-time Subscriptions

Subscribe to database changes via WebSocket:

```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    table: 'posts',
    events: ['INSERT', 'UPDATE']
  }));
};

ws.onmessage = (event) => {
  const { payload } = JSON.parse(event.data);
  console.log('New post:', payload.new);
};
```

## Authentication

### Register a User

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com"
  },
  "session": {
    "token": "eyJhbGc...",
    "refreshToken": "..."
  }
}
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Use the Token

```bash
curl http://localhost:3000/api/v1/posts \
  -H "Authorization: Bearer eyJhbGc..."
```

## File Storage

### Create a Bucket

```bash
curl -X POST http://localhost:3000/storage/v1/buckets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "name": "avatars",
    "public": true
  }'
```

### Upload a File

```bash
curl -X POST http://localhost:3000/storage/v1/object/avatars/user.jpg \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "file=@./user.jpg"
```

### Access via CDN

```
http://localhost:3003/avatars/user.jpg
```

### Transform Images

```
# Resize
http://localhost:3003/avatars/user.jpg?width=200&height=200

# Convert format
http://localhost:3003/avatars/user.jpg?format=webp

# Optimize
http://localhost:3003/avatars/user.jpg?quality=75
```

## Edge Functions

### Deploy a TypeScript Function

```bash
curl -X POST http://localhost:3000/functions/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "name": "send-email",
    "language": "typescript",
    "code": "export function handler(input) { console.log(\"Sending email to:\", input.to); return { sent: true }; }",
    "handler": "handler"
  }'
```

### Deploy a Python Function

```bash
curl -X POST http://localhost:3000/functions/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "name": "analyze-sentiment",
    "language": "python",
    "code": "def handler(input):\n    text = input[\"text\"]\n    # Use ML library\n    return {\"sentiment\": \"positive\", \"score\": 0.85}",
    "handler": "handler"
  }'
```

### Invoke a Function

```bash
curl -X POST http://localhost:3000/functions/v1/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "subject": "Welcome!",
    "body": "Thanks for signing up"
  }'
```

## Webhooks

### Register a Webhook

```bash
curl -X POST http://localhost:3000/webhooks/v1/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "post-created",
    "table": "posts",
    "events": ["INSERT"],
    "url": "https://your-app.com/webhook/post-created"
  }'
```

Now whenever a post is created, your webhook URL will receive:

```json
{
  "event": "INSERT",
  "table": "posts",
  "new": {
    "id": "post_2",
    "title": "New Post",
    ...
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Row-Level Security

Protect your data with RLS policies:

```sql
-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own posts
CREATE POLICY "users_see_own_posts"
  ON posts FOR SELECT
  USING (author_id = current_user_id());

-- Users can create posts
CREATE POLICY "users_create_posts"
  ON posts FOR INSERT
  WITH CHECK (author_id = current_user_id());
```

## Admin Dashboard

Visit `http://localhost:3004` to access:

- **Database Browser** - View and edit tables
- **User Management** - Manage users and roles
- **Storage Browser** - Browse uploaded files
- **Function Editor** - Deploy and test functions
- **SQL Editor** - Run queries with syntax highlighting
- **Logs** - View system logs
- **Statistics** - Monitor performance

## Next Steps

- [Authentication Guide](./auth.md)
- [Storage Guide](./storage.md)
- [Edge Functions Guide](./functions.md)
- [API Reference](./api.md)
- [Deployment Guide](./deployment.md)

## Need Help?

- Check the [Documentation](../README.md)
- Review [Example Projects](./examples/)
- Open an [Issue](https://github.com/elide-dev/elide-showcases/issues)

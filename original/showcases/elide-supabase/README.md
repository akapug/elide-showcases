# ElideSupabase

**Open-source Firebase/Supabase alternative with polyglot edge functions**

All backend services in one self-hosted binary, powered by Elide.

## Features

- **Database** - PostgreSQL or SQLite with automatic migrations
- **Auto-generated REST API** - CRUD endpoints for all tables
- **Real-time Subscriptions** - WebSocket-based database subscriptions
- **GraphQL API** - Auto-generated from database schema
- **Authentication** - Email/password, magic links, OAuth (Google, GitHub)
- **File Storage** - S3-compatible with built-in CDN
- **Edge Functions** - Serverless functions in TypeScript, Python, Ruby, Java, Kotlin
- **Database Webhooks** - Trigger HTTP calls or functions on database events
- **Row-Level Security** - PostgreSQL-style RLS policies
- **Admin Dashboard** - Web-based management interface
- **SQL Editor** - Interactive query editor

## Quick Start

```bash
# Run ElideSupabase
elide serve main.ts

# Or with custom config
elide serve main.ts config.yaml
```

## Configuration

Create a `config.yaml`:

```yaml
database:
  type: postgresql  # or sqlite
  host: localhost
  port: 5432
  database: myapp
  username: postgres
  password: secret

api:
  host: 0.0.0.0
  port: 3000

auth:
  jwt:
    secret: your-secret-key
  providers:
    email:
      enabled: true
    magicLink:
      enabled: true
    google:
      enabled: true
      clientId: your-client-id
      clientSecret: your-client-secret

storage:
  provider: s3  # or local, gcs
  basePath: ./data/storage

functions:
  languages:
    - typescript
    - python
    - ruby
    - java
    - kotlin
```

## API Examples

### REST API

```bash
# List users
curl http://localhost:3000/api/v1/users

# Get user
curl http://localhost:3000/api/v1/users/123

# Create user
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","name":"John"}'

# Filter and sort
curl "http://localhost:3000/api/v1/users?age[gte]=18&order=created_at.desc&limit=10"
```

### Authentication

```javascript
// Register
const { user, session } = await fetch('/auth/register', {
  method: 'POST',
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
}).then(r => r.json());

// Login
const { session } = await fetch('/auth/login', {
  method: 'POST',
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
}).then(r => r.json());

// Use token
const data = await fetch('/api/v1/protected', {
  headers: {
    'Authorization': `Bearer ${session.token}`
  }
}).then(r => r.json());
```

### Real-time Subscriptions

```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.onopen = () => {
  // Subscribe to user changes
  ws.send(JSON.stringify({
    type: 'subscribe',
    table: 'users',
    events: ['INSERT', 'UPDATE', 'DELETE']
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Database change:', message);
};
```

### File Storage

```javascript
// Upload file
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const { data } = await fetch('/storage/v1/object/avatars/user.jpg', {
  method: 'POST',
  body: formData,
  headers: {
    'Authorization': `Bearer ${token}`
  }
}).then(r => r.json());

// Download file
const fileUrl = 'http://localhost:3003/avatars/user.jpg';

// Transform image
const thumbnail = 'http://localhost:3003/avatars/user.jpg?width=200&height=200';
```

### Edge Functions

Deploy a function:

```bash
# TypeScript function
curl -X POST http://localhost:3000/functions/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "name": "hello-world",
    "language": "typescript",
    "code": "export function handler(input) { return { message: `Hello ${input.name}!` }; }",
    "handler": "handler"
  }'

# Python function (polyglot!)
curl -X POST http://localhost:3000/functions/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ml-predict",
    "language": "python",
    "code": "def handler(input):\n    import tensorflow as tf\n    # ML prediction logic\n    return {\"prediction\": 0.95}",
    "handler": "handler"
  }'
```

Invoke a function:

```bash
curl -X POST http://localhost:3000/functions/v1/hello-world \
  -H "Content-Type: application/json" \
  -d '{"name":"World"}'
```

### Webhooks

```bash
# Register webhook
curl -X POST http://localhost:3000/webhooks/v1/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "user-created",
    "table": "users",
    "events": ["INSERT"],
    "url": "https://example.com/webhook"
  }'

# Or call an edge function
curl -X POST http://localhost:3000/webhooks/v1/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "user-created",
    "table": "users",
    "events": ["INSERT"],
    "functionId": "fn_123"
  }'
```

## Polyglot Edge Functions

ElideSupabase leverages Elide's polyglot capabilities to run edge functions in multiple languages:

### TypeScript/JavaScript

```typescript
export function handler(input: any) {
  return {
    message: 'Hello from TypeScript!',
    timestamp: Date.now()
  };
}
```

### Python

```python
def handler(input):
    # Use Python libraries like pandas, numpy, tensorflow
    import pandas as pd
    df = pd.DataFrame(input.data)
    return {
        'mean': df['value'].mean(),
        'std': df['value'].std()
    }
```

### Ruby

```ruby
def handler(input)
  {
    message: "Hello from Ruby!",
    upcase: input[:name].upcase
  }
end
```

### Java

```java
public class Handler {
  public Map<String, Object> handler(Map<String, Object> input) {
    Map<String, Object> result = new HashMap<>();
    result.put("message", "Hello from Java!");
    result.put("processed", true);
    return result;
  }
}
```

### Kotlin

```kotlin
fun handler(input: Map<String, Any>): Map<String, Any> {
    return mapOf(
        "message" to "Hello from Kotlin!",
        "name" to input["name"]
    )
}
```

## Row-Level Security

Define policies for fine-grained access control:

```sql
-- Enable RLS on table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own posts
CREATE POLICY "Users see own posts"
  ON posts FOR SELECT
  USING (user_id = current_user_id());

-- Users can only insert their own posts
CREATE POLICY "Users insert own posts"
  ON posts FOR INSERT
  WITH CHECK (user_id = current_user_id());

-- Admins can see all posts
CREATE POLICY "Admins see all"
  ON posts FOR ALL
  TO admin
  USING (true);
```

## Admin Dashboard

Access the admin dashboard at `http://localhost:3004`

Features:
- Database browser
- User management
- Storage browser
- Function editor
- SQL editor
- Real-time logs
- System statistics

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      ElideSupabase                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ REST API │  │ GraphQL  │  │Real-time │  │Dashboard │  │
│  │  :3000   │  │  :3002   │  │  :3001   │  │  :3004   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │             │              │             │         │
│  ┌────┴─────────────┴──────────────┴─────────────┴─────┐  │
│  │              Core Services Layer                     │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │  │
│  │  │   Auth   │  │ Storage  │  │Functions │          │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘          │  │
│  │       │             │              │                 │  │
│  │  ┌────┴─────────────┴──────────────┴─────┐          │  │
│  │  │         Database Manager              │          │  │
│  │  │  ┌──────────┐  ┌──────────┐          │          │  │
│  │  │  │PostgreSQL│  │  SQLite  │          │          │  │
│  │  │  └──────────┘  └──────────┘          │          │  │
│  │  └───────────────────────────────────────┘          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Polyglot Runtime (Elide)                │  │
│  │  TypeScript │ Python │ Ruby │ Java │ Kotlin         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Why ElideSupabase?

**Self-hosted**: Complete control over your data and infrastructure

**All-in-one**: Database, API, auth, storage, functions - everything in one binary

**Polyglot**: Write edge functions in your preferred language

**Fast**: Native performance with GraalVM

**Batteries included**: Admin dashboard, SQL editor, real-time, webhooks

**Compatible**: PostgreSQL for production, SQLite for development

**Secure**: Row-level security, JWT auth, encrypted storage

## Comparison

| Feature | ElideSupabase | Supabase | Firebase |
|---------|---------------|----------|----------|
| Self-hosted | ✅ Single binary | ⚠️ Docker Compose | ❌ Cloud only |
| Database | PostgreSQL/SQLite | PostgreSQL | Firestore |
| Edge Functions | 5 languages | TypeScript | JavaScript |
| Real-time | ✅ | ✅ | ✅ |
| Auth | ✅ Multiple providers | ✅ | ✅ |
| Storage | ✅ S3/Local/GCS | ✅ S3 | ✅ GCS |
| Admin UI | ✅ Built-in | ✅ | ✅ |
| GraphQL | ✅ Auto-generated | ✅ | ❌ |

## License

MIT

## Contributing

Contributions welcome! This is a showcase project demonstrating Elide's capabilities.

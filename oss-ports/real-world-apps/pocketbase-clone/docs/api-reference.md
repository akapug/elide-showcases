# API Reference

Complete API documentation for Elide PocketBase Clone.

## Base URL

```
http://localhost:8090/api
```

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Response Format

### Success Response

```json
{
  "id": "RECORD_ID",
  "created": "2024-01-01T00:00:00.000Z",
  "updated": "2024-01-01T00:00:00.000Z",
  "field1": "value1",
  "field2": "value2"
}
```

### List Response

```json
{
  "page": 1,
  "perPage": 20,
  "totalItems": 100,
  "totalPages": 5,
  "items": [
    {
      "id": "RECORD_ID",
      "created": "2024-01-01T00:00:00.000Z",
      "updated": "2024-01-01T00:00:00.000Z",
      "field1": "value1"
    }
  ]
}
```

### Error Response

```json
{
  "error": "Error message"
}
```

## Collections API

### List Collections

Get all collections.

**Endpoint**: `GET /api/collections`

**Auth**: Admin required

**Response**:
```json
[
  {
    "id": "COLLECTION_ID",
    "name": "posts",
    "type": "base",
    "system": false,
    "schema": [...],
    "listRule": "auth.id != null",
    "viewRule": "",
    "createRule": "auth.id != null",
    "updateRule": "auth.id = record.userId",
    "deleteRule": "auth.id = record.userId",
    "created": "2024-01-01T00:00:00.000Z",
    "updated": "2024-01-01T00:00:00.000Z"
  }
]
```

### Get Collection

Get a single collection by name.

**Endpoint**: `GET /api/collections/{name}`

**Auth**: Admin required

**Response**: Collection object

### Create Collection

Create a new collection.

**Endpoint**: `POST /api/collections`

**Auth**: Admin required

**Body**:
```json
{
  "name": "posts",
  "type": "base",
  "schema": [
    {
      "name": "title",
      "type": "text",
      "required": true,
      "options": {
        "min": 3,
        "max": 200
      }
    },
    {
      "name": "content",
      "type": "text"
    }
  ],
  "listRule": "",
  "viewRule": "",
  "createRule": "auth.id != null",
  "updateRule": "auth.id = record.userId",
  "deleteRule": "auth.id = record.userId"
}
```

**Response**: Created collection object

### Update Collection

Update an existing collection.

**Endpoint**: `PATCH /api/collections/{name}`

**Auth**: Admin required

**Body**: Partial collection object

**Response**: Updated collection object

### Delete Collection

Delete a collection.

**Endpoint**: `DELETE /api/collections/{name}`

**Auth**: Admin required

**Response**:
```json
{
  "success": true
}
```

## Records API

### List Records

List records with pagination, filtering, and sorting.

**Endpoint**: `GET /api/records/{collection}`

**Auth**: Depends on collection rules

**Query Parameters**:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| page | number | Page number (default: 1) | `?page=2` |
| perPage | number | Items per page (default: 30, max: 500) | `?perPage=50` |
| sort | string | Sort fields (prefix with `-` for DESC) | `?sort=-created,title` |
| filter | string | Filter expression | `?filter=published=true` |
| expand | string | Expand relations | `?expand=author,category` |
| fields | string | Select specific fields | `?fields=id,title,created` |

**Filter Syntax**:
```
field=value              Equal
field!=value             Not equal
field>value              Greater than
field<value              Less than
field>=value             Greater than or equal
field<=value             Less than or equal
field~'pattern'          LIKE (contains)
condition1&&condition2   AND
```

**Examples**:
```
# Get published posts
GET /api/records/posts?filter=published=true

# Get posts by specific author
GET /api/records/posts?filter=author='USER_ID'

# Get posts with title containing "hello"
GET /api/records/posts?filter=title~'hello'

# Multiple conditions
GET /api/records/posts?filter=published=true&&created>'2024-01-01'

# Sort by created date descending
GET /api/records/posts?sort=-created

# Expand author relation
GET /api/records/posts?expand=author

# Select specific fields
GET /api/records/posts?fields=id,title,created
```

**Response**: List response with pagination

### Get Record

Get a single record by ID.

**Endpoint**: `GET /api/records/{collection}/{id}`

**Auth**: Depends on collection rules

**Query Parameters**:
- `expand`: Expand relations (comma-separated)

**Response**: Record object

### Create Record

Create a new record.

**Endpoint**: `POST /api/records/{collection}`

**Auth**: Depends on collection rules

**Content-Type**:
- `application/json` for regular fields
- `multipart/form-data` for file uploads

**Body**:
```json
{
  "title": "My Post",
  "content": "Post content here",
  "published": true,
  "author": "USER_ID"
}
```

**Response**: Created record object (201)

### Update Record

Update an existing record.

**Endpoint**: `PATCH /api/records/{collection}/{id}`

**Auth**: Depends on collection rules

**Body**: Partial record object

**Response**: Updated record object

### Delete Record

Delete a record.

**Endpoint**: `DELETE /api/records/{collection}/{id}`

**Auth**: Depends on collection rules

**Response**:
```json
{
  "success": true
}
```

### Search Records

Full-text search (if FTS is enabled).

**Endpoint**: `GET /api/records/{collection}/search`

**Query Parameters**:
- `q`: Search query
- `page`, `perPage`, `sort`: Same as list

**Example**:
```
GET /api/records/posts/search?q=javascript tutorial
```

**Response**: List response with search results

## Authentication API

### Register

Register a new user in an auth collection.

**Endpoint**: `POST /api/collections/{collection}/register`

**Auth**: None

**Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "passwordConfirm": "password123",
  "username": "username",
  "name": "Full Name"
}
```

**Response**:
```json
{
  "token": "JWT_TOKEN",
  "record": {
    "id": "USER_ID",
    "email": "user@example.com",
    "username": "username",
    "name": "Full Name",
    "verified": false,
    "created": "2024-01-01T00:00:00.000Z",
    "updated": "2024-01-01T00:00:00.000Z"
  }
}
```

### Login with Password

Authenticate with email/username and password.

**Endpoint**: `POST /api/collections/{collection}/auth-with-password`

**Auth**: None

**Body**:
```json
{
  "identity": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "token": "JWT_TOKEN",
  "record": {
    "id": "USER_ID",
    "email": "user@example.com",
    "verified": true,
    "created": "2024-01-01T00:00:00.000Z",
    "updated": "2024-01-01T00:00:00.000Z"
  }
}
```

### Refresh Token

Refresh authentication token.

**Endpoint**: `POST /api/collections/{collection}/auth-refresh`

**Auth**: Required (current token)

**Response**:
```json
{
  "token": "NEW_JWT_TOKEN",
  "record": { ... }
}
```

### Request Password Reset

Request a password reset email.

**Endpoint**: `POST /api/collections/{collection}/request-password-reset`

**Auth**: None

**Body**:
```json
{
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "success": true
}
```

### Confirm Password Reset

Confirm password reset with token.

**Endpoint**: `POST /api/collections/{collection}/confirm-password-reset`

**Auth**: None

**Body**:
```json
{
  "token": "RESET_TOKEN",
  "password": "newpassword123",
  "passwordConfirm": "newpassword123"
}
```

**Response**:
```json
{
  "success": true
}
```

### Request Email Verification

Request email verification.

**Endpoint**: `POST /api/collections/{collection}/request-verification`

**Auth**: None

**Body**:
```json
{
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "success": true
}
```

### Confirm Email Verification

Confirm email with verification token.

**Endpoint**: `POST /api/collections/{collection}/confirm-verification`

**Auth**: None

**Body**:
```json
{
  "token": "VERIFICATION_TOKEN"
}
```

**Response**:
```json
{
  "success": true
}
```

### List OAuth2 Providers

Get available OAuth2 providers.

**Endpoint**: `GET /api/collections/{collection}/auth-methods`

**Auth**: None

**Response**:
```json
{
  "emailPassword": true,
  "authProviders": [
    {
      "name": "google",
      "clientId": "...",
      "authUrl": "https://accounts.google.com/o/oauth2/v2/auth"
    },
    {
      "name": "github",
      "clientId": "...",
      "authUrl": "https://github.com/login/oauth/authorize"
    }
  ]
}
```

### OAuth2 Redirect

Redirect to OAuth2 provider.

**Endpoint**: `GET /api/collections/{collection}/auth-with-oauth2`

**Query Parameters**:
- `provider`: Provider name (google, github, etc.)
- `redirect`: Redirect URL after auth

### OAuth2 Callback

Handle OAuth2 callback.

**Endpoint**: `POST /api/collections/{collection}/auth-with-oauth2`

**Body**:
```json
{
  "provider": "google",
  "code": "AUTH_CODE",
  "codeVerifier": "CODE_VERIFIER",
  "redirectUrl": "http://localhost:3000/callback"
}
```

**Response**: Auth response with token and user

## Admin API

### Admin Login

Authenticate as admin.

**Endpoint**: `POST /api/admins/auth-with-password`

**Auth**: None

**Body**:
```json
{
  "identity": "admin@example.com",
  "password": "adminpassword"
}
```

**Response**:
```json
{
  "token": "ADMIN_JWT_TOKEN",
  "record": {
    "id": "ADMIN_ID",
    "email": "admin@example.com",
    "avatar": 0,
    "created": "2024-01-01T00:00:00.000Z",
    "updated": "2024-01-01T00:00:00.000Z"
  }
}
```

## Real-time API

### Connect to Real-time

Establish SSE connection for real-time updates.

**Endpoint**: `GET /api/realtime`

**Auth**: Optional (for authenticated subscriptions)

**Headers**:
```
Accept: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
Authorization: Bearer TOKEN (optional)
```

**Response**: SSE stream

**Event Types**:

#### Connected
```json
{
  "type": "connected",
  "clientId": "CLIENT_ID",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Record Event
```json
{
  "action": "create|update|delete",
  "collection": "posts",
  "record": {
    "id": "RECORD_ID",
    ...
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Heartbeat
```json
{
  "type": "heartbeat",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Client Example**:
```javascript
const eventSource = new EventSource('http://localhost:8090/api/realtime');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'connected') {
    console.log('Connected:', data.clientId);
  }

  if (data.action) {
    console.log(`${data.action} in ${data.collection}:`, data.record);
  }
};

eventSource.onerror = (error) => {
  console.error('SSE error:', error);
};
```

## Files API

### Upload File

Upload a file (handled via record create/update).

**Endpoint**: `POST /api/records/{collection}`

**Auth**: Depends on collection rules

**Content-Type**: `multipart/form-data`

**Form Data**:
```
title: "Post with Image"
content: "Content here"
image: (file)
```

**Response**: Record with file field containing filename

### Get File

Get an uploaded file.

**Endpoint**: `GET /api/files/{collection}/{recordId}/{fieldName}/{filename}`

**Auth**: Depends on field protection settings

**Response**: File content with appropriate Content-Type

**Example**:
```
GET /api/files/posts/RECORD_ID/image/abc123.jpg
```

### Get Thumbnail

Get image thumbnail (if field has thumbs).

**Endpoint**: `GET /api/files/{collection}/{recordId}/{fieldName}/thumbs_{size}/{filename}_{size}.ext`

**Example**:
```
GET /api/files/posts/RECORD_ID/image/thumbs_200x200/abc123_200x200.jpg
```

## Batch Operations

### Batch Create

Create multiple records at once.

**Endpoint**: `POST /api/records/{collection}/batch`

**Auth**: Depends on collection rules

**Body**:
```json
{
  "records": [
    { "title": "Post 1", "content": "Content 1" },
    { "title": "Post 2", "content": "Content 2" },
    { "title": "Post 3", "content": "Content 3" }
  ]
}
```

**Response**: Array of created records

### Batch Update

Update multiple records at once.

**Endpoint**: `PATCH /api/records/{collection}/batch`

**Auth**: Depends on collection rules

**Body**:
```json
{
  "updates": [
    { "id": "ID1", "data": { "published": true } },
    { "id": "ID2", "data": { "published": true } },
    { "id": "ID3", "data": { "published": false } }
  ]
}
```

**Response**: Array of updated records

### Batch Delete

Delete multiple records at once.

**Endpoint**: `DELETE /api/records/{collection}/batch`

**Auth**: Depends on collection rules

**Body**:
```json
{
  "ids": ["ID1", "ID2", "ID3"]
}
```

**Response**:
```json
{
  "success": true,
  "deleted": 3
}
```

## Health & Info

### Health Check

Check if server is running.

**Endpoint**: `GET /api`

**Auth**: None

**Response**:
```json
{
  "name": "Elide PocketBase Clone",
  "version": "1.0.0",
  "status": "ok"
}
```

### Server Info

Get server information (admin only).

**Endpoint**: `GET /api/info`

**Auth**: Admin required

**Response**:
```json
{
  "collections": 5,
  "realtime": {
    "subscriptions": 10,
    "clients": 3
  },
  "hooks": {
    "hooks": 5,
    "endpoints": 2
  },
  "migrations": {
    "total": 10,
    "applied": 8,
    "pending": 2
  }
}
```

## Rate Limiting

API rate limits (default):
- Unauthenticated: 100 requests/minute
- Authenticated: 1000 requests/minute
- Admin: Unlimited

**Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

**Rate Limit Response** (429):
```json
{
  "error": "Rate limit exceeded. Try again in 60 seconds."
}
```

## Error Codes

| Status Code | Meaning |
|-------------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

## Client Libraries

### JavaScript/TypeScript

```bash
npm install pocketbase
```

```javascript
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://localhost:8090');

// Authenticate
await pb.collection('users').authWithPassword('email@example.com', 'password');

// Create record
const record = await pb.collection('posts').create({
  title: 'Hello World',
  content: 'My first post'
});

// List records
const result = await pb.collection('posts').getList(1, 20, {
  filter: 'published = true',
  sort: '-created',
});

// Real-time
pb.collection('posts').subscribe('*', (e) => {
  console.log(e.action, e.record);
});
```

### Python (Example)

```python
import requests

class PocketBase:
    def __init__(self, url):
        self.url = url
        self.token = None

    def auth(self, email, password):
        response = requests.post(
            f'{self.url}/api/collections/users/auth-with-password',
            json={'identity': email, 'password': password}
        )
        data = response.json()
        self.token = data['token']
        return data

    def create(self, collection, data):
        response = requests.post(
            f'{self.url}/api/records/{collection}',
            json=data,
            headers={'Authorization': f'Bearer {self.token}'}
        )
        return response.json()

    def list(self, collection, **params):
        response = requests.get(
            f'{self.url}/api/records/{collection}',
            params=params,
            headers={'Authorization': f'Bearer {self.token}'}
        )
        return response.json()
```

## Webhooks

Configure webhooks to receive notifications:

```javascript
// In hooks.js
export const hooks = {
  'after-create': {
    posts: async (context) => {
      await fetch('https://your-webhook-url.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'post.created',
          record: context.record
        })
      });
    }
  }
};
```

## Best Practices

1. **Always use HTTPS in production**
2. **Implement proper error handling**
3. **Use pagination for large datasets**
4. **Cache responses when appropriate**
5. **Validate input data**
6. **Use appropriate HTTP methods**
7. **Handle rate limits gracefully**
8. **Keep authentication tokens secure**
9. **Use filters and indexes for better performance**
10. **Monitor API usage and errors**

## Support

- 📖 [Full Documentation](../README.md)
- 💬 [GitHub Discussions](https://github.com/elide/pocketbase-clone/discussions)
- 🐛 [Report Issues](https://github.com/elide/pocketbase-clone/issues)

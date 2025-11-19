# API Documentation

Complete reference for the Ghost Clone REST API.

## Overview

Ghost Clone provides two APIs:

1. **Content API** - Public, read-only access to published content
2. **Admin API** - Protected, full CRUD access for content management

## Base URLs

- Content API: `http://localhost:3000/api/v1`
- Admin API: `http://localhost:3000/api/admin`

## Authentication

### Admin API Authentication

All Admin API requests require authentication using JWT tokens.

**Login**
```http
POST /api/admin/session
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password"
}
```

**Response**
```json
{
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "a1b2c3..."
}
```

**Using the token**
```http
GET /api/admin/posts
Authorization: Bearer eyJhbGc...
```

**Refresh token**
```http
POST /api/admin/refresh
Content-Type: application/json

{
  "refreshToken": "a1b2c3..."
}
```

## Content API (Public)

### Posts

**List Posts**
```http
GET /api/v1/posts?page=1&limit=15&filter=featured:true&include=tags,author
```

Query Parameters:
- `page` (number) - Page number, default: 1
- `limit` (number) - Posts per page, default: 15, max: 50
- `filter` (string) - Filter posts (featured:true, tag:slug)
- `include` (string) - Include related data (tags, author)
- `order` (string) - Sort order, default: published_at DESC

Response:
```json
{
  "posts": [
    {
      "id": 1,
      "uuid": "abc-123",
      "title": "Welcome Post",
      "slug": "welcome",
      "html": "<p>Content...</p>",
      "feature_image": "/content/images/2024/01/image.jpg",
      "featured": false,
      "published_at": "2024-01-15T10:00:00Z",
      "custom_excerpt": "Welcome to the blog",
      "tags": [
        {"id": 1, "name": "Getting Started", "slug": "getting-started"}
      ],
      "author": {
        "name": "Admin User",
        "slug": "admin-user",
        "profile_image": null
      },
      "url": "/welcome"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 15,
      "pages": 2,
      "total": 25
    }
  }
}
```

**Get Single Post**
```http
GET /api/v1/posts/:slug?include=tags,author
```

Response:
```json
{
  "post": {
    "id": 1,
    "title": "Welcome Post",
    "slug": "welcome",
    "html": "<p>Content...</p>",
    "tags": [...],
    "author": {...}
  }
}
```

**Get Related Posts**
```http
GET /api/v1/posts/:id/related?limit=3
```

### Pages

**List Pages**
```http
GET /api/v1/pages
```

**Get Single Page**
```http
GET /api/v1/pages/:slug
```

### Tags

**List Tags**
```http
GET /api/v1/tags?limit=50&order=name ASC
```

**Get Single Tag**
```http
GET /api/v1/tags/:slug
```

### Authors

**List Authors**
```http
GET /api/v1/authors
```

**Get Single Author**
```http
GET /api/v1/authors/:slug
```

### Settings

**Get Public Settings**
```http
GET /api/v1/settings
```

Response:
```json
{
  "settings": {
    "title": "My Blog",
    "description": "A modern blog",
    "logo": "/content/images/logo.png",
    "navigation": [
      {"label": "Home", "url": "/"},
      {"label": "About", "url": "/about"}
    ]
  }
}
```

## Admin API (Protected)

All Admin API endpoints require authentication.

### Posts

**List Posts**
```http
GET /api/admin/posts?page=1&status=draft&author=user-slug&tag=tag-slug
Authorization: Bearer <token>
```

**Get Post**
```http
GET /api/admin/posts/:id
Authorization: Bearer <token>
```

**Create Post**
```http
POST /api/admin/posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "My New Post",
  "markdown": "# Hello\n\nThis is my post content.",
  "slug": "my-new-post",
  "status": "draft",
  "featured": false,
  "tags": ["technology", "elide"],
  "custom_excerpt": "A brief excerpt",
  "meta_title": "SEO Title",
  "meta_description": "SEO description",
  "og_image": "/images/og-image.jpg"
}
```

**Update Post**
```http
PUT /api/admin/posts/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "status": "published"
}
```

**Delete Post**
```http
DELETE /api/admin/posts/:id
Authorization: Bearer <token>
```

**Publish Post**
```http
PUT /api/admin/posts/:id/publish
Authorization: Bearer <token>
```

**Unpublish Post**
```http
PUT /api/admin/posts/:id/unpublish
Authorization: Bearer <token>
```

### Pages

Same as Posts, but use `/api/admin/pages` endpoint.

### Tags

**List Tags**
```http
GET /api/admin/tags
Authorization: Bearer <token>
```

**Create Tag**
```http
POST /api/admin/tags
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Technology",
  "slug": "technology",
  "description": "Posts about technology",
  "meta_description": "Tech articles"
}
```

**Update Tag**
```http
PUT /api/admin/tags/:id
Authorization: Bearer <token>
```

**Delete Tag**
```http
DELETE /api/admin/tags/:id
Authorization: Bearer <token>
```

### Media

**Upload Image**
```http
POST /api/admin/media/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary-data>
```

Response:
```json
{
  "image": {
    "id": 1,
    "url": "/content/images/2024/01/abc123.jpg",
    "thumbnailUrl": "/content/images/2024/01/abc123_thumbnail.jpg",
    "filename": "my-image.jpg",
    "size": 245632,
    "width": 1920,
    "height": 1080,
    "type": "image/jpeg"
  }
}
```

**List Media**
```http
GET /api/admin/media?page=1&limit=20&type=image
Authorization: Bearer <token>
```

**Delete Media**
```http
DELETE /api/admin/media/:id
Authorization: Bearer <token>
```

### Users

**List Users**
```http
GET /api/admin/users
Authorization: Bearer <token>
```

**Get User**
```http
GET /api/admin/users/:id
Authorization: Bearer <token>
```

**Create User**
```http
POST /api/admin/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123",
  "role": "author"
}
```

**Update User**
```http
PUT /api/admin/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Smith",
  "bio": "Writer and developer"
}
```

**Delete User**
```http
DELETE /api/admin/users/:id
Authorization: Bearer <token>
```

### Settings

**Get All Settings**
```http
GET /api/admin/settings
Authorization: Bearer <token>
```

**Update Settings**
```http
PUT /api/admin/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "My Awesome Blog",
  "description": "A blog about tech",
  "posts_per_page": 10,
  "navigation": [
    {"label": "Home", "url": "/"},
    {"label": "About", "url": "/about"}
  ]
}
```

### Analytics

**Get Dashboard**
```http
GET /api/admin/analytics/dashboard?days=30
Authorization: Bearer <token>
```

Response:
```json
{
  "summary": {
    "totalViews": 1234,
    "uniqueVisitors": 567,
    "period": "30 days"
  },
  "topPosts": [
    {
      "id": 1,
      "title": "Popular Post",
      "slug": "popular-post",
      "views": 456
    }
  ],
  "viewsOverTime": [
    {"date": "2024-01-01", "views": 45},
    {"date": "2024-01-02", "views": 52}
  ],
  "topReferrers": [
    {"referer": "https://twitter.com", "views": 123}
  ]
}
```

**Get Post Analytics**
```http
GET /api/admin/analytics/posts/:id?days=30
Authorization: Bearer <token>
```

### Webhooks

**List Webhooks**
```http
GET /api/admin/webhooks
Authorization: Bearer <token>
```

**Create Webhook**
```http
POST /api/admin/webhooks
Authorization: Bearer <token>
Content-Type: application/json

{
  "event": "post.published",
  "target_url": "https://api.example.com/webhook",
  "name": "Notify on Publish",
  "secret": "webhook-secret"
}
```

**Delete Webhook**
```http
DELETE /api/admin/webhooks/:id
Authorization: Bearer <token>
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

- `UNAUTHORIZED` (401) - Missing or invalid auth token
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `VALIDATION_ERROR` (400) - Invalid request data
- `INTERNAL_ERROR` (500) - Server error

### Status Codes

- `200` - Success
- `201` - Created
- `204` - No Content (successful deletion)
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

The API implements rate limiting:
- **Content API**: 100 requests/minute per IP
- **Admin API**: 60 requests/minute per user

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642348800
```

## Webhooks

Webhook events available:
- `post.published`
- `post.unpublished`
- `post.deleted`
- `page.published`
- `page.deleted`
- `user.created`
- `user.deleted`

Webhook payload:
```json
{
  "event": "post.published",
  "timestamp": "2024-01-15T10:00:00Z",
  "data": {
    "post": {
      "id": 1,
      "title": "New Post",
      "slug": "new-post"
    }
  }
}
```

Headers sent:
- `X-Webhook-Event`: Event name
- `X-Webhook-Signature`: HMAC-SHA256 signature

## Examples

### JavaScript/Node.js

```javascript
const API_URL = 'http://localhost:3000/api';
let token = null;

// Login
async function login() {
  const response = await fetch(`${API_URL}/admin/session`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      email: 'admin@example.com',
      password: 'password'
    })
  });
  const data = await response.json();
  token = data.accessToken;
}

// Create post
async function createPost() {
  const response = await fetch(`${API_URL}/admin/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'My Post',
      markdown: '# Hello World',
      status: 'draft'
    })
  });
  return response.json();
}
```

### Python

```python
import requests

API_URL = 'http://localhost:3000/api'

# Login
response = requests.post(f'{API_URL}/admin/session', json={
    'email': 'admin@example.com',
    'password': 'password'
})
token = response.json()['accessToken']

# Get posts
headers = {'Authorization': f'Bearer {token}'}
posts = requests.get(f'{API_URL}/admin/posts', headers=headers).json()
```

### curl

```bash
# Login
TOKEN=$(curl -X POST http://localhost:3000/api/admin/session \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  | jq -r '.accessToken')

# Create post
curl -X POST http://localhost:3000/api/admin/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "My Post",
    "markdown": "# Hello",
    "status": "draft"
  }'
```

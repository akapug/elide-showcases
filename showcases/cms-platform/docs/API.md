# CMS Platform API Documentation

Complete API reference for the CMS Platform REST API.

## Base URL

```
http://localhost:3000/api
```

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### POST /auth/login

Login and obtain access token.

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "username": "admin",
    "email": "admin@cms.local",
    "role": "admin",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastLogin": "2024-01-15T10:30:00.000Z"
  }
}
```

**Errors:**
- `400`: Missing username or password
- `401`: Invalid credentials

---

### POST /auth/logout

Logout and invalidate token.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

### GET /auth/validate

Validate current session and get user info.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "user": {
    "id": "user-123",
    "username": "admin",
    "email": "admin@cms.local",
    "role": "admin"
  }
}
```

**Errors:**
- `401`: Invalid or expired token

---

## Articles

### GET /articles

Get list of articles with filtering and pagination.

**Query Parameters:**
- `status` (optional): Filter by status (draft, review, published)
- `category` (optional): Filter by category ID
- `author` (optional): Filter by author ID
- `search` (optional): Search query
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sortBy` (optional): Sort field (createdAt, updatedAt, publishedAt, views)
- `sortOrder` (optional): Sort order (asc, desc)

**Response (200):**
```json
{
  "articles": [
    {
      "id": "article-123",
      "title": "Getting Started with CMS",
      "slug": "getting-started-with-cms",
      "excerpt": "Learn how to use the CMS platform",
      "status": "published",
      "author": {
        "id": "user-123",
        "username": "admin"
      },
      "categories": [
        {
          "id": "cat-1",
          "name": "Tutorials",
          "slug": "tutorials"
        }
      ],
      "tags": ["tutorial", "beginner"],
      "featuredImage": "/media/image-123.jpg",
      "publishedAt": "2024-01-15T10:00:00.000Z",
      "createdAt": "2024-01-14T12:00:00.000Z",
      "updatedAt": "2024-01-15T09:30:00.000Z",
      "views": 1234,
      "metadata": {
        "readingTime": 5,
        "wordCount": 1000
      }
    }
  ],
  "total": 42,
  "page": 1,
  "pages": 3
}
```

---

### GET /articles/:id

Get single article by ID.

**Response (200):**
```json
{
  "id": "article-123",
  "title": "Getting Started with CMS",
  "slug": "getting-started-with-cms",
  "content": "# Introduction\n\nThis is the article content...",
  "contentHtml": "<h1>Introduction</h1><p>This is the article content...</p>",
  "excerpt": "Learn how to use the CMS platform",
  "status": "published",
  "authorId": "user-123",
  "categories": ["cat-1"],
  "tags": ["tutorial", "beginner"],
  "featuredImage": "/media/image-123.jpg",
  "metadata": {
    "seoTitle": "Getting Started with CMS Platform",
    "seoDescription": "Complete guide to using the CMS",
    "readingTime": 5,
    "wordCount": 1000
  },
  "publishedAt": "2024-01-15T10:00:00.000Z",
  "createdAt": "2024-01-14T12:00:00.000Z",
  "updatedAt": "2024-01-15T09:30:00.000Z",
  "views": 1234,
  "version": 3,
  "comments": []
}
```

**Errors:**
- `404`: Article not found

---

### POST /articles

Create new article.

**Headers:**
```
Authorization: Bearer <token>
```

**Required Permissions:** author, editor, admin

**Request:**
```json
{
  "title": "New Article",
  "content": "# Content\n\nArticle content here...",
  "excerpt": "Brief description",
  "categories": ["cat-1"],
  "tags": ["tag1", "tag2"],
  "featuredImage": "/media/image-456.jpg"
}
```

**Response (201):**
```json
{
  "id": "article-456",
  "title": "New Article",
  "slug": "new-article",
  "content": "# Content\n\nArticle content here...",
  "status": "draft",
  "createdAt": "2024-01-16T10:00:00.000Z",
  ...
}
```

**Errors:**
- `400`: Missing required fields
- `401`: Authentication required
- `403`: Insufficient permissions

---

### PUT /articles/:id

Update existing article.

**Headers:**
```
Authorization: Bearer <token>
```

**Required Permissions:** Owner (author) or editor/admin

**Request:**
```json
{
  "title": "Updated Title",
  "content": "Updated content...",
  "excerpt": "Updated excerpt",
  "categories": ["cat-1", "cat-2"],
  "tags": ["tag1", "tag2", "tag3"]
}
```

**Response (200):**
```json
{
  "id": "article-456",
  "title": "Updated Title",
  "updatedAt": "2024-01-16T11:00:00.000Z",
  "version": 2,
  ...
}
```

**Errors:**
- `400`: Invalid data
- `401`: Authentication required
- `403`: Insufficient permissions
- `404`: Article not found

---

### DELETE /articles/:id

Delete article.

**Headers:**
```
Authorization: Bearer <token>
```

**Required Permissions:** editor, admin

**Response (204):**
No content

**Errors:**
- `401`: Authentication required
- `403`: Insufficient permissions
- `404`: Article not found

---

### PATCH /articles/:id/status

Change article status in publishing workflow.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "status": "published"
}
```

**Allowed Transitions:**
- `draft` → `review` (author)
- `review` → `published` (editor/admin)
- `review` → `draft` (editor/admin)
- `published` → `draft` (admin)

**Response (200):**
```json
{
  "id": "article-456",
  "status": "published",
  "publishedAt": "2024-01-16T12:00:00.000Z",
  ...
}
```

---

## Categories

### GET /categories

Get all categories.

**Response (200):**
```json
[
  {
    "id": "cat-1",
    "name": "Tutorials",
    "slug": "tutorials",
    "description": "Tutorial articles",
    "parentId": null,
    "articleCount": 15,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": "cat-2",
    "name": "Advanced",
    "slug": "advanced",
    "description": "Advanced topics",
    "parentId": "cat-1",
    "articleCount": 8,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### POST /categories

Create new category.

**Headers:**
```
Authorization: Bearer <token>
```

**Required Permissions:** editor, admin

**Request:**
```json
{
  "name": "New Category",
  "description": "Category description",
  "parentId": "cat-1"
}
```

**Response (201):**
```json
{
  "id": "cat-3",
  "name": "New Category",
  "slug": "new-category",
  "description": "Category description",
  "parentId": "cat-1",
  "articleCount": 0,
  "createdAt": "2024-01-16T12:00:00.000Z"
}
```

---

## Comments

### GET /comments

Get comments with optional filtering.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): Filter by status (pending, approved, spam)
- `articleId` (optional): Filter by article

**Response (200):**
```json
[
  {
    "id": "comment-123",
    "articleId": "article-456",
    "author": "John Doe",
    "email": "john@example.com",
    "content": "Great article!",
    "status": "approved",
    "createdAt": "2024-01-16T10:00:00.000Z",
    "parentId": null
  }
]
```

---

### PATCH /comments/:id/status

Update comment status (moderation).

**Headers:**
```
Authorization: Bearer <token>
```

**Required Permissions:** editor, admin

**Request:**
```json
{
  "status": "approved"
}
```

**Response (200):**
```json
{
  "id": "comment-123",
  "status": "approved",
  ...
}
```

---

## Media

### GET /media

Get media items.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `folder` (optional): Filter by folder path

**Response (200):**
```json
[
  {
    "id": "media-123",
    "filename": "image-2024-01-16.jpg",
    "originalName": "my-photo.jpg",
    "mimeType": "image/jpeg",
    "size": 2048576,
    "path": "/uploads/images/image-2024-01-16.jpg",
    "url": "/media/images/image-2024-01-16.jpg",
    "alt": "Photo description",
    "caption": "Photo caption",
    "metadata": {
      "width": 1920,
      "height": 1080,
      "thumbnailUrl": "/media/thumbnails/image-2024-01-16-thumb.jpg",
      "variants": [
        {
          "name": "small",
          "width": 640,
          "height": 480,
          "url": "/media/variants/image-2024-01-16-small.jpg"
        }
      ]
    },
    "uploadedBy": {
      "id": "user-123",
      "username": "admin"
    },
    "uploadedAt": "2024-01-16T10:00:00.000Z",
    "folder": "images"
  }
]
```

---

### POST /media/upload

Upload media file.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: File to upload (required)
- `alt`: Alt text (optional)
- `caption`: Caption (optional)
- `folder`: Folder path (optional)

**Response (201):**
```json
{
  "id": "media-456",
  "filename": "image-2024-01-16-abc123.jpg",
  "url": "/media/images/image-2024-01-16-abc123.jpg",
  "mimeType": "image/jpeg",
  "size": 2048576,
  ...
}
```

**Errors:**
- `400`: Invalid file or exceeds size limit
- `401`: Authentication required
- `415`: Unsupported media type

---

### PATCH /media/:id

Update media metadata.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "alt": "Updated description",
  "caption": "Updated caption",
  "folder": "new-folder"
}
```

**Response (200):**
```json
{
  "id": "media-456",
  "alt": "Updated description",
  "caption": "Updated caption",
  ...
}
```

---

### DELETE /media/:id

Delete media item.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (204):**
No content

**Errors:**
- `401`: Authentication required
- `404`: Media not found

---

### GET /media/folders

Get folder structure.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "folder-1",
    "name": "Images",
    "path": "images",
    "parentId": null,
    "itemCount": 25,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### POST /media/folders

Create new folder.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "name": "New Folder",
  "parent": "images"
}
```

**Response (201):**
```json
{
  "id": "folder-5",
  "name": "New Folder",
  "path": "images/new-folder",
  "itemCount": 0
}
```

---

## Search

### GET /search

Search content across articles and media.

**Query Parameters:**
- `q`: Search query (required)
- `type` (optional): Filter by type (article, media)
- `limit` (optional): Max results (default: 10)

**Response (200):**
```json
{
  "query": "python programming",
  "total": 5,
  "articles": [
    {
      "id": "article-123",
      "title": "Python Programming Guide",
      "excerpt": "Learn Python...",
      "score": 0.85,
      "highlights": [
        "...Learn Python programming basics...",
        "...Python is a versatile language..."
      ]
    }
  ],
  "media": []
}
```

---

## Users

### GET /users

Get all users (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Required Permissions:** admin

**Response (200):**
```json
[
  {
    "id": "user-123",
    "username": "admin",
    "email": "admin@cms.local",
    "role": "admin",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastLogin": "2024-01-16T10:00:00.000Z"
  }
]
```

---

### POST /users

Create new user (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Required Permissions:** admin

**Request:**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "securepassword",
  "role": "author"
}
```

**Response (201):**
```json
{
  "id": "user-456",
  "username": "newuser",
  "email": "newuser@example.com",
  "role": "author",
  "createdAt": "2024-01-16T12:00:00.000Z"
}
```

---

### PUT /users/:id

Update user (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Required Permissions:** admin

**Request:**
```json
{
  "email": "updated@example.com",
  "role": "editor"
}
```

**Response (200):**
```json
{
  "id": "user-456",
  "email": "updated@example.com",
  "role": "editor",
  ...
}
```

---

### DELETE /users/:id

Delete user (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Required Permissions:** admin

**Response (204):**
No content

---

## Dashboard

### GET /dashboard/stats

Get dashboard statistics.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "totalArticles": 42,
  "publishedArticles": 35,
  "draftArticles": 7,
  "totalViews": 12543,
  "totalComments": 156,
  "pendingComments": 8,
  "totalUsers": 15,
  "recentArticles": [...],
  "popularArticles": [...]
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `204 No Content`: Request succeeded with no response body
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required or failed
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `415 Unsupported Media Type`: Invalid file type
- `500 Internal Server Error`: Server error

---

## Rate Limiting

Currently not implemented. Future versions may include:
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

## Versioning

Current API version: `v1`

Future versions will be accessible via: `/api/v2/...`

## Support

For API questions or issues, refer to the main documentation or create an issue in the repository.

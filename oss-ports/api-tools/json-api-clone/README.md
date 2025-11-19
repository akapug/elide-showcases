# JSON:API Clone - Elide Port

A complete JSON:API specification implementation in Elide with resource routing, relationships, filtering, sorting, and pagination.

## Features

- **JSON:API Spec**: Full JSON:API 1.1 compliance
- **Resource Routing**: RESTful resource endpoints
- **Relationships**: Included resources and relationship links
- **Filtering**: Advanced query filtering
- **Sorting**: Multi-field sorting
- **Pagination**: Cursor and offset pagination
- **Sparse Fieldsets**: Field selection
- **Error Handling**: Spec-compliant error format
- **TypeScript Types**: Full type safety

## Installation

```bash
elide install json-api-clone
```

## Quick Start

```typescript
import { createJSONAPIServer } from './server/jsonapi-server'
import { defineResource } from './resources/resource'

// Define resources
const userResource = defineResource({
  type: 'users',
  attributes: ['name', 'email', 'createdAt'],
  relationships: {
    posts: { type: 'posts', many: true }
  },
  async findAll(query) {
    return db.users.findMany()
  },
  async findOne(id) {
    return db.users.findById(id)
  },
  async create(data) {
    return db.users.create(data)
  },
  async update(id, data) {
    return db.users.update(id, data)
  },
  async delete(id) {
    return db.users.delete(id)
  }
})

const postResource = defineResource({
  type: 'posts',
  attributes: ['title', 'content', 'published', 'createdAt'],
  relationships: {
    author: { type: 'users', many: false }
  },
  async findAll(query) {
    return db.posts.findMany()
  }
})

// Create server
const server = createJSONAPIServer({
  resources: [userResource, postResource],
  baseURL: 'http://localhost:3000'
})

server.listen(3000)
```

## JSON:API Format

### Resource Object

```json
{
  "data": {
    "type": "users",
    "id": "1",
    "attributes": {
      "name": "Alice",
      "email": "alice@example.com",
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "relationships": {
      "posts": {
        "links": {
          "self": "http://localhost:3000/users/1/relationships/posts",
          "related": "http://localhost:3000/users/1/posts"
        },
        "data": [
          { "type": "posts", "id": "1" },
          { "type": "posts", "id": "2" }
        ]
      }
    },
    "links": {
      "self": "http://localhost:3000/users/1"
    }
  },
  "included": [
    {
      "type": "posts",
      "id": "1",
      "attributes": {
        "title": "First Post",
        "content": "Hello World"
      }
    }
  ]
}
```

### Collection

```json
{
  "data": [
    {
      "type": "users",
      "id": "1",
      "attributes": {
        "name": "Alice"
      }
    },
    {
      "type": "users",
      "id": "2",
      "attributes": {
        "name": "Bob"
      }
    }
  ],
  "meta": {
    "total": 100
  },
  "links": {
    "self": "http://localhost:3000/users?page[number]=1",
    "first": "http://localhost:3000/users?page[number]=1",
    "last": "http://localhost:3000/users?page[number]=10",
    "prev": null,
    "next": "http://localhost:3000/users?page[number]=2"
  }
}
```

## Filtering

```typescript
// GET /users?filter[name]=Alice
// GET /users?filter[email][like]=@example.com
// GET /users?filter[createdAt][gte]=2024-01-01

const userResource = defineResource({
  type: 'users',
  filters: {
    name: (query, value) => query.where('name', value),
    email: {
      like: (query, value) => query.where('email', 'like', `%${value}%`),
      eq: (query, value) => query.where('email', value)
    },
    createdAt: {
      gte: (query, value) => query.where('createdAt', '>=', value),
      lte: (query, value) => query.where('createdAt', '<=', value)
    }
  }
})
```

## Sorting

```typescript
// GET /users?sort=name
// GET /users?sort=-createdAt
// GET /users?sort=name,-createdAt

const userResource = defineResource({
  type: 'users',
  sortable: ['name', 'email', 'createdAt']
})
```

## Pagination

```typescript
// Offset-based
// GET /users?page[number]=2&page[size]=10

// Cursor-based
// GET /users?page[after]=cursor123&page[size]=10

const userResource = defineResource({
  type: 'users',
  pagination: {
    type: 'offset', // or 'cursor'
    defaultSize: 10,
    maxSize: 100
  }
})
```

## Sparse Fieldsets

```typescript
// GET /users?fields[users]=name,email
// GET /users?include=posts&fields[posts]=title

// Response only includes specified fields
{
  "data": {
    "type": "users",
    "id": "1",
    "attributes": {
      "name": "Alice",
      "email": "alice@example.com"
    }
  }
}
```

## Included Resources

```typescript
// GET /users/1?include=posts
// GET /users/1?include=posts.comments
// GET /users?include=posts,profile

{
  "data": {
    "type": "users",
    "id": "1",
    "relationships": {
      "posts": {
        "data": [{ "type": "posts", "id": "1" }]
      }
    }
  },
  "included": [
    {
      "type": "posts",
      "id": "1",
      "attributes": {
        "title": "Post Title"
      }
    }
  ]
}
```

## Creating Resources

```typescript
// POST /users
// Content-Type: application/vnd.api+json

{
  "data": {
    "type": "users",
    "attributes": {
      "name": "Charlie",
      "email": "charlie@example.com"
    },
    "relationships": {
      "posts": {
        "data": [
          { "type": "posts", "id": "1" }
        ]
      }
    }
  }
}

// Response
// Status: 201 Created
// Location: http://localhost:3000/users/3

{
  "data": {
    "type": "users",
    "id": "3",
    "attributes": {
      "name": "Charlie",
      "email": "charlie@example.com"
    }
  }
}
```

## Updating Resources

```typescript
// PATCH /users/1
// Content-Type: application/vnd.api+json

{
  "data": {
    "type": "users",
    "id": "1",
    "attributes": {
      "name": "Alice Updated"
    }
  }
}
```

## Deleting Resources

```typescript
// DELETE /users/1
// Response: 204 No Content
```

## Relationship Management

```typescript
// GET /users/1/relationships/posts
{
  "links": {
    "self": "http://localhost:3000/users/1/relationships/posts",
    "related": "http://localhost:3000/users/1/posts"
  },
  "data": [
    { "type": "posts", "id": "1" },
    { "type": "posts", "id": "2" }
  ]
}

// POST /users/1/relationships/posts (add)
// PATCH /users/1/relationships/posts (replace)
// DELETE /users/1/relationships/posts (remove)
```

## Error Handling

```json
{
  "errors": [
    {
      "status": "400",
      "code": "VALIDATION_ERROR",
      "title": "Validation Error",
      "detail": "Email is required",
      "source": {
        "pointer": "/data/attributes/email"
      }
    }
  ]
}
```

## License

MIT

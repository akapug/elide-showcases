# Ghost Clone - Architecture Overview

## System Architecture

Ghost Clone is built with a modern, modular architecture that leverages Elide's polyglot capabilities and native HTTP support.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
├──────────────────────┬──────────────────────────────────────┤
│   Web Browser        │      Admin Dashboard (React)         │
│   (Visitors)         │      (Content Managers)              │
└──────────────────────┴──────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      HTTP Server (Elide)                     │
├──────────────────────┬──────────────────┬───────────────────┤
│  Static Assets       │   Theme Engine   │    API Layer      │
│  (nginx/CDN)         │   (Handlebars)   │   (REST)          │
└──────────────────────┴──────────────────┴───────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
├──────────┬──────────┬──────────┬──────────┬────────────────┤
│  Auth    │ Content  │  Admin   │  Media   │   Analytics    │
│ Service  │   API    │   API    │ Service  │    Service     │
└──────────┴──────────┴──────────┴──────────┴────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Data Layer                            │
├──────────────────────┬──────────────────────────────────────┤
│  Database Manager    │        Cache Manager                 │
│  (SQLite)           │        (In-Memory)                    │
└──────────────────────┴──────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Polyglot Integration                      │
├──────────────────────┬──────────────────────────────────────┤
│  Python (Pillow)     │      Future: Ruby, R, Java, etc.     │
│  Image Processing    │      (Extensible)                     │
└──────────────────────┴──────────────────────────────────────┘
```

## Component Details

### 1. HTTP Server Layer

**Technology**: Elide Native HTTP

The HTTP server is built using Elide's native HTTP capabilities, providing:
- High performance (10,000+ req/s)
- Low memory footprint
- Built-in routing
- Middleware support
- Static file serving

**Key Features**:
- Request/response handling
- Middleware pipeline (logging, CORS, analytics)
- Route matching and parameters
- Static asset serving
- Error handling

### 2. Theme Engine

**Technology**: Handlebars

The theme engine renders dynamic HTML pages using Handlebars templates.

**Components**:
- Template loader
- Partial support
- Helper functions (date, excerpt, url, etc.)
- Template caching
- Context injection

**Flow**:
```
Request → Route Match → Load Template → Fetch Data → Render → Response
```

### 3. API Layer

#### Content API (Public)
- Read-only access to published content
- No authentication required
- Supports filtering, pagination, includes
- Rate limited (100 req/min per IP)

#### Admin API (Protected)
- Full CRUD operations
- JWT authentication required
- Role-based permissions
- Rate limited (60 req/min per user)

### 4. Application Services

#### Authentication Service
- User login/logout
- JWT token generation
- Token verification
- Password reset flow
- Session management

#### Content API Service
- Post retrieval and filtering
- Tag/author aggregation
- Related post suggestions
- Settings management
- Public data formatting

#### Admin API Service
- Post/page CRUD
- Tag management
- User management
- Settings updates
- Permission checking

#### Media Service (Polyglot)
- File upload handling
- Image validation
- **Python integration** for image processing:
  - Resizing
  - Thumbnail generation
  - Format conversion
  - Optimization
- Storage management

#### Analytics Service
- Event tracking
- View counting
- Dashboard metrics
- Report generation
- Data retention

#### Webhook Manager
- Event subscription
- HTTP POST triggering
- HMAC signature generation
- Retry logic
- Error tracking

### 5. Data Layer

#### Database Manager
**Technology**: SQLite with WAL mode

**Features**:
- Transaction support
- Migration system
- Query builder
- CRUD helpers
- Connection pooling (future)

**Tables**:
```
users ──┬─── posts ───┬─── posts_tags
        │             │
        └─── pages    │
                      │
tags ─────────────────┘

settings
images
sessions
password_reset_tokens
webhooks
analytics_events
migrations
```

#### Cache Manager
**Technology**: In-memory Map with TTL

**Features**:
- Key-value storage
- TTL expiration
- Pattern-based invalidation
- Size limits
- Statistics

### 6. Frontend (Admin Dashboard)

**Technology**: React + Vite

**Structure**:
```
admin/
├── src/
│   ├── main.jsx          # Entry point
│   ├── components/       # React components
│   ├── pages/           # Route pages
│   ├── hooks/           # Custom hooks
│   ├── services/        # API clients
│   └── utils/           # Utilities
└── dist/                # Build output
```

## Data Flow

### 1. Publishing a Post

```
Admin UI
  └─→ POST /api/admin/posts (+ auth token)
      └─→ AdminAPI.createPost()
          ├─→ Validate input
          ├─→ Slugify title
          ├─→ Convert markdown → HTML
          ├─→ Create post in DB
          ├─→ Associate tags
          └─→ Trigger webhooks
              └─→ Return created post
```

### 2. Viewing a Post

```
Browser
  └─→ GET /my-post
      └─→ ThemeRenderer.renderPost()
          ├─→ Check cache
          │   └─→ Return if found
          ├─→ Query database
          │   ├─→ Get post by slug
          │   ├─→ Get post tags
          │   └─→ Get author info
          ├─→ Load template (post.hbs)
          ├─→ Render with Handlebars
          ├─→ Cache result
          ├─→ Track analytics
          └─→ Return HTML
```

### 3. Uploading an Image

```
Admin UI (multipart/form-data)
  └─→ POST /api/admin/media/upload (+ auth token)
      └─→ MediaService.upload()
          ├─→ Validate file type & size
          ├─→ Generate unique filename
          ├─→ Save original to disk
          ├─→ Python integration:
          │   ├─→ Get image dimensions
          │   ├─→ Generate thumbnails
          │   └─→ Optimize quality
          ├─→ Save metadata to DB
          └─→ Return image URLs
```

## Security Architecture

### Authentication Flow

```
1. Login
   User → POST /api/admin/session
        → Verify credentials (bcrypt)
        → Generate JWT access token (15min)
        → Generate refresh token (30d)
        → Store refresh token in sessions table
        → Return tokens

2. Authenticated Request
   User → GET /api/admin/posts
        → Extract Bearer token from header
        → Verify JWT signature
        → Check expiration
        → Extract user info
        → Check permissions
        → Process request

3. Token Refresh
   User → POST /api/admin/refresh
        → Verify refresh token in DB
        → Generate new access token
        → Return new token
```

### Authorization

**Role Hierarchy**:
```
Admin > Editor > Author > Contributor
```

**Permissions**:
- Contributor: Create drafts
- Author: Publish own posts
- Editor: Publish/edit all posts
- Admin: Full system access

## Performance Optimizations

### 1. Caching Strategy

```
┌─────────────────────────────────────┐
│         Request Arrives              │
└──────────────┬──────────────────────┘
               │
               ▼
      ┌────────────────┐
      │  Cache Check?  │
      └───┬────────┬───┘
          │ Hit    │ Miss
          ▼        ▼
    ┌─────────┐  ┌──────────────┐
    │ Return  │  │ Query DB     │
    │ Cached  │  │ Render Page  │
    └─────────┘  │ Cache Result │
                 │ Return       │
                 └──────────────┘
```

**Cache Keys**:
- `page:/` - Homepage
- `page:/my-post` - Individual posts
- `page:/tag/tech` - Tag archives
- `api:posts:page:1` - API responses

**Cache Invalidation**:
- Post published → Clear homepage, tag archives
- Post updated → Clear post page
- Settings changed → Clear all
- Manual: Pattern-based (e.g., `page:*`)

### 2. Database Optimizations

**Indexes**:
- Posts: status, slug, author_id, published_at
- Tags: slug
- Post-tags: post_id, tag_id
- Analytics: type, post_id, created_at

**Query Optimization**:
- Use prepared statements
- Join only when needed
- Limit result sets
- Count queries separate from data queries

### 3. Image Optimization

**Pipeline**:
```
Upload → Validate → Save Original → Python Process:
                                    ├─→ Extract metadata
                                    ├─→ Generate thumbnail (150x150)
                                    ├─→ Generate small (400x400)
                                    ├─→ Generate medium (800x800)
                                    ├─→ Generate large (1200x1200)
                                    └─→ Optimize quality (85%)
```

**Serving**:
- Original for full display
- Large for featured images
- Medium for post content
- Small for cards
- Thumbnail for listings

## Scalability Considerations

### Horizontal Scaling

**Current**: Single instance

**Future**:
1. **Load Balancer** (nginx)
   ```
   ┌──────┐
   │ LB   │
   └──┬───┘
      ├─→ Instance 1
      ├─→ Instance 2
      └─→ Instance 3
   ```

2. **Shared Database**
   - Move to PostgreSQL/MySQL
   - Connection pooling
   - Read replicas

3. **Distributed Cache**
   - Redis/Memcached
   - Shared across instances

4. **Distributed Storage**
   - S3 for media
   - CDN for delivery

### Vertical Scaling

**Current Limits**:
- SQLite: Good for < 100K posts
- In-memory cache: Limited by RAM
- Single process

**Improvements**:
- Connection pooling
- Worker threads for images
- Async I/O for uploads

## Monitoring & Observability

### Metrics to Track

**Application**:
- Request rate (req/s)
- Response time (ms)
- Error rate (%)
- Cache hit ratio (%)

**System**:
- CPU usage (%)
- Memory usage (MB)
- Disk I/O (MB/s)
- Network I/O (MB/s)

**Business**:
- Posts published
- Active users
- Page views
- Popular content

### Logging Strategy

**Levels**:
- ERROR: Application errors
- WARN: Potential issues
- INFO: Important events
- DEBUG: Detailed info

**Structured Logging**:
```json
{
  "timestamp": "2024-01-15T10:00:00Z",
  "level": "INFO",
  "service": "api",
  "action": "post.create",
  "user": "admin@example.com",
  "duration": 45,
  "status": "success"
}
```

## Extensibility

### Plugin System (Future)

```
plugins/
├── analytics-enhanced/
│   ├── index.js
│   └── package.json
├── email-newsletter/
│   ├── index.js
│   └── package.json
└── seo-tools/
    ├── index.js
    └── package.json
```

### Webhook Integration

External services can integrate via webhooks:
```javascript
// External service receives
POST https://external.com/webhook
{
  "event": "post.published",
  "timestamp": "2024-01-15T10:00:00Z",
  "data": { ... }
}
```

### API-First Design

All functionality available via API enables:
- Custom admin UIs
- Mobile apps
- Desktop apps
- Headless CMS mode
- Third-party integrations

## Technology Stack

**Runtime**: Elide (GraalVM-based polyglot runtime)
**Languages**: JavaScript, Python, SQL, HTML, CSS
**Database**: SQLite (with potential for PostgreSQL)
**Templates**: Handlebars
**Admin**: React + Vite
**HTTP**: Elide Native HTTP
**Auth**: JWT (jsonwebtoken)
**Hashing**: bcrypt
**Markdown**: marked
**RSS**: rss
**Image**: PIL/Pillow (Python)

## Future Enhancements

1. **GraphQL API** - Alternative to REST
2. **Real-time** - WebSocket support for live updates
3. **Search** - Full-text search with Elasticsearch
4. **Multi-language** - i18n support
5. **Memberships** - Paid subscriptions
6. **Newsletters** - Email campaigns
7. **Collaborative Editing** - Multiple authors
8. **Version Control** - Post revisions
9. **A/B Testing** - Content experiments
10. **Advanced Analytics** - ML-powered insights

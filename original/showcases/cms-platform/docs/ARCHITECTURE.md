# CMS Platform Architecture

## Overview

The CMS Platform is designed as a polyglot microservices architecture, demonstrating how different languages can work together effectively in a content management system.

## System Components

### 1. Frontend Layer (TypeScript)

The admin dashboard provides the user interface for content management.

```
frontend/
├── admin-app.ts        # Main application & API client
├── article-editor.ts   # Rich markdown editor
└── media-library.ts    # Media management UI
```

**Responsibilities:**
- User authentication & session management
- Article creation & editing
- Media upload & organization
- Publishing workflow management
- Dashboard analytics

**Key Features:**
- JWT-based authentication
- Real-time markdown preview
- Auto-save functionality
- Drag-and-drop file uploads
- Responsive grid/list views

### 2. Backend API (TypeScript)

RESTful API server handling all business logic and data operations.

```
backend/
└── api-server.ts       # REST API with auth middleware
```

**Responsibilities:**
- Request routing
- Authentication & authorization
- User management
- Article CRUD operations
- Media file handling
- Comment moderation

**Architecture Patterns:**
- Middleware pipeline
- Role-based access control
- Session management
- Error handling

**Authentication Flow:**
```
Client Request
    ↓
API Server
    ↓
Auth Middleware → Validate JWT Token
    ↓
Role Middleware → Check Permissions
    ↓
Route Handler → Process Request
    ↓
Response
```

### 3. Content Management (TypeScript)

Core content management system with markdown processing.

```
content/
├── content-manager.ts  # Article management
└── markdown-engine.ts  # Markdown to HTML conversion
```

**Responsibilities:**
- Article lifecycle management
- Version control
- Category & tag management
- Markdown rendering
- Content sanitization

**Markdown Processing Pipeline:**
```
Raw Markdown
    ↓
Tokenize → Parse syntax elements
    ↓
Render → Convert to HTML
    ↓
Sanitize → Remove dangerous content
    ↓
Post-process → Add enhancements
    ↓
Safe HTML Output
```

**Features:**
- TF-IDF word importance
- Reading time calculation
- Automatic slug generation
- Version history (last 10)
- SEO metadata

### 4. Media Management (TypeScript)

File storage and processing system.

```
media/
└── media-manager.ts    # File upload & organization
```

**Responsibilities:**
- File upload handling
- Duplicate detection (SHA-256 hash)
- Folder organization
- Image processing
- Metadata extraction

**Upload Flow:**
```
File Upload
    ↓
Validate → Type, size, format
    ↓
Hash → Calculate SHA-256
    ↓
Check Duplicate → Compare with existing
    ↓
Generate Filename → Unique name with timestamp
    ↓
Process → Thumbnails, variants
    ↓
Store → Save to filesystem
    ↓
Index → Add to database
    ↓
Return URL
```

**Supported Formats:**
- Images: JPEG, PNG, GIF, WebP, SVG
- Videos: MP4, WebM
- Audio: MP3, WAV, OGG
- Documents: PDF

### 5. Search Service (Python)

Full-text search indexing with TF-IDF ranking.

```
search/
└── search_indexer.py   # Search & recommendations
```

**Responsibilities:**
- Document indexing
- Full-text search
- Relevance ranking (TF-IDF)
- Similar content suggestions
- Personalized recommendations
- Trending content tracking

**Search Architecture:**

```python
class SearchIndexer:
    - documents: Dict[id, Document]
    - inverted_index: Dict[term, Set[doc_ids]]
    - term_frequencies: Dict[doc_id, Dict[term, count]]
    - document_frequencies: Dict[term, doc_count]
```

**TF-IDF Formula:**
```
TF-IDF(term, doc) = TF(term, doc) × IDF(term)

where:
TF(term, doc) = frequency of term in document
IDF(term) = log((total_docs + 1) / (docs_with_term + 1))
```

**Search Flow:**
```
Query Input
    ↓
Tokenize → Split into terms
    ↓
Remove Stop Words → Filter common words
    ↓
Index Lookup → Find candidate documents
    ↓
Apply Filters → Status, category, author
    ↓
Calculate Scores → TF-IDF for each doc
    ↓
Rank Results → Sort by relevance
    ↓
Generate Highlights → Extract snippets
    ↓
Return Results
```

**Recommendation Engine:**
- Collaborative filtering (view history)
- Content-based (similar articles)
- Popularity-based (trending)

### 6. Background Workers (Ruby)

Asynchronous job processing for notifications.

```
workers/
└── notification_worker.rb  # Email notifications
```

**Responsibilities:**
- Email queue processing
- Publishing workflow notifications
- Comment notifications
- User mentions
- Digest emails

**Worker Architecture:**

```ruby
NotificationWorker
    ↓
Job Queue → FIFO queue
    ↓
Process Job → Build email template
    ↓
Send Email → Email service (SMTP/API)
    ↓
Handle Retry → Max 3 retries
    ↓
Update Stats → Track success/failure
```

**Job Types:**
- `article_published`: Author notification
- `article_review_request`: Reviewer notification
- `article_approved`: Author notification
- `article_rejected`: Author notification with notes
- `comment_notification`: Author notification
- `comment_approved`: Commenter notification
- `mention_notification`: Mentioned user notification
- `user_welcome`: Welcome email
- `digest`: Periodic content digest

**Retry Strategy:**
- Max 3 retry attempts
- Exponential backoff (simulated)
- Failed jobs logged for investigation

## Data Flow

### Article Publishing Workflow

```
Author Creates Draft
    ↓
[Draft Status]
    ↓
Author Submits for Review → Email to Reviewer
    ↓
[Review Status]
    ↓
Editor Reviews Article
    ↓
    ├─→ Approve → Email to Author → [Published Status]
    │                                     ↓
    │                              Index in Search Service
    │                                     ↓
    │                              Available to Readers
    │
    └─→ Reject → Email to Author with Notes
                        ↓
                 [Back to Draft Status]
```

### Media Upload Flow

```
User Selects File
    ↓
Frontend Validates (size, type)
    ↓
Upload to API
    ↓
Backend Validates
    ↓
Calculate Hash (SHA-256)
    ↓
Check Duplicate
    ↓
    ├─→ Duplicate Found → Return Existing URL
    │
    └─→ New File → Process Image
                        ↓
                   Generate Thumbnail
                        ↓
                   Generate Variants (S/M/L)
                        ↓
                   Store Files
                        ↓
                   Save Metadata
                        ↓
                   Return URLs
```

### Search Request Flow

```
User Enters Query
    ↓
Frontend sends to API
    ↓
API forwards to Search Service
    ↓
Python Search Service:
    - Tokenize query
    - Lookup inverted index
    - Calculate TF-IDF scores
    - Apply filters
    - Rank results
    - Generate highlights
    ↓
Return Results to API
    ↓
API returns to Frontend
    ↓
Display Results with Highlights
```

## Design Patterns

### 1. Singleton Pattern
- `contentManager`: Single instance for content operations
- `mediaManager`: Single instance for media operations
- `markdownEngine`: Single instance for markdown processing

### 2. Factory Pattern
- `NotificationBuilder`: Creates email templates based on type

### 3. Strategy Pattern
- `MarkdownEngine`: Pluggable renderers for different markdown elements

### 4. Middleware Pattern
- `requireAuth`: Authentication middleware
- `requireRole`: Authorization middleware

### 5. Observer Pattern
- Publishing workflow triggers notifications
- Comment creation triggers author notifications

## Security Architecture

### Authentication
```
User Login
    ↓
Verify Credentials → Hash password, compare
    ↓
Generate JWT Token → Include user ID, role, expiry
    ↓
Return Token
    ↓
Client Stores Token → localStorage
    ↓
Subsequent Requests → Include in Authorization header
    ↓
Server Validates Token → Verify signature, check expiry
    ↓
Attach User to Request → Available to route handlers
```

### Authorization
```
Authenticated Request
    ↓
Check User Role
    ↓
Check Required Permission
    ↓
    ├─→ Has Permission → Allow request
    │
    └─→ No Permission → Return 403 Forbidden
```

### Input Sanitization
- HTML entity encoding
- URL sanitization
- SQL injection prevention (parameterized queries)
- File upload validation

## Performance Considerations

### Caching Strategy
- In-memory document cache
- Search index in-memory for fast lookups
- Session cache with expiry

### Optimization
- Lazy loading for media
- Pagination for large lists
- Index-based search (O(log n) lookup)
- Duplicate detection via hashing

### Scalability
- Stateless API (horizontal scaling)
- Separate search service (independent scaling)
- Background job queue (asynchronous processing)
- CDN for media delivery (conceptual)

## Monitoring & Observability

### Metrics Collected
- API request counts
- Search query statistics
- Media storage usage
- Notification job success/failure rates
- Article view tracking
- Popular content metrics

### Logging
- API requests and responses
- Authentication attempts
- Publishing workflow events
- Background job execution
- Error tracking

## Technology Choices

### TypeScript
**Why:** Type safety, modern JavaScript features, excellent tooling
**Use Cases:** Frontend, API server, content management, media handling

### Python
**Why:** Excellent for data processing, scientific computing, natural language
**Use Cases:** Search indexing, TF-IDF calculations, recommendations

### Ruby
**Why:** Clean syntax, excellent for background jobs, mature ecosystem
**Use Cases:** Email notifications, scheduled tasks, async processing

## Future Enhancements

### Potential Improvements
1. **Database Integration**: PostgreSQL for persistent storage
2. **Caching Layer**: Redis for session and query caching
3. **CDN Integration**: CloudFront/Cloudflare for media delivery
4. **WebSocket Support**: Real-time collaboration features
5. **GraphQL API**: Alternative to REST API
6. **Elasticsearch**: Replace custom search with Elasticsearch
7. **Message Queue**: RabbitMQ/Redis for job queue
8. **Monitoring**: Prometheus + Grafana for metrics
9. **Logging**: ELK stack for centralized logging
10. **CI/CD**: Automated testing and deployment

### Scalability Roadmap
1. Horizontal API scaling with load balancer
2. Read replicas for database
3. Distributed search cluster
4. Multiple background workers
5. Microservices decomposition

## Conclusion

The CMS Platform demonstrates a modern, polyglot architecture that leverages the strengths of different programming languages and technologies. The modular design allows each component to be developed, tested, and scaled independently while maintaining clean interfaces between services.

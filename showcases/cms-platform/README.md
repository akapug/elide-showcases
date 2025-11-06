# CMS Platform

A comprehensive Content Management System built with TypeScript, Python, and Ruby, demonstrating polyglot architecture and modern web development practices.

## Features

### Content Management
- **Article Editor**: Rich markdown editor with live preview
- **Media Library**: Upload, organize, and manage media files
- **Publishing Workflow**: Draft → Review → Published with role-based permissions
- **Versioning**: Track content changes with version history
- **Categories & Tags**: Organize content with hierarchical categories and tags

### User Management
- **Role-Based Access**: Admin, Editor, and Author roles
- **Authentication**: Secure JWT-based authentication
- **Permission System**: Fine-grained access control

### Search & Discovery
- **Full-Text Search**: Python-based TF-IDF search indexing
- **Content Recommendations**: Personalized content suggestions
- **Similar Articles**: Find related content automatically
- **Trending Content**: Track popular articles

### Media Management
- **File Upload**: Support for images, videos, audio, and documents
- **Folder Organization**: Hierarchical folder structure
- **Image Processing**: Automatic thumbnail and variant generation
- **Duplicate Detection**: Hash-based duplicate file detection

### Notifications
- **Email Notifications**: Ruby-based background workers
- **Publishing Workflow**: Notify authors and reviewers
- **Comment System**: Notifications for new comments
- **User Mentions**: Alert users when mentioned in articles

## Architecture

```
cms-platform/
├── frontend/              # Admin dashboard (TypeScript)
│   ├── admin-app.ts       # Main application
│   ├── article-editor.ts  # Markdown editor
│   └── media-library.ts   # Media management
│
├── backend/               # API server (TypeScript)
│   └── api-server.ts      # REST API with authentication
│
├── content/               # Content management (TypeScript)
│   ├── content-manager.ts # Article management
│   └── markdown-engine.ts # Markdown processing
│
├── media/                 # File management (TypeScript)
│   └── media-manager.ts   # Media handling
│
├── search/                # Search service (Python)
│   └── search_indexer.py  # Full-text search & recommendations
│
├── workers/               # Background jobs (Ruby)
│   └── notification_worker.rb  # Email notifications
│
├── tests/                 # Test suite
│   ├── content-manager.test.ts
│   ├── search_test.py
│   └── run-tests.sh
│
└── docs/                  # Documentation
    ├── API.md
    └── ARCHITECTURE.md
```

## Technology Stack

### Frontend
- **TypeScript**: Type-safe admin interface
- **Markdown**: Rich content editing with marked library
- **HTML Entities**: XSS protection with entities/escape-html

### Backend
- **TypeScript**: REST API server
- **JWT**: Authentication tokens
- **Role-Based Access Control**: Permission system

### Search
- **Python**: Search indexing service
- **TF-IDF**: Relevance ranking algorithm
- **Recommendation Engine**: Content suggestions

### Workers
- **Ruby**: Background job processing
- **Email**: Notification system

## Getting Started

### Prerequisites

- Node.js 18+ (for TypeScript)
- Python 3.8+ (for search service)
- Ruby 3.0+ (for background workers)

### Installation

```bash
# Clone the repository
cd showcases/cms-platform

# Install TypeScript dependencies
npm install

# Install Python dependencies (if needed)
pip install -r requirements.txt

# Install Ruby dependencies (if needed)
bundle install
```

### Running the Application

#### Start the API Server

```bash
npm run start:api
```

The API server will start on `http://localhost:3000`.

#### Start the Search Service

```bash
python3 search/search_indexer.py
```

#### Start the Notification Worker

```bash
ruby workers/notification_worker.rb
```

### Running Tests

Run all tests:

```bash
chmod +x tests/run-tests.sh
./tests/run-tests.sh
```

Run specific test suites:

```bash
# TypeScript tests
npm test

# Python tests
python3 tests/search_test.py

# Ruby tests
ruby tests/notification_worker_test.rb
```

## API Documentation

### Authentication

```bash
# Login
POST /api/auth/login
{
  "username": "admin",
  "password": "admin123"
}

# Response
{
  "token": "jwt-token",
  "user": { ... }
}
```

### Articles

```bash
# Get articles
GET /api/articles?status=published&page=1&limit=20

# Get single article
GET /api/articles/:id

# Create article
POST /api/articles
{
  "title": "Article Title",
  "content": "# Markdown content",
  "excerpt": "Brief description",
  "categories": ["cat-id"],
  "tags": ["tag1", "tag2"]
}

# Update article
PUT /api/articles/:id

# Delete article
DELETE /api/articles/:id

# Change status
PATCH /api/articles/:id/status
{
  "status": "published"
}
```

### Media

```bash
# Get media items
GET /api/media?folder=images

# Upload media
POST /api/media/upload
Content-Type: multipart/form-data

# Update media
PATCH /api/media/:id
{
  "alt": "Image description",
  "caption": "Image caption"
}

# Delete media
DELETE /api/media/:id
```

### Search

```bash
# Search articles
GET /api/search?q=query&status=published&limit=10

# Get similar articles
GET /api/articles/:id/similar

# Get recommendations
GET /api/recommendations?user_id=user1
```

## Default Users

The system comes with three default users:

| Username | Password   | Role   |
|----------|-----------|--------|
| admin    | admin123  | admin  |
| editor   | editor123 | editor |
| author   | author123 | author |

## Publishing Workflow

1. **Draft**: Author creates article (status: draft)
2. **Review**: Author submits for review (status: review)
3. **Published**: Editor approves and publishes (status: published)

### Role Permissions

- **Admin**: Full access to all features
- **Editor**: Manage articles, media, moderate comments
- **Author**: Create and edit own articles, read-only media access

## Features Showcase

### Markdown Editor

The article editor provides:
- Live preview
- Syntax highlighting
- Auto-save
- Word count & reading time
- Media insertion
- Keyboard shortcuts

### Search Engine

Python-based search with:
- TF-IDF relevance scoring
- Filtered search (status, category, author)
- Result highlighting
- Similar article suggestions
- Personalized recommendations

### Media Library

Comprehensive media management:
- Drag-and-drop upload
- Folder organization
- File type validation
- Duplicate detection
- Image variants (small, medium, large)
- Thumbnail generation

### Notification System

Ruby workers handle:
- Publishing workflow emails
- Comment notifications
- User mentions
- Welcome emails
- Content digests

## Development

### Project Structure

- `frontend/`: Admin dashboard components
- `backend/`: API server and routing
- `content/`: Content management logic
- `media/`: File management system
- `search/`: Python search service
- `workers/`: Ruby background jobs
- `tests/`: Test suite
- `docs/`: Documentation

### Key Libraries

- **marked**: Markdown to HTML conversion
- **entities/escape-html**: XSS prevention
- **uuid**: Unique identifier generation (conceptual)

## Performance

- **Search**: O(log n) index lookup with TF-IDF scoring
- **Media**: Hash-based duplicate detection
- **Caching**: In-memory document cache
- **Versioning**: Automatic version history (last 10 versions)

## Security

- **Authentication**: JWT-based token authentication
- **Authorization**: Role-based access control
- **Input Validation**: All user input validated
- **XSS Prevention**: HTML entity encoding
- **SQL Injection**: Parameterized queries (when using DB)
- **File Upload**: Type and size validation

## Monitoring

The system provides:
- Search statistics
- Storage statistics
- Notification job status
- Article view tracking
- Popular content metrics

## License

Part of Elide Showcases - Polyglot CMS Platform Demo

## Contributing

This is a showcase project demonstrating polyglot architecture patterns.

## Support

For questions or issues, see the main Elide Showcases documentation.

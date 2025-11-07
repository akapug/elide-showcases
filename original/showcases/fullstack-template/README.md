# Full-Stack React + Vite + TypeScript Template

A modern, production-ready full-stack application template demonstrating web development on Elide.

## Overview

This template showcases a complete CRUD application with:

- **Frontend**: React + TypeScript + Vite with modern UI components
- **Backend**: TypeScript REST API with in-memory data store
- **Workers**: Python and Ruby background job processors (polyglot demonstration)
- **Testing**: Comprehensive API tests, component tests, and benchmarks

## Architecture

```
fullstack-template/
├── frontend/          # React + Vite frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── App.tsx      # Main application
│   │   ├── main.tsx     # Entry point
│   │   └── api.ts       # API client
│   ├── vite.config.ts
│   └── package.json
├── backend/           # TypeScript REST API
│   ├── routes/        # API route handlers
│   ├── db/            # Data models and store
│   ├── middleware/    # CORS and logging
│   └── server.ts      # HTTP server
├── workers/           # Background job processors
│   ├── background-jobs.py  # Python worker
│   └── email-sender.rb     # Ruby worker
├── tests/             # Test suites
│   ├── api-test.ts
│   ├── component-test.tsx
│   └── benchmark.ts
└── docs/              # Documentation
```

## Features

### Frontend Features

- **Modern React**: Function components with hooks
- **TypeScript**: Full type safety across the application
- **Vite**: Lightning-fast development and optimized builds
- **Component Library**: Reusable Dashboard, UserList, and UserForm components
- **Custom Hooks**: `useUsers` for state management
- **API Client**: Type-safe API integration layer
- **Form Validation**: Real-time validation with error feedback
- **Responsive Design**: Modern UI with gradient backgrounds and shadows

### Backend Features

- **RESTful API**: Complete CRUD operations for users
- **Authentication**: JWT-based authentication system (ready to use)
- **Validation**: Email, username, and password validation
- **CORS**: Full CORS support with configurable origins
- **Logging**: Request/response logging with metrics
- **Health Checks**: Multiple health endpoints for monitoring
- **UUID Generation**: Using `uuid` package for unique identifiers
- **In-Memory Store**: Fast data access with Map-based storage

### API Endpoints

#### Health Endpoints
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed metrics
- `GET /api/health/ready` - Readiness probe
- `GET /api/health/live` - Liveness probe

#### User Endpoints
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

#### Auth Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

## Getting Started

### Prerequisites

- Elide runtime
- Node.js (for package management)

### Installation

1. **Install frontend dependencies**:
```bash
cd frontend
npm install
```

2. **Install backend dependencies**:
```bash
cd backend
npm install
```

### Development

#### Option 1: Vite Development Server (if supported)

**Frontend**:
```bash
cd frontend
npm run dev
```

**Backend**:
```bash
cd backend
elide run server.ts
# or
node --loader ts-node/esm server.ts
```

Visit: `http://localhost:3000`

#### Option 2: Production Build + Backend

**Build frontend**:
```bash
cd frontend
npm run build
```

**Run backend** (serves both API and static files):
```bash
cd backend
elide run server.ts
```

Visit: `http://localhost:8080`

### Testing

**API Tests**:
```bash
cd tests
elide run api-test.ts
```

**Benchmarks**:
```bash
cd tests
elide run benchmark.ts
```

### Running Workers

**Python Worker**:
```bash
cd workers
elide run background-jobs.py
# or
python background-jobs.py
```

**Ruby Worker**:
```bash
cd workers
elide run email-sender.rb
# or
ruby email-sender.rb
```

## Demo Users

The application comes with two demo users:

- **Alice**: `alice@example.com` / password: `demo`
- **Bob**: `bob@example.com` / password: `demo`

## Technology Stack

### Frontend
- React 18
- TypeScript 5
- Vite 5
- CSS-in-JS (inline styles)

### Backend
- TypeScript 5
- Node.js / Bun runtime
- UUID v9
- In-memory data store

### Workers
- Python 3 (background jobs)
- Ruby (email sender)

## Performance

### Benchmarks

Run benchmarks to test performance:

```bash
cd tests
elide run benchmark.ts http://localhost:8080
```

Expected performance (on typical hardware):
- Health check: < 5ms
- User list retrieval: < 10ms
- User creation: < 15ms

## Development Features

### Hot Module Replacement

If using Vite dev server, HMR is enabled for instant updates during development.

### TypeScript

Full TypeScript support across frontend and backend with strict type checking.

### Code Organization

- **Separation of Concerns**: Routes, models, middleware separated
- **Type Safety**: Interfaces for all data structures
- **Reusable Components**: Modular React components
- **Custom Hooks**: Business logic separated from UI

## Production Considerations

### Security

- **CORS**: Configure allowed origins in production
- **Password Hashing**: Replace demo hasher with bcrypt/argon2
- **JWT**: Implement proper JWT signing and verification
- **Input Validation**: Already implemented for all endpoints
- **SQL Injection**: Not applicable (in-memory store)

### Scalability

- **Database**: Replace in-memory store with PostgreSQL/MongoDB
- **Caching**: Add Redis for session storage
- **Load Balancing**: Deploy multiple instances
- **CDN**: Serve static assets via CDN

### Monitoring

- **Health Checks**: Already implemented
- **Metrics**: Logger provides request statistics
- **Error Tracking**: Add Sentry or similar
- **Performance**: Built-in benchmarks

## Contributing

This is a showcase template. Feel free to use it as a starting point for your projects.

## License

MIT License - see LICENSE file for details

## Related Showcases

- `/showcases/base64` - Base64 encoding/decoding
- `/showcases/validator` - Email and URL validation
- `/showcases/uuid` - UUID generation examples

## Support

For Elide-specific questions, refer to the [Elide documentation](https://docs.elide.dev).

# Quick Start Guide

Get the Full-Stack Template running in under 5 minutes.

## Prerequisites

- Elide runtime installed
- Node.js (for npm)
- Git

## 1. Install Dependencies

```bash
# Frontend dependencies
cd frontend
npm install

# Backend dependencies
cd ../backend
npm install
```

## 2. Choose Your Mode

### Option A: Development Mode (Recommended for Development)

**Terminal 1 - Frontend (with Vite HMR)**:
```bash
cd frontend
npm run dev
```

**Terminal 2 - Backend API**:
```bash
cd backend
elide run server.ts
```

Open: http://localhost:3000

### Option B: Production Mode (Test Build)

```bash
# Build frontend
cd frontend
npm run build

# Start backend (serves API + static files)
cd ../backend
elide run server.ts
```

Open: http://localhost:8080

## 3. Test the Application

### Use the Web Interface

1. Visit the dashboard
2. Click "Users" to see the user list
3. Click "Create User" to add a new user
4. Try editing and deleting users

### Demo Users

Login credentials (if auth implemented):
- alice@example.com / demo
- bob@example.com / demo

### Test API Directly

```bash
# Health check
curl http://localhost:8080/api/health

# Get all users
curl http://localhost:8080/api/users

# Create a user
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

## 4. Run Workers (Optional)

### Python Background Jobs

```bash
cd workers
python background-jobs.py
```

Expected output:
- Job queue processing
- User registration jobs
- Data export jobs
- Analytics jobs

### Ruby Email Sender

```bash
cd workers
ruby email-sender.rb
```

Expected output:
- Welcome emails
- Password reset emails
- Notification emails

## 5. Run Tests (Optional)

### API Integration Tests

```bash
# Start the backend first
cd backend
elide run server.ts

# In another terminal
cd tests
elide run api-test.ts
```

### Benchmarks

```bash
cd tests
elide run benchmark.ts http://localhost:8080
```

## Common Commands

```bash
# Frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Backend
elide run server.ts  # Start backend server

# Workers
python background-jobs.py  # Run Python worker
ruby email-sender.rb       # Run Ruby worker

# Tests
elide run api-test.ts      # Run API tests
elide run benchmark.ts     # Run benchmarks
```

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 8080
lsof -i :8080
kill -9 <PID>

# Or use different port
PORT=3001 elide run server.ts
```

### Frontend Not Connecting to Backend

Check Vite proxy configuration in `frontend/vite.config.ts`:
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    },
  },
}
```

### Vite Not Working?

Use production build mode:
```bash
cd frontend && npm run build
cd ../backend && elide run server.ts
```

## What's Next?

- Read [README.md](./README.md) for full documentation
- Read [CASE_STUDY.md](./CASE_STUDY.md) for architecture details
- Read [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
- Check [TEST_REPORT.md](./TEST_REPORT.md) for test results

## Quick Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| / | GET | Frontend application |
| /api/health | GET | Health check |
| /api/users | GET | List all users |
| /api/users | POST | Create user |
| /api/users/:id | GET | Get user |
| /api/users/:id | PUT | Update user |
| /api/users/:id | DELETE | Delete user |
| /api/auth/login | POST | Login |
| /api/auth/me | GET | Current user |

---

**Enjoy building with Elide! 🚀**

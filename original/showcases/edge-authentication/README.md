# Edge Authentication Service

A comprehensive authentication system running at the edge, providing JWT verification, session management, rate limiting, bot detection, and geographic access control.

## Features

### JWT Verification
- HMAC-SHA256 signature verification
- Expiration checking
- Token generation with configurable TTL
- Base64URL encoding/decoding
- Secure key management

### Session Management
- Distributed session storage
- Session lifecycle management (create, retrieve, destroy)
- Per-user session limits (max 5 concurrent sessions)
- Automatic session expiration (24 hours)
- Activity tracking and session renewal
- Multi-device support

### Rate Limiting
- IP-based rate limiting
- Configurable limits (100 requests/minute default)
- Automatic blocking for limit violations
- Time-window based reset
- Bypass for authenticated users

### Bot Detection
- User-Agent analysis with pattern matching
- Header fingerprinting
- Request frequency analysis
- Bot scoring algorithm (0-100 scale)
- Automated blocking for high-score bots (>70)
- Known bot patterns (crawlers, scrapers, headless browsers)

### GeoIP Blocking
- Country-based access control
- Path-specific geographic rules
- Cloudflare integration
- Allowlist and blocklist support
- Custom rule configuration

## API Endpoints

### Authentication

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure-password"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "sessionId": "a1b2c3d4e5f6...",
  "user": {
    "id": "abc123",
    "email": "user@example.com",
    "role": "user"
  }
}
```

#### Logout
```
POST /auth/logout
X-Session-ID: <session-id>
```

Response:
```json
{
  "message": "Logged out successfully"
}
```

#### Verify Token
```
GET /auth/verify
Authorization: Bearer <jwt-token>
```

Response:
```json
{
  "valid": true,
  "user": {
    "id": "abc123",
    "email": "user@example.com",
    "role": "user"
  }
}
```

### Protected Routes

Any route not under `/auth/` requires authentication via either:
1. JWT token: `Authorization: Bearer <token>`
2. Session ID: `X-Session-ID: <session-id>`

Example:
```
GET /api/protected
Authorization: Bearer <token>
```

Response:
```json
{
  "message": "Access granted",
  "user": {
    "id": "abc123",
    "email": "user@example.com",
    "role": "user"
  }
}
```

## Security Features

### Rate Limiting Response
When rate limit is exceeded:
```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2024-01-01T12:05:00.000Z

Rate limit exceeded
```

### Bot Detection Response
When bot is detected (score > 70):
```
HTTP/1.1 403 Forbidden
X-Bot-Score: 85

Suspicious activity detected
```

### GeoIP Blocking Response
When access is blocked by geography:
```
HTTP/1.1 403 Forbidden

Access from CN blocked for /admin
```

## Configuration

### Environment Variables
```bash
JWT_SECRET=your-secret-key-change-in-production
```

### Rate Limiting
Modify in code:
- `maxRequests`: 100 (requests per window)
- `windowMs`: 60000 (1 minute)
- `blockDuration`: 300000 (5 minutes)

### Session Management
- `maxSessionAge`: 24 hours
- `maxSessionsPerUser`: 5 concurrent sessions

### GeoIP Rules
Example rule configuration:
```typescript
{
  type: "block",
  countries: ["CN", "RU", "KP"],
  paths: ["/admin", "/api/sensitive"]
}
```

## Architecture

### Component Interaction
1. Request arrives at edge
2. GeoIP filter checks location
3. Rate limiter verifies request count
4. Bot detector analyzes request patterns
5. JWT/Session verification for authentication
6. Request forwarded to protected resource

### Session Storage
- In-memory Map for edge deployment
- Per-user session tracking with Set
- Automatic cleanup every 5 minutes

### JWT Flow
1. User submits credentials
2. Server verifies (database check in production)
3. JWT generated with HMAC-SHA256
4. Session created and linked to user
5. Token and session ID returned
6. Client includes token in subsequent requests

## Bot Detection Algorithm

Scoring factors:
- Known bot user-agent patterns: +30 points
- Missing/suspicious user-agent: +25 points
- Missing Accept header: +15 points
- Missing Accept-Language: +10 points
- Repeated requests from IP: +20 points (max)
- Legitimate browser headers: -10 to -15 points

Thresholds:
- 0-30: Likely human
- 30-70: Suspicious, allow with monitoring
- 70-100: Likely bot, block

## Usage Example

```bash
# Start the service
JWT_SECRET=my-secret-key deno run --allow-net server.ts

# Login
curl -X POST http://localhost:8081/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "pass123"}'

# Use the returned token
export TOKEN="<token-from-login>"

# Verify token
curl http://localhost:8081/auth/verify \
  -H "Authorization: Bearer $TOKEN"

# Access protected resource
curl http://localhost:8081/api/data \
  -H "Authorization: Bearer $TOKEN"

# Logout
curl -X POST http://localhost:8081/auth/logout \
  -H "X-Session-ID: <session-id>"
```

## Production Considerations

1. **Secret Management**: Use environment variables or secret managers
2. **Session Store**: Implement Redis for distributed sessions
3. **Rate Limiting**: Use distributed cache (Redis) for multi-region consistency
4. **Bot Detection**: Integrate with services like Cloudflare Bot Management
5. **GeoIP Database**: Use MaxMind or similar for accurate geolocation
6. **Monitoring**: Add metrics for failed auth attempts, bot scores, blocked IPs
7. **Logging**: Implement structured logging for security events
8. **HTTPS**: Enforce TLS in production
9. **CORS**: Configure appropriate CORS headers
10. **Password Hashing**: Use bcrypt/argon2 for password verification

## Edge Platform Compatibility

This service is designed for:
- Cloudflare Workers (with KV for sessions)
- Fastly Compute@Edge
- AWS Lambda@Edge (with DynamoDB)
- Deno Deploy
- Vercel Edge Functions

Adapt storage layer for your platform's persistence options.

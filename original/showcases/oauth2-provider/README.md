# OAuth2/OIDC Provider

A production-ready OAuth2 and OpenID Connect (OIDC) provider implementation supporting multiple grant types, token management, and standard endpoints.

## Features

- **Authorization Code Flow**: Standard OAuth2 authorization with PKCE support
- **Client Credentials**: Machine-to-machine authentication
- **Refresh Tokens**: Long-lived access with token refresh
- **Token Management**: Access token, refresh token, and ID token generation
- **Scope Validation**: Fine-grained permission control
- **JWK Endpoint**: Public key discovery for token verification
- **OIDC Support**: Full OpenID Connect compliance
- **Token Introspection**: Token validation endpoint
- **Token Revocation**: Invalidate tokens

## Architecture

```
┌──────────────┐
│   Client     │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│  OAuth2 Provider     │
│  ┌────────────────┐  │
│  │ Authorization  │  │
│  └────────────────┘  │
│  ┌────────────────┐  │
│  │ Token Endpoint │  │
│  └────────────────┘  │
│  ┌────────────────┐  │
│  │   UserInfo     │  │
│  └────────────────┘  │
└──────────────────────┘
```

## OAuth2 Flows

### 1. Authorization Code Flow

Most secure flow for web applications:

```
┌────────┐                               ┌──────────┐
│ Client │                               │ Provider │
└────┬───┘                               └─────┬────┘
     │ 1. Authorization Request               │
     │───────────────────────────────────────>│
     │                                         │
     │ 2. User Login & Consent                │
     │                                         │
     │ 3. Authorization Code                  │
     │<───────────────────────────────────────│
     │                                         │
     │ 4. Exchange Code for Tokens            │
     │───────────────────────────────────────>│
     │                                         │
     │ 5. Access Token + Refresh Token        │
     │<───────────────────────────────────────│
     │                                         │
```

#### Step 1: Authorization Request

```
GET /oauth/authorize?
  response_type=code&
  client_id=demo-client&
  redirect_uri=http://localhost:3000/callback&
  scope=openid profile email&
  state=random-state&
  code_challenge=CHALLENGE&
  code_challenge_method=S256
```

#### Step 2: Exchange Code for Token

```bash
curl -X POST http://localhost:3000/oauth/token \
  -d "grant_type=authorization_code" \
  -d "code=AUTH_CODE" \
  -d "redirect_uri=http://localhost:3000/callback" \
  -d "client_id=demo-client" \
  -d "client_secret=demo-secret" \
  -d "code_verifier=VERIFIER"
```

Response:
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_token_here",
  "id_token": "eyJhbGc...",
  "scope": "openid profile email"
}
```

### 2. Client Credentials Flow

For machine-to-machine authentication:

```bash
curl -X POST http://localhost:3000/oauth/token \
  -d "grant_type=client_credentials" \
  -d "client_id=demo-client" \
  -d "client_secret=demo-secret" \
  -d "scope=read write"
```

Response:
```json
{
  "access_token": "access_token_here",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "read write"
}
```

### 3. Refresh Token Flow

Refresh expired access tokens:

```bash
curl -X POST http://localhost:3000/oauth/token \
  -d "grant_type=refresh_token" \
  -d "refresh_token=REFRESH_TOKEN" \
  -d "client_id=demo-client" \
  -d "client_secret=demo-secret"
```

## PKCE (Proof Key for Code Exchange)

PKCE protects against authorization code interception:

### Generate Code Verifier and Challenge

```javascript
// 1. Generate random code verifier
const codeVerifier = generateRandomString(128);

// 2. Generate code challenge (SHA-256 hash)
const codeChallenge = base64UrlEncode(
  sha256(codeVerifier)
);

// 3. Include in authorization request
const authUrl = `http://localhost:3000/oauth/authorize?
  response_type=code&
  client_id=demo-client&
  code_challenge=${codeChallenge}&
  code_challenge_method=S256&
  ...
`;

// 4. Include verifier in token request
const tokenResponse = await fetch('http://localhost:3000/oauth/token', {
  method: 'POST',
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: authCode,
    code_verifier: codeVerifier,
    ...
  })
});
```

## Scopes

### Standard OAuth2 Scopes

- `read`: Read access
- `write`: Write access
- `admin`: Administrative access

### OpenID Connect Scopes

- `openid`: Required for OIDC, returns `sub` claim
- `profile`: Returns `name`, `picture` claims
- `email`: Returns `email`, `email_verified` claims

### Scope Validation

```typescript
// Client allowed scopes
const client = {
  allowedScopes: ['openid', 'profile', 'email', 'read']
};

// Request scopes
const requestedScopes = ['openid', 'profile'];

// Validate
const invalid = requestedScopes.filter(
  s => !client.allowedScopes.includes(s)
);
```

## Token Types

### Access Token

Short-lived token for API access:

```json
{
  "iss": "http://localhost:3000",
  "sub": "user123",
  "aud": "demo-client",
  "exp": 1234567890,
  "iat": 1234564290,
  "scope": "read write"
}
```

### Refresh Token

Long-lived token to get new access tokens:

```
refresh_token_here_random_string_64_chars
```

### ID Token (OIDC)

Contains user claims:

```json
{
  "iss": "http://localhost:3000",
  "sub": "user123",
  "aud": "demo-client",
  "exp": 1234567890,
  "iat": 1234564290,
  "name": "Demo User",
  "email": "demo@example.com",
  "email_verified": true,
  "picture": "https://example.com/avatar.jpg"
}
```

## Endpoints

### Authorization Endpoint

```
GET /oauth/authorize?
  response_type=code&
  client_id=CLIENT_ID&
  redirect_uri=REDIRECT_URI&
  scope=SCOPES&
  state=STATE
```

### Token Endpoint

```
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=CODE&
redirect_uri=REDIRECT_URI&
client_id=CLIENT_ID&
client_secret=CLIENT_SECRET
```

### UserInfo Endpoint

```
GET /oauth/userinfo
Authorization: Bearer ACCESS_TOKEN
```

Response:
```json
{
  "sub": "user123",
  "name": "Demo User",
  "email": "demo@example.com",
  "email_verified": true,
  "picture": "https://example.com/avatar.jpg"
}
```

### Token Introspection

```
POST /oauth/introspect
Content-Type: application/x-www-form-urlencoded

token=ACCESS_TOKEN&
client_id=CLIENT_ID&
client_secret=CLIENT_SECRET
```

Response:
```json
{
  "active": true,
  "scope": "read write",
  "client_id": "demo-client",
  "username": "user123",
  "token_type": "Bearer",
  "exp": 1234567890,
  "iat": 1234564290
}
```

### Token Revocation

```
POST /oauth/revoke
Content-Type: application/x-www-form-urlencoded

token=ACCESS_TOKEN&
client_id=CLIENT_ID&
client_secret=CLIENT_SECRET
```

### JWKS (JSON Web Key Set)

```
GET /.well-known/jwks.json
```

Response:
```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "key-1",
      "alg": "RS256",
      "n": "base64-encoded-modulus",
      "e": "AQAB"
    }
  ]
}
```

### OpenID Configuration

```
GET /.well-known/openid-configuration
```

Response:
```json
{
  "issuer": "http://localhost:3000",
  "authorization_endpoint": "http://localhost:3000/oauth/authorize",
  "token_endpoint": "http://localhost:3000/oauth/token",
  "userinfo_endpoint": "http://localhost:3000/oauth/userinfo",
  "jwks_uri": "http://localhost:3000/.well-known/jwks.json",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "client_credentials", "refresh_token"],
  "scopes_supported": ["openid", "profile", "email"]
}
```

## Client Registration

```typescript
const client: Client = {
  id: 'my-app',
  secret: 'my-app-secret',
  name: 'My Application',
  redirectUris: [
    'http://localhost:3000/callback',
    'https://myapp.com/callback'
  ],
  allowedScopes: [
    'openid',
    'profile',
    'email',
    'read',
    'write'
  ],
  allowedGrants: [
    'authorization_code',
    'client_credentials',
    'refresh_token'
  ],
  trusted: false
};

oauth2Provider.registerClient(client);
```

## Security

### Client Authentication

```typescript
// Client credentials in request body
const client = authenticateClient(
  params.get('client_id'),
  params.get('client_secret')
);

// Or in Authorization header
const auth = request.headers.get('authorization');
const [clientId, clientSecret] = atob(auth.split(' ')[1]).split(':');
```

### PKCE Implementation

```typescript
function verifyPKCE(
  challenge: string,
  method: 'plain' | 'S256',
  verifier: string
): boolean {
  if (method === 'plain') {
    return challenge === verifier;
  }

  if (method === 'S256') {
    const hash = sha256(verifier);
    return challenge === base64UrlEncode(hash);
  }

  return false;
}
```

### State Parameter

Prevent CSRF attacks:

```javascript
// 1. Generate random state
const state = generateRandomString(32);
sessionStorage.setItem('oauth_state', state);

// 2. Include in authorization request
const authUrl = `...&state=${state}`;

// 3. Verify in callback
const returnedState = params.get('state');
const expectedState = sessionStorage.getItem('oauth_state');
if (returnedState !== expectedState) {
  throw new Error('Invalid state');
}
```

## Token Validation

### Validate Access Token

```typescript
async function validateToken(token: string): Promise<boolean> {
  const payload = JWT.verify(token);

  if (!payload) {
    return false;
  }

  // Check expiration
  if (payload.exp < Date.now() / 1000) {
    return false;
  }

  // Check issuer
  if (payload.iss !== 'http://localhost:3000') {
    return false;
  }

  return true;
}
```

### Verify ID Token

```typescript
function verifyIdToken(token: string, clientId: string): JWTPayload | null {
  const payload = JWT.verify(token);

  if (!payload) {
    return null;
  }

  // Verify audience
  if (payload.aud !== clientId) {
    return null;
  }

  // Verify issuer
  if (payload.iss !== 'http://localhost:3000') {
    return null;
  }

  return payload;
}
```

## Error Responses

### Authorization Errors

```
HTTP/1.1 302 Found
Location: http://client.example.com/callback?
  error=invalid_request&
  error_description=Missing+client_id&
  state=STATE
```

### Token Errors

```json
{
  "error": "invalid_grant",
  "error_description": "Authorization code expired"
}
```

### Error Codes

- `invalid_request`: Malformed request
- `invalid_client`: Client authentication failed
- `invalid_grant`: Invalid authorization code or refresh token
- `unauthorized_client`: Client not authorized for grant type
- `unsupported_grant_type`: Grant type not supported
- `invalid_scope`: Invalid or unauthorized scope

## Testing

### Test Authorization Flow

```bash
# 1. Get authorization code
curl "http://localhost:3000/oauth/authorize?response_type=code&client_id=demo-client&redirect_uri=http://localhost:3000/callback&scope=openid+profile"

# 2. Exchange for tokens
curl -X POST http://localhost:3000/oauth/token \
  -d "grant_type=authorization_code" \
  -d "code=CODE_FROM_STEP_1" \
  -d "redirect_uri=http://localhost:3000/callback" \
  -d "client_id=demo-client" \
  -d "client_secret=demo-secret"
```

### Test Client Credentials

```bash
curl -X POST http://localhost:3000/oauth/token \
  -d "grant_type=client_credentials" \
  -d "client_id=demo-client" \
  -d "client_secret=demo-secret" \
  -d "scope=read write"
```

### Test UserInfo

```bash
curl http://localhost:3000/oauth/userinfo \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Running the Server

```bash
# Start server
elide serve server.ts

# Server runs on http://localhost:3000
```

## Best Practices

1. **Use HTTPS in Production**: Never use HTTP for OAuth2 in production
2. **Implement PKCE**: Always use PKCE for public clients
3. **Short-Lived Access Tokens**: Keep access tokens short-lived (1 hour max)
4. **Secure Token Storage**: Store tokens securely (HttpOnly cookies or secure storage)
5. **Validate Redirect URIs**: Strictly validate redirect URIs
6. **Use State Parameter**: Always use state parameter to prevent CSRF
7. **Rate Limiting**: Implement rate limiting on token endpoint
8. **Audit Logging**: Log all token issuance and revocation

## Production Considerations

- Use proper cryptographic signing (RS256 with RSA keys)
- Implement proper database storage for tokens and codes
- Add rate limiting and brute force protection
- Implement proper session management
- Use Redis for token storage and expiration
- Implement token rotation
- Add monitoring and alerting
- Implement proper key rotation

## Further Reading

- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)
- [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html)
- [PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)
- [OAuth 2.0 Security Best Practices](https://tools.ietf.org/html/draft-ietf-oauth-security-topics)

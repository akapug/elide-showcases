# Enhanced OAuth2/OIDC Provider

A **complete, RFC-compliant OAuth2 and OpenID Connect provider** implementation with comprehensive support for all standard flows, security features, and modern authentication methods.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [OAuth2 Flows](#oauth2-flows)
- [OpenID Connect](#openid-connect)
- [Security Features](#security-features)
- [Advanced Features](#advanced-features)
- [API Reference](#api-reference)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Best Practices](#best-practices)

## Features

### OAuth2 Flows (RFC 6749)

- ✅ **Authorization Code Flow** - Most secure flow for web applications
- ✅ **Authorization Code Flow with PKCE** - Enhanced security for public clients
- ✅ **Implicit Flow** - Legacy support (deprecated, not recommended)
- ✅ **Client Credentials Flow** - Machine-to-machine authentication
- ✅ **Resource Owner Password Flow** - For highly trusted clients only
- ✅ **Refresh Token Flow** - Long-lived access

### OpenID Connect 1.0

- ✅ **ID Tokens** - JWT-based identity tokens
- ✅ **UserInfo Endpoint** - Standard user profile endpoint
- ✅ **Discovery Document** - `.well-known/openid-configuration`
- ✅ **JWKS Endpoint** - Public key distribution
- ✅ **Standard Claims** - Profile, email, address, phone scopes

### Token Management

- ✅ **Token Generation** - Access, refresh, and ID tokens
- ✅ **Token Validation** - Signature and expiration checks
- ✅ **Token Introspection (RFC 7662)** - Token metadata endpoint
- ✅ **Token Revocation (RFC 7009)** - Invalidate tokens
- ✅ **Token Rotation** - Automatic refresh token rotation
- ✅ **Token Lifecycle** - Complete token management

### Security Features

- ✅ **PKCE Support (RFC 7636)** - Protection against code interception
- ✅ **State Parameter** - CSRF protection
- ✅ **Nonce Parameter** - Replay attack protection
- ✅ **Scope Validation** - Fine-grained permissions
- ✅ **Rate Limiting** - Brute force protection
- ✅ **Account Lockout** - Failed attempt protection

### Advanced Features

- ✅ **Dynamic Client Registration (RFC 7591)** - Runtime client registration
- ✅ **Multi-Factor Authentication** - TOTP, SMS, Email, Backup codes
- ✅ **Social Login Integration** - Google, GitHub, Facebook, Twitter, Microsoft, Apple
- ✅ **Consent Management** - User consent screens and storage
- ✅ **Session Management** - User authentication sessions

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    OAuth2/OIDC Provider                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Auth Flows   │  │ OIDC Handler │  │ Token Manager│         │
│  │              │  │              │  │              │         │
│  │ • Auth Code  │  │ • ID Tokens  │  │ • Generation │         │
│  │ • Implicit   │  │ • UserInfo   │  │ • Validation │         │
│  │ • Client     │  │ • Discovery  │  │ • Revocation │         │
│  │   Creds      │  │ • Claims     │  │ • Rotation   │         │
│  │ • Password   │  └──────────────┘  └──────────────┘         │
│  │ • PKCE       │                                               │
│  └──────────────┘                                               │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ MFA Manager  │  │ Consent Mgr  │  │ Social Login │         │
│  │              │  │              │  │              │         │
│  │ • TOTP       │  │ • Screens    │  │ • Google     │         │
│  │ • SMS        │  │ • Storage    │  │ • GitHub     │         │
│  │ • Email      │  │ • Validation │  │ • Facebook   │         │
│  │ • Backup     │  └──────────────┘  │ • More...    │         │
│  └──────────────┘                    └──────────────┘         │
│                                                                   │
│  ┌──────────────────────────────────────────────────┐          │
│  │   Dynamic Client Registration (RFC 7591)         │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## OAuth2 Flows

### 1. Authorization Code Flow (with PKCE)

**Most secure flow** - Recommended for all applications.

#### Step 1: Generate PKCE Challenge

```typescript
import { generatePKCEPair } from './flows/pkce.ts';

const { codeVerifier, codeChallenge, codeChallengeMethod } = generatePKCEPair('S256');
```

#### Step 2: Authorization Request

```http
GET /oauth/authorize?
  response_type=code&
  client_id=demo-client&
  redirect_uri=http://localhost:3000/callback&
  scope=openid profile email&
  state=random-state-value&
  code_challenge=CHALLENGE&
  code_challenge_method=S256
```

#### Step 3: Exchange Code for Tokens

```bash
curl -X POST http://localhost:3000/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=AUTH_CODE" \
  -d "redirect_uri=http://localhost:3000/callback" \
  -d "client_id=demo-client" \
  -d "client_secret=demo-secret" \
  -d "code_verifier=VERIFIER"
```

**Response:**

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

**Machine-to-machine** authentication.

```bash
curl -X POST http://localhost:3000/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=demo-client" \
  -d "client_secret=demo-secret" \
  -d "scope=read write"
```

### 3. Resource Owner Password Flow

**Use only for highly trusted clients.**

```bash
curl -X POST http://localhost:3000/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "username=user@example.com" \
  -d "password=user-password" \
  -d "client_id=demo-client" \
  -d "client_secret=demo-secret" \
  -d "scope=openid profile email"
```

### 4. Refresh Token Flow

```bash
curl -X POST http://localhost:3000/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "refresh_token=REFRESH_TOKEN" \
  -d "client_id=demo-client" \
  -d "client_secret=demo-secret"
```

### 5. Implicit Flow (Deprecated)

**Not recommended** - Use Authorization Code with PKCE instead.

```http
GET /oauth/authorize?
  response_type=token&
  client_id=demo-client&
  redirect_uri=http://localhost:3000/callback&
  scope=openid profile&
  state=random-state&
  nonce=random-nonce
```

## OpenID Connect

### Discovery Document

```bash
curl http://localhost:3000/.well-known/openid-configuration
```

**Response:**

```json
{
  "issuer": "http://localhost:3000",
  "authorization_endpoint": "http://localhost:3000/oauth/authorize",
  "token_endpoint": "http://localhost:3000/oauth/token",
  "userinfo_endpoint": "http://localhost:3000/oauth/userinfo",
  "jwks_uri": "http://localhost:3000/.well-known/jwks.json",
  "registration_endpoint": "http://localhost:3000/oauth/register",
  "response_types_supported": ["code", "token", "id_token"],
  "grant_types_supported": [
    "authorization_code",
    "implicit",
    "refresh_token",
    "client_credentials",
    "password"
  ],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256", "HS256"],
  "scopes_supported": [
    "openid",
    "profile",
    "email",
    "address",
    "phone",
    "offline_access"
  ]
}
```

### UserInfo Endpoint

```bash
curl http://localhost:3000/oauth/userinfo \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

**Response:**

```json
{
  "sub": "user123",
  "name": "Demo User",
  "given_name": "Demo",
  "family_name": "User",
  "email": "demo@example.com",
  "email_verified": true,
  "picture": "https://example.com/avatar.jpg",
  "locale": "en-US",
  "zoneinfo": "America/New_York"
}
```

### ID Token Claims

```json
{
  "iss": "http://localhost:3000",
  "sub": "user123",
  "aud": "demo-client",
  "exp": 1234567890,
  "iat": 1234564290,
  "auth_time": 1234564290,
  "nonce": "random-nonce",
  "name": "Demo User",
  "email": "demo@example.com",
  "email_verified": true
}
```

## Security Features

### PKCE (Proof Key for Code Exchange)

Protects against authorization code interception attacks.

```typescript
import { PKCE } from './flows/pkce.ts';

const pkce = new PKCE();

// Generate verifier and challenge
const verifier = pkce.generateCodeVerifier(); // 128 chars
const challenge = pkce.generateCodeChallenge(verifier, 'S256');

// Verify
const result = pkce.verify(challenge, 'S256', verifier);
console.log(result.valid); // true
```

### Multi-Factor Authentication

```typescript
import { MFAManager } from './mfa-integration.ts';

const mfa = new MFAManager();

// Setup TOTP
const { secret, qrCode, backupCodes } = mfa.setupTOTP('user123');

// Verify setup
const result = mfa.verifyTOTPSetup('user123', '123456');

// Create authentication challenge
const challenge = mfa.createAuthenticationChallenge('user123', 'totp');

// Verify challenge
const verified = mfa.verifyAuthenticationChallenge(
  challenge.challengeId,
  '123456',
  'user123'
);
```

### Consent Management

```typescript
import { ConsentManager } from './consent-manager.ts';

const consent = new ConsentManager();

// Check consent
const hasConsent = consent.hasConsent('user123', 'client-id', ['openid', 'profile']);

// Store consent
consent.storeConsent({
  userId: 'user123',
  clientId: 'client-id',
  scopes: ['openid', 'profile', 'email'],
  approved: true,
  timestamp: Date.now()
});

// Generate consent screen
const screenData = consent.generateConsentScreen(clientData, userData, scopes);
const html = consent.renderConsentScreen(screenData);
```

## Advanced Features

### Dynamic Client Registration

**Register clients programmatically** (RFC 7591).

```bash
curl -X POST http://localhost:3000/oauth/register \
  -H "Content-Type: application/json" \
  -d '{
    "redirect_uris": ["https://client.example.com/callback"],
    "client_name": "My Application",
    "grant_types": ["authorization_code", "refresh_token"],
    "response_types": ["code"],
    "scope": "openid profile email"
  }'
```

**Response:**

```json
{
  "client_id": "client_abc123",
  "client_secret": "secret_xyz789",
  "client_id_issued_at": 1234567890,
  "client_secret_expires_at": 0,
  "redirect_uris": ["https://client.example.com/callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "client_secret_basic",
  "registration_access_token": "reg_token_abc",
  "registration_client_uri": "http://localhost:3000/oauth/register/client_abc123"
}
```

### Social Login Providers

```typescript
import { SocialProvidersManager } from './social-providers.ts';

const social = new SocialProvidersManager();

// Configure provider
social.configureProvider({
  provider: 'google',
  clientId: 'your-google-client-id',
  clientSecret: 'your-google-client-secret',
  redirectUri: 'http://localhost:3000/oauth/social/google/callback',
  scopes: ['openid', 'email', 'profile'],
  enabled: true
});

// Get authorization URL
const authUrl = social.getAuthorizationUrl({
  provider: 'google',
  state: 'random-state',
  redirectUri: 'http://localhost:3000/callback'
});

// Exchange code
const result = await social.exchangeCode('google', code, state);

// Get user profile
const profile = await social.getUserProfile('google', accessToken);
```

### Token Introspection

```bash
curl -X POST http://localhost:3000/oauth/introspect \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=ACCESS_TOKEN" \
  -d "client_id=demo-client" \
  -d "client_secret=demo-secret"
```

**Response:**

```json
{
  "active": true,
  "scope": "openid profile email",
  "client_id": "demo-client",
  "username": "user123",
  "token_type": "Bearer",
  "exp": 1234567890,
  "iat": 1234564290,
  "sub": "user123",
  "aud": "demo-client",
  "iss": "http://localhost:3000"
}
```

### Token Revocation

```bash
curl -X POST http://localhost:3000/oauth/revoke \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=ACCESS_TOKEN" \
  -d "client_id=demo-client" \
  -d "client_secret=demo-secret"
```

## API Reference

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/oauth/authorize` | GET | Authorization endpoint |
| `/oauth/token` | POST | Token endpoint |
| `/oauth/userinfo` | GET | UserInfo endpoint (OIDC) |
| `/oauth/introspect` | POST | Token introspection (RFC 7662) |
| `/oauth/revoke` | POST | Token revocation (RFC 7009) |
| `/oauth/register` | POST | Dynamic client registration (RFC 7591) |
| `/.well-known/openid-configuration` | GET | Discovery document |
| `/.well-known/jwks.json` | GET | JWKS endpoint |
| `/health` | GET | Health check |

### Grant Types

| Grant Type | Use Case | Security |
|------------|----------|----------|
| `authorization_code` | Web apps with backend | ⭐⭐⭐⭐⭐ Most Secure |
| `authorization_code` + PKCE | SPAs, Mobile apps | ⭐⭐⭐⭐⭐ Most Secure |
| `client_credentials` | Machine-to-machine | ⭐⭐⭐⭐ Secure |
| `password` | Highly trusted clients | ⭐⭐ Use with caution |
| `implicit` | Legacy SPAs | ⭐ Deprecated |

### Scopes

| Scope | Description | Claims |
|-------|-------------|--------|
| `openid` | Required for OIDC | `sub` |
| `profile` | User profile | `name`, `given_name`, `family_name`, `picture` |
| `email` | Email address | `email`, `email_verified` |
| `address` | Mailing address | `address` |
| `phone` | Phone number | `phone_number`, `phone_number_verified` |
| `offline_access` | Refresh tokens | - |

## Quick Start

### 1. Start the Server

```bash
elide serve server-enhanced.ts
```

### 2. Test Authorization Code Flow

```bash
# Step 1: Get authorization code
open "http://localhost:3000/oauth/authorize?response_type=code&client_id=demo-client&redirect_uri=http://localhost:3000/callback&scope=openid+profile+email&state=random123"

# Step 2: Exchange code for tokens (replace CODE with actual code)
curl -X POST http://localhost:3000/oauth/token \
  -d "grant_type=authorization_code" \
  -d "code=CODE" \
  -d "redirect_uri=http://localhost:3000/callback" \
  -d "client_id=demo-client" \
  -d "client_secret=demo-secret"
```

### 3. Access UserInfo

```bash
# Replace ACCESS_TOKEN with your token
curl http://localhost:3000/oauth/userinfo \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Configuration

### Client Configuration

```typescript
const client = {
  id: 'my-app',
  secret: 'my-app-secret',
  name: 'My Application',
  redirectUris: [
    'http://localhost:3000/callback',
    'https://myapp.com/callback'
  ],
  allowedScopes: ['openid', 'profile', 'email', 'read', 'write'],
  allowedGrants: [
    'authorization_code',
    'client_credentials',
    'refresh_token'
  ],
  responseTypes: ['code'],
  tokenEndpointAuthMethod: 'client_secret_post',
  trusted: false
};
```

### Token Lifetimes

```typescript
{
  accessToken: 3600,        // 1 hour
  refreshToken: 2592000,    // 30 days
  idToken: 3600,            // 1 hour
  authCode: 600             // 10 minutes
}
```

## Best Practices

### Security

1. ✅ **Always use HTTPS** in production
2. ✅ **Use PKCE** for all public clients
3. ✅ **Keep access tokens short-lived** (1 hour max)
4. ✅ **Implement rate limiting** on token endpoint
5. ✅ **Validate redirect URIs** strictly
6. ✅ **Use state parameter** for CSRF protection
7. ✅ **Enable MFA** for sensitive operations
8. ✅ **Rotate refresh tokens** on each use
9. ✅ **Log security events** for audit
10. ✅ **Use proper cryptographic signing** (RS256 in production)

### Performance

1. ✅ **Cache JWKS** public keys
2. ✅ **Use Redis** for token storage
3. ✅ **Implement token cleanup** tasks
4. ✅ **Monitor token usage** and expiration
5. ✅ **Optimize database queries** for token lookups

### Compliance

1. ✅ **RFC 6749** - OAuth 2.0 Authorization Framework
2. ✅ **RFC 7636** - PKCE
3. ✅ **RFC 7662** - Token Introspection
4. ✅ **RFC 7009** - Token Revocation
5. ✅ **RFC 7591** - Dynamic Client Registration
6. ✅ **OpenID Connect Core 1.0**
7. ✅ **OpenID Connect Discovery 1.0**

## Module Reference

### Flow Modules

- **`flows/authorization-code.ts`** - Authorization Code flow implementation
- **`flows/client-credentials.ts`** - Client Credentials flow
- **`flows/pkce.ts`** - PKCE support
- **`flows/implicit-flow.ts`** - Implicit flow (deprecated)
- **`flows/resource-owner-password.ts`** - Password flow

### Feature Modules

- **`oidc-handler.ts`** - OpenID Connect implementation
- **`token-manager.ts`** - Token lifecycle management
- **`consent-manager.ts`** - User consent screens and storage
- **`mfa-integration.ts`** - Multi-factor authentication
- **`social-providers.ts`** - Social login integration
- **`dynamic-client-registration.ts`** - RFC 7591 implementation

### Main Server

- **`server-enhanced.ts`** - Complete OAuth2/OIDC server
- **`server.ts`** - Original basic implementation

## Testing

### Unit Tests

```bash
# Test authorization code flow
deno test flows/authorization-code.ts

# Test PKCE
deno test flows/pkce.ts

# Test token manager
deno test token-manager.ts
```

### Integration Tests

```bash
# Test complete authorization flow
curl -X POST http://localhost:3000/oauth/token \
  -d "grant_type=authorization_code" \
  -d "code=test_code" \
  -d "redirect_uri=http://localhost:3000/callback" \
  -d "client_id=demo-client" \
  -d "client_secret=demo-secret"
```

## Troubleshooting

### Common Issues

**"invalid_client" error**
- Check client_id and client_secret
- Verify client is registered
- Check authentication method

**"invalid_redirect_uri" error**
- Ensure redirect URI is registered
- Match exact URI including protocol and port
- No trailing slashes unless registered

**"invalid_grant" error**
- Authorization code expired (10 minutes)
- Code already used
- Invalid code_verifier for PKCE

**"invalid_scope" error**
- Requested scope not in client's allowed scopes
- Check scope spelling and spacing

## Production Deployment

### Environment Variables

```bash
export OAUTH_ISSUER=https://auth.example.com
export OAUTH_SIGNING_KEY=your-rsa-private-key
export DATABASE_URL=postgresql://...
export REDIS_URL=redis://...
export MFA_SMS_PROVIDER=twilio
export MFA_EMAIL_PROVIDER=sendgrid
```

### Database Schema

Use persistent storage for:
- Clients
- Users
- Tokens
- Authorization codes
- Consents
- MFA configurations

### Monitoring

Monitor:
- Token issuance rate
- Failed authentication attempts
- Token validation failures
- API endpoint latency
- Error rates

## License

MIT License - See LICENSE file for details

## Contributing

Contributions welcome! Please follow OAuth2/OIDC specifications and security best practices.

## Support

For issues and questions:
- Check documentation
- Review RFCs and specifications
- Submit GitHub issues
- Contact maintainers

---

**Built with Elide** - Modern OAuth2/OIDC provider for production use.

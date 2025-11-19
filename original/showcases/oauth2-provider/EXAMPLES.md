# OAuth2/OIDC Provider - Usage Examples

Complete examples demonstrating all features of the enhanced OAuth2/OIDC provider.

## Table of Contents

- [Authorization Code Flow](#authorization-code-flow)
- [PKCE Implementation](#pkce-implementation)
- [Client Credentials Flow](#client-credentials-flow)
- [Resource Owner Password Flow](#resource-owner-password-flow)
- [Refresh Tokens](#refresh-tokens)
- [Token Introspection](#token-introspection)
- [Token Revocation](#token-revocation)
- [OpenID Connect](#openid-connect)
- [Dynamic Client Registration](#dynamic-client-registration)
- [Multi-Factor Authentication](#multi-factor-authentication)
- [Social Login](#social-login)
- [Consent Management](#consent-management)

## Authorization Code Flow

### Example 1: Basic Authorization Code Flow

```typescript
// Step 1: Redirect user to authorization endpoint
const authUrl = new URL('http://localhost:3000/oauth/authorize');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('client_id', 'demo-client');
authUrl.searchParams.set('redirect_uri', 'http://localhost:3000/callback');
authUrl.searchParams.set('scope', 'openid profile email');
authUrl.searchParams.set('state', generateRandomString(32));

// Redirect user
window.location.href = authUrl.toString();

// Step 2: Handle callback
const params = new URLSearchParams(window.location.search);
const code = params.get('code');
const state = params.get('state');

// Verify state (CSRF protection)
if (state !== localStorage.getItem('oauth_state')) {
  throw new Error('Invalid state parameter');
}

// Step 3: Exchange code for tokens
const response = await fetch('http://localhost:3000/oauth/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: 'http://localhost:3000/callback',
    client_id: 'demo-client',
    client_secret: 'demo-secret'
  })
});

const tokens = await response.json();
console.log('Access Token:', tokens.access_token);
console.log('Refresh Token:', tokens.refresh_token);
console.log('ID Token:', tokens.id_token);
```

### Example 2: Using cURL

```bash
# Step 1: Get authorization code (open in browser)
open "http://localhost:3000/oauth/authorize?response_type=code&client_id=demo-client&redirect_uri=http://localhost:3000/callback&scope=openid+profile+email&state=abc123"

# Step 2: Exchange code for tokens
curl -X POST http://localhost:3000/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=YOUR_AUTH_CODE" \
  -d "redirect_uri=http://localhost:3000/callback" \
  -d "client_id=demo-client" \
  -d "client_secret=demo-secret"
```

## PKCE Implementation

### Example 3: Authorization Code with PKCE

```typescript
import { generatePKCEPair } from './flows/pkce.ts';

// Step 1: Generate PKCE pair
const { codeVerifier, codeChallenge, codeChallengeMethod } = generatePKCEPair('S256');

// Store code verifier
sessionStorage.setItem('code_verifier', codeVerifier);

// Step 2: Authorization request with PKCE
const authUrl = new URL('http://localhost:3000/oauth/authorize');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('client_id', 'demo-client');
authUrl.searchParams.set('redirect_uri', 'http://localhost:3000/callback');
authUrl.searchParams.set('scope', 'openid profile email');
authUrl.searchParams.set('state', generateRandomString(32));
authUrl.searchParams.set('code_challenge', codeChallenge);
authUrl.searchParams.set('code_challenge_method', codeChallengeMethod);

window.location.href = authUrl.toString();

// Step 3: Token request with code verifier
const code = new URLSearchParams(window.location.search).get('code');
const storedVerifier = sessionStorage.getItem('code_verifier');

const response = await fetch('http://localhost:3000/oauth/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: 'http://localhost:3000/callback',
    client_id: 'demo-client',
    code_verifier: storedVerifier
    // Note: No client_secret needed for public clients with PKCE
  })
});

const tokens = await response.json();
```

### Example 4: Manual PKCE Generation

```typescript
import { PKCE } from './flows/pkce.ts';

const pkce = new PKCE();

// Generate code verifier (43-128 characters)
const codeVerifier = pkce.generateCodeVerifier();
console.log('Code Verifier:', codeVerifier);

// Generate S256 challenge
const codeChallenge = pkce.generateCodeChallenge(codeVerifier, 'S256');
console.log('Code Challenge:', codeChallenge);

// Verify (server-side)
const verification = pkce.verify(codeChallenge, 'S256', codeVerifier);
console.log('Valid:', verification.valid);
```

## Client Credentials Flow

### Example 5: Machine-to-Machine Authentication

```typescript
// Request access token for service account
const response = await fetch('http://localhost:3000/oauth/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: 'service-account',
    client_secret: 'service-secret',
    scope: 'api.read api.write'
  })
});

const tokens = await response.json();
console.log('Service Access Token:', tokens.access_token);

// Use token to call API
const apiResponse = await fetch('https://api.example.com/resource', {
  headers: {
    'Authorization': `Bearer ${tokens.access_token}`
  }
});
```

### Example 6: Using Basic Authentication

```typescript
const clientId = 'service-account';
const clientSecret = 'service-secret';
const credentials = btoa(`${clientId}:${clientSecret}`);

const response = await fetch('http://localhost:3000/oauth/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': `Basic ${credentials}`
  },
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    scope: 'api.read api.write'
  })
});
```

## Resource Owner Password Flow

### Example 7: Username/Password Authentication

```typescript
// WARNING: Only use for highly trusted clients
const response = await fetch('http://localhost:3000/oauth/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: new URLSearchParams({
    grant_type: 'password',
    username: 'user@example.com',
    password: 'user-password',
    client_id: 'trusted-client',
    client_secret: 'trusted-secret',
    scope: 'openid profile email'
  })
});

const tokens = await response.json();
console.log('Tokens:', tokens);
```

## Refresh Tokens

### Example 8: Refreshing Access Token

```typescript
// Store refresh token securely
const refreshToken = tokens.refresh_token;

// When access token expires, use refresh token
const response = await fetch('http://localhost:3000/oauth/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: 'demo-client',
    client_secret: 'demo-secret'
  })
});

const newTokens = await response.json();
console.log('New Access Token:', newTokens.access_token);
console.log('New Refresh Token:', newTokens.refresh_token);
```

### Example 9: Automatic Token Refresh

```typescript
class TokenManager {
  private accessToken: string;
  private refreshToken: string;
  private expiresAt: number;

  async getAccessToken(): Promise<string> {
    // Check if token is expired or about to expire (5 min buffer)
    if (Date.now() + 300000 >= this.expiresAt) {
      await this.refreshAccessToken();
    }
    return this.accessToken;
  }

  private async refreshAccessToken(): Promise<void> {
    const response = await fetch('http://localhost:3000/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: 'demo-client',
        client_secret: 'demo-secret'
      })
    });

    const tokens = await response.json();
    this.accessToken = tokens.access_token;
    this.refreshToken = tokens.refresh_token;
    this.expiresAt = Date.now() + tokens.expires_in * 1000;
  }
}
```

## Token Introspection

### Example 10: Introspecting Access Token

```typescript
const response = await fetch('http://localhost:3000/oauth/introspect', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: new URLSearchParams({
    token: accessToken,
    client_id: 'demo-client',
    client_secret: 'demo-secret'
  })
});

const introspection = await response.json();

if (introspection.active) {
  console.log('Token is active');
  console.log('Scopes:', introspection.scope);
  console.log('User:', introspection.username);
  console.log('Expires:', new Date(introspection.exp * 1000));
} else {
  console.log('Token is not active');
}
```

### Example 11: Resource Server Validation

```typescript
// Resource server validates incoming token
async function validateToken(token: string): Promise<boolean> {
  const response = await fetch('http://localhost:3000/oauth/introspect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      token,
      client_id: 'resource-server',
      client_secret: 'resource-secret'
    })
  });

  const introspection = await response.json();
  return introspection.active && introspection.scope.includes('api.read');
}
```

## Token Revocation

### Example 12: Revoking Token

```typescript
// Revoke access token
await fetch('http://localhost:3000/oauth/revoke', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: new URLSearchParams({
    token: accessToken,
    client_id: 'demo-client',
    client_secret: 'demo-secret'
  })
});

console.log('Token revoked');
```

### Example 13: Logout Implementation

```typescript
async function logout() {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  // Revoke both tokens
  await Promise.all([
    fetch('http://localhost:3000/oauth/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        token: accessToken,
        client_id: 'demo-client',
        client_secret: 'demo-secret'
      })
    }),
    fetch('http://localhost:3000/oauth/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        token: refreshToken,
        client_id: 'demo-client',
        client_secret: 'demo-secret'
      })
    })
  ]);

  // Clear local storage
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');

  console.log('Logged out successfully');
}
```

## OpenID Connect

### Example 14: Getting User Info

```typescript
const accessToken = tokens.access_token;

const response = await fetch('http://localhost:3000/oauth/userinfo', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const userInfo = await response.json();
console.log('User ID:', userInfo.sub);
console.log('Name:', userInfo.name);
console.log('Email:', userInfo.email);
console.log('Email Verified:', userInfo.email_verified);
console.log('Picture:', userInfo.picture);
```

### Example 15: Decoding ID Token

```typescript
function parseJwt(token: string) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
}

const idToken = tokens.id_token;
const claims = parseJwt(idToken);

console.log('Issuer:', claims.iss);
console.log('Subject:', claims.sub);
console.log('Audience:', claims.aud);
console.log('Expiration:', new Date(claims.exp * 1000));
console.log('Name:', claims.name);
console.log('Email:', claims.email);
```

## Dynamic Client Registration

### Example 16: Registering New Client

```typescript
const response = await fetch('http://localhost:3000/oauth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    redirect_uris: ['https://myapp.com/callback'],
    client_name: 'My Application',
    client_uri: 'https://myapp.com',
    logo_uri: 'https://myapp.com/logo.png',
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    scope: 'openid profile email',
    contacts: ['admin@myapp.com'],
    tos_uri: 'https://myapp.com/terms',
    policy_uri: 'https://myapp.com/privacy'
  })
});

const client = await response.json();
console.log('Client ID:', client.client_id);
console.log('Client Secret:', client.client_secret);
console.log('Registration Token:', client.registration_access_token);

// Store these securely!
saveClientCredentials(client.client_id, client.client_secret);
```

## Multi-Factor Authentication

### Example 17: Setting Up TOTP

```typescript
import { MFAManager } from './mfa-integration.ts';

const mfa = new MFAManager();

// Setup TOTP for user
const { secret, qrCode, backupCodes } = mfa.setupTOTP('user123');

// Display QR code to user
console.log('Scan this QR code with your authenticator app:');
console.log(qrCode);

// Display backup codes
console.log('Backup codes (save these securely):');
backupCodes.forEach(code => console.log(code));

// User enters code from their app to verify
const userCode = '123456';
const result = mfa.verifyTOTPSetup('user123', userCode);

if (result.success) {
  console.log('TOTP setup successful');
} else {
  console.log('Invalid code');
}
```

### Example 18: MFA Challenge During Login

```typescript
import { MFAManager } from './mfa-integration.ts';

const mfa = new MFAManager();

// After successful password authentication
const userId = 'user123';

// Check if MFA is enabled
if (mfa.isMFAEnabled(userId)) {
  // Create MFA challenge
  const challenge = mfa.createAuthenticationChallenge(userId, 'totp');

  if (challenge) {
    console.log('MFA required');
    console.log('Method:', challenge.method);

    // User enters MFA code
    const userCode = prompt('Enter MFA code:');

    // Verify challenge
    const result = mfa.verifyAuthenticationChallenge(
      challenge.challengeId,
      userCode,
      userId
    );

    if (result.success) {
      console.log('MFA verification successful');
      // Proceed with login
    } else {
      console.log('MFA verification failed:', result.error);
    }
  }
}
```

## Social Login

### Example 19: Google Login

```typescript
import { SocialProvidersManager } from './social-providers.ts';

const social = new SocialProvidersManager();

// Configure Google provider
social.configureProvider({
  provider: 'google',
  clientId: 'your-google-client-id',
  clientSecret: 'your-google-client-secret',
  redirectUri: 'http://localhost:3000/auth/google/callback',
  scopes: ['openid', 'email', 'profile'],
  enabled: true
});

// Generate authorization URL
const state = generateRandomString(32);
const authUrl = social.getAuthorizationUrl({
  provider: 'google',
  state,
  redirectUri: 'http://localhost:3000/auth/google/callback'
});

// Redirect user
window.location.href = authUrl;

// Handle callback
const params = new URLSearchParams(window.location.search);
const code = params.get('code');
const returnedState = params.get('state');

if (returnedState !== state) {
  throw new Error('Invalid state');
}

// Exchange code for tokens
const result = await social.exchangeCode('google', code, state);

console.log('Google User:', result.email);
console.log('Name:', result.name);
console.log('Picture:', result.picture);
console.log('Provider ID:', result.providerId);
```

### Example 20: Multiple Social Providers

```typescript
// Render social login buttons
const buttonsHTML = social.renderSocialButtons();
document.getElementById('social-login').innerHTML = buttonsHTML;

// Handle social login
function loginWith(provider: string) {
  const state = generateRandomString(32);
  sessionStorage.setItem('oauth_state', state);

  const authUrl = social.getAuthorizationUrl({
    provider,
    state,
    redirectUri: `http://localhost:3000/auth/${provider}/callback`
  });

  window.location.href = authUrl;
}
```

## Consent Management

### Example 21: Custom Consent Screen

```typescript
import { ConsentManager } from './consent-manager.ts';

const consent = new ConsentManager();

// Generate consent screen
const screenData = consent.generateConsentScreen(
  {
    id: 'client-id',
    name: 'My Application',
    description: 'A demo application',
    logo: '🔐',
    privacyPolicy: 'https://example.com/privacy',
    termsOfService: 'https://example.com/terms'
  },
  {
    id: 'user123',
    name: 'John Doe',
    email: 'john@example.com'
  },
  ['openid', 'profile', 'email', 'read', 'write']
);

// Render HTML
const html = consent.renderConsentScreen(screenData);
document.body.innerHTML = html;

// Handle consent decision
const form = document.querySelector('form');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const decision = formData.get('decision');

  if (decision === 'approve') {
    consent.storeConsent({
      userId: 'user123',
      clientId: 'client-id',
      scopes: ['openid', 'profile', 'email', 'read', 'write'],
      approved: true,
      timestamp: Date.now()
    });

    // Continue with authorization flow
  } else {
    // Redirect with error
  }
});
```

## Utility Functions

```typescript
// Generate random string for state/nonce
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Parse JWT token
function parseJwt(token: string) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
}

// Check if token is expired
function isTokenExpired(token: string): boolean {
  const payload = parseJwt(token);
  return payload.exp * 1000 < Date.now();
}
```

## Complete Flow Example

### Example 22: Full Authorization Flow with Error Handling

```typescript
class OAuth2Client {
  private clientId = 'demo-client';
  private clientSecret = 'demo-secret';
  private redirectUri = 'http://localhost:3000/callback';
  private authorizationEndpoint = 'http://localhost:3000/oauth/authorize';
  private tokenEndpoint = 'http://localhost:3000/oauth/token';

  async login() {
    try {
      // Generate PKCE
      const { codeVerifier, codeChallenge } = generatePKCEPair('S256');
      sessionStorage.setItem('code_verifier', codeVerifier);

      // Generate state
      const state = generateRandomString(32);
      sessionStorage.setItem('oauth_state', state);

      // Build authorization URL
      const authUrl = new URL(this.authorizationEndpoint);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', this.clientId);
      authUrl.searchParams.set('redirect_uri', this.redirectUri);
      authUrl.searchParams.set('scope', 'openid profile email');
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');

      // Redirect
      window.location.href = authUrl.toString();
    } catch (error) {
      console.error('Login failed:', error);
    }
  }

  async handleCallback() {
    try {
      const params = new URLSearchParams(window.location.search);

      // Check for errors
      const error = params.get('error');
      if (error) {
        throw new Error(`OAuth error: ${error} - ${params.get('error_description')}`);
      }

      // Get code and state
      const code = params.get('code');
      const state = params.get('state');

      // Verify state
      const savedState = sessionStorage.getItem('oauth_state');
      if (state !== savedState) {
        throw new Error('Invalid state parameter');
      }

      // Get code verifier
      const codeVerifier = sessionStorage.getItem('code_verifier');
      if (!codeVerifier) {
        throw new Error('Code verifier not found');
      }

      // Exchange code for tokens
      const response = await fetch(this.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectUri,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code_verifier: codeVerifier
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Token error: ${error.error}`);
      }

      const tokens = await response.json();

      // Store tokens securely
      this.storeTokens(tokens);

      // Clean up session storage
      sessionStorage.removeItem('code_verifier');
      sessionStorage.removeItem('oauth_state');

      return tokens;
    } catch (error) {
      console.error('Callback handling failed:', error);
      throw error;
    }
  }

  private storeTokens(tokens: any) {
    // Store in secure storage (e.g., httpOnly cookies in production)
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    localStorage.setItem('id_token', tokens.id_token);
    localStorage.setItem('expires_at',
      String(Date.now() + tokens.expires_in * 1000)
    );
  }
}

// Usage
const client = new OAuth2Client();

// Login button
document.getElementById('login').addEventListener('click', () => {
  client.login();
});

// Handle callback on redirect
if (window.location.pathname === '/callback') {
  client.handleCallback()
    .then(() => {
      console.log('Login successful');
      window.location.href = '/dashboard';
    })
    .catch(error => {
      console.error('Login failed:', error);
      window.location.href = '/login?error=auth_failed';
    });
}
```

---

These examples demonstrate all major features of the enhanced OAuth2/OIDC provider. For more details, see the main [README](./README-ENHANCED.md).

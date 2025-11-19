# Authentication Guide

Complete guide to authentication and user management in Elidebase.

## Table of Contents

- [Overview](#overview)
- [Email/Password Authentication](#emailpassword-authentication)
- [Magic Link Authentication](#magic-link-authentication)
- [OAuth Providers](#oauth-providers)
- [Phone Authentication](#phone-authentication)
- [JWT Tokens](#jwt-tokens)
- [User Management](#user-management)
- [Security Best Practices](#security-best-practices)

## Overview

Elidebase provides a complete authentication system with support for:

- Email/password with secure hashing (BCrypt)
- Passwordless magic links
- OAuth providers (Google, GitHub, Facebook, etc.)
- Phone/SMS authentication
- JWT-based sessions
- Refresh tokens
- Email verification
- Password reset
- User metadata

## Email/Password Authentication

### Sign Up

```kotlin
val result = client.auth.signUp(
    email = "user@example.com",
    password = "securePassword123!",
    metadata = mapOf(
        "name" to "John Doe",
        "country" to "US"
    )
)

when {
    result.data != null -> {
        val session = result.data
        println("Signed up: ${session.user.email}")
        println("Access token: ${session.accessToken}")
    }
    result.error != null -> {
        println("Error: ${result.error.message}")
    }
}
```

### Sign In

```kotlin
val result = client.auth.signIn(
    email = "user@example.com",
    password = "securePassword123!"
)

when {
    result.data != null -> {
        val session = result.data
        println("Signed in: ${session.user.email}")

        // Store tokens
        localStorage.set("access_token", session.accessToken)
        localStorage.set("refresh_token", session.refreshToken)
    }
    result.error != null -> {
        println("Error: ${result.error.message}")
    }
}
```

### Get Current User

```kotlin
val user = client.auth.getUser()

if (user != null) {
    println("Logged in as: ${user.email}")
    println("User ID: ${user.id}")
    println("Role: ${user.role}")
} else {
    println("Not logged in")
}
```

### Sign Out

```kotlin
client.auth.signOut()
println("Signed out successfully")
```

### Password Reset

**Request reset:**
```kotlin
client.auth.resetPasswordRequest("user@example.com")
println("Password reset email sent")
```

**Confirm reset (from email link):**
```kotlin
val result = client.auth.resetPasswordConfirm(
    token = "reset-token-from-email",
    newPassword = "newSecurePassword123!"
)
```

## Magic Link Authentication

Passwordless authentication via email.

### Send Magic Link

```kotlin
val result = client.auth.sendMagicLink(
    email = "user@example.com"
)

if (result.error == null) {
    println("Magic link sent! Check your email.")
}
```

### Verify Magic Link

```kotlin
// User clicks link in email, which contains token
val result = client.auth.verifyMagicLink(
    token = "magic-link-token"
)

when {
    result.data != null -> {
        val session = result.data
        println("Authenticated: ${session.user.email}")
    }
    result.error != null -> {
        println("Invalid or expired link")
    }
}
```

### Custom Email Template

Configure magic link email in your email service:

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        .button {
            background-color: #4CAF50;
            color: white;
            padding: 14px 20px;
            text-decoration: none;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <h1>Sign in to Your App</h1>
    <p>Click the button below to sign in:</p>
    <a href="https://yourapp.com/auth/verify?token={{TOKEN}}" class="button">
        Sign In
    </a>
    <p>This link will expire in 1 hour.</p>
</body>
</html>
```

## OAuth Providers

### Setup OAuth Provider

```kotlin
val oauthManager = OAuthManager(dbManager, authManager)

// Register Google OAuth
oauthManager.registerProvider(
    AuthProviderConfig(
        provider = "google",
        clientId = "your-google-client-id",
        clientSecret = "your-google-client-secret",
        redirectUrl = "https://yourapp.com/auth/callback",
        scopes = listOf("openid", "email", "profile")
    )
)

// Register GitHub OAuth
oauthManager.registerProvider(
    AuthProviderConfig(
        provider = "github",
        clientId = "your-github-client-id",
        clientSecret = "your-github-client-secret",
        redirectUrl = "https://yourapp.com/auth/callback",
        scopes = listOf("user:email")
    )
)
```

### Sign In with OAuth

**Step 1: Get authorization URL**
```kotlin
val result = oauthManager.getAuthorizationUrl(
    provider = "google",
    state = generateToken(16) // CSRF protection
)

if (result.data != null) {
    // Redirect user to OAuth provider
    redirectTo(result.data)
}
```

**Step 2: Handle callback**
```kotlin
// User is redirected back to your app with code
val result = oauthManager.handleCallback(
    OAuthCallback(
        provider = "google",
        code = "authorization-code",
        state = "csrf-state-token"
    )
)

when {
    result.data != null -> {
        val session = result.data
        println("OAuth sign in successful: ${session.user.email}")
    }
    result.error != null -> {
        println("OAuth error: ${result.error.message}")
    }
}
```

### Supported Providers

- **Google** - Most popular OAuth provider
- **GitHub** - Developer-focused authentication
- **Facebook** - Social media authentication
- **Twitter** - Twitter/X authentication
- **Discord** - Gaming community authentication
- **Custom** - Add your own OAuth provider

### Link/Unlink Providers

```kotlin
// List linked providers
val providers = oauthManager.listLinkedProviders(userId)
println("Linked providers: ${providers.data}")

// Unlink a provider
oauthManager.unlinkProvider(userId, "google")
```

## Phone Authentication

### Send OTP

```kotlin
val result = client.auth.sendPhoneOTP(
    phone = "+1234567890" // E.164 format
)

if (result.error == null) {
    println("OTP sent to phone")
}
```

### Verify OTP

```kotlin
val result = client.auth.verifyPhoneOTP(
    phone = "+1234567890",
    code = "123456"
)

when {
    result.data != null -> {
        val session = result.data
        println("Phone verified: ${session.user.phone}")
    }
    result.error != null -> {
        println("Invalid OTP code")
    }
}
```

### SMS Provider Integration

Configure your SMS provider (Twilio, etc.):

```kotlin
class TwilioSMSProvider(
    private val accountSid: String,
    private val authToken: String,
    private val fromNumber: String
) {
    fun sendOTP(phone: String, code: String) {
        // Send SMS using Twilio API
        val message = "Your verification code is: $code"
        // ... Twilio API call
    }
}
```

## JWT Tokens

### Token Structure

Elidebase uses JWT tokens with the following structure:

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "authenticated",
  "aud": "authenticated",
  "exp": 1704067200,
  "iat": 1704063600,
  "metadata": {
    "name": "John Doe"
  }
}
```

### Verify Token

```kotlin
val decodedToken = authManager.verifyToken(accessToken)

if (decodedToken != null) {
    val userId = decodedToken.subject
    val email = decodedToken.getClaim("email").asString()
    val role = decodedToken.getClaim("role").asString()
}
```

### Refresh Token

```kotlin
val result = client.auth.refreshSession()

when {
    result.data != null -> {
        val newSession = result.data
        // Update stored tokens
        localStorage.set("access_token", newSession.accessToken)
        localStorage.set("refresh_token", newSession.refreshToken)
    }
    result.error != null -> {
        // Refresh failed, redirect to login
        redirectToLogin()
    }
}
```

### Token Expiration

- **Access Token**: 1 hour (default)
- **Refresh Token**: 30 days (default)

Configure in `elidebase.json`:

```json
{
  "auth": {
    "jwtExpiry": 3600,
    "refreshTokenExpiry": 2592000
  }
}
```

## User Management

### Get User Profile

```kotlin
val user = client.auth.getUser()

println("ID: ${user.id}")
println("Email: ${user.email}")
println("Phone: ${user.phone}")
println("Email Confirmed: ${user.emailConfirmed}")
println("Created At: ${user.createdAt}")
println("Last Sign In: ${user.lastSignInAt}")
println("Role: ${user.role}")
```

### Update User Metadata

```kotlin
val result = client.database
    .from("auth.user_metadata")
    .eq("user_id", userId)
    .update(JsonObject(mapOf(
        "user_metadata" to JsonObject(mapOf(
            "name" to JsonPrimitive("John Smith"),
            "avatar_url" to JsonPrimitive("https://..."),
            "preferences" to JsonObject(mapOf(
                "theme" to JsonPrimitive("dark"),
                "language" to JsonPrimitive("en")
            ))
        ))
    )))
```

### Admin Functions

**List all users:**
```kotlin
val users = client.database
    .from("auth.users")
    .select("id", "email", "created_at", "last_sign_in_at")
    .order("created_at", ascending = false)
    .limit(100)
    .execute()
```

**Ban user:**
```kotlin
client.database
    .from("auth.users")
    .eq("id", userId)
    .update(JsonObject(mapOf(
        "banned" to JsonPrimitive(true)
    )))
```

**Delete user:**
```kotlin
client.database
    .from("auth.users")
    .eq("id", userId)
    .update(JsonObject(mapOf(
        "deleted_at" to JsonPrimitive(Instant.now().toString())
    )))
```

### User Roles

Define custom roles and permissions:

```sql
-- Create roles table
CREATE TABLE auth.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    permissions JSONB DEFAULT '[]'
);

-- Create user_roles junction table
CREATE TABLE auth.user_roles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES auth.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Insert default roles
INSERT INTO auth.roles (name, permissions) VALUES
    ('admin', '["*"]'),
    ('moderator', '["posts.read", "posts.update", "users.ban"]'),
    ('user', '["posts.read", "posts.create"]');
```

**Check user permissions:**
```kotlin
fun hasPermission(userId: String, permission: String): Boolean {
    val roles = client.database
        .from("auth.user_roles")
        .eq("user_id", userId)
        .execute()

    // Check if user has required permission
    // ... permission checking logic
}
```

## Security Best Practices

### 1. Password Requirements

```kotlin
fun validatePassword(password: String): Boolean {
    return password.length >= 8 &&
           password.any { it.isUpperCase() } &&
           password.any { it.isLowerCase() } &&
           password.any { it.isDigit() } &&
           password.any { !it.isLetterOrDigit() }
}
```

### 2. Rate Limiting

```kotlin
val rateLimiter = RateLimiter(
    capacity = 5, // 5 attempts
    refillRate = 1, // 1 token per second
    refillInterval = 1000
)

fun attemptLogin(email: String, password: String) {
    if (!rateLimiter.tryAcquire()) {
        throw Exception("Too many login attempts. Try again later.")
    }

    // Proceed with login
}
```

### 3. CSRF Protection

```kotlin
// Generate CSRF token
val csrfToken = generateToken(32)
session.set("csrf_token", csrfToken)

// Verify on form submission
fun verifyCSRF(requestToken: String): Boolean {
    val sessionToken = session.get("csrf_token")
    return requestToken == sessionToken
}
```

### 4. Secure Cookies

```kotlin
setCookie(
    name = "session_token",
    value = accessToken,
    httpOnly = true,
    secure = true, // HTTPS only
    sameSite = "Strict",
    maxAge = 3600
)
```

### 5. Email Verification

```sql
-- Require email verification for sensitive operations
CREATE POLICY verified_users_only ON sensitive_data
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND email_confirmed = true
        )
    );
```

### 6. Audit Logging

All authentication events are automatically logged:

```kotlin
// View audit log
val logs = client.database
    .from("auth.audit_log")
    .eq("user_id", userId)
    .order("created_at", ascending = false)
    .limit(100)
    .execute()

// Log entries include:
// - SIGNUP_EMAIL
// - SIGNIN_EMAIL
// - MAGIC_LINK_SENT
// - MAGIC_LINK_VERIFIED
// - OAUTH_SIGNIN
// - PASSWORD_RESET_REQUESTED
// - PASSWORD_RESET_CONFIRMED
// - TOKEN_REFRESHED
```

### 7. Two-Factor Authentication

Implement TOTP-based 2FA:

```kotlin
// Generate TOTP secret
val secret = generateTOTPSecret()

// Store in user metadata
client.database
    .from("auth.user_metadata")
    .eq("user_id", userId)
    .update(JsonObject(mapOf(
        "app_metadata" to JsonObject(mapOf(
            "totp_secret" to JsonPrimitive(secret)
        ))
    )))

// Verify TOTP code
fun verifyTOTP(userId: String, code: String): Boolean {
    val secret = getUserTOTPSecret(userId)
    return verifyTOTPCode(secret, code)
}
```

## Examples

### Complete Authentication Flow

```kotlin
class AuthService(private val client: ElidebaseClient) {

    suspend fun signUp(
        email: String,
        password: String,
        name: String
    ): Result<SessionTokens> {
        // Validate input
        if (!isValidEmail(email)) {
            return Result.Failure(ApiError("INVALID_EMAIL", "Invalid email format"))
        }

        if (!validatePassword(password)) {
            return Result.Failure(ApiError("WEAK_PASSWORD", "Password too weak"))
        }

        // Sign up
        val result = client.auth.signUp(
            email = email,
            password = password,
            metadata = mapOf("name" to name)
        )

        return when {
            result.data != null -> {
                // Send verification email
                sendVerificationEmail(result.data.user.email!!)
                Result.Success(result.data)
            }
            result.error != null -> {
                Result.Failure(result.error)
            }
            else -> {
                Result.Failure(ApiError("UNKNOWN", "Unknown error"))
            }
        }
    }

    suspend fun signIn(
        email: String,
        password: String
    ): Result<SessionTokens> {
        val result = client.auth.signIn(email, password)

        return when {
            result.data != null -> Result.Success(result.data)
            result.error != null -> Result.Failure(result.error)
            else -> Result.Failure(ApiError("UNKNOWN", "Unknown error"))
        }
    }

    fun isAuthenticated(): Boolean {
        return client.auth.getSession() != null
    }

    suspend fun refreshIfNeeded() {
        val session = client.auth.getSession() ?: return

        // Refresh if token expires in < 5 minutes
        val expiresAt = session.expiresIn * 1000 + System.currentTimeMillis()
        if (expiresAt - System.currentTimeMillis() < 300000) {
            client.auth.refreshSession()
        }
    }
}
```

### Protected Route Middleware

```kotlin
fun requireAuth(handler: suspend (userId: String) -> Unit): suspend () -> Unit = {
    val session = client.auth.getSession()

    if (session == null) {
        throw UnauthorizedException("Not authenticated")
    }

    // Verify token
    val decodedToken = authManager.verifyToken(session.accessToken)
    if (decodedToken == null) {
        throw UnauthorizedException("Invalid token")
    }

    handler(decodedToken.subject)
}

// Usage
get("/api/profile") {
    requireAuth { userId ->
        val profile = getUserProfile(userId)
        respond(profile)
    }
}
```

## Next Steps

- [Database Guide](DATABASE_GUIDE.md)
- [Storage Guide](STORAGE_GUIDE.md)
- [Real-time Guide](REALTIME_GUIDE.md)
- [Functions Guide](FUNCTIONS_GUIDE.md)

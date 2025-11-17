package tools.elide.oss.elidebase.core

import kotlinx.serialization.Serializable
import java.time.Instant
import java.util.UUID

/**
 * Common response wrapper for all API responses
 */
@Serializable
data class ApiResponse<T>(
    val data: T? = null,
    val error: ApiError? = null,
    val count: Long? = null
)

/**
 * Standard error format
 */
@Serializable
data class ApiError(
    val code: String,
    val message: String,
    val details: Map<String, String>? = null,
    val hint: String? = null
)

/**
 * Pagination parameters
 */
@Serializable
data class PaginationParams(
    val page: Int = 0,
    val pageSize: Int = 20,
    val offset: Int = page * pageSize
) {
    init {
        require(pageSize in 1..1000) { "Page size must be between 1 and 1000" }
        require(page >= 0) { "Page must be non-negative" }
    }
}

/**
 * Filter operations for queries
 */
enum class FilterOperator {
    EQ,      // equals
    NEQ,     // not equals
    GT,      // greater than
    GTE,     // greater than or equal
    LT,      // less than
    LTE,     // less than or equal
    LIKE,    // pattern matching
    ILIKE,   // case-insensitive pattern matching
    IN,      // in array
    IS,      // is null/not null
    FTS,     // full-text search
    CS,      // contains
    CD,      // contained by
    OV,      // overlaps
    SL,      // strictly left of
    SR,      // strictly right of
    NXR,     // does not extend to right
    NXL      // does not extend to left
}

/**
 * Query filter
 */
@Serializable
data class QueryFilter(
    val column: String,
    val operator: String,
    val value: String
)

/**
 * Sort direction
 */
enum class SortDirection {
    ASC,
    DESC
}

/**
 * Sort parameter
 */
@Serializable
data class SortParam(
    val column: String,
    val direction: String = "ASC",
    val nullsFirst: Boolean = false
)

/**
 * User session information
 */
@Serializable
data class UserSession(
    val userId: String,
    val email: String?,
    val role: String = "authenticated",
    val metadata: Map<String, String> = emptyMap(),
    val expiresAt: Long
)

/**
 * JWT claims
 */
@Serializable
data class JwtClaims(
    val sub: String,  // user id
    val email: String?,
    val role: String,
    val aud: String,  // audience
    val exp: Long,    // expiration
    val iat: Long,    // issued at
    val metadata: Map<String, String> = emptyMap()
)

/**
 * Database connection configuration
 */
@Serializable
data class DatabaseConfig(
    val host: String = "localhost",
    val port: Int = 5432,
    val database: String,
    val username: String,
    val password: String,
    val poolSize: Int = 10,
    val maxLifetime: Long = 1800000, // 30 minutes
    val connectionTimeout: Long = 30000, // 30 seconds
    val ssl: Boolean = false
)

/**
 * Storage bucket configuration
 */
@Serializable
data class BucketConfig(
    val name: String,
    val public: Boolean = false,
    val fileSizeLimit: Long = 52428800, // 50MB
    val allowedMimeTypes: List<String>? = null
)

/**
 * Real-time subscription configuration
 */
@Serializable
data class SubscriptionConfig(
    val schema: String = "public",
    val table: String,
    val filter: String? = null,
    val event: String = "*" // insert, update, delete, or *
)

/**
 * Function invocation request
 */
@Serializable
data class FunctionInvocation(
    val name: String,
    val body: String? = null,
    val headers: Map<String, String> = emptyMap(),
    val method: String = "POST"
)

/**
 * Function response
 */
@Serializable
data class FunctionResponse(
    val data: String?,
    val error: String? = null,
    val executionTime: Long,
    val memoryUsed: Long
)

/**
 * Row level security policy
 */
@Serializable
data class RLSPolicy(
    val name: String,
    val table: String,
    val command: String, // SELECT, INSERT, UPDATE, DELETE, ALL
    val using: String,   // SQL expression for row visibility
    val check: String? = null, // SQL expression for row modification
    val role: String = "authenticated"
)

/**
 * Database migration
 */
@Serializable
data class Migration(
    val version: Long,
    val name: String,
    val up: String,
    val down: String,
    val appliedAt: String? = null
)

/**
 * Storage object metadata
 */
@Serializable
data class StorageObject(
    val id: String,
    val bucket: String,
    val path: String,
    val name: String,
    val size: Long,
    val mimeType: String,
    val etag: String,
    val createdAt: String,
    val updatedAt: String,
    val lastAccessedAt: String? = null,
    val metadata: Map<String, String> = emptyMap()
)

/**
 * Real-time message types
 */
enum class RealtimeMessageType {
    SUBSCRIBE,
    UNSUBSCRIBE,
    INSERT,
    UPDATE,
    DELETE,
    BROADCAST,
    PRESENCE,
    SYSTEM,
    ERROR
}

/**
 * Real-time message
 */
@Serializable
data class RealtimeMessage(
    val type: String,
    val topic: String,
    val event: String? = null,
    val payload: String? = null,
    val ref: String? = null
)

/**
 * Presence state
 */
@Serializable
data class PresenceState(
    val userId: String,
    val online: Boolean,
    val lastSeen: String,
    val metadata: Map<String, String> = emptyMap()
)

/**
 * Auth provider configuration
 */
@Serializable
data class AuthProviderConfig(
    val provider: String,
    val clientId: String,
    val clientSecret: String,
    val redirectUrl: String,
    val scopes: List<String> = emptyList(),
    val enabled: Boolean = true
)

/**
 * User authentication credentials
 */
@Serializable
data class AuthCredentials(
    val email: String? = null,
    val password: String? = null,
    val phone: String? = null,
    val provider: String? = null,
    val token: String? = null
)

/**
 * User profile
 */
@Serializable
data class UserProfile(
    val id: String,
    val email: String?,
    val phone: String?,
    val emailConfirmed: Boolean = false,
    val phoneConfirmed: Boolean = false,
    val createdAt: String,
    val updatedAt: String,
    val lastSignInAt: String? = null,
    val appMetadata: Map<String, String> = emptyMap(),
    val userMetadata: Map<String, String> = emptyMap(),
    val role: String = "authenticated",
    val banned: Boolean = false
)

/**
 * Password reset request
 */
@Serializable
data class PasswordResetRequest(
    val email: String
)

/**
 * Password reset confirmation
 */
@Serializable
data class PasswordResetConfirm(
    val token: String,
    val password: String
)

/**
 * Email verification request
 */
@Serializable
data class EmailVerificationRequest(
    val token: String
)

/**
 * Magic link request
 */
@Serializable
data class MagicLinkRequest(
    val email: String,
    val redirectTo: String? = null
)

/**
 * Phone OTP request
 */
@Serializable
data class PhoneOTPRequest(
    val phone: String
)

/**
 * Phone OTP verification
 */
@Serializable
data class PhoneOTPVerify(
    val phone: String,
    val token: String
)

/**
 * OAuth callback data
 */
@Serializable
data class OAuthCallback(
    val provider: String,
    val code: String,
    val state: String
)

/**
 * Session token pair
 */
@Serializable
data class SessionTokens(
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Long,
    val tokenType: String = "Bearer",
    val user: UserProfile
)

/**
 * Refresh token request
 */
@Serializable
data class RefreshTokenRequest(
    val refreshToken: String
)

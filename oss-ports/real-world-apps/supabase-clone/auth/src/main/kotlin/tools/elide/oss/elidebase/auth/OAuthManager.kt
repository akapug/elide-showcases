package tools.elide.oss.elidebase.auth

import io.github.oshai.kotlinlogging.KotlinLogging
import tools.elide.oss.elidebase.core.*
import tools.elide.oss.elidebase.database.DatabaseManager
import java.net.URLEncoder
import java.util.UUID
import kotlinx.serialization.json.*

private val logger = KotlinLogging.logger {}

/**
 * OAuth provider manager
 */
class OAuthManager(
    private val dbManager: DatabaseManager,
    private val authManager: AuthManager
) {

    private val providers = mutableMapOf<String, AuthProviderConfig>()

    /**
     * Register OAuth provider
     */
    fun registerProvider(config: AuthProviderConfig) {
        providers[config.provider] = config
        logger.info { "OAuth provider registered: ${config.provider}" }
    }

    /**
     * Generate OAuth authorization URL
     */
    fun getAuthorizationUrl(provider: String, state: String): ApiResponse<String> {
        val config = providers[provider]
            ?: return ApiResponse(error = ApiError("INVALID_PROVIDER", "OAuth provider not configured: $provider"))

        if (!config.enabled) {
            return ApiResponse(error = ApiError("PROVIDER_DISABLED", "OAuth provider is disabled: $provider"))
        }

        val url = when (provider.lowercase()) {
            "google" -> buildGoogleAuthUrl(config, state)
            "github" -> buildGitHubAuthUrl(config, state)
            "facebook" -> buildFacebookAuthUrl(config, state)
            "twitter" -> buildTwitterAuthUrl(config, state)
            "discord" -> buildDiscordAuthUrl(config, state)
            else -> return ApiResponse(error = ApiError("UNSUPPORTED_PROVIDER", "Unsupported OAuth provider: $provider"))
        }

        return ApiResponse(data = url)
    }

    /**
     * Handle OAuth callback
     */
    suspend fun handleCallback(callback: OAuthCallback): ApiResponse<SessionTokens> {
        val config = providers[callback.provider]
            ?: return ApiResponse(error = ApiError("INVALID_PROVIDER", "OAuth provider not configured: ${callback.provider}"))

        return try {
            // Exchange code for tokens
            val (accessToken, refreshToken, expiresIn) = exchangeCodeForToken(callback.provider, callback.code, config)

            // Get user info from provider
            val providerUser = getUserInfo(callback.provider, accessToken)

            // Find or create user
            val user = dbManager.transaction { connection ->
                // Check if OAuth identity exists
                val findIdentitySql = """
                    SELECT user_id
                    FROM auth.oauth_identities
                    WHERE provider = ? AND provider_user_id = ?;
                """.trimIndent()

                val existingUserId = connection.prepareStatement(findIdentitySql).use { stmt ->
                    stmt.setString(1, callback.provider)
                    stmt.setString(2, providerUser.id)
                    stmt.executeQuery().use { rs ->
                        if (rs.next()) rs.getString("user_id") else null
                    }
                }

                val userId = if (existingUserId != null) {
                    // Update existing identity
                    val updateIdentitySql = """
                        UPDATE auth.oauth_identities
                        SET access_token = ?, refresh_token = ?, expires_at = CURRENT_TIMESTAMP + INTERVAL '$expiresIn seconds',
                            updated_at = CURRENT_TIMESTAMP
                        WHERE provider = ? AND provider_user_id = ?;
                    """.trimIndent()

                    connection.prepareStatement(updateIdentitySql).use { stmt ->
                        stmt.setString(1, accessToken)
                        stmt.setString(2, refreshToken)
                        stmt.setString(3, callback.provider)
                        stmt.setString(4, providerUser.id)
                        stmt.executeUpdate()
                    }

                    existingUserId
                } else {
                    // Check if user with this email exists
                    val findUserSql = """
                        SELECT id FROM auth.users WHERE email = ? AND deleted_at IS NULL;
                    """.trimIndent()

                    val userIdFromEmail = connection.prepareStatement(findUserSql).use { stmt ->
                        stmt.setString(1, providerUser.email)
                        stmt.executeQuery().use { rs ->
                            if (rs.next()) rs.getString("id") else null
                        }
                    }

                    val newUserId = userIdFromEmail ?: run {
                        // Create new user
                        val insertUserSql = """
                            INSERT INTO auth.users (email, email_confirmed)
                            VALUES (?, TRUE)
                            RETURNING id;
                        """.trimIndent()

                        connection.prepareStatement(insertUserSql).use { stmt ->
                            stmt.setString(1, providerUser.email)
                            stmt.executeQuery().use { rs ->
                                rs.next()
                                rs.getString("id")
                            }
                        }
                    }

                    // Create OAuth identity
                    val insertIdentitySql = """
                        INSERT INTO auth.oauth_identities
                        (user_id, provider, provider_user_id, provider_email, access_token, refresh_token, expires_at)
                        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP + INTERVAL '$expiresIn seconds');
                    """.trimIndent()

                    connection.prepareStatement(insertIdentitySql).use { stmt ->
                        stmt.setObject(1, UUID.fromString(newUserId))
                        stmt.setString(2, callback.provider)
                        stmt.setString(3, providerUser.id)
                        stmt.setString(4, providerUser.email)
                        stmt.setString(5, accessToken)
                        stmt.setString(6, refreshToken)
                        stmt.executeUpdate()
                    }

                    newUserId
                }

                // Update last sign in
                val updateLastSignInSql = """
                    UPDATE auth.users
                    SET last_sign_in_at = CURRENT_TIMESTAMP
                    WHERE id = ?;
                """.trimIndent()

                connection.prepareStatement(updateLastSignInSql).use { stmt ->
                    stmt.setObject(1, UUID.fromString(userId))
                    stmt.executeUpdate()
                }

                // Get user profile
                getUserProfile(connection, userId)
            }

            // Generate session tokens
            val tokens = authManager.generateTokens(user)

            // Store refresh token
            dbManager.transaction { connection ->
                storeRefreshToken(connection, user.id, tokens.refreshToken)

                // Audit log
                logAuditEvent(connection, user.id, "OAUTH_SIGNIN", mapOf("provider" to callback.provider))
            }

            ApiResponse(data = tokens)
        } catch (e: Exception) {
            logger.error(e) { "Error handling OAuth callback" }
            ApiResponse(error = ApiError("OAUTH_ERROR", e.message ?: "OAuth authentication failed"))
        }
    }

    /**
     * Unlink OAuth provider
     */
    suspend fun unlinkProvider(userId: String, provider: String): ApiResponse<Unit> {
        return try {
            dbManager.transaction { connection ->
                val deleteSql = """
                    DELETE FROM auth.oauth_identities
                    WHERE user_id = ? AND provider = ?;
                """.trimIndent()

                val deleted = connection.prepareStatement(deleteSql).use { stmt ->
                    stmt.setObject(1, UUID.fromString(userId))
                    stmt.setString(2, provider)
                    stmt.executeUpdate()
                }

                if (deleted == 0) {
                    throw Exception("OAuth provider not linked to this account")
                }

                // Audit log
                logAuditEvent(connection, userId, "OAUTH_UNLINKED", mapOf("provider" to provider))
            }

            ApiResponse(data = Unit)
        } catch (e: Exception) {
            logger.error(e) { "Error unlinking OAuth provider" }
            ApiResponse(error = ApiError("OAUTH_ERROR", e.message ?: "Failed to unlink provider"))
        }
    }

    /**
     * List linked OAuth providers for a user
     */
    suspend fun listLinkedProviders(userId: String): ApiResponse<List<String>> {
        return try {
            val providers = dbManager.withConnection { connection ->
                val sql = """
                    SELECT provider
                    FROM auth.oauth_identities
                    WHERE user_id = ?
                    ORDER BY created_at DESC;
                """.trimIndent()

                connection.prepareStatement(sql).use { stmt ->
                    stmt.setObject(1, UUID.fromString(userId))
                    stmt.executeQuery().use { rs ->
                        val results = mutableListOf<String>()
                        while (rs.next()) {
                            results.add(rs.getString("provider"))
                        }
                        results
                    }
                }
            }

            ApiResponse(data = providers)
        } catch (e: Exception) {
            logger.error(e) { "Error listing linked providers" }
            ApiResponse(error = ApiError("OAUTH_ERROR", e.message ?: "Failed to list providers"))
        }
    }

    // Provider-specific URL builders

    private fun buildGoogleAuthUrl(config: AuthProviderConfig, state: String): String {
        val params = mapOf(
            "client_id" to config.clientId,
            "redirect_uri" to config.redirectUrl,
            "response_type" to "code",
            "scope" to config.scopes.ifEmpty { listOf("openid", "email", "profile") }.joinToString(" "),
            "state" to state,
            "access_type" to "offline",
            "prompt" to "consent"
        )

        return "https://accounts.google.com/o/oauth2/v2/auth?" + params.toQueryString()
    }

    private fun buildGitHubAuthUrl(config: AuthProviderConfig, state: String): String {
        val params = mapOf(
            "client_id" to config.clientId,
            "redirect_uri" to config.redirectUrl,
            "scope" to config.scopes.ifEmpty { listOf("user:email") }.joinToString(" "),
            "state" to state
        )

        return "https://github.com/login/oauth/authorize?" + params.toQueryString()
    }

    private fun buildFacebookAuthUrl(config: AuthProviderConfig, state: String): String {
        val params = mapOf(
            "client_id" to config.clientId,
            "redirect_uri" to config.redirectUrl,
            "scope" to config.scopes.ifEmpty { listOf("email", "public_profile") }.joinToString(","),
            "state" to state,
            "response_type" to "code"
        )

        return "https://www.facebook.com/v12.0/dialog/oauth?" + params.toQueryString()
    }

    private fun buildTwitterAuthUrl(config: AuthProviderConfig, state: String): String {
        val params = mapOf(
            "client_id" to config.clientId,
            "redirect_uri" to config.redirectUrl,
            "scope" to config.scopes.ifEmpty { listOf("tweet.read", "users.read") }.joinToString(" "),
            "state" to state,
            "response_type" to "code",
            "code_challenge" to "challenge",
            "code_challenge_method" to "plain"
        )

        return "https://twitter.com/i/oauth2/authorize?" + params.toQueryString()
    }

    private fun buildDiscordAuthUrl(config: AuthProviderConfig, state: String): String {
        val params = mapOf(
            "client_id" to config.clientId,
            "redirect_uri" to config.redirectUrl,
            "response_type" to "code",
            "scope" to config.scopes.ifEmpty { listOf("identify", "email") }.joinToString(" "),
            "state" to state
        )

        return "https://discord.com/api/oauth2/authorize?" + params.toQueryString()
    }

    // Token exchange (simplified - in production, use actual HTTP requests)

    private data class OAuthTokenResponse(
        val accessToken: String,
        val refreshToken: String?,
        val expiresIn: Long
    )

    private fun exchangeCodeForToken(
        provider: String,
        code: String,
        config: AuthProviderConfig
    ): OAuthTokenResponse {
        // In production, make actual HTTP request to provider's token endpoint
        // For now, return mock data
        logger.info { "Exchanging code for token with $provider" }

        return OAuthTokenResponse(
            accessToken = "mock_access_token_$code",
            refreshToken = "mock_refresh_token_$code",
            expiresIn = 3600
        )
    }

    // User info fetching (simplified - in production, use actual HTTP requests)

    private data class ProviderUser(
        val id: String,
        val email: String,
        val name: String?
    )

    private fun getUserInfo(provider: String, accessToken: String): ProviderUser {
        // In production, make actual HTTP request to provider's user info endpoint
        // For now, return mock data
        logger.info { "Fetching user info from $provider" }

        return ProviderUser(
            id = "provider_user_${generateToken(16)}",
            email = "user@example.com",
            name = "Test User"
        )
    }

    // Helper methods

    private fun Map<String, String>.toQueryString(): String {
        return entries.joinToString("&") { (key, value) ->
            "${URLEncoder.encode(key, "UTF-8")}=${URLEncoder.encode(value, "UTF-8")}"
        }
    }

    private fun getUserProfile(connection: java.sql.Connection, userId: String): UserProfile {
        val sql = """
            SELECT
                u.id, u.email, u.phone, u.email_confirmed, u.phone_confirmed,
                u.created_at, u.updated_at, u.last_sign_in_at, u.role, u.banned
            FROM auth.users u
            WHERE u.id = ? AND u.deleted_at IS NULL;
        """.trimIndent()

        return connection.prepareStatement(sql).use { stmt ->
            stmt.setObject(1, UUID.fromString(userId))
            stmt.executeQuery().use { rs ->
                if (!rs.next()) {
                    throw Exception("User not found")
                }

                UserProfile(
                    id = rs.getString("id"),
                    email = rs.getString("email"),
                    phone = rs.getString("phone"),
                    emailConfirmed = rs.getBoolean("email_confirmed"),
                    phoneConfirmed = rs.getBoolean("phone_confirmed"),
                    createdAt = rs.getTimestamp("created_at").toString(),
                    updatedAt = rs.getTimestamp("updated_at").toString(),
                    lastSignInAt = rs.getTimestamp("last_sign_in_at")?.toString(),
                    role = rs.getString("role"),
                    banned = rs.getBoolean("banned")
                )
            }
        }
    }

    private fun storeRefreshToken(connection: java.sql.Connection, userId: String, token: String) {
        val expiresAt = java.time.Instant.now().plusSeconds(2592000) // 30 days
        val sql = """
            INSERT INTO auth.refresh_tokens (token, user_id, expires_at)
            VALUES (?, ?, ?);
        """.trimIndent()

        connection.prepareStatement(sql).use { stmt ->
            stmt.setString(1, token)
            stmt.setObject(2, UUID.fromString(userId))
            stmt.setTimestamp(3, java.sql.Timestamp.from(expiresAt))
            stmt.executeUpdate()
        }
    }

    private fun logAuditEvent(
        connection: java.sql.Connection,
        userId: String,
        action: String,
        metadata: Map<String, String> = emptyMap()
    ) {
        val sql = """
            INSERT INTO auth.audit_log (user_id, action, metadata)
            VALUES (?, ?, ?::jsonb);
        """.trimIndent()

        connection.prepareStatement(sql).use { stmt ->
            stmt.setObject(1, UUID.fromString(userId))
            stmt.setString(2, action)
            stmt.setString(3, if (metadata.isEmpty()) "{}" else json.encodeToString(kotlinx.serialization.serializer(), metadata))
            stmt.executeUpdate()
        }
    }
}

package tools.elide.oss.elidebase.auth

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.auth0.jwt.interfaces.DecodedJWT
import io.github.oshai.kotlinlogging.KotlinLogging
import org.mindrot.jbcrypt.BCrypt
import tools.elide.oss.elidebase.core.*
import tools.elide.oss.elidebase.database.DatabaseManager
import java.time.Instant
import java.util.Date
import java.util.UUID

private val logger = KotlinLogging.logger {}

/**
 * Authentication and user management system
 */
class AuthManager(
    private val dbManager: DatabaseManager,
    private val jwtSecret: String,
    private val jwtIssuer: String = "elidebase",
    private val accessTokenTTL: Long = 3600, // 1 hour
    private val refreshTokenTTL: Long = 2592000 // 30 days
) {

    private val algorithm = Algorithm.HMAC256(jwtSecret)

    init {
        // Initialize auth schema and tables
        kotlinx.coroutines.runBlocking {
            initializeSchema()
        }
    }

    /**
     * Initialize authentication schema
     */
    private suspend fun initializeSchema() {
        val sql = """
            -- Users table
            CREATE TABLE IF NOT EXISTS auth.users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE,
                phone VARCHAR(50) UNIQUE,
                password_hash VARCHAR(255),
                email_confirmed BOOLEAN DEFAULT FALSE,
                phone_confirmed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_sign_in_at TIMESTAMP,
                role VARCHAR(50) DEFAULT 'authenticated',
                banned BOOLEAN DEFAULT FALSE,
                deleted_at TIMESTAMP,
                CONSTRAINT email_or_phone_required CHECK (email IS NOT NULL OR phone IS NOT NULL)
            );

            -- User metadata table
            CREATE TABLE IF NOT EXISTS auth.user_metadata (
                user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
                app_metadata JSONB DEFAULT '{}',
                user_metadata JSONB DEFAULT '{}'
            );

            -- Refresh tokens table
            CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                token VARCHAR(255) UNIQUE NOT NULL,
                user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
                revoked BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL
            );

            -- Email verification tokens
            CREATE TABLE IF NOT EXISTS auth.email_verification_tokens (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                token VARCHAR(255) UNIQUE NOT NULL,
                user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
                email VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                used_at TIMESTAMP
            );

            -- Password reset tokens
            CREATE TABLE IF NOT EXISTS auth.password_reset_tokens (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                token VARCHAR(255) UNIQUE NOT NULL,
                user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                used_at TIMESTAMP
            );

            -- Phone OTP codes
            CREATE TABLE IF NOT EXISTS auth.phone_otp_codes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                phone VARCHAR(50) NOT NULL,
                code VARCHAR(10) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                verified_at TIMESTAMP,
                attempts INT DEFAULT 0
            );

            -- OAuth identities
            CREATE TABLE IF NOT EXISTS auth.oauth_identities (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
                provider VARCHAR(50) NOT NULL,
                provider_user_id VARCHAR(255) NOT NULL,
                provider_email VARCHAR(255),
                access_token TEXT,
                refresh_token TEXT,
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(provider, provider_user_id)
            );

            -- Audit log
            CREATE TABLE IF NOT EXISTS auth.audit_log (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
                action VARCHAR(100) NOT NULL,
                ip_address INET,
                user_agent TEXT,
                metadata JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Create indexes
            CREATE INDEX IF NOT EXISTS idx_users_email ON auth.users(email) WHERE deleted_at IS NULL;
            CREATE INDEX IF NOT EXISTS idx_users_phone ON auth.users(phone) WHERE deleted_at IS NULL;
            CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON auth.refresh_tokens(user_id) WHERE NOT revoked;
            CREATE INDEX IF NOT EXISTS idx_oauth_identities_user ON auth.oauth_identities(user_id);
            CREATE INDEX IF NOT EXISTS idx_audit_log_user ON auth.audit_log(user_id);
            CREATE INDEX IF NOT EXISTS idx_audit_log_created ON auth.audit_log(created_at);
        """.trimIndent()

        dbManager.withConnection { connection ->
            // Create auth schema
            connection.createStatement().execute("CREATE SCHEMA IF NOT EXISTS auth;")

            // Execute table creation
            connection.createStatement().execute(sql)
        }

        logger.info { "Auth schema initialized" }
    }

    /**
     * Sign up with email and password
     */
    suspend fun signUpWithEmail(
        email: String,
        password: String,
        userMetadata: Map<String, String> = emptyMap()
    ): ApiResponse<SessionTokens> {
        if (!isValidEmail(email)) {
            return ApiResponse(error = ApiError("INVALID_EMAIL", "Invalid email format"))
        }

        if (password.length < 6) {
            return ApiResponse(error = ApiError("WEAK_PASSWORD", "Password must be at least 6 characters"))
        }

        return try {
            val userId = UUID.randomUUID().toString()
            val passwordHash = BCrypt.hashpw(password, BCrypt.gensalt())

            dbManager.transaction { connection ->
                // Create user
                val insertUserSql = """
                    INSERT INTO auth.users (id, email, password_hash, email_confirmed)
                    VALUES (?, ?, ?, FALSE)
                    RETURNING id, email, created_at, role;
                """.trimIndent()

                val user = connection.prepareStatement(insertUserSql).use { stmt ->
                    stmt.setObject(1, UUID.fromString(userId))
                    stmt.setString(2, email)
                    stmt.setString(3, passwordHash)
                    stmt.executeQuery().use { rs ->
                        if (rs.next()) {
                            UserProfile(
                                id = rs.getString("id"),
                                email = rs.getString("email"),
                                phone = null,
                                emailConfirmed = false,
                                phoneConfirmed = false,
                                createdAt = rs.getTimestamp("created_at").toString(),
                                updatedAt = rs.getTimestamp("created_at").toString(),
                                role = rs.getString("role"),
                                userMetadata = userMetadata
                            )
                        } else {
                            throw Exception("Failed to create user")
                        }
                    }
                }

                // Store metadata
                if (userMetadata.isNotEmpty()) {
                    val metadataSql = """
                        INSERT INTO auth.user_metadata (user_id, user_metadata)
                        VALUES (?, ?::jsonb);
                    """.trimIndent()

                    connection.prepareStatement(metadataSql).use { stmt ->
                        stmt.setObject(1, UUID.fromString(userId))
                        stmt.setString(2, json.encodeToString(kotlinx.serialization.serializer(), userMetadata))
                        stmt.executeUpdate()
                    }
                }

                // Generate tokens
                val tokens = generateTokens(user)

                // Store refresh token
                storeRefreshToken(connection, userId, tokens.refreshToken)

                // Audit log
                logAuditEvent(connection, userId, "SIGNUP_EMAIL")

                tokens
            }

            // TODO: Send verification email

            ApiResponse(data = dbManager.transaction { connection ->
                generateTokens(getUserProfile(connection, userId))
            })
        } catch (e: Exception) {
            logger.error(e) { "Error during email signup" }
            ApiResponse(error = ApiError("SIGNUP_ERROR", e.message ?: "Signup failed"))
        }
    }

    /**
     * Sign in with email and password
     */
    suspend fun signInWithEmail(email: String, password: String): ApiResponse<SessionTokens> {
        return try {
            dbManager.transaction { connection ->
                // Find user
                val findUserSql = """
                    SELECT id, email, password_hash, email_confirmed, role, banned, deleted_at
                    FROM auth.users
                    WHERE email = ? AND deleted_at IS NULL;
                """.trimIndent()

                val (userId, passwordHash, isBanned) = connection.prepareStatement(findUserSql).use { stmt ->
                    stmt.setString(1, email)
                    stmt.executeQuery().use { rs ->
                        if (!rs.next()) {
                            throw Exception("Invalid email or password")
                        }

                        if (rs.getBoolean("banned")) {
                            throw Exception("Account has been banned")
                        }

                        Triple(
                            rs.getString("id"),
                            rs.getString("password_hash"),
                            rs.getBoolean("banned")
                        )
                    }
                }

                // Verify password
                if (!BCrypt.checkpw(password, passwordHash)) {
                    throw Exception("Invalid email or password")
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
                val user = getUserProfile(connection, userId)

                // Generate tokens
                val tokens = generateTokens(user)

                // Store refresh token
                storeRefreshToken(connection, userId, tokens.refreshToken)

                // Audit log
                logAuditEvent(connection, userId, "SIGNIN_EMAIL")

                ApiResponse(data = tokens)
            }
        } catch (e: Exception) {
            logger.error(e) { "Error during email signin" }
            ApiResponse(error = ApiError("SIGNIN_ERROR", e.message ?: "Sign in failed"))
        }
    }

    /**
     * Sign up/in with magic link
     */
    suspend fun sendMagicLink(request: MagicLinkRequest): ApiResponse<Unit> {
        if (!isValidEmail(request.email)) {
            return ApiResponse(error = ApiError("INVALID_EMAIL", "Invalid email format"))
        }

        return try {
            dbManager.transaction { connection ->
                // Find or create user
                val findUserSql = "SELECT id FROM auth.users WHERE email = ? AND deleted_at IS NULL;"
                val userId = connection.prepareStatement(findUserSql).use { stmt ->
                    stmt.setString(1, request.email)
                    stmt.executeQuery().use { rs ->
                        if (rs.next()) {
                            rs.getString("id")
                        } else {
                            // Create new user
                            val insertSql = """
                                INSERT INTO auth.users (email, email_confirmed)
                                VALUES (?, FALSE)
                                RETURNING id;
                            """.trimIndent()

                            connection.prepareStatement(insertSql).use { insertStmt ->
                                insertStmt.setString(1, request.email)
                                insertStmt.executeQuery().use { insertRs ->
                                    insertRs.next()
                                    insertRs.getString("id")
                                }
                            }
                        }
                    }
                }

                // Generate token
                val token = generateToken(32)
                val expiresAt = Instant.now().plusSeconds(3600) // 1 hour

                // Store verification token
                val insertTokenSql = """
                    INSERT INTO auth.email_verification_tokens (token, user_id, email, expires_at)
                    VALUES (?, ?, ?, ?);
                """.trimIndent()

                connection.prepareStatement(insertTokenSql).use { stmt ->
                    stmt.setString(1, token)
                    stmt.setObject(2, UUID.fromString(userId))
                    stmt.setString(3, request.email)
                    stmt.setTimestamp(4, java.sql.Timestamp.from(expiresAt))
                    stmt.executeUpdate()
                }

                // TODO: Send email with magic link
                logger.info { "Magic link sent to ${request.email}: $token" }

                // Audit log
                logAuditEvent(connection, userId, "MAGIC_LINK_SENT")
            }

            ApiResponse(data = Unit)
        } catch (e: Exception) {
            logger.error(e) { "Error sending magic link" }
            ApiResponse(error = ApiError("MAGIC_LINK_ERROR", e.message ?: "Failed to send magic link"))
        }
    }

    /**
     * Verify magic link token
     */
    suspend fun verifyMagicLink(token: String): ApiResponse<SessionTokens> {
        return try {
            dbManager.transaction { connection ->
                // Find and validate token
                val findTokenSql = """
                    SELECT user_id, expires_at, used_at
                    FROM auth.email_verification_tokens
                    WHERE token = ?;
                """.trimIndent()

                val userId = connection.prepareStatement(findTokenSql).use { stmt ->
                    stmt.setString(1, token)
                    stmt.executeQuery().use { rs ->
                        if (!rs.next()) {
                            throw Exception("Invalid or expired token")
                        }

                        if (rs.getTimestamp("used_at") != null) {
                            throw Exception("Token has already been used")
                        }

                        if (rs.getTimestamp("expires_at").before(java.sql.Timestamp.from(Instant.now()))) {
                            throw Exception("Token has expired")
                        }

                        rs.getString("user_id")
                    }
                }

                // Mark token as used
                val updateTokenSql = """
                    UPDATE auth.email_verification_tokens
                    SET used_at = CURRENT_TIMESTAMP
                    WHERE token = ?;
                """.trimIndent()

                connection.prepareStatement(updateTokenSql).use { stmt ->
                    stmt.setString(1, token)
                    stmt.executeUpdate()
                }

                // Mark email as confirmed
                val updateUserSql = """
                    UPDATE auth.users
                    SET email_confirmed = TRUE, last_sign_in_at = CURRENT_TIMESTAMP
                    WHERE id = ?;
                """.trimIndent()

                connection.prepareStatement(updateUserSql).use { stmt ->
                    stmt.setObject(1, UUID.fromString(userId))
                    stmt.executeUpdate()
                }

                // Get user profile
                val user = getUserProfile(connection, userId)

                // Generate tokens
                val tokens = generateTokens(user)

                // Store refresh token
                storeRefreshToken(connection, userId, tokens.refreshToken)

                // Audit log
                logAuditEvent(connection, userId, "MAGIC_LINK_VERIFIED")

                ApiResponse(data = tokens)
            }
        } catch (e: Exception) {
            logger.error(e) { "Error verifying magic link" }
            ApiResponse(error = ApiError("VERIFICATION_ERROR", e.message ?: "Verification failed"))
        }
    }

    /**
     * Send phone OTP
     */
    suspend fun sendPhoneOTP(request: PhoneOTPRequest): ApiResponse<Unit> {
        if (!isValidPhone(request.phone)) {
            return ApiResponse(error = ApiError("INVALID_PHONE", "Invalid phone number format (use E.164)"))
        }

        return try {
            dbManager.transaction { connection ->
                // Generate OTP
                val otp = generateOTP(6)
                val expiresAt = Instant.now().plusSeconds(300) // 5 minutes

                // Store OTP
                val insertOTPSql = """
                    INSERT INTO auth.phone_otp_codes (phone, code, expires_at)
                    VALUES (?, ?, ?);
                """.trimIndent()

                connection.prepareStatement(insertOTPSql).use { stmt ->
                    stmt.setString(1, request.phone)
                    stmt.setString(2, otp)
                    stmt.setTimestamp(3, java.sql.Timestamp.from(expiresAt))
                    stmt.executeUpdate()
                }

                // TODO: Send SMS with OTP
                logger.info { "OTP sent to ${request.phone}: $otp" }
            }

            ApiResponse(data = Unit)
        } catch (e: Exception) {
            logger.error(e) { "Error sending phone OTP" }
            ApiResponse(error = ApiError("OTP_ERROR", e.message ?: "Failed to send OTP"))
        }
    }

    /**
     * Verify phone OTP
     */
    suspend fun verifyPhoneOTP(request: PhoneOTPVerify): ApiResponse<SessionTokens> {
        return try {
            dbManager.transaction { connection ->
                // Find and validate OTP
                val findOTPSql = """
                    SELECT id, code, expires_at, verified_at, attempts
                    FROM auth.phone_otp_codes
                    WHERE phone = ?
                    ORDER BY created_at DESC
                    LIMIT 1;
                """.trimIndent()

                val otpId = connection.prepareStatement(findOTPSql).use { stmt ->
                    stmt.setString(1, request.phone)
                    stmt.executeQuery().use { rs ->
                        if (!rs.next()) {
                            throw Exception("No OTP found for this phone number")
                        }

                        if (rs.getTimestamp("verified_at") != null) {
                            throw Exception("OTP has already been used")
                        }

                        if (rs.getTimestamp("expires_at").before(java.sql.Timestamp.from(Instant.now()))) {
                            throw Exception("OTP has expired")
                        }

                        if (rs.getInt("attempts") >= 3) {
                            throw Exception("Too many attempts")
                        }

                        if (rs.getString("code") != request.token) {
                            // Increment attempts
                            val updateAttemptsSql = "UPDATE auth.phone_otp_codes SET attempts = attempts + 1 WHERE id = ?;"
                            connection.prepareStatement(updateAttemptsSql).use { updateStmt ->
                                updateStmt.setObject(1, UUID.fromString(rs.getString("id")))
                                updateStmt.executeUpdate()
                            }
                            throw Exception("Invalid OTP code")
                        }

                        rs.getString("id")
                    }
                }

                // Mark OTP as verified
                val updateOTPSql = """
                    UPDATE auth.phone_otp_codes
                    SET verified_at = CURRENT_TIMESTAMP
                    WHERE id = ?;
                """.trimIndent()

                connection.prepareStatement(updateOTPSql).use { stmt ->
                    stmt.setObject(1, UUID.fromString(otpId))
                    stmt.executeUpdate()
                }

                // Find or create user
                val findUserSql = "SELECT id FROM auth.users WHERE phone = ? AND deleted_at IS NULL;"
                val userId = connection.prepareStatement(findUserSql).use { stmt ->
                    stmt.setString(1, request.phone)
                    stmt.executeQuery().use { rs ->
                        if (rs.next()) {
                            rs.getString("id")
                        } else {
                            // Create new user
                            val insertSql = """
                                INSERT INTO auth.users (phone, phone_confirmed)
                                VALUES (?, TRUE)
                                RETURNING id;
                            """.trimIndent()

                            connection.prepareStatement(insertSql).use { insertStmt ->
                                insertStmt.setString(1, request.phone)
                                insertStmt.executeQuery().use { insertRs ->
                                    insertRs.next()
                                    insertRs.getString("id")
                                }
                            }
                        }
                    }
                }

                // Update last sign in
                val updateUserSql = """
                    UPDATE auth.users
                    SET phone_confirmed = TRUE, last_sign_in_at = CURRENT_TIMESTAMP
                    WHERE id = ?;
                """.trimIndent()

                connection.prepareStatement(updateUserSql).use { stmt ->
                    stmt.setObject(1, UUID.fromString(userId))
                    stmt.executeUpdate()
                }

                // Get user profile
                val user = getUserProfile(connection, userId)

                // Generate tokens
                val tokens = generateTokens(user)

                // Store refresh token
                storeRefreshToken(connection, userId, tokens.refreshToken)

                // Audit log
                logAuditEvent(connection, userId, "PHONE_OTP_VERIFIED")

                ApiResponse(data = tokens)
            }
        } catch (e: Exception) {
            logger.error(e) { "Error verifying phone OTP" }
            ApiResponse(error = ApiError("VERIFICATION_ERROR", e.message ?: "Verification failed"))
        }
    }

    /**
     * Request password reset
     */
    suspend fun requestPasswordReset(request: PasswordResetRequest): ApiResponse<Unit> {
        return try {
            dbManager.transaction { connection ->
                // Find user
                val findUserSql = "SELECT id FROM auth.users WHERE email = ? AND deleted_at IS NULL;"
                val userId = connection.prepareStatement(findUserSql).use { stmt ->
                    stmt.setString(1, request.email)
                    stmt.executeQuery().use { rs ->
                        if (rs.next()) {
                            rs.getString("id")
                        } else {
                            // Don't reveal if email exists
                            return@transaction
                        }
                    }
                }

                // Generate reset token
                val token = generateToken(32)
                val expiresAt = Instant.now().plusSeconds(3600) // 1 hour

                // Store reset token
                val insertTokenSql = """
                    INSERT INTO auth.password_reset_tokens (token, user_id, expires_at)
                    VALUES (?, ?, ?);
                """.trimIndent()

                connection.prepareStatement(insertTokenSql).use { stmt ->
                    stmt.setString(1, token)
                    stmt.setObject(2, UUID.fromString(userId))
                    stmt.setTimestamp(3, java.sql.Timestamp.from(expiresAt))
                    stmt.executeUpdate()
                }

                // TODO: Send password reset email
                logger.info { "Password reset email sent to ${request.email}: $token" }

                // Audit log
                logAuditEvent(connection, userId, "PASSWORD_RESET_REQUESTED")
            }

            ApiResponse(data = Unit)
        } catch (e: Exception) {
            logger.error(e) { "Error requesting password reset" }
            ApiResponse(error = ApiError("PASSWORD_RESET_ERROR", e.message ?: "Failed to request password reset"))
        }
    }

    /**
     * Confirm password reset
     */
    suspend fun confirmPasswordReset(request: PasswordResetConfirm): ApiResponse<Unit> {
        if (request.password.length < 6) {
            return ApiResponse(error = ApiError("WEAK_PASSWORD", "Password must be at least 6 characters"))
        }

        return try {
            dbManager.transaction { connection ->
                // Find and validate token
                val findTokenSql = """
                    SELECT user_id, expires_at, used_at
                    FROM auth.password_reset_tokens
                    WHERE token = ?;
                """.trimIndent()

                val userId = connection.prepareStatement(findTokenSql).use { stmt ->
                    stmt.setString(1, request.token)
                    stmt.executeQuery().use { rs ->
                        if (!rs.next()) {
                            throw Exception("Invalid or expired token")
                        }

                        if (rs.getTimestamp("used_at") != null) {
                            throw Exception("Token has already been used")
                        }

                        if (rs.getTimestamp("expires_at").before(java.sql.Timestamp.from(Instant.now()))) {
                            throw Exception("Token has expired")
                        }

                        rs.getString("user_id")
                    }
                }

                // Mark token as used
                val updateTokenSql = """
                    UPDATE auth.password_reset_tokens
                    SET used_at = CURRENT_TIMESTAMP
                    WHERE token = ?;
                """.trimIndent()

                connection.prepareStatement(updateTokenSql).use { stmt ->
                    stmt.setString(1, request.token)
                    stmt.executeUpdate()
                }

                // Update password
                val passwordHash = BCrypt.hashpw(request.password, BCrypt.gensalt())
                val updatePasswordSql = """
                    UPDATE auth.users
                    SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?;
                """.trimIndent()

                connection.prepareStatement(updatePasswordSql).use { stmt ->
                    stmt.setString(1, passwordHash)
                    stmt.setObject(2, UUID.fromString(userId))
                    stmt.executeUpdate()
                }

                // Revoke all refresh tokens
                val revokeSql = """
                    UPDATE auth.refresh_tokens
                    SET revoked = TRUE
                    WHERE user_id = ?;
                """.trimIndent()

                connection.prepareStatement(revokeSql).use { stmt ->
                    stmt.setObject(1, UUID.fromString(userId))
                    stmt.executeUpdate()
                }

                // Audit log
                logAuditEvent(connection, userId, "PASSWORD_RESET_CONFIRMED")
            }

            ApiResponse(data = Unit)
        } catch (e: Exception) {
            logger.error(e) { "Error confirming password reset" }
            ApiResponse(error = ApiError("PASSWORD_RESET_ERROR", e.message ?: "Failed to reset password"))
        }
    }

    /**
     * Refresh access token
     */
    suspend fun refreshAccessToken(request: RefreshTokenRequest): ApiResponse<SessionTokens> {
        return try {
            dbManager.transaction { connection ->
                // Validate refresh token
                val findTokenSql = """
                    SELECT user_id, expires_at, revoked
                    FROM auth.refresh_tokens
                    WHERE token = ?;
                """.trimIndent()

                val userId = connection.prepareStatement(findTokenSql).use { stmt ->
                    stmt.setString(1, request.refreshToken)
                    stmt.executeQuery().use { rs ->
                        if (!rs.next()) {
                            throw Exception("Invalid refresh token")
                        }

                        if (rs.getBoolean("revoked")) {
                            throw Exception("Refresh token has been revoked")
                        }

                        if (rs.getTimestamp("expires_at").before(java.sql.Timestamp.from(Instant.now()))) {
                            throw Exception("Refresh token has expired")
                        }

                        rs.getString("user_id")
                    }
                }

                // Get user profile
                val user = getUserProfile(connection, userId)

                // Generate new tokens
                val tokens = generateTokens(user)

                // Revoke old refresh token
                val revokeSql = "UPDATE auth.refresh_tokens SET revoked = TRUE WHERE token = ?;"
                connection.prepareStatement(revokeSql).use { stmt ->
                    stmt.setString(1, request.refreshToken)
                    stmt.executeUpdate()
                }

                // Store new refresh token
                storeRefreshToken(connection, userId, tokens.refreshToken)

                // Audit log
                logAuditEvent(connection, userId, "TOKEN_REFRESHED")

                ApiResponse(data = tokens)
            }
        } catch (e: Exception) {
            logger.error(e) { "Error refreshing token" }
            ApiResponse(error = ApiError("TOKEN_REFRESH_ERROR", e.message ?: "Failed to refresh token"))
        }
    }

    /**
     * Sign out (revoke refresh token)
     */
    suspend fun signOut(refreshToken: String): ApiResponse<Unit> {
        return try {
            dbManager.transaction { connection ->
                val revokeSql = "UPDATE auth.refresh_tokens SET revoked = TRUE WHERE token = ?;"
                connection.prepareStatement(revokeSql).use { stmt ->
                    stmt.setString(1, refreshToken)
                    stmt.executeUpdate()
                }
            }

            ApiResponse(data = Unit)
        } catch (e: Exception) {
            logger.error(e) { "Error signing out" }
            ApiResponse(error = ApiError("SIGNOUT_ERROR", e.message ?: "Failed to sign out"))
        }
    }

    /**
     * Verify JWT token
     */
    fun verifyToken(token: String): DecodedJWT? {
        return try {
            val verifier = JWT.require(algorithm)
                .withIssuer(jwtIssuer)
                .build()
            verifier.verify(token)
        } catch (e: Exception) {
            logger.warn { "Invalid JWT token: ${e.message}" }
            null
        }
    }

    /**
     * Generate JWT tokens
     */
    private fun generateTokens(user: UserProfile): SessionTokens {
        val now = Date()
        val accessExpiry = Date(now.time + (accessTokenTTL * 1000))
        val refreshExpiry = Date(now.time + (refreshTokenTTL * 1000))

        val accessToken = JWT.create()
            .withIssuer(jwtIssuer)
            .withSubject(user.id)
            .withClaim("email", user.email)
            .withClaim("role", user.role)
            .withIssuedAt(now)
            .withExpiresAt(accessExpiry)
            .sign(algorithm)

        val refreshToken = generateToken(64)

        return SessionTokens(
            accessToken = accessToken,
            refreshToken = refreshToken,
            expiresIn = accessTokenTTL,
            user = user
        )
    }

    /**
     * Store refresh token
     */
    private fun storeRefreshToken(connection: java.sql.Connection, userId: String, token: String) {
        val expiresAt = Instant.now().plusSeconds(refreshTokenTTL)
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

    /**
     * Get user profile
     */
    private fun getUserProfile(connection: java.sql.Connection, userId: String): UserProfile {
        val sql = """
            SELECT
                u.id, u.email, u.phone, u.email_confirmed, u.phone_confirmed,
                u.created_at, u.updated_at, u.last_sign_in_at, u.role, u.banned,
                m.app_metadata, m.user_metadata
            FROM auth.users u
            LEFT JOIN auth.user_metadata m ON u.id = m.user_id
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

    /**
     * Log audit event
     */
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

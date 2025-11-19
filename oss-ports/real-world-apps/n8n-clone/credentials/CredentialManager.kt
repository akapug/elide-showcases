package dev.elide.workflow.credentials

import com.google.crypto.tink.*
import com.google.crypto.tink.aead.AeadConfig
import com.google.crypto.tink.aead.AeadKeyTemplates
import dev.elide.workflow.models.Credential
import dev.elide.workflow.database.Credentials
import dev.elide.workflow.execution.CredentialProvider
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import kotlinx.serialization.json.*
import kotlinx.serialization.encodeToString
import kotlinx.serialization.decodeFromString
import java.time.Instant
import java.util.UUID
import java.util.Base64

/**
 * Credential manager with encryption
 */
class CredentialManager(
    private val encryptionKey: String = generateDefaultKey()
) : CredentialProvider {
    private val json = Json { ignoreUnknownKeys = true }
    private val aead: Aead

    init {
        // Initialize Tink for encryption
        AeadConfig.register()

        // Create or load encryption key
        val keysetHandle = if (encryptionKey.isNotEmpty()) {
            try {
                // In production, load from secure storage
                KeysetHandle.generateNew(AeadKeyTemplates.AES256_GCM)
            } catch (e: Exception) {
                KeysetHandle.generateNew(AeadKeyTemplates.AES256_GCM)
            }
        } else {
            KeysetHandle.generateNew(AeadKeyTemplates.AES256_GCM)
        }

        aead = keysetHandle.getPrimitive(Aead::class.java)
    }

    /**
     * Create or update a credential
     */
    suspend fun saveCredential(
        name: String,
        type: String,
        data: JsonObject,
        userId: String? = null
    ): Credential {
        val encryptedData = encryptData(json.encodeToString(data))

        val credential = Credential(
            id = UUID.randomUUID().toString(),
            name = name,
            type = type,
            data = encryptedData,
            createdAt = Instant.now(),
            updatedAt = Instant.now(),
            createdBy = userId
        )

        transaction {
            Credentials.insert {
                it[id] = UUID.fromString(credential.id)
                it[Credentials.name] = credential.name
                it[Credentials.type] = credential.type
                it[Credentials.data] = credential.data
                it[createdAt] = credential.createdAt
                it[updatedAt] = credential.updatedAt
                it[createdBy] = credential.createdBy
            }
        }

        return credential
    }

    /**
     * Get credential by ID (implements CredentialProvider)
     */
    override suspend fun getCredential(id: String): Map<String, Any>? {
        val credential = getCredentialById(id) ?: return null

        val decryptedData = decryptData(credential.data)
        return json.decodeFromString<Map<String, JsonElement>>(decryptedData)
            .mapValues { (_, value) ->
                when (value) {
                    is JsonPrimitive -> {
                        when {
                            value.isString -> value.content
                            value.booleanOrNull != null -> value.booleanOrNull!!
                            value.intOrNull != null -> value.intOrNull!!
                            value.longOrNull != null -> value.longOrNull!!
                            value.doubleOrNull != null -> value.doubleOrNull!!
                            else -> value.content
                        }
                    }
                    is JsonObject -> value
                    is JsonArray -> value
                    else -> value.toString()
                }
            }
    }

    /**
     * Get credential metadata by ID
     */
    suspend fun getCredentialById(id: String): Credential? {
        return transaction {
            Credentials.select { Credentials.id eq UUID.fromString(id) }
                .map { rowToCredential(it) }
                .singleOrNull()
        }
    }

    /**
     * Get all credentials (returns metadata only, not decrypted data)
     */
    suspend fun getAllCredentials(type: String? = null): List<Credential> {
        return transaction {
            val query = if (type != null) {
                Credentials.select { Credentials.type eq type }
            } else {
                Credentials.selectAll()
            }

            query.map { rowToCredential(it) }
        }
    }

    /**
     * Update credential
     */
    suspend fun updateCredential(
        id: String,
        name: String? = null,
        data: JsonObject? = null
    ) {
        transaction {
            Credentials.update({ Credentials.id eq UUID.fromString(id) }) {
                if (name != null) {
                    it[Credentials.name] = name
                }
                if (data != null) {
                    it[Credentials.data] = encryptData(json.encodeToString(data))
                }
                it[updatedAt] = Instant.now()
            }
        }
    }

    /**
     * Delete credential
     */
    suspend fun deleteCredential(id: String) {
        transaction {
            Credentials.deleteWhere { Credentials.id eq UUID.fromString(id) }
        }
    }

    /**
     * Encrypt data using Tink
     */
    private fun encryptData(plaintext: String): String {
        val ciphertext = aead.encrypt(plaintext.toByteArray(), null)
        return Base64.getEncoder().encodeToString(ciphertext)
    }

    /**
     * Decrypt data using Tink
     */
    private fun decryptData(ciphertext: String): String {
        val encrypted = Base64.getDecoder().decode(ciphertext)
        val plaintext = aead.decrypt(encrypted, null)
        return String(plaintext)
    }

    private fun rowToCredential(row: ResultRow): Credential {
        return Credential(
            id = row[Credentials.id].toString(),
            name = row[Credentials.name],
            type = row[Credentials.type],
            data = row[Credentials.data],
            createdAt = row[Credentials.createdAt],
            updatedAt = row[Credentials.updatedAt],
            createdBy = row[Credentials.createdBy]
        )
    }

    companion object {
        private fun generateDefaultKey(): String {
            // In production, generate and store securely
            return "default-encryption-key-change-in-production"
        }
    }
}

/**
 * Credential type definitions
 */
object CredentialTypes {
    val HTTP_BASIC_AUTH = CredentialTypeDefinition(
        name = "httpBasicAuth",
        displayName = "HTTP Basic Auth",
        properties = listOf(
            CredentialProperty("user", "User", "string", required = true),
            CredentialProperty("password", "Password", "string", required = true, type = "password")
        )
    )

    val OAUTH2 = CredentialTypeDefinition(
        name = "oAuth2Api",
        displayName = "OAuth2 API",
        properties = listOf(
            CredentialProperty("authUrl", "Authorization URL", "string", required = true),
            CredentialProperty("accessTokenUrl", "Access Token URL", "string", required = true),
            CredentialProperty("clientId", "Client ID", "string", required = true),
            CredentialProperty("clientSecret", "Client Secret", "string", required = true, type = "password"),
            CredentialProperty("scope", "Scope", "string"),
            CredentialProperty("authQueryParameters", "Auth Query Parameters", "string")
        )
    )

    val API_KEY = CredentialTypeDefinition(
        name = "apiKey",
        displayName = "API Key",
        properties = listOf(
            CredentialProperty("apiKey", "API Key", "string", required = true, type = "password")
        )
    )

    val SMTP = CredentialTypeDefinition(
        name = "smtp",
        displayName = "SMTP",
        properties = listOf(
            CredentialProperty("host", "Host", "string", required = true),
            CredentialProperty("port", "Port", "number", required = true, default = 587),
            CredentialProperty("user", "User", "string", required = true),
            CredentialProperty("password", "Password", "string", required = true, type = "password"),
            CredentialProperty("secure", "SSL/TLS", "boolean", default = true)
        )
    )

    val POSTGRES = CredentialTypeDefinition(
        name = "postgres",
        displayName = "PostgreSQL",
        properties = listOf(
            CredentialProperty("host", "Host", "string", required = true, default = "localhost"),
            CredentialProperty("port", "Port", "number", required = true, default = 5432),
            CredentialProperty("database", "Database", "string", required = true),
            CredentialProperty("user", "User", "string", required = true),
            CredentialProperty("password", "Password", "string", required = true, type = "password"),
            CredentialProperty("ssl", "SSL", "boolean", default = false)
        )
    )

    val MYSQL = CredentialTypeDefinition(
        name = "mysql",
        displayName = "MySQL",
        properties = listOf(
            CredentialProperty("host", "Host", "string", required = true, default = "localhost"),
            CredentialProperty("port", "Port", "number", required = true, default = 3306),
            CredentialProperty("database", "Database", "string", required = true),
            CredentialProperty("user", "User", "string", required = true),
            CredentialProperty("password", "Password", "string", required = true, type = "password")
        )
    )

    val MONGODB = CredentialTypeDefinition(
        name = "mongodb",
        displayName = "MongoDB",
        properties = listOf(
            CredentialProperty("connectionString", "Connection String", "string", required = true,
                placeholder = "mongodb://localhost:27017"),
            CredentialProperty("database", "Database", "string", required = true)
        )
    )

    val SLACK = CredentialTypeDefinition(
        name = "slackApi",
        displayName = "Slack API",
        properties = listOf(
            CredentialProperty("accessToken", "Access Token", "string", required = true, type = "password")
        )
    )

    val GITHUB = CredentialTypeDefinition(
        name = "githubApi",
        displayName = "GitHub API",
        properties = listOf(
            CredentialProperty("accessToken", "Access Token", "string", required = true, type = "password")
        )
    )

    val STRIPE = CredentialTypeDefinition(
        name = "stripeApi",
        displayName = "Stripe API",
        properties = listOf(
            CredentialProperty("apiKey", "Secret Key", "string", required = true, type = "password")
        )
    )

    val AWS = CredentialTypeDefinition(
        name = "aws",
        displayName = "AWS",
        properties = listOf(
            CredentialProperty("accessKeyId", "Access Key ID", "string", required = true),
            CredentialProperty("secretAccessKey", "Secret Access Key", "string", required = true, type = "password"),
            CredentialProperty("region", "Region", "string", default = "us-east-1")
        )
    )

    val GOOGLE_SHEETS = CredentialTypeDefinition(
        name = "googleSheetsOAuth2Api",
        displayName = "Google Sheets OAuth2 API",
        properties = listOf(
            CredentialProperty("clientId", "Client ID", "string", required = true),
            CredentialProperty("clientSecret", "Client Secret", "string", required = true, type = "password"),
            CredentialProperty("accessToken", "Access Token", "string"),
            CredentialProperty("refreshToken", "Refresh Token", "string")
        )
    )

    // Registry of all credential types
    val ALL_TYPES = listOf(
        HTTP_BASIC_AUTH,
        OAUTH2,
        API_KEY,
        SMTP,
        POSTGRES,
        MYSQL,
        MONGODB,
        SLACK,
        GITHUB,
        STRIPE,
        AWS,
        GOOGLE_SHEETS
    )
}

data class CredentialTypeDefinition(
    val name: String,
    val displayName: String,
    val properties: List<CredentialProperty>
)

data class CredentialProperty(
    val name: String,
    val displayName: String,
    val type: String, // string, number, boolean, password
    val required: Boolean = false,
    val default: Any? = null,
    val placeholder: String? = null
)

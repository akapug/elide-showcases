package tools.elide.oss.elidebase.core

import io.github.oshai.kotlinlogging.KotlinLogging
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.security.MessageDigest
import java.security.SecureRandom
import java.time.Instant
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import java.util.Base64
import javax.crypto.Cipher
import javax.crypto.spec.SecretKeySpec
import kotlin.random.Random

private val logger = KotlinLogging.logger {}

/**
 * JSON configuration for serialization
 */
val json = Json {
    prettyPrint = false
    ignoreUnknownKeys = true
    encodeDefaults = true
    isLenient = true
}

/**
 * Generate a secure random token
 */
fun generateToken(length: Int = 32): String {
    val random = SecureRandom()
    val bytes = ByteArray(length)
    random.nextBytes(bytes)
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
}

/**
 * Generate a UUID v4
 */
fun generateUUID(): String = java.util.UUID.randomUUID().toString()

/**
 * Hash a password using SHA-256
 */
fun hashPassword(password: String, salt: String = generateToken(16)): Pair<String, String> {
    val digest = MessageDigest.getInstance("SHA-256")
    val hash = digest.digest("$password$salt".toByteArray())
    val hashString = Base64.getEncoder().encodeToString(hash)
    return hashString to salt
}

/**
 * Verify a password against a hash
 */
fun verifyPassword(password: String, hash: String, salt: String): Boolean {
    val (computedHash, _) = hashPassword(password, salt)
    return computedHash == hash
}

/**
 * Format timestamp to ISO 8601
 */
fun formatTimestamp(instant: Instant = Instant.now()): String {
    return DateTimeFormatter.ISO_INSTANT.format(instant)
}

/**
 * Parse ISO 8601 timestamp
 */
fun parseTimestamp(timestamp: String): Instant {
    return Instant.parse(timestamp)
}

/**
 * Generate a slug from a string
 */
fun String.toSlug(): String {
    return this.lowercase()
        .replace(Regex("[^a-z0-9\\s-]"), "")
        .replace(Regex("\\s+"), "-")
        .replace(Regex("-+"), "-")
        .trim('-')
}

/**
 * Validate email format
 */
fun isValidEmail(email: String): Boolean {
    val emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$".toRegex()
    return emailRegex.matches(email)
}

/**
 * Validate phone number format (E.164)
 */
fun isValidPhone(phone: String): Boolean {
    val phoneRegex = "^\\+[1-9]\\d{1,14}$".toRegex()
    return phoneRegex.matches(phone)
}

/**
 * Generate a random OTP code
 */
fun generateOTP(length: Int = 6): String {
    return (1..length)
        .map { Random.nextInt(0, 10) }
        .joinToString("")
}

/**
 * Encrypt data using AES
 */
fun encrypt(data: String, key: String): String {
    val cipher = Cipher.getInstance("AES/ECB/PKCS5Padding")
    val secretKey = SecretKeySpec(key.toByteArray().copyOf(16), "AES")
    cipher.init(Cipher.ENCRYPT_MODE, secretKey)
    val encrypted = cipher.doFinal(data.toByteArray())
    return Base64.getEncoder().encodeToString(encrypted)
}

/**
 * Decrypt data using AES
 */
fun decrypt(encryptedData: String, key: String): String {
    val cipher = Cipher.getInstance("AES/ECB/PKCS5Padding")
    val secretKey = SecretKeySpec(key.toByteArray().copyOf(16), "AES")
    cipher.init(Cipher.DECRYPT_MODE, secretKey)
    val decrypted = cipher.doFinal(Base64.getDecoder().decode(encryptedData))
    return String(decrypted)
}

/**
 * Calculate file hash (SHA-256)
 */
fun calculateFileHash(data: ByteArray): String {
    val digest = MessageDigest.getInstance("SHA-256")
    val hash = digest.digest(data)
    return hash.joinToString("") { "%02x".format(it) }
}

/**
 * Generate ETag for file
 */
fun generateETag(data: ByteArray): String {
    return "\"${calculateFileHash(data)}\""
}

/**
 * Parse range header (for resumable uploads)
 */
fun parseRangeHeader(rangeHeader: String?): Pair<Long, Long>? {
    if (rangeHeader == null) return null
    val regex = """bytes=(\d+)-(\d+)?""".toRegex()
    val match = regex.find(rangeHeader) ?: return null
    val start = match.groupValues[1].toLongOrNull() ?: return null
    val end = match.groupValues[2].toLongOrNull()
    return start to (end ?: Long.MAX_VALUE)
}

/**
 * Sanitize SQL identifier
 */
fun sanitizeSqlIdentifier(identifier: String): String {
    return identifier.replace(Regex("[^a-zA-Z0-9_]"), "")
}

/**
 * Build SQL WHERE clause from filters
 */
fun buildWhereClause(filters: List<QueryFilter>): String {
    if (filters.isEmpty()) return ""

    return filters.joinToString(" AND ") { filter ->
        val column = sanitizeSqlIdentifier(filter.column)
        when (filter.operator.uppercase()) {
            "EQ" -> "$column = '${filter.value.replace("'", "''")}'"
            "NEQ" -> "$column != '${filter.value.replace("'", "''")}'"
            "GT" -> "$column > '${filter.value.replace("'", "''")}'"
            "GTE" -> "$column >= '${filter.value.replace("'", "''")}'"
            "LT" -> "$column < '${filter.value.replace("'", "''")}'"
            "LTE" -> "$column <= '${filter.value.replace("'", "''")}'"
            "LIKE" -> "$column LIKE '${filter.value.replace("'", "''")}'"
            "ILIKE" -> "$column ILIKE '${filter.value.replace("'", "''")}'"
            "IS" -> "$column IS ${filter.value.uppercase()}"
            "IN" -> {
                val values = filter.value.split(",").joinToString(",") { "'${it.trim().replace("'", "''")}'" }
                "$column IN ($values)"
            }
            else -> "$column = '${filter.value.replace("'", "''")}'"
        }
    }
}

/**
 * Build SQL ORDER BY clause from sort params
 */
fun buildOrderByClause(sorts: List<SortParam>): String {
    if (sorts.isEmpty()) return ""

    return sorts.joinToString(", ") { sort ->
        val column = sanitizeSqlIdentifier(sort.column)
        val direction = sort.direction.uppercase()
        val nulls = if (sort.nullsFirst) "NULLS FIRST" else "NULLS LAST"
        "$column $direction $nulls"
    }
}

/**
 * Parse connection string
 */
fun parseConnectionString(connectionString: String): DatabaseConfig {
    val regex = """postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)""".toRegex()
    val match = regex.find(connectionString)
        ?: throw IllegalArgumentException("Invalid connection string format")

    val (username, password, host, port, database) = match.destructured

    return DatabaseConfig(
        host = host,
        port = port.toInt(),
        database = database,
        username = username,
        password = password
    )
}

/**
 * Validate bucket name
 */
fun isValidBucketName(name: String): Boolean {
    val bucketNameRegex = "^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$".toRegex()
    return bucketNameRegex.matches(name)
}

/**
 * Validate object path
 */
fun isValidObjectPath(path: String): Boolean {
    // No leading slash, no double slashes, no special characters except - _ . /
    return !path.startsWith("/") &&
           !path.contains("//") &&
           path.matches(Regex("^[a-zA-Z0-9/_.-]+$"))
}

/**
 * Get file extension
 */
fun getFileExtension(filename: String): String {
    return filename.substringAfterLast('.', "")
}

/**
 * Get MIME type from extension
 */
fun getMimeTypeFromExtension(extension: String): String {
    return when (extension.lowercase()) {
        "jpg", "jpeg" -> "image/jpeg"
        "png" -> "image/png"
        "gif" -> "image/gif"
        "webp" -> "image/webp"
        "svg" -> "image/svg+xml"
        "pdf" -> "application/pdf"
        "json" -> "application/json"
        "xml" -> "application/xml"
        "txt" -> "text/plain"
        "html", "htm" -> "text/html"
        "css" -> "text/css"
        "js" -> "application/javascript"
        "mp4" -> "video/mp4"
        "mp3" -> "audio/mpeg"
        "zip" -> "application/zip"
        "tar" -> "application/x-tar"
        "gz" -> "application/gzip"
        else -> "application/octet-stream"
    }
}

/**
 * Rate limiter using token bucket algorithm
 */
class RateLimiter(
    private val capacity: Int,
    private val refillRate: Int, // tokens per second
    private val refillInterval: Long = 1000 // milliseconds
) {
    private var tokens: Int = capacity
    private var lastRefill: Long = System.currentTimeMillis()

    @Synchronized
    fun tryAcquire(permits: Int = 1): Boolean {
        refill()
        if (tokens >= permits) {
            tokens -= permits
            return true
        }
        return false
    }

    private fun refill() {
        val now = System.currentTimeMillis()
        val elapsed = now - lastRefill
        val refillAmount = (elapsed / refillInterval * refillRate).toInt()

        if (refillAmount > 0) {
            tokens = minOf(capacity, tokens + refillAmount)
            lastRefill = now
        }
    }
}

/**
 * In-memory cache with TTL
 */
class Cache<K, V>(
    private val ttlMillis: Long = 60000 // 1 minute default
) {
    private data class CacheEntry<V>(
        val value: V,
        val expiresAt: Long
    )

    private val cache = mutableMapOf<K, CacheEntry<V>>()

    @Synchronized
    fun get(key: K): V? {
        cleanup()
        val entry = cache[key] ?: return null
        return if (System.currentTimeMillis() < entry.expiresAt) {
            entry.value
        } else {
            cache.remove(key)
            null
        }
    }

    @Synchronized
    fun put(key: K, value: V) {
        cache[key] = CacheEntry(
            value = value,
            expiresAt = System.currentTimeMillis() + ttlMillis
        )
    }

    @Synchronized
    fun remove(key: K) {
        cache.remove(key)
    }

    @Synchronized
    fun clear() {
        cache.clear()
    }

    private fun cleanup() {
        val now = System.currentTimeMillis()
        cache.entries.removeIf { it.value.expiresAt < now }
    }
}

/**
 * Result type for error handling
 */
sealed class Result<out T> {
    data class Success<T>(val value: T) : Result<T>()
    data class Failure(val error: ApiError) : Result<Nothing>()

    inline fun <R> map(transform: (T) -> R): Result<R> = when (this) {
        is Success -> Success(transform(value))
        is Failure -> this
    }

    inline fun <R> flatMap(transform: (T) -> Result<R>): Result<R> = when (this) {
        is Success -> transform(value)
        is Failure -> this
    }

    fun getOrNull(): T? = when (this) {
        is Success -> value
        is Failure -> null
    }

    fun getOrThrow(): T = when (this) {
        is Success -> value
        is Failure -> throw Exception(error.message)
    }
}

/**
 * Retry with exponential backoff
 */
suspend fun <T> retryWithBackoff(
    maxAttempts: Int = 3,
    initialDelay: Long = 100,
    maxDelay: Long = 1000,
    factor: Double = 2.0,
    block: suspend () -> T
): T {
    var currentDelay = initialDelay
    repeat(maxAttempts - 1) { attempt ->
        try {
            return block()
        } catch (e: Exception) {
            logger.warn { "Attempt ${attempt + 1} failed: ${e.message}" }
        }
        kotlinx.coroutines.delay(currentDelay)
        currentDelay = (currentDelay * factor).toLong().coerceAtMost(maxDelay)
    }
    return block() // last attempt
}

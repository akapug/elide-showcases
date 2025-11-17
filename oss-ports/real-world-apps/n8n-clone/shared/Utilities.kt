package dev.elide.workflow.utils

import kotlinx.serialization.json.*
import java.security.MessageDigest
import java.util.Base64
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

/**
 * Utility functions for workflow operations
 */
object WorkflowUtils {
    /**
     * Generate a unique ID
     */
    fun generateId(): String {
        return java.util.UUID.randomUUID().toString()
    }

    /**
     * Hash a string using SHA-256
     */
    fun sha256(input: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val hash = digest.digest(input.toByteArray())
        return hash.joinToString("") { "%02x".format(it) }
    }

    /**
     * Generate HMAC signature
     */
    fun hmacSha256(data: String, key: String): String {
        val mac = Mac.getInstance("HmacSHA256")
        val secretKey = SecretKeySpec(key.toByteArray(), "HmacSHA256")
        mac.init(secretKey)
        val hash = mac.doFinal(data.toByteArray())
        return Base64.getEncoder().encodeToString(hash)
    }

    /**
     * Merge JSON objects
     */
    fun mergeJson(vararg objects: JsonObject): JsonObject {
        val merged = mutableMapOf<String, JsonElement>()

        objects.forEach { obj ->
            obj.forEach { (key, value) ->
                merged[key] = value
            }
        }

        return JsonObject(merged)
    }

    /**
     * Deep clone JSON
     */
    fun cloneJson(obj: JsonElement): JsonElement {
        return Json.parseToJsonElement(obj.toString())
    }

    /**
     * Flatten nested JSON
     */
    fun flattenJson(obj: JsonObject, prefix: String = ""): Map<String, JsonElement> {
        val flattened = mutableMapOf<String, JsonElement>()

        obj.forEach { (key, value) ->
            val newKey = if (prefix.isEmpty()) key else "$prefix.$key"

            when (value) {
                is JsonObject -> {
                    flattened.putAll(flattenJson(value, newKey))
                }
                else -> {
                    flattened[newKey] = value
                }
            }
        }

        return flattened
    }

    /**
     * Sanitize string for safe use in expressions
     */
    fun sanitizeString(input: String): String {
        return input.replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
            .replace("\t", "\\t")
    }

    /**
     * Parse cron expression
     */
    fun parseCronExpression(expression: String): CronSchedule? {
        val parts = expression.trim().split(" ")

        if (parts.size !in 5..6) {
            return null
        }

        return try {
            CronSchedule(
                minute = parts[0],
                hour = parts[1],
                dayOfMonth = parts[2],
                month = parts[3],
                dayOfWeek = parts[4],
                year = parts.getOrNull(5)
            )
        } catch (e: Exception) {
            null
        }
    }
}

/**
 * Cron schedule representation
 */
data class CronSchedule(
    val minute: String,
    val hour: String,
    val dayOfMonth: String,
    val month: String,
    val dayOfWeek: String,
    val year: String? = null
) {
    override fun toString(): String {
        val parts = listOf(minute, hour, dayOfMonth, month, dayOfWeek)
        return if (year != null) {
            parts.joinToString(" ") + " $year"
        } else {
            parts.joinToString(" ")
        }
    }
}

/**
 * JSON utilities
 */
object JsonUtils {
    /**
     * Convert any value to JsonElement
     */
    fun toJsonElement(value: Any?): JsonElement {
        return when (value) {
            null -> JsonNull
            is JsonElement -> value
            is String -> JsonPrimitive(value)
            is Number -> JsonPrimitive(value)
            is Boolean -> JsonPrimitive(value)
            is Map<*, *> -> {
                val map = value.mapKeys { it.key.toString() }
                    .mapValues { toJsonElement(it.value) }
                JsonObject(map)
            }
            is List<*> -> {
                JsonArray(value.map { toJsonElement(it) })
            }
            else -> JsonPrimitive(value.toString())
        }
    }

    /**
     * Get value from JSON path
     */
    fun getValueByPath(obj: JsonElement, path: String): JsonElement? {
        val parts = path.split(".")
        var current: JsonElement? = obj

        for (part in parts) {
            current = when (current) {
                is JsonObject -> current[part]
                is JsonArray -> {
                    val index = part.toIntOrNull()
                    if (index != null && index < current.size) {
                        current[index]
                    } else null
                }
                else -> null
            }

            if (current == null) break
        }

        return current
    }

    /**
     * Set value at JSON path
     */
    fun setValueByPath(obj: JsonObject, path: String, value: JsonElement): JsonObject {
        val parts = path.split(".")
        val mutableObj = obj.toMutableMap()

        if (parts.size == 1) {
            mutableObj[parts[0]] = value
            return JsonObject(mutableObj)
        }

        // Handle nested paths (simplified implementation)
        mutableObj[parts[0]] = value
        return JsonObject(mutableObj)
    }

    /**
     * Pretty print JSON
     */
    fun prettyPrint(element: JsonElement): String {
        val json = Json { prettyPrint = true }
        return json.encodeToString(JsonElement.serializer(), element)
    }
}

/**
 * String utilities
 */
object StringUtils {
    /**
     * Convert string to camel case
     */
    fun toCamelCase(input: String): String {
        return input.split("_", "-", " ")
            .mapIndexed { index, word ->
                if (index == 0) word.lowercase()
                else word.replaceFirstChar { it.uppercase() }
            }
            .joinToString("")
    }

    /**
     * Convert string to snake case
     */
    fun toSnakeCase(input: String): String {
        return input.replace(Regex("([a-z])([A-Z])"), "$1_$2")
            .lowercase()
    }

    /**
     * Convert string to kebab case
     */
    fun toKebabCase(input: String): String {
        return input.replace(Regex("([a-z])([A-Z])"), "$1-$2")
            .lowercase()
    }

    /**
     * Truncate string with ellipsis
     */
    fun truncate(input: String, maxLength: Int, ellipsis: String = "..."): String {
        return if (input.length <= maxLength) {
            input
        } else {
            input.substring(0, maxLength - ellipsis.length) + ellipsis
        }
    }

    /**
     * Extract URLs from text
     */
    fun extractUrls(text: String): List<String> {
        val urlPattern = Regex("""https?://[^\s]+""")
        return urlPattern.findAll(text).map { it.value }.toList()
    }

    /**
     * Extract email addresses from text
     */
    fun extractEmails(text: String): List<String> {
        val emailPattern = Regex("""[\w.+-]+@[\w.-]+\.\w+""")
        return emailPattern.findAll(text).map { it.value }.toList()
    }
}

/**
 * Data validation utilities
 */
object ValidationUtils {
    /**
     * Validate email address
     */
    fun isValidEmail(email: String): Boolean {
        val emailPattern = Regex("""^[\w.+-]+@[\w.-]+\.\w+$""")
        return emailPattern.matches(email)
    }

    /**
     * Validate URL
     */
    fun isValidUrl(url: String): Boolean {
        return try {
            java.net.URL(url)
            url.startsWith("http://") || url.startsWith("https://")
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Validate UUID
     */
    fun isValidUuid(uuid: String): Boolean {
        return try {
            java.util.UUID.fromString(uuid)
            true
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Validate JSON string
     */
    fun isValidJson(jsonString: String): Boolean {
        return try {
            Json.parseToJsonElement(jsonString)
            true
        } catch (e: Exception) {
            false
        }
    }
}

/**
 * Rate limiter for API calls
 */
class RateLimiter(
    private val maxRequests: Int,
    private val timeWindowMillis: Long
) {
    private val requests = mutableListOf<Long>()

    /**
     * Check if request is allowed
     */
    @Synchronized
    fun allowRequest(): Boolean {
        val now = System.currentTimeMillis()

        // Remove old requests outside time window
        requests.removeIf { it < now - timeWindowMillis }

        return if (requests.size < maxRequests) {
            requests.add(now)
            true
        } else {
            false
        }
    }

    /**
     * Get time until next request is allowed
     */
    @Synchronized
    fun getWaitTime(): Long {
        if (requests.size < maxRequests) {
            return 0
        }

        val now = System.currentTimeMillis()
        val oldestRequest = requests.minOrNull() ?: return 0

        return maxOf(0, timeWindowMillis - (now - oldestRequest))
    }
}

/**
 * Retry utilities
 */
object RetryUtils {
    /**
     * Retry operation with exponential backoff
     */
    suspend fun <T> retry(
        maxAttempts: Int = 3,
        initialDelayMillis: Long = 1000,
        maxDelayMillis: Long = 10000,
        factor: Double = 2.0,
        operation: suspend (attempt: Int) -> T
    ): T {
        var currentDelay = initialDelayMillis
        var lastException: Exception? = null

        repeat(maxAttempts) { attempt ->
            try {
                return operation(attempt + 1)
            } catch (e: Exception) {
                lastException = e

                if (attempt < maxAttempts - 1) {
                    kotlinx.coroutines.delay(currentDelay)
                    currentDelay = (currentDelay * factor).toLong()
                        .coerceAtMost(maxDelayMillis)
                }
            }
        }

        throw lastException ?: Exception("Retry failed")
    }
}

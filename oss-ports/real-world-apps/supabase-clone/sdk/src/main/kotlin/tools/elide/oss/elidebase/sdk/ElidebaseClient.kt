package tools.elide.oss.elidebase.sdk

import io.github.oshai.kotlinlogging.KotlinLogging
import io.ktor.client.*
import io.ktor.client.engine.cio.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.plugins.websocket.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.websocket.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.serialization.json.JsonObject
import tools.elide.oss.elidebase.core.*

private val logger = KotlinLogging.logger {}

/**
 * Main Elidebase client
 */
class ElidebaseClient(
    private val url: String,
    private val apiKey: String? = null,
    private val accessToken: String? = null
) {

    private val httpClient = HttpClient(CIO) {
        install(ContentNegotiation) {
            json(json)
        }
        install(WebSockets)
    }

    val database = DatabaseClient(this)
    val auth = AuthClient(this)
    val storage = StorageClient(this)
    val realtime = RealtimeClient(this)
    val functions = FunctionsClient(this)

    /**
     * Get HTTP client
     */
    internal fun getHttpClient(): HttpClient = httpClient

    /**
     * Get base URL
     */
    internal fun getBaseUrl(): String = url

    /**
     * Get authorization header
     */
    internal fun getAuthHeader(): String? {
        return accessToken ?: apiKey
    }

    /**
     * Close the client
     */
    fun close() {
        httpClient.close()
    }
}

/**
 * Database client for REST API
 */
class DatabaseClient(private val client: ElidebaseClient) {

    /**
     * Create a query builder for a table
     */
    fun from(table: String, schema: String = "public"): QueryBuilder {
        return QueryBuilder(client, schema, table)
    }

    /**
     * Execute raw SQL
     */
    suspend fun rpc(functionName: String, params: Map<String, Any> = emptyMap()): ApiResponse<List<JsonObject>> {
        val httpClient = client.getHttpClient()
        val url = "${client.getBaseUrl()}/database/rpc/$functionName"

        return try {
            val response = httpClient.post(url) {
                contentType(ContentType.Application.Json)
                client.getAuthHeader()?.let { header("Authorization", "Bearer $it") }
                setBody(params)
            }

            json.decodeFromString<ApiResponse<List<JsonObject>>>(response.bodyAsText())
        } catch (e: Exception) {
            logger.error(e) { "Error calling RPC function" }
            ApiResponse(error = ApiError("RPC_ERROR", e.message ?: "Failed to call function"))
        }
    }
}

/**
 * Query builder for database operations
 */
class QueryBuilder(
    private val client: ElidebaseClient,
    private val schema: String,
    private val table: String
) {
    private val selectedColumns = mutableListOf<String>()
    private val filters = mutableListOf<QueryFilter>()
    private val sorts = mutableListOf<SortParam>()
    private var limitValue: Int? = null
    private var offsetValue: Int? = null

    fun select(vararg columns: String): QueryBuilder {
        selectedColumns.addAll(columns)
        return this
    }

    fun eq(column: String, value: Any): QueryBuilder {
        filters.add(QueryFilter(column, "EQ", value.toString()))
        return this
    }

    fun neq(column: String, value: Any): QueryBuilder {
        filters.add(QueryFilter(column, "NEQ", value.toString()))
        return this
    }

    fun gt(column: String, value: Any): QueryBuilder {
        filters.add(QueryFilter(column, "GT", value.toString()))
        return this
    }

    fun gte(column: String, value: Any): QueryBuilder {
        filters.add(QueryFilter(column, "GTE", value.toString()))
        return this
    }

    fun lt(column: String, value: Any): QueryBuilder {
        filters.add(QueryFilter(column, "LT", value.toString()))
        return this
    }

    fun lte(column: String, value: Any): QueryBuilder {
        filters.add(QueryFilter(column, "LTE", value.toString()))
        return this
    }

    fun like(column: String, pattern: String): QueryBuilder {
        filters.add(QueryFilter(column, "LIKE", pattern))
        return this
    }

    fun ilike(column: String, pattern: String): QueryBuilder {
        filters.add(QueryFilter(column, "ILIKE", pattern))
        return this
    }

    fun `in`(column: String, values: List<Any>): QueryBuilder {
        filters.add(QueryFilter(column, "IN", values.joinToString(",")))
        return this
    }

    fun isNull(column: String): QueryBuilder {
        filters.add(QueryFilter(column, "IS", "NULL"))
        return this
    }

    fun isNotNull(column: String): QueryBuilder {
        filters.add(QueryFilter(column, "IS", "NOT NULL"))
        return this
    }

    fun order(column: String, ascending: Boolean = true, nullsFirst: Boolean = false): QueryBuilder {
        sorts.add(SortParam(column, if (ascending) "ASC" else "DESC", nullsFirst))
        return this
    }

    fun limit(count: Int): QueryBuilder {
        limitValue = count
        return this
    }

    fun offset(count: Int): QueryBuilder {
        offsetValue = count
        return this
    }

    fun range(from: Int, to: Int): QueryBuilder {
        offsetValue = from
        limitValue = to - from + 1
        return this
    }

    /**
     * Execute SELECT query
     */
    suspend fun execute(): ApiResponse<List<JsonObject>> {
        val httpClient = client.getHttpClient()
        val url = "${client.getBaseUrl()}/database/rest/$schema/$table"

        return try {
            val response = httpClient.get(url) {
                client.getAuthHeader()?.let { header("Authorization", "Bearer $it") }

                if (selectedColumns.isNotEmpty()) {
                    parameter("select", selectedColumns.joinToString(","))
                }

                filters.forEach { filter ->
                    parameter("${filter.column}.${filter.operator.lowercase()}", filter.value)
                }

                if (sorts.isNotEmpty()) {
                    parameter("order", sorts.joinToString(",") { "${it.column}.${it.direction.lowercase()}" })
                }

                limitValue?.let { parameter("limit", it) }
                offsetValue?.let { parameter("offset", it) }
            }

            json.decodeFromString<ApiResponse<List<JsonObject>>>(response.bodyAsText())
        } catch (e: Exception) {
            logger.error(e) { "Error executing query" }
            ApiResponse(error = ApiError("QUERY_ERROR", e.message ?: "Failed to execute query"))
        }
    }

    /**
     * Insert data
     */
    suspend fun insert(data: JsonObject): ApiResponse<JsonObject> {
        val httpClient = client.getHttpClient()
        val url = "${client.getBaseUrl()}/database/rest/$schema/$table"

        return try {
            val response = httpClient.post(url) {
                contentType(ContentType.Application.Json)
                client.getAuthHeader()?.let { header("Authorization", "Bearer $it") }
                setBody(data)
            }

            json.decodeFromString<ApiResponse<JsonObject>>(response.bodyAsText())
        } catch (e: Exception) {
            logger.error(e) { "Error inserting data" }
            ApiResponse(error = ApiError("INSERT_ERROR", e.message ?: "Failed to insert data"))
        }
    }

    /**
     * Update data
     */
    suspend fun update(data: JsonObject): ApiResponse<List<JsonObject>> {
        val httpClient = client.getHttpClient()
        val url = "${client.getBaseUrl()}/database/rest/$schema/$table"

        return try {
            val response = httpClient.patch(url) {
                contentType(ContentType.Application.Json)
                client.getAuthHeader()?.let { header("Authorization", "Bearer $it") }
                setBody(data)

                filters.forEach { filter ->
                    parameter("${filter.column}.${filter.operator.lowercase()}", filter.value)
                }
            }

            json.decodeFromString<ApiResponse<List<JsonObject>>>(response.bodyAsText())
        } catch (e: Exception) {
            logger.error(e) { "Error updating data" }
            ApiResponse(error = ApiError("UPDATE_ERROR", e.message ?: "Failed to update data"))
        }
    }

    /**
     * Delete data
     */
    suspend fun delete(): ApiResponse<List<JsonObject>> {
        val httpClient = client.getHttpClient()
        val url = "${client.getBaseUrl()}/database/rest/$schema/$table"

        return try {
            val response = httpClient.delete(url) {
                client.getAuthHeader()?.let { header("Authorization", "Bearer $it") }

                filters.forEach { filter ->
                    parameter("${filter.column}.${filter.operator.lowercase()}", filter.value)
                }
            }

            json.decodeFromString<ApiResponse<List<JsonObject>>>(response.bodyAsText())
        } catch (e: Exception) {
            logger.error(e) { "Error deleting data" }
            ApiResponse(error = ApiError("DELETE_ERROR", e.message ?: "Failed to delete data"))
        }
    }

    /**
     * Upsert data
     */
    suspend fun upsert(data: JsonObject, conflictColumns: List<String>): ApiResponse<JsonObject> {
        val httpClient = client.getHttpClient()
        val url = "${client.getBaseUrl()}/database/rest/$schema/$table"

        return try {
            val response = httpClient.post(url) {
                contentType(ContentType.Application.Json)
                client.getAuthHeader()?.let { header("Authorization", "Bearer $it") }
                header("Prefer", "resolution=merge-duplicates")
                parameter("on_conflict", conflictColumns.joinToString(","))
                setBody(data)
            }

            json.decodeFromString<ApiResponse<JsonObject>>(response.bodyAsText())
        } catch (e: Exception) {
            logger.error(e) { "Error upserting data" }
            ApiResponse(error = ApiError("UPSERT_ERROR", e.message ?: "Failed to upsert data"))
        }
    }
}

/**
 * Authentication client
 */
class AuthClient(private val client: ElidebaseClient) {
    private var session: SessionTokens? = null

    /**
     * Sign up with email and password
     */
    suspend fun signUp(email: String, password: String, metadata: Map<String, String> = emptyMap()): ApiResponse<SessionTokens> {
        val httpClient = client.getHttpClient()
        val url = "${client.getBaseUrl()}/auth/signup"

        return try {
            val response = httpClient.post(url) {
                contentType(ContentType.Application.Json)
                setBody(mapOf("email" to email, "password" to password, "metadata" to metadata))
            }

            val result = json.decodeFromString<ApiResponse<SessionTokens>>(response.bodyAsText())
            if (result.data != null) {
                session = result.data
            }
            result
        } catch (e: Exception) {
            logger.error(e) { "Error signing up" }
            ApiResponse(error = ApiError("SIGNUP_ERROR", e.message ?: "Failed to sign up"))
        }
    }

    /**
     * Sign in with email and password
     */
    suspend fun signIn(email: String, password: String): ApiResponse<SessionTokens> {
        val httpClient = client.getHttpClient()
        val url = "${client.getBaseUrl()}/auth/signin"

        return try {
            val response = httpClient.post(url) {
                contentType(ContentType.Application.Json)
                setBody(mapOf("email" to email, "password" to password))
            }

            val result = json.decodeFromString<ApiResponse<SessionTokens>>(response.bodyAsText())
            if (result.data != null) {
                session = result.data
            }
            result
        } catch (e: Exception) {
            logger.error(e) { "Error signing in" }
            ApiResponse(error = ApiError("SIGNIN_ERROR", e.message ?: "Failed to sign in"))
        }
    }

    /**
     * Sign out
     */
    suspend fun signOut(): ApiResponse<Unit> {
        val httpClient = client.getHttpClient()
        val url = "${client.getBaseUrl()}/auth/signout"

        return try {
            val refreshToken = session?.refreshToken
                ?: return ApiResponse(error = ApiError("NO_SESSION", "No active session"))

            httpClient.post(url) {
                contentType(ContentType.Application.Json)
                setBody(mapOf("refreshToken" to refreshToken))
            }

            session = null
            ApiResponse(data = Unit)
        } catch (e: Exception) {
            logger.error(e) { "Error signing out" }
            ApiResponse(error = ApiError("SIGNOUT_ERROR", e.message ?: "Failed to sign out"))
        }
    }

    /**
     * Get current session
     */
    fun getSession(): SessionTokens? = session

    /**
     * Get current user
     */
    fun getUser(): UserProfile? = session?.user

    /**
     * Send magic link
     */
    suspend fun sendMagicLink(email: String): ApiResponse<Unit> {
        val httpClient = client.getHttpClient()
        val url = "${client.getBaseUrl()}/auth/magiclink"

        return try {
            httpClient.post(url) {
                contentType(ContentType.Application.Json)
                setBody(mapOf("email" to email))
            }

            ApiResponse(data = Unit)
        } catch (e: Exception) {
            logger.error(e) { "Error sending magic link" }
            ApiResponse(error = ApiError("MAGIC_LINK_ERROR", e.message ?: "Failed to send magic link"))
        }
    }

    /**
     * Request password reset
     */
    suspend fun resetPasswordRequest(email: String): ApiResponse<Unit> {
        val httpClient = client.getHttpClient()
        val url = "${client.getBaseUrl()}/auth/password-reset"

        return try {
            httpClient.post(url) {
                contentType(ContentType.Application.Json)
                setBody(mapOf("email" to email))
            }

            ApiResponse(data = Unit)
        } catch (e: Exception) {
            logger.error(e) { "Error requesting password reset" }
            ApiResponse(error = ApiError("PASSWORD_RESET_ERROR", e.message ?: "Failed to request password reset"))
        }
    }

    /**
     * Refresh session
     */
    suspend fun refreshSession(): ApiResponse<SessionTokens> {
        val httpClient = client.getHttpClient()
        val url = "${client.getBaseUrl()}/auth/refresh"

        return try {
            val refreshToken = session?.refreshToken
                ?: return ApiResponse(error = ApiError("NO_SESSION", "No active session"))

            val response = httpClient.post(url) {
                contentType(ContentType.Application.Json)
                setBody(mapOf("refreshToken" to refreshToken))
            }

            val result = json.decodeFromString<ApiResponse<SessionTokens>>(response.bodyAsText())
            if (result.data != null) {
                session = result.data
            }
            result
        } catch (e: Exception) {
            logger.error(e) { "Error refreshing session" }
            ApiResponse(error = ApiError("REFRESH_ERROR", e.message ?: "Failed to refresh session"))
        }
    }
}

/**
 * Storage client
 */
class StorageClient(private val client: ElidebaseClient) {

    /**
     * Create a bucket client
     */
    fun from(bucketName: String): BucketClient {
        return BucketClient(client, bucketName)
    }

    /**
     * Create a new bucket
     */
    suspend fun createBucket(config: BucketConfig): ApiResponse<BucketConfig> {
        val httpClient = client.getHttpClient()
        val url = "${client.getBaseUrl()}/storage/buckets"

        return try {
            val response = httpClient.post(url) {
                contentType(ContentType.Application.Json)
                client.getAuthHeader()?.let { header("Authorization", "Bearer $it") }
                setBody(config)
            }

            json.decodeFromString<ApiResponse<BucketConfig>>(response.bodyAsText())
        } catch (e: Exception) {
            logger.error(e) { "Error creating bucket" }
            ApiResponse(error = ApiError("BUCKET_ERROR", e.message ?: "Failed to create bucket"))
        }
    }

    /**
     * List all buckets
     */
    suspend fun listBuckets(): ApiResponse<List<BucketConfig>> {
        val httpClient = client.getHttpClient()
        val url = "${client.getBaseUrl()}/storage/buckets"

        return try {
            val response = httpClient.get(url) {
                client.getAuthHeader()?.let { header("Authorization", "Bearer $it") }
            }

            json.decodeFromString<ApiResponse<List<BucketConfig>>>(response.bodyAsText())
        } catch (e: Exception) {
            logger.error(e) { "Error listing buckets" }
            ApiResponse(error = ApiError("BUCKET_ERROR", e.message ?: "Failed to list buckets"))
        }
    }
}

/**
 * Bucket client for storage operations
 */
class BucketClient(
    private val client: ElidebaseClient,
    private val bucketName: String
) {

    /**
     * Upload a file
     */
    suspend fun upload(path: String, data: ByteArray, mimeType: String? = null): ApiResponse<StorageObject> {
        val httpClient = client.getHttpClient()
        val url = "${client.getBaseUrl()}/storage/buckets/$bucketName/objects"

        return try {
            val response = httpClient.post(url) {
                client.getAuthHeader()?.let { header("Authorization", "Bearer $it") }
                parameter("path", path)
                mimeType?.let { contentType(ContentType.parse(it)) }
                setBody(data)
            }

            json.decodeFromString<ApiResponse<StorageObject>>(response.bodyAsText())
        } catch (e: Exception) {
            logger.error(e) { "Error uploading file" }
            ApiResponse(error = ApiError("UPLOAD_ERROR", e.message ?: "Failed to upload file"))
        }
    }

    /**
     * Download a file
     */
    suspend fun download(path: String): ApiResponse<ByteArray> {
        val httpClient = client.getHttpClient()
        val url = "${client.getBaseUrl()}/storage/buckets/$bucketName/objects/$path"

        return try {
            val response = httpClient.get(url) {
                client.getAuthHeader()?.let { header("Authorization", "Bearer $it") }
            }

            ApiResponse(data = response.readBytes())
        } catch (e: Exception) {
            logger.error(e) { "Error downloading file" }
            ApiResponse(error = ApiError("DOWNLOAD_ERROR", e.message ?: "Failed to download file"))
        }
    }

    /**
     * Delete a file
     */
    suspend fun remove(path: String): ApiResponse<Unit> {
        val httpClient = client.getHttpClient()
        val url = "${client.getBaseUrl()}/storage/buckets/$bucketName/objects/$path"

        return try {
            httpClient.delete(url) {
                client.getAuthHeader()?.let { header("Authorization", "Bearer $it") }
            }

            ApiResponse(data = Unit)
        } catch (e: Exception) {
            logger.error(e) { "Error deleting file" }
            ApiResponse(error = ApiError("DELETE_ERROR", e.message ?: "Failed to delete file"))
        }
    }

    /**
     * List files
     */
    suspend fun list(prefix: String? = null, limit: Int = 100): ApiResponse<List<StorageObject>> {
        val httpClient = client.getHttpClient()
        val url = "${client.getBaseUrl()}/storage/buckets/$bucketName/objects"

        return try {
            val response = httpClient.get(url) {
                client.getAuthHeader()?.let { header("Authorization", "Bearer $it") }
                prefix?.let { parameter("prefix", it) }
                parameter("limit", limit)
            }

            json.decodeFromString<ApiResponse<List<StorageObject>>>(response.bodyAsText())
        } catch (e: Exception) {
            logger.error(e) { "Error listing files" }
            ApiResponse(error = ApiError("LIST_ERROR", e.message ?: "Failed to list files"))
        }
    }

    /**
     * Get public URL for a file
     */
    fun getPublicUrl(path: String): String {
        return "${client.getBaseUrl()}/storage/buckets/$bucketName/public/$path"
    }
}

/**
 * Real-time client for WebSocket subscriptions
 */
class RealtimeClient(private val client: ElidebaseClient) {
    private var wsSession: WebSocketSession? = null
    private val messageFlow = MutableSharedFlow<RealtimeMessage>(replay = 0, extraBufferCapacity = 100)

    /**
     * Connect to real-time server
     */
    suspend fun connect() {
        val httpClient = client.getHttpClient()
        val wsUrl = client.getBaseUrl().replace("http", "ws") + "/realtime"

        wsSession = httpClient.webSocketSession(wsUrl) {
            client.getAuthHeader()?.let { header("Authorization", "Bearer $it") }
        }

        // Start receiving messages
        kotlinx.coroutines.launch {
            wsSession?.incoming?.let { incoming ->
                for (frame in incoming) {
                    if (frame is Frame.Text) {
                        val text = frame.readText()
                        val message = json.decodeFromString<RealtimeMessage>(text)
                        messageFlow.emit(message)
                    }
                }
            }
        }
    }

    /**
     * Subscribe to a channel
     */
    suspend fun subscribe(config: SubscriptionConfig): Flow<RealtimeMessage> {
        val topic = "db:${config.schema}.${config.table}"
        val message = RealtimeMessage(
            type = "SUBSCRIBE",
            topic = topic,
            payload = json.encodeToString(kotlinx.serialization.serializer(), config)
        )

        wsSession?.send(Frame.Text(json.encodeToString(message)))
        return messageFlow.asSharedFlow()
    }

    /**
     * Broadcast a message
     */
    suspend fun broadcast(topic: String, event: String, payload: String) {
        val message = RealtimeMessage(
            type = "BROADCAST",
            topic = topic,
            event = event,
            payload = payload
        )

        wsSession?.send(Frame.Text(json.encodeToString(message)))
    }

    /**
     * Update presence
     */
    suspend fun updatePresence(topic: String, state: PresenceState) {
        val message = RealtimeMessage(
            type = "PRESENCE",
            topic = topic,
            event = "update",
            payload = json.encodeToString(kotlinx.serialization.serializer(), state)
        )

        wsSession?.send(Frame.Text(json.encodeToString(message)))
    }

    /**
     * Disconnect
     */
    suspend fun disconnect() {
        wsSession?.close()
        wsSession = null
    }
}

/**
 * Functions client
 */
class FunctionsClient(private val client: ElidebaseClient) {

    /**
     * Invoke a function
     */
    suspend fun invoke(name: String, body: String? = null, headers: Map<String, String> = emptyMap()): ApiResponse<FunctionResponse> {
        val httpClient = client.getHttpClient()
        val url = "${client.getBaseUrl()}/functions/$name"

        return try {
            val response = httpClient.post(url) {
                contentType(ContentType.Application.Json)
                client.getAuthHeader()?.let { header("Authorization", "Bearer $it") }
                headers.forEach { (key, value) -> header(key, value) }
                body?.let { setBody(it) }
            }

            json.decodeFromString<ApiResponse<FunctionResponse>>(response.bodyAsText())
        } catch (e: Exception) {
            logger.error(e) { "Error invoking function" }
            ApiResponse(error = ApiError("INVOKE_ERROR", e.message ?: "Failed to invoke function"))
        }
    }
}

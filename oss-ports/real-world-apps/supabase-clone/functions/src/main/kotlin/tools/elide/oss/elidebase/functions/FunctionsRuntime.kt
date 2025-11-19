package tools.elide.oss.elidebase.functions

import io.github.oshai.kotlinlogging.KotlinLogging
import org.graalvm.polyglot.Context
import org.graalvm.polyglot.HostAccess
import org.graalvm.polyglot.Value
import tools.elide.oss.elidebase.core.*
import tools.elide.oss.elidebase.database.DatabaseManager
import java.io.ByteArrayOutputStream
import java.io.File
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit
import kotlin.io.path.exists
import kotlin.io.path.readText

private val logger = KotlinLogging.logger {}

/**
 * Edge functions runtime manager
 */
class FunctionsRuntime(
    private val dbManager: DatabaseManager,
    private val functionsRoot: String = "/var/lib/elidebase/functions"
) {

    private val deployedFunctions = ConcurrentHashMap<String, DeployedFunction>()
    private val rootPath = Paths.get(functionsRoot)

    init {
        kotlinx.coroutines.runBlocking {
            initializeSchema()
            ensureFunctionsDirectory()
            loadDeployedFunctions()
        }
    }

    /**
     * Initialize functions schema
     */
    private suspend fun initializeSchema() {
        val sql = """
            -- Functions table
            CREATE TABLE IF NOT EXISTS functions.deployed_functions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) UNIQUE NOT NULL,
                source_code TEXT NOT NULL,
                runtime VARCHAR(50) DEFAULT 'javascript',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                owner_id UUID,
                env_vars JSONB DEFAULT '{}',
                secrets JSONB DEFAULT '{}',
                enabled BOOLEAN DEFAULT TRUE,
                CONSTRAINT valid_function_name CHECK (name ~ '^[a-z][a-z0-9_-]{0,62}$')
            );

            -- Function invocations log
            CREATE TABLE IF NOT EXISTS functions.invocations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                function_id UUID NOT NULL REFERENCES functions.deployed_functions(id) ON DELETE CASCADE,
                status VARCHAR(50) NOT NULL,
                execution_time_ms BIGINT,
                memory_used_mb BIGINT,
                error_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                request_headers JSONB,
                response_status INT
            );

            -- Create indexes
            CREATE INDEX IF NOT EXISTS idx_invocations_function ON functions.invocations(function_id);
            CREATE INDEX IF NOT EXISTS idx_invocations_created ON functions.invocations(created_at);
        """.trimIndent()

        dbManager.withConnection { connection ->
            // Create functions schema
            connection.createStatement().execute("CREATE SCHEMA IF NOT EXISTS functions;")

            // Execute table creation
            connection.createStatement().execute(sql)
        }

        logger.info { "Functions schema initialized" }
    }

    /**
     * Ensure functions directory exists
     */
    private fun ensureFunctionsDirectory() {
        if (!rootPath.exists()) {
            Files.createDirectories(rootPath)
            logger.info { "Created functions directory: $functionsRoot" }
        }
    }

    /**
     * Load deployed functions from database
     */
    private suspend fun loadDeployedFunctions() {
        dbManager.withConnection { connection ->
            val sql = "SELECT id, name, source_code, runtime, env_vars, enabled FROM functions.deployed_functions WHERE enabled = TRUE;"

            connection.createStatement().use { stmt ->
                stmt.executeQuery(sql).use { rs ->
                    while (rs.next()) {
                        val function = DeployedFunction(
                            id = rs.getString("id"),
                            name = rs.getString("name"),
                            sourceCode = rs.getString("source_code"),
                            runtime = rs.getString("runtime"),
                            envVars = emptyMap(), // Parse from JSONB in production
                            enabled = rs.getBoolean("enabled")
                        )
                        deployedFunctions[function.name] = function
                    }
                }
            }
        }

        logger.info { "Loaded ${deployedFunctions.size} deployed functions" }
    }

    /**
     * Deploy a new function
     */
    suspend fun deployFunction(
        name: String,
        sourceCode: String,
        runtime: String = "javascript",
        envVars: Map<String, String> = emptyMap(),
        secrets: Map<String, String> = emptyMap(),
        ownerId: String? = null
    ): ApiResponse<DeployedFunction> {
        if (!name.matches(Regex("^[a-z][a-z0-9_-]{0,62}$"))) {
            return ApiResponse(error = ApiError("INVALID_NAME", "Function name must be lowercase alphanumeric with hyphens/underscores"))
        }

        return try {
            // Validate function code
            val validation = validateFunction(sourceCode, runtime)
            if (!validation.first) {
                return ApiResponse(error = ApiError("INVALID_CODE", validation.second))
            }

            // Store in database
            val function = dbManager.transaction { connection ->
                // Check if function exists
                val existsSql = "SELECT id FROM functions.deployed_functions WHERE name = ?;"
                val existingId = connection.prepareStatement(existsSql).use { stmt ->
                    stmt.setString(1, name)
                    stmt.executeQuery().use { rs ->
                        if (rs.next()) rs.getString("id") else null
                    }
                }

                if (existingId != null) {
                    // Update existing
                    val updateSql = """
                        UPDATE functions.deployed_functions
                        SET source_code = ?, runtime = ?, env_vars = ?::jsonb, secrets = ?::jsonb, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                        RETURNING id, name, source_code, runtime, enabled;
                    """.trimIndent()

                    connection.prepareStatement(updateSql).use { stmt ->
                        stmt.setString(1, sourceCode)
                        stmt.setString(2, runtime)
                        stmt.setString(3, json.encodeToString(kotlinx.serialization.serializer(), envVars))
                        stmt.setString(4, json.encodeToString(kotlinx.serialization.serializer(), secrets))
                        stmt.setObject(5, UUID.fromString(existingId))
                        stmt.executeQuery().use { rs ->
                            rs.next()
                            DeployedFunction(
                                id = rs.getString("id"),
                                name = rs.getString("name"),
                                sourceCode = rs.getString("source_code"),
                                runtime = rs.getString("runtime"),
                                envVars = envVars,
                                enabled = rs.getBoolean("enabled")
                            )
                        }
                    }
                } else {
                    // Insert new
                    val insertSql = """
                        INSERT INTO functions.deployed_functions (name, source_code, runtime, env_vars, secrets, owner_id)
                        VALUES (?, ?, ?, ?::jsonb, ?::jsonb, ?)
                        RETURNING id, name, source_code, runtime, enabled;
                    """.trimIndent()

                    connection.prepareStatement(insertSql).use { stmt ->
                        stmt.setString(1, name)
                        stmt.setString(2, sourceCode)
                        stmt.setString(3, runtime)
                        stmt.setString(4, json.encodeToString(kotlinx.serialization.serializer(), envVars))
                        stmt.setString(5, json.encodeToString(kotlinx.serialization.serializer(), secrets))
                        stmt.setObject(6, ownerId?.let { UUID.fromString(it) })
                        stmt.executeQuery().use { rs ->
                            rs.next()
                            DeployedFunction(
                                id = rs.getString("id"),
                                name = rs.getString("name"),
                                sourceCode = rs.getString("source_code"),
                                runtime = rs.getString("runtime"),
                                envVars = envVars,
                                enabled = rs.getBoolean("enabled")
                            )
                        }
                    }
                }
            }

            // Save to disk
            val functionPath = rootPath.resolve("$name.js")
            Files.writeString(functionPath, sourceCode)

            // Update cache
            deployedFunctions[name] = function

            logger.info { "Function deployed: $name" }
            ApiResponse(data = function)
        } catch (e: Exception) {
            logger.error(e) { "Error deploying function" }
            ApiResponse(error = ApiError("DEPLOY_ERROR", e.message ?: "Failed to deploy function"))
        }
    }

    /**
     * Invoke a function
     */
    suspend fun invokeFunction(invocation: FunctionInvocation): ApiResponse<FunctionResponse> {
        val function = deployedFunctions[invocation.name]
            ?: return ApiResponse(error = ApiError("FUNCTION_NOT_FOUND", "Function not found: ${invocation.name}"))

        if (!function.enabled) {
            return ApiResponse(error = ApiError("FUNCTION_DISABLED", "Function is disabled"))
        }

        val startTime = System.currentTimeMillis()
        val runtime = Runtime.getRuntime()
        val memoryBefore = runtime.totalMemory() - runtime.freeMemory()

        return try {
            // Execute function
            val result = when (function.runtime) {
                "javascript" -> executeJavaScript(function, invocation)
                else -> throw UnsupportedOperationException("Unsupported runtime: ${function.runtime}")
            }

            val executionTime = System.currentTimeMillis() - startTime
            val memoryAfter = runtime.totalMemory() - runtime.freeMemory()
            val memoryUsed = (memoryAfter - memoryBefore) / 1024 / 1024 // MB

            // Log invocation
            logInvocation(function.id, "SUCCESS", executionTime, memoryUsed, null, 200)

            logger.info { "Function ${invocation.name} executed in ${executionTime}ms" }

            ApiResponse(
                data = FunctionResponse(
                    data = result,
                    executionTime = executionTime,
                    memoryUsed = memoryUsed
                )
            )
        } catch (e: Exception) {
            val executionTime = System.currentTimeMillis() - startTime
            val errorMessage = e.message ?: "Unknown error"

            // Log failed invocation
            logInvocation(function.id, "ERROR", executionTime, 0, errorMessage, 500)

            logger.error(e) { "Error executing function ${invocation.name}" }

            ApiResponse(
                data = FunctionResponse(
                    data = null,
                    error = errorMessage,
                    executionTime = executionTime,
                    memoryUsed = 0
                )
            )
        }
    }

    /**
     * Execute JavaScript function
     */
    private fun executeJavaScript(function: DeployedFunction, invocation: FunctionInvocation): String {
        val stdout = ByteArrayOutputStream()
        val stderr = ByteArrayOutputStream()

        val context = Context.newBuilder("js")
            .allowHostAccess(HostAccess.ALL)
            .allowIO(true)
            .option("js.ecmascript-version", "2022")
            .out(stdout)
            .err(stderr)
            .build()

        return try {
            // Set up environment
            context.eval("js", """
                const Request = function(body, headers, method) {
                    this.body = body;
                    this.headers = headers || {};
                    this.method = method || 'POST';
                };

                const Response = function(body, init) {
                    this.body = body;
                    this.status = (init && init.status) || 200;
                    this.headers = (init && init.headers) || {};
                };

                Response.json = function(data, init) {
                    return new Response(JSON.stringify(data), init);
                };

                const env = ${json.encodeToString(kotlinx.serialization.serializer(), function.envVars)};
            """.trimIndent())

            // Load and execute function
            context.eval("js", function.sourceCode)

            // Call handler function
            val handlerSource = """
                (async function() {
                    const request = new Request(
                        ${invocation.body?.let { "'$it'" } ?: "null"},
                        ${json.encodeToString(kotlinx.serialization.serializer(), invocation.headers)},
                        '${invocation.method}'
                    );

                    const response = await handler(request);
                    return response.body || '';
                })();
            """.trimIndent()

            val result = context.eval("js", handlerSource)

            // Wait for promise to resolve (simplified)
            if (result.canExecute()) {
                result.execute().asString()
            } else {
                result.asString()
            }
        } finally {
            context.close()
        }
    }

    /**
     * Validate function code
     */
    private fun validateFunction(sourceCode: String, runtime: String): Pair<Boolean, String> {
        if (sourceCode.isBlank()) {
            return false to "Function source code cannot be empty"
        }

        if (runtime != "javascript") {
            return false to "Unsupported runtime: $runtime"
        }

        // Basic validation - check for handler function
        if (!sourceCode.contains("handler")) {
            return false to "Function must export a 'handler' function"
        }

        return try {
            // Try to parse the code
            val context = Context.newBuilder("js")
                .option("js.syntax-extensions", "true")
                .build()

            context.use {
                it.eval("js", sourceCode)
            }

            true to "Valid"
        } catch (e: Exception) {
            false to "Syntax error: ${e.message}"
        }
    }

    /**
     * Delete a function
     */
    suspend fun deleteFunction(name: String): ApiResponse<Unit> {
        return try {
            dbManager.transaction { connection ->
                val deleteSql = "DELETE FROM functions.deployed_functions WHERE name = ?;"
                val deleted = connection.prepareStatement(deleteSql).use { stmt ->
                    stmt.setString(1, name)
                    stmt.executeUpdate()
                }

                if (deleted == 0) {
                    throw Exception("Function not found")
                }
            }

            // Remove from cache
            deployedFunctions.remove(name)

            // Delete file
            val functionPath = rootPath.resolve("$name.js")
            if (functionPath.exists()) {
                Files.delete(functionPath)
            }

            logger.info { "Function deleted: $name" }
            ApiResponse(data = Unit)
        } catch (e: Exception) {
            logger.error(e) { "Error deleting function" }
            ApiResponse(error = ApiError("DELETE_ERROR", e.message ?: "Failed to delete function"))
        }
    }

    /**
     * List all functions
     */
    suspend fun listFunctions(): ApiResponse<List<DeployedFunction>> {
        return try {
            val functions = dbManager.withConnection { connection ->
                val sql = "SELECT id, name, runtime, created_at, updated_at, enabled FROM functions.deployed_functions ORDER BY name;"

                connection.createStatement().use { stmt ->
                    stmt.executeQuery(sql).use { rs ->
                        val results = mutableListOf<DeployedFunction>()
                        while (rs.next()) {
                            results.add(
                                DeployedFunction(
                                    id = rs.getString("id"),
                                    name = rs.getString("name"),
                                    sourceCode = "", // Don't return source code in list
                                    runtime = rs.getString("runtime"),
                                    envVars = emptyMap(),
                                    enabled = rs.getBoolean("enabled")
                                )
                            )
                        }
                        results
                    }
                }
            }

            ApiResponse(data = functions)
        } catch (e: Exception) {
            logger.error(e) { "Error listing functions" }
            ApiResponse(error = ApiError("LIST_ERROR", e.message ?: "Failed to list functions"))
        }
    }

    /**
     * Get function logs
     */
    suspend fun getFunctionLogs(
        functionName: String,
        limit: Int = 100
    ): ApiResponse<List<Map<String, Any>>> {
        return try {
            val logs = dbManager.withConnection { connection ->
                val sql = """
                    SELECT i.id, i.status, i.execution_time_ms, i.memory_used_mb, i.error_message, i.created_at, i.response_status
                    FROM functions.invocations i
                    JOIN functions.deployed_functions f ON i.function_id = f.id
                    WHERE f.name = ?
                    ORDER BY i.created_at DESC
                    LIMIT ?;
                """.trimIndent()

                connection.prepareStatement(sql).use { stmt ->
                    stmt.setString(1, functionName)
                    stmt.setInt(2, limit)
                    stmt.executeQuery().use { rs ->
                        val results = mutableListOf<Map<String, Any>>()
                        while (rs.next()) {
                            results.add(
                                mapOf(
                                    "id" to rs.getString("id"),
                                    "status" to rs.getString("status"),
                                    "executionTime" to rs.getLong("execution_time_ms"),
                                    "memoryUsed" to (rs.getLong("memory_used_mb") ?: 0),
                                    "errorMessage" to (rs.getString("error_message") ?: ""),
                                    "createdAt" to rs.getTimestamp("created_at").toString(),
                                    "responseStatus" to (rs.getInt("response_status") ?: 0)
                                )
                            )
                        }
                        results
                    }
                }
            }

            ApiResponse(data = logs)
        } catch (e: Exception) {
            logger.error(e) { "Error getting function logs" }
            ApiResponse(error = ApiError("LOGS_ERROR", e.message ?: "Failed to get logs"))
        }
    }

    /**
     * Log function invocation
     */
    private suspend fun logInvocation(
        functionId: String,
        status: String,
        executionTime: Long,
        memoryUsed: Long,
        errorMessage: String?,
        responseStatus: Int
    ) {
        try {
            dbManager.withConnection { connection ->
                val sql = """
                    INSERT INTO functions.invocations (function_id, status, execution_time_ms, memory_used_mb, error_message, response_status)
                    VALUES (?, ?, ?, ?, ?, ?);
                """.trimIndent()

                connection.prepareStatement(sql).use { stmt ->
                    stmt.setObject(1, UUID.fromString(functionId))
                    stmt.setString(2, status)
                    stmt.setLong(3, executionTime)
                    stmt.setLong(4, memoryUsed)
                    stmt.setString(5, errorMessage)
                    stmt.setInt(6, responseStatus)
                    stmt.executeUpdate()
                }
            }
        } catch (e: Exception) {
            logger.warn { "Failed to log invocation: ${e.message}" }
        }
    }
}

/**
 * Deployed function metadata
 */
data class DeployedFunction(
    val id: String,
    val name: String,
    val sourceCode: String,
    val runtime: String,
    val envVars: Map<String, String>,
    val enabled: Boolean
)

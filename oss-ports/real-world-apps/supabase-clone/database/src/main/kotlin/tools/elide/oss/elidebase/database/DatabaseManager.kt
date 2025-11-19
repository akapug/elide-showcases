package tools.elide.oss.elidebase.database

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import io.github.oshai.kotlinlogging.KotlinLogging
import tools.elide.oss.elidebase.core.*
import java.sql.Connection
import java.sql.ResultSet
import java.sql.Statement
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.*

private val logger = KotlinLogging.logger {}

/**
 * Database connection pool manager
 */
class DatabaseManager(private val config: DatabaseConfig) {
    private val dataSource: HikariDataSource

    init {
        val hikariConfig = HikariConfig().apply {
            jdbcUrl = "jdbc:postgresql://${config.host}:${config.port}/${config.database}"
            username = config.username
            password = config.password
            maximumPoolSize = config.poolSize
            maxLifetime = config.maxLifetime
            connectionTimeout = config.connectionTimeout

            // Performance optimizations
            addDataSourceProperty("cachePrepStmts", "true")
            addDataSourceProperty("prepStmtCacheSize", "250")
            addDataSourceProperty("prepStmtCacheSqlLimit", "2048")
            addDataSourceProperty("useServerPrepStmts", "true")

            // SSL configuration
            if (config.ssl) {
                addDataSourceProperty("ssl", "true")
                addDataSourceProperty("sslmode", "require")
            }
        }

        dataSource = HikariDataSource(hikariConfig)
        logger.info { "Database connection pool initialized: ${config.host}:${config.port}/${config.database}" }
    }

    /**
     * Execute a query with connection from pool
     */
    suspend fun <T> withConnection(block: (Connection) -> T): T = withContext(Dispatchers.IO) {
        dataSource.connection.use { connection ->
            block(connection)
        }
    }

    /**
     * Execute a transaction
     */
    suspend fun <T> transaction(block: (Connection) -> T): T = withConnection { connection ->
        connection.autoCommit = false
        try {
            val result = block(connection)
            connection.commit()
            result
        } catch (e: Exception) {
            connection.rollback()
            throw e
        } finally {
            connection.autoCommit = true
        }
    }

    /**
     * Test connection
     */
    suspend fun testConnection(): Boolean = try {
        withConnection { connection ->
            connection.prepareStatement("SELECT 1").use { stmt ->
                stmt.executeQuery().use { rs ->
                    rs.next()
                }
            }
        }
        true
    } catch (e: Exception) {
        logger.error(e) { "Database connection test failed" }
        false
    }

    /**
     * Close the connection pool
     */
    fun close() {
        dataSource.close()
        logger.info { "Database connection pool closed" }
    }

    /**
     * Get pool statistics
     */
    fun getPoolStats(): Map<String, Any> = mapOf(
        "active" to dataSource.hikariPoolMXBean.activeConnections,
        "idle" to dataSource.hikariPoolMXBean.idleConnections,
        "total" to dataSource.hikariPoolMXBean.totalConnections,
        "waiting" to dataSource.hikariPoolMXBean.threadsAwaitingConnection
    )
}

/**
 * Query builder for REST API
 */
class QueryBuilder(
    private val schema: String = "public",
    private val table: String
) {
    private val filters = mutableListOf<QueryFilter>()
    private val sorts = mutableListOf<SortParam>()
    private var limit: Int? = null
    private var offset: Int? = null
    private val selectedColumns = mutableListOf<String>()
    private var countMode: Boolean = false

    fun select(vararg columns: String): QueryBuilder {
        selectedColumns.addAll(columns)
        return this
    }

    fun filter(column: String, operator: String, value: String): QueryBuilder {
        filters.add(QueryFilter(column, operator, value))
        return this
    }

    fun eq(column: String, value: Any): QueryBuilder = filter(column, "EQ", value.toString())
    fun neq(column: String, value: Any): QueryBuilder = filter(column, "NEQ", value.toString())
    fun gt(column: String, value: Any): QueryBuilder = filter(column, "GT", value.toString())
    fun gte(column: String, value: Any): QueryBuilder = filter(column, "GTE", value.toString())
    fun lt(column: String, value: Any): QueryBuilder = filter(column, "LT", value.toString())
    fun lte(column: String, value: Any): QueryBuilder = filter(column, "LTE", value.toString())
    fun like(column: String, pattern: String): QueryBuilder = filter(column, "LIKE", pattern)
    fun ilike(column: String, pattern: String): QueryBuilder = filter(column, "ILIKE", pattern)
    fun `in`(column: String, values: List<Any>): QueryBuilder = filter(column, "IN", values.joinToString(","))
    fun isNull(column: String): QueryBuilder = filter(column, "IS", "NULL")
    fun isNotNull(column: String): QueryBuilder = filter(column, "IS", "NOT NULL")

    fun order(column: String, ascending: Boolean = true, nullsFirst: Boolean = false): QueryBuilder {
        sorts.add(SortParam(column, if (ascending) "ASC" else "DESC", nullsFirst))
        return this
    }

    fun limit(count: Int): QueryBuilder {
        limit = count
        return this
    }

    fun offset(count: Int): QueryBuilder {
        offset = count
        return this
    }

    fun range(from: Int, to: Int): QueryBuilder {
        offset = from
        limit = to - from + 1
        return this
    }

    fun count(): QueryBuilder {
        countMode = true
        return this
    }

    /**
     * Build SELECT query
     */
    fun buildSelectQuery(): String {
        val columns = if (selectedColumns.isEmpty()) "*" else selectedColumns.joinToString(", ") { sanitizeSqlIdentifier(it) }
        val tableName = "${sanitizeSqlIdentifier(schema)}.${sanitizeSqlIdentifier(table)}"

        val query = StringBuilder()

        if (countMode) {
            query.append("SELECT COUNT(*) FROM $tableName")
        } else {
            query.append("SELECT $columns FROM $tableName")
        }

        if (filters.isNotEmpty()) {
            query.append(" WHERE ")
            query.append(buildWhereClause(filters))
        }

        if (sorts.isNotEmpty() && !countMode) {
            query.append(" ORDER BY ")
            query.append(buildOrderByClause(sorts))
        }

        if (limit != null && !countMode) {
            query.append(" LIMIT $limit")
        }

        if (offset != null && !countMode) {
            query.append(" OFFSET $offset")
        }

        return query.toString()
    }

    /**
     * Build INSERT query
     */
    fun buildInsertQuery(data: JsonObject): Pair<String, List<Any>> {
        val tableName = "${sanitizeSqlIdentifier(schema)}.${sanitizeSqlIdentifier(table)}"
        val columns = data.keys.map { sanitizeSqlIdentifier(it) }
        val values = data.values.toList()

        val placeholders = List(columns.size) { "?" }.joinToString(", ")
        val query = """
            INSERT INTO $tableName (${columns.joinToString(", ")})
            VALUES ($placeholders)
            RETURNING *
        """.trimIndent()

        return query to values.map { jsonElementToValue(it) }
    }

    /**
     * Build UPDATE query
     */
    fun buildUpdateQuery(data: JsonObject): Pair<String, List<Any>> {
        val tableName = "${sanitizeSqlIdentifier(schema)}.${sanitizeSqlIdentifier(table)}"
        val setClauses = data.keys.map { "${sanitizeSqlIdentifier(it)} = ?" }
        val values = data.values.map { jsonElementToValue(it) }.toMutableList()

        val query = StringBuilder()
        query.append("UPDATE $tableName SET ")
        query.append(setClauses.joinToString(", "))

        if (filters.isNotEmpty()) {
            query.append(" WHERE ")
            query.append(buildWhereClause(filters))
        }

        query.append(" RETURNING *")

        return query.toString() to values
    }

    /**
     * Build DELETE query
     */
    fun buildDeleteQuery(): String {
        val tableName = "${sanitizeSqlIdentifier(schema)}.${sanitizeSqlIdentifier(table)}"

        val query = StringBuilder()
        query.append("DELETE FROM $tableName")

        if (filters.isNotEmpty()) {
            query.append(" WHERE ")
            query.append(buildWhereClause(filters))
        }

        query.append(" RETURNING *")

        return query.toString()
    }

    /**
     * Build UPSERT query
     */
    fun buildUpsertQuery(data: JsonObject, conflictColumns: List<String>): Pair<String, List<Any>> {
        val tableName = "${sanitizeSqlIdentifier(schema)}.${sanitizeSqlIdentifier(table)}"
        val columns = data.keys.map { sanitizeSqlIdentifier(it) }
        val values = data.values.toList()

        val placeholders = List(columns.size) { "?" }.joinToString(", ")
        val updateClauses = columns.filter { !conflictColumns.contains(it) }
            .joinToString(", ") { "$it = EXCLUDED.$it" }

        val query = """
            INSERT INTO $tableName (${columns.joinToString(", ")})
            VALUES ($placeholders)
            ON CONFLICT (${conflictColumns.joinToString(", ") { sanitizeSqlIdentifier(it) }})
            DO UPDATE SET $updateClauses
            RETURNING *
        """.trimIndent()

        return query to values.map { jsonElementToValue(it) }
    }

    private fun jsonElementToValue(element: JsonElement): Any = when (element) {
        is JsonPrimitive -> when {
            element.isString -> element.content
            element.booleanOrNull != null -> element.boolean
            element.intOrNull != null -> element.int
            element.longOrNull != null -> element.long
            element.doubleOrNull != null -> element.double
            else -> element.content
        }
        is JsonNull -> null as Any
        else -> element.toString()
    }
}

/**
 * Database REST API handler
 */
class DatabaseRestAPI(private val manager: DatabaseManager) {

    /**
     * Execute SELECT query
     */
    suspend fun select(
        schema: String = "public",
        table: String,
        columns: List<String> = emptyList(),
        filters: List<QueryFilter> = emptyList(),
        sorts: List<SortParam> = emptyList(),
        limit: Int? = null,
        offset: Int? = null,
        count: Boolean = false
    ): ApiResponse<List<JsonObject>> = try {
        val queryBuilder = QueryBuilder(schema, table).apply {
            if (columns.isNotEmpty()) select(*columns.toTypedArray())
            filters.forEach { filter(it.column, it.operator, it.value) }
            sorts.forEach { order(it.column, it.direction == "ASC", it.nullsFirst) }
            limit?.let { limit(it) }
            offset?.let { offset(it) }
            if (count) count()
        }

        val query = queryBuilder.buildSelectQuery()
        logger.debug { "Executing query: $query" }

        val results = manager.withConnection { connection ->
            connection.prepareStatement(query).use { stmt ->
                stmt.executeQuery().use { rs ->
                    val rows = mutableListOf<JsonObject>()
                    while (rs.next()) {
                        rows.add(resultSetToJson(rs))
                    }
                    rows
                }
            }
        }

        val totalCount = if (count) {
            results.firstOrNull()?.get("count")?.jsonPrimitive?.long
        } else null

        ApiResponse(data = results, count = totalCount)
    } catch (e: Exception) {
        logger.error(e) { "Error executing SELECT query" }
        ApiResponse(error = ApiError("DATABASE_ERROR", e.message ?: "Unknown error"))
    }

    /**
     * Execute INSERT query
     */
    suspend fun insert(
        schema: String = "public",
        table: String,
        data: JsonObject,
        returning: Boolean = true
    ): ApiResponse<JsonObject> = try {
        val queryBuilder = QueryBuilder(schema, table)
        val (query, values) = queryBuilder.buildInsertQuery(data)
        logger.debug { "Executing insert: $query with values: $values" }

        val result = manager.withConnection { connection ->
            connection.prepareStatement(query).use { stmt ->
                values.forEachIndexed { index, value ->
                    stmt.setObject(index + 1, value)
                }
                stmt.executeQuery().use { rs ->
                    if (rs.next()) resultSetToJson(rs) else null
                }
            }
        }

        ApiResponse(data = result)
    } catch (e: Exception) {
        logger.error(e) { "Error executing INSERT query" }
        ApiResponse(error = ApiError("DATABASE_ERROR", e.message ?: "Unknown error"))
    }

    /**
     * Execute UPDATE query
     */
    suspend fun update(
        schema: String = "public",
        table: String,
        data: JsonObject,
        filters: List<QueryFilter> = emptyList()
    ): ApiResponse<List<JsonObject>> = try {
        val queryBuilder = QueryBuilder(schema, table).apply {
            filters.forEach { filter(it.column, it.operator, it.value) }
        }
        val (query, values) = queryBuilder.buildUpdateQuery(data)
        logger.debug { "Executing update: $query with values: $values" }

        val results = manager.withConnection { connection ->
            connection.prepareStatement(query).use { stmt ->
                values.forEachIndexed { index, value ->
                    stmt.setObject(index + 1, value)
                }
                stmt.executeQuery().use { rs ->
                    val rows = mutableListOf<JsonObject>()
                    while (rs.next()) {
                        rows.add(resultSetToJson(rs))
                    }
                    rows
                }
            }
        }

        ApiResponse(data = results)
    } catch (e: Exception) {
        logger.error(e) { "Error executing UPDATE query" }
        ApiResponse(error = ApiError("DATABASE_ERROR", e.message ?: "Unknown error"))
    }

    /**
     * Execute DELETE query
     */
    suspend fun delete(
        schema: String = "public",
        table: String,
        filters: List<QueryFilter> = emptyList()
    ): ApiResponse<List<JsonObject>> = try {
        val queryBuilder = QueryBuilder(schema, table).apply {
            filters.forEach { filter(it.column, it.operator, it.value) }
        }
        val query = queryBuilder.buildDeleteQuery()
        logger.debug { "Executing delete: $query" }

        val results = manager.withConnection { connection ->
            connection.prepareStatement(query).use { stmt ->
                stmt.executeQuery().use { rs ->
                    val rows = mutableListOf<JsonObject>()
                    while (rs.next()) {
                        rows.add(resultSetToJson(rs))
                    }
                    rows
                }
            }
        }

        ApiResponse(data = results)
    } catch (e: Exception) {
        logger.error(e) { "Error executing DELETE query" }
        ApiResponse(error = ApiError("DATABASE_ERROR", e.message ?: "Unknown error"))
    }

    /**
     * Execute UPSERT query
     */
    suspend fun upsert(
        schema: String = "public",
        table: String,
        data: JsonObject,
        conflictColumns: List<String>
    ): ApiResponse<JsonObject> = try {
        val queryBuilder = QueryBuilder(schema, table)
        val (query, values) = queryBuilder.buildUpsertQuery(data, conflictColumns)
        logger.debug { "Executing upsert: $query with values: $values" }

        val result = manager.withConnection { connection ->
            connection.prepareStatement(query).use { stmt ->
                values.forEachIndexed { index, value ->
                    stmt.setObject(index + 1, value)
                }
                stmt.executeQuery().use { rs ->
                    if (rs.next()) resultSetToJson(rs) else null
                }
            }
        }

        ApiResponse(data = result)
    } catch (e: Exception) {
        logger.error(e) { "Error executing UPSERT query" }
        ApiResponse(error = ApiError("DATABASE_ERROR", e.message ?: "Unknown error"))
    }

    /**
     * Execute raw SQL query
     */
    suspend fun executeRaw(sql: String): ApiResponse<List<JsonObject>> = try {
        logger.debug { "Executing raw SQL: $sql" }

        val results = manager.withConnection { connection ->
            connection.createStatement().use { stmt ->
                val hasResultSet = stmt.execute(sql)
                if (hasResultSet) {
                    stmt.resultSet.use { rs ->
                        val rows = mutableListOf<JsonObject>()
                        while (rs.next()) {
                            rows.add(resultSetToJson(rs))
                        }
                        rows
                    }
                } else {
                    emptyList()
                }
            }
        }

        ApiResponse(data = results)
    } catch (e: Exception) {
        logger.error(e) { "Error executing raw SQL" }
        ApiResponse(error = ApiError("DATABASE_ERROR", e.message ?: "Unknown error"))
    }

    /**
     * Convert ResultSet row to JSON object
     */
    private fun resultSetToJson(rs: ResultSet): JsonObject {
        val metadata = rs.metaData
        val map = mutableMapOf<String, JsonElement>()

        for (i in 1..metadata.columnCount) {
            val columnName = metadata.getColumnName(i)
            val value = rs.getObject(i)

            map[columnName] = when (value) {
                null -> JsonNull
                is String -> JsonPrimitive(value)
                is Number -> JsonPrimitive(value)
                is Boolean -> JsonPrimitive(value)
                else -> JsonPrimitive(value.toString())
            }
        }

        return JsonObject(map)
    }
}

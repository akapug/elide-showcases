package tools.elide.oss.elidebase.database

import io.github.oshai.kotlinlogging.KotlinLogging
import tools.elide.oss.elidebase.core.*

private val logger = KotlinLogging.logger {}

/**
 * Row Level Security (RLS) policy manager
 */
class RLSManager(private val manager: DatabaseManager) {

    /**
     * Enable RLS on a table
     */
    suspend fun enableRLS(schema: String = "public", table: String): ApiResponse<Unit> = try {
        val sql = """
            ALTER TABLE ${sanitizeSqlIdentifier(schema)}.${sanitizeSqlIdentifier(table)}
            ENABLE ROW LEVEL SECURITY;
        """.trimIndent()

        manager.withConnection { connection ->
            connection.createStatement().use { stmt ->
                stmt.execute(sql)
            }
        }

        logger.info { "RLS enabled on $schema.$table" }
        ApiResponse(data = Unit)
    } catch (e: Exception) {
        logger.error(e) { "Error enabling RLS" }
        ApiResponse(error = ApiError("RLS_ERROR", e.message ?: "Failed to enable RLS"))
    }

    /**
     * Disable RLS on a table
     */
    suspend fun disableRLS(schema: String = "public", table: String): ApiResponse<Unit> = try {
        val sql = """
            ALTER TABLE ${sanitizeSqlIdentifier(schema)}.${sanitizeSqlIdentifier(table)}
            DISABLE ROW LEVEL SECURITY;
        """.trimIndent()

        manager.withConnection { connection ->
            connection.createStatement().use { stmt ->
                stmt.execute(sql)
            }
        }

        logger.info { "RLS disabled on $schema.$table" }
        ApiResponse(data = Unit)
    } catch (e: Exception) {
        logger.error(e) { "Error disabling RLS" }
        ApiResponse(error = ApiError("RLS_ERROR", e.message ?: "Failed to disable RLS"))
    }

    /**
     * Create RLS policy
     */
    suspend fun createPolicy(policy: RLSPolicy): ApiResponse<Unit> = try {
        val tableName = "${sanitizeSqlIdentifier(policy.table)}"
        val policyName = sanitizeSqlIdentifier(policy.name)
        val command = policy.command.uppercase()

        val sql = buildString {
            append("CREATE POLICY $policyName ON $tableName\n")
            append("FOR $command\n")
            append("TO ${policy.role}\n")
            append("USING (${policy.using})")

            if (policy.check != null && command in listOf("INSERT", "UPDATE", "ALL")) {
                append("\n")
                append("WITH CHECK (${policy.check})")
            }

            append(";")
        }

        manager.withConnection { connection ->
            connection.createStatement().use { stmt ->
                stmt.execute(sql)
            }
        }

        logger.info { "RLS policy '${policy.name}' created on ${policy.table}" }
        ApiResponse(data = Unit)
    } catch (e: Exception) {
        logger.error(e) { "Error creating RLS policy" }
        ApiResponse(error = ApiError("RLS_ERROR", e.message ?: "Failed to create policy"))
    }

    /**
     * Drop RLS policy
     */
    suspend fun dropPolicy(
        policyName: String,
        table: String,
        schema: String = "public"
    ): ApiResponse<Unit> = try {
        val sql = """
            DROP POLICY IF EXISTS ${sanitizeSqlIdentifier(policyName)}
            ON ${sanitizeSqlIdentifier(schema)}.${sanitizeSqlIdentifier(table)};
        """.trimIndent()

        manager.withConnection { connection ->
            connection.createStatement().use { stmt ->
                stmt.execute(sql)
            }
        }

        logger.info { "RLS policy '$policyName' dropped from $table" }
        ApiResponse(data = Unit)
    } catch (e: Exception) {
        logger.error(e) { "Error dropping RLS policy" }
        ApiResponse(error = ApiError("RLS_ERROR", e.message ?: "Failed to drop policy"))
    }

    /**
     * List all policies for a table
     */
    suspend fun listPolicies(
        table: String,
        schema: String = "public"
    ): ApiResponse<List<RLSPolicy>> = try {
        val sql = """
            SELECT
                pol.polname AS policy_name,
                tab.relname AS table_name,
                CASE pol.polcmd
                    WHEN 'r' THEN 'SELECT'
                    WHEN 'a' THEN 'INSERT'
                    WHEN 'w' THEN 'UPDATE'
                    WHEN 'd' THEN 'DELETE'
                    WHEN '*' THEN 'ALL'
                END AS command,
                rol.rolname AS role_name,
                pg_get_expr(pol.polqual, pol.polrelid) AS using_expr,
                pg_get_expr(pol.polwithcheck, pol.polrelid) AS check_expr
            FROM pg_policy pol
            JOIN pg_class tab ON pol.polrelid = tab.oid
            JOIN pg_namespace nsp ON tab.relnamespace = nsp.oid
            JOIN pg_roles rol ON pol.polroles @> ARRAY[rol.oid]
            WHERE nsp.nspname = ? AND tab.relname = ?
            ORDER BY pol.polname;
        """.trimIndent()

        val policies = manager.withConnection { connection ->
            connection.prepareStatement(sql).use { stmt ->
                stmt.setString(1, schema)
                stmt.setString(2, table)
                stmt.executeQuery().use { rs ->
                    val results = mutableListOf<RLSPolicy>()
                    while (rs.next()) {
                        results.add(
                            RLSPolicy(
                                name = rs.getString("policy_name"),
                                table = rs.getString("table_name"),
                                command = rs.getString("command"),
                                using = rs.getString("using_expr") ?: "true",
                                check = rs.getString("check_expr"),
                                role = rs.getString("role_name")
                            )
                        )
                    }
                    results
                }
            }
        }

        ApiResponse(data = policies)
    } catch (e: Exception) {
        logger.error(e) { "Error listing RLS policies" }
        ApiResponse(error = ApiError("RLS_ERROR", e.message ?: "Failed to list policies"))
    }

    /**
     * Create common authentication-based policies
     */
    suspend fun createAuthPolicies(table: String, schema: String = "public"): ApiResponse<Unit> = try {
        // Enable RLS first
        enableRLS(schema, table)

        // Create select policy for authenticated users
        createPolicy(
            RLSPolicy(
                name = "${table}_select_auth",
                table = table,
                command = "SELECT",
                using = "auth.uid() IS NOT NULL",
                role = "authenticated"
            )
        )

        // Create insert policy for authenticated users (own records)
        createPolicy(
            RLSPolicy(
                name = "${table}_insert_own",
                table = table,
                command = "INSERT",
                using = "true",
                check = "auth.uid() = user_id",
                role = "authenticated"
            )
        )

        // Create update policy for own records
        createPolicy(
            RLSPolicy(
                name = "${table}_update_own",
                table = table,
                command = "UPDATE",
                using = "auth.uid() = user_id",
                check = "auth.uid() = user_id",
                role = "authenticated"
            )
        )

        // Create delete policy for own records
        createPolicy(
            RLSPolicy(
                name = "${table}_delete_own",
                table = table,
                command = "DELETE",
                using = "auth.uid() = user_id",
                role = "authenticated"
            )
        )

        logger.info { "Authentication-based RLS policies created for $table" }
        ApiResponse(data = Unit)
    } catch (e: Exception) {
        logger.error(e) { "Error creating auth policies" }
        ApiResponse(error = ApiError("RLS_ERROR", e.message ?: "Failed to create auth policies"))
    }

    /**
     * Set current user context (for RLS evaluation)
     */
    suspend fun setUserContext(userId: String?, role: String = "authenticated"): ApiResponse<Unit> = try {
        val sql = buildString {
            append("SET LOCAL role = '${sanitizeSqlIdentifier(role)}';")
            if (userId != null) {
                append("\nSET LOCAL request.jwt.claim.sub = '$userId';")
            }
        }

        manager.withConnection { connection ->
            connection.createStatement().use { stmt ->
                stmt.execute(sql)
            }
        }

        ApiResponse(data = Unit)
    } catch (e: Exception) {
        logger.error(e) { "Error setting user context" }
        ApiResponse(error = ApiError("RLS_ERROR", e.message ?: "Failed to set user context"))
    }
}

/**
 * Database schema manager
 */
class SchemaManager(private val manager: DatabaseManager) {

    /**
     * Create a new table
     */
    suspend fun createTable(
        schema: String = "public",
        table: String,
        columns: Map<String, String>,
        primaryKey: List<String> = listOf("id"),
        foreignKeys: Map<String, Pair<String, String>> = emptyMap()
    ): ApiResponse<Unit> = try {
        val columnDefs = columns.map { (name, type) ->
            "${sanitizeSqlIdentifier(name)} $type"
        }.toMutableList()

        // Add primary key
        if (primaryKey.isNotEmpty()) {
            val pkColumns = primaryKey.joinToString(", ") { sanitizeSqlIdentifier(it) }
            columnDefs.add("PRIMARY KEY ($pkColumns)")
        }

        // Add foreign keys
        foreignKeys.forEach { (column, ref) ->
            val (refTable, refColumn) = ref
            columnDefs.add(
                "FOREIGN KEY (${sanitizeSqlIdentifier(column)}) " +
                "REFERENCES ${sanitizeSqlIdentifier(refTable)}(${sanitizeSqlIdentifier(refColumn)})"
            )
        }

        val sql = """
            CREATE TABLE IF NOT EXISTS ${sanitizeSqlIdentifier(schema)}.${sanitizeSqlIdentifier(table)} (
                ${columnDefs.joinToString(",\n    ")}
            );
        """.trimIndent()

        manager.withConnection { connection ->
            connection.createStatement().use { stmt ->
                stmt.execute(sql)
            }
        }

        logger.info { "Table $schema.$table created" }
        ApiResponse(data = Unit)
    } catch (e: Exception) {
        logger.error(e) { "Error creating table" }
        ApiResponse(error = ApiError("SCHEMA_ERROR", e.message ?: "Failed to create table"))
    }

    /**
     * Drop a table
     */
    suspend fun dropTable(
        schema: String = "public",
        table: String,
        cascade: Boolean = false
    ): ApiResponse<Unit> = try {
        val cascadeClause = if (cascade) "CASCADE" else ""
        val sql = """
            DROP TABLE IF EXISTS ${sanitizeSqlIdentifier(schema)}.${sanitizeSqlIdentifier(table)} $cascadeClause;
        """.trimIndent()

        manager.withConnection { connection ->
            connection.createStatement().use { stmt ->
                stmt.execute(sql)
            }
        }

        logger.info { "Table $schema.$table dropped" }
        ApiResponse(data = Unit)
    } catch (e: Exception) {
        logger.error(e) { "Error dropping table" }
        ApiResponse(error = ApiError("SCHEMA_ERROR", e.message ?: "Failed to drop table"))
    }

    /**
     * Add column to table
     */
    suspend fun addColumn(
        schema: String = "public",
        table: String,
        column: String,
        type: String,
        default: String? = null,
        nullable: Boolean = true
    ): ApiResponse<Unit> = try {
        val notNullClause = if (!nullable) "NOT NULL" else ""
        val defaultClause = if (default != null) "DEFAULT $default" else ""

        val sql = """
            ALTER TABLE ${sanitizeSqlIdentifier(schema)}.${sanitizeSqlIdentifier(table)}
            ADD COLUMN ${sanitizeSqlIdentifier(column)} $type $notNullClause $defaultClause;
        """.trimIndent()

        manager.withConnection { connection ->
            connection.createStatement().use { stmt ->
                stmt.execute(sql)
            }
        }

        logger.info { "Column $column added to $schema.$table" }
        ApiResponse(data = Unit)
    } catch (e: Exception) {
        logger.error(e) { "Error adding column" }
        ApiResponse(error = ApiError("SCHEMA_ERROR", e.message ?: "Failed to add column"))
    }

    /**
     * Create index
     */
    suspend fun createIndex(
        schema: String = "public",
        table: String,
        columns: List<String>,
        indexName: String? = null,
        unique: Boolean = false
    ): ApiResponse<Unit> = try {
        val name = indexName ?: "${table}_${columns.joinToString("_")}_idx"
        val uniqueClause = if (unique) "UNIQUE" else ""
        val columnList = columns.joinToString(", ") { sanitizeSqlIdentifier(it) }

        val sql = """
            CREATE $uniqueClause INDEX IF NOT EXISTS ${sanitizeSqlIdentifier(name)}
            ON ${sanitizeSqlIdentifier(schema)}.${sanitizeSqlIdentifier(table)} ($columnList);
        """.trimIndent()

        manager.withConnection { connection ->
            connection.createStatement().use { stmt ->
                stmt.execute(sql)
            }
        }

        logger.info { "Index $name created on $schema.$table" }
        ApiResponse(data = Unit)
    } catch (e: Exception) {
        logger.error(e) { "Error creating index" }
        ApiResponse(error = ApiError("SCHEMA_ERROR", e.message ?: "Failed to create index"))
    }

    /**
     * List all tables in schema
     */
    suspend fun listTables(schema: String = "public"): ApiResponse<List<String>> = try {
        val sql = """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = ? AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """.trimIndent()

        val tables = manager.withConnection { connection ->
            connection.prepareStatement(sql).use { stmt ->
                stmt.setString(1, schema)
                stmt.executeQuery().use { rs ->
                    val results = mutableListOf<String>()
                    while (rs.next()) {
                        results.add(rs.getString("table_name"))
                    }
                    results
                }
            }
        }

        ApiResponse(data = tables)
    } catch (e: Exception) {
        logger.error(e) { "Error listing tables" }
        ApiResponse(error = ApiError("SCHEMA_ERROR", e.message ?: "Failed to list tables"))
    }

    /**
     * Get table schema information
     */
    suspend fun describeTable(
        schema: String = "public",
        table: String
    ): ApiResponse<Map<String, Any>> = try {
        val columnsSql = """
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = ? AND table_name = ?
            ORDER BY ordinal_position;
        """.trimIndent()

        val columns = manager.withConnection { connection ->
            connection.prepareStatement(columnsSql).use { stmt ->
                stmt.setString(1, schema)
                stmt.setString(2, table)
                stmt.executeQuery().use { rs ->
                    val results = mutableListOf<Map<String, String?>>()
                    while (rs.next()) {
                        results.add(
                            mapOf(
                                "name" to rs.getString("column_name"),
                                "type" to rs.getString("data_type"),
                                "nullable" to rs.getString("is_nullable"),
                                "default" to rs.getString("column_default")
                            )
                        )
                    }
                    results
                }
            }
        }

        val info = mapOf(
            "schema" to schema,
            "table" to table,
            "columns" to columns
        )

        ApiResponse(data = info)
    } catch (e: Exception) {
        logger.error(e) { "Error describing table" }
        ApiResponse(error = ApiError("SCHEMA_ERROR", e.message ?: "Failed to describe table"))
    }
}

package tools.elide.oss.elidebase.database

import io.github.oshai.kotlinlogging.KotlinLogging
import tools.elide.oss.elidebase.core.*
import java.io.File
import java.time.Instant

private val logger = KotlinLogging.logger {}

/**
 * Database migration manager
 */
class MigrationManager(private val manager: DatabaseManager) {

    companion object {
        private const val MIGRATIONS_TABLE = "schema_migrations"
    }

    init {
        // Create migrations table if it doesn't exist
        runBlocking {
            createMigrationsTable()
        }
    }

    /**
     * Create migrations tracking table
     */
    private suspend fun createMigrationsTable() {
        val sql = """
            CREATE TABLE IF NOT EXISTS $MIGRATIONS_TABLE (
                version BIGINT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                execution_time_ms BIGINT NOT NULL
            );
        """.trimIndent()

        manager.withConnection { connection ->
            connection.createStatement().use { stmt ->
                stmt.execute(sql)
            }
        }
    }

    /**
     * Apply a migration
     */
    suspend fun migrate(migration: Migration): ApiResponse<Unit> = try {
        val startTime = System.currentTimeMillis()

        manager.transaction { connection ->
            // Execute the migration
            connection.createStatement().use { stmt ->
                stmt.execute(migration.up)
            }

            // Record the migration
            val recordSql = """
                INSERT INTO $MIGRATIONS_TABLE (version, name, applied_at, execution_time_ms)
                VALUES (?, ?, ?, ?);
            """.trimIndent()

            connection.prepareStatement(recordSql).use { stmt ->
                stmt.setLong(1, migration.version)
                stmt.setString(2, migration.name)
                stmt.setTimestamp(3, java.sql.Timestamp.from(Instant.now()))
                stmt.setLong(4, System.currentTimeMillis() - startTime)
                stmt.executeUpdate()
            }
        }

        logger.info { "Migration ${migration.version} (${migration.name}) applied successfully" }
        ApiResponse(data = Unit)
    } catch (e: Exception) {
        logger.error(e) { "Error applying migration ${migration.version}" }
        ApiResponse(error = ApiError("MIGRATION_ERROR", e.message ?: "Failed to apply migration"))
    }

    /**
     * Rollback a migration
     */
    suspend fun rollback(migration: Migration): ApiResponse<Unit> = try {
        manager.transaction { connection ->
            // Execute the rollback
            connection.createStatement().use { stmt ->
                stmt.execute(migration.down)
            }

            // Remove the migration record
            val deleteSql = "DELETE FROM $MIGRATIONS_TABLE WHERE version = ?;"
            connection.prepareStatement(deleteSql).use { stmt ->
                stmt.setLong(1, migration.version)
                stmt.executeUpdate()
            }
        }

        logger.info { "Migration ${migration.version} (${migration.name}) rolled back successfully" }
        ApiResponse(data = Unit)
    } catch (e: Exception) {
        logger.error(e) { "Error rolling back migration ${migration.version}" }
        ApiResponse(error = ApiError("MIGRATION_ERROR", e.message ?: "Failed to rollback migration"))
    }

    /**
     * Get list of applied migrations
     */
    suspend fun getAppliedMigrations(): ApiResponse<List<Migration>> = try {
        val sql = """
            SELECT version, name, applied_at
            FROM $MIGRATIONS_TABLE
            ORDER BY version DESC;
        """.trimIndent()

        val migrations = manager.withConnection { connection ->
            connection.createStatement().use { stmt ->
                stmt.executeQuery(sql).use { rs ->
                    val results = mutableListOf<Migration>()
                    while (rs.next()) {
                        results.add(
                            Migration(
                                version = rs.getLong("version"),
                                name = rs.getString("name"),
                                up = "",
                                down = "",
                                appliedAt = rs.getTimestamp("applied_at").toString()
                            )
                        )
                    }
                    results
                }
            }
        }

        ApiResponse(data = migrations)
    } catch (e: Exception) {
        logger.error(e) { "Error listing migrations" }
        ApiResponse(error = ApiError("MIGRATION_ERROR", e.message ?: "Failed to list migrations"))
    }

    /**
     * Check if migration has been applied
     */
    suspend fun isMigrationApplied(version: Long): Boolean = try {
        val sql = "SELECT 1 FROM $MIGRATIONS_TABLE WHERE version = ?;"

        manager.withConnection { connection ->
            connection.prepareStatement(sql).use { stmt ->
                stmt.setLong(1, version)
                stmt.executeQuery().use { rs ->
                    rs.next()
                }
            }
        }
    } catch (e: Exception) {
        false
    }

    /**
     * Run all pending migrations from a directory
     */
    suspend fun migrateAll(migrationsDir: File): ApiResponse<List<Migration>> = try {
        val appliedMigrations = mutableListOf<Migration>()

        if (!migrationsDir.exists() || !migrationsDir.isDirectory) {
            return ApiResponse(error = ApiError("MIGRATION_ERROR", "Migrations directory not found"))
        }

        // Load and sort migration files
        val migrationFiles = migrationsDir.listFiles { file ->
            file.extension == "sql" && file.name.matches(Regex("\\d+_.+\\.sql"))
        }?.sortedBy { file ->
            file.name.substringBefore("_").toLongOrNull() ?: 0L
        } ?: emptyList()

        for (file in migrationFiles) {
            val version = file.name.substringBefore("_").toLongOrNull() ?: continue
            val name = file.name.substringAfter("_").substringBefore(".sql")

            // Skip if already applied
            if (isMigrationApplied(version)) {
                logger.info { "Migration $version ($name) already applied, skipping" }
                continue
            }

            // Parse migration file (expecting up and down sections)
            val content = file.readText()
            val (up, down) = parseMigrationFile(content)

            val migration = Migration(
                version = version,
                name = name,
                up = up,
                down = down
            )

            val result = migrate(migration)
            if (result.error != null) {
                return ApiResponse(error = result.error)
            }

            appliedMigrations.add(migration)
        }

        ApiResponse(data = appliedMigrations)
    } catch (e: Exception) {
        logger.error(e) { "Error running migrations" }
        ApiResponse(error = ApiError("MIGRATION_ERROR", e.message ?: "Failed to run migrations"))
    }

    /**
     * Parse migration file into up and down sections
     */
    private fun parseMigrationFile(content: String): Pair<String, String> {
        val lines = content.lines()
        val upLines = mutableListOf<String>()
        val downLines = mutableListOf<String>()
        var currentSection: MutableList<String>? = null

        for (line in lines) {
            when {
                line.trim().equals("-- +migrate Up", ignoreCase = true) -> {
                    currentSection = upLines
                }
                line.trim().equals("-- +migrate Down", ignoreCase = true) -> {
                    currentSection = downLines
                }
                currentSection != null && !line.trim().startsWith("--") -> {
                    currentSection.add(line)
                }
            }
        }

        return upLines.joinToString("\n").trim() to downLines.joinToString("\n").trim()
    }

    /**
     * Generate a new migration file template
     */
    fun generateMigration(name: String, outputDir: File): File {
        if (!outputDir.exists()) {
            outputDir.mkdirs()
        }

        val version = System.currentTimeMillis()
        val fileName = "${version}_$name.sql"
        val file = File(outputDir, fileName)

        val template = """
            -- +migrate Up
            -- SQL for applying this migration


            -- +migrate Down
            -- SQL for rolling back this migration

        """.trimIndent()

        file.writeText(template)
        logger.info { "Generated migration file: ${file.absolutePath}" }

        return file
    }
}

/**
 * Helper function for running blocking code in coroutine context
 */
private fun <T> runBlocking(block: suspend () -> T): T {
    return kotlinx.coroutines.runBlocking {
        block()
    }
}

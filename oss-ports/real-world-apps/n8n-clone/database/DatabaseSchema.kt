package dev.elide.workflow.database

import org.jetbrains.exposed.dao.id.UUIDTable
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.javatime.timestamp
import org.jetbrains.exposed.sql.transactions.transaction
import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import dev.elide.workflow.models.*
import kotlinx.serialization.json.*
import kotlinx.serialization.encodeToString
import kotlinx.serialization.decodeFromString
import java.util.UUID

/**
 * Database tables
 */
object Workflows : UUIDTable("workflows") {
    val name = varchar("name", 255)
    val description = text("description").default("")
    val active = bool("active").default(false)
    val nodes = text("nodes")
    val connections = text("connections")
    val settings = text("settings")
    val tags = text("tags")
    val createdAt = timestamp("created_at")
    val updatedAt = timestamp("updated_at")
    val createdBy = varchar("created_by", 255).nullable()
}

object Executions : UUIDTable("executions") {
    val workflowId = varchar("workflow_id", 255)
    val mode = varchar("mode", 50)
    val status = varchar("status", 50)
    val data = text("data")
    val startedAt = timestamp("started_at")
    val stoppedAt = timestamp("stopped_at").nullable()
    val error = text("error").nullable()
    val retryOf = varchar("retry_of", 255).nullable()
    val retrySuccessId = varchar("retry_success_id", 255).nullable()
}

object Credentials : UUIDTable("credentials") {
    val name = varchar("name", 255)
    val type = varchar("type", 100)
    val data = text("data") // Encrypted
    val createdAt = timestamp("created_at")
    val updatedAt = timestamp("updated_at")
    val createdBy = varchar("created_by", 255).nullable()
}

object WebhookRegistrations : UUIDTable("webhook_registrations") {
    val workflowId = varchar("workflow_id", 255)
    val nodeId = varchar("node_id", 255)
    val path = varchar("path", 500)
    val method = varchar("method", 10)
    val isTest = bool("is_test").default(false)
    val createdAt = timestamp("created_at")
}

object ScheduleTriggers : UUIDTable("schedule_triggers") {
    val workflowId = varchar("workflow_id", 255)
    val nodeId = varchar("node_id", 255)
    val cronExpression = varchar("cron_expression", 100)
    val timezone = varchar("timezone", 50).default("UTC")
    val enabled = bool("enabled").default(true)
    val createdAt = timestamp("created_at")
}

object Users : UUIDTable("users") {
    val email = varchar("email", 255).uniqueIndex()
    val firstName = varchar("first_name", 100)
    val lastName = varchar("last_name", 100)
    val passwordHash = varchar("password_hash", 255)
    val role = varchar("role", 50)
    val settings = text("settings")
    val createdAt = timestamp("created_at")
}

/**
 * Database connection manager
 */
class DatabaseManager(
    private val host: String = "localhost",
    private val port: Int = 5432,
    private val database: String = "elide_workflow",
    private val user: String = "postgres",
    private val password: String = ""
) {
    private val dataSource: HikariDataSource

    init {
        val config = HikariConfig().apply {
            jdbcUrl = "jdbc:postgresql://$host:$port/$database"
            username = user
            this.password = password
            driverClassName = "org.postgresql.Driver"
            maximumPoolSize = 10
        }

        dataSource = HikariDataSource(config)

        Database.connect(dataSource)

        // Create tables
        transaction {
            SchemaUtils.create(
                Workflows,
                Executions,
                Credentials,
                WebhookRegistrations,
                ScheduleTriggers,
                Users
            )
        }
    }

    fun close() {
        dataSource.close()
    }
}

/**
 * Workflow repository implementation
 */
class WorkflowRepository {
    private val json = Json { ignoreUnknownKeys = true }

    suspend fun save(workflow: Workflow) {
        transaction {
            val existing = Workflows.select { Workflows.id eq UUID.fromString(workflow.id) }
                .singleOrNull()

            if (existing != null) {
                Workflows.update({ Workflows.id eq UUID.fromString(workflow.id) }) {
                    it[name] = workflow.name
                    it[description] = workflow.description
                    it[active] = workflow.active
                    it[nodes] = json.encodeToString(workflow.nodes)
                    it[connections] = json.encodeToString(workflow.connections)
                    it[settings] = json.encodeToString(workflow.settings)
                    it[tags] = json.encodeToString(workflow.tags)
                    it[updatedAt] = workflow.updatedAt
                }
            } else {
                Workflows.insert {
                    it[id] = UUID.fromString(workflow.id)
                    it[name] = workflow.name
                    it[description] = workflow.description
                    it[active] = workflow.active
                    it[nodes] = json.encodeToString(workflow.nodes)
                    it[connections] = json.encodeToString(workflow.connections)
                    it[settings] = json.encodeToString(workflow.settings)
                    it[tags] = json.encodeToString(workflow.tags)
                    it[createdAt] = workflow.createdAt
                    it[updatedAt] = workflow.updatedAt
                    it[createdBy] = workflow.createdBy
                }
            }
        }
    }

    suspend fun getById(id: String): Workflow? {
        return transaction {
            Workflows.select { Workflows.id eq UUID.fromString(id) }
                .map { rowToWorkflow(it) }
                .singleOrNull()
        }
    }

    suspend fun getAll(active: Boolean? = null, limit: Int = 100): List<Workflow> {
        return transaction {
            val query = if (active != null) {
                Workflows.select { Workflows.active eq active }
            } else {
                Workflows.selectAll()
            }

            query.limit(limit).map { rowToWorkflow(it) }
        }
    }

    suspend fun delete(id: String) {
        transaction {
            Workflows.deleteWhere { Workflows.id eq UUID.fromString(id) }
        }
    }

    private fun rowToWorkflow(row: ResultRow): Workflow {
        return Workflow(
            id = row[Workflows.id].toString(),
            name = row[Workflows.name],
            description = row[Workflows.description],
            active = row[Workflows.active],
            nodes = json.decodeFromString(row[Workflows.nodes]),
            connections = json.decodeFromString(row[Workflows.connections]),
            settings = json.decodeFromString(row[Workflows.settings]),
            tags = json.decodeFromString(row[Workflows.tags]),
            createdAt = row[Workflows.createdAt],
            updatedAt = row[Workflows.updatedAt],
            createdBy = row[Workflows.createdBy]
        )
    }
}

/**
 * Execution repository implementation
 */
class ExecutionRepositoryImpl : dev.elide.workflow.execution.ExecutionRepository {
    private val json = Json { ignoreUnknownKeys = true }

    override suspend fun save(execution: WorkflowExecution) {
        transaction {
            val existing = Executions.select { Executions.id eq UUID.fromString(execution.id) }
                .singleOrNull()

            if (existing != null) {
                Executions.update({ Executions.id eq UUID.fromString(execution.id) }) {
                    it[status] = execution.status.name
                    it[data] = json.encodeToString(execution.data)
                    it[stoppedAt] = execution.stoppedAt
                    it[error] = execution.error
                }
            } else {
                Executions.insert {
                    it[id] = UUID.fromString(execution.id)
                    it[workflowId] = execution.workflowId
                    it[mode] = execution.mode.name
                    it[status] = execution.status.name
                    it[data] = json.encodeToString(execution.data)
                    it[startedAt] = execution.startedAt
                    it[stoppedAt] = execution.stoppedAt
                    it[error] = execution.error
                    it[retryOf] = execution.retryOf
                    it[retrySuccessId] = execution.retrySuccessId
                }
            }
        }
    }

    override suspend fun updateProgress(
        executionId: String,
        resultData: Map<String, List<NodeExecutionData>>,
        executionData: Map<String, NodeExecutionInfo>
    ) {
        transaction {
            Executions.update({ Executions.id eq UUID.fromString(executionId) }) {
                it[data] = json.encodeToString(
                    ExecutionData(
                        resultData = resultData,
                        executionData = executionData
                    )
                )
            }
        }
    }

    override suspend fun getExecution(executionId: String): WorkflowExecution? {
        return transaction {
            Executions.select { Executions.id eq UUID.fromString(executionId) }
                .map { rowToExecution(it) }
                .singleOrNull()
        }
    }

    override suspend fun getExecutions(
        workflowId: String?,
        status: ExecutionStatus?,
        limit: Int
    ): List<WorkflowExecution> {
        return transaction {
            var query = Executions.selectAll()

            if (workflowId != null) {
                query = query.andWhere { Executions.workflowId eq workflowId }
            }

            if (status != null) {
                query = query.andWhere { Executions.status eq status.name }
            }

            query.limit(limit)
                .orderBy(Executions.startedAt, SortOrder.DESC)
                .map { rowToExecution(it) }
        }
    }

    private fun rowToExecution(row: ResultRow): WorkflowExecution {
        return WorkflowExecution(
            id = row[Executions.id].toString(),
            workflowId = row[Executions.workflowId],
            mode = ExecutionMode.valueOf(row[Executions.mode]),
            status = ExecutionStatus.valueOf(row[Executions.status]),
            data = json.decodeFromString(row[Executions.data]),
            startedAt = row[Executions.startedAt],
            stoppedAt = row[Executions.stoppedAt],
            error = row[Executions.error],
            retryOf = row[Executions.retryOf],
            retrySuccessId = row[Executions.retrySuccessId]
        )
    }
}

/**
 * Webhook repository
 */
class WebhookRepository {
    suspend fun save(webhook: WebhookRegistration) {
        transaction {
            WebhookRegistrations.insert {
                it[id] = UUID.fromString(webhook.id)
                it[workflowId] = webhook.workflowId
                it[nodeId] = webhook.nodeId
                it[path] = webhook.path
                it[method] = webhook.method
                it[isTest] = webhook.isTest
                it[createdAt] = webhook.createdAt
            }
        }
    }

    suspend fun findByPath(path: String, method: String): WebhookRegistration? {
        return transaction {
            WebhookRegistrations.select {
                (WebhookRegistrations.path eq path) and
                        (WebhookRegistrations.method eq method)
            }.map { rowToWebhook(it) }.singleOrNull()
        }
    }

    suspend fun deleteByWorkflow(workflowId: String) {
        transaction {
            WebhookRegistrations.deleteWhere {
                WebhookRegistrations.workflowId eq workflowId
            }
        }
    }

    private fun rowToWebhook(row: ResultRow): WebhookRegistration {
        return WebhookRegistration(
            id = row[WebhookRegistrations.id].toString(),
            workflowId = row[WebhookRegistrations.workflowId],
            nodeId = row[WebhookRegistrations.nodeId],
            path = row[WebhookRegistrations.path],
            method = row[WebhookRegistrations.method],
            isTest = row[WebhookRegistrations.isTest],
            createdAt = row[WebhookRegistrations.createdAt]
        )
    }
}

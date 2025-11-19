package dev.elide.workflow.models

import kotlinx.serialization.*
import kotlinx.serialization.json.*
import java.time.Instant
import java.util.UUID

/**
 * Core data models for the workflow automation platform
 */

@Serializable
data class Workflow(
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val description: String = "",
    val active: Boolean = false,
    val nodes: List<WorkflowNode> = emptyList(),
    val connections: Map<String, Map<String, List<Connection>>> = emptyMap(),
    val settings: WorkflowSettings = WorkflowSettings(),
    val tags: List<String> = emptyList(),
    @Serializable(with = InstantSerializer::class)
    val createdAt: Instant = Instant.now(),
    @Serializable(with = InstantSerializer::class)
    val updatedAt: Instant = Instant.now(),
    val createdBy: String? = null
)

@Serializable
data class WorkflowNode(
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val type: String,
    val typeVersion: Int = 1,
    val position: Position,
    val parameters: JsonObject = JsonObject(emptyMap()),
    val credentials: Map<String, String> = emptyMap(),
    val disabled: Boolean = false,
    val notes: String = "",
    val notesInFlow: Boolean = false,
    val retryOnFail: Boolean = false,
    val maxTries: Int = 3,
    val waitBetweenTries: Int = 1000,
    val alwaysOutputData: Boolean = false,
    val executeOnce: Boolean = false,
    val continueOnFail: Boolean = false
)

@Serializable
data class Position(
    val x: Double,
    val y: Double
)

@Serializable
data class Connection(
    val node: String,
    val type: String = "main",
    val index: Int = 0
)

@Serializable
data class WorkflowSettings(
    val executionOrder: ExecutionOrder = ExecutionOrder.V1,
    val saveManualExecutions: Boolean = true,
    val saveExecutionProgress: Boolean = false,
    val saveDataErrorExecution: ExecutionSaveMode = ExecutionSaveMode.ALL,
    val saveDataSuccessExecution: ExecutionSaveMode = ExecutionSaveMode.ALL,
    val executionTimeout: Int = 300,
    val timezone: String = "UTC"
)

@Serializable
enum class ExecutionOrder {
    V0, V1
}

@Serializable
enum class ExecutionSaveMode {
    ALL, NONE
}

@Serializable
data class WorkflowExecution(
    val id: String = UUID.randomUUID().toString(),
    val workflowId: String,
    val mode: ExecutionMode,
    val status: ExecutionStatus,
    val data: ExecutionData,
    @Serializable(with = InstantSerializer::class)
    val startedAt: Instant = Instant.now(),
    @Serializable(with = InstantSerializer::class)
    val stoppedAt: Instant? = null,
    val error: String? = null,
    val retryOf: String? = null,
    val retrySuccessId: String? = null
)

@Serializable
enum class ExecutionMode {
    MANUAL, TRIGGER, WEBHOOK, SCHEDULED, CLI, ERROR_WORKFLOW, RETRY
}

@Serializable
enum class ExecutionStatus {
    NEW, RUNNING, SUCCESS, FAILED, WAITING, CANCELLED
}

@Serializable
data class ExecutionData(
    val resultData: Map<String, List<NodeExecutionData>> = emptyMap(),
    val executionData: Map<String, NodeExecutionInfo> = emptyMap()
)

@Serializable
data class NodeExecutionData(
    val json: JsonObject = JsonObject(emptyMap()),
    val binary: Map<String, BinaryData> = emptyMap(),
    val error: String? = null,
    @Serializable(with = InstantSerializer::class)
    val executedAt: Instant = Instant.now()
)

@Serializable
data class BinaryData(
    val data: String, // Base64 encoded
    val mimeType: String,
    val fileName: String? = null,
    val fileSize: Long? = null,
    val fileExtension: String? = null
)

@Serializable
data class NodeExecutionInfo(
    val startTime: Long,
    val executionTime: Long,
    val executionStatus: ExecutionStatus,
    val source: List<SourceData> = emptyList()
)

@Serializable
data class SourceData(
    val previousNode: String,
    val previousNodeOutput: Int = 0,
    val previousNodeRun: Int = 0
)

@Serializable
data class Credential(
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val type: String,
    val data: String, // Encrypted JSON
    @Serializable(with = InstantSerializer::class)
    val createdAt: Instant = Instant.now(),
    @Serializable(with = InstantSerializer::class)
    val updatedAt: Instant = Instant.now(),
    val createdBy: String? = null
)

@Serializable
data class WebhookRegistration(
    val id: String = UUID.randomUUID().toString(),
    val workflowId: String,
    val nodeId: String,
    val path: String,
    val method: String = "POST",
    val isTest: Boolean = false,
    @Serializable(with = InstantSerializer::class)
    val createdAt: Instant = Instant.now()
)

@Serializable
data class ScheduleTrigger(
    val id: String = UUID.randomUUID().toString(),
    val workflowId: String,
    val nodeId: String,
    val cronExpression: String,
    val timezone: String = "UTC",
    val enabled: Boolean = true,
    @Serializable(with = InstantSerializer::class)
    val createdAt: Instant = Instant.now()
)

@Serializable
data class User(
    val id: String = UUID.randomUUID().toString(),
    val email: String,
    val firstName: String,
    val lastName: String,
    val passwordHash: String,
    val role: UserRole = UserRole.USER,
    val settings: UserSettings = UserSettings(),
    @Serializable(with = InstantSerializer::class)
    val createdAt: Instant = Instant.now()
)

@Serializable
enum class UserRole {
    ADMIN, USER, GUEST
}

@Serializable
data class UserSettings(
    val allowPasswordReset: Boolean = true,
    val notifyOnError: Boolean = true,
    val theme: String = "light"
)

// Serializer for java.time.Instant
object InstantSerializer : KSerializer<Instant> {
    override val descriptor = PrimitiveSerialDescriptor("Instant", PrimitiveKind.STRING)

    override fun serialize(encoder: Encoder, value: Instant) {
        encoder.encodeString(value.toString())
    }

    override fun deserialize(decoder: Decoder): Instant {
        return Instant.parse(decoder.decodeString())
    }
}

// Node execution context
data class NodeExecutionContext(
    val workflow: Workflow,
    val node: WorkflowNode,
    val inputData: List<NodeExecutionData>,
    val credentials: Map<String, Any>,
    val executionId: String,
    val mode: ExecutionMode
)

// Node execution result
data class NodeExecutionResult(
    val data: List<NodeExecutionData>,
    val error: String? = null
)

// API Request/Response models
@Serializable
data class CreateWorkflowRequest(
    val name: String,
    val description: String = "",
    val nodes: List<WorkflowNode> = emptyList(),
    val connections: Map<String, Map<String, List<Connection>>> = emptyMap(),
    val settings: WorkflowSettings = WorkflowSettings()
)

@Serializable
data class UpdateWorkflowRequest(
    val name: String? = null,
    val description: String? = null,
    val active: Boolean? = null,
    val nodes: List<WorkflowNode>? = null,
    val connections: Map<String, Map<String, List<Connection>>>? = null,
    val settings: WorkflowSettings? = null,
    val tags: List<String>? = null
)

@Serializable
data class ExecuteWorkflowRequest(
    val workflowId: String,
    val data: JsonObject? = null,
    val mode: ExecutionMode = ExecutionMode.MANUAL
)

@Serializable
data class CreateCredentialRequest(
    val name: String,
    val type: String,
    val data: JsonObject
)

@Serializable
data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val error: String? = null,
    @Serializable(with = InstantSerializer::class)
    val timestamp: Instant = Instant.now()
)

@Serializable
data class PaginatedResponse<T>(
    val items: List<T>,
    val total: Int,
    val page: Int,
    val pageSize: Int,
    val totalPages: Int
)

package dev.elide.workflow.api

import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.routing.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.http.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import dev.elide.workflow.models.*
import dev.elide.workflow.database.*
import dev.elide.workflow.execution.*
import dev.elide.workflow.credentials.*
import dev.elide.workflow.nodes.*
import kotlinx.serialization.json.Json
import java.time.Duration
import java.time.Instant

/**
 * Main API server
 */
class ApiServer(
    private val port: Int = 5678,
    private val host: String = "0.0.0.0"
) {
    private val databaseManager = DatabaseManager()
    private val workflowRepository = WorkflowRepository()
    private val executionRepository = ExecutionRepositoryImpl()
    private val webhookRepository = WebhookRepository()
    private val credentialManager = CredentialManager()
    private val workflowExecutor = WorkflowExecutor(credentialManager, executionRepository)

    init {
        // Initialize nodes
        initializeNodes()
    }

    fun start() {
        embeddedServer(Netty, port = port, host = host) {
            install(ContentNegotiation) {
                json(Json {
                    prettyPrint = true
                    ignoreUnknownKeys = true
                })
            }

            install(CORS) {
                anyHost()
                allowMethod(HttpMethod.Get)
                allowMethod(HttpMethod.Post)
                allowMethod(HttpMethod.Put)
                allowMethod(HttpMethod.Delete)
                allowMethod(HttpMethod.Patch)
                allowHeader(HttpHeaders.ContentType)
                allowHeader(HttpHeaders.Authorization)
            }

            install(WebSockets) {
                pingPeriod = Duration.ofSeconds(15)
                timeout = Duration.ofSeconds(15)
                maxFrameSize = Long.MAX_VALUE
                masking = false
            }

            routing {
                configureWorkflowRoutes()
                configureExecutionRoutes()
                configureCredentialRoutes()
                configureWebhookRoutes()
                configureNodeRoutes()
                configureWebSocketRoutes()
            }
        }.start(wait = true)
    }

    private fun Routing.configureWorkflowRoutes() {
        route("/api/workflows") {
            // Get all workflows
            get {
                val active = call.request.queryParameters["active"]?.toBoolean()
                val workflows = workflowRepository.getAll(active)
                call.respond(ApiResponse(success = true, data = workflows))
            }

            // Get workflow by ID
            get("/{id}") {
                val id = call.parameters["id"] ?: return@get call.respond(
                    HttpStatusCode.BadRequest,
                    ApiResponse<Unit>(success = false, error = "Missing workflow ID")
                )

                val workflow = workflowRepository.getById(id)
                if (workflow != null) {
                    call.respond(ApiResponse(success = true, data = workflow))
                } else {
                    call.respond(
                        HttpStatusCode.NotFound,
                        ApiResponse<Unit>(success = false, error = "Workflow not found")
                    )
                }
            }

            // Create workflow
            post {
                val request = call.receive<CreateWorkflowRequest>()
                val workflow = Workflow(
                    name = request.name,
                    description = request.description,
                    nodes = request.nodes,
                    connections = request.connections,
                    settings = request.settings
                )

                workflowRepository.save(workflow)
                call.respond(HttpStatusCode.Created, ApiResponse(success = true, data = workflow))
            }

            // Update workflow
            put("/{id}") {
                val id = call.parameters["id"] ?: return@put call.respond(
                    HttpStatusCode.BadRequest,
                    ApiResponse<Unit>(success = false, error = "Missing workflow ID")
                )

                val existing = workflowRepository.getById(id) ?: return@put call.respond(
                    HttpStatusCode.NotFound,
                    ApiResponse<Unit>(success = false, error = "Workflow not found")
                )

                val request = call.receive<UpdateWorkflowRequest>()
                val updated = existing.copy(
                    name = request.name ?: existing.name,
                    description = request.description ?: existing.description,
                    active = request.active ?: existing.active,
                    nodes = request.nodes ?: existing.nodes,
                    connections = request.connections ?: existing.connections,
                    settings = request.settings ?: existing.settings,
                    tags = request.tags ?: existing.tags,
                    updatedAt = Instant.now()
                )

                workflowRepository.save(updated)
                call.respond(ApiResponse(success = true, data = updated))
            }

            // Delete workflow
            delete("/{id}") {
                val id = call.parameters["id"] ?: return@delete call.respond(
                    HttpStatusCode.BadRequest,
                    ApiResponse<Unit>(success = false, error = "Missing workflow ID")
                )

                workflowRepository.delete(id)
                call.respond(ApiResponse(success = true, data = null))
            }

            // Activate workflow
            post("/{id}/activate") {
                val id = call.parameters["id"] ?: return@post call.respond(
                    HttpStatusCode.BadRequest,
                    ApiResponse<Unit>(success = false, error = "Missing workflow ID")
                )

                val workflow = workflowRepository.getById(id) ?: return@post call.respond(
                    HttpStatusCode.NotFound,
                    ApiResponse<Unit>(success = false, error = "Workflow not found")
                )

                val updated = workflow.copy(active = true, updatedAt = Instant.now())
                workflowRepository.save(updated)

                // Register webhooks and triggers
                registerWorkflowTriggers(updated)

                call.respond(ApiResponse(success = true, data = updated))
            }

            // Deactivate workflow
            post("/{id}/deactivate") {
                val id = call.parameters["id"] ?: return@post call.respond(
                    HttpStatusCode.BadRequest,
                    ApiResponse<Unit>(success = false, error = "Missing workflow ID")
                )

                val workflow = workflowRepository.getById(id) ?: return@post call.respond(
                    HttpStatusCode.NotFound,
                    ApiResponse<Unit>(success = false, error = "Workflow not found")
                )

                val updated = workflow.copy(active = false, updatedAt = Instant.now())
                workflowRepository.save(updated)

                // Unregister webhooks and triggers
                webhookRepository.deleteByWorkflow(id)

                call.respond(ApiResponse(success = true, data = updated))
            }
        }
    }

    private fun Routing.configureExecutionRoutes() {
        route("/api/executions") {
            // Get all executions
            get {
                val workflowId = call.request.queryParameters["workflowId"]
                val status = call.request.queryParameters["status"]?.let {
                    ExecutionStatus.valueOf(it)
                }
                val limit = call.request.queryParameters["limit"]?.toInt() ?: 50

                val executions = executionRepository.getExecutions(workflowId, status, limit)
                call.respond(ApiResponse(success = true, data = executions))
            }

            // Get execution by ID
            get("/{id}") {
                val id = call.parameters["id"] ?: return@get call.respond(
                    HttpStatusCode.BadRequest,
                    ApiResponse<Unit>(success = false, error = "Missing execution ID")
                )

                val execution = executionRepository.getExecution(id)
                if (execution != null) {
                    call.respond(ApiResponse(success = true, data = execution))
                } else {
                    call.respond(
                        HttpStatusCode.NotFound,
                        ApiResponse<Unit>(success = false, error = "Execution not found")
                    )
                }
            }

            // Execute workflow
            post {
                val request = call.receive<ExecuteWorkflowRequest>()
                val workflow = workflowRepository.getById(request.workflowId)
                    ?: return@post call.respond(
                        HttpStatusCode.NotFound,
                        ApiResponse<Unit>(success = false, error = "Workflow not found")
                    )

                val execution = workflowExecutor.execute(workflow, request.mode)
                call.respond(ApiResponse(success = true, data = execution))
            }

            // Delete execution
            delete("/{id}") {
                val id = call.parameters["id"] ?: return@delete call.respond(
                    HttpStatusCode.BadRequest,
                    ApiResponse<Unit>(success = false, error = "Missing execution ID")
                )

                // In production, delete from database
                call.respond(ApiResponse(success = true, data = null))
            }
        }
    }

    private fun Routing.configureCredentialRoutes() {
        route("/api/credentials") {
            // Get all credentials
            get {
                val type = call.request.queryParameters["type"]
                val credentials = credentialManager.getAllCredentials(type)
                    .map { it.copy(data = "***") } // Don't expose encrypted data
                call.respond(ApiResponse(success = true, data = credentials))
            }

            // Get credential by ID
            get("/{id}") {
                val id = call.parameters["id"] ?: return@get call.respond(
                    HttpStatusCode.BadRequest,
                    ApiResponse<Unit>(success = false, error = "Missing credential ID")
                )

                val credential = credentialManager.getCredentialById(id)
                if (credential != null) {
                    call.respond(ApiResponse(success = true, data = credential.copy(data = "***")))
                } else {
                    call.respond(
                        HttpStatusCode.NotFound,
                        ApiResponse<Unit>(success = false, error = "Credential not found")
                    )
                }
            }

            // Create credential
            post {
                val request = call.receive<CreateCredentialRequest>()
                val credential = credentialManager.saveCredential(
                    name = request.name,
                    type = request.type,
                    data = request.data
                )
                call.respond(
                    HttpStatusCode.Created,
                    ApiResponse(success = true, data = credential.copy(data = "***"))
                )
            }

            // Delete credential
            delete("/{id}") {
                val id = call.parameters["id"] ?: return@delete call.respond(
                    HttpStatusCode.BadRequest,
                    ApiResponse<Unit>(success = false, error = "Missing credential ID")
                )

                credentialManager.deleteCredential(id)
                call.respond(ApiResponse(success = true, data = null))
            }

            // Get credential types
            get("/types") {
                call.respond(ApiResponse(success = true, data = CredentialTypes.ALL_TYPES))
            }
        }
    }

    private fun Routing.configureWebhookRoutes() {
        // Webhook handler
        route("/webhook") {
            post("/{path...}") {
                val path = call.parameters.getAll("path")?.joinToString("/") ?: ""
                val method = call.request.httpMethod.value

                val webhook = webhookRepository.findByPath(path, method)
                    ?: return@post call.respond(
                        HttpStatusCode.NotFound,
                        ApiResponse<Unit>(success = false, error = "Webhook not found")
                    )

                val workflow = workflowRepository.getById(webhook.workflowId)
                    ?: return@post call.respond(
                        HttpStatusCode.NotFound,
                        ApiResponse<Unit>(success = false, error = "Workflow not found")
                    )

                // Parse webhook data
                val bodyText = call.receiveText()
                val webhookData = try {
                    Json.parseToJsonElement(bodyText).jsonObject
                } catch (e: Exception) {
                    kotlinx.serialization.json.buildJsonObject {
                        put("body", kotlinx.serialization.json.JsonPrimitive(bodyText))
                    }
                }

                val inputData = NodeExecutionData(
                    json = webhookData,
                    executedAt = Instant.now()
                )

                // Execute workflow
                val execution = workflowExecutor.execute(
                    workflow = workflow,
                    mode = ExecutionMode.WEBHOOK,
                    startData = mapOf(webhook.nodeId to listOf(inputData)),
                    triggerNode = webhook.nodeId
                )

                call.respond(ApiResponse(success = true, data = execution))
            }

            get("/{path...}") {
                val path = call.parameters.getAll("path")?.joinToString("/") ?: ""
                val webhook = webhookRepository.findByPath(path, "GET")
                    ?: return@get call.respond(
                        HttpStatusCode.NotFound,
                        ApiResponse<Unit>(success = false, error = "Webhook not found")
                    )

                // Handle GET webhooks similar to POST
                call.respond(ApiResponse(success = true, data = mapOf("webhook" to webhook)))
            }
        }
    }

    private fun Routing.configureNodeRoutes() {
        route("/api/nodes") {
            // Get all available node types
            get {
                val nodeTypes = NodeRegistry.getAllNodeTypes()
                call.respond(ApiResponse(success = true, data = nodeTypes))
            }

            // Get node type details
            get("/{type}") {
                val type = call.parameters["type"] ?: return@get call.respond(
                    HttpStatusCode.BadRequest,
                    ApiResponse<Unit>(success = false, error = "Missing node type")
                )

                val nodeType = NodeRegistry.getNodeType(type)
                if (nodeType != null) {
                    call.respond(ApiResponse(success = true, data = nodeType))
                } else {
                    call.respond(
                        HttpStatusCode.NotFound,
                        ApiResponse<Unit>(success = false, error = "Node type not found")
                    )
                }
            }
        }
    }

    private fun Routing.configureWebSocketRoutes() {
        webSocket("/ws/executions") {
            // Real-time execution updates
            for (frame in incoming) {
                if (frame is Frame.Text) {
                    val text = frame.readText()
                    // Handle WebSocket messages
                    send(Frame.Text("Execution update: $text"))
                }
            }
        }
    }

    private suspend fun registerWorkflowTriggers(workflow: Workflow) {
        // Register webhooks
        workflow.nodes.filter { it.type == "webhook" }.forEach { node ->
            val path = node.parameters["path"]?.toString() ?: ""
            val method = node.parameters["httpMethod"]?.toString() ?: "POST"

            val webhook = WebhookRegistration(
                workflowId = workflow.id,
                nodeId = node.id,
                path = path,
                method = method
            )

            webhookRepository.save(webhook)
        }

        // Register schedule triggers (would integrate with scheduler)
        // workflow.nodes.filter { it.type == "schedule" }
    }

    fun stop() {
        databaseManager.close()
    }
}

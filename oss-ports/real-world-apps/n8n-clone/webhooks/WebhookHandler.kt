package dev.elide.workflow.webhooks

import dev.elide.workflow.models.*
import dev.elide.workflow.database.WebhookRepository
import dev.elide.workflow.database.WorkflowRepository
import dev.elide.workflow.execution.WorkflowExecutor
import kotlinx.serialization.json.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.http.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap

/**
 * Webhook handler for processing incoming webhooks
 */
class WebhookHandler(
    private val webhookRepository: WebhookRepository,
    private val workflowRepository: WorkflowRepository,
    private val workflowExecutor: WorkflowExecutor
) {
    private val activeWebhooks = ConcurrentHashMap<String, WebhookRegistration>()
    private val webhookStats = ConcurrentHashMap<String, WebhookStats>()
    private val scope = CoroutineScope(Dispatchers.Default)

    /**
     * Initialize webhook handler
     */
    suspend fun initialize() {
        // Load all active webhooks from database
        // This would be implemented to load from repository
    }

    /**
     * Handle incoming webhook
     */
    suspend fun handleWebhook(
        path: String,
        method: String,
        headers: Map<String, String>,
        queryParameters: Map<String, String>,
        body: String?
    ): WebhookResponse {
        // Find webhook registration
        val webhook = findWebhook(path, method)
            ?: return WebhookResponse.NotFound("Webhook not found: $method $path")

        // Update stats
        updateStats(webhook.id)

        // Validate webhook if needed
        val validationResult = validateWebhook(webhook, headers, body)
        if (validationResult !is WebhookValidation.Valid) {
            return WebhookResponse.Unauthorized("Webhook validation failed")
        }

        // Load workflow
        val workflow = workflowRepository.getById(webhook.workflowId)
            ?: return WebhookResponse.Error("Workflow not found")

        // Parse webhook data
        val webhookData = parseWebhookData(body, headers, queryParameters)

        // Execute workflow asynchronously if configured
        if (webhook.isTest) {
            // Execute synchronously for testing
            val execution = workflowExecutor.execute(
                workflow = workflow,
                mode = ExecutionMode.WEBHOOK,
                startData = mapOf(webhook.nodeId to listOf(webhookData)),
                triggerNode = webhook.nodeId
            )

            return WebhookResponse.Success(execution)
        } else {
            // Execute asynchronously for production
            scope.launch {
                try {
                    workflowExecutor.execute(
                        workflow = workflow,
                        mode = ExecutionMode.WEBHOOK,
                        startData = mapOf(webhook.nodeId to listOf(webhookData)),
                        triggerNode = webhook.nodeId
                    )
                } catch (e: Exception) {
                    // Log error
                    println("Webhook execution error: ${e.message}")
                }
            }

            return WebhookResponse.Accepted("Webhook accepted for processing")
        }
    }

    /**
     * Register a webhook
     */
    suspend fun registerWebhook(
        workflowId: String,
        nodeId: String,
        path: String,
        method: String,
        isTest: Boolean = false
    ): WebhookRegistration {
        val webhook = WebhookRegistration(
            workflowId = workflowId,
            nodeId = nodeId,
            path = path,
            method = method,
            isTest = isTest
        )

        webhookRepository.save(webhook)
        activeWebhooks["$method:$path"] = webhook

        return webhook
    }

    /**
     * Unregister a webhook
     */
    suspend fun unregisterWebhook(path: String, method: String) {
        activeWebhooks.remove("$method:$path")
        webhookRepository.findByPath(path, method)?.let { webhook ->
            webhookRepository.deleteByWorkflow(webhook.workflowId)
        }
    }

    /**
     * Find webhook by path and method
     */
    private suspend fun findWebhook(path: String, method: String): WebhookRegistration? {
        // Check cache first
        val key = "$method:$path"
        return activeWebhooks[key] ?: run {
            // Load from database
            val webhook = webhookRepository.findByPath(path, method)
            webhook?.let { activeWebhooks[key] = it }
            webhook
        }
    }

    /**
     * Validate webhook
     */
    private fun validateWebhook(
        webhook: WebhookRegistration,
        headers: Map<String, String>,
        body: String?
    ): WebhookValidation {
        // Implement webhook validation (signatures, tokens, etc.)
        // For now, always valid
        return WebhookValidation.Valid
    }

    /**
     * Parse webhook data
     */
    private fun parseWebhookData(
        body: String?,
        headers: Map<String, String>,
        queryParameters: Map<String, String>
    ): NodeExecutionData {
        val json = buildJsonObject {
            // Parse body
            if (body != null && body.isNotEmpty()) {
                try {
                    val bodyJson = Json.parseToJsonElement(body)
                    put("body", bodyJson)

                    // If body is object, merge into root
                    if (bodyJson is JsonObject) {
                        bodyJson.forEach { (key, value) ->
                            put(key, value)
                        }
                    }
                } catch (e: Exception) {
                    put("body", JsonPrimitive(body))
                }
            }

            // Add headers
            val headersObj = buildJsonObject {
                headers.forEach { (key, value) ->
                    put(key, JsonPrimitive(value))
                }
            }
            put("headers", headersObj)

            // Add query parameters
            val queryObj = buildJsonObject {
                queryParameters.forEach { (key, value) ->
                    put(key, JsonPrimitive(value))
                }
            }
            put("query", queryObj)

            // Add metadata
            put("receivedAt", JsonPrimitive(Instant.now().toString()))
        }

        return NodeExecutionData(json = json, executedAt = Instant.now())
    }

    /**
     * Update webhook statistics
     */
    private fun updateStats(webhookId: String) {
        val stats = webhookStats.getOrPut(webhookId) {
            WebhookStats(webhookId = webhookId)
        }

        stats.incrementCalls()
        stats.updateLastCall()
    }

    /**
     * Get webhook statistics
     */
    fun getWebhookStats(webhookId: String): WebhookStats? {
        return webhookStats[webhookId]
    }

    /**
     * Get all webhook statistics
     */
    fun getAllWebhookStats(): Map<String, WebhookStats> {
        return webhookStats.toMap()
    }
}

/**
 * Webhook response types
 */
sealed class WebhookResponse {
    data class Success(val execution: WorkflowExecution) : WebhookResponse()
    data class Accepted(val message: String) : WebhookResponse()
    data class NotFound(val message: String) : WebhookResponse()
    data class Unauthorized(val message: String) : WebhookResponse()
    data class Error(val message: String) : WebhookResponse()

    fun toHttpStatus(): HttpStatusCode {
        return when (this) {
            is Success -> HttpStatusCode.OK
            is Accepted -> HttpStatusCode.Accepted
            is NotFound -> HttpStatusCode.NotFound
            is Unauthorized -> HttpStatusCode.Unauthorized
            is Error -> HttpStatusCode.InternalServerError
        }
    }
}

/**
 * Webhook validation result
 */
sealed class WebhookValidation {
    object Valid : WebhookValidation()
    data class Invalid(val reason: String) : WebhookValidation()
}

/**
 * Webhook statistics
 */
data class WebhookStats(
    val webhookId: String,
    var totalCalls: Long = 0,
    var lastCallAt: Instant? = null,
    var successfulCalls: Long = 0,
    var failedCalls: Long = 0
) {
    @Synchronized
    fun incrementCalls() {
        totalCalls++
    }

    @Synchronized
    fun incrementSuccess() {
        successfulCalls++
    }

    @Synchronized
    fun incrementFailures() {
        failedCalls++
    }

    @Synchronized
    fun updateLastCall() {
        lastCallAt = Instant.now()
    }

    fun getSuccessRate(): Double {
        return if (totalCalls > 0) {
            (successfulCalls.toDouble() / totalCalls.toDouble()) * 100
        } else {
            0.0
        }
    }
}

/**
 * Webhook signature validator
 */
class WebhookSignatureValidator {
    /**
     * Validate GitHub webhook signature
     */
    fun validateGitHub(
        body: String,
        signature: String,
        secret: String
    ): Boolean {
        val hmac = dev.elide.workflow.utils.WorkflowUtils.hmacSha256(body, secret)
        val expected = "sha256=$hmac"
        return signature == expected
    }

    /**
     * Validate Stripe webhook signature
     */
    fun validateStripe(
        payload: String,
        signature: String,
        timestamp: String,
        secret: String
    ): Boolean {
        val signedPayload = "$timestamp.$payload"
        val hmac = dev.elide.workflow.utils.WorkflowUtils.hmacSha256(signedPayload, secret)

        return signature.split(",").any { part ->
            val (version, sig) = part.split("=")
            version == "v1" && sig == hmac
        }
    }

    /**
     * Validate Slack webhook signature
     */
    fun validateSlack(
        body: String,
        signature: String,
        timestamp: String,
        secret: String
    ): Boolean {
        val baseString = "v0:$timestamp:$body"
        val hmac = dev.elide.workflow.utils.WorkflowUtils.hmacSha256(baseString, secret)
        val expected = "v0=$hmac"
        return signature == expected
    }

    /**
     * Validate custom HMAC signature
     */
    fun validateHMAC(
        body: String,
        signature: String,
        secret: String,
        algorithm: String = "sha256"
    ): Boolean {
        val hmac = when (algorithm.lowercase()) {
            "sha256" -> dev.elide.workflow.utils.WorkflowUtils.hmacSha256(body, secret)
            else -> return false
        }

        return signature.replace("$algorithm=", "") == hmac
    }
}

/**
 * Webhook retry handler
 */
class WebhookRetryHandler {
    private val retryQueue = mutableListOf<WebhookRetryTask>()
    private val maxRetries = 3

    /**
     * Queue webhook for retry
     */
    fun queueRetry(
        webhook: WebhookRegistration,
        payload: String,
        attempt: Int = 0
    ) {
        if (attempt >= maxRetries) {
            // Max retries reached, log failure
            return
        }

        val task = WebhookRetryTask(
            webhook = webhook,
            payload = payload,
            attempt = attempt,
            nextRetryAt = calculateNextRetry(attempt)
        )

        retryQueue.add(task)
    }

    /**
     * Calculate next retry time with exponential backoff
     */
    private fun calculateNextRetry(attempt: Int): Instant {
        val delaySeconds = Math.pow(2.0, attempt.toDouble()).toLong()
        return Instant.now().plusSeconds(delaySeconds)
    }

    /**
     * Process retry queue
     */
    suspend fun processRetries(handler: WebhookHandler) {
        val now = Instant.now()
        val tasksToRetry = retryQueue.filter { it.nextRetryAt.isBefore(now) }

        tasksToRetry.forEach { task ->
            retryQueue.remove(task)

            try {
                handler.handleWebhook(
                    path = task.webhook.path,
                    method = task.webhook.method,
                    headers = emptyMap(),
                    queryParameters = emptyMap(),
                    body = task.payload
                )
            } catch (e: Exception) {
                // Queue for another retry
                queueRetry(task.webhook, task.payload, task.attempt + 1)
            }
        }
    }
}

/**
 * Webhook retry task
 */
data class WebhookRetryTask(
    val webhook: WebhookRegistration,
    val payload: String,
    val attempt: Int,
    val nextRetryAt: Instant
)

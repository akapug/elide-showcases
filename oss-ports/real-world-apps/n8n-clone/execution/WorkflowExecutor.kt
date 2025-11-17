package dev.elide.workflow.execution

import dev.elide.workflow.models.*
import dev.elide.workflow.nodes.*
import kotlinx.coroutines.*
import kotlinx.serialization.json.*
import java.time.Instant
import java.util.UUID

/**
 * Workflow execution engine
 * Executes workflows by traversing nodes and handling connections
 */
class WorkflowExecutor(
    private val credentialProvider: CredentialProvider,
    private val executionRepository: ExecutionRepository
) {
    /**
     * Execute a workflow
     */
    suspend fun execute(
        workflow: Workflow,
        mode: ExecutionMode = ExecutionMode.MANUAL,
        startData: Map<String, List<NodeExecutionData>> = emptyMap(),
        triggerNode: String? = null
    ): WorkflowExecution {
        val executionId = UUID.randomUUID().toString()
        val startTime = Instant.now()

        // Create execution record
        var execution = WorkflowExecution(
            id = executionId,
            workflowId = workflow.id,
            mode = mode,
            status = ExecutionStatus.RUNNING,
            data = ExecutionData(),
            startedAt = startTime
        )

        // Save initial execution state
        executionRepository.save(execution)

        try {
            // Find start nodes (trigger nodes or nodes without inputs)
            val startNodes = if (triggerNode != null) {
                listOf(workflow.nodes.find { it.id == triggerNode }
                    ?: throw IllegalArgumentException("Trigger node not found: $triggerNode"))
            } else {
                findStartNodes(workflow)
            }

            if (startNodes.isEmpty()) {
                throw IllegalStateException("No start nodes found in workflow")
            }

            // Execute workflow starting from start nodes
            val executionData = mutableMapOf<String, List<NodeExecutionData>>()
            val executionInfo = mutableMapOf<String, NodeExecutionInfo>()

            // Initialize data for start nodes
            startNodes.forEach { node ->
                executionData[node.id] = startData[node.id] ?: listOf(
                    NodeExecutionData(json = JsonObject(emptyMap()))
                )
            }

            // Process nodes in execution order
            val processedNodes = mutableSetOf<String>()
            val nodeQueue = ArrayDeque(startNodes)

            while (nodeQueue.isNotEmpty()) {
                val currentNode = nodeQueue.removeFirst()

                if (currentNode.id in processedNodes) {
                    continue
                }

                // Check if node is disabled
                if (currentNode.disabled) {
                    processedNodes.add(currentNode.id)
                    continue
                }

                // Check if all parent nodes have been processed
                val parentNodes = findParentNodes(workflow, currentNode.id)
                if (!parentNodes.all { it.id in processedNodes }) {
                    // Not ready to process, add back to queue
                    nodeQueue.addLast(currentNode)
                    continue
                }

                // Gather input data from parent nodes
                val inputData = gatherInputData(workflow, currentNode.id, executionData)

                // Execute node
                val nodeStartTime = System.currentTimeMillis()
                val result = executeNode(
                    workflow = workflow,
                    node = currentNode,
                    inputData = inputData,
                    executionId = executionId,
                    mode = mode
                )
                val nodeExecutionTime = System.currentTimeMillis() - nodeStartTime

                // Store execution info
                executionInfo[currentNode.id] = NodeExecutionInfo(
                    startTime = nodeStartTime,
                    executionTime = nodeExecutionTime,
                    executionStatus = if (result.error != null) ExecutionStatus.FAILED else ExecutionStatus.SUCCESS,
                    source = parentNodes.map { SourceData(previousNode = it.id) }
                )

                // Handle node execution errors
                if (result.error != null) {
                    if (!currentNode.continueOnFail) {
                        throw WorkflowExecutionException(
                            "Node '${currentNode.name}' failed: ${result.error}",
                            currentNode.id
                        )
                    }
                }

                // Store result data
                executionData[currentNode.id] = result.data
                processedNodes.add(currentNode.id)

                // Add child nodes to queue
                val childNodes = findChildNodes(workflow, currentNode.id)
                childNodes.forEach { child ->
                    if (child.id !in processedNodes) {
                        nodeQueue.addLast(child)
                    }
                }

                // Update execution progress
                executionRepository.updateProgress(
                    executionId,
                    executionData,
                    executionInfo
                )
            }

            // Update execution as successful
            execution = execution.copy(
                status = ExecutionStatus.SUCCESS,
                data = ExecutionData(
                    resultData = executionData,
                    executionData = executionInfo
                ),
                stoppedAt = Instant.now()
            )

        } catch (e: Exception) {
            // Update execution as failed
            execution = execution.copy(
                status = ExecutionStatus.FAILED,
                error = e.message ?: "Unknown error",
                stoppedAt = Instant.now()
            )

            // Check if workflow has retry configuration
            if (shouldRetry(workflow, execution)) {
                return retryExecution(workflow, execution, mode)
            }
        }

        // Save final execution state
        executionRepository.save(execution)

        return execution
    }

    /**
     * Execute a single node
     */
    private suspend fun executeNode(
        workflow: Workflow,
        node: WorkflowNode,
        inputData: List<NodeExecutionData>,
        executionId: String,
        mode: ExecutionMode
    ): NodeExecutionResult {
        // Create node instance
        val nodeInstance = NodeRegistry.create(node.type)
            ?: return NodeExecutionResult(
                data = emptyList(),
                error = "Unknown node type: ${node.type}"
            )

        // Load credentials
        val credentials = mutableMapOf<String, Any>()
        node.credentials.forEach { (type, credentialId) ->
            val credential = credentialProvider.getCredential(credentialId)
            if (credential != null) {
                credentials[type] = credential
            }
        }

        // Create execution context
        val context = NodeExecutionContext(
            workflow = workflow,
            node = node,
            inputData = inputData,
            credentials = credentials,
            executionId = executionId,
            mode = mode
        )

        // Execute node with retry logic
        var lastResult: NodeExecutionResult? = null
        var attempts = 0
        val maxAttempts = if (node.retryOnFail) node.maxTries else 1

        while (attempts < maxAttempts) {
            try {
                val result = nodeInstance.execute(context)

                if (result.error == null) {
                    return result
                }

                lastResult = result
                attempts++

                if (attempts < maxAttempts) {
                    delay(node.waitBetweenTries.toLong())
                }

            } catch (e: Exception) {
                lastResult = NodeExecutionResult(
                    data = emptyList(),
                    error = "Node execution failed: ${e.message}"
                )
                attempts++

                if (attempts < maxAttempts) {
                    delay(node.waitBetweenTries.toLong())
                }
            }
        }

        return lastResult ?: NodeExecutionResult(
            data = emptyList(),
            error = "Node execution failed after $maxAttempts attempts"
        )
    }

    /**
     * Find start nodes in workflow
     */
    private fun findStartNodes(workflow: Workflow): List<WorkflowNode> {
        return workflow.nodes.filter { node ->
            // Node is a start node if it has no incoming connections
            workflow.connections.values.none { outputs ->
                outputs.values.any { connections ->
                    connections.any { it.node == node.id }
                }
            }
        }
    }

    /**
     * Find parent nodes
     */
    private fun findParentNodes(workflow: Workflow, nodeId: String): List<WorkflowNode> {
        val parents = mutableListOf<WorkflowNode>()

        workflow.connections.forEach { (sourceNodeId, outputs) ->
            outputs.forEach { (_, connections) ->
                if (connections.any { it.node == nodeId }) {
                    workflow.nodes.find { it.id == sourceNodeId }?.let { parents.add(it) }
                }
            }
        }

        return parents
    }

    /**
     * Find child nodes
     */
    private fun findChildNodes(workflow: Workflow, nodeId: String): List<WorkflowNode> {
        val children = mutableListOf<WorkflowNode>()

        workflow.connections[nodeId]?.values?.forEach { connections ->
            connections.forEach { connection ->
                workflow.nodes.find { it.id == connection.node }?.let { children.add(it) }
            }
        }

        return children
    }

    /**
     * Gather input data from parent nodes
     */
    private fun gatherInputData(
        workflow: Workflow,
        nodeId: String,
        executionData: Map<String, List<NodeExecutionData>>
    ): List<NodeExecutionData> {
        val inputData = mutableListOf<NodeExecutionData>()

        // Find all connections pointing to this node
        workflow.connections.forEach { (sourceNodeId, outputs) ->
            outputs.forEach { (outputName, connections) ->
                connections.filter { it.node == nodeId }.forEach { connection ->
                    executionData[sourceNodeId]?.let { sourceData ->
                        inputData.addAll(sourceData)
                    }
                }
            }
        }

        return inputData.ifEmpty {
            // If no input data, provide empty data item
            listOf(NodeExecutionData(json = JsonObject(emptyMap())))
        }
    }

    /**
     * Check if execution should be retried
     */
    private fun shouldRetry(workflow: Workflow, execution: WorkflowExecution): Boolean {
        // In production, check retry configuration
        return false
    }

    /**
     * Retry execution
     */
    private suspend fun retryExecution(
        workflow: Workflow,
        originalExecution: WorkflowExecution,
        mode: ExecutionMode
    ): WorkflowExecution {
        val retryExecution = execute(workflow, mode)
        return retryExecution.copy(retryOf = originalExecution.id)
    }
}

/**
 * Credential provider interface
 */
interface CredentialProvider {
    suspend fun getCredential(id: String): Map<String, Any>?
}

/**
 * Execution repository interface
 */
interface ExecutionRepository {
    suspend fun save(execution: WorkflowExecution)
    suspend fun updateProgress(
        executionId: String,
        resultData: Map<String, List<NodeExecutionData>>,
        executionData: Map<String, NodeExecutionInfo>
    )
    suspend fun getExecution(executionId: String): WorkflowExecution?
    suspend fun getExecutions(
        workflowId: String? = null,
        status: ExecutionStatus? = null,
        limit: Int = 50
    ): List<WorkflowExecution>
}

/**
 * Workflow execution exception
 */
class WorkflowExecutionException(
    message: String,
    val nodeId: String? = null
) : Exception(message)

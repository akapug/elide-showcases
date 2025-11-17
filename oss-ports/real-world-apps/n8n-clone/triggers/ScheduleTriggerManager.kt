package dev.elide.workflow.triggers

import dev.elide.workflow.models.*
import dev.elide.workflow.database.*
import dev.elide.workflow.execution.*
import org.quartz.*
import org.quartz.impl.StdSchedulerFactory
import kotlinx.coroutines.*
import java.time.ZoneId
import java.util.TimeZone

/**
 * Schedule trigger manager using Quartz
 */
class ScheduleTriggerManager(
    private val workflowRepository: WorkflowRepository,
    private val workflowExecutor: WorkflowExecutor
) {
    private val scheduler: Scheduler = StdSchedulerFactory.getDefaultScheduler()
    private val scope = CoroutineScope(Dispatchers.Default + SupervisorJob())

    init {
        scheduler.start()
    }

    /**
     * Register schedule trigger for a workflow
     */
    fun registerScheduleTrigger(
        workflowId: String,
        nodeId: String,
        cronExpression: String,
        timezone: String = "UTC"
    ) {
        val jobKey = JobKey.jobKey("workflow-$workflowId-node-$nodeId", "workflows")
        val triggerKey = TriggerKey.triggerKey("trigger-$workflowId-node-$nodeId", "workflows")

        // Create job
        val job = JobBuilder.newJob(WorkflowExecutionJob::class.java)
            .withIdentity(jobKey)
            .usingJobData("workflowId", workflowId)
            .usingJobData("nodeId", nodeId)
            .build()

        // Create trigger with cron expression
        val trigger = TriggerBuilder.newTrigger()
            .withIdentity(triggerKey)
            .withSchedule(
                CronScheduleBuilder.cronSchedule(cronExpression)
                    .inTimeZone(TimeZone.getTimeZone(ZoneId.of(timezone)))
            )
            .build()

        // Schedule job
        if (scheduler.checkExists(jobKey)) {
            scheduler.rescheduleJob(triggerKey, trigger)
        } else {
            scheduler.scheduleJob(job, trigger)
        }
    }

    /**
     * Unregister schedule trigger
     */
    fun unregisterScheduleTrigger(workflowId: String, nodeId: String) {
        val jobKey = JobKey.jobKey("workflow-$workflowId-node-$nodeId", "workflows")
        scheduler.deleteJob(jobKey)
    }

    /**
     * Activate all schedule triggers for a workflow
     */
    suspend fun activateWorkflowSchedules(workflow: Workflow) {
        workflow.nodes.filter { it.type == "schedule" }.forEach { node ->
            val cronExpression = node.parameters["cronExpression"]?.toString()
                ?: "0 0 * * *" // Default: daily at midnight

            registerScheduleTrigger(
                workflowId = workflow.id,
                nodeId = node.id,
                cronExpression = cronExpression,
                timezone = workflow.settings.timezone
            )
        }
    }

    /**
     * Deactivate all schedule triggers for a workflow
     */
    suspend fun deactivateWorkflowSchedules(workflowId: String, nodes: List<WorkflowNode>) {
        nodes.filter { it.type == "schedule" }.forEach { node ->
            unregisterScheduleTrigger(workflowId, node.id)
        }
    }

    /**
     * Get next execution time for a schedule
     */
    fun getNextExecutionTime(
        cronExpression: String,
        timezone: String = "UTC"
    ): Long? {
        return try {
            val trigger = TriggerBuilder.newTrigger()
                .withSchedule(
                    CronScheduleBuilder.cronSchedule(cronExpression)
                        .inTimeZone(TimeZone.getTimeZone(ZoneId.of(timezone)))
                )
                .build()

            trigger.getNextFireTime()?.time
        } catch (e: Exception) {
            null
        }
    }

    fun shutdown() {
        scheduler.shutdown()
        scope.cancel()
    }

    /**
     * Quartz job for executing workflows
     */
    class WorkflowExecutionJob : Job {
        override fun execute(context: JobExecutionContext) {
            val workflowId = context.jobDetail.jobDataMap.getString("workflowId")
            val nodeId = context.jobDetail.jobDataMap.getString("nodeId")

            // Get dependencies from application context
            val workflowRepository = context.scheduler.context["workflowRepository"] as? WorkflowRepository
            val workflowExecutor = context.scheduler.context["workflowExecutor"] as? WorkflowExecutor

            if (workflowRepository != null && workflowExecutor != null) {
                runBlocking {
                    try {
                        val workflow = workflowRepository.getById(workflowId)
                        if (workflow != null && workflow.active) {
                            workflowExecutor.execute(
                                workflow = workflow,
                                mode = ExecutionMode.SCHEDULED,
                                triggerNode = nodeId
                            )
                        }
                    } catch (e: Exception) {
                        // Log error
                        println("Error executing scheduled workflow $workflowId: ${e.message}")
                    }
                }
            }
        }
    }
}

/**
 * Polling trigger manager for nodes that poll external services
 */
class PollingTriggerManager(
    private val workflowRepository: WorkflowRepository,
    private val workflowExecutor: WorkflowExecutor
) {
    private val scope = CoroutineScope(Dispatchers.Default + SupervisorJob())
    private val activePollers = mutableMapOf<String, Job>()

    /**
     * Start polling for a workflow node
     */
    fun startPolling(
        workflowId: String,
        nodeId: String,
        intervalSeconds: Int = 60
    ) {
        val key = "$workflowId:$nodeId"

        // Stop existing poller if any
        stopPolling(workflowId, nodeId)

        // Start new poller
        val job = scope.launch {
            while (isActive) {
                try {
                    val workflow = workflowRepository.getById(workflowId)
                    if (workflow != null && workflow.active) {
                        workflowExecutor.execute(
                            workflow = workflow,
                            mode = ExecutionMode.TRIGGER,
                            triggerNode = nodeId
                        )
                    } else {
                        // Workflow no longer active, stop polling
                        break
                    }
                } catch (e: Exception) {
                    println("Error in polling trigger $key: ${e.message}")
                }

                delay(intervalSeconds * 1000L)
            }
        }

        activePollers[key] = job
    }

    /**
     * Stop polling for a workflow node
     */
    fun stopPolling(workflowId: String, nodeId: String) {
        val key = "$workflowId:$nodeId"
        activePollers[key]?.cancel()
        activePollers.remove(key)
    }

    /**
     * Activate all polling triggers for a workflow
     */
    suspend fun activateWorkflowPolling(workflow: Workflow) {
        workflow.nodes.filter { node ->
            // Check if node has polling property
            val nodeType = dev.elide.workflow.nodes.NodeRegistry.getNodeType(node.type)
            nodeType?.polling == true
        }.forEach { node ->
            val interval = node.parameters["checkInterval"]?.toString()?.toIntOrNull() ?: 60
            startPolling(workflow.id, node.id, interval * 60) // Convert minutes to seconds
        }
    }

    /**
     * Deactivate all polling triggers for a workflow
     */
    fun deactivateWorkflowPolling(workflowId: String, nodes: List<WorkflowNode>) {
        nodes.forEach { node ->
            stopPolling(workflowId, node.id)
        }
    }

    fun shutdown() {
        activePollers.values.forEach { it.cancel() }
        activePollers.clear()
        scope.cancel()
    }
}

/**
 * Event trigger manager for event-based triggers
 */
class EventTriggerManager {
    private val eventListeners = mutableMapOf<String, MutableList<EventListener>>()

    /**
     * Register an event listener
     */
    fun registerEventListener(
        eventType: String,
        workflowId: String,
        nodeId: String,
        callback: suspend (Map<String, Any>) -> Unit
    ) {
        val listener = EventListener(workflowId, nodeId, callback)
        eventListeners.getOrPut(eventType) { mutableListOf() }.add(listener)
    }

    /**
     * Unregister event listeners for a workflow
     */
    fun unregisterEventListeners(workflowId: String) {
        eventListeners.values.forEach { listeners ->
            listeners.removeIf { it.workflowId == workflowId }
        }
    }

    /**
     * Emit an event
     */
    suspend fun emitEvent(eventType: String, data: Map<String, Any>) {
        eventListeners[eventType]?.forEach { listener ->
            try {
                listener.callback(data)
            } catch (e: Exception) {
                println("Error in event listener: ${e.message}")
            }
        }
    }

    data class EventListener(
        val workflowId: String,
        val nodeId: String,
        val callback: suspend (Map<String, Any>) -> Unit
    )
}

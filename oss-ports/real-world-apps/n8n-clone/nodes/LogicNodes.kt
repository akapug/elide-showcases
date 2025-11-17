package dev.elide.workflow.nodes

import dev.elide.workflow.models.*
import kotlinx.serialization.json.*

/**
 * IF Node - Conditional routing
 */
class IfNode : NodeBase() {
    override val description = NodeDescription(
        name = "if",
        displayName = "IF",
        description = "Route items based on conditions",
        group = NodeGroup.LOGIC,
        defaults = NodeDefaults(
            name = "IF",
            color = "#408000"
        ),
        inputs = listOf("main"),
        outputs = listOf("main", "main"),
        properties = listOf(
            NodeProperty(
                name = "conditions",
                displayName = "Conditions",
                type = PropertyType.FIXED_COLLECTION,
                default = JsonObject(emptyMap())
            ),
            NodeProperty(
                name = "combineOperation",
                displayName = "Combine",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("all"),
                options = listOf(
                    PropertyOption("ALL", "all"),
                    PropertyOption("ANY", "any")
                )
            )
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        // In production, evaluate conditions and route accordingly
        // For now, route all to true output
        return NodeExecutionResult(data = context.inputData)
    }
}

/**
 * Switch Node - Multi-way routing
 */
class SwitchNode : NodeBase() {
    override val description = NodeDescription(
        name = "switch",
        displayName = "Switch",
        description = "Route items to different branches",
        group = NodeGroup.LOGIC,
        defaults = NodeDefaults(
            name = "Switch",
            color = "#506000"
        ),
        inputs = listOf("main"),
        outputs = listOf("main", "main", "main", "main"),
        properties = listOf(
            NodeProperty(
                name = "mode",
                displayName = "Mode",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("rules"),
                options = listOf(
                    PropertyOption("Rules", "rules"),
                    PropertyOption("Expression", "expression")
                )
            ),
            NodeProperty(
                name = "rules",
                displayName = "Rules",
                type = PropertyType.FIXED_COLLECTION,
                default = JsonObject(emptyMap()),
                displayOptions = DisplayOptions(
                    show = mapOf("mode" to listOf(JsonPrimitive("rules")))
                )
            )
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        // In production, evaluate rules and route to appropriate outputs
        return NodeExecutionResult(data = context.inputData)
    }
}

/**
 * Loop Node - Loop over items
 */
class LoopNode : NodeBase() {
    override val description = NodeDescription(
        name = "loop",
        displayName = "Loop Over Items",
        description = "Execute nodes multiple times",
        group = NodeGroup.LOGIC,
        defaults = NodeDefaults(
            name = "Loop",
            color = "#FF6600"
        ),
        inputs = listOf("main"),
        outputs = listOf("main"),
        properties = listOf(
            NodeProperty(
                name = "batchSize",
                displayName = "Batch Size",
                type = PropertyType.NUMBER,
                default = JsonPrimitive(1),
                description = "How many items to process in each iteration"
            ),
            NodeProperty(
                name = "options",
                displayName = "Options",
                type = PropertyType.COLLECTION,
                default = JsonObject(emptyMap())
            )
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        val batchSize = getNodeParameterInt(context, "batchSize", 1)

        // In production, loop would be handled by execution engine
        return NodeExecutionResult(data = context.inputData)
    }
}

/**
 * Wait Node
 */
class WaitNode : NodeBase() {
    override val description = NodeDescription(
        name = "wait",
        displayName = "Wait",
        description = "Wait before continuing",
        group = NodeGroup.LOGIC,
        defaults = NodeDefaults(
            name = "Wait",
            color = "#6AA5B8"
        ),
        inputs = listOf("main"),
        outputs = listOf("main"),
        properties = listOf(
            NodeProperty(
                name = "resume",
                displayName = "Resume",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("after"),
                options = listOf(
                    PropertyOption("After Time Interval", "after"),
                    PropertyOption("At Specific Time", "at"),
                    PropertyOption("On Webhook Call", "webhook"),
                    PropertyOption("On Form Submission", "form")
                )
            ),
            NodeProperty(
                name = "amount",
                displayName = "Wait Amount",
                type = PropertyType.NUMBER,
                default = JsonPrimitive(1),
                displayOptions = DisplayOptions(
                    show = mapOf("resume" to listOf(JsonPrimitive("after")))
                )
            ),
            NodeProperty(
                name = "unit",
                displayName = "Wait Unit",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("seconds"),
                displayOptions = DisplayOptions(
                    show = mapOf("resume" to listOf(JsonPrimitive("after")))
                ),
                options = listOf(
                    PropertyOption("Seconds", "seconds"),
                    PropertyOption("Minutes", "minutes"),
                    PropertyOption("Hours", "hours"),
                    PropertyOption("Days", "days")
                )
            )
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        val resume = getNodeParameterString(context, "resume", "after")

        if (resume == "after") {
            val amount = getNodeParameterInt(context, "amount", 1)
            val unit = getNodeParameterString(context, "unit", "seconds")

            val delayMs = when (unit) {
                "seconds" -> amount * 1000L
                "minutes" -> amount * 60 * 1000L
                "hours" -> amount * 60 * 60 * 1000L
                "days" -> amount * 24 * 60 * 60 * 1000L
                else -> 1000L
            }

            kotlinx.coroutines.delay(delayMs)
        }

        return NodeExecutionResult(data = context.inputData)
    }
}

/**
 * Execute Workflow Node
 */
class ExecuteWorkflowNode : NodeBase() {
    override val description = NodeDescription(
        name = "executeWorkflow",
        displayName = "Execute Workflow",
        description = "Execute another workflow",
        group = NodeGroup.LOGIC,
        defaults = NodeDefaults(
            name = "Execute Workflow",
            color = "#FF6D5A"
        ),
        inputs = listOf("main"),
        outputs = listOf("main"),
        properties = listOf(
            NodeProperty(
                name = "workflowId",
                displayName = "Workflow",
                type = PropertyType.STRING,
                default = JsonPrimitive(""),
                required = true,
                description = "The workflow to execute"
            ),
            NodeProperty(
                name = "mode",
                displayName = "Mode",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("integrated"),
                options = listOf(
                    PropertyOption("Integrated", "integrated"),
                    PropertyOption("Separate", "separate")
                )
            )
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        val workflowId = getNodeParameterString(context, "workflowId")

        // In production, load and execute the specified workflow
        // For now, return input data
        return NodeExecutionResult(data = context.inputData)
    }
}

/**
 * Stop and Error Node
 */
class StopAndErrorNode : NodeBase() {
    override val description = NodeDescription(
        name = "stopAndError",
        displayName = "Stop and Error",
        description = "Stop workflow execution with an error",
        group = NodeGroup.LOGIC,
        defaults = NodeDefaults(
            name = "Stop and Error",
            color = "#FF0000"
        ),
        inputs = listOf("main"),
        outputs = emptyList(),
        properties = listOf(
            NodeProperty(
                name = "errorMessage",
                displayName = "Error Message",
                type = PropertyType.STRING,
                default = JsonPrimitive("Workflow stopped"),
                required = true
            )
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        val errorMessage = getNodeParameterString(context, "errorMessage", "Workflow stopped")
        return createErrorResult(errorMessage)
    }
}

/**
 * No Operation Node
 */
class NoOpNode : NodeBase() {
    override val description = NodeDescription(
        name = "noOp",
        displayName = "No Operation",
        description = "Does nothing, useful for organization",
        group = NodeGroup.UTILITY,
        defaults = NodeDefaults(
            name = "No Op",
            color = "#b0b0b0"
        ),
        inputs = listOf("main"),
        outputs = listOf("main"),
        properties = emptyList()
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        return NodeExecutionResult(data = context.inputData)
    }
}

package dev.elide.workflow.nodes

import dev.elide.workflow.models.*
import kotlinx.serialization.json.*

/**
 * Manual Trigger Node - starts workflow manually
 */
class ManualTriggerNode : NodeBase() {
    override val description = NodeDescription(
        name = "manual",
        displayName = "Manual Trigger",
        description = "Manually trigger a workflow",
        group = NodeGroup.TRIGGER,
        defaults = NodeDefaults(
            name = "When clicking 'Test workflow'",
            color = "#909298"
        ),
        outputs = listOf("main"),
        inputs = emptyList(),
        triggerPanel = TriggerPanelConfig(
            activationMessage = "Click 'Execute workflow' to start the workflow",
            header = "Manual Trigger",
            executionsHelp = "Manual triggers start when you click the execute button"
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        // Manual trigger just passes through any input data
        val outputData = if (context.inputData.isEmpty()) {
            listOf(createOutputData(JsonObject(mapOf("timestamp" to JsonPrimitive(System.currentTimeMillis())))))
        } else {
            context.inputData
        }

        return NodeExecutionResult(data = outputData)
    }
}

/**
 * Webhook Trigger Node - receives HTTP webhooks
 */
class WebhookNode : NodeBase() {
    override val description = NodeDescription(
        name = "webhook",
        displayName = "Webhook",
        description = "Receives HTTP webhooks",
        group = NodeGroup.TRIGGER,
        defaults = NodeDefaults(
            name = "Webhook",
            color = "#00bbcc"
        ),
        outputs = listOf("main"),
        inputs = emptyList(),
        properties = listOf(
            NodeProperty(
                name = "httpMethod",
                displayName = "HTTP Method",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("POST"),
                required = true,
                options = listOf(
                    PropertyOption("GET", "GET"),
                    PropertyOption("POST", "POST"),
                    PropertyOption("PUT", "PUT"),
                    PropertyOption("DELETE", "DELETE"),
                    PropertyOption("PATCH", "PATCH")
                )
            ),
            NodeProperty(
                name = "path",
                displayName = "Path",
                type = PropertyType.STRING,
                default = JsonPrimitive(""),
                required = true,
                description = "The path to listen to (e.g., webhook/my-workflow)"
            ),
            NodeProperty(
                name = "responseMode",
                displayName = "Response Mode",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("onReceived"),
                options = listOf(
                    PropertyOption("On Received", "onReceived", "Return a response immediately"),
                    PropertyOption("Last Node", "lastNode", "Return data from last node"),
                    PropertyOption("Response Code", "responseCode", "Return custom response code")
                )
            ),
            NodeProperty(
                name = "responseCode",
                displayName = "Response Code",
                type = PropertyType.NUMBER,
                default = JsonPrimitive(200),
                displayOptions = DisplayOptions(
                    show = mapOf("responseMode" to listOf(JsonPrimitive("responseCode")))
                )
            )
        ),
        webhooks = listOf(
            WebhookDescription(
                name = "default",
                httpMethod = "={{$parameter[\"httpMethod\"]}}",
                path = "={{$parameter[\"path\"]}}"
            )
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        // Webhook data comes from inputData
        return NodeExecutionResult(data = context.inputData)
    }
}

/**
 * Schedule Trigger Node - runs on a schedule
 */
class ScheduleNode : NodeBase() {
    override val description = NodeDescription(
        name = "schedule",
        displayName = "Schedule Trigger",
        description = "Triggers workflow on a schedule",
        group = NodeGroup.TRIGGER,
        defaults = NodeDefaults(
            name = "Schedule Trigger",
            color = "#31C0F1"
        ),
        outputs = listOf("main"),
        inputs = emptyList(),
        properties = listOf(
            NodeProperty(
                name = "rule",
                displayName = "Rule",
                type = PropertyType.FIXED_COLLECTION,
                default = JsonObject(emptyMap()),
                description = "Define when to trigger"
            ),
            NodeProperty(
                name = "triggerTimes",
                displayName = "Trigger Times",
                type = PropertyType.FIXED_COLLECTION,
                default = JsonObject(emptyMap())
            ),
            NodeProperty(
                name = "cronExpression",
                displayName = "Cron Expression",
                type = PropertyType.STRING,
                default = JsonPrimitive("0 0 * * *"),
                placeholder = "0 0 * * *",
                description = "Cron expression to define schedule"
            )
        ),
        polling = true,
        triggerPanel = TriggerPanelConfig(
            activationMessage = "Workflow will automatically run based on schedule",
            header = "Schedule Trigger"
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        val cronExpression = getNodeParameterString(context, "cronExpression", "0 0 * * *")

        val outputData = createOutputData(
            JsonObject(mapOf(
                "timestamp" to JsonPrimitive(System.currentTimeMillis()),
                "cronExpression" to JsonPrimitive(cronExpression)
            ))
        )

        return NodeExecutionResult(data = listOf(outputData))
    }
}

/**
 * Email Trigger Node - triggers on email received
 */
class EmailTriggerNode : NodeBase() {
    override val description = NodeDescription(
        name = "emailTrigger",
        displayName = "Email Trigger (IMAP)",
        description = "Triggers workflow when email is received",
        group = NodeGroup.TRIGGER,
        defaults = NodeDefaults(
            name = "Email Trigger",
            color = "#44AA22"
        ),
        outputs = listOf("main"),
        inputs = emptyList(),
        properties = listOf(
            NodeProperty(
                name = "mailbox",
                displayName = "Mailbox",
                type = PropertyType.STRING,
                default = JsonPrimitive("INBOX"),
                required = true
            ),
            NodeProperty(
                name = "postProcessAction",
                displayName = "Post Process Action",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("read"),
                options = listOf(
                    PropertyOption("Mark as Read", "read"),
                    PropertyOption("Move to Folder", "move"),
                    PropertyOption("Delete", "delete"),
                    PropertyOption("Nothing", "nothing")
                )
            ),
            NodeProperty(
                name = "checkInterval",
                displayName = "Check Interval (minutes)",
                type = PropertyType.NUMBER,
                default = JsonPrimitive(5),
                description = "How often to check for new emails"
            )
        ),
        credentials = listOf(
            CredentialDescription(name = "imap", required = true)
        ),
        polling = true
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        // In production, this would connect to IMAP server and check for emails
        val credentials = getCredentials(context, "imap")
        val mailbox = getNodeParameterString(context, "mailbox", "INBOX")

        // Simulated email data
        val emailData = createOutputData(
            JsonObject(mapOf(
                "from" to JsonPrimitive("sender@example.com"),
                "to" to JsonPrimitive("receiver@example.com"),
                "subject" to JsonPrimitive("Test Email"),
                "body" to JsonPrimitive("Email body content"),
                "receivedAt" to JsonPrimitive(System.currentTimeMillis())
            ))
        )

        return NodeExecutionResult(data = listOf(emailData))
    }
}

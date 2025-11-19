package dev.elide.workflow.nodes

import dev.elide.workflow.models.*
import kotlinx.serialization.json.*

/**
 * Base interface for all workflow nodes
 */
interface INode {
    val description: NodeDescription

    suspend fun execute(context: NodeExecutionContext): NodeExecutionResult
}

/**
 * Node description metadata
 */
data class NodeDescription(
    val name: String,
    val displayName: String,
    val description: String,
    val group: NodeGroup,
    val version: Int = 1,
    val defaults: NodeDefaults = NodeDefaults(),
    val inputs: List<String> = listOf("main"),
    val outputs: List<String> = listOf("main"),
    val properties: List<NodeProperty> = emptyList(),
    val credentials: List<CredentialDescription> = emptyList(),
    val webhooks: List<WebhookDescription> = emptyList(),
    val polling: Boolean = false,
    val triggerPanel: TriggerPanelConfig? = null
)

enum class NodeGroup {
    TRIGGER,
    ACTION,
    TRANSFORM,
    LOGIC,
    INTEGRATION,
    DATABASE,
    COMMUNICATION,
    FILE,
    UTILITY
}

data class NodeDefaults(
    val name: String = "",
    val color: String = "#666666"
)

data class NodeProperty(
    val name: String,
    val displayName: String,
    val type: PropertyType,
    val default: JsonElement = JsonNull,
    val required: Boolean = false,
    val description: String = "",
    val options: List<PropertyOption> = emptyList(),
    val placeholder: String = "",
    val displayOptions: DisplayOptions? = null,
    val noDataExpression: Boolean = false,
    val extractValue: ExtractValue? = null
)

enum class PropertyType {
    STRING,
    NUMBER,
    BOOLEAN,
    JSON,
    OPTIONS,
    MULTI_OPTIONS,
    COLOR,
    DATE_TIME,
    COLLECTION,
    FIXED_COLLECTION,
    CREDENTIAL,
    RESOURCE_LOCATOR,
    CODE
}

data class PropertyOption(
    val name: String,
    val value: String,
    val description: String = ""
)

data class DisplayOptions(
    val show: Map<String, List<JsonElement>> = emptyMap(),
    val hide: Map<String, List<JsonElement>> = emptyMap()
)

data class ExtractValue(
    val type: String,
    val regex: String? = null
)

data class CredentialDescription(
    val name: String,
    val required: Boolean = false,
    val displayOptions: DisplayOptions? = null
)

data class WebhookDescription(
    val name: String,
    val httpMethod: String,
    val path: String,
    val responseMode: String = "onReceived"
)

data class TriggerPanelConfig(
    val activationMessage: String,
    val header: String = "",
    val executionsHelp: String = ""
)

/**
 * Abstract base class for nodes
 */
abstract class NodeBase : INode {
    protected fun getNodeParameter(
        context: NodeExecutionContext,
        parameterName: String,
        default: JsonElement = JsonNull
    ): JsonElement {
        return context.node.parameters[parameterName] ?: default
    }

    protected fun getNodeParameterString(
        context: NodeExecutionContext,
        parameterName: String,
        default: String = ""
    ): String {
        val value = getNodeParameter(context, parameterName)
        return if (value is JsonPrimitive && value.isString) {
            value.content
        } else {
            default
        }
    }

    protected fun getNodeParameterInt(
        context: NodeExecutionContext,
        parameterName: String,
        default: Int = 0
    ): Int {
        val value = getNodeParameter(context, parameterName)
        return if (value is JsonPrimitive) {
            value.intOrNull ?: default
        } else {
            default
        }
    }

    protected fun getNodeParameterBoolean(
        context: NodeExecutionContext,
        parameterName: String,
        default: Boolean = false
    ): Boolean {
        val value = getNodeParameter(context, parameterName)
        return if (value is JsonPrimitive) {
            value.booleanOrNull ?: default
        } else {
            default
        }
    }

    protected fun getNodeParameterObject(
        context: NodeExecutionContext,
        parameterName: String
    ): JsonObject {
        val value = getNodeParameter(context, parameterName)
        return if (value is JsonObject) {
            value
        } else {
            JsonObject(emptyMap())
        }
    }

    protected fun getCredentials(
        context: NodeExecutionContext,
        type: String
    ): Map<String, Any> {
        return context.credentials[type] as? Map<String, Any> ?: emptyMap()
    }

    protected fun createOutputData(
        json: JsonObject,
        binary: Map<String, BinaryData> = emptyMap()
    ): NodeExecutionData {
        return NodeExecutionData(json = json, binary = binary)
    }

    protected fun createErrorResult(message: String): NodeExecutionResult {
        return NodeExecutionResult(
            data = emptyList(),
            error = message
        )
    }

    protected fun evaluateExpression(
        expression: String,
        context: NodeExecutionContext,
        itemIndex: Int = 0
    ): String {
        // Simple expression evaluation - in production, use a proper expression engine
        var result = expression

        // Replace $json references
        val jsonPattern = """\$json\["([^"]+)"\]""".toRegex()
        result = jsonPattern.replace(result) { matchResult ->
            val key = matchResult.groupValues[1]
            if (itemIndex < context.inputData.size) {
                context.inputData[itemIndex].json[key]?.toString() ?: ""
            } else {
                ""
            }
        }

        // Replace $node references
        val nodePattern = """\$node\["([^"]+)"\]\.json\["([^"]+)"\]""".toRegex()
        result = nodePattern.replace(result) { matchResult ->
            // Would need to look up node data from execution context
            ""
        }

        return result
    }
}

/**
 * Registry for all available nodes
 */
object NodeRegistry {
    private val nodes = mutableMapOf<String, () -> INode>()

    fun register(type: String, factory: () -> INode) {
        nodes[type] = factory
    }

    fun create(type: String): INode? {
        return nodes[type]?.invoke()
    }

    fun getAllNodeTypes(): List<NodeDescription> {
        return nodes.values.map { it().description }
    }

    fun getNodeType(type: String): NodeDescription? {
        return create(type)?.description
    }
}

/**
 * Node initialization - register all available nodes
 */
fun initializeNodes() {
    // Trigger nodes
    NodeRegistry.register("webhook", ::WebhookNode)
    NodeRegistry.register("schedule", ::ScheduleNode)
    NodeRegistry.register("manual", ::ManualTriggerNode)
    NodeRegistry.register("emailTrigger", ::EmailTriggerNode)

    // HTTP & API nodes
    NodeRegistry.register("httpRequest", ::HttpRequestNode)
    NodeRegistry.register("webhook", ::WebhookNode)

    // Database nodes
    NodeRegistry.register("postgres", ::PostgresNode)
    NodeRegistry.register("mysql", ::MySQLNode)
    NodeRegistry.register("mongodb", ::MongoDBNode)

    // Communication nodes
    NodeRegistry.register("email", ::EmailNode)
    NodeRegistry.register("slack", ::SlackNode)
    NodeRegistry.register("discord", ::DiscordNode)
    NodeRegistry.register("telegram", ::TelegramNode)

    // Cloud Storage
    NodeRegistry.register("googleSheets", ::GoogleSheetsNode)
    NodeRegistry.register("airtable", ::AirtableNode)
    NodeRegistry.register("aws", ::AWSNode)
    NodeRegistry.register("azure", ::AzureNode)
    NodeRegistry.register("gcp", ::GCPNode)

    // Version Control
    NodeRegistry.register("github", ::GitHubNode)
    NodeRegistry.register("gitlab", ::GitLabNode)

    // Payment
    NodeRegistry.register("stripe", ::StripeNode)
    NodeRegistry.register("paypal", ::PayPalNode)

    // File operations
    NodeRegistry.register("readFile", ::ReadFileNode)
    NodeRegistry.register("writeFile", ::WriteFileNode)
    NodeRegistry.register("moveFile", ::MoveFileNode)

    // Data transformation
    NodeRegistry.register("set", ::SetNode)
    NodeRegistry.register("function", ::FunctionNode)
    NodeRegistry.register("split", ::SplitNode)
    NodeRegistry.register("merge", ::MergeNode)
    NodeRegistry.register("aggregate", ::AggregateNode)
    NodeRegistry.register("filter", ::FilterNode)
    NodeRegistry.register("sort", ::SortNode)
    NodeRegistry.register("limit", ::LimitNode)

    // Logic nodes
    NodeRegistry.register("if", ::IfNode)
    NodeRegistry.register("switch", ::SwitchNode)
    NodeRegistry.register("loop", ::LoopNode)

    // Utility nodes
    NodeRegistry.register("wait", ::WaitNode)
    NodeRegistry.register("executeWorkflow", ::ExecuteWorkflowNode)
    NodeRegistry.register("stopAndError", ::StopAndErrorNode)
    NodeRegistry.register("noOp", ::NoOpNode)
}

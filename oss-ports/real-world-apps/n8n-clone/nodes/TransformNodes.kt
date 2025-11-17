package dev.elide.workflow.nodes

import dev.elide.workflow.models.*
import kotlinx.serialization.json.*
import javax.script.ScriptEngineManager

/**
 * Set Node - Set/transform data
 */
class SetNode : NodeBase() {
    override val description = NodeDescription(
        name = "set",
        displayName = "Set",
        description = "Set values on items and optionally remove other values",
        group = NodeGroup.TRANSFORM,
        defaults = NodeDefaults(
            name = "Set",
            color = "#0000FF"
        ),
        inputs = listOf("main"),
        outputs = listOf("main"),
        properties = listOf(
            NodeProperty(
                name = "keepOnlySet",
                displayName = "Keep Only Set",
                type = PropertyType.BOOLEAN,
                default = JsonPrimitive(false),
                description = "If only the values set on this node should be kept and all others removed"
            ),
            NodeProperty(
                name = "values",
                displayName = "Values",
                type = PropertyType.FIXED_COLLECTION,
                default = JsonObject(emptyMap()),
                description = "The value to set"
            )
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        val results = mutableListOf<NodeExecutionData>()
        val keepOnlySet = getNodeParameterBoolean(context, "keepOnlySet")
        val values = getNodeParameterObject(context, "values")

        for (item in context.inputData) {
            val newJson = if (keepOnlySet) {
                buildJsonObject {
                    values.forEach { (key, value) ->
                        put(key, value)
                    }
                }
            } else {
                buildJsonObject {
                    item.json.forEach { (key, value) ->
                        put(key, value)
                    }
                    values.forEach { (key, value) ->
                        put(key, value)
                    }
                }
            }

            results.add(createOutputData(newJson, item.binary))
        }

        return NodeExecutionResult(data = results)
    }
}

/**
 * Function Node - Execute JavaScript code
 */
class FunctionNode : NodeBase() {
    override val description = NodeDescription(
        name = "function",
        displayName = "Function",
        description = "Run custom function code in JavaScript",
        group = NodeGroup.TRANSFORM,
        defaults = NodeDefaults(
            name = "Function",
            color = "#FF9922"
        ),
        inputs = listOf("main"),
        outputs = listOf("main"),
        properties = listOf(
            NodeProperty(
                name = "functionCode",
                displayName = "JavaScript Code",
                type = PropertyType.CODE,
                default = JsonPrimitive("// Code here\nreturn items;"),
                required = true,
                description = "The JavaScript code to execute"
            )
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        val code = getNodeParameterString(context, "functionCode")

        try {
            // In production, use a sandboxed JavaScript engine like GraalVM
            // For now, using basic ScriptEngine
            val engine = ScriptEngineManager().getEngineByName("nashorn")
                ?: ScriptEngineManager().getEngineByName("javascript")
                ?: return createErrorResult("JavaScript engine not available")

            // Convert input data to JavaScript-compatible format
            engine.put("items", context.inputData)
            engine.put("$json", context.inputData.firstOrNull()?.json)

            val result = engine.eval(code)

            // For now, return input data as-is
            // In production, parse and convert the JavaScript result
            return NodeExecutionResult(data = context.inputData)

        } catch (e: Exception) {
            return createErrorResult("Function execution error: ${e.message}")
        }
    }
}

/**
 * Filter Node
 */
class FilterNode : NodeBase() {
    override val description = NodeDescription(
        name = "filter",
        displayName = "Filter",
        description = "Filter items based on conditions",
        group = NodeGroup.TRANSFORM,
        defaults = NodeDefaults(
            name = "Filter",
            color = "#00FF00"
        ),
        inputs = listOf("main"),
        outputs = listOf("main"),
        properties = listOf(
            NodeProperty(
                name = "conditions",
                displayName = "Conditions",
                type = PropertyType.FIXED_COLLECTION,
                default = JsonObject(emptyMap()),
                description = "The conditions to check"
            ),
            NodeProperty(
                name = "combineOperation",
                displayName = "Combine",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("all"),
                options = listOf(
                    PropertyOption("All", "all"),
                    PropertyOption("Any", "any")
                )
            )
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        val results = mutableListOf<NodeExecutionData>()
        val conditions = getNodeParameterObject(context, "conditions")

        // Simple filter - keep all items for now
        // In production, evaluate conditions against each item
        results.addAll(context.inputData)

        return NodeExecutionResult(data = results)
    }
}

/**
 * Sort Node
 */
class SortNode : NodeBase() {
    override val description = NodeDescription(
        name = "sort",
        displayName = "Sort",
        description = "Sort items by specified field",
        group = NodeGroup.TRANSFORM,
        defaults = NodeDefaults(
            name = "Sort",
            color = "#7700FF"
        ),
        inputs = listOf("main"),
        outputs = listOf("main"),
        properties = listOf(
            NodeProperty(
                name = "sortFieldsUi",
                displayName = "Sort By",
                type = PropertyType.FIXED_COLLECTION,
                default = JsonObject(emptyMap())
            )
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        val sortConfig = getNodeParameterObject(context, "sortFieldsUi")

        // In production, implement actual sorting logic
        val results = context.inputData.toMutableList()

        return NodeExecutionResult(data = results)
    }
}

/**
 * Limit Node
 */
class LimitNode : NodeBase() {
    override val description = NodeDescription(
        name = "limit",
        displayName = "Limit",
        description = "Limit the number of items",
        group = NodeGroup.TRANSFORM,
        defaults = NodeDefaults(
            name = "Limit",
            color = "#00CCFF"
        ),
        inputs = listOf("main"),
        outputs = listOf("main"),
        properties = listOf(
            NodeProperty(
                name = "maxItems",
                displayName = "Max Items",
                type = PropertyType.NUMBER,
                default = JsonPrimitive(10),
                required = true
            ),
            NodeProperty(
                name = "keepMissing",
                displayName = "Keep Missing Items",
                type = PropertyType.BOOLEAN,
                default = JsonPrimitive(false)
            )
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        val maxItems = getNodeParameterInt(context, "maxItems", 10)
        val results = context.inputData.take(maxItems)

        return NodeExecutionResult(data = results)
    }
}

/**
 * Split Node
 */
class SplitNode : NodeBase() {
    override val description = NodeDescription(
        name = "split",
        displayName = "Split Out",
        description = "Split out items into multiple batches",
        group = NodeGroup.TRANSFORM,
        defaults = NodeDefaults(
            name = "Split Out",
            color = "#FF6600"
        ),
        inputs = listOf("main"),
        outputs = listOf("main"),
        properties = listOf(
            NodeProperty(
                name = "batchSize",
                displayName = "Batch Size",
                type = PropertyType.NUMBER,
                default = JsonPrimitive(10),
                description = "Number of items per batch"
            )
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        val batchSize = getNodeParameterInt(context, "batchSize", 10)

        // In production, this would split into multiple executions
        // For now, return all items
        return NodeExecutionResult(data = context.inputData)
    }
}

/**
 * Merge Node
 */
class MergeNode : NodeBase() {
    override val description = NodeDescription(
        name = "merge",
        displayName = "Merge",
        description = "Merge data from multiple streams",
        group = NodeGroup.TRANSFORM,
        defaults = NodeDefaults(
            name = "Merge",
            color = "#00AA00"
        ),
        inputs = listOf("main", "main"),
        outputs = listOf("main"),
        properties = listOf(
            NodeProperty(
                name = "mode",
                displayName = "Mode",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("append"),
                options = listOf(
                    PropertyOption("Append", "append"),
                    PropertyOption("Merge By Field", "mergeByField"),
                    PropertyOption("Multiplex", "multiplex")
                )
            ),
            NodeProperty(
                name = "mergeByFields",
                displayName = "Fields To Match",
                type = PropertyType.FIXED_COLLECTION,
                default = JsonObject(emptyMap()),
                displayOptions = DisplayOptions(
                    show = mapOf("mode" to listOf(JsonPrimitive("mergeByField")))
                )
            )
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        // In production, merge data from multiple inputs
        // For now, return input data
        return NodeExecutionResult(data = context.inputData)
    }
}

/**
 * Aggregate Node
 */
class AggregateNode : NodeBase() {
    override val description = NodeDescription(
        name = "aggregate",
        displayName = "Aggregate",
        description = "Aggregate items together",
        group = NodeGroup.TRANSFORM,
        defaults = NodeDefaults(
            name = "Aggregate",
            color = "#00FFAA"
        ),
        inputs = listOf("main"),
        outputs = listOf("main"),
        properties = listOf(
            NodeProperty(
                name = "aggregate",
                displayName = "Aggregate",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("aggregateIndividualFields"),
                options = listOf(
                    PropertyOption("Aggregate Individual Fields", "aggregateIndividualFields"),
                    PropertyOption("Aggregate All Item Fields", "aggregateAllItemFields")
                )
            )
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        // Simple aggregation - combine all items into one
        val aggregated = buildJsonObject {
            put("count", JsonPrimitive(context.inputData.size))
            put("items", JsonArray(context.inputData.map { it.json }))
        }

        return NodeExecutionResult(data = listOf(createOutputData(aggregated)))
    }
}

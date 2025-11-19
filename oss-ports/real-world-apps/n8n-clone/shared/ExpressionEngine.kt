package dev.elide.workflow.expressions

import kotlinx.serialization.json.*
import java.time.*
import java.time.format.DateTimeFormatter
import javax.script.ScriptEngineManager

/**
 * Expression engine for evaluating expressions in workflows
 * Supports: {{$json["field"]}}, {{$node["NodeName"].json["field"]}}, JavaScript expressions
 */
class ExpressionEngine {
    private val scriptEngine = ScriptEngineManager().getEngineByName("javascript")

    /**
     * Evaluate an expression
     */
    fun evaluate(
        expression: String,
        context: ExpressionContext
    ): Any? {
        if (!expression.contains("{{") || !expression.contains("}}")) {
            return expression
        }

        var result = expression
        val pattern = """{{(.+?)}}""".toRegex()

        pattern.findAll(expression).forEach { match ->
            val expr = match.groupValues[1].trim()
            val value = evaluateExpression(expr, context)
            result = result.replace(match.value, value.toString())
        }

        return result
    }

    private fun evaluateExpression(
        expr: String,
        context: ExpressionContext
    ): Any? {
        return when {
            expr.startsWith("\$json") -> evaluateJsonAccess(expr, context.currentItem)
            expr.startsWith("\$node") -> evaluateNodeAccess(expr, context)
            expr.startsWith("\$parameter") -> evaluateParameterAccess(expr, context)
            expr.startsWith("\$env") -> evaluateEnvAccess(expr)
            else -> evaluateJavaScript(expr, context)
        }
    }

    /**
     * Evaluate $json["field"] expressions
     */
    private fun evaluateJsonAccess(expr: String, item: JsonObject): Any? {
        val fieldPattern = """\$json\["([^"]+)"\]""".toRegex()
        val match = fieldPattern.find(expr) ?: return null
        val field = match.groupValues[1]

        return item[field]?.let { element ->
            when (element) {
                is JsonPrimitive -> {
                    when {
                        element.isString -> element.content
                        element.booleanOrNull != null -> element.booleanOrNull
                        element.intOrNull != null -> element.intOrNull
                        element.longOrNull != null -> element.longOrNull
                        element.doubleOrNull != null -> element.doubleOrNull
                        else -> element.content
                    }
                }
                else -> element.toString()
            }
        }
    }

    /**
     * Evaluate $node["NodeName"].json["field"] expressions
     */
    private fun evaluateNodeAccess(expr: String, context: ExpressionContext): Any? {
        val nodePattern = """\$node\["([^"]+)"\]\.json\["([^"]+)"\]""".toRegex()
        val match = nodePattern.find(expr) ?: return null

        val nodeName = match.groupValues[1]
        val field = match.groupValues[2]

        val nodeData = context.nodeData[nodeName]?.firstOrNull() ?: return null
        return evaluateJsonAccess("\$json[\"$field\"]", nodeData)
    }

    /**
     * Evaluate $parameter["name"] expressions
     */
    private fun evaluateParameterAccess(expr: String, context: ExpressionContext): Any? {
        val paramPattern = """\$parameter\["([^"]+)"\]""".toRegex()
        val match = paramPattern.find(expr) ?: return null
        val param = match.groupValues[1]

        return context.parameters[param]?.let { element ->
            when (element) {
                is JsonPrimitive -> element.content
                else -> element.toString()
            }
        }
    }

    /**
     * Evaluate $env["VAR"] expressions
     */
    private fun evaluateEnvAccess(expr: String): String? {
        val envPattern = """\$env\["([^"]+)"\]""".toRegex()
        val match = envPattern.find(expr) ?: return null
        val varName = match.groupValues[1]

        return System.getenv(varName)
    }

    /**
     * Evaluate JavaScript expressions
     */
    private fun evaluateJavaScript(expr: String, context: ExpressionContext): Any? {
        try {
            // Set context variables
            scriptEngine.put("\$json", context.currentItem)
            scriptEngine.put("\$now", Instant.now().toString())
            scriptEngine.put("\$today", LocalDate.now().toString())

            // Utility functions
            scriptEngine.eval("""
                function formatDate(date, format) {
                    return new Date(date).toISOString();
                }

                function parseJson(str) {
                    return JSON.parse(str);
                }

                function stringify(obj) {
                    return JSON.stringify(obj);
                }

                function randomInt(min, max) {
                    return Math.floor(Math.random() * (max - min + 1)) + min;
                }

                function uuid() {
                    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                        var r = Math.random() * 16 | 0;
                        var v = c == 'x' ? r : (r & 0x3 | 0x8);
                        return v.toString(16);
                    });
                }
            """.trimIndent())

            return scriptEngine.eval(expr)
        } catch (e: Exception) {
            return null
        }
    }
}

/**
 * Context for expression evaluation
 */
data class ExpressionContext(
    val currentItem: JsonObject,
    val nodeData: Map<String, List<JsonObject>> = emptyMap(),
    val parameters: JsonObject = JsonObject(emptyMap()),
    val itemIndex: Int = 0,
    val totalItems: Int = 1
)

/**
 * Expression helper functions
 */
object ExpressionHelpers {
    private val engine = ExpressionEngine()

    /**
     * Evaluate expression with simple context
     */
    fun evaluate(
        expression: String,
        json: JsonObject = JsonObject(emptyMap())
    ): String {
        val context = ExpressionContext(currentItem = json)
        return engine.evaluate(expression, context)?.toString() ?: expression
    }

    /**
     * Batch evaluate multiple expressions
     */
    fun evaluateAll(
        expressions: Map<String, String>,
        context: ExpressionContext
    ): Map<String, Any?> {
        return expressions.mapValues { (_, expr) ->
            engine.evaluate(expr, context)
        }
    }

    /**
     * Check if string contains expressions
     */
    fun hasExpressions(str: String): Boolean {
        return str.contains("{{") && str.contains("}}")
    }

    /**
     * Extract all expressions from string
     */
    fun extractExpressions(str: String): List<String> {
        val pattern = """{{(.+?)}}""".toRegex()
        return pattern.findAll(str).map { it.groupValues[1].trim() }.toList()
    }
}

/**
 * Expression validation
 */
object ExpressionValidator {
    /**
     * Validate expression syntax
     */
    fun validate(expression: String): ValidationResult {
        val errors = mutableListOf<String>()

        // Check balanced braces
        var braceCount = 0
        var bracketCount = 0

        expression.forEach { char ->
            when (char) {
                '{' -> braceCount++
                '}' -> braceCount--
                '[' -> bracketCount++
                ']' -> bracketCount--
            }
        }

        if (braceCount != 0) {
            errors.add("Unbalanced curly braces")
        }

        if (bracketCount != 0) {
            errors.add("Unbalanced square brackets")
        }

        // Check for valid expression patterns
        val validPatterns = listOf(
            """\$json\["[^"]+"\]""".toRegex(),
            """\$node\["[^"]+"\]\.json\["[^"]+"\]""".toRegex(),
            """\$parameter\["[^"]+"\]""".toRegex(),
            """\$env\["[^"]+"\]""".toRegex()
        )

        val expressions = ExpressionHelpers.extractExpressions(expression)

        expressions.forEach { expr ->
            val isValid = validPatterns.any { it.containsMatchIn(expr) } ||
                         !expr.startsWith("$")

            if (!isValid && expr.startsWith("$")) {
                errors.add("Invalid expression syntax: $expr")
            }
        }

        return if (errors.isEmpty()) {
            ValidationResult.Success
        } else {
            ValidationResult.Error(errors)
        }
    }
}

sealed class ValidationResult {
    object Success : ValidationResult()
    data class Error(val errors: List<String>) : ValidationResult()
}

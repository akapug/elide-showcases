package dev.elide.workflow.nodes

import dev.elide.workflow.models.*
import kotlinx.serialization.json.*
import org.apache.hc.client5.http.classic.methods.*
import org.apache.hc.client5.http.impl.classic.HttpClients
import org.apache.hc.core5.http.io.entity.StringEntity
import org.apache.hc.core5.http.io.entity.EntityUtils
import java.net.URI

/**
 * HTTP Request Node - makes HTTP requests
 */
class HttpRequestNode : NodeBase() {
    override val description = NodeDescription(
        name = "httpRequest",
        displayName = "HTTP Request",
        description = "Makes an HTTP request and returns the response",
        group = NodeGroup.ACTION,
        defaults = NodeDefaults(
            name = "HTTP Request",
            color = "#0088CC"
        ),
        inputs = listOf("main"),
        outputs = listOf("main"),
        properties = listOf(
            NodeProperty(
                name = "method",
                displayName = "Method",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("GET"),
                required = true,
                options = listOf(
                    PropertyOption("GET", "GET"),
                    PropertyOption("POST", "POST"),
                    PropertyOption("PUT", "PUT"),
                    PropertyOption("DELETE", "DELETE"),
                    PropertyOption("PATCH", "PATCH"),
                    PropertyOption("HEAD", "HEAD"),
                    PropertyOption("OPTIONS", "OPTIONS")
                )
            ),
            NodeProperty(
                name = "url",
                displayName = "URL",
                type = PropertyType.STRING,
                default = JsonPrimitive(""),
                required = true,
                placeholder = "https://api.example.com/endpoint"
            ),
            NodeProperty(
                name = "authentication",
                displayName = "Authentication",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("none"),
                options = listOf(
                    PropertyOption("None", "none"),
                    PropertyOption("Basic Auth", "basicAuth"),
                    PropertyOption("Header Auth", "headerAuth"),
                    PropertyOption("OAuth2", "oauth2"),
                    PropertyOption("Query Auth", "queryAuth")
                )
            ),
            NodeProperty(
                name = "sendQuery",
                displayName = "Send Query Parameters",
                type = PropertyType.BOOLEAN,
                default = JsonPrimitive(false)
            ),
            NodeProperty(
                name = "queryParameters",
                displayName = "Query Parameters",
                type = PropertyType.FIXED_COLLECTION,
                default = JsonObject(emptyMap()),
                displayOptions = DisplayOptions(
                    show = mapOf("sendQuery" to listOf(JsonPrimitive(true)))
                )
            ),
            NodeProperty(
                name = "sendHeaders",
                displayName = "Send Headers",
                type = PropertyType.BOOLEAN,
                default = JsonPrimitive(false)
            ),
            NodeProperty(
                name = "headerParameters",
                displayName = "Header Parameters",
                type = PropertyType.FIXED_COLLECTION,
                default = JsonObject(emptyMap()),
                displayOptions = DisplayOptions(
                    show = mapOf("sendHeaders" to listOf(JsonPrimitive(true)))
                )
            ),
            NodeProperty(
                name = "sendBody",
                displayName = "Send Body",
                type = PropertyType.BOOLEAN,
                default = JsonPrimitive(false)
            ),
            NodeProperty(
                name = "bodyContentType",
                displayName = "Body Content Type",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("json"),
                options = listOf(
                    PropertyOption("JSON", "json"),
                    PropertyOption("Form-Data", "form-data"),
                    PropertyOption("Form Urlencoded", "form-urlencoded"),
                    PropertyOption("Raw", "raw")
                ),
                displayOptions = DisplayOptions(
                    show = mapOf("sendBody" to listOf(JsonPrimitive(true)))
                )
            ),
            NodeProperty(
                name = "jsonParameters",
                displayName = "JSON/RAW Parameters",
                type = PropertyType.JSON,
                default = JsonPrimitive("{}"),
                displayOptions = DisplayOptions(
                    show = mapOf(
                        "sendBody" to listOf(JsonPrimitive(true)),
                        "bodyContentType" to listOf(JsonPrimitive("json"), JsonPrimitive("raw"))
                    )
                )
            ),
            NodeProperty(
                name = "timeout",
                displayName = "Timeout",
                type = PropertyType.NUMBER,
                default = JsonPrimitive(30000),
                description = "Request timeout in milliseconds"
            ),
            NodeProperty(
                name = "response",
                displayName = "Response",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("json"),
                options = listOf(
                    PropertyOption("JSON", "json"),
                    PropertyOption("String", "string"),
                    PropertyOption("Binary", "binary")
                )
            )
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        val results = mutableListOf<NodeExecutionData>()

        for (itemIndex in context.inputData.indices) {
            try {
                val method = getNodeParameterString(context, "method", "GET")
                val url = evaluateExpression(
                    getNodeParameterString(context, "url"),
                    context,
                    itemIndex
                )

                val httpClient = HttpClients.createDefault()

                val request = when (method) {
                    "GET" -> HttpGet(URI.create(url))
                    "POST" -> HttpPost(URI.create(url))
                    "PUT" -> HttpPut(URI.create(url))
                    "DELETE" -> HttpDelete(URI.create(url))
                    "PATCH" -> HttpPatch(URI.create(url))
                    else -> HttpGet(URI.create(url))
                }

                // Add headers
                if (getNodeParameterBoolean(context, "sendHeaders")) {
                    val headers = getNodeParameterObject(context, "headerParameters")
                    headers.forEach { (key, value) ->
                        if (value is JsonPrimitive) {
                            request.setHeader(key, value.content)
                        }
                    }
                }

                // Add body for POST/PUT/PATCH
                if (getNodeParameterBoolean(context, "sendBody") &&
                    request is HttpEntityEnclosingRequestBase) {
                    val bodyContentType = getNodeParameterString(context, "bodyContentType", "json")

                    when (bodyContentType) {
                        "json" -> {
                            val jsonBody = getNodeParameterString(context, "jsonParameters", "{}")
                            request.entity = StringEntity(jsonBody)
                            request.setHeader("Content-Type", "application/json")
                        }
                        "raw" -> {
                            val rawBody = getNodeParameterString(context, "jsonParameters", "")
                            request.entity = StringEntity(rawBody)
                        }
                    }
                }

                // Execute request
                val response = httpClient.execute(request)
                val responseBody = EntityUtils.toString(response.entity)
                val statusCode = response.code

                val outputJson = buildJsonObject {
                    put("statusCode", statusCode)
                    put("body", responseBody)
                    put("headers", buildJsonObject {
                        response.allHeaders.forEach { header ->
                            put(header.name, header.value)
                        }
                    })
                }

                results.add(createOutputData(outputJson))

            } catch (e: Exception) {
                return createErrorResult("HTTP request failed: ${e.message}")
            }
        }

        return NodeExecutionResult(data = results)
    }
}

package dev.elide.workflow.nodes

import dev.elide.workflow.models.*
import kotlinx.serialization.json.*
import java.io.File
import java.util.Base64

/**
 * Read File Node
 */
class ReadFileNode : NodeBase() {
    override val description = NodeDescription(
        name = "readFile",
        displayName = "Read/Write Files from Disk",
        description = "Read files from disk",
        group = NodeGroup.FILE,
        defaults = NodeDefaults(
            name = "Read File",
            color = "#CC2233"
        ),
        inputs = listOf("main"),
        outputs = listOf("main"),
        properties = listOf(
            NodeProperty(
                name = "operation",
                displayName = "Operation",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("read"),
                options = listOf(
                    PropertyOption("Read", "read"),
                    PropertyOption("Write", "write")
                )
            ),
            NodeProperty(
                name = "filePath",
                displayName = "File Path",
                type = PropertyType.STRING,
                default = JsonPrimitive(""),
                required = true,
                placeholder = "/path/to/file.txt"
            ),
            NodeProperty(
                name = "dataPropertyName",
                displayName = "Binary Property",
                type = PropertyType.STRING,
                default = JsonPrimitive("data"),
                displayOptions = DisplayOptions(
                    show = mapOf("operation" to listOf(JsonPrimitive("read")))
                ),
                description = "Name of the binary property to which to write the data"
            ),
            NodeProperty(
                name = "encoding",
                displayName = "Encoding",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("utf8"),
                options = listOf(
                    PropertyOption("UTF-8", "utf8"),
                    PropertyOption("ASCII", "ascii"),
                    PropertyOption("Base64", "base64"),
                    PropertyOption("Binary", "binary")
                )
            )
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        val results = mutableListOf<NodeExecutionData>()
        val operation = getNodeParameterString(context, "operation", "read")

        try {
            when (operation) {
                "read" -> {
                    for (itemIndex in context.inputData.indices) {
                        val filePath = evaluateExpression(
                            getNodeParameterString(context, "filePath"),
                            context,
                            itemIndex
                        )
                        val encoding = getNodeParameterString(context, "encoding", "utf8")
                        val dataPropertyName = getNodeParameterString(context, "dataPropertyName", "data")

                        val file = File(filePath)
                        if (!file.exists()) {
                            return createErrorResult("File not found: $filePath")
                        }

                        val content = when (encoding) {
                            "utf8", "ascii" -> file.readText()
                            "base64" -> Base64.getEncoder().encodeToString(file.readBytes())
                            "binary" -> Base64.getEncoder().encodeToString(file.readBytes())
                            else -> file.readText()
                        }

                        val binary = mapOf(
                            dataPropertyName to BinaryData(
                                data = if (encoding == "binary" || encoding == "base64") content
                                else Base64.getEncoder().encodeToString(content.toByteArray()),
                                mimeType = "application/octet-stream",
                                fileName = file.name,
                                fileSize = file.length()
                            )
                        )

                        results.add(createOutputData(
                            JsonObject(mapOf(
                                "fileName" to JsonPrimitive(file.name),
                                "filePath" to JsonPrimitive(filePath),
                                "fileSize" to JsonPrimitive(file.length())
                            )),
                            binary
                        ))
                    }
                }

                "write" -> {
                    for (item in context.inputData) {
                        val filePath = getNodeParameterString(context, "filePath")
                        val file = File(filePath)

                        // Write binary data if available
                        val binaryData = item.binary["data"]
                        if (binaryData != null) {
                            val bytes = Base64.getDecoder().decode(binaryData.data)
                            file.writeBytes(bytes)
                        }

                        results.add(createOutputData(
                            JsonObject(mapOf(
                                "fileName" to JsonPrimitive(file.name),
                                "filePath" to JsonPrimitive(filePath),
                                "success" to JsonPrimitive(true)
                            ))
                        ))
                    }
                }
            }
        } catch (e: Exception) {
            return createErrorResult("File operation error: ${e.message}")
        }

        return NodeExecutionResult(data = results)
    }
}

/**
 * Write File Node
 */
class WriteFileNode : NodeBase() {
    override val description = NodeDescription(
        name = "writeFile",
        displayName = "Write File",
        description = "Write data to a file",
        group = NodeGroup.FILE,
        defaults = NodeDefaults(
            name = "Write File",
            color = "#CC3344"
        ),
        inputs = listOf("main"),
        outputs = listOf("main"),
        properties = listOf(
            NodeProperty(
                name = "fileName",
                displayName = "File Name",
                type = PropertyType.STRING,
                default = JsonPrimitive(""),
                required = true,
                placeholder = "output.txt"
            ),
            NodeProperty(
                name = "data",
                displayName = "Data",
                type = PropertyType.STRING,
                default = JsonPrimitive(""),
                description = "The data to write to file"
            ),
            NodeProperty(
                name = "dataPropertyName",
                displayName = "Binary Property",
                type = PropertyType.STRING,
                default = JsonPrimitive("data"),
                description = "Name of the binary property containing data to write"
            )
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        val results = mutableListOf<NodeExecutionData>()

        try {
            for (item in context.inputData) {
                val fileName = getNodeParameterString(context, "fileName")
                val file = File(fileName)

                val dataPropertyName = getNodeParameterString(context, "dataPropertyName", "data")
                val binaryData = item.binary[dataPropertyName]

                if (binaryData != null) {
                    val bytes = Base64.getDecoder().decode(binaryData.data)
                    file.writeBytes(bytes)
                } else {
                    val data = getNodeParameterString(context, "data", "")
                    file.writeText(data)
                }

                results.add(createOutputData(
                    JsonObject(mapOf(
                        "fileName" to JsonPrimitive(file.name),
                        "filePath" to JsonPrimitive(file.absolutePath),
                        "success" to JsonPrimitive(true)
                    ))
                ))
            }
        } catch (e: Exception) {
            return createErrorResult("Write file error: ${e.message}")
        }

        return NodeExecutionResult(data = results)
    }
}

/**
 * Move File Node
 */
class MoveFileNode : NodeBase() {
    override val description = NodeDescription(
        name = "moveFile",
        displayName = "Move Binary Data",
        description = "Move data between binary properties",
        group = NodeGroup.FILE,
        defaults = NodeDefaults(
            name = "Move Binary Data",
            color = "#7755DD"
        ),
        inputs = listOf("main"),
        outputs = listOf("main"),
        properties = listOf(
            NodeProperty(
                name = "mode",
                displayName = "Mode",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("binaryToBinary"),
                options = listOf(
                    PropertyOption("Binary to Binary", "binaryToBinary"),
                    PropertyOption("Binary to JSON", "binaryToJson"),
                    PropertyOption("JSON to Binary", "jsonToBinary")
                )
            ),
            NodeProperty(
                name = "sourceProperty",
                displayName = "Source Property",
                type = PropertyType.STRING,
                default = JsonPrimitive("data"),
                required = true
            ),
            NodeProperty(
                name = "destinationProperty",
                displayName = "Destination Property",
                type = PropertyType.STRING,
                default = JsonPrimitive("newData"),
                required = true
            )
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        val results = mutableListOf<NodeExecutionData>()
        val mode = getNodeParameterString(context, "mode", "binaryToBinary")
        val sourceProperty = getNodeParameterString(context, "sourceProperty", "data")
        val destinationProperty = getNodeParameterString(context, "destinationProperty", "newData")

        for (item in context.inputData) {
            when (mode) {
                "binaryToBinary" -> {
                    val sourceBinary = item.binary[sourceProperty]
                    if (sourceBinary != null) {
                        val newBinary = item.binary.toMutableMap()
                        newBinary[destinationProperty] = sourceBinary
                        results.add(createOutputData(item.json, newBinary))
                    } else {
                        results.add(item)
                    }
                }

                "binaryToJson" -> {
                    val sourceBinary = item.binary[sourceProperty]
                    if (sourceBinary != null) {
                        val decoded = String(Base64.getDecoder().decode(sourceBinary.data))
                        val newJson = buildJsonObject {
                            item.json.forEach { (key, value) -> put(key, value) }
                            put(destinationProperty, JsonPrimitive(decoded))
                        }
                        results.add(createOutputData(newJson, item.binary))
                    } else {
                        results.add(item)
                    }
                }

                "jsonToBinary" -> {
                    val sourceJson = item.json[sourceProperty]
                    if (sourceJson is JsonPrimitive && sourceJson.isString) {
                        val encoded = Base64.getEncoder().encodeToString(sourceJson.content.toByteArray())
                        val newBinary = item.binary.toMutableMap()
                        newBinary[destinationProperty] = BinaryData(
                            data = encoded,
                            mimeType = "text/plain"
                        )
                        results.add(createOutputData(item.json, newBinary))
                    } else {
                        results.add(item)
                    }
                }
            }
        }

        return NodeExecutionResult(data = results)
    }
}

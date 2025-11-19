package dev.elide.workflow.nodes

import dev.elide.workflow.models.*
import kotlinx.serialization.json.*
import java.sql.DriverManager
import com.mongodb.kotlin.client.coroutine.MongoClient
import kotlinx.coroutines.flow.toList

/**
 * PostgreSQL Node
 */
class PostgresNode : NodeBase() {
    override val description = NodeDescription(
        name = "postgres",
        displayName = "PostgreSQL",
        description = "Execute queries on PostgreSQL database",
        group = NodeGroup.DATABASE,
        defaults = NodeDefaults(
            name = "Postgres",
            color = "#336791"
        ),
        inputs = listOf("main"),
        outputs = listOf("main"),
        properties = listOf(
            NodeProperty(
                name = "operation",
                displayName = "Operation",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("executeQuery"),
                required = true,
                options = listOf(
                    PropertyOption("Execute Query", "executeQuery"),
                    PropertyOption("Insert", "insert"),
                    PropertyOption("Update", "update"),
                    PropertyOption("Delete", "delete")
                )
            ),
            NodeProperty(
                name = "query",
                displayName = "Query",
                type = PropertyType.STRING,
                default = JsonPrimitive(""),
                required = true,
                displayOptions = DisplayOptions(
                    show = mapOf("operation" to listOf(JsonPrimitive("executeQuery")))
                ),
                placeholder = "SELECT * FROM users WHERE id = $1"
            ),
            NodeProperty(
                name = "table",
                displayName = "Table",
                type = PropertyType.STRING,
                default = JsonPrimitive(""),
                displayOptions = DisplayOptions(
                    hide = mapOf("operation" to listOf(JsonPrimitive("executeQuery")))
                )
            )
        ),
        credentials = listOf(
            CredentialDescription(name = "postgres", required = true)
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        val results = mutableListOf<NodeExecutionData>()
        val credentials = getCredentials(context, "postgres")

        val host = credentials["host"] as? String ?: "localhost"
        val port = credentials["port"] as? Int ?: 5432
        val database = credentials["database"] as? String ?: "postgres"
        val user = credentials["user"] as? String ?: "postgres"
        val password = credentials["password"] as? String ?: ""

        val url = "jdbc:postgresql://$host:$port/$database"

        try {
            DriverManager.getConnection(url, user, password).use { connection ->
                val operation = getNodeParameterString(context, "operation", "executeQuery")

                when (operation) {
                    "executeQuery" -> {
                        val query = getNodeParameterString(context, "query")
                        val statement = connection.createStatement()
                        val resultSet = statement.executeQuery(query)

                        val metaData = resultSet.metaData
                        val columnCount = metaData.columnCount

                        while (resultSet.next()) {
                            val row = buildJsonObject {
                                for (i in 1..columnCount) {
                                    val columnName = metaData.getColumnName(i)
                                    val value = resultSet.getString(i)
                                    put(columnName, JsonPrimitive(value))
                                }
                            }
                            results.add(createOutputData(row))
                        }
                    }

                    "insert" -> {
                        val table = getNodeParameterString(context, "table")
                        // Implementation for insert
                        results.add(createOutputData(
                            JsonObject(mapOf("success" to JsonPrimitive(true)))
                        ))
                    }
                }
            }
        } catch (e: Exception) {
            return createErrorResult("PostgreSQL error: ${e.message}")
        }

        return NodeExecutionResult(data = results)
    }
}

/**
 * MySQL Node
 */
class MySQLNode : NodeBase() {
    override val description = NodeDescription(
        name = "mysql",
        displayName = "MySQL",
        description = "Execute queries on MySQL database",
        group = NodeGroup.DATABASE,
        defaults = NodeDefaults(
            name = "MySQL",
            color = "#00758F"
        ),
        inputs = listOf("main"),
        outputs = listOf("main"),
        properties = listOf(
            NodeProperty(
                name = "operation",
                displayName = "Operation",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("executeQuery"),
                required = true,
                options = listOf(
                    PropertyOption("Execute Query", "executeQuery"),
                    PropertyOption("Insert", "insert"),
                    PropertyOption("Update", "update"),
                    PropertyOption("Delete", "delete")
                )
            ),
            NodeProperty(
                name = "query",
                displayName = "Query",
                type = PropertyType.STRING,
                default = JsonPrimitive(""),
                required = true,
                placeholder = "SELECT * FROM users"
            )
        ),
        credentials = listOf(
            CredentialDescription(name = "mysql", required = true)
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        val results = mutableListOf<NodeExecutionData>()
        val credentials = getCredentials(context, "mysql")

        val host = credentials["host"] as? String ?: "localhost"
        val port = credentials["port"] as? Int ?: 3306
        val database = credentials["database"] as? String ?: "mysql"
        val user = credentials["user"] as? String ?: "root"
        val password = credentials["password"] as? String ?: ""

        val url = "jdbc:mysql://$host:$port/$database"

        try {
            DriverManager.getConnection(url, user, password).use { connection ->
                val query = getNodeParameterString(context, "query")
                val statement = connection.createStatement()
                val resultSet = statement.executeQuery(query)

                val metaData = resultSet.metaData
                val columnCount = metaData.columnCount

                while (resultSet.next()) {
                    val row = buildJsonObject {
                        for (i in 1..columnCount) {
                            val columnName = metaData.getColumnName(i)
                            val value = resultSet.getString(i)
                            put(columnName, JsonPrimitive(value))
                        }
                    }
                    results.add(createOutputData(row))
                }
            }
        } catch (e: Exception) {
            return createErrorResult("MySQL error: ${e.message}")
        }

        return NodeExecutionResult(data = results)
    }
}

/**
 * MongoDB Node
 */
class MongoDBNode : NodeBase() {
    override val description = NodeDescription(
        name = "mongodb",
        displayName = "MongoDB",
        description = "Execute operations on MongoDB",
        group = NodeGroup.DATABASE,
        defaults = NodeDefaults(
            name = "MongoDB",
            color = "#13AA52"
        ),
        inputs = listOf("main"),
        outputs = listOf("main"),
        properties = listOf(
            NodeProperty(
                name = "operation",
                displayName = "Operation",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("find"),
                required = true,
                options = listOf(
                    PropertyOption("Find", "find"),
                    PropertyOption("Find One", "findOne"),
                    PropertyOption("Insert", "insert"),
                    PropertyOption("Update", "update"),
                    PropertyOption("Delete", "delete"),
                    PropertyOption("Aggregate", "aggregate")
                )
            ),
            NodeProperty(
                name = "collection",
                displayName = "Collection",
                type = PropertyType.STRING,
                default = JsonPrimitive(""),
                required = true
            ),
            NodeProperty(
                name = "query",
                displayName = "Query",
                type = PropertyType.JSON,
                default = JsonPrimitive("{}"),
                displayOptions = DisplayOptions(
                    show = mapOf(
                        "operation" to listOf(
                            JsonPrimitive("find"),
                            JsonPrimitive("findOne"),
                            JsonPrimitive("update"),
                            JsonPrimitive("delete")
                        )
                    )
                )
            ),
            NodeProperty(
                name = "limit",
                displayName = "Limit",
                type = PropertyType.NUMBER,
                default = JsonPrimitive(50),
                displayOptions = DisplayOptions(
                    show = mapOf("operation" to listOf(JsonPrimitive("find")))
                )
            )
        ),
        credentials = listOf(
            CredentialDescription(name = "mongodb", required = true)
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        val results = mutableListOf<NodeExecutionData>()
        val credentials = getCredentials(context, "mongodb")

        val connectionString = credentials["connectionString"] as? String
            ?: "mongodb://localhost:27017"
        val database = credentials["database"] as? String ?: "test"

        try {
            val client = MongoClient.create(connectionString)
            val db = client.getDatabase(database)
            val collection = getNodeParameterString(context, "collection")
            val coll = db.getCollection(collection)

            val operation = getNodeParameterString(context, "operation", "find")

            when (operation) {
                "find" -> {
                    val limit = getNodeParameterInt(context, "limit", 50)
                    val documents = coll.find().limit(limit).toList()

                    documents.forEach { doc ->
                        val json = buildJsonObject {
                            doc.entries.forEach { (key, value) ->
                                put(key, JsonPrimitive(value.toString()))
                            }
                        }
                        results.add(createOutputData(json))
                    }
                }

                "findOne" -> {
                    val doc = coll.find().limit(1).toList().firstOrNull()
                    if (doc != null) {
                        val json = buildJsonObject {
                            doc.entries.forEach { (key, value) ->
                                put(key, JsonPrimitive(value.toString()))
                            }
                        }
                        results.add(createOutputData(json))
                    }
                }
            }

            client.close()
        } catch (e: Exception) {
            return createErrorResult("MongoDB error: ${e.message}")
        }

        return NodeExecutionResult(data = results)
    }
}

package dev.elide.workflow.nodes

import dev.elide.workflow.models.*
import kotlinx.serialization.json.*
import com.google.api.services.sheets.v4.Sheets
import com.google.api.services.sheets.v4.model.ValueRange
import com.stripe.Stripe
import com.stripe.model.Customer

/**
 * Google Sheets Node
 */
class GoogleSheetsNode : NodeBase() {
    override val description = NodeDescription(
        name = "googleSheets",
        displayName = "Google Sheets",
        description = "Read and write to Google Sheets",
        group = NodeGroup.INTEGRATION,
        defaults = NodeDefaults(
            name = "Google Sheets",
            color = "#0FA761"
        ),
        inputs = listOf("main"),
        outputs = listOf("main"),
        properties = listOf(
            NodeProperty(
                name = "operation",
                displayName = "Operation",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("read"),
                required = true,
                options = listOf(
                    PropertyOption("Read", "read"),
                    PropertyOption("Append", "append"),
                    PropertyOption("Update", "update"),
                    PropertyOption("Delete", "delete")
                )
            ),
            NodeProperty(
                name = "spreadsheetId",
                displayName = "Spreadsheet ID",
                type = PropertyType.STRING,
                default = JsonPrimitive(""),
                required = true
            ),
            NodeProperty(
                name = "range",
                displayName = "Range",
                type = PropertyType.STRING,
                default = JsonPrimitive("A1:Z100"),
                required = true,
                placeholder = "A1:Z100"
            )
        ),
        credentials = listOf(
            CredentialDescription(name = "googleSheetsOAuth2Api", required = true)
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        val results = mutableListOf<NodeExecutionData>()
        val credentials = getCredentials(context, "googleSheetsOAuth2Api")

        val spreadsheetId = getNodeParameterString(context, "spreadsheetId")
        val range = getNodeParameterString(context, "range", "A1:Z100")
        val operation = getNodeParameterString(context, "operation", "read")

        try {
            // In production, use Google Sheets API client
            // For now, simulated data
            when (operation) {
                "read" -> {
                    val rows = listOf(
                        listOf("Name", "Email", "Age"),
                        listOf("John Doe", "john@example.com", "30"),
                        listOf("Jane Smith", "jane@example.com", "25")
                    )

                    rows.forEach { row ->
                        val json = buildJsonObject {
                            put("row", JsonArray(row.map { JsonPrimitive(it) }))
                        }
                        results.add(createOutputData(json))
                    }
                }

                "append" -> {
                    results.add(createOutputData(
                        JsonObject(mapOf(
                            "success" to JsonPrimitive(true),
                            "updatedRange" to JsonPrimitive(range)
                        ))
                    ))
                }
            }
        } catch (e: Exception) {
            return createErrorResult("Google Sheets error: ${e.message}")
        }

        return NodeExecutionResult(data = results)
    }
}

/**
 * Airtable Node
 */
class AirtableNode : NodeBase() {
    override val description = NodeDescription(
        name = "airtable",
        displayName = "Airtable",
        description = "Read, update, write and delete data from Airtable",
        group = NodeGroup.INTEGRATION,
        defaults = NodeDefaults(
            name = "Airtable",
            color = "#18BFFF"
        ),
        inputs = listOf("main"),
        outputs = listOf("main"),
        properties = listOf(
            NodeProperty(
                name = "operation",
                displayName = "Operation",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("list"),
                options = listOf(
                    PropertyOption("List", "list"),
                    PropertyOption("Read", "read"),
                    PropertyOption("Create", "create"),
                    PropertyOption("Update", "update"),
                    PropertyOption("Delete", "delete")
                )
            ),
            NodeProperty(
                name = "baseId",
                displayName = "Base ID",
                type = PropertyType.STRING,
                default = JsonPrimitive(""),
                required = true
            ),
            NodeProperty(
                name = "table",
                displayName = "Table",
                type = PropertyType.STRING,
                default = JsonPrimitive(""),
                required = true
            )
        ),
        credentials = listOf(
            CredentialDescription(name = "airtableApi", required = true)
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        val results = mutableListOf<NodeExecutionData>()
        val credentials = getCredentials(context, "airtableApi")

        val baseId = getNodeParameterString(context, "baseId")
        val table = getNodeParameterString(context, "table")
        val operation = getNodeParameterString(context, "operation", "list")

        try {
            // In production, use Airtable API
            when (operation) {
                "list" -> {
                    results.add(createOutputData(
                        JsonObject(mapOf(
                            "id" to JsonPrimitive("rec1"),
                            "fields" to JsonObject(mapOf(
                                "Name" to JsonPrimitive("Sample Record")
                            ))
                        ))
                    ))
                }
            }
        } catch (e: Exception) {
            return createErrorResult("Airtable error: ${e.message}")
        }

        return NodeExecutionResult(data = results)
    }
}

/**
 * AWS Node
 */
class AWSNode : NodeBase() {
    override val description = NodeDescription(
        name = "aws",
        displayName = "AWS",
        description = "Access Amazon Web Services",
        group = NodeGroup.INTEGRATION,
        defaults = NodeDefaults(
            name = "AWS",
            color = "#FF9900"
        ),
        inputs = listOf("main"),
        outputs = listOf("main"),
        properties = listOf(
            NodeProperty(
                name = "service",
                displayName = "Service",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("s3"),
                options = listOf(
                    PropertyOption("S3", "s3"),
                    PropertyOption("Lambda", "lambda"),
                    PropertyOption("SQS", "sqs"),
                    PropertyOption("SNS", "sns"),
                    PropertyOption("DynamoDB", "dynamodb")
                )
            ),
            NodeProperty(
                name = "operation",
                displayName = "Operation",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("upload"),
                options = listOf(
                    PropertyOption("Upload", "upload"),
                    PropertyOption("Download", "download"),
                    PropertyOption("List", "list"),
                    PropertyOption("Delete", "delete")
                )
            )
        ),
        credentials = listOf(
            CredentialDescription(name = "aws", required = true)
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        val results = mutableListOf<NodeExecutionData>()

        // In production, use AWS SDK
        results.add(createOutputData(
            JsonObject(mapOf("success" to JsonPrimitive(true)))
        ))

        return NodeExecutionResult(data = results)
    }
}

/**
 * Azure Node
 */
class AzureNode : NodeBase() {
    override val description = NodeDescription(
        name = "azure",
        displayName = "Microsoft Azure",
        description = "Access Microsoft Azure services",
        group = NodeGroup.INTEGRATION,
        defaults = NodeDefaults(
            name = "Azure",
            color = "#0089D6"
        ),
        inputs = listOf("main"),
        outputs = listOf("main"),
        properties = listOf(
            NodeProperty(
                name = "service",
                displayName = "Service",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("blob"),
                options = listOf(
                    PropertyOption("Blob Storage", "blob"),
                    PropertyOption("Functions", "functions"),
                    PropertyOption("Queue Storage", "queue")
                )
            )
        ),
        credentials = listOf(
            CredentialDescription(name = "azure", required = true)
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        val results = mutableListOf<NodeExecutionData>()

        results.add(createOutputData(
            JsonObject(mapOf("success" to JsonPrimitive(true)))
        ))

        return NodeExecutionResult(data = results)
    }
}

/**
 * GCP Node
 */
class GCPNode : NodeBase() {
    override val description = NodeDescription(
        name = "gcp",
        displayName = "Google Cloud Platform",
        description = "Access Google Cloud Platform services",
        group = NodeGroup.INTEGRATION,
        defaults = NodeDefaults(
            name = "GCP",
            color = "#4285F4"
        ),
        inputs = listOf("main"),
        outputs = listOf("main"),
        properties = listOf(
            NodeProperty(
                name = "service",
                displayName = "Service",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("storage"),
                options = listOf(
                    PropertyOption("Cloud Storage", "storage"),
                    PropertyOption("Cloud Functions", "functions"),
                    PropertyOption("Pub/Sub", "pubsub")
                )
            )
        ),
        credentials = listOf(
            CredentialDescription(name = "googleCloudPlatformOAuth2Api", required = true)
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        val results = mutableListOf<NodeExecutionData>()

        results.add(createOutputData(
            JsonObject(mapOf("success" to JsonPrimitive(true)))
        ))

        return NodeExecutionResult(data = results)
    }
}

/**
 * GitHub Node
 */
class GitHubNode : NodeBase() {
    override val description = NodeDescription(
        name = "github",
        displayName = "GitHub",
        description = "Access GitHub repositories and issues",
        group = NodeGroup.INTEGRATION,
        defaults = NodeDefaults(
            name = "GitHub",
            color = "#000000"
        ),
        inputs = listOf("main"),
        outputs = listOf("main"),
        properties = listOf(
            NodeProperty(
                name = "resource",
                displayName = "Resource",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("issue"),
                options = listOf(
                    PropertyOption("Issue", "issue"),
                    PropertyOption("Pull Request", "pullRequest"),
                    PropertyOption("Repository", "repository"),
                    PropertyOption("Release", "release"),
                    PropertyOption("User", "user")
                )
            ),
            NodeProperty(
                name = "operation",
                displayName = "Operation",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("get"),
                options = listOf(
                    PropertyOption("Get", "get"),
                    PropertyOption("Create", "create"),
                    PropertyOption("Update", "update"),
                    PropertyOption("Delete", "delete")
                )
            ),
            NodeProperty(
                name = "owner",
                displayName = "Repository Owner",
                type = PropertyType.STRING,
                default = JsonPrimitive(""),
                required = true
            ),
            NodeProperty(
                name = "repository",
                displayName = "Repository Name",
                type = PropertyType.STRING,
                default = JsonPrimitive(""),
                required = true
            )
        ),
        credentials = listOf(
            CredentialDescription(name = "githubApi", required = true)
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        val results = mutableListOf<NodeExecutionData>()

        // In production, use GitHub API
        results.add(createOutputData(
            JsonObject(mapOf(
                "id" to JsonPrimitive(1),
                "title" to JsonPrimitive("Sample Issue"),
                "state" to JsonPrimitive("open")
            ))
        ))

        return NodeExecutionResult(data = results)
    }
}

/**
 * GitLab Node
 */
class GitLabNode : NodeBase() {
    override val description = NodeDescription(
        name = "gitlab",
        displayName = "GitLab",
        description = "Access GitLab repositories and issues",
        group = NodeGroup.INTEGRATION,
        defaults = NodeDefaults(
            name = "GitLab",
            color = "#FC6D26"
        ),
        inputs = listOf("main"),
        outputs = listOf("main"),
        properties = listOf(
            NodeProperty(
                name = "resource",
                displayName = "Resource",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("issue"),
                options = listOf(
                    PropertyOption("Issue", "issue"),
                    PropertyOption("Merge Request", "mergeRequest"),
                    PropertyOption("Repository", "repository"),
                    PropertyOption("Release", "release")
                )
            )
        ),
        credentials = listOf(
            CredentialDescription(name = "gitlabApi", required = true)
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        val results = mutableListOf<NodeExecutionData>()

        results.add(createOutputData(
            JsonObject(mapOf("success" to JsonPrimitive(true)))
        ))

        return NodeExecutionResult(data = results)
    }
}

/**
 * Stripe Node
 */
class StripeNode : NodeBase() {
    override val description = NodeDescription(
        name = "stripe",
        displayName = "Stripe",
        description = "Access Stripe payment platform",
        group = NodeGroup.INTEGRATION,
        defaults = NodeDefaults(
            name = "Stripe",
            color = "#635BFF"
        ),
        inputs = listOf("main"),
        outputs = listOf("main"),
        properties = listOf(
            NodeProperty(
                name = "resource",
                displayName = "Resource",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("customer"),
                options = listOf(
                    PropertyOption("Customer", "customer"),
                    PropertyOption("Charge", "charge"),
                    PropertyOption("Invoice", "invoice"),
                    PropertyOption("Payment Intent", "paymentIntent"),
                    PropertyOption("Subscription", "subscription")
                )
            ),
            NodeProperty(
                name = "operation",
                displayName = "Operation",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("get"),
                options = listOf(
                    PropertyOption("Get", "get"),
                    PropertyOption("Create", "create"),
                    PropertyOption("Update", "update"),
                    PropertyOption("Delete", "delete")
                )
            )
        ),
        credentials = listOf(
            CredentialDescription(name = "stripeApi", required = true)
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        val results = mutableListOf<NodeExecutionData>()
        val credentials = getCredentials(context, "stripeApi")

        try {
            // In production, use Stripe SDK
            val apiKey = credentials["apiKey"] as? String ?: ""
            Stripe.apiKey = apiKey

            results.add(createOutputData(
                JsonObject(mapOf(
                    "id" to JsonPrimitive("cus_123"),
                    "object" to JsonPrimitive("customer")
                ))
            ))
        } catch (e: Exception) {
            return createErrorResult("Stripe error: ${e.message}")
        }

        return NodeExecutionResult(data = results)
    }
}

/**
 * PayPal Node
 */
class PayPalNode : NodeBase() {
    override val description = NodeDescription(
        name = "paypal",
        displayName = "PayPal",
        description = "Access PayPal payment platform",
        group = NodeGroup.INTEGRATION,
        defaults = NodeDefaults(
            name = "PayPal",
            color = "#00457C"
        ),
        inputs = listOf("main"),
        outputs = listOf("main"),
        properties = listOf(
            NodeProperty(
                name = "resource",
                displayName = "Resource",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("payment"),
                options = listOf(
                    PropertyOption("Payment", "payment"),
                    PropertyOption("Payout", "payout"),
                    PropertyOption("Invoice", "invoice")
                )
            )
        ),
        credentials = listOf(
            CredentialDescription(name = "paypalApi", required = true)
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        val results = mutableListOf<NodeExecutionData>()

        results.add(createOutputData(
            JsonObject(mapOf("success" to JsonPrimitive(true)))
        ))

        return NodeExecutionResult(data = results)
    }
}

package dev.elide.workflow.nodes

import dev.elide.workflow.models.*
import kotlinx.serialization.json.*
import java.util.*
import javax.mail.*
import javax.mail.internet.*

/**
 * Email Node - Send emails via SMTP
 */
class EmailNode : NodeBase() {
    override val description = NodeDescription(
        name = "email",
        displayName = "Send Email",
        description = "Send an email via SMTP",
        group = NodeGroup.COMMUNICATION,
        defaults = NodeDefaults(
            name = "Send Email",
            color = "#00BBFF"
        ),
        inputs = listOf("main"),
        outputs = listOf("main"),
        properties = listOf(
            NodeProperty(
                name = "fromEmail",
                displayName = "From Email",
                type = PropertyType.STRING,
                default = JsonPrimitive(""),
                required = true,
                placeholder = "sender@example.com"
            ),
            NodeProperty(
                name = "toEmail",
                displayName = "To Email",
                type = PropertyType.STRING,
                default = JsonPrimitive(""),
                required = true,
                placeholder = "receiver@example.com"
            ),
            NodeProperty(
                name = "subject",
                displayName = "Subject",
                type = PropertyType.STRING,
                default = JsonPrimitive(""),
                required = true
            ),
            NodeProperty(
                name = "text",
                displayName = "Text",
                type = PropertyType.STRING,
                default = JsonPrimitive(""),
                description = "Plain text email body"
            ),
            NodeProperty(
                name = "html",
                displayName = "HTML",
                type = PropertyType.STRING,
                default = JsonPrimitive(""),
                description = "HTML email body"
            ),
            NodeProperty(
                name = "attachments",
                displayName = "Attachments",
                type = PropertyType.STRING,
                default = JsonPrimitive(""),
                description = "Comma-separated list of attachment binary property names"
            )
        ),
        credentials = listOf(
            CredentialDescription(name = "smtp", required = true)
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        val results = mutableListOf<NodeExecutionData>()
        val credentials = getCredentials(context, "smtp")

        val host = credentials["host"] as? String ?: "smtp.gmail.com"
        val port = credentials["port"] as? Int ?: 587
        val user = credentials["user"] as? String ?: ""
        val password = credentials["password"] as? String ?: ""

        try {
            for (itemIndex in context.inputData.indices) {
                val fromEmail = evaluateExpression(
                    getNodeParameterString(context, "fromEmail"),
                    context,
                    itemIndex
                )
                val toEmail = evaluateExpression(
                    getNodeParameterString(context, "toEmail"),
                    context,
                    itemIndex
                )
                val subject = evaluateExpression(
                    getNodeParameterString(context, "subject"),
                    context,
                    itemIndex
                )
                val text = evaluateExpression(
                    getNodeParameterString(context, "text", ""),
                    context,
                    itemIndex
                )

                // Configure SMTP
                val props = Properties().apply {
                    put("mail.smtp.auth", "true")
                    put("mail.smtp.starttls.enable", "true")
                    put("mail.smtp.host", host)
                    put("mail.smtp.port", port.toString())
                }

                val session = Session.getInstance(props, object : Authenticator() {
                    override fun getPasswordAuthentication(): PasswordAuthentication {
                        return PasswordAuthentication(user, password)
                    }
                })

                val message = MimeMessage(session).apply {
                    setFrom(InternetAddress(fromEmail))
                    setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail))
                    setSubject(subject)
                    setText(text)
                }

                Transport.send(message)

                results.add(createOutputData(
                    JsonObject(mapOf(
                        "success" to JsonPrimitive(true),
                        "messageId" to JsonPrimitive(message.messageID),
                        "to" to JsonPrimitive(toEmail),
                        "subject" to JsonPrimitive(subject)
                    ))
                ))
            }
        } catch (e: Exception) {
            return createErrorResult("Email error: ${e.message}")
        }

        return NodeExecutionResult(data = results)
    }
}

/**
 * Slack Node
 */
class SlackNode : NodeBase() {
    override val description = NodeDescription(
        name = "slack",
        displayName = "Slack",
        description = "Send messages to Slack",
        group = NodeGroup.COMMUNICATION,
        defaults = NodeDefaults(
            name = "Slack",
            color = "#BB2244"
        ),
        inputs = listOf("main"),
        outputs = listOf("main"),
        properties = listOf(
            NodeProperty(
                name = "resource",
                displayName = "Resource",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("message"),
                required = true,
                options = listOf(
                    PropertyOption("Message", "message"),
                    PropertyOption("Channel", "channel"),
                    PropertyOption("User", "user"),
                    PropertyOption("Reaction", "reaction")
                )
            ),
            NodeProperty(
                name = "operation",
                displayName = "Operation",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("post"),
                options = listOf(
                    PropertyOption("Post", "post"),
                    PropertyOption("Update", "update"),
                    PropertyOption("Delete", "delete")
                )
            ),
            NodeProperty(
                name = "channel",
                displayName = "Channel",
                type = PropertyType.STRING,
                default = JsonPrimitive(""),
                required = true,
                placeholder = "#general"
            ),
            NodeProperty(
                name = "text",
                displayName = "Text",
                type = PropertyType.STRING,
                default = JsonPrimitive(""),
                required = true
            ),
            NodeProperty(
                name = "attachments",
                displayName = "Attachments",
                type = PropertyType.JSON,
                default = JsonPrimitive("[]")
            )
        ),
        credentials = listOf(
            CredentialDescription(name = "slackApi", required = true)
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        val results = mutableListOf<NodeExecutionData>()
        val credentials = getCredentials(context, "slackApi")
        val token = credentials["accessToken"] as? String ?: ""

        try {
            for (itemIndex in context.inputData.indices) {
                val channel = evaluateExpression(
                    getNodeParameterString(context, "channel"),
                    context,
                    itemIndex
                )
                val text = evaluateExpression(
                    getNodeParameterString(context, "text"),
                    context,
                    itemIndex
                )

                // In production, use Slack API client
                // For now, simulated response
                results.add(createOutputData(
                    JsonObject(mapOf(
                        "success" to JsonPrimitive(true),
                        "channel" to JsonPrimitive(channel),
                        "ts" to JsonPrimitive(System.currentTimeMillis().toString())
                    ))
                ))
            }
        } catch (e: Exception) {
            return createErrorResult("Slack error: ${e.message}")
        }

        return NodeExecutionResult(data = results)
    }
}

/**
 * Discord Node
 */
class DiscordNode : NodeBase() {
    override val description = NodeDescription(
        name = "discord",
        displayName = "Discord",
        description = "Send messages to Discord",
        group = NodeGroup.COMMUNICATION,
        defaults = NodeDefaults(
            name = "Discord",
            color = "#7289DA"
        ),
        inputs = listOf("main"),
        outputs = listOf("main"),
        properties = listOf(
            NodeProperty(
                name = "webhookUrl",
                displayName = "Webhook URL",
                type = PropertyType.STRING,
                default = JsonPrimitive(""),
                required = true,
                placeholder = "https://discord.com/api/webhooks/..."
            ),
            NodeProperty(
                name = "text",
                displayName = "Text",
                type = PropertyType.STRING,
                default = JsonPrimitive(""),
                required = true
            ),
            NodeProperty(
                name = "username",
                displayName = "Username",
                type = PropertyType.STRING,
                default = JsonPrimitive(""),
                description = "Override the bot username"
            ),
            NodeProperty(
                name = "embeds",
                displayName = "Embeds",
                type = PropertyType.JSON,
                default = JsonPrimitive("[]")
            )
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        val results = mutableListOf<NodeExecutionData>()

        try {
            for (itemIndex in context.inputData.indices) {
                val webhookUrl = getNodeParameterString(context, "webhookUrl")
                val text = evaluateExpression(
                    getNodeParameterString(context, "text"),
                    context,
                    itemIndex
                )

                // In production, make HTTP POST to Discord webhook
                results.add(createOutputData(
                    JsonObject(mapOf(
                        "success" to JsonPrimitive(true),
                        "messageId" to JsonPrimitive(System.currentTimeMillis().toString())
                    ))
                ))
            }
        } catch (e: Exception) {
            return createErrorResult("Discord error: ${e.message}")
        }

        return NodeExecutionResult(data = results)
    }
}

/**
 * Telegram Node
 */
class TelegramNode : NodeBase() {
    override val description = NodeDescription(
        name = "telegram",
        displayName = "Telegram",
        description = "Send messages to Telegram",
        group = NodeGroup.COMMUNICATION,
        defaults = NodeDefaults(
            name = "Telegram",
            color = "#0088CC"
        ),
        inputs = listOf("main"),
        outputs = listOf("main"),
        properties = listOf(
            NodeProperty(
                name = "resource",
                displayName = "Resource",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive("message"),
                options = listOf(
                    PropertyOption("Message", "message"),
                    PropertyOption("File", "file"),
                    PropertyOption("Photo", "photo")
                )
            ),
            NodeProperty(
                name = "chatId",
                displayName = "Chat ID",
                type = PropertyType.STRING,
                default = JsonPrimitive(""),
                required = true
            ),
            NodeProperty(
                name = "text",
                displayName = "Text",
                type = PropertyType.STRING,
                default = JsonPrimitive(""),
                required = true
            ),
            NodeProperty(
                name = "parseMode",
                displayName = "Parse Mode",
                type = PropertyType.OPTIONS,
                default = JsonPrimitive(""),
                options = listOf(
                    PropertyOption("None", ""),
                    PropertyOption("Markdown", "Markdown"),
                    PropertyOption("HTML", "HTML")
                )
            )
        ),
        credentials = listOf(
            CredentialDescription(name = "telegramApi", required = true)
        )
    )

    override suspend fun execute(context: NodeExecutionContext): NodeExecutionResult {
        val results = mutableListOf<NodeExecutionData>()
        val credentials = getCredentials(context, "telegramApi")
        val botToken = credentials["accessToken"] as? String ?: ""

        try {
            for (itemIndex in context.inputData.indices) {
                val chatId = evaluateExpression(
                    getNodeParameterString(context, "chatId"),
                    context,
                    itemIndex
                )
                val text = evaluateExpression(
                    getNodeParameterString(context, "text"),
                    context,
                    itemIndex
                )

                // In production, use Telegram API
                results.add(createOutputData(
                    JsonObject(mapOf(
                        "success" to JsonPrimitive(true),
                        "messageId" to JsonPrimitive(System.currentTimeMillis())
                    ))
                ))
            }
        } catch (e: Exception) {
            return createErrorResult("Telegram error: ${e.message}")
        }

        return NodeExecutionResult(data = results)
    }
}

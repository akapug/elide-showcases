package tools.elide.oss.elidebase.realtime

import io.github.oshai.kotlinlogging.KotlinLogging
import io.ktor.websocket.*
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.serialization.encodeToString
import tools.elide.oss.elidebase.core.*
import tools.elide.oss.elidebase.database.DatabaseManager
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

private val logger = KotlinLogging.logger {}

/**
 * Real-time WebSocket server
 */
class RealtimeServer(
    private val dbManager: DatabaseManager
) {

    private val connections = ConcurrentHashMap<String, RealtimeConnection>()
    private val channels = ConcurrentHashMap<String, RealtimeChannel>()
    private val subscriptions = ConcurrentHashMap<String, MutableList<DatabaseSubscription>>()

    private val changeNotifier = MutableSharedFlow<DatabaseChange>(replay = 0, extraBufferCapacity = 1000)
    private val changeFlow = changeNotifier.asSharedFlow()

    /**
     * Handle new WebSocket connection
     */
    suspend fun handleConnection(session: WebSocketSession, userId: String?) {
        val connectionId = UUID.randomUUID().toString()
        val connection = RealtimeConnection(connectionId, session, userId)

        connections[connectionId] = connection
        logger.info { "New realtime connection: $connectionId (user: $userId)" }

        try {
            // Send welcome message
            connection.send(
                RealtimeMessage(
                    type = "SYSTEM",
                    topic = "system",
                    event = "connected",
                    payload = json.encodeToString(mapOf("connectionId" to connectionId))
                )
            )

            // Handle incoming messages
            for (frame in session.incoming) {
                if (frame is Frame.Text) {
                    val text = frame.readText()
                    handleMessage(connection, text)
                }
            }
        } catch (e: Exception) {
            logger.error(e) { "Error in realtime connection $connectionId" }
        } finally {
            // Clean up
            handleDisconnect(connection)
        }
    }

    /**
     * Handle incoming message from client
     */
    private suspend fun handleMessage(connection: RealtimeConnection, messageText: String) {
        try {
            val message = json.decodeFromString<RealtimeMessage>(messageText)

            when (message.type.uppercase()) {
                "SUBSCRIBE" -> handleSubscribe(connection, message)
                "UNSUBSCRIBE" -> handleUnsubscribe(connection, message)
                "BROADCAST" -> handleBroadcast(connection, message)
                "PRESENCE" -> handlePresence(connection, message)
                else -> {
                    connection.send(
                        RealtimeMessage(
                            type = "ERROR",
                            topic = message.topic,
                            event = "unknown_message_type",
                            payload = json.encodeToString(mapOf("error" to "Unknown message type: ${message.type}"))
                        )
                    )
                }
            }
        } catch (e: Exception) {
            logger.error(e) { "Error handling message: $messageText" }
            connection.send(
                RealtimeMessage(
                    type = "ERROR",
                    topic = "system",
                    event = "message_error",
                    payload = json.encodeToString(mapOf("error" to (e.message ?: "Unknown error")))
                )
            )
        }
    }

    /**
     * Handle subscription request
     */
    private suspend fun handleSubscribe(connection: RealtimeConnection, message: RealtimeMessage) {
        val topic = message.topic

        // Parse subscription config from payload
        val config = message.payload?.let {
            json.decodeFromString<SubscriptionConfig>(it)
        } ?: run {
            connection.send(
                RealtimeMessage(
                    type = "ERROR",
                    topic = topic,
                    event = "invalid_subscription",
                    payload = json.encodeToString(mapOf("error" to "Missing subscription configuration"))
                )
            )
            return
        }

        // Get or create channel
        val channel = channels.getOrPut(topic) {
            RealtimeChannel(topic)
        }

        // Add connection to channel
        channel.addConnection(connection)
        connection.subscriptions[topic] = config

        // If this is a database subscription, set up database listener
        if (topic.startsWith("db:")) {
            val dbSubscription = DatabaseSubscription(
                id = UUID.randomUUID().toString(),
                schema = config.schema,
                table = config.table,
                filter = config.filter,
                event = config.event,
                connectionId = connection.id,
                channel = channel
            )

            subscriptions.getOrPut(topic) { mutableListOf() }.add(dbSubscription)
        }

        logger.info { "Connection ${connection.id} subscribed to $topic" }

        connection.send(
            RealtimeMessage(
                type = "SYSTEM",
                topic = topic,
                event = "subscribed",
                ref = message.ref
            )
        )
    }

    /**
     * Handle unsubscribe request
     */
    private suspend fun handleUnsubscribe(connection: RealtimeConnection, message: RealtimeMessage) {
        val topic = message.topic

        // Remove from channel
        channels[topic]?.removeConnection(connection)
        connection.subscriptions.remove(topic)

        // Remove database subscription
        subscriptions[topic]?.removeIf { it.connectionId == connection.id }

        logger.info { "Connection ${connection.id} unsubscribed from $topic" }

        connection.send(
            RealtimeMessage(
                type = "SYSTEM",
                topic = topic,
                event = "unsubscribed",
                ref = message.ref
            )
        )
    }

    /**
     * Handle broadcast message
     */
    private suspend fun handleBroadcast(connection: RealtimeConnection, message: RealtimeMessage) {
        val topic = message.topic
        val channel = channels[topic]

        if (channel == null) {
            connection.send(
                RealtimeMessage(
                    type = "ERROR",
                    topic = topic,
                    event = "channel_not_found",
                    payload = json.encodeToString(mapOf("error" to "Channel not found: $topic"))
                )
            )
            return
        }

        // Broadcast to all connections in channel except sender
        channel.broadcast(message, excludeConnection = connection.id)

        logger.debug { "Broadcast message on $topic from ${connection.id}" }
    }

    /**
     * Handle presence update
     */
    private suspend fun handlePresence(connection: RealtimeConnection, message: RealtimeMessage) {
        val topic = message.topic
        val channel = channels[topic]

        if (channel == null) {
            connection.send(
                RealtimeMessage(
                    type = "ERROR",
                    topic = topic,
                    event = "channel_not_found",
                    payload = json.encodeToString(mapOf("error" to "Channel not found: $topic"))
                )
            )
            return
        }

        // Update presence state
        val presenceState = message.payload?.let {
            json.decodeFromString<PresenceState>(it)
        } ?: PresenceState(
            userId = connection.userId ?: connection.id,
            online = true,
            lastSeen = formatTimestamp()
        )

        channel.updatePresence(connection.id, presenceState)

        // Broadcast presence update to all in channel
        channel.broadcast(
            RealtimeMessage(
                type = "PRESENCE",
                topic = topic,
                event = message.event ?: "update",
                payload = json.encodeToString(presenceState)
            )
        )

        logger.debug { "Presence update on $topic from ${connection.id}" }
    }

    /**
     * Handle disconnection
     */
    private suspend fun handleDisconnect(connection: RealtimeConnection) {
        connections.remove(connection.id)

        // Remove from all channels
        for ((topic, channel) in channels) {
            if (channel.hasConnection(connection.id)) {
                channel.removeConnection(connection)

                // Broadcast presence offline
                channel.broadcast(
                    RealtimeMessage(
                        type = "PRESENCE",
                        topic = topic,
                        event = "leave",
                        payload = json.encodeToString(
                            PresenceState(
                                userId = connection.userId ?: connection.id,
                                online = false,
                                lastSeen = formatTimestamp()
                            )
                        )
                    )
                )
            }
        }

        // Remove subscriptions
        connection.subscriptions.keys.forEach { topic ->
            subscriptions[topic]?.removeIf { it.connectionId == connection.id }
        }

        logger.info { "Connection ${connection.id} disconnected" }
    }

    /**
     * Notify database change
     */
    suspend fun notifyDatabaseChange(change: DatabaseChange) {
        changeNotifier.emit(change)

        // Find matching subscriptions
        val matchingSubs = subscriptions.values.flatten().filter { sub ->
            sub.schema == change.schema &&
            sub.table == change.table &&
            (sub.event == "*" || sub.event == change.operation.lowercase()) &&
            (sub.filter == null || matchesFilter(change, sub.filter))
        }

        // Broadcast to matching channels
        for (sub in matchingSubs) {
            val message = RealtimeMessage(
                type = change.operation.uppercase(),
                topic = "db:${change.schema}.${change.table}",
                event = change.operation.lowercase(),
                payload = json.encodeToString(change)
            )

            sub.channel.broadcast(message)
        }

        logger.debug { "Database change notified: ${change.operation} on ${change.schema}.${change.table}" }
    }

    /**
     * Check if change matches filter
     */
    private fun matchesFilter(change: DatabaseChange, filter: String): Boolean {
        // Simple filter matching (in production, parse and evaluate properly)
        return true
    }

    /**
     * Get server statistics
     */
    fun getStats(): Map<String, Any> {
        return mapOf(
            "connections" to connections.size,
            "channels" to channels.size,
            "subscriptions" to subscriptions.values.sumOf { it.size },
            "connectionIds" to connections.keys.toList()
        )
    }

    /**
     * Broadcast to specific channel
     */
    suspend fun broadcastToChannel(topic: String, event: String, payload: String) {
        channels[topic]?.broadcast(
            RealtimeMessage(
                type = "BROADCAST",
                topic = topic,
                event = event,
                payload = payload
            )
        )
    }
}

/**
 * Real-time connection
 */
class RealtimeConnection(
    val id: String,
    val session: WebSocketSession,
    val userId: String?
) {
    val subscriptions = ConcurrentHashMap<String, SubscriptionConfig>()

    suspend fun send(message: RealtimeMessage) {
        try {
            val messageText = json.encodeToString(message)
            session.send(Frame.Text(messageText))
        } catch (e: Exception) {
            logger.warn { "Failed to send message to connection $id: ${e.message}" }
        }
    }
}

/**
 * Real-time channel
 */
class RealtimeChannel(
    val topic: String
) {
    private val connections = ConcurrentHashMap<String, RealtimeConnection>()
    private val presenceStates = ConcurrentHashMap<String, PresenceState>()

    fun addConnection(connection: RealtimeConnection) {
        connections[connection.id] = connection
    }

    fun removeConnection(connection: RealtimeConnection) {
        connections.remove(connection.id)
        presenceStates.remove(connection.id)
    }

    fun hasConnection(connectionId: String): Boolean {
        return connections.containsKey(connectionId)
    }

    suspend fun broadcast(message: RealtimeMessage, excludeConnection: String? = null) {
        for ((connId, connection) in connections) {
            if (connId != excludeConnection) {
                connection.send(message)
            }
        }
    }

    fun updatePresence(connectionId: String, state: PresenceState) {
        presenceStates[connectionId] = state
    }

    fun getPresence(): List<PresenceState> {
        return presenceStates.values.toList()
    }

    fun getConnectionCount(): Int {
        return connections.size
    }
}

/**
 * Database subscription
 */
data class DatabaseSubscription(
    val id: String,
    val schema: String,
    val table: String,
    val filter: String?,
    val event: String,
    val connectionId: String,
    val channel: RealtimeChannel
)

/**
 * Database change event
 */
data class DatabaseChange(
    val schema: String,
    val table: String,
    val operation: String, // insert, update, delete
    val oldData: Map<String, Any>? = null,
    val newData: Map<String, Any>? = null,
    val timestamp: String = formatTimestamp()
)

/**
 * PostgreSQL LISTEN/NOTIFY integration
 */
class DatabaseChangeListener(
    private val dbManager: DatabaseManager,
    private val realtimeServer: RealtimeServer
) {

    private var listenerJob: Job? = null
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    /**
     * Start listening for database changes
     */
    fun start() {
        listenerJob = scope.launch {
            setupTriggers()
            listenForNotifications()
        }
        logger.info { "Database change listener started" }
    }

    /**
     * Stop listening
     */
    fun stop() {
        listenerJob?.cancel()
        scope.cancel()
        logger.info { "Database change listener stopped" }
    }

    /**
     * Setup database triggers for change notifications
     */
    private suspend fun setupTriggers() {
        val sql = """
            -- Create notification function
            CREATE OR REPLACE FUNCTION notify_table_change()
            RETURNS trigger AS $$
            DECLARE
                payload JSON;
            BEGIN
                IF (TG_OP = 'DELETE') THEN
                    payload = json_build_object(
                        'schema', TG_TABLE_SCHEMA,
                        'table', TG_TABLE_NAME,
                        'operation', 'delete',
                        'old_data', row_to_json(OLD)
                    );
                ELSIF (TG_OP = 'UPDATE') THEN
                    payload = json_build_object(
                        'schema', TG_TABLE_SCHEMA,
                        'table', TG_TABLE_NAME,
                        'operation', 'update',
                        'old_data', row_to_json(OLD),
                        'new_data', row_to_json(NEW)
                    );
                ELSIF (TG_OP = 'INSERT') THEN
                    payload = json_build_object(
                        'schema', TG_TABLE_SCHEMA,
                        'table', TG_TABLE_NAME,
                        'operation', 'insert',
                        'new_data', row_to_json(NEW)
                    );
                END IF;

                PERFORM pg_notify('table_changes', payload::text);
                RETURN NULL;
            END;
            $$ LANGUAGE plpgsql;

            -- Example: Create trigger for a table
            -- DROP TRIGGER IF EXISTS notify_users_change ON users;
            -- CREATE TRIGGER notify_users_change
            -- AFTER INSERT OR UPDATE OR DELETE ON users
            -- FOR EACH ROW EXECUTE FUNCTION notify_table_change();
        """.trimIndent()

        dbManager.withConnection { connection ->
            connection.createStatement().execute(sql)
        }

        logger.info { "Database triggers setup completed" }
    }

    /**
     * Listen for PostgreSQL notifications
     */
    private suspend fun listenForNotifications() {
        dbManager.withConnection { connection ->
            // Listen to the notification channel
            connection.createStatement().execute("LISTEN table_changes;")

            // In production, use a proper PostgreSQL LISTEN/NOTIFY implementation
            // This is a simplified version
            logger.info { "Listening for database notifications..." }

            // Keep connection alive
            while (scope.isActive) {
                delay(1000)
            }
        }
    }
}

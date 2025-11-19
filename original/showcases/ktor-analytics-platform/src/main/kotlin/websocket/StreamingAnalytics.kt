package dev.elide.showcases.ktor.analytics.websocket

import dev.elide.showcases.ktor.analytics.AnalyticsServices
import dev.elide.showcases.ktor.analytics.models.*
import io.github.oshai.kotlinlogging.KotlinLogging
import io.ktor.server.application.*
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.*
import kotlinx.datetime.Clock
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicLong
import kotlin.time.Duration.Companion.milliseconds

private val logger = KotlinLogging.logger {}

/**
 * Configure WebSocket-based streaming analytics.
 *
 * Provides real-time analytics through WebSocket connections:
 * - Live metrics streaming
 * - Real-time time series analysis
 * - Streaming aggregations
 * - Rolling window statistics
 * - Live anomaly detection
 *
 * Features:
 * - Multiple concurrent connections
 * - Subscription-based streaming
 * - Configurable update intervals
 * - Automatic connection cleanup
 * - Error handling and recovery
 *
 * WebSocket endpoints:
 * - /stream/analytics - Stream analytics metrics
 * - /stream/timeseries - Stream time series data
 * - /stream/live - Stream live data updates
 *
 * Example client usage:
 * ```javascript
 * const ws = new WebSocket('ws://localhost:8080/stream/analytics');
 * ws.send(JSON.stringify({
 *   action: 'subscribe',
 *   dataset: 'sales',
 *   metrics: ['revenue', 'customers'],
 *   windowSize: 100
 * }));
 * ws.onmessage = (event) => {
 *   const data = JSON.parse(event.data);
 *   console.log('Metrics:', data.metrics);
 * };
 * ```
 */
fun Application.configureStreamingAnalytics(services: AnalyticsServices) {
    val streamingService = StreamingAnalyticsService(services)

    routing {
        // Analytics metrics streaming
        webSocket("/stream/analytics") {
            streamingService.handleAnalyticsStream(this)
        }

        // Time series streaming
        webSocket("/stream/timeseries") {
            streamingService.handleTimeSeriesStream(this)
        }

        // Live data streaming
        webSocket("/stream/live") {
            streamingService.handleLiveDataStream(this)
        }

        // Metrics dashboard streaming
        webSocket("/stream/dashboard") {
            streamingService.handleDashboardStream(this)
        }
    }

    logger.info { "Streaming analytics WebSocket endpoints configured" }
}

/**
 * Service for managing streaming analytics over WebSocket connections.
 *
 * Manages:
 * - Active WebSocket connections
 * - Subscription state per connection
 * - Data streaming pipelines
 * - Rolling window calculations
 * - Connection lifecycle
 *
 * @property services Analytics services container
 */
class StreamingAnalyticsService(
    private val services: AnalyticsServices
) {
    /**
     * Active connections registry.
     */
    private val activeConnections = ConcurrentHashMap<String, StreamingConnection>()

    /**
     * Connection counter for generating IDs.
     */
    private val connectionCounter = AtomicLong(0)

    /**
     * JSON serializer for WebSocket messages.
     */
    private val json = Json {
        prettyPrint = false
        ignoreUnknownKeys = true
        encodeDefaults = true
    }

    /**
     * Handle analytics metrics streaming.
     *
     * Streams real-time statistics for selected metrics with configurable
     * rolling windows and update intervals.
     *
     * @param session WebSocket session
     */
    suspend fun handleAnalyticsStream(session: DefaultWebSocketServerSession) {
        val connectionId = "analytics-${connectionCounter.incrementAndGet()}"
        logger.info { "New analytics stream connection: $connectionId" }

        val connection = StreamingConnection(
            id = connectionId,
            session = session,
            type = StreamType.ANALYTICS
        )

        activeConnections[connectionId] = connection

        try {
            // Send welcome message
            session.send(
                Frame.Text(
                    json.encodeToString(
                        mapOf(
                            "type" to "connected",
                            "connectionId" to connectionId,
                            "message" to "Connected to analytics stream"
                        )
                    )
                )
            )

            // Handle incoming messages
            for (frame in session.incoming) {
                if (frame is Frame.Text) {
                    val message = frame.readText()
                    handleAnalyticsMessage(connection, message)
                }
            }

        } catch (e: Exception) {
            logger.error(e) { "Error in analytics stream $connectionId" }
        } finally {
            activeConnections.remove(connectionId)
            connection.cleanup()
            logger.info { "Analytics stream connection closed: $connectionId" }
        }
    }

    /**
     * Handle analytics subscription messages.
     */
    private suspend fun handleAnalyticsMessage(
        connection: StreamingConnection,
        message: String
    ) {
        try {
            val subscription = json.decodeFromString<StreamSubscription>(message)

            when (subscription.action) {
                StreamAction.SUBSCRIBE -> {
                    logger.info { "Subscribing to analytics: ${subscription.dataset}" }
                    connection.subscription = subscription
                    startAnalyticsStream(connection)
                }
                StreamAction.UNSUBSCRIBE -> {
                    logger.info { "Unsubscribing from analytics stream" }
                    connection.stopStreaming()
                }
                StreamAction.PAUSE -> {
                    connection.paused = true
                }
                StreamAction.RESUME -> {
                    connection.paused = false
                }
            }

        } catch (e: Exception) {
            logger.error(e) { "Failed to handle analytics message" }
            connection.session.send(
                Frame.Text(
                    json.encodeToString(
                        mapOf(
                            "type" to "error",
                            "error" to "Invalid message format: ${e.message}"
                        )
                    )
                )
            )
        }
    }

    /**
     * Start streaming analytics data.
     */
    private fun startAnalyticsStream(connection: StreamingConnection) {
        val subscription = connection.subscription ?: return

        connection.streamingJob = CoroutineScope(Dispatchers.Default).launch {
            val windowData = RollingWindow<Map<String, Double>>(subscription.windowSize)

            try {
                // Simulate streaming data (in real scenario, this would read from a data source)
                while (isActive && !connection.paused) {
                    // Generate or fetch new data point
                    val dataPoint = generateAnalyticsDataPoint(subscription)

                    // Add to rolling window
                    windowData.add(dataPoint)

                    // Calculate statistics over window
                    val metrics = calculateWindowStatistics(
                        windowData.getAll(),
                        subscription.metrics
                    )

                    // Send update to client
                    val update = AnalyticsUpdate(
                        type = "analytics_update",
                        timestamp = Clock.System.now(),
                        metrics = metrics
                    )

                    connection.session.send(
                        Frame.Text(json.encodeToString(update))
                    )

                    delay(subscription.updateInterval.milliseconds)
                }

            } catch (e: CancellationException) {
                logger.debug { "Analytics stream cancelled for ${connection.id}" }
            } catch (e: Exception) {
                logger.error(e) { "Error in analytics stream ${connection.id}" }
            }
        }
    }

    /**
     * Generate analytics data point (simulated).
     *
     * In production, this would read from actual data sources.
     */
    private suspend fun generateAnalyticsDataPoint(
        subscription: StreamSubscription
    ): Map<String, Double> {
        return subscription.metrics.associateWith {
            // Simulate data with some randomness
            100.0 + (Math.random() * 50 - 25)
        }
    }

    /**
     * Calculate statistics over rolling window.
     */
    private fun calculateWindowStatistics(
        window: List<Map<String, Double>>,
        metrics: List<String>
    ): Map<String, MetricValue> {
        if (window.isEmpty()) return emptyMap()

        return metrics.associateWith { metric ->
            val values = window.mapNotNull { it[metric] }

            if (values.isEmpty()) {
                MetricValue(
                    current = 0.0,
                    mean = 0.0,
                    std = 0.0,
                    min = 0.0,
                    max = 0.0,
                    trend = TrendDirection.STABLE
                )
            } else {
                val current = values.last()
                val mean = values.average()
                val std = calculateStd(values)
                val min = values.minOrNull() ?: 0.0
                val max = values.maxOrNull() ?: 0.0

                // Determine trend
                val trend = if (values.size >= 3) {
                    val recent = values.takeLast(3).average()
                    val older = values.dropLast(3).takeIf { it.isNotEmpty() }?.average() ?: recent

                    when {
                        recent > older * 1.05 -> TrendDirection.UPWARD
                        recent < older * 0.95 -> TrendDirection.DOWNWARD
                        else -> TrendDirection.STABLE
                    }
                } else {
                    TrendDirection.STABLE
                }

                MetricValue(
                    current = current,
                    mean = mean,
                    std = std,
                    min = min,
                    max = max,
                    trend = trend
                )
            }
        }
    }

    /**
     * Handle time series streaming.
     */
    suspend fun handleTimeSeriesStream(session: DefaultWebSocketServerSession) {
        val connectionId = "timeseries-${connectionCounter.incrementAndGet()}"
        logger.info { "New time series stream connection: $connectionId" }

        val connection = StreamingConnection(
            id = connectionId,
            session = session,
            type = StreamType.TIMESERIES
        )

        activeConnections[connectionId] = connection

        try {
            session.send(
                Frame.Text(
                    json.encodeToString(
                        mapOf(
                            "type" to "connected",
                            "connectionId" to connectionId,
                            "message" to "Connected to time series stream"
                        )
                    )
                )
            )

            for (frame in session.incoming) {
                if (frame is Frame.Text) {
                    val message = frame.readText()
                    handleTimeSeriesMessage(connection, message)
                }
            }

        } catch (e: Exception) {
            logger.error(e) { "Error in time series stream $connectionId" }
        } finally {
            activeConnections.remove(connectionId)
            connection.cleanup()
            logger.info { "Time series stream connection closed: $connectionId" }
        }
    }

    /**
     * Handle time series subscription messages.
     */
    private suspend fun handleTimeSeriesMessage(
        connection: StreamingConnection,
        message: String
    ) {
        try {
            val request = json.decodeFromString<Map<String, String>>(message)
            val action = request["action"]

            when (action) {
                "subscribe" -> {
                    val metric = request["metric"] ?: throw IllegalArgumentException("Metric required")
                    logger.info { "Subscribing to time series: $metric" }

                    connection.streamingJob = CoroutineScope(Dispatchers.Default).launch {
                        streamTimeSeriesData(connection, metric)
                    }
                }
                "unsubscribe" -> {
                    connection.stopStreaming()
                }
            }

        } catch (e: Exception) {
            logger.error(e) { "Failed to handle time series message" }
            connection.session.send(
                Frame.Text(
                    json.encodeToString(
                        mapOf(
                            "type" to "error",
                            "error" to "Invalid message: ${e.message}"
                        )
                    )
                )
            )
        }
    }

    /**
     * Stream time series data.
     */
    private suspend fun streamTimeSeriesData(
        connection: StreamingConnection,
        metric: String
    ) {
        val windowSize = 50
        val window = RollingWindow<Double>(windowSize)

        try {
            while (isActive && !connection.paused) {
                // Generate time series data point
                val value = 100.0 + Math.sin(System.currentTimeMillis() / 1000.0) * 20 + (Math.random() * 10 - 5)

                window.add(value)

                // Calculate trend
                val values = window.getAll()
                val trend = if (values.size >= 10) {
                    val recentAvg = values.takeLast(5).average()
                    val olderAvg = values.take(5).average()

                    when {
                        recentAvg > olderAvg * 1.02 -> "upward"
                        recentAvg < olderAvg * 0.98 -> "downward"
                        else -> "stable"
                    }
                } else {
                    "stable"
                }

                // Detect anomalies (simple threshold)
                val mean = values.average()
                val std = calculateStd(values)
                val isAnomaly = kotlin.math.abs(value - mean) > 2 * std

                // Send update
                val update = mapOf(
                    "type" to "timeseries_update",
                    "timestamp" to Clock.System.now().toString(),
                    "metric" to metric,
                    "value" to value,
                    "mean" to mean,
                    "std" to std,
                    "trend" to trend,
                    "anomaly" to isAnomaly
                )

                connection.session.send(
                    Frame.Text(json.encodeToString(update))
                )

                delay(1000) // 1 second intervals
            }

        } catch (e: CancellationException) {
            logger.debug { "Time series stream cancelled" }
        } catch (e: Exception) {
            logger.error(e) { "Error streaming time series" }
        }
    }

    /**
     * Handle live data streaming.
     */
    suspend fun handleLiveDataStream(session: DefaultWebSocketServerSession) {
        val connectionId = "live-${connectionCounter.incrementAndGet()}"
        logger.info { "New live data stream connection: $connectionId" }

        try {
            session.send(
                Frame.Text(
                    json.encodeToString(
                        mapOf(
                            "type" to "connected",
                            "connectionId" to connectionId,
                            "message" to "Connected to live data stream"
                        )
                    )
                )
            )

            // Stream live events
            val eventFlow = generateLiveEventFlow()

            eventFlow.collect { event ->
                session.send(
                    Frame.Text(json.encodeToString(event))
                )
            }

        } catch (e: Exception) {
            logger.error(e) { "Error in live data stream $connectionId" }
        } finally {
            logger.info { "Live data stream connection closed: $connectionId" }
        }
    }

    /**
     * Generate live event flow (simulated).
     */
    private fun generateLiveEventFlow(): Flow<AnalyticsEvent> = flow {
        while (true) {
            val event = AnalyticsEvent(
                timestamp = Clock.System.now(),
                metric = listOf("revenue", "customers", "orders").random(),
                value = 100.0 + (Math.random() * 100),
                metadata = mapOf(
                    "source" to "live_stream",
                    "region" to listOf("US", "EU", "APAC").random()
                )
            )

            emit(event)
            delay(2000) // 2 second intervals
        }
    }

    /**
     * Handle dashboard streaming (multi-metric).
     */
    suspend fun handleDashboardStream(session: DefaultWebSocketServerSession) {
        val connectionId = "dashboard-${connectionCounter.incrementAndGet()}"
        logger.info { "New dashboard stream connection: $connectionId" }

        try {
            session.send(
                Frame.Text(
                    json.encodeToString(
                        mapOf(
                            "type" to "connected",
                            "connectionId" to connectionId,
                            "message" to "Connected to dashboard stream"
                        )
                    )
                )
            )

            // Stream dashboard updates
            while (true) {
                val dashboardData = mapOf(
                    "type" to "dashboard_update",
                    "timestamp" to Clock.System.now().toString(),
                    "metrics" to mapOf(
                        "revenue" to (1000.0 + Math.random() * 500),
                        "customers" to (50 + Math.random() * 20).toInt(),
                        "orders" to (100 + Math.random() * 50).toInt(),
                        "avgOrderValue" to (20.0 + Math.random() * 10)
                    ),
                    "status" to mapOf(
                        "healthy" to true,
                        "activeUsers" to activeConnections.size,
                        "uptime" to Runtime.getRuntime().totalMemory()
                    )
                )

                session.send(
                    Frame.Text(json.encodeToString(dashboardData))
                )

                delay(5000) // 5 second intervals
            }

        } catch (e: Exception) {
            logger.error(e) { "Error in dashboard stream $connectionId" }
        } finally {
            logger.info { "Dashboard stream connection closed: $connectionId" }
        }
    }

    /**
     * Calculate standard deviation.
     */
    private fun calculateStd(values: List<Double>): Double {
        if (values.isEmpty()) return 0.0
        val mean = values.average()
        val variance = values.map { (it - mean) * (it - mean) }.average()
        return kotlin.math.sqrt(variance)
    }

    /**
     * Get active connection count.
     */
    fun getActiveConnectionCount(): Int = activeConnections.size
}

/**
 * Represents an active streaming connection.
 *
 * @property id Connection identifier
 * @property session WebSocket session
 * @property type Stream type
 */
private data class StreamingConnection(
    val id: String,
    val session: DefaultWebSocketServerSession,
    val type: StreamType
) {
    var subscription: StreamSubscription? = null
    var streamingJob: Job? = null
    var paused: Boolean = false

    /**
     * Stop streaming and cleanup.
     */
    fun stopStreaming() {
        streamingJob?.cancel()
        streamingJob = null
    }

    /**
     * Cleanup connection resources.
     */
    fun cleanup() {
        stopStreaming()
    }
}

/**
 * Stream types.
 */
private enum class StreamType {
    ANALYTICS,
    TIMESERIES,
    LIVE,
    DASHBOARD
}

/**
 * Rolling window for streaming data.
 *
 * Maintains a fixed-size window of most recent values.
 *
 * @param maxSize Maximum window size
 */
private class RollingWindow<T>(private val maxSize: Int) {
    private val data = mutableListOf<T>()

    /**
     * Add value to window.
     */
    fun add(value: T) {
        synchronized(data) {
            data.add(value)
            if (data.size > maxSize) {
                data.removeAt(0)
            }
        }
    }

    /**
     * Get all values in window.
     */
    fun getAll(): List<T> {
        synchronized(data) {
            return data.toList()
        }
    }

    /**
     * Get window size.
     */
    fun size(): Int {
        synchronized(data) {
            return data.size
        }
    }

    /**
     * Clear window.
     */
    fun clear() {
        synchronized(data) {
            data.clear()
        }
    }
}

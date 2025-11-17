package dev.elide.workflow

import dev.elide.workflow.api.ApiServer
import dev.elide.workflow.database.DatabaseManager
import dev.elide.workflow.nodes.initializeNodes

/**
 * Main application entry point
 */
class WorkflowApplication {
    private val apiServer: ApiServer
    private val databaseManager: DatabaseManager

    init {
        // Initialize database
        databaseManager = DatabaseManager(
            host = System.getenv("DB_HOST") ?: "localhost",
            port = System.getenv("DB_PORT")?.toIntOrNull() ?: 5432,
            database = System.getenv("DB_NAME") ?: "elide_workflow",
            user = System.getenv("DB_USER") ?: "postgres",
            password = System.getenv("DB_PASSWORD") ?: ""
        )

        // Initialize node registry
        initializeNodes()

        // Create API server
        val port = System.getenv("PORT")?.toIntOrNull() ?: 5678
        val host = System.getenv("HOST") ?: "0.0.0.0"
        apiServer = ApiServer(port, host)

        println("""
        ╔═══════════════════════════════════════════════════════╗
        ║                                                       ║
        ║   ███████╗██╗     ██╗██████╗ ███████╗                ║
        ║   ██╔════╝██║     ██║██╔══██╗██╔════╝                ║
        ║   █████╗  ██║     ██║██║  ██║█████╗                  ║
        ║   ██╔══╝  ██║     ██║██║  ██║██╔══╝                  ║
        ║   ███████╗███████╗██║██████╔╝███████╗                ║
        ║   ╚══════╝╚══════╝╚═╝╚═════╝ ╚══════╝                ║
        ║                                                       ║
        ║          Workflow Automation Platform                ║
        ║                                                       ║
        ╚═══════════════════════════════════════════════════════╝

        Server starting on http://$host:$port

        API Endpoints:
        - GET    /api/workflows           - List workflows
        - POST   /api/workflows           - Create workflow
        - GET    /api/workflows/:id       - Get workflow
        - PUT    /api/workflows/:id       - Update workflow
        - DELETE /api/workflows/:id       - Delete workflow
        - POST   /api/workflows/:id/activate   - Activate workflow
        - POST   /api/workflows/:id/deactivate - Deactivate workflow

        - GET    /api/executions          - List executions
        - POST   /api/executions          - Execute workflow
        - GET    /api/executions/:id      - Get execution

        - GET    /api/credentials         - List credentials
        - POST   /api/credentials         - Create credential
        - DELETE /api/credentials/:id     - Delete credential

        - GET    /api/nodes                - List node types
        - GET    /api/nodes/:type          - Get node type details

        - POST   /webhook/:path...         - Webhook endpoint
        - GET    /webhook/:path...         - Webhook endpoint

        - WS     /ws/executions            - Real-time execution updates

        Editor: http://$host:${port + 1}

        Press Ctrl+C to stop
        """.trimIndent())
    }

    fun start() {
        apiServer.start()
    }

    fun stop() {
        apiServer.stop()
        databaseManager.close()
    }
}

/**
 * Main function
 */
fun main() {
    val app = WorkflowApplication()

    // Add shutdown hook
    Runtime.getRuntime().addShutdownHook(Thread {
        println("\nShutting down Elide Workflow...")
        app.stop()
    })

    // Start application
    app.start()
}

/**
 * Server Configuration DSL for Elide
 *
 * Type-safe HTTP server configuration:
 * - Routes and handlers
 * - Middleware
 * - Static files
 * - WebSocket support
 * - CORS configuration
 */

package elide.dsl.server

/**
 * HTTP Server configuration
 */
class ServerConfig {
    var host: String = "0.0.0.0"
    var port: Int = 8080
    var ssl: SslConfig? = null

    val routes = mutableListOf<Route>()
    val middleware = mutableListOf<Middleware>()
    val staticDirs = mutableListOf<StaticDir>()

    var cors: CorsConfig? = null

    fun route(method: String, path: String, handler: RequestHandler) {
        routes.add(Route(method, path, handler))
    }

    fun get(path: String, handler: RequestHandler) {
        route("GET", path, handler)
    }

    fun post(path: String, handler: RequestHandler) {
        route("POST", path, handler)
    }

    fun put(path: String, handler: RequestHandler) {
        route("PUT", path, handler)
    }

    fun delete(path: String, handler: RequestHandler) {
        route("DELETE", path, handler)
    }

    fun use(middleware: Middleware) {
        this.middleware.add(middleware)
    }

    fun static(prefix: String, directory: String) {
        staticDirs.add(StaticDir(prefix, directory))
    }

    fun ssl(block: SslConfig.() -> Unit) {
        ssl = SslConfig().apply(block)
    }

    fun cors(block: CorsConfig.() -> Unit) {
        cors = CorsConfig().apply(block)
    }
}

/**
 * HTTP route
 */
data class Route(
    val method: String,
    val path: String,
    val handler: RequestHandler
)

/**
 * Request handler type
 */
typealias RequestHandler = (Request, Response) -> Unit

/**
 * HTTP Request
 */
interface Request {
    val method: String
    val path: String
    val headers: Map<String, String>
    val params: Map<String, String>
    val query: Map<String, String>
    val body: String

    fun param(name: String): String?
    fun query(name: String): String?
    fun header(name: String): String?
}

/**
 * HTTP Response
 */
interface Response {
    var status: Int
    val headers: MutableMap<String, String>

    fun header(name: String, value: String)
    fun json(data: Any)
    fun text(content: String)
    fun html(content: String)
    fun send(content: String)
}

/**
 * Middleware
 */
typealias Middleware = (Request, Response, () -> Unit) -> Unit

/**
 * SSL Configuration
 */
class SslConfig {
    var keyStore: String = ""
    var keyStorePassword: String = ""
    var trustStore: String? = null
    var trustStorePassword: String? = null
}

/**
 * CORS Configuration
 */
class CorsConfig {
    var allowOrigins: List<String> = listOf("*")
    var allowMethods: List<String> = listOf("GET", "POST", "PUT", "DELETE", "OPTIONS")
    var allowHeaders: List<String> = listOf("*")
    var exposeHeaders: List<String> = emptyList()
    var allowCredentials: Boolean = true
    var maxAge: Int = 3600
}

/**
 * Static directory configuration
 */
data class StaticDir(
    val prefix: String,
    val directory: String
)

/**
 * Server DSL function
 */
fun server(block: ServerConfig.() -> Unit): ServerConfig {
    val config = ServerConfig()
    config.block()
    return config
}

/**
 * Common middleware
 */
object CommonMiddleware {
    fun logger(): Middleware = { req, res, next ->
        println("${req.method} ${req.path}")
        next()
    }

    fun errorHandler(): Middleware = { req, res, next ->
        try {
            next()
        } catch (e: Exception) {
            res.status = 500
            res.json(mapOf("error" to e.message))
        }
    }

    fun bodyParser(): Middleware = { req, res, next ->
        // Parse request body
        next()
    }

    fun authenticate(validateToken: (String) -> Boolean): Middleware = { req, res, next ->
        val token = req.header("Authorization")
        if (token != null && validateToken(token)) {
            next()
        } else {
            res.status = 401
            res.json(mapOf("error" to "Unauthorized"))
        }
    }
}

/**
 * Example usage:
 *
 * val config = server {
 *     host = "0.0.0.0"
 *     port = 8080
 *
 *     use(CommonMiddleware.logger())
 *     use(CommonMiddleware.errorHandler())
 *
 *     get("/") { req, res ->
 *         res.html("<h1>Welcome</h1>")
 *     }
 *
 *     get("/api/users/:id") { req, res ->
 *         val id = req.param("id")
 *         res.json(mapOf("id" to id, "name" to "User $id"))
 *     }
 *
 *     post("/api/users") { req, res ->
 *         // Parse body and create user
 *         res.status = 201
 *         res.json(mapOf("created" to true))
 *     }
 *
 *     static("/public", "./static")
 *
 *     cors {
 *         allowOrigins = listOf("https://example.com")
 *         allowMethods = listOf("GET", "POST")
 *     }
 * }
 */

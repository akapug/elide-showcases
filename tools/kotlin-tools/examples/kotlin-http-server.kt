/**
 * Kotlin HTTP Server Example
 *
 * Demonstrates building a high-performance HTTP server in pure Kotlin
 * running on Elide without JVM overhead.
 */

package elide.examples

import elide.dsl.server.*
import elide.dsl.html.*
import elide.dsl.sql.*

// User data model
data class User(
    val id: Int,
    val name: String,
    val email: String
)

// In-memory user store
object UserStore {
    private val users = mutableMapOf<Int, User>()
    private var nextId = 1

    fun create(name: String, email: String): User {
        val user = User(nextId++, name, email)
        users[user.id] = user
        return user
    }

    fun findById(id: Int): User? = users[id]

    fun findAll(): List<User> = users.values.toList()

    fun update(id: Int, name: String?, email: String?): User? {
        val user = users[id] ?: return null
        val updated = user.copy(
            name = name ?: user.name,
            email = email ?: user.email
        )
        users[id] = updated
        return updated
    }

    fun delete(id: Int): Boolean {
        return users.remove(id) != null
    }
}

/**
 * Main server configuration
 */
fun main() {
    val config = server {
        host = "0.0.0.0"
        port = 8080

        // Middleware
        use(CommonMiddleware.logger())
        use(CommonMiddleware.errorHandler())

        // Home page
        get("/") { req, res ->
            val page = html {
                head {
                    title("Kotlin HTTP Server")
                    meta("viewport", "width=device-width, initial-scale=1")
                    style {
                        text("""
                            body {
                                font-family: system-ui, sans-serif;
                                max-width: 1200px;
                                margin: 0 auto;
                                padding: 20px;
                            }
                            .user-card {
                                border: 1px solid #ddd;
                                padding: 15px;
                                margin: 10px 0;
                                border-radius: 8px;
                            }
                        """.trimIndent())
                    }
                }
                body {
                    h1 { text("Kotlin HTTP Server on Elide") }
                    p { text("Fast, type-safe HTTP server without JVM overhead") }

                    section(classes = "users") {
                        h2 { text("Users") }
                        div(classes = "user-list") {
                            // Users would be rendered here
                        }
                    }

                    section {
                        h2 { text("API Endpoints") }
                        ul {
                            li { text("GET /api/users - List all users") }
                            li { text("GET /api/users/:id - Get user by ID") }
                            li { text("POST /api/users - Create user") }
                            li { text("PUT /api/users/:id - Update user") }
                            li { text("DELETE /api/users/:id - Delete user") }
                        }
                    }
                }
            }
            res.html(page)
        }

        // REST API
        get("/api/users") { req, res ->
            val users = UserStore.findAll()
            res.json(users)
        }

        get("/api/users/:id") { req, res ->
            val id = req.param("id")?.toIntOrNull()
            if (id == null) {
                res.status = 400
                res.json(mapOf("error" to "Invalid user ID"))
                return@get
            }

            val user = UserStore.findById(id)
            if (user == null) {
                res.status = 404
                res.json(mapOf("error" to "User not found"))
            } else {
                res.json(user)
            }
        }

        post("/api/users") { req, res ->
            // Parse request body (simplified)
            val name = req.query("name")
            val email = req.query("email")

            if (name == null || email == null) {
                res.status = 400
                res.json(mapOf("error" to "Name and email required"))
                return@post
            }

            val user = UserStore.create(name, email)
            res.status = 201
            res.json(user)
        }

        put("/api/users/:id") { req, res ->
            val id = req.param("id")?.toIntOrNull()
            if (id == null) {
                res.status = 400
                res.json(mapOf("error" to "Invalid user ID"))
                return@put
            }

            val name = req.query("name")
            val email = req.query("email")

            val user = UserStore.update(id, name, email)
            if (user == null) {
                res.status = 404
                res.json(mapOf("error" to "User not found"))
            } else {
                res.json(user)
            }
        }

        delete("/api/users/:id") { req, res ->
            val id = req.param("id")?.toIntOrNull()
            if (id == null) {
                res.status = 400
                res.json(mapOf("error" to "Invalid user ID"))
                return@delete
            }

            if (UserStore.delete(id)) {
                res.status = 204
                res.send("")
            } else {
                res.status = 404
                res.json(mapOf("error" to "User not found"))
            }
        }

        // Static files
        static("/public", "./public")

        // CORS
        cors {
            allowOrigins = listOf("*")
            allowMethods = listOf("GET", "POST", "PUT", "DELETE")
        }
    }

    println("Server starting on http://${config.host}:${config.port}")
    // Start server (actual implementation would start the server)
}

/**
 * Usage:
 *
 * # Compile to native binary
 * kotlinc kotlin-http-server.kt -include-runtime -d server.jar
 * native-image -jar server.jar -o server
 *
 * # Or run with Elide
 * elide run kotlin-http-server.kt
 *
 * # Test API
 * curl http://localhost:8080/api/users
 * curl -X POST "http://localhost:8080/api/users?name=Alice&email=alice@example.com"
 */

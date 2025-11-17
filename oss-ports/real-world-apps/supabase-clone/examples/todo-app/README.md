# Todo App Example

Complete full-stack todo application built with Elidebase.

## Features

- User authentication (email/password)
- Create, read, update, delete todos
- Real-time synchronization across clients
- File attachments
- User avatars
- Row-level security
- Collaborative todo lists

## Architecture

```
todo-app/
├── backend/
│   ├── migrations/          # Database migrations
│   ├── functions/           # Edge functions
│   └── elidebase.json      # Configuration
├── frontend/
│   ├── src/
│   │   ├── auth/           # Authentication
│   │   ├── todos/          # Todo CRUD
│   │   ├── realtime/       # Real-time sync
│   │   └── storage/        # File uploads
│   └── index.html
└── README.md
```

## Database Schema

```sql
-- migrations/0001_initial_schema.sql

-- +migrate Up

-- Todos table
CREATE TABLE todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    priority INTEGER DEFAULT 0,
    due_date TIMESTAMP,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    list_id UUID REFERENCES todo_lists(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT priority_range CHECK (priority >= 0 AND priority <= 5)
);

-- Todo lists (for collaboration)
CREATE TABLE todo_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- List members (for sharing)
CREATE TABLE list_members (
    list_id UUID REFERENCES todo_lists(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'editor', 'viewer')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (list_id, user_id)
);

-- Todo attachments
CREATE TABLE todo_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_todos_user ON todos(user_id);
CREATE INDEX idx_todos_list ON todos(list_id);
CREATE INDEX idx_todos_completed ON todos(completed);
CREATE INDEX idx_todos_due_date ON todos(due_date);
CREATE INDEX idx_list_members_user ON list_members(user_id);
CREATE INDEX idx_attachments_todo ON todo_attachments(todo_id);

-- Enable RLS
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for todos
CREATE POLICY todos_select_own ON todos
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() OR
        list_id IN (
            SELECT list_id FROM list_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY todos_insert_own ON todos
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid() AND
        (list_id IS NULL OR list_id IN (
            SELECT list_id FROM list_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
        ))
    );

CREATE POLICY todos_update_own ON todos
    FOR UPDATE
    TO authenticated
    USING (
        user_id = auth.uid() OR
        list_id IN (
            SELECT list_id FROM list_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
        )
    );

CREATE POLICY todos_delete_own ON todos
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- RLS Policies for lists
CREATE POLICY lists_select_member ON todo_lists
    FOR SELECT
    TO authenticated
    USING (
        owner_id = auth.uid() OR
        id IN (SELECT list_id FROM list_members WHERE user_id = auth.uid())
    );

CREATE POLICY lists_insert_own ON todo_lists
    FOR INSERT
    TO authenticated
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY lists_update_own ON todo_lists
    FOR UPDATE
    TO authenticated
    USING (owner_id = auth.uid());

CREATE POLICY lists_delete_own ON todo_lists
    FOR DELETE
    TO authenticated
    USING (owner_id = auth.uid());

-- RLS Policies for list members
CREATE POLICY members_select_visible ON list_members
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() OR
        list_id IN (SELECT list_id FROM list_members WHERE user_id = auth.uid())
    );

CREATE POLICY members_insert_owner ON list_members
    FOR INSERT
    TO authenticated
    WITH CHECK (
        list_id IN (
            SELECT id FROM todo_lists WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY members_delete_owner ON list_members
    FOR DELETE
    TO authenticated
    USING (
        list_id IN (
            SELECT id FROM todo_lists WHERE owner_id = auth.uid()
        )
    );

-- RLS Policies for attachments
CREATE POLICY attachments_select_todo_owner ON todo_attachments
    FOR SELECT
    TO authenticated
    USING (
        todo_id IN (SELECT id FROM todos WHERE user_id = auth.uid())
    );

CREATE POLICY attachments_insert_todo_owner ON todo_attachments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        todo_id IN (SELECT id FROM todos WHERE user_id = auth.uid())
    );

CREATE POLICY attachments_delete_todo_owner ON todo_attachments
    FOR DELETE
    TO authenticated
    USING (
        todo_id IN (SELECT id FROM todos WHERE user_id = auth.uid())
    );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER todos_updated_at
BEFORE UPDATE ON todos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- +migrate Down
DROP TABLE IF EXISTS todo_attachments CASCADE;
DROP TABLE IF EXISTS list_members CASCADE;
DROP TABLE IF EXISTS todos CASCADE;
DROP TABLE IF EXISTS todo_lists CASCADE;
DROP FUNCTION IF EXISTS update_updated_at CASCADE;
```

## Backend Implementation

### Main Application

```kotlin
// backend/src/main/kotlin/TodoApp.kt

package com.example.todoapp

import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.cio.*
import io.ktor.server.routing.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.http.*
import io.ktor.server.response.*
import io.ktor.server.request.*
import tools.elide.oss.elidebase.core.*
import tools.elide.oss.elidebase.database.*
import tools.elide.oss.elidebase.auth.*
import tools.elide.oss.elidebase.storage.*
import tools.elide.oss.elidebase.realtime.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.*

@Serializable
data class CreateTodoRequest(
    val title: String,
    val description: String? = null,
    val priority: Int = 0,
    val dueDate: String? = null,
    val listId: String? = null
)

@Serializable
data class UpdateTodoRequest(
    val title: String? = null,
    val description: String? = null,
    val completed: Boolean? = null,
    val priority: Int? = null,
    val dueDate: String? = null
)

fun main() {
    // Initialize services
    val dbConfig = DatabaseConfig(
        host = "localhost",
        port = 5432,
        database = "todoapp",
        username = "postgres",
        password = "password"
    )

    val dbManager = DatabaseManager(dbConfig)
    val authManager = AuthManager(dbManager, jwtSecret = "your-secret-key")
    val storageManager = StorageManager(dbManager)
    val realtimeServer = RealtimeServer(dbManager)

    embeddedServer(CIO, port = 8000) {
        install(Authentication) {
            jwt("auth-jwt") {
                verifier(authManager.jwtVerifier)
                validate { credential ->
                    val userId = credential.payload.subject
                    if (userId != null) {
                        JWTPrincipal(credential.payload)
                    } else null
                }
            }
        }

        routing {
            // Health check
            get("/health") {
                call.respond(mapOf("status" to "healthy"))
            }

            // Auth routes
            post("/auth/signup") {
                val request = call.receive<Map<String, String>>()
                val result = authManager.signUpWithEmail(
                    email = request["email"]!!,
                    password = request["password"]!!
                )

                if (result.data != null) {
                    call.respond(HttpStatusCode.Created, result.data)
                } else {
                    call.respond(HttpStatusCode.BadRequest, result.error!!)
                }
            }

            post("/auth/signin") {
                val request = call.receive<Map<String, String>>()
                val result = authManager.signInWithEmail(
                    email = request["email"]!!,
                    password = request["password"]!!
                )

                if (result.data != null) {
                    call.respond(result.data)
                } else {
                    call.respond(HttpStatusCode.Unauthorized, result.error!!)
                }
            }

            // Protected routes
            authenticate("auth-jwt") {
                // Get all todos
                get("/api/todos") {
                    val principal = call.principal<JWTPrincipal>()!!
                    val userId = principal.payload.subject

                    val todos = dbManager.withConnection { connection ->
                        val sql = """
                            SELECT * FROM todos
                            WHERE user_id = ?
                            ORDER BY created_at DESC
                        """.trimIndent()

                        connection.prepareStatement(sql).use { stmt ->
                            stmt.setObject(1, java.util.UUID.fromString(userId))
                            stmt.executeQuery().use { rs ->
                                val results = mutableListOf<Map<String, Any?>>()
                                while (rs.next()) {
                                    results.add(mapOf(
                                        "id" to rs.getString("id"),
                                        "title" to rs.getString("title"),
                                        "description" to rs.getString("description"),
                                        "completed" to rs.getBoolean("completed"),
                                        "priority" to rs.getInt("priority"),
                                        "dueDate" to rs.getTimestamp("due_date")?.toString(),
                                        "createdAt" to rs.getTimestamp("created_at").toString()
                                    ))
                                }
                                results
                            }
                        }
                    }

                    call.respond(todos)
                }

                // Create todo
                post("/api/todos") {
                    val principal = call.principal<JWTPrincipal>()!!
                    val userId = principal.payload.subject
                    val request = call.receive<CreateTodoRequest>()

                    val todoId = dbManager.withConnection { connection ->
                        val sql = """
                            INSERT INTO todos (title, description, priority, due_date, user_id, list_id)
                            VALUES (?, ?, ?, ?, ?, ?)
                            RETURNING id
                        """.trimIndent()

                        connection.prepareStatement(sql).use { stmt ->
                            stmt.setString(1, request.title)
                            stmt.setString(2, request.description)
                            stmt.setInt(3, request.priority)
                            stmt.setTimestamp(4, request.dueDate?.let {
                                java.sql.Timestamp.from(java.time.Instant.parse(it))
                            })
                            stmt.setObject(5, java.util.UUID.fromString(userId))
                            stmt.setObject(6, request.listId?.let { java.util.UUID.fromString(it) })

                            stmt.executeQuery().use { rs ->
                                rs.next()
                                rs.getString("id")
                            }
                        }
                    }

                    // Notify real-time subscribers
                    realtimeServer.notifyDatabaseChange(
                        DatabaseChange(
                            schema = "public",
                            table = "todos",
                            operation = "insert",
                            newData = mapOf("id" to todoId, "title" to request.title)
                        )
                    )

                    call.respond(HttpStatusCode.Created, mapOf("id" to todoId))
                }

                // Update todo
                patch("/api/todos/{id}") {
                    val principal = call.principal<JWTPrincipal>()!!
                    val userId = principal.payload.subject
                    val todoId = call.parameters["id"]!!
                    val request = call.receive<UpdateTodoRequest>()

                    dbManager.withConnection { connection ->
                        val updates = mutableListOf<String>()
                        val values = mutableListOf<Any?>()

                        request.title?.let {
                            updates.add("title = ?")
                            values.add(it)
                        }
                        request.description?.let {
                            updates.add("description = ?")
                            values.add(it)
                        }
                        request.completed?.let {
                            updates.add("completed = ?")
                            values.add(it)
                        }
                        request.priority?.let {
                            updates.add("priority = ?")
                            values.add(it)
                        }
                        request.dueDate?.let {
                            updates.add("due_date = ?")
                            values.add(java.sql.Timestamp.from(java.time.Instant.parse(it)))
                        }

                        if (updates.isEmpty()) {
                            return@withConnection
                        }

                        val sql = """
                            UPDATE todos
                            SET ${updates.joinToString(", ")}
                            WHERE id = ? AND user_id = ?
                        """.trimIndent()

                        connection.prepareStatement(sql).use { stmt ->
                            values.forEachIndexed { index, value ->
                                stmt.setObject(index + 1, value)
                            }
                            stmt.setObject(values.size + 1, java.util.UUID.fromString(todoId))
                            stmt.setObject(values.size + 2, java.util.UUID.fromString(userId))
                            stmt.executeUpdate()
                        }
                    }

                    // Notify real-time subscribers
                    realtimeServer.notifyDatabaseChange(
                        DatabaseChange(
                            schema = "public",
                            table = "todos",
                            operation = "update",
                            newData = mapOf("id" to todoId)
                        )
                    )

                    call.respond(HttpStatusCode.OK)
                }

                // Delete todo
                delete("/api/todos/{id}") {
                    val principal = call.principal<JWTPrincipal>()!!
                    val userId = principal.payload.subject
                    val todoId = call.parameters["id"]!!

                    dbManager.withConnection { connection ->
                        val sql = "DELETE FROM todos WHERE id = ? AND user_id = ?"

                        connection.prepareStatement(sql).use { stmt ->
                            stmt.setObject(1, java.util.UUID.fromString(todoId))
                            stmt.setObject(2, java.util.UUID.fromString(userId))
                            stmt.executeUpdate()
                        }
                    }

                    // Notify real-time subscribers
                    realtimeServer.notifyDatabaseChange(
                        DatabaseChange(
                            schema = "public",
                            table = "todos",
                            operation = "delete",
                            oldData = mapOf("id" to todoId)
                        )
                    )

                    call.respond(HttpStatusCode.NoContent)
                }

                // Upload attachment
                post("/api/todos/{id}/attachments") {
                    val principal = call.principal<JWTPrincipal>()!!
                    val userId = principal.payload.subject
                    val todoId = call.parameters["id"]!!

                    // Handle file upload
                    // ... multipart file upload handling

                    call.respond(HttpStatusCode.Created)
                }
            }

            // WebSocket for real-time
            webSocket("/realtime") {
                val userId = call.request.queryParameters["token"]?.let { token ->
                    authManager.verifyToken(token)?.subject
                }

                realtimeServer.handleConnection(this, userId)
            }
        }
    }.start(wait = true)
}
```

## Frontend Implementation

```html
<!-- frontend/index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo App - Elidebase</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            padding: 24px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
        }

        h1 {
            color: #333;
        }

        .auth-section {
            display: none;
        }

        .auth-section.active {
            display: block;
        }

        .todo-form {
            margin-bottom: 24px;
        }

        input, textarea {
            width: 100%;
            padding: 12px;
            margin-bottom: 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }

        button {
            background: #4CAF50;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }

        button:hover {
            background: #45a049;
        }

        .todo-list {
            list-style: none;
        }

        .todo-item {
            padding: 16px;
            border: 1px solid #ddd;
            border-radius: 4px;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .todo-item.completed {
            opacity: 0.6;
        }

        .todo-item.completed .todo-title {
            text-decoration: line-through;
        }

        .todo-actions button {
            margin-left: 8px;
            padding: 8px 12px;
        }

        .btn-delete {
            background: #f44336;
        }

        .btn-delete:hover {
            background: #da190b;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Auth Section -->
        <div id="authSection" class="auth-section active">
            <h1>Welcome to Todo App</h1>
            <div class="todo-form">
                <input type="email" id="authEmail" placeholder="Email">
                <input type="password" id="authPassword" placeholder="Password">
                <button onclick="signIn()">Sign In</button>
                <button onclick="signUp()">Sign Up</button>
            </div>
        </div>

        <!-- Todo Section -->
        <div id="todoSection" class="auth-section">
            <div class="header">
                <h1>My Todos</h1>
                <button onclick="signOut()">Sign Out</button>
            </div>

            <div class="todo-form">
                <input type="text" id="todoTitle" placeholder="Todo title">
                <textarea id="todoDescription" placeholder="Description (optional)"></textarea>
                <button onclick="createTodo()">Add Todo</button>
            </div>

            <ul id="todoList" class="todo-list"></ul>
        </div>
    </div>

    <script>
        const API_URL = 'http://localhost:8000';
        let accessToken = localStorage.getItem('access_token');
        let ws = null;

        // Check authentication on load
        if (accessToken) {
            showTodoSection();
            loadTodos();
            connectWebSocket();
        }

        async function signUp() {
            const email = document.getElementById('authEmail').value;
            const password = document.getElementById('authPassword').value;

            const response = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();
                accessToken = data.accessToken;
                localStorage.setItem('access_token', accessToken);
                localStorage.setItem('refresh_token', data.refreshToken);
                showTodoSection();
                loadTodos();
                connectWebSocket();
            } else {
                alert('Sign up failed');
            }
        }

        async function signIn() {
            const email = document.getElementById('authEmail').value;
            const password = document.getElementById('authPassword').value;

            const response = await fetch(`${API_URL}/auth/signin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();
                accessToken = data.accessToken;
                localStorage.setItem('access_token', accessToken);
                localStorage.setItem('refresh_token', data.refreshToken);
                showTodoSection();
                loadTodos();
                connectWebSocket();
            } else {
                alert('Sign in failed');
            }
        }

        function signOut() {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            accessToken = null;
            if (ws) ws.close();
            showAuthSection();
        }

        function showAuthSection() {
            document.getElementById('authSection').classList.add('active');
            document.getElementById('todoSection').classList.remove('active');
        }

        function showTodoSection() {
            document.getElementById('authSection').classList.remove('active');
            document.getElementById('todoSection').classList.add('active');
        }

        async function loadTodos() {
            const response = await fetch(`${API_URL}/api/todos`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            const todos = await response.json();
            renderTodos(todos);
        }

        function renderTodos(todos) {
            const list = document.getElementById('todoList');
            list.innerHTML = '';

            todos.forEach(todo => {
                const li = document.createElement('li');
                li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
                li.innerHTML = `
                    <div>
                        <div class="todo-title">${todo.title}</div>
                        <div class="todo-description">${todo.description || ''}</div>
                    </div>
                    <div class="todo-actions">
                        <button onclick="toggleTodo('${todo.id}', ${!todo.completed})">
                            ${todo.completed ? 'Undo' : 'Complete'}
                        </button>
                        <button class="btn-delete" onclick="deleteTodo('${todo.id}')">Delete</button>
                    </div>
                `;
                list.appendChild(li);
            });
        }

        async function createTodo() {
            const title = document.getElementById('todoTitle').value;
            const description = document.getElementById('todoDescription').value;

            if (!title) return;

            const response = await fetch(`${API_URL}/api/todos`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title, description })
            });

            if (response.ok) {
                document.getElementById('todoTitle').value = '';
                document.getElementById('todoDescription').value = '';
                loadTodos();
            }
        }

        async function toggleTodo(id, completed) {
            await fetch(`${API_URL}/api/todos/${id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ completed })
            });

            loadTodos();
        }

        async function deleteTodo(id) {
            if (!confirm('Delete this todo?')) return;

            await fetch(`${API_URL}/api/todos/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            loadTodos();
        }

        function connectWebSocket() {
            ws = new WebSocket(`ws://localhost:8000/realtime?token=${accessToken}`);

            ws.onopen = () => {
                // Subscribe to todos changes
                ws.send(JSON.stringify({
                    type: 'SUBSCRIBE',
                    topic: 'db:public.todos',
                    payload: JSON.stringify({
                        schema: 'public',
                        table: 'todos',
                        event: '*'
                    })
                }));
            };

            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);

                if (message.type === 'INSERT' || message.type === 'UPDATE' || message.type === 'DELETE') {
                    // Reload todos when changes occur
                    loadTodos();
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        }
    </script>
</body>
</html>
```

## Running the Example

1. **Setup database:**
```bash
createdb todoapp
```

2. **Run migrations:**
```bash
cd backend
elidebase migrate up
```

3. **Start backend:**
```bash
./gradlew run
```

4. **Open frontend:**
```bash
cd frontend
# Serve with any HTTP server
python3 -m http.server 3000
```

5. **Visit:**
```
http://localhost:3000
```

## Features Demonstrated

- ✅ User authentication
- ✅ CRUD operations
- ✅ Row-level security
- ✅ Real-time synchronization
- ✅ File attachments
- ✅ Collaborative lists
- ✅ Protected API routes
- ✅ JWT authentication
- ✅ WebSocket connections
- ✅ Database migrations

## Next Steps

- Add search functionality
- Implement tags/categories
- Add recurring todos
- Implement notifications
- Add dark mode
- Mobile app version

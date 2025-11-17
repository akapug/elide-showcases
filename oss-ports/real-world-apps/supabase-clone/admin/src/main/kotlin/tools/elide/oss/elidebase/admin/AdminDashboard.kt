package tools.elide.oss.elidebase.admin

import io.ktor.server.application.*
import io.ktor.server.routing.*
import io.ktor.server.html.*
import io.ktor.http.*
import io.ktor.server.response.*
import io.ktor.server.request.*
import kotlinx.html.*
import tools.elide.oss.elidebase.core.*
import tools.elide.oss.elidebase.database.*
import tools.elide.oss.elidebase.auth.*
import tools.elide.oss.elidebase.storage.*
import tools.elide.oss.elidebase.functions.*
import tools.elide.oss.elidebase.realtime.*
import kotlinx.serialization.json.*

/**
 * Admin dashboard for managing Elidebase instance
 */
class AdminDashboard(
    private val dbManager: DatabaseManager,
    private val authManager: AuthManager,
    private val storageManager: StorageManager,
    private val functionsRuntime: FunctionsRuntime,
    private val realtimeServer: RealtimeServer
) {

    fun configureRoutes(routing: Routing) {
        routing.apply {
            // Dashboard home
            get("/admin") {
                call.respondHtml {
                    adminLayout("Dashboard") {
                        dashboardContent()
                    }
                }
            }

            // Database management
            get("/admin/database") {
                call.respondHtml {
                    adminLayout("Database") {
                        databaseContent()
                    }
                }
            }

            get("/admin/database/tables/{schema}/{table}") {
                val schema = call.parameters["schema"] ?: "public"
                val table = call.parameters["table"]!!

                call.respondHtml {
                    adminLayout("Table: $table") {
                        tableEditorContent(schema, table)
                    }
                }
            }

            // SQL editor
            get("/admin/sql") {
                call.respondHtml {
                    adminLayout("SQL Editor") {
                        sqlEditorContent()
                    }
                }
            }

            post("/admin/sql/execute") {
                val query = call.receiveParameters()["query"] ?: ""

                val result = try {
                    DatabaseRestAPI(dbManager).executeRaw(query)
                } catch (e: Exception) {
                    ApiResponse<List<JsonObject>>(error = ApiError("SQL_ERROR", e.message ?: "Unknown error"))
                }

                call.respond(result)
            }

            // Users management
            get("/admin/users") {
                call.respondHtml {
                    adminLayout("Users") {
                        usersContent()
                    }
                }
            }

            // Storage browser
            get("/admin/storage") {
                call.respondHtml {
                    adminLayout("Storage") {
                        storageContent()
                    }
                }
            }

            get("/admin/storage/buckets/{bucket}") {
                val bucket = call.parameters["bucket"]!!

                call.respondHtml {
                    adminLayout("Bucket: $bucket") {
                        bucketBrowserContent(bucket)
                    }
                }
            }

            // Functions management
            get("/admin/functions") {
                call.respondHtml {
                    adminLayout("Functions") {
                        functionsContent()
                    }
                }
            }

            get("/admin/functions/{name}/logs") {
                val name = call.parameters["name"]!!

                call.respondHtml {
                    adminLayout("Function Logs: $name") {
                        functionLogsContent(name)
                    }
                }
            }

            // Analytics
            get("/admin/analytics") {
                call.respondHtml {
                    adminLayout("Analytics") {
                        analyticsContent()
                    }
                }
            }

            // Settings
            get("/admin/settings") {
                call.respondHtml {
                    adminLayout("Settings") {
                        settingsContent()
                    }
                }
            }

            // API endpoints for AJAX
            get("/admin/api/stats") {
                val stats = getSystemStats()
                call.respond(stats)
            }

            get("/admin/api/tables") {
                val schemaManager = SchemaManager(dbManager)
                val tables = schemaManager.listTables()
                call.respond(tables)
            }

            get("/admin/api/users") {
                val dbApi = DatabaseRestAPI(dbManager)
                val users = dbApi.select(
                    table = "auth.users",
                    columns = listOf("id", "email", "created_at", "last_sign_in_at", "banned"),
                    sorts = listOf(SortParam("created_at", "DESC")),
                    limit = 100
                )
                call.respond(users)
            }

            get("/admin/api/buckets") {
                val buckets = storageManager.listBuckets()
                call.respond(buckets)
            }

            get("/admin/api/buckets/{bucket}/files") {
                val bucket = call.parameters["bucket"]!!
                val prefix = call.request.queryParameters["prefix"]
                val limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 100

                val files = storageManager.listFiles(bucket, prefix, limit)
                call.respond(files)
            }

            get("/admin/api/functions") {
                val functions = functionsRuntime.listFunctions()
                call.respond(functions)
            }

            get("/admin/api/functions/{name}/logs") {
                val name = call.parameters["name"]!!
                val limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 100

                val logs = functionsRuntime.getFunctionLogs(name, limit)
                call.respond(logs)
            }

            get("/admin/api/realtime/stats") {
                val stats = realtimeServer.getStats()
                call.respond(stats)
            }
        }
    }

    private fun HTML.adminLayout(title: String, content: DIV.() -> Unit) {
        head {
            meta(charset = "UTF-8")
            meta(name = "viewport", content = "width=device-width, initial-scale=1.0")
            title("$title - Elidebase Admin")
            styleLink("/admin/styles.css")
            script(src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js") {}
        }
        body {
            div(classes = "admin-layout") {
                aside(classes = "sidebar") {
                    sidebarContent()
                }
                main(classes = "content") {
                    div(classes = "content-header") {
                        h1 { +title }
                    }
                    div(classes = "content-body") {
                        content()
                    }
                }
            }
            script(src = "/admin/app.js") {}
        }
    }

    private fun DIV.sidebarContent() {
        div(classes = "sidebar-header") {
            h2 { +"Elidebase" }
            p { +"Admin Dashboard" }
        }
        nav(classes = "sidebar-nav") {
            ul {
                li {
                    a(href = "/admin") { +"📊 Dashboard" }
                }
                li {
                    a(href = "/admin/database") { +"🗄️ Database" }
                }
                li {
                    a(href = "/admin/sql") { +"💻 SQL Editor" }
                }
                li {
                    a(href = "/admin/users") { +"👥 Users" }
                }
                li {
                    a(href = "/admin/storage") { +"📦 Storage" }
                }
                li {
                    a(href = "/admin/functions") { +"⚡ Functions" }
                }
                li {
                    a(href = "/admin/analytics") { +"📈 Analytics" }
                }
                li {
                    a(href = "/admin/settings") { +"⚙️ Settings" }
                }
            }
        }
    }

    private fun DIV.dashboardContent() {
        div(classes = "stats-grid") {
            statsCard("Total Users", "users-count", "👥")
            statsCard("Total Posts", "posts-count", "📝")
            statsCard("Storage Used", "storage-used", "💾")
            statsCard("Active Connections", "connections-count", "🔌")
        }

        div(classes = "charts-grid") {
            div(classes = "chart-card") {
                h3 { +"User Signups (Last 7 Days)" }
                canvas {
                    id = "signups-chart"
                }
            }
            div(classes = "chart-card") {
                h3 { +"API Requests" }
                canvas {
                    id = "requests-chart"
                }
            }
        }

        div(classes = "recent-activity") {
            h3 { +"Recent Activity" }
            div {
                id = "activity-log"
            }
        }
    }

    private fun DIV.statsCard(title: String, id: String, icon: String) {
        div(classes = "stat-card") {
            div(classes = "stat-icon") { +icon }
            div(classes = "stat-content") {
                p(classes = "stat-title") { +title }
                p(classes = "stat-value") {
                    this.id = id
                    +"Loading..."
                }
            }
        }
    }

    private fun DIV.databaseContent() {
        div(classes = "database-browser") {
            div(classes = "schema-tree") {
                h3 { +"Tables" }
                div {
                    id = "tables-list"
                    +"Loading tables..."
                }
            }
            div(classes = "table-info") {
                div {
                    id = "table-details"
                    p { +"Select a table to view details" }
                }
            }
        }

        script {
            unsafe {
                +"""
                async function loadTables() {
                    const response = await fetch('/admin/api/tables');
                    const result = await response.json();
                    const tablesList = document.getElementById('tables-list');

                    if (result.data) {
                        tablesList.innerHTML = result.data.map(table =>
                            `<div class="table-item">
                                <a href="/admin/database/tables/public/${'$'}{table}">
                                    📋 ${'$'}{table}
                                </a>
                            </div>`
                        ).join('');
                    }
                }
                loadTables();
                """.trimIndent()
            }
        }
    }

    private fun DIV.tableEditorContent(schema: String, table: String) {
        div(classes = "table-editor") {
            div(classes = "table-actions") {
                button(classes = "btn btn-primary") {
                    onClick = "insertRow()"
                    +"➕ Insert Row"
                }
                button(classes = "btn btn-secondary") {
                    onClick = "exportData()"
                    +"📥 Export"
                }
                button(classes = "btn btn-danger") {
                    onClick = "truncateTable()"
                    +"🗑️ Truncate"
                }
            }

            div(classes = "table-data") {
                table(classes = "data-table") {
                    id = "data-table"
                    thead {
                        tr {
                            id = "table-headers"
                        }
                    }
                    tbody {
                        id = "table-rows"
                    }
                }
            }

            div(classes = "table-pagination") {
                button(classes = "btn") {
                    onClick = "prevPage()"
                    +"← Previous"
                }
                span {
                    id = "page-info"
                    +"Page 1"
                }
                button(classes = "btn") {
                    onClick = "nextPage()"
                    +"Next →"
                }
            }
        }

        script {
            unsafe {
                +"""
                const schema = '$schema';
                const table = '$table';
                let currentPage = 0;
                const pageSize = 20;

                async function loadTableData() {
                    const response = await fetch(
                        `/database/rest/${'$'}{schema}/${'$'}{table}?limit=${'$'}{pageSize}&offset=${'$'}{currentPage * pageSize}`
                    );
                    const result = await response.json();

                    if (result.data && result.data.length > 0) {
                        // Render headers
                        const headers = document.getElementById('table-headers');
                        headers.innerHTML = Object.keys(result.data[0])
                            .map(key => `<th>${'$'}{key}</th>`)
                            .join('');

                        // Render rows
                        const rows = document.getElementById('table-rows');
                        rows.innerHTML = result.data.map(row =>
                            `<tr>${'$'}{Object.values(row).map(val =>
                                `<td>${'$'}{val}</td>`
                            ).join('')}</tr>`
                        ).join('');

                        document.getElementById('page-info').textContent =
                            `Page ${'$'}{currentPage + 1}`;
                    }
                }

                function prevPage() {
                    if (currentPage > 0) {
                        currentPage--;
                        loadTableData();
                    }
                }

                function nextPage() {
                    currentPage++;
                    loadTableData();
                }

                loadTableData();
                """.trimIndent()
            }
        }
    }

    private fun DIV.sqlEditorContent() {
        div(classes = "sql-editor") {
            div(classes = "editor-toolbar") {
                button(classes = "btn btn-primary") {
                    onClick = "executeQuery()"
                    +"▶️ Run Query"
                }
                button(classes = "btn btn-secondary") {
                    onClick = "clearEditor()"
                    +"🗑️ Clear"
                }
                button(classes = "btn") {
                    onClick = "formatQuery()"
                    +"✨ Format"
                }
            }

            textArea(classes = "sql-input") {
                id = "sql-query"
                placeholder = "Enter SQL query..."
                rows = "10"
                +"""
                SELECT * FROM posts
                WHERE status = 'published'
                ORDER BY created_at DESC
                LIMIT 10;
                """.trimIndent()
            }

            div(classes = "query-results") {
                h3 { +"Results" }
                div {
                    id = "query-output"
                    p { +"No results yet" }
                }
            }
        }

        script {
            unsafe {
                +"""
                async function executeQuery() {
                    const query = document.getElementById('sql-query').value;
                    const output = document.getElementById('query-output');

                    try {
                        const response = await fetch('/admin/sql/execute', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: `query=${'$'}{encodeURIComponent(query)}`
                        });

                        const result = await response.json();

                        if (result.data) {
                            output.innerHTML = `
                                <p>Query executed successfully. Rows: ${'$'}{result.data.length}</p>
                                <pre>${'$'}{JSON.stringify(result.data, null, 2)}</pre>
                            `;
                        } else if (result.error) {
                            output.innerHTML = `
                                <div class="error">
                                    <strong>Error:</strong> ${'$'}{result.error.message}
                                </div>
                            `;
                        }
                    } catch (error) {
                        output.innerHTML = `
                            <div class="error">
                                <strong>Error:</strong> ${'$'}{error.message}
                            </div>
                        `;
                    }
                }

                function clearEditor() {
                    document.getElementById('sql-query').value = '';
                    document.getElementById('query-output').innerHTML = '<p>No results yet</p>';
                }

                function formatQuery() {
                    const query = document.getElementById('sql-query').value;
                    // Basic SQL formatting
                    const formatted = query
                        .replace(/SELECT/gi, 'SELECT')
                        .replace(/FROM/gi, '\nFROM')
                        .replace(/WHERE/gi, '\nWHERE')
                        .replace(/ORDER BY/gi, '\nORDER BY')
                        .replace(/LIMIT/gi, '\nLIMIT');
                    document.getElementById('sql-query').value = formatted;
                }
                """.trimIndent()
            }
        }
    }

    private fun DIV.usersContent() {
        div(classes = "users-manager") {
            div(classes = "users-toolbar") {
                input(type = InputType.search, classes = "search-input") {
                    placeholder = "Search users..."
                    id = "user-search"
                    onKeyUp = "searchUsers()"
                }
                button(classes = "btn btn-primary") {
                    onClick = "inviteUser()"
                    +"➕ Invite User"
                }
            }

            table(classes = "users-table") {
                id = "users-table"
                thead {
                    tr {
                        th { +"Email" }
                        th { +"Created At" }
                        th { +"Last Sign In" }
                        th { +"Status" }
                        th { +"Actions" }
                    }
                }
                tbody {
                    id = "users-tbody"
                    tr {
                        td {
                            colSpan = "5"
                            +"Loading users..."
                        }
                    }
                }
            }
        }

        script {
            unsafe {
                +"""
                async function loadUsers() {
                    const response = await fetch('/admin/api/users');
                    const result = await response.json();
                    const tbody = document.getElementById('users-tbody');

                    if (result.data) {
                        tbody.innerHTML = result.data.map(user => `
                            <tr>
                                <td>${'$'}{user.email}</td>
                                <td>${'$'}{new Date(user.created_at).toLocaleString()}</td>
                                <td>${'$'}{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}</td>
                                <td>
                                    <span class="badge ${'$'}{user.banned ? 'badge-danger' : 'badge-success'}">
                                        ${'$'}{user.banned ? 'Banned' : 'Active'}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn btn-sm" onclick="viewUser('${'$'}{user.id}')">View</button>
                                    <button class="btn btn-sm btn-danger" onclick="banUser('${'$'}{user.id}')">
                                        ${'$'}{user.banned ? 'Unban' : 'Ban'}
                                    </button>
                                </td>
                            </tr>
                        `).join('');
                    }
                }

                function searchUsers() {
                    const search = document.getElementById('user-search').value.toLowerCase();
                    const rows = document.querySelectorAll('#users-tbody tr');

                    rows.forEach(row => {
                        const text = row.textContent.toLowerCase();
                        row.style.display = text.includes(search) ? '' : 'none';
                    });
                }

                loadUsers();
                """.trimIndent()
            }
        }
    }

    private fun DIV.storageContent() {
        div(classes = "storage-browser") {
            div(classes = "buckets-list") {
                h3 { +"Buckets" }
                div {
                    id = "buckets-list"
                    +"Loading buckets..."
                }
                button(classes = "btn btn-primary") {
                    onClick = "createBucket()"
                    +"➕ Create Bucket"
                }
            }
        }

        script {
            unsafe {
                +"""
                async function loadBuckets() {
                    const response = await fetch('/admin/api/buckets');
                    const result = await response.json();
                    const list = document.getElementById('buckets-list');

                    if (result.data) {
                        list.innerHTML = result.data.map(bucket => `
                            <div class="bucket-item">
                                <a href="/admin/storage/buckets/${'$'}{bucket.name}">
                                    📦 ${'$'}{bucket.name}
                                </a>
                                <span class="badge">
                                    ${'$'}{bucket.public ? 'Public' : 'Private'}
                                </span>
                            </div>
                        `).join('');
                    }
                }

                loadBuckets();
                """.trimIndent()
            }
        }
    }

    private fun DIV.bucketBrowserContent(bucket: String) {
        div(classes = "bucket-browser") {
            div(classes = "bucket-toolbar") {
                button(classes = "btn btn-primary") {
                    onClick = "uploadFile()"
                    +"📤 Upload File"
                }
                button(classes = "btn btn-danger") {
                    onClick = "deleteSelected()"
                    +"🗑️ Delete Selected"
                }
            }

            div(classes = "files-grid") {
                id = "files-grid"
                +"Loading files..."
            }
        }

        script {
            unsafe {
                +"""
                const bucket = '$bucket';

                async function loadFiles() {
                    const response = await fetch(`/admin/api/buckets/${'$'}{bucket}/files`);
                    const result = await response.json();
                    const grid = document.getElementById('files-grid');

                    if (result.data) {
                        grid.innerHTML = result.data.map(file => `
                            <div class="file-card">
                                <div class="file-icon">
                                    ${'$'}{getFileIcon(file.mime_type)}
                                </div>
                                <div class="file-info">
                                    <p class="file-name">${'$'}{file.name}</p>
                                    <p class="file-size">${'$'}{formatBytes(file.size)}</p>
                                </div>
                                <input type="checkbox" class="file-select" value="${'$'}{file.id}">
                            </div>
                        `).join('');
                    }
                }

                function getFileIcon(mimeType) {
                    if (mimeType.startsWith('image/')) return '🖼️';
                    if (mimeType.startsWith('video/')) return '🎥';
                    if (mimeType.startsWith('audio/')) return '🎵';
                    if (mimeType === 'application/pdf') return '📄';
                    return '📎';
                }

                function formatBytes(bytes) {
                    if (bytes === 0) return '0 Bytes';
                    const k = 1024;
                    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                    const i = Math.floor(Math.log(bytes) / Math.log(k));
                    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
                }

                loadFiles();
                """.trimIndent()
            }
        }
    }

    private fun DIV.functionsContent() {
        div(classes = "functions-manager") {
            div(classes = "functions-toolbar") {
                button(classes = "btn btn-primary") {
                    onClick = "deployFunction()"
                    +"🚀 Deploy Function"
                }
            }

            div(classes = "functions-list") {
                id = "functions-list"
                +"Loading functions..."
            }
        }

        script {
            unsafe {
                +"""
                async function loadFunctions() {
                    const response = await fetch('/admin/api/functions');
                    const result = await response.json();
                    const list = document.getElementById('functions-list');

                    if (result.data) {
                        list.innerHTML = result.data.map(func => `
                            <div class="function-card">
                                <h4>${'$'}{func.name}</h4>
                                <p>Runtime: ${'$'}{func.runtime}</p>
                                <div class="function-actions">
                                    <a href="/admin/functions/${'$'}{func.name}/logs" class="btn btn-sm">
                                        📋 Logs
                                    </a>
                                    <button class="btn btn-sm btn-primary" onclick="invokeFunction('${'$'}{func.name}')">
                                        ▶️ Invoke
                                    </button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteFunction('${'$'}{func.name}')">
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        `).join('');
                    }
                }

                loadFunctions();
                """.trimIndent()
            }
        }
    }

    private fun DIV.functionLogsContent(name: String) {
        div(classes = "function-logs") {
            div(classes = "logs-header") {
                button(classes = "btn btn-secondary") {
                    onClick = "refreshLogs()"
                    +"🔄 Refresh"
                }
                button(classes = "btn") {
                    onClick = "clearLogs()"
                    +"🗑️ Clear"
                }
            }

            div(classes = "logs-container") {
                id = "logs-container"
                +"Loading logs..."
            }
        }

        script {
            unsafe {
                +"""
                const functionName = '$name';

                async function refreshLogs() {
                    const response = await fetch(`/admin/api/functions/${'$'}{functionName}/logs`);
                    const result = await response.json();
                    const container = document.getElementById('logs-container');

                    if (result.data) {
                        container.innerHTML = result.data.map(log => `
                            <div class="log-entry ${'$'}{log.status.toLowerCase()}">
                                <span class="log-time">${'$'}{new Date(log.createdAt).toLocaleString()}</span>
                                <span class="log-status">${'$'}{log.status}</span>
                                <span class="log-time">${'$'}{log.executionTime}ms</span>
                                ${'$'}{log.errorMessage ? `<div class="log-error">${'$'}{log.errorMessage}</div>` : ''}
                            </div>
                        `).join('');
                    }
                }

                refreshLogs();
                setInterval(refreshLogs, 5000); // Auto-refresh every 5 seconds
                """.trimIndent()
            }
        }
    }

    private fun DIV.analyticsContent() {
        div(classes = "analytics-dashboard") {
            div(classes = "charts-grid") {
                div(classes = "chart-card") {
                    h3 { +"Daily Active Users" }
                    canvas { id = "dau-chart" }
                }
                div(classes = "chart-card") {
                    h3 { +"Storage Growth" }
                    canvas { id = "storage-chart" }
                }
                div(classes = "chart-card") {
                    h3 { +"Function Invocations" }
                    canvas { id = "functions-chart" }
                }
                div(classes = "chart-card") {
                    h3 { +"API Response Times" }
                    canvas { id = "response-times-chart" }
                }
            }
        }

        script {
            unsafe {
                +"""
                // Initialize charts with Chart.js
                const chartConfig = {
                    type: 'line',
                    data: {
                        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                        datasets: [{
                            label: 'Users',
                            data: [65, 59, 80, 81, 56, 55, 40],
                            borderColor: 'rgb(75, 192, 192)',
                            tension: 0.1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false
                    }
                };

                new Chart(document.getElementById('dau-chart'), chartConfig);
                """.trimIndent()
            }
        }
    }

    private fun DIV.settingsContent() {
        div(classes = "settings-panel") {
            div(classes = "settings-section") {
                h3 { +"General Settings" }
                form {
                    div(classes = "form-group") {
                        label { +"Site Name" }
                        input(type = InputType.text, classes = "form-control") {
                            value = "Elidebase"
                        }
                    }
                    div(classes = "form-group") {
                        label { +"API URL" }
                        input(type = InputType.url, classes = "form-control") {
                            value = "http://localhost:8000"
                        }
                    }
                }
            }

            div(classes = "settings-section") {
                h3 { +"Authentication" }
                div(classes = "form-group") {
                    label {
                        input(type = InputType.checkBox) {
                            checked = true
                        }
                        +" Enable email/password authentication"
                    }
                }
                div(classes = "form-group") {
                    label {
                        input(type = InputType.checkBox) {
                            checked = false
                        }
                        +" Enable magic link authentication"
                    }
                }
            }

            div(classes = "settings-section") {
                h3 { +"Storage" }
                div(classes = "form-group") {
                    label { +"Max file size (MB)" }
                    input(type = InputType.number, classes = "form-control") {
                        value = "50"
                    }
                }
            }

            button(classes = "btn btn-primary") {
                +"💾 Save Settings"
            }
        }
    }

    private fun getSystemStats(): Map<String, Any> {
        return mapOf(
            "users" to 1234,
            "posts" to 5678,
            "storage" to "2.3 GB",
            "connections" to realtimeServer.getStats()["connections"] ?: 0
        )
    }
}

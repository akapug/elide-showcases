/**
 * Build Script DSL for Elide - Gradle/Maven alternative
 *
 * Type-safe build configuration in Kotlin:
 * - Dependency management
 * - Task definition
 * - Plugin system
 * - Multi-project builds
 */

package elide.dsl.build

import java.io.File

/**
 * Project configuration
 */
class Project(val name: String) {
    var group: String = ""
    var version: String = "1.0.0"
    var description: String = ""

    val dependencies = Dependencies()
    val tasks = Tasks()
    val repositories = Repositories()
    val plugins = Plugins()

    var sourceDir: String = "src/main/kotlin"
    var testDir: String = "src/test/kotlin"
    var outputDir: String = "build"
    var resourcesDir: String = "src/main/resources"

    fun dependencies(block: Dependencies.() -> Unit) {
        dependencies.block()
    }

    fun tasks(block: Tasks.() -> Unit) {
        tasks.block()
    }

    fun repositories(block: Repositories.() -> Unit) {
        repositories.block()
    }

    fun plugins(block: Plugins.() -> Unit) {
        plugins.block()
    }
}

/**
 * Dependency management
 */
class Dependencies {
    private val deps = mutableListOf<Dependency>()

    fun implementation(notation: String) {
        deps.add(Dependency("implementation", notation))
    }

    fun api(notation: String) {
        deps.add(Dependency("api", notation))
    }

    fun testImplementation(notation: String) {
        deps.add(Dependency("testImplementation", notation))
    }

    fun runtimeOnly(notation: String) {
        deps.add(Dependency("runtimeOnly", notation))
    }

    fun compileOnly(notation: String) {
        deps.add(Dependency("compileOnly", notation))
    }

    fun getAll(): List<Dependency> = deps
}

data class Dependency(
    val configuration: String,
    val notation: String
)

/**
 * Repository management
 */
class Repositories {
    private val repos = mutableListOf<Repository>()

    fun mavenCentral() {
        repos.add(Repository("mavenCentral", "https://repo1.maven.org/maven2"))
    }

    fun google() {
        repos.add(Repository("google", "https://maven.google.com"))
    }

    fun jcenter() {
        repos.add(Repository("jcenter", "https://jcenter.bintray.com"))
    }

    fun maven(url: String, name: String = "custom") {
        repos.add(Repository(name, url))
    }

    fun getAll(): List<Repository> = repos
}

data class Repository(
    val name: String,
    val url: String
)

/**
 * Plugin management
 */
class Plugins {
    private val plugins = mutableListOf<Plugin>()

    fun kotlin(version: String = "1.9.0") {
        plugins.add(Plugin("org.jetbrains.kotlin.jvm", version))
    }

    fun application() {
        plugins.add(Plugin("application", null))
    }

    fun id(pluginId: String, version: String? = null) {
        plugins.add(Plugin(pluginId, version))
    }

    fun getAll(): List<Plugin> = plugins
}

data class Plugin(
    val id: String,
    val version: String?
)

/**
 * Task management
 */
class Tasks {
    private val tasks = mutableMapOf<String, Task>()

    fun register(name: String, block: Task.() -> Unit) {
        val task = Task(name)
        task.block()
        tasks[name] = task
    }

    fun getAll(): Map<String, Task> = tasks
}

class Task(val name: String) {
    var description: String = ""
    var group: String = ""
    val dependsOn = mutableListOf<String>()
    var action: (() -> Unit)? = null

    fun dependsOn(vararg taskNames: String) {
        dependsOn.addAll(taskNames)
    }

    fun doLast(block: () -> Unit) {
        action = block
    }
}

/**
 * Kotlin compilation configuration
 */
class KotlinCompilation {
    var jvmTarget: String = "17"
    var apiVersion: String = "1.9"
    var languageVersion: String = "1.9"
    val compilerOptions = mutableMapOf<String, Any>()

    fun option(key: String, value: Any) {
        compilerOptions[key] = value
    }
}

/**
 * Build DSL function
 */
fun project(name: String, block: Project.() -> Unit): Project {
    val project = Project(name)
    project.block()
    return project
}

/**
 * Example usage:
 *
 * val myProject = project("my-app") {
 *     group = "com.example"
 *     version = "1.0.0"
 *     description = "My Application"
 *
 *     plugins {
 *         kotlin("1.9.0")
 *         application()
 *     }
 *
 *     repositories {
 *         mavenCentral()
 *         google()
 *     }
 *
 *     dependencies {
 *         implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
 *         implementation("io.ktor:ktor-server-core:2.3.5")
 *         testImplementation("org.jetbrains.kotlin:kotlin-test:1.9.0")
 *     }
 *
 *     tasks {
 *         register("run") {
 *             description = "Run the application"
 *             group = "application"
 *             dependsOn("build")
 *             doLast {
 *                 println("Running application...")
 *             }
 *         }
 *     }
 * }
 */

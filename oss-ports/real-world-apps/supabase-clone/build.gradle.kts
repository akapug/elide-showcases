plugins {
    kotlin("jvm") version "1.9.22" apply false
    kotlin("plugin.serialization") version "1.9.22" apply false
    id("dev.elide") version "1.0.0-alpha9" apply false
}

group = "tools.elide.oss"
version = "1.0.0"

subprojects {
    apply(plugin = "org.jetbrains.kotlin.jvm")
    apply(plugin = "org.jetbrains.kotlin.plugin.serialization")
    apply(plugin = "dev.elide")

    repositories {
        mavenCentral()
        maven("https://maven.pkg.st")
    }

    dependencies {
        val implementation by configurations
        val testImplementation by configurations

        implementation("dev.elide:elide-server:1.0.0-alpha9")
        implementation("dev.elide:elide-embedded:1.0.0-alpha9")
        implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
        implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.2")
        implementation("io.ktor:ktor-server-core:2.3.7")
        implementation("io.ktor:ktor-server-cio:2.3.7")
        implementation("io.ktor:ktor-server-websockets:2.3.7")
        implementation("io.ktor:ktor-server-auth:2.3.7")
        implementation("io.ktor:ktor-server-auth-jwt:2.3.7")
        implementation("io.ktor:ktor-server-content-negotiation:2.3.7")
        implementation("io.ktor:ktor-serialization-kotlinx-json:2.3.7")
        implementation("org.postgresql:postgresql:42.7.1")
        implementation("com.zaxxer:HikariCP:5.1.0")
        implementation("org.jetbrains.exposed:exposed-core:0.46.0")
        implementation("org.jetbrains.exposed:exposed-dao:0.46.0")
        implementation("org.jetbrains.exposed:exposed-jdbc:0.46.0")
        implementation("org.jetbrains.exposed:exposed-java-time:0.46.0")
        implementation("ch.qos.logback:logback-classic:1.4.14")
        implementation("io.github.oshai:kotlin-logging-jvm:6.0.1")

        testImplementation(kotlin("test"))
        testImplementation("io.ktor:ktor-server-test-host:2.3.7")
    }

    kotlin {
        jvmToolchain(21)
    }

    tasks.test {
        useJUnitPlatform()
    }
}

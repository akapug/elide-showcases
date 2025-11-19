plugins {
    kotlin("jvm") version "1.9.22"
    kotlin("plugin.serialization") version "1.9.22"
    id("io.ktor.plugin") version "2.3.7"
    application
}

group = "dev.elide.workflow"
version = "1.0.0"

repositories {
    mavenCentral()
    maven("https://maven.pkg.jetbrains.space/public/p/ktor/eap")
}

dependencies {
    // Kotlin
    implementation("org.jetbrains.kotlin:kotlin-stdlib")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.2")
    implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.5.0")

    // Ktor Server
    implementation("io.ktor:ktor-server-core:2.3.7")
    implementation("io.ktor:ktor-server-netty:2.3.7")
    implementation("io.ktor:ktor-server-content-negotiation:2.3.7")
    implementation("io.ktor:ktor-serialization-kotlinx-json:2.3.7")
    implementation("io.ktor:ktor-server-websockets:2.3.7")
    implementation("io.ktor:ktor-server-auth:2.3.7")
    implementation("io.ktor:ktor-server-auth-jwt:2.3.7")
    implementation("io.ktor:ktor-server-cors:2.3.7")
    implementation("io.ktor:ktor-server-call-logging:2.3.7")
    implementation("io.ktor:ktor-server-status-pages:2.3.7")
    implementation("io.ktor:ktor-server-compression:2.3.7")

    // Database
    implementation("org.jetbrains.exposed:exposed-core:0.44.1")
    implementation("org.jetbrains.exposed:exposed-dao:0.44.1")
    implementation("org.jetbrains.exposed:exposed-jdbc:0.44.1")
    implementation("org.jetbrains.exposed:exposed-java-time:0.44.1")
    implementation("org.postgresql:postgresql:42.7.0")
    implementation("com.zaxxer:HikariCP:5.1.0")

    // Scheduler
    implementation("org.quartz-scheduler:quartz:2.3.2")

    // Encryption
    implementation("com.google.crypto.tink:tink:1.11.0")

    // JWT
    implementation("com.auth0:java-jwt:4.4.0")

    // HTTP Client
    implementation("org.apache.httpcomponents.client5:httpclient5:5.3")

    // Email
    implementation("com.sun.mail:javax.mail:1.6.2")

    // JSON
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin:2.16.0")
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310:2.16.0")

    // Google APIs
    implementation("com.google.apis:google-api-services-sheets:v4-rev20230526-2.0.0")
    implementation("com.google.auth:google-auth-library-oauth2-http:1.20.0")

    // Payment
    implementation("com.stripe:stripe-java:24.5.0")

    // Database Drivers
    implementation("mysql:mysql-connector-java:8.0.33")
    implementation("org.mongodb:mongodb-driver-kotlin-coroutine:4.11.1")

    // Logging
    implementation("org.slf4j:slf4j-api:2.0.9")
    implementation("ch.qos.logback:logback-classic:1.4.14")

    // Configuration
    implementation("com.typesafe:config:1.4.3")

    // Testing
    testImplementation("org.jetbrains.kotlin:kotlin-test")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
    testImplementation("io.ktor:ktor-server-test-host:2.3.7")
    testImplementation("io.mockk:mockk:1.13.8")
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.1")
    testImplementation("io.kotest:kotest-runner-junit5:5.8.0")
    testImplementation("io.kotest:kotest-assertions-core:5.8.0")
}

tasks.test {
    useJUnitPlatform()
}

kotlin {
    jvmToolchain(21)
}

application {
    mainClass.set("dev.elide.workflow.WorkflowApplicationKt")
}

ktor {
    fatJar {
        archiveFileName.set("elide-workflow.jar")
    }
}

tasks.register("runCli", JavaExec::class) {
    group = "application"
    description = "Run the CLI"
    classpath = sourceSets["main"].runtimeClasspath
    mainClass.set("dev.elide.workflow.cli.WorkflowCLIKt")
}

tasks.register("stage") {
    dependsOn("build")
}

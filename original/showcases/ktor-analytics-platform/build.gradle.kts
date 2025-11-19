// Ktor Analytics Platform - Polyglot Data Science Showcase
// Demonstrates Kotlin Ktor + Python pandas/numpy integration via Elide

plugins {
    kotlin("jvm") version "1.9.22"
    kotlin("plugin.serialization") version "1.9.22"
    id("dev.elide") version "1.0.0"
    application
}

group = "dev.elide.showcases"
version = "1.0.0"

repositories {
    mavenCentral()
    maven("https://maven.elide.dev")
}

dependencies {
    // Elide Runtime - enables polyglot Python support
    implementation("dev.elide:elide-core:1.0.0")
    implementation("dev.elide:elide-embedded-python:1.0.0")

    // Ktor Server
    implementation("io.ktor:ktor-server-core:2.3.7")
    implementation("io.ktor:ktor-server-netty:2.3.7")
    implementation("io.ktor:ktor-server-websockets:2.3.7")
    implementation("io.ktor:ktor-server-content-negotiation:2.3.7")
    implementation("io.ktor:ktor-server-cors:2.3.7")
    implementation("io.ktor:ktor-server-compression:2.3.7")
    implementation("io.ktor:ktor-server-caching-headers:2.3.7")
    implementation("io.ktor:ktor-server-call-logging:2.3.7")
    implementation("io.ktor:ktor-server-status-pages:2.3.7")
    implementation("io.ktor:ktor-server-auth:2.3.7")
    implementation("io.ktor:ktor-server-metrics:2.3.7")

    // Ktor Client (for testing and examples)
    implementation("io.ktor:ktor-client-core:2.3.7")
    implementation("io.ktor:ktor-client-cio:2.3.7")
    implementation("io.ktor:ktor-client-websockets:2.3.7")
    implementation("io.ktor:ktor-client-content-negotiation:2.3.7")

    // Serialization
    implementation("io.ktor:ktor-serialization-kotlinx-json:2.3.7")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.2")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-jdk8:1.7.3")

    // DateTime
    implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.5.0")

    // Logging
    implementation("ch.qos.logback:logback-classic:1.4.14")
    implementation("io.github.oshai:kotlin-logging-jvm:5.1.0")

    // Monitoring & Metrics
    implementation("io.prometheus:simpleclient:0.16.0")
    implementation("io.prometheus:simpleclient_hotspot:0.16.0")

    // Caching
    implementation("com.github.ben-manes.caffeine:caffeine:3.1.8")

    // Testing
    testImplementation(kotlin("test"))
    testImplementation("io.ktor:ktor-server-tests:2.3.7")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
    testImplementation("io.mockk:mockk:1.13.8")
}

elide {
    python {
        // Python data science dependencies managed by Elide
        pip {
            install("pandas", "2.1.4")         // DataFrames and data manipulation
            install("numpy", "1.26.3")          // Numerical computing
            install("scipy", "1.11.4")          // Scientific computing
            install("statsmodels", "0.14.1")    // Statistical models
            install("plotly", "5.18.0")         // Interactive visualizations
            install("scikit-learn", "1.4.0")    // Machine learning
            install("matplotlib", "3.8.2")      // Static plots
            install("seaborn", "0.13.1")        // Statistical visualizations
            install("pyarrow", "14.0.2")        // Parquet file support
            install("sqlalchemy", "2.0.25")     // SQL database support
            install("prophet", "1.1.5")         // Time series forecasting
        }
    }
}

application {
    mainClass.set("dev.elide.showcases.ktor.analytics.ApplicationKt")
}

kotlin {
    jvmToolchain(17)
}

tasks.test {
    useJUnitPlatform()
}

tasks.named<JavaExec>("run") {
    standardInput = System.`in`
}

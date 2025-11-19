import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    id("org.springframework.boot") version "3.2.0"
    id("io.spring.dependency-management") version "1.1.4"
    kotlin("jvm") version "1.9.21"
    kotlin("plugin.spring") version "1.9.21"
    kotlin("plugin.jpa") version "1.9.21"
    kotlin("plugin.serialization") version "1.9.21"
    id("dev.elide") version "1.0.0-alpha9"
}

group = "com.example.mlplatform"
version = "1.0.0-SNAPSHOT"
java.sourceCompatibility = JavaVersion.VERSION_21

repositories {
    mavenCentral()
    maven { url = uri("https://maven.elide.dev") }
    maven { url = uri("https://repo.spring.io/milestone") }
}

dependencies {
    // Spring Boot Core
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-cache")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-data-redis")

    // Kotlin
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-reactor:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.2")

    // Elide Polyglot Runtime - The Magic!
    implementation("dev.elide:elide-runtime-jvm:1.0.0-alpha9")
    implementation("dev.elide:elide-graalvm:1.0.0-alpha9")
    implementation("dev.elide:elide-python:1.0.0-alpha9")

    // Python ML Libraries (imported via Elide)
    // These are available in Kotlin via: import sklearn from 'python:sklearn'
    elide("python:scikit-learn:1.3.2")
    elide("python:tensorflow:2.15.0")
    elide("python:pandas:2.1.4")
    elide("python:numpy:1.26.2")
    elide("python:prophet:1.1.5")
    elide("python:xgboost:2.0.3")
    elide("python:lightgbm:4.1.0")
    elide("python:transformers:4.35.2")
    elide("python:torch:2.1.2")

    // Database
    runtimeOnly("org.postgresql:postgresql")
    implementation("com.h2database:h2")
    implementation("org.flywaydb:flyway-core")

    // Redis & Caching
    implementation("io.lettuce:lettuce-core")

    // AWS SDK for model storage
    implementation(platform("software.amazon.awssdk:bom:2.21.0"))
    implementation("software.amazon.awssdk:s3")
    implementation("software.amazon.awssdk:sagemaker")

    // Monitoring & Metrics
    implementation("io.micrometer:micrometer-registry-prometheus")
    implementation("io.micrometer:micrometer-tracing-bridge-brave")

    // Logging
    implementation("io.github.microutils:kotlin-logging-jvm:3.0.5")

    // Testing
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.mockk:mockk:1.13.8")
    testImplementation("org.testcontainers:testcontainers:1.19.3")
    testImplementation("org.testcontainers:postgresql:1.19.3")
    testImplementation("com.ninja-squad:springmockk:4.0.2")
}

tasks.withType<KotlinCompile> {
    kotlinOptions {
        freeCompilerArgs = listOf("-Xjsr305=strict", "-Xcontext-receivers")
        jvmTarget = "21"
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
    jvmArgs = listOf(
        "--add-opens", "java.base/java.lang=ALL-UNNAMED",
        "--add-opens", "java.base/java.util=ALL-UNNAMED"
    )
}

elide {
    polyglot {
        python {
            enabled = true
            version = "3.11"
            packageManager = "pip"
            warmUp = true
            importCache = true
        }
    }

    native {
        enabled = true
        agent = true
    }
}

tasks.register<JavaExec>("benchmark") {
    group = "verification"
    description = "Run ML performance benchmarks"
    classpath = sourceSets["main"].runtimeClasspath
    mainClass.set("com.example.mlplatform.BenchmarkKt")
}

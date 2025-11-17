plugins {
    kotlin("jvm")
    kotlin("plugin.serialization")
}

dependencies {
    api("io.ktor:ktor-server-core:2.3.7")
    api("io.ktor:ktor-server-auth:2.3.7")
    api("io.ktor:ktor-server-auth-jwt:2.3.7")
    api("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.2")
    api("org.jetbrains.exposed:exposed-core:0.46.0")
    api("org.jetbrains.exposed:exposed-dao:0.46.0")
    api("org.jetbrains.exposed:exposed-jdbc:0.46.0")
    api("org.jetbrains.exposed:exposed-java-time:0.46.0")
}

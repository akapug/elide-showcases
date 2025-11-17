plugins {
    kotlin("jvm")
    kotlin("plugin.serialization")
}

dependencies {
    implementation(project(":core"))
    implementation("com.zaxxer:HikariCP:5.1.0")
    implementation("org.postgresql:postgresql:42.7.1")
    implementation("io.ktor:ktor-server-core:2.3.7")
    implementation("io.ktor:ktor-server-websockets:2.3.7")
}

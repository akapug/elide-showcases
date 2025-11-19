plugins {
    kotlin("jvm")
    kotlin("plugin.serialization")
}

dependencies {
    implementation(project(":core"))
    implementation(project(":database"))
    implementation(project(":auth"))
    implementation(project(":storage"))
    implementation(project(":realtime"))
    implementation(project(":functions"))
    implementation("io.ktor:ktor-server-core:2.3.7")
    implementation("io.ktor:ktor-server-html-builder:2.3.7")
}

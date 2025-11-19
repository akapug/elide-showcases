plugins {
    kotlin("jvm")
    kotlin("plugin.serialization")
    application
}

dependencies {
    implementation(project(":core"))
    implementation(project(":database"))
    implementation(project(":auth"))
    implementation(project(":storage"))
    implementation(project(":functions"))
    implementation("com.github.ajalt.clikt:clikt:4.2.1")
}

application {
    mainClass.set("tools.elide.oss.elidebase.cli.MainKt")
}

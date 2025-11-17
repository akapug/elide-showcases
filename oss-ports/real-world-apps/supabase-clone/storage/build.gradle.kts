plugins {
    kotlin("jvm")
    kotlin("plugin.serialization")
}

dependencies {
    implementation(project(":core"))
    implementation(project(":database"))
    implementation("io.ktor:ktor-server-core:2.3.7")
    implementation("javax.imageio:imageio-core:3.10.1")
    implementation("com.twelvemonkeys.imageio:imageio-jpeg:3.10.1")
    implementation("com.twelvemonkeys.imageio:imageio-webp:3.10.1")
}

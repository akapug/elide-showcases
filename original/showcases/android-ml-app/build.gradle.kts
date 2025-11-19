// Top-level build file for Android ML App showcase
plugins {
    id("com.android.application") version "8.2.0" apply false
    id("org.jetbrains.kotlin.android") version "1.9.21" apply false
    id("dev.elide.buildtools") version "1.0.0" apply false
}

buildscript {
    repositories {
        google()
        mavenCentral()
        maven("https://repo.elide.dev/releases")
    }

    dependencies {
        classpath("com.android.tools.build:gradle:8.2.0")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.21")
        classpath("dev.elide:gradle-plugin:1.0.0")
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
        maven("https://repo.elide.dev/releases")
        maven("https://repo.elide.dev/python-mobile")
    }
}

tasks.register("clean", Delete::class) {
    delete(rootProject.buildDir)
}

// Configuration for Python ML libraries on Android
extra["pythonVersion"] = "3.11"
extra["pytorchVersion"] = "2.1.0"
extra["tensorflowVersion"] = "2.14.0"
extra["opencvVersion"] = "4.8.0"
extra["numpyVersion"] = "1.24.0"

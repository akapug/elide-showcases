plugins {
    id("com.android.application")
    kotlin("android")
    id("dev.elide.buildtools")
}

android {
    namespace = "com.example.androidml"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.example.androidml"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        vectorDrawables {
            useSupportLibrary = true
        }

        ndk {
            abiFilters += listOf("arm64-v8a", "armeabi-v7a", "x86_64")
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            isDebuggable = true
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
        freeCompilerArgs += listOf(
            "-Xopt-in=kotlin.RequiresOptIn",
            "-Xcontext-receivers"
        )
    }

    buildFeatures {
        compose = true
        viewBinding = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.7"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
            excludes += "/META-INF/versions/9/OSGI-INF/MANIFEST.MF"
        }
    }

    splits {
        abi {
            isEnable = true
            reset()
            include("arm64-v8a", "armeabi-v7a", "x86_64")
            isUniversalApk = false
        }
    }
}

elide {
    python {
        enabled = true
        version = "3.11"

        packages {
            // Deep Learning
            include("torch", "2.1.0")
            include("torchvision", "0.16.0")
            include("tensorflow", "2.14.0")
            include("keras", "2.14.0")

            // Computer Vision
            include("opencv-python", "4.8.0")
            include("pillow", "10.1.0")

            // Scientific Computing
            include("numpy", "1.24.0")
            include("scipy", "1.11.0")

            // OCR
            include("pytesseract", "0.3.10")
            include("easyocr", "1.7.0")

            // Utilities
            include("pandas", "2.1.0")
            include("scikit-learn", "1.3.0")
        }

        optimizations {
            quantization = true
            pruning = true
            coreMLConversion = false // Android-specific
        }
    }
}

dependencies {
    // Elide Runtime
    implementation("dev.elide:elide-runtime-android:1.0.0")
    implementation("dev.elide:elide-python-bridge:1.0.0")

    // Python ML Libraries (mobile-optimized)
    implementation("dev.elide.python:pytorch-mobile:2.1.0")
    implementation("dev.elide.python:torchvision-mobile:0.16.0")
    implementation("dev.elide.python:tensorflow-lite:2.14.0")
    implementation("dev.elide.python:opencv-mobile:4.8.0")
    implementation("dev.elide.python:numpy-mobile:1.24.0")

    // AndroidX Core
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.6.2")
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.6.2")

    // Compose
    implementation(platform("androidx.compose:compose-bom:2023.10.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.activity:activity-compose:1.8.1")

    // Camera
    implementation("androidx.camera:camera-camera2:1.3.0")
    implementation("androidx.camera:camera-lifecycle:1.3.0")
    implementation("androidx.camera:camera-view:1.3.0")
    implementation("androidx.camera:camera-extensions:1.3.0")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")

    // Testing
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlin:kotlin-test:1.9.21")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
    androidTestImplementation(platform("androidx.compose:compose-bom:2023.10.01"))
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}

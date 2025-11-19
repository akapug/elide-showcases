# Android ML App Tutorial

## Table of Contents
1. [Getting Started](#getting-started)
2. [Basic Image Classification](#basic-image-classification)
3. [Real-time Object Detection](#real-time-object-detection)
4. [OCR and Text Recognition](#ocr-and-text-recognition)
5. [Face Detection and Recognition](#face-detection-and-recognition)
6. [Advanced Topics](#advanced-topics)
7. [Performance Optimization](#performance-optimization)
8. [Deployment](#deployment)

## Getting Started

### Prerequisites

Before you begin, ensure you have:
- Android Studio Arctic Fox or later
- Android SDK 26 (Oreo) or higher
- Elide SDK installed
- Basic knowledge of Kotlin and Android development

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/elide-dev/android-ml-showcase
cd android-ml-showcase
```

2. **Install Elide SDK**
```bash
./gradlew installElide
```

3. **Download sample models**
```bash
./scripts/download_models.sh
```

4. **Build the project**
```bash
./gradlew build
```

### Project Structure

```
android-ml-app/
├── src/main/kotlin/
│   ├── MainActivity.kt              # Main activity
│   ├── ml/                          # ML components
│   │   ├── ImageClassifier.kt       # Image classification
│   │   ├── ObjectDetector.kt        # Object detection
│   │   ├── TextRecognizer.kt        # OCR
│   │   └── FaceDetector.kt          # Face detection
│   ├── camera/
│   │   └── CameraService.kt         # Camera integration
│   ├── ui/
│   │   └── ResultsView.kt           # UI components
│   └── utils/
│       └── ModelManager.kt          # Model management
├── examples/                        # Usage examples
├── benchmarks/                      # Performance tests
└── models/                          # ML models directory
```

## Basic Image Classification

### Step 1: Initialize the Classifier

```kotlin
import com.example.androidml.ml.ImageClassifier
import com.example.androidml.utils.ModelManager

class MyActivity : AppCompatActivity() {
    private lateinit var modelManager: ModelManager
    private lateinit var classifier: ImageClassifier

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Initialize model manager
        modelManager = ModelManager(this)
        
        // Initialize classifier
        classifier = ImageClassifier(modelManager)
    }
}
```

### Step 2: Classify an Image

```kotlin
fun classifyImage(bitmap: Bitmap) {
    lifecycleScope.launch {
        // Classify image
        val results = classifier.classify(
            bitmap = bitmap,
            topK = 5,
            threshold = 0.1f
        )
        
        // Display results
        results.forEach { result ->
            println("${result.label}: ${result.confidence}")
        }
    }
}
```

### Step 3: Using Different Models

```kotlin
// Use MobileNetV2 (fast, lightweight)
val resultsMobile = classifier.classifyWithModel(
    bitmap = bitmap,
    modelName = "mobilenet_v2",
    topK = 5
)

// Use ResNet50 (more accurate, slower)
val resultsResnet = classifier.classifyWithModel(
    bitmap = bitmap,
    modelName = "resnet50",
    topK = 5
)

// Use EfficientNet (best accuracy/speed trade-off)
val resultsEfficient = classifier.classifyWithModel(
    bitmap = bitmap,
    modelName = "efficientnet_b0",
    topK = 5
)
```

### Step 4: Ensemble Classification

For better accuracy, use multiple models:

```kotlin
val ensembleResults = classifier.classifyEnsemble(
    bitmap = bitmap,
    models = listOf("mobilenet_v2", "resnet50", "efficientnet"),
    topK = 5
)
```

## Real-time Object Detection

### Step 1: Initialize the Detector

```kotlin
import com.example.androidml.ml.ObjectDetector

class DetectionActivity : AppCompatActivity() {
    private lateinit var detector: ObjectDetector
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val modelManager = ModelManager(this)
        detector = ObjectDetector(modelManager)
    }
}
```

### Step 2: Detect Objects

```kotlin
suspend fun detectObjects(frame: Bitmap) {
    val detections = detector.detect(
        bitmap = frame,
        confidenceThreshold = 0.5f,
        nmsThreshold = 0.4f
    )
    
    detections.forEach { detection ->
        println("Found ${detection.label} at ${detection.bbox}")
        println("Confidence: ${detection.confidence}")
    }
}
```

### Step 3: Filter by Object Class

```kotlin
// Only detect people and cars
val filtered = detector.detect(
    bitmap = frame,
    confidenceThreshold = 0.5f,
    classFilter = listOf("person", "car", "bicycle")
)
```

### Step 4: Draw Bounding Boxes

```kotlin
fun drawBoundingBoxes(
    canvas: Canvas,
    detections: List<Detection>,
    scaleX: Float,
    scaleY: Float
) {
    val paint = Paint().apply {
        style = Paint.Style.STROKE
        strokeWidth = 3f
    }
    
    detections.forEach { detection ->
        val bbox = detection.bbox
        
        // Set color based on class
        paint.color = getColorForClass(detection.label)
        
        // Draw bounding box
        canvas.drawRect(
            bbox.x * scaleX,
            bbox.y * scaleY,
            (bbox.x + bbox.width) * scaleX,
            (bbox.y + bbox.height) * scaleY,
            paint
        )
        
        // Draw label
        drawLabel(canvas, detection.label, detection.confidence, bbox)
    }
}
```

### Step 5: Object Tracking

```kotlin
class TrackingActivity : AppCompatActivity() {
    private val tracker = ObjectDetector.ObjectTracker()
    
    fun processFrame(frame: Bitmap) {
        lifecycleScope.launch {
            val detections = detector.detect(frame)
            val tracked = tracker.update(detections)
            
            tracked.forEach { obj ->
                println("Track ${obj.trackId}: ${obj.detection.label}")
            }
        }
    }
}
```

## OCR and Text Recognition

### Step 1: Initialize Text Recognizer

```kotlin
import com.example.androidml.ml.TextRecognizer

val recognizer = TextRecognizer(modelManager)
```

### Step 2: Recognize Text

```kotlin
suspend fun recognizeText(image: Bitmap) {
    // Simple text recognition
    val text = recognizer.recognize(
        bitmap = image,
        languages = listOf("en"),
        engine = TextRecognizer.OCREngine.EASY_OCR
    )
    
    println("Recognized text: $text")
}
```

### Step 3: Get Detailed Results

```kotlin
suspend fun getDetailedOCR(image: Bitmap) {
    val regions = recognizer.recognizeDetailed(
        bitmap = image,
        languages = listOf("en")
    )
    
    regions.forEach { region ->
        println("Text: ${region.text}")
        println("Confidence: ${region.confidence}")
        println("Position: ${region.bbox}")
    }
}
```

### Step 4: Multi-language Recognition

```kotlin
// Recognize text in multiple languages
val multilingualText = recognizer.recognize(
    bitmap = image,
    languages = listOf("en", "es", "fr", "de", "ja", "ko"),
    engine = TextRecognizer.OCREngine.EASY_OCR
)
```

### Step 5: Real-time Translation

```kotlin
suspend fun translateSign(image: Bitmap) {
    val translated = recognizer.translateText(
        bitmap = image,
        sourceLang = "es",
        targetLang = "en"
    )
    
    translated.forEach { region ->
        println("Original: ${region.original}")
        println("Translated: ${region.translated}")
    }
}
```

## Face Detection and Recognition

### Step 1: Initialize Face Detector

```kotlin
import com.example.androidml.ml.FaceDetector

val faceDetector = FaceDetector(modelManager)
```

### Step 2: Detect Faces

```kotlin
suspend fun detectFaces(image: Bitmap) {
    val faces = faceDetector.detect(
        bitmap = image,
        minConfidence = 0.9f,
        includeLandmarks = true,
        includeAttributes = true
    )
    
    faces.forEach { face ->
        println("Face detected:")
        println("  Confidence: ${face.confidence}")
        println("  Age: ${face.age}")
        println("  Gender: ${face.gender}")
        println("  Emotion: ${face.emotion}")
    }
}
```

### Step 3: Register Faces for Recognition

```kotlin
suspend fun registerPerson(name: String, photo: Bitmap) {
    val faces = faceDetector.detect(photo)
    
    if (faces.isNotEmpty()) {
        faceDetector.registerFace(name, photo, faces.first())
        println("Registered: $name")
    }
}
```

### Step 4: Recognize Faces

```kotlin
suspend fun recognizePeople(image: Bitmap) {
    val faces = faceDetector.detect(image)
    
    faces.forEach { face ->
        val name = faceDetector.recognizeFace(
            bitmap = image,
            face = face,
            threshold = 0.6f
        )
        
        println("Recognized: ${name ?: "Unknown person"}")
    }
}
```

## Advanced Topics

### Custom Model Integration

```kotlin
import torch from 'python:torch'

class CustomModelActivity : AppCompatActivity() {
    private lateinit var customModel: PyObject
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Load custom PyTorch model
        customModel = torch.jit.load("my_custom_model.pt")
        customModel.eval()
    }
    
    suspend fun runCustomInference(input: Bitmap): Result {
        return withContext(Dispatchers.Default) {
            // Preprocess
            val tensor = preprocessImage(input)
            
            // Inference
            val output = torch.no_grad {
                customModel.forward(tensor)
            }
            
            // Postprocess
            postprocessOutput(output)
        }
    }
}
```

### Multi-Model Pipeline

```kotlin
class MLPipeline(context: Context) {
    private val modelManager = ModelManager(context)
    private val detector = ObjectDetector(modelManager)
    private val classifier = ImageClassifier(modelManager)
    private val recognizer = TextRecognizer(modelManager)
    
    suspend fun analyzeScene(image: Bitmap): SceneAnalysis {
        // Step 1: Detect objects
        val objects = detector.detect(image)
        
        // Step 2: Classify scene
        val scene = classifier.classify(image, topK = 1).firstOrNull()
        
        // Step 3: Extract text
        val text = recognizer.recognize(image)
        
        return SceneAnalysis(
            sceneType = scene?.label,
            objects = objects.map { it.label },
            text = text
        )
    }
}
```

### Real-time Camera Processing

```kotlin
class CameraMLActivity : AppCompatActivity() {
    private lateinit var cameraService: CameraService
    private lateinit var detector: ObjectDetector
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val modelManager = ModelManager(this)
        detector = ObjectDetector(modelManager)
        cameraService = CameraService(this, this)
        
        cameraService.startCamera { frame ->
            processFrame(frame)
        }
    }
    
    private fun processFrame(frame: Bitmap) {
        lifecycleScope.launch {
            val detections = detector.detect(frame)
            updateUI(detections)
        }
    }
}
```

## Performance Optimization

### Model Quantization

```kotlin
// Quantize model for faster inference
val optimizedModel = modelManager.optimizeModel(
    modelName = "mobilenet_v2.pt",
    quantize = true,
    prune = false
)
```

### Batch Processing

```kotlin
// Process multiple images at once
val images = listOf(image1, image2, image3, image4)
val results = classifier.classifyBatch(images, topK = 3)
```

### GPU Acceleration

```kotlin
import torch from 'python:torch'

// Check for GPU availability
val device = if (torch.cuda.is_available()) "cuda" else "cpu"
println("Using device: $device")

// Move model to GPU
model.to(device)
```

### Frame Skipping

```kotlin
class OptimizedCameraService {
    private var frameCount = 0
    private val skipFrames = 2  // Process every 3rd frame
    
    fun processFrame(frame: Bitmap) {
        if (frameCount++ % skipFrames == 0) {
            runMLInference(frame)
        }
    }
}
```

## Deployment

### APK Optimization

```kotlin
// build.gradle.kts
android {
    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    
    splits {
        abi {
            isEnable = true
            reset()
            include("arm64-v8a", "armeabi-v7a")
            isUniversalApk = false
        }
    }
}
```

### Model Delivery

```kotlin
// Use Google Play Asset Delivery for large models
class ModelDelivery(private val context: Context) {
    fun downloadModel(modelName: String) {
        val assetPackManager = AssetPackManagerFactory.getInstance(context)
        
        val request = assetPackManager.newBuilder()
            .addAssetPack(modelName)
            .build()
        
        assetPackManager.fetch(request)
            .addOnSuccessListener { states ->
                println("Model downloaded: $modelName")
            }
    }
}
```

### Testing

```kotlin
class MLModelTest {
    @Test
    fun testImageClassification() = runBlocking {
        val modelManager = ModelManager(context)
        val classifier = ImageClassifier(modelManager)
        
        val testImage = loadTestImage()
        val results = classifier.classify(testImage)
        
        assertNotNull(results)
        assertTrue(results.isNotEmpty())
        assertTrue(results.first().confidence > 0.5f)
    }
    
    @Test
    fun testPerformance() = runBlocking {
        val classifier = ImageClassifier(modelManager)
        val testImage = loadTestImage()
        
        val times = (0..100).map {
            measureTimeMillis {
                classifier.classify(testImage)
            }
        }
        
        val avgTime = times.average()
        assertTrue(avgTime < 50, "Inference too slow: ${avgTime}ms")
    }
}
```

## Best Practices

### 1. Memory Management

```kotlin
class MemoryAwareActivity : AppCompatActivity() {
    override fun onStop() {
        super.onStop()
        // Release models when not in use
        modelManager.clearCache()
    }
    
    override fun onLowMemory() {
        super.onLowMemory()
        // Free up memory
        modelManager.cleanupOldModels()
    }
}
```

### 2. Error Handling

```kotlin
suspend fun safeInference(image: Bitmap): Result<List<Detection>> {
    return try {
        val detections = detector.detect(image)
        Result.success(detections)
    } catch (e: Exception) {
        Log.e("ML", "Inference failed", e)
        Result.failure(e)
    }
}
```

### 3. Progressive Loading

```kotlin
class ProgressiveLoader(private val modelManager: ModelManager) {
    suspend fun loadModelsProgressively() {
        // Load lightweight model first
        modelManager.preloadModel("mobilenet_v2")
        
        delay(100)
        
        // Load medium model
        modelManager.preloadModel("yolov5s")
        
        delay(100)
        
        // Load heavy model last
        modelManager.preloadModel("resnet50")
    }
}
```

### 4. Background Processing

```kotlin
class BackgroundMLService : Service() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        scope.launch {
            processImages()
        }
        return START_STICKY
    }
    
    private suspend fun processImages() {
        // Process images in background
    }
}
```

## Troubleshooting

### Common Issues

**Issue 1: Out of Memory**
```kotlin
// Solution: Enable model quantization
val optimized = modelManager.optimizeModel(
    "large_model.pt",
    quantize = true
)
```

**Issue 2: Slow Inference**
```kotlin
// Solution: Use smaller model or reduce input size
val results = classifier.classifyWithModel(
    bitmap = resizedBitmap,
    modelName = "mobilenet_v2"  // Faster model
)
```

**Issue 3: Model Loading Failures**
```kotlin
// Solution: Check model file exists
if (!modelFile.exists()) {
    modelManager.downloadModel(modelName)
}
```

## Resources

- [Elide Documentation](https://docs.elide.dev)
- [PyTorch Mobile](https://pytorch.org/mobile)
- [TensorFlow Lite](https://www.tensorflow.org/lite)
- [Android ML Kit](https://developers.google.com/ml-kit)

## Support

- Discord: https://discord.gg/elide
- GitHub Issues: https://github.com/elide-dev/android-ml-showcase/issues
- Email: support@elide.dev

## License

Apache License 2.0

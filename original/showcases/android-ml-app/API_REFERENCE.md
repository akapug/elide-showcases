# Android ML App - Complete API Reference

## Table of Contents

1. [Image Classification API](#image-classification-api)
2. [Object Detection API](#object-detection-api)
3. [Text Recognition API](#text-recognition-api)
4. [Face Detection API](#face-detection-api)
5. [Camera Service API](#camera-service-api)
6. [Model Manager API](#model-manager-api)
7. [Utility Functions](#utility-functions)

---

## Image Classification API

### Class: `ImageClassifier`

Performs image classification using various deep learning models.

#### Constructor

```kotlin
ImageClassifier(modelManager: ModelManager)
```

**Parameters:**
- `modelManager`: ModelManager instance for loading and managing models

**Example:**
```kotlin
val modelManager = ModelManager(context)
val classifier = ImageClassifier(modelManager)
```

#### Methods

##### `classify()`

Classify an image using the default model.

```kotlin
suspend fun classify(
    bitmap: Bitmap,
    topK: Int = 5,
    threshold: Float = 0.1f
): List<ClassificationResult>
```

**Parameters:**
- `bitmap`: Input image to classify
- `topK`: Number of top predictions to return (default: 5)
- `threshold`: Minimum confidence threshold (default: 0.1)

**Returns:**
- List of `ClassificationResult` objects sorted by confidence

**Example:**
```kotlin
val results = classifier.classify(
    bitmap = myImage,
    topK = 3,
    threshold = 0.2f
)

results.forEach { result ->
    println("${result.label}: ${result.confidence}")
}
```

**Throws:**
- `IOException`: If model loading fails
- `IllegalArgumentException`: If bitmap is invalid

---

##### `classifyWithModel()`

Classify using a specific model.

```kotlin
suspend fun classifyWithModel(
    bitmap: Bitmap,
    modelName: String,
    topK: Int = 5,
    threshold: Float = 0.1f
): List<ClassificationResult>
```

**Parameters:**
- `bitmap`: Input image
- `modelName`: Name of the model to use ("mobilenet_v2", "resnet50", etc.)
- `topK`: Number of top predictions
- `threshold`: Confidence threshold

**Supported Models:**
- `mobilenet_v2`: Fast, lightweight (14MB)
- `resnet18`: Balanced (45MB)
- `resnet50`: High accuracy (98MB)
- `efficientnet_b0`: Best efficiency (20MB)
- `vit`: Vision Transformer (330MB)

**Example:**
```kotlin
val results = classifier.classifyWithModel(
    bitmap = image,
    modelName = "resnet50",
    topK = 5
)
```

---

##### `classifyEnsemble()`

Use multiple models for ensemble prediction.

```kotlin
suspend fun classifyEnsemble(
    bitmap: Bitmap,
    models: List<String> = listOf("mobilenet_v2", "resnet50", "efficientnet"),
    topK: Int = 5
): List<ClassificationResult>
```

**Parameters:**
- `bitmap`: Input image
- `models`: List of model names to use in ensemble
- `topK`: Number of top predictions

**Returns:**
- Averaged predictions from all models

**Example:**
```kotlin
val ensemble = classifier.classifyEnsemble(
    bitmap = image,
    models = listOf("mobilenet_v2", "resnet50", "efficientnet_b0")
)
```

**Performance:**
- Accuracy: Higher than single model
- Speed: Slower (runs all models)
- Memory: Sum of all model sizes

---

##### `classifyBatch()`

Classify multiple images in batch.

```kotlin
suspend fun classifyBatch(
    bitmaps: List<Bitmap>,
    topK: Int = 5
): List<List<ClassificationResult>>
```

**Parameters:**
- `bitmaps`: List of images to classify
- `topK`: Top predictions per image

**Returns:**
- List of prediction lists (one per image)

**Example:**
```kotlin
val images = listOf(img1, img2, img3)
val allResults = classifier.classifyBatch(images)

allResults.forEachIndexed { index, results ->
    println("Image $index: ${results.first().label}")
}
```

**Performance Notes:**
- Batch processing is more efficient than individual classification
- Optimal batch size: 4-8 images
- Memory usage scales with batch size

---

##### `extractFeatures()`

Extract feature embeddings from an image.

```kotlin
suspend fun extractFeatures(bitmap: Bitmap): FloatArray
```

**Parameters:**
- `bitmap`: Input image

**Returns:**
- Feature vector (typically 512-2048 dimensions)

**Use Cases:**
- Image similarity search
- Transfer learning
- Custom classification layers

**Example:**
```kotlin
val features1 = classifier.extractFeatures(image1)
val features2 = classifier.extractFeatures(image2)

val similarity = calculateCosineSimilarity(features1, features2)
```

---

### Data Classes

#### `ClassificationResult`

```kotlin
data class ClassificationResult(
    val label: String,           // Class label (e.g., "dog", "cat")
    val confidence: Float,       // Confidence score [0.0, 1.0]
    val index: Int              // Class index in model output
)
```

**Example:**
```kotlin
val result = ClassificationResult(
    label = "golden_retriever",
    confidence = 0.94f,
    index = 207
)
```

---

## Object Detection API

### Class: `ObjectDetector`

Detects and localizes objects in images.

#### Constructor

```kotlin
ObjectDetector(modelManager: ModelManager)
```

#### Methods

##### `detect()`

Detect objects in an image.

```kotlin
suspend fun detect(
    bitmap: Bitmap,
    confidenceThreshold: Float = 0.5f,
    nmsThreshold: Float = 0.4f,
    classFilter: List<String>? = null
): List<Detection>
```

**Parameters:**
- `bitmap`: Input image
- `confidenceThreshold`: Minimum confidence for detections (default: 0.5)
- `nmsThreshold`: NMS IoU threshold (default: 0.4)
- `classFilter`: Optional list of classes to detect

**Returns:**
- List of `Detection` objects

**COCO Classes (80 total):**
```kotlin
val cocoClasses = listOf(
    "person", "bicycle", "car", "motorcycle", "airplane",
    "bus", "train", "truck", "boat", "traffic light",
    "fire hydrant", "stop sign", "parking meter", "bench", "bird",
    "cat", "dog", "horse", "sheep", "cow",
    // ... 60 more classes
)
```

**Example:**
```kotlin
// Detect all objects
val allDetections = detector.detect(image)

// Detect only people and cars
val filtered = detector.detect(
    image,
    confidenceThreshold = 0.7f,
    classFilter = listOf("person", "car")
)

allDetections.forEach { detection ->
    println("${detection.label} at ${detection.bbox}")
    println("Confidence: ${(detection.confidence * 100).toInt()}%")
}
```

---

##### `detectWithModel()`

Detect using specific model.

```kotlin
suspend fun detectWithModel(
    bitmap: Bitmap,
    modelName: String,
    confidenceThreshold: Float = 0.5f
): List<Detection>
```

**Supported Models:**
- `yolov5n`: Nano (7MB, ~40 FPS)
- `yolov5s`: Small (28MB, ~25 FPS)
- `yolov5m`: Medium (82MB, ~15 FPS)
- `yolov8n`: YOLOv8 Nano (12MB, ~35 FPS)
- `ssd_mobilenet`: SSD MobileNet (22MB, ~30 FPS)
- `faster_rcnn`: Faster R-CNN (160MB, ~8 FPS)

**Example:**
```kotlin
// Use fast YOLOv5 nano for real-time
val detections = detector.detectWithModel(
    frame,
    "yolov5n",
    0.5f
)

// Use accurate Faster R-CNN for high-quality
val accurate = detector.detectWithModel(
    image,
    "faster_rcnn",
    0.7f
)
```

---

##### `detectBatch()`

Batch object detection.

```kotlin
suspend fun detectBatch(
    bitmaps: List<Bitmap>,
    confidenceThreshold: Float = 0.5f
): List<List<Detection>>
```

**Parameters:**
- `bitmaps`: List of images
- `confidenceThreshold`: Detection threshold

**Returns:**
- List of detection lists

---

### Object Tracking

#### Class: `ObjectDetector.ObjectTracker`

Track objects across video frames.

```kotlin
class ObjectTracker {
    fun update(detections: List<Detection>): List<TrackedObject>
}
```

**Example:**
```kotlin
val tracker = ObjectDetector.ObjectTracker()

videoFrames.forEach { frame ->
    val detections = detector.detect(frame)
    val tracked = tracker.update(detections)
    
    tracked.forEach { obj ->
        println("Track ${obj.trackId}: ${obj.detection.label}")
    }
}
```

---

### Data Classes

#### `Detection`

```kotlin
data class Detection(
    val label: String,              // Object class
    val confidence: Float,          // Detection confidence
    val bbox: BoundingBox,          // Bounding box
    val classIndex: Int             // Class index
)
```

#### `BoundingBox`

```kotlin
data class BoundingBox(
    val x: Float,                   // Top-left X
    val y: Float,                   // Top-left Y
    val width: Float,               // Box width
    val height: Float               // Box height
)
```

**Methods:**
```kotlin
fun toRectF(): RectF              // Convert to Android RectF
```

---

## Text Recognition API

### Class: `TextRecognizer`

OCR and text recognition.

#### Constructor

```kotlin
TextRecognizer(modelManager: ModelManager)
```

#### Enums

##### `OCREngine`

```kotlin
enum class OCREngine {
    TESSERACT,      // Traditional OCR, fast
    EASY_OCR,       // Deep learning, accurate
    PADDLE_OCR      // Best for Asian languages
}
```

##### `Mode`

```kotlin
enum class Mode {
    DOCUMENT,       // Full page
    SPARSE,         // Scattered text
    SINGLE_LINE,    // Single line
    SINGLE_WORD     // Single word
}
```

#### Methods

##### `recognize()`

Recognize text in image.

```kotlin
suspend fun recognize(
    bitmap: Bitmap,
    languages: List<String> = listOf("en"),
    engine: OCREngine = OCREngine.EASY_OCR,
    mode: Mode = Mode.DOCUMENT
): String
```

**Supported Languages (100+):**
- Latin: en, es, fr, de, it, pt, nl, pl, ru
- Asian: zh, ja, ko, th, vi, ar, hi
- And many more...

**Example:**
```kotlin
// English OCR
val text = recognizer.recognize(image)

// Multi-language
val multiText = recognizer.recognize(
    image,
    languages = listOf("en", "es", "fr"),
    engine = OCREngine.EASY_OCR
)

// Document mode
val document = recognizer.recognize(
    scan,
    mode = Mode.DOCUMENT
)
```

---

##### `recognizeDetailed()`

Get OCR results with bounding boxes.

```kotlin
suspend fun recognizeDetailed(
    bitmap: Bitmap,
    languages: List<String> = listOf("en"),
    engine: OCREngine = OCREngine.EASY_OCR
): List<TextRegion>
```

**Returns:**
- List of text regions with positions

**Example:**
```kotlin
val regions = recognizer.recognizeDetailed(image)

regions.forEach { region ->
    println("Text: ${region.text}")
    println("Position: (${region.bbox.x}, ${region.bbox.y})")
    println("Confidence: ${region.confidence}")
}
```

---

##### `detectTextRegions()`

Detect text regions without recognition.

```kotlin
suspend fun detectTextRegions(bitmap: Bitmap): List<BoundingBox>
```

**Use Case:**
- Fast text localization
- Pre-processing for cropping

---

##### `translateText()`

Detect and translate text.

```kotlin
suspend fun translateText(
    bitmap: Bitmap,
    sourceLang: String = "auto",
    targetLang: String = "en"
): List<TranslatedRegion>
```

**Example:**
```kotlin
val translated = recognizer.translateText(
    foreignSign,
    sourceLang = "ja",
    targetLang = "en"
)

translated.forEach { region ->
    println("Original: ${region.original}")
    println("Translation: ${region.translated}")
}
```

---

##### `extractDocumentText()`

Extract text from multi-page document.

```kotlin
suspend fun extractDocumentText(
    pages: List<Bitmap>,
    languages: List<String> = listOf("en")
): DocumentText
```

**Example:**
```kotlin
val pages = listOf(page1, page2, page3)
val document = recognizer.extractDocumentText(pages)

println("Full document text:")
println(document.fullText)

document.pages.forEach { page ->
    println("Page ${page.pageNumber}:")
    println(page.text)
}
```

---

### Data Classes

#### `TextRegion`

```kotlin
data class TextRegion(
    val text: String,               // Recognized text
    val confidence: Float,          // Recognition confidence
    val bbox: BoundingBox           // Text location
)
```

#### `TranslatedRegion`

```kotlin
data class TranslatedRegion(
    val original: String,           // Original text
    val translated: String,         // Translated text
    val bbox: BoundingBox,          // Location
    val confidence: Float           // OCR confidence
)
```

#### `DocumentText`

```kotlin
data class DocumentText(
    val pages: List<PageText>,      // Per-page text
    val fullText: String            // Combined text
)
```

---

## Face Detection API

### Class: `FaceDetector`

Face detection, recognition, and analysis.

#### Constructor

```kotlin
FaceDetector(modelManager: ModelManager)
```

#### Enums

##### `DetectorType`

```kotlin
enum class DetectorType {
    MTCNN,          // Multi-task CNN
    RETINAFACE,     // State-of-the-art
    HAAR_CASCADE,   // Fast, traditional
    MEDIAPIPE,      // Google MediaPipe
    DLIB            // dlib detector
}
```

#### Methods

##### `detect()`

Detect faces in image.

```kotlin
suspend fun detect(
    bitmap: Bitmap,
    minConfidence: Float = 0.9f,
    includeLandmarks: Boolean = true,
    includeAttributes: Boolean = false
): List<Face>
```

**Parameters:**
- `bitmap`: Input image
- `minConfidence`: Minimum detection confidence
- `includeLandmarks`: Include facial landmarks (eyes, nose, mouth)
- `includeAttributes`: Include age, gender, emotion

**Example:**
```kotlin
// Basic detection
val faces = faceDetector.detect(image)

// Full analysis
val analyzed = faceDetector.detect(
    image,
    minConfidence = 0.95f,
    includeLandmarks = true,
    includeAttributes = true
)

analyzed.forEach { face ->
    println("Face: ${face.confidence}")
    println("Age: ${face.age}, Gender: ${face.gender}")
    println("Emotion: ${face.emotion}")
}
```

---

##### `extractEmbedding()`

Extract face embedding for recognition.

```kotlin
suspend fun extractEmbedding(
    bitmap: Bitmap,
    face: Face
): FloatArray
```

**Returns:**
- 128 or 512-dimensional face embedding

**Use Cases:**
- Face recognition
- Face verification
- Face clustering

---

##### `registerFace()`

Register face for recognition.

```kotlin
suspend fun registerFace(
    name: String,
    bitmap: Bitmap,
    face: Face
)
```

**Example:**
```kotlin
val faces = faceDetector.detect(photo)
if (faces.isNotEmpty()) {
    faceDetector.registerFace("John Doe", photo, faces.first())
}
```

---

##### `recognizeFace()`

Recognize registered face.

```kotlin
suspend fun recognizeFace(
    bitmap: Bitmap,
    face: Face,
    threshold: Float = 0.6f
): String?
```

**Parameters:**
- `bitmap`: Image containing face
- `face`: Detected face to recognize
- `threshold`: Recognition threshold (lower = stricter)

**Returns:**
- Name of recognized person or null

**Example:**
```kotlin
val faces = faceDetector.detect(testPhoto)
faces.forEach { face ->
    val name = faceDetector.recognizeFace(testPhoto, face)
    println("Recognized: ${name ?: "Unknown"}")
}
```

---

### Data Classes

#### `Face`

```kotlin
data class Face(
    val bbox: BoundingBox,          // Face bounding box
    val confidence: Float,          // Detection confidence
    val landmarks: FaceLandmarks?,  // Facial landmarks
    val age: Int?,                  // Estimated age
    val gender: String?,            // "Male" or "Female"
    val emotion: String?            // Detected emotion
)
```

#### `FaceLandmarks`

```kotlin
data class FaceLandmarks(
    val leftEye: Point,             // Left eye position
    val rightEye: Point,            // Right eye position
    val nose: Point,                // Nose position
    val leftMouth: Point,           // Left mouth corner
    val rightMouth: Point           // Right mouth corner
)
```

**Emotions:**
- Angry
- Disgust
- Fear
- Happy
- Sad
- Surprise
- Neutral

---

## Camera Service API

### Class: `CameraService`

Camera integration and frame processing.

#### Constructor

```kotlin
CameraService(
    context: Context,
    lifecycleOwner: LifecycleOwner
)
```

#### Methods

##### `startCamera()`

Start camera with frame callback.

```kotlin
fun startCamera(callback: (Bitmap) -> Unit)
```

**Example:**
```kotlin
val cameraService = CameraService(this, this)

cameraService.startCamera { frame ->
    // Process frame
    processMLInference(frame)
}
```

---

##### `stopCamera()`

Stop camera and release resources.

```kotlin
fun stopCamera()
```

---

##### `switchCamera()`

Switch between front/back camera.

```kotlin
fun switchCamera()
```

---

##### `setTargetFps()`

Set target frame rate.

```kotlin
fun setTargetFps(fps: Int)
```

**Common Values:**
- 15 FPS: Power saving
- 30 FPS: Standard
- 60 FPS: Smooth (if supported)

---

##### `setResolution()`

Set camera resolution.

```kotlin
fun setResolution(width: Int, height: Int)
```

**Common Resolutions:**
- 640x480: VGA
- 1280x720: HD
- 1920x1080: Full HD

---

##### `getFrameFlow()`

Get camera frames as Kotlin Flow.

```kotlin
fun getFrameFlow(): Flow<Bitmap>
```

**Example:**
```kotlin
cameraService.getFrameFlow()
    .collect { frame ->
        val results = classifier.classify(frame)
        updateUI(results)
    }
```

---

##### `applyFilter()`

Apply real-time filter.

```kotlin
fun applyFilter(bitmap: Bitmap, filter: CameraFilter): Bitmap
```

**Filters:**
- NONE
- GRAYSCALE
- SEPIA
- EDGE_DETECTION
- BLUR
- SHARPEN

---

## Model Manager API

### Class: `ModelManager`

Manages ML model loading and caching.

#### Constructor

```kotlin
ModelManager(context: Context)
```

#### Methods

##### `loadModel()`

Load model by name.

```kotlin
suspend fun loadModel(
    modelName: String,
    forceReload: Boolean = false
): PyObject
```

---

##### `preloadModel()`

Preload model in background.

```kotlin
suspend fun preloadModel(modelName: String)
```

**Example:**
```kotlin
// Preload models on app start
lifecycleScope.launch {
    modelManager.preloadModel("mobilenet_v2")
    modelManager.preloadModel("yolov5s")
}
```

---

##### `unloadModel()`

Unload model from cache.

```kotlin
suspend fun unloadModel(modelName: String)
```

---

##### `clearCache()`

Clear all cached models.

```kotlin
suspend fun clearCache()
```

---

##### `optimizeModel()`

Optimize model for mobile.

```kotlin
suspend fun optimizeModel(
    modelName: String,
    quantize: Boolean = true,
    prune: Boolean = false
): PyObject
```

**Example:**
```kotlin
val optimized = modelManager.optimizeModel(
    "resnet50.pt",
    quantize = true,
    prune = true
)
```

---

## Utility Functions

### Extension Functions

#### Bitmap Extensions

```kotlin
// Convert Bitmap to OpenCV Mat
fun Bitmap.toCvMat(): PyObject

// Convert OpenCV Mat to Bitmap
fun PyObject.toBitmap(): Bitmap
```

#### PyObject Extensions

```kotlin
// Tensor operations
fun PyObject.toFloatArray(): FloatArray
fun PyObject.cpu(): PyObject
fun PyObject.numpy(): FloatArray
```

---

## Error Handling

### Common Exceptions

```kotlin
// Model not found
class ModelNotFoundException(message: String) : Exception(message)

// Insufficient memory
class OutOfMemoryError(message: String) : Error(message)

// Invalid input
class InvalidInputException(message: String) : Exception(message)
```

### Best Practices

```kotlin
try {
    val results = classifier.classify(bitmap)
} catch (e: ModelNotFoundException) {
    // Download model
    modelManager.downloadModel("mobilenet_v2")
} catch (e: OutOfMemoryError) {
    // Use smaller model or reduce resolution
    modelManager.clearCache()
} catch (e: Exception) {
    // Handle other errors
    Log.e("ML", "Error", e)
}
```

---

## Performance Tips

1. **Batch Processing**: Process multiple images at once
2. **Model Caching**: Preload frequently used models
3. **Quantization**: Use INT8 quantization for 2-3x speedup
4. **Resolution**: Reduce input resolution if possible
5. **Frame Skipping**: Process every Nth frame for real-time

---

## Version Compatibility

| Component | Minimum Version |
|-----------|----------------|
| Android SDK | 26 (Oreo) |
| Kotlin | 1.9.0 |
| Compose | 1.5.0 |
| Elide SDK | 1.0.0 |
| PyTorch | 2.1.0 |
| TensorFlow | 2.14.0 |

---

For more information, visit:
- [GitHub Repository](https://github.com/elide-dev/android-ml-showcase)
- [Documentation](https://docs.elide.dev)
- [Discord Community](https://discord.gg/elide)

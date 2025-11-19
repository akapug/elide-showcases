package com.example.androidml

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.androidml.camera.CameraService
import com.example.androidml.ml.*
import com.example.androidml.ui.ResultsView
import com.example.androidml.utils.ModelManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

// Import Python ML libraries directly!
import cv2 from 'python:cv2'
import torch from 'python:torch'
import numpy as np from 'python:numpy'
import torchvision from 'python:torchvision'
import tensorflow as tf from 'python:tensorflow'

/**
 * Main Activity demonstrating on-device ML with Python libraries in Kotlin Android
 *
 * Features:
 * - Real-time camera processing
 * - Image classification
 * - Object detection
 * - Text recognition (OCR)
 * - Face detection
 * - Performance monitoring
 */
class MainActivity : ComponentActivity() {

    private lateinit var cameraExecutor: ExecutorService
    private lateinit var cameraService: CameraService
    private lateinit var modelManager: ModelManager

    // ML Components
    private lateinit var imageClassifier: ImageClassifier
    private lateinit var objectDetector: ObjectDetector
    private lateinit var textRecognizer: TextRecognizer
    private lateinit var faceDetector: FaceDetector

    // Permission launcher
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            setupCamera()
        } else {
            showPermissionDeniedDialog()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Initialize executor for camera operations
        cameraExecutor = Executors.newSingleThreadExecutor()

        // Initialize services
        initializeServices()

        // Set up UI
        setContent {
            AndroidMLTheme {
                MainScreen()
            }
        }

        // Request camera permission
        requestCameraPermission()
    }

    private fun initializeServices() {
        // Initialize Model Manager
        modelManager = ModelManager(applicationContext)

        // Initialize ML components
        imageClassifier = ImageClassifier(modelManager)
        objectDetector = ObjectDetector(modelManager)
        textRecognizer = TextRecognizer(modelManager)
        faceDetector = FaceDetector(modelManager)

        // Initialize Camera Service
        cameraService = CameraService(this)

        // Preload models in background
        lifecycleScope.launch(Dispatchers.IO) {
            preloadModels()
        }
    }

    private suspend fun preloadModels() {
        try {
            // Preload lightweight models for instant startup
            modelManager.preloadModel("mobilenet_v2")
            modelManager.preloadModel("yolov5s")
            modelManager.preloadModel("mtcnn")

            println("Models preloaded successfully")
        } catch (e: Exception) {
            println("Error preloading models: ${e.message}")
        }
    }

    private fun requestCameraPermission() {
        when {
            ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.CAMERA
            ) == PackageManager.PERMISSION_GRANTED -> {
                setupCamera()
            }
            else -> {
                requestPermissionLauncher.launch(Manifest.permission.CAMERA)
            }
        }
    }

    private fun setupCamera() {
        cameraService.startCamera { bitmap ->
            // Process camera frame
            processCameraFrame(bitmap)
        }
    }

    private fun processCameraFrame(bitmap: Bitmap) {
        lifecycleScope.launch(Dispatchers.Default) {
            try {
                // Process with selected ML model
                when (getCurrentMode()) {
                    MLMode.CLASSIFICATION -> processClassification(bitmap)
                    MLMode.DETECTION -> processDetection(bitmap)
                    MLMode.OCR -> processOCR(bitmap)
                    MLMode.FACE -> processFace(bitmap)
                }
            } catch (e: Exception) {
                println("Error processing frame: ${e.message}")
            }
        }
    }

    private fun processClassification(bitmap: Bitmap) {
        val result = imageClassifier.classify(bitmap)
        updateResults(ClassificationResults(result))
    }

    private fun processDetection(bitmap: Bitmap) {
        val detections = objectDetector.detect(bitmap)
        updateResults(DetectionResults(detections))
    }

    private fun processOCR(bitmap: Bitmap) {
        val text = textRecognizer.recognize(bitmap)
        updateResults(OCRResults(text))
    }

    private fun processFace(bitmap: Bitmap) {
        val faces = faceDetector.detect(bitmap)
        updateResults(FaceResults(faces))
    }

    private fun showPermissionDeniedDialog() {
        // Show dialog explaining why camera permission is needed
        AlertDialog.Builder(this)
            .setTitle("Camera Permission Required")
            .setMessage("This app needs camera access to perform ML inference on live video.")
            .setPositiveButton("Grant") { _, _ ->
                requestCameraPermission()
            }
            .setNegativeButton("Cancel") { dialog, _ ->
                dialog.dismiss()
                finish()
            }
            .show()
    }

    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
        cameraService.stopCamera()
        modelManager.cleanup()
    }

    // Stub methods - would be connected to ViewModel
    private fun getCurrentMode(): MLMode = MLMode.CLASSIFICATION
    private fun updateResults(results: MLResults) {}
}

/**
 * Main Screen Composable
 */
@Composable
fun MainScreen(viewModel: MainViewModel = viewModel()) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Android ML App") },
                actions = {
                    IconButton(onClick = { viewModel.toggleMode() }) {
                        Icon(
                            imageVector = Icons.Default.CameraAlt,
                            contentDescription = "Switch Mode"
                        )
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Camera Preview
            CameraPreviewView(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                onFrameCallback = { bitmap ->
                    viewModel.processFrame(bitmap)
                }
            )

            // Mode Selector
            ModeSelector(
                currentMode = uiState.mode,
                onModeSelected = { mode ->
                    viewModel.setMode(mode)
                }
            )

            // Results Display
            ResultsView(
                results = uiState.results,
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(0.5f)
            )

            // Performance Stats
            PerformanceStats(
                fps = uiState.fps,
                inferenceTime = uiState.inferenceTime,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            )
        }
    }
}

/**
 * Camera Preview Composable
 */
@Composable
fun CameraPreviewView(
    modifier: Modifier = Modifier,
    onFrameCallback: (Bitmap) -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = androidx.lifecycle.compose.LocalLifecycleOwner.current

    var previewView by remember { mutableStateOf<PreviewView?>(null) }

    AndroidView(
        modifier = modifier,
        factory = { ctx ->
            PreviewView(ctx).also { preview ->
                previewView = preview

                // Set up CameraX
                val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)
                cameraProviderFuture.addListener({
                    val cameraProvider = cameraProviderFuture.get()

                    val previewUseCase = Preview.Builder()
                        .build()
                        .also {
                            it.setSurfaceProvider(preview.surfaceProvider)
                        }

                    val imageAnalysis = ImageAnalysis.Builder()
                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                        .build()
                        .also { analysis ->
                            analysis.setAnalyzer(
                                Executors.newSingleThreadExecutor()
                            ) { imageProxy ->
                                // Convert to Bitmap and process
                                val bitmap = imageProxy.toBitmap()
                                onFrameCallback(bitmap)
                                imageProxy.close()
                            }
                        }

                    try {
                        cameraProvider.unbindAll()
                        cameraProvider.bindToLifecycle(
                            lifecycleOwner,
                            CameraSelector.DEFAULT_BACK_CAMERA,
                            previewUseCase,
                            imageAnalysis
                        )
                    } catch (e: Exception) {
                        println("Camera binding failed: ${e.message}")
                    }
                }, ContextCompat.getMainExecutor(ctx))
            }
        }
    )
}

/**
 * Mode Selector Composable
 */
@Composable
fun ModeSelector(
    currentMode: MLMode,
    onModeSelected: (MLMode) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(8.dp),
        horizontalArrangement = Arrangement.SpaceEvenly
    ) {
        MLMode.values().forEach { mode ->
            FilterChip(
                selected = currentMode == mode,
                onClick = { onModeSelected(mode) },
                label = { Text(mode.displayName) }
            )
        }
    }
}

/**
 * Performance Stats Composable
 */
@Composable
fun PerformanceStats(
    fps: Float,
    inferenceTime: Long,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            StatItem(label = "FPS", value = "%.1f".format(fps))
            StatItem(label = "Inference", value = "${inferenceTime}ms")
            StatItem(
                label = "Memory",
                value = "${Runtime.getRuntime().totalMemory() / 1024 / 1024}MB"
            )
        }
    }
}

@Composable
fun StatItem(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = value,
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.primary
        )
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

/**
 * ViewModel for Main Screen
 */
class MainViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(MainUIState())
    val uiState: StateFlow<MainUIState> = _uiState

    private lateinit var imageClassifier: ImageClassifier
    private lateinit var objectDetector: ObjectDetector
    private lateinit var textRecognizer: TextRecognizer
    private lateinit var faceDetector: FaceDetector

    private var lastFrameTime = System.currentTimeMillis()
    private var frameCount = 0
    private var fps = 0f

    fun initialize(
        classifier: ImageClassifier,
        detector: ObjectDetector,
        recognizer: TextRecognizer,
        faceDetect: FaceDetector
    ) {
        imageClassifier = classifier
        objectDetector = detector
        textRecognizer = recognizer
        faceDetector = faceDetect
    }

    fun processFrame(bitmap: Bitmap) {
        viewModelScope.launch(Dispatchers.Default) {
            val startTime = System.currentTimeMillis()

            try {
                val results = when (_uiState.value.mode) {
                    MLMode.CLASSIFICATION -> {
                        val result = imageClassifier.classify(bitmap)
                        ClassificationResults(result)
                    }
                    MLMode.DETECTION -> {
                        val detections = objectDetector.detect(bitmap)
                        DetectionResults(detections)
                    }
                    MLMode.OCR -> {
                        val text = textRecognizer.recognize(bitmap)
                        OCRResults(text)
                    }
                    MLMode.FACE -> {
                        val faces = faceDetector.detect(bitmap)
                        FaceResults(faces)
                    }
                }

                val inferenceTime = System.currentTimeMillis() - startTime
                updateFPS()

                _uiState.value = _uiState.value.copy(
                    results = results,
                    inferenceTime = inferenceTime,
                    fps = fps
                )
            } catch (e: Exception) {
                println("Error processing frame: ${e.message}")
            }
        }
    }

    private fun updateFPS() {
        frameCount++
        val currentTime = System.currentTimeMillis()
        val elapsed = currentTime - lastFrameTime

        if (elapsed >= 1000) {
            fps = frameCount / (elapsed / 1000f)
            frameCount = 0
            lastFrameTime = currentTime
        }
    }

    fun setMode(mode: MLMode) {
        _uiState.value = _uiState.value.copy(mode = mode)
    }

    fun toggleMode() {
        val modes = MLMode.values()
        val currentIndex = modes.indexOf(_uiState.value.mode)
        val nextMode = modes[(currentIndex + 1) % modes.size]
        setMode(nextMode)
    }
}

/**
 * UI State
 */
data class MainUIState(
    val mode: MLMode = MLMode.CLASSIFICATION,
    val results: MLResults = ClassificationResults(emptyList()),
    val fps: Float = 0f,
    val inferenceTime: Long = 0,
    val isProcessing: Boolean = false
)

/**
 * ML Modes
 */
enum class MLMode(val displayName: String) {
    CLASSIFICATION("Classify"),
    DETECTION("Detect"),
    OCR("OCR"),
    FACE("Face")
}

/**
 * ML Results (sealed interface)
 */
sealed interface MLResults

data class ClassificationResults(
    val predictions: List<ClassificationResult>
) : MLResults

data class DetectionResults(
    val detections: List<Detection>
) : MLResults

data class OCRResults(
    val text: String,
    val regions: List<TextRegion> = emptyList()
) : MLResults

data class FaceResults(
    val faces: List<Face>
) : MLResults

/**
 * Classification Result
 */
data class ClassificationResult(
    val label: String,
    val confidence: Float,
    val index: Int
)

/**
 * Detection Result
 */
data class Detection(
    val label: String,
    val confidence: Float,
    val bbox: BoundingBox,
    val classIndex: Int
)

data class BoundingBox(
    val x: Float,
    val y: Float,
    val width: Float,
    val height: Float
)

/**
 * Text Region
 */
data class TextRegion(
    val text: String,
    val confidence: Float,
    val bbox: BoundingBox
)

/**
 * Face
 */
data class Face(
    val bbox: BoundingBox,
    val confidence: Float,
    val landmarks: FaceLandmarks? = null,
    val age: Int? = null,
    val gender: String? = null,
    val emotion: String? = null
)

data class FaceLandmarks(
    val leftEye: Point,
    val rightEye: Point,
    val nose: Point,
    val leftMouth: Point,
    val rightMouth: Point
)

data class Point(val x: Float, val y: Float)

/**
 * Theme
 */
@Composable
fun AndroidMLTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme(
            primary = Color(0xFF6200EE),
            secondary = Color(0xFF03DAC6),
            background = Color(0xFF121212),
            surface = Color(0xFF1E1E1E)
        ),
        content = content
    )
}

/**
 * Extension: Convert ImageProxy to Bitmap
 */
fun ImageProxy.toBitmap(): Bitmap {
    val buffer = planes[0].buffer
    val bytes = ByteArray(buffer.remaining())
    buffer.get(bytes)

    // Use OpenCV for efficient conversion
    val mat = cv2.imdecode(np.frombuffer(bytes, dtype = np.uint8), cv2.IMREAD_COLOR)
    return mat.toBitmap()
}

/**
 * Extension: Convert Python cv2 Mat to Bitmap
 */
fun PyObject.toBitmap(): Bitmap {
    // Convert cv2 Mat to Bitmap
    val height = this.shape[0].toInt()
    val width = this.shape[1].toInt()
    val channels = if (this.shape.size > 2) this.shape[2].toInt() else 1

    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)

    // Convert numpy array to bitmap
    val array = this.toByteArray()
    bitmap.setPixels(array, 0, width, 0, 0, width, height)

    return bitmap
}

/**
 * Extension: Convert Bitmap to cv2 Mat
 */
fun Bitmap.toCvMat(): PyObject {
    val width = this.width
    val height = this.height
    val pixels = IntArray(width * height)

    getPixels(pixels, 0, width, 0, 0, width, height)

    // Convert to numpy array and then cv2 Mat
    val npArray = np.array(pixels).reshape(height, width, 4)
    val mat = cv2.cvtColor(npArray, cv2.COLOR_RGBA2BGR)

    return mat
}

/**
 * PyObject placeholder for Python objects
 */
typealias PyObject = Any

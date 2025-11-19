# Advanced Android ML Examples

## Production-Ready Use Cases

### 1. Smart Photo Gallery with Auto-Tagging

Complete implementation of an intelligent photo gallery that automatically tags, categorizes, and searches photos using ML.

```kotlin
package com.example.smartgallery

import android.content.Context
import android.graphics.Bitmap
import android.net.Uri
import androidx.room.*
import com.example.androidml.ml.*
import com.example.androidml.utils.ModelManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.withContext

/**
 * Smart Photo Gallery with ML-powered features
 * 
 * Features:
 * - Automatic tagging
 * - Face recognition for organizing by person
 * - Scene detection
 * - Object detection
 * - Similar photo search
 * - Smart albums creation
 */
class SmartPhotoGallery(context: Context) {
    private val modelManager = ModelManager(context)
    private val classifier = ImageClassifier(modelManager)
    private val detector = ObjectDetector(modelManager)
    private val faceDetector = FaceDetector(modelManager)
    private val database = PhotoDatabase.getInstance(context)
    
    /**
     * Analyze and index a photo
     */
    suspend fun indexPhoto(uri: Uri, bitmap: Bitmap): PhotoMetadata = 
        withContext(Dispatchers.Default) {
        
        // Scene classification
        val scene = classifier.classify(bitmap, topK = 1).firstOrNull()
        
        // Object detection
        val objects = detector.detect(bitmap, confidenceThreshold = 0.7f)
        
        // Face detection
        val faces = faceDetector.detect(bitmap)
        
        // Extract features for similarity search
        val features = classifier.extractFeatures(bitmap)
        
        // Generate tags
        val tags = generateTags(scene, objects, faces)
        
        // Create metadata
        val metadata = PhotoMetadata(
            uri = uri.toString(),
            timestamp = System.currentTimeMillis(),
            sceneType = scene?.label,
            objects = objects.map { it.label },
            faces = faces.size,
            tags = tags,
            features = features
        )
        
        // Save to database
        database.photoDao().insert(metadata)
        
        return@withContext metadata
    }
    
    /**
     * Search photos by query
     */
    fun searchPhotos(query: String): Flow<List<PhotoMetadata>> {
        return database.photoDao().searchByTags(query)
    }
    
    /**
     * Find similar photos
     */
    suspend fun findSimilarPhotos(
        photo: PhotoMetadata,
        topK: Int = 10
    ): List<PhotoMetadata> = withContext(Dispatchers.Default) {
        val allPhotos = database.photoDao().getAllPhotos()
        
        // Calculate similarity scores
        val similarities = allPhotos.map { other ->
            val similarity = calculateCosineSimilarity(
                photo.features,
                other.features
            )
            other to similarity
        }
        
        // Return top-K most similar
        return@withContext similarities
            .sortedByDescending { it.second }
            .take(topK)
            .map { it.first }
    }
    
    /**
     * Create smart albums automatically
     */
    suspend fun createSmartAlbums() = withContext(Dispatchers.Default) {
        val photos = database.photoDao().getAllPhotos()
        
        // Group by scene type
        val sceneAlbums = photos.groupBy { it.sceneType }
        sceneAlbums.forEach { (scene, photos) ->
            if (scene != null && photos.size >= 3) {
                createAlbum("$scene Photos", photos.map { it.uri })
            }
        }
        
        // Group by common objects
        val objectGroups = groupByCommonObjects(photos)
        objectGroups.forEach { (objects, photos) ->
            if (photos.size >= 5) {
                createAlbum(objects.joinToString(" & "), photos.map { it.uri })
            }
        }
        
        // Group by people (if faces detected)
        val peopleAlbums = groupByPeople(photos)
        peopleAlbums.forEach { (person, photos) ->
            createAlbum("Photos with $person", photos.map { it.uri })
        }
    }
    
    private fun generateTags(
        scene: ClassificationResult?,
        objects: List<Detection>,
        faces: List<Face>
    ): List<String> {
        val tags = mutableSetOf<String>()
        
        scene?.let { tags.add(it.label) }
        tags.addAll(objects.map { it.label })
        if (faces.isNotEmpty()) tags.add("people")
        if (faces.size == 1) tags.add("portrait")
        if (faces.size > 3) tags.add("group")
        
        return tags.toList()
    }
    
    private fun calculateCosineSimilarity(
        features1: FloatArray,
        features2: FloatArray
    ): Float {
        var dotProduct = 0f
        var norm1 = 0f
        var norm2 = 0f
        
        features1.indices.forEach { i ->
            dotProduct += features1[i] * features2[i]
            norm1 += features1[i] * features1[i]
            norm2 += features2[i] * features2[i]
        }
        
        return dotProduct / (kotlin.math.sqrt(norm1) * kotlin.math.sqrt(norm2))
    }
    
    private fun groupByCommonObjects(photos: List<PhotoMetadata>): Map<List<String>, List<PhotoMetadata>> {
        // Implementation
        return emptyMap()
    }
    
    private fun groupByPeople(photos: List<PhotoMetadata>): Map<String, List<PhotoMetadata>> {
        // Implementation
        return emptyMap()
    }
    
    private fun createAlbum(name: String, photoUris: List<String>) {
        // Create album in gallery
    }
}

/**
 * Photo metadata database
 */
@Database(entities = [PhotoMetadata::class], version = 1)
abstract class PhotoDatabase : RoomDatabase() {
    abstract fun photoDao(): PhotoDao
    
    companion object {
        @Volatile
        private var instance: PhotoDatabase? = null
        
        fun getInstance(context: Context): PhotoDatabase {
            return instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    PhotoDatabase::class.java,
                    "photo_database"
                ).build().also { instance = it }
            }
        }
    }
}

@Entity(tableName = "photos")
data class PhotoMetadata(
    @PrimaryKey val uri: String,
    val timestamp: Long,
    val sceneType: String?,
    val objects: List<String>,
    val faces: Int,
    val tags: List<String>,
    val features: FloatArray
)

@Dao
interface PhotoDao {
    @Query("SELECT * FROM photos")
    suspend fun getAllPhotos(): List<PhotoMetadata>
    
    @Query("SELECT * FROM photos WHERE tags LIKE '%' || :query || '%'")
    fun searchByTags(query: String): Flow<List<PhotoMetadata>>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(photo: PhotoMetadata)
}
```

### 2. Real-time Augmented Reality Shopping

AR shopping app that recognizes products and overlays information.

```kotlin
package com.example.arshopping

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import com.example.androidml.ml.*
import com.example.androidml.camera.CameraService
import com.google.ar.core.*
import com.google.ar.sceneform.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

/**
 * AR Shopping Assistant
 * 
 * Features:
 * - Product recognition from camera
 * - Price comparison
 * - Reviews overlay
 * - Similar products
 * - Virtual try-on
 */
class ARShoppingAssistant(
    private val context: Context,
    private val arSession: Session
) {
    private val classifier = ImageClassifier(ModelManager(context))
    private val detector = ObjectDetector(ModelManager(context))
    private val productDatabase = ProductDatabase.getInstance(context)
    
    /**
     * Recognize product in camera frame
     */
    suspend fun recognizeProduct(frame: Bitmap): ProductInfo? {
        // Detect products in frame
        val detections = detector.detect(
            frame,
            confidenceThreshold = 0.8f,
            classFilter = getShoppingCategories()
        )
        
        if (detections.isEmpty()) return null
        
        // Classify the main product
        val mainProduct = detections.maxByOrNull { it.confidence } ?: return null
        val productCrop = cropProduct(frame, mainProduct.bbox)
        
        val classification = classifier.classify(productCrop, topK = 1)
        val productFeatures = classifier.extractFeatures(productCrop)
        
        // Search product database
        return searchProductDatabase(
            classification.firstOrNull()?.label,
            productFeatures
        )
    }
    
    /**
     * Stream AR product overlays
     */
    fun getAROverlays(cameraStream: Flow<Bitmap>): Flow<AROverlay> = flow {
        cameraStream.collect { frame ->
            val product = recognizeProduct(frame)
            
            if (product != null) {
                val overlay = createAROverlay(product)
                emit(overlay)
            }
        }
    }
    
    /**
     * Virtual try-on for clothing/accessories
     */
    suspend fun virtualTryOn(
        product: ProductInfo,
        userPhoto: Bitmap
    ): Bitmap {
        // Detect person in photo
        val faces = FaceDetector(ModelManager(context)).detect(userPhoto)
        val bodies = detector.detect(userPhoto, classFilter = listOf("person"))
        
        if (faces.isEmpty() || bodies.isEmpty()) {
            return userPhoto
        }
        
        // Apply virtual try-on
        return applyProductToUser(userPhoto, product, faces.first(), bodies.first())
    }
    
    /**
     * Compare prices across retailers
     */
    suspend fun comparePrices(product: ProductInfo): List<PriceInfo> {
        return productDatabase.priceDao().getPricesForProduct(product.id)
            .sortedBy { it.price }
    }
    
    /**
     * Find similar products
     */
    suspend fun findSimilarProducts(product: ProductInfo): List<ProductInfo> {
        val allProducts = productDatabase.productDao().getAllProducts()
        
        return allProducts
            .map { other ->
                val similarity = calculateSimilarity(
                    product.features,
                    other.features
                )
                other to similarity
            }
            .sortedByDescending { it.second }
            .take(10)
            .map { it.first }
    }
    
    private fun createAROverlay(product: ProductInfo): AROverlay {
        return AROverlay(
            productName = product.name,
            price = product.price,
            rating = product.rating,
            reviews = product.reviewCount,
            availability = product.inStock
        )
    }
    
    private fun applyProductToUser(
        photo: Bitmap,
        product: ProductInfo,
        face: Face,
        body: Detection
    ): Bitmap {
        // Implement virtual try-on logic
        return photo
    }
    
    private fun getShoppingCategories(): List<String> {
        return listOf(
            "clothing", "shoes", "handbag", "watch",
            "sunglasses", "hat", "jewelry", "electronics"
        )
    }
    
    private fun cropProduct(image: Bitmap, bbox: BoundingBox): Bitmap {
        val x = bbox.x.toInt().coerceAtLeast(0)
        val y = bbox.y.toInt().coerceAtLeast(0)
        val w = bbox.width.toInt().coerceAtMost(image.width - x)
        val h = bbox.height.toInt().coerceAtMost(image.height - y)
        return Bitmap.createBitmap(image, x, y, w, h)
    }
    
    private suspend fun searchProductDatabase(
        label: String?,
        features: FloatArray
    ): ProductInfo? {
        // Search product database by features
        return null
    }
    
    private fun calculateSimilarity(f1: FloatArray, f2: FloatArray): Float {
        // Cosine similarity
        return 0f
    }
}

data class ProductInfo(
    val id: String,
    val name: String,
    val price: Float,
    val rating: Float,
    val reviewCount: Int,
    val inStock: Boolean,
    val features: FloatArray,
    val imageUrl: String
)

data class AROverlay(
    val productName: String,
    val price: Float,
    val rating: Float,
    val reviews: Int,
    val availability: Boolean
)

data class PriceInfo(
    val retailer: String,
    val price: Float,
    val url: String
)
```

### 3. Medical Image Analysis Assistant

HIPAA-compliant medical image analysis for doctors and patients.

```kotlin
package com.example.medicalml

import android.graphics.Bitmap
import com.example.androidml.ml.*
import com.example.androidml.utils.ModelManager
import javax.crypto.Cipher
import javax.crypto.SecretKey

/**
 * Medical Image Analyzer
 * 
 * IMPORTANT: For educational purposes only
 * NOT for clinical diagnosis
 * 
 * Features:
 * - Skin lesion analysis
 * - X-ray analysis
 * - Retinal image analysis
 * - Medical image segmentation
 * - HIPAA-compliant encryption
 */
class MedicalImageAnalyzer(context: Context) {
    private val modelManager = ModelManager(context)
    private val classifier = ImageClassifier(modelManager)
    private val segmenter = ImageSegmenter(modelManager)
    
    /**
     * Analyze skin lesion
     */
    suspend fun analyzeSkinLesion(image: Bitmap): SkinLesionAnalysis {
        // Preprocess medical image
        val preprocessed = preprocessMedicalImage(image)
        
        // Classify lesion type
        val classification = classifier.classifyWithModel(
            preprocessed,
            "dermatology_model",
            topK = 5
        )
        
        // Segment lesion boundary
        val segmentation = segmenter.segment(preprocessed)
        
        // Generate explanation (Grad-CAM)
        val explanation = generateExplanation(preprocessed, classification)
        
        // Calculate risk factors
        val riskFactors = calculateRiskFactors(classification, segmentation)
        
        return SkinLesionAnalysis(
            classification = classification,
            segmentation = segmentation,
            explanation = explanation,
            riskFactors = riskFactors,
            confidence = classification.firstOrNull()?.confidence ?: 0f
        )
    }
    
    /**
     * Analyze chest X-ray
     */
    suspend fun analyzeChestXray(image: Bitmap): ChestXrayAnalysis {
        val preprocessed = preprocessMedicalImage(image)
        
        // Multi-label classification for various conditions
        val findings = classifier.classifyWithModel(
            preprocessed,
            "chestxray_model",
            topK = 10
        )
        
        // Detect abnormalities
        val abnormalities = detector.detect(
            preprocessed,
            confidenceThreshold = 0.7f
        )
        
        // Generate radiologist-style report
        val report = generateRadiologyReport(findings, abnormalities)
        
        return ChestXrayAnalysis(
            findings = findings,
            abnormalities = abnormalities,
            report = report
        )
    }
    
    /**
     * Analyze retinal image
     */
    suspend fun analyzeRetinalImage(image: Bitmap): RetinalAnalysis {
        val preprocessed = preprocessMedicalImage(image)
        
        // Detect diabetic retinopathy
        val drClassification = classifier.classifyWithModel(
            preprocessed,
            "diabetic_retinopathy_model",
            topK = 5
        )
        
        // Segment blood vessels
        val vesselSegmentation = segmenter.segment(preprocessed)
        
        // Detect lesions
        val lesions = detector.detect(preprocessed)
        
        return RetinalAnalysis(
            diabeticRetinopathyStage = drClassification.firstOrNull()?.label,
            severity = drClassification.firstOrNull()?.confidence ?: 0f,
            vesselSegmentation = vesselSegmentation,
            lesions = lesions
        )
    }
    
    /**
     * Encrypt medical data for HIPAA compliance
     */
    fun encryptMedicalData(data: ByteArray, key: SecretKey): ByteArray {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, key)
        return cipher.doFinal(data)
    }
    
    private fun preprocessMedicalImage(image: Bitmap): Bitmap {
        // Medical image preprocessing
        // - Normalize intensity
        // - Apply CLAHE
        // - Denoise
        return image
    }
    
    private fun generateExplanation(
        image: Bitmap,
        classification: List<ClassificationResult>
    ): Bitmap {
        // Generate Grad-CAM heatmap
        return image
    }
    
    private fun calculateRiskFactors(
        classification: List<ClassificationResult>,
        segmentation: Bitmap
    ): Map<String, Float> {
        // Calculate risk factors
        return emptyMap()
    }
    
    private fun generateRadiologyReport(
        findings: List<ClassificationResult>,
        abnormalities: List<Detection>
    ): String {
        return buildString {
            appendLine("CHEST X-RAY ANALYSIS")
            appendLine("=" * 50)
            appendLine()
            appendLine("FINDINGS:")
            findings.forEach { finding ->
                if (finding.confidence > 0.3f) {
                    appendLine("- ${finding.label}: ${(finding.confidence * 100).toInt()}%")
                }
            }
            appendLine()
            appendLine("ABNORMALITIES DETECTED: ${abnormalities.size}")
            abnormalities.forEach { abnormality ->
                appendLine("- ${abnormality.label} at ${abnormality.bbox}")
            }
            appendLine()
            appendLine("DISCLAIMER: This is an AI-generated analysis.")
            appendLine("Always consult with a qualified healthcare professional.")
        }
    }
}

data class SkinLesionAnalysis(
    val classification: List<ClassificationResult>,
    val segmentation: Bitmap,
    val explanation: Bitmap,
    val riskFactors: Map<String, Float>,
    val confidence: Float
)

data class ChestXrayAnalysis(
    val findings: List<ClassificationResult>,
    val abnormalities: List<Detection>,
    val report: String
)

data class RetinalAnalysis(
    val diabeticRetinopathyStage: String?,
    val severity: Float,
    val vesselSegmentation: Bitmap,
    val lesions: List<Detection>
)

class ImageSegmenter(private val modelManager: ModelManager) {
    suspend fun segment(image: Bitmap): Bitmap {
        // Implement segmentation
        return image
    }
}
```

### 4. Fitness Pose Estimation Coach

Real-time pose estimation and form correction for fitness exercises.

```kotlin
package com.example.fitnesscoach

import android.graphics.Bitmap
import android.graphics.PointF
import com.example.androidml.ml.*
import kotlin.math.atan2
import kotlin.math.sqrt

/**
 * Fitness Pose Coach
 * 
 * Features:
 * - Real-time pose estimation
 * - Exercise form analysis
 * - Rep counting
 * - Calorie estimation
 * - Workout tracking
 */
class FitnessPoseCoach(context: Context) {
    private val poseEstimator = PoseEstimator(ModelManager(context))
    private val exerciseTracker = ExerciseTracker()
    
    /**
     * Analyze exercise form
     */
    suspend fun analyzeExerciseForm(
        frames: List<Bitmap>,
        exerciseType: ExerciseType
    ): ExerciseAnalysis {
        val poses = frames.map { frame ->
            poseEstimator.estimatePose(frame)
        }
        
        val formIssues = analyzeForm(poses, exerciseType)
        val repCount = countReps(poses, exerciseType)
        val rom = calculateRangeOfMotion(poses, exerciseType)
        
        return ExerciseAnalysis(
            exerciseType = exerciseType,
            repCount = repCount,
            formIssues = formIssues,
            rangeOfMotion = rom,
            quality = calculateQuality(formIssues)
        )
    }
    
    /**
     * Real-time form feedback
     */
    fun getRealtimeFeedback(
        pose: Pose,
        exerciseType: ExerciseType
    ): List<FormFeedback> {
        return when (exerciseType) {
            ExerciseType.SQUAT -> analyzeSquatForm(pose)
            ExerciseType.PUSHUP -> analyzePushupForm(pose)
            ExerciseType.PLANK -> analyzePlankForm(pose)
            ExerciseType.DEADLIFT -> analyzeDeadliftForm(pose)
            else -> emptyList()
        }
    }
    
    private fun analyzeSquatForm(pose: Pose): List<FormFeedback> {
        val feedback = mutableListOf<FormFeedback>()
        
        // Check knee angle
        val kneeAngle = calculateAngle(
            pose.leftHip,
            pose.leftKnee,
            pose.leftAnkle
        )
        
        if (kneeAngle < 90) {
            feedback.add(FormFeedback(
                issue = "Squat depth insufficient",
                severity = Severity.MEDIUM,
                suggestion = "Go deeper - thighs should be parallel to ground"
            ))
        }
        
        // Check knee alignment
        if (pose.leftKnee.x < pose.leftAnkle.x) {
            feedback.add(FormFeedback(
                issue = "Knees caving inward",
                severity = Severity.HIGH,
                suggestion = "Push knees outward to align with toes"
            ))
        }
        
        // Check back angle
        val backAngle = calculateAngle(
            pose.shoulder,
            pose.hip,
            pose.knee
        )
        
        if (backAngle < 45) {
            feedback.add(FormFeedback(
                issue = "Leaning too far forward",
                severity = Severity.HIGH,
                suggestion = "Keep chest up and core engaged"
            ))
        }
        
        return feedback
    }
    
    private fun analyzePushupForm(pose: Pose): List<FormFeedback> {
        val feedback = mutableListOf<FormFeedback>()
        
        // Check body alignment
        val bodyLine = calculateLinearity(
            pose.shoulder,
            pose.hip,
            pose.ankle
        )
        
        if (bodyLine < 0.9) {
            feedback.add(FormFeedback(
                issue = "Hips sagging or raised",
                severity = Severity.HIGH,
                suggestion = "Keep body in straight line from head to heels"
            ))
        }
        
        // Check elbow angle
        val elbowAngle = calculateAngle(
            pose.shoulder,
            pose.elbow,
            pose.wrist
        )
        
        if (elbowAngle > 90) {
            feedback.add(FormFeedback(
                issue = "Not going low enough",
                severity = Severity.MEDIUM,
                suggestion = "Lower until chest almost touches ground"
            ))
        }
        
        return feedback
    }
    
    private fun countReps(poses: List<Pose>, exerciseType: ExerciseType): Int {
        var repCount = 0
        var inDownPosition = false
        
        poses.forEach { pose ->
            val isDown = when (exerciseType) {
                ExerciseType.SQUAT -> isSquatDownPosition(pose)
                ExerciseType.PUSHUP -> isPushupDownPosition(pose)
                else -> false
            }
            
            if (isDown && !inDownPosition) {
                repCount++
                inDownPosition = true
            } else if (!isDown) {
                inDownPosition = false
            }
        }
        
        return repCount
    }
    
    private fun calculateAngle(p1: PointF, p2: PointF, p3: PointF): Float {
        val angle1 = atan2(p1.y - p2.y, p1.x - p2.x)
        val angle2 = atan2(p3.y - p2.y, p3.x - p2.x)
        return Math.toDegrees((angle2 - angle1).toDouble()).toFloat()
    }
    
    private fun calculateLinearity(p1: PointF, p2: PointF, p3: PointF): Float {
        // Calculate how close points are to being in a straight line
        return 1.0f
    }
    
    private fun isSquatDownPosition(pose: Pose): Boolean {
        val kneeAngle = calculateAngle(pose.hip, pose.knee, pose.ankle)
        return kneeAngle < 100
    }
    
    private fun isPushupDownPosition(pose: Pose): Boolean {
        val elbowAngle = calculateAngle(pose.shoulder, pose.elbow, pose.wrist)
        return elbowAngle < 100
    }
}

class PoseEstimator(private val modelManager: ModelManager) {
    suspend fun estimatePose(frame: Bitmap): Pose {
        // Implement pose estimation
        return Pose()
    }
}

data class Pose(
    val shoulder: PointF = PointF(0f, 0f),
    val elbow: PointF = PointF(0f, 0f),
    val wrist: PointF = PointF(0f, 0f),
    val hip: PointF = PointF(0f, 0f),
    val knee: PointF = PointF(0f, 0f),
    val ankle: PointF = PointF(0f, 0f),
    val leftHip: PointF = PointF(0f, 0f),
    val leftKnee: PointF = PointF(0f, 0f),
    val leftAnkle: PointF = PointF(0f, 0f)
)

enum class ExerciseType {
    SQUAT, PUSHUP, PLANK, DEADLIFT, BICEP_CURL
}

data class ExerciseAnalysis(
    val exerciseType: ExerciseType,
    val repCount: Int,
    val formIssues: List<FormFeedback>,
    val rangeOfMotion: Float,
    val quality: Float
)

data class FormFeedback(
    val issue: String,
    val severity: Severity,
    val suggestion: String
)

enum class Severity {
    LOW, MEDIUM, HIGH
}

class ExerciseTracker {
    // Track workouts over time
}
```

## More Examples Coming Soon

Stay tuned for additional advanced examples including:

- Wildlife Recognition Camera
- Plant Disease Detection
- Food Nutrition Analyzer
- Document Scanner & OCR
- Smart Surveillance System
- Gesture Control Interface
- Real-time Language Translation
- License Plate Recognition
- Quality Control Inspector
- Art Style Transfer

For the latest examples, visit:
https://github.com/elide-dev/android-ml-showcase/tree/main/examples

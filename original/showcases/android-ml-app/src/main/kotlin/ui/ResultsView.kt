package com.example.androidml.ui

import android.graphics.Bitmap
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Results View for displaying ML inference results
 *
 * Supports:
 * - Classification results
 * - Object detection bounding boxes
 * - OCR text regions
 * - Face detection with landmarks
 * - Real-time updates
 * - Animations
 */
@Composable
fun ResultsView(
    results: MLResults,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        shape = RoundedCornerShape(16.dp)
    ) {
        when (results) {
            is ClassificationResults -> ClassificationResultsView(results)
            is DetectionResults -> DetectionResultsView(results)
            is OCRResults -> OCRResultsView(results)
            is FaceResults -> FaceResultsView(results)
        }
    }
}

/**
 * Classification Results View
 */
@Composable
fun ClassificationResultsView(results: ClassificationResults) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        Text(
            text = "Classification Results",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(12.dp))

        if (results.predictions.isEmpty()) {
            Text(
                text = "No predictions",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        } else {
            results.predictions.take(5).forEach { prediction ->
                ClassificationItem(prediction)
                Spacer(modifier = Modifier.height(8.dp))
            }
        }
    }
}

@Composable
fun ClassificationItem(prediction: ClassificationResult) {
    Column {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = prediction.label.replace("_", " ").capitalize(),
                style = MaterialTheme.typography.bodyLarge,
                modifier = Modifier.weight(1f)
            )
            Text(
                text = "${(prediction.confidence * 100).toInt()}%",
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Bold,
                color = getConfidenceColor(prediction.confidence)
            )
        }

        Spacer(modifier = Modifier.height(4.dp))

        LinearProgressIndicator(
            progress = prediction.confidence,
            modifier = Modifier
                .fillMaxWidth()
                .height(6.dp),
            color = getConfidenceColor(prediction.confidence),
            trackColor = MaterialTheme.colorScheme.surfaceVariant
        )
    }
}

/**
 * Detection Results View
 */
@Composable
fun DetectionResultsView(results: DetectionResults) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Detected Objects",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = MaterialTheme.colorScheme.primaryContainer
            ) {
                Text(
                    text = "${results.detections.size}",
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (results.detections.isEmpty()) {
            Text(
                text = "No objects detected",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        } else {
            LazyColumn(
                modifier = Modifier.height(200.dp)
            ) {
                items(results.detections) { detection ->
                    DetectionItem(detection)
                    Spacer(modifier = Modifier.height(8.dp))
                }
            }
        }
    }
}

@Composable
fun DetectionItem(detection: Detection) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                shape = RoundedCornerShape(8.dp)
            )
            .padding(12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = detection.label.capitalize(),
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Medium
            )
            Text(
                text = "x:${detection.bbox.x.toInt()} y:${detection.bbox.y.toInt()} " +
                        "w:${detection.bbox.width.toInt()} h:${detection.bbox.height.toInt()}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 10.sp
            )
        }

        Surface(
            shape = RoundedCornerShape(8.dp),
            color = getConfidenceColor(detection.confidence).copy(alpha = 0.2f)
        ) {
            Text(
                text = "${(detection.confidence * 100).toInt()}%",
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold,
                color = getConfidenceColor(detection.confidence)
            )
        }
    }
}

/**
 * Bounding Box Overlay (to be drawn on camera preview)
 */
@Composable
fun BoundingBoxOverlay(
    detections: List<Detection>,
    imageWidth: Int,
    imageHeight: Int,
    modifier: Modifier = Modifier
) {
    Canvas(modifier = modifier) {
        val scaleX = size.width / imageWidth
        val scaleY = size.height / imageHeight

        detections.forEach { detection ->
            val bbox = detection.bbox
            val color = getDetectionColor(detection.classIndex)

            // Draw bounding box
            drawRect(
                color = color,
                topLeft = Offset(bbox.x * scaleX, bbox.y * scaleY),
                size = Size(bbox.width * scaleX, bbox.height * scaleY),
                style = Stroke(width = 3.dp.toPx())
            )

            // Draw label background
            drawRect(
                color = color.copy(alpha = 0.7f),
                topLeft = Offset(bbox.x * scaleX, bbox.y * scaleY - 25.dp.toPx()),
                size = Size(100.dp.toPx(), 25.dp.toPx())
            )
        }
    }
}

/**
 * OCR Results View
 */
@Composable
fun OCRResultsView(results: OCRResults) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        Text(
            text = "Recognized Text",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(12.dp))

        if (results.text.isEmpty()) {
            Text(
                text = "No text detected",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        } else {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(8.dp),
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
            ) {
                Text(
                    text = results.text,
                    modifier = Modifier.padding(12.dp),
                    style = MaterialTheme.typography.bodyMedium
                )
            }

            if (results.regions.isNotEmpty()) {
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = "Detected Regions: ${results.regions.size}",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

/**
 * Face Results View
 */
@Composable
fun FaceResultsView(results: FaceResults) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Detected Faces",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = MaterialTheme.colorScheme.primaryContainer
            ) {
                Text(
                    text = "${results.faces.size}",
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (results.faces.isEmpty()) {
            Text(
                text = "No faces detected",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        } else {
            LazyColumn(
                modifier = Modifier.height(200.dp)
            ) {
                items(results.faces) { face ->
                    FaceItem(face)
                    Spacer(modifier = Modifier.height(8.dp))
                }
            }
        }
    }
}

@Composable
fun FaceItem(face: Face) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
    ) {
        Column(
            modifier = Modifier.padding(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Face",
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = "${(face.confidence * 100).toInt()}%",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Bold,
                    color = getConfidenceColor(face.confidence)
                )
            }

            if (face.age != null && face.gender != null) {
                Spacer(modifier = Modifier.height(4.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    AttributeChip(
                        label = "Age",
                        value = "${face.age}"
                    )
                    AttributeChip(
                        label = "Gender",
                        value = face.gender
                    )
                }
            }

            if (face.emotion != null) {
                Spacer(modifier = Modifier.height(4.dp))
                AttributeChip(
                    label = "Emotion",
                    value = face.emotion
                )
            }

            if (face.landmarks != null) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Landmarks detected",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
fun AttributeChip(label: String, value: String) {
    Surface(
        shape = RoundedCornerShape(6.dp),
        color = MaterialTheme.colorScheme.primaryContainer
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "$label:",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
            )
            Text(
                text = value,
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimaryContainer
            )
        }
    }
}

/**
 * Face Landmark Overlay
 */
@Composable
fun FaceLandmarkOverlay(
    faces: List<Face>,
    imageWidth: Int,
    imageHeight: Int,
    modifier: Modifier = Modifier
) {
    Canvas(modifier = modifier) {
        val scaleX = size.width / imageWidth
        val scaleY = size.height / imageHeight

        faces.forEach { face ->
            val bbox = face.bbox

            // Draw face bounding box
            drawRect(
                color = Color.Green,
                topLeft = Offset(bbox.x * scaleX, bbox.y * scaleY),
                size = Size(bbox.width * scaleX, bbox.height * scaleY),
                style = Stroke(width = 3.dp.toPx())
            )

            // Draw landmarks
            face.landmarks?.let { landmarks ->
                val radius = 4.dp.toPx()

                // Eyes
                drawCircle(
                    color = Color.Blue,
                    radius = radius,
                    center = Offset(landmarks.leftEye.x * scaleX, landmarks.leftEye.y * scaleY)
                )
                drawCircle(
                    color = Color.Blue,
                    radius = radius,
                    center = Offset(landmarks.rightEye.x * scaleX, landmarks.rightEye.y * scaleY)
                )

                // Nose
                drawCircle(
                    color = Color.Yellow,
                    radius = radius,
                    center = Offset(landmarks.nose.x * scaleX, landmarks.nose.y * scaleY)
                )

                // Mouth
                drawCircle(
                    color = Color.Red,
                    radius = radius,
                    center = Offset(landmarks.leftMouth.x * scaleX, landmarks.leftMouth.y * scaleY)
                )
                drawCircle(
                    color = Color.Red,
                    radius = radius,
                    center = Offset(landmarks.rightMouth.x * scaleX, landmarks.rightMouth.y * scaleY)
                )
            }
        }
    }
}

/**
 * Helper Functions
 */
private fun getConfidenceColor(confidence: Float): Color {
    return when {
        confidence >= 0.8f -> Color(0xFF4CAF50)  // Green
        confidence >= 0.6f -> Color(0xFFFFC107)  // Amber
        confidence >= 0.4f -> Color(0xFFFF9800)  // Orange
        else -> Color(0xFFF44336)  // Red
    }
}

private fun getDetectionColor(classIndex: Int): Color {
    val colors = listOf(
        Color(0xFFFF5722),  // Red
        Color(0xFF2196F3),  // Blue
        Color(0xFF4CAF50),  // Green
        Color(0xFFFFC107),  // Yellow
        Color(0xFF9C27B0),  // Purple
        Color(0xFF00BCD4),  // Cyan
        Color(0xFFFF9800),  // Orange
        Color(0xFF795548)   // Brown
    )
    return colors[classIndex % colors.size]
}

private fun String.capitalize(): String {
    return this.split("_", " ").joinToString(" ") { word ->
        word.replaceFirstChar { it.uppercase() }
    }
}

/**
 * Data Classes
 */
sealed interface MLResults

data class ClassificationResults(
    val predictions: List<ClassificationResult>
) : MLResults

data class ClassificationResult(
    val label: String,
    val confidence: Float,
    val index: Int
)

data class DetectionResults(
    val detections: List<Detection>
) : MLResults

data class Detection(
    val label: String,
    val confidence: Float,
    val bbox: BoundingBox,
    val classIndex: Int
)

data class OCRResults(
    val text: String,
    val regions: List<TextRegion> = emptyList()
) : MLResults

data class TextRegion(
    val text: String,
    val confidence: Float,
    val bbox: BoundingBox
)

data class FaceResults(
    val faces: List<Face>
) : MLResults

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

data class BoundingBox(
    val x: Float,
    val y: Float,
    val width: Float,
    val height: Float
)

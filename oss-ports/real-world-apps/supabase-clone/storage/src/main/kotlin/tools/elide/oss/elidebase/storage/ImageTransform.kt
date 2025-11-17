package tools.elide.oss.elidebase.storage

import io.github.oshai.kotlinlogging.KotlinLogging
import tools.elide.oss.elidebase.core.ApiError
import tools.elide.oss.elidebase.core.ApiResponse
import java.awt.Graphics2D
import java.awt.RenderingHints
import java.awt.image.BufferedImage
import java.io.ByteArrayOutputStream
import javax.imageio.ImageIO
import javax.imageio.ImageWriteParam
import kotlin.math.min

private val logger = KotlinLogging.logger {}

/**
 * Image transformation parameters
 */
data class ImageTransformParams(
    val width: Int? = null,
    val height: Int? = null,
    val quality: Int = 80,
    val format: String? = null,
    val resize: ResizeMode = ResizeMode.CONTAIN,
    val crop: CropMode? = null,
    val rotate: Int? = null,
    val blur: Int? = null
) {
    init {
        require(quality in 1..100) { "Quality must be between 1 and 100" }
        require(rotate == null || rotate in 0..360) { "Rotation must be between 0 and 360" }
        require(blur == null || blur > 0) { "Blur radius must be positive" }
    }
}

/**
 * Image resize modes
 */
enum class ResizeMode {
    CONTAIN,  // Fit within dimensions, maintain aspect ratio
    COVER,    // Fill dimensions, maintain aspect ratio, crop if needed
    FILL,     // Stretch to exact dimensions
    INSIDE,   // Same as contain but only scale down, never up
    OUTSIDE   // Same as cover but only scale up, never down
}

/**
 * Image crop modes
 */
enum class CropMode {
    CENTER,
    TOP,
    BOTTOM,
    LEFT,
    RIGHT,
    TOP_LEFT,
    TOP_RIGHT,
    BOTTOM_LEFT,
    BOTTOM_RIGHT
}

/**
 * Image transformation service
 */
class ImageTransformService {

    /**
     * Transform an image according to parameters
     */
    fun transform(imageData: ByteArray, params: ImageTransformParams): ApiResponse<ByteArray> {
        return try {
            // Load image
            val inputStream = imageData.inputStream()
            val originalImage = ImageIO.read(inputStream)
                ?: return ApiResponse(error = ApiError("INVALID_IMAGE", "Unable to read image data"))

            var transformedImage = originalImage

            // Apply rotation
            if (params.rotate != null && params.rotate != 0) {
                transformedImage = rotateImage(transformedImage, params.rotate)
            }

            // Apply resize
            if (params.width != null || params.height != null) {
                transformedImage = resizeImage(transformedImage, params)
            }

            // Apply blur
            if (params.blur != null) {
                transformedImage = blurImage(transformedImage, params.blur)
            }

            // Determine output format
            val outputFormat = params.format?.lowercase() ?: "jpeg"
            if (!listOf("jpeg", "jpg", "png", "webp", "gif").contains(outputFormat)) {
                return ApiResponse(error = ApiError("UNSUPPORTED_FORMAT", "Unsupported output format: $outputFormat"))
            }

            // Encode image
            val outputData = encodeImage(transformedImage, outputFormat, params.quality)

            logger.info { "Image transformed: ${originalImage.width}x${originalImage.height} -> ${transformedImage.width}x${transformedImage.height}, format=$outputFormat" }

            ApiResponse(data = outputData)
        } catch (e: Exception) {
            logger.error(e) { "Error transforming image" }
            ApiResponse(error = ApiError("TRANSFORM_ERROR", e.message ?: "Failed to transform image"))
        }
    }

    /**
     * Resize image according to parameters
     */
    private fun resizeImage(image: BufferedImage, params: ImageTransformParams): BufferedImage {
        val originalWidth = image.width
        val originalHeight = image.height
        val targetWidth = params.width ?: originalWidth
        val targetHeight = params.height ?: originalHeight

        val (newWidth, newHeight) = when (params.resize) {
            ResizeMode.CONTAIN -> {
                val scale = min(
                    targetWidth.toDouble() / originalWidth,
                    targetHeight.toDouble() / originalHeight
                )
                (originalWidth * scale).toInt() to (originalHeight * scale).toInt()
            }

            ResizeMode.COVER -> {
                val scale = maxOf(
                    targetWidth.toDouble() / originalWidth,
                    targetHeight.toDouble() / originalHeight
                )
                (originalWidth * scale).toInt() to (originalHeight * scale).toInt()
            }

            ResizeMode.FILL -> {
                targetWidth to targetHeight
            }

            ResizeMode.INSIDE -> {
                if (originalWidth <= targetWidth && originalHeight <= targetHeight) {
                    originalWidth to originalHeight
                } else {
                    val scale = min(
                        targetWidth.toDouble() / originalWidth,
                        targetHeight.toDouble() / originalHeight
                    )
                    (originalWidth * scale).toInt() to (originalHeight * scale).toInt()
                }
            }

            ResizeMode.OUTSIDE -> {
                if (originalWidth >= targetWidth && originalHeight >= targetHeight) {
                    originalWidth to originalHeight
                } else {
                    val scale = maxOf(
                        targetWidth.toDouble() / originalWidth,
                        targetHeight.toDouble() / originalHeight
                    )
                    (originalWidth * scale).toInt() to (originalHeight * scale).toInt()
                }
            }
        }

        val resized = BufferedImage(newWidth, newHeight, BufferedImage.TYPE_INT_RGB)
        val g2d = resized.createGraphics()

        // High-quality rendering
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC)
        g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY)
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON)

        g2d.drawImage(image, 0, 0, newWidth, newHeight, null)
        g2d.dispose()

        // Apply crop if needed
        return if (params.crop != null && (newWidth != targetWidth || newHeight != targetHeight)) {
            cropImage(resized, targetWidth, targetHeight, params.crop)
        } else {
            resized
        }
    }

    /**
     * Crop image
     */
    private fun cropImage(image: BufferedImage, width: Int, height: Int, mode: CropMode): BufferedImage {
        val x = when (mode) {
            CropMode.LEFT, CropMode.TOP_LEFT, CropMode.BOTTOM_LEFT -> 0
            CropMode.RIGHT, CropMode.TOP_RIGHT, CropMode.BOTTOM_RIGHT -> image.width - width
            else -> (image.width - width) / 2
        }

        val y = when (mode) {
            CropMode.TOP, CropMode.TOP_LEFT, CropMode.TOP_RIGHT -> 0
            CropMode.BOTTOM, CropMode.BOTTOM_LEFT, CropMode.BOTTOM_RIGHT -> image.height - height
            else -> (image.height - height) / 2
        }

        return image.getSubimage(x.coerceIn(0, image.width - width), y.coerceIn(0, image.height - height), width, height)
    }

    /**
     * Rotate image
     */
    private fun rotateImage(image: BufferedImage, degrees: Int): BufferedImage {
        val radians = Math.toRadians(degrees.toDouble())
        val sin = kotlin.math.abs(kotlin.math.sin(radians))
        val cos = kotlin.math.abs(kotlin.math.cos(radians))

        val newWidth = (image.width * cos + image.height * sin).toInt()
        val newHeight = (image.height * cos + image.width * sin).toInt()

        val rotated = BufferedImage(newWidth, newHeight, image.type)
        val g2d = rotated.createGraphics()

        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC)
        g2d.translate((newWidth - image.width) / 2, (newHeight - image.height) / 2)
        g2d.rotate(radians, image.width / 2.0, image.height / 2.0)
        g2d.drawImage(image, 0, 0, null)
        g2d.dispose()

        return rotated
    }

    /**
     * Apply blur effect
     */
    private fun blurImage(image: BufferedImage, radius: Int): BufferedImage {
        // Simple box blur implementation
        val width = image.width
        val height = image.height
        val blurred = BufferedImage(width, height, BufferedImage.TYPE_INT_RGB)

        for (y in 0 until height) {
            for (x in 0 until width) {
                var r = 0
                var g = 0
                var b = 0
                var count = 0

                for (dy in -radius..radius) {
                    for (dx in -radius..radius) {
                        val nx = (x + dx).coerceIn(0, width - 1)
                        val ny = (y + dy).coerceIn(0, height - 1)

                        val rgb = image.getRGB(nx, ny)
                        r += (rgb shr 16) and 0xFF
                        g += (rgb shr 8) and 0xFF
                        b += rgb and 0xFF
                        count++
                    }
                }

                val avgR = r / count
                val avgG = g / count
                val avgB = b / count
                val avgRGB = (avgR shl 16) or (avgG shl 8) or avgB

                blurred.setRGB(x, y, avgRGB)
            }
        }

        return blurred
    }

    /**
     * Encode image to byte array
     */
    private fun encodeImage(image: BufferedImage, format: String, quality: Int): ByteArray {
        val outputStream = ByteArrayOutputStream()

        when (format.lowercase()) {
            "jpeg", "jpg" -> {
                val writer = ImageIO.getImageWritersByFormatName("jpeg").next()
                val writeParam = writer.defaultWriteParam
                writeParam.compressionMode = ImageWriteParam.MODE_EXPLICIT
                writeParam.compressionQuality = quality / 100f

                val output = ImageIO.createImageOutputStream(outputStream)
                writer.output = output
                writer.write(null, javax.imageio.IIOImage(image, null, null), writeParam)
                writer.dispose()
                output.close()
            }

            "png" -> {
                ImageIO.write(image, "PNG", outputStream)
            }

            "webp" -> {
                // WebP support requires external library
                // For now, fall back to JPEG
                ImageIO.write(image, "JPEG", outputStream)
            }

            "gif" -> {
                ImageIO.write(image, "GIF", outputStream)
            }

            else -> {
                ImageIO.write(image, "JPEG", outputStream)
            }
        }

        return outputStream.toByteArray()
    }

    /**
     * Get image dimensions
     */
    fun getImageDimensions(imageData: ByteArray): Pair<Int, Int>? {
        return try {
            val image = ImageIO.read(imageData.inputStream())
            image?.width to image?.height
        } catch (e: Exception) {
            logger.warn { "Failed to get image dimensions: ${e.message}" }
            null
        }
    }

    /**
     * Generate thumbnail
     */
    fun generateThumbnail(imageData: ByteArray, size: Int = 200): ApiResponse<ByteArray> {
        return transform(
            imageData,
            ImageTransformParams(
                width = size,
                height = size,
                resize = ResizeMode.COVER,
                crop = CropMode.CENTER,
                quality = 75
            )
        )
    }
}

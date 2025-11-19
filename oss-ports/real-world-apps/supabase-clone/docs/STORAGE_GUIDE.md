# Storage Guide

Complete guide to file storage and management in Elidebase.

## Table of Contents

- [Introduction](#introduction)
- [Buckets](#buckets)
- [File Operations](#file-operations)
- [Image Transformations](#image-transformations)
- [Access Control](#access-control)
- [CDN Integration](#cdn-integration)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Introduction

Elidebase Storage provides S3-compatible object storage with:
- Bucket-based organization
- Row-level security
- Image transformations
- Resumable uploads
- CDN support
- Public/private buckets

## Buckets

### Create a Bucket

```kotlin
val result = client.storage.createBucket(
    BucketConfig(
        name = "avatars",
        public = true,
        fileSizeLimit = 5_242_880, // 5MB
        allowedMimeTypes = listOf("image/jpeg", "image/png", "image/webp")
    )
)

if (result.data != null) {
    println("Bucket created: ${result.data.name}")
}
```

### List Buckets

```kotlin
val buckets = client.storage.listBuckets()

buckets.data?.forEach { bucket ->
    println("Bucket: ${bucket.name}, Public: ${bucket.public}")
}
```

### Delete a Bucket

```kotlin
// Delete empty bucket
client.storage.deleteBucket("old-bucket")

// Delete bucket with all files
client.storage.deleteBucket("old-bucket", cascade = true)
```

### Bucket Configuration

```kotlin
data class BucketConfig(
    val name: String,                    // Bucket name (lowercase, alphanumeric, hyphens)
    val public: Boolean = false,         // Public access
    val fileSizeLimit: Long = 52428800, // Max file size (50MB default)
    val allowedMimeTypes: List<String>? = null // Allowed file types
)
```

## File Operations

### Upload a File

```kotlin
val bucket = client.storage.from("avatars")

// Upload from bytes
val result = bucket.upload(
    path = "users/user-123/avatar.jpg",
    data = fileBytes,
    mimeType = "image/jpeg"
)

if (result.data != null) {
    println("File uploaded: ${result.data.path}")
    println("Size: ${result.data.size} bytes")
    println("ETag: ${result.data.etag}")
}
```

### Upload with Metadata

```kotlin
val result = bucket.upload(
    path = "documents/report-2024.pdf",
    data = pdfBytes,
    mimeType = "application/pdf",
    metadata = mapOf(
        "author" to "John Doe",
        "department" to "Engineering",
        "version" to "1.0"
    )
)
```

### Download a File

```kotlin
val result = bucket.download("users/user-123/avatar.jpg")

if (result.data != null) {
    val fileBytes = result.data
    // Process file data
    saveToFile(fileBytes, "avatar.jpg")
}
```

### List Files

```kotlin
// List all files in bucket
val files = bucket.list()

// List files with prefix
val userFiles = bucket.list(prefix = "users/user-123/")

// List with pagination
val page1 = bucket.list(limit = 50, offset = 0)
val page2 = bucket.list(limit = 50, offset = 50)

files.data?.forEach { file ->
    println("File: ${file.name}")
    println("  Size: ${file.size} bytes")
    println("  Type: ${file.mimeType}")
    println("  Created: ${file.createdAt}")
}
```

### Delete a File

```kotlin
bucket.remove("users/user-123/old-avatar.jpg")
println("File deleted")
```

### Move/Rename a File

```kotlin
// Download from old path
val fileData = bucket.download("old-path/file.jpg")

// Upload to new path
if (fileData.data != null) {
    bucket.upload("new-path/file.jpg", fileData.data)
    bucket.remove("old-path/file.jpg")
}
```

### Copy a File

```kotlin
val fileData = bucket.download("source/file.jpg")

if (fileData.data != null) {
    bucket.upload("destination/file.jpg", fileData.data)
}
```

## Image Transformations

Transform images on-the-fly without storing multiple versions.

### Basic Resize

```kotlin
val imageService = ImageTransformService()

// Resize to specific dimensions
val transformed = imageService.transform(
    imageData = originalImage,
    params = ImageTransformParams(
        width = 800,
        height = 600,
        resize = ResizeMode.CONTAIN // Fit within dimensions
    )
)

if (transformed.data != null) {
    bucket.upload("thumbs/image-800x600.jpg", transformed.data)
}
```

### Resize Modes

```kotlin
// CONTAIN - Fit within dimensions, maintain aspect ratio
ImageTransformParams(width = 800, height = 600, resize = ResizeMode.CONTAIN)

// COVER - Fill dimensions, maintain aspect ratio, crop if needed
ImageTransformParams(width = 800, height = 600, resize = ResizeMode.COVER)

// FILL - Stretch to exact dimensions
ImageTransformParams(width = 800, height = 600, resize = ResizeMode.FILL)

// INSIDE - Only scale down, never up
ImageTransformParams(width = 800, height = 600, resize = ResizeMode.INSIDE)

// OUTSIDE - Only scale up, never down
ImageTransformParams(width = 800, height = 600, resize = ResizeMode.OUTSIDE)
```

### Crop Images

```kotlin
val transformed = imageService.transform(
    imageData = originalImage,
    params = ImageTransformParams(
        width = 400,
        height = 400,
        resize = ResizeMode.COVER,
        crop = CropMode.CENTER // Center crop
    )
)

// Crop modes: CENTER, TOP, BOTTOM, LEFT, RIGHT,
//             TOP_LEFT, TOP_RIGHT, BOTTOM_LEFT, BOTTOM_RIGHT
```

### Quality Adjustment

```kotlin
// High quality (larger file)
ImageTransformParams(quality = 95)

// Medium quality (balanced)
ImageTransformParams(quality = 80)

// Low quality (smaller file)
ImageTransformParams(quality = 60)
```

### Format Conversion

```kotlin
// Convert to WebP
ImageTransformParams(format = "webp", quality = 85)

// Convert to PNG
ImageTransformParams(format = "png")

// Convert to JPEG
ImageTransformParams(format = "jpeg", quality = 90)
```

### Rotate Images

```kotlin
ImageTransformParams(rotate = 90)  // 90 degrees
ImageTransformParams(rotate = 180) // 180 degrees
ImageTransformParams(rotate = 270) // 270 degrees
```

### Blur Effect

```kotlin
ImageTransformParams(blur = 5) // Blur radius
```

### Multiple Transformations

```kotlin
val transformed = imageService.transform(
    imageData = originalImage,
    params = ImageTransformParams(
        width = 800,
        height = 600,
        resize = ResizeMode.COVER,
        crop = CropMode.CENTER,
        quality = 85,
        format = "webp",
        rotate = 0,
        blur = null
    )
)
```

### Generate Thumbnail

```kotlin
val thumbnail = imageService.generateThumbnail(
    imageData = originalImage,
    size = 200 // 200x200 square thumbnail
)
```

### URL-based Transformations

Access transformed images via URL parameters:

```
GET /storage/avatars/user-123/photo.jpg?width=400&height=400&crop=center&quality=85
```

Implementation:
```kotlin
get("/storage/{bucket}/{path...}") {
    val bucket = call.parameters["bucket"]!!
    val path = call.parameters.getAll("path")!!.joinToString("/")

    // Parse transform params from query
    val width = call.request.queryParameters["width"]?.toIntOrNull()
    val height = call.request.queryParameters["height"]?.toIntOrNull()
    val quality = call.request.queryParameters["quality"]?.toIntOrNull() ?: 80
    val format = call.request.queryParameters["format"]
    val crop = call.request.queryParameters["crop"]

    // Download original
    val fileData = storageManager.downloadFile(bucket, path)

    if (fileData.data != null) {
        val (bytes, metadata) = fileData.data

        // Apply transformations if requested
        val finalBytes = if (width != null || height != null || format != null) {
            val transformed = imageService.transform(bytes, ImageTransformParams(
                width = width,
                height = height,
                quality = quality,
                format = format,
                crop = crop?.let { CropMode.valueOf(it.uppercase()) }
            ))
            transformed.data ?: bytes
        } else {
            bytes
        }

        call.respondBytes(finalBytes, ContentType.parse(metadata.mimeType))
    } else {
        call.respond(HttpStatusCode.NotFound)
    }
}
```

## Access Control

### Public Buckets

Files in public buckets are accessible without authentication:

```kotlin
// Create public bucket
client.storage.createBucket(
    BucketConfig(name = "public-assets", public = true)
)

// Access public file
val url = bucket.getPublicUrl("logo.png")
// https://yourapp.com/storage/public-assets/logo.png
```

### Private Buckets

Files in private buckets require authentication:

```kotlin
// Create private bucket
client.storage.createBucket(
    BucketConfig(name = "user-documents", public = false)
)

// Upload requires authentication
bucket.upload(
    path = "user-123/private-doc.pdf",
    data = fileBytes
)

// Download requires authentication
val fileData = bucket.download("user-123/private-doc.pdf")
```

### Row-Level Security for Storage

Apply RLS policies to storage objects:

```sql
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Users can only access their own files
CREATE POLICY objects_select_own ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id IN (SELECT id FROM storage.buckets WHERE public = true) OR
        owner_id = auth.uid()
    );

-- Users can only upload to their own namespace
CREATE POLICY objects_insert_own ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        owner_id = auth.uid() AND
        path LIKE (SELECT 'users/' || auth.uid() || '/%')
    );

-- Users can only delete their own files
CREATE POLICY objects_delete_own ON storage.objects
    FOR DELETE
    TO authenticated
    USING (owner_id = auth.uid());
```

### Signed URLs

Generate temporary signed URLs for private files:

```kotlin
fun generateSignedUrl(
    bucket: String,
    path: String,
    expiresIn: Long = 3600 // 1 hour
): String {
    val expiresAt = System.currentTimeMillis() + (expiresIn * 1000)
    val signature = sign("$bucket/$path:$expiresAt", secretKey)

    return "https://yourapp.com/storage/$bucket/$path?expires=$expiresAt&signature=$signature"
}

fun verifySignedUrl(
    bucket: String,
    path: String,
    expires: Long,
    signature: String
): Boolean {
    if (System.currentTimeMillis() > expires) {
        return false // Expired
    }

    val expectedSignature = sign("$bucket/$path:$expires", secretKey)
    return signature == expectedSignature
}
```

## CDN Integration

### CloudFlare CDN

```kotlin
// Configure CloudFlare
val cdnConfig = CDNConfig(
    provider = "cloudflare",
    domain = "cdn.yourapp.com",
    zoneId = "your-zone-id",
    apiToken = "your-api-token"
)

// Purge cache
fun purgeCDNCache(urls: List<String>) {
    // Call CloudFlare API to purge URLs
}

// Get CDN URL
fun getCDNUrl(bucket: String, path: String): String {
    return "https://cdn.yourapp.com/storage/$bucket/$path"
}
```

### Cache Headers

Set appropriate cache headers for files:

```kotlin
get("/storage/{bucket}/{path...}") {
    // ... fetch file ...

    call.response.headers.append("Cache-Control", "public, max-age=31536000") // 1 year
    call.response.headers.append("ETag", file.etag)

    call.respondBytes(fileData, ContentType.parse(file.mimeType))
}
```

## Best Practices

### 1. File Organization

```
storage/
├── avatars/                    # User avatars
│   └── users/
│       └── {user_id}/
│           └── avatar.jpg
├── documents/                  # User documents
│   └── users/
│       └── {user_id}/
│           └── {document_id}.pdf
├── images/                     # App images
│   ├── posts/
│   │   └── {post_id}/
│   │       └── cover.jpg
│   └── products/
│       └── {product_id}/
│           ├── main.jpg
│           └── gallery/
│               ├── 1.jpg
│               └── 2.jpg
└── public/                     # Public assets
    ├── logo.png
    └── favicon.ico
```

### 2. File Naming

```kotlin
// Good: Use UUIDs or timestamps
"users/user-123/avatar-${UUID.randomUUID()}.jpg"
"uploads/${System.currentTimeMillis()}-file.pdf"

// Bad: Use original filenames (security risk)
"uploads/${originalFilename}" // Can contain ../ etc
```

### 3. File Validation

```kotlin
fun validateFile(filename: String, data: ByteArray, mimeType: String): Boolean {
    // Check file size
    if (data.size > MAX_FILE_SIZE) {
        throw Exception("File too large")
    }

    // Check file type
    val allowedTypes = listOf("image/jpeg", "image/png", "application/pdf")
    if (mimeType !in allowedTypes) {
        throw Exception("File type not allowed")
    }

    // Check file extension
    val extension = getFileExtension(filename)
    val allowedExtensions = listOf("jpg", "jpeg", "png", "pdf")
    if (extension !in allowedExtensions) {
        throw Exception("File extension not allowed")
    }

    // Verify MIME type matches content
    val detectedType = detectMimeType(data)
    if (detectedType != mimeType) {
        throw Exception("MIME type mismatch")
    }

    return true
}
```

### 4. Virus Scanning

```kotlin
fun scanFile(data: ByteArray): Boolean {
    // Integrate with ClamAV or similar
    val scanner = ClamAVScanner()
    return scanner.scan(data).isClean
}
```

### 5. Optimize Images

```kotlin
suspend fun uploadImage(
    bucket: String,
    path: String,
    imageData: ByteArray
): StorageObject {
    val imageService = ImageTransformService()

    // Optimize original
    val optimized = imageService.transform(
        imageData,
        ImageTransformParams(quality = 85, format = "webp")
    )

    // Generate thumbnail
    val thumbnail = imageService.generateThumbnail(imageData, size = 200)

    // Upload both
    storageManager.uploadFile(bucket, path, optimized.data!!)
    storageManager.uploadFile(bucket, "$path-thumb", thumbnail.data!!)

    return optimized
}
```

### 6. Cleanup Old Files

```kotlin
suspend fun cleanupOldFiles(bucket: String, daysOld: Int) {
    val cutoffDate = Instant.now().minusSeconds(daysOld * 86400L)

    val files = storageManager.listFiles(bucket)

    files.data?.forEach { file ->
        val createdAt = Instant.parse(file.createdAt)
        if (createdAt.isBefore(cutoffDate)) {
            storageManager.deleteFile(bucket, file.path)
            println("Deleted old file: ${file.path}")
        }
    }
}
```

## Examples

### Avatar Upload

```kotlin
suspend fun uploadAvatar(userId: String, imageData: ByteArray): String {
    val imageService = ImageTransformService()

    // Validate image
    validateFile("avatar.jpg", imageData, "image/jpeg")

    // Generate multiple sizes
    val sizes = mapOf(
        "large" to 800,
        "medium" to 400,
        "small" to 200,
        "thumb" to 100
    )

    val bucket = client.storage.from("avatars")

    sizes.forEach { (size, dimension) ->
        val resized = imageService.transform(
            imageData,
            ImageTransformParams(
                width = dimension,
                height = dimension,
                resize = ResizeMode.COVER,
                crop = CropMode.CENTER,
                quality = 85,
                format = "webp"
            )
        )

        bucket.upload(
            path = "users/$userId/$size.webp",
            data = resized.data!!
        )
    }

    // Return URL for medium size
    return bucket.getPublicUrl("users/$userId/medium.webp")
}
```

### Document Upload with Preview

```kotlin
suspend fun uploadDocument(
    userId: String,
    documentData: ByteArray,
    filename: String
): Map<String, String> {
    // Upload original document
    val bucket = client.storage.from("documents")
    val documentPath = "users/$userId/${UUID.randomUUID()}-$filename"

    bucket.upload(documentPath, documentData)

    // Generate preview (for PDFs)
    if (filename.endsWith(".pdf")) {
        val preview = generatePDFPreview(documentData)
        bucket.upload("$documentPath-preview.png", preview)
    }

    return mapOf(
        "documentUrl" to bucket.getPublicUrl(documentPath),
        "previewUrl" to bucket.getPublicUrl("$documentPath-preview.png")
    )
}
```

### Multipart Upload (Large Files)

```kotlin
suspend fun uploadLargeFile(
    bucket: String,
    path: String,
    file: File
): String {
    val chunkSize = 5 * 1024 * 1024 // 5MB chunks
    val totalSize = file.length()
    var uploaded = 0L

    file.inputStream().use { input ->
        val buffer = ByteArray(chunkSize)

        while (uploaded < totalSize) {
            val bytesRead = input.read(buffer)
            if (bytesRead == -1) break

            // Upload chunk
            val chunk = buffer.copyOf(bytesRead)
            uploadChunk(bucket, path, chunk, uploaded, totalSize)

            uploaded += bytesRead
            val progress = (uploaded.toDouble() / totalSize * 100).toInt()
            println("Upload progress: $progress%")
        }
    }

    return "$bucket/$path"
}
```

### Presigned Upload URL

```kotlin
fun generatePresignedUploadUrl(
    bucket: String,
    path: String,
    expiresIn: Long = 3600
): Map<String, String> {
    val uploadId = UUID.randomUUID().toString()
    val expiresAt = System.currentTimeMillis() + (expiresIn * 1000)

    // Store upload intent
    pendingUploads[uploadId] = UploadIntent(
        bucket = bucket,
        path = path,
        expiresAt = expiresAt
    )

    val signature = sign("$uploadId:$expiresAt", secretKey)

    return mapOf(
        "uploadUrl" to "https://yourapp.com/storage/upload/$uploadId",
        "method" to "PUT",
        "headers" to mapOf(
            "X-Upload-Signature" to signature,
            "X-Upload-Expires" to expiresAt.toString()
        ).toString()
    )
}
```

## Next Steps

- [Database Guide](DATABASE_GUIDE.md)
- [Authentication Guide](AUTH_GUIDE.md)
- [Real-time Guide](REALTIME_GUIDE.md)
- [Functions Guide](FUNCTIONS_GUIDE.md)

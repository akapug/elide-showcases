package tools.elide.oss.elidebase.storage

import io.github.oshai.kotlinlogging.KotlinLogging
import tools.elide.oss.elidebase.core.*
import tools.elide.oss.elidebase.database.DatabaseManager
import java.awt.RenderingHints
import java.awt.image.BufferedImage
import java.io.ByteArrayOutputStream
import java.io.File
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.nio.file.StandardCopyOption
import java.time.Instant
import java.util.UUID
import javax.imageio.ImageIO
import kotlin.io.path.exists
import kotlin.io.path.readBytes
import kotlin.io.path.writeBytes

private val logger = KotlinLogging.logger {}

/**
 * Storage bucket and file management system
 */
class StorageManager(
    private val dbManager: DatabaseManager,
    private val storageRoot: String = "/var/lib/elidebase/storage"
) {

    private val rootPath = Paths.get(storageRoot)
    private val buckets = mutableMapOf<String, BucketConfig>()

    init {
        // Initialize storage schema
        kotlinx.coroutines.runBlocking {
            initializeSchema()
            ensureStorageDirectory()
        }
    }

    /**
     * Initialize storage schema
     */
    private suspend fun initializeSchema() {
        val sql = """
            -- Buckets table
            CREATE TABLE IF NOT EXISTS storage.buckets (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) UNIQUE NOT NULL,
                public BOOLEAN DEFAULT FALSE,
                file_size_limit BIGINT DEFAULT 52428800,
                allowed_mime_types TEXT[],
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT valid_bucket_name CHECK (name ~ '^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$')
            );

            -- Objects table
            CREATE TABLE IF NOT EXISTS storage.objects (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                bucket_id UUID NOT NULL REFERENCES storage.buckets(id) ON DELETE CASCADE,
                name VARCHAR(1024) NOT NULL,
                path VARCHAR(2048) NOT NULL,
                size BIGINT NOT NULL,
                mime_type VARCHAR(255) NOT NULL,
                etag VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_accessed_at TIMESTAMP,
                owner_id UUID,
                metadata JSONB DEFAULT '{}',
                UNIQUE(bucket_id, path),
                CONSTRAINT valid_path CHECK (path ~ '^[a-zA-Z0-9/_.-]+$')
            );

            -- Multipart uploads tracking
            CREATE TABLE IF NOT EXISTS storage.multipart_uploads (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                upload_id VARCHAR(255) UNIQUE NOT NULL,
                bucket_id UUID NOT NULL REFERENCES storage.buckets(id) ON DELETE CASCADE,
                path VARCHAR(2048) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                owner_id UUID
            );

            -- Multipart upload parts
            CREATE TABLE IF NOT EXISTS storage.multipart_upload_parts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                upload_id VARCHAR(255) NOT NULL REFERENCES storage.multipart_uploads(upload_id) ON DELETE CASCADE,
                part_number INT NOT NULL,
                size BIGINT NOT NULL,
                etag VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(upload_id, part_number)
            );

            -- Create indexes
            CREATE INDEX IF NOT EXISTS idx_objects_bucket ON storage.objects(bucket_id);
            CREATE INDEX IF NOT EXISTS idx_objects_path ON storage.objects(path);
            CREATE INDEX IF NOT EXISTS idx_objects_owner ON storage.objects(owner_id);
            CREATE INDEX IF NOT EXISTS idx_multipart_uploads_bucket ON storage.multipart_uploads(bucket_id);
        """.trimIndent()

        dbManager.withConnection { connection ->
            // Create storage schema
            connection.createStatement().execute("CREATE SCHEMA IF NOT EXISTS storage;")

            // Execute table creation
            connection.createStatement().execute(sql)
        }

        logger.info { "Storage schema initialized" }
    }

    /**
     * Ensure storage directory exists
     */
    private fun ensureStorageDirectory() {
        if (!rootPath.exists()) {
            Files.createDirectories(rootPath)
            logger.info { "Created storage directory: $storageRoot" }
        }
    }

    /**
     * Create a new bucket
     */
    suspend fun createBucket(config: BucketConfig): ApiResponse<BucketConfig> {
        if (!isValidBucketName(config.name)) {
            return ApiResponse(error = ApiError("INVALID_BUCKET_NAME", "Bucket name must be lowercase alphanumeric with hyphens, 3-63 characters"))
        }

        return try {
            dbManager.transaction { connection ->
                val sql = """
                    INSERT INTO storage.buckets (name, public, file_size_limit, allowed_mime_types)
                    VALUES (?, ?, ?, ?)
                    RETURNING id, name, public, file_size_limit, allowed_mime_types, created_at;
                """.trimIndent()

                val bucket = connection.prepareStatement(sql).use { stmt ->
                    stmt.setString(1, config.name)
                    stmt.setBoolean(2, config.public)
                    stmt.setLong(3, config.fileSizeLimit)
                    stmt.setArray(4, connection.createArrayOf("TEXT", config.allowedMimeTypes?.toTypedArray() ?: emptyArray()))
                    stmt.executeQuery().use { rs ->
                        if (rs.next()) {
                            BucketConfig(
                                name = rs.getString("name"),
                                public = rs.getBoolean("public"),
                                fileSizeLimit = rs.getLong("file_size_limit"),
                                allowedMimeTypes = (rs.getArray("allowed_mime_types")?.array as? Array<*>)
                                    ?.mapNotNull { it as? String }
                            )
                        } else {
                            throw Exception("Failed to create bucket")
                        }
                    }
                }

                // Create bucket directory
                val bucketPath = rootPath.resolve(config.name)
                Files.createDirectories(bucketPath)

                buckets[config.name] = bucket
                logger.info { "Bucket created: ${config.name}" }

                bucket
            }

            ApiResponse(data = config)
        } catch (e: Exception) {
            logger.error(e) { "Error creating bucket" }
            ApiResponse(error = ApiError("BUCKET_ERROR", e.message ?: "Failed to create bucket"))
        }
    }

    /**
     * Delete a bucket
     */
    suspend fun deleteBucket(bucketName: String, cascade: Boolean = false): ApiResponse<Unit> {
        return try {
            dbManager.transaction { connection ->
                // Check if bucket has objects
                if (!cascade) {
                    val countSql = """
                        SELECT COUNT(*) as count
                        FROM storage.objects o
                        JOIN storage.buckets b ON o.bucket_id = b.id
                        WHERE b.name = ?;
                    """.trimIndent()

                    val count = connection.prepareStatement(countSql).use { stmt ->
                        stmt.setString(1, bucketName)
                        stmt.executeQuery().use { rs ->
                            rs.next()
                            rs.getLong("count")
                        }
                    }

                    if (count > 0) {
                        throw Exception("Bucket is not empty. Use cascade=true to delete all objects.")
                    }
                }

                // Delete bucket
                val deleteSql = "DELETE FROM storage.buckets WHERE name = ?;"
                connection.prepareStatement(deleteSql).use { stmt ->
                    stmt.setString(1, bucketName)
                    val deleted = stmt.executeUpdate()
                    if (deleted == 0) {
                        throw Exception("Bucket not found")
                    }
                }

                // Delete bucket directory
                val bucketPath = rootPath.resolve(bucketName)
                if (bucketPath.exists()) {
                    bucketPath.toFile().deleteRecursively()
                }

                buckets.remove(bucketName)
                logger.info { "Bucket deleted: $bucketName" }
            }

            ApiResponse(data = Unit)
        } catch (e: Exception) {
            logger.error(e) { "Error deleting bucket" }
            ApiResponse(error = ApiError("BUCKET_ERROR", e.message ?: "Failed to delete bucket"))
        }
    }

    /**
     * List all buckets
     */
    suspend fun listBuckets(): ApiResponse<List<BucketConfig>> {
        return try {
            val buckets = dbManager.withConnection { connection ->
                val sql = "SELECT name, public, file_size_limit, allowed_mime_types FROM storage.buckets ORDER BY name;"

                connection.createStatement().use { stmt ->
                    stmt.executeQuery(sql).use { rs ->
                        val results = mutableListOf<BucketConfig>()
                        while (rs.next()) {
                            results.add(
                                BucketConfig(
                                    name = rs.getString("name"),
                                    public = rs.getBoolean("public"),
                                    fileSizeLimit = rs.getLong("file_size_limit"),
                                    allowedMimeTypes = (rs.getArray("allowed_mime_types")?.array as? Array<*>)
                                        ?.mapNotNull { it as? String }
                                )
                            )
                        }
                        results
                    }
                }
            }

            ApiResponse(data = buckets)
        } catch (e: Exception) {
            logger.error(e) { "Error listing buckets" }
            ApiResponse(error = ApiError("BUCKET_ERROR", e.message ?: "Failed to list buckets"))
        }
    }

    /**
     * Upload a file
     */
    suspend fun uploadFile(
        bucket: String,
        path: String,
        data: ByteArray,
        mimeType: String? = null,
        ownerId: String? = null,
        metadata: Map<String, String> = emptyMap()
    ): ApiResponse<StorageObject> {
        if (!isValidObjectPath(path)) {
            return ApiResponse(error = ApiError("INVALID_PATH", "Invalid object path"))
        }

        return try {
            // Get bucket config
            val bucketConfig = getBucketConfig(bucket)
                ?: return ApiResponse(error = ApiError("BUCKET_NOT_FOUND", "Bucket not found: $bucket"))

            // Check file size
            if (data.size > bucketConfig.fileSizeLimit) {
                return ApiResponse(error = ApiError("FILE_TOO_LARGE", "File exceeds size limit of ${bucketConfig.fileSizeLimit} bytes"))
            }

            // Determine MIME type
            val detectedMimeType = mimeType ?: getMimeTypeFromExtension(getFileExtension(path))

            // Check allowed MIME types
            if (bucketConfig.allowedMimeTypes != null && !bucketConfig.allowedMimeTypes.contains(detectedMimeType)) {
                return ApiResponse(error = ApiError("MIME_TYPE_NOT_ALLOWED", "MIME type not allowed: $detectedMimeType"))
            }

            // Calculate ETag
            val etag = generateETag(data)

            // Store file on disk
            val fileName = path.substringAfterLast('/')
            val filePath = rootPath.resolve(bucket).resolve(path.replace('/', File.separatorChar))
            Files.createDirectories(filePath.parent)
            filePath.writeBytes(data)

            // Store metadata in database
            val obj = dbManager.transaction { connection ->
                // Get bucket ID
                val bucketId = connection.prepareStatement("SELECT id FROM storage.buckets WHERE name = ?;").use { stmt ->
                    stmt.setString(1, bucket)
                    stmt.executeQuery().use { rs ->
                        if (rs.next()) rs.getString("id") else throw Exception("Bucket not found")
                    }
                }

                // Delete existing object if it exists
                connection.prepareStatement("DELETE FROM storage.objects WHERE bucket_id = ? AND path = ?;").use { stmt ->
                    stmt.setObject(1, UUID.fromString(bucketId))
                    stmt.setString(2, path)
                    stmt.executeUpdate()
                }

                // Insert new object
                val insertSql = """
                    INSERT INTO storage.objects (bucket_id, name, path, size, mime_type, etag, owner_id, metadata)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?::jsonb)
                    RETURNING id, bucket_id, name, path, size, mime_type, etag, created_at, updated_at, owner_id, metadata;
                """.trimIndent()

                connection.prepareStatement(insertSql).use { stmt ->
                    stmt.setObject(1, UUID.fromString(bucketId))
                    stmt.setString(2, fileName)
                    stmt.setString(3, path)
                    stmt.setLong(4, data.size.toLong())
                    stmt.setString(5, detectedMimeType)
                    stmt.setString(6, etag)
                    stmt.setObject(7, ownerId?.let { UUID.fromString(it) })
                    stmt.setString(8, json.encodeToString(kotlinx.serialization.serializer(), metadata))
                    stmt.executeQuery().use { rs ->
                        if (rs.next()) {
                            StorageObject(
                                id = rs.getString("id"),
                                bucket = bucket,
                                path = rs.getString("path"),
                                name = rs.getString("name"),
                                size = rs.getLong("size"),
                                mimeType = rs.getString("mime_type"),
                                etag = rs.getString("etag"),
                                createdAt = rs.getTimestamp("created_at").toString(),
                                updatedAt = rs.getTimestamp("updated_at").toString(),
                                metadata = metadata
                            )
                        } else {
                            throw Exception("Failed to create object")
                        }
                    }
                }
            }

            logger.info { "File uploaded: $bucket/$path (${data.size} bytes)" }
            ApiResponse(data = obj)
        } catch (e: Exception) {
            logger.error(e) { "Error uploading file" }
            ApiResponse(error = ApiError("UPLOAD_ERROR", e.message ?: "Failed to upload file"))
        }
    }

    /**
     * Download a file
     */
    suspend fun downloadFile(bucket: String, path: String): ApiResponse<Pair<ByteArray, StorageObject>> {
        return try {
            val obj = getObjectMetadata(bucket, path)
                ?: return ApiResponse(error = ApiError("OBJECT_NOT_FOUND", "Object not found: $bucket/$path"))

            val filePath = rootPath.resolve(bucket).resolve(path.replace('/', File.separatorChar))
            if (!filePath.exists()) {
                return ApiResponse(error = ApiError("FILE_NOT_FOUND", "File not found on disk"))
            }

            val data = filePath.readBytes()

            // Update last accessed time
            dbManager.withConnection { connection ->
                val sql = "UPDATE storage.objects SET last_accessed_at = CURRENT_TIMESTAMP WHERE id = ?;"
                connection.prepareStatement(sql).use { stmt ->
                    stmt.setObject(1, UUID.fromString(obj.id))
                    stmt.executeUpdate()
                }
            }

            ApiResponse(data = data to obj)
        } catch (e: Exception) {
            logger.error(e) { "Error downloading file" }
            ApiResponse(error = ApiError("DOWNLOAD_ERROR", e.message ?: "Failed to download file"))
        }
    }

    /**
     * Delete a file
     */
    suspend fun deleteFile(bucket: String, path: String): ApiResponse<Unit> {
        return try {
            dbManager.transaction { connection ->
                // Get bucket ID
                val bucketId = connection.prepareStatement("SELECT id FROM storage.buckets WHERE name = ?;").use { stmt ->
                    stmt.setString(1, bucket)
                    stmt.executeQuery().use { rs ->
                        if (rs.next()) rs.getString("id") else throw Exception("Bucket not found")
                    }
                }

                // Delete from database
                val deleteSql = "DELETE FROM storage.objects WHERE bucket_id = ? AND path = ?;"
                val deleted = connection.prepareStatement(deleteSql).use { stmt ->
                    stmt.setObject(1, UUID.fromString(bucketId))
                    stmt.setString(2, path)
                    stmt.executeUpdate()
                }

                if (deleted == 0) {
                    throw Exception("Object not found")
                }

                // Delete file from disk
                val filePath = rootPath.resolve(bucket).resolve(path.replace('/', File.separatorChar))
                if (filePath.exists()) {
                    Files.delete(filePath)
                }
            }

            logger.info { "File deleted: $bucket/$path" }
            ApiResponse(data = Unit)
        } catch (e: Exception) {
            logger.error(e) { "Error deleting file" }
            ApiResponse(error = ApiError("DELETE_ERROR", e.message ?: "Failed to delete file"))
        }
    }

    /**
     * List files in a bucket
     */
    suspend fun listFiles(
        bucket: String,
        prefix: String? = null,
        limit: Int = 100,
        offset: Int = 0
    ): ApiResponse<List<StorageObject>> {
        return try {
            val objects = dbManager.withConnection { connection ->
                val sql = buildString {
                    append("""
                        SELECT o.id, o.name, o.path, o.size, o.mime_type, o.etag, o.created_at, o.updated_at, o.last_accessed_at, o.metadata
                        FROM storage.objects o
                        JOIN storage.buckets b ON o.bucket_id = b.id
                        WHERE b.name = ?
                    """)

                    if (prefix != null) {
                        append(" AND o.path LIKE ?")
                    }

                    append(" ORDER BY o.path LIMIT ? OFFSET ?;")
                }

                connection.prepareStatement(sql).use { stmt ->
                    var paramIndex = 1
                    stmt.setString(paramIndex++, bucket)

                    if (prefix != null) {
                        stmt.setString(paramIndex++, "$prefix%")
                    }

                    stmt.setInt(paramIndex++, limit)
                    stmt.setInt(paramIndex, offset)

                    stmt.executeQuery().use { rs ->
                        val results = mutableListOf<StorageObject>()
                        while (rs.next()) {
                            results.add(
                                StorageObject(
                                    id = rs.getString("id"),
                                    bucket = bucket,
                                    path = rs.getString("path"),
                                    name = rs.getString("name"),
                                    size = rs.getLong("size"),
                                    mimeType = rs.getString("mime_type"),
                                    etag = rs.getString("etag"),
                                    createdAt = rs.getString("created_at"),
                                    updatedAt = rs.getString("updated_at"),
                                    lastAccessedAt = rs.getString("last_accessed_at")
                                )
                            )
                        }
                        results
                    }
                }
            }

            ApiResponse(data = objects)
        } catch (e: Exception) {
            logger.error(e) { "Error listing files" }
            ApiResponse(error = ApiError("LIST_ERROR", e.message ?: "Failed to list files"))
        }
    }

    /**
     * Get object metadata
     */
    private suspend fun getObjectMetadata(bucket: String, path: String): StorageObject? {
        return dbManager.withConnection { connection ->
            val sql = """
                SELECT o.id, o.name, o.path, o.size, o.mime_type, o.etag, o.created_at, o.updated_at, o.last_accessed_at, o.metadata
                FROM storage.objects o
                JOIN storage.buckets b ON o.bucket_id = b.id
                WHERE b.name = ? AND o.path = ?;
            """.trimIndent()

            connection.prepareStatement(sql).use { stmt ->
                stmt.setString(1, bucket)
                stmt.setString(2, path)
                stmt.executeQuery().use { rs ->
                    if (rs.next()) {
                        StorageObject(
                            id = rs.getString("id"),
                            bucket = bucket,
                            path = rs.getString("path"),
                            name = rs.getString("name"),
                            size = rs.getLong("size"),
                            mimeType = rs.getString("mime_type"),
                            etag = rs.getString("etag"),
                            createdAt = rs.getString("created_at"),
                            updatedAt = rs.getString("updated_at"),
                            lastAccessedAt = rs.getString("last_accessed_at")
                        )
                    } else {
                        null
                    }
                }
            }
        }
    }

    /**
     * Get bucket configuration
     */
    private suspend fun getBucketConfig(bucketName: String): BucketConfig? {
        return buckets[bucketName] ?: run {
            dbManager.withConnection { connection ->
                val sql = "SELECT name, public, file_size_limit, allowed_mime_types FROM storage.buckets WHERE name = ?;"

                connection.prepareStatement(sql).use { stmt ->
                    stmt.setString(1, bucketName)
                    stmt.executeQuery().use { rs ->
                        if (rs.next()) {
                            val config = BucketConfig(
                                name = rs.getString("name"),
                                public = rs.getBoolean("public"),
                                fileSizeLimit = rs.getLong("file_size_limit"),
                                allowedMimeTypes = (rs.getArray("allowed_mime_types")?.array as? Array<*>)
                                    ?.mapNotNull { it as? String }
                            )
                            buckets[bucketName] = config
                            config
                        } else {
                            null
                        }
                    }
                }
            }
        }
    }
}

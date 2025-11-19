/**
 * Media Service
 *
 * Handles file uploads, image processing (using Python for advanced features),
 * and media management. Demonstrates Elide's polyglot capabilities.
 */

import { writeFile, readFile, mkdir, exists, unlink, readdir } from 'elide:fs';
import { join, extname, basename } from 'elide:path';
import { randomBytes } from 'crypto';
import { Python } from 'elide:python'; // Polyglot image processing

export class MediaService {
  constructor(config) {
    this.config = config;
    this.python = null;
  }

  async initialize() {
    // Initialize Python runtime for image processing
    if (this.config.imageProcessing.enabled) {
      try {
        this.python = new Python();
        await this.loadImageProcessor();
      } catch (error) {
        console.warn('Python image processing not available:', error.message);
        this.config.imageProcessing.enabled = false;
      }
    }
  }

  async loadImageProcessor() {
    // Load Python image processing script
    const script = `
from PIL import Image
import io
import base64

def resize_image(image_data, width, height, format='JPEG'):
    """Resize an image to specified dimensions"""
    img = Image.open(io.BytesIO(image_data))

    # Convert RGBA to RGB for JPEG
    if img.mode == 'RGBA' and format == 'JPEG':
        background = Image.new('RGB', img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[3])
        img = background

    # Calculate resize dimensions maintaining aspect ratio
    img.thumbnail((width, height), Image.Resampling.LANCZOS)

    # Save to bytes
    output = io.BytesIO()
    img.save(output, format=format, quality=85, optimize=True)
    return output.getvalue()

def optimize_image(image_data, format='JPEG', quality=85):
    """Optimize an image"""
    img = Image.open(io.BytesIO(image_data))

    if img.mode == 'RGBA' and format == 'JPEG':
        background = Image.new('RGB', img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[3])
        img = background

    output = io.BytesIO()
    img.save(output, format=format, quality=quality, optimize=True)
    return output.getvalue()

def get_image_info(image_data):
    """Get image dimensions and format"""
    img = Image.open(io.BytesIO(image_data))
    return {
        'width': img.width,
        'height': img.height,
        'format': img.format,
        'mode': img.mode
    }
`;

    await this.python.exec(script);
  }

  async upload(req, res) {
    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      throw {
        status: 400,
        code: 'NO_FILE',
        message: 'No file provided',
      };
    }

    // Validate file type
    if (!this.config.allowedTypes.includes(file.type)) {
      throw {
        status: 400,
        code: 'INVALID_TYPE',
        message: `File type ${file.type} not allowed`,
      };
    }

    // Validate file size
    if (file.size > this.config.maxFileSize) {
      throw {
        status: 400,
        code: 'FILE_TOO_LARGE',
        message: `File size exceeds ${this.config.maxFileSize} bytes`,
      };
    }

    // Read file data
    const buffer = await file.arrayBuffer();
    const data = new Uint8Array(buffer);

    // Generate unique filename
    const ext = extname(file.name);
    const hash = randomBytes(16).toString('hex');
    const filename = `${hash}${ext}`;

    // Create upload directory structure
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    const uploadDir = join(this.config.uploadPath, String(year), month);

    if (!await exists(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Save original file
    const originalPath = join(uploadDir, filename);
    await writeFile(originalPath, data);

    // Get image info
    let width = null;
    let height = null;
    let format = null;

    if (this.python && this.config.imageProcessing.enabled) {
      try {
        const info = await this.python.call('get_image_info', data);
        width = info.width;
        height = info.height;
        format = info.format;

        // Generate thumbnails
        await this.generateThumbnails(data, uploadDir, hash, ext);
      } catch (error) {
        console.warn('Image processing failed:', error.message);
      }
    }

    // Build URL
    const url = `/${this.config.uploadPath}/${year}/${month}/${filename}`;
    const thumbnailUrl = `/${this.config.uploadPath}/${year}/${month}/${hash}_thumbnail${ext}`;

    // Save to database
    const imageId = await req.app.db.create('images', {
      filename,
      url,
      thumbnail_url: thumbnailUrl,
      size: file.size,
      width,
      height,
      type: file.type,
      uploaded_by: req.user.id,
      created_at: new Date().toISOString(),
    });

    return {
      image: {
        id: imageId,
        url,
        thumbnailUrl,
        filename: file.name,
        size: file.size,
        width,
        height,
        type: file.type,
      },
    };
  }

  async generateThumbnails(data, uploadDir, hash, ext) {
    const sizes = this.config.imageProcessing.sizes;

    for (const [name, dimensions] of Object.entries(sizes)) {
      try {
        const resized = await this.python.call(
          'resize_image',
          data,
          dimensions.width,
          dimensions.height,
          this.getImageFormat(ext)
        );

        const thumbnailPath = join(uploadDir, `${hash}_${name}${ext}`);
        await writeFile(thumbnailPath, new Uint8Array(resized));
      } catch (error) {
        console.warn(`Failed to generate ${name} thumbnail:`, error.message);
      }
    }
  }

  async list(req, res) {
    const {
      page = 1,
      limit = 20,
      type = '',
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let sql = 'SELECT * FROM images WHERE 1=1';
    const params = [];

    if (type) {
      sql += ' AND type LIKE ?';
      params.push(`${type}%`);
    }

    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
    const { total } = await req.app.db.queryOne(countSql, params);

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const images = await req.app.db.query(sql, params);

    return {
      images,
      meta: {
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
          total,
        },
      },
    };
  }

  async delete(req, res) {
    const { id } = req.params;

    const image = await req.app.db.findById('images', id);

    if (!image) {
      throw {
        status: 404,
        code: 'IMAGE_NOT_FOUND',
        message: 'Image not found',
      };
    }

    // Delete files
    try {
      const imagePath = join(process.cwd(), image.url);
      if (await exists(imagePath)) {
        await unlink(imagePath);
      }

      // Delete thumbnails
      if (image.thumbnail_url) {
        const thumbnailPath = join(process.cwd(), image.thumbnail_url);
        if (await exists(thumbnailPath)) {
          await unlink(thumbnailPath);
        }
      }

      // Delete all size variants
      const dir = dirname(imagePath);
      const base = basename(image.filename, extname(image.filename));
      const files = await readdir(dir);

      for (const file of files) {
        if (file.startsWith(base)) {
          const filePath = join(dir, file);
          if (await exists(filePath)) {
            await unlink(filePath);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to delete image files:', error.message);
    }

    // Delete from database
    await req.app.db.delete('images', id);

    return { success: true };
  }

  getImageFormat(ext) {
    const formats = {
      '.jpg': 'JPEG',
      '.jpeg': 'JPEG',
      '.png': 'PNG',
      '.gif': 'GIF',
      '.webp': 'WEBP',
    };

    return formats[ext.toLowerCase()] || 'JPEG';
  }
}

# Edge Image Optimizer

A high-performance image optimization service running at the edge, providing dynamic resizing, format conversion, quality optimization, and intelligent caching with support for modern formats like WebP and AVIF.

## Features

### Dynamic Resizing
- Width and height specification
- Multiple fit modes: cover, contain, fill, inside, outside
- Aspect ratio preservation
- Smart cropping
- Upscaling and downscaling

### Format Conversion
- Automatic format detection
- Modern format support: WebP, AVIF
- Classic formats: JPEG, PNG, GIF
- Auto format selection based on Accept header
- Content negotiation

### Quality Optimization
- Configurable quality levels (1-100)
- Smart quality selection
- Perceptual quality optimization
- File size optimization
- Visual quality preservation

### Image Filters
- Blur effect
- Sharpening
- Grayscale conversion
- Rotation
- Color adjustments

### Lazy Loading Support
- SVG placeholder generation
- LQIP (Low Quality Image Placeholder)
- Progressive loading
- Bandwidth optimization

### Intelligent Caching
- In-memory cache with LRU eviction
- Transform-aware cache keys
- ETag support for validation
- Cache statistics and monitoring
- Automatic stale entry cleanup

## API Usage

### Basic Image Request
```
GET /images/photo.jpg
```

### Resize Image
```
GET /images/photo.jpg?w=800&h=600
GET /images/photo.jpg?width=800&height=600
```

### Fit Modes
```
GET /images/photo.jpg?w=800&h=600&fit=cover   # Crop to fill
GET /images/photo.jpg?w=800&h=600&fit=contain # Fit inside
GET /images/photo.jpg?w=800&h=600&fit=fill    # Stretch to fill
```

### Format Conversion
```
GET /images/photo.jpg?format=webp     # Convert to WebP
GET /images/photo.jpg?format=avif     # Convert to AVIF
GET /images/photo.jpg?f=auto          # Auto-select best format
```

### Quality Optimization
```
GET /images/photo.jpg?quality=80      # Set quality to 80%
GET /images/photo.jpg?q=60            # Lower quality, smaller size
```

### Image Filters
```
GET /images/photo.jpg?blur=5          # Apply blur
GET /images/photo.jpg?sharpen         # Sharpen image
GET /images/photo.jpg?grayscale       # Convert to grayscale
GET /images/photo.jpg?bw              # Black and white (alias)
GET /images/photo.jpg?rotate=90       # Rotate 90 degrees
```

### Combined Transformations
```
GET /images/photo.jpg?w=800&format=webp&q=85&sharpen
```

### Lazy Loading
```
GET /images/photo.jpg?placeholder     # Get SVG placeholder
GET /images/photo.jpg?lazy            # Get LQIP
```

## Response Headers

All optimized images include these headers:

```
Content-Type: image/webp
Cache-Control: public, max-age=31536000, immutable
ETag: "abc123-45678"
X-Cache: HIT|MISS
X-Original-Size: 250000
X-Optimized-Size: 87500
X-Savings-Percent: 65.00
X-Optimization-Duration: 45ms
Vary: Accept
```

## Admin Endpoints

### Cache Statistics
```
GET /_image/stats
```

Response:
```json
{
  "entries": 156,
  "cacheSizeBytes": 45678900,
  "maxSizeBytes": 209715200,
  "originalSizeBytes": 125000000,
  "optimizedSizeBytes": 45678900,
  "savingsPercent": "63.46"
}
```

### Clear Cache
```
GET /_image/clear
```

Response:
```json
{
  "message": "Cache cleared"
}
```

## Usage Examples

### HTML with Responsive Images
```html
<img
  src="https://edge.example.com/images/hero.jpg?w=800&format=auto&q=85"
  srcset="
    https://edge.example.com/images/hero.jpg?w=400&format=auto&q=85 400w,
    https://edge.example.com/images/hero.jpg?w=800&format=auto&q=85 800w,
    https://edge.example.com/images/hero.jpg?w=1200&format=auto&q=85 1200w
  "
  sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
  alt="Hero image"
/>
```

### Lazy Loading with Placeholder
```html
<img
  src="https://edge.example.com/images/product.jpg?placeholder&w=600&h=400"
  data-src="https://edge.example.com/images/product.jpg?w=600&h=400&format=auto&q=85"
  class="lazyload"
  alt="Product image"
/>
```

### Thumbnail Grid
```html
<img src="https://edge.example.com/images/thumb1.jpg?w=300&h=300&fit=cover&format=webp&q=80" />
<img src="https://edge.example.com/images/thumb2.jpg?w=300&h=300&fit=cover&format=webp&q=80" />
<img src="https://edge.example.com/images/thumb3.jpg?w=300&h=300&fit=cover&format=webp&q=80" />
```

### Avatar with Fallback
```html
<picture>
  <source
    type="image/avif"
    srcset="https://edge.example.com/avatars/user.jpg?w=200&h=200&format=avif&q=85"
  />
  <source
    type="image/webp"
    srcset="https://edge.example.com/avatars/user.jpg?w=200&h=200&format=webp&q=85"
  />
  <img
    src="https://edge.example.com/avatars/user.jpg?w=200&h=200&format=jpeg&q=85"
    alt="User avatar"
  />
</picture>
```

## Architecture

### Request Flow
1. Request arrives with transform parameters
2. Cache key generated from URL + transforms
3. Check cache for optimized image
4. If miss, fetch original from origin/storage
5. Apply transformations (resize, convert, filter)
6. Optimize and compress
7. Store in cache
8. Return optimized image

### Cache Strategy
- Transform-aware keys (URL + all parameters)
- LRU eviction when cache is full
- 1-hour TTL for cache entries
- Automatic cleanup of stale entries

### Format Selection
Priority order for auto format:
1. AVIF (if browser supports)
2. WebP (if browser supports)
3. PNG (for graphics/transparency)
4. JPEG (default for photos)

### Optimization Pipeline
1. Format detection
2. Dimension calculation
3. Resizing/cropping
4. Format conversion
5. Quality adjustment
6. Filter application
7. Compression
8. Caching

## Performance Characteristics

- Cache lookup: O(1)
- Format detection: O(1)
- Image optimization: O(n) where n = pixel count
- Cache eviction: O(m) where m = cache entries

## Configuration

### Cache Settings
```typescript
maxSize: 200 * 1024 * 1024  // 200MB cache
cacheTTL: 3600000            // 1 hour
```

### Default Quality
```typescript
jpeg: 85
webp: 85
avif: 80
png: 90
```

### Limits
```typescript
maxWidth: 4000
maxHeight: 4000
maxFileSize: 50 * 1024 * 1024  // 50MB
```

## Browser Support

### AVIF
- Chrome 85+
- Firefox 93+
- Safari 16+

### WebP
- Chrome 32+
- Firefox 65+
- Safari 14+
- Edge 18+

## Production Considerations

1. **Image Processing Library**: Integrate Sharp, ImageMagick, or libvips
2. **Storage Backend**: Use S3, GCS, or CDN for original images
3. **Distributed Cache**: Implement Redis for multi-region consistency
4. **Rate Limiting**: Prevent abuse of expensive transformations
5. **Authentication**: Protect expensive operations
6. **Monitoring**: Track optimization metrics, cache hit rates
7. **Error Handling**: Fallback to original on optimization failure
8. **Memory Limits**: Configure based on edge platform constraints
9. **Worker Isolation**: Ensure transformations don't block other requests
10. **Cost Optimization**: Cache aggressively to reduce compute

## Edge Platform Deployment

### Cloudflare Workers
```javascript
// Use Cloudflare Image Resizing or custom implementation
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
```

### Fastly Compute@Edge
```rust
// Use Fastly Image Optimizer or custom WASM
#[fastly::main]
fn main(req: Request) -> Result<Response, Error> {
    optimize_image(req)
}
```

### AWS Lambda@Edge
```javascript
exports.handler = async (event) => {
  const request = event.Records[0].cf.request;
  return optimizeImage(request);
};
```

## Bandwidth Savings

Typical savings with optimization:
- JPEG to WebP: 25-35%
- JPEG to AVIF: 40-50%
- PNG to WebP: 25-40%
- Quality 85 vs 100: 30-50%
- Proper sizing: 50-90%

Combined optimizations can achieve 70-90% bandwidth reduction.

## Testing

```bash
# Start the optimizer
deno run --allow-net server.ts

# Test basic optimization
curl -I http://localhost:8082/images/test.jpg

# Test WebP conversion
curl -I http://localhost:8082/images/test.jpg?format=webp

# Test resizing
curl -I http://localhost:8082/images/test.jpg?w=800&h=600

# Check cache stats
curl http://localhost:8082/_image/stats

# Get placeholder
curl http://localhost:8082/images/test.jpg?placeholder
```

## Security

- Validate all transformation parameters
- Limit maximum dimensions to prevent DoS
- Implement rate limiting per IP
- Sanitize file paths to prevent directory traversal
- Verify image formats to prevent malicious files
- Set appropriate CORS headers
- Use signed URLs for sensitive images

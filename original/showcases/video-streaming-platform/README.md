# Video Streaming Platform

A production-ready video streaming service built with TypeScript that provides enterprise-grade video delivery with adaptive bitrate streaming, CDN integration, and comprehensive analytics.

## Features

### 🎥 Video Upload & Processing
- Multi-format video upload (MP4, MOV, AVI, MKV, WebM)
- File size validation (up to 5GB)
- Streaming upload to prevent memory overflow
- Metadata extraction (duration, resolution, bitrate)

### 🔄 Transcoding Pipeline
- Asynchronous job queue with priority scheduling
- Multiple quality variants (360p to 4K)
- Concurrent transcoding with configurable workers
- Progress tracking and error handling
- Automatic retry mechanism

### 📺 Adaptive Bitrate Streaming
- **HLS (HTTP Live Streaming)** support
- **DASH (Dynamic Adaptive Streaming over HTTP)** support
- Multiple quality variants for adaptive switching
- Automatic quality selection based on bandwidth
- Seamless quality transitions

### 🌐 CDN Integration
- Multi-region edge distribution
- Automatic cache invalidation
- Optimized delivery paths
- Configurable cache TTL
- Support for major CDN providers (CloudFront, Fastly, Cloudflare)

### 📊 Analytics & Tracking
- Real-time viewer sessions
- Playback position tracking
- Buffer health monitoring
- Quality switch tracking
- Completion rate calculation
- Aggregated video metrics

### 🔒 Additional Features
- DRM support (ready for integration)
- Content protection
- Thumbnail generation
- Subtitle/caption support
- Live streaming capabilities (extensible)

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ├──────────────────────────┐
       │                          │
       v                          v
┌──────────────┐          ┌──────────────┐
│Upload Manager│          │    Streaming │
└──────┬───────┘          │    Endpoint  │
       │                  └──────┬───────┘
       v                         │
┌──────────────┐                 v
│  Transcode   │          ┌──────────────┐
│   Pipeline   │          │     CDN      │
└──────┬───────┘          │   Manager    │
       │                  └──────────────┘
       v
┌──────────────┐
│  Analytics   │
│   Tracker    │
└──────────────┘
```

## API Endpoints

### Upload Video
```http
POST /upload
Content-Type: multipart/form-data

Response:
{
  "videoId": "uuid",
  "status": "processing"
}
```

### Get Stream Manifest
```http
GET /stream/:videoId

Response:
{
  "type": "hls",
  "url": "https://cdn.example.com/videos/uuid/master.m3u8",
  "variants": [
    {
      "resolution": "1080p",
      "bitrate": 5000000,
      "url": "https://cdn.example.com/videos/uuid/1080p.m3u8"
    }
  ]
}
```

### Start Viewer Session
```http
POST /session/start
Content-Type: application/json

{
  "videoId": "uuid",
  "userId": "user123" (optional)
}

Response:
{
  "sessionId": "session-uuid"
}
```

### Track Playback
```http
POST /session/track
Content-Type: application/json

{
  "sessionId": "session-uuid",
  "position": 45.5,
  "bufferHealth": 8.2
}
```

### Get Video Analytics
```http
GET /analytics/:videoId

Response:
{
  "totalViews": 1234,
  "activeViewers": 42,
  "avgBufferHealth": 8.5,
  "avgQualitySwitches": 2.3
}
```

## Usage

### Installation
```bash
npm install
```

### Running the Server
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### Uploading a Video
```bash
curl -X POST http://localhost:3000/upload \
  -H "Content-Type: video/mp4" \
  -H "Content-Disposition: filename=\"myvideo.mp4\"" \
  --data-binary @myvideo.mp4
```

### Playing a Video
```javascript
// Using HLS.js
const video = document.querySelector('video');
const hls = new Hls();

fetch('/stream/video-id')
  .then(res => res.json())
  .then(manifest => {
    hls.loadSource(manifest.url);
    hls.attachMedia(video);
  });
```

## Configuration

### Environment Variables
```env
# Server
PORT=3000
UPLOAD_DIR=/tmp/uploads
TRANSCODE_DIR=/tmp/transcoded

# Transcoding
MAX_CONCURRENT_JOBS=4
TRANSCODE_QUALITY_PRESETS=360p,480p,720p,1080p,4k

# CDN
CDN_ENDPOINT=https://cdn.example.com
CDN_ACCESS_KEY=your-access-key
CDN_REGIONS=us-east-1,eu-west-1,ap-southeast-1
CDN_CACHE_TTL=86400

# Storage
STORAGE_BACKEND=s3
S3_BUCKET=video-storage
S3_REGION=us-east-1

# Analytics
ANALYTICS_ENABLED=true
ANALYTICS_BATCH_SIZE=100
ANALYTICS_FLUSH_INTERVAL=10000
```

### Transcoding Presets
Customize quality variants in the `TranscodingPipeline` class:

```typescript
private readonly presets: Record<string, TranscodeFormat> = {
  '4k': { resolution: '3840x2160', bitrate: '15000k', codec: 'h264' },
  '1080p': { resolution: '1920x1080', bitrate: '5000k', codec: 'h264' },
  '720p': { resolution: '1280x720', bitrate: '2500k', codec: 'h264' },
  '480p': { resolution: '854x480', bitrate: '1000k', codec: 'h264' },
  '360p': { resolution: '640x360', bitrate: '500k', codec: 'h264' },
};
```

## Performance Considerations

### Scalability
- **Horizontal scaling**: Deploy multiple instances behind a load balancer
- **Transcoding workers**: Use separate worker nodes for CPU-intensive transcoding
- **Database**: Store metadata in PostgreSQL/MongoDB for persistence
- **Queue**: Use Redis or RabbitMQ for robust job queuing
- **Object storage**: Use S3/GCS for video file storage

### Optimization Tips
1. **Chunk uploads**: Implement resumable uploads for large files
2. **Progressive upload**: Start transcoding while upload is in progress
3. **Thumbnail sprites**: Generate VTT thumbnail tracks for seek previews
4. **Edge caching**: Leverage CDN caching with appropriate headers
5. **Compression**: Enable gzip/brotli for manifest files

## Production Deployment

### Required Services
1. **Transcoding**: FFmpeg installed on worker nodes
2. **Storage**: S3/GCS/Azure Blob Storage
3. **CDN**: CloudFront/Fastly/Cloudflare
4. **Database**: PostgreSQL for metadata
5. **Queue**: Redis/RabbitMQ for job management
6. **Monitoring**: Prometheus/Grafana for metrics

### Docker Deployment
```dockerfile
FROM node:18-alpine
RUN apk add --no-cache ffmpeg
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
CMD ["node", "dist/server.js"]
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: video-streaming
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api
        image: video-streaming:latest
        resources:
          requests:
            cpu: 1000m
            memory: 2Gi
          limits:
            cpu: 2000m
            memory: 4Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: video-transcoder
spec:
  replicas: 5
  template:
    spec:
      containers:
      - name: transcoder
        image: video-transcoder:latest
        resources:
          requests:
            cpu: 4000m
            memory: 8Gi
```

## Security

### Recommendations
1. **Authentication**: Implement JWT/OAuth for API access
2. **Authorization**: Role-based access control for uploads
3. **DRM**: Integrate Widevine/FairPlay for premium content
4. **Encryption**: Use TLS for all communications
5. **Signed URLs**: Generate time-limited CDN URLs
6. **Rate limiting**: Prevent abuse with rate limits
7. **Content scanning**: Scan uploads for malware/inappropriate content

## Monitoring & Observability

### Key Metrics
- Upload success rate
- Transcoding queue depth
- Transcoding job duration
- CDN cache hit ratio
- Streaming errors
- Average buffer health
- Quality switch frequency
- Viewer engagement metrics

### Logging
```typescript
// Structured logging example
logger.info('video_uploaded', {
  videoId,
  userId,
  fileSize,
  format,
  duration,
});
```

## License

MIT

## Support

For issues and questions, please open an issue on GitHub or contact support@example.com.

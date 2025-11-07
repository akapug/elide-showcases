# Image Generation API

Production-ready Stable Diffusion API for AI-powered image generation with comprehensive features and queue management.

## Reality Check

**Status:** Educational / Reference Implementation

**What This Is:**
- Complete async job queue system for long-running image generation tasks
- Production-ready REST API with all Stable Diffusion features (text2img, img2img, inpainting, style transfer)
- Demonstrates proper parameter handling (samplers, guidance scale, seeds, etc.)
- Shows how to track job status, handle cancellations, and manage concurrent processing

**What This Isn't:**
- Does not include actual Stable Diffusion model files (would be 2-7GB per model)
- Uses simulated image generation that returns placeholder base64 images
- Requires actual diffusion model integration for real image generation

**To Make It Production-Ready:**
1. Integrate Stable Diffusion via diffusers library (HuggingFace) or ComfyUI
2. Load model weights (SD 1.5, SDXL, or custom fine-tuned models)
3. Add GPU acceleration (CUDA required, 8GB+ VRAM recommended)
4. Configure proper image preprocessing, VAE decoding, and safety checkers

**Value:** Shows the complete architecture for async image generation services including job queuing, concurrent processing, multiple generation modes, model management, and the API patterns used by Midjourney-style services.

## Features

### Generation Modes
- **Text-to-Image**: Generate images from text descriptions
- **Image-to-Image**: Transform existing images based on prompts
- **Inpainting**: Fill in masked regions of images
- **Style Transfer**: Apply artistic styles to images

### Queue Management
- **Async Processing**: Non-blocking job queue
- **Concurrent Processing**: Multiple simultaneous generations
- **Job Tracking**: Real-time status monitoring
- **Priority Queuing**: Future support for priority jobs

### Model Management
- **Multiple Models**: Support for various Stable Diffusion models
- **Model Loading**: Dynamic model loading and switching
- **Model Registry**: Catalog of available models
- **Fine-tuned Models**: Custom and specialized models

### Advanced Controls
- **Sampling Methods**: Multiple samplers (Euler, DPM, etc.)
- **Guidance Scale**: Control adherence to prompt
- **Seed Control**: Reproducible generations
- **Step Control**: Balance quality vs. speed

## API Endpoints

### POST /generate/text2img
Generate images from text prompts.

**Request:**
```json
{
  "prompt": "A beautiful sunset over mountains, photorealistic, 4k",
  "negativePrompt": "blurry, low quality, distorted",
  "width": 512,
  "height": 512,
  "steps": 30,
  "guidanceScale": 7.5,
  "seed": 42,
  "sampler": "euler_a",
  "model": "stable-diffusion-v1.5"
}
```

**Response (202 Accepted):**
```json
{
  "id": "job_1699363200000_abc123",
  "type": "text2img",
  "status": "queued",
  "request": { ... },
  "createdAt": "2025-11-07T10:00:00.000Z",
  "progress": 0
}
```

### POST /generate/img2img
Transform existing images with text prompts.

**Request:**
```json
{
  "prompt": "Turn this into a watercolor painting",
  "initImage": "data:image/png;base64,iVBORw0KG...",
  "strength": 0.75,
  "width": 512,
  "height": 512,
  "steps": 30,
  "guidanceScale": 7.5
}
```

**Parameters:**
- `strength`: 0-1, how much to transform (0=no change, 1=complete change)

### POST /generate/inpaint
Fill in masked regions of images.

**Request:**
```json
{
  "prompt": "A red sports car",
  "image": "data:image/png;base64,iVBORw0KG...",
  "mask": "data:image/png;base64,iVBORw0KG...",
  "inpaintingStrength": 0.9,
  "steps": 40
}
```

**Mask Format:**
- White pixels (255) = areas to inpaint
- Black pixels (0) = areas to preserve

### POST /generate/style-transfer
Apply artistic styles to images.

**Request:**
```json
{
  "contentImage": "data:image/png;base64,iVBORw0KG...",
  "styleImage": "data:image/png;base64,iVBORw0KG...",
  "styleStrength": 0.7,
  "contentStrength": 0.3
}
```

### GET /jobs/:id
Get status and results of a generation job.

**Response:**
```json
{
  "id": "job_1699363200000_abc123",
  "type": "text2img",
  "status": "completed",
  "request": { ... },
  "result": {
    "images": ["data:image/png;base64,iVBORw0KG..."],
    "seed": 42,
    "parameters": {
      "prompt": "A beautiful sunset...",
      "width": 512,
      "height": 512,
      "steps": 30,
      "guidanceScale": 7.5,
      "sampler": "euler_a",
      "model": "stable-diffusion-v1.5"
    },
    "timeTaken": 15230
  },
  "createdAt": "2025-11-07T10:00:00.000Z",
  "startedAt": "2025-11-07T10:00:05.000Z",
  "completedAt": "2025-11-07T10:00:20.000Z",
  "progress": 100
}
```

### GET /jobs
List all generation jobs with optional filtering.

**Query Parameters:**
- `status`: Filter by status (queued, processing, completed, failed)

**Response:**
```json
{
  "jobs": [
    {
      "id": "job_123",
      "type": "text2img",
      "status": "completed",
      "createdAt": "2025-11-07T10:00:00.000Z"
    }
  ]
}
```

### GET /queue/status
Get queue statistics and performance metrics.

**Response:**
```json
{
  "queuedJobs": 3,
  "processingJobs": 2,
  "completedJobs": 147,
  "failedJobs": 2,
  "averageProcessingTime": 14523
}
```

### POST /jobs/:id/cancel
Cancel a queued job.

**Response:**
```json
{
  "success": true
}
```

### GET /models
List available models.

**Response:**
```json
{
  "models": [
    {
      "id": "stable-diffusion-v1.5",
      "name": "Stable Diffusion v1.5",
      "description": "General purpose text-to-image model",
      "type": "base",
      "loaded": true,
      "version": "1.5"
    }
  ]
}
```

## Installation

```bash
bun install
```

## Usage

### Starting the Server

```bash
bun run server.ts
```

The server will start on `http://localhost:3003`.

### Generate an Image

```bash
curl -X POST http://localhost:3003/generate/text2img \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A serene lake surrounded by mountains at sunset",
    "steps": 30,
    "width": 512,
    "height": 512
  }'
```

### Check Job Status

```bash
curl http://localhost:3003/jobs/job_1699363200000_abc123
```

### Poll for Completion

```bash
while true; do
  status=$(curl -s http://localhost:3003/jobs/job_123 | jq -r '.status')
  if [ "$status" = "completed" ]; then
    break
  fi
  sleep 2
done
```

## Parameter Guide

### Prompt Engineering

**Good Prompts:**
- "A photorealistic portrait of a cat, detailed fur, studio lighting, 4k"
- "Cyberpunk city at night, neon lights, rain, cinematic, highly detailed"
- "Oil painting of a forest, impressionist style, vibrant colors"

**Negative Prompts:**
- "blurry, low quality, distorted, deformed, ugly, bad anatomy"
- "watermark, text, signature, out of frame"

### Steps
- **15-20**: Fast, lower quality
- **25-35**: Balanced (recommended)
- **40-50**: High quality, slower

### Guidance Scale
- **1-5**: Creative, loose interpretation
- **7-9**: Balanced (recommended)
- **10-15**: Strict adherence to prompt

### Samplers
- **euler_a**: Fast, good quality (default)
- **dpm++_2m**: High quality, slower
- **ddim**: Consistent results
- **plms**: Fast, creative

### Image Dimensions
Common sizes:
- 512x512: Square, fastest
- 768x512: Landscape
- 512x768: Portrait
- 1024x1024: High resolution (slower)

## Advanced Usage

### Reproducible Generation

Use seeds for reproducible results:

```bash
curl -X POST http://localhost:3003/generate/text2img \
  -d '{
    "prompt": "A red apple",
    "seed": 42,
    "steps": 30
  }'
```

### Batch Generation

Generate multiple variations:

```bash
for i in {1..5}; do
  curl -X POST http://localhost:3003/generate/text2img \
    -d '{
      "prompt": "A unique landscape",
      "seed": '$i'
    }'
done
```

### Image-to-Image Workflow

```bash
# 1. Upload base image (base64 encode)
BASE_IMG=$(base64 -w 0 input.png)

# 2. Generate transformation
curl -X POST http://localhost:3003/generate/img2img \
  -d '{
    "prompt": "Transform into anime style",
    "initImage": "data:image/png;base64,'$BASE_IMG'",
    "strength": 0.6
  }'
```

### Inpainting Workflow

```bash
# 1. Create mask (white = inpaint, black = keep)
# 2. Encode both images
IMAGE=$(base64 -w 0 image.png)
MASK=$(base64 -w 0 mask.png)

# 3. Generate inpainted image
curl -X POST http://localhost:3003/generate/inpaint \
  -d '{
    "prompt": "A red car",
    "image": "data:image/png;base64,'$IMAGE'",
    "mask": "data:image/png;base64,'$MASK'",
    "steps": 40
  }'
```

## Queue Management

### Concurrent Processing

Configure concurrent job processing:

```typescript
const jobQueue = new JobQueueManager(generator, 4); // Process 4 jobs simultaneously
```

### Job Priorities

Future feature - assign priorities:

```typescript
jobQueue.createJob("text2img", request, { priority: "high" });
```

### Resource Management

Monitor queue load:

```bash
watch -n 1 'curl -s http://localhost:3003/queue/status | jq'
```

## Performance Optimization

### Hardware Acceleration
- **CUDA**: NVIDIA GPU acceleration (recommended)
- **ROCm**: AMD GPU support
- **CPU**: Fallback (slower)

### Memory Management
- Monitor VRAM usage
- Adjust batch sizes based on GPU memory
- Use lower resolutions for faster generation

### Caching
- Cache model weights
- Reuse loaded models
- Implement result caching for common prompts

## Error Handling

### Common Errors

**Invalid Prompt:**
```json
{
  "error": "Prompt is required"
}
```

**Job Not Found:**
```json
{
  "error": "Job not found"
}
```

**Model Not Loaded:**
```json
{
  "error": "Model stable-diffusion-xl not loaded"
}
```

### Retry Logic

```typescript
async function generateWithRetry(prompt: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const job = await createJob({ prompt });
      return await pollJob(job.id);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}
```

## Production Deployment

### Environment Variables

```bash
PORT=3003
MAX_CONCURRENT_JOBS=4
MODEL_PATH=/models
CUDA_VISIBLE_DEVICES=0
MAX_QUEUE_SIZE=100
JOB_TIMEOUT=300000
ENABLE_NSFW_FILTER=true
```

### Docker Deployment

```dockerfile
FROM nvidia/cuda:12.2-runtime-ubuntu22.04

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash

WORKDIR /app
COPY package.json .
RUN bun install

# Download models
RUN mkdir -p /models
# Add model download script here

COPY . .

EXPOSE 3003
CMD ["bun", "run", "server.ts"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  image-generation:
    build: .
    ports:
      - "3003:3003"
    environment:
      - MAX_CONCURRENT_JOBS=2
      - MODEL_PATH=/models
    volumes:
      - ./models:/models
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: image-generation-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: image-generation
  template:
    metadata:
      labels:
        app: image-generation
    spec:
      containers:
      - name: api
        image: image-generation:latest
        ports:
        - containerPort: 3003
        resources:
          limits:
            nvidia.com/gpu: 1
          requests:
            memory: "8Gi"
            cpu: "4"
```

## Best Practices

1. **Prompt Quality**: Invest time in crafting detailed prompts
2. **Parameter Tuning**: Adjust steps and guidance for quality/speed balance
3. **Resource Monitoring**: Monitor GPU usage and queue length
4. **Error Handling**: Implement retry logic for transient failures
5. **Content Moderation**: Use NSFW filters for production
6. **Rate Limiting**: Implement rate limits to prevent abuse
7. **Result Caching**: Cache results for popular prompts

## Integration Examples

### Python Client

```python
import requests
import time
import base64

def generate_image(prompt, output_path):
    # Create job
    response = requests.post(
        "http://localhost:3003/generate/text2img",
        json={
            "prompt": prompt,
            "steps": 30,
            "width": 512,
            "height": 512
        }
    )
    job_id = response.json()["id"]

    # Poll for completion
    while True:
        job = requests.get(f"http://localhost:3003/jobs/{job_id}").json()
        if job["status"] == "completed":
            # Decode and save image
            img_data = base64.b64decode(job["result"]["images"][0])
            with open(output_path, "wb") as f:
                f.write(img_data)
            break
        elif job["status"] == "failed":
            raise Exception(job["error"])
        time.sleep(2)

generate_image("A beautiful landscape", "output.png")
```

### JavaScript Client

```javascript
async function generateImage(prompt) {
  const response = await fetch("http://localhost:3003/generate/text2img", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, steps: 30 })
  });

  const job = await response.json();

  // Poll for completion
  while (true) {
    const status = await fetch(`http://localhost:3003/jobs/${job.id}`);
    const jobData = await status.json();

    if (jobData.status === "completed") {
      return jobData.result.images[0];
    }

    await new Promise(r => setTimeout(r, 2000));
  }
}
```

## License

MIT

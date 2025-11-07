# TensorFlow Model Serving API

Production-ready TensorFlow model serving infrastructure with advanced features for ML model deployment.

## Reality Check

**Status:** Educational / Reference Implementation

**What This Is:**
- Complete TensorFlow model serving architecture with preprocessing pipelines
- Production-ready model lifecycle management (load, unload, version control)
- Demonstrates batch inference, warmup optimization, and memory management
- Shows proper metrics collection and health monitoring for ML services

**What This Isn't:**
- Does not include actual trained TensorFlow models
- Uses simulated inference that returns mock predictions
- Requires real model files and TensorFlow.js integration for actual predictions

**To Make It Production-Ready:**
1. Load actual SavedModel or TensorFlow.js models from your training pipeline
2. Configure model-specific preprocessing (image normalization, text tokenization, etc.)
3. Add proper input/output tensor shape handling based on model architecture
4. Optimize batch sizes and enable GPU acceleration if available

**Value:** Shows the complete model serving infrastructure including model registry, preprocessing pipelines, batch optimization, version management, and monitoring that production ML APIs need.

## Features

### Model Management
- **Dynamic Model Loading**: Load and unload models at runtime
- **Version Control**: Serve multiple versions of the same model
- **Warmup Optimization**: Automatic model warmup for consistent latency
- **Metadata Tracking**: Track model shapes, versions, and load times

### Inference Pipeline
- **Preprocessing**: Normalization, scaling, mean/std adjustments
- **Batch Inference**: Optimized batch processing with configurable batch sizes
- **Postprocessing**: Softmax, thresholding, and custom transformations
- **Memory Management**: Automatic tensor cleanup to prevent leaks

### Performance Optimization
- **Warmup Phase**: Pre-run inferences to optimize performance
- **Batch Processing**: Handle multiple requests efficiently
- **Resource Monitoring**: Track memory usage and request metrics
- **Lazy Loading**: Load models on-demand

### Production Features
- **Health Checks**: Monitor service availability
- **Metrics Collection**: Track inference time, request count, error rates
- **Error Handling**: Comprehensive error handling with logging
- **Graceful Degradation**: Handle missing models gracefully

## API Endpoints

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy"
}
```

### GET /models
List all loaded models with metadata.

**Response:**
```json
{
  "models": [
    {
      "name": "classifier",
      "version": "v1",
      "inputShape": [1, 224, 224, 3],
      "outputShape": [1, 1000],
      "loadedAt": "2025-11-07T10:00:00.000Z",
      "warmupComplete": true
    }
  ]
}
```

### POST /predict
Single prediction request.

**Request:**
```json
{
  "modelName": "classifier",
  "modelVersion": "v1",
  "inputs": [[1, 2, 3, 4, 5]],
  "preprocessing": {
    "normalize": true,
    "scale": 255.0,
    "mean": [0.485, 0.456, 0.406],
    "std": [0.229, 0.224, 0.225]
  }
}
```

**Response:**
```json
{
  "predictions": [[0.1, 0.3, 0.6]],
  "modelVersion": "v1",
  "inferenceTimeMs": 15,
  "preprocessingTimeMs": 2,
  "postprocessingTimeMs": 1
}
```

### POST /batch-predict
Batch prediction request.

**Request:**
```json
{
  "modelName": "classifier",
  "maxBatchSize": 32,
  "batch": [
    {
      "inputs": [[1, 2, 3]],
      "preprocessing": { "normalize": true }
    },
    {
      "inputs": [[4, 5, 6]],
      "preprocessing": { "normalize": true }
    }
  ]
}
```

**Response:**
```json
{
  "results": [
    {
      "predictions": [[0.2, 0.8]],
      "modelVersion": "v1",
      "inferenceTimeMs": 12,
      "preprocessingTimeMs": 1,
      "postprocessingTimeMs": 1
    }
  ]
}
```

### GET /metrics
Performance metrics and monitoring data.

**Response:**
```json
{
  "requestCount": 1250,
  "averageInferenceTimeMs": 18.5,
  "errorCount": 3,
  "errorRate": 0.0024,
  "uptime": 3600,
  "memoryUsage": {
    "rss": 123456789,
    "heapTotal": 987654321,
    "heapUsed": 456789123,
    "external": 12345678
  }
}
```

## Installation

```bash
bun install @tensorflow/tfjs-node
```

## Usage

### Starting the Server

```bash
bun run server.ts
```

The server will start on `http://localhost:3000`.

### Loading Models

Models can be loaded programmatically:

```typescript
await modelManager.loadModel(
  "my-classifier",
  "file://./models/classifier/model.json",
  "v1"
);
```

### Making Predictions

```bash
curl -X POST http://localhost:3000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "modelName": "classifier",
    "inputs": [[1, 2, 3, 4, 5]],
    "preprocessing": {
      "normalize": true,
      "scale": 255.0
    }
  }'
```

## Architecture

### Components

1. **ModelManager**: Handles model lifecycle (load, unload, version management)
2. **PreprocessingPipeline**: Transforms input data before inference
3. **InferenceEngine**: Executes model predictions with optimization
4. **MetricsCollector**: Collects and aggregates performance metrics

### Data Flow

```
Request → Preprocessing → Model Loading → Inference → Postprocessing → Response
                                ↓
                         Metrics Collection
```

## Configuration

### Environment Variables

```bash
PORT=3000                    # Server port
MODEL_PATH=/path/to/models   # Default model directory
MAX_BATCH_SIZE=32           # Maximum batch size
WARMUP_ITERATIONS=3         # Number of warmup runs
LOG_LEVEL=info              # Logging level
```

## Performance Optimization

### Model Warmup
Models are automatically warmed up after loading to ensure consistent latency:
- Runs 3 dummy inferences
- Initializes GPU memory
- Optimizes execution paths

### Batch Processing
Batch requests are automatically chunked:
- Configurable batch sizes
- Parallel processing within batches
- Memory-efficient tensor operations

### Memory Management
Automatic tensor disposal:
- Tensors are disposed after use
- Prevents memory leaks
- Monitors heap usage

## Model Versioning

Serve multiple versions simultaneously:

```typescript
await modelManager.loadModel("classifier", "path/v1/model.json", "v1");
await modelManager.loadModel("classifier", "path/v2/model.json", "v2");

// Use specific version
predict("classifier", { inputs: [...], modelVersion: "v2" });
```

## Monitoring

### Metrics Dashboard
Monitor key metrics:
- Request count and rate
- Average inference time
- Error rates
- Memory usage
- Model uptime

### Health Checks
Regular health checks ensure service availability:
```bash
curl http://localhost:3000/health
```

## Error Handling

Comprehensive error handling:
- Model not found errors
- Invalid input shape errors
- Out of memory errors
- Network errors

All errors are logged and tracked in metrics.

## Best Practices

1. **Model Warmup**: Always warmup models after loading
2. **Batch Requests**: Use batch endpoints for multiple predictions
3. **Resource Monitoring**: Monitor memory usage regularly
4. **Version Management**: Use semantic versioning for models
5. **Error Handling**: Implement retry logic for transient failures

## Production Deployment

### Docker
```dockerfile
FROM oven/bun:1
WORKDIR /app
COPY package.json .
RUN bun install
COPY . .
EXPOSE 3000
CMD ["bun", "run", "server.ts"]
```

### Kubernetes
```yaml
apiVersion: v1
kind: Service
metadata:
  name: tensorflow-serving
spec:
  selector:
    app: tensorflow-serving
  ports:
    - port: 3000
      targetPort: 3000
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tensorflow-serving
spec:
  replicas: 3
  selector:
    matchLabels:
      app: tensorflow-serving
  template:
    metadata:
      labels:
        app: tensorflow-serving
    spec:
      containers:
      - name: server
        image: tensorflow-serving:latest
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
```

## License

MIT

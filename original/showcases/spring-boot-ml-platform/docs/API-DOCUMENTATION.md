# Spring Boot ML Platform - API Documentation

## Overview

Complete API reference for the Spring Boot ML Platform. All endpoints demonstrate Elide's Kotlin + Python polyglot capabilities with <10ms prediction latency.

**Base URL**: `https://api.mlplatform.example.com`
**Version**: 1.0.0
**Authentication**: API Key (Header: `X-API-Key`)

## Table of Contents

1. [Authentication](#authentication)
2. [Health & Status](#health--status)
3. [Model Training](#model-training)
4. [Predictions](#predictions)
5. [Model Management](#model-management)
6. [Feature Engineering](#feature-engineering)
7. [Monitoring](#monitoring)
8. [Error Handling](#error-handling)

---

## Authentication

### API Key Authentication

All API requests require an API key passed in the header:

```http
GET /api/ml/models
X-API-Key: your_api_key_here
```

### Get API Key

```http
POST /api/auth/keys
Content-Type: application/json

{
  "name": "production-key",
  "scopes": ["read", "write"]
}
```

**Response:**
```json
{
  "apiKey": "mlp_abc123...",
  "name": "production-key",
  "scopes": ["read", "write"],
  "createdAt": "2024-01-15T10:00:00Z",
  "expiresAt": "2025-01-15T10:00:00Z"
}
```

---

## Health & Status

### GET /api/ml/health

Check platform health and Python runtime status.

**Request:**
```http
GET /api/ml/health
```

**Response:**
```json
{
  "status": "UP",
  "pythonRuntime": "available",
  "libraries": {
    "sklearn": "1.3.2",
    "tensorflow": "2.15.0",
    "pandas": "2.1.4",
    "numpy": "1.26.2"
  },
  "timestamp": "2024-01-15T10:30:45Z"
}
```

**Status Codes:**
- `200 OK` - Platform healthy
- `503 Service Unavailable` - Platform unhealthy

---

## Model Training

### POST /api/ml/train

Train a new ML model using Python libraries.

**Request:**
```http
POST /api/ml/train
Content-Type: application/json

{
  "name": "fraud-detector-v3",
  "algorithm": "RANDOM_FOREST",
  "dataSource": "s3://training-data/fraud-dataset.csv",
  "targetColumn": "is_fraud",
  "hyperparameters": {
    "n_estimators": 200,
    "max_depth": 15,
    "min_samples_split": 5,
    "min_samples_leaf": 2
  },
  "validationSplit": 0.2
}
```

**Parameters:**
- `name` (string, required): Model name
- `algorithm` (enum, required): ML algorithm
  - `RANDOM_FOREST`
  - `GRADIENT_BOOSTING`
  - `NEURAL_NETWORK`
  - `SVM`
  - `LOGISTIC_REGRESSION`
  - `XGBOOST`
  - `LIGHTGBM`
- `dataSource` (string, required): S3 path or upload reference
- `targetColumn` (string, required): Target variable column name
- `hyperparameters` (object, optional): Algorithm-specific parameters
- `validationSplit` (number, optional): Validation split ratio (0.0-1.0)

**Response:**
```json
{
  "modelId": "model-123e4567-e89b-12d3-a456-426614174000",
  "status": "COMPLETED",
  "metrics": {
    "accuracy": 0.9543,
    "precision": 0.9421,
    "recall": 0.9387,
    "f1Score": 0.9404,
    "auc": 0.9821,
    "confusionMatrix": [[850, 45], [38, 967]]
  },
  "trainingTimeMs": 12500,
  "completedAt": "2024-01-15T10:35:15Z"
}
```

**Status Codes:**
- `200 OK` - Training successful
- `400 Bad Request` - Invalid parameters
- `500 Internal Server Error` - Training failed

### POST /api/ml/train/upload

Upload CSV and train model.

**Request:**
```http
POST /api/ml/train/upload
Content-Type: multipart/form-data

file: training-data.csv
name: fraud-detector-v3
algorithm: RANDOM_FOREST
targetColumn: is_fraud
hyperparameters: {"n_estimators": 100}
```

**Response:** Same as `/api/ml/train`

### GET /api/ml/models/{modelId}/status

Check training status for async training jobs.

**Request:**
```http
GET /api/ml/models/model-123/status
```

**Response:**
```json
{
  "modelId": "model-123",
  "status": "TRAINING",
  "progress": 0.65,
  "estimatedTimeRemaining": "2m 30s",
  "startedAt": "2024-01-15T10:30:00Z"
}
```

**Status Values:**
- `QUEUED` - Waiting to start
- `TRAINING` - Currently training
- `COMPLETED` - Training finished
- `FAILED` - Training failed

---

## Predictions

### POST /api/ml/predict

Make a single prediction (target: <10ms latency).

**Request:**
```http
POST /api/ml/predict
Content-Type: application/json

{
  "modelId": "model-123e4567-e89b-12d3-a456-426614174000",
  "features": {
    "amount": 1250.50,
    "merchant_category": "online_retail",
    "hour": 14,
    "day_of_week": 3,
    "user_age": 35,
    "account_age_days": 730,
    "transaction_count_24h": 5
  }
}
```

**Response:**
```json
{
  "prediction": false,
  "confidence": 0.9234,
  "latencyMs": 4.2,
  "modelId": "model-123e4567-e89b-12d3-a456-426614174000",
  "modelVersion": "v3.2.1",
  "timestamp": "2024-01-15T10:31:12Z"
}
```

**Performance:**
- p50 latency: <5ms
- p95 latency: <10ms
- p99 latency: <15ms

### POST /api/ml/predict/batch

Batch predictions (up to 10,000 records).

**Request:**
```http
POST /api/ml/predict/batch
Content-Type: application/json

{
  "modelId": "model-123",
  "records": [
    {
      "amount": 125.50,
      "merchant_category": "grocery",
      "hour": 9,
      ...
    },
    {
      "amount": 2500.00,
      "merchant_category": "jewelry",
      "hour": 15,
      ...
    }
  ]
}
```

**Response:**
```json
{
  "predictions": [
    {
      "index": 0,
      "prediction": false,
      "confidence": 0.98
    },
    {
      "index": 1,
      "prediction": true,
      "confidence": 0.87
    }
  ],
  "totalRecords": 2,
  "totalLatencyMs": 8.5,
  "avgLatencyMs": 4.25,
  "modelId": "model-123",
  "timestamp": "2024-01-15T10:32:00Z"
}
```

### POST /api/ml/predict/batch/async

Async batch predictions for large datasets.

**Request:**
```http
POST /api/ml/predict/batch/async
Content-Type: application/json

{
  "modelId": "model-123",
  "records": [...] // Up to 100,000 records
}
```

**Response:**
```json
{
  "jobId": "job-789abc",
  "status": "QUEUED",
  "totalRecords": 50000,
  "estimatedTimeSeconds": 250,
  "statusUrl": "/api/ml/jobs/job-789abc/status"
}
```

### POST /api/ml/explain

Explain a prediction using SHAP values.

**Request:**
```http
POST /api/ml/explain
Content-Type: application/json

{
  "modelId": "model-123",
  "features": {
    "amount": 1250.50,
    "merchant_category": "online_retail",
    ...
  }
}
```

**Response:**
```json
{
  "modelId": "model-123",
  "prediction": false,
  "baseValue": 0.15,
  "shapValues": [0.12, -0.08, 0.25, ...],
  "featureContributions": [
    {
      "feature": "amount",
      "contribution": 0.25,
      "value": 1250.50
    },
    {
      "feature": "hour",
      "contribution": 0.12,
      "value": 14
    },
    ...
  ]
}
```

---

## Model Management

### GET /api/ml/models

List all models with filtering.

**Request:**
```http
GET /api/ml/models?page=0&size=20&algorithm=RANDOM_FOREST&status=ACTIVE
```

**Query Parameters:**
- `page` (number, optional): Page number (default: 0)
- `size` (number, optional): Page size (default: 20, max: 100)
- `algorithm` (enum, optional): Filter by algorithm
- `status` (enum, optional): Filter by status

**Response:**
```json
{
  "models": [
    {
      "id": "model-123",
      "name": "fraud-detection-v3",
      "algorithm": "RANDOM_FOREST",
      "version": "3.2.1",
      "status": "ACTIVE",
      "metrics": {
        "accuracy": 0.9543,
        "precision": 0.9421,
        "recall": 0.9387,
        "f1Score": 0.9404,
        "auc": 0.9821
      },
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 42,
  "page": 0,
  "size": 20
}
```

### GET /api/ml/models/{modelId}

Get model details.

**Request:**
```http
GET /api/ml/models/model-123
```

**Response:**
```json
{
  "id": "model-123",
  "name": "fraud-detection-v3",
  "algorithm": "RANDOM_FOREST",
  "version": "3.2.1",
  "status": "ACTIVE",
  "metrics": {
    "accuracy": 0.9543,
    "precision": 0.9421,
    "recall": 0.9387,
    "f1Score": 0.9404,
    "auc": 0.9821,
    "confusionMatrix": [[850, 45], [38, 967]]
  },
  "hyperparameters": {
    "n_estimators": 200,
    "max_depth": 15,
    "min_samples_split": 5
  },
  "trainingTimeMs": 12500,
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### DELETE /api/ml/models/{modelId}

Delete a model.

**Request:**
```http
DELETE /api/ml/models/model-123
```

**Response:**
```json
{
  "modelId": "model-123",
  "status": "DELETED",
  "timestamp": "2024-01-15T11:00:00Z"
}
```

### POST /api/ml/models/{modelId}/deploy

Deploy model to production.

**Request:**
```http
POST /api/ml/models/model-123/deploy
Content-Type: application/json

{
  "environment": "production",
  "replicas": 3
}
```

**Response:**
```json
{
  "modelId": "model-123",
  "environment": "production",
  "status": "DEPLOYED",
  "endpoint": "https://ml-api-prod.example.com/models/model-123/predict",
  "timestamp": "2024-01-15T11:05:00Z"
}
```

### POST /api/ml/models/{modelId}/evaluate

Evaluate model on test data.

**Request:**
```http
POST /api/ml/models/model-123/evaluate
Content-Type: application/json

{
  "dataSource": "s3://test-data/fraud-test.csv"
}
```

**Response:**
```json
{
  "modelId": "model-123",
  "metrics": {
    "accuracy": 0.9521,
    "precision": 0.9402,
    "recall": 0.9378,
    "f1Score": 0.9390,
    "auc": 0.9805,
    "confusionMatrix": [[425, 22], [19, 484]]
  },
  "timestamp": "2024-01-15T11:10:00Z"
}
```

### GET /api/ml/models/{modelId}/feature-importance

Get feature importance for tree-based models.

**Request:**
```http
GET /api/ml/models/model-123/feature-importance
```

**Response:**
```json
{
  "modelId": "model-123",
  "features": {
    "amount": 0.2543,
    "hour": 0.1832,
    "merchant_category": 0.1654,
    "day_of_week": 0.1234,
    "user_age": 0.0987,
    ...
  }
}
```

### POST /api/ml/models/{modelId}/retrain

Retrain existing model with new data.

**Request:**
```http
POST /api/ml/models/model-123/retrain
Content-Type: application/json

{
  "dataSource": "s3://training-data/fraud-new.csv",
  "hyperparameters": {
    "n_estimators": 250
  }
}
```

**Response:**
```json
{
  "modelId": "model-456",  // New model ID
  "status": "COMPLETED",
  "metrics": {
    "accuracy": 0.9587,
    ...
  },
  "parentModelId": "model-123",
  "completedAt": "2024-01-15T11:45:00Z"
}
```

---

## Feature Engineering

### POST /api/ml/features/engineer

Apply feature engineering transformations.

**Request:**
```http
POST /api/ml/features/engineer
Content-Type: application/json

{
  "data": {
    "timestamp": "2024-01-15T14:30:00Z",
    "amount": 1250.50,
    "merchant_category": "online_retail"
  },
  "transformations": [
    "temporal",
    "statistical",
    "categorical_encoding"
  ]
}
```

**Response:**
```json
{
  "engineeredFeatures": {
    "timestamp": "2024-01-15T14:30:00Z",
    "amount": 1250.50,
    "merchant_category": "online_retail",
    "hour": 14,
    "day_of_week": 1,
    "is_weekend": false,
    "amount_log": 7.131,
    "amount_squared": 1563750.25,
    "merchant_encoded": 2
  },
  "transformationsApplied": [
    "temporal",
    "statistical",
    "categorical_encoding"
  ]
}
```

### POST /api/ml/features/normalize

Normalize feature values.

**Request:**
```http
POST /api/ml/features/normalize
Content-Type: application/json

{
  "features": {
    "amount": 1250.50,
    "user_age": 35,
    "account_age_days": 730
  },
  "method": "STANDARD"
}
```

**Methods:**
- `STANDARD` - Zero mean, unit variance
- `MINMAX` - Scale to [0, 1]
- `ROBUST` - Robust to outliers
- `MAXABS` - Scale to [-1, 1]

**Response:**
```json
{
  "normalizedFeatures": {
    "amount": 0.567,
    "user_age": -0.234,
    "account_age_days": 1.123
  },
  "method": "STANDARD"
}
```

---

## Monitoring

### GET /api/ml/metrics

Get platform metrics.

**Request:**
```http
GET /api/ml/metrics
```

**Response:**
```json
{
  "predictions": {
    "total": 1543234,
    "last24h": 125432,
    "avgLatencyMs": 4.2
  },
  "models": {
    "total": 42,
    "active": 12,
    "deployed": 5
  },
  "system": {
    "memoryUsageMB": 4096,
    "memoryUsagePercent": 32.5,
    "cpuUsagePercent": 45.2
  }
}
```

### GET /api/ml/models/{modelId}/metrics/history

Get model performance history.

**Request:**
```http
GET /api/ml/models/model-123/metrics/history?startDate=2024-01-01&endDate=2024-01-15
```

**Response:**
```json
{
  "modelId": "model-123",
  "history": [
    {
      "timestamp": "2024-01-01T00:00:00Z",
      "metrics": {
        "accuracy": 0.9543,
        "precision": 0.9421,
        "recall": 0.9387
      }
    },
    ...
  ]
}
```

### GET /api/ml/alerts

Get recent alerts.

**Request:**
```http
GET /api/ml/alerts?limit=100&severity=WARNING
```

**Response:**
```json
{
  "alerts": [
    {
      "modelId": "model-123",
      "severity": "WARNING",
      "message": "p95 latency 52ms exceeds 50ms SLA",
      "timestamp": "2024-01-15T10:30:00Z"
    },
    ...
  ],
  "total": 25
}
```

---

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid model ID format",
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/ml/predict",
  "details": {
    "field": "modelId",
    "rejectedValue": "invalid-id"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `MODEL_NOT_FOUND` | 404 | Model does not exist |
| `TRAINING_FAILED` | 500 | Model training failed |
| `PREDICTION_FAILED` | 500 | Prediction failed |
| `TIMEOUT` | 408 | Request timeout |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `UNAUTHORIZED` | 401 | Invalid API key |
| `FORBIDDEN` | 403 | Insufficient permissions |

---

## Rate Limiting

API requests are rate-limited per API key:

**Limits:**
- Training: 10 requests/hour
- Predictions: 10,000 requests/minute
- Batch predictions: 100 requests/hour
- Other endpoints: 1,000 requests/minute

**Headers:**
```http
X-RateLimit-Limit: 10000
X-RateLimit-Remaining: 9543
X-RateLimit-Reset: 1705318800
```

When limit exceeded:
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Rate limit exceeded. Retry after 45 seconds",
  "retryAfter": 45,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Webhooks

### Configure Webhook

```http
POST /api/ml/webhooks
Content-Type: application/json

{
  "url": "https://your-app.com/webhooks/ml",
  "events": [
    "training.completed",
    "training.failed",
    "model.deployed",
    "alert.created"
  ],
  "secret": "your-webhook-secret"
}
```

### Webhook Payload

```json
{
  "event": "training.completed",
  "timestamp": "2024-01-15T10:35:15Z",
  "data": {
    "modelId": "model-123",
    "status": "COMPLETED",
    "metrics": {...}
  },
  "signature": "sha256=abc123..."
}
```

---

## SDK Examples

### Python SDK

```python
from mlplatform import MLPlatformClient

client = MLPlatformClient(api_key="your_api_key")

# Train model
model = client.train_model(
    name="fraud-detector",
    algorithm="RANDOM_FOREST",
    data_source="s3://data/train.csv",
    target_column="is_fraud",
    hyperparameters={"n_estimators": 100}
)

# Make prediction
prediction = client.predict(
    model_id=model.id,
    features={
        "amount": 1250.50,
        "merchant_category": "online_retail"
    }
)

print(f"Prediction: {prediction.value}")
print(f"Confidence: {prediction.confidence}")
print(f"Latency: {prediction.latency_ms}ms")
```

### JavaScript SDK

```javascript
import { MLPlatformClient } from '@mlplatform/sdk';

const client = new MLPlatformClient({
  apiKey: 'your_api_key'
});

// Make prediction
const prediction = await client.predict({
  modelId: 'model-123',
  features: {
    amount: 1250.50,
    merchantCategory: 'online_retail'
  }
});

console.log(`Prediction: ${prediction.value}`);
console.log(`Latency: ${prediction.latencyMs}ms`);
```

### cURL Examples

```bash
# Health check
curl -X GET https://api.mlplatform.example.com/api/ml/health

# Train model
curl -X POST https://api.mlplatform.example.com/api/ml/train \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "name": "fraud-detector",
    "algorithm": "RANDOM_FOREST",
    "dataSource": "s3://data/train.csv",
    "targetColumn": "is_fraud"
  }'

# Make prediction
curl -X POST https://api.mlplatform.example.com/api/ml/predict \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "modelId": "model-123",
    "features": {
      "amount": 1250.50,
      "merchant_category": "online_retail"
    }
  }'
```

---

## Support

- **API Status**: https://status.mlplatform.example.com
- **Documentation**: https://docs.mlplatform.example.com
- **Support Email**: api-support@mlplatform.example.com
- **Developer Forum**: https://forum.mlplatform.example.com

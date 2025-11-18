# Getting Started - Feature Engineering Service

Quick start guide to get the feature engineering service running in minutes.

## Prerequisites

- Node.js >= 16.0.0
- Python >= 3.8.0
- npm >= 8.0.0

## Installation Methods

### Method 1: Quick Start Script (Recommended)

```bash
./examples/quick-start.sh
```

This script will:
1. Check prerequisites
2. Install all dependencies
3. Create necessary directories
4. Start the service

### Method 2: Manual Installation

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt

# Create directories
mkdir -p features/cache features/snapshots features/monitoring

# Start the service
npm start
```

### Method 3: Docker

```bash
# Build and run with Docker
docker build -t feature-store .
docker run -p 3000:3000 feature-store

# Or use Docker Compose
docker-compose up
```

## Verify Installation

Once started, test the service:

```bash
# Health check
curl http://localhost:3000/health

# Get features for a test entity
curl -X POST http://localhost:3000/features \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "test_user_1"}'
```

Expected response:
```json
{
  "entity_id": "test_user_1",
  "features": {
    "value_mean": 52.34,
    "trend_7d": 0.023,
    "z_score": 1.23,
    ...
  },
  "cached": false,
  "latency_ms": 8.7,
  "timestamp": 1699999999999
}
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:correctness    # Feature correctness tests
npm run benchmark           # Performance benchmarks
npm run benchmark:latency   # Latency benchmarks only
npm run test:drift          # Drift monitoring tests
```

## Common Commands

```bash
# Start server (production)
npm start

# Start server (development with auto-reload)
npm run dev

# Run benchmarks
npm run benchmark

# Generate batch features
npm run batch:generate

# Run production examples
node -r ts-node/register examples/production-example.ts
```

## Configuration

Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

Key settings:
- `CACHE_MAX_SIZE`: Maximum cache entries (default: 10000)
- `CACHE_TTL_MS`: Cache TTL in milliseconds (default: 300000)
- `ENABLE_DRIFT_MONITORING`: Enable drift detection (default: true)
- `DRIFT_THRESHOLD`: Drift detection threshold (default: 0.15)

## Next Steps

1. **Read the documentation**: Check [README.md](./README.md) for full API reference
2. **Study the case study**: See [CASE_STUDY.md](./CASE_STUDY.md) for architecture details
3. **Run examples**: Explore [examples/production-example.ts](./examples/production-example.ts)
4. **Customize features**: Modify [features/compute_features.py](./features/compute_features.py)

## Troubleshooting

### "Python not found"
- Ensure Python 3.8+ is installed
- Set `PYTHON_PATH` environment variable to your Python executable

### "Permission denied" on scripts
```bash
chmod +x examples/quick-start.sh features/compute_features.py
```

### High memory usage
- Reduce `CACHE_MAX_SIZE` in `.env`
- Monitor with `GET /health` endpoint

### Port already in use
- Change `PORT` in `.env` or stop conflicting service

## Support

For issues or questions:
- Check [README.md](./README.md) for detailed documentation
- Review [CASE_STUDY.md](./CASE_STUDY.md) for architecture insights
- Examine test files in `tests/` for usage examples

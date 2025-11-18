#!/bin/bash

echo "🚀 Feature Engineering Service - Quick Start"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js >= 16.0.0"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "❌ Python not found. Please install Python >= 3.8.0"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm >= 8.0.0"
    exit 1
fi

echo "✅ Prerequisites satisfied"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install Node.js dependencies"
    exit 1
fi

pip3 install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "❌ Failed to install Python dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Create directories
echo "📁 Creating directories..."
mkdir -p features/cache features/snapshots features/monitoring
echo "✅ Directories created"
echo ""

# Start the service
echo "🚀 Starting Feature Engineering Service..."
echo ""
echo "The service will be available at http://localhost:3000"
echo ""
echo "Available endpoints:"
echo "  POST   /features          - Get features for single entity"
echo "  POST   /features/batch    - Get features for multiple entities"
echo "  GET    /features/stats    - Get feature statistics"
echo "  GET    /drift/report      - Get drift monitoring report"
echo "  GET    /health            - Health check"
echo ""
echo "Press Ctrl+C to stop the service"
echo ""

npm start

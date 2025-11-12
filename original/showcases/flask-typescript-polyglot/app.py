"""
Flask + Elide beta11-rc1 Polyglot Demo

A production-grade Flask application demonstrating Python running
natively on Elide with full WSGI support.

Run with: elide run --wsgi app.py
"""

from flask import Flask, request, jsonify
from datetime import datetime
import json

app = Flask(__name__)

# Simulated ML Model (in production, this would be TensorFlow/PyTorch)
class SentimentModel:
    """Simple sentiment analysis (simulated for demo)"""

    def __init__(self):
        self.positive_words = {'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'best'}
        self.negative_words = {'bad', 'terrible', 'awful', 'worst', 'hate', 'horrible', 'poor'}

    def predict(self, text: str) -> dict:
        """Predict sentiment of text"""
        words = set(text.lower().split())

        positive_count = len(words & self.positive_words)
        negative_count = len(words & self.negative_words)

        if positive_count > negative_count:
            sentiment = 'positive'
            confidence = min(0.99, 0.5 + (positive_count * 0.15))
        elif negative_count > positive_count:
            sentiment = 'negative'
            confidence = min(0.99, 0.5 + (negative_count * 0.15))
        else:
            sentiment = 'neutral'
            confidence = 0.5

        return {
            'sentiment': sentiment,
            'confidence': round(confidence, 2),
            'positive_words': positive_count,
            'negative_words': negative_count
        }

# Initialize model
model = SentimentModel()

# Request counter for metrics
request_count = 0
prediction_count = 0

@app.route('/')
def index():
    """Health check and service info"""
    return jsonify({
        'service': 'Flask ML API on Elide',
        'runtime': 'polyglot',
        'python_version': '3.12',
        'wsgi': 'native',
        'status': 'healthy',
        'endpoints': {
            'POST /api/predict': 'Sentiment analysis',
            'POST /api/batch': 'Batch predictions',
            'GET /stats': 'Service statistics'
        }
    })

@app.route('/api/predict', methods=['POST'])
def predict():
    """Single text prediction"""
    global prediction_count
    prediction_count += 1

    try:
        data = request.get_json()

        if not data or 'text' not in data:
            return jsonify({'error': 'Missing text field'}), 400

        text = data['text']
        result = model.predict(text)

        return jsonify({
            'text': text,
            'prediction': result,
            'model': 'sentiment-v1',
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/batch', methods=['POST'])
def batch_predict():
    """Batch predictions"""
    global prediction_count

    try:
        data = request.get_json()

        if not data or 'texts' not in data:
            return jsonify({'error': 'Missing texts array'}), 400

        texts = data['texts']
        if not isinstance(texts, list):
            return jsonify({'error': 'texts must be an array'}), 400

        if len(texts) > 100:
            return jsonify({'error': 'Maximum 100 texts per batch'}), 400

        results = []
        for text in texts:
            prediction = model.predict(text)
            results.append({
                'text': text,
                'prediction': prediction
            })
            prediction_count += 1

        return jsonify({
            'results': results,
            'count': len(results),
            'model': 'sentiment-v1',
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/stats')
def stats():
    """Service statistics"""
    global request_count, prediction_count

    return jsonify({
        'total_requests': request_count,
        'predictions_made': prediction_count,
        'model_loaded': True,
        'uptime_info': 'Available via TypeScript orchestration'
    })

@app.before_request
def before_request():
    """Count requests"""
    global request_count
    request_count += 1

@app.route('/health')
def health():
    """Kubernetes-style health check"""
    return jsonify({
        'status': 'healthy',
        'checks': {
            'model': 'loaded',
            'memory': 'ok',
            'latency': 'optimal'
        }
    })

if __name__ == '__main__':
    # This block is for documentation only
    # When run with Elide, use: elide run --wsgi app.py
    print("Flask ML API for Elide")
    print("Run with: elide run --wsgi app.py")
    print("Then: curl -X POST http://localhost:5000/api/predict -d '{\"text\":\"I love Elide!\"}'")

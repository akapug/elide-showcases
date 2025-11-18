#!/usr/bin/env python3
"""
Sentiment Analysis Processor

Uses transformers (DistilBERT) for sentiment classification
"""

import sys
import json
import time
import os
from transformers import pipeline

SENTIMENT_MODEL = os.getenv('SENTIMENT_MODEL', 'distilbert-base-uncased-finetuned-sst-2-english')

# Load sentiment analyzer
sentiment_analyzer = None


def init_model():
    """Initialize sentiment model (lazy loading)"""
    global sentiment_analyzer
    if sentiment_analyzer is None:
        sentiment_analyzer = pipeline('sentiment-analysis', model=SENTIMENT_MODEL)


def analyze_sentiment(text: str):
    """Analyze sentiment of text"""
    init_model()

    start_time = time.time()

    result = sentiment_analyzer(text, truncation=True, max_length=512)[0]

    processing_time = (time.time() - start_time) * 1000

    # Map to more intuitive labels
    sentiment = result['label'].lower()
    score = result['score']

    # Calculate confidence level
    if score > 0.9:
        confidence = 'very high'
    elif score > 0.75:
        confidence = 'high'
    elif score > 0.6:
        confidence = 'medium'
    else:
        confidence = 'low'

    return {
        'sentiment': sentiment,
        'score': score,
        'confidence': confidence,
        'performance': {
            'processingTime': processing_time,
        }
    }


def main():
    """Main entry point"""
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())

        text = input_data['text']

        # Analyze sentiment
        result = analyze_sentiment(text)

        # Output result as JSON
        print(json.dumps(result))

    except Exception as e:
        error_result = {
            'error': str(e),
            'type': type(e).__name__,
        }
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()

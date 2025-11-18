#!/usr/bin/env python3
"""
Text Summarization Processor

Uses transformers (BART) for abstractive summarization
"""

import sys
import json
import time
import os
from transformers import pipeline

SUMMARIZATION_MODEL = os.getenv('SUMMARIZATION_MODEL', 'facebook/bart-large-cnn')

# Load summarizer
summarizer = None


def init_model():
    """Initialize summarization model (lazy loading)"""
    global summarizer
    if summarizer is None:
        summarizer = pipeline('summarization', model=SUMMARIZATION_MODEL)


def summarize_text(text: str, max_length: int = 130):
    """Summarize text using BART"""
    init_model()

    start_time = time.time()

    # Only summarize if text is long enough
    word_count = len(text.split())

    if word_count < 50:
        return {
            'summary': text,
            'compressionRatio': 1.0,
            'wordCount': word_count,
            'summaryWordCount': word_count,
            'skipped': True,
            'reason': 'Text too short for summarization',
            'performance': {
                'processingTime': 0.0,
            }
        }

    result = summarizer(
        text,
        max_length=max_length,
        min_length=30,
        do_sample=False,
        truncation=True
    )[0]

    processing_time = (time.time() - start_time) * 1000

    summary = result['summary_text']
    summary_word_count = len(summary.split())
    compression_ratio = summary_word_count / word_count

    return {
        'summary': summary,
        'compressionRatio': compression_ratio,
        'wordCount': word_count,
        'summaryWordCount': summary_word_count,
        'performance': {
            'processingTime': processing_time,
            'wordsPerSecond': word_count / (processing_time / 1000) if processing_time > 0 else 0,
        }
    }


def main():
    """Main entry point"""
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())

        text = input_data['text']
        max_length = input_data.get('maxLength', 130)

        # Summarize text
        result = summarize_text(text, max_length)

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

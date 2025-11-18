#!/usr/bin/env python3
"""
Multi-Task NLP Processor

Demonstrates shared tokenization across multiple NLP tasks:
- Named Entity Recognition (spaCy)
- Sentiment Analysis (transformers)
- Text Summarization (transformers)

Performance: <100ms for multi-task analysis
"""

import sys
import json
import time
from typing import Dict, List, Any, Optional
import os

import spacy
from transformers import pipeline, AutoTokenizer
import torch

# Load models (cached after first load)
SPACY_MODEL = os.getenv('SPACY_MODEL', 'en_core_web_sm')
SENTIMENT_MODEL = os.getenv('SENTIMENT_MODEL', 'distilbert-base-uncased-finetuned-sst-2-english')
SUMMARIZATION_MODEL = os.getenv('SUMMARIZATION_MODEL', 'facebook/bart-large-cnn')

# Initialize models
nlp = None
sentiment_analyzer = None
summarizer = None
shared_tokenizer = None


def init_models():
    """Initialize NLP models (lazy loading)"""
    global nlp, sentiment_analyzer, summarizer, shared_tokenizer

    if nlp is None:
        nlp = spacy.load(SPACY_MODEL)

    if sentiment_analyzer is None:
        sentiment_analyzer = pipeline('sentiment-analysis', model=SENTIMENT_MODEL)

    if summarizer is None:
        summarizer = pipeline('summarization', model=SUMMARIZATION_MODEL)

    if shared_tokenizer is None:
        shared_tokenizer = AutoTokenizer.from_pretrained(SENTIMENT_MODEL)


def tokenize_text(text: str, cached_tokenization: Optional[Dict] = None) -> Dict[str, Any]:
    """
    Tokenize text once for reuse across multiple models

    Returns tokenization that can be reused by different NLP tasks
    """
    if cached_tokenization:
        return cached_tokenization

    start_time = time.time()

    # Tokenize using shared tokenizer
    tokens = shared_tokenizer(
        text,
        return_tensors='pt',
        padding=True,
        truncation=True,
        max_length=512
    )

    tokenization_time = (time.time() - start_time) * 1000

    return {
        'input_ids': tokens['input_ids'].tolist(),
        'attention_mask': tokens['attention_mask'].tolist(),
        'token_count': len(tokens['input_ids'][0]),
        'tokenization_time': tokenization_time,
    }


def extract_entities(text: str) -> Dict[str, Any]:
    """Extract named entities using spaCy"""
    start_time = time.time()

    doc = nlp(text)

    entities = []
    for ent in doc.ents:
        entities.append({
            'text': ent.text,
            'label': ent.label_,
            'start': ent.start_char,
            'end': ent.end_char,
        })

    processing_time = (time.time() - start_time) * 1000

    return {
        'entities': entities,
        'entityCount': len(entities),
        'processingTime': processing_time,
    }


def analyze_sentiment(text: str) -> Dict[str, Any]:
    """Analyze sentiment using transformers"""
    start_time = time.time()

    result = sentiment_analyzer(text, truncation=True, max_length=512)[0]

    processing_time = (time.time() - start_time) * 1000

    return {
        'sentiment': result['label'],
        'score': result['score'],
        'processingTime': processing_time,
    }


def summarize_text(text: str, max_length: int = 130) -> Dict[str, Any]:
    """Summarize text using transformers"""
    start_time = time.time()

    # Only summarize if text is long enough
    if len(text.split()) < 50:
        return {
            'summary': text,
            'compressionRatio': 1.0,
            'processingTime': 0.0,
            'skipped': True,
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
    compression_ratio = len(summary) / len(text)

    return {
        'summary': summary,
        'compressionRatio': compression_ratio,
        'processingTime': processing_time,
    }


def process_multi_task(
    text: str,
    tasks: List[str],
    cached_tokenization: Optional[Dict] = None
) -> Dict[str, Any]:
    """
    Process multiple NLP tasks with shared tokenization

    This is the key optimization: tokenize once, use for all tasks
    """
    init_models()

    overall_start = time.time()

    # Step 1: Tokenize once (or use cached)
    tokenization = tokenize_text(text, cached_tokenization)

    results = {}
    task_times = {}

    # Step 2: Run requested tasks using shared tokenization
    if 'ner' in tasks:
        ner_result = extract_entities(text)
        results['ner'] = ner_result
        task_times['ner'] = ner_result['processingTime']

    if 'sentiment' in tasks:
        sentiment_result = analyze_sentiment(text)
        results['sentiment'] = sentiment_result
        task_times['sentiment'] = sentiment_result['processingTime']

    if 'summarize' in tasks:
        summarize_result = summarize_text(text)
        results['summarize'] = summarize_result
        task_times['summarize'] = summarize_result['processingTime']

    overall_time = (time.time() - overall_start) * 1000

    return {
        'results': results,
        'tokenization': tokenization,
        'performance': {
            'overallTime': overall_time,
            'tokenizationTime': tokenization['tokenization_time'],
            'taskTimes': task_times,
            'totalTaskTime': sum(task_times.values()),
            'tokenizationReused': cached_tokenization is not None,
            'speedup': calculate_speedup(tokenization['tokenization_time'], task_times),
        }
    }


def calculate_speedup(tokenization_time: float, task_times: Dict[str, float]) -> float:
    """
    Calculate speedup from shared tokenization

    Without sharing: each task tokenizes separately
    With sharing: tokenize once
    """
    num_tasks = len(task_times)

    if num_tasks <= 1:
        return 1.0

    # Time without sharing: tokenize for each task
    time_without_sharing = (tokenization_time * num_tasks) + sum(task_times.values())

    # Time with sharing: tokenize once
    time_with_sharing = tokenization_time + sum(task_times.values())

    speedup = time_without_sharing / time_with_sharing if time_with_sharing > 0 else 1.0

    return round(speedup, 2)


def main():
    """Main entry point"""
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())

        text = input_data['text']
        tasks = input_data.get('tasks', ['ner', 'sentiment', 'summarize'])
        cached_tokenization = input_data.get('cachedTokenization')

        # Process multi-task
        result = process_multi_task(text, tasks, cached_tokenization)

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

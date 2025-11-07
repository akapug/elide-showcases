#!/usr/bin/env python3
"""
ML Inference - Sentiment Analysis

Production-grade sentiment analysis using ML models:
- Text preprocessing
- Model inference
- Emotion detection
- Keyword extraction
- Multi-language support

@module ml/inference
"""

import sys
import json
import re
import argparse
import time
from typing import Dict, List, Tuple, Optional
from collections import Counter
import hashlib

# Mock ML model (in production, use actual models like transformers, spaCy, etc.)
class SentimentModel:
    """
    Sentiment analysis model

    In production, this would load actual ML models like:
    - transformers (BERT, RoBERTa, etc.)
    - tensorflow/keras models
    - pytorch models
    - spaCy models
    """

    def __init__(self):
        self.model_name = "sentiment-transformer-v1"
        self.version = "1.0.0"

        # Positive and negative word lists for simple rule-based analysis
        self.positive_words = {
            'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
            'awesome', 'brilliant', 'outstanding', 'superb', 'love', 'loved',
            'best', 'perfect', 'beautiful', 'nice', 'enjoy', 'happy', 'glad',
            'pleased', 'satisfied', 'delighted', 'incredible', 'impressive',
            'recommend', 'recommended', 'exceptional', 'quality', 'superior',
        }

        self.negative_words = {
            'bad', 'terrible', 'horrible', 'awful', 'poor', 'worst', 'hate',
            'hated', 'disappointing', 'disappointed', 'useless', 'waste',
            'broken', 'defective', 'garbage', 'trash', 'regret', 'angry',
            'frustrated', 'annoying', 'annoyed', 'inferior', 'unacceptable',
            'pathetic', 'disgusting', 'mediocre', 'fail', 'failed', 'failure',
        }

        # Emotion keywords
        self.emotion_keywords = {
            'joy': {'happy', 'joy', 'delighted', 'cheerful', 'pleased', 'ecstatic', 'thrilled'},
            'sadness': {'sad', 'depressed', 'unhappy', 'miserable', 'gloomy', 'sorrowful'},
            'anger': {'angry', 'furious', 'outraged', 'mad', 'irritated', 'annoyed'},
            'fear': {'afraid', 'scared', 'terrified', 'anxious', 'worried', 'nervous'},
            'surprise': {'surprised', 'amazed', 'astonished', 'shocked', 'stunned'},
        }

        # Intensifiers
        self.intensifiers = {
            'very', 'extremely', 'absolutely', 'really', 'super', 'incredibly',
            'completely', 'totally', 'utterly', 'highly', 'too', 'so',
        }

        # Negations
        self.negations = {
            'not', 'no', 'never', 'neither', 'nobody', 'nothing', 'none',
            "don't", "doesn't", "didn't", "won't", "wouldn't", "can't", "couldn't",
        }

    def predict(self, text: str, include_emotions: bool = False,
                include_keywords: bool = False) -> Dict:
        """
        Predict sentiment for given text

        Args:
            text: Input text to analyze
            include_emotions: Whether to include emotion detection
            include_keywords: Whether to include keyword extraction

        Returns:
            Dictionary with sentiment results
        """
        # Preprocess text
        tokens = self.tokenize(text)

        # Calculate sentiment score
        sentiment, score, confidence = self.calculate_sentiment(tokens)

        result = {
            'text': text,
            'sentiment': sentiment,
            'score': score,
            'confidence': confidence,
        }

        # Add emotions if requested
        if include_emotions:
            result['emotions'] = self.detect_emotions(tokens)

        # Add keywords if requested
        if include_keywords:
            result['keywords'] = self.extract_keywords(tokens)

        return result

    def tokenize(self, text: str) -> List[str]:
        """
        Tokenize text into words
        """
        # Convert to lowercase
        text = text.lower()

        # Remove special characters except apostrophes
        text = re.sub(r"[^a-z\s']", ' ', text)

        # Split into tokens
        tokens = text.split()

        return tokens

    def calculate_sentiment(self, tokens: List[str]) -> Tuple[str, float, float]:
        """
        Calculate sentiment score for tokens

        Returns:
            Tuple of (sentiment, score, confidence)
        """
        positive_count = 0
        negative_count = 0
        intensifier_multiplier = 1.0
        negation_active = False

        for i, token in enumerate(tokens):
            # Check for intensifiers
            if token in self.intensifiers:
                intensifier_multiplier = 1.5
                continue

            # Check for negations
            if token in self.negations:
                negation_active = True
                continue

            # Calculate sentiment
            is_positive = token in self.positive_words
            is_negative = token in self.negative_words

            # Apply negation
            if negation_active:
                is_positive, is_negative = is_negative, is_positive
                negation_active = False

            # Apply intensifier
            if is_positive:
                positive_count += intensifier_multiplier
            elif is_negative:
                negative_count += intensifier_multiplier

            # Reset intensifier
            intensifier_multiplier = 1.0

        # Calculate score (-1 to 1)
        total = positive_count + negative_count
        if total == 0:
            score = 0.0
            sentiment = 'neutral'
            confidence = 0.5
        else:
            score = (positive_count - negative_count) / total

            # Determine sentiment
            if score > 0.15:
                sentiment = 'positive'
                confidence = min(0.6 + abs(score) * 0.4, 0.99)
            elif score < -0.15:
                sentiment = 'negative'
                confidence = min(0.6 + abs(score) * 0.4, 0.99)
            else:
                sentiment = 'neutral'
                confidence = 0.5 + abs(score) * 0.3

        return sentiment, score, confidence

    def detect_emotions(self, tokens: List[str]) -> Dict[str, float]:
        """
        Detect emotions in text
        """
        emotions = {}

        for emotion, keywords in self.emotion_keywords.items():
            count = sum(1 for token in tokens if token in keywords)
            if count > 0:
                emotions[emotion] = min(count / len(tokens) * 5, 1.0)

        return emotions

    def extract_keywords(self, tokens: List[str]) -> List[str]:
        """
        Extract important keywords from text
        """
        # Remove common words
        stopwords = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
            'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
            'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this',
            'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
        }

        # Filter tokens
        filtered = [t for t in tokens if t not in stopwords and len(t) > 2]

        # Get most common tokens
        counter = Counter(filtered)
        keywords = [word for word, count in counter.most_common(5)]

        return keywords


class LanguageDetector:
    """
    Simple language detection

    In production, use libraries like:
    - langdetect
    - langid
    - fasttext language identification
    """

    def __init__(self):
        self.language_patterns = {
            'en': re.compile(r'\b(the|and|is|to|of|in|for|on|with|as)\b', re.I),
            'es': re.compile(r'\b(el|la|de|que|y|en|un|por|es|para)\b', re.I),
            'fr': re.compile(r'\b(le|de|un|être|et|à|il|avoir|ne|je)\b', re.I),
            'de': re.compile(r'\b(der|die|und|in|den|von|zu|das|mit|sich)\b', re.I),
            'it': re.compile(r'\b(il|di|e|la|che|per|un|in|essere|a)\b', re.I),
            'pt': re.compile(r'\b(o|de|e|a|que|do|da|em|um|para)\b', re.I),
        }

    def detect(self, text: str) -> str:
        """
        Detect language of text
        """
        scores = {}

        for lang, pattern in self.language_patterns.items():
            matches = pattern.findall(text)
            scores[lang] = len(matches)

        if not scores or max(scores.values()) == 0:
            return 'en'  # Default to English

        return max(scores, key=scores.get)


class TextPreprocessor:
    """
    Text preprocessing utilities
    """

    @staticmethod
    def clean_text(text: str) -> str:
        """
        Clean and normalize text
        """
        # Remove URLs
        text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', text)

        # Remove email addresses
        text = re.sub(r'\S+@\S+', '', text)

        # Remove mentions
        text = re.sub(r'@\w+', '', text)

        # Remove hashtags (keep the text)
        text = re.sub(r'#(\w+)', r'\1', text)

        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)

        # Trim
        text = text.strip()

        return text

    @staticmethod
    def remove_html(text: str) -> str:
        """
        Remove HTML tags
        """
        return re.sub(r'<[^>]+>', '', text)

    @staticmethod
    def remove_emojis(text: str) -> str:
        """
        Remove emojis
        """
        emoji_pattern = re.compile("["
            u"\U0001F600-\U0001F64F"  # emoticons
            u"\U0001F300-\U0001F5FF"  # symbols & pictographs
            u"\U0001F680-\U0001F6FF"  # transport & map symbols
            u"\U0001F1E0-\U0001F1FF"  # flags
            u"\U00002702-\U000027B0"
            u"\U000024C2-\U0001F251"
            "]+", flags=re.UNICODE)
        return emoji_pattern.sub(r'', text)


class SentimentAnalyzer:
    """
    Main sentiment analyzer
    """

    def __init__(self):
        self.model = SentimentModel()
        self.language_detector = LanguageDetector()
        self.preprocessor = TextPreprocessor()

    def analyze(self, text: str, language: str = 'auto',
                include_emotions: bool = False,
                include_keywords: bool = False) -> Dict:
        """
        Analyze sentiment of text

        Args:
            text: Input text
            language: Language code or 'auto' for detection
            include_emotions: Include emotion detection
            include_keywords: Include keyword extraction

        Returns:
            Sentiment analysis results
        """
        start_time = time.time()

        # Preprocess text
        cleaned_text = self.preprocessor.clean_text(text)
        cleaned_text = self.preprocessor.remove_html(cleaned_text)

        # Detect language if auto
        if language == 'auto':
            language = self.language_detector.detect(cleaned_text)

        # Perform sentiment analysis
        result = self.model.predict(
            cleaned_text,
            include_emotions=include_emotions,
            include_keywords=include_keywords
        )

        # Add language
        result['language'] = language

        # Add processing time
        result['processingTime'] = int((time.time() - start_time) * 1000)

        return result


def parse_args():
    """
    Parse command line arguments
    """
    parser = argparse.ArgumentParser(description='Sentiment Analysis')
    parser.add_argument('--text', type=str, required=True, help='Text to analyze')
    parser.add_argument('--language', type=str, default='auto', help='Language code')
    parser.add_argument('--include-emotions', type=str, default='false',
                        help='Include emotion detection')
    parser.add_argument('--include-keywords', type=str, default='false',
                        help='Include keyword extraction')

    return parser.parse_args()


def main():
    """
    Main entry point
    """
    try:
        # Parse arguments
        args = parse_args()

        # Create analyzer
        analyzer = SentimentAnalyzer()

        # Analyze sentiment
        result = analyzer.analyze(
            text=args.text,
            language=args.language,
            include_emotions=args.include_emotions.lower() == 'true',
            include_keywords=args.include_keywords.lower() == 'true'
        )

        # Output JSON result
        print(json.dumps(result, indent=2))
        sys.exit(0)

    except Exception as e:
        error = {
            'error': str(e),
            'type': type(e).__name__
        }
        print(json.dumps(error, indent=2), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()

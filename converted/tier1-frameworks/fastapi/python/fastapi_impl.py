"""
FastAPI Python Implementation
Demonstrates Python code being called from TypeScript FastAPI endpoints.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime


class FastAPIHelper:
    """
    Python helper class for FastAPI operations.
    Can be called from TypeScript endpoints to perform Python-specific operations.
    """

    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format using Python."""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using Python's hashlib."""
        import hashlib
        return hashlib.sha256(password.encode()).hexdigest()

    @staticmethod
    def generate_token(user_id: int, expiry_minutes: int = 60) -> Dict[str, Any]:
        """Generate JWT-like token (simplified)."""
        import time
        import base64
        import json

        payload = {
            'user_id': user_id,
            'exp': int(time.time()) + (expiry_minutes * 60),
            'iat': int(time.time())
        }

        # Simplified token generation (in production, use PyJWT)
        token = base64.b64encode(json.dumps(payload).encode()).decode()

        return {
            'access_token': token,
            'token_type': 'bearer',
            'expires_in': expiry_minutes * 60
        }

    @staticmethod
    def parse_datetime(date_string: str) -> Optional[datetime]:
        """Parse datetime string using Python's datetime module."""
        from dateutil import parser
        try:
            return parser.parse(date_string)
        except:
            return None

    @staticmethod
    def format_datetime(dt: datetime, format: str = 'iso') -> str:
        """Format datetime to string."""
        if format == 'iso':
            return dt.isoformat()
        elif format == 'rfc':
            return dt.strftime('%a, %d %b %Y %H:%M:%S GMT')
        else:
            return dt.strftime(format)


class DataProcessor:
    """
    Python data processing utilities for FastAPI.
    Demonstrates CPU-intensive operations in Python.
    """

    @staticmethod
    def process_csv_data(csv_string: str) -> List[Dict[str, Any]]:
        """Process CSV data using Python."""
        import csv
        import io

        reader = csv.DictReader(io.StringIO(csv_string))
        return list(reader)

    @staticmethod
    def calculate_statistics(numbers: List[float]) -> Dict[str, float]:
        """Calculate statistics using Python."""
        import statistics

        if not numbers:
            return {
                'count': 0,
                'mean': 0,
                'median': 0,
                'stdev': 0,
                'min': 0,
                'max': 0
            }

        return {
            'count': len(numbers),
            'mean': statistics.mean(numbers),
            'median': statistics.median(numbers),
            'stdev': statistics.stdev(numbers) if len(numbers) > 1 else 0,
            'min': min(numbers),
            'max': max(numbers)
        }

    @staticmethod
    def clean_text(text: str) -> str:
        """Clean and normalize text using Python."""
        import re

        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)

        # Remove special characters
        text = re.sub(r'[^\w\s]', '', text)

        # Normalize case
        text = text.lower().strip()

        return text


class MLInference:
    """
    Machine Learning inference using Python.
    Demonstrates calling Python ML libraries from TypeScript endpoints.
    """

    @staticmethod
    def predict_sentiment(text: str) -> Dict[str, Any]:
        """
        Predict sentiment of text (simplified example).
        In production, would use actual ML models like transformers.
        """
        # Simplified sentiment analysis
        positive_words = {'good', 'great', 'excellent', 'amazing', 'love', 'wonderful'}
        negative_words = {'bad', 'terrible', 'awful', 'hate', 'poor', 'horrible'}

        words = set(text.lower().split())
        positive_count = len(words & positive_words)
        negative_count = len(words & negative_words)

        if positive_count > negative_count:
            sentiment = 'positive'
            score = min(0.5 + (positive_count * 0.1), 0.99)
        elif negative_count > positive_count:
            sentiment = 'negative'
            score = min(0.5 + (negative_count * 0.1), 0.99)
        else:
            sentiment = 'neutral'
            score = 0.5

        return {
            'sentiment': sentiment,
            'score': score,
            'confidence': 'high' if abs(positive_count - negative_count) > 2 else 'low'
        }

    @staticmethod
    def classify_text(text: str, categories: List[str]) -> Dict[str, float]:
        """
        Classify text into categories (simplified example).
        In production, would use actual ML models.
        """
        # Simplified classification based on keyword matching
        scores = {}

        for category in categories:
            # Simple scoring based on keyword presence
            category_words = set(category.lower().split())
            text_words = set(text.lower().split())
            overlap = len(category_words & text_words)
            scores[category] = overlap / max(len(category_words), 1)

        return scores

    @staticmethod
    def extract_entities(text: str) -> List[Dict[str, str]]:
        """
        Extract named entities from text (simplified example).
        In production, would use spaCy or similar.
        """
        import re

        entities = []

        # Extract email addresses
        emails = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
        for email in emails:
            entities.append({
                'text': email,
                'type': 'EMAIL',
                'start': text.find(email),
                'end': text.find(email) + len(email)
            })

        # Extract URLs
        urls = re.findall(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', text)
        for url in urls:
            entities.append({
                'text': url,
                'type': 'URL',
                'start': text.find(url),
                'end': text.find(url) + len(url)
            })

        # Extract dates (simplified)
        dates = re.findall(r'\b\d{4}-\d{2}-\d{2}\b', text)
        for date in dates:
            entities.append({
                'text': date,
                'type': 'DATE',
                'start': text.find(date),
                'end': text.find(date) + len(date)
            })

        return entities


class DatabaseHelper:
    """
    Python database helper for FastAPI.
    Demonstrates database operations in Python called from TypeScript.
    """

    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        self.connection = None

    def connect(self) -> bool:
        """Connect to database."""
        # In production, would use SQLAlchemy or similar
        # For now, just simulate connection
        self.connection = {'connected': True}
        return True

    def query(self, sql: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Execute SQL query."""
        # Simplified query execution
        # In production, would use actual database connection
        return [
            {'id': 1, 'name': 'Example', 'created': datetime.now().isoformat()}
        ]

    def close(self):
        """Close database connection."""
        self.connection = None


# Example usage functions that can be called from TypeScript

def process_user_registration(email: str, password: str) -> Dict[str, Any]:
    """
    Complete user registration process in Python.
    Called from TypeScript endpoint.
    """
    # Validate email
    if not FastAPIHelper.validate_email(email):
        return {
            'success': False,
            'error': 'Invalid email format'
        }

    # Hash password
    password_hash = FastAPIHelper.hash_password(password)

    # Generate token
    token_data = FastAPIHelper.generate_token(user_id=1)

    return {
        'success': True,
        'user': {
            'email': email,
            'password_hash': password_hash
        },
        'token': token_data
    }


def analyze_document(text: str) -> Dict[str, Any]:
    """
    Analyze document using Python NLP capabilities.
    Called from TypeScript endpoint.
    """
    # Clean text
    cleaned_text = DataProcessor.clean_text(text)

    # Predict sentiment
    sentiment = MLInference.predict_sentiment(text)

    # Extract entities
    entities = MLInference.extract_entities(text)

    # Calculate statistics
    words = text.split()
    word_lengths = [len(word) for word in words]
    stats = DataProcessor.calculate_statistics(word_lengths)

    return {
        'original_length': len(text),
        'cleaned_length': len(cleaned_text),
        'word_count': len(words),
        'word_length_stats': stats,
        'sentiment': sentiment,
        'entities': entities
    }


def batch_process_data(data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Batch process data using Python.
    Demonstrates Python's data processing capabilities.
    """
    processed_items = []
    errors = []

    for i, item in enumerate(data):
        try:
            # Process each item
            processed = {
                'index': i,
                'original': item,
                'processed_at': datetime.now().isoformat()
            }

            # Add custom processing
            if 'text' in item:
                processed['cleaned_text'] = DataProcessor.clean_text(item['text'])
                processed['sentiment'] = MLInference.predict_sentiment(item['text'])

            processed_items.append(processed)
        except Exception as e:
            errors.append({
                'index': i,
                'error': str(e)
            })

    return {
        'total': len(data),
        'processed': len(processed_items),
        'errors': len(errors),
        'items': processed_items,
        'error_details': errors
    }

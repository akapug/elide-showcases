"""
ElideBase - Python Hooks

Python hooks for ML predictions, data processing, and analytics.
These hooks are executed by ElideBase when database events occur.

Example use cases:
- ML predictions on new data
- Data validation and enrichment
- Analytics and reporting
- Image processing
"""

import json
import sys
from typing import Dict, Any, List
from datetime import datetime


class Hook:
    """Base class for ElideBase Python hooks"""

    def __init__(self, event: Dict[str, Any]):
        self.event = event
        self.collection = event.get('collection')
        self.record = event.get('record')
        self.action = event.get('action')  # create, update, delete

    def execute(self) -> Dict[str, Any]:
        """Execute the hook and return result"""
        raise NotImplementedError


class MLPredictionHook(Hook):
    """
    ML Prediction Hook
    Runs ML model predictions on new records
    """

    def execute(self) -> Dict[str, Any]:
        """Run ML prediction on the record"""

        if self.collection == 'posts' and self.action == 'create':
            # Simulate ML prediction for content categorization
            content = self.record.get('content', '')

            # Mock ML prediction
            category = self.predict_category(content)
            sentiment = self.analyze_sentiment(content)

            # Return enriched data
            return {
                'success': True,
                'enrichment': {
                    'predicted_category': category,
                    'sentiment': sentiment,
                    'confidence': 0.92
                }
            }

        return {'success': True}

    def predict_category(self, content: str) -> str:
        """Predict content category using ML model"""
        # In real implementation, this would call a trained model
        keywords = {
            'technology': ['ai', 'machine learning', 'python', 'code'],
            'business': ['revenue', 'sales', 'marketing', 'customer'],
            'lifestyle': ['health', 'fitness', 'food', 'travel']
        }

        content_lower = content.lower()
        scores = {}

        for category, terms in keywords.items():
            score = sum(1 for term in terms if term in content_lower)
            scores[category] = score

        return max(scores, key=scores.get) if scores else 'general'

    def analyze_sentiment(self, content: str) -> str:
        """Analyze sentiment of content"""
        # Mock sentiment analysis
        positive_words = ['good', 'great', 'excellent', 'amazing', 'love']
        negative_words = ['bad', 'terrible', 'hate', 'awful', 'poor']

        content_lower = content.lower()
        positive_score = sum(1 for word in positive_words if word in content_lower)
        negative_score = sum(1 for word in negative_words if word in content_lower)

        if positive_score > negative_score:
            return 'positive'
        elif negative_score > positive_score:
            return 'negative'
        else:
            return 'neutral'


class DataValidationHook(Hook):
    """
    Data Validation Hook
    Validates and enriches data before saving
    """

    def execute(self) -> Dict[str, Any]:
        """Validate record data"""

        errors = []

        # Validate based on collection
        if self.collection == 'users':
            errors.extend(self.validate_user())
        elif self.collection == 'posts':
            errors.extend(self.validate_post())

        if errors:
            return {
                'success': False,
                'errors': errors
            }

        return {'success': True}

    def validate_user(self) -> List[str]:
        """Validate user data"""
        errors = []

        email = self.record.get('email', '')
        if not email or '@' not in email:
            errors.append('Invalid email address')

        username = self.record.get('username', '')
        if len(username) < 3:
            errors.append('Username must be at least 3 characters')

        return errors

    def validate_post(self) -> List[str]:
        """Validate post data"""
        errors = []

        title = self.record.get('title', '')
        if len(title) < 5:
            errors.append('Title must be at least 5 characters')

        content = self.record.get('content', '')
        if len(content) < 10:
            errors.append('Content must be at least 10 characters')

        return errors


class AnalyticsHook(Hook):
    """
    Analytics Hook
    Tracks events and generates analytics
    """

    def execute(self) -> Dict[str, Any]:
        """Track analytics event"""

        event_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'collection': self.collection,
            'action': self.action,
            'record_id': self.record.get('id'),
            'metadata': self.extract_metadata()
        }

        # In real implementation, this would send to analytics service
        self.log_event(event_data)

        return {'success': True}

    def extract_metadata(self) -> Dict[str, Any]:
        """Extract metadata from record"""
        return {
            'has_image': 'image' in self.record,
            'has_tags': 'tags' in self.record,
            'field_count': len(self.record)
        }

    def log_event(self, event_data: Dict[str, Any]):
        """Log analytics event"""
        # In real implementation, send to analytics platform
        print(f"[ANALYTICS] {json.dumps(event_data)}")


class ImageProcessingHook(Hook):
    """
    Image Processing Hook
    Processes uploaded images (resize, optimize, generate thumbnails)
    """

    def execute(self) -> Dict[str, Any]:
        """Process image"""

        if 'image' not in self.record:
            return {'success': True}

        image_url = self.record.get('image')

        # Mock image processing
        processed = {
            'original': image_url,
            'thumbnail': f"{image_url}?size=thumb",
            'medium': f"{image_url}?size=medium",
            'optimized': True,
            'dimensions': {'width': 1200, 'height': 800}
        }

        return {
            'success': True,
            'enrichment': {
                'images': processed
            }
        }


class DataEnrichmentHook(Hook):
    """
    Data Enrichment Hook
    Enriches records with external data
    """

    def execute(self) -> Dict[str, Any]:
        """Enrich record data"""

        enrichment = {}

        # Enrich user profiles
        if self.collection == 'users' and self.action == 'create':
            email = self.record.get('email', '')
            enrichment = self.enrich_user_profile(email)

        # Enrich posts
        if self.collection == 'posts':
            content = self.record.get('content', '')
            enrichment = self.enrich_post(content)

        return {
            'success': True,
            'enrichment': enrichment
        }

    def enrich_user_profile(self, email: str) -> Dict[str, Any]:
        """Enrich user profile with external data"""
        # Mock enrichment - in real implementation, call external APIs
        domain = email.split('@')[1] if '@' in email else ''

        return {
            'email_domain': domain,
            'estimated_location': 'United States',
            'timezone': 'America/New_York'
        }

    def enrich_post(self, content: str) -> Dict[str, Any]:
        """Enrich post with metadata"""
        words = content.split()

        return {
            'word_count': len(words),
            'estimated_reading_time': max(1, len(words) // 200),  # minutes
            'has_links': 'http' in content,
            'language': 'en'
        }


# Hook registry
HOOKS = {
    'ml_prediction': MLPredictionHook,
    'data_validation': DataValidationHook,
    'analytics': AnalyticsHook,
    'image_processing': ImageProcessingHook,
    'data_enrichment': DataEnrichmentHook
}


def main():
    """
    Main entry point for Python hooks
    Receives JSON event from stdin and returns JSON result to stdout
    """

    try:
        # Read event from stdin
        event_json = sys.stdin.read()
        event = json.loads(event_json)

        # Get hook name
        hook_name = event.get('hook', 'ml_prediction')

        # Get hook class
        hook_class = HOOKS.get(hook_name)
        if not hook_class:
            result = {
                'success': False,
                'error': f'Unknown hook: {hook_name}'
            }
        else:
            # Execute hook
            hook = hook_class(event)
            result = hook.execute()

        # Return result as JSON
        print(json.dumps(result))

    except Exception as e:
        # Return error
        error_result = {
            'success': False,
            'error': str(e)
        }
        print(json.dumps(error_result))
        sys.exit(1)


if __name__ == '__main__':
    main()

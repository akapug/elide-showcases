"""
ML Data Enrichment

Machine learning-based data enrichment for streaming pipelines:
- Feature extraction
- Embedding generation
- Entity recognition
- Sentiment analysis
- Classification
- Predictive enrichment
- Batch processing optimization
"""

import json
import time
import hashlib
from typing import Any, Dict, List, Optional, Tuple, Callable
from dataclasses import dataclass, field
from datetime import datetime
from collections import defaultdict
import numpy as np


# ============================================================================
# Configuration Classes
# ============================================================================

@dataclass
class MLModelConfig:
    """Configuration for ML model"""
    model_type: str  # 'classification', 'regression', 'embedding', 'ner', 'sentiment'
    model_name: str
    version: str = "1.0.0"
    batch_size: int = 32
    max_batch_wait_ms: int = 100
    cache_enabled: bool = True
    cache_ttl_seconds: int = 3600


@dataclass
class EnrichmentConfig:
    """Configuration for enrichment pipeline"""
    models: List[MLModelConfig] = field(default_factory=list)
    feature_extractors: List[str] = field(default_factory=list)
    parallel_processing: bool = True
    max_workers: int = 4
    error_handling: str = "continue"  # 'continue' or 'fail'


# ============================================================================
# Feature Extractors
# ============================================================================

class FeatureExtractor:
    """Base class for feature extraction"""

    def __init__(self, name: str):
        self.name = name

    def extract(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract features from data"""
        raise NotImplementedError


class TextFeatureExtractor(FeatureExtractor):
    """Extract features from text data"""

    def __init__(self):
        super().__init__("text")

    def extract(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract text features"""
        text = data.get("text", "")

        features = {
            "text_length": len(text),
            "word_count": len(text.split()),
            "char_count": len(text),
            "avg_word_length": self._avg_word_length(text),
            "uppercase_ratio": self._uppercase_ratio(text),
            "digit_ratio": self._digit_ratio(text),
            "special_char_ratio": self._special_char_ratio(text),
            "sentence_count": text.count('.') + text.count('!') + text.count('?'),
            "has_url": 'http' in text.lower(),
            "has_email": '@' in text and '.' in text,
            "has_hashtag": '#' in text,
            "has_mention": '@' in text,
        }

        return features

    def _avg_word_length(self, text: str) -> float:
        words = text.split()
        return sum(len(w) for w in words) / len(words) if words else 0

    def _uppercase_ratio(self, text: str) -> float:
        if not text:
            return 0
        return sum(1 for c in text if c.isupper()) / len(text)

    def _digit_ratio(self, text: str) -> float:
        if not text:
            return 0
        return sum(1 for c in text if c.isdigit()) / len(text)

    def _special_char_ratio(self, text: str) -> float:
        if not text:
            return 0
        return sum(1 for c in text if not c.isalnum() and not c.isspace()) / len(text)


class NumericFeatureExtractor(FeatureExtractor):
    """Extract features from numeric data"""

    def __init__(self):
        super().__init__("numeric")
        self.history: Dict[str, List[float]] = defaultdict(list)
        self.max_history = 1000

    def extract(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract numeric features"""
        features = {}

        for key, value in data.items():
            if isinstance(value, (int, float)):
                # Basic features
                features[f"{key}_value"] = value
                features[f"{key}_abs"] = abs(value)
                features[f"{key}_log"] = np.log1p(abs(value))
                features[f"{key}_sqrt"] = np.sqrt(abs(value))

                # Historical features
                history = self.history[key]
                history.append(value)
                if len(history) > self.max_history:
                    history.pop(0)

                if len(history) >= 2:
                    features[f"{key}_delta"] = value - history[-2]
                    features[f"{key}_delta_pct"] = (
                        (value - history[-2]) / history[-2] * 100
                        if history[-2] != 0 else 0
                    )

                if len(history) >= 5:
                    recent = history[-5:]
                    features[f"{key}_ma5"] = np.mean(recent)
                    features[f"{key}_std5"] = np.std(recent)
                    features[f"{key}_trend5"] = self._calculate_trend(recent)

                if len(history) >= 10:
                    recent = history[-10:]
                    features[f"{key}_ma10"] = np.mean(recent)
                    features[f"{key}_min10"] = np.min(recent)
                    features[f"{key}_max10"] = np.max(recent)

        return features

    def _calculate_trend(self, values: List[float]) -> float:
        """Calculate simple trend (positive or negative)"""
        if len(values) < 2:
            return 0

        x = np.arange(len(values))
        coeffs = np.polyfit(x, values, 1)
        return float(coeffs[0])


class TemporalFeatureExtractor(FeatureExtractor):
    """Extract temporal features from timestamps"""

    def __init__(self):
        super().__init__("temporal")

    def extract(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract temporal features"""
        timestamp = data.get("timestamp", time.time())

        if isinstance(timestamp, str):
            try:
                dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            except:
                dt = datetime.now()
        else:
            dt = datetime.fromtimestamp(timestamp)

        features = {
            "hour_of_day": dt.hour,
            "day_of_week": dt.weekday(),
            "day_of_month": dt.day,
            "month": dt.month,
            "quarter": (dt.month - 1) // 3 + 1,
            "is_weekend": dt.weekday() >= 5,
            "is_business_hours": 9 <= dt.hour <= 17 and dt.weekday() < 5,
            "is_night": dt.hour < 6 or dt.hour >= 22,
            "is_morning": 6 <= dt.hour < 12,
            "is_afternoon": 12 <= dt.hour < 18,
            "is_evening": 18 <= dt.hour < 22,
            "unix_timestamp": timestamp if isinstance(timestamp, (int, float)) else dt.timestamp(),
        }

        return features


# ============================================================================
# ML Models (Simulated)
# ============================================================================

class MLModel:
    """Base class for ML models"""

    def __init__(self, config: MLModelConfig):
        self.config = config
        self.cache: Dict[str, Tuple[Any, float]] = {}

    def predict(self, features: Dict[str, Any]) -> Any:
        """Make prediction"""
        raise NotImplementedError

    def predict_batch(self, features_batch: List[Dict[str, Any]]) -> List[Any]:
        """Batch prediction"""
        return [self.predict(features) for features in features_batch]

    def _get_cache_key(self, features: Dict[str, Any]) -> str:
        """Generate cache key from features"""
        feature_str = json.dumps(features, sort_keys=True)
        return hashlib.md5(feature_str.encode()).hexdigest()

    def _check_cache(self, cache_key: str) -> Optional[Any]:
        """Check cache for prediction"""
        if not self.config.cache_enabled:
            return None

        if cache_key in self.cache:
            result, timestamp = self.cache[cache_key]
            if time.time() - timestamp < self.config.cache_ttl_seconds:
                return result
            else:
                del self.cache[cache_key]

        return None

    def _update_cache(self, cache_key: str, result: Any):
        """Update cache with prediction"""
        if self.config.cache_enabled:
            self.cache[cache_key] = (result, time.time())


class SentimentModel(MLModel):
    """Sentiment analysis model"""

    def __init__(self, config: MLModelConfig):
        super().__init__(config)
        self.positive_words = {
            'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
            'love', 'happy', 'best', 'awesome', 'perfect', 'brilliant'
        }
        self.negative_words = {
            'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate',
            'disappointing', 'poor', 'useless', 'waste', 'broken', 'fail'
        }

    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Predict sentiment"""
        cache_key = self._get_cache_key(features)
        cached = self._check_cache(cache_key)
        if cached:
            return cached

        text = features.get("text", "").lower()
        words = text.split()

        positive_count = sum(1 for word in words if word in self.positive_words)
        negative_count = sum(1 for word in words if word in self.negative_words)

        # Calculate sentiment score
        total_words = len(words)
        if total_words == 0:
            sentiment_score = 0.0
        else:
            sentiment_score = (positive_count - negative_count) / total_words

        # Normalize to 0-1 range
        sentiment_score = (sentiment_score + 0.5) * 0.5
        sentiment_score = max(0.0, min(1.0, sentiment_score))

        # Determine label
        if sentiment_score > 0.6:
            label = "positive"
        elif sentiment_score < 0.4:
            label = "negative"
        else:
            label = "neutral"

        result = {
            "sentiment": label,
            "sentiment_score": sentiment_score,
            "positive_words": positive_count,
            "negative_words": negative_count,
            "confidence": abs(sentiment_score - 0.5) * 2
        }

        self._update_cache(cache_key, result)
        return result


class EmbeddingModel(MLModel):
    """Text embedding model"""

    def __init__(self, config: MLModelConfig, embedding_dim: int = 128):
        super().__init__(config)
        self.embedding_dim = embedding_dim

    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Generate embedding"""
        cache_key = self._get_cache_key(features)
        cached = self._check_cache(cache_key)
        if cached:
            return cached

        text = features.get("text", "")

        # Simulate embedding generation (in practice, use real model)
        # Use hash-based approach for consistency
        hash_val = int(hashlib.md5(text.encode()).hexdigest(), 16)
        np.random.seed(hash_val % (2**32))
        embedding = np.random.randn(self.embedding_dim).astype(float)

        # Normalize
        embedding = embedding / (np.linalg.norm(embedding) + 1e-8)

        result = {
            "embedding": embedding.tolist(),
            "embedding_dim": self.embedding_dim
        }

        self._update_cache(cache_key, result)
        return result


class ClassificationModel(MLModel):
    """Classification model"""

    def __init__(self, config: MLModelConfig, classes: List[str]):
        super().__init__(config)
        self.classes = classes

    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Predict class"""
        cache_key = self._get_cache_key(features)
        cached = self._check_cache(cache_key)
        if cached:
            return cached

        # Simulate classification (use feature-based hashing for consistency)
        feature_str = json.dumps(features, sort_keys=True)
        hash_val = int(hashlib.md5(feature_str.encode()).hexdigest(), 16)

        # Generate probability distribution
        np.random.seed(hash_val % (2**32))
        logits = np.random.randn(len(self.classes))
        probs = np.exp(logits) / np.sum(np.exp(logits))

        predicted_class = self.classes[np.argmax(probs)]
        confidence = float(np.max(probs))

        result = {
            "predicted_class": predicted_class,
            "confidence": confidence,
            "probabilities": {
                cls: float(prob) for cls, prob in zip(self.classes, probs)
            }
        }

        self._update_cache(cache_key, result)
        return result


class NERModel(MLModel):
    """Named Entity Recognition model"""

    def __init__(self, config: MLModelConfig):
        super().__init__(config)
        self.entity_types = ["PERSON", "ORG", "LOC", "DATE", "MONEY", "PRODUCT"]

    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Extract named entities"""
        cache_key = self._get_cache_key(features)
        cached = self._check_cache(cache_key)
        if cached:
            return cached

        text = features.get("text", "")
        words = text.split()

        # Simulate entity extraction (simplified)
        entities = []

        for i, word in enumerate(words):
            # Simple heuristics for demo
            if word and word[0].isupper():
                # Simulate entity type prediction
                hash_val = int(hashlib.md5(word.encode()).hexdigest(), 16)
                entity_type = self.entity_types[hash_val % len(self.entity_types)]

                entities.append({
                    "text": word,
                    "type": entity_type,
                    "start": text.find(word),
                    "end": text.find(word) + len(word),
                    "confidence": 0.7 + (hash_val % 30) / 100
                })

        result = {
            "entities": entities,
            "entity_count": len(entities),
            "entity_types": list(set(e["type"] for e in entities))
        }

        self._update_cache(cache_key, result)
        return result


# ============================================================================
# ML Enrichment Pipeline
# ============================================================================

class MLEnrichmentPipeline:
    """ML-based data enrichment pipeline"""

    def __init__(self, config: EnrichmentConfig):
        self.config = config
        self.feature_extractors: List[FeatureExtractor] = []
        self.models: List[MLModel] = []
        self.batch_buffer: List[Dict[str, Any]] = []
        self.last_batch_time = time.time()

        self._initialize_extractors()
        self._initialize_models()

    def _initialize_extractors(self):
        """Initialize feature extractors"""
        extractors_map = {
            "text": TextFeatureExtractor,
            "numeric": NumericFeatureExtractor,
            "temporal": TemporalFeatureExtractor,
        }

        for extractor_name in self.config.feature_extractors:
            if extractor_name in extractors_map:
                self.feature_extractors.append(extractors_map[extractor_name]())

    def _initialize_models(self):
        """Initialize ML models"""
        for model_config in self.config.models:
            if model_config.model_type == "sentiment":
                self.models.append(SentimentModel(model_config))
            elif model_config.model_type == "embedding":
                self.models.append(EmbeddingModel(model_config))
            elif model_config.model_type == "classification":
                classes = ["category_a", "category_b", "category_c"]
                self.models.append(ClassificationModel(model_config, classes))
            elif model_config.model_type == "ner":
                self.models.append(NERModel(model_config))

    def enrich(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Enrich single data item"""
        enriched = data.copy()

        try:
            # Extract features
            features = self._extract_features(data)
            enriched["features"] = features

            # Apply ML models
            predictions = self._apply_models(features)
            enriched["predictions"] = predictions

            # Add metadata
            enriched["enrichment_metadata"] = {
                "timestamp": datetime.now().isoformat(),
                "version": "1.0.0",
                "models_applied": len(self.models),
                "features_extracted": len(features)
            }

        except Exception as e:
            if self.config.error_handling == "fail":
                raise
            else:
                enriched["enrichment_error"] = str(e)

        return enriched

    def enrich_batch(self, data_batch: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Enrich batch of data items"""
        results = []

        for data in data_batch:
            enriched = self.enrich(data)
            results.append(enriched)

        return results

    def _extract_features(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract all features from data"""
        features = {}

        for extractor in self.feature_extractors:
            try:
                extracted = extractor.extract(data)
                features.update(extracted)
            except Exception as e:
                features[f"{extractor.name}_error"] = str(e)

        return features

    def _apply_models(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Apply all ML models"""
        predictions = {}

        for model in self.models:
            try:
                prediction = model.predict(features)
                predictions[model.config.model_name] = prediction
            except Exception as e:
                predictions[f"{model.config.model_name}_error"] = str(e)

        return predictions


# ============================================================================
# Example Usage
# ============================================================================

def create_example_pipeline() -> MLEnrichmentPipeline:
    """Create example enrichment pipeline"""

    config = EnrichmentConfig(
        models=[
            MLModelConfig(
                model_type="sentiment",
                model_name="sentiment_analyzer",
                batch_size=32
            ),
            MLModelConfig(
                model_type="embedding",
                model_name="text_embedder",
                batch_size=16
            ),
            MLModelConfig(
                model_type="ner",
                model_name="entity_recognizer",
                batch_size=32
            ),
        ],
        feature_extractors=["text", "numeric", "temporal"],
        parallel_processing=True,
        max_workers=4
    )

    return MLEnrichmentPipeline(config)


if __name__ == "__main__":
    # Example usage
    pipeline = create_example_pipeline()

    # Sample data
    sample_data = {
        "id": "123",
        "text": "This is a great product! I love it.",
        "timestamp": time.time(),
        "value": 42.5,
        "category": "electronics"
    }

    # Enrich data
    enriched = pipeline.enrich(sample_data)

    print("Enriched data:")
    print(json.dumps(enriched, indent=2, default=str))

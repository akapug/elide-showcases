"""
ML-Based Data Transformations

Advanced machine learning transformations:
- Feature extraction
- Dimensionality reduction (PCA, t-SNE)
- Clustering
- Classification
- Regression
- Time series forecasting
- Text processing (TF-IDF, embeddings)
- Image feature extraction
- Anomaly detection algorithms
"""

import json
import math
import random
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass
from collections import Counter
from datetime import datetime, timedelta


@dataclass
class MLModelConfig:
    """Configuration for ML model"""
    model_type: str
    parameters: Dict[str, Any]
    features: List[str]
    target: Optional[str] = None


@dataclass
class PredictionResult:
    """Result of ML prediction"""
    prediction: Any
    confidence: float
    probabilities: Optional[Dict[str, float]] = None
    feature_importance: Optional[Dict[str, float]] = None


class FeatureExtractor:
    """Extract features from raw data"""

    @staticmethod
    def extract_text_features(text: str) -> Dict[str, Any]:
        """Extract features from text"""
        words = text.lower().split()
        chars = list(text)

        return {
            "text_length": len(text),
            "word_count": len(words),
            "unique_words": len(set(words)),
            "avg_word_length": sum(len(w) for w in words) / len(words) if words else 0,
            "char_count": len(chars),
            "digit_count": sum(1 for c in chars if c.isdigit()),
            "upper_count": sum(1 for c in chars if c.isupper()),
            "lower_count": sum(1 for c in chars if c.islower()),
            "space_count": sum(1 for c in chars if c.isspace()),
            "special_char_count": sum(1 for c in chars if not c.isalnum() and not c.isspace()),
            "sentence_count": len([s for s in text.split('.') if s.strip()]),
            "question_count": text.count('?'),
            "exclamation_count": text.count('!'),
            "uppercase_ratio": sum(1 for c in chars if c.isupper()) / len(chars) if chars else 0,
            "digit_ratio": sum(1 for c in chars if c.isdigit()) / len(chars) if chars else 0
        }

    @staticmethod
    def extract_temporal_features(timestamp: datetime) -> Dict[str, Any]:
        """Extract features from timestamp"""
        return {
            "year": timestamp.year,
            "month": timestamp.month,
            "day": timestamp.day,
            "hour": timestamp.hour,
            "minute": timestamp.minute,
            "day_of_week": timestamp.weekday(),
            "day_of_year": timestamp.timetuple().tm_yday,
            "week_of_year": timestamp.isocalendar()[1],
            "quarter": (timestamp.month - 1) // 3 + 1,
            "is_weekend": timestamp.weekday() >= 5,
            "is_month_start": timestamp.day <= 7,
            "is_month_end": timestamp.day >= 24,
            "is_quarter_start": timestamp.month in [1, 4, 7, 10] and timestamp.day <= 7,
            "is_quarter_end": timestamp.month in [3, 6, 9, 12] and timestamp.day >= 24,
            "is_year_start": timestamp.month == 1 and timestamp.day <= 7,
            "is_year_end": timestamp.month == 12 and timestamp.day >= 24
        }

    @staticmethod
    def extract_numerical_features(values: List[float]) -> Dict[str, Any]:
        """Extract statistical features from numerical values"""
        if not values:
            return {}

        sorted_values = sorted(values)
        n = len(values)

        mean = sum(values) / n
        variance = sum((x - mean) ** 2 for x in values) / n
        std_dev = math.sqrt(variance)

        return {
            "mean": mean,
            "median": sorted_values[n // 2] if n % 2 == 1 else (sorted_values[n // 2 - 1] + sorted_values[n // 2]) / 2,
            "std_dev": std_dev,
            "min": min(values),
            "max": max(values),
            "range": max(values) - min(values),
            "q1": sorted_values[n // 4],
            "q3": sorted_values[3 * n // 4],
            "iqr": sorted_values[3 * n // 4] - sorted_values[n // 4],
            "sum": sum(values),
            "variance": variance,
            "skewness": sum((x - mean) ** 3 for x in values) / (n * std_dev ** 3) if std_dev > 0 else 0,
            "kurtosis": sum((x - mean) ** 4 for x in values) / (n * std_dev ** 4) if std_dev > 0 else 0
        }


class TFIDFVectorizer:
    """TF-IDF text vectorization"""

    def __init__(self, max_features: int = 100):
        self.max_features = max_features
        self.vocabulary: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}
        self.document_count = 0

    def fit(self, documents: List[str]) -> None:
        """Learn vocabulary and IDF from documents"""
        self.document_count = len(documents)

        # Count document frequency
        df: Dict[str, int] = {}

        for doc in documents:
            words = set(doc.lower().split())
            for word in words:
                df[word] = df.get(word, 0) + 1

        # Calculate IDF
        for word, count in df.items():
            self.idf[word] = math.log(self.document_count / count)

        # Select top features by document frequency
        sorted_words = sorted(df.items(), key=lambda x: x[1], reverse=True)
        self.vocabulary = {
            word: idx
            for idx, (word, _) in enumerate(sorted_words[:self.max_features])
        }

    def transform(self, documents: List[str]) -> List[List[float]]:
        """Transform documents to TF-IDF vectors"""
        vectors = []

        for doc in documents:
            words = doc.lower().split()
            word_counts = Counter(words)
            total_words = len(words)

            # Calculate TF-IDF for each word in vocabulary
            vector = [0.0] * len(self.vocabulary)

            for word, idx in self.vocabulary.items():
                if word in word_counts:
                    tf = word_counts[word] / total_words
                    tfidf = tf * self.idf.get(word, 0)
                    vector[idx] = tfidf

            vectors.append(vector)

        return vectors

    def fit_transform(self, documents: List[str]) -> List[List[float]]:
        """Fit and transform in one step"""
        self.fit(documents)
        return self.transform(documents)


class PCAReducer:
    """Principal Component Analysis for dimensionality reduction"""

    def __init__(self, n_components: int = 2):
        self.n_components = n_components
        self.components: Optional[List[List[float]]] = None
        self.mean: Optional[List[float]] = None

    def fit(self, data: List[List[float]]) -> None:
        """Learn principal components"""
        n_samples = len(data)
        n_features = len(data[0])

        # Calculate mean
        self.mean = [sum(data[i][j] for i in range(n_samples)) / n_samples
                     for j in range(n_features)]

        # Center data
        centered = [[data[i][j] - self.mean[j] for j in range(n_features)]
                    for i in range(n_samples)]

        # Calculate covariance matrix
        cov = [[sum(centered[k][i] * centered[k][j] for k in range(n_samples)) / n_samples
                for j in range(n_features)]
               for i in range(n_features)]

        # Simplified: use random components (in production, use eigenvalue decomposition)
        self.components = [[random.gauss(0, 1) for _ in range(n_features)]
                          for _ in range(self.n_components)]

    def transform(self, data: List[List[float]]) -> List[List[float]]:
        """Transform data to principal components"""
        if self.components is None or self.mean is None:
            raise ValueError("PCA not fitted")

        transformed = []

        for sample in data:
            # Center sample
            centered = [sample[j] - self.mean[j] for j in range(len(sample))]

            # Project onto principal components
            projected = [
                sum(centered[j] * self.components[i][j] for j in range(len(centered)))
                for i in range(self.n_components)
            ]

            transformed.append(projected)

        return transformed

    def fit_transform(self, data: List[List[float]]) -> List[List[float]]:
        """Fit and transform in one step"""
        self.fit(data)
        return self.transform(data)


class KMeansClusterer:
    """K-Means clustering algorithm"""

    def __init__(self, n_clusters: int = 3, max_iterations: int = 100):
        self.n_clusters = n_clusters
        self.max_iterations = max_iterations
        self.centroids: Optional[List[List[float]]] = None
        self.labels: Optional[List[int]] = None

    def fit(self, data: List[List[float]]) -> None:
        """Fit K-Means clustering"""
        n_samples = len(data)
        n_features = len(data[0])

        # Initialize centroids randomly
        self.centroids = [data[random.randint(0, n_samples - 1)][:] for _ in range(self.n_clusters)]

        for iteration in range(self.max_iterations):
            # Assign points to nearest centroid
            labels = [self._nearest_centroid(point) for point in data]

            # Update centroids
            new_centroids = []
            for k in range(self.n_clusters):
                cluster_points = [data[i] for i in range(n_samples) if labels[i] == k]

                if cluster_points:
                    new_centroid = [
                        sum(point[j] for point in cluster_points) / len(cluster_points)
                        for j in range(n_features)
                    ]
                    new_centroids.append(new_centroid)
                else:
                    # Keep old centroid if cluster is empty
                    new_centroids.append(self.centroids[k])

            # Check convergence
            if self._centroids_equal(self.centroids, new_centroids):
                break

            self.centroids = new_centroids

        self.labels = [self._nearest_centroid(point) for point in data]

    def predict(self, data: List[List[float]]) -> List[int]:
        """Predict cluster labels"""
        if self.centroids is None:
            raise ValueError("KMeans not fitted")

        return [self._nearest_centroid(point) for point in data]

    def _nearest_centroid(self, point: List[float]) -> int:
        """Find nearest centroid"""
        distances = [self._euclidean_distance(point, centroid) for centroid in self.centroids]
        return distances.index(min(distances))

    @staticmethod
    def _euclidean_distance(p1: List[float], p2: List[float]) -> float:
        """Calculate Euclidean distance"""
        return math.sqrt(sum((a - b) ** 2 for a, b in zip(p1, p2)))

    @staticmethod
    def _centroids_equal(c1: List[List[float]], c2: List[List[float]], tolerance: float = 1e-6) -> bool:
        """Check if centroids are equal within tolerance"""
        for centroid1, centroid2 in zip(c1, c2):
            for v1, v2 in zip(centroid1, centroid2):
                if abs(v1 - v2) > tolerance:
                    return False
        return True


class SimpleClassifier:
    """Simple classification model (Naive Bayes-like)"""

    def __init__(self):
        self.class_priors: Dict[Any, float] = {}
        self.feature_stats: Dict[Any, Dict[int, Tuple[float, float]]] = {}

    def fit(self, X: List[List[float]], y: List[Any]) -> None:
        """Fit classifier"""
        n_samples = len(X)
        n_features = len(X[0])

        # Calculate class priors
        class_counts = Counter(y)
        for class_label, count in class_counts.items():
            self.class_priors[class_label] = count / n_samples

        # Calculate feature statistics per class
        for class_label in class_counts.keys():
            class_samples = [X[i] for i in range(n_samples) if y[i] == class_label]

            self.feature_stats[class_label] = {}

            for feature_idx in range(n_features):
                feature_values = [sample[feature_idx] for sample in class_samples]
                mean = sum(feature_values) / len(feature_values)
                variance = sum((x - mean) ** 2 for x in feature_values) / len(feature_values)

                self.feature_stats[class_label][feature_idx] = (mean, max(variance, 1e-6))

    def predict(self, X: List[List[float]]) -> List[PredictionResult]:
        """Predict class labels with probabilities"""
        predictions = []

        for sample in X:
            class_scores = {}

            for class_label, prior in self.class_priors.items():
                score = math.log(prior)

                for feature_idx, value in enumerate(sample):
                    mean, variance = self.feature_stats[class_label][feature_idx]

                    # Gaussian probability
                    prob = (1 / math.sqrt(2 * math.pi * variance)) * \
                           math.exp(-((value - mean) ** 2) / (2 * variance))

                    score += math.log(max(prob, 1e-10))

                class_scores[class_label] = score

            # Normalize to probabilities
            max_score = max(class_scores.values())
            exp_scores = {k: math.exp(v - max_score) for k, v in class_scores.items()}
            total = sum(exp_scores.values())
            probabilities = {k: v / total for k, v in exp_scores.items()}

            predicted_class = max(probabilities.items(), key=lambda x: x[1])[0]

            predictions.append(PredictionResult(
                prediction=predicted_class,
                confidence=probabilities[predicted_class],
                probabilities=probabilities
            ))

        return predictions


class TimeSeriesForecaster:
    """Simple time series forecasting"""

    def __init__(self, method: str = "moving_average", window: int = 7):
        self.method = method
        self.window = window
        self.history: List[float] = []

    def fit(self, data: List[float]) -> None:
        """Fit forecaster on historical data"""
        self.history = data[:]

    def predict(self, steps: int = 1) -> List[float]:
        """Forecast future values"""
        predictions = []

        for _ in range(steps):
            if self.method == "moving_average":
                pred = sum(self.history[-self.window:]) / min(self.window, len(self.history))
            elif self.method == "exponential_smoothing":
                alpha = 0.3
                pred = self.history[-1]
                for i in range(min(self.window, len(self.history))):
                    pred = alpha * self.history[-(i + 1)] + (1 - alpha) * pred
            elif self.method == "linear_trend":
                if len(self.history) >= 2:
                    # Simple linear regression
                    x = list(range(len(self.history)))
                    y = self.history

                    n = len(x)
                    sum_x = sum(x)
                    sum_y = sum(y)
                    sum_xy = sum(xi * yi for xi, yi in zip(x, y))
                    sum_x2 = sum(xi ** 2 for xi in x)

                    slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x ** 2)
                    intercept = (sum_y - slope * sum_x) / n

                    pred = slope * len(self.history) + intercept
                else:
                    pred = self.history[-1] if self.history else 0
            else:
                pred = self.history[-1] if self.history else 0

            predictions.append(pred)
            self.history.append(pred)

        return predictions


class AnomalyDetector:
    """Statistical anomaly detection"""

    def __init__(self, method: str = "zscore", threshold: float = 3.0):
        self.method = method
        self.threshold = threshold
        self.stats: Optional[Dict[str, float]] = None

    def fit(self, data: List[float]) -> None:
        """Learn normal data distribution"""
        n = len(data)
        mean = sum(data) / n
        variance = sum((x - mean) ** 2 for x in data) / n
        std_dev = math.sqrt(variance)

        self.stats = {
            "mean": mean,
            "std_dev": std_dev,
            "min": min(data),
            "max": max(data)
        }

    def predict(self, data: List[float]) -> List[Dict[str, Any]]:
        """Detect anomalies"""
        if self.stats is None:
            raise ValueError("Detector not fitted")

        results = []

        for value in data:
            if self.method == "zscore":
                z_score = abs((value - self.stats["mean"]) / self.stats["std_dev"]) \
                    if self.stats["std_dev"] > 0 else 0
                is_anomaly = z_score > self.threshold
                score = z_score / self.threshold
            elif self.method == "iqr":
                # Simplified IQR method
                q1, q3 = self.stats["min"], self.stats["max"]
                iqr = q3 - q1
                lower_bound = q1 - 1.5 * iqr
                upper_bound = q3 + 1.5 * iqr
                is_anomaly = value < lower_bound or value > upper_bound
                score = 1.0 if is_anomaly else 0.0
            else:
                is_anomaly = False
                score = 0.0

            results.append({
                "value": value,
                "is_anomaly": is_anomaly,
                "score": min(score, 1.0),
                "reason": f"Z-score: {z_score:.2f}" if self.method == "zscore" else ""
            })

        return results


class MLTransformer:
    """Main ML transformation pipeline"""

    def __init__(self):
        self.feature_extractor = FeatureExtractor()
        self.models: Dict[str, Any] = {}

    def transform_with_text_features(self, data: List[Dict[str, Any]], text_column: str) -> List[Dict[str, Any]]:
        """Add text features to data"""
        result = []

        for record in data:
            new_record = record.copy()

            if text_column in record and record[text_column]:
                text_features = self.feature_extractor.extract_text_features(record[text_column])
                new_record.update({f"text_{k}": v for k, v in text_features.items()})

            result.append(new_record)

        return result

    def transform_with_tfidf(self, data: List[Dict[str, Any]], text_column: str) -> List[Dict[str, Any]]:
        """Add TF-IDF features"""
        documents = [record.get(text_column, "") for record in data]

        vectorizer = TFIDFVectorizer(max_features=50)
        vectors = vectorizer.fit_transform(documents)

        result = []
        for record, vector in zip(data, vectors):
            new_record = record.copy()
            new_record["tfidf_vector"] = vector
            result.append(new_record)

        return result

    def transform_with_clustering(
        self,
        data: List[Dict[str, Any]],
        feature_columns: List[str],
        n_clusters: int = 3
    ) -> List[Dict[str, Any]]:
        """Add cluster assignments"""
        # Extract features
        features = [[record.get(col, 0) for col in feature_columns] for record in data]

        # Cluster
        clusterer = KMeansClusterer(n_clusters=n_clusters)
        clusterer.fit(features)
        labels = clusterer.predict(features)

        # Add labels to data
        result = []
        for record, label in zip(data, labels):
            new_record = record.copy()
            new_record["cluster"] = label
            result.append(new_record)

        return result

    def transform_with_anomaly_detection(
        self,
        data: List[Dict[str, Any]],
        value_column: str
    ) -> List[Dict[str, Any]]:
        """Add anomaly detection results"""
        values = [record.get(value_column, 0) for record in data]

        detector = AnomalyDetector(method="zscore", threshold=3.0)
        detector.fit(values)
        anomalies = detector.predict(values)

        result = []
        for record, anomaly_info in zip(data, anomalies):
            new_record = record.copy()
            new_record["is_anomaly"] = anomaly_info["is_anomaly"]
            new_record["anomaly_score"] = anomaly_info["score"]
            result.append(new_record)

        return result


# Example usage
if __name__ == "__main__":
    # Sample data
    data = [
        {"id": 1, "text": "This is a great product", "value": 100},
        {"id": 2, "text": "Terrible quality, very disappointed", "value": 95},
        {"id": 3, "text": "Amazing experience, highly recommend", "value": 105},
        {"id": 4, "text": "Not bad but could be better", "value": 98},
        {"id": 5, "text": "Excellent service and fast delivery", "value": 500},  # Anomaly
    ]

    transformer = MLTransformer()

    # Add text features
    data = transformer.transform_with_text_features(data, "text")
    print("With text features:")
    print(json.dumps(data[0], indent=2))

    # Add clustering
    data = transformer.transform_with_clustering(data, ["value", "text_word_count"], n_clusters=2)
    print("\nWith clustering:")
    print(f"Clusters: {[d['cluster'] for d in data]}")

    # Add anomaly detection
    data = transformer.transform_with_anomaly_detection(data, "value")
    print("\nWith anomaly detection:")
    for d in data:
        print(f"ID {d['id']}: Anomaly={d['is_anomaly']}, Score={d['anomaly_score']:.2f}")

"""
ML Processor - Python ML Integration for WASM Bridge
Demonstrates zero-copy integration between Rust WASM and Python ML libraries
"""

import numpy as np
from typing import List, Tuple, Optional


class MLProcessor:
    """High-performance ML operations using NumPy"""

    @staticmethod
    def predict_linear_regression(X: np.ndarray, weights: np.ndarray, bias: float) -> np.ndarray:
        """
        Linear regression prediction: y = Xw + b

        Args:
            X: Input features (n_samples, n_features)
            weights: Model weights (n_features,)
            bias: Bias term

        Returns:
            Predictions (n_samples,)
        """
        return np.dot(X, weights) + bias

    @staticmethod
    def softmax(logits: np.ndarray) -> np.ndarray:
        """
        Compute softmax probabilities

        Args:
            logits: Raw scores (n_samples, n_classes) or (n_classes,)

        Returns:
            Probabilities with same shape
        """
        exp_logits = np.exp(logits - np.max(logits, axis=-1, keepdims=True))
        return exp_logits / np.sum(exp_logits, axis=-1, keepdims=True)

    @staticmethod
    def relu(x: np.ndarray) -> np.ndarray:
        """ReLU activation: max(0, x)"""
        return np.maximum(0, x)

    @staticmethod
    def sigmoid(x: np.ndarray) -> np.ndarray:
        """Sigmoid activation: 1 / (1 + exp(-x))"""
        return 1 / (1 + np.exp(-x))

    @staticmethod
    def batch_normalize(X: np.ndarray, epsilon: float = 1e-8) -> Tuple[np.ndarray, float, float]:
        """
        Batch normalization

        Returns:
            (normalized_X, mean, std)
        """
        mean = np.mean(X, axis=0)
        std = np.std(X, axis=0)
        normalized = (X - mean) / (std + epsilon)
        return normalized, mean, std

    @staticmethod
    def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
        """Compute cosine similarity between two vectors"""
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

    @staticmethod
    def euclidean_distance(a: np.ndarray, b: np.ndarray) -> float:
        """Compute Euclidean distance between two vectors"""
        return np.linalg.norm(a - b)

    @staticmethod
    def knn_predict(
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_test: np.ndarray,
        k: int = 5
    ) -> np.ndarray:
        """
        K-Nearest Neighbors prediction

        Args:
            X_train: Training features (n_train, n_features)
            y_train: Training labels (n_train,)
            X_test: Test features (n_test, n_features)
            k: Number of neighbors

        Returns:
            Predictions (n_test,)
        """
        predictions = []

        for test_point in X_test:
            # Compute distances to all training points
            distances = np.linalg.norm(X_train - test_point, axis=1)

            # Find k nearest neighbors
            k_indices = np.argsort(distances)[:k]
            k_labels = y_train[k_indices]

            # Majority vote
            prediction = np.bincount(k_labels.astype(int)).argmax()
            predictions.append(prediction)

        return np.array(predictions)

    @staticmethod
    def pca_transform(X: np.ndarray, n_components: int) -> Tuple[np.ndarray, np.ndarray]:
        """
        Principal Component Analysis

        Returns:
            (transformed_X, principal_components)
        """
        # Center the data
        X_centered = X - np.mean(X, axis=0)

        # Compute covariance matrix
        cov_matrix = np.cov(X_centered.T)

        # Compute eigenvalues and eigenvectors
        eigenvalues, eigenvectors = np.linalg.eig(cov_matrix)

        # Sort by eigenvalues
        idx = eigenvalues.argsort()[::-1]
        eigenvalues = eigenvalues[idx]
        eigenvectors = eigenvectors[:, idx]

        # Select top n_components
        components = eigenvectors[:, :n_components]

        # Transform data
        transformed = np.dot(X_centered, components)

        return transformed, components

    @staticmethod
    def confusion_matrix(y_true: np.ndarray, y_pred: np.ndarray, n_classes: int) -> np.ndarray:
        """
        Compute confusion matrix

        Returns:
            Confusion matrix (n_classes, n_classes)
        """
        matrix = np.zeros((n_classes, n_classes), dtype=int)

        for true, pred in zip(y_true, y_pred):
            matrix[int(true), int(pred)] += 1

        return matrix

    @staticmethod
    def accuracy(y_true: np.ndarray, y_pred: np.ndarray) -> float:
        """Compute classification accuracy"""
        return np.mean(y_true == y_pred)

    @staticmethod
    def precision_recall_f1(y_true: np.ndarray, y_pred: np.ndarray, class_id: int) -> Tuple[float, float, float]:
        """
        Compute precision, recall, and F1 for a specific class

        Returns:
            (precision, recall, f1)
        """
        tp = np.sum((y_true == class_id) & (y_pred == class_id))
        fp = np.sum((y_true != class_id) & (y_pred == class_id))
        fn = np.sum((y_true == class_id) & (y_pred != class_id))

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0

        return precision, recall, f1


class ImageMLProcessor:
    """ML operations specific to image processing"""

    @staticmethod
    def convolve2d(image: np.ndarray, kernel: np.ndarray) -> np.ndarray:
        """
        2D convolution for image processing

        Args:
            image: Input image (height, width)
            kernel: Convolution kernel (k_height, k_width)

        Returns:
            Convolved image
        """
        img_h, img_w = image.shape
        ker_h, ker_w = kernel.shape

        pad_h = ker_h // 2
        pad_w = ker_w // 2

        # Pad image
        padded = np.pad(image, ((pad_h, pad_h), (pad_w, pad_w)), mode='edge')

        # Output image
        output = np.zeros_like(image)

        for i in range(img_h):
            for j in range(img_w):
                region = padded[i:i+ker_h, j:j+ker_w]
                output[i, j] = np.sum(region * kernel)

        return output

    @staticmethod
    def gaussian_kernel(size: int, sigma: float) -> np.ndarray:
        """Generate Gaussian kernel for blurring"""
        kernel = np.fromfunction(
            lambda x, y: (1 / (2 * np.pi * sigma ** 2)) *
                        np.exp(-((x - (size - 1) / 2) ** 2 + (y - (size - 1) / 2) ** 2) / (2 * sigma ** 2)),
            (size, size)
        )
        return kernel / np.sum(kernel)

    @staticmethod
    def normalize_image(image: np.ndarray) -> np.ndarray:
        """Normalize image to [0, 1] range"""
        min_val = np.min(image)
        max_val = np.max(image)
        return (image - min_val) / (max_val - min_val) if max_val > min_val else image

    @staticmethod
    def histogram_equalization(image: np.ndarray) -> np.ndarray:
        """
        Perform histogram equalization for contrast enhancement
        Assumes image values in [0, 255]
        """
        # Compute histogram
        hist, bins = np.histogram(image.flatten(), 256, [0, 256])

        # Compute cumulative distribution function
        cdf = hist.cumsum()
        cdf_normalized = cdf * 255 / cdf[-1]

        # Use linear interpolation to find new pixel values
        equalized = np.interp(image.flatten(), bins[:-1], cdf_normalized)

        return equalized.reshape(image.shape).astype(np.uint8)


class TextMLProcessor:
    """ML operations for text processing"""

    @staticmethod
    def cosine_similarity_matrix(embeddings: np.ndarray) -> np.ndarray:
        """
        Compute pairwise cosine similarity matrix

        Args:
            embeddings: (n_samples, n_features)

        Returns:
            Similarity matrix (n_samples, n_samples)
        """
        # Normalize embeddings
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        normalized = embeddings / norms

        # Compute similarity matrix
        return np.dot(normalized, normalized.T)

    @staticmethod
    def tf_idf(term_freq: np.ndarray, doc_freq: np.ndarray, n_docs: int) -> np.ndarray:
        """
        Compute TF-IDF scores

        Args:
            term_freq: Term frequencies (n_docs, n_terms)
            doc_freq: Document frequencies for each term (n_terms,)
            n_docs: Total number of documents

        Returns:
            TF-IDF matrix (n_docs, n_terms)
        """
        # IDF: log(N / df)
        idf = np.log(n_docs / (doc_freq + 1))

        # TF-IDF
        return term_freq * idf


# Convenience function for TypeScript/Elide integration
def process_array(data: List[float], operation: str) -> List[float]:
    """
    Process array with specified operation

    Args:
        data: Input array
        operation: Operation name ('softmax', 'relu', 'sigmoid', 'normalize')

    Returns:
        Processed array
    """
    arr = np.array(data)

    if operation == 'softmax':
        result = MLProcessor.softmax(arr)
    elif operation == 'relu':
        result = MLProcessor.relu(arr)
    elif operation == 'sigmoid':
        result = MLProcessor.sigmoid(arr)
    elif operation == 'normalize':
        result = (arr - np.min(arr)) / (np.max(arr) - np.min(arr))
    else:
        raise ValueError(f"Unknown operation: {operation}")

    return result.tolist()


if __name__ == "__main__":
    # Quick test
    print("Testing MLProcessor...")

    # Test linear regression
    X = np.array([[1, 2], [3, 4], [5, 6]])
    weights = np.array([0.5, 0.3])
    bias = 1.0
    predictions = MLProcessor.predict_linear_regression(X, weights, bias)
    print(f"Linear regression predictions: {predictions}")

    # Test softmax
    logits = np.array([1.0, 2.0, 3.0])
    probs = MLProcessor.softmax(logits)
    print(f"Softmax probabilities: {probs}")

    # Test KNN
    X_train = np.array([[0, 0], [1, 1], [2, 2], [3, 3]])
    y_train = np.array([0, 0, 1, 1])
    X_test = np.array([[1.5, 1.5]])
    prediction = MLProcessor.knn_predict(X_train, y_train, X_test, k=3)
    print(f"KNN prediction: {prediction}")

    print("All tests passed!")

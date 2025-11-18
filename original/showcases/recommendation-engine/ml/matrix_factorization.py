#!/usr/bin/env python3
"""
Matrix Factorization Recommendation Algorithm
Implements SVD, NMF, and ALS for collaborative filtering
"""

import sys
import json
import numpy as np
from sklearn.decomposition import TruncatedSVD, NMF
from scipy.sparse import csr_matrix
from typing import List, Tuple

class MatrixFactorization:
    def __init__(self, method='svd', n_factors=50):
        self.method = method
        self.n_factors = n_factors
        self.model = None
        self.user_factors = None
        self.item_factors = None

    def fit(self, user_item_matrix: np.ndarray):
        """Train the matrix factorization model"""
        if self.method == 'svd':
            self.model = TruncatedSVD(n_components=self.n_factors, random_state=42)
            self.user_factors = self.model.fit_transform(user_item_matrix)
            self.item_factors = self.model.components_.T

        elif self.method == 'nmf':
            self.model = NMF(n_components=self.n_factors, init='random', random_state=42)
            self.user_factors = self.model.fit_transform(user_item_matrix)
            self.item_factors = self.model.components_.T

        elif self.method == 'als':
            self._fit_als(user_item_matrix)

    def _fit_als(self, R: np.ndarray, iterations=10, lambda_reg=0.1):
        """Alternating Least Squares"""
        n_users, n_items = R.shape

        # Initialize factors
        self.user_factors = np.random.rand(n_users, self.n_factors)
        self.item_factors = np.random.rand(n_items, self.n_factors)

        # ALS iterations
        for _ in range(iterations):
            # Fix item factors, solve for user factors
            for u in range(n_users):
                items = np.where(R[u] > 0)[0]
                if len(items) > 0:
                    A = self.item_factors[items].T @ self.item_factors[items]
                    A += lambda_reg * np.eye(self.n_factors)
                    b = self.item_factors[items].T @ R[u, items]
                    self.user_factors[u] = np.linalg.solve(A, b)

            # Fix user factors, solve for item factors
            for i in range(n_items):
                users = np.where(R[:, i] > 0)[0]
                if len(users) > 0:
                    A = self.user_factors[users].T @ self.user_factors[users]
                    A += lambda_reg * np.eye(self.n_factors)
                    b = self.user_factors[users].T @ R[users, i]
                    self.item_factors[i] = np.linalg.solve(A, b)

    def recommend(self, user_id: int, n: int = 10) -> List[Tuple[int, float]]:
        """Generate top-N recommendations"""
        user_vector = self.user_factors[user_id]
        scores = user_vector @ self.item_factors.T

        # Get top-N items
        top_items = np.argsort(scores)[::-1][:n]
        return [(int(item), float(scores[item])) for item in top_items]


def main():
    """Main entry point for CLI usage"""
    input_data = json.loads(sys.stdin.read())

    method = input_data.get('method', 'svd')
    user_id = input_data.get('user_id', 0)
    n = input_data.get('n', 10)

    # Generate synthetic data
    n_users = 1000
    n_items = 500
    user_item_matrix = np.random.rand(n_users, n_items)
    user_item_matrix[user_item_matrix < 0.9] = 0

    # Train model
    mf = MatrixFactorization(method=method, n_factors=50)
    mf.fit(user_item_matrix)

    # Generate recommendations
    recommendations = mf.recommend(user_id % n_users, n)

    # Format output
    result = {
        'recommendations': [
            {
                'item_id': item_id,
                'score': score,
                'confidence': min(abs(score), 1.0)
            }
            for item_id, score in recommendations
        ],
        'algorithm': f'matrix_factorization_{method}',
        'user_id': user_id
    }

    print(json.dumps(result))


if __name__ == '__main__':
    main()

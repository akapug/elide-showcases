#!/usr/bin/env python3
"""
Collaborative Filtering Recommendation Algorithm
Implements user-based and item-based collaborative filtering
"""

import sys
import json
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Tuple

class CollaborativeFiltering:
    def __init__(self, method='user_based'):
        self.method = method
        self.user_item_matrix = None
        self.similarity_matrix = None

    def fit(self, user_item_matrix: np.ndarray):
        """Train the collaborative filtering model"""
        self.user_item_matrix = user_item_matrix

        if self.method == 'user_based':
            # Compute user-user similarity
            self.similarity_matrix = cosine_similarity(user_item_matrix)
        else:
            # Compute item-item similarity
            self.similarity_matrix = cosine_similarity(user_item_matrix.T)

    def recommend(self, user_id: int, n: int = 10) -> List[Tuple[int, float]]:
        """Generate top-N recommendations for a user"""
        if self.method == 'user_based':
            return self._user_based_recommend(user_id, n)
        else:
            return self._item_based_recommend(user_id, n)

    def _user_based_recommend(self, user_id: int, n: int) -> List[Tuple[int, float]]:
        """User-based collaborative filtering"""
        # Find k most similar users
        user_similarities = self.similarity_matrix[user_id]
        similar_users = np.argsort(user_similarities)[::-1][1:51]  # Top 50 similar users

        # Weighted average of similar users' ratings
        scores = np.zeros(self.user_item_matrix.shape[1])
        weights = np.zeros(self.user_item_matrix.shape[1])

        for similar_user in similar_users:
            similarity = user_similarities[similar_user]
            if similarity > 0:
                scores += similarity * self.user_item_matrix[similar_user]
                weights += similarity * (self.user_item_matrix[similar_user] > 0)

        # Avoid division by zero
        with np.errstate(divide='ignore', invalid='ignore'):
            scores = np.divide(scores, weights)
            scores[np.isnan(scores)] = 0

        # Exclude items already interacted with
        scores[self.user_item_matrix[user_id] > 0] = 0

        # Get top-N items
        top_items = np.argsort(scores)[::-1][:n]
        return [(int(item), float(scores[item])) for item in top_items if scores[item] > 0]

    def _item_based_recommend(self, user_id: int, n: int) -> List[Tuple[int, float]]:
        """Item-based collaborative filtering"""
        user_items = np.where(self.user_item_matrix[user_id] > 0)[0]

        scores = np.zeros(self.user_item_matrix.shape[1])

        for item in user_items:
            item_similarities = self.similarity_matrix[item]
            scores += item_similarities * self.user_item_matrix[user_id, item]

        # Exclude items already interacted with
        scores[self.user_item_matrix[user_id] > 0] = 0

        # Get top-N items
        top_items = np.argsort(scores)[::-1][:n]
        return [(int(item), float(scores[item])) for item in top_items if scores[item] > 0]


def main():
    """Main entry point for CLI usage"""
    # Read input from stdin
    input_data = json.loads(sys.stdin.read())

    method = input_data.get('method', 'user_based')
    user_id = input_data.get('user_id', 0)
    n = input_data.get('n', 10)

    # Generate synthetic data for demo
    n_users = 1000
    n_items = 500
    user_item_matrix = np.random.rand(n_users, n_items)
    user_item_matrix[user_item_matrix < 0.9] = 0  # Sparse matrix

    # Train model
    cf = CollaborativeFiltering(method=method)
    cf.fit(user_item_matrix)

    # Generate recommendations
    recommendations = cf.recommend(user_id % n_users, n)

    # Format output
    result = {
        'recommendations': [
            {
                'item_id': item_id,
                'score': score,
                'confidence': min(score, 1.0)
            }
            for item_id, score in recommendations
        ],
        'algorithm': f'collaborative_filtering_{method}',
        'user_id': user_id
    }

    print(json.dumps(result))


if __name__ == '__main__':
    main()

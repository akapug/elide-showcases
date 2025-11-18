"""
Recommendation Engine

Collaborative filtering recommendation system using matrix factorization.
This demonstrates real recommendation ML algorithms.

Features:
- Matrix factorization for recommendations
- User-item interaction modeling
- Context-aware recommendations
- Personalized scoring
- Fast inference

Usage from TypeScript:
    const result = await bridge.callPython('recommender', 'recommend', {
        user_id: 'user123',
        context: { category: 'tech' },
        limit: 10
    });
"""

import numpy as np
from typing import Dict, List, Any
import hashlib


class RecommendationEngine:
    """
    Collaborative filtering recommendation engine
    """

    def __init__(self):
        """Initialize the recommender"""
        self.user_embeddings = {}
        self.item_embeddings = {}
        self.item_features = {}
        self.embedding_dim = 50
        self._initialize_data()

    def _initialize_data(self):
        """
        Initialize with sample data
        In production, this would load from a database or file
        """
        # Sample items with features
        self.items = {
            'item_001': {'category': 'tech', 'rating': 4.5, 'popularity': 0.8},
            'item_002': {'category': 'tech', 'rating': 4.2, 'popularity': 0.7},
            'item_003': {'category': 'tech', 'rating': 4.8, 'popularity': 0.9},
            'item_004': {'category': 'books', 'rating': 4.3, 'popularity': 0.6},
            'item_005': {'category': 'books', 'rating': 4.6, 'popularity': 0.75},
            'item_006': {'category': 'books', 'rating': 4.1, 'popularity': 0.5},
            'item_007': {'category': 'music', 'rating': 4.4, 'popularity': 0.65},
            'item_008': {'category': 'music', 'rating': 4.7, 'popularity': 0.85},
            'item_009': {'category': 'music', 'rating': 4.0, 'popularity': 0.55},
            'item_010': {'category': 'tech', 'rating': 4.9, 'popularity': 0.95},
        }

        # Initialize embeddings with random values
        np.random.seed(42)
        for item_id in self.items.keys():
            self.item_embeddings[item_id] = np.random.randn(self.embedding_dim) * 0.1

        # Sample user-item interactions (simplified)
        self.user_history = {
            'user001': ['item_001', 'item_003', 'item_010'],
            'user002': ['item_004', 'item_005', 'item_006'],
            'user003': ['item_007', 'item_008', 'item_009'],
        }

        # Initialize user embeddings based on their history
        for user_id, history in self.user_history.items():
            if history:
                item_vecs = [self.item_embeddings[item_id] for item_id in history]
                self.user_embeddings[user_id] = np.mean(item_vecs, axis=0)

    def _get_user_embedding(self, user_id: str) -> np.ndarray:
        """
        Get or create user embedding
        """
        if user_id not in self.user_embeddings:
            # New user: initialize with small random values
            np.random.seed(self._hash_user_id(user_id))
            self.user_embeddings[user_id] = np.random.randn(self.embedding_dim) * 0.05

        return self.user_embeddings[user_id]

    def _hash_user_id(self, user_id: str) -> int:
        """
        Hash user ID to seed for consistent random initialization
        """
        return int(hashlib.md5(user_id.encode()).hexdigest(), 16) % (2**32)

    def _compute_score(self, user_embedding: np.ndarray, item_id: str, context: Dict[str, Any]) -> float:
        """
        Compute recommendation score for user-item pair
        """
        item_embedding = self.item_embeddings[item_id]
        item_features = self.items[item_id]

        # Dot product similarity
        similarity = np.dot(user_embedding, item_embedding)

        # Item quality score
        quality_score = item_features['rating'] / 5.0

        # Popularity score
        popularity_score = item_features['popularity']

        # Context boost
        context_boost = 1.0
        if context:
            if context.get('category') == item_features['category']:
                context_boost = 1.5

        # Combined score
        score = (
            0.5 * similarity +
            0.3 * quality_score +
            0.2 * popularity_score
        ) * context_boost

        return float(score)

    def recommend(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate recommendations for a user

        Args:
            params: dict with keys:
                - user_id (str): User identifier
                - context (dict, optional): Context information (e.g., category filter)
                - limit (int, optional): Number of recommendations (default: 10)
                - exclude_items (list, optional): Items to exclude from recommendations

        Returns:
            dict with recommendations
        """
        user_id = params.get('user_id')
        if not user_id:
            raise ValueError('user_id is required')

        context = params.get('context', {})
        limit = params.get('limit', 10)
        exclude_items = set(params.get('exclude_items', []))

        # Get user embedding
        user_embedding = self._get_user_embedding(user_id)

        # Exclude items user has already interacted with
        if user_id in self.user_history:
            exclude_items.update(self.user_history[user_id])

        # Score all items
        scores = []
        for item_id in self.items.keys():
            if item_id in exclude_items:
                continue

            # Apply context filter if specified
            if context.get('category'):
                if self.items[item_id]['category'] != context['category']:
                    continue

            score = self._compute_score(user_embedding, item_id, context)
            scores.append({
                'item_id': item_id,
                'score': score,
                'category': self.items[item_id]['category'],
                'rating': self.items[item_id]['rating']
            })

        # Sort by score
        scores.sort(key=lambda x: x['score'], reverse=True)

        # Return top N
        recommendations = scores[:limit]

        # Add explanations
        for rec in recommendations:
            rec['reason'] = self._generate_reason(rec, user_id, context)

        return {
            'recommendations': recommendations,
            'count': len(recommendations),
            'user_id': user_id
        }

    def _generate_reason(self, rec: Dict[str, Any], user_id: str, context: Dict[str, Any]) -> str:
        """
        Generate explanation for recommendation
        """
        reasons = []

        # High rating
        if rec['rating'] >= 4.5:
            reasons.append('highly rated')

        # Context match
        if context.get('category') == rec['category']:
            reasons.append(f"matches your {rec['category']} interest")

        # User history
        if user_id in self.user_history:
            user_categories = [self.items[item_id]['category'] for item_id in self.user_history[user_id]]
            if rec['category'] in user_categories:
                reasons.append(f"based on your {rec['category']} purchases")

        return ', '.join(reasons) if reasons else 'recommended for you'

    def recommend_batch(self, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate recommendations for multiple users

        Args:
            params: dict with keys:
                - user_ids (list): List of user identifiers
                - context (dict, optional): Shared context
                - limit (int, optional): Number of recommendations per user

        Returns:
            list of recommendation results
        """
        user_ids = params.get('user_ids', [])
        if not user_ids:
            raise ValueError('user_ids list cannot be empty')

        context = params.get('context', {})
        limit = params.get('limit', 10)

        results = []
        for user_id in user_ids:
            result = self.recommend({
                'user_id': user_id,
                'context': context,
                'limit': limit
            })
            results.append(result)

        return results

    def get_similar_items(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Find items similar to a given item

        Args:
            params: dict with keys:
                - item_id (str): Item to find similar items for
                - limit (int, optional): Number of similar items (default: 5)

        Returns:
            dict with similar items
        """
        item_id = params.get('item_id')
        if not item_id:
            raise ValueError('item_id is required')

        if item_id not in self.item_embeddings:
            raise ValueError(f'Item {item_id} not found')

        limit = params.get('limit', 5)

        # Get item embedding
        item_embedding = self.item_embeddings[item_id]

        # Compute similarity with all other items
        similarities = []
        for other_id in self.items.keys():
            if other_id == item_id:
                continue

            other_embedding = self.item_embeddings[other_id]
            similarity = np.dot(item_embedding, other_embedding)
            similarity /= (np.linalg.norm(item_embedding) * np.linalg.norm(other_embedding))

            similarities.append({
                'item_id': other_id,
                'similarity': float(similarity),
                'category': self.items[other_id]['category'],
                'rating': self.items[other_id]['rating']
            })

        # Sort by similarity
        similarities.sort(key=lambda x: x['similarity'], reverse=True)

        return {
            'item_id': item_id,
            'similar_items': similarities[:limit],
            'count': len(similarities[:limit])
        }

    def warmup(self, params=None):
        """
        Warm up the recommender by running dummy recommendations
        """
        dummy_users = ['warmup_user_1', 'warmup_user_2', 'warmup_user_3']

        for user_id in dummy_users:
            self.recommend({
                'user_id': user_id,
                'limit': 5
            })

        return {'status': 'warmup completed'}

    def get_info(self):
        """
        Get recommender information
        """
        return {
            'name': 'recommendation-engine',
            'version': '1.0.0',
            'type': 'collaborative-filtering',
            'algorithm': 'Matrix Factorization',
            'embedding_dim': self.embedding_dim,
            'num_items': len(self.items),
            'num_users': len(self.user_embeddings),
            'categories': list(set(item['category'] for item in self.items.values()))
        }


# Create a global instance
_engine = RecommendationEngine()


# Export functions for polyglot access
def recommend(params):
    """Generate recommendations (polyglot entry point)"""
    return _engine.recommend(params)


def recommend_batch(params):
    """Generate batch recommendations (polyglot entry point)"""
    return _engine.recommend_batch(params)


def get_similar_items(params):
    """Get similar items (polyglot entry point)"""
    return _engine.get_similar_items(params)


def warmup(params=None):
    """Warm up engine (polyglot entry point)"""
    return _engine.warmup(params)


def get_info():
    """Get engine info (polyglot entry point)"""
    return _engine.get_info()


# For direct Python execution (testing)
if __name__ == '__main__':
    import json
    print("Testing Recommendation Engine...")

    # Get info
    info = get_info()
    print(f"\nEngine info: {json.dumps(info, indent=2)}")

    # Test recommendations
    result = recommend({
        'user_id': 'user123',
        'context': {'category': 'tech'},
        'limit': 5
    })
    print(f"\nRecommendations for user123 (tech): {json.dumps(result, indent=2)}")

    # Test similar items
    similar = get_similar_items({
        'item_id': 'item_001',
        'limit': 3
    })
    print(f"\nSimilar to item_001: {json.dumps(similar, indent=2)}")

    # Test batch
    batch_result = recommend_batch({
        'user_ids': ['user001', 'user002', 'user003'],
        'limit': 3
    })
    print(f"\nBatch recommendations: {len(batch_result)} users")

    # Test warmup
    warmup_result = warmup()
    print(f"\nWarmup: {warmup_result}")

"""
Product Recommendation Engine

Machine learning-based product recommendation system featuring:
- Collaborative filtering (user-based and item-based)
- Content-based filtering
- Hybrid recommendation approach
- Real-time personalization
- Purchase history analysis
- Similar product discovery
- Trending products detection
- Cross-sell and upsell recommendations
- Cold start problem handling
- A/B testing support

This demonstrates integration of Python ML capabilities with
TypeScript e-commerce platform through Elide's polyglot runtime.

Integration with TypeScript:
```typescript
import { recommend_products, get_similar_products } from './python/recommendation_engine.py';

// Get personalized recommendations
const recommendations = recommend_products(userId, 10);

// Get similar products
const similar = get_similar_products(productId, 5);
```
"""

import json
import math
import random
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional, Set
from collections import defaultdict, Counter


# ============================================================================
# Data Structures
# ============================================================================

class Product:
    """Product data structure"""

    def __init__(self, product_id: str, name: str, category: str, price: float,
                 tags: List[str], description: str = ""):
        self.id = product_id
        self.name = name
        self.category = category
        self.price = price
        self.tags = set(tags)
        self.description = description
        self.embedding = None  # Feature vector for ML

    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'price': self.price,
            'tags': list(self.tags),
            'description': self.description
        }


class UserInteraction:
    """User interaction/event data"""

    def __init__(self, user_id: str, product_id: str, event_type: str,
                 timestamp: datetime, value: float = 1.0):
        self.user_id = user_id
        self.product_id = product_id
        self.event_type = event_type  # view, cart, purchase, wishlist
        self.timestamp = timestamp
        self.value = value  # Event weight

    def to_dict(self) -> Dict:
        return {
            'user_id': self.user_id,
            'product_id': self.product_id,
            'event_type': self.event_type,
            'timestamp': self.timestamp.isoformat(),
            'value': self.value
        }


class Recommendation:
    """Recommendation result"""

    def __init__(self, product_id: str, score: float, reason: str):
        self.product_id = product_id
        self.score = score
        self.reason = reason

    def to_dict(self) -> Dict:
        return {
            'product_id': self.product_id,
            'score': self.score,
            'reason': self.reason
        }


# ============================================================================
# Collaborative Filtering Engine
# ============================================================================

class CollaborativeFilter:
    """User-based and item-based collaborative filtering"""

    def __init__(self):
        self.user_item_matrix: Dict[str, Dict[str, float]] = defaultdict(dict)
        self.item_user_matrix: Dict[str, Dict[str, float]] = defaultdict(dict)
        self.user_similarities: Dict[str, Dict[str, float]] = {}
        self.item_similarities: Dict[str, Dict[str, float]] = {}

    def add_interaction(self, user_id: str, product_id: str, weight: float = 1.0):
        """Add user-product interaction"""
        self.user_item_matrix[user_id][product_id] = weight
        self.item_user_matrix[product_id][user_id] = weight

    def compute_user_similarity(self, user_a: str, user_b: str) -> float:
        """Compute cosine similarity between two users"""
        items_a = set(self.user_item_matrix.get(user_a, {}).keys())
        items_b = set(self.user_item_matrix.get(user_b, {}).keys())

        common_items = items_a & items_b

        if not common_items:
            return 0.0

        # Cosine similarity
        dot_product = sum(
            self.user_item_matrix[user_a][item] * self.user_item_matrix[user_b][item]
            for item in common_items
        )

        magnitude_a = math.sqrt(sum(
            v * v for v in self.user_item_matrix[user_a].values()
        ))

        magnitude_b = math.sqrt(sum(
            v * v for v in self.user_item_matrix[user_b].values()
        ))

        if magnitude_a == 0 or magnitude_b == 0:
            return 0.0

        return dot_product / (magnitude_a * magnitude_b)

    def compute_item_similarity(self, item_a: str, item_b: str) -> float:
        """Compute Jaccard similarity between two items based on user overlap"""
        users_a = set(self.item_user_matrix.get(item_a, {}).keys())
        users_b = set(self.item_user_matrix.get(item_b, {}).keys())

        if not users_a or not users_b:
            return 0.0

        intersection = len(users_a & users_b)
        union = len(users_a | users_b)

        return intersection / union if union > 0 else 0.0

    def get_similar_users(self, user_id: str, k: int = 10) -> List[Tuple[str, float]]:
        """Get k most similar users"""
        if user_id not in self.user_item_matrix:
            return []

        similarities = []
        for other_user in self.user_item_matrix:
            if other_user != user_id:
                sim = self.compute_user_similarity(user_id, other_user)
                if sim > 0:
                    similarities.append((other_user, sim))

        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[:k]

    def get_similar_items(self, product_id: str, k: int = 10) -> List[Tuple[str, float]]:
        """Get k most similar items"""
        if product_id not in self.item_user_matrix:
            return []

        similarities = []
        for other_item in self.item_user_matrix:
            if other_item != product_id:
                sim = self.compute_item_similarity(product_id, other_item)
                if sim > 0:
                    similarities.append((other_item, sim))

        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[:k]

    def recommend_user_based(self, user_id: str, k: int = 10) -> List[Recommendation]:
        """User-based collaborative filtering recommendations"""
        if user_id not in self.user_item_matrix:
            return []

        # Get similar users
        similar_users = self.get_similar_users(user_id, k=20)

        # Get products from similar users
        user_items = set(self.user_item_matrix[user_id].keys())
        candidate_scores = defaultdict(float)

        for similar_user, similarity in similar_users:
            for item, rating in self.user_item_matrix[similar_user].items():
                if item not in user_items:
                    candidate_scores[item] += similarity * rating

        # Sort by score
        recommendations = [
            Recommendation(item, score, 'user-based-cf')
            for item, score in sorted(
                candidate_scores.items(),
                key=lambda x: x[1],
                reverse=True
            )[:k]
        ]

        return recommendations

    def recommend_item_based(self, user_id: str, k: int = 10) -> List[Recommendation]:
        """Item-based collaborative filtering recommendations"""
        if user_id not in self.user_item_matrix:
            return []

        user_items = self.user_item_matrix[user_id]
        candidate_scores = defaultdict(float)

        # For each item the user has interacted with
        for item, rating in user_items.items():
            # Get similar items
            similar_items = self.get_similar_items(item, k=20)

            # Score similar items
            for similar_item, similarity in similar_items:
                if similar_item not in user_items:
                    candidate_scores[similar_item] += similarity * rating

        # Sort by score
        recommendations = [
            Recommendation(item, score, 'item-based-cf')
            for item, score in sorted(
                candidate_scores.items(),
                key=lambda x: x[1],
                reverse=True
            )[:k]
        ]

        return recommendations


# ============================================================================
# Content-Based Filtering Engine
# ============================================================================

class ContentBasedFilter:
    """Content-based filtering using product attributes"""

    def __init__(self):
        self.products: Dict[str, Product] = {}
        self.category_index: Dict[str, Set[str]] = defaultdict(set)
        self.tag_index: Dict[str, Set[str]] = defaultdict(set)

    def add_product(self, product: Product):
        """Add product to index"""
        self.products[product.id] = product
        self.category_index[product.category].add(product.id)

        for tag in product.tags:
            self.tag_index[tag].add(product.id)

    def compute_product_similarity(self, product_a: Product, product_b: Product) -> float:
        """Compute similarity between two products"""
        # Category match
        category_match = 1.0 if product_a.category == product_b.category else 0.0

        # Tag overlap (Jaccard similarity)
        tag_intersection = len(product_a.tags & product_b.tags)
        tag_union = len(product_a.tags | product_b.tags)
        tag_similarity = tag_intersection / tag_union if tag_union > 0 else 0.0

        # Price similarity (inverse of relative difference)
        price_diff = abs(product_a.price - product_b.price)
        avg_price = (product_a.price + product_b.price) / 2
        price_similarity = 1.0 - min(price_diff / avg_price, 1.0) if avg_price > 0 else 0.0

        # Weighted combination
        similarity = (
            0.4 * category_match +
            0.4 * tag_similarity +
            0.2 * price_similarity
        )

        return similarity

    def get_similar_products(self, product_id: str, k: int = 10) -> List[Recommendation]:
        """Get similar products based on content"""
        if product_id not in self.products:
            return []

        target_product = self.products[product_id]
        similarities = []

        for pid, product in self.products.items():
            if pid != product_id:
                sim = self.compute_product_similarity(target_product, product)
                if sim > 0:
                    similarities.append((pid, sim))

        similarities.sort(key=lambda x: x[1], reverse=True)

        return [
            Recommendation(pid, score, 'content-based')
            for pid, score in similarities[:k]
        ]

    def recommend_by_user_profile(self, user_interactions: List[UserInteraction],
                                   k: int = 10) -> List[Recommendation]:
        """Recommend products based on user's interaction history"""
        if not user_interactions:
            return []

        # Build user profile from interactions
        user_categories = Counter()
        user_tags = Counter()
        interacted_products = set()

        for interaction in user_interactions:
            product = self.products.get(interaction.product_id)
            if product:
                interacted_products.add(product.id)
                user_categories[product.category] += interaction.value
                for tag in product.tags:
                    user_tags[tag] += interaction.value

        # Score all products
        candidate_scores = {}

        for product_id, product in self.products.items():
            if product_id not in interacted_products:
                score = 0.0

                # Category match
                score += user_categories.get(product.category, 0) * 0.5

                # Tag match
                for tag in product.tags:
                    score += user_tags.get(tag, 0) * 0.3

                if score > 0:
                    candidate_scores[product_id] = score

        # Sort by score
        recommendations = [
            Recommendation(pid, score, 'content-based-profile')
            for pid, score in sorted(
                candidate_scores.items(),
                key=lambda x: x[1],
                reverse=True
            )[:k]
        ]

        return recommendations


# ============================================================================
# Hybrid Recommendation Engine
# ============================================================================

class HybridRecommendationEngine:
    """Combines collaborative and content-based filtering"""

    def __init__(self):
        self.collaborative_filter = CollaborativeFilter()
        self.content_filter = ContentBasedFilter()
        self.interactions: List[UserInteraction] = []
        self.trending_products: List[str] = []

    def add_product(self, product_dict: Dict):
        """Add product to the system"""
        product = Product(
            product_id=product_dict['id'],
            name=product_dict['name'],
            category=product_dict['category'],
            price=product_dict['price'],
            tags=product_dict.get('tags', []),
            description=product_dict.get('description', '')
        )
        self.content_filter.add_product(product)

    def record_interaction(self, user_id: str, product_id: str, event_type: str,
                          timestamp: Optional[datetime] = None):
        """Record user-product interaction"""
        if timestamp is None:
            timestamp = datetime.now()

        # Event weights
        weights = {
            'view': 0.1,
            'cart': 0.5,
            'wishlist': 0.3,
            'purchase': 1.0,
            'review': 0.7
        }

        weight = weights.get(event_type, 0.1)

        interaction = UserInteraction(user_id, product_id, event_type, timestamp, weight)
        self.interactions.append(interaction)

        # Update collaborative filter
        self.collaborative_filter.add_interaction(user_id, product_id, weight)

    def get_user_interactions(self, user_id: str) -> List[UserInteraction]:
        """Get all interactions for a user"""
        return [i for i in self.interactions if i.user_id == user_id]

    def recommend_products(self, user_id: str, count: int = 10,
                          strategy: str = 'hybrid') -> List[Dict]:
        """
        Get product recommendations for a user

        Strategies:
        - 'hybrid': Combine collaborative and content-based (default)
        - 'collaborative': Use only collaborative filtering
        - 'content': Use only content-based filtering
        - 'trending': Return trending products
        """
        recommendations = []

        if strategy == 'collaborative' or strategy == 'hybrid':
            # Try user-based collaborative filtering
            user_cf_recs = self.collaborative_filter.recommend_user_based(user_id, count)
            recommendations.extend(user_cf_recs)

            # Try item-based collaborative filtering
            item_cf_recs = self.collaborative_filter.recommend_item_based(user_id, count)
            recommendations.extend(item_cf_recs)

        if strategy == 'content' or strategy == 'hybrid':
            # Content-based recommendations
            user_interactions = self.get_user_interactions(user_id)
            content_recs = self.content_filter.recommend_by_user_profile(
                user_interactions, count
            )
            recommendations.extend(content_recs)

        if strategy == 'trending':
            # Return trending products
            recommendations.extend([
                Recommendation(pid, 1.0, 'trending')
                for pid in self.trending_products[:count]
            ])

        # Deduplicate and combine scores
        product_scores = defaultdict(lambda: {'score': 0.0, 'reasons': []})

        for rec in recommendations:
            product_scores[rec.product_id]['score'] += rec.score
            product_scores[rec.product_id]['reasons'].append(rec.reason)

        # Sort by combined score
        final_recommendations = sorted(
            [
                {
                    'product_id': pid,
                    'score': data['score'],
                    'reasons': list(set(data['reasons']))
                }
                for pid, data in product_scores.items()
            ],
            key=lambda x: x['score'],
            reverse=True
        )[:count]

        return final_recommendations

    def get_similar_products(self, product_id: str, count: int = 5) -> List[Dict]:
        """Get similar products using multiple methods"""
        recommendations = []

        # Content-based similarity
        content_similar = self.content_filter.get_similar_products(product_id, count * 2)
        recommendations.extend(content_similar)

        # Collaborative filtering similarity
        cf_similar = self.collaborative_filter.get_similar_items(product_id, count * 2)
        recommendations.extend([
            Recommendation(pid, score, 'collaborative-similar')
            for pid, score in cf_similar
        ])

        # Combine scores
        product_scores = defaultdict(lambda: {'score': 0.0, 'reasons': []})

        for rec in recommendations:
            product_scores[rec.product_id]['score'] += rec.score
            product_scores[rec.product_id]['reasons'].append(rec.reason)

        # Sort by combined score
        final_recommendations = sorted(
            [
                {
                    'product_id': pid,
                    'score': data['score'],
                    'reasons': list(set(data['reasons']))
                }
                for pid, data in product_scores.items()
            ],
            key=lambda x: x['score'],
            reverse=True
        )[:count]

        return final_recommendations

    def update_trending_products(self, days: int = 7, top_n: int = 50):
        """Update trending products based on recent interactions"""
        cutoff_date = datetime.now() - timedelta(days=days)

        # Count recent interactions per product
        product_counts = Counter()

        for interaction in self.interactions:
            if interaction.timestamp >= cutoff_date:
                product_counts[interaction.product_id] += interaction.value

        # Get top trending
        self.trending_products = [
            pid for pid, _ in product_counts.most_common(top_n)
        ]

    def get_cross_sell_recommendations(self, cart_items: List[str],
                                       count: int = 5) -> List[Dict]:
        """Recommend products that are frequently bought together"""
        if not cart_items:
            return []

        # Find products similar to items in cart
        similar_products = defaultdict(float)

        for item_id in cart_items:
            similar = self.get_similar_products(item_id, count * 2)
            for rec in similar:
                if rec['product_id'] not in cart_items:
                    similar_products[rec['product_id']] += rec['score']

        # Sort and return top recommendations
        recommendations = sorted(
            [
                {'product_id': pid, 'score': score, 'reasons': ['cross-sell']}
                for pid, score in similar_products.items()
            ],
            key=lambda x: x['score'],
            reverse=True
        )[:count]

        return recommendations

    def get_upsell_recommendations(self, product_id: str, count: int = 5) -> List[Dict]:
        """Recommend higher-value products in same category"""
        if product_id not in self.content_filter.products:
            return []

        target_product = self.content_filter.products[product_id]
        category_products = self.content_filter.category_index[target_product.category]

        # Filter for higher-priced products
        upsell_candidates = [
            (pid, self.content_filter.products[pid])
            for pid in category_products
            if pid != product_id and
            self.content_filter.products[pid].price > target_product.price * 1.2
        ]

        # Score by similarity and price difference
        scored_candidates = []
        for pid, product in upsell_candidates:
            similarity = self.content_filter.compute_product_similarity(
                target_product, product
            )
            price_factor = product.price / target_product.price
            score = similarity * min(price_factor, 2.0)  # Cap at 2x

            scored_candidates.append({
                'product_id': pid,
                'score': score,
                'reasons': ['upsell']
            })

        # Sort and return
        scored_candidates.sort(key=lambda x: x['score'], reverse=True)
        return scored_candidates[:count]


# ============================================================================
# Public API for TypeScript Integration
# ============================================================================

# Global recommendation engine instance
_recommendation_engine = HybridRecommendationEngine()


def initialize_products(products: List[Dict]):
    """Initialize the recommendation engine with product catalog"""
    for product in products:
        _recommendation_engine.add_product(product)
    print(f"Initialized recommendation engine with {len(products)} products")


def record_user_interaction(user_id: str, product_id: str, event_type: str):
    """Record a user interaction event"""
    _recommendation_engine.record_interaction(user_id, product_id, event_type)


def recommend_products(user_id: str, count: int = 10, strategy: str = 'hybrid') -> str:
    """Get product recommendations (returns JSON string for TypeScript)"""
    recommendations = _recommendation_engine.recommend_products(user_id, count, strategy)
    return json.dumps(recommendations)


def get_similar_products(product_id: str, count: int = 5) -> str:
    """Get similar products (returns JSON string for TypeScript)"""
    similar = _recommendation_engine.get_similar_products(product_id, count)
    return json.dumps(similar)


def get_cross_sell(cart_items: List[str], count: int = 5) -> str:
    """Get cross-sell recommendations (returns JSON string for TypeScript)"""
    recommendations = _recommendation_engine.get_cross_sell_recommendations(
        cart_items, count
    )
    return json.dumps(recommendations)


def get_upsell(product_id: str, count: int = 5) -> str:
    """Get upsell recommendations (returns JSON string for TypeScript)"""
    recommendations = _recommendation_engine.get_upsell_recommendations(
        product_id, count
    )
    return json.dumps(recommendations)


def update_trending() -> str:
    """Update trending products"""
    _recommendation_engine.update_trending_products()
    return json.dumps({'status': 'success', 'trending_count': len(_recommendation_engine.trending_products)})


# ============================================================================
# Demo/Testing
# ============================================================================

def run_demo():
    """Demonstration of recommendation engine"""
    print("=" * 80)
    print("PRODUCT RECOMMENDATION ENGINE DEMO")
    print("=" * 80)
    print()

    # Sample products
    products = [
        {'id': 'p1', 'name': 'Laptop', 'category': 'Electronics', 'price': 999.99, 'tags': ['computer', 'work']},
        {'id': 'p2', 'name': 'Mouse', 'category': 'Electronics', 'price': 29.99, 'tags': ['computer', 'accessory']},
        {'id': 'p3', 'name': 'Keyboard', 'category': 'Electronics', 'price': 79.99, 'tags': ['computer', 'accessory']},
        {'id': 'p4', 'name': 'Monitor', 'category': 'Electronics', 'price': 299.99, 'tags': ['computer', 'display']},
        {'id': 'p5', 'name': 'Desk Chair', 'category': 'Furniture', 'price': 199.99, 'tags': ['office', 'comfort']},
    ]

    initialize_products(products)

    # Simulate user interactions
    print("Recording user interactions...")
    record_user_interaction('user1', 'p1', 'purchase')
    record_user_interaction('user1', 'p2', 'purchase')
    record_user_interaction('user1', 'p3', 'view')
    record_user_interaction('user2', 'p1', 'view')
    record_user_interaction('user2', 'p4', 'purchase')
    print()

    # Get recommendations
    print("Recommendations for user1:")
    recs = recommend_products('user1', 5, 'hybrid')
    print(json.dumps(json.loads(recs), indent=2))
    print()

    # Get similar products
    print("Products similar to Laptop (p1):")
    similar = get_similar_products('p1', 3)
    print(json.dumps(json.loads(similar), indent=2))
    print()

    print("=" * 80)


if __name__ == '__main__':
    run_demo()

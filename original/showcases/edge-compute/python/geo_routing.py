"""
ML-Based Geographic Routing

Advanced geographic routing using machine learning for:
- Intelligent edge location selection
- Latency prediction
- Traffic pattern learning
- Network path optimization
- Adaptive routing decisions
"""

import json
import time
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from collections import defaultdict
import math


@dataclass
class EdgeLocation:
    """Edge location data"""
    id: str
    name: str
    latitude: float
    longitude: float
    capacity: int
    current_load: int
    avg_latency: float
    availability: float


@dataclass
class Request:
    """Request data"""
    ip: str
    latitude: float
    longitude: float
    country: str
    city: str
    timestamp: float


@dataclass
class RoutingDecision:
    """Routing decision result"""
    edge_id: str
    predicted_latency: float
    confidence: float
    distance: float
    load_factor: float


class GeoDistance:
    """Calculate geographic distances"""

    @staticmethod
    def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate distance between two points using Haversine formula
        Returns distance in kilometers
        """
        R = 6371  # Earth's radius in kilometers

        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)

        a = (math.sin(delta_lat / 2) ** 2 +
             math.cos(lat1_rad) * math.cos(lat2_rad) *
             math.sin(delta_lon / 2) ** 2)

        c = 2 * math.asin(math.sqrt(a))

        return R * c


class LatencyPredictor:
    """Predict latency based on distance and historical data"""

    def __init__(self):
        self.history: Dict[Tuple[str, str], List[float]] = defaultdict(list)
        self.baseline_latency = 5.0  # Base latency in ms
        self.latency_per_km = 0.1  # Additional ms per km

    def record_latency(self, edge_id: str, location: str, latency: float):
        """Record observed latency"""
        key = (edge_id, location)
        self.history[key].append(latency)

        # Keep only recent 100 measurements
        if len(self.history[key]) > 100:
            self.history[key] = self.history[key][-100:]

    def predict(self, edge_id: str, location: str, distance: float) -> Tuple[float, float]:
        """
        Predict latency for a route
        Returns: (predicted_latency, confidence)
        """
        key = (edge_id, location)

        # Use historical data if available
        if key in self.history and self.history[key]:
            measurements = self.history[key]
            avg = sum(measurements) / len(measurements)
            variance = sum((x - avg) ** 2 for x in measurements) / len(measurements)
            stddev = math.sqrt(variance)

            # Higher confidence with more data and lower variance
            confidence = min(1.0, len(measurements) / 20) * (1.0 - min(1.0, stddev / avg))

            return avg, confidence

        # Estimate based on distance
        estimated_latency = self.baseline_latency + (distance * self.latency_per_km)
        confidence = 0.5  # Lower confidence for estimates

        return estimated_latency, confidence


class TrafficPatternLearner:
    """Learn traffic patterns over time"""

    def __init__(self):
        self.hourly_patterns: Dict[int, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
        self.country_preferences: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))

    def record_request(self, req: Request, edge_id: str):
        """Record request for pattern learning"""
        hour = int((req.timestamp % 86400) / 3600)
        self.hourly_patterns[hour][edge_id] += 1
        self.country_preferences[req.country][edge_id] += 1

    def get_popularity_score(self, edge_id: str, req: Request) -> float:
        """Get popularity score for edge location based on patterns"""
        hour = int((req.timestamp % 86400) / 3600)

        # Hourly popularity
        hour_total = sum(self.hourly_patterns[hour].values())
        hour_score = self.hourly_patterns[hour][edge_id] / hour_total if hour_total > 0 else 0

        # Country preference
        country_total = sum(self.country_preferences[req.country].values())
        country_score = (self.country_preferences[req.country][edge_id] / country_total
                        if country_total > 0 else 0)

        # Weighted combination
        return 0.6 * country_score + 0.4 * hour_score


class MLGeoRouter:
    """Machine learning-based geographic router"""

    def __init__(self, edges: List[EdgeLocation]):
        self.edges = {edge.id: edge for edge in edges}
        self.latency_predictor = LatencyPredictor()
        self.traffic_learner = TrafficPatternLearner()
        self.distance_calculator = GeoDistance()

    def find_nearest_edges(self, req: Request, top_k: int = 3) -> List[Tuple[str, float]]:
        """Find k nearest edge locations"""
        distances = []

        for edge_id, edge in self.edges.items():
            distance = self.distance_calculator.haversine(
                req.latitude, req.longitude,
                edge.latitude, edge.longitude
            )
            distances.append((edge_id, distance))

        distances.sort(key=lambda x: x[1])
        return distances[:top_k]

    def calculate_load_factor(self, edge: EdgeLocation) -> float:
        """Calculate load factor (0-1, lower is better)"""
        if edge.capacity == 0:
            return 1.0

        return edge.current_load / edge.capacity

    def route(self, req: Request) -> RoutingDecision:
        """
        Make intelligent routing decision
        """
        # Find candidate edges
        candidates = self.find_nearest_edges(req, top_k=5)

        best_score = float('-inf')
        best_decision = None

        for edge_id, distance in candidates:
            edge = self.edges[edge_id]

            # Skip if over capacity or unavailable
            if edge.current_load >= edge.capacity or edge.availability < 0.9:
                continue

            # Predict latency
            location_key = f"{req.country}:{req.city}"
            predicted_latency, confidence = self.latency_predictor.predict(
                edge_id, location_key, distance
            )

            # Get load factor
            load_factor = self.calculate_load_factor(edge)

            # Get traffic pattern score
            popularity = self.traffic_learner.get_popularity_score(edge_id, req)

            # Calculate composite score
            # Lower latency, lower load, higher popularity = higher score
            score = (
                -predicted_latency * 0.4 +
                -(load_factor * 100) * 0.3 +
                popularity * 100 * 0.2 +
                edge.availability * 100 * 0.1
            )

            if score > best_score:
                best_score = score
                best_decision = RoutingDecision(
                    edge_id=edge_id,
                    predicted_latency=predicted_latency,
                    confidence=confidence,
                    distance=distance,
                    load_factor=load_factor
                )

        return best_decision

    def record_result(self, req: Request, edge_id: str, actual_latency: float):
        """Record actual routing result for learning"""
        location_key = f"{req.country}:{req.city}"
        self.latency_predictor.record_latency(edge_id, location_key, actual_latency)
        self.traffic_learner.record_request(req, edge_id)

    def get_statistics(self) -> Dict:
        """Get routing statistics"""
        stats = {
            'total_edges': len(self.edges),
            'active_edges': sum(1 for e in self.edges.values() if e.availability > 0.9),
            'avg_load': sum(e.current_load / e.capacity for e in self.edges.values()) / len(self.edges),
            'total_capacity': sum(e.capacity for e in self.edges.values()),
            'total_load': sum(e.current_load for e in self.edges.values()),
        }

        return stats


class AdaptiveRouter:
    """Adaptive router that adjusts based on performance"""

    def __init__(self, router: MLGeoRouter):
        self.router = router
        self.performance_window = 100
        self.recent_decisions: List[Tuple[str, float, float]] = []  # (edge_id, predicted, actual)

    def route_with_feedback(self, req: Request) -> RoutingDecision:
        """Route with feedback loop"""
        decision = self.router.route(req)

        # Simulate actual latency (in production, measure real latency)
        actual_latency = self._simulate_actual_latency(decision)

        # Record for learning
        self.router.record_result(req, decision.edge_id, actual_latency)

        # Track performance
        self.recent_decisions.append((
            decision.edge_id,
            decision.predicted_latency,
            actual_latency
        ))

        if len(self.recent_decisions) > self.performance_window:
            self.recent_decisions.pop(0)

        return decision

    def _simulate_actual_latency(self, decision: RoutingDecision) -> float:
        """Simulate actual latency (for demonstration)"""
        # Add some random variance
        import random
        variance = random.uniform(-2, 2)
        return max(1.0, decision.predicted_latency + variance)

    def get_prediction_accuracy(self) -> Dict:
        """Calculate prediction accuracy"""
        if not self.recent_decisions:
            return {'accuracy': 0, 'mae': 0, 'samples': 0}

        total_error = 0
        for edge_id, predicted, actual in self.recent_decisions:
            total_error += abs(predicted - actual)

        mae = total_error / len(self.recent_decisions)
        accuracy = 1.0 - min(1.0, mae / 100)  # Normalize to 0-1

        return {
            'accuracy': accuracy,
            'mae': mae,
            'samples': len(self.recent_decisions)
        }


def create_sample_edges() -> List[EdgeLocation]:
    """Create sample edge locations"""
    return [
        EdgeLocation('us-east-1', 'Virginia', 37.4316, -78.6569, 1000, 450, 5.2, 0.99),
        EdgeLocation('us-west-1', 'California', 37.3382, -121.8863, 1000, 320, 5.5, 0.98),
        EdgeLocation('eu-west-1', 'Ireland', 53.4129, -8.2439, 800, 500, 8.1, 0.97),
        EdgeLocation('eu-central-1', 'Frankfurt', 50.1109, 8.6821, 800, 380, 7.8, 0.99),
        EdgeLocation('ap-southeast-1', 'Singapore', 1.3521, 103.8198, 600, 420, 12.3, 0.96),
        EdgeLocation('ap-northeast-1', 'Tokyo', 35.6762, 139.6503, 1200, 780, 6.9, 0.98),
        EdgeLocation('sa-east-1', 'São Paulo', -23.5505, -46.6333, 400, 180, 15.2, 0.95),
        EdgeLocation('ap-south-1', 'Mumbai', 19.0760, 72.8777, 500, 290, 11.4, 0.97),
    ]


def create_sample_requests() -> List[Request]:
    """Create sample requests from various locations"""
    return [
        Request('203.0.113.1', 40.7128, -74.0060, 'US', 'New York', time.time()),
        Request('203.0.113.2', 51.5074, -0.1278, 'GB', 'London', time.time()),
        Request('203.0.113.3', 35.6762, 139.6503, 'JP', 'Tokyo', time.time()),
        Request('203.0.113.4', -33.8688, 151.2093, 'AU', 'Sydney', time.time()),
        Request('203.0.113.5', 1.3521, 103.8198, 'SG', 'Singapore', time.time()),
        Request('203.0.113.6', -23.5505, -46.6333, 'BR', 'São Paulo', time.time()),
        Request('203.0.113.7', 48.8566, 2.3522, 'FR', 'Paris', time.time()),
        Request('203.0.113.8', 37.7749, -122.4194, 'US', 'San Francisco', time.time()),
    ]


def demonstrate_geo_routing():
    """Demonstrate ML-based geo routing"""
    print("=== ML-Based Geographic Routing ===\n")

    # Initialize
    edges = create_sample_edges()
    router = MLGeoRouter(edges)
    adaptive_router = AdaptiveRouter(router)

    # Process requests
    requests = create_sample_requests()

    print("Routing Decisions:\n")
    for req in requests:
        decision = adaptive_router.route_with_feedback(req)

        print(f"{req.city}, {req.country}:")
        print(f"  Routed to: {edges[decision.edge_id].name}")
        print(f"  Distance: {decision.distance:.0f} km")
        print(f"  Predicted latency: {decision.predicted_latency:.1f} ms")
        print(f"  Confidence: {decision.confidence:.2f}")
        print(f"  Load factor: {decision.load_factor:.2%}")
        print()

    # Statistics
    print("\nRouter Statistics:")
    stats = router.get_statistics()
    for key, value in stats.items():
        if isinstance(value, float):
            print(f"  {key}: {value:.2f}")
        else:
            print(f"  {key}: {value}")

    # Prediction accuracy
    print("\nPrediction Accuracy:")
    accuracy = adaptive_router.get_prediction_accuracy()
    print(f"  Accuracy: {accuracy['accuracy']:.2%}")
    print(f"  Mean Absolute Error: {accuracy['mae']:.2f} ms")
    print(f"  Samples: {accuracy['samples']}")

    # Edge load distribution
    print("\nEdge Load Distribution:")
    for edge_id, edge in router.edges.items():
        load_pct = (edge.current_load / edge.capacity) * 100
        print(f"  {edge.name}: {load_pct:.1f}% ({edge.current_load}/{edge.capacity})")


def benchmark_routing():
    """Benchmark routing performance"""
    print("\n=== Routing Performance Benchmark ===\n")

    edges = create_sample_edges()
    router = MLGeoRouter(edges)

    # Generate many requests
    import random
    requests = []
    for i in range(1000):
        req = Request(
            ip=f"192.0.2.{i % 255}",
            latitude=random.uniform(-90, 90),
            longitude=random.uniform(-180, 180),
            country=random.choice(['US', 'GB', 'JP', 'AU', 'SG', 'BR', 'FR', 'DE']),
            city='Test City',
            timestamp=time.time()
        )
        requests.append(req)

    # Benchmark
    start_time = time.time()
    for req in requests:
        router.route(req)

    duration = time.time() - start_time
    rps = len(requests) / duration

    print(f"Requests: {len(requests)}")
    print(f"Duration: {duration:.3f} seconds")
    print(f"Requests/second: {rps:.0f}")
    print(f"Avg latency: {(duration / len(requests)) * 1000:.3f} ms")


if __name__ == '__main__':
    demonstrate_geo_routing()
    benchmark_routing()

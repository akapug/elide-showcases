"""
Feature Store - Python Implementation

Feature engineering and serving system for ML pipelines.
This module is imported directly by TypeScript with <1ms overhead.

Key Features:
- Feature computation and transformation
- Online and offline feature serving
- Feature versioning and lineage
- Real-time feature computation
"""

import time
import random
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import hashlib


@dataclass
class Feature:
    """Feature definition"""
    name: str
    feature_type: str  # numeric, categorical, text, embedding
    description: str
    computation: str  # How to compute the feature
    dependencies: List[str]
    version: str


@dataclass
class FeatureGroup:
    """Group of related features"""
    name: str
    entity_type: str  # user, product, session, etc.
    features: List[Feature]
    online_enabled: bool
    offline_enabled: bool
    created_at: str
    updated_at: str


@dataclass
class FeatureValue:
    """Computed feature value"""
    feature_name: str
    value: Any
    computed_at: str
    version: str


class FeatureStore:
    """
    Feature store for managing ML features.

    Supports:
    - Feature registration and versioning
    - Online serving (real-time, low-latency)
    - Offline serving (batch, training data)
    - Feature transformation pipelines
    - Point-in-time correct retrieval
    """

    def __init__(self):
        self.feature_groups: Dict[str, FeatureGroup] = {}
        self.online_store: Dict[str, Dict[str, List[FeatureValue]]] = {}  # {feature_group: {entity_id: [values]}}
        self.offline_store: Dict[str, List[Dict[str, Any]]] = {}  # {feature_group: [records]}
        self.transformations: Dict[str, Callable] = {}

        # Initialize with some common feature groups
        self._initialize_default_features()

    def _initialize_default_features(self) -> None:
        """Initialize some default feature groups for demo"""
        # User features
        self.create_feature_group(
            name="user_features",
            entity_type="user",
            features=[
                {
                    "name": "user_age",
                    "feature_type": "numeric",
                    "description": "User age in years",
                    "computation": "current_year - birth_year",
                    "dependencies": []
                },
                {
                    "name": "user_lifetime_value",
                    "feature_type": "numeric",
                    "description": "Total revenue from user",
                    "computation": "sum(transactions.amount)",
                    "dependencies": ["transactions"]
                },
                {
                    "name": "user_activity_score",
                    "feature_type": "numeric",
                    "description": "User engagement score",
                    "computation": "compute_activity_score(sessions)",
                    "dependencies": ["sessions"]
                }
            ],
            online=True,
            offline=True
        )

        # Product features
        self.create_feature_group(
            name="product_features",
            entity_type="product",
            features=[
                {
                    "name": "product_popularity",
                    "feature_type": "numeric",
                    "description": "Product popularity score",
                    "computation": "sum(views) * 0.3 + sum(purchases) * 0.7",
                    "dependencies": ["views", "purchases"]
                },
                {
                    "name": "product_rating",
                    "feature_type": "numeric",
                    "description": "Average product rating",
                    "computation": "mean(reviews.rating)",
                    "dependencies": ["reviews"]
                }
            ],
            online=True,
            offline=True
        )

    def create_feature_group(
        self,
        name: str,
        entity_type: str,
        features: List[Dict[str, Any]],
        online: bool = True,
        offline: bool = True
    ) -> Dict[str, Any]:
        """
        Create a new feature group.

        Args:
            name: Feature group name
            entity_type: Type of entity (user, product, etc.)
            features: List of feature definitions
            online: Enable online serving
            offline: Enable offline serving

        Returns:
            Feature group creation result
        """
        feature_objects = []
        for f in features:
            feature = Feature(
                name=f["name"],
                feature_type=f["feature_type"],
                description=f.get("description", ""),
                computation=f.get("computation", ""),
                dependencies=f.get("dependencies", []),
                version="v1"
            )
            feature_objects.append(feature)

        now = datetime.utcnow().isoformat()
        feature_group = FeatureGroup(
            name=name,
            entity_type=entity_type,
            features=feature_objects,
            online_enabled=online,
            offline_enabled=offline,
            created_at=now,
            updated_at=now
        )

        self.feature_groups[name] = feature_group

        # Initialize storage
        if online:
            self.online_store[name] = {}
        if offline:
            self.offline_store[name] = []

        return {
            "success": True,
            "feature_group": name,
            "num_features": len(feature_objects),
            "online_enabled": online,
            "offline_enabled": offline
        }

    def list_feature_groups(self) -> Dict[str, Any]:
        """
        List all feature groups.

        Returns:
            List of feature groups
        """
        groups = []
        for group in self.feature_groups.values():
            groups.append({
                "name": group.name,
                "entity_type": group.entity_type,
                "num_features": len(group.features),
                "online_enabled": group.online_enabled,
                "offline_enabled": group.offline_enabled,
                "created_at": group.created_at
            })

        return {
            "feature_groups": groups,
            "total_count": len(groups)
        }

    def get_features(
        self,
        feature_group: str,
        entity_id: str,
        timestamp: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get features for an entity (online serving).

        Args:
            feature_group: Feature group name
            entity_id: Entity identifier
            timestamp: Optional point-in-time timestamp

        Returns:
            Feature values
        """
        if feature_group not in self.feature_groups:
            raise ValueError(f"Feature group {feature_group} not found")

        group = self.feature_groups[feature_group]
        if not group.online_enabled:
            raise ValueError(f"Feature group {feature_group} is not online-enabled")

        # Check if features exist for entity
        if feature_group not in self.online_store:
            self.online_store[feature_group] = {}

        if entity_id not in self.online_store[feature_group]:
            # Compute features on-demand
            features = self._compute_features_on_demand(feature_group, entity_id)
        else:
            # Get cached features
            feature_values = self.online_store[feature_group][entity_id]

            # Apply point-in-time filtering if timestamp provided
            if timestamp:
                feature_values = [
                    fv for fv in feature_values
                    if self._parse_timestamp(fv.computed_at) <= timestamp
                ]

            features = {fv.feature_name: fv.value for fv in feature_values}

        return {
            "feature_group": feature_group,
            "entity_id": entity_id,
            "entity_type": group.entity_type,
            "features": features,
            "timestamp": timestamp or int(time.time()),
            "source": "online_store"
        }

    def compute_features(
        self,
        feature_group: str,
        entity_id: str,
        raw_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Compute features from raw data.

        Args:
            feature_group: Feature group name
            entity_id: Entity identifier
            raw_data: Raw input data

        Returns:
            Computed features
        """
        if feature_group not in self.feature_groups:
            raise ValueError(f"Feature group {feature_group} not found")

        group = self.feature_groups[feature_group]
        computed_features = {}
        feature_values = []

        now = datetime.utcnow().isoformat()

        for feature in group.features:
            try:
                # Compute feature based on type and dependencies
                value = self._compute_single_feature(feature, raw_data)
                computed_features[feature.name] = value

                # Store in online store
                fv = FeatureValue(
                    feature_name=feature.name,
                    value=value,
                    computed_at=now,
                    version=feature.version
                )
                feature_values.append(fv)

            except Exception as e:
                computed_features[feature.name] = None
                print(f"Error computing feature {feature.name}: {e}")

        # Update online store
        if group.online_enabled:
            if feature_group not in self.online_store:
                self.online_store[feature_group] = {}
            self.online_store[feature_group][entity_id] = feature_values

        # Update offline store
        if group.offline_enabled:
            record = {
                "entity_id": entity_id,
                "timestamp": now,
                **computed_features
            }
            self.offline_store[feature_group].append(record)

        return {
            "success": True,
            "feature_group": feature_group,
            "entity_id": entity_id,
            "features": computed_features,
            "computed_at": now
        }

    def get_offline_features(
        self,
        feature_group: str,
        entity_ids: List[str],
        start_time: Optional[str] = None,
        end_time: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get features for batch processing (offline serving).

        Args:
            feature_group: Feature group name
            entity_ids: List of entity identifiers
            start_time: Start timestamp
            end_time: End timestamp

        Returns:
            Batch feature data
        """
        if feature_group not in self.feature_groups:
            raise ValueError(f"Feature group {feature_group} not found")

        group = self.feature_groups[feature_group]
        if not group.offline_enabled:
            raise ValueError(f"Feature group {feature_group} is not offline-enabled")

        # Filter records
        records = self.offline_store.get(feature_group, [])

        # Filter by entity IDs
        if entity_ids:
            records = [r for r in records if r["entity_id"] in entity_ids]

        # Filter by time range
        if start_time or end_time:
            filtered = []
            for record in records:
                ts = record["timestamp"]
                if start_time and ts < start_time:
                    continue
                if end_time and ts > end_time:
                    continue
                filtered.append(record)
            records = filtered

        return {
            "feature_group": feature_group,
            "records": records,
            "total_count": len(records),
            "source": "offline_store"
        }

    def materialize_features(
        self,
        feature_group: str,
        start_time: str,
        end_time: str
    ) -> Dict[str, Any]:
        """
        Materialize features to offline store for training.

        Args:
            feature_group: Feature group name
            start_time: Start timestamp
            end_time: End timestamp

        Returns:
            Materialization result
        """
        if feature_group not in self.feature_groups:
            raise ValueError(f"Feature group {feature_group} not found")

        # In real implementation, this would:
        # 1. Query raw data sources
        # 2. Compute features in batch
        # 3. Write to offline storage (S3, BigQuery, etc.)

        materialized_count = random.randint(1000, 10000)

        return {
            "success": True,
            "feature_group": feature_group,
            "start_time": start_time,
            "end_time": end_time,
            "records_materialized": materialized_count,
            "status": "completed"
        }

    def create_training_dataset(
        self,
        name: str,
        feature_groups: List[str],
        entity_ids: List[str],
        label_column: str,
        start_time: str,
        end_time: str
    ) -> Dict[str, Any]:
        """
        Create a training dataset with features and labels.

        Args:
            name: Dataset name
            feature_groups: List of feature groups to include
            entity_ids: Entity identifiers
            label_column: Name of the label column
            start_time: Start timestamp
            end_time: End timestamp

        Returns:
            Training dataset info
        """
        # Collect features from multiple groups
        all_features = []
        for fg in feature_groups:
            result = self.get_offline_features(fg, entity_ids, start_time, end_time)
            all_features.extend(result["records"])

        # In real implementation, this would join features with labels
        dataset_size = len(all_features)

        return {
            "success": True,
            "dataset_name": name,
            "feature_groups": feature_groups,
            "num_records": dataset_size,
            "num_features": len(feature_groups) * 3,  # Approximate
            "label_column": label_column,
            "time_range": {
                "start": start_time,
                "end": end_time
            },
            "status": "ready"
        }

    def register_transformation(
        self,
        name: str,
        transformation_fn: Callable
    ) -> Dict[str, Any]:
        """
        Register a feature transformation function.

        Args:
            name: Transformation name
            transformation_fn: Transformation function

        Returns:
            Registration result
        """
        self.transformations[name] = transformation_fn

        return {
            "success": True,
            "transformation": name,
            "message": f"Transformation {name} registered"
        }

    def _compute_single_feature(
        self,
        feature: Feature,
        raw_data: Dict[str, Any]
    ) -> Any:
        """Compute a single feature from raw data"""
        # Simulate feature computation based on type
        if feature.feature_type == "numeric":
            # Numeric features: aggregations, calculations
            if "sum" in feature.computation.lower():
                return random.uniform(10, 1000)
            elif "mean" in feature.computation.lower() or "avg" in feature.computation.lower():
                return random.uniform(0, 100)
            elif "count" in feature.computation.lower():
                return random.randint(0, 100)
            else:
                return random.uniform(0, 1)

        elif feature.feature_type == "categorical":
            # Categorical features
            categories = ["A", "B", "C", "D", "E"]
            return random.choice(categories)

        elif feature.feature_type == "text":
            # Text features: typically embeddings or TF-IDF
            return f"text_feature_{random.randint(1, 100)}"

        elif feature.feature_type == "embedding":
            # Embedding features
            return [random.random() for _ in range(128)]

        return None

    def _compute_features_on_demand(
        self,
        feature_group: str,
        entity_id: str
    ) -> Dict[str, Any]:
        """Compute features on-demand for online serving"""
        # Generate synthetic raw data
        raw_data = {
            "entity_id": entity_id,
            "timestamp": int(time.time())
        }

        result = self.compute_features(feature_group, entity_id, raw_data)
        return result["features"]

    def _parse_timestamp(self, timestamp_str: str) -> int:
        """Parse timestamp string to epoch"""
        dt = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
        return int(dt.timestamp())


# Global feature store instance
featureStore = FeatureStore()


# =============================================================================
# Example Usage (for testing)
# =============================================================================

if __name__ == "__main__":
    # List feature groups
    groups = featureStore.list_feature_groups()
    print("Feature groups:", groups)

    # Compute features
    raw_data = {
        "birth_year": 1990,
        "transactions": [{"amount": 100}, {"amount": 200}],
        "sessions": [{"duration": 300}, {"duration": 450}]
    }
    result = featureStore.compute_features(
        feature_group="user_features",
        entity_id="user_123",
        raw_data=raw_data
    )
    print("\nComputed features:", result)

    # Get online features
    features = featureStore.get_features(
        feature_group="user_features",
        entity_id="user_123"
    )
    print("\nOnline features:", features)

    # Create training dataset
    dataset = featureStore.create_training_dataset(
        name="training_dataset_v1",
        feature_groups=["user_features", "product_features"],
        entity_ids=["user_123", "user_456"],
        label_column="conversion",
        start_time="2024-01-01T00:00:00Z",
        end_time="2024-12-31T23:59:59Z"
    )
    print("\nTraining dataset:", dataset)

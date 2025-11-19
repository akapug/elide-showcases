"""
Model Registry - Python Implementation

Manages ML models with versioning, deployment strategies, and HuggingFace integration.
This module is imported directly by TypeScript with <1ms overhead.

Key Features:
- Model versioning and metadata management
- HuggingFace model integration
- A/B testing and canary deployments
- Model performance tracking
"""

import time
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from datetime import datetime
import random


@dataclass
class ModelMetadata:
    """Model metadata and versioning information"""
    name: str
    framework: str  # pytorch, tensorflow, sklearn
    model_type: str  # classification, regression, nlp, vision
    version: str
    created_at: str
    updated_at: str
    status: str  # development, staging, production
    metrics: Dict[str, float]
    config: Dict[str, Any]
    deployment_strategy: Optional[str] = None  # rolling, blue-green, canary
    traffic_percentage: float = 0.0
    huggingface_id: Optional[str] = None


@dataclass
class DeploymentInfo:
    """Deployment configuration and status"""
    model_name: str
    version: str
    strategy: str
    status: str
    traffic_percentage: float
    deployed_at: str
    rollback_version: Optional[str] = None


class ModelRegistry:
    """
    Central model registry for managing ML models.
    Supports versioning, deployment strategies, and HuggingFace integration.
    """

    def __init__(self):
        self.models: Dict[str, List[ModelMetadata]] = {}
        self.deployments: Dict[str, DeploymentInfo] = {}
        self.version_counter: Dict[str, int] = {}

    def create_model(
        self,
        name: str,
        framework: str,
        model_type: str,
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create a new model entry in the registry.

        Args:
            name: Model name
            framework: ML framework (pytorch, tensorflow, sklearn)
            model_type: Type of model (classification, regression, nlp, vision)
            config: Model configuration

        Returns:
            Model creation result with metadata
        """
        if name not in self.models:
            self.models[name] = []
            self.version_counter[name] = 0

        # Generate version
        self.version_counter[name] += 1
        version = f"v{self.version_counter[name]}"

        # Create model metadata
        now = datetime.utcnow().isoformat()
        metadata = ModelMetadata(
            name=name,
            framework=framework,
            model_type=model_type,
            version=version,
            created_at=now,
            updated_at=now,
            status="development",
            metrics={},
            config=config
        )

        self.models[name].append(metadata)

        # Check if this should use HuggingFace
        if config.get("use_huggingface"):
            metadata.huggingface_id = config.get("huggingface_model_id")

        return {
            "success": True,
            "model": asdict(metadata),
            "message": f"Model {name} created with version {version}"
        }

    def get_model(self, name: str, version: Optional[str] = None) -> Dict[str, Any]:
        """
        Get model information.

        Args:
            name: Model name
            version: Optional specific version (defaults to latest)

        Returns:
            Model metadata
        """
        if name not in self.models:
            raise ValueError(f"Model {name} not found")

        versions = self.models[name]
        if not versions:
            raise ValueError(f"No versions found for model {name}")

        if version:
            # Find specific version
            for v in versions:
                if v.version == version:
                    return asdict(v)
            raise ValueError(f"Version {version} not found for model {name}")
        else:
            # Return latest version
            return asdict(versions[-1])

    def list_models(self) -> Dict[str, Any]:
        """
        List all models in the registry.

        Returns:
            List of all models with their versions
        """
        models = []
        for name, versions in self.models.items():
            latest = versions[-1] if versions else None
            if latest:
                models.append({
                    "name": name,
                    "framework": latest.framework,
                    "model_type": latest.model_type,
                    "latest_version": latest.version,
                    "status": latest.status,
                    "total_versions": len(versions),
                    "created_at": versions[0].created_at,
                    "updated_at": latest.updated_at
                })

        return {
            "models": models,
            "total_count": len(models)
        }

    def update_model_metrics(
        self,
        name: str,
        version: str,
        metrics: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Update model performance metrics.

        Args:
            name: Model name
            version: Model version
            metrics: Performance metrics (accuracy, f1, etc.)

        Returns:
            Update result
        """
        if name not in self.models:
            raise ValueError(f"Model {name} not found")

        for model in self.models[name]:
            if model.version == version:
                model.metrics.update(metrics)
                model.updated_at = datetime.utcnow().isoformat()
                return {
                    "success": True,
                    "message": f"Metrics updated for {name} {version}",
                    "metrics": model.metrics
                }

        raise ValueError(f"Version {version} not found for model {name}")

    def deploy_model(
        self,
        name: str,
        version: str,
        strategy: str = "rolling"
    ) -> Dict[str, Any]:
        """
        Deploy a model using a specific strategy.

        Args:
            name: Model name
            version: Version to deploy
            strategy: Deployment strategy (rolling, blue-green, canary)

        Returns:
            Deployment information
        """
        # Validate model exists
        model = self.get_model(name, version)

        # Get current deployment if exists
        current_deployment = self.deployments.get(name)
        rollback_version = current_deployment.version if current_deployment else None

        # Create deployment info
        deployment = DeploymentInfo(
            model_name=name,
            version=version,
            strategy=strategy,
            status="deploying",
            traffic_percentage=0.0,
            deployed_at=datetime.utcnow().isoformat(),
            rollback_version=rollback_version
        )

        # Simulate deployment based on strategy
        if strategy == "rolling":
            # Rolling deployment: gradually increase traffic
            deployment.traffic_percentage = 100.0
            deployment.status = "deployed"
        elif strategy == "canary":
            # Canary deployment: start with 10% traffic
            deployment.traffic_percentage = 10.0
            deployment.status = "canary"
        elif strategy == "blue-green":
            # Blue-green: switch all traffic at once
            deployment.traffic_percentage = 100.0
            deployment.status = "deployed"
        else:
            raise ValueError(f"Unknown deployment strategy: {strategy}")

        self.deployments[name] = deployment

        # Update model status
        for model_version in self.models[name]:
            if model_version.version == version:
                model_version.status = "production"
                model_version.deployment_strategy = strategy
                model_version.traffic_percentage = deployment.traffic_percentage

        return {
            "success": True,
            "deployment": asdict(deployment),
            "message": f"Model {name} {version} deployed using {strategy} strategy"
        }

    def promote_canary(self, name: str, traffic_percentage: float) -> Dict[str, Any]:
        """
        Promote canary deployment by increasing traffic.

        Args:
            name: Model name
            traffic_percentage: New traffic percentage (0-100)

        Returns:
            Updated deployment info
        """
        if name not in self.deployments:
            raise ValueError(f"No deployment found for model {name}")

        deployment = self.deployments[name]
        if deployment.strategy != "canary":
            raise ValueError(f"Model {name} is not using canary deployment")

        deployment.traffic_percentage = min(100.0, traffic_percentage)

        if deployment.traffic_percentage >= 100.0:
            deployment.status = "deployed"

        return {
            "success": True,
            "deployment": asdict(deployment),
            "message": f"Canary deployment promoted to {traffic_percentage}% traffic"
        }

    def rollback_deployment(self, name: str) -> Dict[str, Any]:
        """
        Rollback to previous deployment.

        Args:
            name: Model name

        Returns:
            Rollback result
        """
        if name not in self.deployments:
            raise ValueError(f"No deployment found for model {name}")

        deployment = self.deployments[name]
        if not deployment.rollback_version:
            raise ValueError(f"No rollback version available for {name}")

        rollback_version = deployment.rollback_version

        # Deploy rollback version
        return self.deploy_model(name, rollback_version, "rolling")

    def get_deployment_info(self, name: str) -> Dict[str, Any]:
        """
        Get current deployment information.

        Args:
            name: Model name

        Returns:
            Deployment information
        """
        if name not in self.deployments:
            return {
                "deployed": False,
                "message": f"Model {name} is not deployed"
            }

        return {
            "deployed": True,
            "deployment": asdict(self.deployments[name])
        }

    def compare_versions(
        self,
        name: str,
        version_a: str,
        version_b: str
    ) -> Dict[str, Any]:
        """
        Compare two model versions (A/B testing).

        Args:
            name: Model name
            version_a: First version
            version_b: Second version

        Returns:
            Comparison results
        """
        model_a = self.get_model(name, version_a)
        model_b = self.get_model(name, version_b)

        comparison = {
            "model_name": name,
            "version_a": {
                "version": version_a,
                "metrics": model_a["metrics"],
                "status": model_a["status"]
            },
            "version_b": {
                "version": version_b,
                "metrics": model_b["metrics"],
                "status": model_b["status"]
            },
            "winner": None
        }

        # Simple comparison based on accuracy/score
        metrics_a = model_a.get("metrics", {})
        metrics_b = model_b.get("metrics", {})

        if metrics_a and metrics_b:
            # Compare by accuracy or first available metric
            key = "accuracy" if "accuracy" in metrics_a else list(metrics_a.keys())[0] if metrics_a else None
            if key and key in metrics_b:
                if metrics_a[key] > metrics_b[key]:
                    comparison["winner"] = "version_a"
                elif metrics_b[key] > metrics_a[key]:
                    comparison["winner"] = "version_b"
                else:
                    comparison["winner"] = "tie"

        return comparison

    def load_from_huggingface(
        self,
        model_id: str,
        name: str,
        model_type: str = "nlp"
    ) -> Dict[str, Any]:
        """
        Load a model from HuggingFace Hub.

        Args:
            model_id: HuggingFace model ID (e.g., "bert-base-uncased")
            name: Local name for the model
            model_type: Type of model

        Returns:
            Model creation result
        """
        # In a real implementation, this would download from HuggingFace
        # For demo purposes, we simulate it
        config = {
            "use_huggingface": True,
            "huggingface_model_id": model_id,
            "source": "huggingface"
        }

        result = self.create_model(
            name=name,
            framework="pytorch",  # Most HF models use PyTorch
            model_type=model_type,
            config=config
        )

        result["message"] = f"Model loaded from HuggingFace: {model_id}"
        return result


# Global registry instance
modelRegistry = ModelRegistry()


# =============================================================================
# Example Usage (for testing)
# =============================================================================

if __name__ == "__main__":
    # Create a model
    result = modelRegistry.create_model(
        name="sentiment-classifier",
        framework="pytorch",
        model_type="nlp",
        config={"hidden_size": 768, "num_layers": 12}
    )
    print("Created model:", result)

    # List models
    models = modelRegistry.list_models()
    print("\nAll models:", models)

    # Deploy model
    deployment = modelRegistry.deploy_model(
        name="sentiment-classifier",
        version="v1",
        strategy="canary"
    )
    print("\nDeployment:", deployment)

    # Update metrics
    metrics_update = modelRegistry.update_model_metrics(
        name="sentiment-classifier",
        version="v1",
        metrics={"accuracy": 0.92, "f1": 0.91}
    )
    print("\nMetrics updated:", metrics_update)

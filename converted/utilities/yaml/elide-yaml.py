#!/usr/bin/env python3
"""
Python Integration Example for elide-yaml

This demonstrates calling the TypeScript YAML parser
from Python using Elide's polyglot capabilities.

Benefits:
- One YAML parser shared across TypeScript and Python
- Consistent configuration parsing across services
- Support for complex YAML features
- Perfect for Kubernetes configs, CI/CD pipelines, app configs
"""

# NOTE: Exact syntax depends on Elide's Python polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Python support is ready

# Assuming Elide provides something like:
# from elide import require
# yaml_module = require('./elide-yaml.ts')

print("=== Python Calling TypeScript YAML Parser ===\n")

# Example 1: Parse Kubernetes Configuration
# def load_k8s_config(filename):
#     """Load Kubernetes YAML configuration"""
#     with open(filename, 'r') as f:
#         content = f.read()
#     return yaml_module.parseYAML(content)
#
# # deployment.yaml:
# # apiVersion: apps/v1
# # kind: Deployment
# # metadata:
# #   name: my-app
# # spec:
# #   replicas: 3
#
# k8s_config = load_k8s_config('deployment.yaml')
# print(f"Deployment: {k8s_config['metadata']['name']}")
# print(f"Replicas: {k8s_config['spec']['replicas']}")
# print()

# Example 2: Parse CI/CD Pipeline Config
# class PipelineConfig:
#     def __init__(self, yaml_path):
#         with open(yaml_path, 'r') as f:
#             self.config = yaml_module.parseYAML(f.read())
#
#     def get_stages(self):
#         return self.config.get('stages', [])
#
#     def get_jobs(self, stage):
#         return self.config.get('jobs', {}).get(stage, [])
#
# pipeline = PipelineConfig('.gitlab-ci.yml')
# stages = pipeline.get_stages()
# print(f"Pipeline stages: {stages}")
# print()

# Example 3: Application Configuration
# class AppConfig:
#     def __init__(self, config_path):
#         with open(config_path, 'r') as f:
#             self.config = yaml_module.parseYAML(f.read())
#
#     def get_database_url(self):
#         db = self.config.get('database', {})
#         host = db.get('host', 'localhost')
#         port = db.get('port', 5432)
#         name = db.get('name', 'app')
#         return f"postgresql://{host}:{port}/{name}"
#
#     def get_feature_flags(self):
#         return self.config.get('features', {})
#
# app_config = AppConfig('config.yml')
# print(f"Database URL: {app_config.get_database_url()}")
# print(f"Feature flags: {app_config.get_feature_flags()}")
# print()

# Example 4: Docker Compose Configuration
# def parse_docker_compose(filepath):
#     """Parse docker-compose.yml"""
#     with open(filepath, 'r') as f:
#         return yaml_module.parseYAML(f.read())
#
# # docker-compose.yml:
# # version: '3'
# # services:
# #   web:
# #     image: nginx
# #     ports:
# #       - "8080:80"
#
# compose = parse_docker_compose('docker-compose.yml')
# services = compose.get('services', {})
# print(f"Services: {list(services.keys())}")
# print()

# Example 5: Environment-Specific Config
# class EnvironmentConfig:
#     def __init__(self, base_path, env='development'):
#         self.env = env
#         with open(f"{base_path}/{env}.yml", 'r') as f:
#             self.config = yaml_module.parseYAML(f.read())
#
#     def get(self, key, default=None):
#         return self.config.get(key, default)
#
#     def get_nested(self, *keys):
#         value = self.config
#         for key in keys:
#             if isinstance(value, dict):
#                 value = value.get(key)
#             else:
#                 return None
#         return value
#
# env_config = EnvironmentConfig('config', 'production')
# api_url = env_config.get_nested('api', 'url')
# print(f"API URL: {api_url}")

print("""
USE CASES FOR YAML IN PYTHON:
==============================
1. Kubernetes Configs - Parse deployment, service definitions
2. CI/CD Pipelines - GitHub Actions, GitLab CI, CircleCI
3. Docker Compose - Multi-container configurations
4. Application Configs - Settings, feature flags
5. Infrastructure as Code - Ansible playbooks, Terraform
6. API Specifications - OpenAPI/Swagger definitions
7. Data Serialization - Configuration data exchange
8. Build Configs - Package managers, build tools

PERFORMANCE BENEFITS:
====================
- Elide's JIT compilation makes parsing extremely fast
- Shared parser across languages reduces code duplication
- Consistent behavior prevents parsing bugs
- Single source of truth for YAML parsing
- Native performance comparable to pure Python parsers
""")

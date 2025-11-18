#!/usr/bin/env python3
"""
Cross-Env Polyglot CLI Wrapper for Python

Demonstrates how to use the Elide cross-env CLI tool from Python scripts.
This is useful for Python-based build systems, deployment scripts, or any
scenario where you need to set environment variables cross-platform from Python.
"""

import subprocess
import sys
import os
from typing import Dict, List, Optional, Tuple


class CrossEnv:
    """
    Python wrapper for the Elide cross-env CLI tool.

    Provides a Pythonic interface to cross-env for setting environment
    variables in a cross-platform way.
    """

    def __init__(self, cross_env_path: str = "cross-env"):
        """
        Initialize the CrossEnv wrapper.

        Args:
            cross_env_path: Path to the cross-env binary (default: "cross-env")
        """
        self.cross_env_path = cross_env_path

    def run(
        self,
        env_vars: Dict[str, str],
        command: List[str],
        cwd: Optional[str] = None,
        capture_output: bool = False
    ) -> Tuple[int, str, str]:
        """
        Run a command with environment variables set via cross-env.

        Args:
            env_vars: Dictionary of environment variables to set
            command: Command and arguments to execute
            cwd: Working directory (optional)
            capture_output: Whether to capture stdout/stderr

        Returns:
            Tuple of (exit_code, stdout, stderr)
        """
        # Build cross-env command
        cross_env_cmd = [self.cross_env_path]

        # Add environment variables
        for key, value in env_vars.items():
            # Quote values that contain spaces
            if ' ' in value:
                cross_env_cmd.append(f'{key}="{value}"')
            else:
                cross_env_cmd.append(f'{key}={value}')

        # Add the command to execute
        cross_env_cmd.extend(command)

        # Execute
        if capture_output:
            result = subprocess.run(
                cross_env_cmd,
                cwd=cwd,
                capture_output=True,
                text=True
            )
            return result.returncode, result.stdout, result.stderr
        else:
            result = subprocess.run(cross_env_cmd, cwd=cwd)
            return result.returncode, "", ""


def example_basic_usage():
    """Example 1: Basic usage"""
    print("=== Example 1: Basic Usage ===")

    cross_env = CrossEnv()
    exit_code, stdout, stderr = cross_env.run(
        env_vars={'NODE_ENV': 'production', 'PORT': '3000'},
        command=['node', '-e', 'console.log("ENV:", process.env.NODE_ENV, "PORT:", process.env.PORT)'],
        capture_output=True
    )

    print(f"Exit code: {exit_code}")
    print(f"Output: {stdout.strip()}")
    print()


def example_build_script():
    """Example 2: Build script automation"""
    print("=== Example 2: Build Script Automation ===")

    cross_env = CrossEnv()

    # Run multiple build steps
    steps = [
        ("Linting", {'NODE_ENV': 'development'}, ['npm', 'run', 'lint']),
        ("Testing", {'NODE_ENV': 'test', 'COVERAGE': 'true'}, ['npm', 'test']),
        ("Building", {'NODE_ENV': 'production', 'MINIFY': 'true'}, ['npm', 'run', 'build'])
    ]

    for name, env_vars, command in steps:
        print(f"Running {name}...")
        print(f"  Environment: {env_vars}")
        print(f"  Command: {' '.join(command)}")
        # In a real scenario, you would run this:
        # exit_code, _, _ = cross_env.run(env_vars, command)
        # if exit_code != 0:
        #     print(f"Error: {name} failed with exit code {exit_code}")
        #     sys.exit(exit_code)
    print()


def example_database_migration():
    """Example 3: Database migration"""
    print("=== Example 3: Database Migration ===")

    cross_env = CrossEnv()

    # Run database migrations with environment-specific settings
    environments = {
        'development': {
            'NODE_ENV': 'development',
            'DB_HOST': 'localhost',
            'DB_PORT': '5432',
            'DB_NAME': 'myapp_dev'
        },
        'staging': {
            'NODE_ENV': 'staging',
            'DB_HOST': 'staging.db.example.com',
            'DB_PORT': '5432',
            'DB_NAME': 'myapp_staging'
        }
    }

    for env_name, env_vars in environments.items():
        print(f"Migrating {env_name} database...")
        print(f"  Host: {env_vars['DB_HOST']}")
        print(f"  Database: {env_vars['DB_NAME']}")
        # cross_env.run(env_vars, ['knex', 'migrate:latest'])
    print()


def example_feature_flags():
    """Example 4: Feature flag testing"""
    print("=== Example 4: Feature Flag Testing ===")

    cross_env = CrossEnv()

    # Test different feature flag combinations
    flag_configs = [
        {'name': 'All features enabled', 'flags': {'FEATURE_A': 'true', 'FEATURE_B': 'true', 'FEATURE_C': 'true'}},
        {'name': 'Only Feature A', 'flags': {'FEATURE_A': 'true', 'FEATURE_B': 'false', 'FEATURE_C': 'false'}},
        {'name': 'All features disabled', 'flags': {'FEATURE_A': 'false', 'FEATURE_B': 'false', 'FEATURE_C': 'false'}}
    ]

    for config in flag_configs:
        print(f"Testing: {config['name']}")
        print(f"  Flags: {config['flags']}")
        # cross_env.run(config['flags'], ['npm', 'test'])
    print()


def example_ci_cd_pipeline():
    """Example 5: CI/CD pipeline"""
    print("=== Example 5: CI/CD Pipeline ===")

    cross_env = CrossEnv()

    # Simulate a CI/CD pipeline
    ci_env = {
        'CI': 'true',
        'NODE_ENV': 'production',
        'BUILD_NUMBER': '123',
        'GIT_COMMIT': 'abc123',
        'DEPLOY_TARGET': 'production'
    }

    pipeline_steps = [
        ('Install dependencies', ['npm', 'ci']),
        ('Run tests', ['npm', 'test']),
        ('Build application', ['npm', 'run', 'build']),
        ('Run security audit', ['npm', 'audit']),
        ('Deploy', ['./scripts/deploy.sh'])
    ]

    print("Running CI/CD Pipeline...")
    for step_name, command in pipeline_steps:
        print(f"  Step: {step_name}")
        print(f"    Command: {' '.join(command)}")
        # exit_code, stdout, stderr = cross_env.run(ci_env, command, capture_output=True)
    print()


def example_docker_build():
    """Example 6: Docker build with environment variables"""
    print("=== Example 6: Docker Build ===")

    cross_env = CrossEnv()

    docker_env = {
        'DOCKER_BUILDKIT': '1',
        'BUILD_ENV': 'production',
        'VERSION': '1.0.0',
        'BUILD_DATE': '2024-01-01'
    }

    print("Building Docker image...")
    print(f"Environment: {docker_env}")
    # cross_env.run(docker_env, ['docker', 'build', '-t', 'myapp:latest', '.'])
    print()


def example_multi_environment_deploy():
    """Example 7: Multi-environment deployment"""
    print("=== Example 7: Multi-Environment Deployment ===")

    cross_env = CrossEnv()

    environments = {
        'development': {
            'NODE_ENV': 'development',
            'API_URL': 'http://localhost:4000',
            'DEPLOY_REGION': 'local'
        },
        'staging': {
            'NODE_ENV': 'staging',
            'API_URL': 'https://staging-api.example.com',
            'DEPLOY_REGION': 'us-west-2'
        },
        'production': {
            'NODE_ENV': 'production',
            'API_URL': 'https://api.example.com',
            'DEPLOY_REGION': 'us-east-1'
        }
    }

    target_env = 'staging'
    print(f"Deploying to {target_env}...")
    print(f"Configuration: {environments[target_env]}")
    # cross_env.run(environments[target_env], ['./scripts/deploy.sh'])
    print()


def example_performance_testing():
    """Example 8: Performance testing"""
    print("=== Example 8: Performance Testing ===")

    cross_env = CrossEnv()

    # Test with different memory configurations
    memory_configs = [
        {'MAX_OLD_SPACE': '512', 'name': '512MB'},
        {'MAX_OLD_SPACE': '1024', 'name': '1GB'},
        {'MAX_OLD_SPACE': '2048', 'name': '2GB'}
    ]

    for config in memory_configs:
        print(f"Testing with {config['name']} heap...")
        env = {'NODE_ENV': 'production', 'MAX_OLD_SPACE': config['MAX_OLD_SPACE']}
        # cross_env.run(env, ['node', f"--max-old-space-size={config['MAX_OLD_SPACE']}", 'benchmark.js'])
    print()


def example_error_handling():
    """Example 9: Error handling"""
    print("=== Example 9: Error Handling ===")

    cross_env = CrossEnv()

    try:
        # Try to run a command that might fail
        exit_code, stdout, stderr = cross_env.run(
            env_vars={'NODE_ENV': 'test'},
            command=['node', '-e', 'process.exit(1)'],
            capture_output=True
        )

        if exit_code != 0:
            print(f"Command failed with exit code: {exit_code}")
            if stderr:
                print(f"Error output: {stderr}")
        else:
            print("Command succeeded")
    except Exception as e:
        print(f"Exception occurred: {e}")
    print()


def example_integration_with_python():
    """Example 10: Integration with Python environment"""
    print("=== Example 10: Integration with Python Environment ===")

    cross_env = CrossEnv()

    # Combine Python environment variables with cross-env
    python_env = os.environ.copy()
    cross_env_vars = {
        'NODE_ENV': 'production',
        'PYTHON_VERSION': sys.version.split()[0],
        'INTEGRATION': 'true'
    }

    print("Running Node.js with Python environment context...")
    print(f"Python version: {sys.version.split()[0]}")
    print(f"Cross-env variables: {cross_env_vars}")
    # cross_env.run(cross_env_vars, ['node', 'integration-test.js'])
    print()


def main():
    """Run all examples"""
    print("Cross-Env Python Wrapper Examples")
    print("=" * 50)
    print()

    example_basic_usage()
    example_build_script()
    example_database_migration()
    example_feature_flags()
    example_ci_cd_pipeline()
    example_docker_build()
    example_multi_environment_deploy()
    example_performance_testing()
    example_error_handling()
    example_integration_with_python()

    print("=" * 50)
    print("All examples completed!")


if __name__ == '__main__':
    main()

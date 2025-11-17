#!/usr/bin/env python3
"""
Minimist Polyglot Wrapper for Python

Demonstrates integrating Elide's minimist with Python applications.
While minimist is primarily a TypeScript/JavaScript library, this shows
how to use minimist-based CLIs from Python scripts.
"""

import subprocess
import json
import sys
from typing import Dict, List, Any, Optional


class MinimistWrapper:
    """
    Python wrapper to parse arguments using minimist via subprocess.
    Useful when you have a Node.js/Elide CLI tool and want to use it from Python.
    """

    def __init__(self, minimist_cli: str = "minimist"):
        self.minimist_cli = minimist_cli

    def parse(self, args: List[str]) -> Dict[str, Any]:
        """Parse arguments using minimist CLI and return result as dict"""
        try:
            result = subprocess.run(
                [self.minimist_cli, "--compact"] + args,
                capture_output=True,
                text=True,
                check=True
            )

            # Extract JSON from output (skip "Parsed arguments:" line)
            lines = result.stdout.strip().split('\n')
            json_line = [line for line in lines if line.startswith('{')][0]
            return json.loads(json_line)
        except (subprocess.CalledProcessError, json.JSONDecodeError, IndexError) as e:
            print(f"Error parsing arguments: {e}", file=sys.stderr)
            return {"_": []}


def example_native_argparse():
    """Example 1: Using Python's native argparse (for comparison)"""
    print("=== Example 1: Python argparse (traditional) ===")

    import argparse

    parser = argparse.ArgumentParser(description='My CLI tool')
    parser.add_argument('--name', type=str, help='Name')
    parser.add_argument('--age', type=int, help='Age')
    parser.add_argument('--verbose', action='store_true', help='Verbose output')

    args = parser.parse_args(['--name', 'Bob', '--age', '25', '--verbose'])
    print(f"Name: {args.name}, Age: {args.age}, Verbose: {args.verbose}")
    print()


def example_minimist_wrapper():
    """Example 2: Using minimist via wrapper"""
    print("=== Example 2: Minimist wrapper (polyglot) ===")

    wrapper = MinimistWrapper()
    args = wrapper.parse(['--name', 'Bob', '--age', '25', '--verbose'])
    print(f"Parsed: {args}")
    print(f"Name: {args.get('name')}, Age: {args.get('age')}, Verbose: {args.get('verbose')}")
    print()


def example_build_tool():
    """Example 3: Build tool integration"""
    print("=== Example 3: Build Tool Integration ===")

    # Simulate building a project with various flags
    wrapper = MinimistWrapper()

    build_args = [
        '--config', 'build.config.js',
        '--minify',
        '--output', 'dist',
        '--target', 'es2020',
        'src/index.ts'
    ]

    args = wrapper.parse(build_args)
    print(f"Build configuration: {json.dumps(args, indent=2)}")
    print()


def example_server_cli():
    """Example 4: Server CLI arguments"""
    print("=== Example 4: Server CLI Arguments ===")

    wrapper = MinimistWrapper()

    server_args = [
        '--port', '3000',
        '--host', 'localhost',
        '--ssl',
        '--cert', './cert.pem'
    ]

    args = wrapper.parse(server_args)
    print(f"Server config: {json.dumps(args, indent=2)}")
    print()


def example_test_runner():
    """Example 5: Test runner CLI"""
    print("=== Example 5: Test Runner CLI ===")

    wrapper = MinimistWrapper()

    test_args = [
        '--watch',
        '--coverage',
        '--reporter', 'json',
        '--testPathPattern', '**/*.test.ts'
    ]

    args = wrapper.parse(test_args)
    print(f"Test config: {json.dumps(args, indent=2)}")
    print()


def example_python_cli_with_minimist():
    """Example 6: Python CLI using minimist for parsing"""
    print("=== Example 6: Python CLI using minimist ===")

    # This demonstrates a Python CLI that delegates argument parsing to minimist
    wrapper = MinimistWrapper()
    args = wrapper.parse(sys.argv[1:] if len(sys.argv) > 1 else ['--help'])

    if args.get('help') or args.get('h'):
        print("Usage: script.py [options]")
        print("Options:")
        print("  --name NAME        Your name")
        print("  --age AGE          Your age")
        print("  --verbose, -v      Verbose output")
        print("  --help, -h         Show this help")
        return

    if args.get('verbose') or args.get('v'):
        print(f"Full args: {json.dumps(args, indent=2)}")

    print(f"Hello, {args.get('name', 'stranger')}!")
    if args.get('age'):
        print(f"You are {args.get('age')} years old.")
    print()


def example_deployment_script():
    """Example 7: Deployment automation"""
    print("=== Example 7: Deployment Script ===")

    wrapper = MinimistWrapper()

    deploy_args = [
        '--env', 'production',
        '--region', 'us-east-1',
        '--no-dry-run',
        '--tags', 'v1.0.0',
        '--tags', 'latest'
    ]

    args = wrapper.parse(deploy_args)

    print("Deployment configuration:")
    print(f"  Environment: {args.get('env')}")
    print(f"  Region: {args.get('region')}")
    print(f"  Dry run: {args.get('dry-run', False)}")
    print(f"  Tags: {args.get('tags')}")
    print()


def example_docker_wrapper():
    """Example 8: Docker command wrapper"""
    print("=== Example 8: Docker Command Wrapper ===")

    wrapper = MinimistWrapper()

    docker_args = [
        '--build',
        '--tag', 'myapp:latest',
        '--platform', 'linux/amd64',
        '--no-cache',
        '.'
    ]

    args = wrapper.parse(docker_args)
    print(f"Docker build args: {json.dumps(args, indent=2)}")

    # Convert to docker command
    if args.get('build'):
        cmd = ['docker', 'build']
        if args.get('tag'):
            tags = args['tag'] if isinstance(args['tag'], list) else [args['tag']]
            for tag in tags:
                cmd.extend(['--tag', tag])
        if args.get('platform'):
            cmd.extend(['--platform', args['platform']])
        if args.get('no-cache'):
            cmd.append('--no-cache')
        cmd.extend(args.get('_', []))

        print(f"Would execute: {' '.join(cmd)}")
    print()


def example_ci_cd_integration():
    """Example 9: CI/CD pipeline integration"""
    print("=== Example 9: CI/CD Integration ===")

    wrapper = MinimistWrapper()

    ci_args = [
        '--stage', 'test',
        '--parallel', '4',
        '--retry', '3',
        '--verbose',
        '--report', 'junit.xml'
    ]

    args = wrapper.parse(ci_args)

    print("CI/CD configuration:")
    print(f"  Stage: {args.get('stage')}")
    print(f"  Parallel jobs: {args.get('parallel')}")
    print(f"  Retry count: {args.get('retry')}")
    print(f"  Verbose: {args.get('verbose', False)}")
    print(f"  Report file: {args.get('report')}")
    print()


def example_performance_comparison():
    """Example 10: Performance comparison"""
    print("=== Example 10: Performance Comparison ===")

    import time

    # Python argparse timing
    import argparse
    start = time.time()
    for _ in range(100):
        parser = argparse.ArgumentParser()
        parser.add_argument('--name')
        parser.add_argument('--age', type=int)
        args = parser.parse_args(['--name', 'Bob', '--age', '25'])
    python_time = time.time() - start

    print(f"Python argparse (100 iterations): {python_time*1000:.2f}ms")
    print(f"Average per parse: {python_time*10:.2f}ms")
    print()
    print("Note: minimist (Elide) would be faster for CLI startup")
    print("but subprocess overhead makes it slower in this tight loop.")
    print("Use minimist for actual CLI tools, argparse for Python-only scripts.")
    print()


def main():
    """Run all examples"""
    print("Minimist Python Wrapper Examples")
    print("=" * 50)
    print()

    # Run examples that don't require actual minimist CLI
    example_native_argparse()
    # example_minimist_wrapper()  # Requires minimist CLI
    example_build_tool()
    example_server_cli()
    example_test_runner()
    # example_python_cli_with_minimist()  # Interactive
    example_deployment_script()
    example_docker_wrapper()
    example_ci_cd_integration()
    example_performance_comparison()

    print("=" * 50)
    print("Examples completed!")
    print()
    print("Note: Some examples are commented out as they require")
    print("the minimist CLI to be installed and available in PATH.")


if __name__ == '__main__':
    main()

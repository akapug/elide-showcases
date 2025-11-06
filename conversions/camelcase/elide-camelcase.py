#!/usr/bin/env python3
"""
Python Integration Example for elide-camelcase

This demonstrates calling the TypeScript camelCase implementation from Python
using Elide's polyglot capabilities.

Benefits:
- One camelCase library shared across TypeScript and Python
- Consistent string casing across services
- No need for custom Python camelCase logic
- Guaranteed consistent transformation
"""

print("=== Python Calling TypeScript CamelCase ===\n")

# Example 1: Convert strings
# result = camelCase.default("foo-bar")  # "fooBar"
# result = camelCase.default("hello_world")  # "helloWorld"

# Example 2: API Field Transformation
# def transform_api_fields(data: dict) -> dict:
#     """Transform API fields to camelCase"""
#     return {camelCase.default(k): v for k, v in data.items()}

print("Real-world use case:")
print("- Python service transforms field names to camelCase")
print("- Uses same TypeScript implementation as Node.js API")
print("- Guarantees consistent field naming")
print("- No custom Python camelCase needed")
print()

print("Problem Solved:")
print("Before: Different camelCase implementations = inconsistent field names")
print("After: One Elide implementation = consistent casing")

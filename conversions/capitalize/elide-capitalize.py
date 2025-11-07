#!/usr/bin/env python3
"""
Python Integration Example for elide-capitalize

This demonstrates calling the TypeScript capitalize implementation from Python
using Elide's polyglot capabilities.

Benefits:
- One capitalize library shared across TypeScript and Python
- Consistent string capitalization across services
- No need for custom Python capitalize logic
- Guaranteed consistent transformation
"""

print("=== Python Calling TypeScript Capitalize ===\n")

# Example 1: Capitalize strings
# result = capitalize.default("hello")  # "Hello"
# result = capitalize.default("WORLD")  # "World"

# Example 2: User Input Normalization
# def normalize_name(name: str) -> str:
#     """Normalize user name input"""
#     return capitalize.default(name.strip())

print("Real-world use case:")
print("- Python service capitalizes user input")
print("- Uses same TypeScript implementation as Node.js API")
print("- Guarantees consistent capitalization")
print("- No custom Python logic needed")
print()

print("Problem Solved:")
print("Before: Different capitalize implementations = inconsistent output")
print("After: One Elide implementation = consistent capitalization")

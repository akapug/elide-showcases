#!/usr/bin/env python3
"""
Python Integration Example for elide-clamp
"""

print("=== Python Calling TypeScript Clamp ===\n")

# Example 1: Clamp numbers
# result = clamp.default(5, 0, 10)  # 5
# result = clamp.default(-5, 0, 10)  # 0
# result = clamp.default(15, 0, 10)  # 10

# Example 2: Input Validation
# def validate_percentage(value: float) -> float:
#     """Ensure percentage is 0-100"""
#     return clamp.default(value, 0, 100)

print("Real-world use case:")
print("- Python service validates numeric input")
print("- Uses same TypeScript implementation as Node.js API")
print("- Guarantees consistent boundary handling")
print()

print("Problem Solved:")
print("Before: Different clamp implementations = inconsistent validation")
print("After: One Elide implementation = consistent clamping")

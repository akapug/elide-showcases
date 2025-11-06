#!/usr/bin/env python3
"""
Python Integration Example for elide-array-flatten

This demonstrates calling the TypeScript flatten implementation from Python
using Elide's polyglot capabilities.

Benefits:
- One flatten library shared across TypeScript and Python
- Consistent array flattening across services
- No need for custom Python flatten implementations
- Guaranteed consistent depth handling
"""

# NOTE: Exact syntax depends on Elide's Python polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Python support is ready

# Assuming Elide provides something like:
# from elide import require
# flatten = require('./elide-array-flatten.ts')

print("=== Python Calling TypeScript Array Flatten ===\n")

# Example 1: Flatten nested lists
# nested = [1, [2, [3, [4, 5]]]]
# flat = flatten.default(nested)
# print(flat)  # [1, 2, 3, 4, 5]

# Example 2: Controlled depth flattening
# def normalize_data(data: list, depth: int = 1) -> list:
#     """Flatten nested data structures"""
#     return flatten.default(data, depth)

# Example 3: Data Pipeline
# def process_batch_results(results: list[list]) -> list:
#     """Flatten batch processing results"""
#     return flatten.default(results, 1)

print("Real-world use case:")
print("- Python data pipeline processes nested batch results")
print("- Uses same TypeScript implementation as Node.js API")
print("- Guarantees consistent flattening behavior")
print("- No custom Python flatten logic needed")
print()

print("Example: Data Processing Pipeline")
print("┌─────────────────────────────────────────────┐")
print("│   Elide Array Flatten (TypeScript)        │")
print("│   elide-array-flatten.ts                   │")
print("└─────────────────────────────────────────────┘")
print("         ↓                   ↓")
print("    ┌────────┐          ┌────────┐")
print("    │ Node.js│          │ Python │")
print("    │  API   │          │Pipeline│")
print("    └────────┘          └────────┘")
print("         ↓                   ↓")
print("    Same flatten behavior everywhere!")
print()

print("Problem Solved:")
print("Before: Different flatten implementations = inconsistent data shapes")
print("After: One Elide implementation = consistent flattening")
print()

print("When Elide Python API is ready, usage will be:")
print("  from elide import require")
print("  flatten = require('./elide-array-flatten.ts')")
print("  result = flatten.default([1, [2, [3]]])  # That's it!")

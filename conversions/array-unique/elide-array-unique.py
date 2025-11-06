#!/usr/bin/env python3
"""
Python Integration Example for elide-array-unique

This demonstrates calling the TypeScript unique implementation from Python
using Elide's polyglot capabilities.

Benefits:
- One unique library shared across TypeScript and Python
- Consistent deduplication across services
- No need for custom Python set conversion logic
- Guaranteed order preservation
"""

# NOTE: Exact syntax depends on Elide's Python polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Python support is ready

# Assuming Elide provides something like:
# from elide import require
# unique = require('./elide-array-unique.ts')

print("=== Python Calling TypeScript Array Unique ===\n")

# Example 1: Remove duplicates
# data = [1, 2, 2, 3, 3, 3, 4]
# unique_data = unique.default(data)
# print(unique_data)  # [1, 2, 3, 4]

# Example 2: Data Cleaning
# def clean_dataset(records: list) -> list:
#     """Remove duplicate records"""
#     return unique.default(records)

# Example 3: API Response Deduplication
# def get_unique_tags(articles: list) -> list:
#     """Get unique tags from articles"""
#     all_tags = [tag for article in articles for tag in article['tags']]
#     return unique.default(all_tags)

print("Real-world use case:")
print("- Python data pipeline removes duplicate entries")
print("- Uses same TypeScript implementation as Node.js API")
print("- Guarantees consistent deduplication behavior")
print("- No custom Python unique logic needed")
print()

print("Example: Data Deduplication Pipeline")
print("┌─────────────────────────────────────────────┐")
print("│   Elide Array Unique (TypeScript)         │")
print("│   elide-array-unique.ts                    │")
print("└─────────────────────────────────────────────┘")
print("         ↓                   ↓")
print("    ┌────────┐          ┌────────┐")
print("    │ Node.js│          │ Python │")
print("    │  API   │          │Pipeline│")
print("    └────────┘          └────────┘")
print("         ↓                   ↓")
print("    Same deduplication everywhere!")
print()

print("Problem Solved:")
print("Before: Different unique implementations = inconsistent results")
print("After: One Elide implementation = consistent deduplication")
print()

print("When Elide Python API is ready, usage will be:")
print("  from elide import require")
print("  unique = require('./elide-array-unique.ts')")
print("  result = unique.default([1, 2, 2, 3])  # [1, 2, 3]")

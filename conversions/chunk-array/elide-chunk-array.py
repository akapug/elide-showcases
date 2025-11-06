#!/usr/bin/env python3
"""
Python Integration Example for elide-chunk-array

This demonstrates calling the TypeScript chunk implementation from Python
using Elide's polyglot capabilities.

Benefits:
- One chunk library shared across TypeScript and Python
- Consistent array chunking across services
- No need for custom Python chunk logic
- Guaranteed consistent batch handling
"""

print("=== Python Calling TypeScript Chunk Array ===\n")

# Example 1: Batch processing
# data = list(range(100))
# batches = chunk.default(data, 10)  # [[0-9], [10-19], ...]

# Example 2: API Pagination
# def paginate(items: list, page_size: int = 20) -> list[list]:
#     """Paginate items for API responses"""
#     return chunk.default(items, page_size)

# Example 3: Parallel Processing
# def process_in_batches(items: list, batch_size: int = 50):
#     """Process items in parallel batches"""
#     batches = chunk.default(items, batch_size)
#     return [process_batch(batch) for batch in batches]

print("Real-world use case:")
print("- Python data pipeline chunks data for batch processing")
print("- Uses same TypeScript implementation as Node.js API")
print("- Guarantees consistent batch sizes")
print("- No custom Python chunk logic needed")
print()

print("Example: Batch Processing Pipeline")
print("┌─────────────────────────────────────────────┐")
print("│   Elide Chunk Array (TypeScript)          │")
print("│   elide-chunk-array.ts                     │")
print("└─────────────────────────────────────────────┘")
print("         ↓                   ↓")
print("    ┌────────┐          ┌────────┐")
print("    │ Node.js│          │ Python │")
print("    │  API   │          │Pipeline│")
print("    └────────┘          └────────┘")
print("         ↓                   ↓")
print("    Same batch chunking everywhere!")
print()

print("Problem Solved:")
print("Before: Different chunk implementations = inconsistent batch sizes")
print("After: One Elide implementation = consistent chunking")
print()

print("When Elide Python API is ready, usage will be:")
print("  from elide import require")
print("  chunk = require('./elide-chunk-array.ts')")
print("  batches = chunk.default(data, 10)  # That's it!")

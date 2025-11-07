#!/usr/bin/env python3
"""
Python Integration Example for elide-p-limit

This demonstrates calling the TypeScript p-limit implementation from Python
using Elide's polyglot capabilities.

Benefits:
- One p-limit implementation shared across TypeScript and Python
- Consistent concurrency limiting behavior across services
- No Python library inconsistencies
- Perfect for data pipelines and processing
"""

# NOTE: Exact syntax depends on Elide's Python polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Python support is ready

# Assuming Elide provides something like:
# from elide import require
# p-limit_module = require('./elide-p-limit.ts')

print("=== Python Calling TypeScript PLimit ===\n")

# Example 1: Basic Usage
# result = p-limit_module.default(input_data)
# print(f"Result: {result}")
# print()

# Example 2: Data Pipeline
# class DataProcessor:
#     def __init__(self):
#         self.p-limit = p-limit_module
#
#     def process_batch(self, items):
#         """Process batch using p-limit"""
#         return [self.p-limit.default(item) for item in items]
#
# processor = DataProcessor()
# data = ['item1', 'item2', 'item3']
# results = processor.process_batch(data)
# for i, result in enumerate(results, 1):
#     print(f"  Item {i}: {result}")
# print()

print("Real-world use case:")
print("- Python data pipeline uses p-limit")
print("- Uses same TypeScript implementation as Node.js API")
print("- Guarantees consistent concurrency limiting across services")
print("- Rate limit API calls")
print()

print("Example: Cross-Service Architecture")
print("┌─────────────────────────────────────────┐")
print("│   Elide PLimit (TypeScript)           │")
print("│   elide-p-limit.ts                        │")
print("└─────────────────────────────────────────┘")
print("         ↓                   ↓")
print("    ┌────────┐          ┌────────┐")
print("    │ Node.js│          │ Python │")
print("    │  API   │          │Pipeline│")
print("    └────────┘          └────────┘")
print("         ↓                   ↓")
print("    Same concurrency limiting everywhere!")
print()

print("Problem Solved:")
print("Before: Python + JavaScript = different concurrency limiting implementations")
print("After: One Elide implementation = 100% consistent behavior")
print()

print("When Elide Python API is ready, usage will be:")
print("  from elide import require")
print("  p-limit = require('./elide-p-limit.ts')")
print("  result = p-limit.default(data)")

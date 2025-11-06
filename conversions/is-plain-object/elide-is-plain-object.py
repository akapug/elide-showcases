#!/usr/bin/env python3
"""
Python Integration Example for elide-is-plain-object

This demonstrates calling the TypeScript is-plain-object implementation from Python
using Elide's polyglot capabilities.

Benefits:
- One is-plain-object implementation shared across TypeScript and Python
- Consistent object checking behavior across services
- No Python library inconsistencies
- Perfect for data pipelines and processing
"""

# NOTE: Exact syntax depends on Elide's Python polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Python support is ready

# Assuming Elide provides something like:
# from elide import require
# is-plain-object_module = require('./elide-is-plain-object.ts')

print("=== Python Calling TypeScript IsPlainObject ===\n")

# Example 1: Basic Usage
# result = is-plain-object_module.default(input_data)
# print(f"Result: {result}")
# print()

# Example 2: Data Pipeline
# class DataProcessor:
#     def __init__(self):
#         self.is-plain-object = is-plain-object_module
#
#     def process_batch(self, items):
#         """Process batch using is-plain-object"""
#         return [self.is-plain-object.default(item) for item in items]
#
# processor = DataProcessor()
# data = ['item1', 'item2', 'item3']
# results = processor.process_batch(data)
# for i, result in enumerate(results, 1):
#     print(f"  Item {i}: {result}")
# print()

print("Real-world use case:")
print("- Python data pipeline uses is-plain-object")
print("- Uses same TypeScript implementation as Node.js API")
print("- Guarantees consistent object checking across services")
print("- Validate data structures")
print()

print("Example: Cross-Service Architecture")
print("┌─────────────────────────────────────────┐")
print("│   Elide IsPlainObject (TypeScript)           │")
print("│   elide-is-plain-object.ts                        │")
print("└─────────────────────────────────────────┘")
print("         ↓                   ↓")
print("    ┌────────┐          ┌────────┐")
print("    │ Node.js│          │ Python │")
print("    │  API   │          │Pipeline│")
print("    └────────┘          └────────┘")
print("         ↓                   ↓")
print("    Same object checking everywhere!")
print()

print("Problem Solved:")
print("Before: Python + JavaScript = different object checking implementations")
print("After: One Elide implementation = 100% consistent behavior")
print()

print("When Elide Python API is ready, usage will be:")
print("  from elide import require")
print("  is-plain-object = require('./elide-is-plain-object.ts')")
print("  result = is-plain-object.default(data)")

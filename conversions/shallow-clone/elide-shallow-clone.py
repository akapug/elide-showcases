#!/usr/bin/env python3
"""
Python Integration Example for elide-shallow-clone

This demonstrates calling the TypeScript shallow-clone implementation from Python
using Elide's polyglot capabilities.

Benefits:
- One shallow-clone implementation shared across TypeScript and Python
- Consistent create a shallow copy of objects or arrays across services
- No Python custom implementation needed
- Perfect for state management, immutability, object copying
"""

# NOTE: Exact syntax depends on Elide's Python polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Python support is ready

# Assuming Elide provides something like:
# from elide import require
# shallow_clone_module = require('./elide-shallow-clone.ts')

print("=== Python Calling TypeScript shallow-clone ===\n")

# Example: Basic usage
# result = shallow_clone_module.default()
# print(f"Result: {result}")

print("Real-world use case:")
print("- Python service uses create a shallow copy of objects or arrays")
print("- Uses same TypeScript implementation as Node.js API")
print("- Guarantees consistent behavior across entire stack")
print("- Perfect for state management, immutability, object copying")
print()

print("Example: Microservices Architecture")
print("┌─────────────────────────────────────┐")
print("│   Elide shallow-clone (TypeScript)         │")
print("│   conversions/shallow-clone/elide-shallow-clone.ts│")
print("└─────────────────────────────────────┘")
print("         ↓                   ↓")
print("    ┌────────┐          ┌────────┐")
print("    │ Node.js│          │ Python │")
print("    │  API   │          │Pipeline│")
print("    └────────┘          └────────┘")
print("         ↓                   ↓")
print("    Same create a shallow copy of objects or arrays everywhere!")
print()

print("Problem Solved:")
print("Before: Python custom implementation + JavaScript = inconsistencies")
print("After: One Elide implementation = 100% consistent")
print()

print("When Elide Python API is ready, usage will be:")
print("  from elide import require")
print("  shallow_clone = require('./elide-shallow-clone.ts')")
print("  # Use it directly!")

#!/usr/bin/env python3
"""
Python Integration Example for elide-deep-equal

Benefits:
- One deep equality implementation shared across TypeScript and Python
- Consistent comparison logic across services
- Handles circular references, Dates, Maps, Sets
- No need for custom Python deep comparison
"""

print("=== Python Calling TypeScript Deep Equal ===\n")

# Example: Deep comparison
# obj1 = {'user': {'name': 'Alice', 'age': 25}}
# obj2 = {'user': {'name': 'Alice', 'age': 25}}
# equal = deep_equal.default(obj1, obj2)
# print(f"Equal: {equal}")  # True

print("Real-world use case:")
print("- Python test suite uses deep equal for assertions")
print("- Uses same TypeScript implementation as Node.js")
print("- Guarantees consistent comparison")
print()

print("When Elide Python API is ready:")
print("  from elide import require")
print("  deep_equal = require('./elide-deep-equal.ts')")
print("  assert deep_equal.default(obj1, obj2)")

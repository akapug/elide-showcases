#!/usr/bin/env python3
"""
Python Integration Example for elide-clone-deep

Benefits:
- One deep cloning implementation shared across TypeScript and Python
- Consistent cloning behavior across services
- Handles circular references, Dates, Maps, Sets
- No need for copy.deepcopy differences
"""

print("=== Python Calling TypeScript Clone Deep ===\n")

# Example: Deep clone nested dict
# original = {'user': {'name': 'Alice', 'age': 25}}
# cloned = clone_deep.default(original)
# cloned['user']['age'] = 30
# print(f"Original: {original['user']['age']}")  # 25
# print(f"Cloned: {cloned['user']['age']}")      # 30

print("Real-world use case:")
print("- Python service clones state for immutable updates")
print("- Uses same TypeScript implementation as Node.js")
print("- Guarantees consistent cloning")
print()

print("When Elide Python API is ready:")
print("  from elide import require")
print("  clone_deep = require('./elide-clone-deep.ts')")
print("  cloned = clone_deep.default({'a': {'b': 1}})")

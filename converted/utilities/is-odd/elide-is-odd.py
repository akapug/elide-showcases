#!/usr/bin/env python3
"""
Python Integration Example for elide-is-odd

This demonstrates calling the TypeScript is-odd implementation from Python
using Elide's polyglot capabilities.

Benefits:
- One is-odd implementation shared across TypeScript and Python
- Consistent odd number checking across services
- No Python custom function needed
- Perfect for data validation pipelines
"""

# NOTE: Exact syntax depends on Elide's Python polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Python support is ready

# Assuming Elide provides something like:
# from elide import require
# is_odd_module = require('./elide-is-odd.ts')

print("=== Python Calling TypeScript is-odd ===\n")

# Example 1: Basic odd number checking
# print("Basic checks:")
# print(f"is_odd(3): {is_odd_module.default(3)}")    # True
# print(f"is_odd(2): {is_odd_module.default(2)}")    # False
# print(f"is_odd(7): {is_odd_module.default(7)}")    # True
# print(f"is_odd(-1): {is_odd_module.default(-1)}")  # True
# print()

# Example 2: Filter odd numbers from list
# numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
# odd_numbers = [n for n in numbers if is_odd_module.default(n)]
# print(f"Odd numbers from {numbers}:")
# print(f"  {odd_numbers}")
# print()

# Example 3: Data validation pipeline
# def validate_lottery_number(num):
#     """Validate lottery numbers (must be odd)"""
#     if not is_odd_module.default(num):
#         raise ValueError(f"Lottery number {num} must be odd")
#     return num
#
# try:
#     valid_num = validate_lottery_number(7)
#     print(f"Valid lottery number: {valid_num}")
#     validate_lottery_number(4)  # Will raise error
# except ValueError as e:
#     print(f"Validation error: {e}")
# print()

# Example 4: Batch processing
# data_records = [
#     {'id': 1, 'value': 10},
#     {'id': 2, 'value': 20},
#     {'id': 3, 'value': 30},
#     {'id': 4, 'value': 40},
#     {'id': 5, 'value': 50}
# ]
#
# odd_id_records = [r for r in data_records if is_odd_module.default(r['id'])]
# print("Records with odd IDs:")
# for record in odd_id_records:
#     print(f"  ID {record['id']}: value={record['value']}")
# print()

# Example 5: Alternating patterns
# def generate_pattern(length):
#     """Generate alternating pattern based on odd/even index"""
#     pattern = []
#     for i in range(length):
#         if is_odd_module.default(i):
#             pattern.append('X')
#         else:
#             pattern.append('O')
#     return ''.join(pattern)
#
# pattern = generate_pattern(10)
# print(f"Pattern (O=even index, X=odd index): {pattern}")
# print()

print("Real-world use case:")
print("- Python data validation checks if numbers are odd")
print("- Uses same TypeScript implementation as Node.js API")
print("- Guarantees consistent odd/even logic across entire stack")
print("- No need for custom Python odd checking")
print()

print("Example: Data Processing Pipeline")
print("┌─────────────────────────────────────┐")
print("│   Elide is-odd (TypeScript)        │")
print("│   conversions/is-odd/elide-is-odd.ts│")
print("└─────────────────────────────────────┘")
print("         ↓                   ↓")
print("    ┌────────┐          ┌────────┐")
print("    │ Node.js│          │ Python │")
print("    │  API   │          │Pipeline│")
print("    └────────┘          └────────┘")
print("         ↓                   ↓")
print("    Same odd checking logic!")
print()

print("Problem Solved:")
print("Before: Python (n % 2 == 1) + JavaScript custom logic = potential inconsistencies")
print("After: One Elide implementation = 100% consistent odd checking")
print()

print("Performance Benefits:")
print("- Zero overhead with Elide")
print("- Instant odd checking")
print("- Shared runtime across languages")
print()

print("When Elide Python API is ready, usage will be:")
print("  from elide import require")
print("  is_odd = require('./elide-is-odd.ts')")
print("  result = is_odd.default(3)  # That's it!")

#!/usr/bin/env python3
"""
Python Integration Example for elide-diff

This demonstrates calling the TypeScript diff implementation from Python
using Elide's polyglot capabilities.

Benefits:
- One diff library shared across TypeScript and Python
- Consistent text comparison across services
- No Python difflib needed for many cases
- Guaranteed diff output consistency
"""

# NOTE: Exact syntax depends on Elide's Python polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Python support is ready

# Assuming Elide provides something like:
# from elide import require
# diff = require('./elide-diff.ts')

print("=== Python Calling TypeScript Diff Library ===\n")

# Example 1: Compare two text files
# old_content = open('old_file.txt').read()
# new_content = open('new_file.txt').read()
# changes = diff.diffLines(old_content, new_content)
# for change in changes:
#     prefix = '+ ' if change.get('added') else '- ' if change.get('removed') else '  '
#     print(f"{prefix}{change['value']}")

# Example 2: Data Validation
# def validate_changes(old_data: dict, new_data: dict) -> list:
#     """Validate changes between data snapshots"""
#     old_json = json.dumps(old_data, indent=2)
#     new_json = json.dumps(new_data, indent=2)
#     return diff.diffLines(old_json, new_json)

# Example 3: Test Assertion
# def assert_content_similar(expected: str, actual: str, threshold=0.9):
#     """Assert content is similar within threshold"""
#     similarity = diff.calculateSimilarity(expected, actual)
#     assert similarity >= threshold * 100, f"Content too different: {similarity}%"

print("Real-world use case:")
print("- Python data pipeline compares dataset versions")
print("- Uses same TypeScript implementation as Node.js API")
print("- Guarantees consistent diff format for audit logs")
print("- No need to install Python difflib for basic diffs")
print()

print("Example: Data Versioning System")
print("┌─────────────────────────────────────────────┐")
print("│   Elide Diff (TypeScript)                  │")
print("│   elide-diff.ts                            │")
print("└─────────────────────────────────────────────┘")
print("         ↓                   ↓")
print("    ┌────────┐          ┌────────┐")
print("    │ Node.js│          │ Python │")
print("    │  API   │          │Pipeline│")
print("    └────────┘          └────────┘")
print("         ↓                   ↓")
print("    Same diff output everywhere!")
print()

print("Problem Solved:")
print("Before: Different diff algorithms = inconsistent change detection")
print("After: One Elide implementation = consistent diffs")
print()

print("When Elide Python API is ready, usage will be:")
print("  from elide import require")
print("  diff = require('./elide-diff.ts')")
print("  changes = diff.diffLines(old, new)  # That's it!")

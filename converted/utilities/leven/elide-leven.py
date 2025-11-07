#!/usr/bin/env python3
"""
Python Integration Example for elide-leven

This demonstrates calling the TypeScript Levenshtein distance implementation
from Python using Elide's polyglot capabilities.

Benefits:
- One string distance implementation shared across TypeScript and Python
- Consistent fuzzy matching across services
- No Python Levenshtein library needed
- Perfect for spell checkers, fuzzy search, autocomplete
"""

# NOTE: Exact syntax depends on Elide's Python polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Python support is ready

# Assuming Elide provides something like:
# from elide import require
# leven_module = require('./elide-leven.ts')

print("=== Python Calling TypeScript Levenshtein Distance ===\n")

# Example 1: Basic String Distance
# distance = leven_module.default('cat', 'hat')
# print(f"Distance between 'cat' and 'hat': {distance}")
# print()

# Example 2: Spell Checker for User Input
# def spell_check(word, dictionary):
#     """Find closest match in dictionary"""
#     best_match = leven_module.closestMatch(word, dictionary)
#     if best_match:
#         distance = leven_module.default(word, best_match)
#         return best_match, distance
#     return None, None
#
# dictionary = ['python', 'typescript', 'javascript', 'rust', 'golang']
# typo = 'typescrpit'
# suggestion, dist = spell_check(typo, dictionary)
# print(f"User typed: '{typo}'")
# print(f"Did you mean: '{suggestion}' (distance: {dist})")
# print()

# Example 3: Fuzzy Search for Product Names
# class ProductSearch:
#     def __init__(self):
#         self.products = [
#             'iPhone 15 Pro',
#             'Samsung Galaxy S24',
#             'Google Pixel 8',
#             'OnePlus 12',
#             'Xiaomi 14 Ultra'
#         ]
#
#     def search(self, query, max_distance=3):
#         """Search products with fuzzy matching"""
#         results = []
#         for product in self.products:
#             distance = leven_module.default(
#                 query.lower(),
#                 product.lower(),
#                 {'maxDistance': max_distance}
#             )
#             if distance <= max_distance:
#                 results.append((product, distance))
#         return sorted(results, key=lambda x: x[1])
#
# search_engine = ProductSearch()
# query = 'ipone 15'  # Typo in search
# results = search_engine.search(query)
# print(f"Search query: '{query}'")
# print("Results:")
# for product, distance in results:
#     print(f"  - {product} (distance: {distance})")
# print()

# Example 4: Data Deduplication
# def deduplicate_names(names, threshold=2):
#     """Find and group similar names"""
#     seen = set()
#     duplicates = []
#
#     for i, name1 in enumerate(names):
#         if name1 in seen:
#             continue
#         group = [name1]
#         seen.add(name1)
#
#         for name2 in names[i+1:]:
#             if name2 in seen:
#                 continue
#             distance = leven_module.default(name1.lower(), name2.lower())
#             if distance <= threshold:
#                 group.append(name2)
#                 seen.add(name2)
#
#         if len(group) > 1:
#             duplicates.append(group)
#
#     return duplicates
#
# customer_names = [
#     'John Smith',
#     'Jon Smith',
#     'Jane Doe',
#     'Jane Do',
#     'Bob Johnson',
#     'Robert Johnson'
# ]
# groups = deduplicate_names(customer_names)
# print("Potential duplicate customer names:")
# for group in groups:
#     print(f"  {' ≈ '.join(group)}")
# print()

# Example 5: Command-Line Suggestion
# def suggest_command(user_input, available_commands):
#     """Suggest correct command for CLI typos"""
#     suggestion = leven_module.closestMatch(
#         user_input,
#         available_commands,
#         {'maxDistance': 3}
#     )
#     return suggestion
#
# commands = ['install', 'build', 'test', 'deploy', 'run', 'dev']
# user_cmd = 'isntall'  # Common typo
# suggestion = suggest_command(user_cmd, commands)
# if suggestion:
#     print(f"Command '{user_cmd}' not found.")
#     print(f"Did you mean '{suggestion}'?")
# print()

print("Real-world use cases:")
print("- Spell checkers and autocomplete systems")
print("- Fuzzy search in e-commerce catalogs")
print("- Data deduplication and record linkage")
print("- CLI command suggestions")
print("- Natural language processing pipelines")
print()

print("Example: E-Commerce Search")
print("┌─────────────────────────────────────┐")
print("│   Elide Leven (TypeScript)         │")
print("│   conversions/leven/elide-leven.ts │")
print("└─────────────────────────────────────┘")
print("         ↓                   ↓")
print("    ┌────────┐          ┌────────┐")
print("    │ Node.js│          │ Python │")
print("    │  API   │          │ Search │")
print("    └────────┘          └────────┘")
print("         ↓                   ↓")
print("    Same fuzzy matching everywhere!")
print()

print("Problem Solved:")
print("Before: Python Levenshtein + JS leven = different algorithms")
print("After: One Elide implementation = 100% consistent distances")
print()

print("Performance Benefits:")
print("- Zero cold start overhead with Elide")
print("- Instant distance calculations")
print("- Shared runtime across languages")
print("- Optimized algorithm with early termination")
print()

print("When Elide Python API is ready, usage will be:")
print("  from elide import require")
print("  leven = require('./elide-leven.ts')")
print("  distance = leven.default('cat', 'hat')  # That's it!")

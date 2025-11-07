#!/usr/bin/env python3
"""
Python Integration Example for elide-string-similarity

This demonstrates calling the TypeScript string similarity implementation from Python
using Elide's polyglot capabilities.

Benefits:
- One string matching implementation shared across TypeScript and Python
- Consistent fuzzy matching across services
- No Python similarity library needed
- Multiple algorithms in one package
"""

# NOTE: Exact syntax depends on Elide's Python polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Python support is ready

# Assuming Elide provides something like:
# from elide import require
# similarity = require('./elide-string-similarity.ts')

print("=== Python Calling TypeScript String Similarity ===\n")

# Example 1: Basic similarity comparison
# similarity_score = similarity.compareTwoStrings("hello world", "hello word")
# print(f"Similarity: {similarity_score:.3f}")
# print()

# Example 2: Find best match for search
# search_term = "apple"
# options = ["apples", "banana", "app", "application", "pear"]
# result = similarity.findBestMatch(search_term, options)
# print(f"Search: '{search_term}'")
# print(f"Best match: '{result['bestMatch']['target']}' ({result['bestMatch']['rating']:.3f})")
# print()

# Example 3: Data deduplication in Python
# def find_duplicates(items, threshold=0.8):
#     duplicates = []
#     for i in range(len(items)):
#         for j in range(i + 1, len(items)):
#             score = similarity.compareTwoStrings(items[i], items[j])
#             if score >= threshold:
#                 duplicates.append((items[i], items[j], score))
#     return duplicates
#
# products = ["iPhone 13", "i-Phone 13", "Samsung Galaxy", "iPhone 13 Pro"]
# dupes = find_duplicates(products)
# print("Possible duplicates:")
# for item1, item2, score in dupes:
#     print(f"  '{item1}' ≈ '{item2}' ({score:.3f})")
# print()

# Example 4: Search autocomplete
# def autocomplete(query, database, limit=5):
#     results = similarity.findBestMatch(query, database)
#     matches = [r for r in results['ratings'] if r['rating'] > 0.3]
#     matches.sort(key=lambda x: x['rating'], reverse=True)
#     return matches[:limit]
#
# database = ["python", "javascript", "typescript", "java", "ruby", "rust", "go"]
# query = "javascrip"
# suggestions = autocomplete(query, database)
# print(f"Autocomplete for '{query}':")
# for match in suggestions:
#     print(f"  {match['target']}: {match['rating']:.2f}")
# print()

# Example 5: Name matching
# def match_customer(name, customer_database):
#     result = similarity.findBestMatch(name, customer_database)
#     best = result['bestMatch']
#     if best['rating'] > 0.7:
#         return best['target']
#     return None
#
# customers = ["John Smith", "Jane Doe", "Bob Johnson", "Alice Williams"]
# search = "Jon Smith"
# match = match_customer(search, customers)
# print(f"Looking for: '{search}'")
# print(f"Best match: '{match}'" if match else "No close match found")
# print()

print("Real-world use case:")
print("- Python API needs fuzzy search for product names")
print("- Uses same TypeScript implementation as Node.js frontend")
print("- Guarantees consistent matching logic across entire stack")
print("- No need to install Python similarity library")
print()

print("Example: E-commerce Search")
print("┌─────────────────────────────────────────┐")
print("│   Elide String Similarity (TypeScript) │")
print("│   elide-string-similarity.ts           │")
print("└─────────────────────────────────────────┘")
print("         ↓                   ↓")
print("    ┌────────┐          ┌────────┐")
print("    │ Node.js│          │ Python │")
print("    │Frontend│          │  API   │")
print("    └────────┘          └────────┘")
print("         ↓                   ↓")
print("    Same fuzzy matching everywhere!")
print()

print("Problem Solved:")
print("Before: Different similarity libs in TS and Python = inconsistent results")
print("After: One Elide implementation = identical matching across services")
print()

print("Performance Benefits:")
print("- Zero cold start overhead with Elide")
print("- Instant fuzzy matching")
print("- Shared runtime across languages")
print("- No Python library installation needed")
print()

print("When Elide Python API is ready, usage will be:")
print("  from elide import require")
print("  similarity = require('./elide-string-similarity.ts')")
print("  score = similarity.compareTwoStrings('hello', 'hallo')")
print("  print(f'Similarity: {score}')  # That's it!")

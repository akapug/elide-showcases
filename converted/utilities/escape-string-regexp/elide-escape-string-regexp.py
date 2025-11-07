#!/usr/bin/env python3
"""
Python Integration Example for elide-escape-string-regexp

Escape RegExp special characters in strings from Python using Elide's polyglot capabilities.

Use cases: dynamic regex patterns, user input search, text highlighting
"""

print("=== Python Calling TypeScript Escape String RegExp ===\n")

# Example 1: Dynamic Search Pattern
# from elide import require
# escape_module = require('./elide-escape-string-regexp.ts')
#
# def search_in_text(text, user_input):
#     escaped = escape_module.default(user_input)
#     regex = re.compile(escaped, re.IGNORECASE)
#     return regex.search(text) is not None
#
# text = "The price is $100.00"
# found = search_in_text(text, "$100.00")
# print(f"Search for '$100.00': {found}")

# Example 2: Text Highlighting
# def highlight_text(content, search_term):
#     escaped = escape_module.default(search_term)
#     regex = re.compile(escaped, re.IGNORECASE)
#     return regex.sub(lambda m: f"**{m.group()}**", content)
#
# content = "JavaScript is awesome. I love JavaScript!"
# highlighted = highlight_text(content, "JavaScript")
# print(f"Highlighted: {highlighted}")

# Example 3: Find and Replace
# def safe_replace(text, find, replace):
#     escaped = escape_module.default(find)
#     regex = re.compile(escaped)
#     return regex.sub(replace, text)
#
# doc = "File: data.txt\\nFile: backup.txt"
# replaced = safe_replace(doc, "File:", "Document:")
# print(f"Replaced: {replaced}")

# Example 4: Form Validation
# class SearchValidator:
#     SPECIAL_CHARS = set("^$\\.*+?()[]{}|")
#     
#     def sanitize_search_input(self, user_input):
#         return escape_module.default(user_input)
#     
#     def has_special_chars(self, text):
#         return escape_module.hasSpecialChars(text)

# Example 5: Django Search View
# from django.db.models import Q
#
# def search_products(request):
#     query = request.GET.get('q', '')
#     escaped = escape_module.default(query)
#     regex = f".*{escaped}.*"
#     products = Product.objects.filter(name__iregex=regex)
#     return products

print("Real-world use cases:")
print("- Dynamic regex pattern building")
print("- User input search functionality")
print("- Text highlighting and marking")
print("- Find and replace operations")
print("- Form validation and sanitization")
print()

print("Example: Flask Search API")
print("┌──────────────────────────────────────┐")
print("│   Elide Escape RegExp (TypeScript)  │")
print("│   elide-escape-string-regexp.ts     │")
print("└──────────────────────────────────────┘")
print("         ↓                   ↓")
print("    ┌────────┐          ┌────────┐")
print("    │ Node.js│          │ Python │")
print("    │  API   │          │ Flask  │")
print("    └────────┘          └────────┘")
print("         ↓                   ↓")
print("    Same safe regex everywhere!")
print()

print("Problem Solved:")
print("Before: Python re.escape + JS escape-string-regexp = different edge cases")
print("After: One Elide implementation = consistent escaping")
print()

print("When Elide Python API is ready, usage will be:")
print("  from elide import require")
print("  escape = require('./elide-escape-string-regexp.ts')")
print("  safe_pattern = escape.default(user_input)")

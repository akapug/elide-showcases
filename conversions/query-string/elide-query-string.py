#!/usr/bin/env python3
"""
Python Integration Example for elide-query-string (URL Query String Parser)

Demonstrates calling the TypeScript query-string implementation from Python
for consistent URL parameter handling across all services.

Benefits:
- One query string parser shared across TypeScript and Python
- Consistent API parameter parsing across services
- No need for urllib.parse.parse_qs quirks
- Unified array and nested object handling
"""

# NOTE: Exact syntax depends on Elide's Python polyglot API (currently alpha)
# from elide import require
# qs = require('./elide-query-string.ts')

print("=== Python Calling TypeScript Query String Parser ===\n")

# Example 1: Parse URL query string
# query = "?name=John&age=30&city=NYC&active=true"
# params = qs.parse(query)
# print(f"Query: {query}")
# print(f"Parsed: {params}")
# # Output: {'name': 'John', 'age': 30, 'city': 'NYC', 'active': True}

# Example 2: Stringify parameters
# params = {'search': 'elide runtime', 'page': 1, 'limit': 20}
# query_string = qs.stringify(params)
# print(f"Parameters: {params}")
# print(f"Query string: {query_string}")
# # Output: search=elide%20runtime&page=1&limit=20

# Example 3: Handle arrays (consistent with Node.js!)
# query = "tags=python&tags=typescript&tags=polyglot"
# parsed = qs.parse(query)
# print(f"Array query: {query}")
# print(f"Parsed: {parsed}")
# # Output: {'tags': ['python', 'typescript', 'polyglot']}

# Example 4: Flask API with consistent query parsing
# from flask import Flask, request
# app = Flask(__name__)
#
# @app.route('/api/search')
# def search():
#     # Instead of Flask's request.args:
#     # params = qs.parse(request.query_string.decode())
#     #
#     # Same parsing as Node.js Express API!
#     # search_term = params.get('q')
#     # filters = params.get('filters')  # Array support
#     # page = params.get('page', 1)     # Number parsed
#     #
#     # return jsonify(results=perform_search(search_term, filters, page))

# Example 5: Django views
# from django.http import JsonResponse
#
# def product_list(request):
#     # Parse query parameters identically to Node.js service
#     # params = qs.parse(request.META['QUERY_STRING'])
#     #
#     # category = params.get('category')
#     # brands = params.get('brands')  # Arrays work!
#     # min_price = params.get('minPrice')
#     # max_price = params.get('maxPrice')
#     #
#     # products = Product.objects.filter(
#     #     category=category,
#     #     brand__in=brands,
#     #     price__gte=min_price,
#     #     price__lte=max_price
#     # )
#     #
#     # return JsonResponse({'products': list(products.values())})

# Example 6: API client with consistent params
# import requests
#
# def call_microservice(endpoint, params):
#     # Build query string using same logic as Node.js client
#     query = qs.stringify(params, {'arrayFormat': 'bracket', 'sort': True})
#     url = f"https://api.example.com/{endpoint}?{query}"
#     response = requests.get(url)
#     return response.json()
#
# # Usage
# results = call_microservice('search', {
#     'q': 'elide',
#     'filters': ['polyglot', 'runtime'],
#     'page': 1,
#     'limit': 20
# })

print("Real-world use case:")
print("- Python Flask API reads query: ?filters=python&filters=java&page=1")
print("- Uses same query-string parser as Node.js Express API")
print("- Guarantees identical parameter parsing across entire platform")
print()

print("Example: API Parameter Consistency")
print("┌──────────────────────────────────────┐")
print("│  Elide Query String (TypeScript)    │")
print("│  conversions/query-string/           │")
print("└──────────────────────────────────────┘")
print("         ↓                    ↓")
print("    ┌─────────┐          ┌─────────┐")
print("    │ Node.js │          │ Python  │")
print("    │ Express │          │ Flask   │")
print("    └─────────┘          └─────────┘")
print("     GET /api/search?q=elide&tags[]=js&tags[]=py")
print("     Both parse identically:")
print("     { q: 'elide', tags: ['js', 'py'] }")
print("     ✓ Perfect consistency!")
print()

print("Problem Solved:")
print("Before: Node.js + Python parse query strings differently")
print("  - Node.js: qs.parse('tags=a&tags=b') → {tags: ['a', 'b']}")
print("  - Python: parse_qs('tags=a&tags=b') → {'tags': ['a', 'b']}  # List always!")
print("  - Different defaults, different behavior = BUGS")
print()
print("After: One Elide implementation = identical parsing")
print("  - Both languages use same TypeScript parser")
print("  - Same options, same behavior, same results")
print("  - Zero query parameter inconsistency bugs")
print()

print("Configuration Example:")
print("  # API Gateway config (shared by all services)")
print("  query_parsing:")
print("    arrayFormat: 'bracket'  # tags[]=a&tags[]=b")
print("    parseNumbers: true      # page=1 → number")
print("    parseBooleans: true     # active=true → boolean")
print("  ")
print("  # Both Node.js and Python use identical settings:")
print("  params = qs.parse(queryString, config)")
print()

print("Use Cases:")
print("  ✓ REST API parameter parsing (Flask, FastAPI, Django)")
print("  ✓ Microservice URL building (consistent with Node.js)")
print("  ✓ Search query handling (arrays, filters, pagination)")
print("  ✓ Form data processing (web scraping, automation)")
print("  ✓ API testing (verify query parameter handling)")
print()

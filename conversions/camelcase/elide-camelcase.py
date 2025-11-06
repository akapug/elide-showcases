#!/usr/bin/env python3
"""
Python Integration Example for elide-camelcase
This demonstrates calling the TypeScript camelCase implementation from Python.
Benefits: Consistent API response transformation across TypeScript and Python services.
"""

# from elide import require
# camel_case = require('./elide-camelcase.ts')

print("=== Python Calling TypeScript camelCase ===\n")

# Example 1: API Response Transformation
# def transform_keys_to_camel(data):
#     """Transform dictionary keys to camelCase"""
#     if isinstance(data, dict):
#         return {camel_case.default(key): transform_keys_to_camel(value)
#                 for key, value in data.items()}
#     return data
#
# db_record = {'user_name': 'John', 'email_address': 'john@example.com', 'is_active': True}
# api_response = transform_keys_to_camel(db_record)
# # Result: {'userName': 'John', 'emailAddress': 'john@example.com', 'isActive': True}

print("Real-world use cases:")
print("- API response transformation (snake_case DB → camelCase JSON)")
print("- Code generation (template variables → camelCase identifiers)")
print("- Configuration key normalization")
print()

print("When Elide Python API is ready:")
print("  camel_case = require('./elide-camelcase.ts')")
print("  camel_case.default('user_name')  # 'userName'")

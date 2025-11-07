#!/usr/bin/env python3
"""
Python Integration Example for elide-is-primitive

This demonstrates calling the TypeScript primitive type checker from Python
using Elide's polyglot capabilities.

Benefits:
- One type checker shared across TypeScript and Python
- Consistent primitive validation across services
- Zero dependencies in both languages
- Perfect for data validation, serialization, API validation
"""

print("=== Python Calling TypeScript is-primitive ===\n")

# NOTE: Exact syntax depends on Elide's Python polyglot API
# Assuming: from elide import require
#           is_primitive = require('./elide-is-primitive.ts')

# Example 1: Basic Type Validation
# def validate_types():
#     """Check various types"""
#     test_values = [
#         5, "hello", True, None, [], {}, 
#         lambda x: x, 3.14, False, ""
#     ]
#     
#     print("Type validation:")
#     for val in test_values:
#         result = is_primitive.default(val)
#         print(f"  {repr(val)}: {'primitive' if result else 'object/function'}")
#     print()

# Example 2: API Input Validation
# class APIValidator:
#     @staticmethod
#     def validate_primitive_fields(data, fields):
#         """Validate that specified fields contain primitives"""
#         errors = []
#         for field in fields:
#             if field in data:
#                 if not is_primitive.default(data[field]):
#                     errors.append(f"{field} must be primitive type")
#         return errors
#
# data = {"name": "John", "age": 30, "settings": {}}
# errors = APIValidator.validate_primitive_fields(data, ["name", "age", "settings"])
# print(f"Validation errors: {errors}")
# print()

# Example 3: Serialization Check
# def can_serialize_directly(value):
#     """Check if value can be serialized without transformation"""
#     return is_primitive.default(value)
#
# print("Serialization check:")
# values = [42, "text", None, [], {}]
# for val in values:
#     can_ser = can_serialize_directly(val)
#     print(f"  {repr(val)}: {'direct' if can_ser else 'needs transform'}")
# print()

# Example 4: Deep Clone Detection
# class CloneHelper:
#     @staticmethod
#     def clone(obj):
#         """Clone object or return primitive directly"""
#         if is_primitive.default(obj):
#             return obj  # Primitives don't need cloning
#         elif isinstance(obj, dict):
#             return {k: CloneHelper.clone(v) for k, v in obj.items()}
#         elif isinstance(obj, list):
#             return [CloneHelper.clone(item) for item in obj]
#         else:
#             return obj
#
# data = {"name": "test", "count": 5, "nested": {"val": 10}}
# cloned = CloneHelper.clone(data)
# print(f"Cloned: {cloned}")
# print()

# Example 5: Cache Key Generator
# def generate_cache_key(params):
#     """Generate cache key from primitive params only"""
#     primitive_params = {
#         k: v for k, v in params.items() 
#         if is_primitive.default(v)
#     }
#     return str(sorted(primitive_params.items()))
#
# params = {"id": 1, "name": "test", "callback": lambda: None}
# cache_key = generate_cache_key(params)
# print(f"Cache key: {cache_key}")
# print()

print("Real-world use cases:")
print("- API input validation")
print("- Serialization checks for JSON/DB")
print("- Deep clone optimization")
print("- Cache key generation")
print("- Type guards for primitives")
print("- Data sanitization")
print()

print("Problem Solved:")
print("Before: Different primitive checks in TypeScript vs Python")
print("After: One Elide implementation = consistent behavior")
print()

print("When Elide Python API is ready:")
print("  from elide import require")
print("  is_primitive = require('./elide-is-primitive.ts')")
print("  result = is_primitive.default(5)  # True")

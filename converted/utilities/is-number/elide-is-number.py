#!/usr/bin/env python3
"""
Python Integration Example for elide-is-number

This demonstrates calling the TypeScript number validation implementation
from Python using Elide's polyglot capabilities.

Benefits:
- One number validation implementation shared across TypeScript and Python
- Consistent validation rules across services
- No Python validation library needed
- Perfect for form validation, API input validation
"""

# NOTE: Exact syntax depends on Elide's Python polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Python support is ready

# Assuming Elide provides something like:
# from elide import require
# is_number_module = require('./elide-is-number.ts')

print("=== Python Calling TypeScript Number Validation ===\n")

# Example 1: Basic Number Validation
# print(f"is_number_module.default(5): {is_number_module.default(5)}")
# print(f"is_number_module.default('5'): {is_number_module.default('5')}")
# print(f"is_number_module.default('foo'): {is_number_module.default('foo')}")
# print()

# Example 2: Form Input Validation
# def validate_form_input(data):
#     """Validate form inputs"""
#     errors = []
#
#     if 'age' in data and not is_number_module.default(data['age']):
#         errors.append('Age must be a valid number')
#
#     if 'price' in data and not is_number_module.default(data['price']):
#         errors.append('Price must be a valid number')
#
#     if 'quantity' in data and not is_number_module.default(data['quantity']):
#         errors.append('Quantity must be a valid number')
#
#     return errors
#
# form_data = {
#     'age': '25',
#     'price': '19.99',
#     'quantity': 'invalid'
#  }
# errors = validate_form_input(form_data)
# print("Form validation errors:")
# for error in errors:
#     print(f"  - {error}")
# print()

# Example 3: API Request Validation
# from flask import Flask, request, jsonify
#
# app = Flask(__name__)
#
# @app.route('/api/products')
# def get_products():
#     page = request.args.get('page', '1')
#     limit = request.args.get('limit', '10')
#
#     if not is_number_module.default(page):
#         return jsonify({'error': 'Invalid page parameter'}), 400
#
#     if not is_number_module.default(limit):
#         return jsonify({'error': 'Invalid limit parameter'}), 400
#
#     # Process request...
#     return jsonify({'products': [], 'page': int(page), 'limit': int(limit)})

# Example 4: Data Cleaning Pipeline
# def clean_data(records):
#     """Clean numeric fields in data pipeline"""
#     cleaned = []
#
#     for record in records:
#         if 'price' in record:
#             if is_number_module.default(record['price']):
#                 record['price'] = float(record['price'])
#             else:
#                 record['price'] = None  # Mark as invalid
#
#         if 'quantity' in record:
#             if is_number_module.default(record['quantity']):
#                 record['quantity'] = int(record['quantity'])
#             else:
#                 record['quantity'] = 0  # Default to 0
#
#         cleaned.append(record)
#
#     return cleaned
#
# raw_data = [
#     {'product': 'Widget', 'price': '19.99', 'quantity': '10'},
#     {'product': 'Gadget', 'price': 'N/A', 'quantity': '5'},
#     {'product': 'Tool', 'price': '29.99', 'quantity': 'invalid'}
# ]
# cleaned = clean_data(raw_data)
# print("Cleaned data:")
# for item in cleaned:
#     print(f"  {item}")
# print()

# Example 5: Django Model Validation
# from django import forms
#
# class ProductForm(forms.Form):
#     name = forms.CharField(max_length=100)
#     price = forms.CharField()
#     quantity = forms.CharField()
#
#     def clean_price(self):
#         price = self.cleaned_data['price']
#         if not is_number_module.default(price):
#             raise forms.ValidationError('Price must be a valid number')
#         return float(price)
#
#     def clean_quantity(self):
#         quantity = self.cleaned_data['quantity']
#         if not is_number_module.default(quantity):
#             raise forms.ValidationError('Quantity must be a valid number')
#         return int(quantity)

# Example 6: Filter Numeric Values
# def filter_numeric_values(mixed_list):
#     """Filter list to only numeric values"""
#     return [x for x in mixed_list if is_number_module.default(x)]
#
# mixed = [1, '2', 'foo', None, 5.5, NaN, 'bar', '10', True]
# numeric = filter_numeric_values(mixed)
# print(f"Mixed list: {mixed}")
# print(f"Numeric only: {numeric}")
# print()

print("Real-world use cases:")
print("- Form input validation (age, price, quantity)")
print("- API parameter validation (page, limit, offset)")
print("- Data cleaning pipelines (CSV, JSON imports)")
print("- Configuration validation (ports, timeouts)")
print("- Database input sanitization")
print()

print("Example: Flask API Validation")
print("┌─────────────────────────────────────┐")
print("│   Elide is-number (TypeScript)     │")
print("│   elide-is-number.ts               │")
print("└─────────────────────────────────────┘")
print("         ↓                   ↓")
print("    ┌────────┐          ┌────────┐")
print("    │ Node.js│          │ Python │")
print("    │  API   │          │ Flask  │")
print("    └────────┘          └────────┘")
print("         ↓                   ↓")
print("    Same validation everywhere!")
print()

print("Problem Solved:")
print("Before: Python isinstance(x, (int, float)) + JS isNumber = different rules")
print("After: One Elide implementation = 100% consistent validation")
print()

print("Edge Cases Handled:")
print("  ✓ NaN → false")
print("  ✓ Infinity → false")
print("  ✓ Numeric strings → true")
print("  ✓ Whitespace → false")
print("  ✓ null/undefined → false")
print()

print("When Elide Python API is ready, usage will be:")
print("  from elide import require")
print("  is_number = require('./elide-is-number.ts')")
print("  if is_number.default('123'): print('Valid!')")

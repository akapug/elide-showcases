#!/usr/bin/env python3
"""
Pluralize - Python Integration Example

Demonstrates using Elide's pluralize/singularize from Python.
Perfect for UI text, API responses, and form generation.
"""

# When Elide's Python API is ready:
# from elide import require
# pluralize_module = require('./elide-pluralize.ts')

print("📝 Pluralize - Python Integration Example\n")
print("Once Elide's Python API is available:")
print("  from elide import require")
print("  pluralize = require('./elide-pluralize.ts')\n")

print("=== Example 1: Django Model Display Names ===")
print("# Auto-generate plural model names")
print("class User(models.Model):")
print("    class Meta:")
print("        # pluralize_module.default('User') → 'Users'")
print("        verbose_name_plural = 'Users'")
print()

print("=== Example 2: REST API Responses ===")
print("# Dynamic response messages")
print("def list_items(count, item_type):")
print("    word = pluralize_module.pluralize(item_type, count)")
print("    return {'message': f'{count} {word} found'}")
print()
print("# list_items(1, 'user')  → '1 user found'")
print("# list_items(5, 'user')  → '5 users found'")
print()

print("=== Example 3: Flask Form Labels ===")
print("# Generate form labels dynamically")
print("@app.route('/items/<item_type>')")
print("def show_items(item_type, count):")
print("    label = pluralize_module.pluralize(item_type, count)")
print("    return render_template('items.html', label=label)")
print()

print("💡 Use Cases:")
print("- Django admin verbose names")
print("- API response messages")
print("- Form field labels")
print("- Email templates")
print("- Data table headers")

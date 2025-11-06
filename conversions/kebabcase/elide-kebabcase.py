#!/usr/bin/env python3
"""
Python Integration Example for elide-kebabcase
This demonstrates calling the TypeScript kebab-case implementation from Python.
Benefits: Consistent URL slug generation across TypeScript and Python services.
"""

# from elide import require
# kebab_case = require('./elide-kebabcase.ts')

print("=== Python Calling TypeScript kebab-case ===\n")

# Example 1: URL Slug Generation
# def create_slug(title):
#     """Generate URL-safe slug"""
#     return kebab_case.default(title)
#
# post_title = "Hello World Post"
# slug = create_slug(post_title)
# # Result: 'hello-world-post'

# Example 2: CSS Class Name Generation
# def generate_css_class(component_name):
#     """Generate BEM-style CSS class"""
#     return f"component-{kebab_case.default(component_name)}"
#
# class_name = generate_css_class("UserProfile")
# # Result: 'component-user-profile'

# Example 3: File Name Generation
# def generate_filename(display_name):
#     """Generate kebab-case filename"""
#     return f"{kebab_case.default(display_name)}.html"
#
# filename = generate_filename("Product Details")
# # Result: 'product-details.html'

print("Real-world use cases:")
print("- URL slug generation for blog posts/products")
print("- CSS class name generation (BEM style)")
print("- File name generation for static sites")
print("- API endpoint naming")
print()

print("When Elide Python API is ready:")
print("  kebab_case = require('./elide-kebabcase.ts')")
print("  kebab_case.default('HelloWorld')  # 'hello-world'")

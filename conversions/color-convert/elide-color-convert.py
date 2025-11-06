#!/usr/bin/env python3
"""
Python Integration Example for elide-color-convert

This demonstrates calling the TypeScript color conversion implementation from Python
using Elide's polyglot capabilities.

Benefits:
- One color conversion implementation shared across TypeScript and Python
- Consistent color handling across design systems
- No Python colorsys complexity
- Supports RGB, HSL, HSV, HEX conversions
"""

# NOTE: Exact syntax depends on Elide's Python polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Python support is ready

# Assuming Elide provides something like:
# from elide import require
# color = require('./elide-color-convert.ts')

print("=== Python Calling TypeScript Color Convert ===\n")

# Example 1: RGB to HEX conversion
# hex_color = color.rgbToHex([255, 0, 0])
# print(f"RGB(255, 0, 0) -> {hex_color}")  # #ff0000
# print()

# Example 2: HEX to RGB conversion
# rgb = color.hexToRgb("#ff0000")
# print(f"#ff0000 -> RGB{rgb}")  # [255, 0, 0]
# print()

# Example 3: Image processing pipeline
# def process_image_colors(pixels):
#     """Process image pixels with color transformations"""
#     processed = []
#     for rgb in pixels:
#         # Convert to HSL
#         hsl = color.rgbToHsl(rgb)
#
#         # Adjust lightness
#         hsl[2] = min(100, hsl[2] + 20)  # Lighten by 20%
#
#         # Convert back to RGB
#         new_rgb = color.hslToRgb(hsl)
#         processed.append(new_rgb)
#
#     return processed
#
# sample_pixels = [[100, 150, 200], [50, 75, 100]]
# result = process_image_colors(sample_pixels)
# print("Processed image colors:", result)
# print()

# Example 4: Design system color generation
# def generate_color_palette(base_color_hex):
#     """Generate a color palette from base color"""
#     rgb = color.hexToRgb(base_color_hex)
#
#     return {
#         'base': base_color_hex,
#         'light': color.rgbToHex(color.lighten(rgb, 20)),
#         'dark': color.rgbToHex(color.darken(rgb, 20)),
#         'saturated': color.rgbToHex(color.saturate(rgb, 30)),
#         'complement': color.rgbToHex(color.complement(rgb))
#     }
#
# palette = generate_color_palette("#3b82f6")
# print("Generated palette:")
# for variant, hex_val in palette.items():
#     print(f"  {variant}: {hex_val}")
# print()

# Example 5: Data visualization
# def color_for_value(value, min_val, max_val):
#     """Generate color based on value (heatmap)"""
#     # Normalize value to 0-1
#     normalized = (value - min_val) / (max_val - min_val)
#
#     # Generate HSL color (0° = red, 120° = green)
#     hue = int(normalized * 120)
#     hsl = [hue, 100, 50]
#
#     # Convert to RGB and HEX
#     rgb = color.hslToRgb(hsl)
#     return color.rgbToHex(rgb)
#
# values = [10, 50, 90]
# print("Heatmap colors:")
# for val in values:
#     hex_color = color_for_value(val, 0, 100)
#     print(f"  Value {val}: {hex_color}")
# print()

print("Real-world use case:")
print("- Python data visualization needs consistent color conversions")
print("- Uses same TypeScript implementation as design system")
print("- Guarantees identical colors across all services")
print("- No need to install Python color library")
print()

print("Example: Design System")
print("┌─────────────────────────────────────┐")
print("│   Elide Color Convert (TypeScript) │")
print("│   elide-color-convert.ts           │")
print("└─────────────────────────────────────┘")
print("         ↓                   ↓")
print("    ┌────────┐          ┌────────┐")
print("    │ React  │          │ Python │")
print("    │   UI   │          │ Charts │")
print("    └────────┘          └────────┘")
print("         ↓                   ↓")
print("    Same color values everywhere!")
print()

print("Problem Solved:")
print("Before: Different color libs = inconsistent colors across UI and charts")
print("After: One Elide implementation = identical color output")
print()

print("When Elide Python API is ready, usage will be:")
print("  from elide import require")
print("  color = require('./elide-color-convert.ts')")
print("  hex_color = color.rgbToHex([255, 0, 0])")
print("  print(hex_color)  # #ff0000")

#!/usr/bin/env ruby

# Ruby Integration Example for elide-color-convert
#
# This demonstrates calling the TypeScript color conversion implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One color conversion implementation shared across TypeScript and Ruby
# - Consistent color handling across design systems
# - No Ruby color gem complexity
# - Perfect for Rails UI theming

puts "=== Ruby Calling TypeScript Color Convert ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# color = Elide.require('./elide-color-convert.ts')

# Example 1: Rails UI theming
# class Theme < ApplicationRecord
#   def generate_variants
#     color = Elide.require('./elide-color-convert.ts')
#     base_rgb = color.hexToRgb(primary_color)
#
#     {
#       primary: primary_color,
#       light: color.rgbToHex(color.lighten(base_rgb, 20)),
#       dark: color.rgbToHex(color.darken(base_rgb, 20)),
#       accent: color.rgbToHex(color.complement(base_rgb))
#     }
#   end
# end

# Example 2: CSS generation
# def generate_css_variables(theme_colors)
#   color = Elide.require('./elide-color-convert.ts')
#   css = ":root {\n"
#
#   theme_colors.each do |name, hex|
#     rgb = color.hexToRgb(hex)
#     css += "  --color-#{name}: #{hex};\n"
#     css += "  --color-#{name}-rgb: #{rgb.join(', ')};\n"
#   end
#
#   css += "}"
#   css
# end

# Example 3: Image processing
# class ImageProcessor
#   def adjust_brightness(image_data, amount)
#     color = Elide.require('./elide-color-convert.ts')
#
#     image_data.map do |pixel|
#       rgb = pixel[:rgb]
#       adjusted = amount > 0 ?
#         color.lighten(rgb, amount) :
#         color.darken(rgb, -amount)
#       { rgb: adjusted, hex: color.rgbToHex(adjusted) }
#     end
#   end
# end

# Example 4: Color palette generation
# def create_palette(base_color)
#   color = Elide.require('./elide-color-convert.ts')
#   base_rgb = color.hexToRgb(base_color)
#   hsl = color.rgbToHsl(base_rgb)
#
#   # Generate complementary colors
#   palette = []
#   [0, 30, 60, 90].each do |hue_shift|
#     new_hsl = [hsl[0] + hue_shift, hsl[1], hsl[2]]
#     new_rgb = color.hslToRgb(new_hsl)
#     palette << color.rgbToHex(new_rgb)
#   end
#
#   palette
# end

puts "Real-world use case:"
puts "- Rails app needs consistent color theming"
puts "- Uses same TypeScript implementation as React frontend"
puts "- Guarantees identical color values across stack"
puts "- No gem installation needed"
puts ""

puts "Example: Design System"
puts "┌─────────────────────────────────────┐"
puts "│   Elide Color Convert (TypeScript) │"
puts "│   elide-color-convert.ts           │"
puts "└─────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ React  │  │  Rails │  │Sidekiq │"
puts "    │   UI   │  │Backend │  │ Worker │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same color system everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Different color libs = UI and backend generate different colors"
puts "After: One Elide implementation = 100% color consistency"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/color.rb"
puts "  COLOR = Elide.require('./elide-color-convert.ts')"
puts "  "
puts "  # app/helpers/theme_helper.rb"
puts "  module ThemeHelper"
puts "    def lighten_color(hex, amount)"
puts "      rgb = COLOR.hexToRgb(hex)"
puts "      COLOR.rgbToHex(COLOR.lighten(rgb, amount))"
puts "    end"
puts "  end"

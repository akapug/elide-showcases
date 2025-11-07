#!/usr/bin/env ruby

# Ruby Integration Example for elide-titlecase
#
# This demonstrates calling the TypeScript titlecase implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One titlecase implementation shared across TypeScript and Ruby
# - Consistent convert strings to title case across microservices
# - Perfect for Rails, Sidekiq, background workers

puts "=== Ruby Calling TypeScript titlecase ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# titlecase_module = Elide.require('./elide-titlecase.ts')

# Example: Basic usage
# result = titlecase_module.default()
# puts "Result: #{result}"

puts "Real-world use case:"
puts "- Ruby worker uses convert strings to title case"
puts "- Uses same TypeScript implementation as Node.js API"
puts "- Guarantees consistent behavior across services"
puts "- Perfect for text formatting, name normalization, UI display"
puts ""

puts "Example: Microservices Architecture"
puts "┌─────────────────────────────────────┐"
puts "│   Elide titlecase (TypeScript)         │"
puts "│   conversions/titlecase/elide-titlecase.ts│"
puts "└─────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Rails  │"
puts "    │  API   │  │ Worker │  │  App   │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same convert strings to title case everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Ruby custom + JavaScript = different behaviors"
puts "After: One Elide implementation = 100% consistent"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/titlecase.rb"
puts "  TITLECASE = Elide.require('./elide-titlecase.ts')"

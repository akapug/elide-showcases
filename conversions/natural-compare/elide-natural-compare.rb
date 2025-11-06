#!/usr/bin/env ruby

# Ruby Integration Example for elide-natural-compare
#
# This demonstrates calling the TypeScript natural-compare implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One natural-compare implementation shared across TypeScript and Ruby
# - Consistent natural sort order comparison for strings with numbers across microservices
# - Perfect for Rails, Sidekiq, background workers

puts "=== Ruby Calling TypeScript natural-compare ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# natural_compare_module = Elide.require('./elide-natural-compare.ts')

# Example: Basic usage
# result = natural_compare_module.default()
# puts "Result: #{result}"

puts "Real-world use case:"
puts "- Ruby worker uses natural sort order comparison for strings with numbers"
puts "- Uses same TypeScript implementation as Node.js API"
puts "- Guarantees consistent behavior across services"
puts "- Perfect for file listings, version sorting, human-friendly sorting"
puts ""

puts "Example: Microservices Architecture"
puts "┌─────────────────────────────────────┐"
puts "│   Elide natural-compare (TypeScript)         │"
puts "│   conversions/natural-compare/elide-natural-compare.ts│"
puts "└─────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Rails  │"
puts "    │  API   │  │ Worker │  │  App   │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same natural sort order comparison for strings with numbers everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Ruby custom + JavaScript = different behaviors"
puts "After: One Elide implementation = 100% consistent"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/natural_compare.rb"
puts "  NATURAL_COMPARE = Elide.require('./elide-natural-compare.ts')"

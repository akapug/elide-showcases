#!/usr/bin/env ruby

# Ruby Integration Example for elide-uniq-by
#
# This demonstrates calling the TypeScript uniq-by implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One uniq-by implementation shared across TypeScript and Ruby
# - Consistent create array of unique values by property or function across microservices
# - Perfect for Rails, Sidekiq, background workers

puts "=== Ruby Calling TypeScript uniq-by ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# uniq_by_module = Elide.require('./elide-uniq-by.ts')

# Example: Basic usage
# result = uniq_by_module.default()
# puts "Result: #{result}"

puts "Real-world use case:"
puts "- Ruby worker uses create array of unique values by property or function"
puts "- Uses same TypeScript implementation as Node.js API"
puts "- Guarantees consistent behavior across services"
puts "- Perfect for data deduplication, filtering, aggregation"
puts ""

puts "Example: Microservices Architecture"
puts "┌─────────────────────────────────────┐"
puts "│   Elide uniq-by (TypeScript)         │"
puts "│   conversions/uniq-by/elide-uniq-by.ts│"
puts "└─────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Rails  │"
puts "    │  API   │  │ Worker │  │  App   │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same create array of unique values by property or function everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Ruby custom + JavaScript = different behaviors"
puts "After: One Elide implementation = 100% consistent"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/uniq_by.rb"
puts "  UNIQ_BY = Elide.require('./elide-uniq-by.ts')"

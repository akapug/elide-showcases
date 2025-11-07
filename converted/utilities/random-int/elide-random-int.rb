#!/usr/bin/env ruby

# Ruby Integration Example for elide-random-int
#
# This demonstrates calling the TypeScript random-int implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One random-int implementation shared across TypeScript and Ruby
# - Consistent generate a random integer within a range across microservices
# - Perfect for Rails, Sidekiq, background workers

puts "=== Ruby Calling TypeScript random-int ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# random_int_module = Elide.require('./elide-random-int.ts')

# Example: Basic usage
# result = random_int_module.default()
# puts "Result: #{result}"

puts "Real-world use case:"
puts "- Ruby worker uses generate a random integer within a range"
puts "- Uses same TypeScript implementation as Node.js API"
puts "- Guarantees consistent behavior across services"
puts "- Perfect for ID generation, sampling, testing, games"
puts ""

puts "Example: Microservices Architecture"
puts "┌─────────────────────────────────────┐"
puts "│   Elide random-int (TypeScript)         │"
puts "│   conversions/random-int/elide-random-int.ts│"
puts "└─────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Rails  │"
puts "    │  API   │  │ Worker │  │  App   │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same generate a random integer within a range everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Ruby custom + JavaScript = different behaviors"
puts "After: One Elide implementation = 100% consistent"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/random_int.rb"
puts "  RANDOM_INT = Elide.require('./elide-random-int.ts')"

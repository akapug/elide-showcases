#!/usr/bin/env ruby

# Ruby Integration Example for elide-swap-case
#
# This demonstrates calling the TypeScript swap-case implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One swap-case implementation shared across TypeScript and Ruby
# - Consistent swap uppercase and lowercase characters across microservices
# - Perfect for Rails, Sidekiq, background workers

puts "=== Ruby Calling TypeScript swap-case ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# swap_case_module = Elide.require('./elide-swap-case.ts')

# Example: Basic usage
# result = swap_case_module.default()
# puts "Result: #{result}"

puts "Real-world use case:"
puts "- Ruby worker uses swap uppercase and lowercase characters"
puts "- Uses same TypeScript implementation as Node.js API"
puts "- Guarantees consistent behavior across services"
puts "- Perfect for text transformation, case toggling, encoding"
puts ""

puts "Example: Microservices Architecture"
puts "┌─────────────────────────────────────┐"
puts "│   Elide swap-case (TypeScript)         │"
puts "│   conversions/swap-case/elide-swap-case.ts│"
puts "└─────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Rails  │"
puts "    │  API   │  │ Worker │  │  App   │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same swap uppercase and lowercase characters everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Ruby custom + JavaScript = different behaviors"
puts "After: One Elide implementation = 100% consistent"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/swap_case.rb"
puts "  SWAP_CASE = Elide.require('./elide-swap-case.ts')"

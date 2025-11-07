#!/usr/bin/env ruby

# Ruby Integration Example for elide-tinyqueue
#
# This demonstrates calling the TypeScript tinyqueue implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One tinyqueue implementation shared across TypeScript and Ruby
# - Consistent tiny and fast priority queue implementation across microservices
# - Perfect for Rails, Sidekiq, background workers

puts "=== Ruby Calling TypeScript tinyqueue ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# tinyqueue_module = Elide.require('./elide-tinyqueue.ts')

# Example: Basic usage
# result = tinyqueue_module.default()
# puts "Result: #{result}"

puts "Real-world use case:"
puts "- Ruby worker uses tiny and fast priority queue implementation"
puts "- Uses same TypeScript implementation as Node.js API"
puts "- Guarantees consistent behavior across services"
puts "- Perfect for task scheduling, pathfinding, event processing"
puts ""

puts "Example: Microservices Architecture"
puts "┌─────────────────────────────────────┐"
puts "│   Elide tinyqueue (TypeScript)         │"
puts "│   conversions/tinyqueue/elide-tinyqueue.ts│"
puts "└─────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Rails  │"
puts "    │  API   │  │ Worker │  │  App   │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same tiny and fast priority queue implementation everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Ruby custom + JavaScript = different behaviors"
puts "After: One Elide implementation = 100% consistent"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/tinyqueue.rb"
puts "  TINYQUEUE = Elide.require('./elide-tinyqueue.ts')"

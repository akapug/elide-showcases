#!/usr/bin/env ruby

# Ruby Integration Example for elide-quick-lru
#
# This demonstrates calling the TypeScript quick-lru implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One quick-lru implementation shared across TypeScript and Ruby
# - Consistent simple and fast lru cache implementation across microservices
# - Perfect for Rails, Sidekiq, background workers

puts "=== Ruby Calling TypeScript quick-lru ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# quick_lru_module = Elide.require('./elide-quick-lru.ts')

# Example: Basic usage
# result = quick_lru_module.default()
# puts "Result: #{result}"

puts "Real-world use case:"
puts "- Ruby worker uses simple and fast lru cache implementation"
puts "- Uses same TypeScript implementation as Node.js API"
puts "- Guarantees consistent behavior across services"
puts "- Perfect for API response caching, memoization, performance optimization"
puts ""

puts "Example: Microservices Architecture"
puts "┌─────────────────────────────────────┐"
puts "│   Elide quick-lru (TypeScript)         │"
puts "│   conversions/quick-lru/elide-quick-lru.ts│"
puts "└─────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Rails  │"
puts "    │  API   │  │ Worker │  │  App   │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same simple and fast lru cache implementation everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Ruby custom + JavaScript = different behaviors"
puts "After: One Elide implementation = 100% consistent"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/quick_lru.rb"
puts "  QUICK_LRU = Elide.require('./elide-quick-lru.ts')"

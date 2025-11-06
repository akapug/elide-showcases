#!/usr/bin/env ruby

# Ruby Integration Example for elide-word-wrap
#
# This demonstrates calling the TypeScript word-wrap implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One word-wrap implementation shared across TypeScript and Ruby
# - Consistent wrap words to specified line width across microservices
# - Perfect for Rails, Sidekiq, background workers

puts "=== Ruby Calling TypeScript word-wrap ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# word_wrap_module = Elide.require('./elide-word-wrap.ts')

# Example: Basic usage
# result = word_wrap_module.default()
# puts "Result: #{result}"

puts "Real-world use case:"
puts "- Ruby worker uses wrap words to specified line width"
puts "- Uses same TypeScript implementation as Node.js API"
puts "- Guarantees consistent behavior across services"
puts "- Perfect for text formatting, terminal output, email composition"
puts ""

puts "Example: Microservices Architecture"
puts "┌─────────────────────────────────────┐"
puts "│   Elide word-wrap (TypeScript)         │"
puts "│   conversions/word-wrap/elide-word-wrap.ts│"
puts "└─────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Rails  │"
puts "    │  API   │  │ Worker │  │  App   │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same wrap words to specified line width everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Ruby custom + JavaScript = different behaviors"
puts "After: One Elide implementation = 100% consistent"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/word_wrap.rb"
puts "  WORD_WRAP = Elide.require('./elide-word-wrap.ts')"

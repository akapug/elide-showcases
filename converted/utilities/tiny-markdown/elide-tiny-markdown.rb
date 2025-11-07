#!/usr/bin/env ruby

# Ruby Integration Example for elide-tiny-markdown
#
# This demonstrates calling the TypeScript tiny-markdown implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One tiny-markdown implementation shared across TypeScript and Ruby
# - Consistent minimal markdown parser across microservices
# - Perfect for Rails, Sidekiq, background workers

puts "=== Ruby Calling TypeScript tiny-markdown ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# tiny_markdown_module = Elide.require('./elide-tiny-markdown.ts')

# Example: Basic usage
# result = tiny_markdown_module.default()
# puts "Result: #{result}"

puts "Real-world use case:"
puts "- Ruby worker uses minimal markdown parser"
puts "- Uses same TypeScript implementation as Node.js API"
puts "- Guarantees consistent behavior across services"
puts "- Perfect for comment rendering, documentation, content formatting"
puts ""

puts "Example: Microservices Architecture"
puts "┌─────────────────────────────────────┐"
puts "│   Elide tiny-markdown (TypeScript)         │"
puts "│   conversions/tiny-markdown/elide-tiny-markdown.ts│"
puts "└─────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Rails  │"
puts "    │  API   │  │ Worker │  │  App   │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same minimal markdown parser everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Ruby custom + JavaScript = different behaviors"
puts "After: One Elide implementation = 100% consistent"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/tiny_markdown.rb"
puts "  TINY_MARKDOWN = Elide.require('./elide-tiny-markdown.ts')"

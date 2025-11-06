#!/usr/bin/env ruby

# Ruby Integration Example for elide-array-unique
#
# This demonstrates calling the TypeScript unique implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One unique library shared across TypeScript and Ruby
# - Consistent deduplication across microservices
# - No need for custom Ruby uniq logic
# - Perfect for Rails data processing

puts "=== Ruby Calling TypeScript Array Unique ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# unique_module = Elide.require('./elide-array-unique.ts')

# Example 1: Rails Model Deduplication
# class TagService
#   def get_unique_tags(articles)
#     all_tags = articles.flat_map(&:tags)
#     unique_module.default(all_tags)
#   end
# end

# Example 2: Data Processing
# class DataProcessor
#   def remove_duplicates(data)
#     unique_module.default(data)
#   end
# end

puts "Real-world use case:"
puts "- Ruby Rails app deduplicates data"
puts "- Uses same TypeScript implementation as Node.js API"
puts "- Guarantees consistent unique behavior"
puts "- No Array.uniq needed"
puts ""

puts "Example: Data Deduplication System"
puts "┌─────────────────────────────────────────────┐"
puts "│   Elide Array Unique (TypeScript)         │"
puts "│   elide-array-unique.ts                    │"
puts "└─────────────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Rails  │"
puts "    │  API   │  │ Worker │  │  App   │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same deduplication logic everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Different unique implementations = order inconsistencies"
puts "After: One Elide implementation = unified deduplication"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/unique.rb"
puts "  UNIQUE = Elide.require('./elide-array-unique.ts')"
puts "  "
puts "  # app/services/tag_service.rb"
puts "  def unique_tags(tags)"
puts "    UNIQUE.default(tags)"
puts "  end"

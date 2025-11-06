#!/usr/bin/env ruby

# Ruby Integration Example for elide-array-flatten
#
# This demonstrates calling the TypeScript flatten implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One flatten library shared across TypeScript and Ruby
# - Consistent array flattening across microservices
# - No need for custom Ruby flatten logic
# - Perfect for Rails data processing, batch operations

puts "=== Ruby Calling TypeScript Array Flatten ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# flatten_module = Elide.require('./elide-array-flatten.ts')

# Example 1: Rails Model Data Processing
# class BatchProcessor
#   def process_nested_results(results)
#     flatten_module.default(results, 1)
#   end
# end

# Example 2: Data Transformation
# class DataTransformer
#   def normalize_nested_data(data, depth = Float::INFINITY)
#     flatten_module.default(data, depth)
#   end
# end

puts "Real-world use case:"
puts "- Ruby Rails app processes nested batch results"
puts "- Uses same TypeScript implementation as Node.js API"
puts "- Guarantees consistent data shape"
puts "- No custom flatten gem needed"
puts ""

puts "Example: Batch Processing System"
puts "┌─────────────────────────────────────────────┐"
puts "│   Elide Array Flatten (TypeScript)        │"
puts "│   elide-array-flatten.ts                   │"
puts "└─────────────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Rails  │"
puts "    │  API   │  │ Worker │  │  App   │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same flattening logic everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Different flatten implementations = data shape inconsistencies"
puts "After: One Elide implementation = unified data processing"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/flatten.rb"
puts "  FLATTEN = Elide.require('./elide-array-flatten.ts')"
puts "  "
puts "  # app/services/batch_processor.rb"
puts "  def flatten_results(results)"
puts "    FLATTEN.default(results)"
puts "  end"

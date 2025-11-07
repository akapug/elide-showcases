#!/usr/bin/env ruby

# Ruby Integration Example for elide-is-plain-object
#
# This demonstrates calling the TypeScript is-plain-object implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One is-plain-object implementation shared across TypeScript and Ruby
# - Consistent object checking behavior across microservices
# - No Ruby library discrepancies
# - Perfect for Rails, Sidekiq, background workers

puts "=== Ruby Calling TypeScript IsPlainObject ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# is-plain-object_module = Elide.require('./elide-is-plain-object.ts')

# Example 1: Basic Usage
# result = is-plain-object_module.default(input_data)
# puts "Result: #{result}"
# puts ""

# Example 2: Rails Integration
# class DataService
#   def initialize
#     @is-plain-object = is-plain-object_module
#   end
#
#   def process(data)
#     @is-plain-object.default(data)
#   end
# end
#
# service = DataService.new
# result = service.process(input_data)
# puts "Processed: #{result}"
# puts ""

# Example 3: Sidekiq Worker
# class ProcessingJob
#   include Sidekiq::Worker
#
#   def perform(data)
#     result = is-plain-object_module.default(data)
#     puts "Job result: #{result}"
#   end
# end

puts "Real-world use case:"
puts "- Ruby worker uses is-plain-object"
puts "- Uses same TypeScript implementation as Node.js API"
puts "- Guarantees consistent object checking across services"
puts "- Validate data structures"
puts ""

puts "Example: Microservices Architecture"
puts "┌─────────────────────────────────────────┐"
puts "│   Elide IsPlainObject (TypeScript)           │"
puts "│   elide-is-plain-object.ts                        │"
puts "└─────────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Rails  │"
puts "    │  API   │  │ Worker │  │  App   │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same object checking everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Ruby + JavaScript = different implementations"
puts "After: One Elide implementation = 100% consistent"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/is-plain-object.rb"
puts "  IS_PLAIN_OBJECT = Elide.require('./elide-is-plain-object.ts')"
puts "  "
puts "  # app/services/data_service.rb"
puts "  class DataService"
puts "    def process(data)"
puts "      IS_PLAIN_OBJECT.default(data)"
puts "    end"
puts "  end"

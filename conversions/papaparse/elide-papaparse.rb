#!/usr/bin/env ruby

# Ruby Integration Example for elide-papaparse
#
# This demonstrates calling the TypeScript papaparse implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One papaparse implementation shared across TypeScript and Ruby
# - Consistent CSV parsing behavior across microservices
# - No Ruby library discrepancies
# - Perfect for Rails, Sidekiq, background workers

puts "=== Ruby Calling TypeScript Papaparse ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# papaparse_module = Elide.require('./elide-papaparse.ts')

# Example 1: Basic Usage
# result = papaparse_module.default(input_data)
# puts "Result: #{result}"
# puts ""

# Example 2: Rails Integration
# class DataService
#   def initialize
#     @papaparse = papaparse_module
#   end
#
#   def process(data)
#     @papaparse.default(data)
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
#     result = papaparse_module.default(data)
#     puts "Job result: #{result}"
#   end
# end

puts "Real-world use case:"
puts "- Ruby worker uses papaparse"
puts "- Uses same TypeScript implementation as Node.js API"
puts "- Guarantees consistent CSV parsing across services"
puts "- Import/export CSV data"
puts ""

puts "Example: Microservices Architecture"
puts "┌─────────────────────────────────────────┐"
puts "│   Elide Papaparse (TypeScript)           │"
puts "│   elide-papaparse.ts                        │"
puts "└─────────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Rails  │"
puts "    │  API   │  │ Worker │  │  App   │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same CSV parsing everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Ruby + JavaScript = different implementations"
puts "After: One Elide implementation = 100% consistent"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/papaparse.rb"
puts "  PAPAPARSE = Elide.require('./elide-papaparse.ts')"
puts "  "
puts "  # app/services/data_service.rb"
puts "  class DataService"
puts "    def process(data)"
puts "      PAPAPARSE.default(data)"
puts "    end"
puts "  end"

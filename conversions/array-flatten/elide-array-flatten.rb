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


# ============================================================
# Extended Usage Examples
# ============================================================

# Example: Rails Service Object
# class ProcessingService
#   def initialize
#     @module = Elide.require('./elide-array-flatten.ts')
#   end
#
#   def process(data)
#     @module.default(data)
#   end
#
#   def process_batch(items)
#     items.map { |item| process(item) }
#   end
# end

# Example: Rails Controller Integration
# class DataController < ApplicationController
#   before_action :load_module
#
#   def process
#     data = params.require(:data)
#     result = @module.default(data)
#     render json: { result: result }
#   rescue => e
#     render json: { error: e.message }, status: :unprocessable_entity
#   end
#
#   private
#
#   def load_module
#     @module = Elide.require('./elide-array-flatten.ts')
#   end
# end

# Example: Background Job
# class DataProcessorJob < ApplicationJob
#   queue_as :default
#
#   def perform(data_id)
#     data = Data.find(data_id)
#     module = Elide.require('./elide-array-flatten.ts')
#     result = module.default(data.content)
#     data.update!(processed: result)
#   end
# end

# Example: ActiveRecord Extension
# module Processable
#   extend ActiveSupport::Concern
#
#   included do
#     after_save :process_data, if: :should_process?
#   end
#
#   def process_data
#     module = Elide.require('./elide-array-flatten.ts')
#     self.processed_value = module.default(self.raw_value)
#     save!
#   end
#
#   def should_process?
#     raw_value_changed?
#   end
# end

# Example: Caching with Redis
# class CachedProcessor
#   def initialize
#     @module = Elide.require('./elide-array-flatten.ts')
#     @redis = Redis.new
#   end
#
#   def process(data)
#     cache_key = Digest::SHA256.hexdigest(data.to_s)
#     cached = @redis.get(cache_key)
#     return JSON.parse(cached) if cached
#
#     result = @module.default(data)
#     @redis.setex(cache_key, 3600, result.to_json)
#     result
#   end
# end

# Example: Error Handling Wrapper
# class SafeProcessor
#   def initialize
#     @module = Elide.require('./elide-array-flatten.ts')
#     @logger = Logger.new(STDOUT)
#   end
#
#   def process(data)
#     @logger.info "Processing data"
#     result = @module.default(data)
#     @logger.info "Success"
#     { success: true, result: result }
#   rescue StandardError => e
#     @logger.error "Error: #{e.message}"
#     { success: false, error: e.message }
#   end
# end

# Example: Testing with RSpec
# RSpec.describe "Module Integration" do
#   let(:module) { Elide.require('./elide-array-flatten.ts') }
#
#   describe '#default' do
#     it 'processes data correctly' do
#       result = module.default(test_data)
#       expect(result).to be_present
#     end
#
#     it 'handles edge cases' do
#       expect { module.default(nil) }.to raise_error(TypeError)
#     end
#   end
# end

puts "\n" + "="*60
puts "Extended Examples Available Above"
puts "="*60
puts "\nThese examples demonstrate:"
puts "  • Rails service objects"
puts "  • Controller integration"
puts "  • Background jobs (ActiveJob)"
puts "  • ActiveRecord extensions"
puts "  • Redis caching"
puts "  • Error handling wrappers"
puts "  • RSpec testing"
puts "\nTotal: 7 comprehensive Rails patterns"

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


# ============================================================
# Extended Usage Examples
# ============================================================

# Example: Rails Service Object
# class ProcessingService
#   def initialize
#     @module = Elide.require('./elide-array-unique.ts')
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
#     @module = Elide.require('./elide-array-unique.ts')
#   end
# end

# Example: Background Job
# class DataProcessorJob < ApplicationJob
#   queue_as :default
#
#   def perform(data_id)
#     data = Data.find(data_id)
#     module = Elide.require('./elide-array-unique.ts')
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
#     module = Elide.require('./elide-array-unique.ts')
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
#     @module = Elide.require('./elide-array-unique.ts')
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
#     @module = Elide.require('./elide-array-unique.ts')
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
#   let(:module) { Elide.require('./elide-array-unique.ts') }
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

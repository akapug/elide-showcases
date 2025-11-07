#!/usr/bin/env ruby

# Ruby Integration Example for elide-chunk-array

puts "=== Ruby Calling TypeScript Chunk Array ===\n"

# Example 1: Rails Batch Processing
# class BatchProcessor
#   def process_in_batches(items, batch_size = 50)
#     batches = chunk_module.default(items, batch_size)
#     batches.each { |batch| process_batch(batch) }
#   end
# end

# Example 2: Pagination
# class ProductsController < ApplicationController
#   def index
#     all_products = Product.all
#     pages = chunk_module.default(all_products, 20)
#     render json: pages[params[:page].to_i]
#   end
# end

puts "Real-world use case:"
puts "- Ruby Rails app chunks data for batch processing"
puts "- Uses same TypeScript implementation as Node.js API"
puts "- Guarantees consistent batch sizes"
puts "- No Array.each_slice needed"
puts ""

puts "Example: Batch Processing System"
puts "┌─────────────────────────────────────────────┐"
puts "│   Elide Chunk Array (TypeScript)          │"
puts "│   elide-chunk-array.ts                     │"
puts "└─────────────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Rails  │"
puts "    │  API   │  │ Worker │  │  App   │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same chunking logic everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Different chunk implementations = batch size inconsistencies"
puts "After: One Elide implementation = unified chunking"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/chunk.rb"
puts "  CHUNK = Elide.require('./elide-chunk-array.ts')"
puts "  "
puts "  # app/services/batch_processor.rb"
puts "  def chunk_data(data, size)"
puts "    CHUNK.default(data, size)"
puts "  end"


# ============================================================
# Extended Usage Examples
# ============================================================

# Example: Rails Service Object
# class ProcessingService
#   def initialize
#     @module = Elide.require('./elide-chunk-array.ts')
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
#     @module = Elide.require('./elide-chunk-array.ts')
#   end
# end

# Example: Background Job
# class DataProcessorJob < ApplicationJob
#   queue_as :default
#
#   def perform(data_id)
#     data = Data.find(data_id)
#     module = Elide.require('./elide-chunk-array.ts')
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
#     module = Elide.require('./elide-chunk-array.ts')
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
#     @module = Elide.require('./elide-chunk-array.ts')
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
#     @module = Elide.require('./elide-chunk-array.ts')
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
#   let(:module) { Elide.require('./elide-chunk-array.ts') }
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

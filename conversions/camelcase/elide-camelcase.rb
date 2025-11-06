#!/usr/bin/env ruby

# Ruby Integration Example for elide-camelcase
# This demonstrates calling the TypeScript camelCase implementation from Ruby.
# Benefits: Consistent API response transformation across TypeScript and Ruby services.

puts "=== Ruby Calling TypeScript camelCase ===\n"

# camel_case = Elide.require('./elide-camelcase.ts')

# Example: Rails API Response
# class Api::UsersController < ApplicationController
#   def show
#     user = User.find(params[:id])
#     # Transform keys to camelCase for JSON API
#     response = transform_keys(user.attributes)
#     render json: response
#   end
#
#   private
#   def transform_keys(hash)
#     hash.transform_keys { |key| camel_case.default(key.to_s) }
#   end
# end

puts "Real-world use cases:"
puts "- Rails API response transformation"
puts "- JSON serialization (snake_case → camelCase)"
puts "- Frontend-backend key normalization"
puts ""

puts "When Elide Ruby API is ready:"
puts "  camel_case = Elide.require('./elide-camelcase.ts')"
puts "  camel_case.default('user_name')  # 'userName'"


# ============================================================
# Extended Usage Examples
# ============================================================

# Example: Rails Service Object
# class ProcessingService
#   def initialize
#     @module = Elide.require('./elide-camelcase.ts')
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
#     @module = Elide.require('./elide-camelcase.ts')
#   end
# end

# Example: Background Job
# class DataProcessorJob < ApplicationJob
#   queue_as :default
#
#   def perform(data_id)
#     data = Data.find(data_id)
#     module = Elide.require('./elide-camelcase.ts')
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
#     module = Elide.require('./elide-camelcase.ts')
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
#     @module = Elide.require('./elide-camelcase.ts')
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
#     @module = Elide.require('./elide-camelcase.ts')
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
#   let(:module) { Elide.require('./elide-camelcase.ts') }
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

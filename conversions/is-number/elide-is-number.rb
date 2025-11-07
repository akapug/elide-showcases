#!/usr/bin/env ruby

# Ruby Integration Example for elide-is-number
#
# This demonstrates calling the TypeScript number validation implementation
# from Ruby using Elide's polyglot capabilities.
#
# Benefits:
# - One number validation implementation shared across TypeScript and Ruby
# - Consistent validation rules across microservices
# - No Ruby validation gem needed
# - Perfect for Rails form validation, API parameter validation

puts "=== Ruby Calling TypeScript Number Validation ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# is_number_module = Elide.require('./elide-is-number.ts')

# Example 1: Basic Number Validation
# puts "is_number(5): #{is_number_module.default(5)}"
# puts "is_number('5'): #{is_number_module.default('5')}"
# puts "is_number('foo'): #{is_number_module.default('foo')}"
# puts ""

# Example 2: Rails Model Validation
# class Product < ApplicationRecord
#   validate :price_is_number
#   validate :quantity_is_number
#
#   private
#
#   def price_is_number
#     unless is_number_module.default(price)
#       errors.add(:price, 'must be a valid number')
#     end
#   end
#
#   def quantity_is_number
#     unless is_number_module.default(quantity)
#       errors.add(:quantity, 'must be a valid number')
#     end
#   end
# end

# Example 3: Rails Controller Parameter Validation
# class ProductsController < ApplicationController
#   def index
#     page = params[:page] || '1'
#     limit = params[:limit] || '10'
#
#     unless is_number_module.default(page)
#       render json: { error: 'Invalid page parameter' }, status: 400
#       return
#     end
#
#     unless is_number_module.default(limit)
#       render json: { error: 'Invalid limit parameter' }, status: 400
#       return
#     end
#
#     @products = Product.page(page.to_i).per(limit.to_i)
#     render json: @products
#   end
# end

# Example 4: Sinatra API Validation
# require 'sinatra'
# require 'json'
#
# get '/api/products' do
#   page = params[:page] || '1'
#   limit = params[:limit] || '10'
#
#   if !is_number_module.default(page)
#     status 400
#     return { error: 'Invalid page parameter' }.to_json
#   end
#
#   if !is_number_module.default(limit)
#     status 400
#     return { error: 'Invalid limit parameter' }.to_json
#   end
#
#   { products: [], page: page.to_i, limit: limit.to_i }.to_json
# end

# Example 5: Sidekiq Job for Data Validation
# class DataValidationJob
#   include Sidekiq::Worker
#
#   def perform(records)
#     invalid_records = []
#
#     records.each do |record|
#       errors = []
#
#       unless is_number_module.default(record['price'])
#         errors << 'Invalid price'
#       end
#
#       unless is_number_module.default(record['quantity'])
#         errors << 'Invalid quantity'
#       end
#
#       if errors.any?
#         invalid_records << { record: record, errors: errors }
#       end
#     end
#
#     puts "Found #{invalid_records.length} invalid records"
#     InvalidRecordAlert.create!(records: invalid_records) if invalid_records.any?
#   end
# end

# Example 6: Array Filtering
# def filter_numeric(array)
#   array.select { |item| is_number_module.default(item) }
# end
#
# mixed = [1, '2', 'foo', nil, 5.5, Float::INFINITY, 'bar', '10', true]
# numeric = filter_numeric(mixed)
# puts "Mixed array: #{mixed.inspect}"
# puts "Numeric only: #{numeric.inspect}"
# puts ""

puts "Real-world use cases:"
puts "- Rails model validations (price, quantity, age)"
puts "- API parameter validation (page, limit, offset)"
puts "- Sidekiq job data validation"
puts "- Configuration validation (ports, timeouts)"
puts "- CSV import data cleaning"
puts ""

puts "Example: Rails E-Commerce Platform"
puts "┌─────────────────────────────────────┐"
puts "│   Elide is-number (TypeScript)     │"
puts "│   elide-is-number.ts               │"
puts "└─────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Rails │  │ Sidekiq│"
puts "    │  API   │  │  App   │  │ Worker │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same validation everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Ruby numeric? + JS isNumber = different edge case handling"
puts "After: One Elide implementation = 100% consistent validation"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/is_number.rb"
puts "  IS_NUMBER = Elide.require('./elide-is-number.ts')"
puts "  "
puts "  # app/models/product.rb"
puts "  class Product < ApplicationRecord"
puts "    validate do"
puts "      unless IS_NUMBER.default(price)"
puts "        errors.add(:price, 'must be a number')"
puts "      end"
puts "    end"
puts "  end"
puts ""

puts "Edge Cases Handled:"
puts "  ✓ NaN → false"
puts "  ✓ Infinity → false"
puts "  ✓ Numeric strings → true"
puts "  ✓ nil → false"
puts "  ✓ Booleans → false"

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

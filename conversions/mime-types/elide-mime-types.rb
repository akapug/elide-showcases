#!/usr/bin/env ruby

# Ruby Integration Example for elide-mime-types
#
# This demonstrates calling the TypeScript MIME types implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One MIME database shared across TypeScript and Ruby
# - Consistent file type detection across microservices
# - No Ruby mime-types gem needed
# - Perfect for Rails, Sinatra file handling

puts "=== Ruby Calling TypeScript MIME Types ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# mime = Elide.require('./elide-mime-types.ts')

# Example 1: Rails File Upload
# class UploadsController < ApplicationController
#   def create
#     file = params[:file]
#     mime_type = mime.lookup(file.original_filename)
#
#     # Validate file type
#     unless ['image/jpeg', 'image/png', 'application/pdf'].include?(mime_type)
#       return render json: { error: 'Invalid file type' }, status: 400
#     end
#
#     # Store with correct MIME type
#     storage.save(file, mime_type: mime_type)
#   end
# end

# Example 2: Static File Server (Sinatra)
# require 'sinatra'
#
# get '/files/:filename' do
#   file_path = File.join(PUBLIC_DIR, params[:filename])
#   content_type mime.contentType(file_path)
#   send_file file_path
# end

# Example 3: File Type Detection
# def detect_file_type(filename)
#   mime_type = mime.lookup(filename)
#   is_image = mime_type&.start_with?('image/')
#   is_document = ['application/pdf', 'application/msword'].include?(mime_type)
#   { type: mime_type, image: is_image, document: is_document }
# end

puts "Real-world use case:"
puts "- Ruby Rails app determines MIME types for uploads"
puts "- Uses same TypeScript implementation as Node.js CDN"
puts "- Guarantees consistent Content-Type headers"
puts "- No mime-types gem needed"
puts ""

puts "Example: CDN Service"
puts "┌─────────────────────────────────────────────┐"
puts "│   Elide MIME Types (TypeScript)            │"
puts "│   elide-mime-types.ts                      │"
puts "└─────────────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Rails  │"
puts "    │  CDN   │  │ Worker │  │  App   │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same MIME types everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Different MIME databases = inconsistent types"
puts "After: One Elide implementation = perfect consistency"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/mime.rb"
puts "  MIME = Elide.require('./elide-mime-types.ts')"
puts "  "
puts "  # app/controllers/uploads_controller.rb"
puts "  def create"
puts "    mime_type = MIME.lookup(params[:file].original_filename)"
puts "  end"

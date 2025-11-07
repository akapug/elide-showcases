#!/usr/bin/env ruby
# Ruby Integration Example for elide-filesize
# Format byte values into human-readable strings from Ruby using Elide

puts "=== Ruby Calling TypeScript Filesize ===\n"

# Example 1: File Manager Display
# filesize_module = Elide.require('./elide-filesize.ts')
#
# files = [
#   { name: 'document.pdf', bytes: 524288 },
#   { name: 'photo.jpg', bytes: 2097152 },
#   { name: 'video.mp4', bytes: 157286400 }
# ]
#
# puts "File listing:"
# files.each do |file|
#   size = filesize_module.default(file[:bytes])
#   puts "  #{file[:name].ljust(15)} #{size.rjust(10)}"
# end

# Example 2: Rails Upload Progress
# class UploadController < ApplicationController
#   def progress
#     uploaded = params[:uploaded].to_i
#     total = params[:total].to_i
#     
#     formatted_uploaded = filesize_module.default(uploaded)
#     formatted_total = filesize_module.default(total)
#     percent = (uploaded.to_f / total * 100).round(1)
#     
#     render json: {
#       uploaded: formatted_uploaded,
#       total: formatted_total,
#       percent: percent
#     }
#   end
# end

# Example 3: Storage Dashboard
# class StorageDashboard
#   def initialize
#     @filesize = Elide.require('./elide-filesize.ts')
#   end
#   
#   def format_storage_info(total, used)
#     available = total - used
#     percent = (used.to_f / total * 100).round(1)
#     
#     {
#       total: @filesize.filesizeIEC(total),
#       used: @filesize.filesizeIEC(used),
#       available: @filesize.filesizeIEC(available),
#       percent: percent
#     }
#   end
# end

# Example 4: Sidekiq Job Logging
# class ProcessFileJob
#   include Sidekiq::Worker
#   
#   def perform(file_path)
#     file_size = File.size(file_path)
#     formatted = filesize_module.default(file_size)
#     logger.info("Processing file: #{file_path} (#{formatted})")
#   end
# end

# Example 5: ActiveRecord Model
# class Attachment < ApplicationRecord
#   def human_filesize
#     filesize_module.default(self.size_bytes)
#   end
#   
#   def filesize_with_precision(decimals)
#     filesize_module.default(self.size_bytes, { precision: decimals })
#   end
# end

puts "Real-world use cases:"
puts "- Rails file manager displays"
puts "- Upload progress indicators"
puts "- Storage dashboards"
puts "- Sidekiq job logging"
puts "- ActiveRecord models"
puts ""

puts "Example: Rails Application"
puts "┌──────────────────────────────────────┐"
puts "│   Elide Filesize (TypeScript)       │"
puts "│   elide-filesize.ts                 │"
puts "└──────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Rails │  │ Sidekiq│"
puts "    │  API   │  │  App   │  │ Worker │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same file size formatting everywhere!"
puts ""

puts "When ready: filesize = Elide.require('./elide-filesize.ts')"

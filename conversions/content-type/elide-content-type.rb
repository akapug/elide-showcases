#!/usr/bin/env ruby

# Ruby Integration Example for elide-content-type
#
# This demonstrates calling the TypeScript Content-Type implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One Content-Type parser shared across TypeScript and Ruby
# - Consistent header handling across microservices
# - No Ruby content-type gem needed
# - Perfect for Rails, Sinatra, Rack applications

puts "=== Ruby Calling TypeScript Content-Type Parser ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# content_type = Elide.require('./elide-content-type.ts')

# Example 1: Parse Content-Type Header
# ct = content_type.parse('application/json; charset=utf-8')
# puts "Type: #{ct['type']}"
# puts "Charset: #{ct['parameters']['charset']}"
# puts ""

# Example 2: Format Content-Type
# formatted = content_type.format({
#   type: 'application/json',
#   parameters: { charset: 'utf-8' }
# })
# puts "Formatted: #{formatted}"
# puts ""

# Example 3: Rails Controller Integration
# class ApiController < ApplicationController
#   before_action :parse_content_type
#
#   private
#   def parse_content_type
#     ct_header = request.headers['Content-Type']
#     if ct_header
#       @content_type = content_type.parse(ct_header)
#       if content_type.isJSON(@content_type)
#         # Handle JSON request
#       elsif content_type.isXML(@content_type)
#         # Handle XML request
#       end
#     end
#   end
#
#   def render_with_content_type(data, format: :json)
#     ct = if format == :json
#       content_type.format({
#         type: 'application/json',
#         parameters: { charset: 'utf-8' }
#       })
#     else
#       content_type.format({
#         type: 'application/xml',
#         parameters: { charset: 'utf-8' }
#       })
#     end
#
#     response.headers['Content-Type'] = ct
#     render body: data
#   end
# end

# Example 4: Sinatra Integration
# require 'sinatra'
#
# post '/api/data' do
#   # Parse Content-Type
#   ct = content_type.parse(request.env['CONTENT_TYPE'] || '')
#
#   if content_type.isJSON(ct)
#     data = JSON.parse(request.body.read)
#     # Process data
#   end
#
#   # Set response Content-Type
#   content_type 'application/json; charset=utf-8'
#   { status: 'ok' }.to_json
# end

# Example 5: Content Negotiation Middleware
# class ContentNegotiationMiddleware
#   def initialize(app)
#     @app = app
#   end
#
#   def call(env)
#     # Parse Accept header
#     accept = env['HTTP_ACCEPT'] || ''
#
#     # Determine best format
#     format = if accept.include?('application/json')
#       :json
#     elsif accept.include?('application/xml')
#       :xml
#     else
#       :json  # default
#     end
#
#     env['app.format'] = format
#     @app.call(env)
#   end
# end

puts "Real-world use case:"
puts "- Ruby Rails/Sinatra API handles Content-Type for requests"
puts "- Uses same TypeScript implementation as Node.js service"
puts "- Guarantees consistent content negotiation"
puts "- No need for Ruby content-type gems"
puts ""

puts "Example: Microservices"
puts "┌─────────────────────────────────────────────┐"
puts "│   Elide Content-Type (TypeScript)          │"
puts "│   elide-content-type.ts                    │"
puts "└─────────────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Rails  │"
puts "    │  API   │  │Sinatra │  │  API   │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same Content-Type everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Different Content-Type parsing across languages"
puts "After: One Elide implementation = consistent behavior"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/content_type.rb"
puts "  CONTENT_TYPE = Elide.require('./elide-content-type.ts')"
puts "  "
puts "  # app/controllers/api_controller.rb"
puts "  class ApiController < ApplicationController"
puts "    def parse_content_type"
puts "      CONTENT_TYPE.parse(request.headers['Content-Type'])"
puts "    end"
puts "  end"

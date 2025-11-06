#!/usr/bin/env ruby

# Ruby Integration Example for elide-query-string (URL Query String Parser)
#
# Demonstrates calling the TypeScript query-string implementation from Ruby
# for consistent URL parameter handling across microservices.

puts "=== Ruby Calling TypeScript Query String Parser ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# qs = Elide.require('./elide-query-string.ts')

# Example 1: Parse URL query string
# query = "?name=Alice&role=admin&active=true&score=95.5"
# params = qs.parse(query)
# puts "Query: #{query}"
# puts "Parsed: #{params.inspect}"
# # Output: {:name => "Alice", :role => "admin", :active => true, :score => 95.5}

# Example 2: Stringify parameters
# params = {search: 'ruby elide', page: 2, limit: 50}
# query_string = qs.stringify(params)
# puts "Parameters: #{params.inspect}"
# puts "Query string: #{query_string}"
# # Output: search=ruby%20elide&page=2&limit=50

# Example 3: Handle arrays (consistent with Node.js!)
# query = "tags=ruby&tags=rails&tags=sinatra"
# parsed = qs.parse(query)
# puts "Array query: #{query}"
# puts "Parsed: #{parsed.inspect}"
# # Output: {:tags => ["ruby", "rails", "sinatra"]}

# Example 4: Sinatra API with consistent query parsing
# require 'sinatra'
# require 'json'
#
# get '/api/products' do
#   content_type :json
#
#   # Parse query string same way as Node.js Express!
#   params = qs.parse(request.query_string)
#
#   category = params['category']
#   brands = params['brands']  # Array support
#   min_price = params['minPrice']  # Number parsed
#   max_price = params['maxPrice']
#
#   products = Product.where(category: category)
#                     .where(brand: brands)
#                     .where('price >= ? AND price <= ?', min_price, max_price)
#
#   products.to_json
# end

# Example 5: Rails controller
# class ProductsController < ApplicationController
#   def index
#     # Instead of Rails params:
#     # qs_params = QS.parse(request.query_string)
#     #
#     # Same parsing as Node.js and Python APIs!
#     # @products = Product.filter_by(qs_params)
#     #
#     # render json: @products
#   end
# end

# Example 6: HTTP client with consistent params
# require 'net/http'
# require 'uri'
#
# def call_api_service(endpoint, params)
#   # Build query string using same logic as Node.js client
#   query = qs.stringify(params, {arrayFormat: 'bracket', sort: true})
#   url = URI("https://api.example.com/#{endpoint}?#{query}")
#
#   response = Net::HTTP.get_response(url)
#   JSON.parse(response.body)
# end
#
# # Usage
# results = call_api_service('search', {
#   q: 'elide',
#   filters: ['polyglot', 'runtime'],
#   page: 1,
#   limit: 20
# })

# Example 7: Sidekiq background job with API calls
# class DataSyncWorker
#   include Sidekiq::Worker
#
#   def perform(sync_params)
#     # Build query for external API
#     query = qs.stringify(sync_params, {arrayFormat: 'comma'})
#     url = "https://partner-api.com/data?#{query}"
#
#     # Same query format as Node.js worker!
#     response = HTTParty.get(url)
#     process_data(response.parsed_response)
#   end
# end

puts "Real-world use case:"
puts "- Ruby Sinatra API reads query: ?brands[]=nike&brands[]=adidas&page=1"
puts "- Uses same query-string parser as Node.js Express API"
puts "- Guarantees identical parameter parsing across entire platform"
puts ""

puts "Example: Microservices Parameter Consistency"
puts "┌──────────────────────────────────────┐"
puts "│  Elide Query String (TypeScript)    │"
puts "│  conversions/query-string/           │"
puts "└──────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌─────────┐ ┌─────────┐ ┌─────────┐"
puts "    │ Node.js │ │  Ruby   │ │ Python  │"
puts "    │ Express │ │ Sinatra │ │ Flask   │"
puts "    └─────────┘ └─────────┘ └─────────┘"
puts "     GET /api/search?q=shoes&brands[]=nike&brands[]=adidas"
puts "     All three parse identically:"
puts "     { q: 'shoes', brands: ['nike', 'adidas'] }"
puts "     ✓ Zero inconsistency!"
puts ""

puts "Problem Solved:"
puts "Before: Each language parses query strings differently"
puts "  - Node.js: qs.parse() → custom behavior"
puts "  - Ruby: Rack::Utils.parse_nested_query() → different array handling"
puts "  - Python: urllib.parse.parse_qs() → always returns lists"
puts "  - Result: Same query string = different parsed results = BUGS"
puts ""
puts "After: One Elide implementation = identical parsing everywhere"
puts "  - All languages use same TypeScript parser"
puts "  - Same options, same behavior, same results"
puts "  - Perfect API parameter consistency across services"
puts ""

puts "Configuration Example:"
puts "  # config/query_parsing.yml (shared by all services)"
puts "  arrayFormat: 'bracket'   # brands[]=a&brands[]=b"
puts "  parseNumbers: true       # page=1 → number"
puts "  parseBooleans: true      # active=true → boolean"
puts "  sort: true               # alphabetical keys"
puts "  "
puts "  # All microservices use identical settings:"
puts "  params = qs.parse(query_string, config)"
puts ""

puts "Use Cases:"
puts "  ✓ REST API parameter parsing (Sinatra, Rails, Rack)"
puts "  ✓ Microservice URL building (consistent with Node.js/Python)"
puts "  ✓ Search/filter query handling (arrays, nested objects)"
puts "  ✓ HTTP client query strings (API calls to other services)"
puts "  ✓ Background job parameters (Sidekiq with API integration)"
puts ""

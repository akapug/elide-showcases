#!/usr/bin/env ruby

# Ruby Integration Example for elide-leven
#
# This demonstrates calling the TypeScript Levenshtein distance implementation
# from Ruby using Elide's polyglot capabilities.
#
# Benefits:
# - One string distance implementation shared across TypeScript and Ruby
# - Consistent fuzzy matching across microservices
# - No Ruby Levenshtein gem needed
# - Perfect for Rails search, autocomplete, spell checking

puts "=== Ruby Calling TypeScript Levenshtein Distance ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# leven_module = Elide.require('./elide-leven.ts')

# Example 1: Basic String Distance
# distance = leven_module.default('cat', 'hat')
# puts "Distance between 'cat' and 'hat': #{distance}"
# puts ""

# Example 2: Rails Search with Fuzzy Matching
# class ProductsController < ApplicationController
#   def search
#     query = params[:q].downcase
#     products = Product.all
#
#     # Find products with fuzzy matching
#     results = products.map do |product|
#       distance = leven_module.default(query, product.name.downcase)
#       [product, distance]
#     end.select { |_, distance| distance <= 3 }
#        .sort_by { |_, distance| distance }
#
#     @products = results.map { |product, _| product }
#   end
# end

# Example 3: Autocomplete Suggestions
# class AutocompleteService
#   def initialize(dictionary)
#     @dictionary = dictionary
#   end
#
#   def suggest(input, max_suggestions: 5)
#     suggestions = @dictionary.map do |word|
#       distance = leven_module.default(input.downcase, word.downcase)
#       [word, distance]
#     end.select { |_, distance| distance <= 3 }
#        .sort_by { |_, distance| distance }
#        .take(max_suggestions)
#        .map { |word, _| word }
#
#     suggestions
#   end
# end
#
# autocomplete = AutocompleteService.new(['ruby', 'rails', 'sinatra', 'hanami'])
# puts "Autocomplete for 'rby':"
# puts autocomplete.suggest('rby').inspect
# puts ""

# Example 4: Sidekiq Job for Data Deduplication
# class DeduplicateCustomersJob
#   include Sidekiq::Worker
#
#   def perform(customer_ids)
#     customers = Customer.where(id: customer_ids)
#     duplicates = []
#
#     customers.each_with_index do |customer1, i|
#       customers[i+1..-1].each do |customer2|
#         distance = leven_module.default(
#           customer1.name.downcase,
#           customer2.name.downcase
#         )
#
#         if distance <= 2
#           duplicates << [customer1.id, customer2.id, distance]
#         end
#       end
#     end
#
#     # Create duplicate alerts
#     duplicates.each do |id1, id2, distance|
#       DuplicateAlert.create!(
#         customer_id_1: id1,
#         customer_id_2: id2,
#         similarity_score: distance
#       )
#     end
#
#     puts "Found #{duplicates.length} potential duplicates"
#   end
# end

# Example 5: Command Suggestion for Rake Tasks
# def suggest_rake_task(input, available_tasks)
#   suggestion = leven_module.closestMatch(
#     input,
#     available_tasks,
#     { maxDistance: 3 }
#   )
#   suggestion
# end
#
# rake_tasks = ['db:migrate', 'db:seed', 'test', 'assets:precompile']
# user_input = 'db:migarte'
# suggestion = suggest_rake_task(user_input, rake_tasks)
# if suggestion
#   puts "Task '#{user_input}' not found."
#   puts "Did you mean '#{suggestion}'?"
# end
# puts ""

puts "Real-world use cases:"
puts "- Rails fuzzy search for products/users"
puts "- Autocomplete APIs with typo tolerance"
puts "- Data deduplication in background jobs"
puts "- Command-line tool suggestions"
puts "- Natural language query processing"
puts ""

puts "Example: Rails E-Commerce Platform"
puts "┌─────────────────────────────────────┐"
puts "│   Elide Leven (TypeScript)         │"
puts "│   conversions/leven/elide-leven.ts │"
puts "└─────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Rails │  │ Sidekiq│"
puts "    │  API   │  │  App   │  │ Worker │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same fuzzy matching everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Ruby Levenshtein gem + JS leven = different results"
puts "After: One Elide implementation = 100% consistent distances"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/leven.rb"
puts "  LEVEN = Elide.require('./elide-leven.ts')"
puts "  "
puts "  # app/controllers/search_controller.rb"
puts "  class SearchController < ApplicationController"
puts "    def fuzzy_search"
puts "      distance = LEVEN.default(params[:q], product.name)"
puts "      # Process search with consistent distance"
puts "    end"
puts "  end"
puts ""

puts "Sidekiq Integration (when ready):"
puts "  class FuzzyMatchJob"
puts "    include Sidekiq::Worker"
puts "    "
puts "    def perform(str1, str2)"
puts "      distance = LEVEN.default(str1, str2)"
puts "      # Use consistent Levenshtein distance"
puts "    end"
puts "  end"

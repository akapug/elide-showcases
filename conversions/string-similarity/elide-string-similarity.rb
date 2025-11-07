#!/usr/bin/env ruby

# Ruby Integration Example for elide-string-similarity
#
# This demonstrates calling the TypeScript string similarity implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One string matching implementation shared across TypeScript and Ruby
# - Consistent fuzzy matching across microservices
# - No Ruby similarity gem needed
# - Perfect for Rails, Sidekiq, background workers

puts "=== Ruby Calling TypeScript String Similarity ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# similarity = Elide.require('./elide-string-similarity.ts')

# Example 1: Basic similarity
# score = similarity.compareTwoStrings("hello world", "hello word")
# puts "Similarity: #{score.round(3)}"
# puts ""

# Example 2: Rails ActiveRecord duplicate detection
# class Product < ApplicationRecord
#   def self.find_duplicates(threshold = 0.8)
#     similarity = Elide.require('./elide-string-similarity.ts')
#     duplicates = []
#
#     all.each_with_index do |product1, i|
#       all[i+1..-1].each do |product2|
#         score = similarity.compareTwoStrings(product1.name, product2.name)
#         duplicates << [product1, product2, score] if score >= threshold
#       end
#     end
#
#     duplicates
#   end
# end

# Example 3: Sidekiq job for name matching
# class NameMatcherJob
#   include Sidekiq::Worker
#
#   def perform(search_name, candidate_names)
#     similarity = Elide.require('./elide-string-similarity.ts')
#     result = similarity.findBestMatch(search_name, candidate_names)
#
#     best_match = result['bestMatch']
#     puts "Searching for: #{search_name}"
#     puts "Best match: #{best_match['target']} (#{best_match['rating'].round(3)})"
#
#     # Process the match...
#   end
# end

# Example 4: Search suggestions
# def autocomplete_search(query, database, limit = 5)
#   similarity = Elide.require('./elide-string-similarity.ts')
#   result = similarity.findBestMatch(query, database)
#
#   result['ratings']
#     .select { |r| r['rating'] > 0.3 }
#     .sort_by { |r| -r['rating'] }
#     .take(limit)
# end
#
# database = ["ruby", "python", "javascript", "java", "rust", "go"]
# query = "javascrip"
# suggestions = autocomplete_search(query, database)
# puts "Autocomplete for '#{query}':"
# suggestions.each do |match|
#   puts "  #{match['target']}: #{match['rating'].round(2)}"
# end

# Example 5: Customer name normalization
# class Customer
#   def self.find_by_fuzzy_name(name, threshold = 0.7)
#     similarity = Elide.require('./elide-string-similarity.ts')
#     all_names = all.pluck(:name)
#     result = similarity.findBestMatch(name, all_names)
#
#     best = result['bestMatch']
#     return nil if best['rating'] < threshold
#
#     find_by(name: best['target'])
#   end
# end

puts "Real-world use case:"
puts "- Ruby background worker needs fuzzy matching for data cleanup"
puts "- Uses same TypeScript implementation as Node.js API"
puts "- Guarantees consistent matching logic across job queue"
puts "- No gem installation needed"
puts ""

puts "Example: Rails Application"
puts "┌─────────────────────────────────────────┐"
puts "│   Elide String Similarity (TypeScript) │"
puts "│   elide-string-similarity.ts           │"
puts "└─────────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Rails │  │Sidekiq │"
puts "    │  API   │  │  App   │  │ Worker │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same fuzzy matching everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Different gems in each service = inconsistent matching"
puts "After: One Elide implementation = 100% consistent results"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/similarity.rb"
puts "  SIMILARITY = Elide.require('./elide-string-similarity.ts')"
puts "  "
puts "  # app/models/product.rb"
puts "  class Product < ApplicationRecord"
puts "    def similar_products(threshold = 0.7)"
puts "      all_names = Product.pluck(:name)"
puts "      matches = SIMILARITY.findMatches(name, all_names, threshold)"
puts "      Product.where(name: matches.map { |m| m['target'] })"
puts "    end"
puts "  end"
puts ""

puts "Sidekiq Integration (when ready):"
puts "  class DuplicateDetectorJob"
puts "    include Sidekiq::Worker"
puts "    "
puts "    def perform"
puts "      similarity = Elide.require('./elide-string-similarity.ts')"
puts "      # Use for data deduplication"
puts "    end"
puts "  end"

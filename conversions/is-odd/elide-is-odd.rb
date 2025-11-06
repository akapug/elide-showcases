#!/usr/bin/env ruby

# Ruby Integration Example for elide-is-odd
#
# This demonstrates calling the TypeScript is-odd implementation
# from Ruby using Elide's polyglot capabilities.
#
# Benefits:
# - One is-odd implementation shared across TypeScript and Ruby
# - Consistent odd/even logic across microservices
# - No Ruby .odd? method inconsistencies
# - Perfect for Rails validations, helpers

puts "=== Ruby Calling TypeScript is-odd ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# is_odd_module = Elide.require('./elide-is-odd.ts')

# Example 1: ActiveRecord Validation
# class User < ApplicationRecord
#   validate :user_id_must_be_odd
#
#   private
#
#   def user_id_must_be_odd
#     unless is_odd_module.default(id)
#       errors.add(:id, "must be an odd number")
#     end
#   end
# end

# Example 2: Array Filtering
# numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
# odd_numbers = numbers.select { |n| is_odd_module.default(n) }
# puts "Odd numbers: #{odd_numbers}"
# # => [1, 3, 5, 7, 9]

# Example 3: Rails Helper
# module ApplicationHelper
#   def highlight_odd_rows(index)
#     is_odd_module.default(index) ? 'bg-gray-100' : 'bg-white'
#   end
# end
#
# # In view:
# # <% @items.each_with_index do |item, i| %>
# #   <tr class="<%= highlight_odd_rows(i) %>">
# #     <td><%= item.name %></td>
# #   </tr>
# # <% end %>

# Example 4: Sidekiq Job Batching
# class DataProcessor
#   include Sidekiq::Worker
#
#   def perform(batch_id)
#     # Process differently based on odd/even batch
#     strategy = is_odd_module.default(batch_id) ? :fast : :thorough
#     process_with_strategy(strategy)
#   end
#
#   def process_with_strategy(strategy)
#     # Implementation
#   end
# end

# Example 5: Pagination
# class PaginationHelper
#   def self.page_class(page_num)
#     if is_odd_module.default(page_num)
#       'odd-page'
#     else
#       'even-page'
#     end
#   end
# end
#
# (1..10).each do |page|
#   puts "Page #{page}: #{PaginationHelper.page_class(page)}"
# end

# Example 6: Rake Task
# namespace :users do
#   desc "Process users with odd IDs"
#   task :process_odd => :environment do
#     User.find_each do |user|
#       if is_odd_module.default(user.id)
#         puts "Processing user ##{user.id}"
#         # Process user
#       end
#     end
#   end
# end

puts "Real-world use cases:"
puts "- ActiveRecord validations"
puts "- View helper methods (row highlighting)"
puts "- Background job batching strategies"
puts "- Pagination UI classes"
puts "- Data filtering and selection"
puts "- Algorithm implementations"
puts ""

puts "Example: Rails E-Commerce Platform"
puts "┌──────────────────────────────────────┐"
puts "│   Elide is-odd (TypeScript)         │"
puts "│   elide-is-odd.ts                   │"
puts "└──────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Rails │  │ Sidekiq│"
puts "    │  API   │  │  App   │  │ Worker │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same validation everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Ruby .odd? + JS % operator = potential inconsistencies"
puts "After: One Elide implementation = consistent odd/even checks"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/is_odd.rb"
puts "  IS_ODD = Elide.require('./elide-is-odd.ts')"
puts "  "
puts "  # app/helpers/application_helper.rb"
puts "  module ApplicationHelper"
puts "    def odd?(num)"
puts "      IS_ODD.default(num)"
puts "    end"
puts "  end"
puts ""

puts "Edge Cases Handled:"
puts "- Negative numbers: odd?(-3) -> true"
puts "- Zero: odd?(0) -> false"
puts "- Non-integers: odd?(3.5) -> false"
puts "- Strings: odd?('5') -> true"

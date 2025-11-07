#!/usr/bin/env ruby
# Pluralize - Ruby Integration Example

# When Elide's Ruby API is ready:
# pluralize_module = Elide.require('./elide-pluralize.ts')

puts "📝 Pluralize - Ruby Integration Example\n\n"
puts "Once Elide's Ruby API is available:"
puts "  pluralize = Elide.require('./elide-pluralize.ts')\n\n"

puts "=== Example 1: Rails Model Names ==="
puts "# Consistent with JavaScript frontend"
puts "class Product < ApplicationRecord"
puts "  # pluralize_module.default('Product') → 'Products'"
puts "end"
puts

puts "=== Example 2: View Helpers ==="
puts "module ApplicationHelper"
puts "  def item_count(count, word)"
puts "    pluralized = pluralize_module.pluralize(word, count)"
puts "    \"\#{count} \#{pluralized}\""
puts "  end"
puts "end"
puts "# <%= item_count(5, 'item') %> → '5 items'"
puts

puts "=== Example 3: API Responses ==="
puts "def index"
puts "  count = @items.count"
puts "  word = pluralize_module.pluralize('item', count)"
puts "  render json: { message: \"\#{count} \#{word} found\" }"
puts "end"
puts

puts "💡 Use Cases:"
puts "- Rails model naming"
puts "- View helper methods"
puts "- API response messages"
puts "- Mailer templates"

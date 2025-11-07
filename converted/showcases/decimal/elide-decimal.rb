#!/usr/bin/env ruby

# Ruby Integration Example for elide-decimal
#
# This demonstrates calling the TypeScript decimal.js implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One decimal library shared across TypeScript and Ruby
# - Consistent financial calculations across services
# - No floating-point errors in money calculations
# - Perfect for Rails, Sidekiq, payment processing

puts "=== Ruby Calling TypeScript Decimal ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# Decimal = Elide.require('./elide-decimal.ts').Decimal

# Example 1: Fix Floating-Point Errors
# puts "Ruby native: 0.1 + 0.2 = #{0.1 + 0.2}"  # 0.30000000000000004
# dec_a = Decimal.new('0.1')
# dec_b = Decimal.new('0.2')
# puts "Decimal:     0.1 + 0.2 = #{dec_a.plus(dec_b).toString()}"  # 0.3
# puts ""

# Example 2: Rails Model with Decimal Prices
# class Product < ApplicationRecord
#   def total_price(quantity)
#     price_decimal = Decimal.new(price.to_s)
#     qty_decimal = Decimal.new(quantity.to_s)
#     price_decimal.times(qty_decimal).toFixed(2)
#   end
#
#   def price_with_tax(tax_rate)
#     price_decimal = Decimal.new(price.to_s)
#     tax_decimal = Decimal.new(tax_rate.to_s)
#     total = price_decimal.times(Decimal.new('1').plus(tax_decimal))
#     total.toFixed(2)
#   end
# end
#
# product = Product.new(name: "Widget", price: 19.99)
# puts "Product: #{product.name}"
# puts "Price: $#{product.price}"
# puts "Total (10 units): $#{product.total_price(10)}"
# puts "Price with 8.25% tax: $#{product.price_with_tax(0.0825)}"
# puts ""

# Example 3: Sidekiq Job for Payment Processing
# class ProcessPaymentJob
#   include Sidekiq::Worker
#
#   def perform(amount_str, fee_percent_str)
#     amount = Decimal.new(amount_str)
#     fee_percent = Decimal.new(fee_percent_str)
#
#     fee = amount.times(fee_percent)
#     total = amount.plus(fee)
#
#     puts "Payment Processing:"
#     puts "  Amount: $#{amount.toFixed(2)}"
#     puts "  Fee: $#{fee.toFixed(2)}"
#     puts "  Total: $#{total.toFixed(2)}"
#
#     # Process payment with exact amounts
#     charge_customer(total.toFixed(2))
#   end
# end
#
# ProcessPaymentJob.perform_async('99.99', '0.029')

# Example 4: Currency Conversion
# def convert_currency(amount_str, from_currency, to_currency)
#   amount = Decimal.new(amount_str)
#
#   # Fetch exchange rate (example)
#   exchange_rate = Decimal.new('0.92')  # USD to EUR
#
#   converted = amount.times(exchange_rate)
#
#   {
#     from: "#{from_currency} #{amount.toFixed(2)}",
#     to: "#{to_currency} #{converted.toFixed(2)}",
#     rate: exchange_rate.toString()
#   }
# end
#
# result = convert_currency('1000.50', 'USD', 'EUR')
# puts "Currency Conversion:"
# puts "  From: #{result[:from]}"
# puts "  Rate: #{result[:rate]}"
# puts "  To: #{result[:to]}"
# puts ""

# Example 5: Shopping Cart Calculation
# class ShoppingCart
#   attr_accessor :items
#
#   def initialize
#     @items = []
#   end
#
#   def add_item(name, price_str, quantity)
#     @items << {
#       name: name,
#       price: Decimal.new(price_str),
#       quantity: Decimal.new(quantity.to_s)
#     }
#   end
#
#   def subtotal
#     total = Decimal.new('0')
#     @items.each do |item|
#       item_total = item[:price].times(item[:quantity])
#       total = total.plus(item_total)
#     end
#     total
#   end
#
#   def tax(rate_str)
#     rate = Decimal.new(rate_str)
#     subtotal.times(rate)
#   end
#
#   def total(tax_rate_str)
#     subtotal.plus(tax(tax_rate_str))
#   end
# end
#
# cart = ShoppingCart.new
# cart.add_item("Widget A", "12.99", 5)
# cart.add_item("Widget B", "8.49", 10)
# cart.add_item("Widget C", "24.95", 3)
#
# puts "Shopping Cart:"
# cart.items.each do |item|
#   item_total = item[:price].times(item[:quantity])
#   puts "  #{item[:name]}: $#{item[:price].toFixed(2)} × #{item[:quantity].toString()} = $#{item_total.toFixed(2)}"
# end
# puts "  Subtotal: $#{cart.subtotal.toFixed(2)}"
# puts "  Tax (8.25%): $#{cart.tax('0.0825').toFixed(2)}"
# puts "  Total: $#{cart.total('0.0825').toFixed(2)}"
# puts ""

puts "Real-world use case:"
puts "- Ruby Rails app calculates order totals"
puts "- Uses same TypeScript decimal implementation as Node.js API"
puts "- Guarantees consistent pricing across entire e-commerce platform"
puts "- No BigDecimal vs JavaScript Number discrepancies"
puts ""

puts "Example: E-commerce Platform"
puts "┌─────────────────────────────────────┐"
puts "│   Elide Decimal (TypeScript)       │"
puts "│   conversions/decimal/elide-decimal.ts"
puts "└─────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Rails  │"
puts "    │  API   │  │Workers │  │  App   │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same pricing precision everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Ruby BigDecimal + JavaScript Number = rounding differences"
puts "After: One Elide implementation = identical calculations"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/decimal.rb"
puts "  Decimal = Elide.require('./elide-decimal.ts').Decimal"
puts "  "
puts "  # app/models/order.rb"
puts "  class Order < ApplicationRecord"
puts "    def total_with_tax"
puts "      price = Decimal.new(amount.to_s)"
puts "      tax = price.times(Decimal.new('0.0825'))"
puts "      price.plus(tax).toFixed(2)"
puts "    end"
puts "  end"
puts ""

puts "Sidekiq Integration (when ready):"
puts "  class PaymentJob"
puts "    include Sidekiq::Worker"
puts "    "
puts "    def perform(amount_str)"
puts "      amount = Decimal.new(amount_str)"
puts "      fee = amount.times(Decimal.new('0.029'))"
puts "      total = amount.plus(fee)"
puts "      # Process with exact precision"
puts "    end"
puts "  end"
puts ""

puts "Financial Precision:"
puts "  # Native Ruby float (WRONG):"
puts "  0.1 + 0.2 = 0.30000000000000004"
puts ""
puts "  # Elide Decimal (CORRECT):"
puts "  Decimal.new('0.1').plus('0.2') = '0.3'"
puts ""
puts "  # Perfect for money calculations!"

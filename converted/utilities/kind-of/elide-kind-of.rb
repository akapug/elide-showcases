#!/usr/bin/env ruby

# Ruby Integration Example for elide-kind-of
#
# This demonstrates calling the TypeScript type detection implementation
# from Ruby using Elide's polyglot capabilities.
#
# Benefits:
# - One type checker shared across TypeScript and Ruby
# - Consistent type detection across microservices
# - Handles JavaScript-specific types
# - Perfect for Rails debugging, logging

puts "=== Ruby Calling TypeScript Type Checker ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# kind_of_module = Elide.require('./elide-kind-of.ts')

# Example 1: Debug Logging in Rails
# class ApplicationController < ActionController::Base
#   def debug_with_type(value, context = '')
#     type_info = kind_of_module.default(value)
#     Rails.logger.debug("[#{context}] value=#{value}, type=#{type_info}")
#   end
# end

# Example 2: Type-Based Processing
# def process_by_type(value)
#   case kind_of_module.default(value)
#   when 'number'
#     value * 2
#   when 'string'
#     value.upcase
#   when 'array'
#     value.length
#   else
#     "Unknown type"
#   end
# end

puts "Real-world use cases:"
puts "- Rails logging with accurate type info"
puts "- API response validation"
puts "- Dynamic type-based processing"
puts "- JavaScript object inspection"
puts ""

puts "Handles JavaScript-specific types:"
puts "  ✓ Map, Set, Promise"
puts "  ✓ TypedArrays"
puts "  ✓ Generators, Iterators"

#!/usr/bin/env ruby

# Ruby Integration Example for elide-is-primitive
#
# This demonstrates calling the TypeScript primitive type checker from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One type checker shared across TypeScript and Ruby
# - Consistent primitive validation across microservices
# - Zero dependencies in both languages
# - Perfect for Rails models, validation, serialization

puts "=== Ruby Calling TypeScript is-primitive ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API
# Assuming: is_primitive = Elide.require('./elide-is-primitive.ts')

# Example 1: Rails Model Validation
# class User < ApplicationRecord
#   validate :primitive_attributes
#
#   def primitive_attributes
#     [:name, :email, :age].each do |attr|
#       value = send(attr)
#       unless is_primitive.default(value)
#         errors.add(attr, "must be a primitive type")
#       end
#     end
#   end
# end

# Example 2: JSON Serialization Helper
# module SerializationHelper
#   def self.can_serialize?(value)
#     is_primitive.default(value)
#   end
#
#   def self.prepare_for_json(hash)
#     hash.select { |k, v| can_serialize?(v) }
#   end
# end
#
# data = { name: "John", age: 30, callback: proc {} }
# serializable = SerializationHelper.prepare_for_json(data)
# puts "Serializable: #{serializable}"
# puts ""

# Example 3: Cache Key Generation
# class CacheKeyGenerator
#   def self.generate(params)
#     primitive_params = params.select { |k, v|
#       is_primitive.default(v)
#     }
#     primitive_params.sort.to_s
#   end
# end
#
# params = { id: 1, name: "test", obj: {} }
# key = CacheKeyGenerator.generate(params)
# puts "Cache key: #{key}"
# puts ""

# Example 4: Deep Clone Optimization
# class DeepClone
#   def self.clone(obj)
#     if is_primitive.default(obj)
#       obj  # Primitives don't need cloning
#     elsif obj.is_a?(Hash)
#       obj.transform_values { |v| clone(v) }
#     elsif obj.is_a?(Array)
#       obj.map { |item| clone(item) }
#     else
#       obj.dup rescue obj
#     end
#   end
# end
#
# data = { name: "test", count: 5, nested: { val: 10 } }
# cloned = DeepClone.clone(data)
# puts "Cloned: #{cloned}"
# puts ""

# Example 5: API Parameter Validator
# class APIValidator
#   def self.validate_primitives(params, required_fields)
#     errors = []
#     required_fields.each do |field|
#       if params.key?(field)
#         unless is_primitive.default(params[field])
#           errors << "#{field} must be primitive"
#         end
#       end
#     end
#     errors
#   end
# end
#
# params = { name: "John", age: 30, settings: {} }
# errors = APIValidator.validate_primitives(params, [:name, :age, :settings])
# puts "Errors: #{errors}"
# puts ""

puts "Real-world use cases:"
puts "- Rails model validation"
puts "- JSON serialization helpers"
puts "- Cache key generation"
puts "- Deep clone optimization"
puts "- API parameter validation"
puts "- Type guards for primitives"
puts ""

puts "Problem Solved:"
puts "Before: Different primitive checks in TypeScript vs Ruby"
puts "After: One Elide implementation = consistent behavior"
puts ""

puts "When Elide Ruby API is ready:"
puts "  is_primitive = Elide.require('./elide-is-primitive.ts')"
puts "  result = is_primitive.default(5)  # true"

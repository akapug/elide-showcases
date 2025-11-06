#!/usr/bin/env ruby

# Ruby Integration Example for elide-deep-equal

puts "=== Ruby Calling TypeScript Deep Equal ===\n"

# Example: Deep comparison
# obj1 = { user: { name: 'Alice', age: 25 } }
# obj2 = { user: { name: 'Alice', age: 25 } }
# equal = deep_equal_module.default(obj1, obj2)
# puts "Equal: #{equal}"  # true

puts "Real-world use case:"
puts "- Ruby RSpec tests use deep equal for assertions"
puts "- Uses same TypeScript implementation as Node.js"
puts "- No custom deep comparison needed"
puts ""

puts "RSpec Integration (when ready):"
puts "  DEEP_EQUAL = Elide.require('./elide-deep-equal.ts')"

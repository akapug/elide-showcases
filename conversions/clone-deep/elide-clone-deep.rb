#!/usr/bin/env ruby

# Ruby Integration Example for elide-clone-deep

puts "=== Ruby Calling TypeScript Clone Deep ===\n"

# Example: Clone nested hash
# original = { user: { name: 'Alice', age: 25 } }
# cloned = clone_deep_module.default(original)
# cloned[:user][:age] = 30
# puts "Original: #{original[:user][:age]}"  # 25
# puts "Cloned: #{cloned[:user][:age]}"      # 30

puts "Real-world use case:"
puts "- Ruby Rails app clones state for immutable updates"
puts "- Uses same TypeScript implementation as Node.js"
puts "- No Marshal.load(Marshal.dump()) needed"
puts ""

puts "Rails Integration (when ready):"
puts "  CLONE_DEEP = Elide.require('./elide-clone-deep.ts')"

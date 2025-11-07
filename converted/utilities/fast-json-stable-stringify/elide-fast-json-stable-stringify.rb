#!/usr/bin/env ruby

# Ruby Integration Example for elide-fast-json-stable-stringify

puts "=== Ruby Calling TypeScript Stable Stringify ===\n"

# stringify = Elide.require('./elide-fast-json-stable-stringify.ts')
# data = { page: 1, limit: 10, sort: "name" }
# cache_key = stringify.stringify(data)
# puts "Cache key: #{cache_key}"

puts "Real-world use case:"
puts "- Ruby worker generates cache keys"
puts "- Uses same implementation as Node.js API"
puts "- Identical JSON serialization across services"
puts ""

puts "Ruby Integration (when ready):"
puts "  stringify = Elide.require('./elide-fast-json-stable-stringify.ts')"
puts "  json = stringify.stringify(data)"

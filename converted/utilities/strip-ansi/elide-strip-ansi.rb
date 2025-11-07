#!/usr/bin/env ruby

# Ruby Integration Example for elide-strip-ansi

puts "=== Ruby Calling TypeScript Strip ANSI ===\n"

# stripAnsi = Elide.require('./elide-strip-ansi.ts')
# log = "\x1b[31mERROR\x1b[0m Connection failed"
# clean = stripAnsi.strip(log)
# puts clean  # "ERROR Connection failed"

puts "Real-world use case:"
puts "- Ruby worker processes colored terminal output"
puts "- Uses same implementation as Node.js logger"
puts "- Consistent log cleaning across services"
puts ""

puts "Ruby Integration (when ready):"
puts "  stripAnsi = Elide.require('./elide-strip-ansi.ts')"
puts "  clean_text = stripAnsi.strip(colored_text)"

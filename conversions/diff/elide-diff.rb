#!/usr/bin/env ruby

# Ruby Integration Example for elide-diff
#
# This demonstrates calling the TypeScript diff implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One diff library shared across TypeScript and Ruby
# - Consistent text comparison across microservices
# - No Ruby diff-lcs gem needed for many cases
# - Perfect for Rails version control, change detection

puts "=== Ruby Calling TypeScript Diff Library ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# diff_module = Elide.require('./elide-diff.ts')

# Example 1: Rails Model Versioning
# class Article < ApplicationRecord
#   after_update :track_changes
#
#   def track_changes
#     old_content = content_was
#     new_content = content
#     changes = diff_module.diffLines(old_content, new_content)
#     VersionHistory.create(article: self, changes: changes.to_json)
#   end
# end

# Example 2: Code Review Tool
# class PullRequest
#   def file_diff(file_path)
#     old_content = base_branch.read(file_path)
#     new_content = head_branch.read(file_path)
#     diff_module.createPatch(file_path, old_content, new_content)
#   end
# end

puts "Real-world use case:"
puts "- Ruby Rails app tracks document changes"
puts "- Uses same TypeScript implementation as Node.js editor"
puts "- Guarantees consistent change history"
puts "- No diff-lcs gem needed"
puts ""

puts "Example: Version Control System"
puts "┌─────────────────────────────────────────────┐"
puts "│   Elide Diff (TypeScript)                  │"
puts "│   elide-diff.ts                            │"
puts "└─────────────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Rails  │"
puts "    │ Editor │  │ Worker │  │  App   │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same diff format everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Different diff libraries = inconsistent change detection"
puts "After: One Elide implementation = unified diffs"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/diff.rb"
puts "  DIFF = Elide.require('./elide-diff.ts')"
puts "  "
puts "  # app/models/document.rb"
puts "  def track_changes"
puts "    DIFF.diffLines(content_was, content)"
puts "  end"

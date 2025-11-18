#!/usr/bin/env ruby
# Polyglot Testing Example - Ruby
#
# Demonstrates testing Ruby code from QUnit tests.
# This shows how Elide enables true polyglot testing.

# Calculate the nth Fibonacci number
def fibonacci(n)
  return n if n <= 1
  fibonacci(n - 1) + fibonacci(n - 2)
end

# Reverse a string
def reverse_string(s)
  s.reverse
end

# Check if a string is a palindrome
def palindrome?(s)
  s = s.downcase.gsub(/\s+/, '')
  s == s.reverse
end

# Calculate factorial of n
def factorial(n)
  return 1 if n <= 1
  n * factorial(n - 1)
end

# A simple calculator class
class Calculator
  attr_reader :result

  def initialize
    @result = 0
  end

  def add(a, b)
    @result = a + b
  end

  def multiply(a, b)
    @result = a * b
  end

  def divide(a, b)
    raise ArgumentError, 'Cannot divide by zero' if b == 0
    @result = a.to_f / b
  end
end

# String utilities
class StringUtils
  def self.titleize(s)
    s.split.map(&:capitalize).join(' ')
  end

  def self.slugify(s)
    s.downcase.gsub(/\s+/, '-')
  end

  def self.word_count(s)
    s.split.length
  end
end

# Example usage
if __FILE__ == $0
  puts "Fibonacci(10) = #{fibonacci(10)}"
  puts "Reverse 'hello' = #{reverse_string('hello')}"
  puts "Is 'racecar' a palindrome? #{palindrome?('racecar')}"
  puts "Factorial(5) = #{factorial(5)}"

  calc = Calculator.new
  puts "5 + 3 = #{calc.add(5, 3)}"
  puts "4 * 6 = #{calc.multiply(4, 6)}"

  puts "Titleize: #{StringUtils.titleize('hello world')}"
  puts "Slugify: #{StringUtils.slugify('Hello World')}"
end

#!/usr/bin/env ruby
# frozen_string_literal: true

# Testing Framework - Ruby RSpec Patterns

module RSpecRunner
  class TestSuite
    def initialize(name)
      @name = name
      @tests = []
      @results = []
    end

    def add_test(description, &block)
      @tests << { description: description, block: block }
    end

    def run
      @results = []
      @tests.each do |test|
        begin
          test[:block].call
          @results << {
            description: test[:description],
            status: 'passed',
            error: nil
          }
        rescue StandardError => e
          @results << {
            description: test[:description],
            status: 'failed',
            error: e.message
          }
        end
      end

      {
        suite: @name,
        total: @tests.size,
        passed: @results.count { |r| r[:status] == 'passed' },
        failed: @results.count { |r| r[:status] == 'failed' },
        results: @results
      }
    end
  end

  class Expectation
    def initialize(actual)
      @actual = actual
    end

    def to_eq(expected)
      raise "Expected #{expected}, got #{@actual}" unless @actual == expected
    end

    def to_be_truthy
      raise "Expected truthy value, got #{@actual}" unless @actual
    end

    def to_be_nil
      raise "Expected nil, got #{@actual}" unless @actual.nil?
    end
  end

  def self.expect(value)
    Expectation.new(value)
  end
end

def create_test_suite(name)
  RSpecRunner::TestSuite.new(name)
end

def expect(value)
  RSpecRunner.expect(value)
end

def run_example_tests
  suite = create_test_suite("Example Tests")

  suite.add_test("addition works") do
    expect(2 + 2).to_eq(4)
  end

  suite.add_test("strings concatenate") do
    expect("hello" + " world").to_eq("hello world")
  end

  suite.add_test("arrays are not empty") do
    expect([1, 2, 3].any?).to_be_truthy
  end

  suite.run
end

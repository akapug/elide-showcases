# frozen_string_literal: true

##
# Yup for Ruby - Schema Validation
# Ruby interface to Yup schemas running on Elide
#
# Example:
#   require 'yup'
#
#   user_schema = Yup.object({
#     name: Yup.string.required,
#     email: Yup.string.email.required,
#     age: Yup.number.positive.integer
#   })
#
#   result = user_schema.validate({ name: 'John', email: 'john@example.com', age: 30 })

module Yup
  ##
  # Base schema class
  class Schema
    attr_reader :config

    def initialize(type)
      @config = { type: type }
    end

    def required(message = nil)
      @config[:required] = true
      @config[:required_message] = message if message
      self
    end

    def optional
      @config[:optional] = true
      self
    end

    def nullable
      @config[:nullable] = true
      self
    end

    def default(value)
      @config[:default] = value
      self
    end

    def one_of(values, message = nil)
      @config[:one_of] = values
      @config[:one_of_message] = message if message
      self
    end

    def not_one_of(values, message = nil)
      @config[:not_one_of] = values
      @config[:not_one_of_message] = message if message
      self
    end

    def label(label)
      @config[:label] = label
      self
    end

    def validate(data, options = {})
      # This will be intercepted by Elide's polyglot runtime
      Elide.eval('YupRubyBridge.validateFromRuby', @config, data, options)
    end

    def validate_sync(data, options = {})
      Elide.eval('YupRubyBridge.validateSyncFromRuby', @config, data, options)
    end

    def valid?(data, options = {})
      Elide.eval('YupRubyBridge.isValidFromRuby', @config, data, options)
    end
  end

  ##
  # String validation schema
  class StringSchema < Schema
    def initialize
      super('string')
    end

    def min(length, message = nil)
      @config[:min] = length
      @config[:min_message] = message if message
      self
    end

    def max(length, message = nil)
      @config[:max] = length
      @config[:max_message] = message if message
      self
    end

    def length(length, message = nil)
      @config[:length] = length
      @config[:length_message] = message if message
      self
    end

    def email(message = nil)
      @config[:email] = true
      @config[:email_message] = message if message
      self
    end

    def url(message = nil)
      @config[:url] = true
      @config[:url_message] = message if message
      self
    end

    def uuid(message = nil)
      @config[:uuid] = true
      @config[:uuid_message] = message if message
      self
    end

    def matches(pattern, message = nil)
      @config[:matches] = pattern
      @config[:matches_message] = message if message
      self
    end

    def lowercase
      @config[:lowercase] = true
      self
    end

    def uppercase
      @config[:uppercase] = true
      self
    end

    def trim
      @config[:trim] = true
      self
    end
  end

  ##
  # Number validation schema
  class NumberSchema < Schema
    def initialize
      super('number')
    end

    def min(value, message = nil)
      @config[:min] = value
      @config[:min_message] = message if message
      self
    end

    def max(value, message = nil)
      @config[:max] = value
      @config[:max_message] = message if message
      self
    end

    def less_than(value, message = nil)
      @config[:less_than] = value
      @config[:less_than_message] = message if message
      self
    end

    def more_than(value, message = nil)
      @config[:more_than] = value
      @config[:more_than_message] = message if message
      self
    end

    def positive(message = nil)
      @config[:positive] = true
      @config[:positive_message] = message if message
      self
    end

    def negative(message = nil)
      @config[:negative] = true
      @config[:negative_message] = message if message
      self
    end

    def integer(message = nil)
      @config[:integer] = true
      @config[:integer_message] = message if message
      self
    end
  end

  ##
  # Boolean validation schema
  class BooleanSchema < Schema
    def initialize
      super('boolean')
    end
  end

  ##
  # Date validation schema
  class DateSchema < Schema
    def initialize
      super('date')
    end

    def min(date, message = nil)
      @config[:min] = date
      @config[:min_message] = message if message
      self
    end

    def max(date, message = nil)
      @config[:max] = date
      @config[:max_message] = message if message
      self
    end
  end

  ##
  # Array validation schema
  class ArraySchema < Schema
    def initialize(item_schema = nil)
      super('array')
      @config[:of] = item_schema.config if item_schema
    end

    def of(item_schema)
      @config[:of] = item_schema.config
      self
    end

    def min(length, message = nil)
      @config[:min] = length
      @config[:min_message] = message if message
      self
    end

    def max(length, message = nil)
      @config[:max] = length
      @config[:max_message] = message if message
      self
    end

    def length(length, message = nil)
      @config[:length] = length
      @config[:length_message] = message if message
      self
    end
  end

  ##
  # Object validation schema
  class ObjectSchema < Schema
    def initialize(shape = nil)
      super('object')
      if shape
        @config[:shape] = shape.transform_values(&:config)
      end
    end

    def shape(shape)
      @config[:shape] = shape.transform_values(&:config)
      self
    end

    def no_unknown(message = nil)
      @config[:no_unknown] = true
      @config[:no_unknown_message] = message if message
      self
    end
  end

  # Factory methods
  def self.string
    StringSchema.new
  end

  def self.number
    NumberSchema.new
  end

  def self.boolean
    BooleanSchema.new
  end

  def self.date
    DateSchema.new
  end

  def self.array(item_schema = nil)
    ArraySchema.new(item_schema)
  end

  def self.object(shape = nil)
    ObjectSchema.new(shape)
  end

  def self.mixed
    Schema.new('mixed')
  end
end

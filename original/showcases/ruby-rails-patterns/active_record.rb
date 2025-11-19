#!/usr/bin/env ruby
# frozen_string_literal: true

# Ruby Rails Patterns - ActiveRecord-style ORM
# Direct import from TypeScript via Elide polyglot

require 'json'
require 'time'

module ActiveRecord
  # Base class for models
  class Base
    attr_accessor :id, :created_at, :updated_at, :attributes

    def initialize(attrs = {})
      @attributes = attrs
      @id = attrs[:id]
      @created_at = attrs[:created_at] || Time.now
      @updated_at = attrs[:updated_at] || Time.now
    end

    def save
      @updated_at = Time.now
      self.class.store(self)
      self
    end

    def update(attrs)
      @attributes.merge!(attrs)
      @updated_at = Time.now
      save
    end

    def to_h
      {
        id: @id,
        created_at: @created_at.iso8601,
        updated_at: @updated_at.iso8601,
        **@attributes
      }
    end

    def self.store(record)
      @records ||= {}
      record.id ||= (@records.keys.max || 0) + 1
      @records[record.id] = record
    end

    def self.all
      @records ||= {}
      @records.values
    end

    def self.find(id)
      @records ||= {}
      @records[id]
    end

    def self.where(conditions)
      all.select do |record|
        conditions.all? do |key, value|
          record.attributes[key] == value
        end
      end
    end

    def self.count
      @records&.size || 0
    end

    def self.destroy_all
      @records = {}
    end
  end

  # User model
  class User < Base
    def initialize(attrs = {})
      super(attrs)
      @attributes[:name] ||= ''
      @attributes[:email] ||= ''
      @attributes[:role] ||= 'user'
    end

    def name
      @attributes[:name]
    end

    def name=(value)
      @attributes[:name] = value
    end

    def email
      @attributes[:email]
    end

    def email=(value)
      @attributes[:email] = value
    end

    def admin?
      @attributes[:role] == 'admin'
    end
  end

  # Post model
  class Post < Base
    def initialize(attrs = {})
      super(attrs)
      @attributes[:title] ||= ''
      @attributes[:content] ||= ''
      @attributes[:user_id] ||= nil
      @attributes[:published] ||= false
    end

    def title
      @attributes[:title]
    end

    def content
      @attributes[:content]
    end

    def published?
      @attributes[:published]
    end

    def publish
      @attributes[:published] = true
      save
    end

    def user
      User.find(@attributes[:user_id]) if @attributes[:user_id]
    end
  end

  # Query builder
  class Relation
    def initialize(model)
      @model = model
      @conditions = {}
      @limit_value = nil
      @offset_value = nil
      @order_by = nil
    end

    def where(conditions)
      @conditions.merge!(conditions)
      self
    end

    def limit(value)
      @limit_value = value
      self
    end

    def offset(value)
      @offset_value = value
      self
    end

    def order(field)
      @order_by = field
      self
    end

    def to_a
      results = @model.where(@conditions)
      results = results.sort_by { |r| r.attributes[@order_by] } if @order_by
      results = results.drop(@offset_value) if @offset_value
      results = results.take(@limit_value) if @limit_value
      results
    end

    def first
      to_a.first
    end

    def last
      to_a.last
    end

    def count
      to_a.size
    end
  end
end

# Helper methods for TypeScript
def create_user(name, email, role = 'user')
  user = ActiveRecord::User.new(name: name, email: email, role: role)
  user.save
  user.to_h
end

def create_post(title, content, user_id)
  post = ActiveRecord::Post.new(title: title, content: content, user_id: user_id)
  post.save
  post.to_h
end

def get_all_users
  ActiveRecord::User.all.map(&:to_h)
end

def get_all_posts
  ActiveRecord::Post.all.map(&:to_h)
end

def find_user(id)
  user = ActiveRecord::User.find(id)
  user&.to_h
end

# Seed some data
def seed_data
  admin = ActiveRecord::User.new(name: 'Admin', email: 'admin@example.com', role: 'admin')
  admin.save

  user1 = ActiveRecord::User.new(name: 'Alice', email: 'alice@example.com')
  user1.save

  post1 = ActiveRecord::Post.new(title: 'Hello World', content: 'First post!', user_id: user1.id)
  post1.save

  { users: ActiveRecord::User.count, posts: ActiveRecord::Post.count }
end

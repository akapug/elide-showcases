#!/usr/bin/env python3
"""
Polyglot Testing Example - Python

Demonstrates testing Python code from QUnit tests.
This shows how Elide enables true polyglot testing.
"""

def calculate_fibonacci(n):
    """Calculate the nth Fibonacci number."""
    if n <= 1:
        return n
    return calculate_fibonacci(n - 1) + calculate_fibonacci(n - 2)

def reverse_string(s):
    """Reverse a string."""
    return s[::-1]

def is_palindrome(s):
    """Check if a string is a palindrome."""
    s = s.lower().replace(' ', '')
    return s == s[::-1]

def factorial(n):
    """Calculate factorial of n."""
    if n <= 1:
        return 1
    return n * factorial(n - 1)

class Calculator:
    """A simple calculator class."""

    def __init__(self):
        self.result = 0

    def add(self, a, b):
        """Add two numbers."""
        self.result = a + b
        return self.result

    def multiply(self, a, b):
        """Multiply two numbers."""
        self.result = a * b
        return self.result

    def divide(self, a, b):
        """Divide two numbers."""
        if b == 0:
            raise ValueError("Cannot divide by zero")
        self.result = a / b
        return self.result

# Example usage
if __name__ == '__main__':
    print(f"Fibonacci(10) = {calculate_fibonacci(10)}")
    print(f"Reverse 'hello' = {reverse_string('hello')}")
    print(f"Is 'racecar' a palindrome? {is_palindrome('racecar')}")
    print(f"Factorial(5) = {factorial(5)}")

    calc = Calculator()
    print(f"5 + 3 = {calc.add(5, 3)}")
    print(f"4 * 6 = {calc.multiply(4, 6)}")

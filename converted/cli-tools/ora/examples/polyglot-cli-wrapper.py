#!/usr/bin/env python3
"""
Ora Polyglot Wrapper for Python

Demonstrates showing progress indicators from Python using ora concepts.
While ora is a TypeScript library, this shows equivalent Python patterns.
"""

import time
import sys
import threading
from typing import Optional


class SimpleSpinner:
    """
    Simple spinner implementation in Python (ora-inspired).
    For actual cross-language usage, you'd call ora CLI or use Python's own spinners.
    """

    def __init__(self, text: str = "Loading..."):
        self.text = text
        self.frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
        self.frame_index = 0
        self.is_spinning = False
        self.thread: Optional[threading.Thread] = None

    def _spin(self):
        """Internal spinner loop"""
        while self.is_spinning:
            sys.stderr.write(f'\r{self.frames[self.frame_index]} {self.text}')
            sys.stderr.flush()
            self.frame_index = (self.frame_index + 1) % len(self.frames)
            time.sleep(0.08)

    def start(self):
        """Start the spinner"""
        self.is_spinning = True
        self.thread = threading.Thread(target=self._spin)
        self.thread.start()
        return self

    def stop(self):
        """Stop the spinner"""
        self.is_spinning = False
        if self.thread:
            self.thread.join()
        sys.stderr.write('\r\033[K')  # Clear line
        sys.stderr.flush()

    def succeed(self, text: Optional[str] = None):
        """Stop with success"""
        self.stop()
        print(f'✔ {text or self.text}')

    def fail(self, text: Optional[str] = None):
        """Stop with failure"""
        self.stop()
        print(f'✖ {text or self.text}')

    def warn(self, text: Optional[str] = None):
        """Stop with warning"""
        self.stop()
        print(f'⚠ {text or self.text}')

    def info(self, text: Optional[str] = None):
        """Stop with info"""
        self.stop()
        print(f'ℹ {text or self.text}')


def example_basic():
    """Example 1: Basic spinner"""
    print("=== Example 1: Basic Spinner ===")

    spinner = SimpleSpinner("Loading...")
    spinner.start()
    time.sleep(2)
    spinner.succeed("Done!")
    print()


def example_build_process():
    """Example 2: Build process"""
    print("=== Example 2: Build Process ===")

    spinner = SimpleSpinner("Building project...")
    spinner.start()

    time.sleep(1)
    spinner.text = "Compiling TypeScript..."

    time.sleep(1)
    spinner.text = "Bundling assets..."

    time.sleep(1)
    spinner.text = "Minifying output..."

    time.sleep(1)
    spinner.succeed("Build complete!")
    print()


def example_package_install():
    """Example 3: Package installation"""
    print("=== Example 3: Package Installation ===")

    packages = ['express', 'lodash', 'axios']
    spinner = SimpleSpinner()
    spinner.start()

    for i, pkg in enumerate(packages, 1):
        spinner.text = f"Installing {pkg} ({i}/{len(packages)})"
        time.sleep(1)

    spinner.succeed(f"Installed {len(packages)} packages!")
    print()


def example_database_operations():
    """Example 4: Database operations"""
    print("=== Example 4: Database Operations ===")

    operations = [
        ("Connecting to database...", "Connected!"),
        ("Running migrations...", "Migrations complete!"),
        ("Seeding data...", "Data seeded!")
    ]

    for start_text, end_text in operations:
        spinner = SimpleSpinner(start_text)
        spinner.start()
        time.sleep(1.5)
        spinner.succeed(end_text)

    print()


def example_error_handling():
    """Example 5: Error handling"""
    print("=== Example 5: Error Handling ===")

    spinner = SimpleSpinner("Attempting risky operation...")
    spinner.start()

    time.sleep(1.5)

    # Simulate error
    spinner.fail("Failed: Something went wrong")
    print()


def example_progress_indication():
    """Example 6: Progress indication"""
    print("=== Example 6: Progress Indication ===")

    total = 10
    spinner = SimpleSpinner()
    spinner.start()

    for i in range(1, total + 1):
        spinner.text = f"Processing item {i}/{total} ({i * 100 // total}%)"
        time.sleep(0.3)

    spinner.succeed("All items processed!")
    print()


def example_multiple_stages():
    """Example 7: Multiple stages"""
    print("=== Example 7: Multiple Stages ===")

    stages = [
        ("Preparing environment...", "success"),
        ("Installing dependencies...", "success"),
        ("Running tests...", "warn"),
        ("Building application...", "success"),
        ("Deploying to server...", "fail")
    ]

    for text, result in stages:
        spinner = SimpleSpinner(text)
        spinner.start()
        time.sleep(1)

        if result == "success":
            spinner.succeed(text[:-3] + " done!")
        elif result == "fail":
            spinner.fail(text[:-3] + " failed!")
        elif result == "warn":
            spinner.warn(text[:-3] + " completed with warnings")
        else:
            spinner.info(text)

    print()


def main():
    """Run all examples"""
    print("Ora-Inspired Python Spinner Examples")
    print("=" * 50)
    print()

    example_basic()
    example_build_process()
    example_package_install()
    example_database_operations()
    example_error_handling()
    example_progress_indication()
    example_multiple_stages()

    print("=" * 50)
    print("All examples completed!")
    print()
    print("Note: For actual ora usage in Python, you can:")
    print("1. Use Python spinner libraries (halo, yaspin, etc.)")
    print("2. Call ora CLI from Python subprocess")
    print("3. Use this simple implementation as inspiration")


if __name__ == '__main__':
    main()

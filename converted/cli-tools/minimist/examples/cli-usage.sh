#!/bin/bash
# Minimist CLI Usage Examples
# Demonstrates various argument parsing scenarios

echo "=== Minimist CLI Usage Examples ==="
echo ""

# Example 1: Basic flags
echo "1. Basic boolean flags:"
minimist --verbose --debug --quiet
echo ""

# Example 2: Short flags
echo "2. Short flags:"
minimist -v -d -q
echo ""

# Example 3: Combined short flags
echo "3. Combined short flags (-vdq = -v -d -q):"
minimist -vdq
echo ""

# Example 4: Key-value pairs
echo "4. Key-value pairs:"
minimist --name=Bob --age=25 --city=NYC
echo ""

# Example 5: Space-separated values
echo "5. Space-separated values:"
minimist --name Bob --age 25
echo ""

# Example 6: Mixed short and long flags
echo "6. Mixed short and long flags:"
minimist -v --name Bob -p 3000 --debug
echo ""

# Example 7: Negation
echo "7. Boolean negation (--no-color):"
minimist --no-color --no-verbose
echo ""

# Example 8: Arrays
echo "8. Array accumulation:"
minimist --tag=foo --tag=bar --tag=baz
echo ""

# Example 9: Positional arguments
echo "9. Positional arguments:"
minimist file1.txt file2.txt file3.txt
echo ""

# Example 10: Mixed flags and positional args
echo "10. Mixed flags and positional arguments:"
minimist --output dist file1.js file2.js
echo ""

# Example 11: Double dash separator
echo "11. Double dash separator (--) for bare arguments:"
minimist --name Bob -- these are bare args
echo ""

# Example 12: Numeric arguments
echo "12. Automatic number detection:"
minimist --port 3000 --timeout 5000 --ratio 0.75
echo ""

# Example 13: All together
echo "13. Complex example:"
minimist -v --name Bob --age 25 --tags=dev --tags=admin file1.txt file2.txt -- extra args
echo ""

echo "=== All examples completed ==="

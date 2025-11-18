#!/bin/bash
# Ora CLI Usage Examples

echo "=== Ora CLI Usage Examples ==="
echo ""

# Example 1: Basic spinner
echo "1. Basic spinner (3 seconds):"
ora --text "Loading..." --duration 3000 --success
echo ""

# Example 2: Different spinner types
echo "2. Different spinner types:"
ora --spinner dots2 --text "Using dots2 spinner..." --duration 2000 --success
ora --spinner line --text "Using line spinner..." --duration 2000 --success
ora --spinner star --text "Using star spinner..." --duration 2000 --success
echo ""

# Example 3: Different colors
echo "3. Different colors:"
ora --color green --text "Green spinner" --duration 2000 --success
ora --color yellow --text "Yellow spinner" --duration 2000 --warn
ora --color red --text "Red spinner" --duration 2000 --fail
echo ""

# Example 4: Different end states
echo "4. Different end states:"
ora --text "Success example" --duration 2000 --success
ora --text "Failure example" --duration 2000 --fail
ora --text "Warning example" --duration 2000 --warn
ora --text "Info example" --duration 2000 --info
echo ""

# Example 5: List all spinners
echo "5. List all available spinners:"
ora --list
echo ""

# Example 6: Demo mode
echo "6. Running spinner demo:"
echo "(This will show multiple spinner types)"
# ora --demo  # Commented out as it's long-running

echo "=== All examples completed ==="

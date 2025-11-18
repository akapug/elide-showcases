#!/bin/bash
# CLI Example - Autoprefixer for Elide
#
# This script demonstrates various ways to use the Autoprefixer CLI

# Create a sample CSS file
cat > input.css << 'EOF'
.container {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.box {
  transform: rotate(45deg);
  transition: all 0.3s ease;
  user-select: none;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}
EOF

echo "=== Autoprefixer CLI Examples ==="
echo ""

# Example 1: Basic usage
echo "Example 1: Basic usage (output to stdout)"
echo "Command: elide run ../cli.ts input.css"
elide run ../cli.ts input.css
echo ""

# Example 2: Output to file
echo "=== Example 2: Output to file ==="
echo "Command: elide run ../cli.ts input.css -o output.css"
elide run ../cli.ts input.css -o output.css
echo "Result:"
cat output.css
echo ""

# Example 3: Specify browsers
echo "=== Example 3: Target specific browsers ==="
echo "Command: elide run ../cli.ts input.css -b 'last 2 versions, > 1%'"
elide run ../cli.ts input.css -b "last 2 versions, > 1%"
echo ""

# Example 4: Show info
echo "=== Example 4: Show Autoprefixer information ==="
echo "Command: elide run ../cli.ts --info"
elide run ../cli.ts --info
echo ""

# Example 5: Help
echo "=== Example 5: Show help ==="
echo "Command: elide run ../cli.ts --help"
elide run ../cli.ts --help

# Cleanup
rm -f input.css output.css

echo ""
echo "=== Examples complete ==="

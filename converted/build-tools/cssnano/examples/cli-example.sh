#!/bin/bash
# CLI Example - cssnano for Elide
#
# This script demonstrates various ways to use the cssnano CLI

# Create sample CSS files
cat > input.css << 'EOF'
.container {
  display: flex;
  flex-direction: column;
  color: #ffffff;
  margin: 0px 0px 0px 0px;
}

.box {
  background-color: #ff0000;
  padding: 10px 10px 10px 10px;
}

/* Comment to remove */
.text {
  color: rgba(255, 255, 255, 1);
}
EOF

cat > style1.css << 'EOF'
.header { padding: 20px; color: #ffffff; margin: 0px; }
EOF

cat > style2.css << 'EOF'
.footer { margin: 10px; background: #000000; padding: 0px; }
EOF

echo "=== cssnano CLI Examples ==="
echo ""

# Example 1: List available presets
echo "Example 1: List available presets"
echo "Command: elide run ../cli.ts --list-presets"
elide run ../cli.ts --list-presets
echo ""

# Example 2: Basic minification (default preset)
echo "=== Example 2: Basic minification (default preset) ==="
echo "Command: elide run ../cli.ts input.css"
elide run ../cli.ts input.css
echo ""

# Example 3: Output to file with stats
echo "=== Example 3: Output to file with statistics ==="
echo "Command: elide run ../cli.ts input.css -o output.min.css -s"
elide run ../cli.ts input.css -o output.min.css -s
echo ""
echo "Output file content:"
cat output.min.css
echo ""
echo ""

# Example 4: Lite preset
echo "=== Example 4: Lite preset ==="
echo "Command: elide run ../cli.ts input.css -p lite -s"
elide run ../cli.ts input.css -p lite -s
echo ""

# Example 5: Advanced preset
echo "=== Example 5: Advanced preset ==="
echo "Command: elide run ../cli.ts input.css -p advanced -s"
elide run ../cli.ts input.css -p advanced -s
echo ""

# Example 6: Keep comments
echo "=== Example 6: Custom options (keep comments) ==="
echo "Command: elide run ../cli.ts input.css --no-discard-comments"
elide run ../cli.ts input.css --no-discard-comments
echo ""

# Example 7: Generate source map
echo "=== Example 7: Generate source map ==="
echo "Command: elide run ../cli.ts input.css -m -o output.map.min.css"
elide run ../cli.ts input.css -m -o output.map.min.css
echo "Files generated:"
ls -lh output.map.min.css*
echo ""

# Example 8: Batch processing
echo "=== Example 8: Batch processing ==="
echo "Command: elide run ../cli.ts --batch style1.css style2.css --batch-suffix .min -s"
elide run ../cli.ts --batch style1.css style2.css --batch-suffix .min -s
echo ""
echo "Generated files:"
ls -lh style*.min.css
echo ""

# Example 9: Help
echo "=== Example 9: Show help ==="
echo "Command: elide run ../cli.ts --help"
elide run ../cli.ts --help

# Cleanup
rm -f input.css output.*.css style*.css *.map

echo ""
echo "=== Examples complete ==="

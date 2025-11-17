#!/bin/bash
# CLI Example - clean-css for Elide
#
# This script demonstrates various ways to use the clean-css CLI

# Create sample CSS files
cat > input.css << 'EOF'
.container {
  display: flex;
  flex-direction: column;
  color: #ffffff;
  margin: 0px 0px 0px 0px;
  font-weight: bold;
}

.box {
  background-color: #ff0000;
  padding: 10px 10px 10px 10px;
}

.container {
  background: rgba(0, 0, 0, 0.5);
}
EOF

cat > style1.css << 'EOF'
.header { padding: 20px; color: #ffffff; }
EOF

cat > style2.css << 'EOF'
.footer { margin: 10px; background: #000000; }
EOF

echo "=== clean-css CLI Examples ==="
echo ""

# Example 1: Basic minification
echo "Example 1: Basic minification"
echo "Command: elide run ../cli.ts input.css"
elide run ../cli.ts input.css
echo ""

# Example 2: Output to file with stats
echo "=== Example 2: Output to file with statistics ==="
echo "Command: elide run ../cli.ts input.css -o output.min.css -s"
elide run ../cli.ts input.css -o output.min.css -s
echo ""
echo "Output file content:"
cat output.min.css
echo ""
echo ""

# Example 3: Level 2 optimization
echo "=== Example 3: Level 2 optimization ==="
echo "Command: elide run ../cli.ts input.css -O2 -s"
elide run ../cli.ts input.css -O2 -s
echo ""

# Example 4: Beautified output
echo "=== Example 4: Beautified output ==="
echo "Command: elide run ../cli.ts input.css -f beautify"
elide run ../cli.ts input.css -f beautify
echo ""

# Example 5: Generate source map
echo "=== Example 5: Generate source map ==="
echo "Command: elide run ../cli.ts input.css --source-map -o output.map.min.css"
elide run ../cli.ts input.css --source-map -o output.map.min.css
echo "Source map generated: output.map.min.css.map"
if [ -f output.map.min.css.map ]; then
  echo "Source map content:"
  cat output.map.min.css.map
  echo ""
fi
echo ""

# Example 6: Batch processing
echo "=== Example 6: Batch processing ==="
echo "Command: elide run ../cli.ts --batch style1.css style2.css --batch-suffix .min -s"
elide run ../cli.ts --batch style1.css style2.css --batch-suffix .min -s
echo ""
echo "Generated files:"
ls -lh style*.min.css
echo ""

# Example 7: Help
echo "=== Example 7: Show help ==="
echo "Command: elide run ../cli.ts --help"
elide run ../cli.ts --help

# Cleanup
rm -f input.css output.*.css style*.css *.map

echo ""
echo "=== Examples complete ==="
